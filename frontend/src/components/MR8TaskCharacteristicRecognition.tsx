/**
 * MR8: Task Characteristic Recognition Component
 *
 * Automatically detects task properties and recommends adaptive system behavior:
 * 1. Task criticality (low/medium/high importance)
 * 2. User familiarity with domain (familiar/moderate/unfamiliar)
 * 3. Time pressure (low/medium/high urgency)
 * 4. Task type/category (coding, writing, analysis, creative, research, etc.)
 * 5. Complexity level (simple, moderate, complex)
 *
 * Based on these characteristics, system adapts:
 * - AI intervention strength (MR3 integration)
 * - Verification requirements (MR11 integration)
 * - Iteration support level (MR5 integration)
 * - Trust calibration (MR9 integration)
 * - Strategy recommendations (MR15 integration)
 *
 * Evidence: 28/49 users (57%) dynamically adjust strategy based on task properties
 * Design principle: Detect context → Recommend adaptation → User approves
 */

import React, { useState, useCallback, useEffect } from 'react';
import './MR8TaskCharacteristicRecognition.css';
import {
  analyzeTaskCharacteristics,
  detectTaskType,
  estimateCriticality,
  estimateFamiliarity,
  estimateTimePressure,
  estimateComplexity,
  generateAdaptationRecommendations,
  calculateTaskProfile,
  type TaskCharacteristics,
  type TaskType,
  type AdaptationRecommendation
} from './MR8TaskCharacteristicRecognition.utils';

export type CriticalityLevel = 'low' | 'medium' | 'high';
export type FamiliarityLevel = 'familiar' | 'moderate' | 'unfamiliar';
export type TimePressureLevel = 'low' | 'medium' | 'high';

export interface TaskProfile {
  taskDescription: string;
  detectedType: TaskType;
  criticality: CriticalityLevel;
  familiarity: FamiliarityLevel;
  timePressure: TimePressureLevel;
  estimatedComplexity: number; // 1-10
  detectionConfidence: number; // 0-1
  recommendations: AdaptationRecommendation[];
  suggestedInterventionLevel: 'passive' | 'suggestive' | 'proactive';
  riskFactors: string[];
}

interface MR8Props {
  onTaskProfileDetected?: (profile: TaskProfile) => void;
  onAdaptationRecommended?: (recommendations: AdaptationRecommendation[]) => void;
  onUserApproval?: (profile: TaskProfile) => void;
  initialTask?: string;
  // NEW: Callbacks to open specific MR tools based on recommendations
  onOpenMR3?: () => void; // Agency control
  onOpenMR5?: () => void; // Iteration support
  onOpenMR9?: () => void; // Trust calibration
  onOpenMR11?: () => void; // Verification
  onOpenMR14?: () => void; // Reflection
  onOpenMR15?: () => void; // Strategy guide
}

export const MR8TaskCharacteristicRecognition: React.FC<MR8Props> = ({
  onTaskProfileDetected,
  onAdaptationRecommended,
  onUserApproval,
  initialTask = '',
  onOpenMR3,
  onOpenMR5,
  onOpenMR9,
  onOpenMR11,
  onOpenMR14,
  onOpenMR15
}) => {
  // State management
  const [taskDescription, setTaskDescription] = useState(initialTask);
  const [taskProfile, setTaskProfile] = useState<TaskProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userApprovals, setUserApprovals] = useState<Set<string>>(new Set());
  const [customAdjustments, setCustomAdjustments] = useState<Partial<TaskProfile>>({});
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<TaskProfile[]>([]);

  /**
   * Analyze task when description changes (debounced)
   */
  useEffect(() => {
    if (!taskDescription.trim() || taskDescription.length < 20) {
      setTaskProfile(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);

      const characteristics = await analyzeTaskCharacteristics(taskDescription);
      const profile = calculateTaskProfile(characteristics, taskDescription);

      setTaskProfile(profile);
      setAnalysisHistory(prev => [profile, ...prev.slice(0, 9)]);

      if (onTaskProfileDetected) {
        onTaskProfileDetected(profile);
      }

      setIsAnalyzing(false);
    }, 800); // Debounce 800ms

    return () => clearTimeout(timer);
  }, [taskDescription, onTaskProfileDetected]);

  /**
   * Approve all recommendations
   */
  const handleApproveAll = useCallback(() => {
    if (!taskProfile) return;

    const newApprovals = new Set(taskProfile.recommendations.map(r => r.id));
    setUserApprovals(newApprovals);

    if (onUserApproval) {
      onUserApproval(taskProfile);
    }
  }, [taskProfile, onUserApproval]);

  /**
   * Toggle individual recommendation approval
   */
  const handleToggleRecommendation = useCallback((recommendationId: string) => {
    setUserApprovals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recommendationId)) {
        newSet.delete(recommendationId);
      } else {
        newSet.add(recommendationId);
      }
      return newSet;
    });
  }, []);

  /**
   * Get callback handler for opening recommended component
   */
  const getOpenToolHandler = useCallback((componentName: string): (() => void) | null => {
    const mapping: Record<string, (() => void) | undefined> = {
      'agency-control': onOpenMR3,
      'iteration-support': onOpenMR5,
      'trust-calibration': onOpenMR9,
      'verification': onOpenMR11,
      'reflection': onOpenMR14,
      'strategy-guide': onOpenMR15
    };
    return mapping[componentName] || null;
  }, [onOpenMR3, onOpenMR5, onOpenMR9, onOpenMR11, onOpenMR14, onOpenMR15]);

  /**
   * User adjusts detected characteristic
   */
  const handleAdjustCharacteristic = useCallback(
    (characteristic: keyof TaskProfile, value: any) => {
      setCustomAdjustments(prev => ({
        ...prev,
        [characteristic]: value
      }));

      if (taskProfile) {
        const updatedProfile = {
          ...taskProfile,
          [characteristic]: value
        };
        const newRecommendations = generateAdaptationRecommendations(updatedProfile);
        const updatedProfileWithRecs = {
          ...updatedProfile,
          recommendations: newRecommendations
        };
        setTaskProfile(updatedProfileWithRecs);

        if (onAdaptationRecommended) {
          onAdaptationRecommended(newRecommendations);
        }
      }
    },
    [taskProfile, onAdaptationRecommended]
  );

  /**
   * Render task type selector
   */
  const renderTaskTypeSelector = () => {
    if (!taskProfile) return null;

    const taskTypes: TaskType[] = [
      'coding',
      'writing',
      'analysis',
      'creative',
      'research',
      'design',
      'planning',
      'review'
    ];

    const icons: Record<TaskType, string> = {
      coding: '💻',
      writing: '✍️',
      analysis: '📊',
      creative: '🎨',
      research: '🔍',
      design: '🎭',
      planning: '📋',
      review: '👁️'
    };

    return (
      <div className="mr8-task-type-selector">
        <h3>Task Type</h3>
        <p className="mr8-detected-info">
          Detected: <strong>{icons[taskProfile.detectedType]} {taskProfile.detectedType}</strong>
          (Confidence: {(taskProfile.detectionConfidence * 100).toFixed(0)}%)
        </p>

        <div className="mr8-type-buttons">
          {taskTypes.map(type => (
            <button
              key={type}
              className={`mr8-type-btn ${
                customAdjustments.detectedType === type ||
                (!customAdjustments.detectedType && taskProfile.detectedType === type)
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleAdjustCharacteristic('detectedType', type)}
              title={`Mark as ${type}`}
            >
              {icons[type]} {type}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render criticality selector
   */
  const renderCriticalitySelector = () => {
    if (!taskProfile) return null;

    const levels: CriticalityLevel[] = ['low', 'medium', 'high'];
    const descriptions = {
      low: '💚 Practice, brainstorming, low-stakes exploration',
      medium: '💛 Regular work, assignments, standard projects',
      high: '❤️ Exams, professional work, critical submissions'
    };

    return (
      <div className="mr8-characteristic-selector">
        <h3>Task Criticality</h3>
        <p className="mr8-detected-info">
          Detected: <strong>{taskProfile.criticality}</strong>
        </p>

        <div className="mr8-level-selector">
          {levels.map(level => (
            <button
              key={level}
              className={`mr8-level-btn ${
                customAdjustments.criticality === level ||
                (!customAdjustments.criticality && taskProfile.criticality === level)
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleAdjustCharacteristic('criticality', level)}
            >
              <span className="mr8-level-name">{level}</span>
              <span className="mr8-level-desc">{descriptions[level]}</span>
            </button>
          ))}
        </div>

        <div className="mr8-guidance">
          <p>
            <strong>Why it matters:</strong> High-criticality tasks need more careful AI review.
            Low-criticality tasks can embrace more experimental approaches.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Render familiarity selector
   */
  const renderFamiliaritySelector = () => {
    if (!taskProfile) return null;

    const levels: FamiliarityLevel[] = ['familiar', 'moderate', 'unfamiliar'];
    const descriptions = {
      familiar: '✅ Expert level - you know this domain well',
      moderate: '📚 Intermediate - you have some experience',
      unfamiliar: '❓ New territory - this is outside your expertise'
    };

    return (
      <div className="mr8-characteristic-selector">
        <h3>Your Familiarity</h3>
        <p className="mr8-detected-info">
          Detected: <strong>{taskProfile.familiarity}</strong>
        </p>

        <div className="mr8-level-selector">
          {levels.map(level => (
            <button
              key={level}
              className={`mr8-level-btn ${
                customAdjustments.familiarity === level ||
                (!customAdjustments.familiarity && taskProfile.familiarity === level)
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleAdjustCharacteristic('familiarity', level)}
            >
              <span className="mr8-level-name">{level}</span>
              <span className="mr8-level-desc">{descriptions[level]}</span>
            </button>
          ))}
        </div>

        <div className="mr8-guidance">
          <p>
            <strong>Why it matters:</strong> Unfamiliar domains need more AI support and verification.
            Familiar domains need less AI intervention to maintain skill.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Render time pressure selector
   */
  const renderTimePressureSelector = () => {
    if (!taskProfile) return null;

    const levels: TimePressureLevel[] = ['low', 'medium', 'high'];
    const descriptions = {
      low: '🌅 Plenty of time - can explore thoroughly',
      medium: '⏰ Standard deadline - balance quality & speed',
      high: '⚡ Urgent - prioritize getting it done'
    };

    return (
      <div className="mr8-characteristic-selector">
        <h3>Time Pressure</h3>
        <p className="mr8-detected-info">
          Detected: <strong>{taskProfile.timePressure}</strong>
        </p>

        <div className="mr8-level-selector">
          {levels.map(level => (
            <button
              key={level}
              className={`mr8-level-btn ${
                customAdjustments.timePressure === level ||
                (!customAdjustments.timePressure && taskProfile.timePressure === level)
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleAdjustCharacteristic('timePressure', level)}
            >
              <span className="mr8-level-name">{level}</span>
              <span className="mr8-level-desc">{descriptions[level]}</span>
            </button>
          ))}
        </div>

        <div className="mr8-guidance">
          <p>
            <strong>Why it matters:</strong> High time pressure may warrant more AI assistance.
            Low time pressure allows for more learning and skill practice.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Render complexity slider
   */
  const renderComplexitySlider = () => {
    if (!taskProfile) return null;

    const displayComplexity =
      customAdjustments.estimatedComplexity ?? taskProfile.estimatedComplexity;

    return (
      <div className="mr8-complexity-slider">
        <h3>Task Complexity</h3>
        <p className="mr8-detected-info">
          Detected: <strong>{displayComplexity}/10</strong>
        </p>

        <input
          type="range"
          min="1"
          max="10"
          value={displayComplexity}
          onChange={e => handleAdjustCharacteristic('estimatedComplexity', parseInt(e.target.value))}
          className="mr8-slider"
          aria-label="Task complexity (1-10)"
        />

        <div className="mr8-complexity-labels">
          <span>Simple</span>
          <span>Moderate</span>
          <span>Complex</span>
        </div>

        <div className="mr8-guidance">
          <p>
            <strong>Why it matters:</strong> Complex tasks need more scaffolding and careful AI review.
            Simple tasks can move faster with higher AI intervention.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Render recommendations
   */
  const renderRecommendations = () => {
    if (!taskProfile || taskProfile.recommendations.length === 0) {
      return <div className="mr8-empty">No recommendations available</div>;
    }

    return (
      <div className="mr8-recommendations">
        <h2>Recommended Adaptations</h2>

        <div className="mr8-recommended-intervention">
          <h3>Suggested AI Intervention Level</h3>
          <div className={`mr8-intervention-box mr8-intervention-${taskProfile.suggestedInterventionLevel}`}>
            <div className="mr8-intervention-level">
              {taskProfile.suggestedInterventionLevel === 'passive' && '🤐 Passive'}
              {taskProfile.suggestedInterventionLevel === 'suggestive' && '🤝 Suggestive'}
              {taskProfile.suggestedInterventionLevel === 'proactive' && '🚀 Proactive'}
            </div>
            <p className="mr8-intervention-reason">
              {getInterventionReasoning(taskProfile)}
            </p>
          </div>
        </div>

        <div className="mr8-rec-list">
          {taskProfile.recommendations.map((rec, idx) => (
            <div key={rec.id} className="mr8-rec-item">
              <label className="mr8-rec-checkbox">
                <input
                  type="checkbox"
                  checked={userApprovals.has(rec.id)}
                  onChange={() => handleToggleRecommendation(rec.id)}
                  aria-label={`Enable: ${rec.title}`}
                />
                <span className="mr8-checkmark" />
              </label>

              <div className="mr8-rec-content">
                <div className="mr8-rec-header">
                  <span className={`mr8-rec-icon mr8-icon-${rec.component}`}>
                    {getComponentIcon(rec.component)}
                  </span>
                  <h4 className="mr8-rec-title">{rec.title}</h4>
                  <span className={`mr8-priority mr8-priority-${rec.priority}`}>
                    {rec.priority}
                  </span>
                </div>

                <p className="mr8-rec-description">{rec.description}</p>

                <div className="mr8-rec-rationale">
                  <strong>Why:</strong> {rec.rationale}
                </div>

                <div className="mr8-rec-impact">
                  <span className="mr8-impact-label">Impact:</span>
                  <span className="mr8-impact-value">{rec.expectedImpact}</span>
                </div>

                {/* MR Integration: Add button to open recommended tool */}
                {getOpenToolHandler(rec.component) && (
                  <button
                    className="mr8-rec-open-tool-btn"
                    onClick={getOpenToolHandler(rec.component)!}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                    title={`打开${rec.title}工具`}
                  >
                    🔧 打开推荐工具
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="mr8-btn-approve-all" onClick={handleApproveAll}>
          ✓ Apply All Recommendations
        </button>
      </div>
    );
  };

  /**
   * Render risk factors
   */
  const renderRiskFactors = () => {
    if (!taskProfile || taskProfile.riskFactors.length === 0) {
      return null;
    }

    return (
      <div className="mr8-risk-factors">
        <h3>⚠️ Risk Factors to Watch</h3>
        <ul className="mr8-risk-list">
          {taskProfile.riskFactors.map((risk, idx) => (
            <li key={idx}>{risk}</li>
          ))}
        </ul>
      </div>
    );
  };

  /**
   * Main render
   */
  return (
    <div className="mr8-container">
      <div className="mr8-header">
        <h1 className="mr8-title">🎯 Task Characteristic Recognition</h1>
        <p className="mr8-subtitle">
          Automatically detects task properties and recommends intelligent system adaptations
        </p>
      </div>

      {/* Task input */}
      <div className="mr8-input-section">
        <label htmlFor="mr8-task-input" className="mr8-input-label">
          Describe your task:
        </label>
        <textarea
          id="mr8-task-input"
          className="mr8-task-input"
          placeholder="Describe what you're trying to accomplish... (provide context, goals, constraints)"
          value={taskDescription}
          onChange={e => setTaskDescription(e.target.value)}
          aria-label="Task description"
        />
        <p className="mr8-input-hint">
          {taskDescription.length < 20
            ? `${20 - taskDescription.length} more characters needed`
            : isAnalyzing
              ? '🔄 Analyzing...'
              : taskProfile
                ? '✓ Analysis complete'
                : 'Ready to analyze'}
        </p>
      </div>

      {/* Analysis results */}
      {taskProfile && (
        <div className="mr8-analysis-results">
          {/* Characteristic selectors */}
          <div className="mr8-characteristics-panel">
            <h2>Task Characteristics</h2>

            {renderTaskTypeSelector()}
            {renderCriticalitySelector()}
            {renderFamiliaritySelector()}
            {renderTimePressureSelector()}
            {renderComplexitySlider()}

            {renderRiskFactors()}
          </div>

          {/* Recommendations panel */}
          <div className="mr8-recommendations-panel">
            {renderRecommendations()}
          </div>

          {/* Analysis history */}
          {analysisHistory.length > 1 && (
            <div className="mr8-history-section">
              <button
                className="mr8-btn-toggle-history"
                onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
              >
                📋 Recent Analysis ({analysisHistory.length})
              </button>
              {showDetailedAnalysis && (
                <div className="mr8-history-list">
                  {analysisHistory.slice(1).map((profile, idx) => (
                    <div key={idx} className="mr8-history-item">
                      <span className="mr8-history-type">{profile.detectedType}</span>
                      <span className="mr8-history-details">
                        {profile.criticality} • {profile.familiarity} • {profile.timePressure}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Helper: Get intervention reasoning
 */
function getInterventionReasoning(profile: TaskProfile): string {
  if (profile.suggestedInterventionLevel === 'passive') {
    return `You're familiar with this task type and have time. Work independently, AI available on request.`;
  } else if (profile.suggestedInterventionLevel === 'proactive') {
    return `This is urgent or unfamiliar territory. AI will actively suggest help to speed things up.`;
  } else {
    return `Balance of learning and efficiency. AI suggests help when useful, you decide.`;
  }
}

/**
 * Helper: Get component icon
 */
function getComponentIcon(component: string): string {
  const icons: Record<string, string> = {
    'agency-control': '🎛️',
    'iteration-support': '🔄',
    'verification': '✓',
    'trust-calibration': '⚖️',
    'strategy-guide': '📚',
    'reflection': '🧠'
  };
  return icons[component] || '💡';
}

export default MR8TaskCharacteristicRecognition;
