import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePatternStore } from '../../stores/patternStore';
import api from '../../services/api';

interface PatternInfo {
  pattern: string;
  confidence: number;
  recommendations: string[];
  descriptions: { [key: string]: string };
}

interface AssessmentResult {
  id: string;
  planningScore: number;
  monitoringScore: number;
  evaluationScore: number;
  regulationScore: number;
  overallScore: number;
  strengths: string[];
  areasForGrowth: string[];
  recommendations: string[];
  createdAt: string;
}

/**
 * PatternSupportPanel Component
 * Displays the three core system services:
 * 1. Pattern Recognition Engine - Identifies AI usage patterns (A-F)
 * 2. System Recommendations - Personalized interventions based on pattern
 * 3. Metacognitive Assessment Tool - MR19 diagnostic for capabilities
 */
const PatternSupportPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { patterns, loading } = usePatternStore();
  const [patternInfo, setPatternInfo] = useState<PatternInfo | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  // Get the most recent pattern
  useEffect(() => {
    if (patterns && patterns.length > 0) {
      const mostRecentPattern = patterns[0];
      setPatternInfo({
        pattern: mostRecentPattern.detectedPattern || mostRecentPattern.pattern,
        confidence: mostRecentPattern.confidence,
        recommendations: mostRecentPattern.reasoning || [],
        descriptions: {
          A: 'Strategic Decomposition & Control - Careful planning, high verification, maintains independence',
          B: 'Iterative Optimization & Calibration - Multiple iterations, questions outputs, selective acceptance',
          C: 'Adaptive Adjustment - Dynamic strategy switching, context-aware approach',
          D: 'Deep Verification & Criticism - Thorough scrutiny, probing questions, high reflection',
          E: 'Teaching & Learning - Uses AI as educational tool, high learning reflection',
          F: 'Passive Over-Reliance ⚠️ - Uncritical acceptance, minimal verification (HIGH RISK)',
        },
      });
    }
  }, [patterns]);

  // Load the most recent assessment result
  useEffect(() => {
    const loadAssessment = async () => {
      if (!user?.id) return;

      setAssessmentLoading(true);
      try {
        const response = await api.get(`/assessments/${user.id}/latest`);
        if (response.data.data.assessment) {
          setAssessment(response.data.data.assessment);
        }
      } catch (err) {
        console.error('Failed to load assessment:', err);
        // Silently fail - assessment is optional
      } finally {
        setAssessmentLoading(false);
      }
    };

    loadAssessment();
  }, [user?.id]);

  const getPatternColor = (pattern: string): string => {
    const colors: { [key: string]: string } = {
      A: '#10b981', // Green - Strategic
      B: '#3b82f6', // Blue - Iterative
      C: '#f59e0b', // Amber - Adaptive
      D: '#8b5cf6', // Purple - Deep Verification
      E: '#ec4899', // Pink - Teaching
      F: '#ef4444', // Red - Over-Reliance
    };
    return colors[pattern] || '#6b7280';
  };

  const getPatternRiskLevel = (pattern: string): string => {
    if (pattern === 'A' || pattern === 'B' || pattern === 'D') return 'Low Risk ✓';
    if (pattern === 'C' || pattern === 'E') return 'Moderate';
    if (pattern === 'F') return 'High Risk ⚠️';
    return 'Unknown';
  };

  if (loading && !patternInfo) {
    return <div style={{ padding: '1rem', color: '#999' }}>Loading support information...</div>;
  }

  if (!patternInfo) {
    return (
      <div style={{ padding: '1.5rem', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0284c7' }}>🎯 Pattern Recognition Service</h3>
        <p style={{ margin: '0', color: '#666', fontSize: '0.875rem' }}>
          No pattern detected yet. Have more conversations to enable pattern detection and personalized support.
        </p>
      </div>
    );
  }

  const patternColor = getPatternColor(patternInfo.pattern);
  const riskLevel = getPatternRiskLevel(patternInfo.pattern);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
      {/* Core Service #1: Pattern Recognition Engine */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        borderLeft: `4px solid ${patternColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: patternColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
          }}>
            {patternInfo.pattern}
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e40af', fontSize: '1rem' }}>
              Core Service #1: Pattern Recognition
            </h3>
            <p style={{ margin: '0', color: '#666', fontSize: '0.875rem' }}>
              Confidence: {(patternInfo.confidence * 100).toFixed(1)}% | Risk: {riskLevel}
            </p>
          </div>
        </div>
        <p style={{ margin: '0', color: '#1f2937', fontSize: '0.875rem', lineHeight: '1.5' }}>
          {patternInfo.descriptions[patternInfo.pattern]}
        </p>
      </div>

      {/* Core Service #2: System Recommendations */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        borderLeft: `4px solid #f59e0b`,
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#92400e', fontSize: '1rem' }}>
          Core Service #2: Personalized Interventions
        </h3>
        {patternInfo.pattern === 'A' && (
          <div>
            <p style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '0.875rem', fontWeight: '500' }}>
              ✓ You demonstrate strategic and careful AI usage.
            </p>
            <ul style={{
              margin: '0',
              paddingLeft: '1.25rem',
              color: '#1f2937',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            }}>
              <li>Continue your strategic approach - very effective for quality outcomes</li>
              <li><strong>MR12 (Critical Thinking Scaffolding)</strong> - Deepen your verification and questioning skills</li>
              <li><strong>MR15 (Metacognitive Strategy Guide)</strong> - Enhance your strategy planning</li>
            </ul>
          </div>
        )}
        {patternInfo.pattern === 'B' && (
          <div>
            <p style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '0.875rem', fontWeight: '500' }}>
              ✓ Your iterative refinement approach is excellent for quality.
            </p>
            <ul style={{
              margin: '0',
              paddingLeft: '1.25rem',
              color: '#1f2937',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            }}>
              <li><strong>MR5 (Low-Cost Iteration)</strong> - Faster feedback loops for more iterations</li>
              <li><strong>MR6 (Cross-Model Experimentation)</strong> - Compare outputs across different AI models</li>
            </ul>
          </div>
        )}
        {patternInfo.pattern === 'C' && (
          <div>
            <p style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '0.875rem', fontWeight: '500' }}>
              ✓ Your adaptive strategy approach is your strength.
            </p>
            <ul style={{
              margin: '0',
              paddingLeft: '1.25rem',
              color: '#1f2937',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            }}>
              <li><strong>MR8 (Task Characteristic Recognition)</strong> - Better match strategies to task types</li>
              <li><strong>MR3 (Human Agency Control)</strong> - Maintain control and initiative</li>
            </ul>
          </div>
        )}
        {patternInfo.pattern === 'D' && (
          <div>
            <p style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '0.875rem', fontWeight: '500' }}>
              ✓ Your thorough verification and scrutiny is exemplary.
            </p>
            <ul style={{
              margin: '0',
              paddingLeft: '1.25rem',
              color: '#1f2937',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            }}>
              <li><strong>MR11 (Integrated Verification)</strong> - Verify more efficiently with structured tools</li>
              <li><strong>MR14 (Guided Reflection)</strong> - Reflect on learning from verification results</li>
            </ul>
          </div>
        )}
        {patternInfo.pattern === 'E' && (
          <div>
            <p style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '0.875rem', fontWeight: '500' }}>
              ✓ Your teaching-focused approach builds deep understanding.
            </p>
            <ul style={{
              margin: '0',
              paddingLeft: '1.25rem',
              color: '#1f2937',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            }}>
              <li><strong>MR14 (Guided Reflection)</strong> - Structure your learning sessions</li>
              <li><strong>MR17 (Learning Process Visualization)</strong> - Visualize your learning progress</li>
            </ul>
          </div>
        )}
        {patternInfo.pattern === 'F' && (
          <div>
            <p style={{ margin: '0 0 0.75rem 0', color: '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>
              ⚠️ Over-reliance detected - CRITICAL intervention recommended
            </p>
            <ul style={{
              margin: '0',
              paddingLeft: '1.25rem',
              color: '#dc2626',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            }}>
              <li><strong>MR18 (Over-Reliance Warning)</strong> - Immediate assessment of dependency risks</li>
              <li><strong>MR12 (Critical Thinking Scaffolding)</strong> - Build verification and questioning skills</li>
              <li><strong>MR11 (Integrated Verification)</strong> - Practice structured verification techniques</li>
            </ul>
          </div>
        )}
      </div>

      {/* Core Service #3: Metacognitive Assessment */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#e0f2fe',
        borderRadius: '8px',
        borderLeft: `4px solid #0284c7`,
        gridColumn: '1 / -1',
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e', fontSize: '1rem' }}>
          Core Service #3: Metacognitive Assessment Tool (MR19)
        </h3>

        {assessment && !assessmentLoading ? (
          // Show assessment results
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '6px',
            border: '1px solid #0284c7',
            marginBottom: '1rem',
          }}>
            <p style={{ margin: '0 0 0.75rem 0', fontWeight: '600', color: '#0c4a6e', fontSize: '0.9rem' }}>
              📊 Your Assessment Results
            </p>

            {/* Scores Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}>
              {[
                { label: 'Planning', score: assessment.planningScore, icon: '📐' },
                { label: 'Monitoring', score: assessment.monitoringScore, icon: '👁️' },
                { label: 'Evaluation', score: assessment.evaluationScore, icon: '⚖️' },
                { label: 'Regulation', score: assessment.regulationScore, icon: '🔄' },
              ].map((dim) => (
                <div key={dim.label} style={{
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                    {dim.icon} {dim.label}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <div style={{
                      flex: 1,
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${dim.score * 100}%`,
                        backgroundColor: '#0284c7',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0284c7', minWidth: '30px' }}>
                      {(dim.score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Score */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '4px',
              marginBottom: '0.75rem',
              borderLeft: '3px solid #0284c7',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#0c4a6e', fontWeight: '600' }}>OVERALL SCORE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0284c7' }}>
                {(assessment.overallScore * 100).toFixed(0)}%
              </div>
            </div>

            {/* Strengths */}
            {assessment.strengths && assessment.strengths.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: '#10b981' }}>
                  ✓ Strengths
                </p>
                <ul style={{
                  margin: '0',
                  paddingLeft: '1.25rem',
                  fontSize: '0.8rem',
                  color: '#1f2937',
                }}>
                  {assessment.strengths.map((s, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Growth */}
            {assessment.areasForGrowth && assessment.areasForGrowth.length > 0 && (
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: '#f59e0b' }}>
                  ⚡ Areas for Growth
                </p>
                <ul style={{
                  margin: '0',
                  paddingLeft: '1.25rem',
                  fontSize: '0.8rem',
                  color: '#1f2937',
                }}>
                  {assessment.areasForGrowth.map((a, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e5e7eb',
              fontSize: '0.75rem',
              color: '#6b7280',
            }}>
              📅 Completed on {new Date(assessment.createdAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          // Show prompt to take assessment
          <>
            <p style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '0.875rem', lineHeight: '1.5' }}>
              Diagnose your metacognitive capabilities across 4 dimensions: <strong>Planning</strong>, <strong>Monitoring</strong>, <strong>Evaluation</strong>, and <strong>Regulation</strong>.
            </p>
            <div style={{
              padding: '1rem',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #0284c7',
              fontSize: '0.875rem',
              color: '#1f2937',
              lineHeight: '1.6',
              marginBottom: '1rem',
            }}>
              <p style={{ margin: '0 0 0.75rem 0', fontWeight: '500' }}>
                📊 <strong>What MR19 Does:</strong>
              </p>
              <ul style={{ margin: '0', paddingLeft: '1.25rem' }}>
                <li><strong>Analyzes</strong> your interaction patterns to assess metacognitive dimensions</li>
                <li><strong>Diagnoses</strong> your strengths and areas for improvement</li>
                <li><strong>Recommends</strong> specific interventions tailored to your profile</li>
                <li><strong>Tracks</strong> your metacognitive growth over time</li>
              </ul>
            </div>
          </>
        )}

        <button
          onClick={() => navigate('/assessment')}
          disabled={assessmentLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: assessmentLoading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            transition: 'all 200ms ease',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            opacity: assessmentLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!assessmentLoading) {
              e.currentTarget.style.backgroundColor = '#0369a1';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!assessmentLoading) {
              e.currentTarget.style.backgroundColor = '#0284c7';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.3)';
            }
          }}
        >
          {assessmentLoading ? '⏳ Loading...' : assessment ? '✓ Retake Assessment' : '🎯 Take Metacognitive Assessment'}
        </button>
      </div>
    </div>
  );
};

export default PatternSupportPanel;
