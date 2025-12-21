/**
 * MR12: Critical Thinking Scaffolding - AI-Enhanced Guided Flow
 *
 * New features:
 * - AI-generated targeted questions specific to the content
 * - Fallback to template questions if API fails
 * - Save thinking records to database
 * - View thinking history
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ContentType,
  ResponseOption,
  ThinkingQuestion,
  UserResponse,
  ThinkingAssessment,
  getQuestionsForType,
  detectContentType,
  getContentTypeInfo,
  generateAssessment,
  // Backward compatibility
  DomainType,
  CriticalAssessment,
} from './utils';
import ThinkingHistory from './ThinkingHistory';
import './styles.css';

// API base URL
const API_BASE = '/api';

interface AIQuestion {
  id: string;
  question: string;
  description: string;
  targetText?: string;
  verificationTip?: string;
}

interface MR12Props {
  /** AI output content to evaluate */
  aiOutput?: string;
  /** Content type (auto-detected if not provided) */
  domain?: DomainType;
  /** Session ID for saving records */
  sessionId?: string;
  /** Message ID being evaluated */
  messageId?: string;
  /** Callback when assessment is complete */
  onAssessmentComplete?: (assessment: CriticalAssessment) => void;
  /** Callback to open MR11 for verification */
  onOpenMR11?: (content?: string) => void;
  /** Compact mode for floating panel */
  compact?: boolean;
}

export const MR12CriticalThinkingScaffolding: React.FC<MR12Props> = ({
  aiOutput = '',
  domain,
  sessionId,
  messageId,
  onAssessmentComplete,
  onOpenMR11,
  compact = true,
}) => {
  // Tab state: 'evaluate' or 'history'
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history'>('evaluate');

  // Auto-detect or use provided content type
  const [contentType, setContentType] = useState<ContentType>(() => {
    if (domain) return domain as ContentType;
    if (aiOutput) return detectContentType(aiOutput);
    return 'general';
  });

  // AI questions state
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [useAIQuestions, setUseAIQuestions] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Current question index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses
  const [responses, setResponses] = useState<UserResponse[]>([]);

  // Show feedback tip after selection
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResponse, setLastResponse] = useState<ResponseOption | null>(null);

  // Assessment complete
  const [assessment, setAssessment] = useState<ThinkingAssessment | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  // Get template questions as fallback
  const templateQuestions = useMemo(() => getQuestionsForType(contentType), [contentType]);

  // Questions to use (AI or template)
  const questions: ThinkingQuestion[] = useMemo(() => {
    if (useAIQuestions && aiQuestions.length > 0) {
      // Convert AI questions to ThinkingQuestion format
      return aiQuestions.map(q => ({
        id: q.id,
        question: q.question,
        description: q.description,
        options: {
          yes: { label: "Yes, I've verified this", tip: q.verificationTip || "Good job verifying!" },
          no: { label: "No, this seems wrong", tip: "Consider double-checking this claim." },
          unsure: { label: "I'm not sure", tip: "This might need more investigation." },
        },
        followUpTip: q.targetText ? `Referenced: "${q.targetText.slice(0, 100)}..."` : "Consider the context of this question.",
      }));
    }
    return templateQuestions;
  }, [useAIQuestions, aiQuestions, templateQuestions]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Content type info for display
  const typeInfo = getContentTypeInfo(contentType);

  /**
   * Fetch AI-generated questions
   */
  const fetchAIQuestions = useCallback(async () => {
    if (!aiOutput || aiOutput.length < 50) return;

    setIsLoadingQuestions(true);
    setAiError(null);

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      const response = await fetch(`${API_BASE}/ai/mr/thinking-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          content: aiOutput,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI questions');
      }

      const data = await response.json();
      if (data.success && data.data.questions) {
        setAiQuestions(data.data.questions);
        setUseAIQuestions(true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('[MR12] AI questions error:', error);
      setAiError(error.message);
      setUseAIQuestions(false);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [aiOutput, contentType]);

  // Fetch AI questions when content changes
  useEffect(() => {
    if (aiOutput && aiOutput.length >= 50) {
      fetchAIQuestions();
    }
  }, [aiOutput]);

  // Re-detect content type when aiOutput changes
  useEffect(() => {
    if (aiOutput && !domain) {
      const detected = detectContentType(aiOutput);
      setContentType(detected);
      // Reset state when content changes
      setCurrentIndex(0);
      setResponses([]);
      setAssessment(null);
      setRecordId(null);
    }
  }, [aiOutput, domain]);

  /**
   * Save thinking record to database
   */
  const saveRecord = useCallback(async (finalResponses: UserResponse[], needsVerification: boolean) => {
    setIsSaving(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      const response = await fetch(`${API_BASE}/thinking-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          sessionId,
          messageId,
          messageContent: aiOutput,
          contentType,
          aiQuestions: useAIQuestions ? aiQuestions : templateQuestions,
          userResponses: finalResponses,
          needsVerification,
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecordId(data.data.id);
        console.log('[MR12] Record saved:', data.data.id);
      }
    } catch (error) {
      console.error('[MR12] Failed to save record:', error);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, messageId, aiOutput, contentType, useAIQuestions, aiQuestions, templateQuestions]);

  /**
   * Handle user selecting an option
   */
  const handleSelectOption = useCallback((option: ResponseOption) => {
    if (!currentQuestion) return;

    const response: UserResponse = {
      questionId: currentQuestion.id,
      response: option,
      timestamp: Date.now(),
    };

    setResponses(prev => [...prev, response]);
    setLastResponse(option);
    setShowFeedback(true);
  }, [currentQuestion]);

  /**
   * Move to next question or complete assessment
   */
  const handleNext = useCallback(() => {
    setShowFeedback(false);
    setLastResponse(null);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete assessment
      const result = generateAssessment(contentType, responses);
      setAssessment(result);

      // Save to database
      saveRecord(responses, result.needsVerification);

      // Call legacy callback if provided
      if (onAssessmentComplete) {
        const legacyAssessment: CriticalAssessment = {
          score: result.needsVerification ? 0.5 : 1.0,
          level: result.needsVerification ? 'moderate' : 'strong',
          strengths: ['Systematic evaluation completed'],
          areasToConsider: result.needsVerification
            ? ['Some items need verification']
            : [],
          interpretation: result.summary,
        };
        onAssessmentComplete(legacyAssessment);
      }
    }
  }, [currentIndex, totalQuestions, contentType, responses, onAssessmentComplete, saveRecord]);

  /**
   * Skip current question
   */
  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;

    const response: UserResponse = {
      questionId: currentQuestion.id,
      response: 'skip',
      timestamp: Date.now(),
    };

    setResponses(prev => [...prev, response]);
    setShowFeedback(false);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const allResponses = [...responses, response];
      const result = generateAssessment(contentType, allResponses);
      setAssessment(result);
      saveRecord(allResponses, result.needsVerification);
    }
  }, [currentQuestion, currentIndex, totalQuestions, contentType, responses, saveRecord]);

  /**
   * Reset and start over
   */
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setResponses([]);
    setAssessment(null);
    setShowFeedback(false);
    setLastResponse(null);
    setRecordId(null);
  }, []);

  /**
   * Change content type manually
   */
  const handleChangeType = useCallback((type: ContentType) => {
    setContentType(type);
    setCurrentIndex(0);
    setResponses([]);
    setAssessment(null);
    // Refetch AI questions with new type
    if (useAIQuestions) {
      fetchAIQuestions();
    }
  }, [useAIQuestions, fetchAIQuestions]);

  /**
   * Toggle between AI and template questions
   */
  const handleToggleMode = useCallback(() => {
    setUseAIQuestions(prev => !prev);
    setCurrentIndex(0);
    setResponses([]);
    setAssessment(null);
  }, []);

  // Loading state
  if (isLoadingQuestions && activeTab === 'evaluate') {
    return (
      <div className={`mr12-container ${compact ? 'mr12-compact' : ''}`}>
        <div className="mr12-loading">
          <div className="mr12-loading-spinner" />
          <p>🧠 Analyzing content and generating targeted questions...</p>
        </div>
      </div>
    );
  }

  // History view
  if (activeTab === 'history') {
    return (
      <div className={`mr12-container ${compact ? 'mr12-compact' : ''}`}>
        {/* Tab Switcher */}
        <div className="mr12-tabs">
          <button
            className={`mr12-tab ${activeTab === 'evaluate' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluate')}
          >
            🧠 Evaluate
          </button>
          <button
            className={`mr12-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 History
          </button>
        </div>

        <ThinkingHistory sessionId={sessionId} compact={compact} />
      </div>
    );
  }

  // Render assessment summary
  if (assessment) {
    const issueCount = responses.filter(r => r.response === 'no').length;
    const unsureCount = responses.filter(r => r.response === 'unsure').length;

    return (
      <div className={`mr12-container ${compact ? 'mr12-compact' : ''}`}>
        <div className="mr12-assessment">
          <div className="mr12-assessment-header">
            <span className="mr12-assessment-icon">
              {assessment.needsVerification ? '⚠️' : '✅'}
            </span>
            <h2 className="mr12-assessment-title">
              {assessment.needsVerification ? 'Needs Attention' : 'Looks Good'}
            </h2>
          </div>

          <p className="mr12-assessment-summary">{assessment.summary}</p>

          {/* Response summary */}
          <div className="mr12-response-summary">
            {responses.map((r, idx) => {
              const q = questions.find(q => q.id === r.questionId);
              if (!q || r.response === 'skip') return null;
              return (
                <div
                  key={r.questionId}
                  className={`mr12-response-item mr12-response-${r.response}`}
                >
                  <span className="mr12-response-icon">
                    {r.response === 'yes' ? '✓' : r.response === 'no' ? '✗' : '?'}
                  </span>
                  <span className="mr12-response-text">{q.question}</span>
                </div>
              );
            })}
          </div>

          {/* Saved indicator */}
          {recordId && (
            <div className="mr12-saved-indicator">
              ✓ Thinking record saved
            </div>
          )}

          {/* Actions */}
          <div className="mr12-assessment-actions">
            {assessment.needsVerification && onOpenMR11 && (
              <button
                className="mr12-btn mr12-btn-primary"
                onClick={() => onOpenMR11(aiOutput)}
              >
                🔍 Verify with MR11
              </button>
            )}
            <button className="mr12-btn mr12-btn-secondary" onClick={handleReset}>
              ↺ Evaluate Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render main evaluation flow
  return (
    <div className={`mr12-container ${compact ? 'mr12-compact' : ''}`}>
      {/* Tab Switcher */}
      <div className="mr12-tabs">
        <button
          className={`mr12-tab ${activeTab === 'evaluate' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluate')}
        >
          🧠 Evaluate
        </button>
        <button
          className={`mr12-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 History
        </button>
      </div>

      {/* Content Preview - Selected AI Response */}
      {aiOutput && (
        <div className="mr12-content-preview">
          <div className="mr12-preview-header">
            <div className="mr12-preview-title">
              <span className="mr12-preview-label">Selected Response</span>
              <span className="mr12-type-badge" style={{ background: typeInfo.color }}>
                {typeInfo.icon} {typeInfo.label}
              </span>
            </div>
            <div className="mr12-header-actions">
              <button
                className={`mr12-mode-btn ${useAIQuestions ? 'active' : ''}`}
                onClick={handleToggleMode}
                title={useAIQuestions ? "Using AI questions" : "Using template questions"}
              >
                {useAIQuestions ? '🤖 AI' : '📋 Template'}
              </button>
              <button
                className="mr12-change-type-btn"
                onClick={() => {
                  const types: ContentType[] = ['code', 'math', 'writing', 'design', 'general'];
                  const idx = types.indexOf(contentType);
                  handleChangeType(types[(idx + 1) % types.length]);
                }}
                title="Change content type"
              >
                Change
              </button>
            </div>
          </div>
          <div className="mr12-preview-content">
            {aiOutput.slice(0, 300)}
            {aiOutput.length > 300 && '...'}
          </div>
        </div>
      )}

      {/* AI Error notice */}
      {aiError && !useAIQuestions && (
        <div className="mr12-ai-notice">
          ℹ️ Using template questions (AI unavailable)
        </div>
      )}

      {/* Progress */}
      <div className="mr12-progress">
        <div className="mr12-progress-bar">
          <div
            className="mr12-progress-fill"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="mr12-progress-text">
          Question {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="mr12-question-card">
          <h3 className="mr12-question-text">{currentQuestion.question}</h3>
          <p className="mr12-question-desc">{currentQuestion.description}</p>

          {/* Options */}
          {!showFeedback && (
            <div className="mr12-options">
              <button
                className="mr12-option mr12-option-yes"
                onClick={() => handleSelectOption('yes')}
              >
                <span className="mr12-option-icon">✓</span>
                <span className="mr12-option-label">{currentQuestion.options.yes.label}</span>
              </button>
              <button
                className="mr12-option mr12-option-unsure"
                onClick={() => handleSelectOption('unsure')}
              >
                <span className="mr12-option-icon">?</span>
                <span className="mr12-option-label">{currentQuestion.options.unsure.label}</span>
              </button>
              <button
                className="mr12-option mr12-option-no"
                onClick={() => handleSelectOption('no')}
              >
                <span className="mr12-option-icon">✗</span>
                <span className="mr12-option-label">{currentQuestion.options.no.label}</span>
              </button>
            </div>
          )}

          {/* Feedback after selection */}
          {showFeedback && lastResponse && (
            <div className={`mr12-feedback mr12-feedback-${lastResponse}`}>
              <div className="mr12-feedback-tip">
                💡 {currentQuestion.options[lastResponse as 'yes' | 'no' | 'unsure'].tip}
              </div>
              <div className="mr12-feedback-followup">
                📌 {currentQuestion.followUpTip}
              </div>
              <button className="mr12-btn mr12-btn-next" onClick={handleNext}>
                {currentIndex < totalQuestions - 1 ? 'Next →' : 'Complete'}
              </button>
            </div>
          )}

          {/* Skip option */}
          {!showFeedback && (
            <button className="mr12-skip-btn" onClick={handleSkip}>
              Skip this question
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MR12CriticalThinkingScaffolding;
