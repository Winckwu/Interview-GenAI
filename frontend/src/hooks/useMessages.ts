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

import { useState, useCallback, useRef, useEffect } from 'react';
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

  // GPT/Claude style sibling versioning
  siblingIds?: string[];     // IDs of all sibling messages (same parent)
  siblingIndex?: number;     // This message's index among siblings (0-based)

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
  // GPT/Claude style: map of messageIndex -> branches that fork from that position
  messageForkMap: Map<number, string[]>;

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
 * Create AI message from interaction data
 * Ensures consistent branch loading across all message loading functions
 */
const createAIMessageFromInteraction = (interaction: any): Message => ({
  id: interaction.id,
  role: 'ai',
  content: interaction.aiResponse,
  timestamp: interaction.createdAt,
  wasVerified: interaction.wasVerified,
  wasModified: interaction.wasModified,
  wasRejected: interaction.wasRejected,
  reasoning: interaction.reasoning,
  insights: interaction.insights,
  parentId: interaction.parentId,
  branchPath: interaction.branchPath,
  siblingIds: interaction.siblingIds,
  siblingIndex: interaction.siblingIndex,
  // Load branches with proper mapping
  branches: interaction.branches?.map((branch: any) => ({
    id: branch.id,
    content: branch.content,
    source: branch.source,
    model: branch.model,
    createdAt: branch.createdAt,
    wasVerified: branch.wasVerified,
    wasModified: branch.wasModified,
  })) || [],
  // Calculate currentBranchIndex from selectedBranchId
  currentBranchIndex: (() => {
    if (!interaction.selectedBranchId || !interaction.branches?.length) {
      return 0; // Original response
    }
    const branchIndex = interaction.branches.findIndex(
      (b: any) => b.id === interaction.selectedBranchId
    );
    return branchIndex >= 0 ? branchIndex + 1 : 0;
  })(),
});

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
  // GPT/Claude style: map of messageIndex -> branches that fork from that position
  const [messageForkMap, setMessageForkMap] = useState<Map<number, string[]>>(new Map());

  /**
   * Parse branch name to extract fork position
   * Format: edit-{messageIndex}-{timestamp} or edit-{timestamp} (legacy)
   */
  const parseBranchForkPosition = (branchPath: string): number | null => {
    if (!branchPath.startsWith('edit-')) return null;
    const parts = branchPath.split('-');
    // New format: edit-{messageIndex}-{timestamp}
    if (parts.length === 3) {
      const index = parseInt(parts[1], 10);
      return isNaN(index) ? null : index;
    }
    // Legacy format: edit-{timestamp} - return null (unknown position)
    return null;
  };

  /**
   * Build fork map from branch paths
   * Groups branches by their fork position (message index)
   */
  const buildMessageForkMap = useCallback((branches: string[]): Map<number, string[]> => {
    const forkMap = new Map<number, string[]>();

    // Always include 'main' at position 0 if there are any edit branches
    const hasEditBranches = branches.some(b => b.startsWith('edit-'));

    for (const branch of branches) {
      const forkPos = parseBranchForkPosition(branch);
      if (forkPos !== null) {
        const existing = forkMap.get(forkPos) || ['main']; // Include main as first option
        if (!existing.includes(branch)) {
          existing.push(branch);
        }
        forkMap.set(forkPos, existing);
      } else if (branch.startsWith('edit-') && hasEditBranches) {
        // Legacy branch without position - group at position 0
        const existing = forkMap.get(0) || ['main'];
        if (!existing.includes(branch)) {
          existing.push(branch);
        }
        forkMap.set(0, existing);
      }
    }

    return forkMap;
  }, []);

  /**
   * Reset branch-related state when session changes
   * This prevents stale branch data from showing in new conversations
   */
  useEffect(() => {
    // Reset all branch state to defaults when sessionId changes
    setCurrentBranchPath('main');
    setAvailableBranchPaths(['main']);
    setEditForkMessageIndex(null);
    setMessageForkMap(new Map());
    setIsSwitchingBranch(false);
    switchingBranchRef.current = null;
  }, [sessionId]);

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
          pageMessages.push(createAIMessageFromInteraction(interaction));
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
   * Switch to a different conversation sibling or branch path
   * Supports both:
   * 1. Message ID navigation (GPT/Claude style sibling switching)
   * 2. Legacy branch paths (for backwards compatibility)
   * Protected against rapid clicks with ref guard
   */
  const switchBranchPath = useCallback(async (branchPathOrMessageId: string) => {
    // Guard: skip if no session, same path, or already switching
    if (!sessionId || branchPathOrMessageId === currentBranchPath) return;
    if (switchingBranchRef.current === branchPathOrMessageId) return;

    // Mark as switching (ref for synchronous guard, state for UI)
    switchingBranchRef.current = branchPathOrMessageId;
    setIsSwitchingBranch(true);

    try {
      setLoading(true);

      // Determine if this is a message ID (UUID format) or branch path
      const isMessageId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchPathOrMessageId);

      let response;
      try {
        if (isMessageId) {
          // GPT/Claude style: Pass the selected message ID as part of the path
          response = await api.get(`/interactions/tree-v2/${sessionId}`, {
            params: { selectedPath: JSON.stringify([branchPathOrMessageId]) }
          });
        } else {
          // Legacy: Use tree-v2 but let it auto-select the path
          response = await api.get(`/interactions/tree-v2/${sessionId}`);
        }
      } catch {
        // Fallback to legacy API
        response = await api.get(`/interactions/tree/${sessionId}`, {
          params: { branchPath: branchPathOrMessageId }
        });
      }

      const responseData = response.data.data;

      // Check if this is tree-v2 response (has 'conversation') or legacy (has 'interactions')
      if (responseData.conversation) {
        // Tree-v2 response format
        const { conversation, allMessages, availableBranchPaths: paths } = responseData;

        // Transform conversation to messages with sibling info
        const loadedMessages: Message[] = [];
        for (const interaction of conversation) {
          // Add user message with sibling info
          loadedMessages.push({
            id: `user-${interaction.id}`,
            role: 'user',
            content: interaction.userPrompt,
            timestamp: interaction.createdAt,
            parentId: interaction.parentId,
            branchPath: interaction.branchPath,
            siblingIds: interaction.siblingIds,
            siblingIndex: interaction.siblingIndex,
          });

          // Add AI message with sibling info and branches
          if (interaction.aiResponse) {
            loadedMessages.push(createAIMessageFromInteraction(interaction));
          }
        }

        setMessages(loadedMessages);
        setCurrentBranchPath(isMessageId ? branchPathOrMessageId : 'main');

        // Set available branch paths for compatibility
        const branchPaths = paths && paths.length > 0 ? paths : ['main'];
        setAvailableBranchPaths(branchPaths);

        // Clear legacy fork map - we now use siblingIds directly from messages
        setMessageForkMap(new Map());
        setEditForkMessageIndex(null);
      } else {
        // Legacy response format
        const { interactions, availableBranchPaths: paths } = responseData;

        // Transform interactions to messages
        const loadedMessages: Message[] = [];
        for (const interaction of interactions) {
          loadedMessages.push({
            id: `user-${interaction.id}`,
            role: 'user',
            content: interaction.userPrompt,
            timestamp: interaction.createdAt,
            parentId: interaction.parentId,
            branchPath: interaction.branchPath,
          });

          loadedMessages.push(createAIMessageFromInteraction(interaction));
        }

        setMessages(loadedMessages);
        setCurrentBranchPath(branchPathOrMessageId);

        const branchPaths = paths && paths.length > 0 ? paths : ['main'];
        setAvailableBranchPaths(branchPaths);

        // Legacy: Build fork map for old-style navigation
        const forkMap = buildMessageForkMap(branchPaths);
        setMessageForkMap(forkMap);

        const hasEditBranches = paths && paths.some((p: string) => p.startsWith('edit-'));
        if (hasEditBranches) {
          const firstForkPos = forkMap.size > 0 ? Math.min(...forkMap.keys()) : null;
          setEditForkMessageIndex(firstForkPos);
        } else {
          setEditForkMessageIndex(null);
        }
      }

      setSuccessMessage(`Switched conversation version`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      console.error('Failed to switch branch:', err);
      setError('Failed to switch conversation version');
    } finally {
      setLoading(false);
      setIsSwitchingBranch(false);
      switchingBranchRef.current = null;
    }
  }, [sessionId, currentBranchPath, buildMessageForkMap]);

  /**
   * Edit user message and regenerate AI response (True sibling-based editing)
   * Creates a sibling message at the same position instead of copying history
   * This is the GPT/Claude style - shared history, independent versions
   */
  const editUserMessageAndRegenerate = useCallback(async (userMessageId: string, newContent: string) => {
    if (!newContent.trim() || !sessionId) return;

    // Find the user message
    const userMessageIndex = messages.findIndex(m => m.id === userMessageId);
    if (userMessageIndex === -1) {
      setError('Message not found');
      return;
    }

    const userMessage = messages[userMessageIndex];

    // Extract the original interaction ID from user message ID (format: user-{interactionId})
    const originalInteractionId = userMessageId.replace('user-', '');

    try {
      setLoading(true);

      // Exit editing mode first
      cancelEditingMessage();

      // Use the new edit-message API to create a sibling
      const response = await api.post('/interactions/edit-message', {
        originalMessageId: originalInteractionId,
        newUserPrompt: newContent,
        sessionId,
      });

      const newInteraction = response.data.data.interaction;

      // Get conversation history up to (but not including) this user message for context
      const conversationHistory = messages.slice(0, userMessageIndex);

      // Update messages to show history + edited message (without AI response yet)
      const editedUserMessage: Message = {
        id: `user-${newInteraction.id}`,
        role: 'user',
        content: newContent,
        timestamp: newInteraction.createdAt,
        parentId: newInteraction.parentId,
        branchPath: newInteraction.branchPath,
        siblingIds: newInteraction.siblingIds,
        siblingIndex: newInteraction.siblingIndex,
      };

      setMessages([...conversationHistory, editedUserMessage]);

      // Now generate AI response for this edited message
      // Use the history before the edit point for context
      await handleSendMessage(newContent, conversationHistory, false, newInteraction.branchPath);

      // After AI response, reload the tree to get proper sibling info
      try {
        const treeResponse = await api.get(`/interactions/tree-v2/${sessionId}`);
        const { conversation, availableBranchPaths: paths } = treeResponse.data.data;

        // Transform to messages with sibling info
        const loadedMessages: Message[] = [];
        for (const interaction of conversation) {
          loadedMessages.push({
            id: `user-${interaction.id}`,
            role: 'user',
            content: interaction.userPrompt,
            timestamp: interaction.createdAt,
            parentId: interaction.parentId,
            branchPath: interaction.branchPath,
            siblingIds: interaction.siblingIds,
            siblingIndex: interaction.siblingIndex,
          });

          if (interaction.aiResponse) {
            loadedMessages.push(createAIMessageFromInteraction(interaction));
          }
        }

        setMessages(loadedMessages);
        setAvailableBranchPaths(paths || ['main']);
      } catch (reloadErr) {
        console.error('Failed to reload tree after edit:', reloadErr);
        // Messages are already updated from handleSendMessage, so this is non-fatal
      }

      setSuccessMessage(`Message edited - use < > to switch between versions`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      setError('Failed to edit message');
    } finally {
      setLoading(false);
    }
  }, [sessionId, messages, handleSendMessage, cancelEditingMessage]);

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
   * Load messages with sibling info from tree-v2 API
   * Call this after initial message load to get proper tree structure
   */
  const loadBranchPaths = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Use tree-v2 API to get messages with sibling info
      const response = await api.get(`/interactions/tree-v2/${sessionId}`);
      const { conversation, availableBranchPaths: paths } = response.data.data;

      if (conversation && conversation.length > 0) {
        // Transform to messages with sibling info
        const loadedMessages: Message[] = [];
        for (const interaction of conversation) {
          loadedMessages.push({
            id: `user-${interaction.id}`,
            role: 'user',
            content: interaction.userPrompt,
            timestamp: interaction.createdAt,
            parentId: interaction.parentId,
            branchPath: interaction.branchPath,
            siblingIds: interaction.siblingIds,
            siblingIndex: interaction.siblingIndex,
          });

          if (interaction.aiResponse) {
            loadedMessages.push(createAIMessageFromInteraction(interaction));
          }
        }

        setMessages(loadedMessages);
      }

      if (paths && paths.length > 0) {
        setAvailableBranchPaths(paths);
      }

      // Clear legacy fork map - now using siblingIds
      setMessageForkMap(new Map());
      setEditForkMessageIndex(null);
    } catch (err) {
      console.log('[loadBranchPaths] Falling back to legacy API:', err);
      // Fallback to legacy API
      try {
        const legacyResponse = await api.get(`/interactions/tree/${sessionId}`, {
          params: { branchPath: currentBranchPath }
        });

        const { availableBranchPaths: paths } = legacyResponse.data.data;

        if (paths && paths.length > 1) {
          setAvailableBranchPaths(paths);

          // Legacy: Build fork map for old-style navigation
          const forkMap = buildMessageForkMap(paths);
          setMessageForkMap(forkMap);

          const hasEditBranches = paths.some((p: string) => p.startsWith('edit-'));
          if (hasEditBranches) {
            const firstForkPos = forkMap.size > 0 ? Math.min(...forkMap.keys()) : null;
            setEditForkMessageIndex(firstForkPos);
          }
        }
      } catch (legacyErr) {
        console.log('[loadBranchPaths] No branch paths found:', legacyErr);
      }
    }
  }, [sessionId, currentBranchPath, buildMessageForkMap]);

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
    messageForkMap, // GPT/Claude style: per-message fork navigation

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
