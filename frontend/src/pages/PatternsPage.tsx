import React, { useEffect, useState } from 'react';
import { usePatternStore } from '../stores/patternStore';
import { useAuthStore } from '../stores/authStore';
import { useMetricsStore } from '../stores/metricsStore';
import { useAssessmentStore } from '../stores/assessmentStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InfoTooltip from '../components/InfoTooltip';
import api from '../services/api';
import './PatternsPage.css';

/**
 * Patterns Page
 * View and analyze user AI usage patterns
 */
const PatternsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { patterns, loading, fetchPatterns } = usePatternStore();
  const { alerts } = useMetricsStore();
  const { latestAssessment, fetchLatestAssessment } = useAssessmentStore();
  const [totalInteractions, setTotalInteractions] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      fetchPatterns(user.id);
      fetchLatestAssessment(user.id);
      // Fetch user's total interaction count
      api.get(`/users/${user.id}/stats`).then(response => {
        const stats = response.data.data || response.data;
        setTotalInteractions(stats.totalInteractions || stats.totalMessages || 0);
      }).catch(err => {
        console.error('Failed to fetch user stats:', err);
      });
    }
  }, [user?.id, fetchLatestAssessment]);

  if (loading) {
    return <LoadingSpinner message="Loading patterns..." />;
  }

  const userPatterns = patterns.filter((p) => p.userId === user?.id);
  const recentAlerts = (alerts || []).slice(0, 5);

  // Minimum interactions threshold before showing real metrics
  const MIN_INTERACTIONS_THRESHOLD = 15;
  const hasEnoughData = totalInteractions >= MIN_INTERACTIONS_THRESHOLD;

  // Get dominant pattern (highest confidence)
  const dominantPattern = userPatterns.length > 0
    ? userPatterns.reduce((prev, current) =>
        (prev.confidence > current.confidence) ? prev : current
      )
    : null;

  // Get sorted patterns for timeline (most recent first)
  const patternTimeline = [...userPatterns].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const getPatternColor = (patternType: string): string => {
    const colors: { [key: string]: string } = {
      A: '#10b981',
      B: '#3b82f6',
      C: '#f59e0b',
      D: '#8b5cf6',
      E: '#ec4899',
      F: '#ef4444',
    };
    return colors[patternType] || '#6b7280';
  };

  const getPatternLabel = (patternType: string): string => {
    const labels: { [key: string]: string } = {
      A: 'Strategic Decomposition & Control',
      B: 'Iterative Refinement & Calibration',
      C: 'Context-Sensitive Adaptation',
      D: 'Deep Verification & Critical Engagement',
      E: 'Pedagogical Reflection & Self-Monitoring',
      F: 'Ineffective & Passive Usage',
    };
    return labels[patternType] || 'Unknown Pattern';
  };

  const getPatternDescription = (patternType: string): string => {
    const descriptions: Record<string, string> = {
      A: 'Strategic Decomposition & Control - Task-focused planning with human oversight. High verification (>70%), maintains skill preservation through boundary maintenance.',
      B: 'Iterative Refinement & Calibration - Experimental learning through rapid iteration. Accepts initial imperfection, learns from failures, dynamically calibrates trust levels.',
      C: 'Context-Sensitive Adaptation - Flexible strategy switching based on task characteristics. Dynamically adjusts AI reliance depending on task importance, familiarity, and time pressure.',
      D: 'Deep Verification & Critical Engagement - Systematic skepticism with high verification (>90%). Multi-tool cross-checking, assumption testing, and critical reasoning.',
      E: 'Pedagogical Reflection & Self-Monitoring - Learning-oriented with strong metacognitive awareness. Uses AI as teaching tool, maintains learning logs, regularly practices without AI.',
      F: '⚠️ Ineffective & Passive Usage - High-risk pattern with low verification (<10%). Uncritical acceptance, minimal engagement, and risk of skill degradation.',
    };
    return descriptions[patternType] || 'Unknown pattern';
  };

  // Render subdimension progress bar
  const renderSubdimensionBar = (code: string, label: string, assessment: any) => {
    // Extract score from assessment responses
    const responses = assessment.responses || {};
    const subdimScores = responses.subdimensionScores || [];
    const found = subdimScores.find((s: any) => s.dimension === code);
    const rawScore = found ? found.score : 0; // 1-5 scale
    const percentage = rawScore > 0 ? ((rawScore - 1) / 4) * 100 : 0; // Convert to 0-100%

    const getColor = (score: number) => {
      if (score >= 4) return '#10b981'; // Strong (green)
      if (score >= 3) return '#3b82f6'; // Moderate (blue)
      return '#f59e0b'; // Weak (amber)
    };

    return (
      <div key={code}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#374151' }}>{label}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: getColor(rawScore) }}>
            {rawScore > 0 ? rawScore.toFixed(1) : 'N/A'}
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '0.5rem',
          backgroundColor: '#e5e7eb',
          borderRadius: '0.25rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getColor(rawScore),
            transition: 'width 0.3s ease',
            borderRadius: '0.25rem'
          }} />
        </div>
      </div>
    );
  };

  // Get correlation between pattern and metacognitive abilities
  const getPatternMetacognitionCorrelation = (patternType: string): string => {
    const correlations: Record<string, string> = {
      A: 'strong Planning abilities (P1-P4) and high Monitoring (M1-M2). Users with Pattern A typically excel at task decomposition and progress tracking.',
      B: 'strong Regulation abilities (R1-R2) and Evaluation (E2). Pattern B users are excellent at adjusting strategies and learning from failures.',
      C: 'balanced abilities across all dimensions with strong Regulation (R1). Pattern C users excel at adaptive strategy switching.',
      D: 'exceptional Monitoring (M1-M3) and Evaluation (E1-E3) abilities. Pattern D users are systematic verifiers with strong critical thinking.',
      E: 'strong Evaluation (E2) and Monitoring (M1) with emphasis on learning reflection. Pattern E users treat AI as a pedagogical tool.',
      F: 'underdeveloped metacognitive abilities across dimensions. Pattern F users may benefit from MR19 assessment and metacognitive training.',
    };
    return correlations[patternType] || 'various metacognitive abilities depending on your usage patterns.';
  };

  return (
    <div className="page patterns-page">
      <div className="page-header">
        <h1>AI Usage Patterns</h1>
        <p className="page-subtitle">Understand your AI usage behavior and patterns</p>
      </div>

      {/* Pattern Evolution Section */}
      {dominantPattern && (
        <div style={{
          backgroundColor: '#fafbfc',
          border: '2px solid #0ea5e9',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#0369a1', fontSize: '1rem' }}>🎯 Your Pattern Evolution</h3>

          {/* Current Dominant Pattern Card */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fff',
            border: `3px solid ${getPatternColor(dominantPattern.patternType)}`,
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: getPatternColor(dominantPattern.patternType),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  flexShrink: 0,
                }}
              >
                {dominantPattern.patternType}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0', fontWeight: '700', fontSize: '1.1rem', color: '#1f2937' }}>
                  Pattern {dominantPattern.patternType}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  {getPatternLabel(dominantPattern.patternType)}
                </p>
              </div>
            </div>

            {/* Confidence and Stability Bars */}
            <div style={{ marginBottom: '1.5rem' }}>
              {/* Confidence Level */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Confidence
                    <InfoTooltip text="How confident we are in this pattern classification based on your usage data" size="small" />
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: getPatternColor(dominantPattern.patternType) }}>
                    {dominantPattern.confidence > 0 ? `${(dominantPattern.confidence * 100).toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
                {dominantPattern.confidence > 0 ? (
                  <div style={{
                    width: '100%',
                    height: '0.625rem',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      width: `${dominantPattern.confidence * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getPatternColor(dominantPattern.patternType)}, ${getPatternColor(dominantPattern.patternType)}dd)`,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 0 8px ${getPatternColor(dominantPattern.patternType)}66`
                    }} />
                  </div>
                ) : (
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#fef3c7',
                    borderLeft: '3px solid #f59e0b',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    color: '#92400e'
                  }}>
                    ⚠️ Not enough usage data yet to determine confidence level
                  </div>
                )}
              </div>

              {/* Pattern Stability (NEW) */}
              {dominantPattern.stability !== undefined && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Stability
                      <InfoTooltip text="How consistently you exhibit this pattern over time" size="small" />
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#059669' }}>
                      {(dominantPattern.stability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '0.625rem',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      width: `${dominantPattern.stability * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #059669, #10b981)',
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 0 8px #05966966'
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Key Metrics Grid - Improved Design */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
              {/* AI Reliance Score */}
              <div style={{
                padding: '1.25rem',
                background: dominantPattern.aiRelianceScore !== undefined
                  ? 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)'
                  : '#f9fafb',
                border: dominantPattern.aiRelianceScore !== undefined
                  ? '2px solid #fecaca'
                  : '2px dashed #d1d5db',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (dominantPattern.aiRelianceScore !== undefined) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(220, 38, 38, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600', letterSpacing: '0.025em' }}>
                    AI Reliance
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontWeight: '600' }}>
                    {dominantPattern.aiRelianceScore !== undefined
                      ? (dominantPattern.aiRelianceScore > 0.7 ? 'HIGH' : dominantPattern.aiRelianceScore > 0.4 ? 'MED' : 'LOW')
                      : 'N/A'}
                  </span>
                </div>
                {hasEnoughData && dominantPattern.aiRelianceScore !== undefined ? (
                  <>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#dc2626', marginBottom: '0.75rem', lineHeight: 1 }}>
                      {(dominantPattern.aiRelianceScore * 100).toFixed(0)}%
                    </div>
                    <div style={{
                      height: '0.375rem',
                      backgroundColor: '#fee2e2',
                      borderRadius: '0.25rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                        width: `${Math.min(dominantPattern.aiRelianceScore * 100, 100)}%`,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <p style={{ margin: '0.625rem 0 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                      {dominantPattern.aiRelianceScore > 0.7
                        ? 'Consider reducing AI dependency'
                        : dominantPattern.aiRelianceScore > 0.4
                        ? 'Balanced AI usage'
                        : 'Low dependence on AI'}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                    {hasEnoughData ? 'No data available' : `🔒 Complete ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock`}
                  </p>
                )}
              </div>

              {/* Verification Score */}
              <div style={{
                padding: '1.25rem',
                background: dominantPattern.verificationScore !== undefined
                  ? 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)'
                  : '#f9fafb',
                border: dominantPattern.verificationScore !== undefined
                  ? '2px solid #bbf7d0'
                  : '2px dashed #d1d5db',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (dominantPattern.verificationScore !== undefined) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(5, 150, 105, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600', letterSpacing: '0.025em' }}>
                    Verification
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', backgroundColor: '#dcfce7', color: '#14532d', borderRadius: '0.25rem', fontWeight: '600' }}>
                    {dominantPattern.verificationScore !== undefined
                      ? (dominantPattern.verificationScore > 0.7 ? 'GOOD' : dominantPattern.verificationScore > 0.4 ? 'FAIR' : 'LOW')
                      : 'N/A'}
                  </span>
                </div>
                {hasEnoughData && dominantPattern.verificationScore !== undefined ? (
                  <>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', marginBottom: '0.75rem', lineHeight: 1 }}>
                      {(dominantPattern.verificationScore * 100).toFixed(0)}%
                    </div>
                    <div style={{
                      height: '0.375rem',
                      backgroundColor: '#dcfce7',
                      borderRadius: '0.25rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #059669, #10b981)',
                        width: `${Math.min(dominantPattern.verificationScore * 100, 100)}%`,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <p style={{ margin: '0.625rem 0 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                      {dominantPattern.verificationScore > 0.7
                        ? 'Excellent verification habits'
                        : dominantPattern.verificationScore > 0.4
                        ? 'Room for improvement'
                        : 'Need to verify more often'}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                    {hasEnoughData ? 'No data available' : `🔒 Complete ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock`}
                  </p>
                )}
              </div>

              {/* Context Switching */}
              <div style={{
                padding: '1.25rem',
                background: dominantPattern.contextSwitchingFrequency !== undefined
                  ? 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)'
                  : '#f9fafb',
                border: dominantPattern.contextSwitchingFrequency !== undefined
                  ? '2px solid #bfdbfe'
                  : '2px dashed #d1d5db',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (dominantPattern.contextSwitchingFrequency !== undefined) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600', letterSpacing: '0.025em' }}>
                    Context Switch
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', backgroundColor: '#dbeafe', color: '#1e3a8a', borderRadius: '0.25rem', fontWeight: '600' }}>
                    {dominantPattern.contextSwitchingFrequency !== undefined
                      ? (dominantPattern.contextSwitchingFrequency < 1 ? 'STABLE' : dominantPattern.contextSwitchingFrequency < 2 ? 'ADAPT' : 'HIGH')
                      : 'N/A'}
                  </span>
                </div>
                {hasEnoughData && dominantPattern.contextSwitchingFrequency !== undefined ? (
                  <>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb', marginBottom: '0.75rem', lineHeight: 1 }}>
                      {dominantPattern.contextSwitchingFrequency.toFixed(2)}
                      <span style={{ fontSize: '1rem', fontWeight: '600', color: '#6b7280', marginLeft: '0.25rem' }}>×/task</span>
                    </div>
                    <div style={{
                      height: '0.375rem',
                      backgroundColor: '#dbeafe',
                      borderRadius: '0.25rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                        width: `${Math.min((dominantPattern.contextSwitchingFrequency / 3) * 100, 100)}%`,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <p style={{ margin: '0.625rem 0 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                      {dominantPattern.contextSwitchingFrequency < 1
                        ? 'Consistent approach'
                        : dominantPattern.contextSwitchingFrequency < 2
                        ? 'Adaptable strategy'
                        : 'Highly experimental'}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                    {hasEnoughData ? 'No data available' : `🔒 Complete ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock`}
                  </p>
                )}
              </div>
            </div>

            {/* Pattern Streak (NEW) */}
            {dominantPattern.streakLength !== undefined && dominantPattern.streakLength > 0 && (
              <div style={{
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                border: '2px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔥</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '0.125rem' }}>
                      {dominantPattern.streakLength} Session Streak
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      You've maintained Pattern {dominantPattern.patternType} for {dominantPattern.streakLength} consecutive sessions
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              Last updated: {new Date(dominantPattern.updatedAt).toLocaleDateString()} at {new Date(dominantPattern.updatedAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Pattern Timeline */}
          {patternTimeline.length > 1 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '0.875rem', fontWeight: '600' }}>
                📅 Pattern History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {patternTimeline.slice(0, 5).map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#fff',
                      borderRadius: '0.375rem',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {/* Timeline badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        backgroundColor: getPatternColor(p.patternType),
                        borderRadius: '50%',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {p.patternType}
                    </div>

                    {/* Pattern info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                        Pattern {p.patternType} · {p.confidence !== undefined ? `${(p.confidence * 100).toFixed(0)}%` : 'N/A'} confidence
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                        {idx === 0 ? 'Current' : 'Previous'} • {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Metrics summary */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                      <div title="AI Reliance">
                        {p.aiRelianceScore !== undefined ? `${(p.aiRelianceScore * 100).toFixed(0)}% reliance` : 'N/A'}
                      </div>
                      <div title="Verification Score">
                        {p.verificationScore !== undefined ? `${(p.verificationScore * 100).toFixed(0)}% verified` : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Explanation Section */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #93c5fd',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '1rem' }}>📊 Understanding Your Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>🤖 AI Reliance Score</h4>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>
              Measures how much you depend on AI for task completion.
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.875rem', color: '#475569', paddingLeft: 0 }}>
              <li><strong>Low (0-30%)</strong>: You solve most problems independently</li>
              <li><strong>Medium (30-70%)</strong>: You balance AI assistance with independent work</li>
              <li><strong>High (70-100%)</strong>: You heavily rely on AI (higher risk)</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>✓ Verification Score</h4>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>
              Measures how thoroughly you verify and check AI outputs.
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.875rem', color: '#475569', paddingLeft: 0 }}>
              <li><strong>Low (0-30%)</strong>: You rarely verify AI outputs (risky)</li>
              <li><strong>Medium (30-70%)</strong>: You verify some outputs selectively</li>
              <li><strong>High (70-100%)</strong>: You thoroughly verify all AI outputs (best practice)</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>🔄 Context Switching</h4>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>
              How many times per task you change your approach or strategy.
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.875rem', color: '#475569', paddingLeft: 0 }}>
              <li><strong>&lt;1.0</strong>: Consistent approach (stable strategy)</li>
              <li><strong>1.0-2.0</strong>: Some adjustments (adaptive)</li>
              <li><strong>&gt;2.0</strong>: Frequent changes (experimental or uncertain)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Alerts Section */}
      {recentAlerts.length > 0 && (
        <div style={{
          backgroundColor: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#742a2a', fontSize: '1rem' }}>🚨 Recent Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentAlerts.map((alert) => {
              const severityIcon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟠' : '🔵';
              const bgColor = alert.severity === 'critical' ? '#fecaca' : alert.severity === 'warning' ? '#fed7aa' : '#bfdbfe';
              const textColor = alert.severity === 'critical' ? '#991b1b' : alert.severity === 'warning' ? '#92400e' : '#1e40af';

              return (
                <div
                  key={alert.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: bgColor,
                    borderRadius: '0.375rem',
                    borderLeft: `3px solid ${textColor}`,
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: textColor, marginBottom: '0.25rem' }}>
                    {severityIcon} {alert.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: textColor, opacity: 0.8 }}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userPatterns.length === 0 ? (
        <div className="empty-state">
          <p>No patterns recorded yet. Start making predictions to build your pattern profile.</p>
        </div>
      ) : (
        <div className="patterns-grid">
          {userPatterns.map((pattern) => (
            <div key={pattern.id} className="pattern-card">
              <div className="pattern-header">
                <h3>Pattern {pattern.patternType}</h3>
                <span className="pattern-badge">
                  Confidence: {pattern.confidence !== undefined ? `${(pattern.confidence * 100).toFixed(0)}%` : 'N/A'}
                  <InfoTooltip text="How confident the system is that this is your dominant pattern (0% = uncertain, 100% = very confident). Based on your interaction history." size="small" />
                </span>
              </div>

              <p className="pattern-description">
                {getPatternDescription(pattern.patternType)}
              </p>

              <div className="pattern-metrics">
                <div className="metric">
                  <span className="label">
                    AI Reliance Score
                    <InfoTooltip text="How much you depend on AI for task completion (0% = no reliance, 100% = full dependence)." size="small" />
                  </span>
                  <span className="value">
                    {hasEnoughData && pattern.aiRelianceScore !== undefined
                      ? `${(pattern.aiRelianceScore * 100).toFixed(0)}%`
                      : 'N/A'}
                  </span>
                  <span className="description">
                    {hasEnoughData
                      ? 'How much you depend on AI (lower is better for learning)'
                      : `Need ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock metrics`}
                  </span>
                </div>
                <div className="metric">
                  <span className="label">
                    Verification Score
                    <InfoTooltip text="How thoroughly you verify AI outputs (0% = no verification, 100% = complete verification)." size="small" />
                  </span>
                  <span className="value">
                    {hasEnoughData && pattern.verificationScore !== undefined
                      ? `${(pattern.verificationScore * 100).toFixed(0)}%`
                      : 'N/A'}
                  </span>
                  <span className="description">
                    {hasEnoughData
                      ? 'How thoroughly you verify AI outputs (higher is better)'
                      : `Need ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock metrics`}
                  </span>
                </div>
                <div className="metric">
                  <span className="label">
                    Context Switching
                    <InfoTooltip text="How often you change your approach within a task. Lower is more consistent, higher is more experimental." size="small" />
                  </span>
                  <span className="value">
                    {hasEnoughData && pattern.contextSwitchingFrequency !== undefined
                      ? `${pattern.contextSwitchingFrequency.toFixed(2)} times/task`
                      : 'N/A'}
                  </span>
                  <span className="description">
                    {hasEnoughData
                      ? 'How often you change strategy during tasks'
                      : `Need ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock metrics`}
                  </span>
                </div>
              </div>

              <div className="pattern-updated">
                Updated: {new Date(pattern.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metacognitive Ability Section */}
      {latestAssessment && latestAssessment.responses && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '2px solid #0ea5e9',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#0369a1', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🧠 Metacognitive Abilities (12 Dimensions)
            <InfoTooltip text="Your cognitive abilities for planning, monitoring, evaluating and regulating your work with AI. Based on MR19 Assessment." size="small" />
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Planning Dimension */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '2px solid #c7d2fe',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#4338ca', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📋 Planning
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {renderSubdimensionBar('P1', 'Task Decomposition', latestAssessment)}
                {renderSubdimensionBar('P2', 'Goal Setting', latestAssessment)}
                {renderSubdimensionBar('P3', 'Strategy Selection', latestAssessment)}
                {renderSubdimensionBar('P4', 'Resource Planning', latestAssessment)}
              </div>
            </div>

            {/* Monitoring Dimension */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '2px solid #bfdbfe',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👁️ Monitoring
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {renderSubdimensionBar('M1', 'Progress Tracking', latestAssessment)}
                {renderSubdimensionBar('M2', 'Quality Checking', latestAssessment)}
                {renderSubdimensionBar('M3', 'Context Monitoring', latestAssessment)}
              </div>
            </div>

            {/* Evaluation Dimension */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '2px solid #bbf7d0',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#15803d', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ Evaluation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {renderSubdimensionBar('E1', 'Result Evaluation', latestAssessment)}
                {renderSubdimensionBar('E2', 'Learning Reflection', latestAssessment)}
                {renderSubdimensionBar('E3', 'Capability Judgment', latestAssessment)}
              </div>
            </div>

            {/* Regulation Dimension */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '2px solid #fcd34d',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#b45309', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚙️ Regulation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {renderSubdimensionBar('R1', 'Strategy Adjustment', latestAssessment)}
                {renderSubdimensionBar('R2', 'Trust Calibration', latestAssessment)}
              </div>
            </div>
          </div>

          {/* Pattern-Metacognition Correlation */}
          {dominantPattern && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '0.375rem',
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                <strong>💡 Insight:</strong> Your dominant Pattern {dominantPattern.patternType} typically correlates with{' '}
                {getPatternMetacognitionCorrelation(dominantPattern.patternType)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pattern Guide */}
      <div className="pattern-guide">
        <h2>Pattern Guide</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <h4>Pattern A ⭐⭐⭐⭐⭐</h4>
            <p style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>Strategic Decomposition & Control</p>
            <p>Breaks tasks into clear subtasks with human control. Maintains verification standards and skill preservation through deliberate boundary-setting.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern B ⭐⭐⭐⭐</h4>
            <p style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>Iterative Refinement</p>
            <p>Rapid experimentation with 3-7 iterations, active learning through trial and error, continuous improvement mindset.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern C ⭐⭐⭐⭐</h4>
            <p style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>Context-Sensitive Adaptation</p>
            <p>Flexible strategies adapting to task complexity. Switches approaches based on context (44.9% of users). Balanced but variable engagement.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern D ⭐⭐⭐⭐⭐</h4>
            <p style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>Deep Verification</p>
            <p>Systematic verification, parallel problem-solving, thorough validation of AI outputs. Strong verification habits.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern E ⭐⭐⭐⭐</h4>
            <p style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>Pedagogical Reflection</p>
            <p>Learning-oriented approach, uses AI for self-development, focuses on understanding rather than just results. Growth mindset.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern F ⚠️ Risk</h4>
            <p style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>Passive Dependency</p>
            <p>Minimal metacognitive engagement, accepts AI outputs without verification. HIGH RISK for skill atrophy. Requires intervention.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternsPage;
