/**
 * Tier 3: Hard Barrier Component
 * Modal dialog for high-confidence Pattern F detection
 *
 * Purpose: Blocking intervention for serious learning pattern risks
 * Position: Modal (center, overlay, focus trap)
 * Color: Red (alert)
 * Interaction: Requires explicit user action
 * Critical Feature: "Proceed Anyway" button for user autonomy
 *
 * Example:
 * "🚨 Safety Check Required
 *  We detected a pattern suggesting this response should be
 *  verified by you before use in real-world context.
 *
 *  What will you do with this response?
 *  ○ I will verify it carefully
 *  ○ I will modify it before use
 *  ○ I will reject and re-ask
 *  ○ I'm confident and want to proceed
 *
 *  [Confirm]  [Cancel]"
 */

import React, { useEffect, useRef, useState } from 'react';
import './Tier3HardBarrier.css';

export interface BarrierOption {
  label: string;
  value: string;
  description?: string;
}

export interface Tier3HardBarrierProps {
  id: string;
  icon?: string;
  title: string;
  message: string;
  description?: string;
  options: BarrierOption[];
  isLoading?: boolean;
  onConfirm: (selectedValue: string) => void | Promise<void>;
  onCancel: () => void;
  isDangerous?: boolean; // Red styling for very high confidence
}

/**
 * Hard Barrier Component - Modal with focus trap
 *
 * Characteristics:
 * - Modal dialog (blocks interaction with page)
 * - Focus trap (keeps focus within modal)
 * - Keyboard support (Enter to confirm, Escape to cancel)
 * - Explicit user action required
 * - Red styling for high-risk patterns
 * - "Proceed Anyway" option for autonomy (ethical design)
 * - Loading state during async operations
 */
const Tier3HardBarrier: React.FC<Tier3HardBarrierProps> = ({
  id,
  icon = '🚨',
  title,
  message,
  description,
  options,
  isLoading = false,
  onConfirm,
  onCancel,
  isDangerous = true,
}) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(
    options[0]?.value || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: trap focus within modal
  useEffect(() => {
    // Auto-focus first focusable element
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Trap focus on Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleConfirm = async () => {
    if (!selectedValue || isProcessing) return;

    setIsProcessing(true);
    try {
      await onConfirm(selectedValue);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tier3-barrier-backdrop" role="presentation" onClick={onCancel}>
      <div
        ref={modalRef}
        className={`tier3-hard-barrier ${isDangerous ? 'dangerous' : ''} ${
          isProcessing ? 'processing' : ''
        }`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="barrier-title"
        aria-describedby="barrier-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="barrier-close-btn"
          onClick={onCancel}
          disabled={isProcessing}
          aria-label="Close dialog"
          title="Close"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="barrier-icon">{icon}</div>

        {/* Title */}
        <h2 id="barrier-title" className="barrier-title">
          {title}
        </h2>

        {/* Message */}
        <p className="barrier-message">{message}</p>

        {/* Description */}
        {description && (
          <p id="barrier-description" className="barrier-description">
            {description}
          </p>
        )}

        {/* Danger notice */}
        {isDangerous && (
          <div className="barrier-danger-notice" role="status">
            ⚠️ This pattern indicates you should verify your response before use
          </div>
        )}

        {/* Options */}
        <div className="barrier-options">
          <p className="barrier-question">What will you do with this response?</p>

          {options.map((option) => (
            <label key={option.value} className="barrier-option-label">
              <input
                type="radio"
                name="barrier-option"
                value={option.value}
                checked={selectedValue === option.value}
                onChange={(e) => setSelectedValue(e.target.value)}
                disabled={isProcessing}
              />
              <div className="barrier-option-content">
                <div className="barrier-option-label-text">{option.label}</div>
                {option.description && (
                  <div className="barrier-option-description">
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="barrier-loading" role="status">
            <div className="spinner"></div>
            <span>Processing...</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="barrier-actions">
          <button
            className="barrier-btn barrier-btn-secondary"
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Cancel: Close dialog without making changes"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            className="barrier-btn barrier-btn-danger"
            onClick={handleConfirm}
            disabled={isProcessing || !selectedValue}
            aria-label={`Confirm: Proceed with selected action`}
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>

        {/* Accessibility: Screen reader instructions */}
        <div className="sr-only" role="region" aria-live="polite" aria-atomic="true">
          Pattern detected. Please select what you will do with this response and confirm.
        </div>
      </div>
    </div>
  );
};

export default Tier3HardBarrier;
