/**
 * Tier 2: Pro Tip Component
 * Popup dialog for helpful learning suggestions
 *
 * Purpose: Supportive tips to enhance learning experience
 * Position: Center popup with backdrop
 * Color: Blue/Purple (supportive)
 * Interaction: User can act or postpone
 *
 * Example:
 * "💡 Pro Tip
 *  Taking a moment to review can help you learn more effectively.
 *
 *  Tip: A quick verification can improve understanding by up to 40%.
 *
 *  [Review Now] [Remind Me Later]"
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import './Tier2MediumAlert.css';

export interface Tier2MediumAlertProps {
  id: string;
  icon?: ReactNode;  // Support both string emoji and React components (e.g., Lucide icons)
  title: string;
  message: string;
  detectedBehaviors?: string[]; // List of detected behavior patterns
  suggestion?: string;
  description?: string;
  consecutiveCount?: number; // Number of consecutive interactions without verification
  actionLabel?: string;
  onAction?: () => void;
  onRemindLater?: () => void;
  onDontShowAgain?: () => void;
  onDontShowThisSession?: () => void; // Suppress for this session, re-trigger only on confidence increase
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
  detectedBehaviors,
  suggestion,
  description,
  consecutiveCount,
  actionLabel = 'Verify Now',
  onAction,
  onRemindLater,
  onDontShowAgain,
  onDontShowThisSession,
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

  const handleDontShowThisSession = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDontShowThisSession?.() || onDismiss();
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
          {/* Show detected behaviors as a list if multiple, otherwise show message */}
          {detectedBehaviors && detectedBehaviors.length > 1 ? (
            <div className="medium-alert-behaviors">
              <p className="medium-alert-behaviors-title">Recent behavior observations:</p>
              <ul className="medium-alert-behaviors-list">
                {detectedBehaviors.map((behavior, index) => (
                  <li key={index}>{behavior}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p id="medium-alert-message" className="medium-alert-message">
              {consecutiveCount
                ? message.replace('{count}', String(consecutiveCount))
                : message}
            </p>
          )}

          {suggestion && (
            <div className="medium-alert-suggestion">
              <strong>Suggestion:</strong> {suggestion}
            </div>
          )}

          {description && (
            <p className="medium-alert-description">{description}</p>
          )}
        </div>

        {/* Actions - simplified with positive framing */}
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
            Remind Me Later
          </button>
        </div>

        {/* Session suppression option - less prominent */}
        {onDontShowThisSession && (
          <div className="medium-alert-suppress">
            <button
              className="medium-alert-btn-text"
              onClick={handleDontShowThisSession}
              aria-label="Don't show again this session"
            >
              Don't show again this session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tier2MediumAlert;
