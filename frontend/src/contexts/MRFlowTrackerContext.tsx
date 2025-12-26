/**
 * MR Flow Tracker Context
 *
 * Provides MR flow tracking capabilities to all MR components.
 * This context allows any MR component to report interactions
 * without prop drilling.
 *
 * Usage in MR components:
 * const { recordInteraction, recordApply, recordComplete } = useMRFlowTrackerContext();
 * recordInteraction('MR1', 'view_decomposition');
 */

import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';

// Flow states for each MR tool
export type MRFlowState = 'idle' | 'opened' | 'interacting' | 'applied' | 'completed' | 'abandoned';

export interface MRFlowSession {
  mrId: string;
  state: MRFlowState;
  openedAt: number;
  lastInteractionAt: number;
  closedAt?: number;
  completionProgress: number;
  criteria: Record<string, any>;
  outcome?: 'effective' | 'partial' | 'abandoned' | 'browsing';
  totalDurationMs?: number;
}

export interface MRUsageSummary {
  totalOpened: number;
  totalCompleted: number;
  totalAbandoned: number;
  totalBrowsing: number;
  effectiveUsageRate: number;
  mrBreakdown: Record<string, {
    opened: number;
    completed: number;
    avgCompletionProgress: number;
  }>;
}

interface MRFlowTrackerContextValue {
  // Flow control
  startFlow: (mrId: string) => void;
  recordInteraction: (mrId: string, interactionType: string, data?: any) => void;
  recordApply: (mrId: string, result?: any) => void;
  recordComplete: (mrId: string) => void;
  endFlow: (mrId: string, reason?: 'close' | 'navigate' | 'timeout') => void;

  // State queries
  getFlowState: (mrId: string) => MRFlowSession | null;
  getActiveFlows: () => MRFlowSession[];
  getEffectiveMRUsage: () => MRUsageSummary;
}

// Timeout thresholds
const IDLE_TIMEOUT_MS = 30000;      // 30 seconds of no interaction = abandoned
const BROWSING_THRESHOLD_MS = 5000; // Less than 5 seconds = just browsing

const MRFlowTrackerContext = createContext<MRFlowTrackerContextValue | null>(null);

interface MRFlowTrackerProviderProps {
  sessionId: string;
  children: React.ReactNode;
}

export function MRFlowTrackerProvider({ sessionId, children }: MRFlowTrackerProviderProps) {
  const flowSessions = useRef<Map<string, MRFlowSession>>(new Map());
  const completedFlows = useRef<MRFlowSession[]>([]);
  const idleTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      idleTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  /**
   * Internal: End flow with outcome calculation
   */
  const endFlowInternal = useCallback((mrId: string, reason: 'close' | 'navigate' | 'timeout') => {
    const session = flowSessions.current.get(mrId);
    if (!session) return;

    const now = Date.now();
    session.closedAt = now;
    session.totalDurationMs = now - session.openedAt;

    // Clear idle timer
    const timer = idleTimers.current.get(mrId);
    if (timer) {
      clearTimeout(timer);
      idleTimers.current.delete(mrId);
    }

    // Determine outcome based on duration and progress
    if (session.totalDurationMs < BROWSING_THRESHOLD_MS && session.completionProgress < 20) {
      session.outcome = 'browsing';
      session.state = 'idle';
    } else if (session.completionProgress >= 80) {
      session.outcome = 'effective';
      session.state = 'completed';
    } else if (session.completionProgress >= 30) {
      session.outcome = 'partial';
      session.state = 'abandoned';
    } else {
      session.outcome = 'abandoned';
      session.state = 'abandoned';
    }

    // Move to completed flows
    completedFlows.current.push({ ...session });
    flowSessions.current.delete(mrId);

    console.log(`[MRFlowTracker] ${mrId} ended: ${session.outcome} (${session.completionProgress}%, ${session.totalDurationMs}ms, reason: ${reason})`);

    // Send to backend
    api.post('/mca/track-action', {
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_dismiss',
      mrId,
      durationMs: session.totalDurationMs,
      metadata: {
        outcome: session.outcome,
        reason,
        completionProgress: session.completionProgress,
      },
    }).catch(err => console.warn('[MRFlowTracker] Failed to track end:', err));
  }, [sessionId]);

  /**
   * Reset idle timer for an MR
   */
  const resetIdleTimer = useCallback((mrId: string) => {
    const existingTimer = idleTimers.current.get(mrId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      const session = flowSessions.current.get(mrId);
      if (session && session.state !== 'completed' && session.state !== 'abandoned') {
        console.log(`[MRFlowTracker] ${mrId} idle timeout - marking as abandoned`);
        endFlowInternal(mrId, 'timeout');
      }
    }, IDLE_TIMEOUT_MS);

    idleTimers.current.set(mrId, timer);
  }, [endFlowInternal]);

  /**
   * Start tracking an MR flow
   */
  const startFlow = useCallback((mrId: string) => {
    const now = Date.now();

    const session: MRFlowSession = {
      mrId,
      state: 'opened',
      openedAt: now,
      lastInteractionAt: now,
      completionProgress: 0,
      criteria: {},
    };

    flowSessions.current.set(mrId, session);
    resetIdleTimer(mrId);

    console.log(`[MRFlowTracker] Started flow for ${mrId}`);

    api.post('/mca/track-action', {
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_open',
      mrId,
      metadata: { flowState: 'opened' },
    }).catch(err => console.warn('[MRFlowTracker] Failed to track open:', err));
  }, [sessionId, resetIdleTimer]);

  /**
   * Record an interaction within the MR flow
   */
  const recordInteraction = useCallback((mrId: string, interactionType: string, data?: any) => {
    const session = flowSessions.current.get(mrId);
    if (!session) {
      console.warn(`[MRFlowTracker] No active flow for ${mrId}`);
      return;
    }

    const now = Date.now();
    session.lastInteractionAt = now;
    session.state = 'interacting';

    // Update completion criteria based on MR type and interaction
    updateCompletionCriteria(session, interactionType, data);

    resetIdleTimer(mrId);

    console.log(`[MRFlowTracker] ${mrId} interaction: ${interactionType}, progress: ${session.completionProgress}%`);

    api.post('/mca/track-action', {
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_interact',
      mrId,
      metadata: {
        interactionType,
        data,
        completionProgress: session.completionProgress,
      },
    }).catch(err => console.warn('[MRFlowTracker] Failed to track interaction:', err));
  }, [sessionId, resetIdleTimer]);

  /**
   * Record that MR result was applied
   */
  const recordApply = useCallback((mrId: string, result?: any) => {
    const session = flowSessions.current.get(mrId);
    if (!session) return;

    const now = Date.now();
    session.lastInteractionAt = now;
    session.state = 'applied';
    session.completionProgress = Math.max(session.completionProgress, 80);

    console.log(`[MRFlowTracker] ${mrId} applied to conversation`);

    api.post('/mca/track-action', {
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_apply',
      mrId,
      mrResult: result,
      metadata: { completionProgress: session.completionProgress },
    }).catch(err => console.warn('[MRFlowTracker] Failed to track apply:', err));
  }, [sessionId]);

  /**
   * Record that MR workflow was completed
   */
  const recordComplete = useCallback((mrId: string) => {
    const session = flowSessions.current.get(mrId);
    if (!session) return;

    const now = Date.now();
    session.lastInteractionAt = now;
    session.closedAt = now;
    session.state = 'completed';
    session.completionProgress = 100;
    session.outcome = 'effective';
    session.totalDurationMs = now - session.openedAt;

    // Clear idle timer
    const timer = idleTimers.current.get(mrId);
    if (timer) {
      clearTimeout(timer);
      idleTimers.current.delete(mrId);
    }

    completedFlows.current.push({ ...session });
    flowSessions.current.delete(mrId);

    console.log(`[MRFlowTracker] ${mrId} completed (${session.totalDurationMs}ms)`);

    api.post('/mca/track-action', {
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_complete',
      mrId,
      durationMs: session.totalDurationMs,
      metadata: {
        outcome: 'effective',
        completionProgress: 100,
      },
    }).catch(err => console.warn('[MRFlowTracker] Failed to track complete:', err));
  }, [sessionId]);

  /**
   * End flow (close/navigate away/timeout)
   */
  const endFlow = useCallback((mrId: string, reason: 'close' | 'navigate' | 'timeout' = 'close') => {
    endFlowInternal(mrId, reason);
  }, [endFlowInternal]);

  /**
   * Get current flow state for an MR
   */
  const getFlowState = useCallback((mrId: string): MRFlowSession | null => {
    return flowSessions.current.get(mrId) || null;
  }, []);

  /**
   * Get all active flows
   */
  const getActiveFlows = useCallback((): MRFlowSession[] => {
    return Array.from(flowSessions.current.values());
  }, []);

  /**
   * Get effective MR usage summary
   */
  const getEffectiveMRUsage = useCallback((): MRUsageSummary => {
    const allFlows = [...completedFlows.current];

    let totalOpened = allFlows.length;
    let totalCompleted = 0;
    let totalAbandoned = 0;
    let totalBrowsing = 0;
    const mrBreakdown: Record<string, { opened: number; completed: number; avgCompletionProgress: number }> = {};

    for (const flow of allFlows) {
      if (!mrBreakdown[flow.mrId]) {
        mrBreakdown[flow.mrId] = { opened: 0, completed: 0, avgCompletionProgress: 0 };
      }
      mrBreakdown[flow.mrId].opened++;
      mrBreakdown[flow.mrId].avgCompletionProgress += flow.completionProgress;

      switch (flow.outcome) {
        case 'effective':
          totalCompleted++;
          mrBreakdown[flow.mrId].completed++;
          break;
        case 'partial':
        case 'abandoned':
          totalAbandoned++;
          break;
        case 'browsing':
          totalBrowsing++;
          break;
      }
    }

    // Calculate averages
    for (const mrId of Object.keys(mrBreakdown)) {
      if (mrBreakdown[mrId].opened > 0) {
        mrBreakdown[mrId].avgCompletionProgress /= mrBreakdown[mrId].opened;
      }
    }

    const meaningfulOpens = totalOpened - totalBrowsing;
    const effectiveUsageRate = meaningfulOpens > 0 ? totalCompleted / meaningfulOpens : 0;

    return {
      totalOpened,
      totalCompleted,
      totalAbandoned,
      totalBrowsing,
      effectiveUsageRate,
      mrBreakdown,
    };
  }, []);

  const value: MRFlowTrackerContextValue = {
    startFlow,
    recordInteraction,
    recordApply,
    recordComplete,
    endFlow,
    getFlowState,
    getActiveFlows,
    getEffectiveMRUsage,
  };

  return (
    <MRFlowTrackerContext.Provider value={value}>
      {children}
    </MRFlowTrackerContext.Provider>
  );
}

/**
 * Hook to access MR Flow Tracker from any MR component
 */
export function useMRFlowTrackerContext(): MRFlowTrackerContextValue {
  const context = useContext(MRFlowTrackerContext);
  if (!context) {
    // Return no-op functions if context not available
    return {
      startFlow: () => {},
      recordInteraction: () => {},
      recordApply: () => {},
      recordComplete: () => {},
      endFlow: () => {},
      getFlowState: () => null,
      getActiveFlows: () => [],
      getEffectiveMRUsage: () => ({
        totalOpened: 0,
        totalCompleted: 0,
        totalAbandoned: 0,
        totalBrowsing: 0,
        effectiveUsageRate: 0,
        mrBreakdown: {},
      }),
    };
  }
  return context;
}

/**
 * Update completion criteria based on MR type and interaction
 */
function updateCompletionCriteria(session: MRFlowSession, interactionType: string, data?: any): void {
  const { mrId, criteria } = session;

  switch (mrId) {
    case 'MR1': // Task Decomposition
    case 'mr1-decomposition':
      if (interactionType === 'view_decomposition') {
        criteria.viewedDecomposition = true;
        session.completionProgress = Math.max(session.completionProgress, 30);
      }
      if (interactionType === 'select_step') {
        criteria.selectedSteps = (criteria.selectedSteps || 0) + 1;
        session.completionProgress = Math.max(session.completionProgress, 50);
      }
      if (interactionType === 'apply') {
        criteria.appliedToConversation = true;
        session.completionProgress = Math.max(session.completionProgress, 90);
      }
      break;

    case 'MR6': // Cross-Model Comparison
    case 'mr6-models':
      if (interactionType === 'select_model') {
        criteria.selectedModels = (criteria.selectedModels || 0) + 1;
        session.completionProgress = Math.max(session.completionProgress, 30);
      }
      if (interactionType === 'run_experiment') {
        criteria.ranExperiment = true;
        session.completionProgress = Math.max(session.completionProgress, 50);
      }
      if (interactionType === 'view_comparison') {
        criteria.viewedComparison = true;
        session.completionProgress = Math.max(session.completionProgress, 60);
      }
      if (interactionType === 'make_selection') {
        criteria.madeSelection = true;
        session.completionProgress = Math.max(session.completionProgress, 90);
      }
      break;

    case 'MR11': // Integrated Verification
    case 'mr11-verify':
      if (interactionType === 'input_content') {
        criteria.inputContent = true;
        session.completionProgress = Math.max(session.completionProgress, 20);
      }
      if (interactionType === 'select_type') {
        criteria.selectedVerificationType = true;
        session.completionProgress = Math.max(session.completionProgress, 30);
      }
      if (interactionType === 'run_verification') {
        criteria.ranVerification = true;
        session.completionProgress = Math.max(session.completionProgress, 60);
      }
      if (interactionType === 'view_results') {
        criteria.viewedResults = true;
        session.completionProgress = Math.max(session.completionProgress, 70);
      }
      if (interactionType === 'make_decision') {
        criteria.madeDecision = true;
        session.completionProgress = Math.max(session.completionProgress, 90);
      }
      if (interactionType === 'confirm') {
        criteria.confirmedVerification = true;
        session.completionProgress = Math.max(session.completionProgress, 100);
      }
      break;

    case 'MR3': // Agency Control
    case 'mr3-agency':
      if (interactionType === 'view_settings') {
        criteria.viewedSettings = true;
        session.completionProgress = Math.max(session.completionProgress, 50);
      }
      if (interactionType === 'change_level') {
        criteria.changedLevel = true;
        session.completionProgress = Math.max(session.completionProgress, 100);
      }
      break;

    case 'MR4': // Role Definition
    case 'mr4-roles':
      if (interactionType === 'view_roles') {
        criteria.viewedRoles = true;
        session.completionProgress = Math.max(session.completionProgress, 30);
      }
      if (interactionType === 'select_role') {
        criteria.selectedRole = true;
        session.completionProgress = Math.max(session.completionProgress, 60);
      }
      if (interactionType === 'confirm_role') {
        criteria.confirmedRole = true;
        session.completionProgress = Math.max(session.completionProgress, 100);
      }
      break;

    case 'MR5': // Low-Cost Iteration
    case 'mr5-iteration':
      if (interactionType === 'view_variants') {
        criteria.viewedVariants = true;
        session.completionProgress = Math.max(session.completionProgress, 40);
      }
      if (interactionType === 'select_variant') {
        criteria.selectedVariant = true;
        session.completionProgress = Math.max(session.completionProgress, 100);
      }
      break;

    default:
      // Generic progress tracking for other MRs
      criteria.interacted = true;
      session.completionProgress = Math.max(session.completionProgress, 50);
      break;
  }
}

export default MRFlowTrackerContext;
