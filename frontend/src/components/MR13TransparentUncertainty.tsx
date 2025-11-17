/**
 * MR13: Transparent Uncertainty Display
 *
 * Explicitly communicate AI confidence and knowledge boundaries.
 * Address the universal user frustration (98%) with AI "pretending to be certain".
 *
 * User Evidence: 48/49 users (98%) - "AI pretending to be confident"
 *
 * Key Features:
 * 1. Overall Confidence Indicator: Visual bar chart of confidence level
 * 2. Sentence-Level Confidence: Color-coded sentences with inline confidence
 * 3. Uncertainty Explanations: Why the AI is uncertain about specific statements
 * 4. Knowledge Boundaries: Mark outdated/specialized/uncertain knowledge
 * 5. Source Attribution: Training data vs reasoning vs retrieval
 * 6. Verification Strategies: Concrete steps to verify uncertain claims
 * 7. Disclaimer Warnings: Critical disclaimers for sensitive topics
 * 8. History Tracking: Record verification outcomes to build calibrated confidence
 *
 * Design Principle:
 * - Transparency over false confidence
 * - Help users understand what AI knows and doesn't know
 * - Enable informed verification decisions
 * - Build calibrated trust through outcome tracking
 */

import React, { useState, useCallback } from 'react';
import {
  OutputUncertainty,
  SentenceConfidence,
  ConfidenceHistory,
  analyzeUncertainty,
  createConfidenceHistory,
  recordVerification,
  getConfidenceBar,
  getConfidenceColor,
  getUncertaintyExplanation,
  getKnowledgeBoundaryDescription
} from './MR13TransparentUncertainty.utils';
import './MR13TransparentUncertainty.css';

interface MR13Props {
  onAnalysisComplete?: (uncertainty: OutputUncertainty) => void;
  existingHistory?: ConfidenceHistory[];
}

type TabType = 'analyze' | 'display' | 'history' | 'guidelines';

const MR13TransparentUncertainty: React.FC<MR13Props> = ({
  onAnalysisComplete,
  existingHistory = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('analyze');
  const [history, setHistory] = useState<ConfidenceHistory[]>(existingHistory);

  // Analyze form states
  const [aiResponse, setAiResponse] = useState('');
  const [topic, setTopic] = useState('general');
  const [uncertainty, setUncertainty] = useState<OutputUncertainty | null>(null);

  // Display states
  const [expandedSentence, setExpandedSentence] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<
    Record<string, boolean>
  >({});

  /**
   * Analyze response for uncertainty
   */
  const handleAnalyze = useCallback(() => {
    if (!aiResponse.trim()) {
      alert('Please provide AI response to analyze');
      return;
    }

    const result = analyzeUncertainty(aiResponse, topic);
    setUncertainty(result);
    setVerificationFeedback({});
  }, [aiResponse, topic]);

  /**
   * Submit analysis to history
   */
  const handleSubmitAnalysis = useCallback(() => {
    if (!uncertainty) return;

    const historyEntry = createConfidenceHistory('', aiResponse, uncertainty);
    setHistory([...history, historyEntry]);
    onAnalysisComplete?.(uncertainty);

    // Reset
    setAiResponse('');
    setTopic('general');
    setUncertainty(null);
    setActiveTab('history');
  }, [uncertainty, aiResponse, history, onAnalysisComplete]);

  /**
   * Record verification feedback
   */
  const handleRecordFeedback = useCallback(
    (sentenceId: string, wasCorrect: boolean) => {
      setVerificationFeedback({
        ...verificationFeedback,
        [sentenceId]: wasCorrect
      });
    },
    [verificationFeedback]
  );

  const stats = {
    totalAnalyzed: history.length,
    avgConfidence: history.length > 0
      ? (history.reduce((sum, h) => sum + h.uncertainty.overallConfidence, 0) /
        history.length)
      : 0,
    highConfidenceCount: history.filter(h => h.uncertainty.overallLevel === 'high')
      .length,
    lowConfidenceCount: history.filter(h => h.uncertainty.overallLevel === 'low')
      .length
  };

  return (
    <div className="mr13-container">
      {/* Header */}
      <div className="mr13-header">
        <h1 className="mr13-title">Transparent Uncertainty Display</h1>
        <p className="mr13-subtitle">
          Understand AI confidence, knowledge boundaries, and what requires verification
        </p>
      </div>

      {/* Tabs */}
      <div className="mr13-tabs">
        <button
          className={`mr13-tab ${activeTab === 'analyze' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyze')}
        >
          Analyze Response
        </button>
        <button
          className={`mr13-tab ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
          disabled={!uncertainty}
        >
          View Analysis
        </button>
        <button
          className={`mr13-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({history.length})
        </button>
        <button
          className={`mr13-tab ${activeTab === 'guidelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('guidelines')}
        >
          Guidelines
        </button>
      </div>

      {/* Content */}
      <div className="mr13-content">
        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="mr13-analyze">
            <div className="mr13-form">
              <div className="mr13-form-group">
                <label className="mr13-label">
                  Paste AI response to analyze uncertainty
                </label>
                <textarea
                  className="mr13-textarea"
                  placeholder="Paste the AI response here..."
                  rows={8}
                  value={aiResponse}
                  onChange={e => setAiResponse(e.target.value)}
                />
              </div>

              <div className="mr13-form-group">
                <label className="mr13-label">Topic/Domain (optional)</label>
                <select
                  className="mr13-select"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="code">Code/Programming</option>
                  <option value="math">Math/Calculation</option>
                  <option value="medical">Medical/Health</option>
                  <option value="legal">Legal</option>
                  <option value="finance">Finance/Investment</option>
                  <option value="science">Science/Research</option>
                  <option value="history">History/Facts</option>
                </select>
              </div>

              <button className="mr13-analyze-btn" onClick={handleAnalyze}>
                🔍 Analyze Uncertainty
              </button>
            </div>

            {/* Quick Tips */}
            <div className="mr13-tips">
              <h3>Why This Matters</h3>
              <ul>
                <li>
                  <strong>98% of users</strong> are frustrated when AI acts confident
                  about uncertain topics
                </li>
                <li>
                  Understanding <strong>where AI is uncertain</strong> helps you
                  verify strategically
                </li>
                <li>
                  Different sentences have <strong>different confidence levels</strong>
                </li>
                <li>
                  Knowledge cutoff and domain complexity directly impact reliability
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === 'display' && uncertainty && (
          <div className="mr13-display">
            {/* Overall Confidence */}
            <div className="mr13-overall">
              <h3>Overall Confidence Analysis</h3>

              {/* Confidence Bar */}
              <div className="mr13-confidence-summary">
                <div className="mr13-confidence-visual">
                  <div className="mr13-bar-label">Confidence Level</div>
                  <div className="mr13-bar-display">
                    <div
                      className="mr13-bar-fill"
                      style={{
                        width: `${uncertainty.overallConfidence * 100}%`,
                        backgroundColor: getConfidenceColor(
                          uncertainty.overallLevel
                        )
                      }}
                    />
                  </div>
                  <div className="mr13-confidence-value">
                    {Math.round(uncertainty.overallConfidence * 100)}%
                  </div>
                </div>

                <div className="mr13-confidence-level">
                  <span
                    className={`mr13-level-badge ${uncertainty.overallLevel}`}
                  >
                    {uncertainty.overallLevel === 'high' && '✅ High Confidence'}
                    {uncertainty.overallLevel === 'medium' && '⚠️ Medium Confidence'}
                    {uncertainty.overallLevel === 'low' && '❌ Low Confidence'}
                  </span>
                </div>
              </div>

              {/* Knowledge Cutoff */}
              <div className="mr13-cutoff-info">
                <strong>📅 Knowledge Cutoff:</strong> {uncertainty.knowledgeCutoff}
              </div>

              {/* Key Uncertainties */}
              {uncertainty.keyUncertainties.length > 0 && (
                <div className="mr13-key-uncertainties">
                  <h4>🎯 Key Uncertainties</h4>
                  <ul>
                    {uncertainty.keyUncertainties.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimers */}
              {uncertainty.disclaimers.length > 0 && (
                <div className="mr13-disclaimers">
                  <h4>⚠️ Important Disclaimers</h4>
                  <div className="mr13-disclaimer-list">
                    {uncertainty.disclaimers.map((disclaimer, idx) => (
                      <div key={idx} className="mr13-disclaimer-item">
                        {disclaimer}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sentence-Level Analysis */}
            <div className="mr13-sentences">
              <h3>Sentence-Level Confidence Analysis</h3>
              <p className="mr13-hint">
                Click on any sentence to see why the AI is uncertain
              </p>

              <div className="mr13-sentences-list">
                {uncertainty.sentences.map((sentence, idx) => (
                  <div
                    key={sentence.id}
                    className={`mr13-sentence-card ${
                      expandedSentence === sentence.id ? 'expanded' : ''
                    }`}
                  >
                    <div
                      className="mr13-sentence-header"
                      onClick={() =>
                        setExpandedSentence(
                          expandedSentence === sentence.id ? null : sentence.id
                        )
                      }
                    >
                      {/* Confidence Indicator */}
                      <div className="mr13-sentence-confidence">
                        <span
                          className={`mr13-confidence-badge ${
                            sentence.level
                          }`}
                        >
                          {sentence.level === 'high' && '✅'}
                          {sentence.level === 'medium' && '⚠️'}
                          {sentence.level === 'low' && '❌'}
                        </span>
                        <span className="mr13-bar">
                          {getConfidenceBar(sentence.confidence)}
                        </span>
                        <span className="mr13-percent">
                          {Math.round(sentence.confidence * 100)}%
                        </span>
                      </div>

                      {/* Sentence Text */}
                      <p className="mr13-sentence-text">{sentence.text}</p>
                    </div>

                    {/* Detailed Analysis (when expanded) */}
                    {expandedSentence === sentence.id && (
                      <div className="mr13-sentence-details">
                        {/* Uncertainty Reasons */}
                        {sentence.reasons.length > 0 && (
                          <div className="mr13-detail-section">
                            <h5>Why uncertain:</h5>
                            <ul className="mr13-reasons-list">
                              {getUncertaintyExplanation(sentence).map(
                                (explanation, idx) => (
                                  <li key={idx}>{explanation}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Knowledge Boundary */}
                        <div className="mr13-detail-section">
                          <h5>Knowledge Boundary:</h5>
                          <p>
                            {getKnowledgeBoundaryDescription(
                              sentence.knowledgeBoundary
                            )}
                          </p>
                        </div>

                        {/* Source Type */}
                        <div className="mr13-detail-section">
                          <h5>Information Source:</h5>
                          <p>
                            {sentence.sourceType === 'training-data' &&
                              'From training data (may not be current)'}
                            {sentence.sourceType === 'reasoning' &&
                              'Derived through inference (less certain)'}
                            {sentence.sourceType === 'retrieval' &&
                              'Retrieved from external sources'}
                            {sentence.sourceType === 'unknown' &&
                              'Source unclear'}
                          </p>
                        </div>

                        {/* Verification Feedback */}
                        {sentence.requiresVerification && (
                          <div className="mr13-detail-section verification">
                            <h5>Have you verified this?</h5>
                            <div className="mr13-feedback-buttons">
                              <button
                                className={`mr13-feedback-btn ${
                                  verificationFeedback[sentence.id] === true
                                    ? 'correct'
                                    : ''
                                }`}
                                onClick={() =>
                                  handleRecordFeedback(sentence.id, true)
                                }
                              >
                                ✅ Was Correct
                              </button>
                              <button
                                className={`mr13-feedback-btn ${
                                  verificationFeedback[sentence.id] === false
                                    ? 'incorrect'
                                    : ''
                                }`}
                                onClick={() =>
                                  handleRecordFeedback(sentence.id, false)
                                }
                              >
                                ❌ Was Incorrect
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Strategies */}
            {uncertainty.verificationStrategies.length > 0 && (
              <div className="mr13-strategies">
                <h3>🔍 Suggested Verification Strategies</h3>
                <ol className="mr13-strategies-list">
                  {uncertainty.verificationStrategies.map((strategy, idx) => (
                    <li key={idx}>{strategy}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Expert Consultation Notice */}
            {uncertainty.expertConsultationNeeded && (
              <div className="mr13-expert-notice">
                <h3>⚠️ Expert Consultation Recommended</h3>
                <p>
                  Overall confidence is below 50%. Consider consulting with a domain
                  expert before making important decisions based on this response.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              className="mr13-submit-btn"
              onClick={handleSubmitAnalysis}
            >
              Save to History
            </button>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="mr13-history">
            {/* Statistics */}
            <div className="mr13-history-stats">
              <div className="mr13-stat-card">
                <div className="mr13-stat-label">Analyses Tracked</div>
                <div className="mr13-stat-value">{stats.totalAnalyzed}</div>
              </div>

              <div className="mr13-stat-card">
                <div className="mr13-stat-label">Average Confidence</div>
                <div className="mr13-stat-value">
                  {Math.round(stats.avgConfidence * 100)}%
                </div>
              </div>

              <div className="mr13-stat-card">
                <div className="mr13-stat-label">High Confidence</div>
                <div className="mr13-stat-value">{stats.highConfidenceCount}</div>
              </div>

              <div className="mr13-stat-card">
                <div className="mr13-stat-label">Low Confidence</div>
                <div className="mr13-stat-value">{stats.lowConfidenceCount}</div>
              </div>
            </div>

            {/* History List */}
            {history.length === 0 ? (
              <div className="mr13-empty-state">
                <p>No analyses in history yet. Start by analyzing an AI response.</p>
              </div>
            ) : (
              <div className="mr13-history-list">
                {history.map((entry, idx) => (
                  <div key={idx} className="mr13-history-card">
                    <div className="mr13-history-header">
                      <div className="mr13-history-date">
                        {entry.timestamp.toLocaleString()}
                      </div>
                      <div
                        className={`mr13-history-level ${
                          entry.uncertainty.overallLevel
                        }`}
                      >
                        {entry.uncertainty.overallLevel === 'high' &&
                          '✅ High'}
                        {entry.uncertainty.overallLevel === 'medium' &&
                          '⚠️ Medium'}
                        {entry.uncertainty.overallLevel === 'low' && '❌ Low'}
                      </div>
                    </div>

                    <div className="mr13-history-response">
                      <p className="mr13-response-preview">
                        {entry.response.substring(0, 150)}...
                      </p>
                    </div>

                    <div className="mr13-history-metrics">
                      <span>
                        Confidence: {Math.round(entry.uncertainty.overallConfidence * 100)}%
                      </span>
                      <span>
                        Uncertainties: {entry.uncertainty.keyUncertainties.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guidelines Tab */}
        {activeTab === 'guidelines' && (
          <div className="mr13-guidelines">
            <div className="mr13-guideline-section">
              <h3>Understanding Confidence Levels</h3>

              <div className="mr13-level-explanation">
                <div className="mr13-level-card high">
                  <h4>🟢 High Confidence (75-100%)</h4>
                  <p>
                    Well-established facts, widely-known information. Still verify for
                    critical decisions.
                  </p>
                  <p className="mr13-example">
                    Example: "Paris is the capital of France"
                  </p>
                </div>

                <div className="mr13-level-card medium">
                  <h4>🟡 Medium Confidence (50-75%)</h4>
                  <p>
                    Reasonable statements but with some uncertainty. Suggested
                    verification before use.
                  </p>
                  <p className="mr13-example">
                    Example: "Company reported 15% revenue growth in 2023"
                  </p>
                </div>

                <div className="mr13-level-card low">
                  <h4>🔴 Low Confidence (Below 50%)</h4>
                  <p>
                    Uncertain statements. Should be verified or consulted with
                    experts.
                  </p>
                  <p className="mr13-example">
                    Example: "Future market trends suggest..."
                  </p>
                </div>
              </div>
            </div>

            <div className="mr13-guideline-section">
              <h3>When to Verify</h3>
              <ul className="mr13-verify-checklist">
                <li>
                  ✅ Always verify before making important decisions
                </li>
                <li>
                  ✅ Verify any statement marked as "Low Confidence"
                </li>
                <li>
                  ✅ Verify facts about recent events (after knowledge cutoff)
                </li>
                <li>
                  ✅ Verify in sensitive domains (medical, legal, financial)
                </li>
                <li>
                  ✅ Verify alternative explanations when offered
                </li>
              </ul>
            </div>

            <div className="mr13-guideline-section">
              <h3>Verification Strategies by Domain</h3>
              <div className="mr13-domain-guide">
                <div className="mr13-domain-card">
                  <h4>Code</h4>
                  <p>Test in a development environment or compiler</p>
                </div>
                <div className="mr13-domain-card">
                  <h4>Math</h4>
                  <p>Manually verify calculations or use a calculator</p>
                </div>
                <div className="mr13-domain-card">
                  <h4>Facts</h4>
                  <p>Cross-reference with authoritative sources</p>
                </div>
                <div className="mr13-domain-card">
                  <h4>Medical</h4>
                  <p>Consult with healthcare professionals</p>
                </div>
                <div className="mr13-domain-card">
                  <h4>Legal</h4>
                  <p>Consult with qualified attorneys</p>
                </div>
                <div className="mr13-domain-card">
                  <h4>Finance</h4>
                  <p>Consult with financial advisors</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MR13TransparentUncertainty;
