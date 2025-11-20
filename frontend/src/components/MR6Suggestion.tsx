/**
 * MR6Suggestion Component
 *
 * Displays MR6 Cross-Model Comparison suggestion after AI messages
 * when iteration is detected (message was modified or iteration keywords found).
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 */

import React from 'react';

export interface MR6SuggestionProps {
  messageId: string;
  isExpanded: boolean;
  onExpand: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

export const MR6Suggestion: React.FC<MR6SuggestionProps> = ({
  messageId,
  isExpanded,
  onExpand,
  onAccept,
  onDismiss,
}) => {
  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        backgroundColor: '#dbeafe',
        borderRadius: '0.5rem',
        border: '2px solid #3b82f6',
      }}
    >
      {isExpanded ? (
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af' }}>
            🔄 Compare Multiple AI Models
          </h4>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#1e3a8a', lineHeight: '1.4' }}>
            You're iterating on this response! Try comparing outputs from GPT-4, Claude, and Gemini to find the best solution. Different models excel at different tasks.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={onAccept}
              style={{
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
              }}
              title="Open Multi-Model Comparison (MR6)"
            >
              🔄 Compare Models (MR6)
            </button>
            <button
              onClick={onDismiss}
              style={{
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#e5e7eb',
                color: '#6b7280',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Not Now
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onExpand}
          style={{
            width: '100%',
            fontSize: '0.75rem',
            padding: '0.4rem',
            backgroundColor: 'transparent',
            color: '#1e40af',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontWeight: '500',
          }}
        >
          <span>💡 Try comparing multiple AI models for better results</span>
        </button>
      )}
    </div>
  );
};

export default MR6Suggestion;
