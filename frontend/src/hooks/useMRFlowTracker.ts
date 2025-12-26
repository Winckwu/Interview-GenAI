/**
 * MR Flow Tracker
 *
 * Tracks the complete flow of MR tool usage, not just open/close.
 * Detects partial completion, abandonment, and actual effective usage.
 *
 * Flow states:
 * - idle: MR not opened
 * - opened: MR opened but no interaction yet
 * - interacting: User is actively using the MR
 * - applied: User applied MR result to conversation
 * - completed: User completed the full MR workflow
 * - abandoned: User closed MR without completing (timeout or explicit close)
 */

import { useCallback, useRef, useEffect } from 'react';
import api from '../services/api';

// Flow states for each MR tool
export type MRFlowState = 'idle' | 'opened' | 'interacting' | 'applied' | 'completed' | 'abandoned';

// MR-specific completion criteria
export interface MRCompletionCriteria {
  MR1: {  // Task Decomposition
    viewedDecomposition: boolean;
    selectedSteps: number;
    appliedToConversation: boolean;
  };
  MR3: {  // Agency Control
    viewedSettings: boolean;
    changedLevel: boolean;
  };
  MR4: {  // Role Definition
    viewedRoles: boolean;
    selectedRole: boolean;
    confirmedRole: boolean;
  };
  MR5: {  // Low-Cost Iteration
    viewedVariants: boolean;
    selectedVariant: boolean;
  };
  MR6: {  // Cross-Model Comparison
    selectedModels: number;
    viewedComparison: boolean;
    madeSelection: boolean;
  };
  MR11: {  // Integrated Verification
    selectedVerificationType: boolean;
    viewedResults: boolean;
    confirmedVerification: boolean;
  };
  // Generic for other MRs
  generic: {
    interacted: boolean;
    completed: boolean;
  };
}

export interface MRFlowSession {
  mrId: string;
  state: MRFlowState;
  openedAt: number;
  lastInteractionAt: number;
  closedAt?: number;
  // Completion tracking
  completionProgress: number;  // 0-100%
  criteria: Partial<MRCompletionCriteria[keyof MRCompletionCriteria]>;
  // Outcome
  outcome?: 'effective' | 'partial' | 'abandoned' | 'browsing';
  // Duration
  totalDurationMs?: number;
  activeInteractionMs?: number;
}

// Timeout thresholds
const IDLE_TIMEOUT_MS = 30000;      // 30 seconds of no interaction = abandoned
const BROWSING_THRESHOLD_MS = 5000; // Less than 5 seconds = just browsing

interface UseMRFlowTrackerReturn {
  // Flow control
  startFlow: (mrId: string) => void;
  recordInteraction: (mrId: string, interactionType: string, data?: any) => void;
  recordApply: (mrId: string, result?: any) => void;
  recordComplete: (mrId: string) => void;
  endFlow: (mrId: string, reason?: 'close' | 'navigate' | 'timeout') => void;

  // State queries
  getFlowState: (mrId: string) => MRFlowSession | null;
  getActiveFlows: () => MRFlowSession[];

  // For pattern detection
  getEffectiveMRUsage: () => MRUsageSummary;
}

export interface MRUsageSummary {
  totalOpened: number;
  totalCompleted: number;
  totalAbandoned: number;
  totalBrowsing: number;
  effectiveUsageRate: number;  // completed / (opened - browsing)
  mrBreakdown: Record<string, {
    opened: number;
    completed: number;
    avgCompletionProgress: number;
  }>;
}

export function useMRFlowTracker(sessionId: string): UseMRFlowTrackerReturn {
  // Track all MR flow sessions
  const flowSessions = useRef<Map<string, MRFlowSession>>(new Map());
  const completedFlows = useRef<MRFlowSession[]>([]);

  // Idle timeout checker
  const idleTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      idleTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  /**
   * Reset idle timer for an MR
   */
  const resetIdleTimer = useCallback((mrId: string) => {
    // Clear existing timer
    const existingTimer = idleTimers.current.get(mrId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      const session = flowSessions.current.get(mrId);
      if (session && session.state !== 'completed' && session.state !== 'abandoned') {
        console.log(`[MRFlowTracker] ${mrId} idle timeout - marking as abandoned`);
        endFlowInternal(mrId, 'timeout');
      }
    }, IDLE_TIMEOUT_MS);

    idleTimers.current.set(mrId, timer);
  }, []);

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

    // Send to backend
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

    // Update completion criteria based on MR type
    updateCompletionCriteria(session, interactionType, data);

    resetIdleTimer(mrId);

    console.log(`[MRFlowTracker] ${mrId} interaction: ${interactionType}, progress: ${session.completionProgress}%`);

    // Send interaction to backend
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
   * Record that MR result was applied to conversation
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

    // Move to completed flows
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

    api.post('/mca/track-action', {
      sessionId,
      category: 'mr_tool',
      actionType: reason === 'timeout' ? 'mr_dismiss' : 'mr_dismiss',
      mrId,
      durationMs: session.totalDurationMs,
      metadata: {
        outcome: session.outcome,
        reason,
        completionProgress: session.completionProgress,
      },
    }).catch(err => console.warn('[MRFlowTracker] Failed to track end:', err));
  }, [sessionId]);

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
   * Get effective MR usage summary for pattern detection
   */
  const getEffectiveMRUsage = useCallback((): MRUsageSummary => {
    const allFlows = [...completedFlows.current];

    let totalOpened = allFlows.length;
    let totalCompleted = 0;
    let totalAbandoned = 0;
    let totalBrowsing = 0;
    const mrBreakdown: Record<string, { opened: number; completed: number; avgCompletionProgress: number }> = {};

    for (const flow of allFlows) {
      // Initialize breakdown for this MR
      if (!mrBreakdown[flow.mrId]) {
        mrBreakdown[flow.mrId] = { opened: 0, completed: 0, avgCompletionProgress: 0 };
      }
      mrBreakdown[flow.mrId].opened++;
      mrBreakdown[flow.mrId].avgCompletionProgress += flow.completionProgress;

      // Count by outcome
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

    // Effective usage rate (excluding browsing)
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

  return {
    startFlow,
    recordInteraction,
    recordApply,
    recordComplete,
    endFlow,
    getFlowState,
    getActiveFlows,
    getEffectiveMRUsage,
  };
}

/**
 * Update completion criteria based on MR type and interaction
 */
function updateCompletionCriteria(session: MRFlowSession, interactionType: string, data?: any): void {
  const { mrId, criteria } = session;

  switch (mrId) {
    case 'MR1': // Task Decomposition
      if (interactionType === 'view_decomposition') {
        (criteria as any).viewedDecomposition = true;
        session.completionProgress = Math.max(session.completionProgress, 30);
      }
      if (interactionType === 'select_step') {
        (criteria as any).selectedSteps = ((criteria as any).selectedSteps || 0) + 1;
        session.completionProgress = Math.max(session.completionProgress, 50);
      }
      if (interactionType === 'apply') {
        (criteria as any).appliedToConversation = true;
        session.completionProgress = Math.max(session.completionProgress, 90);
      }
      break;

    case 'MR6': // Cross-Model Comparison
      if (interactionType === 'select_model') {
        (criteria as any).selectedModels = ((criteria as any).selectedModels || 0) + 1;
        session.completionProgress = Math.max(session.completionProgress, 30);
      }
      if (interactionType === 'view_comparison') {
        (criteria as any).viewedComparison = true;
        session.completionProgress = Math.max(session.completionProgress, 60);
      }
      if (interactionType === 'make_selection') {
        (criteria as any).madeSelection = true;
        session.completionProgress = Math.max(session.completionProgress, 90);
      }
      break;

    case 'MR11': // Integrated Verification
      if (interactionType === 'select_type') {
        (criteria as any).selectedVerificationType = true;
        session.completionProgress = Math.max(session.completionProgress, 30);
      }
      if (interactionType === 'view_results') {
        (criteria as any).viewedResults = true;
        session.completionProgress = Math.max(session.completionProgress, 60);
      }
      if (interactionType === 'confirm') {
        (criteria as any).confirmedVerification = true;
        session.completionProgress = Math.max(session.completionProgress, 100);
      }
      break;

    default:
      // Generic progress tracking
      (criteria as any).interacted = true;
      session.completionProgress = Math.max(session.completionProgress, 50);
      break;
  }
}

export default useMRFlowTracker;
