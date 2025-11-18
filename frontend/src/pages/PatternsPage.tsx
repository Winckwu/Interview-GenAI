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
                  <span className="label">
                    AI Reliance Score
                    <span title="How much you depend on AI for task completion (0% = no reliance, 100% = full dependence)">ℹ️</span>
                  </span>
                  <span className="value">{(pattern.aiRelianceScore * 100).toFixed(0)}%</span>
                  <span className="description">How much you depend on AI (lower is better for learning)</span>
                </div>
                <div className="metric">
                  <span className="label">
                    Verification Score
                    <span title="How thoroughly you verify AI outputs (0% = no verification, 100% = complete verification)">ℹ️</span>
                  </span>
                  <span className="value">{(pattern.verificationScore * 100).toFixed(0)}%</span>
                  <span className="description">How thoroughly you verify AI outputs (higher is better)</span>
                </div>
                <div className="metric">
                  <span className="label">
                    Context Switching
                    <span title="How often you change your approach within a task">ℹ️</span>
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
