/**
 * MR6Suggestion Component
 *
 * Displays MR6 Cross-Model Comparison suggestion after AI messages
 * when iteration is detected (message was modified or iteration keywords found).
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React from 'react';
import styles from './MR6Suggestion.module.css';

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
    <div className={styles.container}>
      {isExpanded ? (
        <div>
          <h4 className={styles.title}>
            🔄 Compare Multiple AI Models
          </h4>
          <p className={styles.description}>
            You're iterating on this response! Try comparing outputs from GPT-4, Claude, and Gemini to find the best solution. Different models excel at different tasks.
          </p>
          <div className={styles.buttonGroup}>
            <button
              onClick={onAccept}
              className={`${styles.button} ${styles.primaryButton}`}
              title="Open Multi-Model Comparison (MR6)"
            >
              🔄 Compare Models (MR6)
            </button>
            <button
              onClick={onDismiss}
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Not Now
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onExpand}
          className={styles.collapseButton}
        >
          <span>💡 Try comparing multiple AI models for better results</span>
        </button>
      )}
    </div>
  );
};

export default MR6Suggestion;
