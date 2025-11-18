import React from 'react';

interface PatternData {
  pattern: string;
  confidence: number;
  reasoning?: string[];
  metrics?: {
    aiReliance: number;
    verificationScore: number;
    learningIndex: number;
  };
}

interface PatternAnalysisWindowProps {
  pattern: PatternData | null;
  isLoading: boolean;
  onClose?: () => void;
}

/**
 * Pattern Analysis Window Component
 * Displays real-time AI usage pattern analysis on the right side of chat
 */
const PatternAnalysisWindow: React.FC<PatternAnalysisWindowProps> = ({
  pattern,
  isLoading,
  onClose,
}) => {
  const getPatternColor = (p: string): string => {
    const colors: { [key: string]: string } = {
      A: '#10b981',
      B: '#3b82f6',
      C: '#f59e0b',
      D: '#8b5cf6',
      E: '#ec4899',
      F: '#ef4444',
    };
    return colors[p] || '#6b7280';
  };

  const getPatternLabel = (p: string): string => {
    const labels: { [key: string]: string } = {
      A: 'Strategic Decomposition & Control',
      B: 'Iterative Optimization & Calibration',
      C: 'Adaptive Adjustment',
      D: 'Deep Verification & Criticism',
      E: 'Teaching & Learning',
      F: 'Passive Over-Reliance (⚠️ Risk)',
    };
    return labels[p] || 'Unknown Pattern';
  };

  const getMetricColor = (value: number): string => {
    if (value >= 70) return '#10b981';
    if (value >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getMetricLabel = (metric: string, value: number): string => {
    if (metric === 'aiReliance') {
      if (value >= 70) return '⚠️ High Reliance';
      if (value >= 40) return '📊 Medium Reliance';
      return '✅ Low Reliance';
    }
    if (metric === 'verificationScore') {
      if (value >= 70) return '✅ Excellent';
      if (value >= 40) return '📊 Fair';
      return '⚠️ Needs Improvement';
    }
    if (metric === 'learningIndex') {
      if (value >= 70) return '⭐ Outstanding';
      if (value >= 40) return '📈 Good';
      return '📊 Room for Improvement';
    }
    return '';
  };

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: '#fff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          🎯 Pattern Analysis
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: '#6b7280',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
            <p style={{ fontSize: '1rem' }}>🔍 Analyzing...</p>
          </div>
        ) : pattern ? (
          <>
            {/* Current Pattern Card */}
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                border: `2px solid ${getPatternColor(pattern.pattern)}`,
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: getPatternColor(pattern.pattern),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}
                >
                  {pattern.pattern}
                </div>
                <div>
                  <p style={{ margin: '0', fontWeight: '600', color: '#1f2937' }}>
                    {getPatternLabel(pattern.pattern)}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                    Currently Detected Pattern
                  </p>
                </div>
              </div>

              {/* Confidence Bar */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Confidence</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1f2937' }}>
                    {(pattern.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '0.375rem',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '0.25rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pattern.confidence * 100}%`,
                      height: '100%',
                      backgroundColor: getPatternColor(pattern.pattern),
                      transition: 'width 0.3s ease-in-out',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            {pattern.metrics && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  📊 Conversation Metrics
                </p>

                {/* AI Reliance */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>AI Reliance</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getMetricColor(pattern.metrics.aiReliance) }}>
                      {pattern.metrics.aiReliance}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '0.375rem',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '0.25rem',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pattern.metrics.aiReliance}%`,
                        height: '100%',
                        backgroundColor: getMetricColor(pattern.metrics.aiReliance),
                      }}
                    />
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#9ca3af' }}>
                    {getMetricLabel('aiReliance', pattern.metrics.aiReliance)}
                  </p>
                </div>

                {/* Verification Score */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Verification Score</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getMetricColor(pattern.metrics.verificationScore) }}>
                      {pattern.metrics.verificationScore}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '0.375rem',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '0.25rem',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pattern.metrics.verificationScore}%`,
                        height: '100%',
                        backgroundColor: getMetricColor(pattern.metrics.verificationScore),
                      }}
                    />
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#9ca3af' }}>
                    {getMetricLabel('verificationScore', pattern.metrics.verificationScore)}
                  </p>
                </div>

                {/* Learning Index */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Learning Index</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getMetricColor(pattern.metrics.learningIndex) }}>
                      {pattern.metrics.learningIndex}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '0.375rem',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '0.25rem',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pattern.metrics.learningIndex}%`,
                        height: '100%',
                        backgroundColor: getMetricColor(pattern.metrics.learningIndex),
                      }}
                    />
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#9ca3af' }}>
                    {getMetricLabel('learningIndex', pattern.metrics.learningIndex)}
                  </p>
                </div>
              </div>
            )}

            {/* Smart Feedback */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <p style={{ margin: '0', fontSize: '0.75rem', fontWeight: '600', color: '#15803d', marginBottom: '0.5rem' }}>
                💡 Quick Feedback
              </p>
              <p style={{ margin: '0', fontSize: '0.7rem', color: '#166534', lineHeight: '1.4' }}>
                {pattern.confidence > 0.75
                  ? '✓ Pattern recognition stable, your AI usage is consistent'
                  : '📊 Pattern still evolving, continue chatting for more accurate analysis'}
              </p>
            </div>

            {/* Suggestions */}
            {pattern.reasoning && pattern.reasoning.length > 0 && (
              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ margin: '0', fontSize: '0.75rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                  ⚠️ Improvement Suggestions
                </p>
                <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.7rem', color: '#b45309', lineHeight: '1.4' }}>
                  {pattern.reasoning.slice(0, 2).map((reason, idx) => (
                    <li key={idx} style={{ marginBottom: idx < pattern.reasoning!.length - 1 ? '0.25rem' : '0' }}>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dbeafe';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#eff6ff';
                }}
                title="View detailed pattern analysis"
              >
                📊 Detailed Analysis
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dcfce7';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0fdf4';
                }}
                title="Export analysis report"
              >
                📥 Export
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
            <p style={{ fontSize: '1rem', margin: '0' }}>🔍</p>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0 0' }}>Keep Chatting</p>
            <p style={{ fontSize: '0.75rem', margin: '0', color: '#d1d5db' }}>System will analyze your</p>
            <p style={{ fontSize: '0.75rem', margin: '0', color: '#d1d5db' }}>AI usage pattern in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternAnalysisWindow;
