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
  /** Allow manual input mode (for sidebar usage) */
  allowManualInput?: boolean;
}

export const MR12CriticalThinkingScaffolding: React.FC<MR12Props> = ({
  aiOutput = '',
  domain,
  sessionId,
  messageId,
  onAssessmentComplete,
  onOpenMR11,
  compact = true,
  allowManualInput = false,
}) => {
  // Tab state: 'evaluate' or 'history'
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history'>('evaluate');

  // Manual input mode state
  const [manualInput, setManualInput] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [activeContent, setActiveContent] = useState(aiOutput);

  // Determine if we should show manual input UI
  const showManualInputUI = allowManualInput && !aiOutput && !isManualMode;

  // Content preview expanded state
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // Existing record state (loaded from DB if messageId has a record)
  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [hasCheckedExisting, setHasCheckedExisting] = useState(false);

  // Sync activeContent when aiOutput changes
  useEffect(() => {
    if (aiOutput) {
      setActiveContent(aiOutput);
      setIsManualMode(false);
    }
  }, [aiOutput]);

  // Auto-detect or use provided content type
  const [contentType, setContentType] = useState<ContentType>(() => {
    if (domain) return domain as ContentType;
    if (activeContent) return detectContentType(activeContent);
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
   * Check for existing thinking record for this messageId
   */
  const checkExistingRecord = useCallback(async () => {
    if (!messageId) {
      setHasCheckedExisting(true);
      return null;
    }

    setIsLoadingExisting(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state?.token : null;
      const response = await fetch(`${API_BASE}/thinking-records?messageId=${messageId}&limit=1`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const record = data.data[0];
          setExistingRecord(record);
          console.log('[MR12] Found existing record:', record.id);
          return record;
        }
      }
    } catch (error) {
      console.error('[MR12] Error checking existing record:', error);
    } finally {
      setIsLoadingExisting(false);
      setHasCheckedExisting(true);
    }
    return null;
  }, [messageId]);

  /**
   * Fetch AI-generated questions
   */
  const fetchAIQuestions = useCallback(async () => {
    if (!activeContent || activeContent.length < 50) return;

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
          content: activeContent,
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
  }, [activeContent, contentType]);

  // Check for existing record first, then fetch AI questions if none exists
  // This runs when aiOutput changes (auto mode from chat)
  useEffect(() => {
    const init = async () => {
      if (!aiOutput || aiOutput.length < 50) return;

      // First check if there's an existing record for this message
      const existing = await checkExistingRecord();

      // Only fetch new questions if no existing record
      if (!existing) {
        fetchAIQuestions();
      }
    };

    // Reset state when messageId changes
    setExistingRecord(null);
    setHasCheckedExisting(false);
    setAssessment(null);
    setCurrentIndex(0);
    setResponses([]);
    setRecordId(null);

    init();
  }, [aiOutput, messageId]);

  /**
   * Handler for starting manual input analysis
   */
  const handleStartManualAnalysis = useCallback(() => {
    if (!manualInput || manualInput.length < 20) return;

    // Set the active content and switch to manual mode
    setActiveContent(manualInput);
    setIsManualMode(true);

    // Reset state for new analysis
    setExistingRecord(null);
    setHasCheckedExisting(true); // Skip existing record check for manual input
    setAssessment(null);
    setCurrentIndex(0);
    setResponses([]);
    setRecordId(null);
    setAiQuestions([]);
  }, [manualInput]);

  // Fetch AI questions when entering manual mode
  useEffect(() => {
    if (isManualMode && activeContent && activeContent.length >= 50) {
      // Re-detect content type for manual input
      const detected = detectContentType(activeContent);
      setContentType(detected);
      // Fetch questions
      fetchAIQuestions();
    }
  }, [isManualMode, activeContent]);

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
          messageId: isManualMode ? undefined : messageId, // No messageId for manual input
          messageContent: activeContent, // Use activeContent to support both auto and manual mode
          contentType,
          aiQuestions: useAIQuestions ? aiQuestions : templateQuestions,
          userResponses: finalResponses,
          needsVerification,
          completedAt: new Date().toISOString(),
          isManualInput: isManualMode, // Flag to indicate manual input
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
  }, [sessionId, messageId, activeContent, contentType, useAIQuestions, aiQuestions, templateQuestions, isManualMode]);

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

  // Expanded item in existing record view
  const [expandedRecordItem, setExpandedRecordItem] = useState<string | null>(null);

  /**
   * Start new evaluation (clear existing record)
   */
  const handleStartNew = useCallback(() => {
    setExistingRecord(null);
    setAssessment(null);
    setCurrentIndex(0);
    setResponses([]);
    setRecordId(null);
    fetchAIQuestions();
  }, [fetchAIQuestions]);

  // Loading state
  if ((isLoadingQuestions || isLoadingExisting) && activeTab === 'evaluate') {
    return (
      <div className={`mr12-container ${compact ? 'mr12-compact' : ''}`}>
        <div className="mr12-loading">
          <div className="mr12-loading-spinner" />
          <p>{isLoadingExisting ? '🔍 Checking for existing evaluation...' : '🧠 Analyzing content and generating targeted questions...'}</p>
        </div>
      </div>
    );
  }

  // Show existing record view
  if (existingRecord && activeTab === 'evaluate') {
    const recordResponses = existingRecord.user_responses || [];
    const recordQuestions = existingRecord.ai_questions || [];
    const needsVerification = existingRecord.needs_verification;
    const createdAt = new Date(existingRecord.created_at);

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

        <div className="mr12-existing-record">
          <div className="mr12-existing-header">
            <span className="mr12-existing-icon">📝</span>
            <div className="mr12-existing-info">
              <h3>Previous Evaluation</h3>
              <span className="mr12-existing-time">
                {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
              </span>
            </div>
            <span className={`mr12-existing-badge ${needsVerification ? 'warning' : 'success'}`}>
              {needsVerification ? '⚠️ Needs Attention' : '✅ Verified'}
            </span>
          </div>

          {/* Show responses */}
          <div className="mr12-response-summary">
            {recordResponses.map((r: any, idx: number) => {
              const q = recordQuestions.find((q: any) => q.id === r.questionId);
              if (!q || r.response === 'skip') return null;
              const isExpanded = expandedRecordItem === r.questionId;
              return (
                <div
                  key={r.questionId}
                  className={`mr12-response-item mr12-response-${r.response} ${isExpanded ? 'expanded' : ''}`}
                >
                  <div
                    className="mr12-response-header"
                    onClick={() => setExpandedRecordItem(isExpanded ? null : r.questionId)}
                  >
                    <span className="mr12-response-icon">
                      {r.response === 'yes' ? '✓' : r.response === 'no' ? '✗' : '?'}
                    </span>
                    <span className="mr12-response-text">{q.question}</span>
                    <span className="mr12-response-arrow">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                  {isExpanded && (
                    <div className="mr12-response-details">
                      {q.description && (
                        <p className="mr12-response-desc">{q.description}</p>
                      )}
                      {q.verificationTip && (
                        <p className="mr12-response-tip">💡 {q.verificationTip}</p>
                      )}
                      {q.targetText && (
                        <p className="mr12-response-target">📌 "{q.targetText.slice(0, 150)}..."</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mr12-assessment-actions">
            {needsVerification && onOpenMR11 && (
              <button
                className="mr12-btn mr12-btn-primary"
                onClick={() => onOpenMR11(aiOutput)}
              >
                🔍 Verify with MR11
              </button>
            )}
            <button className="mr12-btn mr12-btn-secondary" onClick={handleStartNew}>
              🔄 Start New Evaluation
            </button>
          </div>
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

      {/* Manual Input Mode - Show when no aiOutput and allowManualInput is true */}
      {showManualInputUI && (
        <div className="mr12-manual-input">
          <div className="mr12-manual-header">
            <span className="mr12-manual-icon">✍️</span>
            <h3>Enter Content to Analyze</h3>
          </div>
          <p className="mr12-manual-desc">
            Paste or type any AI-generated content you'd like to critically evaluate.
          </p>
          <textarea
            className="mr12-manual-textarea"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste the AI response here... (minimum 20 characters)"
            rows={6}
          />
          <div className="mr12-manual-footer">
            <span className="mr12-manual-count">
              {manualInput.length} characters {manualInput.length < 20 && '(min 20)'}
            </span>
            <button
              className="mr12-btn mr12-btn-primary"
              onClick={handleStartManualAnalysis}
              disabled={manualInput.length < 20}
            >
              🧠 Start Critical Thinking
            </button>
          </div>
        </div>
      )}

      {/* Manual Mode Content Preview */}
      {isManualMode && activeContent && (
        <div className="mr12-content-preview mr12-manual-preview">
          <div className="mr12-preview-header">
            <div className="mr12-preview-title">
              <span className="mr12-preview-label">Your Input</span>
              <span className="mr12-type-badge" style={{ background: typeInfo.color }}>
                {typeInfo.icon} {typeInfo.label}
              </span>
            </div>
            <button
              className="mr12-btn-text"
              onClick={() => {
                setIsManualMode(false);
                setActiveContent('');
                setManualInput('');
                setAiQuestions([]);
              }}
            >
              ← Change Input
            </button>
          </div>
          <div className={`mr12-preview-content ${isContentExpanded ? 'expanded' : ''}`}>
            {isContentExpanded ? activeContent : activeContent.slice(0, 300)}
            {!isContentExpanded && activeContent.length > 300 && '...'}
          </div>
          {activeContent.length > 300 && (
            <button
              className="mr12-expand-btn"
              onClick={() => setIsContentExpanded(!isContentExpanded)}
            >
              {isContentExpanded ? '▲ Show less' : '▼ Show full content'}
            </button>
          )}
        </div>
      )}

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
          <div className={`mr12-preview-content ${isContentExpanded ? 'expanded' : ''}`}>
            {isContentExpanded ? aiOutput : aiOutput.slice(0, 300)}
            {!isContentExpanded && aiOutput.length > 300 && '...'}
          </div>
          {aiOutput.length > 300 && (
            <button
              className="mr12-expand-btn"
              onClick={() => setIsContentExpanded(!isContentExpanded)}
            >
              {isContentExpanded ? '▲ Show less' : '▼ Show full content'}
            </button>
          )}
        </div>
      )}

      {/* AI Error notice */}
      {aiError && !useAIQuestions && !showManualInputUI && (
        <div className="mr12-ai-notice">
          ℹ️ Using template questions (AI unavailable)
        </div>
      )}

      {/* Progress - only show when we have content to analyze */}
      {(aiOutput || isManualMode) && (
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
      )}

      {/* Current Question - only show when we have content to analyze */}
      {currentQuestion && (aiOutput || isManualMode) && (
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
