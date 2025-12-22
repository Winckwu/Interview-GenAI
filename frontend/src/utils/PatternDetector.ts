/**
 * Pattern F Detection Framework
 *
 * Implements Layer 1 (hard rules) for detecting ineffective AI use patterns
 * Based on self-regulated learning theory (Zimmerman, 2002; Panadero, 2017)
 *
 * Rules do NOT require synthetic data or ML model training.
 * Fully defensible from academic perspective.
 *
 * ⚠️ IMPORTANT: Measurement Limitations (Proxy Measures)
 * =====================================================
 * This system CANNOT perform full behavioral monitoring. All metrics are
 * PROXY MEASURES (代理指标), not direct behavioral observations:
 *
 * | Metric              | What We Measure                    | What We CANNOT Detect           |
 * |---------------------|------------------------------------|---------------------------------|
 * | verificationRate    | User clicks "Verified" button      | External verification (Google)  |
 * | modificationRate    | User edits AI response in-system   | Mental review without editing   |
 * | acceptanceSpeed     | Time between AI response & next    | What user did during that time  |
 * | rejectionRate       | User clicks "Reject" button        | Silent disagreement             |
 *
 * Technical Honesty:
 * - We CANNOT detect if user opens another browser tab to verify
 * - We CANNOT detect if user mentally reviews without clicking
 * - We CANNOT detect external research or consultation
 * - All "verification" metrics are SELF-REPORTED via UI buttons
 *
 * These proxy measures correlate with but do not directly measure metacognitive behavior.
 * Use with appropriate epistemic humility.
 */

import { Interaction } from '../types';

/**
 * User interaction signals needed for pattern detection
 *
 * ⚠️ Signal Confidence Classification:
 * - HIGHEST: Direct in-system actions (wasModified, wasVerified, wasRejected)
 * - HIGH: Observable interaction events (copyCount, selectionCount, followUpCount)
 * - MEDIUM: Timing signals (dwellTime, hoverDuration, scrollDepth)
 * - LOW: Indirect signals (tabSwitchCount) - we see the switch, not the activity
 */
export interface UserSignals {
  // Input characteristics
  averageInputLength: number;      // Average chars per user message
  averageAcceptanceSpeed: number;  // Average ms from AI response → user accepts

  // ===== LEGACY: Button-click signals (HIGHEST confidence, but requires explicit action) =====
  verificationRate: number;        // % of interactions verified via button (0-100)
  modificationRate: number;        // % of interactions modified (0-100)
  rejectionRate: number;           // % of interactions rejected (0-100)

  // ===== NEW: Enhanced observable behavior signals =====

  // Timing signals (MEDIUM confidence)
  averageDwellTimeMs: number;      // Average time spent viewing AI response
  averageHoverDurationMs: number;  // Average hover time on response

  // Copy/Selection signals (HIGH confidence - indicates external verification intent)
  copyEventRate: number;           // % of responses where user copied text (0-100)
  averageCopiedTextLength: number; // Average chars copied per copy event
  selectionEventRate: number;      // % of responses where user selected text (0-100)

  // Tab visibility signals (LOW confidence - we see switch, not activity)
  tabSwitchRate: number;           // % of responses where user switched tabs (0-100)
  averageTabAwayDurationMs: number;// Average time spent away from tab

  // Scroll signals (MEDIUM confidence)
  averageScrollDepth: number;      // Average scroll depth (0-100%)
  deepScrollRate: number;          // % of responses scrolled >80% (0-100)

  // Follow-up signals (HIGH confidence - indicates critical engagement)
  followUpQuestionRate: number;    // % of responses followed by clarifying question (0-100)

  // Temporal patterns
  inputOutputRatio: number;        // Average input length / average output length
  lastInteractionGap: number;      // Minutes since last interaction
  sessionBurstiness: number;       // 0-100: concentration of interactions in time

  // Total engagement
  totalInteractions: number;
  totalVerifications: number;
  totalModifications: number;
  totalRejections: number;

  // ===== NEW: Derived composite scores =====
  engagementScore: number;              // 0-100: Overall engagement level
  verificationLikelihood: number;       // 0-100: Estimated verification probability
  criticalThinkingIndicator: number;    // 0-100: Evidence of critical engagement
}

/**
 * Rule weight configuration for weighted confidence scoring
 *
 * Weights are based on signal confidence and behavioral significance:
 * - HIGHEST (20%): Core passivity indicators with direct measurement
 * - HIGH (15%): Strong behavioral signals with reliable detection
 * - MEDIUM (10%): Supportive signals that add context
 * - LOW (5%): Weak or indirect signals
 */
export const RULE_WEIGHTS: Record<string, number> = {
  // Core passivity rules (HIGHEST weight)
  'F-R5': 0.20,  // Complete passivity - most severe
  'F-R2': 0.15,  // Zero verification - core SRL failure

  // Behavioral pattern rules (HIGH weight)
  'F-R3': 0.15,  // Input/output ratio - non-critical acceptance
  'F-R6': 0.12,  // Low dwell time - not reading carefully
  'F-R7': 0.10,  // No external verification signals

  // Contextual rules (MEDIUM weight)
  'F-R1': 0.10,  // Quick acceptance - may have false positives
  'F-R8': 0.08,  // No follow-up questions

  // Temporal rules (LOW weight - less reliable)
  'F-R4': 0.05,  // Burst pattern - can be legitimate
  'F-R9': 0.05,  // No deep scrolling
};

/**
 * Result of running all Layer 1 rules
 */
export interface Layer1RuleResults {
  rule_F1_passed: boolean;     // Input length + acceptance speed
  rule_F2_passed: boolean;     // Verification behavior gap
  rule_F3_passed: boolean;     // Input/output ratio
  rule_F4_passed: boolean;     // Temporal pattern (burst then silence)
  rule_F5_passed: boolean;     // Complete passivity
  // NEW: Enhanced behavioral rules
  rule_F6_passed: boolean;     // Low dwell time
  rule_F7_passed: boolean;     // No copy/selection events
  rule_F8_passed: boolean;     // No follow-up questions
  rule_F9_passed: boolean;     // No deep scrolling

  triggeredCount: number;      // Total rules triggered (0-9)
  triggeredRules: string[];    // Names of triggered rules
  weightedConfidence: number;  // Weighted confidence (0-1)
}

/**
 * Full Pattern F detection result
 */
export interface PatternFDetectionResult {
  // Layer 1 results
  layer1: Layer1RuleResults;

  // Confidence score based on rule count
  confidence: number;          // 0-1, calculated from triggered rules
  confidenceLevel: 'low' | 'medium' | 'high';

  // Recommendation for intervention
  recommendedTier: 'none' | 'soft' | 'medium' | 'hard';

  // Detailed explanation
  explanation: {
    summary: string;
    triggeredRuleDetails: Array<{
      ruleName: string;
      description: string;
      detectedValue: any;
      threshold: any;
    }>;
  };
}

/**
 * LAYER 1, RULE F-R1: Input Length + Acceptance Speed
 *
 * Theory: Skimming without deep engagement
 * If user sends long input but accepts AI response very quickly (< 10 seconds),
 * suggests they're not carefully reading the response.
 *
 * Threshold:
 *   Input > 500 chars AND acceptance time < 10 seconds → triggered
 */
export const checkRule_F1_InputLengthSpeed = (signals: UserSignals): boolean => {
  const LONG_INPUT_THRESHOLD = 500;  // characters
  const QUICK_ACCEPTANCE_MS = 10000; // 10 seconds

  return (
    signals.averageInputLength > LONG_INPUT_THRESHOLD &&
    signals.averageAcceptanceSpeed < QUICK_ACCEPTANCE_MS
  );
};

/**
 * LAYER 1, RULE F-R2: Verification Behavior Gap
 *
 * Theory: Zero quality assurance practice
 * Self-regulated learners verify their work (Zimmerman, 2002).
 * If user has 5+ interactions but zero verifications, indicates passive consumption.
 *
 * Threshold:
 *   Total interactions >= 5 AND verification rate = 0% → triggered
 */
export const checkRule_F2_VerificationGap = (signals: UserSignals): boolean => {
  const MIN_INTERACTIONS = 5;

  return (
    signals.totalInteractions >= MIN_INTERACTIONS &&
    signals.verificationRate === 0
  );
};

/**
 * LAYER 1, RULE F-R3: Input/Output Ratio + No Modifications
 *
 * Theory: Accepting verbatim without critical review
 * When user provides substantial input but accepts output unchanged,
 * suggests non-critical engagement.
 *
 * Critical thinking requires modification/verification.
 *
 * Threshold:
 *   Input/output ratio < 0.2 (user inputs short, AI outputs long)
 *   AND modification rate = 0% → triggered
 */
export const checkRule_F3_InputOutputRatio = (signals: UserSignals): boolean => {
  const INPUT_OUTPUT_RATIO_THRESHOLD = 0.2;

  return (
    signals.inputOutputRatio < INPUT_OUTPUT_RATIO_THRESHOLD &&
    signals.modificationRate === 0
  );
};

/**
 * LAYER 1, RULE F-R4: Temporal Pattern (Burst then Silence)
 *
 * Theory: Task-completion mindset, not learning orientation
 * Learners spread practice over time (spacing effect).
 * If all interactions happen in short burst (e.g., 2 hours) then long gap (7+ days),
 * suggests user completed task and left, rather than returning to learn.
 *
 * Threshold:
 *   All interactions within 2-hour window AND > 7 days since last interaction → triggered
 */
export const checkRule_F4_TemporalBurstPattern = (
  interactions: Interaction[]
): boolean => {
  if (interactions.length < 5) return false;

  // Calculate time span of interactions
  const timestamps = interactions.map((i) => new Date(i.timestamp).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const totalSpanMs = maxTime - minTime;
  const totalSpanHours = totalSpanMs / (1000 * 60 * 60);

  // Check if all within 2-hour window
  const isBurst = totalSpanHours <= 2;

  // Check time since last interaction
  const lastTimestamp = maxTime;
  const nowMs = Date.now();
  const daysSinceLastMs = (nowMs - lastTimestamp) / (1000 * 60 * 60 * 24);

  return isBurst && daysSinceLastMs > 7;
};

/**
 * LAYER 1, RULE F-R5: Complete Passivity
 *
 * Theory: Zero metacognitive signals
 * Users who engage in SRL show at least some: verification, modification, or rejection.
 * Complete absence suggests passive consumption with no critical review.
 *
 * Threshold:
 *   Reject rate = 0% AND verify rate = 0% AND modify rate = 0% → triggered
 */
export const checkRule_F5_CompletePassivity = (signals: UserSignals): boolean => {
  return (
    signals.rejectionRate === 0 &&
    signals.verificationRate === 0 &&
    signals.modificationRate === 0
  );
};

/**
 * LAYER 1, RULE F-R6: Low Dwell Time
 *
 * Theory: Insufficient time to process AI response
 * Research shows reading comprehension requires minimum time per word.
 * If average dwell time is very low (<5 seconds), user isn't reading carefully.
 *
 * Threshold:
 *   Total interactions >= 3 AND averageDwellTimeMs < 5000ms → triggered
 */
export const checkRule_F6_LowDwellTime = (signals: UserSignals): boolean => {
  const MIN_INTERACTIONS = 3;
  const MIN_DWELL_TIME_MS = 5000; // 5 seconds

  return (
    signals.totalInteractions >= MIN_INTERACTIONS &&
    signals.averageDwellTimeMs > 0 && // Only check if we have dwell time data
    signals.averageDwellTimeMs < MIN_DWELL_TIME_MS
  );
};

/**
 * LAYER 1, RULE F-R7: No External Verification Signals
 *
 * Theory: Lack of cross-referencing behavior
 * Users who verify AI output often copy text to search externally or select text to review.
 * Zero copy/selection events after multiple interactions suggests blind acceptance.
 *
 * Threshold:
 *   Total interactions >= 5 AND copyEventRate = 0% AND selectionEventRate = 0% → triggered
 */
export const checkRule_F7_NoExternalVerification = (signals: UserSignals): boolean => {
  const MIN_INTERACTIONS = 5;

  return (
    signals.totalInteractions >= MIN_INTERACTIONS &&
    signals.copyEventRate === 0 &&
    signals.selectionEventRate === 0
  );
};

/**
 * LAYER 1, RULE F-R8: No Follow-Up Questions
 *
 * Theory: Lack of critical engagement
 * Critical thinkers ask clarifying questions when receiving complex information.
 * Zero follow-up questions after receiving long AI responses suggests passive acceptance.
 *
 * Threshold:
 *   Total interactions >= 3 AND followUpQuestionRate = 0% → triggered
 */
export const checkRule_F8_NoFollowUpQuestions = (signals: UserSignals): boolean => {
  const MIN_INTERACTIONS = 3;

  return (
    signals.totalInteractions >= MIN_INTERACTIONS &&
    signals.followUpQuestionRate === 0
  );
};

/**
 * LAYER 1, RULE F-R9: No Deep Scrolling
 *
 * Theory: Not reading full response
 * Long AI responses require scrolling to read completely.
 * Low scroll depth suggests user only skims the beginning.
 *
 * Threshold:
 *   Total interactions >= 3 AND deepScrollRate < 20% → triggered
 *   (deepScrollRate = % of responses scrolled >80%)
 */
export const checkRule_F9_NoDeepScrolling = (signals: UserSignals): boolean => {
  const MIN_INTERACTIONS = 3;
  const MIN_DEEP_SCROLL_RATE = 20; // At least 20% of responses should be deeply scrolled

  return (
    signals.totalInteractions >= MIN_INTERACTIONS &&
    signals.deepScrollRate < MIN_DEEP_SCROLL_RATE
  );
};

/**
 * Calculate weighted confidence score from triggered rules
 *
 * Unlike simple count-based scoring, this uses weighted scoring:
 * - Core passivity rules contribute more
 * - Contextual rules contribute less
 * - Total weights sum to 1.0
 */
export const calculateWeightedConfidence = (triggeredRules: string[]): number => {
  let totalWeight = 0;
  for (const rule of triggeredRules) {
    totalWeight += RULE_WEIGHTS[rule] || 0;
  }
  return Math.min(totalWeight, 1.0);
};

/**
 * Calculate confidence score from triggered rules
 *
 * LEGACY: Simple count-based scoring (kept for backwards compatibility)
 * Each rule contributes 1/9 to confidence (now 9 rules total)
 */
export const calculateConfidence = (triggeredRuleCount: number): number => {
  return Math.min(triggeredRuleCount / 9, 1.0);
};

/**
 * Map confidence to readable level
 */
export const getConfidenceLevel = (
  confidence: number
): 'low' | 'medium' | 'high' => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
};

/**
 * Determine intervention tier based on weighted confidence
 * Used by InterventionScheduler to decide what to display
 *
 * Thresholds (updated for weighted scoring system):
 * - Hard: >= 0.50 weighted + must include F-R5 (complete passivity)
 * - Medium: >= 0.35 weighted (core passivity indicators triggered)
 * - Soft: >= 0.15 weighted (at least one moderate signal)
 *
 * The weighted system ensures that:
 * - F-R5 (20%) + F-R2 (15%) = 35% → Medium tier
 * - F-R5 (20%) + F-R2 (15%) + F-R3 (15%) = 50% → Hard tier (with F-R5)
 */
export const recommendInterventionTier = (
  confidence: number,
  triggeredRules: string[]
): 'none' | 'soft' | 'medium' | 'hard' => {
  // Hard barrier if:
  // - Weighted confidence >= 0.50
  // - Must include F-R5 (complete passivity) for safety check
  if (confidence >= 0.50 && triggeredRules.includes('F-R5')) {
    return 'hard';
  }

  // Medium warning if weighted confidence >= 0.35
  // This triggers when core passivity indicators are present
  if (confidence >= 0.35) {
    return 'medium';
  }

  // Soft signal if weighted confidence >= 0.15
  // This provides gentle nudge for early warning signs
  if (confidence >= 0.15) {
    return 'soft';
  }

  return 'none';
};

/**
 * Main detection function
 * Run all Layer 1 rules and return comprehensive result
 */
export function detectPatternF(
  signals: UserSignals,
  interactions: Interaction[]
): PatternFDetectionResult {
  // Run all 9 rules (original 5 + 4 new enhanced rules)
  const rule_F1 = checkRule_F1_InputLengthSpeed(signals);
  const rule_F2 = checkRule_F2_VerificationGap(signals);
  const rule_F3 = checkRule_F3_InputOutputRatio(signals);
  const rule_F4 = checkRule_F4_TemporalBurstPattern(interactions);
  const rule_F5 = checkRule_F5_CompletePassivity(signals);
  // NEW: Enhanced behavioral rules
  const rule_F6 = checkRule_F6_LowDwellTime(signals);
  const rule_F7 = checkRule_F7_NoExternalVerification(signals);
  const rule_F8 = checkRule_F8_NoFollowUpQuestions(signals);
  const rule_F9 = checkRule_F9_NoDeepScrolling(signals);

  // Collect results
  const triggeredRules: string[] = [];
  if (rule_F1) triggeredRules.push('F-R1');
  if (rule_F2) triggeredRules.push('F-R2');
  if (rule_F3) triggeredRules.push('F-R3');
  if (rule_F4) triggeredRules.push('F-R4');
  if (rule_F5) triggeredRules.push('F-R5');
  if (rule_F6) triggeredRules.push('F-R6');
  if (rule_F7) triggeredRules.push('F-R7');
  if (rule_F8) triggeredRules.push('F-R8');
  if (rule_F9) triggeredRules.push('F-R9');

  const triggeredCount = triggeredRules.length;
  // Use weighted confidence for more accurate severity assessment
  const weightedConfidence = calculateWeightedConfidence(triggeredRules);
  const confidence = weightedConfidence; // Primary confidence is now weighted
  const confidenceLevel = getConfidenceLevel(confidence);
  const recommendedTier = recommendInterventionTier(confidence, triggeredRules);

  // Build explanation
  const triggeredRuleDetails = [];

  if (rule_F1) {
    triggeredRuleDetails.push({
      ruleName: 'F-R1: Input Length + Speed',
      description: 'Long input but very quick acceptance suggests skimming',
      detectedValue: {
        averageInputLength: signals.averageInputLength,
        averageAcceptanceSpeed: `${signals.averageAcceptanceSpeed}ms`,
      },
      threshold: {
        inputLength: '> 500 chars',
        acceptanceSpeed: '< 10 seconds',
      },
    });
  }

  if (rule_F2) {
    triggeredRuleDetails.push({
      ruleName: 'F-R2: Verification Gap',
      description: 'Multiple interactions but zero verifications indicates passive use',
      detectedValue: {
        totalInteractions: signals.totalInteractions,
        verificationRate: '0%',
      },
      threshold: {
        minInteractions: '>= 5',
        verificationRate: '= 0%',
      },
    });
  }

  if (rule_F3) {
    triggeredRuleDetails.push({
      ruleName: 'F-R3: Input/Output Ratio',
      description: 'Accepting long responses without modification suggests non-critical review',
      detectedValue: {
        inputOutputRatio: signals.inputOutputRatio.toFixed(2),
        modificationRate: '0%',
      },
      threshold: {
        ratio: '< 0.2',
        modificationRate: '= 0%',
      },
    });
  }

  if (rule_F4) {
    triggeredRuleDetails.push({
      ruleName: 'F-R4: Temporal Pattern',
      description: 'All interactions in short burst followed by long gap suggests task-completion mindset',
      detectedValue: {
        pattern: 'Burst within 2 hours, then 7+ day gap',
        sessionBurstiness: `${signals.sessionBurstiness}%`,
      },
      threshold: {
        burstWindow: '<= 2 hours',
        silenceGap: '> 7 days',
      },
    });
  }

  if (rule_F5) {
    triggeredRuleDetails.push({
      ruleName: 'F-R5: Complete Passivity',
      description: 'No verification, modification, or rejection indicates zero metacognitive engagement',
      detectedValue: {
        verificationRate: '0%',
        modificationRate: '0%',
        rejectionRate: '0%',
      },
      threshold: {
        all: '= 0%',
      },
    });
  }

  // NEW: Add explanation details for enhanced rules (F-R6 to F-R9)
  if (rule_F6) {
    triggeredRuleDetails.push({
      ruleName: 'F-R6: Low Dwell Time',
      description: 'Very short viewing time suggests not reading AI response carefully',
      detectedValue: {
        averageDwellTimeMs: `${signals.averageDwellTimeMs.toFixed(0)}ms`,
        totalInteractions: signals.totalInteractions,
      },
      threshold: {
        dwellTime: '< 5000ms',
        minInteractions: '>= 3',
      },
    });
  }

  if (rule_F7) {
    triggeredRuleDetails.push({
      ruleName: 'F-R7: No External Verification',
      description: 'No copy or selection events suggests no cross-referencing with external sources',
      detectedValue: {
        copyEventRate: `${signals.copyEventRate}%`,
        selectionEventRate: `${signals.selectionEventRate}%`,
      },
      threshold: {
        copyRate: '= 0%',
        selectionRate: '= 0%',
        minInteractions: '>= 5',
      },
    });
  }

  if (rule_F8) {
    triggeredRuleDetails.push({
      ruleName: 'F-R8: No Follow-Up Questions',
      description: 'No clarifying questions after AI responses suggests passive acceptance',
      detectedValue: {
        followUpQuestionRate: `${signals.followUpQuestionRate}%`,
        totalInteractions: signals.totalInteractions,
      },
      threshold: {
        followUpRate: '= 0%',
        minInteractions: '>= 3',
      },
    });
  }

  if (rule_F9) {
    triggeredRuleDetails.push({
      ruleName: 'F-R9: No Deep Scrolling',
      description: 'Low scroll depth suggests only skimming the beginning of responses',
      detectedValue: {
        deepScrollRate: `${signals.deepScrollRate}%`,
        averageScrollDepth: `${signals.averageScrollDepth.toFixed(0)}%`,
      },
      threshold: {
        deepScrollRate: '< 20%',
        minInteractions: '>= 3',
      },
    });
  }

  // Generate summary based on weighted confidence
  const getSummary = (): string => {
    if (weightedConfidence === 0) {
      return 'No Pattern F indicators detected. User shows normal engagement.';
    } else if (weightedConfidence < 0.15) {
      return `Very low risk (${(weightedConfidence * 100).toFixed(0)}%): Minor signals detected, no intervention needed.`;
    } else if (weightedConfidence < 0.35) {
      return `Low risk (${(weightedConfidence * 100).toFixed(0)}%): ${triggeredCount} rule(s) triggered. Soft intervention recommended.`;
    } else if (weightedConfidence < 0.50) {
      return `Medium risk (${(weightedConfidence * 100).toFixed(0)}%): ${triggeredCount} rules triggered. Medium intervention recommended.`;
    } else {
      return `High risk (${(weightedConfidence * 100).toFixed(0)}%): ${triggeredCount} rules triggered. Hard barrier recommended.`;
    }
  };

  return {
    layer1: {
      rule_F1_passed: rule_F1,
      rule_F2_passed: rule_F2,
      rule_F3_passed: rule_F3,
      rule_F4_passed: rule_F4,
      rule_F5_passed: rule_F5,
      rule_F6_passed: rule_F6,
      rule_F7_passed: rule_F7,
      rule_F8_passed: rule_F8,
      rule_F9_passed: rule_F9,
      triggeredCount,
      triggeredRules,
      weightedConfidence,
    },
    confidence,
    confidenceLevel,
    recommendedTier,
    explanation: {
      summary: getSummary(),
      triggeredRuleDetails,
    },
  };
}

/**
 * Helper: Extract UserSignals from interaction history
 * This would typically be called in ChatSessionPage to prepare data
 *
 * @param messages - Array of messages (user/AI) or interactions
 * @param behaviorSignals - Optional enhanced behavior signals from useBehaviorSignals hook
 */
export function extractUserSignals(
  messages: any[],
  behaviorSignals?: Map<string, any>
): UserSignals {
  // Default empty signals with all new fields
  const emptySignals: UserSignals = {
    averageInputLength: 0,
    averageAcceptanceSpeed: 0,
    verificationRate: 0,
    modificationRate: 0,
    rejectionRate: 0,
    // NEW: Enhanced signals with defaults
    averageDwellTimeMs: 0,
    averageHoverDurationMs: 0,
    copyEventRate: 0,
    averageCopiedTextLength: 0,
    selectionEventRate: 0,
    tabSwitchRate: 0,
    averageTabAwayDurationMs: 0,
    averageScrollDepth: 0,
    deepScrollRate: 0,
    followUpQuestionRate: 0,
    // Temporal
    inputOutputRatio: 0,
    lastInteractionGap: 0,
    sessionBurstiness: 0,
    // Totals
    totalInteractions: 0,
    totalVerifications: 0,
    totalModifications: 0,
    totalRejections: 0,
    // Derived scores
    engagementScore: 0,
    verificationLikelihood: 0,
    criticalThinkingIndicator: 0,
  };

  // Handle both Message array (from ChatSessionPage) and Interaction array
  if (messages.length === 0) {
    return emptySignals;
  }

  // Detect if this is a Message array (mixed user/AI) or Interaction array
  const isMessageArray = messages.some((m) => m.role === 'user' || m.role === 'ai');
  const aiMessages = isMessageArray
    ? messages.filter((m) => m.role === 'ai')
    : messages;

  const totalInteractionCount = aiMessages.length || messages.length;

  if (totalInteractionCount === 0) {
    return emptySignals;
  }

  // Count behaviors
  let totalVerifications = 0;
  let totalModifications = 0;
  let totalRejections = 0;
  let totalInputLength = 0;
  let totalAcceptanceSpeed = 0;
  let totalInputLengthForRatio = 0;
  let totalOutputLengthForRatio = 0;

  if (isMessageArray) {
    // Process Message array: find paired user/AI messages
    for (let i = 0; i < aiMessages.length; i++) {
      const aiMsg = aiMessages[i];

      // Count verification behaviors
      if (aiMsg.wasVerified) totalVerifications++;
      if (aiMsg.wasModified) totalModifications++;
      if (aiMsg.wasRejected) totalRejections++;

      // Find paired user message (should be immediately before)
      const aiMsgIndex = messages.indexOf(aiMsg);
      let userInputLength = 0;
      if (aiMsgIndex > 0) {
        const userMsg = messages[aiMsgIndex - 1];
        if (userMsg && userMsg.role === 'user') {
          userInputLength = userMsg.content?.length || 0;
        }
      }

      totalInputLength += userInputLength;
      totalInputLengthForRatio += userInputLength;
      totalOutputLengthForRatio += aiMsg.content?.length || 0;
      totalAcceptanceSpeed += 5000; // Default 5 seconds
    }
  } else {
    // Process Interaction array (legacy path)
    messages.forEach((interaction) => {
      if (interaction.wasVerified) totalVerifications++;
      if (interaction.wasModified) totalModifications++;
      if (interaction.wasRejected) totalRejections++;

      totalInputLength += (interaction.userInput?.length || 0);
      totalInputLengthForRatio += (interaction.userInput?.length || 0);
      totalOutputLengthForRatio += (interaction.aiResponse?.length || 0);
      totalAcceptanceSpeed += 5000;
    });
  }

  const verificationRate = (totalVerifications / totalInteractionCount) * 100;
  const modificationRate = (totalModifications / totalInteractionCount) * 100;
  const rejectionRate = (totalRejections / totalInteractionCount) * 100;
  const averageInputLength = totalInputLength / totalInteractionCount;
  const averageAcceptanceSpeed = totalAcceptanceSpeed / totalInteractionCount;
  const inputOutputRatio =
    totalOutputLengthForRatio > 0
      ? totalInputLengthForRatio / totalOutputLengthForRatio
      : 0;

  // Calculate session burstiness (0-100)
  const timestamps = messages
    .map((m) => new Date(m.timestamp).getTime())
    .filter((t) => !isNaN(t));

  let sessionBurstiness = 0;
  if (timestamps.length > 1) {
    const timeSpanMs = Math.max(...timestamps) - Math.min(...timestamps);
    const timeSpanHours = timeSpanMs / (1000 * 60 * 60);
    sessionBurstiness = Math.max(0, 100 - (timeSpanHours / 168) * 100);
  }

  // Calculate last interaction gap
  const nowMs = Date.now();
  const lastTimestampMs = Math.max(...timestamps);
  const lastInteractionGapMin = (nowMs - lastTimestampMs) / (1000 * 60);

  // ===== NEW: Process enhanced behavior signals if provided =====
  let enhancedSignals = {
    averageDwellTimeMs: 0,
    averageHoverDurationMs: 0,
    copyEventRate: 0,
    averageCopiedTextLength: 0,
    selectionEventRate: 0,
    tabSwitchRate: 0,
    averageTabAwayDurationMs: 0,
    averageScrollDepth: 0,
    deepScrollRate: 0,
    followUpQuestionRate: 0,
    engagementScore: 0,
    verificationLikelihood: 0,
    criticalThinkingIndicator: 0,
  };

  if (behaviorSignals && behaviorSignals.size > 0) {
    let totalDwellTime = 0;
    let totalHoverDuration = 0;
    let copyEvents = 0;
    let totalCopiedLength = 0;
    let selectionEvents = 0;
    let tabSwitches = 0;
    let totalTabAwayDuration = 0;
    let totalScrollDepth = 0;
    let deepScrolls = 0;
    let followUps = 0;
    let totalEngagement = 0;
    let totalVerificationLikelihood = 0;

    behaviorSignals.forEach((signal) => {
      totalDwellTime += signal.dwellTimeMs || 0;
      totalHoverDuration += signal.hoverDurationMs || 0;
      if (signal.copyCount > 0) {
        copyEvents++;
        totalCopiedLength += signal.copiedTextLength || 0;
      }
      if (signal.selectionCount > 0) selectionEvents++;
      if (signal.tabSwitchCount > 0) tabSwitches++;
      totalTabAwayDuration += signal.tabAwayDurationMs || 0;
      totalScrollDepth += signal.maxScrollDepth || 0;
      if ((signal.maxScrollDepth || 0) > 80) deepScrolls++;
      if (signal.hasFollowUpQuestion) followUps++;
      totalEngagement += signal.engagementScore || 0;
      totalVerificationLikelihood += signal.verificationLikelihood || 0;
    });

    const signalCount = behaviorSignals.size;
    enhancedSignals = {
      averageDwellTimeMs: totalDwellTime / signalCount,
      averageHoverDurationMs: totalHoverDuration / signalCount,
      copyEventRate: (copyEvents / signalCount) * 100,
      averageCopiedTextLength: copyEvents > 0 ? totalCopiedLength / copyEvents : 0,
      selectionEventRate: (selectionEvents / signalCount) * 100,
      tabSwitchRate: (tabSwitches / signalCount) * 100,
      averageTabAwayDurationMs: tabSwitches > 0 ? totalTabAwayDuration / tabSwitches : 0,
      averageScrollDepth: totalScrollDepth / signalCount,
      deepScrollRate: (deepScrolls / signalCount) * 100,
      followUpQuestionRate: (followUps / signalCount) * 100,
      engagementScore: totalEngagement / signalCount,
      verificationLikelihood: totalVerificationLikelihood / signalCount,
      criticalThinkingIndicator: calculateCriticalThinkingIndicator(
        modificationRate,
        (followUps / signalCount) * 100,
        (copyEvents / signalCount) * 100,
        totalScrollDepth / signalCount
      ),
    };
  }

  return {
    averageInputLength,
    averageAcceptanceSpeed,
    verificationRate,
    modificationRate,
    rejectionRate,
    // Enhanced signals
    ...enhancedSignals,
    // Temporal
    inputOutputRatio,
    lastInteractionGap: lastInteractionGapMin,
    sessionBurstiness,
    // Totals
    totalInteractions: totalInteractionCount,
    totalVerifications,
    totalModifications,
    totalRejections,
  };
}

/**
 * Calculate Critical Thinking Indicator (0-100)
 *
 * Based on observable behaviors that suggest critical engagement:
 * - Modification rate (user actively edits AI output)
 * - Follow-up questions (user seeks clarification)
 * - Copy events (may indicate external verification)
 * - Deep scrolling (thorough content review)
 */
function calculateCriticalThinkingIndicator(
  modificationRate: number,
  followUpRate: number,
  copyRate: number,
  avgScrollDepth: number
): number {
  // Weighted combination:
  // - Modification: 30% (HIGHEST confidence - direct action)
  // - Follow-ups: 30% (HIGH confidence - critical engagement)
  // - Copy rate: 20% (HIGH confidence - external verification intent)
  // - Scroll depth: 20% (MEDIUM confidence - thoroughness)

  const score =
    (modificationRate / 100) * 30 +
    (followUpRate / 100) * 30 +
    (copyRate / 100) * 20 +
    (avgScrollDepth / 100) * 20;

  return Math.min(score, 100);
}
