/**
 * MR1: Task Decomposition Scaffold Component
 *
 * Helps users break complex tasks into manageable subtasks with:
 * 1. Multi-dimensional analysis (scope, dependencies, verification)
 * 2. Adaptive scaffolding (reduces support as competence increases)
 * 3. User modification interface (suggestions ≠ requirements)
 * 4. Decomposition history tracking
 * 5. Prevents AI over-decomposition (maintains human planning authority)
 *
 * Evidence: 22/49 users (45%) show decomposition ability, 17/49 (35%) feel difficulty with complex tasks
 * Design principle: System suggests decomposition, users review and approve, maintain planning control
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './styles.css';
import {
  generateInitialDecomposition,
  analyzeTaskDimensions,
  calculateScaffoldLevel,
  validateDecomposition
} from './utils';
import type {
  SubtaskItem,
  DecompositionStrategy,
  TaskDecomposition,
  DecompositionDimension
} from './types';

// Re-export types for external consumers
export type {
  SubtaskItem,
  DecompositionStrategy,
  TaskDecomposition,
  DecompositionDimension
};

// Storage key prefix for persisting MR1 state (session-specific)
const MR1_STORAGE_KEY_PREFIX = 'mr1-decomposition-state';

// Helper to get session-specific storage key
const getStorageKey = (sessionId?: string) =>
  sessionId ? `${MR1_STORAGE_KEY_PREFIX}-${sessionId}` : MR1_STORAGE_KEY_PREFIX;

interface DecompositionState {
  originalTask: string;
  suggestedSubtasks: SubtaskItem[];
  userModifiedSubtasks: SubtaskItem[];
  decompositionStrategy: DecompositionStrategy;
  allApproved: boolean;
  scaffoldLevel: 'high' | 'medium' | 'low';
}

interface PersistedMR1State {
  state: DecompositionState;
  step: 'input' | 'analysis' | 'decomposition' | 'review' | 'complete';
  dimensions: DecompositionDimension[];
  decompositionHistory: TaskDecomposition[];
  timestamp: number;
}

/**
 * Load persisted state from sessionStorage
 */
function loadPersistedState(sessionId?: string): PersistedMR1State | null {
  try {
    const key = getStorageKey(sessionId);
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as PersistedMR1State;
      // Only restore if saved within last 30 minutes
      if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        console.log('[MR1] Restored persisted state from:', key);
        return parsed;
      } else {
        console.log('[MR1] Persisted state expired, clearing:', key);
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('[MR1] Failed to load persisted state:', e);
  }
  return null;
}

/**
 * Save state to sessionStorage
 */
function savePersistedState(sessionId: string | undefined, data: Omit<PersistedMR1State, 'timestamp'>) {
  try {
    const key = getStorageKey(sessionId);
    sessionStorage.setItem(key, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('[MR1] Failed to save state:', e);
  }
}

interface MR1Props {
  sessionId?: string; // Session ID for persistence
  onDecompositionComplete?: (decomposition: TaskDecomposition) => void;
  onTaskAnalyzed?: (dimensions: DecompositionDimension[]) => void;
  onStrategySelected?: (strategy: DecompositionStrategy) => void;
  initialTask?: string;
  onHistoryChange?: (history: TaskDecomposition[]) => void;
  onOpenMR4?: () => void; // NEW: Callback to open MR4 role definition
}

export const MR1TaskDecompositionScaffold: React.FC<MR1Props> = ({
  sessionId,
  onDecompositionComplete,
  onTaskAnalyzed,
  onStrategySelected,
  initialTask = '',
  onHistoryChange,
  onOpenMR4
}) => {
  // Try to load persisted state on initial mount (session-specific)
  const persistedState = useRef(loadPersistedState(sessionId));

  // State management - restore from persisted state if available
  const [state, setState] = useState<DecompositionState>(() => {
    if (persistedState.current?.state) {
      return persistedState.current.state;
    }
    return {
      originalTask: initialTask,
      suggestedSubtasks: [],
      userModifiedSubtasks: [],
      decompositionStrategy: 'sequential',
      allApproved: false,
      scaffoldLevel: 'medium'
    };
  });

  const [step, setStep] = useState<'input' | 'analysis' | 'decomposition' | 'review' | 'complete'>(() => {
    if (persistedState.current?.step) {
      return persistedState.current.step;
    }
    return initialTask ? 'analysis' : 'input';
  });

  const [dimensions, setDimensions] = useState<DecompositionDimension[]>(() =>
    persistedState.current?.dimensions || []
  );
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [decompositionHistory, setDecompositionHistory] = useState<TaskDecomposition[]>(() =>
    persistedState.current?.decompositionHistory || []
  );
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const historyRef = useRef<TaskDecomposition[]>(persistedState.current?.decompositionHistory || []);

  // Persist state whenever it changes
  useEffect(() => {
    // Don't persist if we're at the initial empty state
    if (step === 'input' && !state.originalTask.trim()) {
      return;
    }

    savePersistedState(sessionId, {
      state,
      step,
      dimensions,
      decompositionHistory
    });
  }, [sessionId, state, step, dimensions, decompositionHistory]);

  /**
   * Step 1: Analyze task input
   */
  const handleAnalyzeTask = useCallback(async () => {
    if (!state.originalTask.trim()) {
      alert('Please enter a task description');
      return;
    }

    setIsLoading(true);
    try {
      // Analyze task dimensions
      const analyzed = await analyzeTaskDimensions(state.originalTask);
      setDimensions(analyzed);

      if (onTaskAnalyzed) {
        onTaskAnalyzed(analyzed);
      }

      setStep('decomposition');
    } catch (error) {
      console.error('[MR1] Failed to analyze task:', error);
      alert('Failed to analyze task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [state.originalTask, onTaskAnalyzed]);

  /**
   * Step 2: Generate initial decomposition
   */
  const handleGenerateDecomposition = useCallback(async () => {
    setIsLoading(true);
    try {
      const decomposed = await generateInitialDecomposition(
        state.originalTask,
        state.decompositionStrategy
      );

      setState(prev => ({
        ...prev,
        suggestedSubtasks: decomposed.suggestedSubtasks,
        scaffoldLevel: calculateScaffoldLevel(decomposed.suggestedSubtasks)
      }));

      setStep('review');
    } catch (error) {
      console.error('[MR1] Failed to generate decomposition:', error);
      alert('Failed to generate decomposition. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [state.originalTask, state.decompositionStrategy]);

  /**
   * Handle strategy selection
   */
  const handleStrategySelect = useCallback((strategy: DecompositionStrategy) => {
    setState(prev => ({
      ...prev,
      decompositionStrategy: strategy
    }));

    if (onStrategySelected) {
      onStrategySelected(strategy);
    }
  }, [onStrategySelected]);

  /**
   * Approve a suggested subtask
   */
  const handleApproveSubtask = useCallback((subtaskId: string) => {
    setState(prev => ({
      ...prev,
      userModifiedSubtasks: [
        ...prev.userModifiedSubtasks,
        prev.suggestedSubtasks.find(s => s.id === subtaskId)!
      ],
      suggestedSubtasks: prev.suggestedSubtasks.filter(s => s.id !== subtaskId)
    }));
  }, []);

  /**
   * Modify and approve a subtask
   */
  const handleModifySubtask = useCallback(
    (subtaskId: string, modification: string) => {
      const subtask = state.suggestedSubtasks.find(s => s.id === subtaskId);
      if (!subtask) return;

      const modified: SubtaskItem = {
        ...subtask,
        description: modification,
        userApproved: true,
        userModification: modification
      };

      setState(prev => ({
        ...prev,
        userModifiedSubtasks: [...prev.userModifiedSubtasks, modified],
        suggestedSubtasks: prev.suggestedSubtasks.filter(s => s.id !== subtaskId)
      }));

      setEditingSubtaskId(null);
    },
    [state.suggestedSubtasks]
  );

  /**
   * Reject a suggested subtask
   */
  const handleRejectSubtask = useCallback((subtaskId: string) => {
    setState(prev => ({
      ...prev,
      suggestedSubtasks: prev.suggestedSubtasks.filter(s => s.id !== subtaskId)
    }));
  }, []);

  /**
   * Reset to start a new decomposition
   */
  const handleReset = useCallback(() => {
    // Clear persisted state (session-specific)
    sessionStorage.removeItem(getStorageKey(sessionId));

    // Reset all state
    setState({
      originalTask: '',
      suggestedSubtasks: [],
      userModifiedSubtasks: [],
      decompositionStrategy: 'sequential',
      allApproved: false,
      scaffoldLevel: 'medium'
    });
    setStep('input');
    setDimensions([]);
    setEditingSubtaskId(null);
  }, [sessionId]);

  /**
   * Complete decomposition
   */
  const handleComplete = useCallback(() => {
    const decomposition: TaskDecomposition = {
      originalTask: state.originalTask,
      suggestedSubtasks: state.userModifiedSubtasks,
      decompositionStrategy: state.decompositionStrategy,
      userModifications: state.userModifiedSubtasks
        .filter(s => s.userModification)
        .map(s => s.userModification!)
    };

    // Save to history
    historyRef.current = [...historyRef.current, decomposition];
    setDecompositionHistory(historyRef.current);

    if (onDecompositionComplete) {
      onDecompositionComplete(decomposition);
    }

    if (onHistoryChange) {
      onHistoryChange(historyRef.current);
    }

    setStep('complete');
  }, [state, onDecompositionComplete, onHistoryChange]);

  /**
   * Render step 1: Task input
   */
  const renderTaskInput = () => (
    <div className="mr1-step mr1-step-input">
      <h2>📋 Describe Your Task</h2>
      <p>
        Explain what you need to accomplish. Be as detailed as possible - include context, goals,
        and any constraints.
      </p>

      <textarea
        className="mr1-task-input"
        placeholder="Enter your complex task here... For example: 'Implement a user authentication system with email verification, password reset, and two-factor authentication for our React application'"
        value={state.originalTask}
        onChange={e => setState(prev => ({ ...prev, originalTask: e.target.value }))}
        aria-label="Task description"
      />

      <div className="mr1-input-info">
        <p className="mr1-char-count">{state.originalTask.length} characters</p>
        <button
          className="mr1-btn-analyze"
          onClick={handleAnalyzeTask}
          disabled={!state.originalTask.trim() || isLoading}
        >
          {isLoading ? '⏳ Analyzing...' : '🔍 Analyze Task'}
        </button>
      </div>
    </div>
  );

  /**
   * Render step 2: Task dimensions analysis
   */
  const renderTaskAnalysis = () => (
    <div className="mr1-step mr1-step-analysis">
      <h2>📊 Task Analysis</h2>

      {dimensions.length > 0 ? (
        <div className="mr1-dimensions-grid">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="mr1-dimension-card">
              <h3 className="mr1-dimension-title">{dim.name}</h3>
              <p className="mr1-dimension-value">{dim.value}</p>
              {dim.analysis && <p className="mr1-dimension-analysis">{dim.analysis}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="mr1-loading">Analyzing task dimensions...</p>
      )}

      <div className="mr1-strategy-selection">
        <h3>Decomposition Strategy</h3>
        <div className="mr1-strategy-options">
          {(['sequential', 'parallel', 'hierarchical'] as const).map(strategy => (
            <button
              key={strategy}
              className={`mr1-strategy-btn ${state.decompositionStrategy === strategy ? 'active' : ''}`}
              onClick={() => handleStrategySelect(strategy)}
              title={`${strategy}: ${getStrategyDescription(strategy)}`}
            >
              {getStrategyIcon(strategy)} {strategy}
            </button>
          ))}
        </div>
        <p className="mr1-strategy-description">
          {getStrategyDescription(state.decompositionStrategy)}
        </p>
      </div>

      <button
        className="mr1-btn-decompose"
        onClick={handleGenerateDecomposition}
        disabled={isLoading}
      >
        {isLoading ? '⏳ Generating...' : '✂️ Generate Decomposition'}
      </button>
    </div>
  );

  /**
   * Render step 3: Review decomposition
   */
  const renderDecompositionReview = () => (
    <div className="mr1-step mr1-step-review">
      <h2>✅ Review Suggested Decomposition</h2>
      <p className="mr1-review-info">
        Review the suggested subtasks. You can approve, modify, or reject each one. Remember:
        these are suggestions - you have full control.
      </p>

      <div className="mr1-subtasks-section">
        <h3>Suggested Subtasks ({state.suggestedSubtasks.length})</h3>

        {state.suggestedSubtasks.length === 0 ? (
          <p className="mr1-no-subtasks">All subtasks reviewed</p>
        ) : (
          state.suggestedSubtasks.map((subtask, idx) => (
            <div key={subtask.id} className="mr1-subtask-card">
              <div className="mr1-subtask-header">
                <span className="mr1-subtask-number">{idx + 1}</span>
                <h4 className="mr1-subtask-title">{subtask.description}</h4>
              </div>

              <div className="mr1-subtask-details">
                {subtask.difficulty && (
                  <span className={`mr1-difficulty mr1-difficulty-${subtask.difficulty}`}>
                    {subtask.difficulty}
                  </span>
                )}
                {subtask.estimatedTime && (
                  <span className="mr1-estimate">⏱️ {subtask.estimatedTime}min</span>
                )}
              </div>

              {subtask.dependencies.length > 0 && (
                <div className="mr1-dependencies">
                  <strong>Depends on:</strong> {subtask.dependencies.join(', ')}
                </div>
              )}

              <div className="mr1-verification">
                <strong>How to verify:</strong>
                <p>{subtask.verificationMethod}</p>
              </div>

              <div className="mr1-subtask-actions">
                {editingSubtaskId === subtask.id ? (
                  <div className="mr1-edit-mode">
                    <input
                      type="text"
                      value={subtask.description}
                      onChange={e => {
                        // Update editing state
                      }}
                      className="mr1-edit-input"
                    />
                    <button
                      className="mr1-btn-save"
                      onClick={() =>
                        handleModifySubtask(subtask.id, subtask.description)
                      }
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="mr1-btn-approve"
                      onClick={() => handleApproveSubtask(subtask.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="mr1-btn-edit"
                      onClick={() => setEditingSubtaskId(subtask.id)}
                    >
                      ✎ Modify
                    </button>
                    <button
                      className="mr1-btn-reject"
                      onClick={() => handleRejectSubtask(subtask.id)}
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mr1-approved-subtasks">
        <h3>Approved Subtasks ({state.userModifiedSubtasks.length})</h3>
        <div className="mr1-approved-list">
          {state.userModifiedSubtasks.map((subtask, idx) => (
            <div key={subtask.id} className="mr1-approved-item">
              <span className="mr1-check">✓</span>
              <span className="mr1-approved-text">
                {idx + 1}. {subtask.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {state.suggestedSubtasks.length === 0 && state.userModifiedSubtasks.length > 0 && (
        <button className="mr1-btn-complete" onClick={handleComplete}>
          ✨ Complete Decomposition
        </button>
      )}
    </div>
  );

  /**
   * Render step 4: Completion summary
   */
  const renderCompletion = () => (
    <div className="mr1-step mr1-step-complete">
      <h2>🎉 Decomposition Complete</h2>

      <div className="mr1-summary">
        <div className="mr1-summary-item">
          <div className="mr1-summary-label">Original Task</div>
          <div className="mr1-summary-value">{state.originalTask}</div>
        </div>

        <div className="mr1-summary-item">
          <div className="mr1-summary-label">Subtasks Created</div>
          <div className="mr1-summary-value">{state.userModifiedSubtasks.length}</div>
        </div>

        <div className="mr1-summary-item">
          <div className="mr1-summary-label">Strategy</div>
          <div className="mr1-summary-value">{state.decompositionStrategy}</div>
        </div>

        <div className="mr1-summary-item">
          <div className="mr1-summary-label">User Modifications</div>
          <div className="mr1-summary-value">
            {state.userModifiedSubtasks.filter(s => s.userModification).length} subtasks
          </div>
        </div>
      </div>

      {/* MR Integration: Recommend role definition after decomposition */}
      {onOpenMR4 && (
        <div style={{
          backgroundColor: '#e0f2fe',
          border: '2px solid #0284c7',
          borderRadius: '0.5rem',
          padding: '1rem',
          margin: '1rem 0',
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#075985' }}>
            💡 Next Step: Define AI Roles
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
            Task decomposition complete! Now define what role(s) AI should play for each subtask (e.g., coding assistant, reviewer, tutor). This clarifies expectations and improves collaboration effectiveness.
          </p>
          <button
            onClick={onOpenMR4}
            style={{
              backgroundColor: '#0284c7',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
            title="Open AI Role Definition - Clarify AI's responsibilities in your task"
          >
            🎭 Define AI Roles (MR4)
          </button>
        </div>
      )}

      <div className="mr1-next-steps">
        <h3>Next Steps:</h3>
        <ol>
          <li>Review each subtask in detail</li>
          <li>Estimate time and effort for each</li>
          <li>Identify any additional dependencies</li>
          <li>Start with the first independent subtask</li>
          <li>Track progress as you complete each</li>
        </ol>
      </div>

      <div className="mr1-completion-actions">
        <button
          className="mr1-btn-new-task"
          onClick={() => {
            setState({
              originalTask: '',
              suggestedSubtasks: [],
              userModifiedSubtasks: [],
              decompositionStrategy: 'sequential',
              allApproved: false,
              scaffoldLevel: 'medium'
            });
            setStep('input');
          }}
        >
          ➕ Decompose Another Task
        </button>
        {decompositionHistory.length > 0 && (
          <button
            className="mr1-btn-history"
            onClick={() => setShowHistory(!showHistory)}
          >
            📋 View History ({decompositionHistory.length})
          </button>
        )}
      </div>

      {showHistory && (
        <div className="mr1-history-panel">
          <h3>Decomposition History</h3>
          {decompositionHistory.map((item, idx) => (
            <div key={idx} className="mr1-history-item">
              <strong>{idx + 1}. {item.originalTask}</strong>
              <p>{item.suggestedSubtasks.length} subtasks • {item.decompositionStrategy}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /**
   * Main render
   */
  return (
    <div className="mr1-container">
      <div className="mr1-header">
        <div className="mr1-header-top">
          <h1 className="mr1-title">✂️ Task Decomposition Scaffold</h1>
          {step !== 'input' && (
            <button className="mr1-btn-reset" onClick={handleReset} title="Start over with a new task">
              🔄 New Task
            </button>
          )}
        </div>
        <p className="mr1-subtitle">Break complex tasks into manageable subtasks</p>
        {persistedState.current && step !== 'input' && (
          <p className="mr1-restored-notice">📌 Restored your previous progress</p>
        )}
      </div>

      <div className="mr1-progress-bar">
        <div className={`mr1-progress-item mr1-progress-1 ${['input', 'analysis', 'decomposition', 'review', 'complete'].includes(step) ? 'mr1-progress-active' : ''}`}>
          <span className="mr1-step-label">Input</span>
        </div>
        <div className={`mr1-progress-item mr1-progress-2 ${['analysis', 'decomposition', 'review', 'complete'].includes(step) ? 'mr1-progress-active' : ''}`}>
          <span className="mr1-step-label">Analysis</span>
        </div>
        <div className={`mr1-progress-item mr1-progress-3 ${['decomposition', 'review', 'complete'].includes(step) ? 'mr1-progress-active' : ''}`}>
          <span className="mr1-step-label">Decompose</span>
        </div>
        <div className={`mr1-progress-item mr1-progress-4 ${['review', 'complete'].includes(step) ? 'mr1-progress-active' : ''}`}>
          <span className="mr1-step-label">Review</span>
        </div>
        <div className={`mr1-progress-item mr1-progress-5 ${step === 'complete' ? 'mr1-progress-active' : ''}`}>
          <span className="mr1-step-label">Complete</span>
        </div>
      </div>

      {step === 'input' && renderTaskInput()}
      {step === 'analysis' && renderTaskAnalysis()}
      {step === 'decomposition' && renderTaskAnalysis()}
      {step === 'review' && renderDecompositionReview()}
      {step === 'complete' && renderCompletion()}
    </div>
  );
};

/**
 * Helper: Get strategy icon
 */
function getStrategyIcon(strategy: DecompositionStrategy): string {
  const icons = {
    sequential: '→',
    parallel: '⇄',
    hierarchical: '↓'
  };
  return icons[strategy];
}

/**
 * Helper: Get strategy description
 */
function getStrategyDescription(strategy: DecompositionStrategy): string {
  const descriptions = {
    sequential:
      'Subtasks must be completed in order. Use when later steps depend on earlier ones.',
    parallel:
      'Subtasks can be done simultaneously. Use when tasks are independent and resources allow.',
    hierarchical:
      'Subtasks are nested in layers. Use for complex projects with multiple levels of detail.'
  };
  return descriptions[strategy];
}

export default MR1TaskDecompositionScaffold;
