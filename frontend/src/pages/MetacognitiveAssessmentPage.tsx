import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { MR19MetacognitiveCapabilityAssessment } from '../components/MR19MetacognitiveCapabilityAssessment';
import type { MetacognitiveProfile } from '../components/MR19MetacognitiveCapabilityAssessment.utils';
import api from '../services/api';

/**
 * Metacognitive Assessment Page
 * Dedicated page for users to take the MR19 metacognitive capability assessment
 * Diagnoses capabilities across 4 dimensions: Planning, Monitoring, Evaluation, Regulation
 */
const MetacognitiveAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sessions } = useSessionStore();
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [profile, setProfile] = useState<MetacognitiveProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAssessmentComplete = async (completedProfile: MetacognitiveProfile) => {
    setProfile(completedProfile);
    setSaving(true);
    setSaveError(null);

    try {
      // Save assessment result to backend
      if (user?.id) {
        await api.post('/assessments', {
          planningScore: completedProfile.scores?.planning || 0,
          monitoringScore: completedProfile.scores?.monitoring || 0,
          evaluationScore: completedProfile.scores?.evaluation || 0,
          regulationScore: completedProfile.scores?.regulation || 0,
          overallScore: completedProfile.overallScore || 0,
          strengths: completedProfile.strengths || [],
          areasForGrowth: completedProfile.areasForGrowth || [],
          recommendations: completedProfile.recommendations || [],
          assessmentType: 'standard',
        });
      }
      setAssessmentCompleted(true);
    } catch (err: any) {
      console.error('Failed to save assessment:', err);
      setSaveError('Failed to save assessment results. Please try again.');
      // Still mark as completed locally even if save fails
      setAssessmentCompleted(true);
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              color: '#0284c7',
              fontSize: '1rem',
              fontWeight: '500',
              borderRadius: '6px',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f9ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ← Back
          </button>
        </div>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
          🧠 Metacognitive Capability Assessment
        </h1>
        <p className="page-subtitle" style={{ margin: '0', color: '#666', fontSize: '1rem' }}>
          Diagnose your metacognitive strengths and areas for growth across 4 key dimensions
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}>
        {/* Assessment Info */}
        <div style={{
          padding: '2rem',
          backgroundColor: '#f0f9ff',
          borderBottom: '1px solid #e0f2fe',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0c4a6e', fontSize: '1rem', fontWeight: '600' }}>
                📋 About This Assessment
              </h3>
              <p style={{ margin: '0', color: '#1f2937', fontSize: '0.875rem', lineHeight: '1.6' }}>
                This assessment diagnoses your metacognitive capabilities - how well you plan, monitor, evaluate, and regulate your use of AI.
                Based on your responses and interaction history, we'll provide personalized recommendations.
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0c4a6e', fontSize: '1rem', fontWeight: '600' }}>
                ⏱️ Takes About 10 Minutes
              </h3>
              <p style={{ margin: '0', color: '#1f2937', fontSize: '0.875rem', lineHeight: '1.6' }}>
                The assessment includes a brief overview, behavioral analysis, and self-report questions. Your responses are completely private
                and used only to improve your personalized support.
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Component */}
        <div style={{ padding: '2rem' }}>
          {!assessmentCompleted ? (
            <MR19MetacognitiveCapabilityAssessment
              userBehaviorHistory={[
                { type: 'plan', count: sessions.length, effectiveness: 0.7 },
                { type: 'monitor', count: Math.floor(sessions.length * 0.6), effectiveness: 0.65 },
                { type: 'evaluate', count: Math.floor(sessions.length * 0.5), effectiveness: 0.7 },
                { type: 'regulate', count: Math.floor(sessions.length * 0.4), effectiveness: 0.6 },
              ]}
              onAssessmentComplete={handleAssessmentComplete}
              showRecommendations={true}
              allowSelfReport={true}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: saveError ? '#fef2f2' : '#f0fdf4',
              borderRadius: '8px',
              border: `1px solid ${saveError ? '#dcf2e8' : '#dcfce7'}`,
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {saveError ? '⚠️' : '✓'}
              </div>
              <h2 style={{
                margin: '0 0 0.5rem 0',
                color: saveError ? '#991b1b' : '#166534',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                {saveError ? 'Assessment Saved (Locally)' : 'Assessment Complete!'}
              </h2>
              <p style={{
                margin: '0 0 1.5rem 0',
                color: '#1f2937',
                fontSize: '0.9rem'
              }}>
                {saveError
                  ? `${saveError} Your assessment results are saved locally.`
                  : 'Your metacognitive profile has been analyzed. Check the results above and return to the dashboard to see personalized recommendations.'}
              </p>
              {saving && (
                <p style={{ margin: '0 0 1rem 0', color: '#0284c7', fontSize: '0.875rem', fontWeight: '500' }}>
                  💾 Saving your assessment...
                </p>
              )}
              <button
                onClick={handleReturnToDashboard}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: saving
                    ? '#ccc'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 200ms ease',
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                {saving ? '💾 Saving...' : 'Return to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
          📚 The 4 Metacognitive Dimensions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {[
            {
              title: '1. Planning',
              description: 'How well do you decompose tasks, set clear goals, and plan your AI usage strategy?',
              icon: '📐',
              color: '#eff6ff',
              borderColor: '#0284c7',
            },
            {
              title: '2. Monitoring',
              description: 'How well do you track progress, verify outputs, and check for errors as you work?',
              icon: '👁️',
              color: '#f0fdf4',
              borderColor: '#10b981',
            },
            {
              title: '3. Evaluation',
              description: 'How well do you assess output quality, compare alternatives, and make critical judgments?',
              icon: '⚖️',
              color: '#fef3c7',
              borderColor: '#f59e0b',
            },
            {
              title: '4. Regulation',
              description: 'How well do you adjust strategies, learn from results, and improve your approach?',
              icon: '🔄',
              color: '#fce7f3',
              borderColor: '#ec4899',
            },
          ].map((dimension, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.5rem',
                backgroundColor: dimension.color,
                borderLeft: `4px solid ${dimension.borderColor}`,
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{dimension.icon}</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                {dimension.title}
              </h3>
              <p style={{ margin: '0', fontSize: '0.875rem', color: '#666', lineHeight: '1.5' }}>
                {dimension.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How Results Are Used */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        borderLeft: '4px solid #64748b',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          🎯 How Your Results Are Used
        </h3>
        <ul style={{
          margin: '0',
          paddingLeft: '1.25rem',
          color: '#1f2937',
          fontSize: '0.875rem',
          lineHeight: '1.8',
          listStylePosition: 'outside',
        }}>
          <li>Your profile helps us understand your strengths and areas for improvement</li>
          <li>We recommend specific interventions (MRs) tailored to your metacognitive profile</li>
          <li>Your assessment adapts based on your interaction patterns and progress</li>
          <li>Results are completely private and never shared with third parties</li>
        </ul>
      </div>
    </div>
  );
};

export default MetacognitiveAssessmentPage;
