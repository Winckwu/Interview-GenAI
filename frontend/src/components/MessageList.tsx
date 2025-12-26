/**
 * MessageList Component
 *
 * Renders a list of messages with:
 * - Individual MessageItem components
 * - Intervention panels (Trust Indicator, Quick Reflection, MR6 Suggestions)
 * - Load More button for pagination
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React, { useCallback, useMemo } from 'react';
import MessageItem, { type Message } from './MessageItem';
import TrustIndicator, { type TrustBadge, type MRRecommendation } from './TrustIndicator';
import QuickReflection, { type ReflectionResponse } from './QuickReflection';
import MR6Suggestion from './MR6Suggestion';
import { type RegenerateOptions } from './RegenerateDropdown';
import styles from './MessageList.module.css';

/**
 * Detect if a message is a simple greeting or casual conversation
 * that doesn't need verification tools, trust indicators, etc.
 */
const GREETING_PATTERNS = [
  /^(hi|hello|hey|hola|你好|嗨|哈喽|早|晚上好|早上好|下午好)[\s!.,?]*$/i,
  /^(how are you|what's up|sup|how's it going|怎么样|最近怎么样)[\s!.,?]*$/i,
  /^(thanks|thank you|谢谢|感谢|thx|ty)[\s!.,?]*$/i,
  /^(ok|okay|好的|好|行|嗯|got it|understood)[\s!.,?]*$/i,
  /^(bye|goodbye|see you|再见|拜拜)[\s!.,?]*$/i,
];

const isSimpleMessage = (userMessage: string, aiResponse: string): boolean => {
  const userMsg = userMessage.trim().toLowerCase();

  // Only hide tools for actual greeting patterns, not just any short message
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(userMsg)) {
      return true;
    }
  }

  return false;
};

export interface MessageListProps {
  messages: Message[];

  // Editing state
  editingMessageId: string | null;
  editedContent: string;
  updatingMessageId: string | null;
  onEditContentChange: (content: string) => void;
  onSaveEdit: (messageId: string) => void;
  onCancelEdit: () => void;

  // Actions
  onVerify: (messageId: string) => void;
  onModify: (messageId: string) => void;
  onRegenerate?: (messageId: string, options: RegenerateOptions) => void; // Regenerate AI response with options
  onViewInsights?: (messageId: string) => void; // Open MR2 insights for this message
  onCriticalThinking?: (messageId: string, content: string) => void; // Open MR12 Critical Thinking for this message
  onEditUserMessage?: (messageId: string) => void; // Edit user message and regenerate

  // Branch navigation
  onBranchSwitch?: (messageId: string, direction: 'prev' | 'next') => void;
  onBranchDelete?: (messageId: string) => void;
  onBranchSetAsMain?: (messageId: string) => void;
  onBranchesUpdate?: (messageId: string, updatedBranches: import('../hooks/useMessages').MessageBranch[]) => void;

  // Conversation forking
  onForkConversation?: (messageId: string) => void;

  // Conversation branch paths (for user message edits)
  availableBranchPaths?: string[];
  currentBranchPath?: string;
  onSwitchBranchPath?: (branchPath: string) => void;
  editForkMessageIndex?: number | null;

  // Trust Indicator (MR9)
  showTrustIndicator: boolean;
  messageTrustScores: Map<string, number>;
  getTrustBadge: (score: number) => TrustBadge;
  orchestrateForMessage: (message: Message, index: number) => {
    recommendations: MRRecommendation[];
    trustScore: number;
  } | null;
  onTrustRecommendationClick: (recommendation: MRRecommendation) => void;

  // Quick Reflection (MR14)
  reflectedMessages: Set<string>;
  showQuickReflection: string | null;
  onExpandQuickReflection: (messageId: string) => void;
  onQuickReflectionRespond: (messageId: string, response: ReflectionResponse) => void;

  // MR6 Suggestions
  shouldSuggestMR6: (message: Message, index: number) => boolean;
  showMR6Suggestion: string | null;
  onExpandMR6Suggestion: (messageId: string) => void;
  onMR6SuggestionAccept: (messageId: string) => void;
  onMR6SuggestionDismiss: (messageId: string) => void;

  // Pagination
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;

  // Streaming state
  isStreaming?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  editingMessageId,
  editedContent,
  updatingMessageId,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onVerify,
  onModify,
  onRegenerate,
  onViewInsights,
  onCriticalThinking,
  onEditUserMessage,
  onBranchSwitch,
  onBranchDelete,
  onBranchSetAsMain,
  onBranchesUpdate,
  onForkConversation,
  availableBranchPaths = ['main'],
  currentBranchPath = 'main',
  onSwitchBranchPath,
  editForkMessageIndex = null,
  showTrustIndicator,
  messageTrustScores,
  getTrustBadge,
  orchestrateForMessage,
  onTrustRecommendationClick,
  reflectedMessages,
  showQuickReflection,
  onExpandQuickReflection,
  onQuickReflectionRespond,
  shouldSuggestMR6,
  showMR6Suggestion,
  onExpandMR6Suggestion,
  onMR6SuggestionAccept,
  onMR6SuggestionDismiss,
  hasMoreMessages,
  isLoadingMore,
  onLoadMore,
  isStreaming = false,
}) => {
  /**
   * Check if an AI message is a response to a simple greeting/casual message
   * Returns true if tools should be hidden
   */
  const shouldHideTools = useCallback((message: Message, index: number): boolean => {
    if (message.role !== 'ai') return false;

    // Find the preceding user message
    const userMessage = messages.slice(0, index).reverse().find(m => m.role === 'user');
    if (!userMessage) return false;

    return isSimpleMessage(userMessage.content, message.content);
  }, [messages]);

  /**
   * Render Trust Indicator for AI messages
   */
  const renderTrustIndicator = useCallback((message: Message, index: number) => {
    if (message.role !== 'ai' || !showTrustIndicator) return null;

    // Skip for simple messages
    if (shouldHideTools(message, index)) return null;

    const orchestrationResult = orchestrateForMessage(message, index);
    if (!orchestrationResult) return null;

    const trustScore = messageTrustScores.get(message.id) || 0;
    const badge = getTrustBadge(trustScore);

    return (
      <TrustIndicator
        trustScore={trustScore}
        badge={badge}
        recommendations={orchestrationResult.recommendations}
        onRecommendationClick={onTrustRecommendationClick}
        aiContent={message.content}
      />
    );
  }, [showTrustIndicator, orchestrateForMessage, messageTrustScores, getTrustBadge, onTrustRecommendationClick, shouldHideTools]);

  /**
   * Render Quick Reflection panel for AI messages
   */
  const renderQuickReflection = useCallback((message: Message, index: number) => {
    if (message.role !== 'ai' || reflectedMessages.has(message.id)) return null;

    // Skip for simple messages
    if (shouldHideTools(message, index)) return null;

    return (
      <QuickReflection
        messageId={message.id}
        isExpanded={showQuickReflection === message.id}
        onExpand={() => onExpandQuickReflection(message.id)}
        onRespond={(response) => onQuickReflectionRespond(message.id, response)}
      />
    );
  }, [reflectedMessages, showQuickReflection, onExpandQuickReflection, onQuickReflectionRespond, shouldHideTools]);

  /**
   * Render MR6 Suggestion panel for AI messages
   */
  const renderMR6Suggestion = useCallback((message: Message, index: number) => {
    if (!shouldSuggestMR6(message, index)) return null;

    // Skip for simple messages
    if (shouldHideTools(message, index)) return null;

    return (
      <MR6Suggestion
        messageId={message.id}
        isExpanded={showMR6Suggestion === message.id}
        onExpand={() => onExpandMR6Suggestion(message.id)}
        onAccept={() => onMR6SuggestionAccept(message.id)}
        onDismiss={() => onMR6SuggestionDismiss(message.id)}
      />
    );
  }, [shouldSuggestMR6, showMR6Suggestion, onExpandMR6Suggestion, onMR6SuggestionAccept, onMR6SuggestionDismiss, shouldHideTools]);

  return (
    <div className={styles.messagesContainer}>
      {messages.map((message, index) => (
        <div key={message.id}>
          <MessageItem
            message={message}
            index={index}
            isEditing={editingMessageId === message.id}
            editedContent={editedContent}
            isUpdating={updatingMessageId === message.id}
            onEditContentChange={onEditContentChange}
            onSaveEdit={() => onSaveEdit(message.id)}
            onCancelEdit={onCancelEdit}
            onVerify={() => onVerify(message.id)}
            onModify={() => onModify(message.id)}
            onRegenerate={message.role === 'ai' && onRegenerate ? (options) => onRegenerate(message.id, options) : undefined}
            onViewInsights={message.role === 'ai' && onViewInsights ? () => onViewInsights(message.id) : undefined}
            onCriticalThinking={message.role === 'ai' && onCriticalThinking ? (content: string) => onCriticalThinking(message.id, content) : undefined}
            onEditUserMessage={message.role === 'user' && onEditUserMessage ? () => onEditUserMessage(message.id) : undefined}
            onBranchPrev={onBranchSwitch ? () => onBranchSwitch(message.id, 'prev') : undefined}
            onBranchNext={onBranchSwitch ? () => onBranchSwitch(message.id, 'next') : undefined}
            onBranchDelete={onBranchDelete ? () => onBranchDelete(message.id) : undefined}
            onBranchSetAsMain={onBranchSetAsMain ? () => onBranchSetAsMain(message.id) : undefined}
            onBranchesUpdate={onBranchesUpdate ? (branches) => onBranchesUpdate(message.id, branches) : undefined}
            onForkConversation={message.role === 'ai' && onForkConversation ? () => onForkConversation(message.id) : undefined}
            availableBranchPaths={availableBranchPaths}
            currentBranchPath={currentBranchPath}
            onSwitchBranchPath={onSwitchBranchPath}
            editForkMessageIndex={editForkMessageIndex}
            trustIndicator={renderTrustIndicator(message, index)}
            hideActionButtons={shouldHideTools(message, index)}
            isStreaming={isStreaming && message.role === 'ai' && index === messages.length - 1}
          />
        </div>
      ))}

      {/* Load More Button */}
      {hasMoreMessages && !isLoadingMore && (
        <button
          onClick={onLoadMore}
          className={styles.loadMoreButton}
        >
          Load More Messages
        </button>
      )}

      {/* Loading Indicator */}
      {isLoadingMore && (
        <div className={styles.loadingIndicator}>
          Loading more messages...
        </div>
      )}
    </div>
  );
};

export default MessageList;
