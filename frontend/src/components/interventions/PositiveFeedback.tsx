/**
 * Positive Feedback Component
 * Non-blocking celebration for good learning behaviors
 *
 * Purpose: Reinforce positive behaviors (verification, modification)
 * Position: Toast notification in bottom-right
 * Color: Green (success, celebration)
 * Animation: Slide up, auto-dismiss after 4 seconds
 *
 * Examples:
 * - "🎉 Great job verifying! Your critical thinking is growing!"
 * - "✨ Nice modification! Making it your own helps learning."
 * - "🏆 Achievement: Verified 5 responses today!"
 */

import React, { useEffect, useState } from 'react';
import './PositiveFeedback.css';

export type FeedbackType = 'verify' | 'modify' | 'achievement' | 'streak';

export interface PositiveFeedbackProps {
  id: string;
  type: FeedbackType;
  message: string;
  subMessage?: string;
  count?: number; // For achievements/streaks
  onDismiss: () => void;
  autoCloseSec?: number; // Default 4 seconds
}

const FEEDBACK_ICONS: Record<FeedbackType, string> = {
  verify: '🎉',
  modify: '✨',
  achievement: '🏆',
  streak: '🔥',
};

const FEEDBACK_TITLES: Record<FeedbackType, string> = {
  verify: 'Great Critical Thinking!',
  modify: 'Nice Personalization!',
  achievement: 'Achievement Unlocked!',
  streak: 'You\'re on a Roll!',
};

/**
 * Positive Feedback Component
 *
 * Characteristics:
 * - Non-blocking toast notification
 * - Celebratory green color scheme
 * - Auto-dismiss with smooth animation
 * - Reinforces positive learning behaviors
 */
const PositiveFeedback: React.FC<PositiveFeedbackProps> = ({
  id,
  type,
  message,
  subMessage,
  count,
  onDismiss,
  autoCloseSec = 4,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(100);

  // Auto-close timer with progress bar
  useEffect(() => {
    if (autoCloseSec <= 0) return;

    const totalMs = autoCloseSec * 1000;
    const intervalMs = 50;
    const decrementPerInterval = (100 / totalMs) * intervalMs;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrementPerInterval;
        if (next <= 0) {
          clearInterval(interval);
          handleDismiss();
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoCloseSec]);

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const icon = FEEDBACK_ICONS[type];
  const title = FEEDBACK_TITLES[type];

  return (
    <div
      className={`positive-feedback ${isRemoving ? 'removing' : 'visible'}`}
      role="status"
      aria-label={`${title}: ${message}`}
    >
      {/* Progress bar */}
      <div className="positive-feedback-progress">
        <div
          className="positive-feedback-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="positive-feedback-content">
        <div className="positive-feedback-icon">{icon}</div>
        <div className="positive-feedback-text">
          <div className="positive-feedback-title">{title}</div>
          <div className="positive-feedback-message">{message}</div>
          {subMessage && (
            <div className="positive-feedback-sub">{subMessage}</div>
          )}
          {count !== undefined && (
            <div className="positive-feedback-count">
              {type === 'streak' ? `${count} in a row!` : `Total: ${count}`}
            </div>
          )}
        </div>
        <button
          className="positive-feedback-close"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PositiveFeedback;
