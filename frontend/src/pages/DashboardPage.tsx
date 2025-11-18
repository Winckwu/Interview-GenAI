import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStore } from '../stores/patternStore';
import { useUIStore } from '../stores/uiStore';
import { useAnalytics, usePatternStats } from '../hooks/useAnalytics';
import LoadingSpinner from '../components/common/LoadingSpinner';

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

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

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
  const interventionData = [
    { strategy: 'Low Verification', successRate: Math.round(verificationRate * 50) },
    { strategy: 'Medium Verification', successRate: Math.round(verificationRate * 75) },
    { strategy: 'High Verification', successRate: Math.round(verificationRate * 100) },
  ];

  // Detect pattern change by checking if current dominantPattern differs from initial pattern
  // For now, only show alert if we have meaningful data
  const lastKnownPattern = 'A'; // Could be loaded from localStorage or previous session
  const patternChanged = dominantPattern !== lastKnownPattern && totalSessions > 0;

  return (
    <div className="page dashboard-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem 0' }}>
      {/* Header Section */}
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem', marginBottom: '2rem' }}>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>Dashboard</h1>
          <p className="page-subtitle" style={{ margin: '0', fontSize: '1rem', color: '#6b7280' }}>
            Welcome back, {user?.username}! Here's your AI usage overview.
          </p>
        </div>

        {/* Insight Alert Box - High Priority */}
        {patternChanged && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem' }}>⚡</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#15803d' }}>
                  Pattern Recognition Update!
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#166534', lineHeight: '1.5' }}>
                  Your AI usage pattern has been updated from Pattern {lastKnownPattern} to Pattern {dominantPattern} with {(analytics?.confidence || 0.8) * 100}% confidence.
                  This indicates positive changes in how you're using AI.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => navigate('/patterns')}
                    style={{
                      padding: '0.5rem 1.25rem',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                    }}
                  >
                    View Details →
                  </button>
                  <button
                    style={{
                      padding: '0.5rem 1.25rem',
                      backgroundColor: 'transparent',
                      color: '#166534',
                      border: '1px solid #86efac',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0fdf4';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
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
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem', marginBottom: '2rem' }}>
        <div className="metrics-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}>
        <div className="metric-card">
          <div className="metric-label">Total Sessions</div>
          <div className="metric-value">{totalSessions}</div>
          <div className="metric-description">
            {totalInteractions} total interactions recorded
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Current Pattern</div>
          <div className="metric-value" style={{ fontSize: '2.5rem' }}>Pattern {dominantPattern}</div>
          <div className="metric-description">
            Primary AI usage pattern detected
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Verification Rate</div>
          <div className="metric-value">{verificationRate.toFixed(1)}%</div>
          <div className="metric-description">
            AI outputs verified: {Math.round(verificationRate)}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Average Session</div>
          <div className="metric-value">{averageSessionDuration}</div>
          <div className="metric-description">
            Minutes per session
          </div>
        </div>
      </div>
      </div>

      {/* Charts Section */}
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Weekly Accuracy Trend */}
        <div className="chart-container">
          <h3>Weekly Accuracy Trend</h3>
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
          <h3>Pattern Distribution</h3>
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
          <h3>Intervention Strategy Effectiveness</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interventionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="strategy" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successRate" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
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
