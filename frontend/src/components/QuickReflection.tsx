/**
 * QuickReflection Component
 *
 * Displays MR14 Guided Reflection quick prompts after AI messages.
 * Encourages users to reflect on confidence and verification needs.
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 */

import React from 'react';

export type ReflectionResponse = 'confident' | 'needs-verify' | 'uncertain' | 'skip';

export interface QuickReflectionProps {
  messageId: string;
  isExpanded: boolean;
  onExpand: () => void;
  onRespond: (response: ReflectionResponse) => void;
}

export const QuickReflection: React.FC<QuickReflectionProps> = ({
  messageId,
  isExpanded,
  onExpand,
  onRespond,
}) => {
  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        backgroundColor: '#fef3c7',
        borderRadius: '0.5rem',
        border: '1px solid #fcd34d',
      }}
    >
      {isExpanded ? (
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '500', color: '#92400e' }}>
            Quick Reflection
          </p>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#78350f' }}>
            How confident are you in this response? What would you verify?
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onRespond('confident')}
              style={{
                fontSize: '0.7rem',
                padding: '0.3rem 0.6rem',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Confident
            </button>
            <button
              onClick={() => onRespond('needs-verify')}
              style={{
                fontSize: '0.7rem',
                padding: '0.3rem 0.6rem',
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Need to Verify
            </button>
            <button
              onClick={() => onRespond('uncertain')}
              style={{
                fontSize: '0.7rem',
                padding: '0.3rem 0.6rem',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Uncertain
            </button>
            <button
              onClick={() => onRespond('skip')}
              style={{
                fontSize: '0.7rem',
                padding: '0.3rem 0.6rem',
                backgroundColor: '#e5e7eb',
                color: '#6b7280',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Skip
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
            color: '#92400e',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
          }}
        >
          <span>Take a moment to reflect on this response</span>
        </button>
      )}
    </div>
  );
};

export default QuickReflection;
