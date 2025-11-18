import React, { useEffect } from 'react';
import { usePatternStore } from '../stores/patternStore';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Patterns Page
 * View and analyze user AI usage patterns
 */
const PatternsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { patterns, loading, fetchPatterns } = usePatternStore();

  useEffect(() => {
    if (user?.id) {
      fetchPatterns(user.id);
    }
  }, [user?.id]);

  if (loading) {
    return <LoadingSpinner message="Loading patterns..." />;
  }

  const userPatterns = patterns.filter((p) => p.userId === user?.id);

  const getPatternDescription = (patternType: string): string => {
    const descriptions: Record<string, string> = {
      A: 'High verification, low AI reliance - Efficient and careful user',
      B: 'Balanced approach - Mix of verification and AI usage',
      C: 'Moderate AI reliance - Learning to use AI efficiently',
      D: 'High AI reliance with some verification - Building competence',
      E: 'Strategic over-reliance - Using AI as primary tool',
      F: 'Over-reliance on AI - Risk of dependency',
    };
    return descriptions[patternType] || 'Unknown pattern';
  };

  return (
    <div className="page patterns-page">
      <div className="page-header">
        <h1>AI Usage Patterns</h1>
        <p className="page-subtitle">Understand your AI usage behavior and patterns</p>
      </div>

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
                </span>
              </div>

              <p className="pattern-description">
                {getPatternDescription(pattern.patternType)}
              </p>

              <div className="pattern-metrics">
                <div className="metric">
                  <span className="label">AI Reliance Score</span>
                  <span className="value">{(pattern.aiRelianceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Verification Score</span>
                  <span className="value">{(pattern.verificationScore * 100).toFixed(0)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Context Switching</span>
                  <span className="value">{pattern.contextSwitchingFrequency.toFixed(2)} times/task</span>
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
            <h4>Patterns A & B</h4>
            <p>Efficient usage - Balanced verification and AI reliance. Desired outcome.</p>
          </div>
          <div className="guide-card">
            <h4>Patterns C & D</h4>
            <p>Learning phase - Building confidence with AI. Progressive improvement expected.</p>
          </div>
          <div className="guide-card">
            <h4>Patterns E & F</h4>
            <p>Over-reliance - High AI dependency with low verification. Intervention recommended.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternsPage;
