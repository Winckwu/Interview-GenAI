/**
 * MR12: Critical Thinking Scaffolding - React Component
 *
 * Provides Socratic questions and domain-specific checklists to guide
 * users through systematic critical evaluation of AI outputs.
 *
 * Design Rationale (49% of users - 24/49):
 * - I001: "Compare line by line" - method good but lacks guidance
 * - I016: "Safety check" - knows to verify but unsure how systematically
 * - I017 (Lawyer): Needs critical evaluation but method unclear
 */

import React, { useState, useCallback } from 'react';
import {
  generateCriticalQuestions,
  getDomainChecklist,
  assessCriticalThinking,
  CriticalAssessment,
  DomainType,
} from './utils';
import './styles.css';

interface MR12Props {
  aiOutput?: string;
  domain?: DomainType;
  onAssessmentComplete?: (assessment: CriticalAssessment) => void;
  scaffoldingLevel?: 'high' | 'medium' | 'low';
}

export const MR12CriticalThinkingScaffolding: React.FC<MR12Props> = ({
  aiOutput = '',
  domain = 'general',
  onAssessmentComplete,
  scaffoldingLevel = 'high',
}) => {
  const [showChecklist, setShowChecklist] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<CriticalAssessment | null>(null);

  const questions = generateCriticalQuestions(domain);
  const checklist = getDomainChecklist(domain);

  const handleResponseChange = useCallback(
    (questionId: string, response: string) => {
      setResponses(prev => ({ ...prev, [questionId]: response }));
    },
    []
  );

  const handleCompleteAssessment = useCallback(() => {
    const result = assessCriticalThinking(domain, responses);
    setAssessment(result);
    onAssessmentComplete?.(result);
  }, [domain, responses, onAssessmentComplete]);

  return (
    <div className="mr12-container">
      <div className="mr12-header">
        <h1 className="mr12-title">Critical Thinking Scaffolding</h1>
        <p className="mr12-subtitle">Systematically evaluate AI outputs using Socratic questions</p>
      </div>

      <div className="mr12-layout">
        {/* Questions Section */}
        <div className="mr12-questions-section">
          <h2 className="mr12-section-title">Critical Evaluation Questions</h2>

          <div className="mr12-questions-list">
            {questions.map((q, idx) => (
              <div key={q.id} className="mr12-question-item">
                <div className="mr12-question-number">{idx + 1}</div>
                <div className="mr12-question-content">
                  <h3 className="mr12-question-text">{q.question}</h3>
                  <p className="mr12-question-hint">{q.hint}</p>

                  <textarea
                    className="mr12-response-textarea"
                    placeholder="Your response..."
                    value={responses[q.id] || ''}
                    onChange={e => handleResponseChange(q.id, e.target.value)}
                    rows={3}
                  />

                  {scaffoldingLevel !== 'low' && (
                    <div className="mr12-guidance">
                      <span className="mr12-guidance-icon">💡</span>
                      <span className="mr12-guidance-text">{q.guidance}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist Section */}
        <div className="mr12-checklist-section">
          <button
            className="mr12-toggle-checklist"
            onClick={() => setShowChecklist(!showChecklist)}
          >
            {showChecklist ? '▼' : '▶'} Domain-Specific Checklist: {domain}
          </button>

          {showChecklist && (
            <div className="mr12-checklist-content">
              <div className="mr12-checklist-items">
                {checklist.map((item, idx) => (
                  <label key={idx} className="mr12-checklist-item">
                    <input type="checkbox" />
                    <span className="mr12-checklist-text">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button className="mr12-assess-btn" onClick={handleCompleteAssessment}>
            Complete Assessment
          </button>
        </div>

        {/* Results Section */}
        {assessment && (
          <div className="mr12-assessment-results">
            <h2 className="mr12-results-title">Assessment Results</h2>

            <div className={`mr12-critical-score mr12-score-${assessment.level}`}>
              <div className="mr12-score-number">{(assessment.score * 100).toFixed(0)}%</div>
              <div className="mr12-score-level">{assessment.level.toUpperCase()}</div>
            </div>

            <div className="mr12-strengths-gaps">
              <div className="mr12-strengths">
                <h3>Strengths</h3>
                <ul>
                  {assessment.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="mr12-areas">
                <h3>Consider</h3>
                <ul>
                  {assessment.areasToConsider.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mr12-interpretation">{assessment.interpretation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MR12CriticalThinkingScaffolding;
