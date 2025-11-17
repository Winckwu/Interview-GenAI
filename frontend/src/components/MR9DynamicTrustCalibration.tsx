/**
 * MR9: Dynamic Trust Calibration - React Component
 *
 * Enables users to calibrate trust levels based on:
 * - Task type and characteristics
 * - Historical accuracy tracking
 * - Risk assessment
 * - Personalized patterns from user validation history
 *
 * Design Rationale (from 49 interviews, 84% of users):
 * - One-size-fits-all trust is dangerous (medical advice vs code syntax)
 * - Users need task-specific trust scores, not just confidence percentages
 * - Historical accuracy data helps users make informed decisions
 * - Learning from user's own validation patterns improves trust calibration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  calculateTrustScore,
  getRiskLevel,
  getVerificationStrategy,
  generateAccuracyHistory,
  TrustProfile,
  VerificationStrategy,
  TaskTypeAccuracy,
} from './MR9DynamicTrustCalibration.utils';
import './MR9DynamicTrustCalibration.css';

/**
 * Props for MR9 component
 */
interface MR9Props {
  taskType?: 'coding' | 'writing' | 'analysis' | 'creative' | 'research' | 'design' | 'planning' | 'review';
  aiConfidenceScore?: number; // 0-1 (from MR13)
  taskCriticality?: 'low' | 'medium' | 'high';
  taskFamiliarity?: 'familiar' | 'moderate' | 'unfamiliar';
  timePressure?: 'low' | 'medium' | 'high';
  aiOutput?: string;
  onTrustProfileUpdated?: (profile: TrustProfile) => void;
  onVerificationRecommended?: (strategy: VerificationStrategy) => void;
  userValidationHistory?: Array<{
    taskType: string;
    correct: boolean;
    timestamp: Date;
  }>;
}

/**
 * Validation feedback from user
 */
interface ValidationFeedback {
  isCorrect: boolean;
  taskType: string;
  notes?: string;
  timestamp: Date;
}

/**
 * MR9 Component: Dynamic Trust Calibration
 *
 * Shows contextual trust scores, risk levels, and verification strategies
 */
export const MR9DynamicTrustCalibration: React.FC<MR9Props> = ({
  taskType = 'coding',
  aiConfidenceScore = 0.7,
  taskCriticality = 'medium',
  taskFamiliarity = 'moderate',
  timePressure = 'medium',
  aiOutput = '',
  onTrustProfileUpdated,
  onVerificationRecommended,
  userValidationHistory = [],
}) => {
  // State management
  const [trustProfile, setTrustProfile] = useState<TrustProfile | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [verificationStrategy, setVerificationStrategy] = useState<VerificationStrategy | null>(null);
  const [historicalAccuracy, setHistoricalAccuracy] = useState<TaskTypeAccuracy[]>([]);
  const [userValidations, setUserValidations] = useState<ValidationFeedback[]>([]);
  const [selectedAccuracyPeriod, setSelectedAccuracyPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [showHistoricalPatterns, setShowHistoricalPatterns] = useState(false);

  // Calculate trust profile on mount and props change
  useEffect(() => {
    const profile = calculateTrustScore({
      taskType: taskType as any,
      aiConfidenceScore,
      taskCriticality: taskCriticality as any,
      taskFamiliarity: taskFamiliarity as any,
      timePressure: timePressure as any,
      userValidationHistory: userValidations.map(v => ({
        taskType: v.taskType,
        correct: v.isCorrect,
        timestamp: v.timestamp,
      })),
    });

    setTrustProfile(profile);
    onTrustProfileUpdated?.(profile);

    // Update risk level
    const risk = getRiskLevel(profile, taskCriticality as any);
    setRiskLevel(risk);

    // Get verification strategy
    const strategy = getVerificationStrategy({
      taskType: taskType as any,
      trustScore: profile.score,
      riskLevel: risk,
      taskCriticality: taskCriticality as any,
    });
    setVerificationStrategy(strategy);
    onVerificationRecommended?.(strategy);

    // Calculate historical accuracy
    const accuracy = generateAccuracyHistory(userValidations);
    setHistoricalAccuracy(accuracy);
  }, [
    taskType,
    aiConfidenceScore,
    taskCriticality,
    taskFamiliarity,
    timePressure,
    userValidations,
    onTrustProfileUpdated,
    onVerificationRecommended,
  ]);

  /**
   * Handle user validation feedback
   */
  const handleValidationFeedback = useCallback(
    (isCorrect: boolean, notes?: string) => {
      const feedback: ValidationFeedback = {
        isCorrect,
        taskType: taskType,
        notes,
        timestamp: new Date(),
      };

      setUserValidations(prev => [...prev, feedback]);
    },
    [taskType]
  );

  /**
   * Calculate confidence level description
   */
  const getConfidenceLabel = (score: number): string => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  /**
   * Render trust score with visual indicator
   */
  const renderTrustScore = () => {
    if (!trustProfile) return null;

    const score = trustProfile.score;
    const label = getConfidenceLabel(score);
    const stars = Math.round(score / 20);

    return (
      <div className="mr9-trust-score-panel">
        <div className="mr9-score-header">
          <h2 className="mr9-panel-title">Recommended Trust Level</h2>
          <p className="mr9-panel-subtitle">Based on task type, criticality, and your history</p>
        </div>

        <div className="mr9-score-display">
          <div className="mr9-score-circle">
            <div className="mr9-score-number">{score.toFixed(0)}%</div>
            <div className="mr9-score-label">{label}</div>
          </div>

          <div className="mr9-score-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`mr9-star ${i < stars ? 'mr9-star-filled' : 'mr9-star-empty'}`}
              >
                ⭐
              </span>
            ))}
          </div>
        </div>

        <div className="mr9-ai-confidence-comparison">
          <div className="mr9-comparison-item">
            <label className="mr9-comparison-label">AI Confidence Score (MR13)</label>
            <div className="mr9-comparison-bar">
              <div
                className="mr9-comparison-fill mr9-ai-fill"
                style={{ width: `${aiConfidenceScore * 100}%` }}
              />
              <span className="mr9-comparison-value">{(aiConfidenceScore * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="mr9-comparison-item">
            <label className="mr9-comparison-label">Your Trust Should Be</label>
            <div className="mr9-comparison-bar">
              <div className="mr9-comparison-fill mr9-trust-fill" style={{ width: `${score}%` }} />
              <span className="mr9-comparison-value">{score.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className={`mr9-risk-badge mr9-risk-${riskLevel}`}>
          <span className="mr9-risk-icon">⚠️</span>
          <span className="mr9-risk-text">Risk Level: {riskLevel.toUpperCase()}</span>
        </div>
      </div>
    );
  };

  /**
   * Render verification strategy
   */
  const renderVerificationStrategy = () => {
    if (!verificationStrategy) return null;

    return (
      <div className="mr9-verification-panel">
        <h3 className="mr9-section-title">Verification Strategy</h3>
        <p className="mr9-section-subtitle">Recommended approach for this task</p>

        <div className="mr9-strategy-content">
          <div className="mr9-strategy-item">
            <h4 className="mr9-strategy-label">Primary Check</h4>
            <p className="mr9-strategy-text">{verificationStrategy.primaryCheck}</p>
          </div>

          {verificationStrategy.secondaryChecks && verificationStrategy.secondaryChecks.length > 0 && (
            <div className="mr9-strategy-item">
              <h4 className="mr9-strategy-label">Additional Verification</h4>
              <ul className="mr9-strategy-list">
                {verificationStrategy.secondaryChecks.map((check, idx) => (
                  <li key={idx} className="mr9-strategy-list-item">
                    {check}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verificationStrategy.redFlags && verificationStrategy.redFlags.length > 0 && (
            <div className="mr9-strategy-item mr9-red-flags">
              <h4 className="mr9-strategy-label">⛔ Watch Out For</h4>
              <ul className="mr9-red-flags-list">
                {verificationStrategy.redFlags.map((flag, idx) => (
                  <li key={idx} className="mr9-red-flag-item">
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mr9-time-estimate">
          <span className="mr9-estimate-label">Estimated verification time:</span>
          <span className="mr9-estimate-value">{verificationStrategy.estimatedTime}</span>
        </div>
      </div>
    );
  };

  /**
   * Render historical accuracy
   */
  const renderHistoricalAccuracy = () => {
    if (historicalAccuracy.length === 0) {
      return (
        <div className="mr9-accuracy-panel">
          <h3 className="mr9-section-title">Historical Accuracy</h3>
          <p className="mr9-no-history">
            No historical data yet. Start validating AI outputs to build your personal accuracy profile.
          </p>
        </div>
      );
    }

    return (
      <div className="mr9-accuracy-panel">
        <div className="mr9-accuracy-header">
          <h3 className="mr9-section-title">Your Historical Accuracy by Task Type</h3>
          <div className="mr9-period-selector">
            {(['week', 'month', 'all'] as const).map(period => (
              <button
                key={period}
                className={`mr9-period-btn ${selectedAccuracyPeriod === period ? 'active' : ''}`}
                onClick={() => setSelectedAccuracyPeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mr9-accuracy-grid">
          {historicalAccuracy.map(item => (
            <div key={item.taskType} className="mr9-accuracy-card">
              <h4 className="mr9-accuracy-task-type">{item.taskType}</h4>
              <div className="mr9-accuracy-metrics">
                <div className="mr9-metric">
                  <span className="mr9-metric-label">Accuracy</span>
                  <span className="mr9-metric-value">{(item.accuracy * 100).toFixed(0)}%</span>
                </div>
                <div className="mr9-metric">
                  <span className="mr9-metric-label">Validated</span>
                  <span className="mr9-metric-value">{item.samplesValidated}</span>
                </div>
              </div>
              <div className="mr9-accuracy-bar">
                <div
                  className="mr9-accuracy-fill"
                  style={{ width: `${item.accuracy * 100}%` }}
                />
              </div>
              {item.trend && (
                <span className={`mr9-trend ${item.trend.direction}`}>
                  {item.trend.direction === 'up' ? '📈' : item.trend.direction === 'down' ? '📉' : '→'}
                  {item.trend.percentageChange.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render validation feedback section
   */
  const renderValidationFeedback = () => {
    return (
      <div className="mr9-validation-panel">
        <h3 className="mr9-section-title">Validate This Output</h3>
        <p className="mr9-section-subtitle">
          Your feedback helps calibrate future trust scores for similar tasks
        </p>

        <div className="mr9-validation-options">
          <button
            className="mr9-validation-btn mr9-validation-correct"
            onClick={() => handleValidationFeedback(true)}
          >
            ✅ This was correct
          </button>
          <button
            className="mr9-validation-btn mr9-validation-incorrect"
            onClick={() => handleValidationFeedback(false)}
          >
            ❌ This had errors
          </button>
        </div>

        {userValidations.length > 0 && (
          <div className="mr9-recent-validations">
            <h4 className="mr9-validations-title">Recent Feedback</h4>
            <div className="mr9-validations-list">
              {userValidations.slice(-5).map((val, idx) => (
                <div key={idx} className={`mr9-validation-item mr9-validation-${val.isCorrect ? 'correct' : 'error'}`}>
                  <span className="mr9-validation-icon">
                    {val.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="mr9-validation-type">{val.taskType}</span>
                  <span className="mr9-validation-time">
                    {val.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render detailed analysis toggle
   */
  const renderDetailedAnalysis = () => {
    if (!showDetailedAnalysis || !trustProfile) return null;

    return (
      <div className="mr9-detailed-analysis">
        <h3 className="mr9-section-title">Detailed Trust Calculation</h3>

        <div className="mr9-calculation-breakdown">
          <div className="mr9-factor">
            <h4 className="mr9-factor-name">Task Type Factor</h4>
            <p className="mr9-factor-value">{trustProfile.factors.taskTypeFactor.toFixed(1)}%</p>
            <p className="mr9-factor-description">
              Base trust for {taskType} tasks: {trustProfile.factors.taskTypeBaseScore}%
            </p>
          </div>

          <div className="mr9-factor">
            <h4 className="mr9-factor-name">Criticality Adjustment</h4>
            <p className="mr9-factor-value">{trustProfile.factors.criticalityAdjustment > 0 ? '+' : ''}{trustProfile.factors.criticalityAdjustment.toFixed(1)}%</p>
            <p className="mr9-factor-description">
              {taskCriticality} criticality: {trustProfile.factors.criticalityAdjustment > 0 ? 'increase caution' : 'reduce concern'}
            </p>
          </div>

          <div className="mr9-factor">
            <h4 className="mr9-factor-name">AI Confidence Factor</h4>
            <p className="mr9-factor-value">{trustProfile.factors.aiConfidenceFactor.toFixed(1)}%</p>
            <p className="mr9-factor-description">
              AI reports {(aiConfidenceScore * 100).toFixed(0)}% confidence
            </p>
          </div>

          <div className="mr9-factor">
            <h4 className="mr9-factor-name">User History Factor</h4>
            <p className="mr9-factor-value">{trustProfile.factors.userHistoryFactor.toFixed(1)}%</p>
            <p className="mr9-factor-description">
              Based on {userValidations.length} validations
            </p>
          </div>
        </div>

        <div className="mr9-calculation-formula">
          <p className="mr9-formula-label">Final Score Calculation:</p>
          <p className="mr9-formula">
            {trustProfile.factors.taskTypeFactor.toFixed(1)} + {trustProfile.factors.criticalityAdjustment.toFixed(1)} + {trustProfile.factors.aiConfidenceFactor.toFixed(1)} + {trustProfile.factors.userHistoryFactor.toFixed(1)} = <strong>{trustProfile.score.toFixed(1)}%</strong>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mr9-container">
      <div className="mr9-header">
        <h1 className="mr9-title">Dynamic Trust Calibration</h1>
        <p className="mr9-subtitle">
          AI confidence ≠ trustworthiness. Adjust your trust based on task type, criticality, and your validation history.
        </p>
      </div>

      <div className="mr9-layout">
        {/* Main content */}
        <div className="mr9-main-content">
          {renderTrustScore()}
          {renderVerificationStrategy()}
          {renderValidationFeedback()}

          {/* Toggle for detailed analysis */}
          <button
            className="mr9-toggle-btn"
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
          >
            {showDetailedAnalysis ? '▼ Hide' : '▶ Show'} Detailed Calculation
          </button>
          {renderDetailedAnalysis()}

          {/* Historical patterns */}
          <button
            className="mr9-toggle-btn"
            onClick={() => setShowHistoricalPatterns(!showHistoricalPatterns)}
          >
            {showHistoricalPatterns ? '▼ Hide' : '▶ Show'} Historical Patterns
          </button>
          {showHistoricalPatterns && renderHistoricalAccuracy()}
        </div>

        {/* Information panel */}
        <aside className="mr9-info-panel">
          <div className="mr9-info-card">
            <h3 className="mr9-info-title">Trust Guidelines</h3>
            <div className="mr9-guideline">
              <p className="mr9-guideline-label">80-100%</p>
              <p className="mr9-guideline-text">Spot-check only</p>
            </div>
            <div className="mr9-guideline">
              <p className="mr9-guideline-label">60-79%</p>
              <p className="mr9-guideline-text">Verify key points</p>
            </div>
            <div className="mr9-guideline">
              <p className="mr9-guideline-label">40-59%</p>
              <p className="mr9-guideline-text">Thorough review</p>
            </div>
            <div className="mr9-guideline">
              <p className="mr9-guideline-label">0-39%</p>
              <p className="mr9-guideline-text">Expert review required</p>
            </div>
          </div>

          {trustProfile && (
            <div className="mr9-info-card">
              <h3 className="mr9-info-title">Why This Score?</h3>
              <ul className="mr9-why-list">
                <li className="mr9-why-item">
                  <span className="mr9-why-icon">📋</span>
                  <span>Task: {taskType}</span>
                </li>
                <li className="mr9-why-item">
                  <span className="mr9-why-icon">⚡</span>
                  <span>Criticality: {taskCriticality}</span>
                </li>
                <li className="mr9-why-item">
                  <span className="mr9-why-icon">🎯</span>
                  <span>Your familiarity: {taskFamiliarity}</span>
                </li>
                <li className="mr9-why-item">
                  <span className="mr9-why-icon">⏱️</span>
                  <span>Time pressure: {timePressure}</span>
                </li>
                {userValidations.length > 0 && (
                  <li className="mr9-why-item">
                    <span className="mr9-why-icon">📊</span>
                    <span>{userValidations.length} validations tracked</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MR9DynamicTrustCalibration;
