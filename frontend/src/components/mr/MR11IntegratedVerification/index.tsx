/**
 * MR11: Integrated Verification Tools
 *
 * Provide one-click verification for AI-generated content across different
 * types (code, math, citations, facts) without automatically verifying.
 * Maintain user responsibility for final evaluation.
 *
 * User Evidence: 30/49 users (61%) - "actively verify but tools scattered"
 *
 * Key Features:
 * 1. One-Click Verification: Integrated tools for code, math, citations, facts
 * 2. Verification Workflow: Mark → Select Tool → Review → Decide
 * 3. History Tracking: Record what was verified, errors found, decisions made
 * 4. Statistics: Track error rates by content type and verification method
 * 5. Confidence Indicators: Show verification confidence levels
 *
 * Design Principle:
 * - Reduce verification friction by integrating tools
 * - Maintain user responsibility (don't auto-verify)
 * - Build trust through transparency about verification accuracy
 */

import React, { useState, useCallback } from 'react';
import {
  VerifiableContent,
  VerificationResult,
  VerificationLog,
  VerificationMethod,
  ContentType,
  UserDecision,
  performVerification,
  createVerificationLog,
  calculateVerificationStatistics,
  getVerificationRecommendations,
  getConfidenceMessage,
  getActionRecommendation,
  getWorkflowGuidance,
  VERIFICATION_TOOLS
} from './utils';
import './styles.css';

interface MR11Props {
  onDecisionMade?: (log: VerificationLog) => void;
  existingLogs?: VerificationLog[];
}

type TabType = 'verify' | 'history' | 'stats';

const MR11IntegratedVerification: React.FC<MR11Props> = ({
  onDecisionMade,
  existingLogs = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('verify');
  const [logs, setLogs] = useState<VerificationLog[]>(existingLogs);

  // Verification workflow states
  const [contentText, setContentText] = useState('');
  const [contentType, setContentType] = useState<ContentType>('code');
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [userDecision, setUserDecision] = useState<UserDecision | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  const stats = calculateVerificationStatistics(logs);
  const recommendations = contentType ? getVerificationRecommendations({ id: '', contentType, content: contentText, flagged: false }) : [];

  /**
   * Start verification process
   */
  const handleStartVerification = useCallback(() => {
    if (!contentText.trim() || !contentType) {
      alert('Please provide content and select a type');
      return;
    }

    setVerificationResult(null);
    setUserDecision(null);
    setDecisionNotes('');
  }, [contentText, contentType]);

  /**
   * Perform verification with selected method
   */
  const handleVerify = useCallback(() => {
    if (!selectedMethod) {
      alert('Please select a verification method');
      return;
    }

    const content: VerifiableContent = {
      id: `content-${Date.now()}`,
      contentType,
      content: contentText,
      flagged: true,
      verificationMethod: selectedMethod
    };

    const result = performVerification(content, selectedMethod);
    setVerificationResult(result);
    setUserDecision(null);
  }, [selectedMethod, contentType, contentText]);

  /**
   * Make a decision on verification result
   */
  const handleMakeDecision = useCallback(() => {
    if (!verificationResult || !userDecision) {
      alert('Please make a decision');
      return;
    }

    const log = createVerificationLog(verificationResult, userDecision, decisionNotes);
    setLogs([...logs, log]);
    onDecisionMade?.(log);

    // Reset
    setContentText('');
    setSelectedMethod(null);
    setVerificationResult(null);
    setUserDecision(null);
    setDecisionNotes('');
  }, [verificationResult, userDecision, decisionNotes, logs, onDecisionMade]);

  /**
   * Update decision and evaluate actual correctness
   */
  const handleEvaluateOutcome = (logId: string) => {
    // This would be expanded to actually assess if decision was correct
    console.log(`Evaluate outcome for log ${logId}`);
  };

  return (
    <div className="mr11-container">
      {/* Header */}
      <div className="mr11-header">
        <h1 className="mr11-title">Integrated Verification Tools</h1>
        <p className="mr11-subtitle">
          Verify AI-generated content with one-click verification methods
        </p>
      </div>

      {/* Tabs */}
      <div className="mr11-tabs">
        <button
          className={`mr11-tab ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          Verify Content
        </button>
        <button
          className={`mr11-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Verification History ({logs.length})
        </button>
        <button
          className={`mr11-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Verification Stats
        </button>
      </div>

      {/* Content */}
      <div className="mr11-content">
        {/* Verify Tab */}
        {activeTab === 'verify' && (
          <div className="mr11-verify">
            {!verificationResult ? (
              <div className="mr11-form">
                <div className="mr11-form-section">
                  <h3 className="mr11-section-title">Step 1: Provide Content</h3>
                  <div className="mr11-form-group">
                    <label className="mr11-label">What do you want to verify?</label>
                    <textarea
                      className="mr11-textarea"
                      placeholder="Paste AI-generated content here (code, math, citation, fact, etc.)"
                      rows={5}
                      value={contentText}
                      onChange={e => setContentText(e.target.value)}
                    />
                  </div>

                  <div className="mr11-form-group">
                    <label className="mr11-label">Content Type</label>
                    <div className="mr11-type-buttons">
                      {(['code', 'math', 'citation', 'fact', 'text'] as ContentType[]).map(type => (
                        <button
                          key={type}
                          type="button"
                          className={`mr11-type-btn ${contentType === type ? 'active' : ''}`}
                          onClick={() => setContentType(type)}
                        >
                          {type === 'code' && '💻'}
                          {type === 'math' && '🔢'}
                          {type === 'citation' && '📖'}
                          {type === 'fact' && '📰'}
                          {type === 'text' && '📝'}
                          <span>{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="mr11-next-btn"
                    onClick={handleStartVerification}
                  >
                    Continue to Verification Methods
                  </button>
                </div>

                {contentText && contentType && (
                  <div className="mr11-form-section">
                    <h3 className="mr11-section-title">Step 2: Select Verification Method</h3>
                    <div className="mr11-guidance">
                      <strong>Recommended methods for {contentType}:</strong>
                      <p>{getWorkflowGuidance('select')}</p>
                    </div>

                    <div className="mr11-method-grid">
                      {recommendations.map(method => (
                        <button
                          key={method}
                          className={`mr11-method-card ${selectedMethod === method ? 'selected' : ''}`}
                          onClick={() => setSelectedMethod(method)}
                        >
                          <div className="mr11-method-icon">
                            {method === 'code-execution' && '⚙️'}
                            {method === 'syntax-check' && '✓'}
                            {method === 'calculation' && '🧮'}
                            {method === 'citation-check' && '🔗'}
                            {method === 'cross-reference' && '🔍'}
                            {method === 'fact-check' && '✔️'}
                          </div>
                          <div className="mr11-method-name">{method}</div>
                          <div className="mr11-method-desc">
                            {method === 'code-execution' && 'Run in test environment'}
                            {method === 'syntax-check' && 'Check syntax validity'}
                            {method === 'calculation' && 'Verify math expressions'}
                            {method === 'citation-check' && 'Verify against Google Scholar'}
                            {method === 'cross-reference' && 'Cross-reference sources'}
                            {method === 'fact-check' && 'Check against authorities'}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      className="mr11-verify-btn"
                      onClick={handleVerify}
                      disabled={!selectedMethod}
                    >
                      🔍 Run Verification
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mr11-results">
                <div className="mr11-results-header">
                  <h3>Verification Results</h3>
                  <button
                    className="mr11-back-btn"
                    onClick={() => setVerificationResult(null)}
                  >
                    ← Back
                  </button>
                </div>

                {/* Confidence Banner */}
                <div className={`mr11-confidence-banner ${verificationResult.status}`}>
                  <div className="mr11-confidence-icon">
                    {verificationResult.status === 'error-found' && '⚠️'}
                    {verificationResult.status === 'verified' && '✅'}
                    {verificationResult.status === 'partially-verified' && '📊'}
                  </div>
                  <div className="mr11-confidence-text">
                    <strong>{getConfidenceMessage(verificationResult)}</strong>
                  </div>
                </div>

                {/* Verification Details */}
                <div className="mr11-results-details">
                  {/* Findings */}
                  {verificationResult.findings.length > 0 && (
                    <div className="mr11-detail-section">
                      <h4>✅ Findings</h4>
                      <ul className="mr11-findings-list">
                        {verificationResult.findings.map((finding, idx) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Discrepancies */}
                  {verificationResult.discrepancies.length > 0 && (
                    <div className="mr11-detail-section warning">
                      <h4>⚠️ Discrepancies Found</h4>
                      <ul className="mr11-discrepancies-list">
                        {verificationResult.discrepancies.map((disc, idx) => (
                          <li key={idx}>{disc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {verificationResult.suggestions.length > 0 && (
                    <div className="mr11-detail-section">
                      <h4>💡 Suggestions</h4>
                      <ul className="mr11-suggestions-list">
                        {verificationResult.suggestions.map((sugg, idx) => (
                          <li key={idx}>{sugg}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Recommendation */}
                  <div className="mr11-action-recommendation">
                    <strong>Recommended action:</strong>
                    <p>{getActionRecommendation(verificationResult)}</p>
                  </div>
                </div>

                {/* Decision Buttons */}
                <div className="mr11-decision-section">
                  <h4>What would you like to do?</h4>
                  <div className="mr11-decision-grid">
                    <button
                      className={`mr11-decision-btn ${userDecision === 'accept' ? 'selected' : ''}`}
                      onClick={() => setUserDecision('accept')}
                    >
                      <div className="mr11-decision-icon">✅</div>
                      <div className="mr11-decision-title">Accept</div>
                      <div className="mr11-decision-desc">Use AI output as-is</div>
                    </button>

                    <button
                      className={`mr11-decision-btn ${userDecision === 'modify' ? 'selected' : ''}`}
                      onClick={() => setUserDecision('modify')}
                    >
                      <div className="mr11-decision-icon">✏️</div>
                      <div className="mr11-decision-title">Modify</div>
                      <div className="mr11-decision-desc">Apply suggested changes</div>
                    </button>

                    <button
                      className={`mr11-decision-btn ${userDecision === 'reject' ? 'selected' : ''}`}
                      onClick={() => setUserDecision('reject')}
                    >
                      <div className="mr11-decision-icon">❌</div>
                      <div className="mr11-decision-title">Reject</div>
                      <div className="mr11-decision-desc">Discard and redo</div>
                    </button>

                    <button
                      className={`mr11-decision-btn ${userDecision === 'skip' ? 'selected' : ''}`}
                      onClick={() => setUserDecision('skip')}
                    >
                      <div className="mr11-decision-icon">⏭️</div>
                      <div className="mr11-decision-title">Skip</div>
                      <div className="mr11-decision-desc">Decide later</div>
                    </button>
                  </div>

                  <div className="mr11-form-group">
                    <label className="mr11-label">Notes on your decision</label>
                    <textarea
                      className="mr11-textarea"
                      placeholder="Why did you choose this action? (optional)"
                      rows={2}
                      value={decisionNotes}
                      onChange={e => setDecisionNotes(e.target.value)}
                    />
                  </div>

                  <button
                    className="mr11-record-btn"
                    onClick={handleMakeDecision}
                    disabled={!userDecision}
                  >
                    Record Decision
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="mr11-history">
            {logs.length === 0 ? (
              <div className="mr11-empty-state">
                <p>No verification history yet. Start verifying content!</p>
              </div>
            ) : (
              <div className="mr11-history-list">
                {logs.map((log, idx) => (
                  <div key={log.id} className="mr11-history-card">
                    <div className="mr11-history-header">
                      <div>
                        <div className="mr11-history-status">
                          {log.result.status === 'error-found' && '⚠️ Errors Found'}
                          {log.result.status === 'verified' && '✅ Verified'}
                          {log.result.status === 'partially-verified' && '📊 Partially Verified'}
                          {log.result.status === 'unverified' && '❓ Unverified'}
                        </div>
                        <div className="mr11-history-method">
                          {log.result.verificationMethod} ({log.result.toolUsed})
                        </div>
                      </div>
                      <div className="mr11-history-date">
                        {new Date(log.result.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mr11-history-decision">
                      <span className="mr11-decision-label">Decision:</span>
                      <span className="mr11-decision-value">
                        {log.userDecision === 'accept' && '✅ Accepted'}
                        {log.userDecision === 'modify' && '✏️ Modified'}
                        {log.userDecision === 'reject' && '❌ Rejected'}
                        {log.userDecision === 'skip' && '⏭️ Skipped'}
                      </span>
                    </div>

                    {log.userNotes && (
                      <div className="mr11-history-notes">
                        <strong>Notes:</strong> {log.userNotes}
                      </div>
                    )}

                    {log.result.findings.length > 0 && (
                      <div className="mr11-history-findings">
                        <strong>Findings:</strong>
                        <ul>
                          {log.result.findings.slice(0, 2).map((finding, idx) => (
                            <li key={idx}>{finding}</li>
                          ))}
                          {log.result.findings.length > 2 && <li>+{log.result.findings.length - 2} more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="mr11-statistics">
            <div className="mr11-stats-overview">
              <div className="mr11-stat-card">
                <div className="mr11-stat-label">Total Verifications</div>
                <div className="mr11-stat-value">{stats.totalVerified}</div>
              </div>

              <div className="mr11-stat-card">
                <div className="mr11-stat-label">Errors Found</div>
                <div className="mr11-stat-value">{stats.errorsFound}</div>
              </div>

              <div className="mr11-stat-card">
                <div className="mr11-stat-label">Error Rate</div>
                <div className="mr11-stat-value">
                  {Math.round(stats.errorRate * 100)}%
                </div>
              </div>

              <div className="mr11-stat-card">
                <div className="mr11-stat-label">Trust Status</div>
                <div className="mr11-stat-value">
                  {stats.trustBuiltUp ? '✅ High' : '📊 Monitoring'}
                </div>
              </div>
            </div>

            {stats.totalVerified > 0 && (
              <>
                {/* Verification Method Performance */}
                <div className="mr11-method-performance">
                  <h3>Verification Method Performance</h3>
                  <div className="mr11-method-stats">
                    {Object.entries(stats.byVerificationMethod).map(([method, data]) =>
                      data.total > 0 ? (
                        <div key={method} className="mr11-method-stat">
                          <div className="mr11-method-stat-name">{method}</div>
                          <div className="mr11-method-stat-bar">
                            <div className="mr11-stat-bar-bg">
                              <div
                                className="mr11-stat-bar-fill"
                                style={{ width: `${Math.min(data.rate * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="mr11-method-stat-info">
                            <span>{data.total} verifications</span>
                            <span>{Math.round(data.rate * 100)}% error rate</span>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Trust Building Message */}
                <div className={`mr11-trust-message ${stats.trustBuiltUp ? 'high' : 'monitoring'}`}>
                  {stats.trustBuiltUp ? (
                    <>
                      <strong>✅ High Verification Trust Built</strong>
                      <p>Your error detection rate is below 20%. You can trust AI more for verified content types.</p>
                    </>
                  ) : (
                    <>
                      <strong>📊 Monitoring Verification Accuracy</strong>
                      <p>Continue verifying to build confidence in AI output accuracy.</p>
                    </>
                  )}
                </div>
              </>
            )}

            {stats.totalVerified === 0 && (
              <div className="mr11-empty-state">
                <p>No verification data yet. Start verifying to see statistics.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MR11IntegratedVerification;
