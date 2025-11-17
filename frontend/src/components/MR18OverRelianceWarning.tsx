/**
 * MR18: Over-Reliance Warning System
 *
 * Detect and intervene in Pattern F behaviors (uncritical over-reliance on AI).
 * Monitor for: uncritical acceptance, passive querying, lack of awareness
 *
 * User Evidence: Pattern F prevention (6% of users at risk)
 *
 * Key Features:
 * 1. Behavior Tracking: Monitor verification, iteration, prompt quality, awareness
 * 2. Indicator Detection: Identify 5 over-reliance patterns
 * 3. Warning System: Graduated intervention (gentle → urgent)
 * 4. Specific Metrics: Show concrete data about problematic behaviors
 * 5. Action Plan: Suggest specific, actionable improvements
 * 6. Resource Links: Connect to other MRs for skill building
 * 7. Progress Tracking: Monitor improvement over time
 *
 * Design Principle:
 * - Detect Pattern F early before skill atrophy
 * - Be non-judgmental but clear about risks
 * - Provide specific, actionable guidance
 * - Celebrate improvements and corrective actions
 */

import React, { useState, useCallback } from 'react';
import {
  UsageSession,
  UserBehaviorProfile,
  OverRelianceWarning,
  analyzeUserBehavior,
  detectOverRelianceIndicators,
  generateOverRelianceWarning,
  getWarningMessage,
  getWarningColor,
  acknowledgeWarning,
  checkCorrectiveAction
} from './MR18OverRelianceWarning.utils';
import './MR18OverRelianceWarning.css';

interface MR18Props {
  onWarningDetected?: (warning: OverRelianceWarning) => void;
  existingSessions?: UsageSession[];
  existingWarnings?: OverRelianceWarning[];
}

type TabType = 'behavior' | 'warnings' | 'resources' | 'progress';

const MR18OverRelianceWarning: React.FC<MR18Props> = ({
  onWarningDetected,
  existingSessions = [],
  existingWarnings = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('behavior');
  const [sessions, setSessions] = useState<UsageSession[]>(existingSessions);
  const [warnings, setWarnings] = useState<OverRelianceWarning[]>(existingWarnings);

  // Form states for logging a session
  const [promptText, setPromptText] = useState('');
  const [responseAccepted, setResponseAccepted] = useState(true);
  const [wasVerified, setWasVerified] = useState(false);
  const [wasIteratedOn, setWasIteratedOn] = useState(false);
  const [askedFollowUpQuestions, setAskedFollowUpQuestions] = useState(false);

  // Analyze behavior
  const profile = analyzeUserBehavior(sessions);
  const indicators = detectOverRelianceIndicators(profile);
  const currentWarning =
    indicators.length > 0
      ? generateOverRelianceWarning(profile, indicators)
      : null;

  /**
   * Log a new session
   */
  const handleLogSession = useCallback(() => {
    if (!promptText.trim()) {
      alert('Please provide a prompt');
      return;
    }

    const newSession: UsageSession = {
      sessionId: `session-${Date.now()}`,
      timestamp: new Date(),
      promptLength: promptText.split(/\s+/).length,
      promptText,
      responseAccepted,
      wasVerified,
      wasIteratedOn,
      userAskedFollowUpQuestions: askedFollowUpQuestions
    };

    setSessions([...sessions, newSession]);

    // Check if warning should be triggered
    const newProfile = analyzeUserBehavior([...sessions, newSession]);
    const newIndicators = detectOverRelianceIndicators(newProfile);

    if (newIndicators.length > 0) {
      const newWarning = generateOverRelianceWarning(newProfile, newIndicators);
      setWarnings([...warnings, newWarning]);
      onWarningDetected?.(newWarning);
    }

    // Reset form
    setPromptText('');
    setResponseAccepted(true);
    setWasVerified(false);
    setWasIteratedOn(false);
    setAskedFollowUpQuestions(false);
  }, [
    promptText,
    responseAccepted,
    wasVerified,
    wasIteratedOn,
    askedFollowUpQuestions,
    sessions,
    warnings,
    onWarningDetected
  ]);

  /**
   * Acknowledge a warning
   */
  const handleAcknowledgeWarning = (warningId: string) => {
    setWarnings(
      warnings.map(w =>
        w.id === warningId ? acknowledgeWarning(w) : w
      )
    );
  };

  return (
    <div className="mr18-container">
      {/* Header */}
      <div className="mr18-header">
        <h1 className="mr18-title">Over-Reliance Warning System</h1>
        <p className="mr18-subtitle">
          Detect and prevent Pattern F (uncritical over-reliance)
        </p>
      </div>

      {/* Active Warning Banner */}
      {currentWarning && !currentWarning.userAcknowledged && (
        <div
          className={`mr18-active-warning ${currentWarning.interventionLevel}`}
          style={{
            borderLeftColor: getWarningColor(
              currentWarning.interventionLevel
            )
          }}
        >
          <div className="mr18-warning-icon">
            {currentWarning.interventionLevel === 'gentle' && '⚠️'}
            {currentWarning.interventionLevel === 'moderate' && '⚠️ ⚠️'}
            {currentWarning.interventionLevel === 'urgent' && '🚨 🚨'}
          </div>
          <div className="mr18-warning-content">
            <h3>Active Warning</h3>
            <p className="mr18-warning-message">
              {getWarningMessage(currentWarning.interventionLevel)}
            </p>
            <button
              className="mr18-acknowledge-btn"
              onClick={() => handleAcknowledgeWarning(currentWarning.id)}
            >
              I understand, let me improve
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mr18-tabs">
        <button
          className={`mr18-tab ${activeTab === 'behavior' ? 'active' : ''}`}
          onClick={() => setActiveTab('behavior')}
        >
          Behavior Tracking
        </button>
        <button
          className={`mr18-tab ${activeTab === 'warnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('warnings')}
        >
          Warnings ({warnings.length})
        </button>
        <button
          className={`mr18-tab ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
        <button
          className={`mr18-tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
      </div>

      {/* Content */}
      <div className="mr18-content">
        {/* Behavior Tracking Tab */}
        {activeTab === 'behavior' && (
          <div className="mr18-behavior">
            <div className="mr18-form-section">
              <h3>Log a Usage Session</h3>
              <div className="mr18-form">
                <div className="mr18-form-group">
                  <label className="mr18-label">What prompt did you give?</label>
                  <textarea
                    className="mr18-textarea"
                    placeholder="Paste your prompt here..."
                    rows={3}
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                  />
                  <div className="mr18-word-count">
                    {promptText.split(/\s+/).filter(w => w.length > 0).length} words
                    {promptText.split(/\s+/).filter(w => w.length > 0).length <
                    15 && (
                      <span className="mr18-warning-text">
                        (Recommended: 15+ words)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mr18-checkboxes">
                  <label className="mr18-checkbox">
                    <input
                      type="checkbox"
                      checked={responseAccepted}
                      onChange={e => setResponseAccepted(e.target.checked)}
                    />
                    <span>You accepted the AI response</span>
                  </label>

                  <label className="mr18-checkbox">
                    <input
                      type="checkbox"
                      checked={wasVerified}
                      onChange={e => setWasVerified(e.target.checked)}
                    />
                    <span>You verified the response</span>
                  </label>

                  <label className="mr18-checkbox">
                    <input
                      type="checkbox"
                      checked={wasIteratedOn}
                      onChange={e => setWasIteratedOn(e.target.checked)}
                    />
                    <span>You iterated or asked for improvements</span>
                  </label>

                  <label className="mr18-checkbox">
                    <input
                      type="checkbox"
                      checked={askedFollowUpQuestions}
                      onChange={e => setAskedFollowUpQuestions(e.target.checked)}
                    />
                    <span>You asked follow-up questions</span>
                  </label>
                </div>

                <button
                  className="mr18-log-btn"
                  onClick={handleLogSession}
                >
                  Log This Session
                </button>
              </div>
            </div>

            {/* Behavior Metrics */}
            {sessions.length > 0 && (
              <div className="mr18-metrics-section">
                <h3>Your Behavior Profile ({sessions.length} sessions)</h3>

                <div className="mr18-metrics-grid">
                  <div className="mr18-metric-card">
                    <div className="mr18-metric-label">Verification Rate</div>
                    <div className="mr18-metric-value">
                      {Math.round(profile.verificationRate * 100)}%
                    </div>
                    <div className="mr18-metric-bar">
                      <div
                        className="mr18-bar-fill"
                        style={{
                          width: `${profile.verificationRate * 100}%`,
                          backgroundColor:
                            profile.verificationRate > 0.5
                              ? '#4caf50'
                              : '#f44336'
                        }}
                      />
                    </div>
                    <div className="mr18-metric-target">Target: 50%+</div>
                  </div>

                  <div className="mr18-metric-card">
                    <div className="mr18-metric-label">Avg Prompt Length</div>
                    <div className="mr18-metric-value">
                      {Math.round(profile.avgPromptLength)} words
                    </div>
                    <div className="mr18-metric-bar">
                      <div
                        className="mr18-bar-fill"
                        style={{
                          width: `${Math.min(
                            (profile.avgPromptLength / 30) * 100,
                            100
                          )}%`,
                          backgroundColor:
                            profile.avgPromptLength > 15
                              ? '#4caf50'
                              : '#f44336'
                        }}
                      />
                    </div>
                    <div className="mr18-metric-target">Target: 15+ words</div>
                  </div>

                  <div className="mr18-metric-card">
                    <div className="mr18-metric-label">Iteration Rate</div>
                    <div className="mr18-metric-value">
                      {Math.round(profile.iterationRate * 100)}%
                    </div>
                    <div className="mr18-metric-bar">
                      <div
                        className="mr18-bar-fill"
                        style={{
                          width: `${profile.iterationRate * 100}%`,
                          backgroundColor:
                            profile.iterationRate > 0.25
                              ? '#4caf50'
                              : '#f44336'
                        }}
                      />
                    </div>
                    <div className="mr18-metric-target">Target: 25%+</div>
                  </div>

                  <div className="mr18-metric-card">
                    <div className="mr18-metric-label">Questions Asked</div>
                    <div className="mr18-metric-value">
                      {Math.round(profile.questionsAskedRate * 100)}%
                    </div>
                    <div className="mr18-metric-bar">
                      <div
                        className="mr18-bar-fill"
                        style={{
                          width: `${profile.questionsAskedRate * 100}%`,
                          backgroundColor:
                            profile.questionsAskedRate > 0.3
                              ? '#4caf50'
                              : '#f44336'
                        }}
                      />
                    </div>
                    <div className="mr18-metric-target">Target: 30%+</div>
                  </div>
                </div>

                {/* Current Indicators */}
                {indicators.length > 0 && (
                  <div className="mr18-indicators">
                    <h4>Detected Patterns</h4>
                    <div className="mr18-indicator-list">
                      {indicators.map(indicator => (
                        <div key={indicator} className="mr18-indicator">
                          {indicator === 'no-verification' && (
                            <>
                              <span className="mr18-indicator-icon">❌</span>
                              <span>Low verification rate</span>
                            </>
                          )}
                          {indicator === 'short-prompts' && (
                            <>
                              <span className="mr18-indicator-icon">✂️</span>
                              <span>Prompts too short</span>
                            </>
                          )}
                          {indicator === 'no-iteration' && (
                            <>
                              <span className="mr18-indicator-icon">🔄</span>
                              <span>Rarely iterates</span>
                            </>
                          )}
                          {indicator === 'passive-awareness' && (
                            <>
                              <span className="mr18-indicator-icon">❓</span>
                              <span>Doesn't ask follow-up questions</span>
                            </>
                          )}
                          {indicator === 'uncritical-acceptance' && (
                            <>
                              <span className="mr18-indicator-icon">⚠️</span>
                              <span>Accepts outputs without critique</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sessions.length === 0 && (
              <div className="mr18-empty-state">
                <p>Start logging sessions to track your behavior patterns</p>
              </div>
            )}
          </div>
        )}

        {/* Warnings Tab */}
        {activeTab === 'warnings' && (
          <div className="mr18-warnings">
            {warnings.length === 0 ? (
              <div className="mr18-empty-state">
                <p>No warnings detected. Keep up good practices!</p>
              </div>
            ) : (
              <div className="mr18-warnings-list">
                {warnings.map((warning, idx) => (
                  <div
                    key={warning.id}
                    className={`mr18-warning-card ${
                      warning.interventionLevel
                    }`}
                  >
                    <div className="mr18-warning-header">
                      <h4>
                        {warning.interventionLevel === 'gentle' && '⚠️ Gentle'}
                        {warning.interventionLevel === 'moderate' &&
                          '⚠️ ⚠️ Moderate'}
                        {warning.interventionLevel === 'urgent' &&
                          '🚨 🚨 Urgent'}
                      </h4>
                      <span className="mr18-warning-date">
                        {new Date(warning.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mr18-warning-metrics">
                      <span>
                        Unverified: {warning.metrics.unverifiedCount}
                      </span>
                      <span>
                        Avg Prompt: {warning.metrics.avgPromptLength} words
                      </span>
                      <span>
                        Iterations: {warning.metrics.iterationCount}
                      </span>
                    </div>

                    {warning.warnings.length > 0 && (
                      <div className="mr18-warning-details">
                        <h5>Specific Issues:</h5>
                        <ul>
                          {warning.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {warning.suggestedActions.length > 0 && (
                      <div className="mr18-suggested-actions">
                        <h5>Recommended Actions:</h5>
                        <ul>
                          {warning.suggestedActions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!warning.userAcknowledged && (
                      <button
                        className="mr18-acknowledge-inline"
                        onClick={() =>
                          handleAcknowledgeWarning(warning.id)
                        }
                      >
                        I acknowledge this warning
                      </button>
                    )}
                    {warning.userAcknowledged && (
                      <div className="mr18-acknowledged">
                        ✅ Acknowledged
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="mr18-resources">
            <div className="mr18-resource-grid">
              <div className="mr18-resource-card">
                <h4>Critical Thinking Scaffolding</h4>
                <p>
                  Learn systematic evaluation methods for AI outputs
                </p>
                <span className="mr18-resource-tag">MR12</span>
              </div>

              <div className="mr18-resource-card">
                <h4>Task Decomposition Scaffold</h4>
                <p>
                  Write better prompts by systematically breaking down your
                  needs
                </p>
                <span className="mr18-resource-tag">MR1</span>
              </div>

              <div className="mr18-resource-card">
                <h4>Low-Cost Iteration Mechanism</h4>
                <p>
                  Make iterating on AI responses easier and faster
                </p>
                <span className="mr18-resource-tag">MR5</span>
              </div>

              <div className="mr18-resource-card">
                <h4>Integrated Verification Tools</h4>
                <p>
                  One-click verification for code, math, citations, and facts
                </p>
                <span className="mr18-resource-tag">MR11</span>
              </div>

              <div className="mr18-resource-card">
                <h4>Metacognitive Strategy Guide</h4>
                <p>
                  16 proven strategies for effective AI collaboration
                </p>
                <span className="mr18-resource-tag">MR15</span>
              </div>

              <div className="mr18-resource-card">
                <h4>Guided Reflection Mechanism</h4>
                <p>
                  Reflect on your AI usage to deepen learning
                </p>
                <span className="mr18-resource-tag">MR14</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="mr18-progress">
            {sessions.length < 2 ? (
              <div className="mr18-empty-state">
                <p>Log more sessions to track progress</p>
              </div>
            ) : (
              <div>
                <h3>Progress Over Time</h3>
                <div className="mr18-progress-info">
                  <p>
                    Track improvements in your behavior metrics as you practice
                    better AI collaboration habits.
                  </p>
                </div>

                <div className="mr18-progress-metrics">
                  <div className="mr18-progress-item">
                    <h4>Verification Improvement</h4>
                    <p>
                      Starting: {Math.round(profile.verificationRate * 100)}%
                    </p>
                    <div className="mr18-progress-description">
                      {profile.verificationRate < 0.3 && '⚠️ Critical - prioritize verification'}
                      {profile.verificationRate >= 0.3 &&
                        profile.verificationRate < 0.5 &&
                        '⚠️ Below target - increase verification frequency'}
                      {profile.verificationRate >= 0.5 &&
                        '✅ On track - maintain or improve'}
                    </div>
                  </div>

                  <div className="mr18-progress-item">
                    <h4>Prompt Quality</h4>
                    <p>
                      Avg length: {Math.round(profile.avgPromptLength)} words
                    </p>
                    <div className="mr18-progress-description">
                      {profile.avgPromptLength < 10 && '❌ Write more detailed prompts'}
                      {profile.avgPromptLength >= 10 &&
                        profile.avgPromptLength < 15 &&
                        '⚠️ Getting better - aim for 15+'}
                      {profile.avgPromptLength >= 15 && '✅ Good prompt quality'}
                    </div>
                  </div>

                  <div className="mr18-progress-item">
                    <h4>Iteration Habits</h4>
                    <p>
                      Rate: {Math.round(profile.iterationRate * 100)}%
                    </p>
                    <div className="mr18-progress-description">
                      {profile.iterationRate < 0.1 && '❌ Rarely iterate - try more'}
                      {profile.iterationRate >= 0.1 &&
                        profile.iterationRate < 0.25 &&
                        '⚠️ Starting to iterate - keep going'}
                      {profile.iterationRate >= 0.25 && '✅ Healthy iteration rate'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MR18OverRelianceWarning;
