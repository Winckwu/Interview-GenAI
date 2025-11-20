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
 */

import React from 'react';
import MarkdownText from './common/MarkdownText';

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
    <div
      style={{
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
        animation: 'fadeIn 0.3s ease-in-out',
        padding: '0 0.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '65%',
          padding: '1rem',
          borderRadius: message.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
          backgroundColor: message.role === 'user' ? '#93c5fd' : '#fff',
          color: message.role === 'user' ? '#0c4a6e' : '#1f2937',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderLeft: message.role === 'ai' ? `3px solid ${message.wasVerified ? '#10b981' : '#3b82f6'}` : 'none',
        }}
      >
        {/* Message Content or Editing UI */}
        {isEditing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '0.75rem',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={onSaveEdit}
                disabled={isUpdating}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {isUpdating ? '⏳ Saving...' : '💾 Save'}
              </button>
              <button
                onClick={onCancelEdit}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            style={{
              margin: '0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: '1.5',
            }}
          >
            <MarkdownText content={message.content} />
          </p>
        )}

        {/* Timestamp */}
        <p
          style={{
            margin: '0.75rem 0 0 0',
            fontSize: '0.75rem',
            opacity: 0.6,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* Trust Indicator (MR9) - Rendered from parent */}
        {message.role === 'ai' && trustIndicator}

        {/* Action Buttons for AI Messages */}
        {message.role === 'ai' && (
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              gap: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <button
              onClick={onVerify}
              disabled={isUpdating}
              title="✓ VERIFY: Confirm this AI response is correct and helpful."
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                backgroundColor: message.wasVerified ? '#10b981' : '#f3f4f6',
                color: message.wasVerified ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.6 : 1,
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              {isUpdating ? '⏳ Saving...' : message.wasVerified ? '✓ Verified' : '✓ Verify'}
            </button>
            <button
              onClick={onModify}
              disabled={isUpdating}
              title="✎ MODIFY: Check this if you edited or improved the AI's response."
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                backgroundColor: message.wasModified ? '#f59e0b' : '#f3f4f6',
                color: message.wasModified ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.6 : 1,
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
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
