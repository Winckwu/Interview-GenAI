import React, { useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStats } from '../hooks/useAnalytics';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getPatternProfile, type BehavioralPattern } from '../utils/metacognitiveTypeSystem';

/**
 * Evolution Tracking Page
 * Monitor how behavioral patterns evolve over time based on real usage data
 */
const EvolutionTrackingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { trends, loading, error } = usePatternStats(user?.id || '', 90); // Last 90 days

  // Pattern quality hierarchy (higher index = better pattern)
  const PATTERN_QUALITY: Record<BehavioralPattern, number> = {
    F: 0, // Passive Over-Reliance (worst)
    C: 1, // Adaptive Adjustment
    D: 2, // Deep Verification
    E: 3, // Teaching & Learning
    B: 4, // Iterative Optimization
    A: 5, // Strategic Decomposition (best)
  };

  // Compute evolution analysis from trend data
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

    // Filter out data before user joined
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

    // Analyze each pattern transition
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
          // Same quality but different pattern - check if oscillation
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

    // Generate daily data for chart
    const dailyData = filteredTrends.map((trend, idx) => {
      const patternProfile = getPatternProfile(trend.pattern as BehavioralPattern);
      const quality = PATTERN_QUALITY[trend.pattern as BehavioralPattern] || 0;

      return {
        date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: trend.date,
        pattern: trend.pattern,
        patternName: patternProfile.name, // Use English name
        quality: quality * 20, // Scale 0-5 to 0-100 for visualization
        qualityRaw: quality,
        color: patternProfile.color,
        icon: patternProfile.icon,
      };
    });

    // Determine overall trend
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner message="Loading evolution data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Failed to Load Data</h2>
        <p style={{ color: '#6b7280' }}>{error}</p>
      </div>
    );
  }

  const {
    changes,
    improvements,
    regressions,
    migrations,
    oscillations,
    dailyData,
    currentPattern,
    overallTrend,
  } = evolutionAnalysis;

  const currentPatternProfile = currentPattern ? getPatternProfile(currentPattern) : null;

  // Trend indicator
  const trendConfig = {
    improving: { icon: '📈', color: '#10b981', label: 'Improving', bgColor: '#d1fae5' },
    declining: { icon: '📉', color: '#ef4444', label: 'Declining', bgColor: '#fee2e2' },
    stable: { icon: '➡️', color: '#3b82f6', label: 'Stable', bgColor: '#dbeafe' },
    volatile: { icon: '🔄', color: '#f59e0b', label: 'Volatile', bgColor: '#fef3c7' },
  };

  const trend = trendConfig[overallTrend];

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
            📊 Pattern Evolution Tracking
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: '#6b7280' }}>
            Monitor how your AI usage patterns evolve over time (last 90 days)
          </p>
        </div>

        {/* Current Status Card */}
        {currentPatternProfile && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: `3px solid ${currentPatternProfile.color}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between' }}>
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
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.25rem' }}>
              {changes.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Pattern transitions detected
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
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#10b981', marginBottom: '0.25rem' }}>
              {improvements}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Positive behavioral changes
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
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.25rem' }}>
              {regressions}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Negative behavioral changes
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
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
              {oscillations}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Pattern instability events
            </div>
          </div>
        </div>

        {/* Evolution Chart */}
        {dailyData.length > 0 ? (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
              Daily Pattern Evolution
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
                  dot={{
                    fill: '#3b82f6',
                    r: 4,
                    strokeWidth: 2,
                    stroke: '#fff',
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
              No Evolution Data Yet
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
              Continue using the system to track how your AI usage patterns evolve over time
            </p>
          </div>
        )}

        {/* Recent Changes Timeline */}
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
              {changes.slice(-10).reverse().map((change, idx) => {
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

        {/* Interpretation Guide */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
            Understanding Pattern Evolution
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                Moving towards more efficient patterns (A/B/E). Positive behavioral change detected - keep it up!
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
                Moving towards less efficient patterns (C/F). May indicate increasing AI reliance - review your approach.
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
                Lateral shift between patterns of similar quality. Adapting to new contexts or strategies.
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
                Switching back and forth between patterns. Inconsistent behavior - consider establishing consistent practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionTrackingPage;
