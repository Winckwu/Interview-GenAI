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
  const { submitAssessment, latestAssessment, fetchLatestAssessment, assessments, fetchAssessments } = useAssessmentStore();
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [profile, setProfile] = useState<MetacognitiveProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  // 12-dimensional metacognitive behavior analysis (P1-P4, M1-M3, E1-E3, R1-R2)
  const [behaviorHistory, setBehaviorHistory] = useState<any[]>([
    // Planning dimensions
    { type: 'p1', label: 'Task Decomposition', count: 0, score: 0 },
    { type: 'p2', label: 'Goal Setting', count: 0, score: 0 },
    { type: 'p3', label: 'Strategy Selection', count: 0, score: 0 },
    { type: 'p4', label: 'Resource Planning', count: 0, score: 0 },
    // Monitoring dimensions
    { type: 'm1', label: 'Progress Tracking', count: 0, score: 0 },
    { type: 'm2', label: 'Quality Checking', count: 0, score: 0 },
    { type: 'm3', label: 'Context Monitoring', count: 0, score: 0 },
    // Evaluation dimensions
    { type: 'e1', label: 'Result Evaluation', count: 0, score: 0 },
    { type: 'e2', label: 'Learning Reflection', count: 0, score: 0 },
    { type: 'e3', label: 'Capability Judgment', count: 0, score: 0 },
    // Regulation dimensions
    { type: 'r1', label: 'Strategy Adjustment', count: 0, score: 0 },
    { type: 'r2', label: 'Trust Calibration', count: 0, score: 0 },
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

          // Analyze interactions to calculate 12-dimensional metacognitive metrics
          let totalInteractions = 0;
          let verifiedCount = 0;
          let modifiedCount = 0;
          let rejectedCount = 0;

          // 12-dimensional counters
          const dimensionCounts = {
            p1: 0, p2: 0, p3: 0, p4: 0,  // Planning
            m1: 0, m2: 0, m3: 0,          // Monitoring
            e1: 0, e2: 0, e3: 0,          // Evaluation
            r1: 0, r2: 0,                 // Regulation
          };

          // Track strategy diversity for P3
          const strategies = new Set<string>();
          // Track task types for M3 (context monitoring)
          const taskTypes = new Map<string, number>();
          // Track iteration patterns for R1
          let iterationCount = 0;

          sessionsWithInteractions.forEach((session: any) => {
            const interactions = session.interactions || [];
            totalInteractions += interactions.length;

            interactions.forEach((interaction: any, idx: number) => {
              // Count verification/modification/rejection behaviors
              if (interaction.wasVerified) verifiedCount++;
              if (interaction.wasModified) modifiedCount++;
              if (interaction.wasRejected) rejectedCount++;

              // Analyze prompt content for metacognitive patterns
              const prompt = (interaction.userPrompt || '').toLowerCase();
              const promptLength = (interaction.userPrompt || '').trim().split(/\s+/).length;

              // === PLANNING DIMENSIONS ===

              // P1: Task Decomposition - detect structured, multi-step planning
              if (prompt.match(/步骤|step\s*\d|first.*then|列出|list|分解|break.*down/) ||
                  prompt.match(/\d+[.、)]\s*\w+/) || // numbered lists
                  prompt.includes('how to') && promptLength > 15) {
                dimensionCounts.p1++;
              }

              // P2: Goal Setting - detect specific, measurable goals
              if (prompt.match(/目标|goal|需要.*实现|achieve|要求|requirement|具体|specific/) ||
                  prompt.match(/确保|make sure|必须|must/) ||
                  promptLength > 20) { // longer prompts suggest clearer goals
                dimensionCounts.p2++;
              }

              // P3: Strategy Selection - track variety of approaches
              if (prompt.includes('代码')) strategies.add('code');
              if (prompt.includes('解释')) strategies.add('explain');
              if (prompt.includes('调试') || prompt.includes('debug')) strategies.add('debug');
              if (prompt.includes('优化') || prompt.includes('optimize')) strategies.add('optimize');
              if (prompt.includes('设计') || prompt.includes('design')) strategies.add('design');
              if (strategies.size > 0) dimensionCounts.p3++;

              // P4: Resource Planning - detect boundary awareness and independence
              if (prompt.match(/我.*自己|independently|我来|帮助.*理解|explain.*so.*understand/) ||
                  prompt.match(/不要.*直接|don't.*directly|引导|guide/)) {
                dimensionCounts.p4++;
              }

              // === MONITORING DIMENSIONS ===

              // M1: Progress Tracking - detect milestone checking and sequential work
              if (prompt.match(/进度|progress|完成.*吗|done|接下来|next step|继续|continue/) ||
                  (idx > 0 && prompt.includes('然后'))) {
                dimensionCounts.m1++;
              }

              // M2: Quality Checking - verification behaviors
              if (interaction.wasVerified ||
                  prompt.match(/检查|verify|正确.*吗|is.*correct|验证|validate|测试|test/)) {
                dimensionCounts.m2++;
              }

              // M3: Context Monitoring - trust calibration across contexts
              if (prompt.match(/可靠|reliable|确定|sure|信任|trust/) ||
                  prompt.match(/这个.*对吗|is this right|会不会.*错|might.*wrong/)) {
                dimensionCounts.m3++;
              }
              // Track task type diversity for M3 scoring
              const taskType = prompt.includes('代码') ? 'code' :
                              prompt.includes('解释') ? 'explain' :
                              prompt.includes('设计') ? 'design' : 'other';
              taskTypes.set(taskType, (taskTypes.get(taskType) || 0) + 1);

              // === EVALUATION DIMENSIONS ===

              // E1: Result Evaluation - quality assessment
              if (prompt.match(/质量|quality|评估|evaluate|好不好|效果|effectiveness/) ||
                  prompt.match(/更好|better|最佳|best|compare|比较/)) {
                dimensionCounts.e1++;
              }

              // E2: Learning Reflection - learning indicators
              if (prompt.match(/学到|learn|理解|understand|为什么|why|原理|principle/) ||
                  prompt.match(/怎么.*工作|how.*work|机制|mechanism/)) {
                dimensionCounts.e2++;
              }

              // E3: Capability Judgment - self-awareness
              if (prompt.match(/我.*能|can I|我.*会|我.*懂|understand/) ||
                  prompt.match(/不会|don't know|不懂|不理解/) ||
                  prompt.match(/基础|basic|入门|beginner/)) {
                dimensionCounts.e3++;
              }

              // === REGULATION DIMENSIONS ===

              // R1: Strategy Adjustment - iteration and improvement
              if (interaction.wasModified || interaction.wasRejected ||
                  prompt.match(/改进|improve|优化|optimize|调整|adjust|换个|try another/) ||
                  prompt.match(/重新|redo|再.*一次|again/)) {
                dimensionCounts.r1++;
                iterationCount++;
              }

              // R2: Trust Calibration - tool switching and dynamic trust
              if (prompt.match(/换.*方法|try.*different|别的.*工具|another.*tool/) ||
                  prompt.match(/或者|alternatively|还是|or/) ||
                  taskTypes.size > 2) { // multiple task types suggest flexibility
                dimensionCounts.r2++;
              }
            });
          });

          // === SCORING (0-3 scale based on frequency and quality) ===

          const calculateScore = (count: number, total: number, thresholds: number[]): number => {
            const ratio = total > 0 ? count / total : 0;
            if (ratio >= thresholds[2]) return 3;
            if (ratio >= thresholds[1]) return 2;
            if (ratio >= thresholds[0]) return 1;
            return 0;
          };

          const scores = {
            // Planning: higher thresholds (planning should be deliberate)
            p1: calculateScore(dimensionCounts.p1, totalInteractions, [0.10, 0.25, 0.40]),
            p2: calculateScore(dimensionCounts.p2, totalInteractions, [0.20, 0.40, 0.60]),
            p3: Math.min(3, strategies.size), // 0-3 based on strategy diversity
            p4: calculateScore(dimensionCounts.p4, totalInteractions, [0.05, 0.15, 0.30]),

            // Monitoring: medium thresholds (ongoing awareness)
            m1: calculateScore(dimensionCounts.m1, totalInteractions, [0.10, 0.25, 0.45]),
            m2: verifiedCount > 0 ? calculateScore(verifiedCount, totalInteractions, [0.10, 0.30, 0.60]) : 0,
            m3: Math.min(3, taskTypes.size), // 0-3 based on context diversity

            // Evaluation: medium-high thresholds (critical thinking)
            e1: calculateScore(dimensionCounts.e1, totalInteractions, [0.08, 0.20, 0.40]),
            e2: calculateScore(dimensionCounts.e2, totalInteractions, [0.15, 0.30, 0.50]),
            e3: calculateScore(dimensionCounts.e3, totalInteractions, [0.05, 0.15, 0.30]),

            // Regulation: iteration-based scoring
            r1: (modifiedCount + rejectedCount) > 0 ?
                calculateScore(modifiedCount + rejectedCount, totalInteractions, [0.10, 0.25, 0.45]) : 0,
            r2: Math.min(3, Math.floor(taskTypes.size * 1.2)), // flexibility across task types
          };

          // Store full 12-dimensional analysis
          const fullBehaviorHistory = [
            { type: 'p1', label: 'Task Decomposition', count: dimensionCounts.p1, score: scores.p1 },
            { type: 'p2', label: 'Goal Setting', count: dimensionCounts.p2, score: scores.p2 },
            { type: 'p3', label: 'Strategy Selection', count: strategies.size, score: scores.p3 },
            { type: 'p4', label: 'Resource Planning', count: dimensionCounts.p4, score: scores.p4 },
            { type: 'm1', label: 'Progress Tracking', count: dimensionCounts.m1, score: scores.m1 },
            { type: 'm2', label: 'Quality Checking', count: verifiedCount, score: scores.m2 },
            { type: 'm3', label: 'Context Monitoring', count: taskTypes.size, score: scores.m3 },
            { type: 'e1', label: 'Result Evaluation', count: dimensionCounts.e1, score: scores.e1 },
            { type: 'e2', label: 'Learning Reflection', count: dimensionCounts.e2, score: scores.e2 },
            { type: 'e3', label: 'Capability Judgment', count: dimensionCounts.e3, score: scores.e3 },
            { type: 'r1', label: 'Strategy Adjustment', count: modifiedCount + rejectedCount, score: scores.r1 },
            { type: 'r2', label: 'Trust Calibration', count: taskTypes.size, score: scores.r2 },
          ];

          // Aggregate to 4 main dimensions for MR19 component compatibility
          // Convert 0-3 scores to 0-1 effectiveness scale
          const aggregated4D = [
            {
              type: 'plan' as const,
              count: dimensionCounts.p1 + dimensionCounts.p2 + dimensionCounts.p3 + dimensionCounts.p4,
              effectiveness: (scores.p1 + scores.p2 + scores.p3 + scores.p4) / 12, // average of 4 dimensions, normalized to 0-1
            },
            {
              type: 'monitor' as const,
              count: dimensionCounts.m1 + dimensionCounts.m2 + dimensionCounts.m3,
              effectiveness: (scores.m1 + scores.m2 + scores.m3) / 9, // average of 3 dimensions, normalized to 0-1
            },
            {
              type: 'evaluate' as const,
              count: dimensionCounts.e1 + dimensionCounts.e2 + dimensionCounts.e3,
              effectiveness: (scores.e1 + scores.e2 + scores.e3) / 9, // average of 3 dimensions, normalized to 0-1
            },
            {
              type: 'regulate' as const,
              count: dimensionCounts.r1 + dimensionCounts.r2,
              effectiveness: (scores.r1 + scores.r2) / 6, // average of 2 dimensions, normalized to 0-1
            },
          ];

          setBehaviorHistory(aggregated4D);

          console.log('Analyzed 12-dimensional behavior data:', {
            totalInteractions,
            verifiedCount,
            modifiedCount,
            rejectedCount,
            '12-dimensional scores (0-3 scale)': scores,
            '12-dimensional counts': dimensionCounts,
            'Full 12D history': fullBehaviorHistory,
            'Aggregated 4D for MR19': aggregated4D,
            strategyDiversity: strategies.size,
            contextDiversity: taskTypes.size,
            totalScore: Object.values(scores).reduce((a, b) => a + b, 0),
            maxScore: 36,
            percentage: `${Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 36) * 100)}%`,
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

  // Load previous assessment and all assessments on mount
  useEffect(() => {
    const loadPreviousAssessment = async () => {
      if (user?.id) {
        try {
          setLoadingPrevious(true);
          await Promise.all([
            fetchLatestAssessment(user.id),
            fetchAssessments(user.id)
          ]);
        } catch (error) {
          console.error('Failed to load previous assessment:', error);
        } finally {
          setLoadingPrevious(false);
        }
      } else {
        setLoadingPrevious(false);
      }
    };

    loadPreviousAssessment();
  }, [user?.id, fetchLatestAssessment, fetchAssessments]);

  // Convert previous assessment to MetacognitiveProfile if it exists
  useEffect(() => {
    if (latestAssessment && !showNewAssessment) {
      const convertedProfile: MetacognitiveProfile = {
        assessedAt: new Date(latestAssessment.timestamp),
        dimensions: {
          planning: {
            score: latestAssessment.planningScore || 0,
            level: (latestAssessment.planningScore || 0) >= 0.75 ? 'strong' as const :
                   (latestAssessment.planningScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
            interpretation: '',
          },
          monitoring: {
            score: latestAssessment.monitoringScore || 0,
            level: (latestAssessment.monitoringScore || 0) >= 0.75 ? 'strong' as const :
                   (latestAssessment.monitoringScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
            interpretation: '',
          },
          evaluation: {
            score: latestAssessment.evaluationScore || 0,
            level: (latestAssessment.evaluationScore || 0) >= 0.75 ? 'strong' as const :
                   (latestAssessment.evaluationScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
            interpretation: '',
          },
          regulation: {
            score: latestAssessment.regulationScore || 0,
            level: (latestAssessment.regulationScore || 0) >= 0.75 ? 'strong' as const :
                   (latestAssessment.regulationScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
            interpretation: '',
          },
        },
        overallInterpretation: `Your assessment from ${new Date(latestAssessment.timestamp).toLocaleDateString()}`,
        topStrengths: latestAssessment.strengths || [],
        areasForGrowth: latestAssessment.areasForGrowth || [],
        confidenceLevel: 'high' as const,
        dataSource: 'combined' as const,
      };

      setProfile(convertedProfile);
      setAssessmentCompleted(true);
    }
  }, [latestAssessment, showNewAssessment]);

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
        setShowNewAssessment(false); // Reset to show saved assessment next time
      } catch (error: any) {
        console.error('Failed to save assessment:', error);
        setSaveError(error.message || 'Failed to save assessment results');
      } finally {
        setSaving(false);
      }
    }

    setAssessmentCompleted(true);
  };

  const handleRetakeAssessment = () => {
    setShowNewAssessment(true);
    setAssessmentCompleted(false);
    setProfile(null);
    setSaveError(null);
    setShowHistory(false);
    setSelectedHistoryId(null);
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleSelectHistoryItem = (assessment: AssessmentResult) => {
    const convertedProfile: MetacognitiveProfile = {
      assessedAt: new Date(assessment.timestamp),
      dimensions: {
        planning: {
          score: assessment.planningScore || 0,
          level: (assessment.planningScore || 0) >= 0.75 ? 'strong' as const :
                 (assessment.planningScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
          interpretation: '',
        },
        monitoring: {
          score: assessment.monitoringScore || 0,
          level: (assessment.monitoringScore || 0) >= 0.75 ? 'strong' as const :
                 (assessment.monitoringScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
          interpretation: '',
        },
        evaluation: {
          score: assessment.evaluationScore || 0,
          level: (assessment.evaluationScore || 0) >= 0.75 ? 'strong' as const :
                 (assessment.evaluationScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
          interpretation: '',
        },
        regulation: {
          score: assessment.regulationScore || 0,
          level: (assessment.regulationScore || 0) >= 0.75 ? 'strong' as const :
                 (assessment.regulationScore || 0) >= 0.5 ? 'moderate' as const : 'developing' as const,
          interpretation: '',
        },
      },
      overallInterpretation: `Your assessment from ${new Date(assessment.timestamp).toLocaleDateString()}`,
      topStrengths: assessment.strengths || [],
      areasForGrowth: assessment.areasForGrowth || [],
      confidenceLevel: 'high' as const,
      dataSource: 'combined' as const,
    };

    setProfile(convertedProfile);
    setSelectedHistoryId(assessment.id);
    setShowNewAssessment(false);
    setAssessmentCompleted(true);
    setShowHistory(false);
  };

  return (
    <div className="assessment-page">
      {/* Header */}
      <div className="assessment-header">
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
          {(loadingBehavior || loadingPrevious) ? (
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
                {loadingPrevious ? 'Loading Your Assessment History' : 'Analyzing Your Behavior History'}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1rem'
              }}>
                {loadingPrevious ? 'Checking for previous assessments...' : 'Reading your past interactions to personalize your assessment...'}
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

              {(latestAssessment || selectedHistoryId) && !showNewAssessment && (
                <div style={{
                  backgroundColor: '#eef2ff',
                  border: '2px solid #818cf8',
                  borderRadius: '0.5rem',
                  padding: '1rem 1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: '#4338ca',
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    📊 {selectedHistoryId
                      ? `Viewing assessment from ${new Date(profile?.assessedAt || '').toLocaleDateString()}`
                      : `Showing your latest assessment from ${new Date(latestAssessment!.timestamp).toLocaleDateString()}`
                    }
                  </p>
                  <p style={{
                    color: '#64748b',
                    margin: '0.5rem 0 0 0',
                    fontSize: '0.875rem'
                  }}>
                    This assessment has been saved. {assessments.length > 1 && 'Click "View History" to see all assessments.'}
                  </p>
                </div>
              )}

              {saving && (
                <p className="completion-message" style={{ color: '#3b82f6' }}>
                  💾 Saving your results...
                </p>
              )}

              {!saving && !saveError && showNewAssessment && (
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
              <div className="completion-action" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="completion-button"
                  onClick={handleReturnToDashboard}
                  disabled={saving}
                  style={{
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  Return to Dashboard
                </button>
                {assessments.length > 1 && (
                  <button
                    className="completion-button"
                    onClick={handleViewHistory}
                    disabled={saving}
                    style={{
                      backgroundColor: '#047857',
                      color: '#fff',
                      border: '2px solid #047857',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    📜 {showHistory ? 'Hide History' : 'View History'} ({assessments.length})
                  </button>
                )}
                <button
                  className="completion-button"
                  onClick={handleRetakeAssessment}
                  disabled={saving}
                  style={{
                    backgroundColor: '#4338ca',
                    color: '#fff',
                    border: '2px solid #4338ca',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  🔄 Retake Assessment
                </button>
              </div>

              {/* History List */}
              {showHistory && assessments.length > 0 && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#1f2937'
                  }}>
                    📚 Assessment History
                  </h3>
                  <p style={{
                    margin: '0 0 1.5rem 0',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: 1.5
                  }}>
                    💡 <strong>How to read the scores:</strong> The percentage shows your average across all 4 dimensions
                    (Planning, Monitoring, Evaluation, Regulation). Click any assessment to view its detailed breakdown.
                  </p>
                  <div style={{
                    display: 'grid',
                    gap: '0.75rem'
                  }}>
                    {assessments.map((assessment, index) => {
                      const isSelected = selectedHistoryId === assessment.id ||
                                        (!selectedHistoryId && index === 0);
                      const date = new Date(assessment.timestamp);
                      const avgScore = (
                        (assessment.planningScore || 0) +
                        (assessment.monitoringScore || 0) +
                        (assessment.evaluationScore || 0) +
                        (assessment.regulationScore || 0)
                      ) / 4;

                      return (
                        <button
                          key={assessment.id}
                          onClick={() => handleSelectHistoryItem(assessment)}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: isSelected ? '#eef2ff' : '#fff',
                            border: isSelected ? '3px solid #6366f1' : '2px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            display: 'block',
                            width: '100%',
                            boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#6366f1';
                              e.currentTarget.style.backgroundColor = '#fafafa';
                              e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.backgroundColor = '#fff';
                              e.currentTarget.style.boxShadow = 'none';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '1.125rem',
                                fontWeight: 700,
                                color: isSelected ? '#4338ca' : '#1f2937',
                                marginBottom: '0.25rem'
                              }}>
                                {index === 0 ? '🌟 Latest' : `Assessment #${assessments.length - index}`}
                                {isSelected && ' ✓'}
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6b7280'
                              }}>
                                {date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div style={{
                              textAlign: 'right'
                            }}>
                              <div style={{
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: avgScore >= 0.75 ? '#059669' : avgScore >= 0.5 ? '#f59e0b' : '#ef4444',
                                lineHeight: 1
                              }}>
                                {(avgScore * 100).toFixed(0)}%
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                marginTop: '0.25rem',
                                fontWeight: 600
                              }}>
                                Average Score
                              </div>
                            </div>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.5rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #e5e7eb'
                          }}>
                            <div style={{ fontSize: '0.8125rem' }}>
                              <span style={{ color: '#6b7280' }}>📋 Planning:</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem', color: '#1f2937' }}>
                                {((assessment.planningScore || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem' }}>
                              <span style={{ color: '#6b7280' }}>👁️ Monitoring:</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem', color: '#1f2937' }}>
                                {((assessment.monitoringScore || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem' }}>
                              <span style={{ color: '#6b7280' }}>⚖️ Evaluation:</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem', color: '#1f2937' }}>
                                {((assessment.evaluationScore || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem' }}>
                              <span style={{ color: '#6b7280' }}>🔄 Regulation:</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem', color: '#1f2937' }}>
                                {((assessment.regulationScore || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          {!isSelected && (
                            <div style={{
                              marginTop: '0.75rem',
                              fontSize: '0.8125rem',
                              color: '#6366f1',
                              fontWeight: 600,
                              textAlign: 'center'
                            }}>
                              👆 Click to view details
                            </div>
                          )}
                          {isSelected && (
                            <div style={{
                              marginTop: '0.75rem',
                              fontSize: '0.8125rem',
                              color: '#4338ca',
                              fontWeight: 600,
                              textAlign: 'center',
                              backgroundColor: '#e0e7ff',
                              padding: '0.5rem',
                              borderRadius: '0.25rem'
                            }}>
                              ✓ Currently viewing this assessment
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
