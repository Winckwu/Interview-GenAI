/**
 * Tier 2: Medium Alert Component
 * More prominent alerts in sidebar for concerning patterns
 *
 * Purpose: Gentle but visible warnings about suboptimal learning behaviors
 * Position: Right sidebar, persistent until dismissed or acted on
 * Color: Orange (warning)
 * Animation: Fade in with scale up
 *
 * Examples:
 * - "⚠️ Review Recommended: Consider verifying your responses"
 * - "⚠️ Engagement Pattern: You might benefit from critical review"
 * - "⚠️ Passive Use Detected: Try modifying responses before accepting"
 */

import React, { useState, useEffect } from 'react';
import './Tier2MediumAlert.css';

export interface Tier2MediumAlertProps {
  id: string;
  icon?: string;
  title: string;
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  onSkip?: () => void;
  autoCloseSec?: number; // Auto-close after N seconds (0 = no auto-close)
}

/**
 * Medium Alert Component
 *
 * Characteristics:
 * - More prominent than soft signal (orange color)
 * - Still non-blocking (sidebar)
 * - User can act, skip, or dismiss
 * - Slightly larger text
 * - Scale-up animation on entry
 * - Respects reduced motion preference
 */
const Tier2MediumAlert: React.FC<Tier2MediumAlertProps> = ({
  id,
  icon = '⚠️',
  title,
  message,
  description,
  actionLabel = 'Learn More',
  onAction,
  onDismiss,
  onSkip,
  autoCloseSec = 0,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  // Auto-close timer (optional)
  useEffect(() => {
    if (autoCloseSec <= 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoCloseSec * 1000);

    return () => clearTimeout(timer);
  }, [autoCloseSec]);

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleAction = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onAction?.();
    }, 300);
  };

  const handleSkip = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onSkip?.();
    }, 300);
  };

  return (
    <div
      className={`tier2-medium-alert ${isRemoving ? 'removing' : 'visible'}`}
      role="alert"
      aria-label={`Warning: ${message}`}
    >
      {/* Background accent bar */}
      <div className="alert-accent-bar"></div>

      {/* Icon */}
      <div className="medium-alert-icon">{icon}</div>

      {/* Content */}
      <div className="medium-alert-content">
        <div className="medium-alert-title">{title}</div>
        <div className="medium-alert-message">{message}</div>
        {description && (
          <div className="medium-alert-description">{description}</div>
        )}
      </div>

      {/* Actions */}
      <div className="medium-alert-actions">
        {onAction && (
          <button
            className="medium-alert-btn medium-alert-btn-action"
            onClick={handleAction}
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        )}
        {onSkip && (
          <button
            className="medium-alert-btn medium-alert-btn-skip"
            onClick={handleSkip}
            aria-label="Skip for now"
          >
            Skip
          </button>
        )}
        <button
          className="medium-alert-btn medium-alert-btn-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
          title="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Tier2MediumAlert;
