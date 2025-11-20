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

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;
}

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
  trustIndicator,
  quickReflection,
  mr6Suggestion,
}) => {
  return (
    <div className={`${styles.messageContainer} ${styles[message.role]}`}>
      <div
        className={`${styles.messageBubble} ${styles[message.role]} ${
          message.role === 'ai' ? (message.wasVerified ? styles.verified : styles.unverified) : ''
        }`}
      >
        {/* Message Content or Editing UI */}
        {isEditing ? (
          <div>
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
          <div>
            <MarkdownText content={message.content} />
          </div>
        )}

        {/* Timestamp */}
        <p className={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* Trust Indicator (MR9) - Rendered from parent */}
        {message.role === 'ai' && trustIndicator}

        {/* Action Buttons for AI Messages */}
        {message.role === 'ai' && (
          <div className={styles.actionButtons}>
            <button
              onClick={onVerify}
              disabled={isUpdating}
              title="✓ VERIFY: Confirm this AI response is correct and helpful."
              className={`${styles.actionButton} ${message.wasVerified ? styles.verifiedBadge : styles.verifyButton}`}
              style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
            >
              {isUpdating ? '⏳ Saving...' : message.wasVerified ? '✓ Verified' : '✓ Verify'}
            </button>
            <button
              onClick={onModify}
              disabled={isUpdating}
              title="✎ MODIFY: Check this if you edited or improved the AI's response."
              className={`${styles.actionButton} ${message.wasModified ? styles.modifiedBadge : styles.modifyButton}`}
              style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
            >
              {isUpdating ? '⏳ Saving...' : message.wasModified ? '✎ Modified' : '✎ Modify'}
            </button>
          </div>
        )}

        {/* Quick Reflection Prompt (MR14) - Rendered from parent */}
        {message.role === 'ai' && quickReflection}

        {/* MR6 Multi-Model Comparison Suggestion - Rendered from parent */}
        {message.role === 'ai' && mr6Suggestion}
      </div>
    </div>
  );
};

export default MessageItem;
