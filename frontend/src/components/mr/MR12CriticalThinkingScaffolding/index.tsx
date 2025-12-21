/**
 * MR12: Critical Thinking Scaffolding - Guided Flow
 *
 * New design: One question at a time with content-type specific questions
 * - Shows AI content being evaluated
 * - Auto-detects content type (code, math, writing, design, general)
 * - Asks one question at a time
 * - Provides meaningful choice options with tips
 * - Gives instant feedback after selection
 * - Can link to MR11 for deeper verification
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
import './styles.css';

interface MR12Props {
  /** AI output content to evaluate */
  aiOutput?: string;
  /** Content type (auto-detected if not provided) */
  domain?: DomainType;
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
  onAssessmentComplete,
  onOpenMR11,
  compact = true,
}) => {
  // Auto-detect or use provided content type
  const [contentType, setContentType] = useState<ContentType>(() => {
    if (domain) return domain as ContentType;
    if (aiOutput) return detectContentType(aiOutput);
    return 'general';
  });

  // Current question index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses
  const [responses, setResponses] = useState<UserResponse[]>([]);

  // Show feedback tip after selection
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResponse, setLastResponse] = useState<ResponseOption | null>(null);

  // Assessment complete
  const [assessment, setAssessment] = useState<ThinkingAssessment | null>(null);

  // Get questions for current content type
  const questions = useMemo(() => getQuestionsForType(contentType), [contentType]);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Content type info for display
  const typeInfo = getContentTypeInfo(contentType);

  // Re-detect content type when aiOutput changes
  useEffect(() => {
    if (aiOutput && !domain) {
      const detected = detectContentType(aiOutput);
      setContentType(detected);
      // Reset state when content changes
      setCurrentIndex(0);
      setResponses([]);
      setAssessment(null);
    }
  }, [aiOutput, domain]);

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
  }, [currentIndex, totalQuestions, contentType, responses, onAssessmentComplete]);

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
      const result = generateAssessment(contentType, [...responses, response]);
      setAssessment(result);
    }
  }, [currentQuestion, currentIndex, totalQuestions, contentType, responses]);

  /**
   * Reset and start over
   */
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setResponses([]);
    setAssessment(null);
    setShowFeedback(false);
    setLastResponse(null);
  }, []);

  /**
   * Change content type manually
   */
  const handleChangeType = useCallback((type: ContentType) => {
    setContentType(type);
    setCurrentIndex(0);
    setResponses([]);
    setAssessment(null);
  }, []);

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
      {/* Content Preview (collapsible) */}
      {aiOutput && (
        <div className="mr12-content-preview">
          <div className="mr12-preview-header">
            <span className="mr12-type-badge" style={{ background: typeInfo.color }}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            <button
              className="mr12-change-type-btn"
              onClick={() => {
                // Cycle through types
                const types: ContentType[] = ['code', 'math', 'writing', 'design', 'general'];
                const idx = types.indexOf(contentType);
                handleChangeType(types[(idx + 1) % types.length]);
              }}
              title="Change content type"
            >
              Change
            </button>
          </div>
          <div className="mr12-preview-content">
            {aiOutput.slice(0, 150)}
            {aiOutput.length > 150 && '...'}
          </div>
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
