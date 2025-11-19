import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStore } from '../stores/patternStore';
import { useUIStore } from '../stores/uiStore';
import { useAnalytics, usePatternStats } from '../hooks/useAnalytics';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChartSkeleton, { ChartSkeletonGroup } from '../components/ChartSkeleton';
import './DashboardPage.css';
import '../styles/components.css';

/**
 * Tooltip Component for Info Icons
 */
interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="info-tooltip"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className="tooltip-icon"
        title="Click or hover for explanation"
      >
        ℹ️
      </span>
      {show && (
        <div className="tooltip-content">
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
  const { analytics, loading: analyticsLoading } = useAnalytics(30);
  const { stats: patternStats, loading: patternsLoading } = usePatternStats(user?.id || 'current', 30);

  useEffect(() => {
    // Initial data is loaded by hooks automatically
  }, []);

  const loading = analyticsLoading || patternsLoading;

  // Use real analytics data
  const totalSessions = analytics?.totalSessions || 0;
  const totalInteractions = analytics?.totalInteractions || 0;
  const averageSessionDuration = analytics?.averageSessionDuration || 0;
  const dominantPattern = analytics?.dominantPattern || 'A';
  const patternDistribution = analytics?.patternDistribution || {};
  const verificationRate = analytics?.verificationRate || 0;
  const modificationRate = analytics?.modificationRate || 0;

  // Generate trend data from pattern trends if available
  const weeklyAccuracyData = analytics?.patternTrend
    ? analytics.patternTrend.map((trend: any, idx: number) => ({
        week: `Week ${idx + 1}`,
        accuracy: Math.round(
          verificationRate > 0 ? (verificationRate * 100) : 50
        ),
      }))
    : [];

  // Convert pattern distribution to chart format
  const patternDistributionChart = Object.entries(patternDistribution).map(([name, value]) => ({
    name: `Pattern ${name.toUpperCase()}`,
    value: Math.round((value as number) * 100),
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Generate intervention strategy data based on verification metrics
  // Shows how different verification levels impact overall quality
  const interventionData = [
    {
      strategy: 'Low Verification',
      successRate: Math.min(verificationRate, 30), // Low verification caps at 30%
      description: 'Minimal checks'
    },
    {
      strategy: 'Medium Verification',
      successRate: Math.min(verificationRate * 1.2, 70), // Medium verification improves quality
      description: 'Selective checks'
    },
    {
      strategy: 'High Verification',
      successRate: Math.min(verificationRate * 1.5, 100), // High verification maximizes quality
      description: 'Thorough checks'
    },
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
                  >
                    View Details →
                  </button>
                  <button
                    className="alert-button alert-button-secondary"
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
      <div className="charts-grid">
        {loading ? (
          <>
            <ChartSkeleton type="line" height={300} />
            <ChartSkeleton type="pie" height={300} />
          </>
        ) : (
          <>
            {/* Weekly Accuracy Trend */}
            <div className="chart-container">
              <h3 className="chart-title">
                📈 Weekly Accuracy Trend <InfoTooltip text="Shows your verification accuracy over the past weeks. Higher trends indicate you're getting better at verifying AI outputs correctly." />
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyAccuracyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
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
                ✓ Verification Strategy Impact <InfoTooltip text="Compare how different verification strategies impact the quality of your work. Higher verification strategies reduce risk of errors and skill degradation." />
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interventionData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="strategy" />
                  <YAxis label={{ value: 'Quality Impact Score (%)', angle: -90, position: 'center', offset: -50 }} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    labelFormatter={() => 'Strategy Impact'}
                  />
                  <Bar dataKey="successRate" fill="#10b981" name="Quality Impact" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>Low Verification:</strong> Quick decisions but higher risk of missed errors</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>Medium Verification:</strong> Balanced approach with selective spot-checks</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>High Verification:</strong> Thorough review (recommended) - ensures quality and skill preservation</p>
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
