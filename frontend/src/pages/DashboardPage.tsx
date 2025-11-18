import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStore } from '../stores/patternStore';
import { useUIStore } from '../stores/uiStore';
import { useSessionStore } from '../stores/sessionStore';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

import type { SessionItem } from '../stores/sessionStore';

/**
 * Dashboard Page
 * Main dashboard showing overview of AI usage patterns, system metrics, and recent conversations
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { patterns, predictions, evolutions, loading, fetchPatterns, fetchPredictions, fetchEvolutions } = usePatternStore();
  const { sessions, sessionsLoading, loadSessions, deleteSession: deleteSessionFromStore, error: sessionError } = useSessionStore();
  const [creatingSession, setCreatingSession] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

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

  // Load recent sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /**
   * Delete a session from the dashboard
   */
  const deleteSession = async (sessionToDeleteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to the session

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await deleteSessionFromStore(sessionToDeleteId);
    } catch (err: any) {
      console.error('Failed to delete session:', err);
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

      {/* Recent Conversations Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
          Recent Conversations
        </h2>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}>
          {sessionsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
              Loading conversations...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
              <p>No conversations yet. Start your first chat!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0' }}>
              {sessions.map((session, index) => {
                const isHoveringCard = hoveredSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    style={{
                      position: 'relative',
                      border: index % 2 === 0 ? '1px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      borderRight: index % 2 === 0 ? '1px solid #e5e7eb' : 'none',
                      background: '#fff',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={() => setHoveredSessionId(session.id)}
                    onMouseLeave={() => setHoveredSessionId(null)}
                  >
                    <button
                      onClick={() => navigate(`/session/${session.id}`)}
                      style={{
                        padding: '1.5rem',
                        background: isHoveringCard ? '#f9fafb' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        border: 'none',
                        flex: 1,
                        borderColor: isHoveringCard ? '#3b82f6' : '#e5e7eb',
                      }}
                    >
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {session.taskDescription}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}>
                        <span>📅</span>
                        <span>
                          {new Date(session.startedAt || session.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        textTransform: 'capitalize',
                      }}>
                        Type: {session.taskType}
                      </div>
                    </button>
                    {isHoveringCard && (
                      <div style={{
                        padding: '0.75rem',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.5rem',
                        backgroundColor: '#fafafa',
                      }}>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                          title="Delete conversation"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fecaca';
                            e.currentTarget.style.borderColor = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                            e.currentTarget.style.borderColor = '#fecaca';
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {sessions.length > 0 && (
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/sessions');
              }}
              style={{
                fontSize: '0.875rem',
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#3b82f6';
              }}
            >
              View All Conversations →
            </a>
          </div>
        )}
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
