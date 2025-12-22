/**
 * Intervention Scheduler: Fatigue-Aware Intervention Decision Making
 *
 * Purpose: Determine whether to display an intervention UI based on:
 * 1. User's behavioral pattern (A-F) for threshold adjustment
 * 2. Behavior detection confidence (from PatternDetector rules)
 * 3. User's fatigue state (dismissal history, engagement)
 * 4. Time decay (suppress for N minutes after dismissal)
 *
 * IMPORTANT: Two types of "confidence" exist in this system:
 *
 * 1. PATTERN CLASSIFICATION CONFIDENCE (Backend, Bayesian+SVM)
 *    - "How sure are we this user is Pattern F?"
 *    - Typically 30-40% due to model uncertainty
 *    - Used to SELECT which pattern the user belongs to (highest probability wins)
 *    - NOT used for intervention thresholds
 *
 * 2. BEHAVIOR DETECTION CONFIDENCE (Frontend, PatternDetector rules)
 *    - "How problematic is the user's CURRENT behavior?"
 *    - 0-100% based on how many rules are triggered
 *    - THIS is what we use for intervention thresholds
 *    - Example: 5/10 rules triggered = 50% confidence
 *
 * Theory: Prevent "intervention fatigue" where users get annoyed at repeated warnings
 * and lose trust in system. After 3 dismissals of same MR type, suppress for 30 minutes.
 *
 * Pattern-based intervention intensity:
 * - Pattern A/B/D/E: Low risk users - minimal intervention (high thresholds)
 * - Pattern C: Medium risk - default thresholds
 * - Pattern F: High risk - aggressive intervention (low thresholds)
 */

/**
 * Intervention type (corresponds to MR numbers in framework)
 */
export type InterventionType =
  | 'MR13_Uncertainty'         // Soft signal: uncertainty
  | 'MR14_Reflection'          // Soft signal: reflection
  | 'MR15_Metacognition'       // Soft signal: metacognition
  | 'MR16_Atrophy'             // Medium: skill atrophy warning
  | 'MR17_Learning'            // Medium: learning process insight
  | 'MR18_OverDependence'      // Medium: over-dependence warning
  | 'MR_PATTERN_F_BARRIER';    // Hard: Pattern F detected (high confidence)

export type InterventionTier = 'soft' | 'medium' | 'hard' | 'suppress';

/**
 * User behavioral pattern type (from qualitative analysis of 49 interviews)
 *
 * Pattern A: Strategic Decomposition - sophisticated pre-planning, strong cognitive control
 * Pattern B: Iterative Refinement - rapid experimentation, learns from failures (3-7 iterations)
 * Pattern C: Context-Sensitive Adaptation - flexible strategies, 44.9% of users
 * Pattern D: Deep Verification - systematic verification, parallel-solving
 * Pattern E: Pedagogical Reflection - learning-oriented, uses AI for self-development
 * Pattern F: Passive Dependency - HIGH RISK, minimal metacognitive engagement
 */
export type UserPatternType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'unknown';

/**
 * Pattern-based BEHAVIOR DETECTION thresholds for tier selection
 *
 * These thresholds are applied to BEHAVIOR DETECTION CONFIDENCE (0-1),
 * NOT to pattern classification confidence.
 *
 * Behavior detection confidence = how many problematic behavior rules are triggered
 * Example: If 3 out of 5 passive dependency rules are triggered, confidence = 0.6
 *
 * Lower thresholds = more likely to trigger interventions
 * Pattern F users get aggressive intervention (low thresholds)
 * Pattern A/B/D/E users rarely need intervention (high thresholds)
 */
export const PATTERN_THRESHOLDS: Record<UserPatternType, { soft: number; medium: number; hard: number }> = {
  // Pattern A: Strategic Decomposition - almost never intervene
  // They do sophisticated pre-planning and have strong cognitive control
  // Only intervene when behavior detection is very high (>90% rules triggered)
  'A': { soft: 0.90, medium: 0.95, hard: 0.99 },

  // Pattern B: Iterative Refinement - rarely intervene
  // They learn from failures and iterate effectively
  'B': { soft: 0.80, medium: 0.90, hard: 0.95 },

  // Pattern D: Deep Verification - minimal intervention
  // They verify systematically themselves
  'D': { soft: 0.85, medium: 0.92, hard: 0.98 },

  // Pattern E: Pedagogical Reflection - minimal intervention
  // They treat AI as learning opportunity, high self-development
  'E': { soft: 0.88, medium: 0.94, hard: 0.99 },

  // Pattern C: Context-Sensitive Adaptation - default thresholds
  // Largest group (44.9%), moderate metacognitive engagement
  // Intervene when moderate problematic behavior detected (>60% rules triggered)
  'C': { soft: 0.60, medium: 0.75, hard: 0.85 },

  // Pattern F: Passive Dependency - AGGRESSIVE intervention!
  // HIGH RISK: minimal verification, 1.2 turns vs 4.7 for Pattern B, <30s review
  // Intervene early when even mild problematic behavior detected (>40% rules triggered)
  'F': { soft: 0.40, medium: 0.55, hard: 0.70 },

  // Unknown: use default (same as C)
  'unknown': { soft: 0.60, medium: 0.75, hard: 0.85 },
};

/**
 * Single user's intervention history
 * Tracks all interactions with interventions
 */
export interface UserInterventionHistory {
  [mrType: string]: {
    dismissalCount: number;           // Total times user dismissed this MR
    lastDismissalTime: number;        // Timestamp of last dismissal (ms)
    userActedOnCount: number;         // Times user clicked "Learn more" or action button
    cumulativeExposureMs: number;     // Total milliseconds MR was visible
    createdAtMs: number;              // When we first showed this MR type
  };
}

/**
 * User's current suppression state
 * Tracks which MR types are currently suppressed (due to fatigue)
 */
export interface InterventionSuppressionState {
  suppressedMRTypes: Set<string>;     // MR types currently suppressed
  suppressionExpiresAt: {
    [mrType: string]: number;         // When suppression expires for each MR (timestamp ms)
  };
  lastCalculatedFatigueScore: number; // Most recent overall fatigue score
  lastCalculatedAt: number;           // When fatigue was last recalculated
}

/**
 * Decision result: whether to show intervention and why
 */
export interface InterventionSchedulingDecision {
  shouldDisplay: boolean;
  tier: InterventionTier;
  reason: string;

  // Fatigue context
  fatigueScore: number;                // 0-100
  dismissalCount: number;
  suppressedUntil: number | null;      // Timestamp if suppressed, null if not

  // Metadata for logging
  requiresAuthorization?: boolean;     // Hard barriers must be explicitly handled
}

/**
 * ============================================================
 * CORE ALGORITHM: Fatigue Score Calculation
 * ============================================================
 *
 * Fatigue = how annoyed/tired user is of this specific MR type
 * 0-100 scale
 *
 * Increases when:
 * - User dismisses without acting (dismissalCount)
 * - User never engages with this MR type (userActedOnCount = 0)
 * - MR has been shown for long time
 *
 * Decreases when:
 * - Time passes since last dismissal (>30 min = reset)
 */

export function calculateFatigueScore(
  mrType: string,
  history: UserInterventionHistory
): number {
  const stats = history[mrType];

  // If no history, fatigue is 0
  if (!stats) return 0;

  let fatigueScore = 0;

  // ===== FACTOR 1: Dismissal Count (0-40 points) =====
  // After 3 dismissals, fatigue is high
  const { dismissalCount } = stats;

  if (dismissalCount >= 3) {
    fatigueScore += 40; // Max from dismissals
  } else if (dismissalCount === 2) {
    fatigueScore += 20;
  } else if (dismissalCount === 1) {
    fatigueScore += 10;
  }

  // ===== FACTOR 2: Zero Engagement (0-30 points) =====
  // If user never acted on this MR type AND dismissed multiple times
  // → high fatigue
  const { userActedOnCount } = stats;

  if (userActedOnCount === 0 && dismissalCount >= 2) {
    fatigueScore += 30; // User consistently ignoring this MR type
  } else if (userActedOnCount === 0 && dismissalCount === 1) {
    fatigueScore += 10;
  }

  // ===== FACTOR 3: Exposure Time (0-20 points) =====
  // If MR been shown for cumulative > 10 minutes, slight fatigue
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  if (stats.cumulativeExposureMs > TEN_MINUTES_MS) {
    fatigueScore += Math.min(
      20,
      (stats.cumulativeExposureMs / TEN_MINUTES_MS) * 20
    );
  }

  // ===== FACTOR 4: Time Decay (multiplicative) =====
  // Reset fatigue after 30 minutes of no dismissals
  const THIRTY_MINUTES_MS = 30 * 60 * 1000;
  const timeSinceLastDismissal = Date.now() - stats.lastDismissalTime;

  if (timeSinceLastDismissal > THIRTY_MINUTES_MS) {
    // User has been calm for 30 minutes → reset fatigue by half
    fatigueScore *= 0.5;
  } else if (timeSinceLastDismissal > 15 * 60 * 1000) {
    // 15 minutes → partial decay
    fatigueScore *= 0.75;
  }

  // Normalize to 0-100
  return Math.min(fatigueScore, 100);
}

/**
 * Determine if intervention should be suppressed due to fatigue
 *
 * Rules:
 * 1. If fatigue >= 40 AND dismissalCount >= 3 → suppress for 30 min
 * 2. If fatigue > 70 → suppress for 15 min (temporary break)
 * 3. Respect explicit suppression timers
 */
export function shouldSuppressIntervention(
  mrType: string,
  fatigueScore: number,
  dismissalCount: number,
  suppressionExpiresAt: number | null
): boolean {
  // Rule 1: Check explicit suppression timer
  if (suppressionExpiresAt && Date.now() < suppressionExpiresAt) {
    return true;
  }

  // Rule 2: After 3 dismissals, suppress for 30 min
  if (dismissalCount >= 3 && fatigueScore >= 40) {
    return true;
  }

  // Rule 3: If overall fatigue > 70, take a break
  if (fatigueScore > 70) {
    return true;
  }

  return false;
}

/**
 * Calculate when suppression should expire
 *
 * Based on fatigue level:
 * - After 3 dismissals: suppress 30 minutes
 * - Fatigue > 70: suppress 15 minutes
 * - After 2 dismissals: suppress 10 minutes
 * - After 1 dismissal: suppress 5 minutes
 */
export function calculateSuppressionExpiry(
  fatigueScore: number,
  dismissalCount: number
): number {
  let suppressionDurationMs: number;

  if (dismissalCount >= 3) {
    suppressionDurationMs = 30 * 60 * 1000; // 30 minutes
  } else if (fatigueScore > 70) {
    suppressionDurationMs = 15 * 60 * 1000; // 15 minutes
  } else if (dismissalCount === 2) {
    suppressionDurationMs = 10 * 60 * 1000; // 10 minutes
  } else if (dismissalCount === 1) {
    suppressionDurationMs = 5 * 60 * 1000; // 5 minutes
  } else {
    return 0; // No suppression
  }

  return Date.now() + suppressionDurationMs;
}

/**
 * Main decision function: Should we display this intervention?
 *
 * Considers:
 * 1. User's behavioral pattern (A-F) for threshold adjustment
 * 2. Confidence level from pattern detection
 * 3. Fatigue score
 * 4. Suppression timers
 *
 * Returns decision and reasoning
 */
export function scheduleIntervention(
  mrType: InterventionType,
  patternConfidence: number,
  recommendedTier: string,
  userHistory: UserInterventionHistory,
  suppressionState: InterventionSuppressionState,
  userPattern: UserPatternType = 'unknown'
): InterventionSchedulingDecision {
  // Get thresholds based on user's behavioral pattern
  const thresholds = PATTERN_THRESHOLDS[userPattern];
  // Get fatigue score for this specific MR type
  const fatigueScore = calculateFatigueScore(mrType, userHistory);

  // Get dismissal count
  const dismissalCount = userHistory[mrType]?.dismissalCount || 0;

  // Get current suppression timer
  const suppressionExpiresAt = suppressionState.suppressionExpiresAt[mrType] || null;

  // Check if should suppress
  const isSuppressed = shouldSuppressIntervention(
    mrType,
    fatigueScore,
    dismissalCount,
    suppressionExpiresAt
  );

  // Decision logic
  if (isSuppressed) {
    return {
      shouldDisplay: false,
      tier: 'suppress',
      reason:
        dismissalCount >= 3
          ? `User dismissed ${mrType} ${dismissalCount} times. Suppressed for 30 minutes (fatigue management).`
          : `Suppressed due to high fatigue score (${fatigueScore.toFixed(1)}/100). Taking break.`,
      fatigueScore,
      dismissalCount,
      suppressedUntil: suppressionExpiresAt,
    };
  }

  // If not suppressed, determine tier to display
  // Hard barriers show even if fatigue is high (safety takes priority)
  if (mrType === 'MR_PATTERN_F_BARRIER') {
    // Hard barrier: only show if confidence exceeds pattern-specific hard threshold
    if (patternConfidence >= thresholds.hard) {
      return {
        shouldDisplay: true,
        tier: 'hard',
        reason: `Pattern F detected with ${(patternConfidence * 100).toFixed(0)}% confidence (threshold: ${(thresholds.hard * 100).toFixed(0)}% for Pattern ${userPattern}). Hard barrier required for safety.`,
        fatigueScore,
        dismissalCount,
        suppressedUntil: null,
        requiresAuthorization: true,
      };
    } else {
      return {
        shouldDisplay: false,
        tier: 'suppress',
        reason: `Pattern F confidence (${(patternConfidence * 100).toFixed(0)}%) below hard barrier threshold (${(thresholds.hard * 100).toFixed(0)}% for Pattern ${userPattern}). Not showing hard intervention.`,
        fatigueScore,
        dismissalCount,
        suppressedUntil: null,
      };
    }
  }

  // Tier selection based on pattern-specific thresholds
  // Pattern F users get intervention at lower confidence (more aggressive)
  // Pattern A/B/D/E users rarely see interventions (high thresholds)
  if (patternConfidence >= thresholds.medium) {
    return {
      shouldDisplay: true,
      tier: 'medium',
      reason: `Confidence ${(patternConfidence * 100).toFixed(0)}% >= medium threshold ${(thresholds.medium * 100).toFixed(0)}% (Pattern ${userPattern}). Showing medium alert.`,
      fatigueScore,
      dismissalCount,
      suppressedUntil: null,
    };
  }

  if (patternConfidence >= thresholds.soft) {
    return {
      shouldDisplay: true,
      tier: 'soft',
      reason: `Confidence ${(patternConfidence * 100).toFixed(0)}% >= soft threshold ${(thresholds.soft * 100).toFixed(0)}% (Pattern ${userPattern}). Showing soft signal.`,
      fatigueScore,
      dismissalCount,
      suppressedUntil: null,
    };
  }

  // Below pattern-specific soft threshold
  return {
    shouldDisplay: false,
    tier: 'suppress',
    reason: `Confidence (${(patternConfidence * 100).toFixed(0)}%) below soft threshold (${(thresholds.soft * 100).toFixed(0)}% for Pattern ${userPattern}). Not showing intervention.`,
    fatigueScore,
    dismissalCount,
    suppressedUntil: null,
  };
}

/**
 * Record user action on intervention
 * Update history and suppression state accordingly
 */
export function recordInterventionAction(
  mrType: string,
  action: 'dismiss' | 'skip' | 'acted' | 'override',
  history: UserInterventionHistory,
  suppressionState: InterventionSuppressionState
): {
  updatedHistory: UserInterventionHistory;
  updatedSuppressionState: InterventionSuppressionState;
  fatigueAlert?: string; // Message if fatigue threshold reached
} {
  // Initialize if not exists
  if (!history[mrType]) {
    history[mrType] = {
      dismissalCount: 0,
      lastDismissalTime: 0,
      userActedOnCount: 0,
      cumulativeExposureMs: 0,
      createdAtMs: Date.now(),
    };
  }

  const updatedHistory = { ...history };
  const updatedSuppression = {
    ...suppressionState,
    suppressionExpiresAt: { ...suppressionState.suppressionExpiresAt },
  };

  // Update based on action
  if (action === 'dismiss' || action === 'skip') {
    updatedHistory[mrType].dismissalCount += 1;
    updatedHistory[mrType].lastDismissalTime = Date.now();

    // Calculate new fatigue and determine suppression
    const newFatigue = calculateFatigueScore(mrType, updatedHistory);
    const newDismissalCount = updatedHistory[mrType].dismissalCount;
    const suppressionExpiry = calculateSuppressionExpiry(newFatigue, newDismissalCount);

    if (suppressionExpiry > 0) {
      updatedSuppression.suppressionExpiresAt[mrType] = suppressionExpiry;
      updatedSuppression.suppressedMRTypes.add(mrType);
    }

    // Check if we reached fatigue threshold
    let fatigueAlert = undefined;
    if (newDismissalCount === 3) {
      fatigueAlert = `You've dismissed this tip 3 times. We'll give you more space for 30 minutes. You're in control! 🎯`;
    }

    return {
      updatedHistory,
      updatedSuppressionState: updatedSuppression,
      fatigueAlert,
    };
  } else if (action === 'acted') {
    updatedHistory[mrType].userActedOnCount += 1;

    // Acting on intervention reduces fatigue
    // Reset dismissal counter (user is engaging)
    updatedHistory[mrType].dismissalCount = 0;
    updatedHistory[mrType].lastDismissalTime = Date.now();

    // Clear suppression for this MR
    updatedSuppression.suppressedMRTypes.delete(mrType);
    delete updatedSuppression.suppressionExpiresAt[mrType];

    return {
      updatedHistory,
      updatedSuppressionState: updatedSuppression,
    };
  } else if (action === 'override') {
    // User proceeded despite hard barrier
    // This is valuable data - don't suppress

    updatedHistory[mrType].userActedOnCount += 1; // Count as engagement

    // Clear suppression
    updatedSuppression.suppressedMRTypes.delete(mrType);
    delete updatedSuppression.suppressionExpiresAt[mrType];

    return {
      updatedHistory,
      updatedSuppressionState: updatedSuppression,
    };
  }

  return {
    updatedHistory,
    updatedSuppressionState: updatedSuppression,
  };
}

/**
 * Calculate overall user fatigue (0-100)
 * Average fatigue across all MR types with active intervention history
 */
export function calculateOverallFatigue(
  history: UserInterventionHistory
): number {
  const mrTypes = Object.keys(history);

  if (mrTypes.length === 0) return 0;

  const fatigueScores = mrTypes.map((mrType) =>
    calculateFatigueScore(mrType, history)
  );

  const averageFatigue =
    fatigueScores.reduce((a, b) => a + b, 0) / fatigueScores.length;

  return averageFatigue;
}

/**
 * Get summary of current suppression state
 * Useful for dashboard and monitoring
 */
export function getSuppressionSummary(
  suppressionState: InterventionSuppressionState
): {
  activeSuppressionsCount: number;
  suppessionsByType: Array<{
    mrType: string;
    suppressedUntil: number;
    minutesRemaining: number;
  }>;
} {
  const suppressionEntries = Object.entries(
    suppressionState.suppressionExpiresAt
  ).filter(([_, expiresAt]) => Date.now() < expiresAt);

  return {
    activeSuppressionsCount: suppressionEntries.length,
    suppessionsByType: suppressionEntries.map(([mrType, expiresAt]) => ({
      mrType,
      suppressedUntil: expiresAt,
      minutesRemaining: Math.ceil((expiresAt - Date.now()) / 60000),
    })),
  };
}
