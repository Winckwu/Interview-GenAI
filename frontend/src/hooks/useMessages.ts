/**
 * useMessages Hook
 *
 * Manages all message-related state and operations for chat sessions:
 * - Message loading and pagination
 * - Sending messages (user input → AI response)
 * - Message verification and modification
 * - Inline message editing
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 1 refactoring.
 */

import { useState, useCallback, useRef } from 'react';
import api, { apiService } from '../services/api';
import { useSessionStore } from '../stores/sessionStore';

// ============================================================
// TYPES
// ============================================================

/**
 * Message Branch - Alternative AI response at a specific message point
 * Enables conversation branching for exploring different AI model outputs
 */
export interface MessageBranch {
  id: string; // Unique branch ID
  content: string; // Branch AI response content
  source: 'mr6' | 'mr5' | 'manual'; // Where the branch came from
  model?: string; // Model used (for MR6 branches: 'gpt-4o', 'gpt-4o-mini', etc.)
  createdAt: string;
  wasVerified?: boolean;
  wasModified?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;

  // Conversation branching support
  branches?: MessageBranch[]; // Alternative responses for this message
  currentBranchIndex?: number; // Which branch is currently displayed (0 = original, 1+ = branches)

  // Web search support
  webSearchUsed?: boolean;
  searchResults?: {
    query: string;
    source: string;
    resultCount: number;
    results: Array<{ title: string; url: string }>;
  };
}

export interface UseMessagesOptions {
  sessionId: string;
  onSendSuccess?: (interaction: any) => void;
  onVerifySuccess?: () => void;
  onModifySuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UseMessagesReturn {
  // State
  messages: Message[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  updatingMessageId: string | null;
  editingMessageId: string | null;
  editedContent: string;

  // Streaming state
  isStreaming: boolean;
  streamingContent: string;
  stopStreaming: () => void;

  // Pagination
  currentPage: number;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  totalMessagesCount: number;

  // Message operations
  handleSendMessage: (userInput: string, conversationHistory?: Message[], useWebSearch?: boolean) => Promise<void>;
  markAsVerified: (messageId: string) => Promise<void>;
  markAsModified: (messageId: string) => void;
  startEditingMessage: (messageId: string, content: string) => void;
  saveEditedMessage: (messageId: string) => Promise<void>;
  cancelEditingMessage: () => void;
  loadMessagesPage: (page: number) => Promise<void>;
  loadMoreMessages: () => Promise<void>;

  // Setters (for external state updates)
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setEditedContent: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setHasMoreMessages: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalMessagesCount: React.Dispatch<React.SetStateAction<number>>;
}

// ============================================================
// UTILITIES
// ============================================================

export const MESSAGES_PER_PAGE = 20;

/**
 * Batch update interactions to reduce API calls
 */
const batchUpdateInteractions = async (
  updates: Array<{ id: string; wasVerified?: boolean; wasModified?: boolean; wasRejected?: boolean }>
): Promise<any> => {
  try {
    return await api.patch('/interactions/batch', { updates });
  } catch (err) {
    // Fallback to individual updates if batch endpoint fails
    console.warn('Batch update failed, falling back to individual updates:', err);
    const results = await Promise.all(
      updates.map(update => api.patch(`/interactions/${update.id}`, update))
    );
    return { data: { data: results.map(r => r.data) } };
  }
};

// ============================================================
// HOOK
// ============================================================

export function useMessages(options: UseMessagesOptions): UseMessagesReturn {
  const { sessionId, onSendSuccess, onVerifySuccess, onModifySuccess, onError } = options;
  const { addInteraction } = useSessionStore();

  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<(() => void) | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);

  /**
   * Load messages for a specific page with pagination
   */
  const loadMessagesPage = useCallback(async (page: number) => {
    const isInitialLoad = page === 1;
    try {
      if (!isInitialLoad) {
        setIsLoadingMore(true);
      }

      // Load with pagination parameters (convert page to offset)
      const offset = (page - 1) * MESSAGES_PER_PAGE;
      const interactionsResponse = await api.get('/interactions', {
        params: {
          sessionId,
          limit: MESSAGES_PER_PAGE,
          offset: offset,
        },
      });

      const responseData = interactionsResponse.data.data;
      const interactions = responseData.interactions || [];
      const total = responseData.total || 0;

      if (interactions && interactions.length > 0) {
        // Remove duplicate interactions by ID and filter valid interactions
        const uniqueInteractions = Array.from(
          new Map(
            interactions
              .filter((interaction: any) =>
                interaction.id &&
                interaction.userPrompt &&
                interaction.aiResponse &&
                interaction.sessionId === sessionId
              )
              .map((interaction: any) => [interaction.id, interaction])
          ).values()
        );

        // Convert interactions to messages
        const pageMessages: Message[] = [];
        for (const interaction of uniqueInteractions) {
          // Add user message
          pageMessages.push({
            id: `user-${interaction.id}`,
            role: 'user',
            content: interaction.userPrompt,
            timestamp: interaction.createdAt,
          });

          // Add AI message with branches
          pageMessages.push({
            id: interaction.id,
            role: 'ai',
            content: interaction.aiResponse,
            timestamp: interaction.createdAt,
            wasVerified: interaction.wasVerified,
            wasModified: interaction.wasModified,
            wasRejected: interaction.wasRejected,
            branches: interaction.branches?.map((branch: any) => ({
              id: branch.id,
              content: branch.content,
              source: branch.source,
              model: branch.model,
              createdAt: branch.createdAt,
              wasVerified: branch.wasVerified,
              wasModified: branch.wasModified,
            })) || [],
            currentBranchIndex: 0, // Always start with original
          });
        }

        // Sort messages by timestamp in ascending order (oldest first)
        // Backend returns DESC order, but chat UI needs chronological order
        pageMessages.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // For initial load, replace messages. For loading more, prepend older messages
        if (isInitialLoad) {
          setMessages(pageMessages);
        } else {
          // When loading more (older) messages, prepend them to maintain chronological order
          setMessages((prev) => [...pageMessages, ...prev]);
        }

        // Update pagination state
        setCurrentPage(page);
        setTotalMessagesCount(total);
        setHasMoreMessages(page * MESSAGES_PER_PAGE < total);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err: any) {
      console.error('Failed to load messages page:', err);
      if (isInitialLoad) {
        const errorMsg = err.response?.data?.error || 'Failed to load messages';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } finally {
      if (!isInitialLoad) {
        setIsLoadingMore(false);
      }
    }
  }, [sessionId, onError]);

  /**
   * Load more messages (next page)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    await loadMessagesPage(currentPage + 1);
  }, [hasMoreMessages, isLoadingMore, currentPage, loadMessagesPage]);

  /**
   * Stop streaming response
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  /**
   * Send user message and get AI response with streaming
   * @param userInput - The user's message
   * @param conversationHistory - Optional conversation history to use instead of current messages
   * @param useWebSearch - Whether to enable web search for this message
   */
  const handleSendMessage = useCallback(async (userInput: string, conversationHistory?: Message[], useWebSearch?: boolean) => {
    if (!userInput.trim() || !sessionId) return;

    setLoading(true);
    setError(null);
    setStreamingContent('');

    // Create temporary message ID for streaming
    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${tempId}`,
      role: 'user',
      content: userInput,
      timestamp,
    };

    // Add placeholder AI message for streaming
    const placeholderAiMessage: Message = {
      id: tempId,
      role: 'ai',
      content: '',
      timestamp,
      wasVerified: false,
      wasModified: false,
      wasRejected: false,
    };

    setMessages((prev) => [...prev, userMessage, placeholderAiMessage]);

    try {
      // Use provided conversation history or current messages
      const history = conversationHistory || messages;
      const startTime = Date.now();

      // Start streaming
      setIsStreaming(true);
      const { stream, abort } = await apiService.ai.chatStream(
        userInput,
        history.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        { useWebSearch: useWebSearch || false }
      );

      abortControllerRef.current = abort;

      // Read stream
      const decoder = new TextDecoder();
      let fullContent = '';
      let webSearchUsed = false;
      let searchResults = null;

      const processStream = async () => {
        while (true) {
          const { done, value } = await stream.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'chunk') {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                  // Update message in real-time
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempId ? { ...msg, content: fullContent } : msg
                    )
                  );
                } else if (data.type === 'search') {
                  webSearchUsed = true;
                  searchResults = data.searchResults;
                } else if (data.type === 'done') {
                  // Streaming complete
                  setIsStreaming(false);
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseErr) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      };

      await processStream();

      const responseTime = Date.now() - startTime;

      // Log interaction to backend
      const interactionResponse = await api.post('/interactions', {
        sessionId,
        userPrompt: userInput,
        aiResponse: fullContent,
        aiModel: 'gpt-4o-mini',
        responseTime,
        wasVerified: false,
        wasModified: false,
        wasRejected: false,
        confidenceScore: 0.85,
      });

      const interaction = interactionResponse.data.data.interaction;

      // Update global session store
      try {
        await addInteraction(sessionId, {
          id: interaction.id,
          sessionId,
          userPrompt: userInput,
          aiResponse: fullContent,
          aiModel: 'gpt-4o-mini',
          responseTime,
          wasVerified: false,
          wasModified: false,
          wasRejected: false,
          confidenceScore: 0.85,
          createdAt: interaction.createdAt,
        });
      } catch (storeErr) {
        console.error('Failed to update global store:', storeErr);
      }

      // Update messages with real IDs
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === `user-${tempId}`) {
            return { ...msg, id: `user-${interaction.id}`, timestamp: interaction.createdAt };
          }
          if (msg.id === tempId) {
            return {
              ...msg,
              id: interaction.id,
              content: fullContent,
              timestamp: interaction.createdAt,
              webSearchUsed,
              searchResults,
            };
          }
          return msg;
        })
      );

      setStreamingContent('');
      abortControllerRef.current = null;

      // Callback for success
      onSendSuccess?.(interaction);
    } catch (err: any) {
      console.error('Send message error:', err);

      // Remove placeholder messages on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId && msg.id !== `user-${tempId}`));

      const errorMsg = err.message || 'Failed to send message';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsStreaming(false);
      setStreamingContent('');
    } finally {
      setLoading(false);
    }
  }, [sessionId, messages, addInteraction, onSendSuccess, onError]);

  /**
   * Mark interaction as verified
   */
  const markAsVerified = useCallback(async (messageId: string) => {
    setUpdatingMessageId(messageId);
    try {
      const response = await batchUpdateInteractions([
        { id: messageId, wasVerified: true, wasModified: false, wasRejected: false }
      ]);

      // Extract the updated interaction from batch response
      const updatedInteraction = response.data.data[0]?.data?.interaction ||
                                  response.data.data[0];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                wasVerified: updatedInteraction?.wasVerified ?? true,
                wasModified: updatedInteraction?.wasModified ?? false,
                wasRejected: updatedInteraction?.wasRejected ?? false,
              }
            : msg
        )
      );

      setSuccessMessage('✓ Response marked as verified!');
      setTimeout(() => setSuccessMessage(null), 2000);

      onVerifySuccess?.();
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to mark as verified';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUpdatingMessageId(null);
    }
  }, [onVerifySuccess, onError]);

  /**
   * Start editing mode for a message
   */
  const startEditingMessage = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  }, []);

  /**
   * Cancel editing mode
   */
  const cancelEditingMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditedContent('');
  }, []);

  /**
   * Save edited content and mark as modified
   */
  const saveEditedMessage = useCallback(async (messageId: string) => {
    setUpdatingMessageId(messageId);
    try {
      // Get original content
      const originalContent = messages.find(m => m.id === messageId)?.content || '';

      // Only proceed if content was actually changed
      if (editedContent === originalContent) {
        cancelEditingMessage();
        setUpdatingMessageId(null);
        return;
      }

      // Update message content locally first
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: editedContent,
                wasModified: true,
                wasVerified: false,
                wasRejected: false,
              }
            : msg
        )
      );

      // Mark as modified in backend
      await batchUpdateInteractions([
        { id: messageId, wasModified: true, wasVerified: false, wasRejected: false }
      ]);

      setSuccessMessage('✓ Modification saved!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Exit editing mode
      cancelEditingMessage();

      onModifySuccess?.();
    } catch (err: any) {
      console.error('Save edit error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to save modification';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUpdatingMessageId(null);
    }
  }, [editedContent, messages, cancelEditingMessage, onModifySuccess, onError]);

  /**
   * Mark interaction as modified (starts editing mode)
   */
  const markAsModified = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      startEditingMessage(messageId, message.content);
    }
  }, [messages, startEditingMessage]);

  return {
    // State
    messages,
    loading,
    error,
    successMessage,
    updatingMessageId,
    editingMessageId,
    editedContent,

    // Streaming state
    isStreaming,
    streamingContent,
    stopStreaming,

    // Pagination
    currentPage,
    hasMoreMessages,
    isLoadingMore,
    totalMessagesCount,

    // Operations
    handleSendMessage,
    markAsVerified,
    markAsModified,
    startEditingMessage,
    saveEditedMessage,
    cancelEditingMessage,
    loadMessagesPage,
    loadMoreMessages,

    // Setters
    setMessages,
    setError,
    setSuccessMessage,
    setEditedContent,
    setCurrentPage,
    setHasMoreMessages,
    setIsLoadingMore,
    setTotalMessagesCount,
  };
}

export default useMessages;
