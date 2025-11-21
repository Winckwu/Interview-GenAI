import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { useAssessmentStore } from '../stores/assessmentStore';
import { MR19MetacognitiveCapabilityAssessment } from '../components/mr/MR19MetacognitiveCapabilityAssessment';
import type { MetacognitiveProfile } from '../components/mr/MR19MetacognitiveCapabilityAssessment/utils';
import { apiService } from '../services/api';
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
  const { sessions, loadSessions } = useSessionStore();
  const { submitAssessment } = useAssessmentStore();
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [profile, setProfile] = useState<MetacognitiveProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [behaviorHistory, setBehaviorHistory] = useState<any[]>([
    { type: 'plan', count: 0, effectiveness: 0.5 },
    { type: 'monitor', count: 0, effectiveness: 0.5 },
    { type: 'evaluate', count: 0, effectiveness: 0.5 },
    { type: 'regulate', count: 0, effectiveness: 0.5 },
  ]);
  const [loadingBehavior, setLoadingBehavior] = useState(true);

  // Load sessions and analyze behavior on mount
  useEffect(() => {
    const loadAndAnalyzeBehavior = async () => {
      try {
        setLoadingBehavior(true);
        // Load sessions if not already loaded
        if (sessions.length === 0) {
          await loadSessions();
        }

        // Fetch detailed interaction data for behavior analysis
        if (user?.id) {
          const response = await apiService.sessions.getAll({ limit: 100, includeInteractions: true });
          const sessionsWithInteractions = response.data.data?.sessions || [];

          // Analyze interactions to calculate real behavior metrics
          let totalInteractions = 0;
          let verifiedCount = 0;
          let modifiedCount = 0;
          let rejectedCount = 0;
          let planningBehaviors = 0;
          let monitoringBehaviors = 0;
          let evaluationBehaviors = 0;
          let regulationBehaviors = 0;

          sessionsWithInteractions.forEach((session: any) => {
            const interactions = session.interactions || [];
            totalInteractions += interactions.length;

            interactions.forEach((interaction: any) => {
              // Count verification/modification/rejection behaviors
              if (interaction.wasVerified) verifiedCount++;
              if (interaction.wasModified) modifiedCount++;
              if (interaction.wasRejected) rejectedCount++;

              // Analyze prompt content for metacognitive patterns
              const prompt = (interaction.userPrompt || '').toLowerCase();

              // Planning indicators
              if (prompt.includes('plan') || prompt.includes('step') || prompt.includes('how to') ||
                  prompt.includes('strategy') || prompt.includes('approach')) {
                planningBehaviors++;
              }

              // Monitoring indicators
              if (prompt.includes('check') || prompt.includes('verify') || prompt.includes('correct') ||
                  prompt.includes('is this right') || interaction.wasVerified) {
                monitoringBehaviors++;
              }

              // Evaluation indicators
              if (prompt.includes('better') || prompt.includes('compare') || prompt.includes('which') ||
                  prompt.includes('evaluate') || prompt.includes('assess')) {
                evaluationBehaviors++;
              }

              // Regulation indicators
              if (prompt.includes('fix') || prompt.includes('improve') || prompt.includes('adjust') ||
                  prompt.includes('change') || interaction.wasModified || interaction.wasRejected) {
                regulationBehaviors++;
              }
            });
          });

          // Calculate effectiveness scores based on actual behavior
          const planningEffectiveness = planningBehaviors > 0 ? Math.min(0.9, 0.5 + (planningBehaviors / totalInteractions) * 0.5) : 0.3;
          const monitoringEffectiveness = verifiedCount > 0 ? Math.min(0.95, 0.6 + (verifiedCount / totalInteractions)) : 0.4;
          const evaluationEffectiveness = evaluationBehaviors > 0 ? Math.min(0.9, 0.5 + (evaluationBehaviors / totalInteractions) * 0.5) : 0.35;
          const regulationEffectiveness = (modifiedCount + rejectedCount) > 0 ? Math.min(0.95, 0.6 + ((modifiedCount + rejectedCount) / totalInteractions)) : 0.4;

          setBehaviorHistory([
            { type: 'plan', count: planningBehaviors, effectiveness: planningEffectiveness },
            { type: 'monitor', count: monitoringBehaviors, effectiveness: monitoringEffectiveness },
            { type: 'evaluate', count: evaluationBehaviors, effectiveness: evaluationEffectiveness },
            { type: 'regulate', count: regulationBehaviors, effectiveness: regulationEffectiveness },
          ]);

          console.log('Analyzed behavior data:', {
            totalInteractions,
            verifiedCount,
            modifiedCount,
            rejectedCount,
            planningBehaviors,
            monitoringBehaviors,
            evaluationBehaviors,
            regulationBehaviors,
          });
        }
      } catch (error) {
        console.error('Failed to load behavior data:', error);
        // Use default values if loading fails
      } finally {
        setLoadingBehavior(false);
      }
    };

    loadAndAnalyzeBehavior();
  }, [user?.id, loadSessions]);

  const handleAssessmentComplete = async (completedProfile: MetacognitiveProfile) => {
    setProfile(completedProfile);

    // Save assessment to database
    if (user?.id) {
      setSaving(true);
      setSaveError(null);
      try {
        // Convert profile to responses format for backend
        const responses = {
          assessedAt: completedProfile.assessedAt.toISOString(),
          dimensions: {
            planning: {
              score: completedProfile.dimensions.planning.score,
              level: completedProfile.dimensions.planning.level,
              interpretation: completedProfile.dimensions.planning.interpretation,
            },
            monitoring: {
              score: completedProfile.dimensions.monitoring.score,
              level: completedProfile.dimensions.monitoring.level,
              interpretation: completedProfile.dimensions.monitoring.interpretation,
            },
            evaluation: {
              score: completedProfile.dimensions.evaluation.score,
              level: completedProfile.dimensions.evaluation.level,
              interpretation: completedProfile.dimensions.evaluation.interpretation,
            },
            regulation: {
              score: completedProfile.dimensions.regulation.score,
              level: completedProfile.dimensions.regulation.level,
              interpretation: completedProfile.dimensions.regulation.interpretation,
            },
          },
          overallInterpretation: completedProfile.overallInterpretation,
          topStrengths: completedProfile.topStrengths,
          areasForGrowth: completedProfile.areasForGrowth,
          confidenceLevel: completedProfile.confidenceLevel,
          dataSource: completedProfile.dataSource,
        };

        await submitAssessment(user.id, responses);
        console.log('Assessment saved successfully');
      } catch (error: any) {
        console.error('Failed to save assessment:', error);
        setSaveError(error.message || 'Failed to save assessment results');
      } finally {
        setSaving(false);
      }
    }

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
          {loadingBehavior ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: '#64748b'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '1rem',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                🧠
              </div>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                color: '#1f2937',
                fontWeight: 600
              }}>
                Analyzing Your Behavior History
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1rem'
              }}>
                Reading your past interactions to personalize your assessment...
              </p>
            </div>
          ) : !assessmentCompleted ? (
            <MR19MetacognitiveCapabilityAssessment
              userBehaviorHistory={behaviorHistory}
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

              {saving && (
                <p className="completion-message" style={{ color: '#3b82f6' }}>
                  💾 Saving your results...
                </p>
              )}

              {!saving && !saveError && (
                <p className="completion-message" style={{ color: '#10b981' }}>
                  ✅ Your results have been saved successfully!
                </p>
              )}

              {saveError && (
                <p className="completion-message" style={{ color: '#ef4444' }}>
                  ⚠️ {saveError}. Don't worry, your results are still displayed below.
                </p>
              )}

              <p className="completion-message">
                Your metacognitive profile has been analyzed. Check the results above and return to the dashboard to see personalized recommendations.
              </p>
              <div className="completion-action">
                <button
                  className="completion-button"
                  onClick={handleReturnToDashboard}
                  disabled={saving}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div className="dimensions-section">
        <h2 className="dimensions-title">
          📚 The 4 Metacognitive Dimensions
        </h2>
        <div className="dimensions-grid">
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
              className="dimension-card"
              style={{
                backgroundColor: dimension.color,
                borderLeftColor: dimension.borderColor,
              }}
            >
              <div className="dimension-icon">{dimension.icon}</div>
              <h3 className="dimension-title">
                {dimension.title}
              </h3>
              <p className="dimension-description">
                {dimension.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How Results Are Used */}
      <div className="results-usage-section">
        <h3 className="results-usage-title">
          🎯 How Your Results Are Used
        </h3>
        <ul className="results-usage-list">
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
