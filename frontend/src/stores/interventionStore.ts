/**
 * Intervention UI State Management
 * Manages soft signals, medium alerts, and hard barriers
 * Coordinates with PatternDetector and InterventionScheduler
 */

import { create } from 'zustand';
import { UserInterventionHistory, InterventionSuppressionState } from '../utils/InterventionScheduler';

export type InterventionTier = 'soft' | 'medium' | 'hard' | 'none';

/**
 * Pending intervention to display
 */
export interface PendingIntervention {
  id: string;
  mrType: string;
  tier: InterventionTier;
  title: string;
  message: string;
  description?: string;
  icon?: string;
  confidence?: number;
  options?: Array<{
    label: string;
    value: string;
  }>;
  actionLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onAction?: (value: string) => void;
  timestamp: number;
}

/**
 * Compliance metrics tracked per session
 */
export interface ComplianceMetrics {
  sessionId: string;
  totalInterventionsShown: number;
  softSignalCount: number;
  mediumAlertCount: number;
  hardBarrierCount: number;
  dismissalCount: number;
  engagementCount: number; // Clicked "learn more"
  complianceCount: number; // Changed behavior
  overrideCount: number; // Proceeded anyway on hard barrier
}

/**
 * Intervention Store State
 */
export interface InterventionStoreState {
  // Current intervention being displayed
  activeIntervention: PendingIntervention | null;
  isDisplaying: boolean;

  // User interaction history (for fatigue tracking)
  userHistory: UserInterventionHistory;
  suppressionState: InterventionSuppressionState;

  // Session metrics
  currentSessionId: string | null;
  metricsHistory: Record<string, ComplianceMetrics>; // sessionId -> metrics

  // Actions
  setActiveIntervention: (intervention: PendingIntervention | null) => void;
  clearActiveIntervention: () => void;
  recordUserAction: (
    mrType: string,
    action: 'dismiss' | 'skip' | 'acted' | 'override'
  ) => void;
  recordEngagement: (sessionId: string, eventType: 'engagement' | 'compliance') => void;
  setCurrentSession: (sessionId: string) => void;
  updateUserHistory: (history: UserInterventionHistory) => void;
  updateSuppressionState: (state: InterventionSuppressionState) => void;
  getSessionMetrics: (sessionId: string) => ComplianceMetrics | undefined;
  resetSessionMetrics: () => void;
}

/**
 * Zustand store for intervention UI state management
 *
 * Responsibilities:
 * - Store current intervention being displayed
 * - Track user interaction history (for fatigue tracking)
 * - Track suppression state
 * - Log compliance metrics per session
 * - Coordinate tier transitions (soft → medium → hard)
 */
export const useInterventionStore = create<InterventionStoreState>((set, get) => ({
  activeIntervention: null,
  isDisplaying: false,
  userHistory: {},
  suppressionState: {
    suppressedMRTypes: new Set(),
    suppressionExpiresAt: {},
    lastCalculatedFatigueScore: 0,
    lastCalculatedAt: Date.now(),
  },
  currentSessionId: null,
  metricsHistory: {},

  /**
   * Set active intervention (will display in UI)
   */
  setActiveIntervention: (intervention: PendingIntervention | null) => {
    set({
      activeIntervention: intervention,
      isDisplaying: intervention !== null,
    });
  },

  /**
   * Clear active intervention
   */
  clearActiveIntervention: () => {
    set({
      activeIntervention: null,
      isDisplaying: false,
    });
  },

  /**
   * Record user action on intervention
   * Updates history and suppression state
   */
  recordUserAction: (mrType: string, action: 'dismiss' | 'skip' | 'acted' | 'override') => {
    const state = get();
    let updatedHistory = { ...state.userHistory };
    let updatedSuppression = {
      ...state.suppressionState,
      suppressionExpiresAt: { ...state.suppressionState.suppressionExpiresAt },
    };

    // Initialize if not exists
    if (!updatedHistory[mrType]) {
      updatedHistory[mrType] = {
        dismissalCount: 0,
        lastDismissalTime: 0,
        userActedOnCount: 0,
        cumulativeExposureMs: 0,
        createdAtMs: Date.now(),
      };
    }

    // Update based on action
    if (action === 'dismiss' || action === 'skip') {
      updatedHistory[mrType].dismissalCount += 1;
      updatedHistory[mrType].lastDismissalTime = Date.now();

      // Suppress after 3 dismissals
      if (updatedHistory[mrType].dismissalCount >= 3) {
        updatedSuppression.suppressionExpiresAt[mrType] = Date.now() + 30 * 60 * 1000; // 30 min
        updatedSuppression.suppressedMRTypes.add(mrType);
      }
    } else if (action === 'acted') {
      updatedHistory[mrType].userActedOnCount += 1;
      updatedHistory[mrType].dismissalCount = 0; // Reset on engagement
      updatedSuppression.suppressedMRTypes.delete(mrType);
      delete updatedSuppression.suppressionExpiresAt[mrType];
    } else if (action === 'override') {
      updatedHistory[mrType].userActedOnCount += 1;
      updatedSuppression.suppressedMRTypes.delete(mrType);
      delete updatedSuppression.suppressionExpiresAt[mrType];
    }

    set({
      userHistory: updatedHistory,
      suppressionState: updatedSuppression,
    });
  },

  /**
   * Record engagement or compliance event for metrics
   */
  recordEngagement: (sessionId: string, eventType: 'engagement' | 'compliance') => {
    const state = get();
    const metrics = state.metricsHistory[sessionId];

    if (!metrics) return;

    const updatedMetrics = { ...metrics };
    if (eventType === 'engagement') {
      updatedMetrics.engagementCount += 1;
    } else if (eventType === 'compliance') {
      updatedMetrics.complianceCount += 1;
    }

    set({
      metricsHistory: {
        ...state.metricsHistory,
        [sessionId]: updatedMetrics,
      },
    });
  },

  /**
   * Set current session (for metrics tracking)
   */
  setCurrentSession: (sessionId: string) => {
    const state = get();
    if (!state.metricsHistory[sessionId]) {
      state.metricsHistory[sessionId] = {
        sessionId,
        totalInterventionsShown: 0,
        softSignalCount: 0,
        mediumAlertCount: 0,
        hardBarrierCount: 0,
        dismissalCount: 0,
        engagementCount: 0,
        complianceCount: 0,
        overrideCount: 0,
      };
    }

    set({
      currentSessionId: sessionId,
      metricsHistory: { ...state.metricsHistory },
    });
  },

  /**
   * Update user interaction history (from InterventionScheduler)
   */
  updateUserHistory: (history: UserInterventionHistory) => {
    set({ userHistory: history });
  },

  /**
   * Update suppression state (from InterventionScheduler)
   */
  updateSuppressionState: (state: InterventionSuppressionState) => {
    set({ suppressionState: state });
  },

  /**
   * Get metrics for specific session
   */
  getSessionMetrics: (sessionId: string) => {
    return get().metricsHistory[sessionId];
  },

  /**
   * Reset metrics for new session
   */
  resetSessionMetrics: () => {
    set({
      metricsHistory: {},
      currentSessionId: null,
    });
  },
}));
