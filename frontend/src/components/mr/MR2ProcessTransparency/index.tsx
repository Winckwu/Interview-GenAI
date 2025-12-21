/**
 * MR2: Process Transparency and Traceability Component
 *
 * Visualizes how AI outputs and thinking evolved through iterations:
 * 1. Revision tracking with diff visualization (Git-style)
 * 2. Timeline view showing thinking evolution
 * 3. Chain-of-Thought reasoning display
 * 4. Version comparison (before/after)
 * 5. Export functionality (JSON, Markdown, PDF)
 * 6. Revert to historical versions
 *
 * Evidence: 37/49 users (76%) want to see AI's "thinking process" and output evolution
 * Design principle: Transparency builds understanding and appropriate trust calibration
 */

import React, { useState, useCallback, useEffect } from 'react';
import './styles.css';
import MarkdownText from '../../common/MarkdownText';
import { apiService } from '../../../services/api';
import {
  generateDiff,
  createTimeline,
  extractChainOfThought,
  compareVersions,
  exportInteractionHistory,
  calculateChangeMetrics,
  type VersionSnapshot,
  type DiffChange,
  type TimelineEvent,
  type ChainOfThoughtStep
} from './utils';

export interface InsightsData {
  keyPoints?: string[];
  aiApproach?: string;
  assumptions?: string[];
  missingAspects?: string[];
  suggestedFollowups?: string[];
}

export interface InteractionVersion {
  id: string;
  timestamp: Date;
  promptVersion: number;
  userPrompt: string;
  aiOutput: string;
  reasoning?: string;
  modelName: string;
  confidenceScore?: number;
  userAnnotation?: string;
  changesSummary?: string;
  insights?: InsightsData; // Stored insights from database
  sessionId?: string; // Session ID for saving insights
}

export type ViewMode = 'insights' | 'timeline' | 'diff' | 'reasoning';

interface MR2Props {
  versions: InteractionVersion[];
  sessionId?: string;
  selectedVersionId?: string; // Auto-select this version when provided (from Insights button click)
  onVersionSelect?: (version: InteractionVersion) => void;
  onExport?: (data: any) => void;
  onRevert?: (versionId: string) => void;
  showTimeline?: boolean;
  autoTrack?: boolean;
}

export const MR2ProcessTransparency: React.FC<MR2Props> = ({
  versions,
  sessionId = 'session-' + Date.now(),
  selectedVersionId,
  onVersionSelect,
  onExport,
  onRevert,
  showTimeline = true,
  autoTrack = true
}) => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('insights');
  const [currentVersionId, setCurrentVersionId] = useState<string>(
    versions.length > 0 ? versions[versions.length - 1].id : ''
  );
  const [comparisonVersionIds, setComparisonVersionIds] = useState<[string, string] | null>(null);
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(new Set());
  const [diffs, setDiffs] = useState<DiffChange[]>([]);
  const [chainOfThought, setChainOfThought] = useState<ChainOfThoughtStep[]>([]);
  const [isDifferentTopic, setIsDifferentTopic] = useState<boolean>(false);
  // Track which turn is expanded in the sidebar - controlled by selectedVersionId prop or user selection
  const [expandedTurnId, setExpandedTurnId] = useState<string | null>(
    selectedVersionId || (versions.length > 0 ? versions[0].id : null)
  );

  // Auto-select version when selectedVersionId prop changes (from Insights button click)
  useEffect(() => {
    if (selectedVersionId && versions.some(v => v.id === selectedVersionId)) {
      setExpandedTurnId(selectedVersionId);
      setCurrentVersionId(selectedVersionId);
      console.log('[MR2] Auto-selecting version from prop:', selectedVersionId);
    }
  }, [selectedVersionId, versions]);
  // Insights state
  const [insights, setInsights] = useState<{
    keyPoints: string[];
    aiApproach: string;
    assumptions: string[];
    missingAspects: string[];
    suggestedFollowups: string[];
    isLoading: boolean;
    error: string | null;
  }>({
    keyPoints: [],
    aiApproach: '',
    assumptions: [],
    missingAspects: [],
    suggestedFollowups: [],
    isLoading: false,
    error: null
  });

  // Update expandedTurnId when versions change (e.g., loaded asynchronously)
  useEffect(() => {
    if (versions.length > 0 && !expandedTurnId) {
      setExpandedTurnId(versions[0].id);
    }
  }, [versions, expandedTurnId]);

  /**
   * Fetch insights for a specific version
   * First checks if insights are already stored in the database
   * If not, calls API and saves the result
   */
  const fetchInsights = useCallback(async (version: InteractionVersion) => {
    if (!version.userPrompt || !version.aiOutput) return;

    // Check if insights already exist in the version data (from database)
    if (version.insights && Object.keys(version.insights).length > 0) {
      console.log('[MR2] Using cached insights from database');
      setInsights({
        keyPoints: version.insights.keyPoints || [],
        aiApproach: version.insights.aiApproach || '',
        assumptions: version.insights.assumptions || [],
        missingAspects: version.insights.missingAspects || [],
        suggestedFollowups: version.insights.suggestedFollowups || [],
        isLoading: false,
        error: null
      });
      return;
    }

    setInsights(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.ai.analyzeResponse(version.userPrompt, version.aiOutput);
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const insightsData = {
          keyPoints: data.keyPoints || [],
          aiApproach: data.aiApproach || '',
          assumptions: data.assumptions || [],
          missingAspects: data.missingAspects || [],
          suggestedFollowups: data.suggestedFollowups || []
        };

        setInsights({
          ...insightsData,
          isLoading: false,
          error: null
        });

        // Save insights to database if we have session ID
        if (version.sessionId && version.id) {
          try {
            await apiService.sessions.saveInsights(version.sessionId, version.id, insightsData);
            console.log('[MR2] Insights saved to database');
          } catch (saveError) {
            console.warn('[MR2] Failed to save insights to database:', saveError);
            // Don't show error to user - insights still work, just not cached
          }
        }
      }
    } catch (error: any) {
      console.error('[MR2] Failed to fetch insights:', error);
      setInsights(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to analyze response'
      }));
    }
  }, []);

  // Auto-fetch insights when selecting a version in insights mode
  useEffect(() => {
    if (viewMode === 'insights' && expandedTurnId) {
      const version = versions.find(v => v.id === expandedTurnId);
      if (version) {
        fetchInsights(version);
      }
    }
  }, [viewMode, expandedTurnId, versions, fetchInsights]);

  /**
   * Check if two prompts are similar (indicating a refinement/regeneration vs new topic)
   * Returns true if prompts are similar enough to warrant comparison
   */
  const arePromptsSimilar = (prompt1: string, prompt2: string): boolean => {
    // Normalize prompts
    const p1 = prompt1.toLowerCase().trim();
    const p2 = prompt2.toLowerCase().trim();

    // Exact match
    if (p1 === p2) return true;

    // Very short prompts that are different are likely different topics
    if (p1.length < 10 || p2.length < 10) {
      return p1 === p2;
    }

    // Calculate simple similarity based on word overlap
    const words1 = new Set(p1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(p2.split(/\s+/).filter(w => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return false;

    // Count overlapping words
    let overlap = 0;
    words1.forEach(word => {
      if (words2.has(word)) overlap++;
    });

    // Calculate Jaccard similarity
    const union = new Set([...words1, ...words2]).size;
    const similarity = overlap / union;

    // Consider similar if > 50% word overlap
    return similarity > 0.5;
  };

  /**
   * Handle version selection
   */
  const handleVersionSelect = useCallback(
    (versionId: string, switchToView?: ViewMode) => {
      setCurrentVersionId(versionId);
      const selectedVersion = versions.find(v => v.id === versionId);

      if (selectedVersion) {
        // Generate diff from previous version ONLY if prompts are similar
        if (versions.length > 1) {
          const versionIndex = versions.findIndex(v => v.id === versionId);
          if (versionIndex > 0) {
            const prevVersion = versions[versionIndex - 1];

            // Check if prompts are similar (same topic/refinement vs completely different question)
            const similar = arePromptsSimilar(prevVersion.userPrompt, selectedVersion.userPrompt);
            setIsDifferentTopic(!similar);

            if (similar) {
              // Only compare outputs when prompts are related
              const diffResult = generateDiff(prevVersion.aiOutput, selectedVersion.aiOutput);
              setDiffs(diffResult);
            } else {
              // Different topics - don't show meaningless diff
              setDiffs([]);
            }
          } else {
            // First version - no comparison possible
            setIsDifferentTopic(false);
            setDiffs([]);
          }
        }

        // Extract chain of thought
        if (selectedVersion.reasoning) {
          const cot = extractChainOfThought(selectedVersion.reasoning);
          setChainOfThought(cot);
        }

        // Switch view if requested
        if (switchToView) {
          setViewMode(switchToView);
        }

        if (onVersionSelect) {
          onVersionSelect(selectedVersion);
        }
      }
    },
    [versions, onVersionSelect]
  );

  /**
   * Handle version comparison
   */
  const handleCompareVersions = useCallback((versionId1: string, versionId2: string) => {
    setComparisonVersionIds([versionId1, versionId2]);
    setViewMode('comparison');
  }, []);

  /**
   * Toggle reasoning step expansion
   */
  const handleToggleReason = useCallback((index: number) => {
    setExpandedReasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle export
   */
  const handleExport = useCallback(
    async (format: 'json' | 'markdown' | 'pdf') => {
      if (format === 'pdf') {
        // For PDF, call the backend export endpoint
        if (!sessionId) {
          console.error('[MR2] Cannot export PDF: No session ID provided');
          alert('Session ID is required for PDF export');
          return;
        }

        try {
          // Open PDF in new window using backend endpoint
          const token = localStorage.getItem('auth-storage')
            ? JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token
            : null;

          const url = `/api/sessions/${sessionId}/export?format=pdf`;
          const headers: Record<string, string> = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          // Download PDF
          const response = await fetch(url, { headers });
          if (!response.ok) {
            throw new Error(`PDF export failed: ${response.statusText}`);
          }

          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `session-${sessionId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          if (onExport) {
            onExport({ format: 'pdf', sessionId });
          }
        } catch (error) {
          console.error('[MR2] PDF export failed:', error);
          alert('Failed to export PDF. Please try again.');
        }
      } else {
        // For JSON and Markdown, use local export
        const exported = exportInteractionHistory(versions, format);
        if (onExport) {
          onExport(exported);
        } else {
          // Fallback: download as file
          const blob = new Blob([exported], {
            type: format === 'json' ? 'application/json' : 'text/markdown'
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `session-${sessionId}.${format === 'json' ? 'json' : 'md'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }
    },
    [versions, sessionId, onExport]
  );

  /**
   * Render insights view - AI response analysis
   */
  const renderInsightsView = () => {
    const selectedVersion = expandedTurnId
      ? versions.find(v => v.id === expandedTurnId)
      : versions[versions.length - 1];

    if (!selectedVersion) {
      return (
        <div className="mr2-empty-state">
          <p>No conversation to analyze yet. Start a conversation first.</p>
        </div>
      );
    }

    return (
      <div className="mr2-insights-view">
        {/* Question & Response Summary */}
        <div className="mr2-insights-context">
          <div className="mr2-insights-question">
            <strong>📝 Question:</strong>
            <p>{selectedVersion.userPrompt}</p>
          </div>
        </div>

        {/* Loading State */}
        {insights.isLoading && (
          <div className="mr2-insights-loading">
            <div className="mr2-loading-spinner"></div>
            <p>Analyzing response...</p>
          </div>
        )}

        {/* Error State */}
        {insights.error && (
          <div className="mr2-insights-error">
            <p>⚠️ {insights.error}</p>
            <button onClick={() => fetchInsights(selectedVersion)}>Retry</button>
          </div>
        )}

        {/* Insights Content */}
        {!insights.isLoading && !insights.error && (
          <div className="mr2-insights-content">
            {/* Key Points */}
            {insights.keyPoints.length > 0 && (
              <div className="mr2-insight-section mr2-insight-keypoints">
                <h3>🎯 Key Points</h3>
                <ul>
                  {insights.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI's Approach */}
            {insights.aiApproach && (
              <div className="mr2-insight-section mr2-insight-approach">
                <h3>💭 How AI Approached This</h3>
                <p>{insights.aiApproach}</p>
              </div>
            )}

            {/* Assumptions */}
            {insights.assumptions.length > 0 && (
              <div className="mr2-insight-section mr2-insight-assumptions">
                <h3>⚠️ Assumptions Made</h3>
                <ul>
                  {insights.assumptions.map((assumption, idx) => (
                    <li key={idx}>{assumption}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Aspects */}
            {insights.missingAspects.length > 0 && (
              <div className="mr2-insight-section mr2-insight-missing">
                <h3>🔍 What Might Be Missing</h3>
                <ul>
                  {insights.missingAspects.map((aspect, idx) => (
                    <li key={idx}>{aspect}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Follow-ups */}
            {insights.suggestedFollowups.length > 0 && (
              <div className="mr2-insight-section mr2-insight-followups">
                <h3>💡 Suggested Follow-up Questions</h3>
                <div className="mr2-followup-list">
                  {insights.suggestedFollowups.map((followup, idx) => (
                    <div key={idx} className="mr2-followup-item">
                      <span className="mr2-followup-icon">→</span>
                      <span>{followup}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if no insights */}
            {!insights.keyPoints.length && !insights.aiApproach && !insights.assumptions.length && (
              <div className="mr2-insights-empty">
                <p>Click "Analyze" to get insights on this response.</p>
                <button
                  className="mr2-btn-analyze"
                  onClick={() => fetchInsights(selectedVersion)}
                >
                  🔍 Analyze Response
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render timeline view - shows selected turn content in main view
   */
  const renderTimelineView = () => {
    if (versions.length === 0) {
      return (
        <div className="mr2-empty-state">
          <p>No conversation turns yet</p>
        </div>
      );
    }

    // Find selected version
    const selectedVersion = expandedTurnId
      ? versions.find(v => v.id === expandedTurnId)
      : null;

    if (!selectedVersion) {
      return (
        <div className="mr2-timeline-view">
          <div className="mr2-timeline-hint">
            <p>👈 Click on a Turn to view the conversation</p>
            <p className="mr2-hint-stats">
              Total: {versions.length} turn{versions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mr2-timeline-view">
        <div className="mr2-selected-turn-content">
          <div className="mr2-selected-turn-header">
            <h2>Turn {selectedVersion.promptVersion}</h2>
            <span className="mr2-selected-turn-time">
              {new Date(selectedVersion.timestamp).toLocaleString()}
            </span>
            <span className="mr2-selected-turn-model">
              Model: {selectedVersion.modelName}
            </span>
          </div>

          <div className="mr2-turn-message mr2-turn-user">
            <div className="mr2-turn-role">👤 User</div>
            <div className="mr2-turn-text">
              <MarkdownText content={selectedVersion.userPrompt} />
            </div>
          </div>

          <div className="mr2-turn-message mr2-turn-ai">
            <div className="mr2-turn-role">🤖 AI</div>
            <div className="mr2-turn-text">
              <MarkdownText content={selectedVersion.aiOutput} />
            </div>
          </div>

          {selectedVersion.reasoning && (
            <div className="mr2-turn-message mr2-turn-reasoning">
              <div className="mr2-turn-role">🧠 Reasoning</div>
              <div className="mr2-turn-text">
                <MarkdownText content={selectedVersion.reasoning} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render diff view
   */
  const renderDiffView = () => {
    const selectedVersion = versions.find(v => v.id === currentVersionId);
    const versionIndex = versions.findIndex(v => v.id === currentVersionId);

    // First version - no previous to compare
    if (versionIndex === 0) {
      return (
        <div className="mr2-empty-state">
          <p>This is the first turn - no previous version to compare</p>
        </div>
      );
    }

    // Different topics - comparison not meaningful
    if (isDifferentTopic) {
      const prevVersion = versionIndex > 0 ? versions[versionIndex - 1] : null;
      return (
        <div className="mr2-empty-state">
          <div className="mr2-different-topic-notice">
            <h3>🔀 Different Topics</h3>
            <p>These turns discuss different topics, so output comparison is not applicable.</p>
            {prevVersion && (
              <div className="mr2-topic-comparison">
                <div className="mr2-topic-item">
                  <strong>Turn {prevVersion.promptVersion}:</strong>
                  <span className="mr2-topic-prompt">
                    <MarkdownText content={prevVersion.userPrompt.substring(0, 100) + (prevVersion.userPrompt.length > 100 ? '...' : '')} />
                  </span>
                </div>
                <div className="mr2-topic-item">
                  <strong>Turn {selectedVersion?.promptVersion}:</strong>
                  <span className="mr2-topic-prompt">
                    <MarkdownText content={(selectedVersion?.userPrompt.substring(0, 100) || '') + ((selectedVersion?.userPrompt.length || 0) > 100 ? '...' : '')} />
                  </span>
                </div>
              </div>
            )}
            <p className="mr2-topic-hint">Output diffs are shown when you refine the same prompt or regenerate a response.</p>
          </div>
        </div>
      );
    }

    if (!selectedVersion || diffs.length === 0) {
      return (
        <div className="mr2-empty-state">
          <p>No changes detected between versions</p>
        </div>
      );
    }

    return (
      <div className="mr2-diff-view">
        <h2>📝 Changes Made</h2>

        <div className="mr2-diff-stats">
          <div className="mr2-stat">
            <span className="mr2-stat-label">Total Changes:</span>
            <span className="mr2-stat-value">{diffs.length}</span>
          </div>
          <div className="mr2-stat">
            <span className="mr2-stat-label">Added:</span>
            <span className="mr2-stat-value mr2-stat-added">
              {diffs.filter(d => d.type === 'add').length}
            </span>
          </div>
          <div className="mr2-stat">
            <span className="mr2-stat-label">Removed:</span>
            <span className="mr2-stat-value mr2-stat-removed">
              {diffs.filter(d => d.type === 'remove').length}
            </span>
          </div>
          <div className="mr2-stat">
            <span className="mr2-stat-label">Modified:</span>
            <span className="mr2-stat-value mr2-stat-modified">
              {diffs.filter(d => d.type === 'modify').length}
            </span>
          </div>
        </div>

        <div className="mr2-diff-list">
          {diffs.map((diff, idx) => (
            <div key={idx} className={`mr2-diff-item mr2-diff-${diff.type}`}>
              <span className="mr2-diff-type-badge">{diff.type.toUpperCase()}</span>

              <div className="mr2-diff-content">
                {diff.type === 'add' && (
                  <div className="mr2-diff-text mr2-text-added">+ <MarkdownText content={diff.content} /></div>
                )}
                {diff.type === 'remove' && (
                  <div className="mr2-diff-text mr2-text-removed">- <MarkdownText content={diff.content} /></div>
                )}
                {diff.type === 'modify' && (
                  <div className="mr2-diff-text mr2-text-modified">
                    <div className="mr2-old-text">- <MarkdownText content={diff.oldContent || ''} /></div>
                    <div className="mr2-new-text">+ <MarkdownText content={diff.content} /></div>
                  </div>
                )}
              </div>

              {diff.context && (
                <div className="mr2-diff-context">
                  <em>Context: <MarkdownText content={diff.context} /></em>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render reasoning/chain-of-thought view - shows AI's step-by-step thinking
   */
  const renderReasoningView = () => {
    const selectedVersion = versions.find(v => v.id === currentVersionId);

    if (!selectedVersion) {
      return (
        <div className="mr2-empty-state">
          <p>Select a turn to view its reasoning</p>
        </div>
      );
    }

    const reasoning = selectedVersion.reasoning;

    if (!reasoning) {
      return (
        <div className="mr2-empty-state">
          <div className="mr2-reasoning-empty">
            <h3>🧠 No Reasoning Available</h3>
            <p>This response doesn't have recorded reasoning data.</p>
            <p className="mr2-reasoning-hint">
              <strong>What is AI Reasoning?</strong><br/>
              The AI's internal thinking process when answering questions, including: understanding the question, analyzing key points, and formulating a response strategy.<br/><br/>
              <strong>Why isn't it showing?</strong><br/>
              • Older conversations may not have saved reasoning data<br/>
              • Send a new message and refresh the page to see the latest reasoning
            </p>
          </div>
        </div>
      );
    }

    // Parse reasoning steps (look for numbered items or bullet points)
    const steps = reasoning.split(/\n/).filter((line: string) => line.trim());

    return (
      <div className="mr2-reasoning-view">
        <div className="mr2-reasoning-header">
          <h2>🧠 AI Reasoning Process</h2>
          <p className="mr2-reasoning-subtitle">
            Turn {selectedVersion.promptVersion} • {selectedVersion.modelName}
          </p>
        </div>

        <div className="mr2-reasoning-prompt">
          <h4>User Prompt</h4>
          <p><MarkdownText content={selectedVersion.userPrompt} /></p>
        </div>

        <div className="mr2-reasoning-content">
          <h4>Chain of Thought</h4>
          <div className="mr2-reasoning-steps">
            {steps.map((step: string, idx: number) => (
              <div key={idx} className="mr2-reasoning-step">
                <MarkdownText content={step} />
              </div>
            ))}
          </div>
        </div>

        <div className="mr2-reasoning-footer">
          <p className="mr2-reasoning-note">
            💡 This reasoning was generated by the AI to explain its thought process.
            Understanding AI reasoning helps develop better critical evaluation skills.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Render version comparison view
   */
  const renderComparisonView = () => {
    if (!comparisonVersionIds) {
      return <div className="mr2-empty-state">Select two versions to compare</div>;
    }

    const [v1Id, v2Id] = comparisonVersionIds;
    const v1 = versions.find(v => v.id === v1Id);
    const v2 = versions.find(v => v.id === v2Id);

    if (!v1 || !v2) return <div className="mr2-empty-state">Version not found</div>;

    const comparison = compareVersions(v1, v2);

    return (
      <div className="mr2-comparison-view">
        <h2>⚖️ Version Comparison</h2>

        <div className="mr2-comparison-header">
          <button
            className={`mr2-version-selector ${currentVersionId === v1Id ? 'active' : ''}`}
            onClick={() => handleVersionSelect(v1Id)}
          >
            <div className="mr2-version-label">版本 {v1.promptVersion} (较早版本)</div>
            <span className="mr2-time-ago">
              {((new Date(v2.timestamp).getTime() - new Date(v1.timestamp).getTime()) / 1000 / 60).toFixed(
                0
              )}{' '}
              分钟前
            </span>
          </button>

          <button
            className={`mr2-version-selector ${currentVersionId === v2Id ? 'active' : ''}`}
            onClick={() => handleVersionSelect(v2Id)}
          >
            <div className="mr2-version-label">版本 {v2.promptVersion} (最新版本)</div>
            <span className="mr2-time-current">当前</span>
          </button>
        </div>

        <div className="mr2-comparison-metrics">
          {comparison.metrics.map((metric, idx) => (
            <div key={idx} className="mr2-metric">
              <span className="mr2-metric-label">{metric.label}</span>
              <div className="mr2-metric-bar">
                <div className="mr2-metric-left" style={{ width: `${metric.v1Value}%` }} />
                <div className="mr2-metric-right" style={{ width: `${metric.v2Value}%` }} />
              </div>
              <span className="mr2-metric-values">
                {metric.v1Display} → {metric.v2Display}
              </span>
            </div>
          ))}
        </div>

        <div className="mr2-comparison-content">
          <div className="mr2-comparison-side">
            <h3>版本 {v1.promptVersion} <span className="mr2-version-tag">(较早)</span></h3>
            <div className="mr2-comparison-meta">
              <span>模型: {v1.modelName}</span>
              <span>时间: {new Date(v1.timestamp).toLocaleString()}</span>
            </div>
            <div className="mr2-comparison-text">{v1.aiOutput}</div>
          </div>

          <div className="mr2-comparison-side">
            <h3>版本 {v2.promptVersion} <span className="mr2-version-tag">(最新)</span></h3>
            <div className="mr2-comparison-meta">
              <span>模型: {v2.modelName}</span>
              <span>时间: {new Date(v2.timestamp).toLocaleString()}</span>
            </div>
            <div className="mr2-comparison-text">{v2.aiOutput}</div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render metrics view
   */
  const renderMetricsView = () => {
    const metrics = calculateChangeMetrics(versions);

    return (
      <div className="mr2-metrics-view">
        <h2>📊 Interaction Metrics</h2>

        <div className="mr2-metrics-grid">
          <div className="mr2-metric-card">
            <div className="mr2-metric-label">Total Iterations</div>
            <div className="mr2-metric-value">{metrics.totalIterations}</div>
          </div>

          <div className="mr2-metric-card">
            <div className="mr2-metric-label">Total Changes</div>
            <div className="mr2-metric-value">{metrics.totalChanges}</div>
          </div>

          <div className="mr2-metric-card">
            <div className="mr2-metric-label">Avg Changes/Iteration</div>
            <div className="mr2-metric-value">
              {(metrics.totalChanges / metrics.totalIterations).toFixed(1)}
            </div>
          </div>

          <div className="mr2-metric-card">
            <div className="mr2-metric-label">Session Duration</div>
            <div className="mr2-metric-value">{metrics.sessionDuration}</div>
          </div>

          <div className="mr2-metric-card">
            <div className="mr2-metric-label">Avg Tokens/Output</div>
            <div className="mr2-metric-value">{metrics.avgTokensPerOutput.toFixed(0)}</div>
          </div>

          <div className="mr2-metric-card">
            <div className="mr2-metric-label">Avg Confidence</div>
            <div className="mr2-metric-value">
              {(metrics.avgConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="mr2-iteration-summary">
          <h3>Iteration Summary</h3>
          <div className="mr2-iteration-list">
            {metrics.iterationSummary.map((summary, idx) => (
              <div key={idx} className="mr2-iteration-item">
                <span className="mr2-iteration-num">Iteration {idx + 1}</span>
                <span className="mr2-iteration-changes">{summary.changes} changes</span>
                <span className="mr2-iteration-tokens">{summary.tokens} tokens</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Handle turn selection - selects the version for display in main view
   */
  const handleTurnSelect = useCallback((versionId: string) => {
    setExpandedTurnId(versionId);
    handleVersionSelect(versionId);
  }, [handleVersionSelect]);

  /**
   * Render version selector sidebar - simple list, content shows in main view
   */
  const renderVersionSelector = () => {
    return (
      <div className="mr2-version-selector-panel">
        <h3>Turns</h3>
        <div className="mr2-version-list">
          {versions.map((version) => {
            const isSelected = expandedTurnId === version.id;
            return (
              <button
                key={version.id}
                className={`mr2-version-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleTurnSelect(version.id)}
                title={`Turn ${version.promptVersion}: ${version.modelName}`}
              >
                <span className="mr2-version-num">Turn {version.promptVersion}</span>
                <span className="mr2-version-time">
                  {new Date(version.timestamp).toLocaleTimeString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Render main component
   */
  return (
    <div className="mr2-container">
      <div className="mr2-header">
        <h1 className="mr2-title">🔍 AI Response Insights</h1>
        <p className="mr2-subtitle">Analyze AI responses • Track conversation history</p>

        <div className="mr2-view-tabs">
          {/* Analyze Section */}
          <div className="mr2-tab-group">
            <span className="mr2-tab-group-label">Analyze</span>
            <button
              className={`mr2-tab ${viewMode === 'insights' ? 'active' : ''}`}
              onClick={() => setViewMode('insights')}
              title="Get key insights: what AI said, assumptions made, follow-up questions"
            >
              💡 Insights
            </button>
          </div>

          <div className="mr2-tab-divider"></div>

          {/* History Section */}
          <div className="mr2-tab-group">
            <span className="mr2-tab-group-label">History</span>
            <button
              className={`mr2-tab ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
              title="View full conversation Q&A"
            >
              📅 Timeline
            </button>
            <button
              className={`mr2-tab ${viewMode === 'diff' ? 'active' : ''}`}
              onClick={() => setViewMode('diff')}
              title="Compare changes between versions"
            >
              📝 Changes
            </button>
            <button
              className={`mr2-tab ${viewMode === 'reasoning' ? 'active' : ''}`}
              onClick={() => setViewMode('reasoning')}
              title="View AI's thinking process (if available)"
            >
              🧠 Reasoning
            </button>
          </div>
        </div>

        <div className="mr2-actions">
          <button className="mr2-btn-export" onClick={() => handleExport('markdown')}>
            📄 Export Markdown
          </button>
          <button className="mr2-btn-export" onClick={() => handleExport('json')}>
            📋 Export JSON
          </button>
          <button
            className="mr2-btn-export mr2-btn-pdf"
            onClick={() => handleExport('pdf')}
            title="Export session history to PDF (includes all interactions and metadata)"
          >
            📕 Export PDF
          </button>
        </div>
      </div>

      <div className="mr2-content-area">
        {versions.length > 0 && renderVersionSelector()}

        <div className="mr2-main-view">
          {viewMode === 'insights' && renderInsightsView()}
          {viewMode === 'timeline' && renderTimelineView()}
          {viewMode === 'diff' && renderDiffView()}
          {viewMode === 'reasoning' && renderReasoningView()}
        </div>
      </div>
    </div>
  );
};

export default MR2ProcessTransparency;
