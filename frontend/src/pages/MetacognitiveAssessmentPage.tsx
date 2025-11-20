import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { MR19MetacognitiveCapabilityAssessment } from '../components/mr/MR19MetacognitiveCapabilityAssessment';
import type { MetacognitiveProfile } from '../components/mr/MR19MetacognitiveCapabilityAssessment/utils';
import './MetacognitiveAssessmentPage.css';
import '../styles/components.css';

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

  const handleAssessmentComplete = (completedProfile: MetacognitiveProfile) => {
    setProfile(completedProfile);
    setAssessmentCompleted(true);
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="assessment-page">
      {/* Header */}
      <div className="assessment-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h1>
          🧠 Metacognitive Capability Assessment
        </h1>
        <p className="assessment-subtitle">
          Diagnose your metacognitive strengths and areas for growth across 4 key dimensions
        </p>
      </div>

      {/* Main Content */}
      <div className="assessment-container">
        {/* Assessment Info */}
        <div className="assessment-info">
          <div className="assessment-info-grid">
            <div className="info-section">
              <h3>
                📋 About This Assessment
              </h3>
              <p>
                This assessment diagnoses your metacognitive capabilities - how well you plan, monitor, evaluate, and regulate your use of AI.
                Based on your responses and interaction history, we'll provide personalized recommendations.
              </p>
            </div>
            <div className="info-section">
              <h3>
                ⏱️ Takes About 10 Minutes
              </h3>
              <p>
                The assessment includes a brief overview, behavioral analysis, and self-report questions. Your responses are completely private
                and used only to improve your personalized support.
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Component */}
        <div className="assessment-content">
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
            <div className="completion-screen">
              <div className="completion-icon">✓</div>
              <h2 className="completion-title">
                Assessment Complete!
              </h2>
              <p className="completion-message">
                Your metacognitive profile has been analyzed. Check the results above and return to the dashboard to see personalized recommendations.
              </p>
              <div className="completion-action">
                <button
                  className="completion-button"
                  onClick={handleReturnToDashboard}
                >
                  Return to Dashboard
                </button>
              </div>
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
