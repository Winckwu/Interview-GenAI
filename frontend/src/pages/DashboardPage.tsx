import React, { useEffect } from 'react';
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

  // Mock data for charts (in real app, this would come from API)
  const weeklyAccuracyData = [
    { week: 'Week 1', accuracy: 72 },
    { week: 'Week 2', accuracy: 75 },
    { week: 'Week 3', accuracy: 78 },
    { week: 'Week 4', accuracy: 81 },
  ];

  const patternDistribution = [
    { name: 'Pattern A', value: 15 },
    { name: 'Pattern B', value: 12 },
    { name: 'Pattern C', value: 10 },
    { name: 'Pattern D', value: 8 },
    { name: 'Pattern E', value: 3 },
    { name: 'Pattern F', value: 2 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const interventionData = [
    { strategy: 'Baseline', successRate: 68 },
    { strategy: 'Aggressive', successRate: 70 },
    { strategy: 'Adaptive', successRate: 73 },
  ];

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.username}! Here's your AI usage overview.</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
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

      {/* Charts Section */}
      <div className="charts-grid">
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
                data={Object.entries(patternDistribution).map(([name, value]) => ({
                  name: `Pattern ${name}`,
                  value: Math.round((value as number) * 100),
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(patternDistribution).map((entry, index) => (
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

      {/* Action Buttons */}
      <div className="page-actions">
        <button className="btn btn-primary">
          <a href="/predictions">Make a New Prediction</a>
        </button>
        <button className="btn btn-secondary">
          <a href="/patterns">View All Patterns</a>
        </button>
        <button className="btn btn-secondary">
          <a href="/evolution">Track Evolution</a>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
