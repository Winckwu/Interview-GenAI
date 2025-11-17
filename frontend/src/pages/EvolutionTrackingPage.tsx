import React, { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePatternStore } from '../stores/patternStore';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Evolution Tracking Page
 * Monitor how user patterns evolve over time
 */
const EvolutionTrackingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { evolutions, loading, fetchEvolutions } = usePatternStore();

  useEffect(() => {
    fetchEvolutions(user?.id);
  }, [user?.id, fetchEvolutions]);

  if (loading) {
    return <LoadingSpinner message="Loading evolution data..." />;
  }

  const userEvolutions = evolutions.filter((e) => e.userId === user?.id);

  const improvementCount = userEvolutions.filter((e) => e.changeType === 'improvement').length;
  const migrationCount = userEvolutions.filter((e) => e.changeType === 'migration').length;
  const oscillationCount = userEvolutions.filter((e) => e.changeType === 'oscillation').length;
  const regressionCount = userEvolutions.filter((e) => e.changeType === 'regression').length;

  // Mock timeline data
  const evolutionTimeline = userEvolutions.map((e, idx) => ({
    week: `Week ${idx + 1}`,
    improvements: userEvolutions.filter((ev, i) => i <= idx && ev.changeType === 'improvement').length,
    migrations: userEvolutions.filter((ev, i) => i <= idx && ev.changeType === 'migration').length,
    changes: userEvolutions.filter((ev, i) => i <= idx).length,
  }));

  return (
    <div className="page evolution-page">
      <div className="page-header">
        <h1>Pattern Evolution</h1>
        <p className="page-subtitle">Track how your AI usage patterns are evolving over time</p>
      </div>

      {/* Evolution Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Changes</div>
          <div className="metric-value">{userEvolutions.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Improvements</div>
          <div className="metric-value" style={{ color: '#10b981' }}>{improvementCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Migrations</div>
          <div className="metric-value" style={{ color: '#3b82f6' }}>{migrationCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Oscillations</div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>{oscillationCount}</div>
        </div>
      </div>

      {/* Evolution Chart */}
      {evolutionTimeline.length > 0 && (
        <div className="chart-container">
          <h3>Evolution Timeline</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={evolutionTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="changes" stroke="#3b82f6" strokeWidth={2} name="Total Changes" />
              <Line type="monotone" dataKey="improvements" stroke="#10b981" strokeWidth={2} name="Improvements" />
              <Line type="monotone" dataKey="migrations" stroke="#8b5cf6" strokeWidth={2} name="Migrations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Evolution Events */}
      <div className="evolution-list">
        <h3>Evolution Events</h3>
        {userEvolutions.length === 0 ? (
          <div className="empty-state">
            <p>No evolution events recorded yet. Continue with predictions to track pattern changes.</p>
          </div>
        ) : (
          <div className="events-timeline">
            {userEvolutions.map((evolution, idx) => (
              <div key={evolution.id} className="evolution-event">
                <div className={`event-badge change-type-${evolution.changeType}`}>
                  {evolution.changeType.charAt(0).toUpperCase() + evolution.changeType.slice(1)}
                </div>
                <div className="event-content">
                  <h4>
                    Pattern {evolution.fromPattern} → Pattern {evolution.toPattern}
                  </h4>
                  <p className="event-date">{new Date(evolution.createdAt).toLocaleDateString()}</p>
                  {evolution.metrics && Object.keys(evolution.metrics).length > 0 && (
                    <div className="event-metrics">
                      {Object.entries(evolution.metrics).map(([key, value]) => (
                        <span key={key} className="metric">
                          {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interpretation Guide */}
      <div className="guide-section">
        <h3>Understanding Pattern Evolution</h3>
        <div className="guide-grid">
          <div className="guide-card">
            <h4>🟢 Improvement</h4>
            <p>Moving towards more efficient patterns (A/B). Positive behavioral change detected.</p>
          </div>
          <div className="guide-card">
            <h4>🔵 Migration</h4>
            <p>Lateral shift between patterns. Adapting to new contexts or strategies.</p>
          </div>
          <div className="guide-card">
            <h4>🟡 Oscillation</h4>
            <p>Switching back and forth between patterns. Inconsistent or context-dependent behavior.</p>
          </div>
          <div className="guide-card">
            <h4>🔴 Regression</h4>
            <p>Moving towards less efficient patterns (E/F). May indicate increasing AI reliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionTrackingPage;
