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
      A: '战略分解与控制',
      B: '迭代优化与调试',
      C: '自适应调整',
      D: '深度验证与批判',
      E: '教学与学习',
      F: '被动过度依赖⚠️',
    };
    return labels[p] || '未知模式';
  };

  const getMetricColor = (value: number): string => {
    if (value >= 70) return '#10b981';
    if (value >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getMetricLabel = (metric: string, value: number): string => {
    if (metric === 'aiReliance') {
      if (value >= 70) return '⚠️ 高度依赖';
      if (value >= 40) return '📊 中等依赖';
      return '✅ 低依赖';
    }
    if (metric === 'verificationScore') {
      if (value >= 70) return '✅ 很好';
      if (value >= 40) return '📊 一般';
      return '⚠️ 需改进';
    }
    if (metric === 'learningIndex') {
      if (value >= 70) return '⭐ 优秀';
      if (value >= 40) return '📈 良好';
      return '📊 可提升';
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
          🎯 模式分析
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
            <p style={{ fontSize: '1rem' }}>🔍 分析中...</p>
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
                    当前识别模式
                  </p>
                </div>
              </div>

              {/* Confidence Bar */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>置信度</span>
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
                  📊 本次对话指标
                </p>

                {/* AI Reliance */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>AI依赖度</span>
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
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>验证程度</span>
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
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>学习指数</span>
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
                💡 即时反馈
              </p>
              <p style={{ margin: '0', fontSize: '0.7rem', color: '#166534', lineHeight: '1.4' }}>
                {pattern.confidence > 0.75
                  ? '✓ 模式识别稳定，你的AI使用行为较为一致'
                  : '📊 模式仍在变化中，继续对话以获得更准确的分析'}
              </p>
            </div>

            {/* Suggestions */}
            {pattern.reasoning && pattern.reasoning.length > 0 && (
              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ margin: '0', fontSize: '0.75rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                  ⚠️ 改进建议
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
                📊 详细分析
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
                📥 导出
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
            <p style={{ fontSize: '1rem', margin: '0' }}>🔍</p>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0 0' }}>继续对话</p>
            <p style={{ fontSize: '0.75rem', margin: '0', color: '#d1d5db' }}>系统将实时分析你的</p>
            <p style={{ fontSize: '0.75rem', margin: '0', color: '#d1d5db' }}>AI使用模式</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternAnalysisWindow;
