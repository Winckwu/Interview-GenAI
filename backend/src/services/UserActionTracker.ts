/**
 * User Action Tracker
 *
 * Tracks all user behaviors for pattern detection:
 * - Message actions: verify, modify, reject
 * - MR interactions: open, apply, dismiss, complete
 * - UI actions: click, scroll, time spent
 *
 * These actions feed into BehaviorSignalDetector for more accurate pattern recognition
 */

export type ActionCategory =
  | 'message'      // Actions on AI messages (verify, modify, reject)
  | 'mr_tool'      // MR tool interactions
  | 'navigation'   // Page navigation
  | 'intervention' // Intervention responses
  | 'reflection'   // Reflection/assessment actions
  | 'verification' // Verification tool usage
  | 'iteration'    // Iteration/branching actions
  ;

export type ActionType =
  // Message actions
  | 'message_verify'
  | 'message_modify'
  | 'message_reject'
  | 'message_copy'
  | 'message_regenerate'
  // MR tool actions
  | 'mr_open'           // Opened an MR tool
  | 'mr_apply'          // Applied MR result (e.g., task decomposition)
  | 'mr_dismiss'        // Dismissed MR suggestion
  | 'mr_complete'       // Completed MR workflow
  | 'mr_interact'       // General interaction with MR
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
  | 'assessment_complete'
  ;

export interface UserAction {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  category: ActionCategory;
  actionType: ActionType;
  // Context
  targetId?: string;          // Message ID, MR ID, etc.
  targetType?: string;        // 'message', 'mr', 'intervention'
  metadata?: Record<string, any>;  // Additional data
  // For MR actions
  mrId?: string;              // Which MR tool (MR1-MR19)
  mrResult?: any;             // Result of MR action if applicable
  // For message actions
  messageId?: string;
  messageContent?: string;    // Truncated content for context
  // Duration tracking
  durationMs?: number;        // Time spent on action
}

export interface ActionSummary {
  sessionId: string;
  userId: string;
  // Counts by category
  messageActions: {
    verifyCount: number;
    modifyCount: number;
    rejectCount: number;
    copyCount: number;
    regenerateCount: number;
  };
  mrActions: {
    openCount: number;
    applyCount: number;
    dismissCount: number;
    completeCount: number;
    byMrId: Record<string, number>;  // Count per MR tool
  };
  interventionActions: {
    shownCount: number;
    actedCount: number;
    dismissedCount: number;
    suppressedCount: number;
    complianceRate: number;  // acted / shown
  };
  verificationActions: {
    factCheckCount: number;
    crossModelCount: number;
    externalSourceCount: number;
    totalVerifications: number;
  };
  // Time tracking
  totalDurationMs: number;
  avgActionIntervalMs: number;
  // Derived metrics
  engagementScore: number;      // 0-1: how engaged the user is
  verificationRate: number;     // 0-1: how often user verifies
  modificationRate: number;     // 0-1: how often user modifies
  mrUtilizationRate: number;    // 0-1: how often user uses MR tools
}

// In-memory action store (per session)
const sessionActions = new Map<string, UserAction[]>();

export class UserActionTracker {
  /**
   * Record a user action
   */
  static recordAction(action: Omit<UserAction, 'id' | 'timestamp'>): UserAction {
    const fullAction: UserAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Store in memory
    const sessionId = action.sessionId;
    if (!sessionActions.has(sessionId)) {
      sessionActions.set(sessionId, []);
    }
    sessionActions.get(sessionId)!.push(fullAction);

    // Log for debugging
    console.log(`[ActionTracker] ${action.category}:${action.actionType}`, {
      sessionId: action.sessionId,
      targetId: action.targetId,
      mrId: action.mrId,
    });

    return fullAction;
  }

  /**
   * Get all actions for a session
   */
  static getSessionActions(sessionId: string): UserAction[] {
    return sessionActions.get(sessionId) || [];
  }

  /**
   * Get action summary for pattern detection
   */
  static getActionSummary(sessionId: string): ActionSummary {
    const actions = sessionActions.get(sessionId) || [];

    const summary: ActionSummary = {
      sessionId,
      userId: actions[0]?.userId || 'unknown',
      messageActions: {
        verifyCount: 0,
        modifyCount: 0,
        rejectCount: 0,
        copyCount: 0,
        regenerateCount: 0,
      },
      mrActions: {
        openCount: 0,
        applyCount: 0,
        dismissCount: 0,
        completeCount: 0,
        byMrId: {},
      },
      interventionActions: {
        shownCount: 0,
        actedCount: 0,
        dismissedCount: 0,
        suppressedCount: 0,
        complianceRate: 0,
      },
      verificationActions: {
        factCheckCount: 0,
        crossModelCount: 0,
        externalSourceCount: 0,
        totalVerifications: 0,
      },
      totalDurationMs: 0,
      avgActionIntervalMs: 0,
      engagementScore: 0,
      verificationRate: 0,
      modificationRate: 0,
      mrUtilizationRate: 0,
    };

    if (actions.length === 0) {
      return summary;
    }

    // Count actions by type
    for (const action of actions) {
      // Message actions
      if (action.actionType === 'message_verify') summary.messageActions.verifyCount++;
      if (action.actionType === 'message_modify') summary.messageActions.modifyCount++;
      if (action.actionType === 'message_reject') summary.messageActions.rejectCount++;
      if (action.actionType === 'message_copy') summary.messageActions.copyCount++;
      if (action.actionType === 'message_regenerate') summary.messageActions.regenerateCount++;

      // MR actions
      if (action.actionType === 'mr_open') {
        summary.mrActions.openCount++;
        if (action.mrId) {
          summary.mrActions.byMrId[action.mrId] = (summary.mrActions.byMrId[action.mrId] || 0) + 1;
        }
      }
      if (action.actionType === 'mr_apply') summary.mrActions.applyCount++;
      if (action.actionType === 'mr_dismiss') summary.mrActions.dismissCount++;
      if (action.actionType === 'mr_complete') summary.mrActions.completeCount++;

      // Intervention actions
      if (action.actionType === 'intervention_shown') summary.interventionActions.shownCount++;
      if (action.actionType === 'intervention_acted') summary.interventionActions.actedCount++;
      if (action.actionType === 'intervention_dismissed') summary.interventionActions.dismissedCount++;
      if (action.actionType === 'intervention_suppressed') summary.interventionActions.suppressedCount++;

      // Verification actions
      if (action.actionType === 'verify_fact_check') summary.verificationActions.factCheckCount++;
      if (action.actionType === 'verify_cross_model') summary.verificationActions.crossModelCount++;
      if (action.actionType === 'verify_external_source') summary.verificationActions.externalSourceCount++;

      // Duration
      if (action.durationMs) {
        summary.totalDurationMs += action.durationMs;
      }
    }

    // Calculate total verifications
    summary.verificationActions.totalVerifications =
      summary.verificationActions.factCheckCount +
      summary.verificationActions.crossModelCount +
      summary.verificationActions.externalSourceCount +
      summary.messageActions.verifyCount;

    // Calculate rates
    const totalMessages = actions.filter(a => a.category === 'message').length || 1;
    summary.verificationRate = summary.messageActions.verifyCount / totalMessages;
    summary.modificationRate = summary.messageActions.modifyCount / totalMessages;

    // MR utilization
    const totalMROpens = summary.mrActions.openCount;
    const totalMRCompletes = summary.mrActions.applyCount + summary.mrActions.completeCount;
    summary.mrUtilizationRate = totalMROpens > 0 ? totalMRCompletes / totalMROpens : 0;

    // Intervention compliance
    if (summary.interventionActions.shownCount > 0) {
      summary.interventionActions.complianceRate =
        summary.interventionActions.actedCount / summary.interventionActions.shownCount;
    }

    // Engagement score (composite)
    summary.engagementScore = Math.min(1, (
      summary.verificationRate * 0.3 +
      summary.modificationRate * 0.2 +
      summary.mrUtilizationRate * 0.3 +
      summary.interventionActions.complianceRate * 0.2
    ));

    // Average action interval
    if (actions.length > 1) {
      const firstTime = actions[0].timestamp.getTime();
      const lastTime = actions[actions.length - 1].timestamp.getTime();
      summary.avgActionIntervalMs = (lastTime - firstTime) / (actions.length - 1);
    }

    return summary;
  }

  /**
   * Clear session actions (for cleanup)
   */
  static clearSession(sessionId: string): void {
    sessionActions.delete(sessionId);
  }

  /**
   * Convert action summary to behavioral signals boost
   * Used by BehaviorSignalDetector to enhance pattern detection
   */
  static getSignalsBoost(sessionId: string): Record<string, number> {
    const summary = this.getActionSummary(sessionId);

    return {
      // Verification boost
      verificationBoost: summary.verificationRate * 2,
      // Modification indicates engagement
      modificationBoost: summary.modificationRate * 1.5,
      // MR tool usage shows metacognitive awareness
      mrUsageBoost: summary.mrUtilizationRate * 2,
      // Intervention compliance shows learning orientation
      complianceBoost: summary.interventionActions.complianceRate * 1.5,
      // Overall engagement
      engagementBoost: summary.engagementScore * 2,
      // Specific MR tool usage
      mr1Usage: (summary.mrActions.byMrId['MR1'] || 0) > 0 ? 1 : 0,  // Task decomposition
      mr6Usage: (summary.mrActions.byMrId['MR6'] || 0) > 0 ? 1 : 0,  // Cross-model
      mr11Usage: (summary.mrActions.byMrId['MR11'] || 0) > 0 ? 1 : 0, // Verification
    };
  }
}

export default UserActionTracker;
