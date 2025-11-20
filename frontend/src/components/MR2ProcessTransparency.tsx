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

import React, { useState, useCallback } from 'react';
import './MR2ProcessTransparency.css';
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
} from './MR2ProcessTransparency.utils';

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
}

export type ViewMode = 'timeline' | 'diff' | 'reasoning' | 'comparison' | 'metrics';

interface MR2Props {
  versions: InteractionVersion[];
  sessionId?: string;
  onVersionSelect?: (version: InteractionVersion) => void;
  onExport?: (data: any) => void;
  onRevert?: (versionId: string) => void;
  showTimeline?: boolean;
  autoTrack?: boolean;
}

export const MR2ProcessTransparency: React.FC<MR2Props> = ({
  versions,
  sessionId = 'session-' + Date.now(),
  onVersionSelect,
  onExport,
  onRevert,
  showTimeline = true,
  autoTrack = true
}) => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions.length > 0 ? versions[versions.length - 1].id : ''
  );
  const [comparisonVersionIds, setComparisonVersionIds] = useState<[string, string] | null>(null);
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(new Set());
  const [diffs, setDiffs] = useState<DiffChange[]>([]);
  const [chainOfThought, setChainOfThought] = useState<ChainOfThoughtStep[]>([]);

  /**
   * Handle version selection
   */
  const handleVersionSelect = useCallback(
    (versionId: string, switchToView?: ViewMode) => {
      setSelectedVersionId(versionId);
      const selectedVersion = versions.find(v => v.id === versionId);

      if (selectedVersion) {
        // Generate diff from previous version
        if (versions.length > 1) {
          const versionIndex = versions.findIndex(v => v.id === versionId);
          if (versionIndex > 0) {
            const prevVersion = versions[versionIndex - 1];
            const diffResult = generateDiff(prevVersion.aiOutput, selectedVersion.aiOutput);
            setDiffs(diffResult);
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
   * Render timeline view
   */
  const renderTimelineView = () => {
    const timeline = createTimeline(versions);

    return (
      <div className="mr2-timeline-view">
        <h2>📅 Interaction Timeline</h2>

        <div className="mr2-timeline">
          {timeline.map((event, idx) => (
            <div key={idx} className="mr2-timeline-event">
              <div className="mr2-timeline-marker">
                <div className="mr2-marker-dot" />
              </div>

              <div className="mr2-timeline-content">
                <div className="mr2-event-header">
                  <h3 className="mr2-event-title">
                    {event.eventType === 'prompt' ? '🎯' : '💭'} {event.title}
                  </h3>
                  <time className="mr2-event-time">{event.formattedTime}</time>
                </div>

                <p className="mr2-event-description">{event.description}</p>

                {event.changes && (
                  <div className="mr2-event-changes">
                    <span className="mr2-change-badge mr2-change-added">
                      +{event.changes.added}
                    </span>
                    <span className="mr2-change-badge mr2-change-removed">
                      -{event.changes.removed}
                    </span>
                    <span className="mr2-change-badge mr2-change-modified">
                      ~{event.changes.modified}
                    </span>
                  </div>
                )}

                {event.versionId && (
                  <button
                    className="mr2-btn-view"
                    onClick={() => handleVersionSelect(event.versionId!, 'diff')}
                    title="查看此版本的详细变更"
                  >
                    查看版本详情
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render diff view
   */
  const renderDiffView = () => {
    const selectedVersion = versions.find(v => v.id === selectedVersionId);
    if (!selectedVersion || diffs.length === 0) {
      return (
        <div className="mr2-empty-state">
          <p>Select a version to view changes</p>
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
                  <div className="mr2-diff-text mr2-text-added">+ {diff.content}</div>
                )}
                {diff.type === 'remove' && (
                  <div className="mr2-diff-text mr2-text-removed">- {diff.content}</div>
                )}
                {diff.type === 'modify' && (
                  <div className="mr2-diff-text mr2-text-modified">
                    <div className="mr2-old-text">- {diff.oldContent}</div>
                    <div className="mr2-new-text">+ {diff.content}</div>
                  </div>
                )}
              </div>

              {diff.context && (
                <div className="mr2-diff-context">
                  <em>Context: {diff.context}</em>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render reasoning/chain-of-thought view
   */
  const renderReasoningView = () => {
    const selectedVersion = versions.find(v => v.id === selectedVersionId);

    if (!selectedVersion?.reasoning) {
      return (
        <div className="mr2-empty-state">
          <p>No reasoning available for this version</p>
        </div>
      );
    }

    return (
      <div className="mr2-reasoning-view">
        <h2>🧠 Thinking Process</h2>

        {chainOfThought.length > 0 ? (
          <div className="mr2-chain-of-thought">
            {chainOfThought.map((step, idx) => (
              <div key={idx} className="mr2-cot-step">
                <button
                  className="mr2-cot-header"
                  onClick={() => handleToggleReason(idx)}
                  aria-expanded={expandedReasons.has(idx)}
                >
                  <span className="mr2-cot-step-num">Step {idx + 1}</span>
                  <span className="mr2-cot-step-type">{step.type}</span>
                  <span className="mr2-cot-toggle">
                    {expandedReasons.has(idx) ? '▼' : '▶'}
                  </span>
                </button>

                {expandedReasons.has(idx) && (
                  <div className="mr2-cot-content">
                    <p className="mr2-cot-text">{step.reasoning}</p>
                    {step.confidence && (
                      <div className="mr2-cot-confidence">
                        Confidence: {(step.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mr2-raw-reasoning">
            <p>{selectedVersion.reasoning}</p>
          </div>
        )}
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
            className={`mr2-version-selector ${selectedVersionId === v1Id ? 'active' : ''}`}
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
            className={`mr2-version-selector ${selectedVersionId === v2Id ? 'active' : ''}`}
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
   * Render version selector sidebar
   */
  const renderVersionSelector = () => {
    return (
      <div className="mr2-version-selector-panel">
        <h3>Versions</h3>
        <div className="mr2-version-list">
          {versions.map((version, idx) => (
            <button
              key={version.id}
              className={`mr2-version-item ${selectedVersionId === version.id ? 'active' : ''}`}
              onClick={() => handleVersionSelect(version.id)}
              title={`Version ${version.promptVersion}: ${version.modelName}`}
            >
              <span className="mr2-version-num">v{version.promptVersion}</span>
              <span className="mr2-version-time">
                {new Date(version.timestamp).toLocaleTimeString()}
              </span>
              {version.confidenceScore !== undefined && (
                <span
                  className={`mr2-version-confidence mr2-conf-${Math.round(version.confidenceScore * 10) * 10}`}
                  title={`AI置信度评分：${(version.confidenceScore * 100).toFixed(0)}%（基于模型输出的确定性）`}
                >
                  {(version.confidenceScore * 100).toFixed(0)}%
                </span>
              )}
            </button>
          ))}
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
        <h1 className="mr2-title">📊 Process Transparency</h1>
        <p className="mr2-subtitle">Track how outputs evolved through iterations</p>

        <div className="mr2-view-tabs">
          {(['timeline', 'diff', 'reasoning', 'comparison', 'metrics'] as const).map(mode => (
            <button
              key={mode}
              className={`mr2-tab ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'timeline' && '📅 Timeline'}
              {mode === 'diff' && '📝 Changes'}
              {mode === 'reasoning' && '🧠 Reasoning'}
              {mode === 'comparison' && '⚖️ Compare'}
              {mode === 'metrics' && '📊 Metrics'}
            </button>
          ))}
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
        {versions.length > 1 && renderVersionSelector()}

        <div className="mr2-main-view">
          {viewMode === 'timeline' && renderTimelineView()}
          {viewMode === 'diff' && renderDiffView()}
          {viewMode === 'reasoning' && renderReasoningView()}
          {viewMode === 'comparison' && renderComparisonView()}
          {viewMode === 'metrics' && renderMetricsView()}
        </div>
      </div>
    </div>
  );
};

export default MR2ProcessTransparency;
