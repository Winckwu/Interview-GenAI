/**
 * Tier 1: Soft Signal Component
 * Non-blocking information tips displayed in sidebar
 *
 * Purpose: Gentle nudges about learning patterns without interrupting conversation
 * Position: Right sidebar, persistent until dismissed
 * Color: Blue (informational)
 * Animation: Fade in from right
 *
 * Examples:
 * - "📊 You're accepting most responses without modification"
 * - "💡 Tip: Try editing 1-2 things, even if they seem correct"
 * - "✨ Pro tip: Verify before use"
 */

import React, { useEffect, useState, ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import './Tier1SoftSignal.css';

export interface Tier1SoftSignalProps {
  id: string;
  icon?: ReactNode;  // Support both string emoji and React components (e.g., Lucide icons)
  title?: string;
  message: string;
  description?: string;
  onDismiss: () => void;
  onLearnMore?: () => void;
  learnMoreLabel?: string;
  autoCloseSec?: number; // Auto-close after N seconds (0 = no auto-close)
}

/**
 * Soft Signal Component
 *
 * Characteristics:
 * - Non-blocking (appears in sidebar)
 * - User can dismiss instantly
 * - Optional "Learn More" button
 * - Gentle color (blue, not alarming)
 * - Smooth fade-in animation
 * - Respects reduced motion preference
 */
const Tier1SoftSignal: React.FC<Tier1SoftSignalProps> = ({
  id,
  icon = <BarChart3 size={18} strokeWidth={2} />,
  title,
  message,
  description,
  onDismiss,
  onLearnMore,
  learnMoreLabel = 'Learn more',
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
    // Wait for fade-out animation
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  return (
    <div
      className={`tier1-soft-signal ${isRemoving ? 'removing' : 'visible'}`}
      role="status"
      aria-label={`Information: ${message}`}
    >
      {/* Icon */}
      <div className="soft-signal-icon">{icon}</div>

      {/* Content */}
      <div className="soft-signal-content">
        {title && <div className="soft-signal-title">{title}</div>}
        <div className="soft-signal-message">{message}</div>
        {description && (
          <div className="soft-signal-description">{description}</div>
        )}
      </div>

      {/* Actions */}
      <div className="soft-signal-actions">
        {onLearnMore && (
          <button
            className="soft-signal-btn soft-signal-btn-primary"
            onClick={onLearnMore}
            aria-label={learnMoreLabel}
          >
            {learnMoreLabel}
          </button>
        )}
        <button
          className="soft-signal-btn soft-signal-btn-dismiss"
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

export default Tier1SoftSignal;
