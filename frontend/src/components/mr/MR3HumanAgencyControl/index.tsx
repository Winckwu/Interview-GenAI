/**
 * MR3: Human Agency Control Component
 *
 * Ensures users maintain decision-making autonomy in AI-assisted workflows.
 * Key features:
 * 1. Intervention intensity control (Passive → Suggestive → Proactive)
 * 2. Explicit consent mechanism for AI suggestions
 * 3. "Continue without AI" options throughout
 * 4. Session pause and human-only version saving
 *
 * Evidence: 27/49 users (55%) fear AI over-intervention erodes autonomy
 * Design principle: AI as tool, not replacement; human-led decision-making
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './styles.css';
import {
  getInterventionLabel,
  calculateAIAgencyRisk,
  formatTimestamp,
  storeHumanVersionSnapshot,
  retrieveHumanVersionHistory
} from './utils';

export type InterventionLevel = 'passive' | 'suggestive' | 'proactive';

/**
 * AI Suggestion object that requires explicit approval
 */
export interface AISuggestion {
  id: string;
  type: 'content' | 'structure' | 'recommendation' | 'correction';
  content: string;
  context: string;
  confidence: number;
  timestamp: Date;
  approved: boolean;
  rejected: boolean;
  userModification?: string;
}

/**
 * User agency preferences and state
 */
export interface AgencyState {
  interventionLevel: InterventionLevel;
  aiSessionPaused: boolean;
  sessionStartTime: Date;
  suggestionsReceived: number;
  suggestionsApproved: number;
  suggestionsRejected: number;
  humanVersionSaved: boolean;
  lastInteractionTime: Date;
}

/**
 * Main component for Human Agency Control
 */
interface MR3Props {
  onInterventionChange?: (level: InterventionLevel) => void;
  onAIPause?: (paused: boolean) => void;
  onContinueWithoutAI?: () => void;
  onSaveHumanVersion?: (versionData: any) => void;
  currentContent?: string;
  currentWorkSessionId?: string;
  onSuggestionApproval?: (suggestion: AISuggestion) => void;
}

export const MR3HumanAgencyControl: React.FC<MR3Props> = ({
  onInterventionChange,
  onAIPause,
  onContinueWithoutAI,
  onSaveHumanVersion,
  currentContent = '',
  currentWorkSessionId = 'session-' + Date.now(),
  onSuggestionApproval
}) => {
  // State management
  const [agencyState, setAgencyState] = useState<AgencyState>({
    interventionLevel: 'suggestive',
    aiSessionPaused: false,
    sessionStartTime: new Date(),
    suggestionsReceived: 0,
    suggestionsApproved: 0,
    suggestionsRejected: 0,
    humanVersionSaved: false,
    lastInteractionTime: new Date()
  });

  const [pendingSuggestions, setPendingSuggestions] = useState<AISuggestion[]>([]);
  const [showAgencyPanel, setShowAgencyPanel] = useState(true);
  const [showHumanVersionHistory, setShowHumanVersionHistory] = useState(false);
  const [humanVersionHistory, setHumanVersionHistory] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    action: 'pause' | 'exit' | 'save' | null;
    message: string;
  }>({ action: null, message: '' });

  // Refs for tracking
  const sessionRef = useRef<{
    startTime: Date;
    totalAISuggestions: number;
    userInterventions: number;
    agencyScores: number[];
  }>({
    startTime: new Date(),
    totalAISuggestions: 0,
    userInterventions: 0,
    agencyScores: []
  });

  // Load human version history on mount
  useEffect(() => {
    const history = retrieveHumanVersionHistory(currentWorkSessionId);
    setHumanVersionHistory(history);
  }, [currentWorkSessionId]);

  /**
   * Update intervention level
   */
  const handleInterventionLevelChange = useCallback((level: InterventionLevel) => {
    setAgencyState(prev => ({
      ...prev,
      interventionLevel: level,
      lastInteractionTime: new Date()
    }));

    if (onInterventionChange) {
      onInterventionChange(level);
    }

    // Log agency intervention
    sessionRef.current.userInterventions++;
  }, [onInterventionChange]);

  /**
   * Toggle AI session pause
   */
  const handleTogglePause = useCallback(() => {
    const newPausedState = !agencyState.aiSessionPaused;

    setShowConfirmDialog(true);
    setDialogContent({
      action: 'pause',
      message: newPausedState
        ? 'Pause AI assistance? You can continue working independently or resume AI help anytime.'
        : 'Resume AI assistance?'
    });
  }, [agencyState.aiSessionPaused]);

  /**
   * Confirm pause/resume
   */
  const confirmPause = () => {
    setAgencyState(prev => ({
      ...prev,
      aiSessionPaused: !prev.aiSessionPaused,
      lastInteractionTime: new Date()
    }));

    if (onAIPause) {
      onAIPause(!agencyState.aiSessionPaused);
    }

    setShowConfirmDialog(false);
    sessionRef.current.userInterventions++;
  };

  /**
   * Handle "Continue without AI" action
   */
  const handleContinueWithoutAI = useCallback(() => {
    setShowConfirmDialog(true);
    setDialogContent({
      action: 'exit',
      message: 'Continue without AI? This will disable all AI features for the current task. You can re-enable AI anytime.'
    });
  }, []);

  /**
   * Confirm continue without AI
   */
  const confirmContinueWithoutAI = () => {
    // Save human-only version first
    storeHumanVersionSnapshot({
      sessionId: currentWorkSessionId,
      content: currentContent,
      timestamp: new Date(),
      interventionLevel: agencyState.interventionLevel,
      reason: 'user-chose-ai-free'
    });

    setAgencyState(prev => ({
      ...prev,
      humanVersionSaved: true,
      lastInteractionTime: new Date()
    }));

    if (onContinueWithoutAI) {
      onContinueWithoutAI();
    }

    setShowConfirmDialog(false);
    sessionRef.current.userInterventions++;
  };

  /**
   * Save human-only version (checkpoint)
   */
  const handleSaveHumanVersion = useCallback(() => {
    setShowConfirmDialog(true);
    setDialogContent({
      action: 'save',
      message: 'Save current work as human-only version? This creates a checkpoint of your independent work.'
    });
  }, []);

  /**
   * Confirm save human version
   */
  const confirmSaveHumanVersion = () => {
    const versionData = {
      sessionId: currentWorkSessionId,
      content: currentContent,
      timestamp: new Date(),
      interventionLevel: agencyState.interventionLevel,
      reason: 'user-requested-checkpoint'
    };

    storeHumanVersionSnapshot(versionData);
    setAgencyState(prev => ({
      ...prev,
      humanVersionSaved: true,
      lastInteractionTime: new Date()
    }));

    if (onSaveHumanVersion) {
      onSaveHumanVersion(versionData);
    }

    // Refresh history
    const history = retrieveHumanVersionHistory(currentWorkSessionId);
    setHumanVersionHistory(history);

    setShowConfirmDialog(false);
    sessionRef.current.userInterventions++;
  };

  /**
   * Approve an AI suggestion
   */
  const handleApproveSuggestion = useCallback((suggestion: AISuggestion) => {
    const updatedSuggestion = { ...suggestion, approved: true, rejected: false };

    // Update local state
    setPendingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

    // Update agency state
    setAgencyState(prev => ({
      ...prev,
      suggestionsApproved: prev.suggestionsApproved + 1,
      lastInteractionTime: new Date()
    }));

    if (onSuggestionApproval) {
      onSuggestionApproval(updatedSuggestion);
    }

    sessionRef.current.userInterventions++;
  }, [onSuggestionApproval]);

  /**
   * Reject an AI suggestion
   */
  const handleRejectSuggestion = useCallback((suggestion: AISuggestion) => {
    const updatedSuggestion = { ...suggestion, approved: false, rejected: true };

    // Update local state
    setPendingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

    // Update agency state
    setAgencyState(prev => ({
      ...prev,
      suggestionsRejected: prev.suggestionsRejected + 1,
      lastInteractionTime: new Date()
    }));

    sessionRef.current.userInterventions++;
  }, []);

  /**
   * Render intervention intensity slider
   */
  const renderInterventionControl = () => {
    const levels: InterventionLevel[] = ['passive', 'suggestive', 'proactive'];
    const descriptions = {
      passive: 'Show suggestions only when requested',
      suggestive: 'Offer suggestions, wait for your approval',
      proactive: 'AI actively intervenes with frequent suggestions'
    };

    // Check if current level is not the default (suggestive)
    const isOverrideActive = agencyState.interventionLevel !== 'suggestive';

    return (
      <div className="mr3-intervention-control">
        <h3 className="mr3-control-title">AI Intervention Level</h3>

        <div className="mr3-slider-container">
          <div className="mr3-slider-labels">
            <span className="mr3-label-left">🤐 Passive</span>
            <span className="mr3-label-right">🚀 Proactive</span>
          </div>

          <input
            type="range"
            min="0"
            max="2"
            value={levels.indexOf(agencyState.interventionLevel)}
            onChange={(e) =>
              handleInterventionLevelChange(levels[parseInt(e.target.value)])
            }
            className="mr3-slider"
            aria-label="AI intervention level"
          />

          <div className="mr3-level-indicators">
            {levels.map((level, idx) => (
              <div
                key={level}
                className={`mr3-level-indicator ${agencyState.interventionLevel === level ? 'active' : ''}`}
                onClick={() => handleInterventionLevelChange(level)}
              >
                <div className="mr3-indicator-label">{level}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mr3-description">
          {descriptions[agencyState.interventionLevel]}
        </p>

        {/* Override hint - shows when not using default (suggestive) level */}
        {isOverrideActive && (
          <div className="mr3-override-hint">
            <span className="mr3-override-icon">⚙️</span>
            <span className="mr3-override-text">
              Manual override active - this setting overrides automatic recommendation behavior
            </span>
            <button
              className="mr3-override-reset"
              onClick={() => handleInterventionLevelChange('suggestive')}
              title="Reset to default (Suggestive)"
              aria-label="Reset to default intervention level"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render pending suggestions
   */
  const renderPendingSuggestions = () => {
    if (pendingSuggestions.length === 0) {
      return (
        <div className="mr3-no-suggestions">
          <p>No pending AI suggestions</p>
        </div>
      );
    }

    return (
      <div className="mr3-suggestions-container">
        {pendingSuggestions.map(suggestion => (
          <div key={suggestion.id} className={`mr3-suggestion mr3-suggestion-${suggestion.type}`}>
            <div className="mr3-suggestion-header">
              <span className="mr3-suggestion-type">{suggestion.type}</span>
              <span className="mr3-suggestion-confidence">
                {(suggestion.confidence * 100).toFixed(0)}% confident
              </span>
            </div>

            <div className="mr3-suggestion-context">
              <p className="mr3-context-label">Context:</p>
              <p className="mr3-context-text">{suggestion.context}</p>
            </div>

            <div className="mr3-suggestion-content">
              <p className="mr3-content-label">Suggestion:</p>
              <p className="mr3-content-text">{suggestion.content}</p>
            </div>

            <div className="mr3-suggestion-actions">
              <button
                className="mr3-btn-approve"
                onClick={() => handleApproveSuggestion(suggestion)}
                aria-label="Approve suggestion"
              >
                ✓ Approve
              </button>
              <button
                className="mr3-btn-reject"
                onClick={() => handleRejectSuggestion(suggestion)}
                aria-label="Reject suggestion"
              >
                ✗ Reject
              </button>
              <button
                className="mr3-btn-modify"
                aria-label="Modify and approve suggestion"
              >
                ✎ Modify
              </button>
            </div>

            <div className="mr3-suggestion-timestamp">
              {formatTimestamp(suggestion.timestamp)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render session pause control
   */
  const renderSessionControl = () => {
    return (
      <div className="mr3-session-control">
        <button
          className={`mr3-btn-pause ${agencyState.aiSessionPaused ? 'paused' : ''}`}
          onClick={handleTogglePause}
          aria-pressed={agencyState.aiSessionPaused}
        >
          {agencyState.aiSessionPaused ? '⏯️ Resume AI' : '⏸️ Pause AI'}
        </button>

        <div className="mr3-session-info">
          <p className="mr3-session-duration">
            Session duration: {formatSessionDuration(agencyState.sessionStartTime)}
          </p>
          {agencyState.aiSessionPaused && (
            <p className="mr3-pause-notice">🔇 AI assistance is currently paused</p>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render human-only version controls
   */
  const renderHumanVersionControls = () => {
    return (
      <div className="mr3-human-version-controls">
        <h3 className="mr3-control-title">Human-Only Version</h3>

        <div className="mr3-version-buttons">
          <button
            className="mr3-btn-save-version"
            onClick={handleSaveHumanVersion}
            title="Save current work as human-only checkpoint"
          >
            💾 Save Human-Only Version
          </button>

          {humanVersionHistory.length > 0 && (
            <button
              className="mr3-btn-view-history"
              onClick={() => setShowHumanVersionHistory(!showHumanVersionHistory)}
            >
              📋 View History ({humanVersionHistory.length})
            </button>
          )}
        </div>

        {showHumanVersionHistory && humanVersionHistory.length > 0 && (
          <div className="mr3-version-history">
            <h4>Human-Only Version History</h4>
            <div className="mr3-history-list">
              {humanVersionHistory.map((version, idx) => (
                <div key={idx} className="mr3-history-item">
                  <div className="mr3-history-timestamp">
                    {new Date(version.timestamp).toLocaleString()}
                  </div>
                  <div className="mr3-history-reason">{version.reason}</div>
                  <button
                    className="mr3-btn-restore"
                    onClick={() => {
                      // Emit restore event
                      if (onSaveHumanVersion) {
                        onSaveHumanVersion({ ...version, action: 'restore' });
                      }
                    }}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render exit option
   */
  const renderExitOption = () => {
    return (
      <div className="mr3-exit-option">
        <button
          className="mr3-btn-exit"
          onClick={handleContinueWithoutAI}
          title="Continue working without AI assistance"
        >
          🚶 Continue Without AI
        </button>
        <p className="mr3-exit-description">
          You can always re-enable AI assistance later
        </p>
      </div>
    );
  };

  /**
   * Render confirmation dialog
   */
  const renderConfirmDialog = () => {
    if (!showConfirmDialog) return null;

    return (
      <div className="mr3-dialog-overlay" onClick={() => setShowConfirmDialog(false)}>
        <div className="mr3-dialog" onClick={(e) => e.stopPropagation()}>
          <h3 className="mr3-dialog-title">Confirm Action</h3>
          <p className="mr3-dialog-message">{dialogContent.message}</p>

          <div className="mr3-dialog-actions">
            <button
              className="mr3-btn-cancel"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </button>
            <button
              className="mr3-btn-confirm"
              onClick={() => {
                if (dialogContent.action === 'pause') {
                  confirmPause();
                } else if (dialogContent.action === 'exit') {
                  confirmContinueWithoutAI();
                } else if (dialogContent.action === 'save') {
                  confirmSaveHumanVersion();
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render agency metrics
   */
  const renderMetrics = () => {
    const agencyScore = calculateAIAgencyRisk(
      agencyState.suggestionsApproved,
      agencyState.suggestionsRejected
    );

    const acceptanceRate =
      agencyState.suggestionsReceived > 0
        ? (agencyState.suggestionsApproved / agencyState.suggestionsReceived * 100).toFixed(0)
        : 0;

    return (
      <div className="mr3-metrics">
        <h3 className="mr3-metrics-title">Session Metrics</h3>

        <div className="mr3-metrics-grid">
          <div className="mr3-metric">
            <div className="mr3-metric-label">Suggestions Received</div>
            <div className="mr3-metric-value">{agencyState.suggestionsReceived}</div>
          </div>

          <div className="mr3-metric">
            <div className="mr3-metric-label">Approved</div>
            <div className="mr3-metric-value mr3-value-positive">
              {agencyState.suggestionsApproved}
            </div>
          </div>

          <div className="mr3-metric">
            <div className="mr3-metric-label">Rejected</div>
            <div className="mr3-metric-value mr3-value-neutral">
              {agencyState.suggestionsRejected}
            </div>
          </div>

          <div className="mr3-metric">
            <div className="mr3-metric-label">Acceptance Rate</div>
            <div className="mr3-metric-value">{acceptanceRate}%</div>
          </div>

          <div className="mr3-metric">
            <div className="mr3-metric-label">Agency Score</div>
            <div className={`mr3-metric-value mr3-agency-${agencyScore.level}`}>
              {agencyScore.score.toFixed(2)}
            </div>
          </div>

          <div className="mr3-metric">
            <div className="mr3-metric-label">Control Interventions</div>
            <div className="mr3-metric-value">
              {sessionRef.current.userInterventions}
            </div>
          </div>
        </div>

        <div className="mr3-agency-indicator">
          <p className="mr3-indicator-label">{getInterventionLabel(agencyState.interventionLevel)}</p>
          <div className="mr3-indicator-bar">
            <div
              className="mr3-indicator-fill"
              style={{
                width: `${((2 - ['passive', 'suggestive', 'proactive'].indexOf(agencyState.interventionLevel)) / 2) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  /**
   * Main render
   */
  return (
    <div className="mr3-container">
      <div className="mr3-header">
        <h2 className="mr3-title">🎛️ Human Agency Control</h2>
        <button
          className="mr3-toggle-panel"
          onClick={() => setShowAgencyPanel(!showAgencyPanel)}
          aria-label="Toggle panel"
        >
          {showAgencyPanel ? '▼' : '▶'}
        </button>
      </div>

      {showAgencyPanel && (
        <div className="mr3-panel">
          {/* Intervention Control */}
          {renderInterventionControl()}

          <div className="mr3-divider" />

          {/* Pending Suggestions */}
          <div className="mr3-suggestions-section">
            <h3 className="mr3-control-title">Pending AI Suggestions</h3>
            {renderPendingSuggestions()}
          </div>

          <div className="mr3-divider" />

          {/* Session Control */}
          {renderSessionControl()}

          <div className="mr3-divider" />

          {/* Human Version Controls */}
          {renderHumanVersionControls()}

          <div className="mr3-divider" />

          {/* Exit Option */}
          {renderExitOption()}

          <div className="mr3-divider" />

          {/* Metrics */}
          {renderMetrics()}
        </div>
      )}

      {/* Confirmation Dialog */}
      {renderConfirmDialog()}

      {/* Floating Action Buttons */}
      <div className="mr3-floating-controls">
        <button
          className="mr3-fab-pause"
          onClick={handleTogglePause}
          title={agencyState.aiSessionPaused ? 'Resume AI' : 'Pause AI'}
          aria-label={agencyState.aiSessionPaused ? 'Resume AI' : 'Pause AI'}
        >
          {agencyState.aiSessionPaused ? '⏯️' : '⏸️'}
        </button>
        <button
          className="mr3-fab-exit"
          onClick={handleContinueWithoutAI}
          title="Continue without AI"
          aria-label="Continue without AI"
        >
          🚶
        </button>
      </div>
    </div>
  );
};

/**
 * Helper function to format session duration
 */
function formatSessionDuration(startTime: Date): string {
  const now = new Date();
  const diff = now.getTime() - startTime.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const secs = Math.floor((diff % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default MR3HumanAgencyControl;
