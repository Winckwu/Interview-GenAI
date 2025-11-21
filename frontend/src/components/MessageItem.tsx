/**
 * MessageItem Component
 *
 * Displays a single message (user or AI) with:
 * - Message content (markdown support)
 * - Inline editing capability
 * - Timestamp
 * - Action buttons (Verify, Modify for AI messages)
 * - Intervention panels (Trust Indicator, Quick Reflection, MR6 Suggestions)
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React from 'react';
import MarkdownText from './common/MarkdownText';
import styles from './MessageItem.module.css';
import { type Message } from '../hooks/useMessages';

// Re-export Message type for backward compatibility
export type { Message };

export interface MessageItemProps {
  message: Message;
  index: number;

  // Editing state
  isEditing: boolean;
  editedContent: string;
  isUpdating: boolean;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;

  // Actions
  onVerify: () => void;
  onModify: () => void;

  // Branch navigation
  onBranchPrev?: () => void;
  onBranchNext?: () => void;
  onBranchDelete?: () => void;
  onBranchSetAsMain?: () => void;

  // Child components (intervention panels)
  trustIndicator?: React.ReactNode;
  quickReflection?: React.ReactNode;
  mr6Suggestion?: React.ReactNode;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isEditing,
  editedContent,
  isUpdating,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onVerify,
  onModify,
  onBranchPrev,
  onBranchNext,
  onBranchDelete,
  onBranchSetAsMain,
  trustIndicator,
  quickReflection,
  mr6Suggestion,
}) => {
  // Calculate branch information
  const hasBranches = message.branches && message.branches.length > 0;
  const currentBranchIndex = message.currentBranchIndex ?? 0;
  const totalBranches = hasBranches ? (message.branches?.length ?? 0) + 1 : 1; // +1 for original
  const canGoPrev = hasBranches && currentBranchIndex > 0;
  const canGoNext = hasBranches && currentBranchIndex < totalBranches - 1;

  // Get current content (either original or from a branch)
  const getCurrentContent = () => {
    if (currentBranchIndex === 0 || !message.branches) {
      return message.content;
    }
    const branch = message.branches[currentBranchIndex - 1];
    return branch?.content || message.content;
  };

  // Get current branch source info
  const getCurrentBranchInfo = () => {
    if (currentBranchIndex === 0) {
      return { label: 'Original', model: undefined };
    }
    const branch = message.branches?.[currentBranchIndex - 1];
    if (branch?.source === 'mr6' && branch.model) {
      return { label: `MR6: ${branch.model}`, model: branch.model };
    }
    if (branch?.source === 'mr5' && branch.model) {
      return { label: `MR5: ${branch.model}`, model: branch.model };
    }
    return { label: `Branch ${currentBranchIndex}`, model: undefined };
  };

  // Get current branch metadata for history display
  const getCurrentBranchMetadata = () => {
    if (currentBranchIndex === 0) {
      return {
        createdAt: message.timestamp,
        source: 'original',
        model: undefined,
        wasVerified: message.wasVerified,
        wasModified: message.wasModified,
      };
    }
    const branch = message.branches?.[currentBranchIndex - 1];
    return branch || null;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentContent = getCurrentContent();
  const branchInfo = getCurrentBranchInfo();
  const branchMetadata = getCurrentBranchMetadata();
  return (
    <div className={`${styles.messageContainer} ${styles[message.role]}`}>
      <div
        className={`${styles.messageBubble} ${styles[message.role]} ${
          message.role === 'ai' ? (message.wasVerified ? styles.verified : styles.unverified) : ''
        }`}
      >
        {/* Message Content or Editing UI */}
        {isEditing ? (
          <div className={styles.messageContent}>
            <textarea
              value={editedContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className={styles.editTextarea}
              autoFocus
            />
            <div className={styles.editButtonGroup}>
              <button
                onClick={onSaveEdit}
                disabled={isUpdating}
                className={`${styles.editButton} ${styles.saveButton}`}
              >
                {isUpdating ? '⏳ Saving...' : '💾 Save'}
              </button>
              <button
                onClick={onCancelEdit}
                className={`${styles.editButton} ${styles.cancelButton}`}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messageContent}>
            <MarkdownText content={currentContent} />
          </div>
        )}

        {/* Footer Section for AI Messages - metadata & interventions */}
        {message.role === 'ai' && !isEditing && (
          <div className={styles.messageFooter}>
            {/* Timestamp */}
            <div className={styles.timestamp}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* Branch Navigation */}
            {hasBranches && (
              <div
                className={styles.branchNavigation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.625rem',
                  backgroundColor: currentBranchIndex === 0 ? '#e0f2fe' : '#fce7f3',
                  border: `1px solid ${currentBranchIndex === 0 ? '#bae6fd' : '#fbcfe8'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
              >
                <button
                  onClick={onBranchPrev}
                  disabled={!canGoPrev}
                  title="Previous branch"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: canGoPrev ? 'pointer' : 'not-allowed',
                    padding: '0.125rem 0.25rem',
                    opacity: canGoPrev ? 1 : 0.3,
                    fontSize: '0.875rem',
                  }}
                >
                  ◀
                </button>
                <span style={{ fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>
                  {branchInfo.label} ({currentBranchIndex + 1}/{totalBranches})
                </span>

                {/* Branch metadata info button */}
                {branchMetadata && (
                  <span
                    title={`Created: ${formatTimestamp(branchMetadata.createdAt)}\nSource: ${branchMetadata.source?.toUpperCase() || 'N/A'}${branchMetadata.model ? `\nModel: ${branchMetadata.model}` : ''}${branchMetadata.wasVerified ? '\n✓ Verified' : ''}${branchMetadata.wasModified ? '\n✎ Modified' : ''}`}
                    style={{
                      marginLeft: '0.25rem',
                      cursor: 'help',
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}
                  >
                    ℹ️
                  </span>
                )}

                <button
                  onClick={onBranchNext}
                  disabled={!canGoNext}
                  title="Next branch"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: canGoNext ? 'pointer' : 'not-allowed',
                    padding: '0.125rem 0.25rem',
                    opacity: canGoNext ? 1 : 0.3,
                    fontSize: '0.875rem',
                  }}
                >
                  ▶
                </button>

                {/* Set as Main button - only show for branches (not original) */}
                {currentBranchIndex > 0 && onBranchSetAsMain && (
                  <button
                    onClick={onBranchSetAsMain}
                    title="Set this branch as the main answer"
                    style={{
                      background: 'none',
                      border: '1px solid #10b981',
                      cursor: 'pointer',
                      padding: '0.125rem 0.375rem',
                      fontSize: '0.7rem',
                      color: '#10b981',
                      marginLeft: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '500',
                    }}
                  >
                    ⭐ Set as Main
                  </button>
                )}

                {/* Delete button - only show for branches (not original) */}
                {currentBranchIndex > 0 && onBranchDelete && (
                  <button
                    onClick={onBranchDelete}
                    title="Delete this branch"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.125rem 0.25rem',
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      marginLeft: '0.25rem',
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}

            {/* Trust Indicator (MR9) - Rendered from parent */}
            {trustIndicator}

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                onClick={onVerify}
                disabled={isUpdating}
                title="✓ VERIFY: Confirm this AI response is correct and helpful."
                className={`${styles.actionButton} ${message.wasVerified ? styles.verifiedBadge : styles.verifyButton}`}
                style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
              >
                {isUpdating ? '⏳' : message.wasVerified ? '✓' : '✓'} {message.wasVerified ? 'Verified' : 'Verify'}
              </button>
              <button
                onClick={onModify}
                disabled={isUpdating}
                title="✎ MODIFY: Check this if you edited or improved the AI's response."
                className={`${styles.actionButton} ${message.wasModified ? styles.modifiedBadge : styles.modifyButton}`}
                style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
              >
                {isUpdating ? '⏳' : message.wasModified ? '✎' : '✎'} {message.wasModified ? 'Modified' : 'Modify'}
              </button>
            </div>

            {/* Quick Reflection Prompt (MR14) - Rendered from parent */}
            {quickReflection}

            {/* MR6 Multi-Model Comparison Suggestion - Rendered from parent */}
            {mr6Suggestion}
          </div>
        )}

        {/* Timestamp for user messages */}
        {message.role === 'user' && !isEditing && (
          <p className={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
