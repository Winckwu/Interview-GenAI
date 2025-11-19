/**
 * Monitoring Dashboard: Real-time system metrics visualization
 *
 * Displays:
 * 1. Key Performance Indicators (compliance, dismissal, fatigue)
 * 2. System health (detection latency, alert count)
 * 3. Tier effectiveness (which tier has highest compliance)
 * 4. Recent alerts with severity indicators
 * 5. Pattern breakdown (most common patterns detected)
 */

import React, { useState, useEffect } from 'react';
import { metricsCollector, SystemMetrics, SessionMetrics, SystemAlert } from '../../utils/MetricsCollector';
import './MonitoringDashboard.css';

// KPI Tooltip Descriptions
const KPI_TOOLTIPS = {
  compliance: 'Percentage of AI suggestions users followed without dismissing them',
  dismissal: 'Percentage of AI suggestions users actively dismissed or overrode',
  engagement: 'User interaction rate with the intervention system',
  override: 'Percentage of AI suggestions users explicitly bypassed or contradicted',
  fatigue: 'Mental fatigue score (0-100) based on accumulated interaction load',
  detections: 'Total number of AI usage patterns detected in this session',
  completion: 'Percentage of started sessions that were completed',
  latency: 'Time taken to detect patterns (milliseconds)',
};

export interface MonitoringDashboardProps {
  refreshIntervalMs?: number; // Default: 5000ms (5 seconds)
  sessionId?: string; // If provided, show session-level metrics
  showAlerts?: boolean; // Default: true
  compactMode?: boolean; // Default: false
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  refreshIntervalMs = 5000,
  sessionId,
  showAlerts = true,
  compactMode = false,
}) => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  // Refresh metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(metricsCollector.getSystemMetrics());
      setAlerts(metricsCollector.getAlerts(5)); // Last 5 alerts

      if (sessionId) {
        const metrics = metricsCollector.getSessionMetrics(sessionId);
        if (metrics) {
          setSessionMetrics(metrics);
        }
      }
    }, refreshIntervalMs);

    // Initial fetch
    setSystemMetrics(metricsCollector.getSystemMetrics());
    if (sessionId) {
      const metrics = metricsCollector.getSessionMetrics(sessionId);
      if (metrics) {
        setSessionMetrics(metrics);
      }
    }
    setAlerts(metricsCollector.getAlerts(5));

    return () => clearInterval(interval);
  }, [sessionId, refreshIntervalMs]);

  const toggleAlert = (alertId: string) => {
    setExpandedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    metricsCollector.acknowledgeAlert(alertId);
    setAlerts([...alerts]); // Trigger re-render
  };

  if (compactMode && !sessionMetrics) {
    return null; // Don't show in compact mode if no session metrics
  }

  const metrics = sessionMetrics || systemMetrics;

  return (
    <div className="monitoring-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h3 className="dashboard-title">
          📊 {sessionMetrics ? 'Session Metrics' : 'System Metrics'}
        </h3>
        <div className="dashboard-timestamp">
          Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* Compliance Rate */}
        <div className="kpi-card" title={KPI_TOOLTIPS.compliance}>
          <div className="kpi-label">✅ Compliance Rate</div>
          <div className="kpi-value">
            {sessionMetrics
              ? `${(sessionMetrics.complianceRate * 100).toFixed(1)}%`
              : `${((systemMetrics?.avgComplianceRate || 0) * 100).toFixed(1)}%`}
          </div>
          <div className="kpi-bar">
            <div
              className="kpi-bar-fill compliance"
              style={{
                width: `${
                  (sessionMetrics
                    ? sessionMetrics.complianceRate
                    : systemMetrics?.avgComplianceRate || 0) * 100
                }%`,
              }}
            />
          </div>
          {sessionMetrics && (
            <div className="kpi-detail">
              {sessionMetrics.complianceCount} / {sessionMetrics.totalDisplays} interventions
            </div>
          )}
        </div>

        {/* Dismissal Rate */}
        <div className="kpi-card" title={KPI_TOOLTIPS.dismissal}>
          <div className="kpi-label">❌ Dismissal Rate</div>
          <div className="kpi-value">
            {sessionMetrics
              ? `${(sessionMetrics.dismissalRate * 100).toFixed(1)}%`
              : `${((systemMetrics?.avgDismissalRate || 0) * 100).toFixed(1)}%`}
          </div>
          <div className="kpi-bar">
            <div
              className="kpi-bar-fill dismissal"
              style={{
                width: `${
                  (sessionMetrics
                    ? sessionMetrics.dismissalRate
                    : systemMetrics?.avgDismissalRate || 0) * 100
                }%`,
              }}
            />
          </div>
          {sessionMetrics && (
            <div className="kpi-detail">
              {sessionMetrics.dismissalCount} dismissals
            </div>
          )}
        </div>

        {/* Engagement Rate */}
        <div className="kpi-card" title={KPI_TOOLTIPS.engagement}>
          <div className="kpi-label">👥 Engagement Rate</div>
          <div className="kpi-value">
            {sessionMetrics
              ? `${(sessionMetrics.engagementRate * 100).toFixed(1)}%`
              : `${((systemMetrics?.avgEngagementRate || 0) * 100).toFixed(1)}%`}
          </div>
          <div className="kpi-bar">
            <div
              className="kpi-bar-fill engagement"
              style={{
                width: `${
                  (sessionMetrics
                    ? sessionMetrics.engagementRate
                    : systemMetrics?.avgEngagementRate || 0) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Override Rate */}
        <div className="kpi-card" title={KPI_TOOLTIPS.override}>
          <div className="kpi-label">🚀 Override Rate</div>
          <div className="kpi-value">
            {sessionMetrics
              ? `${(sessionMetrics.overrideRate * 100).toFixed(1)}%`
              : `${((systemMetrics?.avgOverrideRate || 0) * 100).toFixed(1)}%`}
          </div>
          <div className="kpi-bar">
            <div
              className="kpi-bar-fill override"
              style={{
                width: `${
                  (sessionMetrics
                    ? sessionMetrics.overrideRate
                    : systemMetrics?.avgOverrideRate || 0) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Fatigue Score */}
        {sessionMetrics && (
          <div className="kpi-card" title={KPI_TOOLTIPS.fatigue}>
            <div className="kpi-label">😴 Fatigue Score</div>
            <div className="kpi-value">
              {sessionMetrics.avgFatigueScore.toFixed(0)} / 100
            </div>
            <div className="kpi-bar">
              <div
                className="kpi-bar-fill fatigue"
                style={{
                  width: `${(sessionMetrics.avgFatigueScore / 100) * 100}%`,
                }}
              />
            </div>
            <div className="kpi-detail">
              Max: {sessionMetrics.maxFatigueScore.toFixed(0)}
            </div>
          </div>
        )}

        {/* Detection Count */}
        {sessionMetrics && (
          <div className="kpi-card" title={KPI_TOOLTIPS.detections}>
            <div className="kpi-label">🎯 Detections</div>
            <div className="kpi-value">{sessionMetrics.totalDetections}</div>
            <div className="kpi-detail">
              Avg confidence: {(sessionMetrics.averageConfidence * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {/* System Health */}
        {systemMetrics && !sessionMetrics && (
          <>
            <div className="kpi-card" title={KPI_TOOLTIPS.completion}>
              <div className="kpi-label">🏥 Completion Rate</div>
              <div className="kpi-value">
                {(systemMetrics.completionRate * 100).toFixed(1)}%
              </div>
              <div className="kpi-bar">
                <div
                  className="kpi-bar-fill completion"
                  style={{
                    width: `${systemMetrics.completionRate * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="kpi-card" title={KPI_TOOLTIPS.latency}>
              <div className="kpi-label">⏱️ Detection Latency (P95)</div>
              <div className="kpi-value">{systemMetrics.p95DetectionLatency.toFixed(0)}ms</div>
              <div className="kpi-detail">
                P50: {systemMetrics.p50DetectionLatency.toFixed(0)}ms | P99:{' '}
                {systemMetrics.p99DetectionLatency.toFixed(0)}ms
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tier Effectiveness (if not session metrics) */}
      {systemMetrics && !sessionMetrics && (
        <div className="section">
          <h4 className="section-title">📈 Tier Effectiveness</h4>
          <div className="tier-breakdown">
            <div className="tier-item">
              <span className="tier-label">Tier 1 (Soft)</span>
              <span className="tier-badge">Non-blocking tips</span>
            </div>
            <div className="tier-item">
              <span className="tier-label">Tier 2 (Medium)</span>
              <span className="tier-badge">Orange alerts</span>
            </div>
            <div className="tier-item">
              <span className="tier-label">Tier 3 (Hard)</span>
              <span className="tier-badge highlight">Most Effective: {systemMetrics.mostEffectiveTier}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Breakdown */}
      {systemMetrics && systemMetrics.mostCommonPatterns.length > 0 && !sessionMetrics && (
        <div className="section">
          <h4 className="section-title">🎨 Top Patterns Detected</h4>
          <div className="pattern-list">
            {systemMetrics.mostCommonPatterns.map((pattern) => (
              <div key={pattern.type} className="pattern-item">
                <span className="pattern-name">{pattern.type}</span>
                <span className="pattern-count">×{pattern.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier Breakdown (for session metrics) */}
      {sessionMetrics && (
        <div className="section">
          <h4 className="section-title">📊 Tier Breakdown</h4>
          <div className="tier-stats">
            {Object.entries(sessionMetrics.tierBreakdown).map(([tier, count]) => (
              <div key={tier} className="tier-stat">
                <span className="tier-name">{tier.toUpperCase()}</span>
                <span className="tier-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {showAlerts && alerts.length > 0 && (
        <div className="section alerts-section">
          <div className="section-header">
            <h4 className="section-title">⚠️ Recent Alerts ({alerts.length})</h4>
            {alerts.some((a) => !a.acknowledged) && (
              <div className="alert-indicator">
                {alerts.filter((a) => !a.acknowledged).length} unread
              </div>
            )}
          </div>

          <div className="alerts-list">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-item alert-${alert.severity} ${
                  alert.acknowledged ? 'acknowledged' : ''
                }`}
              >
                <div
                  className="alert-header"
                  onClick={() => toggleAlert(alert.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="alert-severity">
                    {alert.severity === 'critical' && '🔴'}
                    {alert.severity === 'warning' && '🟠'}
                    {alert.severity === 'info' && '🔵'}
                  </span>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                  {!alert.acknowledged && (
                    <button
                      className="alert-ack-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        acknowledgeAlert(alert.id);
                      }}
                    >
                      ✓
                    </button>
                  )}
                </div>

                {expandedAlerts.has(alert.id) && (
                  <div className="alert-details">
                    <div className="alert-type">Type: {alert.type}</div>
                    {alert.sessionId && (
                      <div className="alert-session">Session: {alert.sessionId.slice(0, 8)}...</div>
                    )}
                    <div className="alert-full-message">{alert.message}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!metrics && !showAlerts && (
        <div className="empty-state">
          <p>No metrics data available yet.</p>
          <p className="empty-state-hint">
            Metrics will be populated as interventions are displayed and users interact with them.
          </p>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
