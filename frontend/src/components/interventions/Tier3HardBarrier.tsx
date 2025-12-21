/**
 * Tier 3: Reflection Prompt Component
 * Modal dialog for encouraging thoughtful AI interaction
 *
 * Purpose: Supportive intervention to enhance learning experience
 * Position: Modal (center, overlay, focus trap)
 * Color: Purple/Deep Blue (supportive, not alarming)
 * Interaction: Requires explicit user action
 * Critical Feature: Positive framing with user autonomy
 *
 * Example:
 * "💭 Let's Take a Quick Pause
 *
 *  You've been working hard! Let's make sure you're getting
 *  the most out of this conversation.
 *
 *  This is a great opportunity to:
 *  • Practice independent thinking
 *  • Verify key information
 *  • Build your expertise
 *
 *  Quick Reflection:
 *  1. Did the recent responses fully address your needs?
 *  2. Is there anything worth double-checking?
 *  3. Any parts you could try on your own?
 *
 *  [I'm Ready to Reflect ✨] [Continue for Now]"
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

  // Use default opportunities if not provided (reframed from "risks")
  const displayRisks = risks.length > 0 ? risks : [
    'Practice independent thinking',
    'Verify key information for accuracy',
    'Build your expertise step by step',
  ];

  // Use default reflection prompts if not provided (reframed from "suggestions")
  const displaySuggestions = suggestions.length > 0 ? suggestions : [
    'Did the recent responses fully address your needs?',
    'Is there anything worth double-checking?',
    'Any parts you could try on your own?',
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

          {/* Opportunities - reframed from "Potential Risks" */}
          <div className="barrier-section">
            <h4 className="barrier-section-title">This is a great opportunity to:</h4>
            <ul className="barrier-opportunities-list">
              {displayRisks.map((item, index) => (
                <li key={index} className="barrier-opportunity-item">
                  <span className="opportunity-bullet">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Reflection - reframed from "Suggestions" */}
          <div className="barrier-section">
            <h4 className="barrier-section-title">Quick Reflection:</h4>
            <ol className="barrier-reflection-list">
              {displaySuggestions.map((item, index) => (
                <li key={index} className="barrier-reflection-item">
                  {item}
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
            // New simplified mode with positive framing
            <>
              <button
                className="barrier-btn barrier-btn-primary"
                onClick={handlePauseAndReflect}
                disabled={isProcessing}
                aria-label="Take a moment to reflect"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  "I'm Ready to Reflect ✨"
                )}
              </button>
              <button
                className="barrier-btn barrier-btn-secondary"
                onClick={handleProceedAnyway}
                disabled={isProcessing}
                aria-label="Continue for now"
              >
                Continue for Now
              </button>
            </>
          )}
        </div>

        {/* Progress tracking notice - positive framing */}
        <div className="barrier-progress-notice">
          <span className="notice-icon">📊</span>
          Your learning progress is being tracked to help you grow
        </div>

        {/* Accessibility: Screen reader instructions */}
        <div className="sr-only" role="region" aria-live="polite" aria-atomic="true">
          Taking a moment to reflect can enhance your learning experience.
        </div>
      </div>
    </div>
  );
};

export default Tier3HardBarrier;
