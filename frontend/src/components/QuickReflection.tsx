/**
 * QuickReflection Component
 *
 * Displays MR14 Guided Reflection quick prompts after AI messages.
 * Encourages users to reflect on confidence and verification needs.
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React from 'react';
import styles from './QuickReflection.module.css';

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
    <div className={styles.container}>
      {isExpanded ? (
        <div>
          <p className={styles.title}>
            Quick Reflection
          </p>
          <p className={styles.prompt}>
            How confident are you in this response? What would you verify?
          </p>
          <div className={styles.buttonGroup}>
            <button
              onClick={() => onRespond('confident')}
              className={`${styles.button} ${styles.buttonConfident}`}
            >
              Confident
            </button>
            <button
              onClick={() => onRespond('needs-verify')}
              className={`${styles.button} ${styles.buttonVerify}`}
            >
              Need to Verify
            </button>
            <button
              onClick={() => onRespond('uncertain')}
              className={`${styles.button} ${styles.buttonUncertain}`}
            >
              Uncertain
            </button>
            <button
              onClick={() => onRespond('skip')}
              className={`${styles.button} ${styles.buttonSkip}`}
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onExpand}
          className={styles.collapseButton}
        >
          <span>Take a moment to reflect on this response</span>
        </button>
      )}
    </div>
  );
};

export default QuickReflection;
