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

// Debounce helper for preventing rapid function calls
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
};

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

  // Conversation tree support (true forking)
  parentId?: string | null;  // Reference to parent message for tree structure
  branchPath?: string;       // Which conversation path this message belongs to (e.g., 'main', 'branch-1')

  // Conversation branching support (alternative responses at same point)
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

  // AI reasoning (chain of thought)
  reasoning?: string;

  // MR2: AI Response Insights (stored in database)
  insights?: {
    keyPoints?: string[];
    aiApproach?: string;
    assumptions?: string[];
    missingAspects?: string[];
    suggestedFollowups?: string[];
  };
}

export interface UseMessagesOptions {
  sessionId: string;
  systemPrompt?: string;  // MR4: Role-based system prompt to constrain AI behavior
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

  // Conversation tree state
  currentBranchPath: string;
  availableBranchPaths: string[];
  editForkMessageIndex: number | null;
  isSwitchingBranch: boolean;

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
  editUserMessageAndRegenerate: (userMessageId: string, newContent: string) => Promise<void>;

  // Conversation tree operations
  switchBranchPath: (branchPath: string) => Promise<void>;
  forkConversation: (sourceMessageId: string, newBranchName: string) => Promise<string>;

  // Setters (for external state updates)
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setEditedContent: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setHasMoreMessages: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalMessagesCount: React.Dispatch<React.SetStateAction<number>>;
  setCurrentBranchPath: React.Dispatch<React.SetStateAction<string>>;
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
  const { sessionId, systemPrompt, onSendSuccess, onVerifySuccess, onModifySuccess, onError } = options;
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

  // Conversation tree state
  const [currentBranchPath, setCurrentBranchPath] = useState<string>('main');
  const [availableBranchPaths, setAvailableBranchPaths] = useState<string[]>(['main']);
  const [editForkMessageIndex, setEditForkMessageIndex] = useState<number | null>(null); // Index of message where edit fork happened
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);
  const switchingBranchRef = useRef<string | null>(null); // Guard against concurrent switches

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
        // DEBUG: Log insights from API response
        console.log('[useMessages] Interactions loaded, checking insights:',
          interactions.map((i: any) => ({ id: i.id?.substring(0, 8), hasInsights: !!i.insights }))
        );

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

          // Add AI message with branches and insights
          pageMessages.push({
            id: interaction.id,
            role: 'ai',
            content: interaction.aiResponse,
            timestamp: interaction.createdAt,
            wasVerified: interaction.wasVerified,
            wasModified: interaction.wasModified,
            wasRejected: interaction.wasRejected,
            reasoning: interaction.reasoning, // AI chain-of-thought reasoning
            insights: interaction.insights, // MR2: Stored insights from database
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
  const handleSendMessage = useCallback(async (userInput: string, conversationHistory?: Message[], useWebSearch?: boolean, overrideBranchPath?: string) => {
    if (!userInput.trim() || !sessionId) return;

    // Use override branch path if provided (for fork-edit operations)
    const effectiveBranchPath = overrideBranchPath || currentBranchPath;

    setLoading(true);
    setError(null);
    setStreamingContent('');

    // Create temporary message ID for streaming
    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Add user message immediately with branch context
    const userMessage: Message = {
      id: `user-${tempId}`,
      role: 'user',
      content: userInput,
      timestamp,
      branchPath: effectiveBranchPath,
    };

    // Add placeholder AI message for streaming with branch context
    const placeholderAiMessage: Message = {
      id: tempId,
      role: 'ai',
      content: '',
      timestamp,
      wasVerified: false,
      wasModified: false,
      wasRejected: false,
      branchPath: effectiveBranchPath,
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
        {
          useWebSearch: useWebSearch || false,
          systemPrompt: systemPrompt || undefined,  // MR4: Role constraint
        }
      );

      abortControllerRef.current = abort;

      // Read stream
      const decoder = new TextDecoder();
      let fullContent = '';
      let webSearchUsed = false;
      let searchResults = null;
      let reasoning: string | null = null;
      let cleanContent = '';

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
                  // Remove thinking tags for display during streaming
                  const displayContent = fullContent.replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '').trim();
                  setStreamingContent(displayContent);
                  // Update message in real-time
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempId ? { ...msg, content: displayContent } : msg
                    )
                  );
                } else if (data.type === 'search') {
                  webSearchUsed = true;
                  searchResults = data.searchResults;
                } else if (data.type === 'done') {
                  // Streaming complete - extract reasoning
                  setIsStreaming(false);
                  reasoning = data.reasoning || null;
                  cleanContent = data.cleanContent || fullContent;
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

      // Use cleanContent for storage and display (without thinking tags)
      const finalContent = cleanContent || fullContent.replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, '').trim();

      // Find the last AI message to use as parent for tree structure
      const lastAiMessage = [...messages].reverse().find(m => m.role === 'ai' && !m.id.startsWith('temp-'));
      const parentId = lastAiMessage?.id || null;

      // Log interaction to backend (with reasoning and tree context)
      const interactionResponse = await api.post('/interactions', {
        sessionId,
        userPrompt: userInput,
        aiResponse: finalContent,
        aiModel: 'gpt-4o-mini',
        responseTime,
        wasVerified: false,
        wasModified: false,
        wasRejected: false,
        confidenceScore: 0.85,
        reasoning: reasoning || undefined,
        parentId: parentId,
        branchPath: effectiveBranchPath,
      });

      const interaction = interactionResponse.data.data.interaction;

      // Update global session store
      try {
        await addInteraction(sessionId, {
          id: interaction.id,
          sessionId,
          userPrompt: userInput,
          aiResponse: finalContent,
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

      // Update messages with real IDs, reasoning, and tree context
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === `user-${tempId}`) {
            return {
              ...msg,
              id: `user-${interaction.id}`,
              timestamp: interaction.createdAt,
              parentId: parentId,
              branchPath: effectiveBranchPath,
            };
          }
          if (msg.id === tempId) {
            return {
              ...msg,
              id: interaction.id,
              content: finalContent,
              timestamp: interaction.createdAt,
              webSearchUsed,
              searchResults,
              reasoning: reasoning || undefined,
              parentId: parentId,
              branchPath: effectiveBranchPath,
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
      // Check if this is an abort (user clicked stop button)
      const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');

      if (isAbort) {
        // User stopped the streaming - remove the user message and AI placeholder
        console.log('[useMessages] Streaming aborted by user');
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId && msg.id !== `user-${tempId}`));
        setIsStreaming(false);
        setStreamingContent('');
        // Don't show error for user-initiated abort
      } else {
        console.error('Send message error:', err);

        // Remove placeholder messages on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId && msg.id !== `user-${tempId}`));

        const errorMsg = err.message || 'Failed to send message';
        setError(errorMsg);
        onError?.(errorMsg);
        setIsStreaming(false);
        setStreamingContent('');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, messages, systemPrompt, currentBranchPath, addInteraction, onSendSuccess, onError]);

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

  /**
   * Switch to a different conversation branch path
   * Reloads messages for the selected path
   * Protected against rapid clicks with ref guard
   */
  const switchBranchPath = useCallback(async (branchPath: string) => {
    // Guard: skip if no session, same path, or already switching to this path
    if (!sessionId || branchPath === currentBranchPath) return;
    if (switchingBranchRef.current === branchPath) return;

    // Mark as switching (ref for synchronous guard, state for UI)
    switchingBranchRef.current = branchPath;
    setIsSwitchingBranch(true);

    try {
      setLoading(true);
      setCurrentBranchPath(branchPath);

      // Load messages for the new branch path using tree endpoint
      const response = await api.get(`/interactions/tree/${sessionId}`, {
        params: { branchPath }
      });

      const { interactions, availableBranchPaths: paths } = response.data.data;

      // Transform interactions to messages
      const loadedMessages: Message[] = [];
      for (const interaction of interactions) {
        // Add user message
        loadedMessages.push({
          id: `user-${interaction.id}`,
          role: 'user',
          content: interaction.userPrompt,
          timestamp: interaction.createdAt,
          parentId: interaction.parentId,
          branchPath: interaction.branchPath,
        });

        // Add AI message
        loadedMessages.push({
          id: interaction.id,
          role: 'ai',
          content: interaction.aiResponse,
          timestamp: interaction.createdAt,
          wasVerified: interaction.wasVerified,
          wasModified: interaction.wasModified,
          wasRejected: interaction.wasRejected,
          branches: interaction.branches,
          parentId: interaction.parentId,
          branchPath: interaction.branchPath,
        });
      }

      setMessages(loadedMessages);
      // Ensure we always have at least 'main' in the branch paths
      const branchPaths = paths && paths.length > 0 ? paths : ['main'];
      setAvailableBranchPaths(branchPaths);

      // Calculate editForkMessageIndex for edit branches
      // Find the first user message that's on the current edit branch (fork point)
      if (branchPath.startsWith('edit-')) {
        const forkIndex = loadedMessages.findIndex(
          (msg, idx) => msg.role === 'user' && msg.branchPath === branchPath
        );
        if (forkIndex >= 0) {
          setEditForkMessageIndex(forkIndex);
        }
      } else if (branchPath === 'main') {
        // On main branch, find if there's a fork point (last user message before any edit branches exist)
        // This is for when multiple edit branches exist and we're on main
        if (paths && paths.length > 1) {
          // Find the last user message on main (this is where edit branches would fork from)
          const lastMainUserIndex = loadedMessages.reduce((lastIdx, msg, idx) => {
            if (msg.role === 'user' && (!msg.branchPath || msg.branchPath === 'main')) {
              return idx;
            }
            return lastIdx;
          }, -1);
          if (lastMainUserIndex >= 0) {
            setEditForkMessageIndex(lastMainUserIndex);
          }
        } else {
          setEditForkMessageIndex(null);
        }
      }

      setSuccessMessage(`Switched to branch: ${branchPath}`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      console.error('Failed to switch branch:', err);
      setError('Failed to switch conversation branch');
    } finally {
      setLoading(false);
      setIsSwitchingBranch(false);
      switchingBranchRef.current = null;
    }
  }, [sessionId, currentBranchPath]);

  /**
   * Edit user message and regenerate AI response (Fork-based branching)
   * Creates a new conversation branch from the edited message
   * Preserves original conversation - user can switch back to it
   */
  const editUserMessageAndRegenerate = useCallback(async (userMessageId: string, newContent: string) => {
    if (!newContent.trim() || !sessionId) return;

    // Find the user message index
    const userMessageIndex = messages.findIndex(m => m.id === userMessageId);
    if (userMessageIndex === -1) {
      setError('Message not found');
      return;
    }

    // Calculate interaction index (each interaction = user + AI message pair)
    // userMessageIndex / 2 gives us the interaction index (assuming alternating user/AI messages)
    const interactionIndex = Math.floor(userMessageIndex / 2);

    // Generate new branch name
    const newBranchPath = `edit-${Date.now()}`;

    try {
      setLoading(true);

      // Fork conversation history to new branch (copy all interactions before this one)
      await api.post('/interactions/fork-for-edit', {
        sessionId,
        beforeMessageIndex: interactionIndex,
        newBranchPath,
        originalBranchPath: currentBranchPath,
      });

      // Exit editing mode
      cancelEditingMessage();

      // Update current branch path
      setCurrentBranchPath(newBranchPath);

      // Add new branch to available paths
      setAvailableBranchPaths(prev => [...prev, newBranchPath]);

      // Track the message index where edit fork happened
      setEditForkMessageIndex(userMessageIndex);

      // Get conversation history up to (but not including) this user message for context
      const conversationHistory = messages.slice(0, userMessageIndex);

      // Update messages to show only the copied history (will be updated by handleSendMessage)
      setMessages(conversationHistory);

      // Send the edited message as a new message on the new branch
      // This will create new user message + AI response
      await handleSendMessage(newContent, conversationHistory, false, newBranchPath);

      setSuccessMessage(`Message edited on new branch - original preserved. Use branch switcher to go back.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to fork for edit:', err);
      setError('Failed to create edit branch');
      // Reload original messages on error
      await switchBranchPath(currentBranchPath);
    } finally {
      setLoading(false);
    }
  }, [sessionId, messages, currentBranchPath, handleSendMessage, cancelEditingMessage, switchBranchPath]);

  /**
   * Fork conversation from a specific message to create a new branch
   * Returns the new branch path name
   */
  const forkConversation = useCallback(async (sourceMessageId: string, newBranchName: string): Promise<string> => {
    if (!sessionId) {
      throw new Error('No session ID');
    }

    try {
      // Create new branch path name
      const newBranchPath = `branch-${newBranchName}-${Date.now()}`;

      // Call fork API
      const response = await api.post('/interactions/fork', {
        sourceInteractionId: sourceMessageId,
        newBranchPath,
      });

      // Update available branch paths
      setAvailableBranchPaths(prev => [...prev, newBranchPath]);

      // Switch to the new branch
      await switchBranchPath(newBranchPath);

      setSuccessMessage(`Created new branch: ${newBranchName}`);
      setTimeout(() => setSuccessMessage(null), 3000);

      return newBranchPath;
    } catch (err: any) {
      console.error('Failed to fork conversation:', err);
      setError('Failed to create conversation branch');
      throw err;
    }
  }, [sessionId, switchBranchPath]);

  /**
   * Load available branch paths for the current session
   * Call this after initial message load to get branch info
   */
  const loadBranchPaths = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await api.get(`/interactions/tree/${sessionId}`, {
        params: { branchPath: currentBranchPath }
      });

      const { interactions, availableBranchPaths: paths } = response.data.data;

      if (paths && paths.length > 1) {
        setAvailableBranchPaths(paths);

        // Calculate editForkMessageIndex based on current branch
        if (currentBranchPath.startsWith('edit-')) {
          // On edit branch: find the first user message on this branch
          const forkIndex = messages.findIndex(
            (msg) => msg.role === 'user' && msg.branchPath === currentBranchPath
          );
          if (forkIndex >= 0) {
            setEditForkMessageIndex(forkIndex);
          }
        } else if (currentBranchPath === 'main') {
          // On main branch with edit branches: find the last user message on main
          const lastMainUserIndex = messages.reduce((lastIdx, msg, idx) => {
            if (msg.role === 'user' && (!msg.branchPath || msg.branchPath === 'main')) {
              return idx;
            }
            return lastIdx;
          }, -1);
          if (lastMainUserIndex >= 0) {
            setEditForkMessageIndex(lastMainUserIndex);
          }
        }
      }
    } catch (err) {
      console.log('[loadBranchPaths] No branch paths found or error:', err);
      // Not an error - session may not have branches yet
    }
  }, [sessionId, currentBranchPath, messages]);

  return {
    // State
    messages,
    loading,
    error,
    successMessage,
    updatingMessageId,
    editingMessageId,
    editedContent,

    // Conversation tree state
    currentBranchPath,
    availableBranchPaths,
    editForkMessageIndex,
    isSwitchingBranch,

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
    editUserMessageAndRegenerate,

    // Conversation tree operations
    switchBranchPath,
    forkConversation,
    loadBranchPaths,

    // Setters
    setMessages,
    setError,
    setSuccessMessage,
    setEditedContent,
    setCurrentPage,
    setHasMoreMessages,
    setIsLoadingMore,
    setTotalMessagesCount,
    setCurrentBranchPath,
  };
}

export default useMessages;
