/**
 * MR10: Cost-Benefit Decision Support
 *
 * Help users make explicit ROI calculations when deciding whether to use AI
 * assistance or complete tasks manually. Support Pattern C users who balance
 * efficiency with learning and quality concerns.
 *
 * User Evidence: 13/49 users (27%) - "implicit ROI calculation"
 *
 * Key Features:
 * 1. Predictive Analysis: Time savings, quality risk, learning opportunity cost
 * 2. Contextual Recommendations: Based on deadline, task type, risk
 * 3. Decision Logging: Record decisions and reflect on outcomes
 * 4. Strategy Guidance: Specific steps for hybrid approaches
 *
 * Design Principle:
 * - Make implicit tradeoffs explicit and visible
 * - Help users understand what they gain and lose with each option
 * - Build personal decision models through reflection
 */

import React, { useState, useCallback } from 'react';
import {
  CostBenefitAnalysis,
  DecisionLog,
  TaskType,
  TaskDeadline,
  TaskRiskLevel,
  AIUsageDecision,
  analyzeCostBenefit,
  createDecisionLog,
  updateDecisionOutcome,
  getROIMessage,
  getDecisionMessage,
  estimateLearningCost,
  getDeadlineGuidance,
  assessQualityRisk
} from './utils';
import './styles.css';

interface MR10Props {
  onDecisionMade?: (log: DecisionLog) => void;
  existingLogs?: DecisionLog[];
}

type TabType = 'analyze' | 'history' | 'patterns';

const MR10CostBenefitAnalysis: React.FC<MR10Props> = ({
  onDecisionMade,
  existingLogs = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('analyze');
  const [logs, setLogs] = useState<DecisionLog[]>(existingLogs);

  // Form states
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('production');
  const [deadline, setDeadline] = useState<TaskDeadline>('moderate');
  const [riskLevel, setRiskLevel] = useState<TaskRiskLevel>('medium');
  const [manualTime, setManualTime] = useState(60);
  const [complexity, setComplexity] = useState<1 | 2 | 3 | 4 | 5>(3);

  // Analysis and decision states
  const [analysis, setAnalysis] = useState<CostBenefitAnalysis | null>(null);
  const [userDecision, setUserDecision] = useState<AIUsageDecision | null>(null);
  const [decisionReasoning, setDecisionReasoning] = useState('');

  /**
   * Handle analyzing a task
   */
  const handleAnalyzeTask = useCallback(() => {
    if (!taskDescription.trim()) {
      alert('Please describe the task');
      return;
    }

    const result = analyzeCostBenefit(
      taskDescription,
      taskType,
      deadline,
      riskLevel,
      manualTime,
      complexity
    );

    setAnalysis(result);
    setUserDecision(null);
    setDecisionReasoning('');
  }, [taskDescription, taskType, deadline, riskLevel, manualTime, complexity]);

  /**
   * Handle making a decision
   */
  const handleMakeDecision = useCallback(() => {
    if (!analysis || !userDecision) {
      alert('Please select an option');
      return;
    }

    const log = createDecisionLog(
      taskDescription,
      analysis,
      userDecision,
      decisionReasoning
    );

    setLogs([...logs, log]);
    onDecisionMade?.(log);

    // Reset
    setTaskDescription('');
    setAnalysis(null);
    setUserDecision(null);
    setDecisionReasoning('');
  }, [analysis, userDecision, decisionReasoning, taskDescription, logs, onDecisionMade]);

  /**
   * Calculate decision statistics
   */
  const stats = {
    totalDecisions: logs.length,
    aiUsageCount: logs.filter(l => l.userDecision === 'use-ai').length,
    hybridCount: logs.filter(l => l.userDecision === 'hybrid').length,
    manualCount: logs.filter(l => l.userDecision === 'do-manually').length
  };

  /**
   * Find most common task type
   */
  const mostCommonType = logs.length > 0
    ? Object.entries(
        logs.reduce((acc, l) => ({ ...acc, [l.analysis.taskType]: (acc[l.analysis.taskType as TaskType] || 0) + 1 }), {} as Record<TaskType, number>)
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  /**
   * Handle rating a decision
   */
  const handleRateDecision = (logId: string, rating: string) => {
    // This could be expanded to store ratings and learn from patterns
    console.log(`Rated decision ${logId}: ${rating}`);
  };

  return (
    <div className="mr10-container">
      {/* Header */}
      <div className="mr10-header">
        <h1 className="mr10-title">Cost-Benefit Decision Support</h1>
        <p className="mr10-subtitle">
          Make informed decisions about using AI vs. manual completion
        </p>
      </div>

      {/* Tabs */}
      <div className="mr10-tabs">
        <button
          className={`mr10-tab ${activeTab === 'analyze' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyze')}
        >
          Analyze Task
        </button>
        <button
          className={`mr10-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Decision History ({logs.length})
        </button>
        <button
          className={`mr10-tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Your Patterns
        </button>
      </div>

      {/* Content */}
      <div className="mr10-content">
        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="mr10-analyze">
            {!analysis ? (
              <form className="mr10-form">
                <div className="mr10-form-group">
                  <label className="mr10-label">What task are you considering?</label>
                  <textarea
                    className="mr10-textarea"
                    placeholder="E.g., 'Write a technical blog post about React hooks'"
                    rows={3}
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                  />
                </div>

                <div className="mr10-form-row">
                  <div className="mr10-form-group">
                    <label className="mr10-label">Task Type</label>
                    <select
                      className="mr10-select"
                      value={taskType}
                      onChange={e => setTaskType(e.target.value as TaskType)}
                    >
                      <option value="learning">Learning Task</option>
                      <option value="production">Production Work</option>
                      <option value="exploration">Exploration</option>
                      <option value="problem-solving">Problem-Solving</option>
                    </select>
                  </div>

                  <div className="mr10-form-group">
                    <label className="mr10-label">Deadline</label>
                    <select
                      className="mr10-select"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value as TaskDeadline)}
                    >
                      <option value="tight">Tight (&lt;2 hours)</option>
                      <option value="moderate">Moderate (2-24 hours)</option>
                      <option value="relaxed">Relaxed (&gt;24 hours)</option>
                    </select>
                  </div>

                  <div className="mr10-form-group">
                    <label className="mr10-label">Risk Level</label>
                    <select
                      className="mr10-select"
                      value={riskLevel}
                      onChange={e => setRiskLevel(e.target.value as TaskRiskLevel)}
                    >
                      <option value="low">Low (AI usually correct)</option>
                      <option value="medium">Medium (Need some verification)</option>
                      <option value="high">High (Substantial verification needed)</option>
                    </select>
                  </div>
                </div>

                <div className="mr10-form-row">
                  <div className="mr10-form-group">
                    <label className="mr10-label">
                      Estimated Manual Time: {manualTime} minutes
                    </label>
                    <input
                      type="range"
                      className="mr10-slider"
                      min="15"
                      max="180"
                      value={manualTime}
                      onChange={e => setManualTime(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="mr10-form-group">
                    <label className="mr10-label">
                      Complexity: {complexity}/5
                    </label>
                    <div className="mr10-complexity-buttons">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          type="button"
                          className={`mr10-complexity-btn ${complexity === level ? 'active' : ''}`}
                          onClick={() => setComplexity(level as 1 | 2 | 3 | 4 | 5)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mr10-analyze-btn"
                  onClick={handleAnalyzeTask}
                >
                  Analyze This Task
                </button>
              </form>
            ) : (
              <div className="mr10-analysis-results">
                <div className="mr10-analysis-header">
                  <h3>Analysis Results</h3>
                  <button
                    className="mr10-back-btn"
                    onClick={() => setAnalysis(null)}
                  >
                    ← Back
                  </button>
                </div>

                {/* ROI Summary */}
                <div className="mr10-roi-summary">
                  <div className="mr10-roi-card main">
                    <div className="mr10-roi-label">Time Savings</div>
                    <div className="mr10-roi-value">
                      {analysis.timeSavingsPercent}%
                    </div>
                    <div className="mr10-roi-detail">
                      {analysis.manualTimeMinutes} min → {analysis.aiAssistedTimeMinutes} min
                    </div>
                  </div>

                  <div className="mr10-roi-card">
                    <div className="mr10-roi-label">Quality Risk</div>
                    <div className="mr10-roi-value">
                      {analysis.riskLevel === 'low'
                        ? '✓ Low'
                        : analysis.riskLevel === 'medium'
                          ? '⚠ Medium'
                          : '✗ High'}
                    </div>
                    <div className="mr10-roi-detail">
                      {analysis.riskLevel === 'low' ? 'Minimal verification needed' : 'Plan for verification time'}
                    </div>
                  </div>

                  <div className="mr10-roi-card">
                    <div className="mr10-roi-label">Learning Impact</div>
                    <div className="mr10-roi-value">
                      {analysis.taskType === 'learning' ? '📚 High' : '📘 Medium'}
                    </div>
                    <div className="mr10-roi-detail">
                      Skill development potential
                    </div>
                  </div>
                </div>

                {/* Key Messages */}
                <div className="mr10-messages">
                  <div className="mr10-message roi-message">
                    <strong>💰 ROI:</strong> {getROIMessage(analysis)}
                  </div>

                  <div className="mr10-message recommendation-message">
                    <strong>✅ Recommendation:</strong> {getDecisionMessage(analysis)}
                  </div>

                  {analysis.warnings.length > 0 && (
                    <div className="mr10-message warning-message">
                      <strong>⚠️ Warnings:</strong>
                      <ul>
                        {analysis.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Detailed Analysis */}
                <div className="mr10-detailed-analysis">
                  <div className="mr10-analysis-section">
                    <h4>📊 Quality Analysis</h4>
                    <p>{analysis.qualityRisk}</p>
                    <p className="mr10-verification-note">
                      Plan {analysis.verificationEffortMinutes} minutes for verification
                    </p>
                  </div>

                  <div className="mr10-analysis-section">
                    <h4>📚 Learning Opportunity</h4>
                    <p>{analysis.learningBenefit}</p>
                    {analysis.skillsDeveloped.length > 0 && (
                      <div className="mr10-skills">
                        <strong>Skills developed by doing this manually:</strong>
                        <ul>
                          {analysis.skillsDeveloped.map((skill, idx) => (
                            <li key={idx}>{skill}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mr10-analysis-section">
                    <h4>⏰ Deadline Context</h4>
                    <p>{getDeadlineGuidance(analysis.deadline)}</p>
                  </div>

                  <div className="mr10-analysis-section">
                    <h4>🎯 Suggested Strategy</h4>
                    <ol className="mr10-strategy-steps">
                      {analysis.suggestedStrategy.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Decision Form */}
                <div className="mr10-decision-form">
                  <h4>What's your decision?</h4>

                  <div className="mr10-decision-options">
                    <button
                      className={`mr10-decision-btn ${userDecision === 'use-ai' ? 'selected' : ''}`}
                      onClick={() => setUserDecision('use-ai')}
                    >
                      <div className="mr10-decision-icon">⚡</div>
                      <div className="mr10-decision-title">Use AI</div>
                      <div className="mr10-decision-desc">
                        Accept recommendation for AI assistance
                      </div>
                    </button>

                    <button
                      className={`mr10-decision-btn ${userDecision === 'hybrid' ? 'selected' : ''}`}
                      onClick={() => setUserDecision('hybrid')}
                    >
                      <div className="mr10-decision-icon">🔄</div>
                      <div className="mr10-decision-title">Hybrid</div>
                      <div className="mr10-decision-desc">
                        Mix of AI assistance and manual work
                      </div>
                    </button>

                    <button
                      className={`mr10-decision-btn ${userDecision === 'do-manually' ? 'selected' : ''}`}
                      onClick={() => setUserDecision('do-manually')}
                    >
                      <div className="mr10-decision-icon">✍️</div>
                      <div className="mr10-decision-title">Do Manually</div>
                      <div className="mr10-decision-desc">
                        Complete without AI assistance
                      </div>
                    </button>
                  </div>

                  <div className="mr10-form-group">
                    <label className="mr10-label">
                      Why are you choosing this option?
                    </label>
                    <textarea
                      className="mr10-textarea"
                      placeholder="Your reasoning helps you learn your decision patterns..."
                      rows={3}
                      value={decisionReasoning}
                      onChange={e => setDecisionReasoning(e.target.value)}
                    />
                  </div>

                  <button
                    className="mr10-submit-btn"
                    onClick={handleMakeDecision}
                    disabled={!userDecision}
                  >
                    Record This Decision
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="mr10-history">
            {logs.length === 0 ? (
              <div className="mr10-empty-state">
                <p>No decisions recorded yet. Analyze a task to get started.</p>
              </div>
            ) : (
              <div className="mr10-logs-list">
                {logs.map((log, idx) => (
                  <div key={log.id} className="mr10-log-card">
                    <div className="mr10-log-header">
                      <div>
                        <h4 className="mr10-log-task">{log.taskDescription}</h4>
                        <div className="mr10-log-meta">
                          <span className="mr10-log-date">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                          <span className="mr10-log-decision">
                            {log.userDecision === 'use-ai' && '⚡ Used AI'}
                            {log.userDecision === 'hybrid' && '🔄 Hybrid approach'}
                            {log.userDecision === 'do-manually' && '✍️ Done manually'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mr10-log-analysis">
                      <div className="mr10-log-stat">
                        <span className="mr10-log-stat-label">Time Savings:</span>
                        <span className="mr10-log-stat-value">
                          {log.analysis.timeSavingsPercent}%
                        </span>
                      </div>
                      <div className="mr10-log-stat">
                        <span className="mr10-log-stat-label">Risk:</span>
                        <span className="mr10-log-stat-value">
                          {log.analysis.riskLevel}
                        </span>
                      </div>
                      <div className="mr10-log-stat">
                        <span className="mr10-log-stat-label">Type:</span>
                        <span className="mr10-log-stat-value">
                          {log.analysis.taskType}
                        </span>
                      </div>
                    </div>

                    {log.decisionReasoning && (
                      <div className="mr10-log-reasoning">
                        <strong>Your reasoning:</strong>
                        <p>{log.decisionReasoning}</p>
                      </div>
                    )}

                    {log.actualOutcome && (
                      <div className="mr10-log-outcome">
                        <strong>Actual outcome:</strong>
                        <p>
                          {log.actualOutcome.qualityAssessment === 'above-expected'
                            ? '✅ Better than expected'
                            : log.actualOutcome.qualityAssessment === 'as-expected'
                              ? '✓ As expected'
                              : '⚠ Below expectations'}
                        </p>
                      </div>
                    )}

                    {!log.actualOutcome && (
                      <div className="mr10-log-reflection">
                        <p className="mr10-reflection-prompt">
                          How did this decision work out? 👇
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="mr10-patterns">
            <div className="mr10-patterns-grid">
              <div className="mr10-pattern-card">
                <div className="mr10-pattern-label">Total Decisions</div>
                <div className="mr10-pattern-value">{stats.totalDecisions}</div>
              </div>

              <div className="mr10-pattern-card">
                <div className="mr10-pattern-label">Used AI</div>
                <div className="mr10-pattern-value">
                  {stats.aiUsageCount}
                  <span className="mr10-pattern-percent">
                    {stats.totalDecisions > 0
                      ? Math.round((stats.aiUsageCount / stats.totalDecisions) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div className="mr10-pattern-card">
                <div className="mr10-pattern-label">Hybrid</div>
                <div className="mr10-pattern-value">
                  {stats.hybridCount}
                  <span className="mr10-pattern-percent">
                    {stats.totalDecisions > 0
                      ? Math.round((stats.hybridCount / stats.totalDecisions) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div className="mr10-pattern-card">
                <div className="mr10-pattern-label">Manual</div>
                <div className="mr10-pattern-value">
                  {stats.manualCount}
                  <span className="mr10-pattern-percent">
                    {stats.totalDecisions > 0
                      ? Math.round((stats.manualCount / stats.totalDecisions) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            {mostCommonType && (
              <div className="mr10-insights">
                <h3>Your Patterns</h3>
                <div className="mr10-insight-card">
                  <p>
                    <strong>Most common task type:</strong> {mostCommonType}
                  </p>
                  <p>
                    You tend to make decisions about {mostCommonType} tasks most
                    frequently. Your patterns in this area shape your AI usage strategy.
                  </p>
                </div>
              </div>
            )}

            {logs.length > 2 && (
              <div className="mr10-learning-insights">
                <h3>Learning from Your Decisions</h3>
                <div className="mr10-insight-list">
                  <div className="mr10-insight-item">
                    📊 You've made {stats.totalDecisions} deliberate decisions
                  </div>
                  <div className="mr10-insight-item">
                    🎯 Your decision distribution shows a preference for{' '}
                    {stats.hybridCount >= stats.aiUsageCount &&
                    stats.hybridCount >= stats.manualCount
                      ? 'balanced hybrid approaches'
                      : stats.aiUsageCount > stats.manualCount
                        ? 'AI assistance'
                        : 'manual work'}
                  </div>
                  <div className="mr10-insight-item">
                    💡 Keep reflections on outcomes to refine your decision-making
                    over time
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

export default MR10CostBenefitAnalysis;
