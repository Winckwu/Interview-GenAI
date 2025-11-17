import React, { useState, useCallback, useMemo } from 'react';
import './SkillMonitoringDashboard.css';

/**
 * SkillMonitoringDashboard (MR16)
 *
 * Skill Degradation Prevention System
 * Based on interview findings:
 * - I38: Career crisis due to skill degradation from over-reliance on AI
 * - I12: Exam vs homework score gap (test performance without AI help)
 * - Other interviewees: Long-term skill maintenance issues
 *
 * Intervention Strategy:
 * - Early (10-20% decline): Gentle reminder with suggestions
 * - Mid (20-30% decline): Recommended practice tasks
 * - Severe (>30% decline): Modal blocking AI usage, force independent work
 */

// ============================================================================
// Types
// ============================================================================

type InterventionLevel = 'none' | 'early' | 'mid' | 'severe';
type SkillCategory = 'programming' | 'analysis' | 'writing' | 'math' | 'testing' | 'design';

interface SkillMetric {
  name: string;
  category: SkillCategory;
  baseline: number; // Historical best performance (0-10)
  current: number; // Current measured performance (0-10)
  lastMeasured: Date;
  trend: 'stable' | 'improving' | 'declining';
  measurements: Array<{
    date: Date;
    score: number;
  }>;
}

interface UsagePattern {
  withAI: number; // Percentage of time using AI help (0-100)
  independent: number; // Percentage of time working independently (0-100)
  lastMonthAverage: number;
  trend: 'increasing' | 'stable' | 'decreasing'; // AI usage trend
}

interface InterventionState {
  level: InterventionLevel;
  affectedSkills: string[]; // Skills triggering intervention
  message: string;
  recommendations: string[];
  requiredAction?: string;
}

interface SkillAssessmentTask {
  id: string;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  description: string;
  completed: boolean;
}

// ============================================================================
// Sub-component: SkillTrajectory
// ============================================================================

interface SkillTrajectoryProps {
  skill: SkillMetric;
  onClick?: () => void;
}

const SkillTrajectory: React.FC<SkillTrajectoryProps> = ({ skill, onClick }) => {
  const decline = ((skill.baseline - skill.current) / skill.baseline) * 100;
  const interventionLevel = determineInterventionLevel(decline);

  const getGaugeColor = (level: InterventionLevel): string => {
    const colors: Record<InterventionLevel, string> = {
      none: '#4CAF50',
      early: '#FFC107',
      mid: '#FF9800',
      severe: '#F44336',
    };
    return colors[level];
  };

  const getAlertIcon = (level: InterventionLevel): string => {
    const icons: Record<InterventionLevel, string> = {
      none: '✓',
      early: '⚠',
      mid: '⚠⚠',
      severe: '✕✕',
    };
    return icons[level];
  };

  // Create mini chart data
  const recentMeasurements = skill.measurements.slice(-6);
  const maxScore = Math.max(...recentMeasurements.map((m) => m.score), 10);
  const minScore = Math.min(...recentMeasurements.map((m) => m.score), 0);
  const range = maxScore - minScore || 1;

  return (
    <div
      className={`skill-trajectory skill-trajectory-${interventionLevel}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <div className="trajectory-header">
        <h4 className="trajectory-title">{skill.name}</h4>
        <span className={`trajectory-alert alert-${interventionLevel}`}>
          {getAlertIcon(interventionLevel)}
        </span>
      </div>

      <div className="trajectory-metrics">
        <div className="metric-item">
          <span className="metric-label">Baseline:</span>
          <span className="metric-value">{skill.baseline.toFixed(1)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Current:</span>
          <span className="metric-value" style={{ color: getGaugeColor(interventionLevel) }}>
            {skill.current.toFixed(1)}
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Decline:</span>
          <span className="metric-value decline-percent" style={{ color: getGaugeColor(interventionLevel) }}>
            {decline.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Mini trend chart */}
      <div className="trajectory-chart">
        <svg viewBox="0 0 240 60" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          <line x1="0" y1="15" x2="240" y2="15" stroke="#e0e0e0" strokeWidth="1" />
          <line x1="0" y1="30" x2="240" y2="30" stroke="#e0e0e0" strokeWidth="1" />
          <line x1="0" y1="45" x2="240" y2="45" stroke="#e0e0e0" strokeWidth="1" />

          {/* Baseline reference line */}
          <line
            x1="0"
            y1={55 - (skill.baseline / 10) * 40}
            x2="240"
            y2={55 - (skill.baseline / 10) * 40}
            stroke="#4CAF50"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />

          {/* Data points and line */}
          <polyline
            points={recentMeasurements
              .map((m, idx) => {
                const x = (idx / (recentMeasurements.length - 1)) * 240;
                const y = 55 - ((m.score - minScore) / range) * 40;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={getGaugeColor(interventionLevel)}
            strokeWidth="2"
          />

          {/* Current point */}
          {recentMeasurements.length > 0 && (
            <circle
              cx="240"
              cy={55 - ((skill.current - minScore) / range) * 40}
              r="3"
              fill={getGaugeColor(interventionLevel)}
            />
          )}
        </svg>
      </div>

      <div className="trajectory-footer">
        <span className="footer-trend">
          {skill.trend === 'declining' && '↓↓ Declining'}
          {skill.trend === 'stable' && '→ Stable'}
          {skill.trend === 'improving' && '↑↑ Improving'}
        </span>
        <span className="footer-date">Updated: {skill.lastMeasured.toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Sub-component: UsageAnalysis
// ============================================================================

interface UsageAnalysisProps {
  skill: string;
  pattern: UsagePattern;
}

const UsageAnalysis: React.FC<UsageAnalysisProps> = ({ skill, pattern }) => {
  return (
    <div className="usage-analysis">
      <h4 className="analysis-title">Usage Pattern: {skill}</h4>

      <div className="usage-breakdown">
        <div className="usage-item">
          <div className="usage-label">
            <span className="usage-label-text">AI-Assisted Work</span>
            <span className="usage-percentage">{pattern.withAI}%</span>
          </div>
          <div className="usage-bar-container">
            <div className="usage-bar" style={{ width: `${pattern.withAI}%`, background: '#FFC107' }} />
          </div>
          <span className="usage-trend">
            {pattern.trend === 'increasing' && '↑ Increasing'}
            {pattern.trend === 'stable' && '→ Stable'}
            {pattern.trend === 'decreasing' && '↓ Decreasing'}
          </span>
        </div>

        <div className="usage-item">
          <div className="usage-label">
            <span className="usage-label-text">Independent Work</span>
            <span className="usage-percentage">{pattern.independent}%</span>
          </div>
          <div className="usage-bar-container">
            <div className="usage-bar" style={{ width: `${pattern.independent}%`, background: '#4CAF50' }} />
          </div>
        </div>
      </div>

      <div className="usage-history">
        <h5>Monthly Average</h5>
        <div className="history-comparison">
          <span className="history-label">3 months ago:</span>
          <span className="history-value">{Math.round(pattern.lastMonthAverage + 20)}%</span>
          <span className="history-emoji">📈</span>
        </div>
        <div className="history-comparison">
          <span className="history-label">Now:</span>
          <span className="history-value history-alert">{pattern.withAI}%</span>
          <span className="history-emoji">⚠️</span>
        </div>
      </div>

      <div className="usage-recommendation">
        <strong>💡 Recommendation:</strong>
        <p>Complete at least one project this week without AI assistance</p>
      </div>
    </div>
  );
};

// ============================================================================
// Sub-component: CapabilityTest
// ============================================================================

interface CapabilityTestProps {
  skill: string;
  onTestStart?: () => void;
  onTestComplete?: (score: number) => void;
}

const CapabilityTest: React.FC<CapabilityTestProps> = ({ skill, onTestStart, onTestComplete }) => {
  const [testState, setTestState] = useState<'idle' | 'in-progress' | 'completed'>('idle');
  const [score, setScore] = useState<number | null>(null);

  const handleStartTest = useCallback(() => {
    setTestState('in-progress');
    onTestStart?.();
  }, [onTestStart]);

  const handleCompleteTest = useCallback(() => {
    // Simulate test scoring
    const simulatedScore = Math.random() * 10;
    setScore(simulatedScore);
    setTestState('completed');
    onTestComplete?.(simulatedScore);
  }, [onTestComplete]);

  return (
    <div className="capability-test">
      <h4 className="test-title">Quick Assessment: {skill}</h4>

      <div className="test-description">
        <p>Take a quick assessment to measure your current understanding without AI assistance</p>
      </div>

      {testState === 'idle' && (
        <div className="test-info">
          <div className="test-detail">
            <span className="detail-icon">⏱️</span>
            <span className="detail-text">Estimated: 5-10 minutes</span>
          </div>
          <div className="test-detail">
            <span className="detail-icon">📋</span>
            <span className="detail-text">5 practical questions</span>
          </div>
          <div className="test-detail">
            <span className="detail-icon">🎯</span>
            <span className="detail-text">Immediate feedback</span>
          </div>
          <button className="test-button test-button-primary" onClick={handleStartTest}>
            Start Assessment
          </button>
        </div>
      )}

      {testState === 'in-progress' && (
        <div className="test-progress">
          <div className="progress-indicator">
            <p>Assessment in progress...</p>
            <div className="spinner"></div>
          </div>
          <button className="test-button test-button-secondary" onClick={handleCompleteTest}>
            Finish Assessment
          </button>
        </div>
      )}

      {testState === 'completed' && score !== null && (
        <div className="test-results">
          <div className="results-score">
            <span className="score-number">{score.toFixed(1)}</span>
            <span className="score-label">/ 10.0</span>
          </div>
          <div className="results-interpretation">
            {score >= 8 && <p style={{ color: '#4CAF50' }}>✓ Great! Your skills are still strong</p>}
            {score >= 6 && score < 8 && (
              <p style={{ color: '#FF9800' }}>⚠ Good, but some areas need attention</p>
            )}
            {score >= 4 && score < 6 && (
              <p style={{ color: '#FF9800' }}>⚠ Significant degradation detected</p>
            )}
            {score < 4 && <p style={{ color: '#F44336' }}>✕ Critical skill loss - practice immediately</p>}
          </div>
          <button
            className="test-button test-button-primary"
            onClick={() => {
              setTestState('idle');
              setScore(null);
            }}
          >
            Take Another Assessment
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Intervention Modal Component
// ============================================================================

interface InterventionModalProps {
  intervention: InterventionState;
  isVisible: boolean;
  onDismiss?: () => void;
  onCompleteTask?: () => void;
}

const InterventionModal: React.FC<InterventionModalProps> = ({
  intervention,
  isVisible,
  onDismiss,
  onCompleteTask,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  const getSeverityColor = (level: InterventionLevel): string => {
    const colors: Record<InterventionLevel, string> = {
      none: '#4CAF50',
      early: '#FFC107',
      mid: '#FF9800',
      severe: '#F44336',
    };
    return colors[level];
  };

  const getSeverityTitle = (level: InterventionLevel): string => {
    const titles: Record<InterventionLevel, string> = {
      none: 'No Issues',
      early: 'Early Warning',
      mid: 'Skill Degradation Detected',
      severe: 'Critical Skill Loss - Action Required',
    };
    return titles[level];
  };

  const isDismissible = intervention.level !== 'severe';

  return (
    <div className={`intervention-overlay intervention-${intervention.level}`}>
      <div className={`intervention-modal intervention-modal-${intervention.level}`}>
        {/* Header */}
        <div className="modal-header" style={{ borderColor: getSeverityColor(intervention.level) }}>
          <div className="modal-title-container">
            <span className="modal-icon">
              {intervention.level === 'early' && '⚠'}
              {intervention.level === 'mid' && '⚠⚠'}
              {intervention.level === 'severe' && '✕✕'}
            </span>
            <h2 className="modal-title">{getSeverityTitle(intervention.level)}</h2>
          </div>
          {isDismissible && (
            <button className="modal-close" onClick={onDismiss} aria-label="Close">
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal-content">
          <p className="modal-message">{intervention.message}</p>

          <div className="affected-skills">
            <h4>Affected Skills:</h4>
            <ul className="skills-list">
              {intervention.affectedSkills.map((skill) => (
                <li key={skill} className="skill-item">
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div className="recommendations-section">
            <button
              className="recommendations-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '▼' : '▶'} Recommendations ({intervention.recommendations.length})
            </button>
            {showDetails && (
              <ul className="recommendations-list">
                {intervention.recommendations.map((rec, idx) => (
                  <li key={idx} className="recommendation-item">
                    {rec}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {intervention.requiredAction && (
            <div className="required-action">
              <strong>Required Action:</strong>
              <p>{intervention.requiredAction}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {intervention.level === 'severe' && (
            <>
              <p className="footer-warning">
                ⚠️ AI assistance is temporarily disabled until you complete an independent assessment
              </p>
              <button className="modal-button modal-button-primary" onClick={onCompleteTask}>
                Start Independent Assessment
              </button>
              <p className="footer-note">You cannot use AI until this is completed</p>
            </>
          )}
          {intervention.level === 'mid' && (
            <>
              <button
                className="modal-button modal-button-primary"
                onClick={onCompleteTask}
              >
                Accept & Start Practice
              </button>
              <button className="modal-button modal-button-secondary" onClick={onDismiss}>
                Dismiss
              </button>
            </>
          )}
          {intervention.level === 'early' && (
            <button className="modal-button modal-button-secondary" onClick={onDismiss}>
              Got it, thanks for the reminder
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

function determineInterventionLevel(declinePercent: number): InterventionLevel {
  if (declinePercent < 10) return 'none';
  if (declinePercent < 20) return 'early';
  if (declinePercent < 30) return 'mid';
  return 'severe';
}

function calculateInterventionState(skills: SkillMetric[]): InterventionState | null {
  const affectedSkills = skills.filter((s) => {
    const decline = ((s.baseline - s.current) / s.baseline) * 100;
    return decline > 10;
  });

  if (affectedSkills.length === 0) {
    return null;
  }

  const maxDecline = Math.max(
    ...affectedSkills.map((s) => ((s.baseline - s.current) / s.baseline) * 100)
  );
  const level = determineInterventionLevel(maxDecline);

  const messages: Record<InterventionLevel, string> = {
    none: 'Your skills are stable. Keep up the good work!',
    early: `Your ${affectedSkills[0].name} skill is declining slightly. Consider reviewing recent concepts.`,
    mid: `Significant decline detected in ${affectedSkills.map((s) => s.name).join(', ')}. Practice is recommended to prevent further loss.`,
    severe: `Critical skill degradation detected. Your ${affectedSkills[0].name} performance has dropped below acceptable levels. You must complete an independent assessment to regain AI assistance.`,
  };

  const recommendations: Record<InterventionLevel, string[]> = {
    none: ['Keep practicing regularly', 'Test your knowledge periodically'],
    early: [
      'Review fundamentals of the affected skill',
      'Spend 1-2 hours per week on independent practice',
      'Take a quick assessment to measure current level',
      'Reduce AI usage in this area to 30% or less',
    ],
    mid: [
      'Complete 3-5 practice problems independently',
      'Work on a mini-project without AI assistance',
      'Study for 2-3 hours focusing on weak areas',
      'Take a formal assessment',
      'Set a daily practice goal (at least 30 min)',
      'Pair with a mentor or study group',
    ],
    severe: [
      'Complete mandatory independent assessment NOW',
      'AI assistance is blocked until assessment passed',
      'Dedicate 1 hour daily to skill restoration',
      'Work through guided tutorial without AI',
      'Pair programming with experienced peer',
      'Document learning to prevent future degradation',
    ],
  };

  const requiredActions: Record<InterventionLevel, string | undefined> = {
    none: undefined,
    early: undefined,
    mid: 'Complete at least 3 practice problems this week',
    severe: 'Complete independent skill assessment and score ≥7/10 to re-enable AI',
  };

  return {
    level,
    affectedSkills: affectedSkills.map((s) => s.name),
    message: messages[level],
    recommendations: recommendations[level],
    requiredAction: requiredActions[level],
  };
}

// ============================================================================
// Main Component: SkillMonitoringDashboard
// ============================================================================

interface SkillMonitoringDashboardProps {
  /** Array of skills to monitor */
  skills: SkillMetric[];

  /** Usage patterns for each skill */
  usagePatterns: Record<string, UsagePattern>;

  /** Callback when intervention occurs */
  onIntervention?: (intervention: InterventionState) => void;

  /** Callback when task completed */
  onTaskComplete?: (skillName: string) => void;

  /** Whether to show severe intervention modal */
  showInterventionModal?: boolean;
}

export const SkillMonitoringDashboard: React.FC<SkillMonitoringDashboardProps> = ({
  skills,
  usagePatterns,
  onIntervention,
  onTaskComplete,
  showInterventionModal = true,
}) => {
  const [intervention, setIntervention] = useState<InterventionState | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Calculate intervention on mount and when skills change
  React.useEffect(() => {
    const newIntervention = calculateInterventionState(skills);
    setIntervention(newIntervention);

    if (newIntervention && showInterventionModal) {
      if (newIntervention.level === 'severe' || newIntervention.level === 'mid') {
        setModalVisible(true);
        onIntervention?.(newIntervention);
      }
    }
  }, [skills, showInterventionModal, onIntervention]);

  const healthScore = useMemo(() => {
    if (skills.length === 0) return 10;
    const avgDecline = skills.reduce((sum, s) => {
      const decline = ((s.baseline - s.current) / s.baseline) * 100;
      return sum + Math.max(0, decline);
    }, 0) / skills.length;
    return Math.max(0, 10 - avgDecline);
  }, [skills]);

  const handleTaskComplete = useCallback(() => {
    if (selectedSkill) {
      onTaskComplete?.(selectedSkill);
    }
    setModalVisible(false);
  }, [selectedSkill, onTaskComplete]);

  return (
    <div className="skill-monitoring-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">🎯 Skill Monitoring & Degradation Prevention</h2>
        <p className="dashboard-subtitle">
          Based on interview findings (I38, I12): Prevent skill loss from over-reliance on AI
        </p>
      </div>

      {/* Health Score Card */}
      <div className={`health-score-card health-score-${Math.round(healthScore)}`}>
        <div className="health-score-content">
          <h3 className="health-score-title">Overall Skill Health</h3>
          <div className="health-score-gauge">
            <svg viewBox="0 0 200 120" className="gauge-svg">
              {/* Gauge background arc */}
              <path
                d="M 30 100 A 70 70 0 0 1 170 100"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="12"
              />
              {/* Gauge fill arc */}
              <path
                d="M 30 100 A 70 70 0 0 1 170 100"
                fill="none"
                stroke={healthScore > 7 ? '#4CAF50' : healthScore > 5 ? '#FF9800' : '#F44336'}
                strokeWidth="12"
                strokeDasharray={`${(healthScore / 10) * 220}, 220`}
                strokeLinecap="round"
              />
              {/* Center text */}
              <text x="100" y="70" textAnchor="middle" className="gauge-text">
                {healthScore.toFixed(1)}
              </text>
              <text x="100" y="95" textAnchor="middle" className="gauge-label">
                / 10.0
              </text>
            </svg>
          </div>
        </div>

        <div className="health-status">
          {healthScore > 7 && <p className="status-good">✓ Skills are stable</p>}
          {healthScore > 5 && healthScore <= 7 && <p className="status-warning">⚠ Some degradation detected</p>}
          {healthScore <= 5 && <p className="status-critical">✕ Critical skill loss</p>}

          <div className="intervention-badge">
            {intervention && (
              <span className={`badge badge-${intervention.level}`}>
                {intervention.level === 'early' && '⚠ Early Warning'}
                {intervention.level === 'mid' && '⚠⚠ Degradation'}
                {intervention.level === 'severe' && '✕✕ Critical'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="skills-grid">
        <h3 className="section-title">Individual Skill Tracking</h3>
        {skills.map((skill) => (
          <div key={skill.name} className="skill-column">
            <SkillTrajectory
              skill={skill}
              onClick={() => setSelectedSkill(skill.name)}
            />

            {usagePatterns[skill.name] && (
              <UsageAnalysis
                skill={skill.name}
                pattern={usagePatterns[skill.name]}
              />
            )}

            <CapabilityTest
              skill={skill.name}
              onTestStart={() => console.log(`Assessment started for ${skill.name}`)}
              onTestComplete={(score) => {
                console.log(`Assessment completed for ${skill.name}: ${score}/10`);
              }}
            />
          </div>
        ))}
      </div>

      {/* Intervention Guidelines */}
      <div className="intervention-guidelines">
        <h3 className="section-title">Intervention Framework</h3>
        <div className="guidelines-grid">
          <div className="guideline-card guideline-early">
            <h4 className="guideline-title">⚠ Early Stage (10-20% decline)</h4>
            <div className="guideline-content">
              <p className="guideline-label">Status: Gentle Reminder</p>
              <ul className="guideline-actions">
                <li>Non-intrusive notification</li>
                <li>Suggestions for practice</li>
                <li>Optional quick assessment</li>
              </ul>
            </div>
          </div>

          <div className="guideline-card guideline-mid">
            <h4 className="guideline-title">⚠⚠ Mid Stage (20-30% decline)</h4>
            <div className="guideline-content">
              <p className="guideline-label">Status: Recommended Practice</p>
              <ul className="guideline-actions">
                <li>Modal alert with recommendations</li>
                <li>Suggested practice tasks</li>
                <li>Formal assessment request</li>
              </ul>
            </div>
          </div>

          <div className="guideline-card guideline-severe">
            <h4 className="guideline-title">✕✕ Severe (>30% decline)</h4>
            <div className="guideline-content">
              <p className="guideline-label">Status: Forced Intervention</p>
              <ul className="guideline-actions">
                <li>✕ AI assistance blocked</li>
                <li>Mandatory assessment required</li>
                <li>Independent skill restoration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="risk-analysis">
        <h3 className="section-title">Risk Analysis</h3>
        <div className="risk-content">
          <p className="risk-intro">
            Based on interview findings, students who over-rely on AI assistance show:
          </p>
          <div className="risk-factors">
            <div className="risk-factor">
              <span className="risk-icon">📊</span>
              <div className="risk-detail">
                <strong>I38 Career Crisis:</strong> Skills degradation leading to inability to perform without AI,
                causing career setbacks and confidence loss
              </div>
            </div>
            <div className="risk-factor">
              <span className="risk-icon">📝</span>
              <div className="risk-detail">
                <strong>I12 Exam vs Homework Gap:</strong> Test scores 30-40% lower than homework grades when AI
                assistance removed
              </div>
            </div>
            <div className="risk-factor">
              <span className="risk-icon">⏰</span>
              <div className="risk-detail">
                <strong>Long-term Impact:</strong> Skills atrophy becomes increasingly difficult to recover as time
                passes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Modal */}
      {intervention && (
        <InterventionModal
          intervention={intervention}
          isVisible={modalVisible && showInterventionModal}
          onDismiss={() => setModalVisible(false)}
          onCompleteTask={handleTaskComplete}
        />
      )}
    </div>
  );
};

export default SkillMonitoringDashboard;
