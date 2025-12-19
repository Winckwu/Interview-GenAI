/**
 * MR Adaptive Triggering Framework
 *
 * Evidence-based triggering system for Meta-Requirement intervention tools.
 * Based on qualitative analysis of 49 user interviews, this framework:
 *
 * 1. Maps 12 metacognitive subprocesses to 19 MR tools
 * 2. Implements pattern-aware trigger conditions
 * 3. Calculates dynamic priorities based on user profile and context
 *
 * Reference: MR-Triggering-Framework-Paper.md
 */

import { MRToolType } from './MROrchestrator';

// ============================================================
// Type Definitions
// ============================================================

/**
 * User behavioral patterns derived from interview analysis + Bayesian/SVM classification
 *
 * Pattern A: Strategic Decomposition & Control (战略分解与控制) - 37%
 *   - Careful task planning, high verification, independent thinking
 *
 * Pattern B: Iterative Optimization & Calibration (迭代优化与校准) - 16%
 *   - Frequent iteration, prompt refinement, continuous learning
 *
 * Pattern C: Adaptive Adjustment (自适应调整) - 29%
 *   - Multi-strategy usage, context-aware, flexible role switching
 *
 * Pattern D: Deep Verification & Criticism (深度验证与批评) - 16%
 *   - Thorough checking, deep questioning, high reflection
 *
 * Pattern E: Teaching & Learning (教学与学习) - 2%
 *   - AI as learning tool, high learning reflection, knowledge building
 *
 * Pattern F: Passive Over-Reliance (被动过度依赖) - HIGH RISK
 *   - Uncritical acceptance, minimal verification, passive attitude
 */
export type UserPattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'unknown';

/**
 * 12 metacognitive subprocesses from self-regulated learning theory
 */
export interface SubprocessScores {
  // Planning Phase
  P1: number; // Task Decomposition (0-3)
  P2: number; // Goal Setting (0-3)
  P3: number; // Strategy Selection (0-3)
  P4: number; // Resource Planning (0-3)
  // Monitoring Phase
  M1: number; // Progress Monitoring (0-3)
  M2: number; // Quality Checking (0-3)
  M3: number; // Context Monitoring (0-3)
  // Evaluation Phase
  E1: number; // Result Evaluation (0-3)
  E2: number; // Learning Reflection (0-3)
  E3: number; // Capability Judgment (0-3)
  // Regulation Phase
  R1: number; // Strategy Adjustment (0-3)
  R2: number; // Trust Calibration (0-3)
}

/**
 * User profile model capturing pattern and behavioral indicators
 */
export interface UserProfile {
  pattern: UserPattern;
  subprocessScores: SubprocessScores;
  behavioralIndicators: {
    totalInteractions: number;
    verificationRate: number;      // 0-1, historical verification frequency
    avgIterationsPerTask: number;
    trustHistory: number[];        // Recent trust scores
    toolEngagementRate: number;    // 0-1, MR tool interaction frequency
  };
}

/**
 * Interaction context for trigger evaluation
 */
export interface TriggerContext {
  // Task-level
  taskType: string;
  taskCriticality: 'low' | 'medium' | 'high';
  taskComplexity: 'low' | 'medium' | 'high';
  isNewTaskType: boolean;

  // Message-level
  messageLength: number;
  containsCode: boolean;
  containsDecisions: boolean;
  uncertaintyIndicators: number;
  hasControversialClaim: boolean;

  // Session-level
  trustScore: number;              // 0-100
  consecutiveUnverified: number;
  messageIndex: number;
  sessionDuration: number;         // minutes
  iterationCount: number;
  messageWasModified: boolean;
  hasFailedBefore: boolean;

  // History
  previousMRsShown: Set<MRToolType>;
  recentTrustChange: number;       // percentage change
}

/**
 * Trigger evaluation result
 */
export interface TriggerResult {
  shouldTrigger: boolean;
  priority: number;                // 0-100
  reason: string;
  category: 'verification' | 'reflection' | 'planning' | 'learning' | 'warning';
}

// ============================================================
// Constants
// ============================================================

/**
 * Base priority scores for each MR tool
 */
const BASE_PRIORITIES: Record<MRToolType, number> = {
  'mr1-decomposition': 60,
  'mr2-transparency': 40,
  'mr3-agency': 50,
  'mr4-roles': 45,
  'mr5-iteration': 55,
  'mr6-models': 65,
  'mr7-failure': 50,
  'mr8-recognition': 55,
  'mr9-trust': 50,
  'mr10-cost': 60,
  'mr11-verify': 70,
  'mr12-critical': 65,
  'mr13-uncertainty': 75,
  'mr14-reflection': 45,
  'mr15-strategies': 35,
  'mr16-warnings': 90,
  'mr17-metrics': 40,
  'mr18-warnings': 70,
  'mr19-assessment': 45,
};

/**
 * Pattern modifiers for each MR tool
 * Positive = increase priority for this pattern
 * Negative = decrease priority for this pattern
 */
const PATTERN_MODIFIERS: Record<UserPattern, Partial<Record<MRToolType, number>>> = {
  'A': {
    'mr1-decomposition': -20,  // Already decomposes well
    'mr3-agency': -999,        // Skip entirely
    'mr14-reflection': -15,    // Less frequent reflection needed
    'mr10-cost': -10,
    'mr5-iteration': 10,       // Encourage exploration
  },
  'B': {
    'mr5-iteration': 20,       // Core behavior
    'mr17-metrics': 15,        // Track iteration progress
    'mr1-decomposition': 10,   // Help reduce iteration cycles
  },
  'C': {
    'mr8-recognition': 10,     // Strengthen context awareness
    'mr4-roles': 15,           // Support role switching
    'mr9-trust': 10,
  },
  'D': {
    'mr6-models': 20,          // Core behavior
    'mr12-critical': 10,       // Enhance critical thinking
    'mr11-verify': -15,        // Already verifies well
    'mr9-trust': 10,
    'mr7-failure': 10,
  },
  'E': {
    'mr15-strategies': 25,     // Core behavior
    'mr14-reflection': 15,     // Support learning
    'mr19-assessment': 10,
    'mr7-failure': 15,
  },
  'F': {
    // Pattern F: Passive Over-Reliance (HIGH RISK) - 需要强干预
    'mr18-warnings': 30,       // Over-reliance warning (highest priority)
    'mr11-verify': 25,         // Strong verification push
    'mr12-critical': 25,       // Critical thinking scaffolding
    'mr14-reflection': 20,     // Encourage reflection
    'mr9-trust': 20,           // Trust calibration
    'mr16-warnings': 20,       // Risk warnings
    'mr3-agency': 20,          // Restore user agency
    'mr7-failure': 15,         // Learn from failures
    'mr1-decomposition': 15,   // Encourage active planning
    'mr15-strategies': -10,    // Not ready for advanced strategies
  },
  'unknown': {},
};

/**
 * MR tool categories for display limits
 */
const MR_CATEGORIES: Record<MRToolType, TriggerResult['category']> = {
  'mr1-decomposition': 'planning',
  'mr2-transparency': 'learning',
  'mr3-agency': 'planning',
  'mr4-roles': 'planning',
  'mr5-iteration': 'planning',
  'mr6-models': 'verification',
  'mr7-failure': 'learning',
  'mr8-recognition': 'learning',
  'mr9-trust': 'reflection',
  'mr10-cost': 'planning',
  'mr11-verify': 'verification',
  'mr12-critical': 'verification',
  'mr13-uncertainty': 'warning',
  'mr14-reflection': 'reflection',
  'mr15-strategies': 'learning',
  'mr16-warnings': 'warning',
  'mr17-metrics': 'learning',
  'mr18-warnings': 'warning',
  'mr19-assessment': 'reflection',
};

// ============================================================
// Pattern Classification
// ============================================================

/**
 * Classify user into behavioral pattern based on subprocess scores
 * Based on decision tree from interview analysis
 */
export function classifyUserPattern(scores: SubprocessScores): UserPattern {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  // Pattern A: Strategic Decomposition & Control
  // Conditions: P1≥2, M2≥2, E3≥2, Total≥24
  if (total >= 24 && scores.P1 >= 2 && scores.M2 >= 2 && scores.E3 >= 2) {
    return 'A';
  }

  // Pattern D: Deep Verification
  // Conditions: M2=3, E1≥2, Total≥20
  if (scores.M2 === 3 && scores.E1 >= 2 && total >= 20) {
    return 'D';
  }

  // Pattern E: Learning-Oriented
  // Conditions: E1+E2+E3≥6
  if (scores.E1 + scores.E2 + scores.E3 >= 6) {
    return 'E';
  }

  // Pattern C: Context-Sensitive Adaptation
  // Conditions: P3≥2, M3≥2, R2≥2, Total≥22
  if (scores.P3 >= 2 && scores.M3 >= 2 && scores.R2 >= 2 && total >= 22) {
    return 'C';
  }

  // Pattern B: Iterative Optimization
  // Conditions: R1≥2, Total≥20
  if (scores.R1 >= 2 && total >= 20) {
    return 'B';
  }

  // Pattern F: Passive Over-Reliance (HIGH RISK)
  // Conditions: Very low total score OR minimal reflection with low engagement
  // Detection criteria from metacognitiveTypeSystem.ts: reflection_depth = 0, total_score < 15
  if (total < 15 || (scores.E2 === 0 && total < 20)) {
    return 'F';
  }

  // Default: Context-Sensitive (most common fallback)
  return 'C';
}

/**
 * Calculate total subprocess score
 */
export function calculateTotalScore(scores: SubprocessScores): number {
  return Object.values(scores).reduce((a, b) => a + b, 0);
}

// ============================================================
// Trigger Condition Evaluators
// ============================================================

/**
 * Evaluate trigger condition for each MR tool
 * Returns whether the tool should be considered for activation
 */
function evaluateTriggerCondition(
  mr: MRToolType,
  profile: UserProfile,
  ctx: TriggerContext
): boolean {
  const scores = profile.subprocessScores;

  switch (mr) {
    case 'mr1-decomposition':
      // (taskComplexity=high OR msgLength>1500) AND P1<3
      return (ctx.taskComplexity === 'high' || ctx.messageLength > 1500) && scores.P1 < 3;

    case 'mr2-transparency':
      // (isNewUser OR low familiarity indicator) AND E3<2
      return (profile.behavioralIndicators.totalInteractions < 10) && scores.E3 < 2;

    case 'mr3-agency':
      // (aiSuggestsAction OR containsDecisions) AND pattern≠A
      return (ctx.containsDecisions) && profile.pattern !== 'A';

    case 'mr4-roles':
      // (isNewSession AND taskTypeChanged) OR pattern=C
      return (ctx.messageIndex === 0 && ctx.isNewTaskType) || profile.pattern === 'C';

    case 'mr5-iteration':
      // (iterationCount>=2 OR modified) AND R1>=2
      return (ctx.iterationCount >= 2 || ctx.messageWasModified) && scores.R1 >= 2;

    case 'mr6-models':
      // pattern=D OR (trustScore<45 AND criticality=high)
      return profile.pattern === 'D' || (ctx.trustScore < 45 && ctx.taskCriticality === 'high');

    case 'mr7-failure':
      // (hasFailedBefore OR trustDecline>20%) AND E2>=2
      return (ctx.hasFailedBefore || ctx.recentTrustChange < -20) && scores.E2 >= 2;

    case 'mr8-recognition':
      // (pattern=C OR taskTypeNew) AND M3>=2
      return (profile.pattern === 'C' || ctx.isNewTaskType) && scores.M3 >= 2;

    case 'mr9-trust':
      // (trustChange>15% OR R2>=2) AND msgIndex>=3
      return (Math.abs(ctx.recentTrustChange) > 15 || scores.R2 >= 2) && ctx.messageIndex >= 3;

    case 'mr10-cost':
      // (criticality=high OR irreversibleAction) AND P4<2
      return ctx.taskCriticality === 'high' && scores.P4 < 2;

    case 'mr11-verify':
      // (M2<2 AND unverified>=2) OR criticality=high
      return (scores.M2 < 2 && ctx.consecutiveUnverified >= 2) || ctx.taskCriticality === 'high';

    case 'mr12-critical':
      // (trustScore<50 OR controversialClaim) AND E1>=2
      return (ctx.trustScore < 50 || ctx.hasControversialClaim) && scores.E1 >= 2;

    case 'mr13-uncertainty':
      // (hasUncertainty OR aiConfidence<0.5) AND E3>=2
      return ctx.uncertaintyIndicators > 0 && scores.E3 >= 2;

    case 'mr14-reflection':
      // (msgIndex mod 3 = 0) AND pattern≠A
      return (ctx.messageIndex % 3 === 0) && profile.pattern !== 'A';

    case 'mr15-strategies':
      // pattern=E OR (E2>=2 AND sessionDuration>15)
      return profile.pattern === 'E' || (scores.E2 >= 2 && ctx.sessionDuration > 15);

    case 'mr16-warnings':
      // Only trigger if trust score < 60% AND risk detected
      // Rationale: High confidence outputs don't need redundant risk warnings
      if (ctx.trustScore >= 60) return false;
      return ctx.hasControversialClaim || ctx.taskCriticality === 'high';

    case 'mr17-metrics':
      // (pattern=B AND iterationCount>=3) OR session ending
      return (profile.pattern === 'B' && ctx.iterationCount >= 3);

    case 'mr18-warnings':
      // unverifiedConsecutive>=4 AND M2<2
      return ctx.consecutiveUnverified >= 4 && scores.M2 < 2;

    case 'mr19-assessment':
      // (sessionEnding OR milestone) AND E1+E2+E3>=5
      return ctx.sessionDuration > 30 && (scores.E1 + scores.E2 + scores.E3) >= 5;

    default:
      return false;
  }
}

/**
 * Calculate subprocess-based priority adjustment
 */
function calculateSubprocessAdjustment(mr: MRToolType, scores: SubprocessScores): number {
  switch (mr) {
    case 'mr1-decomposition':
      return (3 - scores.P1) * 15;
    case 'mr2-transparency':
      return (2 - scores.E3) * 20;
    case 'mr5-iteration':
      return scores.R1 * 10;
    case 'mr6-models':
      return 0; // Pattern modifier handles this
    case 'mr7-failure':
      return scores.E2 * 15;
    case 'mr8-recognition':
      return scores.M3 * 10;
    case 'mr9-trust':
      return scores.R2 * 10;
    case 'mr10-cost':
      return 0;
    case 'mr11-verify':
      return (3 - scores.M2) * 10;
    case 'mr12-critical':
      return scores.E1 * 10;
    case 'mr13-uncertainty':
      return 0;
    case 'mr14-reflection':
      return 0;
    case 'mr15-strategies':
      return scores.E2 * 15;
    case 'mr17-metrics':
      return scores.M1 * 10;
    case 'mr19-assessment':
      return (scores.E1 + scores.E2 + scores.E3) * 5;
    default:
      return 0;
  }
}

/**
 * Calculate context-based priority adjustment
 */
function calculateContextAdjustment(mr: MRToolType, ctx: TriggerContext): number {
  let adjustment = 0;

  // Task criticality boost
  if (ctx.taskCriticality === 'high') {
    adjustment += 10;
  }

  // Low trust boost for verification tools
  if (['mr11-verify', 'mr12-critical', 'mr6-models'].includes(mr)) {
    if (ctx.trustScore < 40) {
      adjustment += 15;
    }
  }

  // Uncertainty boost
  if (mr === 'mr13-uncertainty' && ctx.uncertaintyIndicators > 2) {
    adjustment += ctx.uncertaintyIndicators * 5;
  }

  return adjustment;
}

/**
 * Generate human-readable reason for MR recommendation
 */
function generateReason(mr: MRToolType, profile: UserProfile, ctx: TriggerContext): string {
  const reasons: Record<MRToolType, string> = {
    'mr1-decomposition': `Complex task detected (${ctx.messageLength > 1500 ? 'long message' : 'high complexity'}). Breaking it down may help.`,
    'mr2-transparency': 'Understanding how AI generates responses can help evaluate quality.',
    'mr3-agency': 'This response contains decisions. Ensure you maintain control over the direction.',
    'mr4-roles': 'New task type detected. Clarifying roles may improve collaboration.',
    'mr5-iteration': `Multiple iterations detected (${ctx.iterationCount}). Try branching to explore alternatives.`,
    'mr6-models': profile.pattern === 'D' ? 'Cross-model validation recommended for verification.' : 'Low trust + high stakes. Consider comparing with other AI models.',
    'mr7-failure': 'Previous challenges detected. Learning from failures strengthens future interactions.',
    'mr8-recognition': 'Understanding AI capabilities for this task type improves effectiveness.',
    'mr9-trust': 'Trust level has changed significantly. Recalibrating expectations may help.',
    'mr10-cost': 'High-stakes task detected. Consider cost-benefit before proceeding.',
    'mr11-verify': ctx.consecutiveUnverified >= 2 ? `${ctx.consecutiveUnverified} responses accepted without verification. Time to check.` : 'High-stakes task requires verification.',
    'mr12-critical': ctx.trustScore < 50 ? 'Low confidence output. Apply critical analysis.' : 'Controversial claim detected. Critical evaluation recommended.',
    'mr13-uncertainty': 'AI expressed uncertainty. Review confidence levels carefully.',
    'mr14-reflection': 'Take a moment to reflect on this interaction.',
    'mr15-strategies': 'Building metacognitive strategies improves long-term AI collaboration.',
    'mr16-warnings': ctx.hasControversialClaim
      ? `Controversial claim detected (trust: ${ctx.trustScore}%). Verify facts before using.`
      : `High-risk task type (trust: ${ctx.trustScore}%). Extra verification recommended.`,
    'mr17-metrics': `${ctx.iterationCount} iterations completed. Review progress metrics.`,
    'mr18-warnings': `${ctx.consecutiveUnverified} consecutive responses accepted without verification. Consider checking recent outputs.`,
    'mr19-assessment': 'Session milestone reached. Self-assessment can strengthen skills.',
  };

  return reasons[mr] || 'Recommended based on current context.';
}

// ============================================================
// Main Trigger Engine
// ============================================================

/**
 * Calculate MR tool priority and determine if it should trigger
 */
export function evaluateMRTrigger(
  mr: MRToolType,
  profile: UserProfile,
  ctx: TriggerContext
): TriggerResult {
  // 1. Check trigger condition
  if (!evaluateTriggerCondition(mr, profile, ctx)) {
    return {
      shouldTrigger: false,
      priority: 0,
      reason: '',
      category: MR_CATEGORIES[mr],
    };
  }

  // 2. Calculate base priority
  let priority = BASE_PRIORITIES[mr];

  // 3. Apply subprocess adjustment
  priority += calculateSubprocessAdjustment(mr, profile.subprocessScores);

  // 4. Apply pattern modifier
  const patternMod = PATTERN_MODIFIERS[profile.pattern][mr] ?? 0;
  if (patternMod === -999) {
    // Skip entirely for this pattern
    return {
      shouldTrigger: false,
      priority: 0,
      reason: '',
      category: MR_CATEGORIES[mr],
    };
  }
  priority += patternMod;

  // 5. Apply context adjustment
  priority += calculateContextAdjustment(mr, ctx);

  // 6. Apply fatigue control (reduce if recently shown)
  if (ctx.previousMRsShown.has(mr)) {
    priority -= 30;
  }

  // 7. Clamp to valid range
  priority = Math.max(0, Math.min(100, priority));

  // 8. Determine if should trigger (threshold = 40)
  const shouldTrigger = priority >= 40;

  return {
    shouldTrigger,
    priority,
    reason: shouldTrigger ? generateReason(mr, profile, ctx) : '',
    category: MR_CATEGORIES[mr],
  };
}

/**
 * Get all MR recommendations for current context
 * Returns top recommendations with display limits applied
 */
export function getMRRecommendations(
  profile: UserProfile,
  ctx: TriggerContext,
  maxRecommendations: number = 3
): Array<{ tool: MRToolType; result: TriggerResult }> {
  const allMRTools: MRToolType[] = [
    'mr1-decomposition', 'mr2-transparency', 'mr3-agency', 'mr4-roles',
    'mr5-iteration', 'mr6-models', 'mr7-failure', 'mr8-recognition',
    'mr9-trust', 'mr10-cost', 'mr11-verify', 'mr12-critical',
    'mr13-uncertainty', 'mr14-reflection', 'mr15-strategies',
    'mr16-warnings', 'mr17-metrics', 'mr18-warnings', 'mr19-assessment',
  ];

  // Evaluate all tools
  const evaluations = allMRTools.map(tool => ({
    tool,
    result: evaluateMRTrigger(tool, profile, ctx),
  }));

  // Filter to triggered tools and sort by priority
  const triggered = evaluations
    .filter(e => e.result.shouldTrigger)
    .sort((a, b) => b.result.priority - a.result.priority);

  // Apply category limits
  const selected: Array<{ tool: MRToolType; result: TriggerResult }> = [];
  const categoryCounts: Record<string, number> = {
    verification: 0,
    reflection: 0,
    planning: 0,
    learning: 0,
    warning: 0,
  };

  const categoryLimits: Record<string, number> = {
    verification: 2,
    reflection: 1,
    planning: 2,
    learning: 2,
    warning: 999, // No limit for warnings (safety first)
  };

  for (const evaluation of triggered) {
    if (selected.length >= maxRecommendations) break;

    const category = evaluation.result.category;
    if (categoryCounts[category] < categoryLimits[category]) {
      selected.push(evaluation);
      categoryCounts[category]++;
    }
  }

  return selected;
}

// ============================================================
// Default Profile Factory
// ============================================================

/**
 * Create default user profile for new users
 */
export function createDefaultUserProfile(): UserProfile {
  return {
    pattern: 'unknown',
    subprocessScores: {
      P1: 2, P2: 2, P3: 2, P4: 2,
      M1: 2, M2: 2, M3: 2,
      E1: 2, E2: 2, E3: 2,
      R1: 2, R2: 2,
    },
    behavioralIndicators: {
      totalInteractions: 0,
      verificationRate: 0.5,
      avgIterationsPerTask: 2,
      trustHistory: [],
      toolEngagementRate: 0.5,
    },
  };
}

/**
 * Create default trigger context
 */
export function createDefaultTriggerContext(): TriggerContext {
  return {
    taskType: 'general',
    taskCriticality: 'medium',
    taskComplexity: 'medium',
    isNewTaskType: false,
    messageLength: 0,
    containsCode: false,
    containsDecisions: false,
    uncertaintyIndicators: 0,
    hasControversialClaim: false,
    trustScore: 60,
    consecutiveUnverified: 0,
    messageIndex: 0,
    sessionDuration: 0,
    iterationCount: 0,
    messageWasModified: false,
    hasFailedBefore: false,
    previousMRsShown: new Set(),
    recentTrustChange: 0,
  };
}

/**
 * Update user profile based on MR19 assessment results
 */
export function updateUserProfileFromAssessment(
  profile: UserProfile,
  assessmentScores: Partial<SubprocessScores>
): UserProfile {
  const newScores = { ...profile.subprocessScores, ...assessmentScores };
  const newPattern = classifyUserPattern(newScores);

  return {
    ...profile,
    pattern: newPattern,
    subprocessScores: newScores,
  };
}
