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
