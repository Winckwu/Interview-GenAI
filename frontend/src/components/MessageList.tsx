/**
 * MessageList Component
 *
 * Renders a list of messages with:
 * - Individual MessageItem components
 * - Intervention panels (Trust Indicator, Quick Reflection, MR6 Suggestions)
 * - Load More button for pagination
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 */

import React, { useCallback } from 'react';
import MessageItem, { type Message } from './MessageItem';
import TrustIndicator, { type TrustBadge, type MRRecommendation } from './TrustIndicator';
import QuickReflection, { type ReflectionResponse } from './QuickReflection';
import MR6Suggestion from './MR6Suggestion';

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
}) => {
  /**
   * Render Trust Indicator for AI messages
   */
  const renderTrustIndicator = useCallback((message: Message, index: number) => {
    if (message.role !== 'ai' || !showTrustIndicator) return null;

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
      />
    );
  }, [showTrustIndicator, orchestrateForMessage, messageTrustScores, getTrustBadge, onTrustRecommendationClick]);

  /**
   * Render Quick Reflection panel for AI messages
   */
  const renderQuickReflection = useCallback((message: Message) => {
    if (message.role !== 'ai' || reflectedMessages.has(message.id)) return null;

    return (
      <QuickReflection
        messageId={message.id}
        isExpanded={showQuickReflection === message.id}
        onExpand={() => onExpandQuickReflection(message.id)}
        onRespond={(response) => onQuickReflectionRespond(message.id, response)}
      />
    );
  }, [reflectedMessages, showQuickReflection, onExpandQuickReflection, onQuickReflectionRespond]);

  /**
   * Render MR6 Suggestion panel for AI messages
   */
  const renderMR6Suggestion = useCallback((message: Message, index: number) => {
    if (!shouldSuggestMR6(message, index)) return null;

    return (
      <MR6Suggestion
        messageId={message.id}
        isExpanded={showMR6Suggestion === message.id}
        onExpand={() => onExpandMR6Suggestion(message.id)}
        onAccept={() => onMR6SuggestionAccept(message.id)}
        onDismiss={() => onMR6SuggestionDismiss(message.id)}
      />
    );
  }, [shouldSuggestMR6, showMR6Suggestion, onExpandMR6Suggestion, onMR6SuggestionAccept, onMR6SuggestionDismiss]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '0.5rem 0',
      }}
    >
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
            trustIndicator={renderTrustIndicator(message, index)}
            quickReflection={renderQuickReflection(message)}
            mr6Suggestion={renderMR6Suggestion(message, index)}
          />
        </div>
      ))}

      {/* Load More Button */}
      {hasMoreMessages && !isLoadingMore && (
        <button
          onClick={onLoadMore}
          style={{
            margin: '1rem auto',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Load More Messages
        </button>
      )}

      {/* Loading Indicator */}
      {isLoadingMore && (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          Loading more messages...
        </div>
      )}
    </div>
  );
};

export default MessageList;
