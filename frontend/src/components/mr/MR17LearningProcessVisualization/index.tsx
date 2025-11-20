/**
 * MR17: Learning Process Visualization Component
 *
 * Visualize learning progress, knowledge growth, and capability development.
 * Evidence: Metacognitive visualization shows broad benefits
 * Designed for Pattern E (Teaching & Learning) users
 *
 * React 18 + TypeScript
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LearningSession,
  CapabilityTrajectory,
  MetacognitiveMetrics,
  LearningMilestone,
  buildKnowledgeGraph,
  calculateCapabilityTrajectories,
  calculateMetacognitiveMetrics,
  identifyLearningMilestones,
  getLearningFeedback
} from './utils';

interface MR17Props {
  userId: string;
  onMilestoneAchieved?: (milestone: LearningMilestone) => void;
  onSessionLogged?: (session: LearningSession) => void;
  onOpenMR19?: () => void;
  onOpenMR16?: () => void;
}

const MR17LearningProcessVisualization: React.FC<MR17Props> = ({
  userId,
  onMilestoneAchieved,
  onSessionLogged,
  onOpenMR19,
  onOpenMR16
}) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'knowledge' | 'metacognitive'>('overview');
  const [showSessionModal, setShowSessionModal] = useState(false);

  const [sessionForm, setSessionForm] = useState<Partial<LearningSession>>({
    taskType: 'coding',
    duration: 30,
    outputQuality: 4,
    conceptsIntroduced: 2,
    conceptsReinforced: 3,
    verificationPerformed: true,
    reflectionNotes: '',
    strategiesUsed: [],
    independenceScore: 75
  });

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`mr17-sessions-${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessions(parsed.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      })));
    }
  }, [userId]);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem(`mr17-sessions-${userId}`, JSON.stringify(sessions));
  }, [sessions, userId]);

  // Calculate analytics
  const knowledgeGraph = useMemo(() => buildKnowledgeGraph(sessions), [sessions]);
  const trajectories = useMemo(() => calculateCapabilityTrajectories(sessions), [sessions]);
  const metrics = useMemo(() => calculateMetacognitiveMetrics(sessions), [sessions]);
  const milestones = useMemo(() => identifyLearningMilestones(trajectories, sessions), [trajectories, sessions]);
  const feedback = useMemo(() => getLearningFeedback(metrics, trajectories, milestones), [metrics, trajectories, milestones]);

  // Handle session logging
  const handleLogSession = useCallback(() => {
    const session: LearningSession = {
      sessionId: `session-${Date.now()}`,
      timestamp: new Date(),
      taskType: sessionForm.taskType as any,
      duration: sessionForm.duration || 30,
      outputQuality: sessionForm.outputQuality || 3,
      conceptsIntroduced: sessionForm.conceptsIntroduced || 1,
      conceptsReinforced: sessionForm.conceptsReinforced || 1,
      verificationPerformed: sessionForm.verificationPerformed || false,
      reflectionNotes: sessionForm.reflectionNotes || '',
      strategiesUsed: sessionForm.strategiesUsed || [],
      independenceScore: sessionForm.independenceScore || 50
    };

    setSessions(prev => [...prev, session]);
    setShowSessionModal(false);
    onSessionLogged?.(session);

    // Reset form
    setSessionForm({
      taskType: 'coding',
      duration: 30,
      outputQuality: 4,
      conceptsIntroduced: 2,
      conceptsReinforced: 3,
      verificationPerformed: true,
      reflectionNotes: '',
      strategiesUsed: [],
      independenceScore: 75
    });
  }, [sessionForm, onSessionLogged]);

  return (
    <div className="mr17-learning-visualization">
      <div className="mr17-header">
        <h2>Learning Process Visualization</h2>
        <p>Track your knowledge growth and capability development</p>
      </div>

      <div className="mr17-container">
        {/* Learning Feedback */}
        {sessions.length > 0 && (
          <div className="mr17-feedback-banner">
            <p>{feedback}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mr17-nav-tabs">
          <button
            className={`mr17-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`mr17-tab ${activeTab === 'capabilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('capabilities')}
          >
            Capability Growth
          </button>
          <button
            className={`mr17-tab ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            Knowledge Graph
          </button>
          <button
            className={`mr17-tab ${activeTab === 'metacognitive' ? 'active' : ''}`}
            onClick={() => setActiveTab('metacognitive')}
          >
            Metacognitive Dashboard
          </button>
          <button
            className="mr17-button primary"
            onClick={() => setShowSessionModal(true)}
            style={{ marginLeft: 'auto' }}
          >
            + Log Session
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="mr17-tab-content">
            {sessions.length === 0 ? (
              <div className="mr17-empty-state">
                <p>No learning sessions logged yet. Start tracking your learning journey.</p>
                <button className="mr17-button primary" onClick={() => setShowSessionModal(true)}>
                  Log Your First Session
                </button>
              </div>
            ) : (
              <>
                {/* Learning Statistics */}
                <div className="mr17-section stats-grid">
                  <h3>Learning Statistics</h3>
                  <div className="mr17-stats">
                    <div className="mr17-stat">
                      <span className="label">Total Sessions</span>
                      <span className="value">{sessions.length}</span>
                    </div>
                    <div className="mr17-stat">
                      <span className="label">Total Practice Time</span>
                      <span className="value">{sessions.reduce((sum, s) => sum + s.duration, 0)} min</span>
                    </div>
                    <div className="mr17-stat">
                      <span className="label">Concepts Learned</span>
                      <span className="value">{knowledgeGraph.newConceptsIntroduced}</span>
                    </div>
                    <div className="mr17-stat">
                      <span className="label">Avg Output Quality</span>
                      <span className="value">
                        {(sessions.reduce((sum, s) => sum + s.outputQuality, 0) / sessions.length).toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                {milestones.length > 0 && (
                  <div className="mr17-section milestones">
                    <h3>🎉 Learning Milestones</h3>
                    <div className="mr17-milestones-list">
                      {milestones.slice(0, 5).map((milestone, idx) => (
                        <div key={idx} className={`mr17-milestone ${milestone.type}`}>
                          <div className="mr17-milestone-header">
                            <span className="type-badge">{milestone.type}</span>
                            <span className="impact-badge">{milestone.estimatedImpact}</span>
                          </div>
                          <p className="description">{milestone.description}</p>
                          <p className="improvement">{milestone.capabilityImprovement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Type Distribution */}
                <div className="mr17-section distribution">
                  <h3>Task Type Distribution</h3>
                  <div className="mr17-distribution-bars">
                    {getTaskTypeDistribution(sessions).map(({ type, count, percentage }) => (
                      <div key={type} className="mr17-distribution-bar">
                        <div className="label">{type}</div>
                        <div className="bar-container">
                          <div
                            className="bar-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="count">{count} ({Math.round(percentage)}%)</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="mr17-section recent">
                  <h3>Recent Sessions</h3>
                  <div className="mr17-sessions-timeline">
                    {sessions.slice(-10).reverse().map((session, idx) => (
                      <div key={idx} className="mr17-session-item">
                        <div className="mr17-session-time">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </div>
                        <div className="mr17-session-info">
                          <span className="task-type">{session.taskType}</span>
                          <span className="quality">Quality: {session.outputQuality}/5</span>
                          <span className="independence">Independence: {session.independenceScore}%</span>
                        </div>
                        {session.verificationPerformed && (
                          <span className="verification-badge">✓ Verified</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Capability Growth Tab */}
        {activeTab === 'capabilities' && (
          <div className="mr17-tab-content">
            {trajectories.length === 0 ? (
              <p className="mr17-empty-message">Log multiple sessions to see capability trends.</p>
            ) : (
              <div className="mr17-section trajectories">
                <h3>Capability Trajectories</h3>
                <div className="mr17-trajectories-grid">
                  {trajectories.map((trajectory, idx) => (
                    <div key={idx} className={`mr17-trajectory ${trajectory.trend}`}>
                      <div className="mr17-trajectory-header">
                        <span className="dimension">{trajectory.dimension}</span>
                        <span className="task-type">{trajectory.taskType}</span>
                      </div>

                      <div className="mr17-trajectory-values">
                        <div className="value-pair">
                          <span className="label">Baseline</span>
                          <span className="value">{Math.round(trajectory.baseline)}%</span>
                        </div>
                        <div className="value-pair">
                          <span className="label">Current</span>
                          <span className="value">{Math.round(trajectory.current)}%</span>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="mr17-trajectory-bar">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${trajectory.current}%`,
                            background: trajectory.trend === 'improving'
                              ? '#4caf50'
                              : trajectory.trend === 'declining'
                              ? '#f44336'
                              : '#2196f3'
                          }}
                        />
                      </div>

                      <div className="mr17-trajectory-footer">
                        <span className={`trend ${trajectory.trend}`}>
                          {trajectory.trend === 'improving' && '↑'}
                          {trajectory.trend === 'declining' && '↓'}
                          {trajectory.trend === 'stable' && '→'}
                          {' '}
                          {Math.round(trajectory.change)}%
                        </span>
                        <span className="velocity">
                          {Math.round(trajectory.velocity * 10) / 10}%/week
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Knowledge Graph Tab */}
        {activeTab === 'knowledge' && (
          <div className="mr17-tab-content">
            <div className="mr17-section knowledge">
              <h3>Knowledge Graph</h3>

              {knowledgeGraph.concepts.length === 0 ? (
                <p className="mr17-empty-message">Concepts will appear as you log learning sessions.</p>
              ) : (
                <>
                  <div className="mr17-knowledge-stats">
                    <div className="stat">
                      <span className="label">Concepts Learned</span>
                      <span className="value">{knowledgeGraph.newConceptsIntroduced}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Reinforced</span>
                      <span className="value">{knowledgeGraph.conceptsReinforced}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Avg Confidence</span>
                      <span className="value">{Math.round(knowledgeGraph.avgConceptConfidence * 100)}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Connections</span>
                      <span className="value">{knowledgeGraph.connections.length}</span>
                    </div>
                  </div>

                  {/* Concept Nodes by Depth */}
                  <div className="mr17-concepts-by-depth">
                    {(['basic', 'intermediate', 'advanced'] as const).map(depth => {
                      const concepts = knowledgeGraph.concepts.filter(c => c.depth === depth);
                      return (
                        <div key={depth} className="mr17-depth-group">
                          <h4>{depth.charAt(0).toUpperCase() + depth.slice(1)}</h4>
                          <div className="mr17-concept-nodes">
                            {concepts.map((concept, idx) => (
                              <div key={idx} className="mr17-concept-node">
                                <div className="concept-label">{concept.label}</div>
                                <div className="concept-confidence">
                                  <div
                                    className="confidence-bar"
                                    style={{
                                      width: `${concept.confidence * 100}%`,
                                      backgroundColor: concept.confidence > 0.7 ? '#4caf50' : '#ff9800'
                                    }}
                                  />
                                </div>
                                <div className="concept-meta">
                                  {Math.round(concept.confidence * 100)}% • {concept.connectionCount} connections
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Metacognitive Dashboard Tab */}
        {activeTab === 'metacognitive' && (
          <div className="mr17-tab-content">
            <div className="mr17-section metacognitive">
              <h3>Metacognitive Dashboard</h3>

              {sessions.length === 0 ? (
                <p className="mr17-empty-message">Log sessions to track your metacognitive metrics.</p>
              ) : (
                <div className="mr17-metrics-grid">
                  {/* Verification Rate */}
                  <div className="mr17-metric-card">
                    <h4>Verification Rate</h4>
                    <div className="mr17-metric-visualization">
                      <div className="mr17-circular-progress">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8" />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#2196f3"
                            strokeWidth="8"
                            strokeDasharray={`${metrics.verificationRate * 283} 283`}
                            style={{ strokeLinecap: 'round' }}
                          />
                        </svg>
                        <div className="progress-value">
                          {Math.round(metrics.verificationRate * 100)}%
                        </div>
                      </div>
                    </div>
                    <p className="metric-description">
                      {metrics.verificationRate > 0.6
                        ? 'Strong verification habit'
                        : metrics.verificationRate > 0.3
                        ? 'Moderate verification practice'
                        : 'Increase verification frequency'}
                    </p>
                  </div>

                  {/* Reflection Depth */}
                  <div className="mr17-metric-card">
                    <h4>Reflection Depth</h4>
                    <div className="mr17-metric-value-large">{metrics.reflectionDepth}/5</div>
                    <div className="mr17-reflection-bars">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="mr17-reflection-bar"
                            style={{
                              backgroundColor: i < metrics.reflectionDepth ? '#4caf50' : '#e0e0e0'
                            }}
                          />
                        ))}
                    </div>
                    <p className="metric-description">
                      {metrics.reflectionDepth >= 4
                        ? 'Deep metacognitive reflection'
                        : metrics.reflectionDepth >= 3
                        ? 'Solid reflection practice'
                        : 'Add more detailed reflection notes'}
                    </p>
                  </div>

                  {/* Strategy Diversity */}
                  <div className="mr17-metric-card">
                    <h4>Strategy Diversity</h4>
                    <div className="mr17-metric-visualization">
                      <div className="mr17-diversity-gauge">
                        <div className="gauge-label">Strategies Used: {metrics.strategyCount}</div>
                        <div className="gauge-bar">
                          <div
                            className="gauge-fill"
                            style={{ width: `${metrics.strategyDiversity * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="metric-description">
                      {metrics.strategyDiversity > 0.7
                        ? 'Excellent strategy variety'
                        : 'Explore more diverse approaches'}
                    </p>
                  </div>

                  {/* Learning Velocity */}
                  <div className="mr17-metric-card">
                    <h4>Learning Velocity</h4>
                    <div className="mr17-metric-value-large">
                      {Math.round(metrics.learningVelocity * 10) / 10}
                    </div>
                    <p className="metric-label">concepts/week</p>
                    <p className="metric-description">
                      {metrics.learningVelocity > 2
                        ? 'Rapid learning pace'
                        : metrics.learningVelocity > 0.5
                        ? 'Steady learning progress'
                        : 'Increase practice frequency'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MR Integration: Recommend capability assessment after milestones */}
        {onOpenMR19 && milestones.length >= 3 && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '0.5rem',
            padding: '1rem',
            margin: '1.5rem 0',
            maxWidth: '800px',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>
              🎯 Next Step: Assess Your Metacognitive Capabilities
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
              You've achieved {milestones.length} learning milestones! Now it's time to assess your metacognitive capabilities (planning, monitoring, evaluation, regulation) to understand your strengths and areas for growth.
            </p>
            <button
              onClick={onOpenMR19}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
              }}
              title="Open Metacognitive Capability Assessment - Understand your learning strengths"
            >
              🎯 Assess My Capabilities (MR19)
            </button>
          </div>
        )}

        {/* Session Logging Modal */}
        {showSessionModal && (
          <div className="mr17-modal-overlay" onClick={() => setShowSessionModal(false)}>
            <div className="mr17-modal" onClick={e => e.stopPropagation()}>
              <h3>Log Learning Session</h3>

              <div className="mr17-form-group">
                <label>Task Type</label>
                <select
                  value={sessionForm.taskType || 'coding'}
                  onChange={e => setSessionForm({ ...sessionForm, taskType: e.target.value as any })}
                >
                  <option value="coding">Coding</option>
                  <option value="writing">Writing</option>
                  <option value="analysis">Analysis</option>
                  <option value="design">Design</option>
                  <option value="math">Math</option>
                  <option value="research">Research</option>
                  <option value="creative">Creative</option>
                  <option value="planning">Planning</option>
                </select>
              </div>

              <div className="mr17-form-group">
                <label>Duration (minutes): {sessionForm.duration}</label>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={sessionForm.duration || 30}
                  onChange={e => setSessionForm({ ...sessionForm, duration: parseInt(e.target.value) })}
                />
              </div>

              <div className="mr17-form-group">
                <label>Output Quality: {sessionForm.outputQuality}/5</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={sessionForm.outputQuality || 3}
                  onChange={e => setSessionForm({ ...sessionForm, outputQuality: parseInt(e.target.value) })}
                />
              </div>

              <div className="mr17-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={sessionForm.verificationPerformed || false}
                    onChange={e => setSessionForm({ ...sessionForm, verificationPerformed: e.target.checked })}
                  />
                  I verified my work
                </label>
              </div>

              <div className="mr17-form-group">
                <label>Independence Score: {sessionForm.independenceScore}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={sessionForm.independenceScore || 50}
                  onChange={e => setSessionForm({ ...sessionForm, independenceScore: parseInt(e.target.value) })}
                />
              </div>

              <div className="mr17-form-group">
                <label>Reflection Notes</label>
                <textarea
                  placeholder="What did you learn? What was challenging? Any insights?"
                  value={sessionForm.reflectionNotes || ''}
                  onChange={e => setSessionForm({ ...sessionForm, reflectionNotes: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="mr17-modal-buttons">
                <button className="mr17-button secondary" onClick={() => setShowSessionModal(false)}>
                  Cancel
                </button>
                <button className="mr17-button primary" onClick={handleLogSession}>
                  Log Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Helper: Calculate task type distribution
 */
function getTaskTypeDistribution(sessions: LearningSession[]) {
  const distribution = new Map<string, number>();
  sessions.forEach(s => {
    distribution.set(s.taskType, (distribution.get(s.taskType) || 0) + 1);
  });

  const total = sessions.length;
  return Array.from(distribution.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / total) * 100
    }))
    .sort((a, b) => b.count - a.count);
}

export default MR17LearningProcessVisualization;
