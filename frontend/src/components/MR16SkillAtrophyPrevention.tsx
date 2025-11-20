/**
 * MR16: Skill Atrophy Prevention System Component
 *
 * Monitor skill degradation over time and intervene before capabilities fade.
 * Evidence: 21/49 users (43%) worried about ability atrophy
 *
 * React 18 + TypeScript
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SkillBaseline,
  SkillUsageSession,
  SkillHealthProfile,
  SkillAtrophyWarning,
  MaintenancePlan,
  SkillCategory,
  calculateSkillHealthProfile,
  detectAtrophy,
  generateMaintenancePlan,
  updateMaintenancePlanProgress,
  getAtrophyMessage,
  getAtrophyColor,
  isAssessmentDue,
  acknowledgeAtrophyWarning
} from './MR16SkillAtrophyPrevention.utils';

interface MR16Props {
  userId: string;
  onWarningDetected?: (warning: SkillAtrophyWarning) => void;
  onMaintenancePlanGenerated?: (plan: MaintenancePlan) => void;
  onSkillAssessment?: (baseline: SkillBaseline) => void;
  onOpenMR17?: () => void;
  onOpenMR19?: () => void;
}

interface SkillTracking {
  baseline: SkillBaseline | null;
  sessions: SkillUsageSession[];
  profile: SkillHealthProfile | null;
  warning: SkillAtrophyWarning | null;
  maintenancePlan: MaintenancePlan | null;
}

const MR16SkillAtrophyPrevention: React.FC<MR16Props> = ({
  userId,
  onWarningDetected,
  onMaintenancePlanGenerated,
  onSkillAssessment,
  onOpenMR17,
  onOpenMR19
}) => {
  const [skills, setSkills] = useState<Map<string, SkillTracking>>(new Map());
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState<{
    category: SkillCategory;
    independenceRate: number;
    proficiencyScore: number;
  }>({
    category: 'coding',
    independenceRate: 0.75,
    proficiencyScore: 8
  });

  const [showSessionLogging, setShowSessionLogging] = useState(false);
  const [sessionForm, setSessionForm] = useState<{
    skillCategory: SkillCategory;
    tasksCompleted: number;
    independentlyCompleted: number;
    qualityRating: number;
  }>({
    skillCategory: 'coding',
    tasksCompleted: 1,
    independentlyCompleted: 1,
    qualityRating: 4
  });

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`mr16-skills-${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      const newSkills = new Map();
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        newSkills.set(key, {
          baseline: value.baseline,
          sessions: (value.sessions || []).map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp)
          })),
          profile: value.profile,
          warning: value.warning,
          maintenancePlan: value.maintenancePlan
        });
      });
      setSkills(newSkills);
    }
  }, [userId]);

  // Save to localStorage whenever skills change
  useEffect(() => {
    const toStore: Record<string, any> = {};
    skills.forEach((tracking, key) => {
      toStore[key] = tracking;
    });
    localStorage.setItem(`mr16-skills-${userId}`, JSON.stringify(toStore));
  }, [skills, userId]);

  // Handle baseline assessment
  const handleAssessment = useCallback(() => {
    const baseline: SkillBaseline = {
      skillId: `${assessmentForm.category}-${Date.now()}`,
      category: assessmentForm.category,
      timestamp: new Date(),
      independenceRate: assessmentForm.independenceRate,
      proficiencyScore: assessmentForm.proficiencyScore,
      taskCount: 0,
      notes: ''
    };

    const newTracking: SkillTracking = {
      baseline,
      sessions: [],
      profile: null,
      warning: null,
      maintenancePlan: null
    };

    setSkills(prev => new Map(prev).set(baseline.skillId, newTracking));
    setSelectedSkill(baseline.skillId);
    setShowAssessmentModal(false);
    onSkillAssessment?.(baseline);
  }, [assessmentForm, onSkillAssessment]);

  // Handle session logging
  const handleLogSession = useCallback(() => {
    if (!selectedSkill) return;

    const tracking = skills.get(selectedSkill);
    if (!tracking || !tracking.baseline) return;

    const newSession: SkillUsageSession = {
      sessionId: `session-${Date.now()}`,
      timestamp: new Date(),
      skillCategory: sessionForm.skillCategory,
      tasksCompleted: sessionForm.tasksCompleted,
      independentlyCompleted: sessionForm.independentlyCompleted,
      withAIAssistance: sessionForm.tasksCompleted - sessionForm.independentlyCompleted,
      qualityRating: sessionForm.qualityRating,
      timeSpent: 30 // default 30 minutes
    };

    const updatedSessions = [...tracking.sessions, newSession];
    const newProfile = calculateSkillHealthProfile(tracking.baseline, updatedSessions);
    const newWarning = detectAtrophy(newProfile);

    const updatedTracking: SkillTracking = {
      ...tracking,
      sessions: updatedSessions,
      profile: newProfile,
      warning: newWarning,
      maintenancePlan: tracking.maintenancePlan
    };

    setSkills(prev => new Map(prev).set(selectedSkill, updatedTracking));
    setShowSessionLogging(false);
    setSessionForm({
      skillCategory: 'coding',
      tasksCompleted: 1,
      independentlyCompleted: 1,
      qualityRating: 4
    });

    if (newWarning) {
      onWarningDetected?.(newWarning);
    }
  }, [selectedSkill, skills, sessionForm, onWarningDetected]);

  // Handle maintenance plan generation
  const handleGenerateMaintenancePlan = useCallback(() => {
    if (!selectedSkill) return;

    const tracking = skills.get(selectedSkill);
    if (!tracking) return;

    const plan = generateMaintenancePlan(tracking.baseline?.category || 'coding');

    const updatedTracking: SkillTracking = {
      ...tracking,
      maintenancePlan: plan
    };

    setSkills(prev => new Map(prev).set(selectedSkill, updatedTracking));
    onMaintenancePlanGenerated?.(plan);
  }, [selectedSkill, skills, onMaintenancePlanGenerated]);

  // Handle warning acknowledgment
  const handleAcknowledgeWarning = useCallback(() => {
    if (!selectedSkill) return;

    const tracking = skills.get(selectedSkill);
    if (!tracking || !tracking.warning) return;

    const updatedWarning = acknowledgeAtrophyWarning(tracking.warning);
    const updatedTracking: SkillTracking = {
      ...tracking,
      warning: updatedWarning
    };

    setSkills(prev => new Map(prev).set(selectedSkill, updatedTracking));
  }, [selectedSkill, skills]);

  // Get current tracking
  const currentTracking = selectedSkill ? skills.get(selectedSkill) : null;
  const showWarning = currentTracking?.warning && !currentTracking.warning.userAcknowledged;

  return (
    <div className="mr16-skill-atrophy-prevention">
      <div className="mr16-header">
        <h2>Skill Atrophy Prevention System</h2>
        <p>Monitor your skill independence and prevent degradation over time</p>
      </div>

      <div className="mr16-container">
        {/* Skills Overview */}
        <div className="mr16-section skills-overview">
          <div className="mr16-section-header">
            <h3>Your Skills</h3>
            <button
              className="mr16-button primary"
              onClick={() => setShowAssessmentModal(true)}
            >
              + Add Skill Baseline
            </button>
          </div>

          {skills.size === 0 ? (
            <div className="mr16-empty-state">
              <p>No skills tracked yet. Start by assessing a skill baseline.</p>
            </div>
          ) : (
            <div className="mr16-skills-grid">
              {Array.from(skills.entries()).map(([skillId, tracking]) => (
                <div
                  key={skillId}
                  className={`mr16-skill-card ${selectedSkill === skillId ? 'selected' : ''}`}
                  onClick={() => setSelectedSkill(skillId)}
                >
                  <div className="mr16-skill-header">
                    <h4>{tracking.baseline?.category || 'Unknown'}</h4>
                    {tracking.profile && (
                      <span
                        className="mr16-atrophy-badge"
                        style={{ backgroundColor: getAtrophyColor(tracking.profile.atrophyLevel) }}
                      >
                        {tracking.profile.atrophyLevel}
                      </span>
                    )}
                  </div>

                  {tracking.profile && (
                    <div className="mr16-skill-metrics">
                      <div className="mr16-metric">
                        <span className="label">Independence</span>
                        <div className="mr16-progress-bar">
                          <div
                            className="mr16-progress-fill"
                            style={{
                              width: `${Math.round(tracking.profile.currentIndependenceRate * 100)}%`,
                              backgroundColor: getAtrophyColor(tracking.profile.atrophyLevel)
                            }}
                          />
                        </div>
                        <span className="value">
                          {Math.round(tracking.profile.currentIndependenceRate * 100)}%
                        </span>
                      </div>

                      <div className="mr16-metric">
                        <span className="label">Baseline</span>
                        <span className="value">
                          {Math.round(tracking.profile.baselineIndependenceRate * 100)}%
                        </span>
                      </div>

                      <div className="mr16-metric">
                        <span className="label">Sessions</span>
                        <span className="value">{tracking.profile.sessionCount}</span>
                      </div>

                      {tracking.profile.rateOfChange !== 0 && (
                        <div className="mr16-metric">
                          <span className="label">Monthly Decline</span>
                          <span className="value" style={{ color: tracking.profile.rateOfChange > 0 ? '#f44336' : '#4caf50' }}>
                            {Math.round(Math.abs(tracking.profile.rateOfChange) * 10) / 10}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed View */}
        {currentTracking && (
          <>
            {/* Warning Banner */}
            {showWarning && currentTracking.warning && (
              <div
                className="mr16-section warning-banner"
                style={{
                  borderLeftColor: getAtrophyColor(currentTracking.warning.atrophyLevel)
                }}
              >
                <div className="mr16-warning-content">
                  <p className="mr16-warning-text">{currentTracking.warning.warning}</p>

                  {currentTracking.warning.suggestedActions.length > 0 && (
                    <div className="mr16-suggested-actions">
                      <h5>Suggested Actions:</h5>
                      <ul>
                        {currentTracking.warning.suggestedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentTracking.warning.resources.length > 0 && (
                    <div className="mr16-resources">
                      <h5>Recommended Resources:</h5>
                      <ul>
                        {currentTracking.warning.resources.map((resource, idx) => (
                          <li key={idx}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    className="mr16-button secondary"
                    onClick={handleAcknowledgeWarning}
                  >
                    I Understand
                  </button>
                </div>
              </div>
            )}

            {/* Skill Health Profile */}
            {currentTracking.profile && (
              <div className="mr16-section health-profile">
                <h3>Health Profile</h3>

                <div className="mr16-profile-grid">
                  <div className="mr16-profile-item">
                    <span className="label">Status</span>
                    <span
                      className="value status"
                      style={{ color: getAtrophyColor(currentTracking.profile.atrophyLevel) }}
                    >
                      {getAtrophyMessage(currentTracking.profile.atrophyLevel)}
                    </span>
                  </div>

                  <div className="mr16-profile-item">
                    <span className="label">Risk Score</span>
                    <div className="mr16-risk-gauge">
                      <div
                        className="mr16-risk-fill"
                        style={{
                          width: `${currentTracking.profile.riskScore}%`,
                          backgroundColor: getAtrophyColor(currentTracking.profile.atrophyLevel)
                        }}
                      />
                    </div>
                    <span className="value">{Math.round(currentTracking.profile.riskScore)}/100</span>
                  </div>

                  {currentTracking.profile.estimatedMonthsUntilCritical < 999 && (
                    <div className="mr16-profile-item">
                      <span className="label">Time to Critical (est.)</span>
                      <span className="value">
                        {Math.round(currentTracking.profile.estimatedMonthsUntilCritical)} months
                      </span>
                    </div>
                  )}

                  <div className="mr16-profile-item">
                    <span className="label">Tracked Since</span>
                    <span className="value">
                      {currentTracking.profile.monthsSinceBaseline.toFixed(1)} months
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Session History */}
            <div className="mr16-section session-history">
              <div className="mr16-section-header">
                <h3>Session History ({currentTracking.sessions.length})</h3>
                <button
                  className="mr16-button primary"
                  onClick={() => setShowSessionLogging(true)}
                >
                  + Log Session
                </button>
              </div>

              {currentTracking.sessions.length === 0 ? (
                <p className="mr16-empty-message">No sessions logged yet. Start tracking your skill usage.</p>
              ) : (
                <div className="mr16-sessions-list">
                  {currentTracking.sessions.slice(-10).reverse().map((session, idx) => (
                    <div key={idx} className="mr16-session-item">
                      <div className="mr16-session-header">
                        <span className="time">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </span>
                        <span className="category">{session.skillCategory}</span>
                      </div>
                      <div className="mr16-session-metrics">
                        <span>
                          {session.independentlyCompleted}/{session.tasksCompleted} independent
                        </span>
                        <span>Quality: {session.qualityRating}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maintenance Plan */}
            {!currentTracking.maintenancePlan && currentTracking.profile?.atrophyLevel !== 'healthy' && (
              <div className="mr16-section maintenance-prompt">
                <h3>Recovery Plan</h3>
                <p>
                  Your {currentTracking.baseline?.category} skills show signs of atrophy. A maintenance plan can help
                  restore your independence.
                </p>
                <button
                  className="mr16-button primary"
                  onClick={handleGenerateMaintenancePlan}
                >
                  Generate Maintenance Plan
                </button>
              </div>
            )}

            {currentTracking.maintenancePlan && (
              <div className="mr16-section maintenance-plan">
                <div className="mr16-section-header">
                  <h3>Maintenance Plan</h3>
                  <span className="mr16-progress-badge">
                    {currentTracking.maintenancePlan.progressPercentage}%
                  </span>
                </div>

                <div className="mr16-plan-info">
                  <p>Target: Restore to {Math.round(currentTracking.maintenancePlan.targetIndependenceRate * 100)}% independence</p>
                  <p>Frequency: {currentTracking.maintenancePlan.practiceFrequency}</p>
                </div>

                <div className="mr16-plan-progress">
                  <div className="mr16-progress-bar large">
                    <div
                      className="mr16-progress-fill"
                      style={{ width: `${currentTracking.maintenancePlan.progressPercentage}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {currentTracking.maintenancePlan.completedTasks}/{currentTracking.maintenancePlan.totalTasks} tasks
                  </span>
                </div>

                <div className="mr16-plan-tasks">
                  {currentTracking.maintenancePlan.suggestedTasks.map((task) => (
                    <div key={task.id} className="mr16-plan-task">
                      <div className="mr16-task-info">
                        <p className="task-description">{task.description}</p>
                        <div className="task-meta">
                          <span className={`difficulty ${task.difficulty}`}>{task.difficulty}</span>
                          <span className="time">~{task.estimatedMinutes} min</span>
                          {task.aiDisabled && <span className="ai-disabled">🚫 AI Disabled</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MR Integration: Recommend learning visualization after maintenance plan */}
            {onOpenMR17 && currentTracking.maintenancePlan && currentTracking.maintenancePlan.progressPercentage >= 50 && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #22c55e',
                borderRadius: '0.5rem',
                padding: '1rem',
                margin: '1.5rem 0',
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>
                  📊 Next Step: Visualize Your Learning Progress
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                  You've made great progress on your maintenance plan ({currentTracking.maintenancePlan.progressPercentage}%)! Track your skill development trajectory with detailed learning visualizations to see how far you've come.
                </p>
                <button
                  onClick={onOpenMR17}
                  style={{
                    backgroundColor: '#22c55e',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  title="Open Learning Process Visualization - See your skill growth over time"
                >
                  📊 Visualize Learning (MR17)
                </button>
              </div>
            )}
          </>
        )}

        {/* Assessment Modal */}
        {showAssessmentModal && (
          <div className="mr16-modal-overlay" onClick={() => setShowAssessmentModal(false)}>
            <div className="mr16-modal" onClick={e => e.stopPropagation()}>
              <h3>Assess Skill Baseline</h3>

              <div className="mr16-form-group">
                <label>Skill Category</label>
                <select
                  value={assessmentForm.category}
                  onChange={e => setAssessmentForm(prev => ({
                    ...prev,
                    category: e.target.value as SkillCategory
                  }))}
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

              <div className="mr16-form-group">
                <label>Independence Rate: {Math.round(assessmentForm.independenceRate * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={assessmentForm.independenceRate}
                  onChange={e => setAssessmentForm(prev => ({
                    ...prev,
                    independenceRate: parseFloat(e.target.value)
                  }))}
                />
                <small>What % of tasks can you complete independently?</small>
              </div>

              <div className="mr16-form-group">
                <label>Proficiency Score: {assessmentForm.proficiencyScore}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={assessmentForm.proficiencyScore}
                  onChange={e => setAssessmentForm(prev => ({
                    ...prev,
                    proficiencyScore: parseInt(e.target.value)
                  }))}
                />
              </div>

              <div className="mr16-modal-buttons">
                <button
                  className="mr16-button secondary"
                  onClick={() => setShowAssessmentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="mr16-button primary"
                  onClick={handleAssessment}
                >
                  Save Baseline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Logging Modal */}
        {showSessionLogging && (
          <div className="mr16-modal-overlay" onClick={() => setShowSessionLogging(false)}>
            <div className="mr16-modal" onClick={e => e.stopPropagation()}>
              <h3>Log Session</h3>

              <div className="mr16-form-group">
                <label>Tasks Completed</label>
                <input
                  type="number"
                  min="1"
                  value={sessionForm.tasksCompleted}
                  onChange={e => setSessionForm(prev => ({
                    ...prev,
                    tasksCompleted: parseInt(e.target.value) || 1
                  }))}
                />
              </div>

              <div className="mr16-form-group">
                <label>Completed Independently</label>
                <input
                  type="number"
                  min="0"
                  max={sessionForm.tasksCompleted}
                  value={sessionForm.independentlyCompleted}
                  onChange={e => setSessionForm(prev => ({
                    ...prev,
                    independentlyCompleted: Math.min(
                      parseInt(e.target.value) || 0,
                      prev.tasksCompleted
                    )
                  }))}
                />
              </div>

              <div className="mr16-form-group">
                <label>Quality Rating: {sessionForm.qualityRating}/5</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={sessionForm.qualityRating}
                  onChange={e => setSessionForm(prev => ({
                    ...prev,
                    qualityRating: parseInt(e.target.value)
                  }))}
                />
              </div>

              <div className="mr16-modal-buttons">
                <button
                  className="mr16-button secondary"
                  onClick={() => setShowSessionLogging(false)}
                >
                  Cancel
                </button>
                <button
                  className="mr16-button primary"
                  onClick={handleLogSession}
                >
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

export default MR16SkillAtrophyPrevention;
