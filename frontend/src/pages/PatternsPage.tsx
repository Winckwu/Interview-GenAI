import React, { useEffect, useState } from 'react';
import { usePatternStore } from '../stores/patternStore';
import { useAuthStore } from '../stores/authStore';
import { useMetricsStore } from '../stores/metricsStore';
import { metricsCollector } from '../utils/MetricsCollector';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './PatternsPage.css';

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
      style={{ display: 'inline-block', position: 'relative', marginLeft: '0.5rem' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        style={{
          fontSize: '0.85rem',
          cursor: 'help',
          color: '#3b82f6',
          fontWeight: 'bold',
        }}
        title="Click or hover for explanation"
      >
        ℹ️
      </span>
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '-100px',
            right: '-100px',
            width: '250px',
            backgroundColor: '#1f2937',
            color: '#fff',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            lineHeight: '1.4',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            marginBottom: '0.5rem',
            pointerEvents: 'auto',
            textTransform: 'none',
          }}
        >
          {text}
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #1f2937',
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Patterns Page
 * View and analyze user AI usage patterns
 */
const PatternsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { patterns, loading, fetchPatterns } = usePatternStore();
  const { systemMetrics, alerts } = useMetricsStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchPatterns(user.id);
    }
  }, [user?.id]);

  // Auto-refresh metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading patterns..." />;
  }

  const userPatterns = patterns.filter((p) => p.userId === user?.id);
  const systemMetricsData = systemMetrics || {
    totalDetections: 0,
    totalInterventions: 0,
    complianceRate: 0,
    dismissalRate: 0,
    engagementRate: 0,
    overrideRate: 0,
    completionRate: 0,
    dropoutRate: 0,
  };
  const recentAlerts = (alerts || []).slice(0, 5);

  const getPatternDescription = (patternType: string): string => {
    const descriptions: Record<string, string> = {
      A: 'Strategic Decomposition & Control - Task-focused planning with human oversight. High verification (>70%), maintains skill preservation through boundary maintenance.',
      B: 'Iterative Refinement & Calibration - Experimental learning through rapid iteration. Accepts initial imperfection, learns from failures, dynamically calibrates trust levels.',
      C: 'Context-Sensitive Adaptation - Flexible strategy switching based on task characteristics. Dynamically adjusts AI reliance depending on task importance, familiarity, and time pressure.',
      D: 'Deep Verification & Critical Engagement - Systematic skepticism with high verification (>90%). Multi-tool cross-checking, assumption testing, and critical reasoning.',
      E: 'Pedagogical Reflection & Self-Monitoring - Learning-oriented with strong metacognitive awareness. Uses AI as teaching tool, maintains learning logs, regularly practices without AI.',
      F: '⚠️ Ineffective & Passive Usage - High-risk pattern with low verification (<10%). Uncritical acceptance, minimal engagement, and risk of skill degradation.',
    };
    return descriptions[patternType] || 'Unknown pattern';
  };

  return (
    <div className="page patterns-page">
      <div className="page-header">
        <h1>AI Usage Patterns</h1>
        <p className="page-subtitle">Understand your AI usage behavior and patterns</p>
      </div>

      {/* Metrics Explanation Section */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #93c5fd',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '1rem' }}>📊 Understanding Your Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>🤖 AI Reliance Score</h4>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>
              Measures how much you depend on AI for task completion.
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.875rem', color: '#475569', paddingLeft: 0 }}>
              <li><strong>Low (0-30%)</strong>: You solve most problems independently</li>
              <li><strong>Medium (30-70%)</strong>: You balance AI assistance with independent work</li>
              <li><strong>High (70-100%)</strong>: You heavily rely on AI (higher risk)</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>✓ Verification Score</h4>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>
              Measures how thoroughly you verify and check AI outputs.
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.875rem', color: '#475569', paddingLeft: 0 }}>
              <li><strong>Low (0-30%)</strong>: You rarely verify AI outputs (risky)</li>
              <li><strong>Medium (30-70%)</strong>: You verify some outputs selectively</li>
              <li><strong>High (70-100%)</strong>: You thoroughly verify all AI outputs (best practice)</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>🔄 Context Switching</h4>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>
              How many times per task you change your approach or strategy.
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.875rem', color: '#475569', paddingLeft: 0 }}>
              <li><strong>&lt;1.0</strong>: Consistent approach (stable strategy)</li>
              <li><strong>1.0-2.0</strong>: Some adjustments (adaptive)</li>
              <li><strong>&gt;2.0</strong>: Frequent changes (experimental or uncertain)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Real-Time System Metrics Section */}
      <div key={refreshKey} style={{
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1rem' }}>📈 Real-Time System Metrics</h3>

        {/* KPI Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Compliance Rate */}
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Compliance Rate
              <InfoTooltip text="Percentage of intervention displays where users took action (acted/engaged)." />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
              {((systemMetricsData.complianceRate || 0) * 100).toFixed(1)}%
            </div>
            <div style={{
              height: '0.375rem',
              backgroundColor: '#d1fae5',
              borderRadius: '0.25rem',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#059669',
                width: `${Math.min((systemMetricsData.complianceRate || 0) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Dismissal Rate */}
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Dismissal Rate
              <InfoTooltip text="Percentage of intervention displays where users dismissed the message (lower is better)." />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706', marginBottom: '0.5rem' }}>
              {((systemMetricsData.dismissalRate || 0) * 100).toFixed(1)}%
            </div>
            <div style={{
              height: '0.375rem',
              backgroundColor: '#fed7aa',
              borderRadius: '0.25rem',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#d97706',
                width: `${Math.min((systemMetricsData.dismissalRate || 0) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Engagement Rate */}
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Engagement Rate
              <InfoTooltip text="Percentage of users who clicked 'Learn More' to understand intervention recommendations." />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.5rem' }}>
              {((systemMetricsData.engagementRate || 0) * 100).toFixed(1)}%
            </div>
            <div style={{
              height: '0.375rem',
              backgroundColor: '#bfdbfe',
              borderRadius: '0.25rem',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#2563eb',
                width: `${Math.min((systemMetricsData.engagementRate || 0) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Override Rate */}
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Override Rate
              <InfoTooltip text="Percentage of users who proceeded despite interventions (indicates false positives or user disagreement)." />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7c3aed', marginBottom: '0.5rem' }}>
              {((systemMetricsData.overrideRate || 0) * 100).toFixed(1)}%
            </div>
            <div style={{
              height: '0.375rem',
              backgroundColor: '#ddd6fe',
              borderRadius: '0.25rem',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#7c3aed',
                width: `${Math.min((systemMetricsData.overrideRate || 0) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Completion Rate */}
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Completion Rate
              <InfoTooltip text="Percentage of sessions that were completed (not abandoned)." />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0891b2', marginBottom: '0.5rem' }}>
              {((systemMetricsData.completionRate || 0) * 100).toFixed(1)}%
            </div>
            <div style={{
              height: '0.375rem',
              backgroundColor: '#cffafe',
              borderRadius: '0.25rem',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#0891b2',
                width: `${Math.min((systemMetricsData.completionRate || 0) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Detection Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Total Pattern Detections
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              {systemMetricsData.totalDetections || 0}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Total Interventions Shown
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              {systemMetricsData.totalInterventions || 0}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
              Dropout Rate
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {((systemMetricsData.dropoutRate || 0) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Section */}
      {recentAlerts.length > 0 && (
        <div style={{
          backgroundColor: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#742a2a', fontSize: '1rem' }}>🚨 Recent Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentAlerts.map((alert) => {
              const severityIcon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟠' : '🔵';
              const bgColor = alert.severity === 'critical' ? '#fecaca' : alert.severity === 'warning' ? '#fed7aa' : '#bfdbfe';
              const textColor = alert.severity === 'critical' ? '#991b1b' : alert.severity === 'warning' ? '#92400e' : '#1e40af';

              return (
                <div
                  key={alert.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: bgColor,
                    borderRadius: '0.375rem',
                    borderLeft: `3px solid ${textColor}`,
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: textColor, marginBottom: '0.25rem' }}>
                    {severityIcon} {alert.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: textColor, opacity: 0.8 }}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userPatterns.length === 0 ? (
        <div className="empty-state">
          <p>No patterns recorded yet. Start making predictions to build your pattern profile.</p>
        </div>
      ) : (
        <div className="patterns-grid">
          {userPatterns.map((pattern) => (
            <div key={pattern.id} className="pattern-card">
              <div className="pattern-header">
                <h3>Pattern {pattern.patternType}</h3>
                <span className="pattern-badge">
                  Confidence: {(pattern.confidence * 100).toFixed(0)}%
                  <InfoTooltip text="How confident the system is that this is your dominant pattern (0% = uncertain, 100% = very confident). Based on your interaction history." />
                </span>
              </div>

              <p className="pattern-description">
                {getPatternDescription(pattern.patternType)}
              </p>

              <div className="pattern-metrics">
                <div className="metric">
                  <span className="label">
                    AI Reliance Score
                    <InfoTooltip text="How much you depend on AI for task completion (0% = no reliance, 100% = full dependence)." />
                  </span>
                  <span className="value">{(pattern.aiRelianceScore * 100).toFixed(0)}%</span>
                  <span className="description">How much you depend on AI (lower is better for learning)</span>
                </div>
                <div className="metric">
                  <span className="label">
                    Verification Score
                    <InfoTooltip text="How thoroughly you verify AI outputs (0% = no verification, 100% = complete verification)." />
                  </span>
                  <span className="value">{(pattern.verificationScore * 100).toFixed(0)}%</span>
                  <span className="description">How thoroughly you verify AI outputs (higher is better)</span>
                </div>
                <div className="metric">
                  <span className="label">
                    Context Switching
                    <InfoTooltip text="How often you change your approach within a task. Lower is more consistent, higher is more experimental." />
                  </span>
                  <span className="value">{pattern.contextSwitchingFrequency.toFixed(2)} times/task</span>
                  <span className="description">How often you change strategy during tasks</span>
                </div>
              </div>

              <div className="pattern-updated">
                Updated: {new Date(pattern.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pattern Guide */}
      <div className="pattern-guide">
        <h2>Pattern Guide</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <h4>Pattern A ⭐⭐⭐⭐⭐</h4>
            <p>Breaks tasks into clear subtasks with human control. Maintains verification standards and skill preservation through deliberate boundary-setting.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern B ⭐⭐⭐⭐</h4>
            <p>Learns through rapid experimentation and failure. Maintains failure logs and progressively calibrates trust based on success/failure patterns.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern C ⭐⭐⭐⭐</h4>
            <p>Adapts strategy based on task requirements. Modulates AI reliance dynamically: high for brainstorming, low for critical tasks, medium for routine work.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern D ⭐⭐⭐⭐⭐</h4>
            <p>Assumes nothing, verifies everything. Uses multi-tool verification, identifies assumptions, constructs counter-examples, and demands explanations.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern E ⭐⭐⭐⭐</h4>
            <p>Treats AI as a learning tutor, not a task automator. Maintains learning logs and regularly practices without AI to ensure skill retention.</p>
          </div>
          <div className="guide-card">
            <h4>Pattern F ⚠️ Risk</h4>
            <p>Uncritical adoption with low verification. May lead to skill degradation, false productivity, and unconscious dependence. Requires intervention and awareness.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternsPage;
