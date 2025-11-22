import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePatternStore } from '../stores/patternStore';
import { useUIStore } from '../stores/uiStore';
import { useAssessmentStore } from '../stores/assessmentStore';
import { useAnalytics, usePatternStats } from '../hooks/useAnalytics';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChartSkeleton, { ChartSkeletonGroup } from '../components/ChartSkeleton';
import InfoTooltip from '../components/InfoTooltip';
import OnboardingTour from '../components/OnboardingTour';
import {
  predictPatternFromAssessment,
  getPatternProfile,
  getMultiDimensionRecommendations,
  getEffectivePattern,
  analyzeCapabilityVsBehaviorGap,
  hasSufficientBehavioralData,
  type DimensionScores,
  type BehavioralPattern
} from '../utils/metacognitiveTypeSystem';
import './DashboardPage.css';
import '../styles/components.css';

/**
 * Dashboard Page
 * Main dashboard showing overview of AI usage patterns and system metrics
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { latestAssessment, assessments, fetchLatestAssessment, fetchAssessments } = useAssessmentStore();
  const { patterns, fetchPatterns } = usePatternStore();

  // Date range state - default to 7 days
  const [dateRange, setDateRange] = useState<number>(7);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { analytics, loading: analyticsLoading } = useAnalytics(dateRange);
  const { stats: patternStats, loading: patternsLoading } = usePatternStats(user?.id || 'current', dateRange);

  // Get current user's pattern data
  const userPattern = patterns.find(p => p.userId === user?.id) || patterns[0];
  const [verificationStrategyData, setVerificationStrategyData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch latest assessment and all assessments when component mounts
    if (user?.id) {
      fetchLatestAssessment(user.id);
      fetchAssessments(user.id);
      fetchPatterns(user.id);
    }
  }, [user?.id, fetchLatestAssessment, fetchAssessments, fetchPatterns]);

  useEffect(() => {
    // Show welcome modal only ONCE for users without assessment
    if (user?.id && latestAssessment === null) {
      const hasSeenModal = localStorage.getItem(`assessment_modal_shown_${user.id}`);
      const hasSkippedAssessment = localStorage.getItem(`assessment_skipped_${user.id}`);

      // Only show if user has never seen the modal and hasn't skipped
      if (!hasSeenModal && !hasSkippedAssessment) {
        // Mark as shown immediately to prevent showing again on refresh
        localStorage.setItem(`assessment_modal_shown_${user.id}`, 'true');
        // Delay showing modal slightly for better UX
        const timer = setTimeout(() => setShowWelcomeModal(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, latestAssessment]);

  useEffect(() => {
    // Fetch verification strategy data when date range changes
    const fetchVerificationStrategy = async () => {
      try {
        const response = await apiService.analytics.getVerificationStrategy(dateRange);
        setVerificationStrategyData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch verification strategy data:', error);
        // Set empty data on error
        setVerificationStrategyData([]);
      }
    };
    fetchVerificationStrategy();
  }, [dateRange]);

  const loading = analyticsLoading || patternsLoading;

  // Use real analytics data
  const totalSessions = analytics?.totalSessions || 0;
  const totalInteractions = analytics?.totalInteractions || 0;
  const averageSessionDuration = analytics?.averageSessionDuration || 0;
  const dominantPattern = analytics?.dominantPattern || 'A';
  const patternDistribution = analytics?.patternDistribution || {};
  const verificationRate = analytics?.verificationRate || 0;
  const modificationRate = analytics?.modificationRate || 0;

  // Generate daily trend data from pattern trends if available
  // Filter out any data from before user registration to ensure data accuracy
  const userRegistrationDate = user?.createdAt ? new Date(user.createdAt) : null;
  const dailyAccuracyData = analytics?.patternTrend
    ? analytics.patternTrend
        .filter((trend: any) => {
          if (!userRegistrationDate || !trend.date) return true;
          // Compare dates (ignoring time) to filter out pre-registration data
          const trendDate = new Date(trend.date);
          const userDateOnly = new Date(userRegistrationDate.toDateString());
          const trendDateOnly = new Date(trendDate.toDateString());
          return trendDateOnly >= userDateOnly;
        })
        .map((trend: any, idx: number) => ({
          day: `Day ${idx + 1}`,
          date: trend.date ? new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${idx + 1}`,
          accuracy: trend.verificationRate !== undefined ? trend.verificationRate : 0,
        }))
    : [];

  // Convert pattern distribution to chart format
  const patternDistributionChart = Object.entries(patternDistribution).map(([name, value]) => ({
    name: `Pattern ${name.toUpperCase()}`,
    value: Math.round((value as number) * 100),
  }));

  // Modern gradient colors for better visual appeal
  const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
  ];

  // Custom label component for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontWeight: 600, fontSize: '14px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
      >
        {`${value}%`}
      </text>
    );
  };

  // Use real verification strategy data from backend
  // Maps real user behavior to quality impact scores
  const interventionData = verificationStrategyData.length > 0
    ? verificationStrategyData.map(item => ({
        strategy: item.strategy,
        successRate: item.qualityScore,
        sampleSize: item.sampleSize,
      }))
    : [
        { strategy: 'Low Verification', successRate: 0, sampleSize: 0 },
        { strategy: 'Medium Verification', successRate: 0, sampleSize: 0 },
        { strategy: 'High Verification', successRate: 0, sampleSize: 0 },
      ];

  // Detect pattern change by checking if current dominantPattern differs from last stored pattern
  // Load last known pattern from localStorage
  const lastKnownPattern = user?.id
    ? localStorage.getItem(`last_dominant_pattern_${user.id}`)
    : null;

  const patternChanged = lastKnownPattern !== null
    && dominantPattern !== lastKnownPattern
    && totalSessions > 0;

  // Update localStorage with current pattern for future comparison
  useEffect(() => {
    if (user?.id && dominantPattern && !loading) {
      localStorage.setItem(`last_dominant_pattern_${user.id}`, dominantPattern);
    }
  }, [user?.id, dominantPattern, loading]);

  const handleSkipAssessment = () => {
    if (user?.id) {
      localStorage.setItem(`assessment_skipped_${user.id}`, 'true');
    }
    setShowWelcomeModal(false);
  };

  const handleTakeAssessment = () => {
    setShowWelcomeModal(false);
    navigate('/assessment');
  };

  return (
    <div className="dashboard-page">
      {/* Onboarding Tour */}
      <OnboardingTour context="dashboard" userCreatedAt={user?.createdAt} />

      {/* Welcome Modal for First-time Users */}
      {showWelcomeModal && (
        <div className="welcome-modal-overlay" onClick={handleSkipAssessment}>
          <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="welcome-modal-close"
              onClick={handleSkipAssessment}
              aria-label="Close welcome modal"
            >
              ×
            </button>
            <div className="welcome-modal-icon">🧠</div>
            <h2 className="welcome-modal-title">
              Discover Your Metacognitive Profile
            </h2>
            <p className="welcome-modal-description">
              Take a 10-minute assessment to understand your AI usage patterns and get personalized recommendations
              to improve your metacognitive skills across Planning, Monitoring, Evaluation, and Regulation.
            </p>
            <div className="welcome-modal-actions">
              <button
                className="welcome-modal-button welcome-modal-button-primary"
                onClick={handleTakeAssessment}
              >
                Take Assessment Now
              </button>
              <button
                className="welcome-modal-button welcome-modal-button-secondary"
                onClick={handleSkipAssessment}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="dashboard-container" style={{ marginBottom: '2rem' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {user?.username}! Here's your AI usage overview.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>💬</span>
            Start Chat
          </button>
        </div>

        {/* Insight Alert Box - High Priority */}
        {patternChanged && (
          <div className="insight-alert">
            <div className="alert-header">
              <div className="alert-icon">⚡</div>
              <div className="alert-content">
                <h3 className="alert-title">
                  Pattern Recognition Update!
                </h3>
                <p className="alert-message">
                  Your AI usage pattern has been updated from Pattern {lastKnownPattern} to Pattern {dominantPattern} with {(analytics?.confidence || 0.8) * 100}% confidence.
                  This indicates positive changes in how you're using AI.
                </p>
                <div className="alert-actions">
                  <button
                    className="alert-button alert-button-primary"
                    onClick={() => navigate('/patterns')}
                    aria-label="View pattern change details"
                  >
                    View Details →
                  </button>
                  <button
                    className="alert-button alert-button-secondary"
                    onClick={() => {
                      // Dismiss the alert by updating the "last known pattern"
                      // In a real app, this would update localStorage or state
                    }}
                    aria-label="Dismiss pattern recognition update notification"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Start Guide Card - Only show for new users with no sessions */}
      {totalSessions === 0 && (
        <div className="dashboard-container" style={{ marginBottom: '2rem' }} data-tour="quick-start">
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #0ea5e9',
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>🎯</span>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0369a1' }}>
                Quick Start Guide
              </h2>
            </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Step 1: Start Chat */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e0f2fe',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/chat')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#0c4a6e' }}>
                1. Start Conversation
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                Go to AI Chat and begin interacting with the system
              </p>
            </div>

            {/* Step 2: Complete Assessment */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e0f2fe',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/assessment')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧠</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#0c4a6e' }}>
                2. Complete Assessment
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                Take the MR19 metacognitive capability evaluation
              </p>
            </div>

            {/* Step 3: View Patterns */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e0f2fe',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/patterns')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#0c4a6e' }}>
                3. Understand Patterns
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                Discover your AI usage pattern (A-F)
              </p>
            </div>

            {/* Step 4: Accept Interventions */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e0f2fe',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💡</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#0c4a6e' }}>
                4. Receive Interventions
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                Get intelligent MR recommendations to improve
              </p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="metrics-section" data-tour="metrics">
        <div className="metrics-grid">
          {loading ? (
            <>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
              <div className="metric-card skeleton-placeholder" style={{ minHeight: '150px' }}></div>
            </>
          ) : (
            <>
              <div className="metric-card">
                <div className="metric-label">
                  Total Sessions
                  <InfoTooltip text="Number of conversation sessions with actual interactions. Auto-created empty sessions are not counted." size="small" />
                </div>
                <div className="metric-value">{totalSessions}</div>
                <div className="metric-description">
                  {totalInteractions} total interactions recorded
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  Current Pattern
                  <InfoTooltip text="Your dominant AI usage pattern based on recent interactions. Each pattern has different characteristics and risk profiles." size="small" />
                </div>
                <div className="metric-value" style={{ fontSize: '2.5rem' }}>Pattern {dominantPattern}</div>
                <div className="metric-description">
                  Primary AI usage pattern detected
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  Verification Rate
                  <InfoTooltip text="Percentage of AI outputs you verify or check. Higher is better for maintaining skill integrity." size="small" />
                </div>
                <div className="metric-value">{verificationRate.toFixed(0)}%</div>
                <div className="metric-description">
                  {verificationRate > 70 ? '✅ Excellent verification level' : verificationRate > 40 ? '📊 Moderate verification' : '⚠️ Low verification - consider increasing'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metacognitive Assessment Results Section */}
      {latestAssessment && latestAssessment.responses && (
        <>
          <div className="assessment-results-section" style={{ marginBottom: '2rem' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                🧠 Your Metacognitive Profile
              </h2>
              <button
                onClick={() => navigate('/assessment')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Retake Assessment
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {latestAssessment.responses.dimensions && Object.entries(latestAssessment.responses.dimensions).map(([dimension, data]: [string, any]) => {
                const colors = {
                  planning: { bg: '#eff6ff', border: '#3b82f6', icon: '📐' },
                  monitoring: { bg: '#f0fdf4', border: '#10b981', icon: '👁️' },
                  evaluation: { bg: '#fef3c7', border: '#f59e0b', icon: '⚖️' },
                  regulation: { bg: '#fce7f3', border: '#ec4899', icon: '🔄' },
                };
                const color = colors[dimension as keyof typeof colors] || colors.planning;

                return (
                  <div
                    key={dimension}
                    style={{
                      padding: '1.5rem',
                      backgroundColor: color.bg,
                      borderLeft: `4px solid ${color.border}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{color.icon}</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>
                      {dimension}
                    </h3>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: color.border, marginBottom: '0.5rem' }}>
                      {(data.score * 100).toFixed(0)}%
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      backgroundColor: data.level === 'strong' ? '#10b981' : data.level === 'moderate' ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}>
                      {data.level}
                    </div>
                  </div>
                );
              })}
            </div>

            {latestAssessment.responses.areasForGrowth && latestAssessment.responses.areasForGrowth.length > 0 && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #64748b',
              }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                  💡 Areas for Growth
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {latestAssessment.responses.areasForGrowth.map((area: string, idx: number) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Behavioral Pattern & Personalized Recommendations Section */}
          {(() => {
            const dimensions = latestAssessment.responses.dimensions;
            if (!dimensions) return null;

            // Extract dimension scores from assessment
            const assessmentScores: DimensionScores = {
              planning: dimensions.planning?.score || 0,
              monitoring: dimensions.monitoring?.score || 0,
              evaluation: dimensions.evaluation?.score || 0,
              regulation: dimensions.regulation?.score || 0,
            };

            // Determine effective pattern based on data availability
            const detectedPattern = (dominantPattern as BehavioralPattern) || null;
            const effectivePatternData = getEffectivePattern(assessmentScores, detectedPattern, totalSessions);
            const currentPattern = effectivePatternData.pattern;
            const patternSource = effectivePatternData.source;
            const patternConfidence = effectivePatternData.confidence;

            // Get pattern profile
            const patternProfile = getPatternProfile(currentPattern);

            // Get gap analysis if we have both assessment and detected pattern
            const gapAnalysis = (patternSource === 'detected' && detectedPattern)
              ? analyzeCapabilityVsBehaviorGap(assessmentScores, detectedPattern)
              : null;

            // Get recommendations (multi-dimension aware)
            const dimensionRecommendations = getMultiDimensionRecommendations(assessmentScores);

            // If no weak dimensions, use pattern-based recommendations
            const finalRecommendations = dimensionRecommendations.length > 0
              ? dimensionRecommendations
              : patternProfile.recommendedMRs.slice(0, 2);

            return (
              <div style={{ marginBottom: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
                {/* Behavioral Pattern Display */}
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  border: `3px solid ${patternProfile.color}`,
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Pattern Header with Source Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                      fontSize: '3rem',
                      width: '80px',
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${patternProfile.color}20`,
                      borderRadius: '16px',
                    }}>
                      {patternProfile.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                          Your AI Usage Pattern: <span style={{ color: patternProfile.color }}>{patternProfile.nameCN}</span>
                        </h2>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: patternProfile.color,
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                        }}>
                          Pattern {patternProfile.pattern}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: patternSource === 'detected' ? '#10b981' : patternSource === 'predicted' ? '#f59e0b' : '#6b7280',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}>
                          {patternSource === 'detected' ? '🎯 Detected from Behavior' : patternSource === 'predicted' ? '🔮 Predicted from Assessment' : '📋 Default'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                        {patternProfile.descriptionCN}
                      </p>
                    </div>
                  </div>

                  {/* Pattern Characteristics */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', textTransform: 'uppercase' }}>
                      💡 Pattern Characteristics
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.8' }}>
                      {patternProfile.characteristicsCN.map((char, idx) => (
                        <li key={idx}>{char}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Level Indicator */}
                  {patternProfile.riskLevel === 'high' && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.25rem',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      border: '2px solid #ef4444',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#991b1b', textTransform: 'uppercase' }}>
                          High Risk Alert
                        </h3>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#7f1d1d' }}>
                        您的使用模式显示过度依赖AI的迹象。建议立即采取措施提升独立思考和验证能力。
                      </p>
                    </div>
                  )}

                  {/* Gap Analysis: Potential Capability vs Actual Behavior */}
                  {gapAnalysis && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.25rem',
                      backgroundColor: gapAnalysis.gapType === 'underperforming' ? '#fef3c7' : gapAnalysis.gapType === 'overperforming' ? '#d1fae5' : '#f0f9ff',
                      borderRadius: '8px',
                      border: `2px solid ${gapAnalysis.gapType === 'underperforming' ? '#f59e0b' : gapAnalysis.gapType === 'overperforming' ? '#10b981' : '#0ea5e9'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>
                          {gapAnalysis.gapType === 'aligned' ? '✅' : gapAnalysis.gapType === 'underperforming' ? '⚠️' : '🌟'}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: gapAnalysis.gapType === 'underperforming' ? '#92400e' : gapAnalysis.gapType === 'overperforming' ? '#065f46' : '#0369a1', textTransform: 'uppercase' }}>
                          Capability vs Behavior Analysis
                        </h3>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          backgroundColor: gapAnalysis.gapType === 'underperforming' ? '#f59e0b' : gapAnalysis.gapType === 'overperforming' ? '#10b981' : '#0ea5e9',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}>
                          {gapAnalysis.gapType === 'aligned' ? '完全对齐' : gapAnalysis.gapType === 'underperforming' ? '能力未充分发挥' : '超预期表现'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                        预测模式: Pattern {gapAnalysis.predictedPattern} → 实际行为: Pattern {gapAnalysis.actualPattern}
                      </p>
                      <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.8' }}>
                        {gapAnalysis.insightsCN.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                      {gapAnalysis.recommendationsCN.length > 0 && (
                        <>
                          <h4 style={{ margin: '0.75rem 0 0.5rem 0', fontSize: '0.8125rem', fontWeight: '600', color: '#1f2937', textTransform: 'uppercase' }}>
                            💡 Recommendations
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: '1.8' }}>
                            {gapAnalysis.recommendationsCN.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* MR Recommendations */}
                {finalRecommendations.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '2rem',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>🎯</span>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                        Recommended for You
                      </h2>
                    </div>
                    <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', opacity: 0.95 }}>
                      Based on your <strong>{patternProfile.nameCN}</strong> pattern, we recommend these MR features to help you grow
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {finalRecommendations.map((mr: any) => (
                        <div
                          key={mr.id}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '2px solid transparent',
                          }}
                          onClick={() => navigate('/chat')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.borderColor = mr.color;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{
                              fontSize: '1.75rem',
                              width: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: mr.color + '20',
                              borderRadius: '8px',
                            }}>
                              {mr.icon}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: mr.color, marginBottom: '0.25rem' }}>
                                {mr.id}
                              </div>
                              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>
                                {mr.name}
                              </h3>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                            {mr.description}
                          </p>
                          <div style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: mr.color,
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            textAlign: 'center',
                          }}>
                            Try in Chat →
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Assessment Progress Tracking Section */}
          {assessments && assessments.length > 1 && (() => {
            // Prepare trend data from all assessments
            const trendData = assessments
              .slice()
              .reverse() // Show oldest to newest
              .map((assessment: any) => {
                const date = new Date(assessment.timestamp);
                return {
                  date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  fullDate: date,
                  Planning: assessment.planningScore ? (assessment.planningScore * 100).toFixed(0) : 0,
                  Monitoring: assessment.monitoringScore ? (assessment.monitoringScore * 100).toFixed(0) : 0,
                  Evaluation: assessment.evaluationScore ? (assessment.evaluationScore * 100).toFixed(0) : 0,
                  Regulation: assessment.regulationScore ? (assessment.regulationScore * 100).toFixed(0) : 0,
                };
              });

            // Calculate progress indicators
            const calculateProgress = (dimension: string) => {
              if (assessments.length < 2) return { change: 0, status: 'stable' };
              const latest = assessments[0];
              const previous = assessments[1];
              const latestScore = latest[`${dimension.toLowerCase()}Score`] || 0;
              const previousScore = previous[`${dimension.toLowerCase()}Score`] || 0;
              const change = ((latestScore - previousScore) * 100).toFixed(1);
              const changeNum = parseFloat(change);
              const status = changeNum > 2 ? 'improved' : changeNum < -2 ? 'declined' : 'stable';
              return { change: changeNum, status };
            };

            const progressIndicators = {
              planning: calculateProgress('planning'),
              monitoring: calculateProgress('monitoring'),
              evaluation: calculateProgress('evaluation'),
              regulation: calculateProgress('regulation'),
            };

            return (
              <div style={{ marginBottom: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '2rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                        📈 Your Progress Over Time
                      </h2>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                        Track how your metacognitive skills are developing across {assessments.length} assessments
                      </p>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {Object.entries(progressIndicators).map(([dimension, data]: [string, any]) => {
                      const colors = {
                        planning: '#3b82f6',
                        monitoring: '#10b981',
                        evaluation: '#f59e0b',
                        regulation: '#ec4899',
                      };
                      const color = colors[dimension as keyof typeof colors];
                      const statusIcons = {
                        improved: '📈',
                        declined: '📉',
                        stable: '➡️',
                      };
                      const statusColors = {
                        improved: '#10b981',
                        declined: '#ef4444',
                        stable: '#6b7280',
                      };

                      return (
                        <div
                          key={dimension}
                          style={{
                            padding: '1rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: `2px solid ${color}20`,
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            {dimension}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>{statusIcons[data.status as keyof typeof statusIcons]}</span>
                            <div>
                              <div style={{
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                color: statusColors[data.status as keyof typeof statusColors],
                              }}>
                                {data.change > 0 ? '+' : ''}{data.change}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>
                                {data.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trend Chart */}
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px' }}>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          style={{ fontSize: '12px', fontWeight: 500 }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#6b7280"
                          style={{ fontSize: '12px', fontWeight: 500 }}
                          tickLine={false}
                          axisLine={false}
                          label={{
                            value: 'Score (0-100)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: '12px', fontWeight: 600, fill: '#6b7280' }
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '13px',
                            fontWeight: 500
                          }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
                          iconType="line"
                        />
                        <Line
                          type="monotone"
                          dataKey="Planning"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Monitoring"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Evaluation"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Regulation"
                          stroke="#ec4899"
                          strokeWidth={3}
                          dot={{ fill: '#ec4899', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}


      {/* Charts Section */}
      <div className="charts-section">
        {/* Date Range Selector */}
        <div className="date-range-selector" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="dateRange" style={{ fontWeight: 500, color: '#374151' }}>
            Time Period:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing data from the past {dateRange} day{dateRange !== 1 ? 's' : ''}
          </span>
        </div>

      <div className="charts-grid">
        {loading ? (
          <>
            <ChartSkeleton type="line" height={300} />
            <ChartSkeleton type="pie" height={300} />
          </>
        ) : (
          <>
            {/* 1. Daily Accuracy Trend */}
              <div className="chart-container">
                <h3 className="chart-title">
                  Daily Accuracy Trend
                  <InfoTooltip text="Shows your verification accuracy over the past days. Higher trends indicate you're getting better at verifying AI outputs correctly." size="small" />
                </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyAccuracyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '13px', fontWeight: 500 }} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="url(#colorAccuracy)"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
              {dailyAccuracyData.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-around',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280' }}>Average</div>
                    <div style={{ fontWeight: '700', color: '#3b82f6' }}>
                      {(dailyAccuracyData.reduce((sum, d) => sum + (d.accuracy || 0), 0) / dailyAccuracyData.length).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280' }}>Peak</div>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>
                      {Math.max(...dailyAccuracyData.map(d => d.accuracy || 0)).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280' }}>Days</div>
                    <div style={{ fontWeight: '700', color: '#8b5cf6' }}>
                      {dailyAccuracyData.length}
                    </div>
                  </div>
                </div>
              )}
              </div>

            {/* 2. Pattern Distribution */}
              <div className="chart-container">
                <h3 className="chart-title">
                  Pattern Distribution
                  <InfoTooltip text="Shows the breakdown of AI usage patterns you employ. Understanding your pattern mix helps identify if you're over-relying on certain approaches." size="small" />
                </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={patternDistributionChart}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={75}
                    innerRadius={35}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {patternDistributionChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                color: '#475569'
              }}>
                <strong>Current Pattern:</strong> {dominantPattern} - {patternDistributionChart.length === 1 ? 'Single pattern detected. More variety may appear as you interact more.' : `${patternDistributionChart.length} patterns detected in your usage.`}
              </div>
              </div>

            {/* 3. Quick Stats */}
            <div className="chart-container stats-container">
              <h3>Quick Stats</h3>

              {/* Behavioral Metrics Section */}
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#fafafa'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Behavioral Metrics
                  </span>
                  <button
                    onClick={() => navigate('/patterns')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    View Detail →
                  </button>
                </div>
                <div className="stats-list" style={{ gap: '0.5rem' }}>
                  <div className="stat-item">
                    <span className="stat-label">Verification Rate:</span>
                    <span className="stat-value">{verificationRate.toFixed(0)}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Modification Rate:</span>
                    <span className="stat-value">{modificationRate.toFixed(0)}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">AI Reliance:</span>
                    <span className="stat-value">
                      {userPattern?.aiRelianceScore !== undefined
                        ? `${(userPattern.aiRelianceScore * 100).toFixed(0)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Pattern Stability:</span>
                    <span className="stat-value">
                      {userPattern?.stability !== undefined
                        ? `${(userPattern.stability * 100).toFixed(0)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment Score Section */}
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '1rem',
                backgroundColor: '#fafafa'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Metacognitive Assessment
                  </span>
                  <button
                    onClick={() => navigate('/assessment')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8b5cf6',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f3ff')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    View Detail →
                  </button>
                </div>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-label">Assessment Score:</span>
                    <span className="stat-value">
                      {latestAssessment?.overallScore !== undefined
                        ? `${(latestAssessment.overallScore * 100).toFixed(0)}/100`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Verification Strategy Impact */}
              <div className="chart-container">
                <h3 className="chart-title">
                  Verification Strategy Impact
                  <InfoTooltip text="Real data showing how your verification behavior affects work quality. Based on your actual interactions with AI outputs." size="small" />
                </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interventionData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="strategy"
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                  />
                  <YAxis
                    label={{
                      value: 'Quality Score (%)',
                      angle: -90,
                      position: 'center',
                      offset: -50,
                      style: { fontSize: '12px', fontWeight: 600, fill: '#6b7280' }
                    }}
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value}%`,
                      `Quality Score (${props.payload.sampleSize} interactions)`
                    ]}
                    labelFormatter={(label: string) => label}
                  />
                  <Bar
                    dataKey="successRate"
                    fill="url(#colorBar)"
                    name="Quality Score"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                <p style={{ margin: '0.5rem 0' }}>📊 <strong>Real Data:</strong> Final quality scores represent output quality AFTER verification process</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>Low (~30-65%):</strong> No verification - accepted AI outputs directly (risky, potential errors remain)</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>Medium (~75-90%):</strong> Verified and found issues to fix (good practice - errors caught and corrected)</p>
                <p style={{ margin: '0.5rem 0' }}>💡 <strong>High (~90-100%):</strong> Verified and accepted without modifications (best practice - quality confirmed)</p>
                <p style={{ margin: '0.5rem 0', fontStyle: 'italic', color: '#64748b' }}>
                  ℹ️ Higher scores indicate better final output quality. Verification improves quality by catching errors.
                </p>
              </div>
              </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default DashboardPage;
