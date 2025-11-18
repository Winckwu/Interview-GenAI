import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStore } from '../stores/patternStore';
import { useUIStore } from '../stores/uiStore';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Dashboard Page
 * Main dashboard showing overview of AI usage patterns and system metrics
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { patterns, predictions, evolutions, loading, fetchPatterns, fetchPredictions, fetchEvolutions } = usePatternStore();
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Handle start new session
  const handleStartSession = async () => {
    setCreatingSession(true);
    setSessionError(null);

    try {
      const response = await api.post('/sessions', {
        taskDescription: 'General AI interaction',
        taskType: 'general',
        taskImportance: 'medium',
      });

      const sessionId = response.data.data.session.id;
      navigate(`/session/${sessionId}`);
    } catch (err: any) {
      setSessionError(err.response?.data?.error || 'Failed to create session');
      setCreatingSession(false);
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchPatterns();
    fetchPredictions();
    fetchEvolutions();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Calculate metrics (ensure arrays)
  const patternArray = Array.isArray(patterns) ? patterns : [];
  const predictionArray = Array.isArray(predictions) ? predictions : [];
  const evolutionArray = Array.isArray(evolutions) ? evolutions : [];

  const totalPredictions = predictionArray.length;
  const correctPredictions = predictionArray.filter((p) => p.isCorrect).length;
  const predictionAccuracy = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : 0;

  const userPatterns = patternArray.filter((p) => p.userId === user?.id) || [];
  const currentPattern = userPatterns.length > 0 ? userPatterns[0] : null;

  const userEvolutions = evolutionArray.filter((e) => e.userId === user?.id) || [];
  const improvementCount = userEvolutions.filter((e) => e.changeType === 'improvement').length;

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.username}! Here's your AI usage overview.</p>
        </div>
        <button
          onClick={handleStartSession}
          disabled={creatingSession}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            fontWeight: '600',
            cursor: creatingSession ? 'not-allowed' : 'pointer',
            opacity: creatingSession ? 0.7 : 1,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            transition: 'all 150ms ease',
            transform: creatingSession ? 'scale(0.98)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!creatingSession) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (!creatingSession) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
            }
          }}
        >
          {creatingSession ? '⏳ Starting...' : '+ Start New Session'}
        </button>
      </div>

      {sessionError && (
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#fef2f2',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            color: '#991b1b',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
            animation: 'fadeIn 300ms ease',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>✕</span>
          <span style={{ fontWeight: '500' }}>{sessionError}</span>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Prediction Accuracy</div>
          <div className="metric-value">{predictionAccuracy}%</div>
          <div className="metric-description">
            {correctPredictions} of {totalPredictions} predictions correct
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Current Pattern</div>
          <div className="metric-value">{currentPattern?.patternType || 'N/A'}</div>
          <div className="metric-description">
            Confidence: {currentPattern ? `${(currentPattern.confidence * 100).toFixed(0)}%` : 'No data'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Pattern Evolution</div>
          <div className="metric-value">{userEvolutions.length}</div>
          <div className="metric-description">
            {improvementCount} improvements detected
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">User Type</div>
          <div className="metric-value" style={{ textTransform: 'capitalize' }}>
            {user?.userType || 'N/A'}
          </div>
          <div className="metric-description">Profile classification</div>
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
                data={patternDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {patternDistribution.map((entry, index) => (
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
              <span className="stat-label">Total Predictions:</span>
              <span className="stat-value">{totalPredictions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Accurate:</span>
              <span className="stat-value">{correctPredictions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Evolution Events:</span>
              <span className="stat-value">{userEvolutions.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Member Since:</span>
              <span className="stat-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="page-actions"
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <a
          href="/predictions"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            fontWeight: '600',
            textDecoration: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 150ms ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          ✨ Make a New Prediction
        </a>
        <a
          href="/patterns"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            fontWeight: '600',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.color = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
          }}
        >
          📊 View All Patterns
        </a>
        <a
          href="/evolution"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '0.75rem',
            fontWeight: '600',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.color = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
          }}
        >
          📈 Track Evolution
        </a>
      </div>
    </div>
  );
};

export default DashboardPage;
