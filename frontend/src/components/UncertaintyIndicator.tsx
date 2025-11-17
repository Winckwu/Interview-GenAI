import React, { useState } from 'react';
import './UncertaintyIndicator.css';

/**
 * UncertaintyIndicator Component
 *
 * Based on strict model validation results:
 * - CV Stability: std 5.24-5.50% (±5.5pp accuracy)
 * - Mixed Pattern Handling: 80% low confidence assignment
 * - Pattern F Detection: 92% early warning capability
 *
 * Confidence Thresholds:
 * - > 0.85: Auto-classify (high confidence)
 * - 0.70-0.85: Suggest + light review
 * - < 0.70: Detailed review recommended
 */

interface UncertaintyIndicatorProps {
  /** The AI-generated content */
  content: string;

  /** Model confidence score (0-1) */
  confidence: number;

  /** Reasons why model is uncertain */
  uncertaintyReasons: string[];

  /** Task type: 'general' | 'medical' | 'legal' | 'financial' | 'academic' */
  taskType: 'general' | 'medical' | 'legal' | 'financial' | 'academic' | 'code';

  /** Optional: Additional metadata for monitoring */
  metadata?: {
    modelName?: string;
    timestamp?: Date;
    userId?: string;
    taskId?: string;
  };

  /** Optional: Feedback callback for monitoring */
  onFeedback?: (feedback: {
    contentId: string;
    userAccuracy: 'correct' | 'partial' | 'incorrect' | 'unknown';
    actualValue?: string;
  }) => void;
}

interface ConfidenceLevel {
  level: 'high' | 'medium' | 'low';
  percentage: number;
  action: string;
  color: string;
  icon: string;
}

/**
 * Maps confidence score to UI representation
 */
const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence > 0.85) {
    return {
      level: 'high',
      percentage: Math.round(confidence * 100),
      action: 'Auto-classify: Use with confidence',
      color: '#4CAF50', // Green
      icon: '✓',
    };
  } else if (confidence > 0.70) {
    return {
      level: 'medium',
      percentage: Math.round(confidence * 100),
      action: 'Suggested: Review recommended',
      color: '#FF9800', // Orange
      icon: '⚠',
    };
  } else {
    return {
      level: 'low',
      percentage: Math.round(confidence * 100),
      action: 'Detailed review needed',
      color: '#F44336', // Red
      icon: '!',
    };
  }
};

/**
 * High-risk domain list: Always show verification advice
 */
const HIGH_RISK_DOMAINS = ['medical', 'legal', 'financial'];

const UncertaintyIndicator: React.FC<UncertaintyIndicatorProps> = ({
  content,
  confidence,
  uncertaintyReasons,
  taskType,
  metadata,
  onFeedback,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userFeedback, setUserFeedback] = useState<'correct' | 'partial' | 'incorrect' | null>(null);

  const confidenceLevel = getConfidenceLevel(confidence);
  const isHighRisk = HIGH_RISK_DOMAINS.includes(taskType);

  // Force expanded view for high-risk domains with low confidence
  const shouldAlwaysExpand = isHighRisk && confidenceLevel.level === 'low';

  const handleFeedback = (feedback: 'correct' | 'partial' | 'incorrect') => {
    setUserFeedback(feedback);
    if (onFeedback) {
      onFeedback({
        contentId: metadata?.taskId || `task_${Date.now()}`,
        userAccuracy: feedback,
      });
    }
    // Auto-hide feedback buttons after 2 seconds
    setTimeout(() => {
      setUserFeedback(null);
    }, 2000);
  };

  return (
    <div className="uncertainty-container">
      {/* Main Content */}
      <div className="uncertainty-content">
        <span className="content-text">{content}</span>
      </div>

      {/* Uncertainty Indicator Badge */}
      <div
        className={`uncertainty-badge ${confidenceLevel.level} ${isExpanded ? 'expanded' : ''}`}
        style={{
          borderColor: confidenceLevel.color,
          backgroundColor: `${confidenceLevel.color}15`, // Light background
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`Confidence: ${confidenceLevel.percentage}%. ${confidenceLevel.action}`}
      >
        {/* Confidence Icon and Percentage */}
        <div className="confidence-header">
          <span
            className="confidence-icon"
            style={{ color: confidenceLevel.color, fontSize: '18px' }}
          >
            {confidenceLevel.icon}
          </span>
          <span
            className="confidence-percentage"
            style={{ color: confidenceLevel.color, fontWeight: 'bold' }}
          >
            {confidenceLevel.percentage}%
          </span>
          <span
            className="confidence-label"
            style={{ color: confidenceLevel.color, fontSize: '12px', marginLeft: '4px' }}
          >
            {confidenceLevel.level.toUpperCase()}
          </span>

          {/* High-Risk Domain Badge */}
          {isHighRisk && (
            <span className="high-risk-badge" title="High-risk domain: Medical, Legal, or Financial">
              ⚠ {taskType.toUpperCase()}
            </span>
          )}

          {/* Expand/Collapse Indicator */}
          <span className="expand-indicator" style={{ marginLeft: 'auto' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>

        {/* Action Text */}
        <div className="confidence-action" style={{ color: confidenceLevel.color }}>
          {confidenceLevel.action}
        </div>

        {/* Expanded Details - Always shown for high-risk + low confidence */}
        {(isExpanded || shouldAlwaysExpand) && (
          <div className="uncertainty-details" role="region" aria-label="Uncertainty details">
            {/* Uncertainty Reasons */}
            {uncertaintyReasons && uncertaintyReasons.length > 0 && (
              <div className="reasons-section">
                <h4>Why might this be uncertain?</h4>
                <ul className="reasons-list">
                  {uncertaintyReasons.map((reason, index) => (
                    <li key={index} className="reason-item">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verification Advice for High-Risk Domains */}
            {isHighRisk && (
              <div className="verification-advice" style={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #FF9800' }}>
                <h4>⚠ Verification Required</h4>
                <p>
                  This is a <strong>{taskType}</strong> domain where accuracy is critical.
                  Please verify this information against authoritative sources before using it.
                </p>
                {taskType === 'medical' && (
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    <strong>Medical Disclaimer:</strong> This AI-generated content is not a substitute for professional medical advice. Always consult with a qualified healthcare provider.
                  </p>
                )}
                {taskType === 'legal' && (
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    <strong>Legal Disclaimer:</strong> This AI-generated content is not legal advice. Consult with a licensed attorney for legal matters.
                  </p>
                )}
                {taskType === 'financial' && (
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    <strong>Financial Disclaimer:</strong> This is not financial advice. Consult with a financial advisor before making investment decisions.
                  </p>
                )}
              </div>
            )}

            {/* Confidence Explanation */}
            <div className="confidence-explanation">
              <h4>Confidence Interpretation</h4>
              <div className="confidence-scale">
                <div className="scale-item high">
                  <span className="label">&gt; 85%</span>
                  <span className="description">High confidence: Generally reliable</span>
                </div>
                <div className="scale-item medium">
                  <span className="label">70-85%</span>
                  <span className="description">Medium confidence: Review recommended</span>
                </div>
                <div className="scale-item low">
                  <span className="label">&lt; 70%</span>
                  <span className="description">Low confidence: Detailed review needed</span>
                </div>
              </div>
              <p className="confidence-note">
                This confidence score is based on model stability testing (±5.5pp accuracy variance).
              </p>
            </div>

            {/* User Feedback Section */}
            <div className="feedback-section">
              <h4>Is this information accurate?</h4>
              <div className="feedback-buttons">
                <button
                  className={`feedback-btn ${userFeedback === 'correct' ? 'active' : ''}`}
                  onClick={() => handleFeedback('correct')}
                  title="Information was correct"
                >
                  ✓ Correct
                </button>
                <button
                  className={`feedback-btn ${userFeedback === 'partial' ? 'active' : ''}`}
                  onClick={() => handleFeedback('partial')}
                  title="Information was partially correct"
                >
                  ◐ Partial
                </button>
                <button
                  className={`feedback-btn ${userFeedback === 'incorrect' ? 'active' : ''}`}
                  onClick={() => handleFeedback('incorrect')}
                  title="Information was incorrect"
                >
                  ✗ Incorrect
                </button>
              </div>
              {userFeedback && (
                <p className="feedback-thanks">
                  Thanks for your feedback! This helps improve model accuracy.
                </p>
              )}
            </div>

            {/* Monitoring Metrics Display (Optional) */}
            {metadata && (
              <div className="monitoring-info">
                <p className="info-text">
                  {metadata.modelName && `Model: ${metadata.modelName} | `}
                  {metadata.timestamp && `Generated: ${metadata.timestamp.toLocaleString()} | `}
                  {metadata.taskId && `Task ID: ${metadata.taskId}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confidence Indicator Bar (always visible) */}
      <div className="confidence-bar-container">
        <div
          className="confidence-bar-fill"
          style={{
            width: `${confidence * 100}%`,
            backgroundColor: confidenceLevel.color,
          }}
          role="progressbar"
          aria-valuenow={Math.round(confidence * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${Math.round(confidence * 100)}%`}
        />
      </div>
    </div>
  );
};

export default UncertaintyIndicator;
