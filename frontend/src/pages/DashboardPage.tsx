import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStore } from '../stores/patternStore';
import { useUIStore } from '../stores/uiStore';
import { useAssessmentStore } from '../stores/assessmentStore';
import { useAnalytics, usePatternStats } from '../hooks/useAnalytics';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChartSkeleton, { ChartSkeletonGroup } from '../components/ChartSkeleton';
import InfoTooltip from '../components/InfoTooltip';
import HoverTooltip from '../components/HoverTooltip';
import './DashboardPage.css';
import '../styles/components.css';

/**
 * Dashboard Page
 * Main dashboard showing overview of AI usage patterns and system metrics
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { latestAssessment, fetchLatestAssessment } = useAssessmentStore();

  // Date range state - default to 7 days
  const [dateRange, setDateRange] = useState<number>(7);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { analytics, loading: analyticsLoading } = useAnalytics(dateRange);
  const { stats: patternStats, loading: patternsLoading } = usePatternStats(user?.id || 'current', dateRange);
  const [verificationStrategyData, setVerificationStrategyData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch latest assessment when component mounts
    if (user?.id) {
      fetchLatestAssessment(user.id);
    }
  }, [user?.id, fetchLatestAssessment]);

  useEffect(() => {
    // Show welcome modal for first-time users without assessment
    if (user?.id && latestAssessment === null) {
      const hasSkippedAssessment = localStorage.getItem(`assessment_skipped_${user.id}`);
      if (!hasSkippedAssessment) {
        // Delay showing modal slightly for better UX
        const timer = setTimeout(() => setShowWelcomeModal(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, latestAssessment]);

  useEffect(() => {
    // Fetch verification strategy data when date range changes
    const fetchVerificationStrategy = async () => {
      try {
        const response = await apiService.analytics.getVerificationStrategy(dateRange);
        setVerificationStrategyData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch verification strategy data:', error);
        // Set empty data on error
        setVerificationStrategyData([]);
      }
    };
    fetchVerificationStrategy();
  }, [dateRange]);

  const loading = analyticsLoading || patternsLoading;

  // Use real analytics data
  const totalSessions = analytics?.totalSessions || 0;
  const totalInteractions = analytics?.totalInteractions || 0;
  const averageSessionDuration = analytics?.averageSessionDuration || 0;
  const dominantPattern = analytics?.dominantPattern || 'A';
  const patternDistribution = analytics?.patternDistribution || {};
  const verificationRate = analytics?.verificationRate || 0;
  const modificationRate = analytics?.modificationRate || 0;

  // Generate daily trend data from pattern trends if available
  const dailyAccuracyData = analytics?.patternTrend
    ? analytics.patternTrend.map((trend: any, idx: number) => ({
        day: `Day ${idx + 1}`,
        date: trend.date ? new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${idx + 1}`,
        accuracy: trend.verificationRate !== undefined ? trend.verificationRate : 0,
      }))
    : [];

  // Convert pattern distribution to chart format
  const patternDistributionChart = Object.entries(patternDistribution).map(([name, value]) => ({
    name: `Pattern ${name.toUpperCase()}`,
    value: Math.round((value as number) * 100),
  }));

  // Modern gradient colors for better visual appeal
  const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
  ];

  // Custom label component for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontWeight: 600, fontSize: '14px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
      >
        {`${value}%`}
      </text>
    );
  };

  // Use real verification strategy data from backend
  // Maps real user behavior to quality impact scores
  const interventionData = verificationStrategyData.length > 0
    ? verificationStrategyData.map(item => ({
        strategy: item.strategy,
        successRate: item.qualityScore,
        sampleSize: item.sampleSize,
      }))
    : [
        { strategy: 'Low Verification', successRate: 0, sampleSize: 0 },
        { strategy: 'Medium Verification', successRate: 0, sampleSize: 0 },
        { strategy: 'High Verification', successRate: 0, sampleSize: 0 },
      ];

  // Detect pattern change by checking if current dominantPattern differs from initial pattern
  // For now, only show alert if we have meaningful data
  const lastKnownPattern = 'A'; // Could be loaded from localStorage or previous session
  const patternChanged = dominantPattern !== lastKnownPattern && totalSessions > 0;

  const handleSkipAssessment = () => {
    if (user?.id) {
      localStorage.setItem(`assessment_skipped_${user.id}`, 'true');
    }
    setShowWelcomeModal(false);
  };

  const handleTakeAssessment = () => {
    setShowWelcomeModal(false);
    navigate('/assessment');
  };

  return (
    <div className="dashboard-page">
      {/* Welcome Modal for First-time Users */}
      {showWelcomeModal && (
        <div className="welcome-modal-overlay" onClick={handleSkipAssessment}>
          <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="welcome-modal-close"
              onClick={handleSkipAssessment}
              aria-label="Close welcome modal"
            >
              ×
            </button>
            <div className="welcome-modal-icon">🧠</div>
            <h2 className="welcome-modal-title">
              Discover Your Metacognitive Profile
            </h2>
            <p className="welcome-modal-description">
              Take a 10-minute assessment to understand your AI usage patterns and get personalized recommendations
              to improve your metacognitive skills across Planning, Monitoring, Evaluation, and Regulation.
            </p>
            <div className="welcome-modal-actions">
              <button
                className="welcome-modal-button welcome-modal-button-primary"
                onClick={handleTakeAssessment}
              >
                Take Assessment Now
              </button>
              <button
                className="welcome-modal-button welcome-modal-button-secondary"
                onClick={handleSkipAssessment}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="dashboard-container" style={{ marginBottom: '2rem' }}>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.username}! Here's your AI usage overview.
          </p>
        </div>

        {/* Insight Alert Box - High Priority */}
        {patternChanged && (
          <div className="insight-alert">
            <div className="alert-header">
              <div className="alert-icon">⚡</div>
              <div className="alert-content">
                <h3 className="alert-title">
                  Pattern Recognition Update!
                </h3>
                <p className="alert-message">
                  Your AI usage pattern has been updated from Pattern {lastKnownPattern} to Pattern {dominantPattern} with {(analytics?.confidence || 0.8) * 100}% confidence.
                  This indicates positive changes in how you're using AI.
                </p>
                <div className="alert-actions">
                  <button
                    className="alert-button alert-button-primary"
                    onClick={() => navigate('/patterns')}
                    aria-label="View pattern change details"
                  >
                    View Details →
                  </button>
                  <button
                    className="alert-button alert-button-secondary"
                    onClick={() => {
                      // Dismiss the alert by updating the "last known pattern"
                      // In a real app, this would update localStorage or state
                    }}
                    aria-label="Dismiss pattern recognition update notification"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-section">
        <div className="metrics-grid">
          {loading ? (
            <>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
            </>
          ) : (
            <>
              <HoverTooltip tooltip="Number of conversation sessions with actual interactions. Auto-created empty sessions are not counted." showIcon={true}>
                <div className="metric-card">
                  <div className="metric-label">Total Sessions</div>
                  <div className="metric-value">{totalSessions}</div>
                  <div className="metric-description">
                    {totalInteractions} total interactions recorded
                  </div>
                </div>
              </HoverTooltip>

              <HoverTooltip tooltip="Your dominant AI usage pattern based on recent interactions. Each pattern has different characteristics and risk profiles." showIcon={true}>
                <div className="metric-card">
                  <div className="metric-label">Current Pattern</div>
                  <div className="metric-value" style={{ fontSize: '2.5rem' }}>Pattern {dominantPattern}</div>
                  <div className="metric-description">
                    Primary AI usage pattern detected
                  </div>
                </div>
              </HoverTooltip>

              <HoverTooltip tooltip="Percentage of AI outputs you verify or check. Higher is better for maintaining skill integrity." showIcon={true}>
                <div className="metric-card">
                  <div className="metric-label">Verification Rate</div>
                  <div className="metric-value">{verificationRate.toFixed(1)}%</div>
                  <div className="metric-description">
                    {verificationRate > 70 ? '✅ Excellent verification level' : verificationRate > 40 ? '📊 Moderate verification' : '⚠️ Low verification - consider increasing'}
                  </div>
                </div>
              </HoverTooltip>

              <HoverTooltip tooltip="Average duration of your conversation sessions in minutes. Longer sessions may indicate deeper engagement or comprehensive problem-solving." showIcon={true}>
                <div className="metric-card">
                  <div className="metric-label">Average Session</div>
                  <div className="metric-value">{Math.round(averageSessionDuration)} min</div>
                  <div className="metric-description">
                    Minutes per session
                  </div>
                </div>
              </HoverTooltip>
            </>
          )}
        </div>
      </div>

      {/* Metacognitive Assessment Results Section */}
      {latestAssessment && latestAssessment.responses && (
        <div className="assessment-results-section" style={{ marginBottom: '2rem' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              🧠 Your Metacognitive Profile
            </h2>
            <button
              onClick={() => navigate('/assessment')}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Retake Assessment
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {latestAssessment.responses.dimensions && Object.entries(latestAssessment.responses.dimensions).map(([dimension, data]: [string, any]) => {
              const colors = {
                planning: { bg: '#eff6ff', border: '#3b82f6', icon: '📐' },
                monitoring: { bg: '#f0fdf4', border: '#10b981', icon: '👁️' },
                evaluation: { bg: '#fef3c7', border: '#f59e0b', icon: '⚖️' },
                regulation: { bg: '#fce7f3', border: '#ec4899', icon: '🔄' },
              };
              const color = colors[dimension as keyof typeof colors] || colors.planning;

              return (
                <div
                  key={dimension}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: color.bg,
                    borderLeft: `4px solid ${color.border}`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{color.icon}</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>
                    {dimension}
                  </h3>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: color.border, marginBottom: '0.5rem' }}>
                    {(data.score * 100).toFixed(0)}%
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    backgroundColor: data.level === 'strong' ? '#10b981' : data.level === 'moderate' ? '#f59e0b' : '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {data.level}
                  </div>
                </div>
              );
            })}
          </div>

          {latestAssessment.responses.areasForGrowth && latestAssessment.responses.areasForGrowth.length > 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              borderLeft: '4px solid #64748b',
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                💡 Areas for Growth
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.6' }}>
                {latestAssessment.responses.areasForGrowth.map((area: string, idx: number) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}


      {/* Charts Section */}
      <div className="charts-section">
        {/* Date Range Selector */}
        <div className="date-range-selector" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="dateRange" style={{ fontWeight: 500, color: '#374151' }}>
            Time Period:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing data from the past {dateRange} day{dateRange !== 1 ? 's' : ''}
          </span>
        </div>

      <div className="charts-grid">
        {loading ? (
          <>
            <ChartSkeleton type="line" height={300} />
            <ChartSkeleton type="pie" height={300} />
          </>
        ) : (
          <>
            {/* Daily Accuracy Trend */}
            <HoverTooltip tooltip="Shows your verification accuracy over the past days. Higher trends indicate you're getting better at verifying AI outputs correctly." showIcon={true}>
              <div className="chart-container">
                <h3 className="chart-title">
                  Daily Accuracy Trend
                </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyAccuracyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="url(#colorAccuracy)"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </HoverTooltip>

            {/* Pattern Distribution */}
            <HoverTooltip tooltip="Shows the breakdown of AI usage patterns you employ. Understanding your pattern mix helps identify if you're over-relying on certain approaches." showIcon={true}>
              <div className="chart-container">
                <h3 className="chart-title">
                  Pattern Distribution
                </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patternDistributionChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {patternDistributionChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </HoverTooltip>

            {/* Intervention Strategy Comparison */}
            <HoverTooltip tooltip="Real data showing how your verification behavior affects work quality. Based on your actual interactions with AI outputs." showIcon={true}>
              <div className="chart-container">
                <h3 className="chart-title">
                  Verification Strategy Impact
                </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interventionData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="strategy"
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                  />
                  <YAxis
                    label={{
                      value: 'Quality Score (%)',
                      angle: -90,
                      position: 'center',
                      offset: -50,
                      style: { fontSize: '12px', fontWeight: 600, fill: '#6b7280' }
                    }}
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value}%`,
                      `Quality Score (${props.payload.sampleSize} interactions)`
                    ]}
                    labelFormatter={(label: string) => label}
                  />
                  <Bar
                    dataKey="successRate"
                    fill="url(#colorBar)"
                    name="Quality Score"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                <p style={{ margin: '0.5rem 0' }}>📊 <strong>Real Data:</strong> Final quality scores represent output quality AFTER verification process</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>Low (~30-65%):</strong> No verification - accepted AI outputs directly (risky, potential errors remain)</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>Medium (~75-90%):</strong> Verified and found issues to fix (good practice - errors caught and corrected)</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>High (~90-100%):</strong> Verified and accepted without modifications (best practice - quality confirmed)</p>
                <p style={{ margin: '0.5rem 0', fontStyle: 'italic', color: '#64748b' }}>
                  ℹ️ Higher scores indicate better final output quality. Verification improves quality by catching errors.
                </p>
              </div>
              </div>
            </HoverTooltip>

            {/* Quick Stats */}
            <div className="chart-container stats-container">
              <h3>Quick Stats</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Total Sessions:</span>
                  <span className="stat-value">{totalSessions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Interactions:</span>
                  <span className="stat-value">{totalInteractions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Modification Rate:</span>
                  <span className="stat-value">{modificationRate.toFixed(1)}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Member Since:</span>
                  <span className="stat-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      {/* Quick Actions */}
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>⚡ Quick Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {/* Start New Chat */}
          <button
            onClick={() => navigate('/chat')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#fff',
              border: '2px solid #3b82f6',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'center',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#eff6ff';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '2rem' }}>💬</span>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>Start Chat</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Interact with AI</div>
            </div>
          </button>

          {/* View Patterns */}
          <button
            onClick={() => navigate('/patterns')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#fff',
              border: '2px solid #10b981',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'center',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0fdf4';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '2rem' }}>📊</span>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>View Patterns</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Analyze usage patterns</div>
            </div>
          </button>

          {/* Track Evolution */}
          <button
            onClick={() => navigate('/evolution')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#fff',
              border: '2px solid #f59e0b',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'center',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fffbeb';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '2rem' }}>📈</span>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>Track Evolution</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>View learning progress</div>
            </div>
          </button>

          {/* Assessment */}
          <button
            onClick={() => navigate('/assessment')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#fff',
              border: '2px solid #8b5cf6',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'center',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#faf5ff';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '2rem' }}>🎯</span>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>Self Assessment</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Understand your capabilities</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
