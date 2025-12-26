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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  VerifiableContent,
  VerificationResult,
  VerificationLog,
  VerificationMethod,
  ContentType,
  UserDecision,
  performVerificationAsync,
  createVerificationLog,
  calculateStatsFromDBHistory,
  getVerificationRecommendations,
  getConfidenceMessage,
  getActionRecommendation,
  getWorkflowGuidance,
  VERIFICATION_TOOLS,
  DBVerificationLog,
  detectContentType,
  getRecommendedMethod
} from './utils';
import { apiService } from '../../../services/api';
import './styles.css';

// Flow tracker interface for MR usage tracking
interface FlowTrackerProps {
  recordInteraction?: (mrId: string, interactionType: string, data?: any) => void;
  recordApply?: (mrId: string, result?: any) => void;
  recordComplete?: (mrId: string) => void;
}

interface MR11Props {
  sessionId?: string;
  onDecisionMade?: (log: VerificationLog) => void;
  /** Pre-fill content from a specific message */
  initialContent?: string;
  /** ID of the message being verified (for callback tracking) */
  messageId?: string;
  /** Callback when message verification is complete (accept = verified) */
  onMessageVerified?: (messageId: string, decision: UserDecision) => void;
  /** Use compact mode for sidebar/floating panel display */
  compact?: boolean;
  // MR Flow Tracker integration
  flowTracker?: FlowTrackerProps;
}

type TabType = 'verify' | 'history' | 'stats';

const MR11IntegratedVerification: React.FC<MR11Props> = ({
  sessionId,
  onDecisionMade,
  initialContent = '',
  messageId,
  onMessageVerified,
  compact = true, // Default to compact for sidebar usage
  flowTracker
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('verify');

  // Verification workflow states - pre-fill from initialContent if provided
  const [contentText, setContentText] = useState(initialContent);
  const [contentType, setContentType] = useState<ContentType>('text');
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [userDecision, setUserDecision] = useState<UserDecision | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  // Database history state (shown in History tab)
  const [dbHistory, setDbHistory] = useState<DBVerificationLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Verification loading state
  const [verifying, setVerifying] = useState(false);

  // Refs for scroll behavior
  const containerRef = useRef<HTMLDivElement>(null);
  const methodSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // Scroll helpers
  const scrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToMethods = useCallback(() => {
    methodSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToResults = useCallback(() => {
    resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Calculate stats from database history (real data) instead of local state
  const stats = calculateStatsFromDBHistory(dbHistory);
  const recommendations = contentType ? getVerificationRecommendations({ id: '', contentType, content: contentText, flagged: false }) : [];

  /**
   * Load history from database
   */
  const loadHistoryFromDB = useCallback(async () => {
    console.log('[MR11] Loading history, sessionId:', sessionId);
    setLoadingHistory(true);
    try {
      const response = await apiService.mrHistory.mr11.list({
        sessionId: sessionId || undefined,
        limit: 50,
      });
      const logs = response.data.data.logs || [];
      console.log('[MR11] Loaded history:', logs.length, 'records', logs);
      setDbHistory(logs);
    } catch (error) {
      console.error('[MR11] Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [sessionId]);

  // Load history on mount and when switching to history/stats tab
  useEffect(() => {
    loadHistoryFromDB();
  }, [loadHistoryFromDB]);

  // Reload history when tab changes to history or stats
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'stats') {
      loadHistoryFromDB();
    }
  }, [activeTab, loadHistoryFromDB]);

  /**
   * Save verification log to database
   */
  const saveLogToDB = useCallback(async (result: VerificationResult, decision: UserDecision, notes: string) => {
    console.log('[MR11] saveLogToDB called with decision:', decision);
    const payload = {
      sessionId: sessionId || undefined,
      messageId: messageId || undefined,
      contentType: contentType as any,
      contentText: contentText || undefined,
      verificationMethod: result.verificationMethod,
      toolUsed: result.toolUsed,
      verificationStatus: result.status as any,
      confidenceScore: result.confidenceScore,
      findings: result.findings,
      discrepancies: result.discrepancies,
      suggestions: result.suggestions,
      userDecision: decision,
      userNotes: notes || undefined,
    };
    console.log('[MR11] Saving payload:', payload);
    try {
      const response = await apiService.mrHistory.mr11.create(payload);
      console.log('[MR11] Save response:', response);
    } catch (error) {
      console.error('[MR11] Failed to save to database:', error);
    }
  }, [sessionId, messageId, contentType, contentText]);

  // Auto-detect content type and method when initialContent is provided
  // This enables the simplified "one-click verify" flow
  useEffect(() => {
    if (initialContent) {
      setContentText(initialContent);
      // Use the new detectContentType function for better detection
      const detected = detectContentType(initialContent);
      setContentType(detected);
      // Auto-select the recommended method for this content type
      const recommendedMethod = getRecommendedMethod(detected);
      setSelectedMethod(recommendedMethod);
    }
  }, [initialContent]);

  /**
   * Start verification process - scroll to method selection
   */
  const handleStartVerification = useCallback(() => {
    if (!contentText.trim() || !contentType) {
      alert('Please provide content and select a type');
      return;
    }

    setVerificationResult(null);
    setUserDecision(null);
    setDecisionNotes('');
    // Smooth scroll to method selection section
    setTimeout(() => scrollToMethods(), 100);
  }, [contentText, contentType, scrollToMethods]);

  /**
   * Perform REAL verification with selected method via backend API
   */
  const handleVerify = useCallback(async () => {
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

    setVerifying(true);
    setVerificationResult(null);

    try {
      const result = await performVerificationAsync(content, selectedMethod);
      setVerificationResult(result);
      setUserDecision(null);
      // Scroll to results section after verification completes
      setTimeout(() => scrollToTop(), 100);
    } catch (error) {
      console.error('[MR11] Verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [selectedMethod, contentType, contentText, scrollToTop]);

  /**
   * One-click verification: auto-detect type, select method, and verify
   * This is the simplified flow for when initialContent is provided
   */
  const handleOneClickVerify = useCallback(async () => {
    if (!contentText.trim()) {
      alert('No content to verify');
      return;
    }

    // Track input content
    flowTracker?.recordInteraction?.('MR11', 'input_content', { contentLength: contentText.length });

    // Auto-detect content type
    const detected = detectContentType(contentText);
    setContentType(detected);

    // Track content type selection
    flowTracker?.recordInteraction?.('MR11', 'select_type', { contentType: detected });

    // Get recommended method
    const method = getRecommendedMethod(detected);
    setSelectedMethod(method);

    // Create verification content
    const content: VerifiableContent = {
      id: `content-${Date.now()}`,
      contentType: detected,
      content: contentText,
      flagged: true,
      verificationMethod: method
    };

    setVerifying(true);
    setVerificationResult(null);

    // Track running verification
    flowTracker?.recordInteraction?.('MR11', 'run_verification', { method, contentType: detected });

    try {
      const result = await performVerificationAsync(content, method);
      setVerificationResult(result);
      setUserDecision(null);

      // Track viewing results
      flowTracker?.recordInteraction?.('MR11', 'view_results', {
        status: result.status,
        discrepanciesCount: result.discrepancies.length,
        confidenceScore: result.confidenceScore
      });
    } catch (error) {
      console.error('[MR11] One-click verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [contentText, flowTracker]);

  /**
   * Make a decision on verification result
   */
  const handleMakeDecision = useCallback(async () => {
    console.log('[MR11] handleMakeDecision called, userDecision:', userDecision);

    if (!verificationResult || !userDecision) {
      alert('Please make a decision');
      return;
    }

    // Track making decision
    flowTracker?.recordInteraction?.('MR11', 'make_decision', {
      decision: userDecision,
      verificationStatus: verificationResult.status,
      hasNotes: decisionNotes.trim().length > 0
    });

    console.log('[MR11] Saving decision to database...');
    const log = createVerificationLog(verificationResult, userDecision, decisionNotes);
    onDecisionMade?.(log);

    // Save to database
    await saveLogToDB(verificationResult, userDecision, decisionNotes);

    // Track confirmation (apply result)
    flowTracker?.recordInteraction?.('MR11', 'confirm', { decision: userDecision });
    flowTracker?.recordApply?.('MR11', { decision: userDecision, verificationResult });
    flowTracker?.recordComplete?.('MR11');

    // Refresh database history to update stats (small delay to ensure DB commit)
    setTimeout(async () => {
      console.log('[MR11] Refreshing history after save...');
      await loadHistoryFromDB();
    }, 300);

    // If verifying a specific message, notify parent of the decision
    if (messageId && onMessageVerified) {
      onMessageVerified(messageId, userDecision);
    }

    // Reset
    setContentText('');
    setSelectedMethod(null);
    setVerificationResult(null);
    setUserDecision(null);
    setDecisionNotes('');
  }, [verificationResult, userDecision, decisionNotes, onDecisionMade, messageId, onMessageVerified, saveLogToDB, loadHistoryFromDB, flowTracker]);

  /**
   * Update decision and evaluate actual correctness
   */
  const handleEvaluateOutcome = (logId: string) => {
    // This would be expanded to actually assess if decision was correct
    console.log(`Evaluate outcome for log ${logId}`);
  };

  // Compact inline styles as backup
  const compactContainerStyle: React.CSSProperties = compact ? {
    padding: 0,
    margin: 0,
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } : {};

  const compactTabsStyle: React.CSSProperties = compact ? {
    margin: 0,
    padding: '0.25rem 0.5rem',
    gap: '0.25rem',
    minHeight: 'auto',
    flex: '0 0 auto',
    height: 'auto',
  } : {};

  return (
    <div
      className={`mr11-container ${compact ? 'mr11-compact' : ''}`}
      data-compact={compact}
      style={compactContainerStyle}
    >
      {/* Header - only show in non-compact mode */}
      {!compact && (
        <div className="mr11-header">
          <h1 className="mr11-title">Integrated Verification Tools</h1>
          <p className="mr11-subtitle">
            Verify AI-generated content with one-click verification methods
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mr11-tabs" style={compactTabsStyle}>
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
          Verification History ({dbHistory.length})
        </button>
        <button
          className={`mr11-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Verification Stats
        </button>
      </div>

      {/* Content */}
      <div className="mr11-content" ref={containerRef} style={compact ? undefined : { maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Verify Tab */}
        {activeTab === 'verify' && (
          <div className="mr11-verify">
            {!verificationResult ? (
              <div className="mr11-form">
                {/* Simplified One-Click Flow */}
                <div className="mr11-form-section">
                  {/* Content Input/Preview */}
                  <div className="mr11-form-group">
                    <label className="mr11-label">Content to verify</label>
                    <textarea
                      className="mr11-textarea"
                      placeholder="Paste AI-generated content here..."
                      rows={compact ? 3 : 5}
                      value={contentText}
                      onChange={e => {
                        setContentText(e.target.value);
                        // Auto-detect when typing
                        if (e.target.value.trim()) {
                          const detected = detectContentType(e.target.value);
                          setContentType(detected);
                          setSelectedMethod(getRecommendedMethod(detected));
                        }
                      }}
                    />
                  </div>

                  {/* Auto-detected Info (shown when content exists) */}
                  {contentText.trim() && (
                    <div className="mr11-auto-detect-info" style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      background: '#f0f9ff',
                      borderRadius: '0.375rem',
                      fontSize: '0.85rem',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ color: '#0369a1' }}>
                        <strong>Type:</strong>{' '}
                        {contentType === 'code' && '💻 Code'}
                        {contentType === 'math' && '🔢 Math'}
                        {contentType === 'citation' && '📖 Citation'}
                        {contentType === 'fact' && '📰 Fact'}
                        {contentType === 'text' && '📝 Text'}
                      </span>
                      <span style={{ color: '#0369a1' }}>
                        <strong>Method:</strong>{' '}
                        {selectedMethod === 'code-execution' && '⚙️ Run Code'}
                        {selectedMethod === 'syntax-check' && '✓ Syntax Check'}
                        {selectedMethod === 'calculation' && '🧮 Calculate'}
                        {selectedMethod === 'citation-check' && '🔗 Check Citation'}
                        {selectedMethod === 'cross-reference' && '🔍 Cross-Reference'}
                        {selectedMethod === 'fact-check' && '✔️ Fact Check'}
                      </span>
                      {/* Change type/method link */}
                      <button
                        type="button"
                        onClick={() => {
                          // Toggle advanced options
                          const advElem = document.getElementById('mr11-advanced-options');
                          if (advElem) advElem.style.display = advElem.style.display === 'none' ? 'block' : 'none';
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0066ff',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          textDecoration: 'underline'
                        }}
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {/* Advanced Options (hidden by default) */}
                  <div id="mr11-advanced-options" style={{ display: 'none', marginTop: '0.75rem' }}>
                    <div className="mr11-form-group">
                      <label className="mr11-label">Content Type</label>
                      <div className="mr11-type-buttons">
                        {(['code', 'math', 'citation', 'fact', 'text'] as ContentType[]).map(type => (
                          <button
                            key={type}
                            type="button"
                            className={`mr11-type-btn ${contentType === type ? 'active' : ''}`}
                            onClick={() => {
                              setContentType(type);
                              setSelectedMethod(getRecommendedMethod(type));
                            }}
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
                    <div className="mr11-form-group">
                      <label className="mr11-label">Verification Method</label>
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
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* One-Click Verify Button */}
                  <button
                    className="mr11-btn-primary"
                    onClick={handleOneClickVerify}
                    disabled={!contentText.trim() || verifying}
                    style={{ marginTop: '0.75rem', width: '100%' }}
                  >
                    {verifying ? '⏳ Verifying...' : '🔍 Verify Now'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mr11-results" ref={resultsSectionRef}>
                <div className="mr11-results-header">
                  <h3>Verification Results</h3>
                  <button
                    className="mr11-back-btn"
                    onClick={() => {
                      setVerificationResult(null);
                      setTimeout(() => scrollToTop(), 100);
                    }}
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

                  {/* Sources - for fact-check results */}
                  {verificationResult.sources && verificationResult.sources.length > 0 && (
                    <div className="mr11-detail-section">
                      <h4>🔗 Sources Checked</h4>
                      <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem' }}>
                        {verificationResult.sources.map((source, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            <a
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              {source.length > 60 ? source.slice(0, 60) + '...' : source}
                            </a>
                          </li>
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

        {/* History Tab - Shows database history */}
        {activeTab === 'history' && (
          <div className="mr11-history">
            {loadingHistory ? (
              <div className="mr11-empty-state">
                <p>Loading history...</p>
              </div>
            ) : dbHistory.length === 0 ? (
              <div className="mr11-empty-state">
                <p>No verification history yet. Start verifying content!</p>
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {dbHistory.map((log) => {
                  const isExpanded = expandedHistoryId === log.id;
                  return (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: 'white',
                        borderRadius: '6px',
                        border: isExpanded ? '2px solid #3b82f6' : '1px solid #eee',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setExpandedHistoryId(isExpanded ? null : log.id)}
                    >
                      {/* Header - always visible */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <span style={{ fontWeight: 600 }}>
                            {log.contentType} - {log.verificationMethod}
                          </span>
                        </div>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: log.userDecision === 'accept' ? '#d1fae5' : log.userDecision === 'reject' ? '#fee2e2' : '#fef3c7',
                          color: log.userDecision === 'accept' ? '#065f46' : log.userDecision === 'reject' ? '#991b1b' : '#92400e',
                        }}>
                          {log.userDecision}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                        Status: {log.verificationStatus}
                        {log.confidenceScore !== undefined && ` • Confidence: ${Math.round(log.confidenceScore * 100)}%`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid #e5e7eb',
                        }}>
                          {/* Content Text */}
                          {log.contentText && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#374151' }}>📝 Verified Content:</strong>
                              <div style={{
                                marginTop: '0.25rem',
                                padding: '0.5rem',
                                background: '#f9fafb',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                color: '#4b5563',
                                maxHeight: '100px',
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}>
                                {log.contentText}
                              </div>
                            </div>
                          )}

                          {/* Tool Used */}
                          {log.toolUsed && (
                            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                              <strong>🔧 Tool:</strong> {log.toolUsed}
                            </div>
                          )}

                          {/* Findings */}
                          {log.findings && log.findings.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#059669' }}>✅ Findings:</strong>
                              <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.8rem', color: '#065f46' }}>
                                {log.findings.map((finding, idx) => (
                                  <li key={idx}>{finding}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Discrepancies */}
                          {log.discrepancies && log.discrepancies.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#dc2626' }}>⚠️ Discrepancies:</strong>
                              <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.8rem', color: '#991b1b' }}>
                                {log.discrepancies.map((disc, idx) => (
                                  <li key={idx}>{disc}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Suggestions */}
                          {log.suggestions && log.suggestions.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#2563eb' }}>💡 Suggestions:</strong>
                              <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.8rem', color: '#1e40af' }}>
                                {log.suggestions.map((sugg, idx) => (
                                  <li key={idx}>{sugg}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* User Notes */}
                          {log.userNotes && (
                            <div style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: '#fef3c7',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                            }}>
                              <strong>📝 Your Notes:</strong> {log.userNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
