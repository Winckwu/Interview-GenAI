import React, { useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStats, useAnalytics } from '../hooks/useAnalytics';
import { useAssessmentStore } from '../stores/assessmentStore';
import { usePatternStore } from '../stores/patternStore';
import { useMetricsStore } from '../stores/metricsStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InfoTooltip from '../components/InfoTooltip';
import { getPatternProfile, type BehavioralPattern } from '../utils/metacognitiveTypeSystem';

/**
 * Pattern Analysis Page
 * Comprehensive view of behavioral patterns, evolution, and metacognitive abilities
 *
 * Combines:
 * - Current pattern status with key metrics
 * - 90-day evolution timeline
 * - Recent pattern changes
 * - 12-dimension metacognitive assessment
 */
const PatternAnalysisPage: React.FC = () => {
  const { user } = useAuthStore();
  const { trends, loading: trendsLoading, error: trendsError } = usePatternStats(user?.id || '', 90);
  const { analytics, loading: analyticsLoading } = useAnalytics(30);
  const { latestAssessment, fetchLatestAssessment } = useAssessmentStore();
  const { patterns, fetchPatterns } = usePatternStore();
  const { alerts } = useMetricsStore();

  useEffect(() => {
    if (user?.id) {
      fetchLatestAssessment(user.id);
      fetchPatterns(user.id);
    }
  }, [user?.id, fetchLatestAssessment, fetchPatterns]);

  const loading = trendsLoading || analyticsLoading;

  // Get user patterns and dominant pattern
  const userPatterns = patterns.filter((p) => p.userId === user?.id);
  const dominantPattern = userPatterns.length > 0
    ? userPatterns.reduce((prev, current) =>
        (prev.confidence > current.confidence) ? prev : current
      )
    : null;

  // Minimum interactions threshold - use totalInteractions from pattern data
  const MIN_INTERACTIONS_THRESHOLD = 15;
  const totalInteractions = dominantPattern?.totalInteractions ?? 0;
  const hasEnoughData = totalInteractions >= MIN_INTERACTIONS_THRESHOLD;

  // Recent alerts
  const recentAlerts = (alerts || []).slice(0, 5);

  // Pattern quality hierarchy
  const PATTERN_QUALITY: Record<BehavioralPattern, number> = {
    F: 0, C: 1, D: 2, E: 3, B: 4, A: 5,
  };

  // Compute evolution analysis
  const evolutionAnalysis = useMemo(() => {
    if (!trends || trends.length === 0) {
      return {
        changes: [],
        improvements: 0,
        regressions: 0,
        migrations: 0,
        oscillations: 0,
        dailyData: [],
        currentPattern: null,
        overallTrend: 'stable' as 'improving' | 'declining' | 'stable' | 'volatile',
      };
    }

    // Filter data from user join date
    const userJoinDate = user?.createdAt ? new Date(user.createdAt) : null;
    const filteredTrends = userJoinDate
      ? trends.filter(trend => new Date(trend.date) >= userJoinDate)
      : trends;

    if (filteredTrends.length === 0) {
      return {
        changes: [],
        improvements: 0,
        regressions: 0,
        migrations: 0,
        oscillations: 0,
        dailyData: [],
        currentPattern: null,
        overallTrend: 'stable' as 'improving' | 'declining' | 'stable' | 'volatile',
      };
    }

    const changes: Array<{
      date: string;
      fromPattern: string;
      toPattern: string;
      changeType: 'improvement' | 'regression' | 'migration' | 'oscillation';
      qualityChange: number;
    }> = [];

    let improvements = 0;
    let regressions = 0;
    let migrations = 0;
    let oscillations = 0;

    // Analyze transitions
    for (let i = 1; i < filteredTrends.length; i++) {
      const prev = filteredTrends[i - 1];
      const curr = filteredTrends[i];

      if (prev.pattern !== curr.pattern) {
        const fromQuality = PATTERN_QUALITY[prev.pattern as BehavioralPattern] || 0;
        const toQuality = PATTERN_QUALITY[curr.pattern as BehavioralPattern] || 0;
        const qualityChange = toQuality - fromQuality;

        let changeType: 'improvement' | 'regression' | 'migration' | 'oscillation';

        if (qualityChange > 0) {
          changeType = 'improvement';
          improvements++;
        } else if (qualityChange < 0) {
          changeType = 'regression';
          regressions++;
        } else {
          const isPrevPatternRecentlyUsed = filteredTrends
            .slice(Math.max(0, i - 5), i - 1)
            .some(t => t.pattern === curr.pattern);

          if (isPrevPatternRecentlyUsed) {
            changeType = 'oscillation';
            oscillations++;
          } else {
            changeType = 'migration';
            migrations++;
          }
        }

        changes.push({
          date: curr.date,
          fromPattern: prev.pattern,
          toPattern: curr.pattern,
          changeType,
          qualityChange,
        });
      }
    }

    // Generate 90-day range but only show data points where we have data
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const firstDataDate = userJoinDate && userJoinDate > ninetyDaysAgo ? userJoinDate : ninetyDaysAgo;

    // Create full 90-day timeline
    const dailyData: Array<{
      date: string;
      fullDate: Date;
      pattern: string | null;
      patternName: string | null;
      quality: number | null;
      qualityRaw: number | null;
      color: string | null;
      icon: string | null;
    }> = [];

    for (let d = new Date(firstDataDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const trendData = filteredTrends.find(t => t.date.startsWith(dateStr));

      if (trendData) {
        const patternProfile = getPatternProfile(trendData.pattern as BehavioralPattern);
        const quality = PATTERN_QUALITY[trendData.pattern as BehavioralPattern] || 0;

        dailyData.push({
          date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: new Date(d),
          pattern: trendData.pattern,
          patternName: patternProfile.name,
          quality: quality * 20,
          qualityRaw: quality,
          color: patternProfile.color,
          icon: patternProfile.icon,
        });
      } else {
        // Add null data points for days without data (will create gaps in the line)
        dailyData.push({
          date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: new Date(d),
          pattern: null,
          patternName: null,
          quality: null,
          qualityRaw: null,
          color: null,
          icon: null,
        });
      }
    }

    // Overall trend
    const firstQuality = PATTERN_QUALITY[filteredTrends[0].pattern as BehavioralPattern] || 0;
    const lastQuality = PATTERN_QUALITY[filteredTrends[filteredTrends.length - 1].pattern as BehavioralPattern] || 0;
    const qualityDelta = lastQuality - firstQuality;

    let overallTrend: 'improving' | 'declining' | 'stable' | 'volatile';
    if (oscillations > improvements + regressions) {
      overallTrend = 'volatile';
    } else if (qualityDelta > 1) {
      overallTrend = 'improving';
    } else if (qualityDelta < -1) {
      overallTrend = 'declining';
    } else {
      overallTrend = 'stable';
    }

    return {
      changes,
      improvements,
      regressions,
      migrations,
      oscillations,
      dailyData,
      currentPattern: filteredTrends[filteredTrends.length - 1]?.pattern as BehavioralPattern,
      overallTrend,
    };
  }, [trends, user?.createdAt]);

  // Render subdimension bar
  const renderSubdimensionBar = (code: string, label: string, assessment: any) => {
    const responses = assessment.responses || {};
    const subdimScores = responses.subdimensionScores || [];
    const found = subdimScores.find((s: any) => s.dimension === code);
    const rawScore = found ? found.score : 0;
    const percentage = rawScore > 0 ? ((rawScore - 1) / 4) * 100 : 0;

    const getColor = (score: number) => {
      if (score >= 4) return '#10b981';
      if (score >= 3) return '#3b82f6';
      return '#f59e0b';
    };

    return (
      <div key={code} style={{ marginBottom: '0.75rem' }}>
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

  // Pattern-Metacognition correlation helper
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner message="Loading pattern analysis..." />
      </div>
    );
  }

  if (trendsError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Failed to Load Data</h2>
        <p style={{ color: '#6b7280' }}>{trendsError}</p>
      </div>
    );
  }

  const {
    changes,
    improvements,
    regressions,
    oscillations,
    dailyData,
    currentPattern,
    overallTrend,
  } = evolutionAnalysis;

  const currentPatternProfile = currentPattern ? getPatternProfile(currentPattern) : null;

  const trendConfig = {
    improving: { icon: '📈', color: '#10b981', label: 'Improving', bgColor: '#d1fae5' },
    declining: { icon: '📉', color: '#ef4444', label: 'Declining', bgColor: '#fee2e2' },
    stable: { icon: '➡️', color: '#3b82f6', label: 'Stable', bgColor: '#dbeafe' },
    volatile: { icon: '🔄', color: '#f59e0b', label: 'Volatile', bgColor: '#fef3c7' },
  };

  const trend = trendConfig[overallTrend];

  // Analytics metrics
  const totalSessions = analytics?.totalSessions || 0;
  const verificationRate = analytics?.verificationRate || 0;
  const modificationRate = analytics?.modificationRate || 0;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            📊 Pattern Analysis
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: '#6b7280' }}>
            Comprehensive analysis of your AI usage patterns, evolution, and metacognitive abilities
          </p>
        </div>

        {/* Current Pattern Card */}
        {currentPatternProfile && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: `3px solid ${currentPatternProfile.color}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  fontSize: '3rem',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${currentPatternProfile.color}20`,
                  borderRadius: '16px',
                }}>
                  {currentPatternProfile.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Current Pattern
                  </div>
                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: currentPatternProfile.color }}>
                    Pattern {currentPattern} - {currentPatternProfile.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    {currentPatternProfile.description}
                  </p>
                </div>
              </div>
              <div style={{
                padding: '1rem 1.5rem',
                backgroundColor: trend.bgColor,
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{trend.icon}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: trend.color }}>
                  {trend.label}
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Total Sessions */}
              <div style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)',
                border: '2px solid #bfdbfe',
                borderRadius: '0.75rem',
              }}>
                <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Total Sessions
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb', lineHeight: 1 }}>
                  {totalSessions}
                </div>
              </div>

              {/* Verification Rate */}
              <div style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)',
                border: '2px solid #bbf7d0',
                borderRadius: '0.75rem',
              }}>
                <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Verification Rate
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', lineHeight: 1 }}>
                  {verificationRate.toFixed(0)}%
                </div>
              </div>

              {/* Modification Rate */}
              <div style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fff 100%)',
                border: '2px solid #fcd34d',
                borderRadius: '0.75rem',
              }}>
                <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Modification Rate
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#d97706', lineHeight: 1 }}>
                  {modificationRate.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Detailed Pattern Metrics from patternStore */}
            {dominantPattern && (
              <>
                {/* Confidence and Stability Bars */}
                <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Confidence Level */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Confidence
                        <InfoTooltip text="How confident we are in this pattern classification based on your usage data" size="small" />
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: currentPatternProfile.color }}>
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
                      }}>
                        <div style={{
                          width: `${dominantPattern.confidence * 100}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${currentPatternProfile.color}, ${currentPatternProfile.color}dd)`,
                          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
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

                  {/* Stability */}
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
                      }}>
                        <div style={{
                          width: `${dominantPattern.stability * 100}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #059669, #10b981)',
                          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                  {/* AI Reliance Score */}
                  <div style={{
                    padding: '1.25rem',
                    background: dominantPattern.aiRelianceScore !== undefined ? 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)' : '#f9fafb',
                    border: dominantPattern.aiRelianceScore !== undefined ? '2px solid #fecaca' : '2px dashed #d1d5db',
                    borderRadius: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600' }}>
                        AI Reliance
                        <InfoTooltip text="How much you depend on AI for task completion (0% = no reliance, 100% = full dependence)" size="small" />
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
                        <div style={{ height: '0.375rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #dc2626, #ef4444)', width: `${Math.min(dominantPattern.aiRelianceScore * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                        {hasEnoughData ? 'No data' : `🔒 ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock`}
                      </p>
                    )}
                  </div>

                  {/* Verification Score */}
                  <div style={{
                    padding: '1.25rem',
                    background: dominantPattern.verificationScore !== undefined ? 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)' : '#f9fafb',
                    border: dominantPattern.verificationScore !== undefined ? '2px solid #bbf7d0' : '2px dashed #d1d5db',
                    borderRadius: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600' }}>
                        Verification
                        <InfoTooltip text="How thoroughly you verify AI outputs (0% = no verification, 100% = complete verification)" size="small" />
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
                        <div style={{ height: '0.375rem', backgroundColor: '#dcfce7', borderRadius: '0.25rem', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', width: `${Math.min(dominantPattern.verificationScore * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                        {hasEnoughData ? 'No data' : `🔒 ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock`}
                      </p>
                    )}
                  </div>

                  {/* Context Switching */}
                  <div style={{
                    padding: '1.25rem',
                    background: dominantPattern.contextSwitchingFrequency !== undefined ? 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)' : '#f9fafb',
                    border: dominantPattern.contextSwitchingFrequency !== undefined ? '2px solid #bfdbfe' : '2px dashed #d1d5db',
                    borderRadius: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '600' }}>
                        Context Switch
                        <InfoTooltip text="How often you change your approach within a task. Lower is more consistent." size="small" />
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
                        <div style={{ height: '0.375rem', backgroundColor: '#dbeafe', borderRadius: '0.25rem', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #2563eb, #3b82f6)', width: `${Math.min((dominantPattern.contextSwitchingFrequency / 3) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                        {hasEnoughData ? 'No data' : `🔒 ${MIN_INTERACTIONS_THRESHOLD - totalInteractions} more interactions to unlock`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pattern Streak */}
                {dominantPattern.streakLength !== undefined && dominantPattern.streakLength > 0 && (
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '0.75rem',
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
              </>
            )}
          </div>
        )}

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#742a2a', fontSize: '1rem' }}>🚨 Recent Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentAlerts.map((alert: any) => {
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

        {/* Evolution Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Total Changes
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3b82f6' }}>
              {changes.length}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #d1fae5',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Improvements
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#10b981' }}>
              {improvements}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fee2e2',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Regressions
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ef4444' }}>
              {regressions}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fef3c7',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Oscillations
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {oscillations}
            </div>
          </div>
        </div>

        {/* 90-Day Evolution Chart */}
        {dailyData.length > 0 ? (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
              90-Day Pattern Evolution
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  label={{
                    value: 'Pattern Quality (0-100)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: '12px', fontWeight: 600, fill: '#6b7280' }
                  }}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickFormatter={(value) => {
                    const patterns = ['F', 'C', 'D', 'E', 'B', 'A'];
                    return patterns[value / 20] || '';
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: '#fff',
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    const data = props.payload;
                    if (!data.pattern) return ['No data', ''];
                    return [
                      <div key="pattern">
                        <div style={{ fontWeight: 700, color: data.color, marginBottom: '0.25rem' }}>
                          {data.icon} Pattern {data.pattern}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {data.patternName}
                        </div>
                      </div>,
                      '',
                    ];
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}
                />
                <Area
                  type="monotone"
                  dataKey="quality"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#qualityGradient)"
                  connectNulls={false}
                  dot={(props: any) => {
                    if (props.payload.quality === null) return null;
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill="#3b82f6"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 3,
                    stroke: '#fff',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Pattern Legend */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              {(['A', 'B', 'E', 'D', 'C', 'F'] as BehavioralPattern[]).map(pattern => {
                const profile = getPatternProfile(pattern);
                return (
                  <div key={pattern} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: `${profile.color}20`,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                    }}>
                      {profile.icon}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: profile.color }}>
                      {pattern}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {profile.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
              No Pattern Data Yet
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
              Continue using the system to track how your AI usage patterns evolve over time
            </p>
          </div>
        )}

        {/* Recent Changes */}
        {changes.length > 0 && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
              Recent Pattern Changes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {changes.slice(-5).reverse().map((change, idx) => {
                const changeConfig = {
                  improvement: { icon: '🟢', color: '#10b981', bgColor: '#d1fae5', label: 'Improvement' },
                  regression: { icon: '🔴', color: '#ef4444', bgColor: '#fee2e2', label: 'Regression' },
                  migration: { icon: '🔵', color: '#3b82f6', bgColor: '#dbeafe', label: 'Migration' },
                  oscillation: { icon: '🟡', color: '#f59e0b', bgColor: '#fef3c7', label: 'Oscillation' },
                };

                const config = changeConfig[change.changeType];
                const fromProfile = getPatternProfile(change.fromPattern as BehavioralPattern);
                const toProfile = getPatternProfile(change.toPattern as BehavioralPattern);

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      backgroundColor: config.bgColor,
                      borderLeft: `4px solid ${config.color}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{config.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: config.color, textTransform: 'uppercase' }}>
                          {config.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {new Date(change.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                        {fromProfile.icon} Pattern {change.fromPattern} ({fromProfile.name})
                        <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>→</span>
                        {toProfile.icon} Pattern {change.toPattern} ({toProfile.name})
                      </div>
                      {change.qualityChange !== 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Quality change: {change.qualityChange > 0 ? '+' : ''}{change.qualityChange}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metacognitive Abilities */}
        {latestAssessment && latestAssessment.responses && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🧠 Metacognitive Abilities (12 Dimensions)
              <InfoTooltip text="Your cognitive abilities for planning, monitoring, evaluating and regulating your work with AI. Based on MR19 Assessment." size="small" />
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Planning */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '2px solid #c7d2fe',
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#4338ca', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📋 Planning
                </h3>
                {renderSubdimensionBar('P1', 'Task Decomposition', latestAssessment)}
                {renderSubdimensionBar('P2', 'Goal Setting', latestAssessment)}
                {renderSubdimensionBar('P3', 'Strategy Selection', latestAssessment)}
                {renderSubdimensionBar('P4', 'Resource Planning', latestAssessment)}
              </div>

              {/* Monitoring */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '2px solid #bfdbfe',
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  👁️ Monitoring
                </h3>
                {renderSubdimensionBar('M1', 'Progress Tracking', latestAssessment)}
                {renderSubdimensionBar('M2', 'Quality Checking', latestAssessment)}
                {renderSubdimensionBar('M3', 'Context Monitoring', latestAssessment)}
              </div>

              {/* Evaluation */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '2px solid #bbf7d0',
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#15803d', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✅ Evaluation
                </h3>
                {renderSubdimensionBar('E1', 'Result Evaluation', latestAssessment)}
                {renderSubdimensionBar('E2', 'Learning Reflection', latestAssessment)}
                {renderSubdimensionBar('E3', 'Capability Judgment', latestAssessment)}
              </div>

              {/* Regulation */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '2px solid #fcd34d',
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#b45309', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚙️ Regulation
                </h3>
                {renderSubdimensionBar('R1', 'Strategy Adjustment', latestAssessment)}
                {renderSubdimensionBar('R2', 'Trust Calibration', latestAssessment)}
              </div>
            </div>

            {/* Pattern-Metacognition Correlation */}
            {currentPattern && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderLeft: '4px solid #f59e0b',
                borderRadius: '0.375rem',
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                  <strong>💡 Insight:</strong> Your dominant Pattern {currentPattern} typically correlates with{' '}
                  {getPatternMetacognitionCorrelation(currentPattern)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Metrics Explanation Section */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #93c5fd',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '1rem' }}>📊 Understanding Your Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.875rem' }}>🤖 AI Reliance Score</h4>
              <p style={{ margin: '0', fontSize: '0.8125rem', color: '#475569' }}>
                Measures how much you depend on AI for task completion.
              </p>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.8125rem', color: '#475569', paddingLeft: 0 }}>
                <li><strong>Low (0-30%)</strong>: Solve most problems independently</li>
                <li><strong>Medium (30-70%)</strong>: Balance AI with independent work</li>
                <li><strong>High (70-100%)</strong>: Heavy AI reliance (higher risk)</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.875rem' }}>✓ Verification Score</h4>
              <p style={{ margin: '0', fontSize: '0.8125rem', color: '#475569' }}>
                Measures how thoroughly you verify AI outputs.
              </p>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.8125rem', color: '#475569', paddingLeft: 0 }}>
                <li><strong>Low (0-30%)</strong>: Rarely verify (risky)</li>
                <li><strong>Medium (30-70%)</strong>: Selective verification</li>
                <li><strong>High (70-100%)</strong>: Thorough verification (best)</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.875rem' }}>🔄 Context Switching</h4>
              <p style={{ margin: '0', fontSize: '0.8125rem', color: '#475569' }}>
                How often you change your approach per task.
              </p>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.8125rem', color: '#475569', paddingLeft: 0 }}>
                <li><strong>&lt;1.0</strong>: Consistent approach (stable)</li>
                <li><strong>1.0-2.0</strong>: Some adjustments (adaptive)</li>
                <li><strong>&gt;2.0</strong>: Frequent changes (experimental)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interpretation Guide */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
            Understanding Pattern Evolution
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#d1fae5',
              borderRadius: '8px',
              border: '2px solid #10b981',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '700', color: '#065f46' }}>
                🟢 Improvement
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#047857', lineHeight: '1.6' }}>
                Moving towards more efficient patterns (A/B/E). Positive behavioral change - keep it up!
              </p>
            </div>
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              border: '2px solid #ef4444',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '700', color: '#991b1b' }}>
                🔴 Regression
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#b91c1c', lineHeight: '1.6' }}>
                Moving towards less efficient patterns (C/F). May indicate increasing AI reliance.
              </p>
            </div>
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#dbeafe',
              borderRadius: '8px',
              border: '2px solid #3b82f6',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '700', color: '#1e40af' }}>
                🔵 Migration
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e3a8a', lineHeight: '1.6' }}>
                Lateral shift between patterns of similar quality. Adapting to new contexts.
              </p>
            </div>
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '2px solid #f59e0b',
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '700', color: '#92400e' }}>
                🟡 Oscillation
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#b45309', lineHeight: '1.6' }}>
                Switching back and forth between patterns. Consider establishing consistent practices.
              </p>
            </div>
          </div>
        </div>

        {/* Pattern Guide */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
            Pattern Guide
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {(['A', 'B', 'C', 'D', 'E', 'F'] as BehavioralPattern[]).map(pattern => {
              const profile = getPatternProfile(pattern);
              return (
                <div key={pattern} style={{
                  padding: '1.25rem',
                  backgroundColor: `${profile.color}10`,
                  borderRadius: '8px',
                  border: `2px solid ${profile.color}40`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>{profile.icon}</div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: profile.color }}>
                      Pattern {pattern}
                    </h4>
                    {profile.riskLevel === 'high' && (
                      <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', fontWeight: '600' }}>
                        ⚠️ Risk
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: profile.color }}>
                    {profile.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                    {profile.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternAnalysisPage;
