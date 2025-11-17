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
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: '600',
            cursor: creatingSession ? 'not-allowed' : 'pointer',
            opacity: creatingSession ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {creatingSession ? 'Starting...' : '+ Start New Session'}
        </button>
      </div>

      {sessionError && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem', marginBottom: '1rem', color: '#991b1b' }}>
          {sessionError}
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
