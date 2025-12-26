/**
 * useActionTracker Hook
 *
 * Tracks user actions for enhanced pattern detection:
 * - Message actions: verify, modify, reject, copy, regenerate
 * - MR tool interactions: open, apply, dismiss, complete
 * - Intervention responses: shown, acted, dismissed
 *
 * Actions are sent to /mca/track-action API endpoint
 */

import { useCallback, useRef } from 'react';
import api from '../services/api';

export type ActionCategory =
  | 'message'
  | 'mr_tool'
  | 'navigation'
  | 'intervention'
  | 'reflection'
  | 'verification'
  | 'iteration';

export type ActionType =
  // Message actions
  | 'message_verify'
  | 'message_modify'
  | 'message_reject'
  | 'message_copy'
  | 'message_regenerate'
  // MR tool actions
  | 'mr_open'
  | 'mr_apply'
  | 'mr_dismiss'
  | 'mr_complete'
  | 'mr_interact'
  // Intervention actions
  | 'intervention_shown'
  | 'intervention_acted'
  | 'intervention_dismissed'
  | 'intervention_suppressed'
  // Verification actions
  | 'verify_fact_check'
  | 'verify_cross_model'
  | 'verify_external_source'
  // Iteration actions
  | 'branch_create'
  | 'branch_compare'
  | 'branch_select'
  // Reflection actions
  | 'reflection_start'
  | 'reflection_complete'
  | 'assessment_complete';

interface TrackActionOptions {
  sessionId: string;
  userId?: string;
  category: ActionCategory;
  actionType: ActionType;
  targetId?: string;
  targetType?: string;
  mrId?: string;
  mrResult?: any;
  messageId?: string;
  messageContent?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

interface ActionSummary {
  engagementScore: number;
  verificationRate: number;
  mrUtilizationRate: number;
}

interface UseActionTrackerReturn {
  trackAction: (options: TrackActionOptions) => Promise<void>;
  trackMessageVerify: (sessionId: string, messageId: string) => Promise<void>;
  trackMessageModify: (sessionId: string, messageId: string) => Promise<void>;
  trackMessageReject: (sessionId: string, messageId: string) => Promise<void>;
  trackMROpen: (sessionId: string, mrId: string) => Promise<void>;
  trackMRApply: (sessionId: string, mrId: string, result?: any) => Promise<void>;
  trackMRDismiss: (sessionId: string, mrId: string) => Promise<void>;
  trackMRComplete: (sessionId: string, mrId: string) => Promise<void>;
  trackInterventionShown: (sessionId: string, mrId: string) => Promise<void>;
  trackInterventionActed: (sessionId: string, mrId: string, action: string) => Promise<void>;
  trackInterventionDismissed: (sessionId: string, mrId: string) => Promise<void>;
  getActionSummary: (sessionId: string) => Promise<ActionSummary | null>;
}

export function useActionTracker(): UseActionTrackerReturn {
  // Track action start times for duration calculation
  const actionStartTimes = useRef<Map<string, number>>(new Map());

  /**
   * Generic action tracking function
   */
  const trackAction = useCallback(async (options: TrackActionOptions): Promise<void> => {
    try {
      // Calculate duration if we have a start time
      const startTimeKey = `${options.category}:${options.actionType}:${options.targetId || options.mrId || 'default'}`;
      const startTime = actionStartTimes.current.get(startTimeKey);
      let durationMs = options.durationMs;

      if (startTime) {
        durationMs = Date.now() - startTime;
        actionStartTimes.current.delete(startTimeKey);
      }

      await api.post('/mca/track-action', {
        ...options,
        durationMs,
      });

      console.log(`[ActionTracker] Tracked: ${options.category}:${options.actionType}`, {
        mrId: options.mrId,
        messageId: options.messageId,
      });
    } catch (error) {
      // Non-critical, just log
      console.warn('[ActionTracker] Failed to track action:', error);
    }
  }, []);

  /**
   * Start timing an action (for duration tracking)
   */
  const startActionTimer = useCallback((category: string, actionType: string, targetId?: string) => {
    const key = `${category}:${actionType}:${targetId || 'default'}`;
    actionStartTimes.current.set(key, Date.now());
  }, []);

  // ========== Convenience methods ==========

  const trackMessageVerify = useCallback(async (sessionId: string, messageId: string) => {
    await trackAction({
      sessionId,
      category: 'message',
      actionType: 'message_verify',
      messageId,
      targetId: messageId,
      targetType: 'message',
    });
  }, [trackAction]);

  const trackMessageModify = useCallback(async (sessionId: string, messageId: string) => {
    await trackAction({
      sessionId,
      category: 'message',
      actionType: 'message_modify',
      messageId,
      targetId: messageId,
      targetType: 'message',
    });
  }, [trackAction]);

  const trackMessageReject = useCallback(async (sessionId: string, messageId: string) => {
    await trackAction({
      sessionId,
      category: 'message',
      actionType: 'message_reject',
      messageId,
      targetId: messageId,
      targetType: 'message',
    });
  }, [trackAction]);

  const trackMROpen = useCallback(async (sessionId: string, mrId: string) => {
    // Start timer for duration tracking
    startActionTimer('mr_tool', 'mr_open', mrId);

    await trackAction({
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_open',
      mrId,
      targetId: mrId,
      targetType: 'mr',
    });
  }, [trackAction, startActionTimer]);

  const trackMRApply = useCallback(async (sessionId: string, mrId: string, result?: any) => {
    await trackAction({
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_apply',
      mrId,
      mrResult: result,
      targetId: mrId,
      targetType: 'mr',
    });
  }, [trackAction]);

  const trackMRDismiss = useCallback(async (sessionId: string, mrId: string) => {
    await trackAction({
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_dismiss',
      mrId,
      targetId: mrId,
      targetType: 'mr',
    });
  }, [trackAction]);

  const trackMRComplete = useCallback(async (sessionId: string, mrId: string) => {
    await trackAction({
      sessionId,
      category: 'mr_tool',
      actionType: 'mr_complete',
      mrId,
      targetId: mrId,
      targetType: 'mr',
    });
  }, [trackAction]);

  const trackInterventionShown = useCallback(async (sessionId: string, mrId: string) => {
    await trackAction({
      sessionId,
      category: 'intervention',
      actionType: 'intervention_shown',
      mrId,
      targetId: mrId,
      targetType: 'intervention',
    });
  }, [trackAction]);

  const trackInterventionActed = useCallback(async (sessionId: string, mrId: string, action: string) => {
    await trackAction({
      sessionId,
      category: 'intervention',
      actionType: 'intervention_acted',
      mrId,
      targetId: mrId,
      targetType: 'intervention',
      metadata: { action },
    });
  }, [trackAction]);

  const trackInterventionDismissed = useCallback(async (sessionId: string, mrId: string) => {
    await trackAction({
      sessionId,
      category: 'intervention',
      actionType: 'intervention_dismissed',
      mrId,
      targetId: mrId,
      targetType: 'intervention',
    });
  }, [trackAction]);

  /**
   * Get action summary for a session
   */
  const getActionSummary = useCallback(async (sessionId: string): Promise<ActionSummary | null> => {
    try {
      const response = await api.get(`/mca/action-summary/${sessionId}`);
      return response.data.data?.summary || null;
    } catch (error) {
      console.warn('[ActionTracker] Failed to get action summary:', error);
      return null;
    }
  }, []);

  return {
    trackAction,
    trackMessageVerify,
    trackMessageModify,
    trackMessageReject,
    trackMROpen,
    trackMRApply,
    trackMRDismiss,
    trackMRComplete,
    trackInterventionShown,
    trackInterventionActed,
    trackInterventionDismissed,
    getActionSummary,
  };
}

export default useActionTracker;
