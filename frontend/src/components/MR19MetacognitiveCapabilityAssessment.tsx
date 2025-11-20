/**
 * MR19: Metacognitive Capability Assessment - React Component
 *
 * Diagnoses user's metacognitive capabilities across 4 dimensions:
 * 1. Planning - Task decomposition and structure
 * 2. Monitoring - Ongoing verification and checking
 * 3. Evaluation - Critical assessment and comparison
 * 4. Regulation - Strategy adjustment and flexibility
 *
 * Design Rationale (from 49 interviews):
 * - Users have very different metacognitive strengths
 * - I001 (strong planning) vs I024 (uncritical acceptance)
 * - System should provide support tailored to user's weaknesses
 * - Diagnosis enables all other personalization and adaptation
 *
 * Key insight: Personalization foundation
 * - Can't give I001 strong planning support (already mastered)
 * - Must give I35 critical thinking support (significant gap)
 * - Diagnostic accuracy >75% enables effective recommendations
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  MetacognitiveProfile,
  AssessmentDimension,
  DiagnosisRecommendation,
  assessMetacognitiveDimensions,
  calculateProfile,
  getAdaptationRecommendations,
  getDimensionScore,
} from './MR19MetacognitiveCapabilityAssessment.utils';
import './MR19MetacognitiveCapabilityAssessment.css';

/**
 * Props for MR19 component
 */
interface MR19Props {
  userBehaviorHistory?: Array<{
    type: 'plan' | 'monitor' | 'evaluate' | 'regulate';
    count: number;
    effectiveness: number; // 0-1
  }>;
  onAssessmentComplete?: (profile: MetacognitiveProfile) => void;
  showRecommendations?: boolean;
  allowSelfReport?: boolean;
  onOpenMR16?: () => void;
  onOpenMR17?: () => void;
}

/**
 * Assessment mode type
 */
type AssessmentMode = 'overview' | 'behavioral' | 'self-report' | 'results' | 'recommendations';

/**
 * MR19 Component: Metacognitive Capability Assessment
 */
export const MR19MetacognitiveCapabilityAssessment: React.FC<MR19Props> = ({
  userBehaviorHistory = [],
  onAssessmentComplete,
  showRecommendations = true,
  allowSelfReport = true,
  onOpenMR16,
  onOpenMR17,
}) => {
  // State management
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('overview');
  const [profile, setProfile] = useState<MetacognitiveProfile | null>(null);
  const [selfReportScores, setSelfReportScores] = useState<Record<AssessmentDimension, number>>({
    planning: 3,
    monitoring: 3,
    evaluation: 3,
    regulation: 3,
  });
  const [selectedDimension, setSelectedDimension] = useState<AssessmentDimension | null>(null);

  /**
   * Calculate assessment from behavioral history
   */
  const behavioralAssessment = useMemo(() => {
    if (userBehaviorHistory.length === 0) return null;
    return assessMetacognitiveDimensions(userBehaviorHistory);
  }, [userBehaviorHistory]);

  /**
   * Calculate final profile from all data sources
   */
  const handleGenerateProfile = useCallback(() => {
    const finalProfile = calculateProfile({
      behavioral: behavioralAssessment,
      selfReport: allowSelfReport ? selfReportScores : undefined,
      dataSource: 'combined',
    });

    setProfile(finalProfile);
    onAssessmentComplete?.(finalProfile);
    setAssessmentMode('results');
  }, [behavioralAssessment, selfReportScores, allowSelfReport, onAssessmentComplete]);

  /**
   * Render overview/intro
   */
  const renderOverview = () => {
    return (
      <div className="mr19-overview">
        <div className="mr19-hero">
          <h2 className="mr19-hero-title">Metacognitive Capability Assessment</h2>
          <p className="mr19-hero-subtitle">
            Understand your learning and decision-making patterns to get personalized AI support
          </p>
        </div>

        <div className="mr19-intro-cards">
          <div className="mr19-intro-card">
            <div className="mr19-card-icon">📋</div>
            <h3 className="mr19-card-title">Planning Ability</h3>
            <p className="mr19-card-description">
              Can you break down complex tasks into manageable steps? Do you plan before diving in?
            </p>
          </div>

          <div className="mr19-intro-card">
            <div className="mr19-card-icon">👀</div>
            <h3 className="mr19-card-title">Monitoring Ability</h3>
            <p className="mr19-card-description">
              Do you verify your progress as you work? Do you catch errors and misunderstandings?
            </p>
          </div>

          <div className="mr19-intro-card">
            <div className="mr19-card-icon">⚖️</div>
            <h3 className="mr19-card-title">Evaluation Ability</h3>
            <p className="mr19-card-description">
              Can you critically assess quality? Do you compare alternatives before deciding?
            </p>
          </div>

          <div className="mr19-intro-card">
            <div className="mr19-card-icon">🔄</div>
            <h3 className="mr19-card-title">Regulation Ability</h3>
            <p className="mr19-card-description">
              Do you adjust strategies when something isn't working? Are you flexible?
            </p>
          </div>
        </div>

        <div className="mr19-assessment-options">
          <h3 className="mr19-options-title">How would you like to assess yourself?</h3>

          <button
            className="mr19-option-btn"
            onClick={() => setAssessmentMode('behavioral')}
            disabled={!behavioralAssessment}
          >
            <span className="mr19-option-icon">📊</span>
            <span className="mr19-option-text">
              Behavioral Analysis {!behavioralAssessment && '(No history available)'}
            </span>
          </button>

          {allowSelfReport && (
            <button className="mr19-option-btn" onClick={() => setAssessmentMode('self-report')}>
              <span className="mr19-option-icon">🎯</span>
              <span className="mr19-option-text">Self-Report Questions</span>
            </button>
          )}

          {behavioralAssessment && allowSelfReport && (
            <button className="mr19-option-btn" onClick={handleGenerateProfile}>
              <span className="mr19-option-icon">✨</span>
              <span className="mr19-option-text">Combined Assessment</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render behavioral assessment view
   */
  const renderBehavioralAssessment = () => {
    if (!behavioralAssessment) {
      return <p className="mr19-empty-message">No behavioral history available yet</p>;
    }

    return (
      <div className="mr19-behavioral-assessment">
        <h3 className="mr19-section-title">Based on Your Actual Usage Patterns</h3>
        <p className="mr19-section-subtitle">
          We analyzed your interaction patterns to assess your metacognitive strengths
        </p>

        <div className="mr19-behavioral-grid">
          {Object.entries(behavioralAssessment).map(([dimension, data]) => (
            <div
              key={dimension}
              className={`mr19-behavioral-card ${selectedDimension === dimension ? 'selected' : ''}`}
              onClick={() => setSelectedDimension(selectedDimension === dimension ? null : (dimension as AssessmentDimension))}
            >
              <h4 className="mr19-dimension-name">
                {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
              </h4>

              <div className="mr19-score-display">
                <span className="mr19-score-number">{(data.score * 100).toFixed(0)}%</span>
                <div className="mr19-score-bar">
                  <div
                    className="mr19-score-fill"
                    style={{ width: `${data.score * 100}%` }}
                  />
                </div>
              </div>

              <p className="mr19-dimension-evidence">
                {data.evidence}
              </p>

              {selectedDimension === dimension && (
                <div className="mr19-dimension-details">
                  <p className="mr19-detail-label">Behavioral Indicators:</p>
                  <ul className="mr19-detail-list">
                    {data.indicators.map((indicator, idx) => (
                      <li key={idx}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          className="mr19-action-btn mr19-primary"
          onClick={() => {
            if (allowSelfReport) {
              setAssessmentMode('self-report');
            } else {
              handleGenerateProfile();
            }
          }}
        >
          {allowSelfReport ? 'Next: Answer Questions' : 'Generate Profile'}
        </button>
      </div>
    );
  };

  /**
   * Render self-report assessment view
   */
  const renderSelfReportAssessment = () => {
    const questions: Record<AssessmentDimension, { label: string; description: string }> = {
      planning:
        {
          label: 'Planning Ability',
          description: 'How well do you plan before starting a task?',
        },
      monitoring:
        {
          label: 'Monitoring Ability',
          description: 'How often do you check your understanding while working?',
        },
      evaluation:
        {
          label: 'Evaluation Ability',
          description: 'How carefully do you evaluate the quality of your work?',
        },
      regulation:
        {
          label: 'Regulation Ability',
          description: 'How readily do you adjust your approach when something isn\'t working?',
        },
    };

    return (
      <div className="mr19-self-report">
        <h3 className="mr19-section-title">Self-Assessment Questionnaire</h3>
        <p className="mr19-section-subtitle">
          Rate each statement on a scale of 1-5 (1 = Not at all, 5 = Completely)
        </p>

        <div className="mr19-questions-grid">
          {(Object.keys(questions) as AssessmentDimension[]).map(dimension => {
            const q = questions[dimension];
            return (
              <div key={dimension} className="mr19-question-card">
                <h4 className="mr19-question-label">{q.label}</h4>
                <p className="mr19-question-text">{q.description}</p>

                <div className="mr19-rating-scale">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      className={`mr19-rating-btn ${selfReportScores[dimension] === score ? 'selected' : ''}`}
                      onClick={() =>
                        setSelfReportScores(prev => ({ ...prev, [dimension]: score }))
                      }
                    >
                      {score}
                    </button>
                  ))}
                </div>

                <div className="mr19-rating-labels">
                  <span>Weak</span>
                  <span>Strong</span>
                </div>
              </div>
            );
          })}
        </div>

        <button className="mr19-action-btn mr19-primary" onClick={handleGenerateProfile}>
          Generate Your Profile
        </button>
      </div>
    );
  };

  /**
   * Render results view
   */
  const renderResults = () => {
    if (!profile) return null;

    const dimensionLabels: Record<AssessmentDimension, string> = {
      planning: 'Planning',
      monitoring: 'Monitoring',
      evaluation: 'Evaluation',
      regulation: 'Regulation',
    };

    return (
      <div className="mr19-results">
        <div className="mr19-profile-header">
          <h2 className="mr19-profile-title">Your Metacognitive Profile</h2>
          <p className="mr19-profile-subtitle">
            Your assessment reveals specific strengths and areas for growth
          </p>
        </div>

        <div className="mr19-profile-grid">
          {(Object.keys(dimensionLabels) as AssessmentDimension[]).map(dimension => {
            const score = getDimensionScore(profile, dimension);
            const data = profile.dimensions[dimension];

            return (
              <div key={dimension} className="mr19-profile-card">
                <h3 className="mr19-card-name">{dimensionLabels[dimension]}</h3>

                <div className="mr19-score-circle">
                  <span className="mr19-score-percent">{(score * 100).toFixed(0)}%</span>
                </div>

                <div className="mr19-score-bar">
                  <div className="mr19-score-fill" style={{ width: `${score * 100}%` }} />
                </div>

                <p className="mr19-score-label">
                  {score >= 0.75 ? '⭐ Strong' : score >= 0.5 ? '⚠️ Moderate' : '🎯 Growing'}
                </p>

                {data.interpretation && (
                  <p className="mr19-interpretation">{data.interpretation}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mr19-overall-summary">
          <h3 className="mr19-summary-title">Overall Summary</h3>
          <p className="mr19-summary-text">{profile.overallInterpretation}</p>

          <div className="mr19-strengths-gaps">
            <div className="mr19-strengths">
              <h4 className="mr19-strengths-title">🌟 Your Strengths</h4>
              <ul className="mr19-strength-list">
                {profile.topStrengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="mr19-areas-growth">
              <h4 className="mr19-growth-title">📈 Areas for Growth</h4>
              <ul className="mr19-growth-list">
                {profile.areasForGrowth.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {showRecommendations && (
          <button
            className="mr19-action-btn mr19-primary"
            onClick={() => setAssessmentMode('recommendations')}
          >
            View Personalized Recommendations
          </button>
        )}
      </div>
    );
  };

  /**
   * Render recommendations view
   */
  const renderRecommendations = () => {
    if (!profile) return null;

    const recommendations = getAdaptationRecommendations(profile);

    return (
      <div className="mr19-recommendations">
        <div className="mr19-recommendations-header">
          <h2 className="mr19-recommendations-title">Personalized AI Support Recommendations</h2>
          <p className="mr19-recommendations-subtitle">
            Based on your assessment, here's how the system will adapt to support you
          </p>
        </div>

        <div className="mr19-recommendations-grid">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`mr19-recommendation-card mr19-priority-${rec.priority}`}>
              <div className="mr19-rec-header">
                <h3 className="mr19-rec-title">{rec.title}</h3>
                <span className="mr19-rec-priority">{rec.priority.toUpperCase()}</span>
              </div>

              <p className="mr19-rec-rationale">{rec.rationale}</p>

              <div className="mr19-rec-features">
                <h4 className="mr19-features-label">What This Means:</h4>
                <ul className="mr19-features-list">
                  {rec.features.map((feature, fidx) => (
                    <li key={fidx}>{feature}</li>
                  ))}
                </ul>
              </div>

              {rec.relatedMRs && rec.relatedMRs.length > 0 && (
                <div className="mr19-related-mrs">
                  <span className="mr19-mrs-label">Powered by:</span>
                  <div className="mr19-mrs-list">
                    {rec.relatedMRs.map(mr => (
                      <span key={mr} className="mr19-mr-badge">
                        {mr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mr19-next-steps">
          <h3 className="mr19-next-steps-title">Next Steps</h3>
          <ol className="mr19-steps-list">
            <li>Your assessment is saved and will be updated as you use the system</li>
            <li>AI support will gradually adapt based on your progress</li>
            <li>You can revisit this assessment anytime to see how you've developed</li>
            <li>Focus on areas marked as "priority" for fastest skill improvement</li>
          </ol>
        </div>

        <button
          className="mr19-action-btn mr19-primary"
          onClick={() => setAssessmentMode('results')}
        >
          Back to Results
        </button>
      </div>
    );
  };

  return (
    <div className="mr19-container">
      <div className="mr19-header">
        <h1 className="mr19-title">Metacognitive Assessment</h1>
        <p className="mr19-subtitle">
          Understand how you think and learn to get personalized AI support
        </p>
      </div>

      <div className="mr19-progress-bar">
        <div className="mr19-progress-steps">
          <div className={`mr19-step ${assessmentMode === 'overview' ? 'active' : 'completed'}`}>
            1. Overview
          </div>
          <div className={`mr19-step ${assessmentMode === 'behavioral' ? 'active' : ''}`}>
            2. Analyze
          </div>
          <div className={`mr19-step ${assessmentMode === 'self-report' ? 'active' : ''}`}>
            3. Reflect
          </div>
          <div className={`mr19-step ${assessmentMode === 'results' ? 'active' : ''}`}>
            4. Results
          </div>
          {showRecommendations && (
            <div className={`mr19-step ${assessmentMode === 'recommendations' ? 'active' : ''}`}>
              5. Adapt
            </div>
          )}
        </div>
      </div>

      <div className="mr19-content">
        {assessmentMode === 'overview' && renderOverview()}
        {assessmentMode === 'behavioral' && renderBehavioralAssessment()}
        {assessmentMode === 'self-report' && renderSelfReportAssessment()}
        {assessmentMode === 'results' && renderResults()}
        {assessmentMode === 'recommendations' && renderRecommendations()}
      </div>

      {/* MR Integration: Recommend skill monitoring after assessment */}
      {onOpenMR16 && profile && assessmentMode === 'results' && (
        <div style={{
          backgroundColor: '#ede9fe',
          border: '2px solid #8b5cf6',
          borderRadius: '0.5rem',
          padding: '1rem',
          margin: '1.5rem 0',
          maxWidth: '800px',
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#5b21b6' }}>
            ⚠️ Next Step: Monitor Your Skills
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
            You've completed your metacognitive assessment! Now monitor your skills over time to prevent atrophy. The system will track your independence levels and alert you before capabilities fade.
          </p>
          <button
            onClick={onOpenMR16}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
            title="Open Skill Atrophy Prevention - Monitor and maintain your capabilities"
          >
            ⚠️ Monitor Skills (MR16)
          </button>
        </div>
      )}

      <div className="mr19-footer-info">
        <p className="mr19-footer-text">
          💡 <strong>Tip:</strong> This assessment helps personalize your AI experience. Your results are private
          and used only to improve system recommendations.
        </p>
      </div>
    </div>
  );
};

export default MR19MetacognitiveCapabilityAssessment;
