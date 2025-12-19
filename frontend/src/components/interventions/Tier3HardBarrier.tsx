/**
 * Tier 3: Hard Barrier Component
 * Modal dialog for high-confidence Pattern F detection
 *
 * Purpose: Blocking intervention for serious learning pattern risks
 * Position: Modal (center, overlay, focus trap)
 * Color: Red (alert)
 * Interaction: Requires explicit user action
 * Critical Feature: "I understand the risk, continue" button for user autonomy
 *
 * Example:
 * "⚠️ Warning: Over-Reliance Risk Detected
 *
 *  You have not verified AI output for 4 consecutive interactions.
 *
 *  Potential Risks:
 *  • May have accepted incorrect information
 *  • Independent thinking ability may decline
 *  • Learning effectiveness may be affected
 *
 *  Suggestions:
 *  1. Pause current task
 *  2. Review the last 4 AI responses
 *  3. Try completing the next step independently
 *
 *  [Pause and Reflect] [I understand the risk, continue]
 *
 *  ⚠️ This warning has been logged to the system"
 */

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import './Tier3HardBarrier.css';

export interface BarrierOption {
  label: string;
  value: string;
  description?: string;
}

export interface Tier3HardBarrierProps {
  id: string;
  icon?: ReactNode;  // Support both string emoji and React components (e.g., Lucide icons)
  title: string;
  message: string;
  description?: string;
  consecutiveCount?: number; // Number of consecutive interactions without verification
  risks?: string[]; // List of potential risks
  suggestions?: string[]; // List of numbered suggestions
  options?: BarrierOption[]; // Legacy: radio button options
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
 * - Keyboard support (Escape to close not allowed - must make choice)
 * - Explicit user action required
 * - Red styling for high-risk patterns
 * - "I understand the risk, continue" option for autonomy (ethical design)
 * - Warning logged notice
 */
const Tier3HardBarrier: React.FC<Tier3HardBarrierProps> = ({
  id,
  icon = '⚠️',
  title,
  message,
  description,
  consecutiveCount,
  risks = [],
  suggestions = [],
  options,
  isLoading = false,
  onConfirm,
  onCancel,
  isDangerous = true,
}) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(
    options?.[0]?.value || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management: trap focus within modal (no Escape key allowed)
  useEffect(() => {
    // Auto-focus first focusable element
    const focusableElements = modalRef.current?.querySelectorAll(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Prevent scrolling on body
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePauseAndReflect = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm('reflect');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedAnyway = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm('override');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLegacyConfirm = async () => {
    if (!selectedValue || isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm(selectedValue);
    } finally {
      setIsProcessing(false);
    }
  };

  // Use default risks if not provided
  const displayRisks = risks.length > 0 ? risks : [
    'May have accepted incorrect information',
    'Independent thinking ability may decline',
    'Learning effectiveness may be affected',
  ];

  // Use default suggestions if not provided
  const displaySuggestions = suggestions.length > 0 ? suggestions : [
    'Pause current task',
    'Review recent AI responses',
    'Try completing the next step independently',
  ];

  return (
    <div className="tier3-barrier-backdrop" role="presentation">
      <div
        ref={modalRef}
        className={`tier3-hard-barrier ${isDangerous ? 'dangerous' : ''} ${
          isProcessing ? 'processing' : ''
        }`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="barrier-title"
        aria-describedby="barrier-description"
      >
        {/* Header */}
        <div className="barrier-header">
          <div className="barrier-icon">{icon}</div>
          <h2 id="barrier-title" className="barrier-title">
            {title}
          </h2>
        </div>

        {/* Divider */}
        <div className="barrier-divider"></div>

        {/* Message */}
        <div className="barrier-content">
          <p className="barrier-message">
            {consecutiveCount
              ? message.replace('{count}', String(consecutiveCount))
              : message}
          </p>

          {/* Potential Risks */}
          <div className="barrier-section">
            <h4 className="barrier-section-title">Potential Risks:</h4>
            <ul className="barrier-risks-list">
              {displayRisks.map((risk, index) => (
                <li key={index} className="barrier-risk-item">
                  <span className="risk-bullet">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="barrier-section">
            <h4 className="barrier-section-title">Suggestions:</h4>
            <ol className="barrier-suggestions-list">
              {displaySuggestions.map((suggestion, index) => (
                <li key={index} className="barrier-suggestion-item">
                  {suggestion}
                </li>
              ))}
            </ol>
          </div>

          {/* Legacy: Radio options (if provided) */}
          {options && options.length > 0 && (
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
          )}
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
          {options && options.length > 0 ? (
            // Legacy mode with radio options
            <>
              <button
                className="barrier-btn barrier-btn-secondary"
                onClick={onCancel}
                disabled={isProcessing}
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                className="barrier-btn barrier-btn-danger"
                onClick={handleLegacyConfirm}
                disabled={isProcessing || !selectedValue}
                aria-label="Confirm"
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
            </>
          ) : (
            // New simplified mode
            <>
              <button
                className="barrier-btn barrier-btn-primary"
                onClick={handlePauseAndReflect}
                disabled={isProcessing}
                aria-label="Pause and reflect on your work"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  'Pause and Reflect'
                )}
              </button>
              <button
                className="barrier-btn barrier-btn-danger-outline"
                onClick={handleProceedAnyway}
                disabled={isProcessing}
                aria-label="I understand the risk and want to continue"
              >
                I understand the risk, continue
              </button>
            </>
          )}
        </div>

        {/* Warning logged notice */}
        <div className="barrier-logged-notice">
          <span className="notice-icon">⚠️</span>
          This warning has been logged to the system
        </div>

        {/* Accessibility: Screen reader instructions */}
        <div className="sr-only" role="region" aria-live="polite" aria-atomic="true">
          Over-reliance risk detected. Please review the potential risks and suggestions before proceeding.
        </div>
      </div>
    </div>
  );
};

export default Tier3HardBarrier;
