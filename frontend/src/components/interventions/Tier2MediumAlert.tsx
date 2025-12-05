/**
 * Tier 2: Medium Alert Component
 * Popup dialog for concerning patterns requiring user response
 *
 * Purpose: Visible warnings about suboptimal learning behaviors
 * Position: Center popup with backdrop
 * Color: Orange (warning)
 * Interaction: Requires user response (Verify Now / Remind Later / Don't show)
 *
 * Example:
 * "🔔 MCA Reminder
 *  You have not verified AI output for 3 consecutive interactions.
 *
 *  Suggestion: Pause and review whether recent AI responses
 *  meet your expectations.
 *
 *  [Verify Now] [Remind Later] [Don't show this type of reminder]"
 */

import React, { useState, useEffect, useRef } from 'react';
import './Tier2MediumAlert.css';

export interface Tier2MediumAlertProps {
  id: string;
  icon?: string;
  title: string;
  message: string;
  suggestion?: string;
  description?: string;
  consecutiveCount?: number; // Number of consecutive interactions without verification
  actionLabel?: string;
  onAction?: () => void;
  onRemindLater?: () => void;
  onDontShowAgain?: () => void;
  onDismiss: () => void;
  onSkip?: () => void;
  autoCloseSec?: number; // Auto-close after N seconds (0 = no auto-close)
}

/**
 * Medium Alert Component - Popup Dialog
 *
 * Characteristics:
 * - Popup dialog with backdrop (semi-blocking)
 * - Orange warning color scheme
 * - Contextual message with consecutive count
 * - Three action options: Verify Now, Remind Later, Don't Show Again
 * - User must respond
 * - Scale-up animation on entry
 * - Respects reduced motion preference
 */
const Tier2MediumAlert: React.FC<Tier2MediumAlertProps> = ({
  id,
  icon = '🔔',
  title,
  message,
  suggestion,
  description,
  consecutiveCount,
  actionLabel = 'Verify Now',
  onAction,
  onRemindLater,
  onDontShowAgain,
  onDismiss,
  onSkip,
  autoCloseSec = 0,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-close timer (optional)
  useEffect(() => {
    if (autoCloseSec <= 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoCloseSec * 1000);

    return () => clearTimeout(timer);
  }, [autoCloseSec]);

  // Focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const handleRemindLater = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemindLater?.() || onSkip?.();
    }, 300);
  };

  const handleDontShowAgain = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDontShowAgain?.() || onDismiss();
    }, 300);
  };

  return (
    <div
      className={`tier2-backdrop ${isRemoving ? 'removing' : ''}`}
      onClick={handleDismiss}
    >
      <div
        ref={modalRef}
        className={`tier2-medium-alert ${isRemoving ? 'removing' : 'visible'}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="medium-alert-title"
        aria-describedby="medium-alert-message"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="medium-alert-header">
          <div className="medium-alert-icon">{icon}</div>
          <h3 id="medium-alert-title" className="medium-alert-title">{title}</h3>
        </div>

        {/* Divider */}
        <div className="medium-alert-divider"></div>

        {/* Content */}
        <div className="medium-alert-content">
          <p id="medium-alert-message" className="medium-alert-message">
            {consecutiveCount
              ? message.replace('{count}', String(consecutiveCount))
              : message}
          </p>

          {suggestion && (
            <div className="medium-alert-suggestion">
              <strong>Suggestion:</strong> {suggestion}
            </div>
          )}

          {description && (
            <p className="medium-alert-description">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="medium-alert-actions">
          {onAction && (
            <button
              className="medium-alert-btn medium-alert-btn-primary"
              onClick={handleAction}
              aria-label={actionLabel}
            >
              {actionLabel}
            </button>
          )}

          <button
            className="medium-alert-btn medium-alert-btn-secondary"
            onClick={handleRemindLater}
            aria-label="Remind me later"
          >
            Remind Later
          </button>

          <button
            className="medium-alert-btn medium-alert-btn-tertiary"
            onClick={handleDontShowAgain}
            aria-label="Don't show this type of reminder again"
          >
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tier2MediumAlert;
