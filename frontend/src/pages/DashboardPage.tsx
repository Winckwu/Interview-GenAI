import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStore } from '../stores/patternStore';
import { useUIStore } from '../stores/uiStore';
import { useAnalytics, usePatternStats } from '../hooks/useAnalytics';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChartSkeleton, { ChartSkeletonGroup } from '../components/ChartSkeleton';
import './DashboardPage.css';
import '../styles/components.css';

/**
 * Tooltip Component for Info Icons
 * Accessible to both mouse and keyboard users
 */
interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShow(!show);
    } else if (e.key === 'Escape') {
      setShow(false);
    }
  };

  return (
    <div
      className="info-tooltip"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className="tooltip-icon"
        role="button"
        tabIndex={0}
        aria-label="More information"
        aria-expanded={show}
        title="Click or hover for explanation"
        onKeyDown={handleKeyDown}
        onClick={() => setShow(!show)}
        style={{ cursor: 'pointer' }}
      >
        ℹ️
      </span>
      {show && (
        <div className="tooltip-content" role="tooltip">
          {text}
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
};

/**
 * Dashboard Page
 * Main dashboard showing overview of AI usage patterns and system metrics
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Date range state - default to 7 days
  const [dateRange, setDateRange] = useState<number>(7);

  const { analytics, loading: analyticsLoading } = useAnalytics(dateRange);
  const { stats: patternStats, loading: patternsLoading } = usePatternStats(user?.id || 'current', dateRange);
  const [verificationStrategyData, setVerificationStrategyData] = useState<any[]>([]);

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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

  return (
    <div className="dashboard-page">
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
              <div className="metric-card" title="Number of conversation sessions with actual interactions. Auto-created empty sessions are not counted.">
                <div className="metric-label">Total Sessions <InfoTooltip text="Number of conversation sessions with actual interactions. Auto-created empty sessions are not counted." /></div>
                <div className="metric-value">{totalSessions}</div>
                <div className="metric-description">
                  {totalInteractions} total interactions recorded
                </div>
              </div>

              <div className="metric-card" title="Your dominant AI usage pattern based on recent interactions. Each pattern has different characteristics and risk profiles.">
                <div className="metric-label">Current Pattern <InfoTooltip text="Your dominant AI usage pattern based on recent interactions. Each pattern has different characteristics and risk profiles." /></div>
                <div className="metric-value" style={{ fontSize: '2.5rem' }}>Pattern {dominantPattern}</div>
                <div className="metric-description">
                  Primary AI usage pattern detected
                </div>
              </div>

              <div className="metric-card" title="Percentage of AI outputs you verify or check. Higher is better for maintaining skill integrity.">
                <div className="metric-label">Verification Rate <InfoTooltip text="Percentage of AI outputs you verify or check. Higher is better for maintaining skill integrity." /></div>
                <div className="metric-value">{verificationRate.toFixed(1)}%</div>
                <div className="metric-description">
                  {verificationRate > 70 ? '✅ Excellent verification level' : verificationRate > 40 ? '📊 Moderate verification' : '⚠️ Low verification - consider increasing'}
                </div>
              </div>

              <div className="metric-card" title="Average duration of your conversation sessions in minutes. Longer sessions may indicate deeper engagement or comprehensive problem-solving.">
                <div className="metric-label">Average Session <InfoTooltip text="Average duration of your conversation sessions in minutes. Longer sessions may indicate deeper engagement or comprehensive problem-solving." /></div>
                <div className="metric-value">{averageSessionDuration}</div>
                <div className="metric-description">
                  Minutes per session
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
            <div className="chart-container">
              <h3 className="chart-title">
                📈 Daily Accuracy Trend <InfoTooltip text="Shows your verification accuracy over the past days. Higher trends indicate you're getting better at verifying AI outputs correctly." />
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyAccuracyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pattern Distribution */}
            <div className="chart-container">
              <h3 className="chart-title">
                🎯 Pattern Distribution <InfoTooltip text="Shows the breakdown of AI usage patterns you employ. Understanding your pattern mix helps identify if you're over-relying on certain approaches." />
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patternDistributionChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {patternDistributionChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Intervention Strategy Comparison */}
            <div className="chart-container">
              <h3 className="chart-title">
                ✓ Verification Strategy Impact <InfoTooltip text="Real data showing how your verification behavior affects work quality. Based on your actual interactions with AI outputs." />
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interventionData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="strategy" />
                  <YAxis label={{ value: 'Quality Score (%)', angle: -90, position: 'center', offset: -50 }} />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value}%`,
                      `Quality Score (${props.payload.sampleSize} interactions)`
                    ]}
                    labelFormatter={(label: string) => label}
                  />
                  <Bar dataKey="successRate" fill="#10b981" name="Quality Score" />
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
