/**
 * Adaptive MR Activator - Complete Implementation
 * Based on MR-Triggering-Framework-Paper.md (Table 2 & Table 3)
 *
 * Implements all 19 MR trigger conditions with:
 * - Evidence-based trigger conditions from 49 user interviews
 * - Pattern-specific priority modifiers
 * - Subprocess score adjustments
 * - Fatigue control mechanisms
 *
 * Reference: MR-Triggering-Framework-Paper.md Section 6.2
 */

import { BehavioralSignals } from './BehaviorSignalDetector';
import { PatternEstimate, Pattern } from './RealtimePatternRecognizer';

export type Urgency = 'observe' | 'remind' | 'enforce';
export type DisplayMode = 'inline' | 'sidebar' | 'modal';

export type Tier = 'soft' | 'medium' | 'hard';

export interface ActiveMR {
  mrId: string;
  name: string;
  urgency: Urgency;
  tier: Tier;  // Added: maps urgency to tier for frontend InterventionManager
  displayMode: DisplayMode;
  message: string;
  priority: number;
  reason: string;
}

/**
 * Pattern-specific priority modifiers (from Table 2)
 */
const PATTERN_MODIFIERS: Record<string, Record<Pattern, number>> = {
  MR1:  { A: -20, B: 10, C: 0, D: 0, E: 0, F: 0 },
  MR2:  { A: 0, B: 0, C: 0, D: -15, E: 0, F: 0 },
  MR3:  { A: -100, B: 0, C: 0, D: 0, E: 0, F: 0 },  // A: skip
  MR4:  { A: 0, B: 0, C: 15, D: 0, E: 0, F: 0 },
  MR5:  { A: 0, B: 20, C: 0, D: 0, E: 0, F: 0 },
  MR6:  { A: 0, B: 0, C: 0, D: 20, E: 0, F: 0 },
  MR7:  { A: 0, B: 0, C: 0, D: 0, E: 15, F: 0 },
  MR8:  { A: 0, B: 0, C: 10, D: 0, E: 0, F: 0 },
  MR9:  { A: 0, B: 0, C: 0, D: 10, E: 0, F: 0 },
  MR10: { A: -10, B: 0, C: 0, D: 0, E: 0, F: 0 },
  MR11: { A: 0, B: 0, C: 0, D: -15, E: 0, F: 0 },  // D already verifies
  MR12: { A: 0, B: 0, C: 0, D: 10, E: 0, F: 0 },
  MR13: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
  MR14: { A: -100, B: 0, C: 0, D: 0, E: 15, F: 0 },  // A: skip
  MR15: { A: 0, B: 0, C: 0, D: 0, E: 25, F: 0 },
  MR16: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },  // Unconditional
  MR17: { A: 0, B: 15, C: 0, D: 0, E: 0, F: 0 },
  MR18: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },  // Unconditional
  MR19: { A: 0, B: 0, C: 0, D: 0, E: 10, F: 0 },
};

/**
 * MR Tool Metadata
 */
const MR_METADATA: Record<string, { name: string; baseUrgency: Urgency }> = {
  MR1:  { name: 'Task Decomposition Scaffolding', baseUrgency: 'remind' },
  MR2:  { name: 'Process Transparency', baseUrgency: 'observe' },
  MR3:  { name: 'Human Agency Control', baseUrgency: 'observe' },
  MR4:  { name: 'Role Definition Guidance', baseUrgency: 'observe' },
  MR5:  { name: 'Low-Cost Iteration', baseUrgency: 'observe' },
  MR6:  { name: 'Cross-Model Experimentation', baseUrgency: 'remind' },
  MR7:  { name: 'Failure Tolerance Learning', baseUrgency: 'observe' },
  MR8:  { name: 'Task Characteristic Recognition', baseUrgency: 'observe' },
  MR9:  { name: 'Dynamic Trust Calibration', baseUrgency: 'observe' },
  MR10: { name: 'Cost-Benefit Analysis', baseUrgency: 'remind' },
  MR11: { name: 'Integrated Verification Tools', baseUrgency: 'remind' },
  MR12: { name: 'Critical Thinking Scaffolding', baseUrgency: 'remind' },
  MR13: { name: 'Transparent Uncertainty Display', baseUrgency: 'observe' },
  MR14: { name: 'Guided Reflection Mechanism', baseUrgency: 'observe' },
  MR15: { name: 'Metacognitive Strategy Guide', baseUrgency: 'observe' },
  MR16: { name: 'Skill Atrophy Prevention', baseUrgency: 'enforce' },
  MR17: { name: 'Learning Progress Visualization', baseUrgency: 'observe' },
  MR18: { name: 'Over-Reliance Warning', baseUrgency: 'enforce' },
  MR19: { name: 'Metacognitive Assessment', baseUrgency: 'observe' },
};

/**
 * Priority threshold for activation
 */
const ACTIVATION_THRESHOLD = 30;

/**
 * Recently shown MRs for fatigue control
 */
let recentlyShownMRs: Set<string> = new Set();
let lastResetTime = Date.now();

export class AdaptiveMRActivator {
  /**
   * Determine which MRs should be activated based on signals and pattern
   * Implements the complete triggering framework from MR-Triggering-Framework-Paper.md
   */
  determineActiveMRs(
    signals: BehavioralSignals,
    patternEstimate: PatternEstimate,
    turnCount: number
  ): ActiveMR[] {
    const pattern = patternEstimate.topPattern;
    const activeMRs: ActiveMR[] = [];

    // Reset fatigue control every 5 messages
    if (turnCount % 5 === 0) {
      recentlyShownMRs.clear();
    }

    // Evaluate each MR trigger condition
    const mrEvaluations: Array<{ mrId: string; triggered: boolean; priority: number; reason: string }> = [
      this.evaluateMR1(signals, pattern),
      this.evaluateMR2(signals, pattern),
      this.evaluateMR3(signals, pattern),
      this.evaluateMR4(signals, pattern),
      this.evaluateMR5(signals, pattern),
      this.evaluateMR6(signals, pattern),
      this.evaluateMR7(signals, pattern),
      this.evaluateMR8(signals, pattern),
      this.evaluateMR9(signals, pattern),
      this.evaluateMR10(signals, pattern),
      this.evaluateMR11(signals, pattern),
      this.evaluateMR12(signals, pattern),
      this.evaluateMR13(signals, pattern),
      this.evaluateMR14(signals, pattern),
      this.evaluateMR15(signals, pattern),
      this.evaluateMR16(signals, pattern),
      this.evaluateMR17(signals, pattern),
      this.evaluateMR18(signals, pattern),
      this.evaluateMR19(signals, pattern),
    ];

    // Filter triggered MRs and create ActiveMR objects
    for (const evaluation of mrEvaluations) {
      if (!evaluation.triggered) continue;
      if (evaluation.priority < ACTIVATION_THRESHOLD) continue;

      // Fatigue control: reduce priority if recently shown
      let adjustedPriority = evaluation.priority;
      if (recentlyShownMRs.has(evaluation.mrId)) {
        adjustedPriority -= 30;
        if (adjustedPriority < ACTIVATION_THRESHOLD) continue;
      }

      const metadata = MR_METADATA[evaluation.mrId];
      const urgency = this.adjustUrgency(metadata.baseUrgency, signals, pattern);
      const tier = this.urgencyToTier(urgency);

      activeMRs.push({
        mrId: evaluation.mrId,
        name: metadata.name,
        urgency,
        tier,
        displayMode: this.determineDisplayMode(urgency),
        message: this.generateContextualMessage(evaluation.mrId, signals, pattern),
        priority: adjustedPriority,
        reason: evaluation.reason,
      });
    }

    // Sort by priority and return top 3
    const result = activeMRs
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);

    // Update recently shown for fatigue control
    result.forEach(mr => recentlyShownMRs.add(mr.mrId));

    return result;
  }

  // ========== MR Trigger Condition Evaluators (from Table 2) ==========

  /**
   * MR1: Task Decomposition Scaffolding
   * Trigger: (taskComplexity=high ∨ msgLength>1500) ∧ P1<3
   * Priority: 60 + (3-P1)×15
   */
  private evaluateMR1(signals: BehavioralSignals, pattern: Pattern) {
    const P1 = signals.taskDecompositionEvidence;
    const triggered =
      (signals.taskComplexity >= 2 || signals.messageLength > 1500) && P1 < 3;

    const basePriority = 60 + (3 - P1) * 15;
    const priority = basePriority + (PATTERN_MODIFIERS.MR1[pattern] || 0);

    return {
      mrId: 'MR1',
      triggered,
      priority,
      reason: `Complex task (${signals.taskComplexity.toFixed(1)}) with low decomposition (P1=${P1})`,
    };
  }

  /**
   * MR2: Process Transparency
   * Trigger: (isNewUser ∨ familiarity=unfamiliar) ∧ E3<2
   * Priority: 40 + (2-E3)×20
   */
  private evaluateMR2(signals: BehavioralSignals, pattern: Pattern) {
    const E3 = signals.capabilityJudgmentScore;
    const triggered = (signals.isNewUser || signals.isNewSession) && E3 < 2;

    const basePriority = 40 + (2 - E3) * 20;
    const priority = basePriority + (PATTERN_MODIFIERS.MR2[pattern] || 0);

    return {
      mrId: 'MR2',
      triggered,
      priority,
      reason: `New user/session with low capability judgment (E3=${E3})`,
    };
  }

  /**
   * MR3: Human Agency Control
   * Trigger: (aiSuggestsAction ∨ containsDecisions) ∧ pattern≠A
   * Priority: 50 + decisionCount×10
   */
  private evaluateMR3(signals: BehavioralSignals, pattern: Pattern) {
    const triggered = signals.containsDecisions && pattern !== 'A';

    const basePriority = 50 + (signals.containsDecisions ? 10 : 0);
    const priority = basePriority + (PATTERN_MODIFIERS.MR3[pattern] || 0);

    return {
      mrId: 'MR3',
      triggered,
      priority,
      reason: 'Decision points detected, need agency reminder',
    };
  }

  /**
   * MR4: Role Definition Guidance
   * Trigger: (isNewSession ∧ taskTypeChanged) ∨ pattern=C
   * Priority: 45 + M3×5
   */
  private evaluateMR4(signals: BehavioralSignals, pattern: Pattern) {
    const M3 = signals.contextAwarenessIndicator;
    const triggered =
      (signals.isNewSession && signals.taskTypeChanged) || pattern === 'C';

    const basePriority = 45 + M3 * 5;
    const priority = basePriority + (PATTERN_MODIFIERS.MR4[pattern] || 0);

    return {
      mrId: 'MR4',
      triggered,
      priority,
      reason: 'New task type or context-adaptive pattern needs role clarity',
    };
  }

  /**
   * MR5: Low-Cost Iteration
   * Trigger: (iterationCount≥2 ∨ modified) ∧ R1≥2
   * Priority: 55 + R1×10
   */
  private evaluateMR5(signals: BehavioralSignals, pattern: Pattern) {
    const R1 = signals.strategyAdjustmentScore;
    const triggered =
      (signals.iterationCount >= 2 || signals.modified) && R1 >= 2;

    const basePriority = 55 + R1 * 10;
    const priority = basePriority + (PATTERN_MODIFIERS.MR5[pattern] || 0);

    return {
      mrId: 'MR5',
      triggered,
      priority,
      reason: `Iterative behavior (${signals.iterationCount} iterations) with strategy adjustment (R1=${R1})`,
    };
  }

  /**
   * MR6: Cross-Model Experimentation
   * Trigger: pattern=D ∨ (trustScore<45 ∧ criticality=high)
   * Priority: 65 + (pattern=D?20:0)
   */
  private evaluateMR6(signals: BehavioralSignals, pattern: Pattern) {
    const triggered =
      pattern === 'D' ||
      (signals.trustScore < 45 && signals.taskRiskLevel === 'high');

    const basePriority = 65 + (pattern === 'D' ? 20 : 0);
    const priority = basePriority + (PATTERN_MODIFIERS.MR6[pattern] || 0);

    return {
      mrId: 'MR6',
      triggered,
      priority,
      reason: pattern === 'D'
        ? 'Deep verification pattern benefits from cross-model comparison'
        : 'Low trust + high risk suggests cross-validation',
    };
  }

  /**
   * MR7: Failure Tolerance Learning
   * Trigger: (hasFailedBefore ∨ trustDecline>20%) ∧ E2≥2
   * Priority: 50 + E2×15
   */
  private evaluateMR7(signals: BehavioralSignals, pattern: Pattern) {
    const E2 = signals.reflectionDepth;
    const triggered =
      (signals.hasFailedBefore || signals.trustChange < -20) && E2 >= 2;

    const basePriority = 50 + E2 * 15;
    const priority = basePriority + (PATTERN_MODIFIERS.MR7[pattern] || 0);

    return {
      mrId: 'MR7',
      triggered,
      priority,
      reason: 'Previous failure + reflective capacity enables learning from mistakes',
    };
  }

  /**
   * MR8: Task Characteristic Recognition
   * Trigger: (pattern=C ∨ taskTypeNew) ∧ M3≥2
   * Priority: 55 + M3×10
   */
  private evaluateMR8(signals: BehavioralSignals, pattern: Pattern) {
    const M3 = signals.contextAwarenessIndicator;
    const triggered = (pattern === 'C' || signals.taskTypeChanged) && M3 >= 2;

    const basePriority = 55 + M3 * 10;
    const priority = basePriority + (PATTERN_MODIFIERS.MR8[pattern] || 0);

    return {
      mrId: 'MR8',
      triggered,
      priority,
      reason: 'Context-aware user encountering new task type',
    };
  }

  /**
   * MR9: Dynamic Trust Calibration
   * Trigger: (trustChange>15% ∨ R2≥2) ∧ msgIndex≥3
   * Priority: 50 + R2×10
   */
  private evaluateMR9(signals: BehavioralSignals, pattern: Pattern) {
    const R2 = signals.trustCalibrationScore;
    const triggered =
      (Math.abs(signals.trustChange) > 15 || R2 >= 2) &&
      signals.messageIndex >= 3;

    const basePriority = 50 + R2 * 10;
    const priority = basePriority + (PATTERN_MODIFIERS.MR9[pattern] || 0);

    return {
      mrId: 'MR9',
      triggered,
      priority,
      reason: `Trust dynamics detected (${signals.trustChange.toFixed(1)}% change) after sufficient interaction`,
    };
  }

  /**
   * MR10: Cost-Benefit Analysis
   * Trigger: (criticality=high ∨ irreversibleAction) ∧ P4<2
   * Priority: 60 + risk×15
   */
  private evaluateMR10(signals: BehavioralSignals, pattern: Pattern) {
    const P4 = signals.preparationScore;
    const triggered =
      (signals.taskRiskLevel === 'high' || signals.irreversibleAction) &&
      P4 < 2;

    const riskMultiplier = signals.taskRiskLevel === 'critical' ? 3 : signals.taskRiskLevel === 'high' ? 2 : 1;
    const basePriority = 60 + riskMultiplier * 15;
    const priority = basePriority + (PATTERN_MODIFIERS.MR10[pattern] || 0);

    return {
      mrId: 'MR10',
      triggered,
      priority,
      reason: 'High-risk/irreversible action with insufficient preparation',
    };
  }

  /**
   * MR11: Integrated Verification Tools
   * Trigger: (M2<2 ∧ unverified≥2) ∨ criticality=high
   * Priority: 70 + (3-M2)×10
   */
  private evaluateMR11(signals: BehavioralSignals, pattern: Pattern) {
    const M2 = signals.qualityCheckScore;
    const triggered =
      (M2 < 2 && signals.unverifiedConsecutive >= 2) ||
      signals.taskRiskLevel === 'high' ||
      signals.taskRiskLevel === 'critical';

    const basePriority = 70 + (3 - M2) * 10;
    const priority = basePriority + (PATTERN_MODIFIERS.MR11[pattern] || 0);

    return {
      mrId: 'MR11',
      triggered,
      priority,
      reason: `Low verification (M2=${M2}) with ${signals.unverifiedConsecutive} unverified responses`,
    };
  }

  /**
   * MR12: Critical Thinking Scaffolding
   * Trigger: (trustScore<50 ∨ controversialClaim) ∧ E1≥2
   * Priority: 65 + E1×10
   */
  private evaluateMR12(signals: BehavioralSignals, pattern: Pattern) {
    const E1 = signals.outputEvaluationScore;
    const triggered =
      (signals.trustScore < 50 || signals.controversialClaim) && E1 >= 2;

    const basePriority = 65 + E1 * 10;
    const priority = basePriority + (PATTERN_MODIFIERS.MR12[pattern] || 0);

    return {
      mrId: 'MR12',
      triggered,
      priority,
      reason: 'Low trust or controversial content with evaluation capability',
    };
  }

  /**
   * MR13: Transparent Uncertainty Display
   * Trigger: (hasUncertainty ∨ aiConfidence<0.5) ∧ E3≥2
   * Priority: 75 + uncertaintyCount×5
   */
  private evaluateMR13(signals: BehavioralSignals, pattern: Pattern) {
    const E3 = signals.capabilityJudgmentScore;
    const triggered =
      (signals.hasUncertainty || signals.aiConfidence < 0.5) && E3 >= 2;

    const basePriority = 75 + (signals.hasUncertainty ? 5 : 0);
    const priority = basePriority + (PATTERN_MODIFIERS.MR13[pattern] || 0);

    return {
      mrId: 'MR13',
      triggered,
      priority,
      reason: `Uncertainty detected (confidence=${signals.aiConfidence.toFixed(2)}) with capability awareness`,
    };
  }

  /**
   * MR14: Guided Reflection Mechanism
   * Trigger: (msgIndex mod 3 = 0) ∧ pattern≠A
   * Priority: 45 - (pattern=A?15:0)
   */
  private evaluateMR14(signals: BehavioralSignals, pattern: Pattern) {
    const triggered = signals.messageIndex % 3 === 0 && pattern !== 'A';

    const basePriority = 45 - (pattern === 'A' ? 15 : 0);
    const priority = basePriority + (PATTERN_MODIFIERS.MR14[pattern] || 0);

    return {
      mrId: 'MR14',
      triggered,
      priority,
      reason: 'Periodic reflection checkpoint',
    };
  }

  /**
   * MR15: Metacognitive Strategy Guide
   * Trigger: pattern=E ∨ (E2≥2 ∧ sessionDuration>15)
   * Priority: 35 + E2×15
   */
  private evaluateMR15(signals: BehavioralSignals, pattern: Pattern) {
    const E2 = signals.reflectionDepth;
    const triggered =
      pattern === 'E' || (E2 >= 2 && signals.sessionDuration > 15);

    const basePriority = 35 + E2 * 15;
    const priority = basePriority + (PATTERN_MODIFIERS.MR15[pattern] || 0);

    return {
      mrId: 'MR15',
      triggered,
      priority,
      reason: pattern === 'E'
        ? 'Learning-oriented pattern benefits from strategy guidance'
        : 'Deep reflector in extended session',
    };
  }

  /**
   * MR16: Skill Atrophy Prevention (WARNING - UNCONDITIONAL)
   * Trigger: riskDetected ∨ securityConcern (simplified: high AI reliance + no iteration)
   * Priority: 90 (unconditional)
   */
  private evaluateMR16(signals: BehavioralSignals, pattern: Pattern) {
    const triggered =
      signals.aiRelianceDegree >= 2.5 &&
      signals.iterationCount === 0 &&
      signals.unverifiedConsecutive >= 3;

    return {
      mrId: 'MR16',
      triggered,
      priority: 90,  // Unconditional high priority
      reason: 'Skill atrophy risk: high AI reliance without independent effort',
    };
  }

  /**
   * MR17: Learning Progress Visualization
   * Trigger: (pattern=B ∧ iterationCount≥3) ∨ sessionComplete
   * Priority: 40 + M1×10
   */
  private evaluateMR17(signals: BehavioralSignals, pattern: Pattern) {
    const triggered =
      (pattern === 'B' && signals.iterationCount >= 3) || signals.sessionEnding;

    // M1 approximated by iteration-based progress
    const M1 = Math.min(signals.iterationCount, 3);
    const basePriority = 40 + M1 * 10;
    const priority = basePriority + (PATTERN_MODIFIERS.MR17[pattern] || 0);

    return {
      mrId: 'MR17',
      triggered,
      priority,
      reason: pattern === 'B'
        ? `Iterative pattern with ${signals.iterationCount} iterations`
        : 'Session completion - show progress summary',
    };
  }

  /**
   * MR18: Over-Reliance Warning (CRITICAL - UNCONDITIONAL)
   * Trigger: unverifiedConsecutive≥4 ∧ M2<2
   * Priority: 70 + (5-consecutive)×5
   */
  private evaluateMR18(signals: BehavioralSignals, pattern: Pattern) {
    const M2 = signals.qualityCheckScore;
    const triggered = signals.unverifiedConsecutive >= 4 && M2 < 2;

    const basePriority = 70 + (5 - Math.min(signals.unverifiedConsecutive, 5)) * 5;

    return {
      mrId: 'MR18',
      triggered,
      priority: basePriority,
      reason: `Critical: ${signals.unverifiedConsecutive} consecutive unverified responses with low quality checking`,
    };
  }

  /**
   * MR19: Metacognitive Assessment
   * Trigger: (sessionEnding ∨ milestone) ∧ E1+E2+E3≥5
   * Priority: 45 + totalE×5
   */
  private evaluateMR19(signals: BehavioralSignals, pattern: Pattern) {
    const totalE = signals.outputEvaluationScore + signals.reflectionDepth + signals.capabilityJudgmentScore;
    const triggered = (signals.sessionEnding || signals.isMilestone) && totalE >= 5;

    const basePriority = 45 + totalE * 5;
    const priority = basePriority + (PATTERN_MODIFIERS.MR19[pattern] || 0);

    return {
      mrId: 'MR19',
      triggered,
      priority,
      reason: 'Session milestone with sufficient metacognitive engagement',
    };
  }

  // ========== Helper Methods ==========

  /**
   * Adjust urgency based on task risk and pattern
   */
  private adjustUrgency(
    baseUrgency: Urgency,
    signals: BehavioralSignals,
    pattern: Pattern
  ): Urgency {
    // Critical risk always escalates to enforce
    if (signals.taskRiskLevel === 'critical') {
      return 'enforce';
    }

    // High risk escalates observe to remind
    if (signals.taskRiskLevel === 'high' && baseUrgency === 'observe') {
      return 'remind';
    }

    // Pattern F always escalates for safety MRs
    if (pattern === 'F' && signals.taskRiskLevel !== 'low') {
      if (baseUrgency === 'observe') return 'remind';
      if (baseUrgency === 'remind') return 'enforce';
    }

    return baseUrgency;
  }

  /**
   * Convert urgency to tier for frontend InterventionManager
   */
  private urgencyToTier(urgency: Urgency): Tier {
    switch (urgency) {
      case 'observe': return 'soft';
      case 'remind': return 'medium';
      case 'enforce': return 'hard';
      default: return 'soft';
    }
  }

  /**
   * Determine display mode based on urgency
   */
  private determineDisplayMode(urgency: Urgency): DisplayMode {
    switch (urgency) {
      case 'observe': return 'inline';
      case 'remind': return 'sidebar';
      case 'enforce': return 'modal';
      default: return 'inline';
    }
  }

  /**
   * Generate contextual message for each MR
   */
  private generateContextualMessage(
    mrId: string,
    signals: BehavioralSignals,
    pattern: Pattern
  ): string {
    switch (mrId) {
      case 'MR1':
        if (pattern === 'F') {
          return 'I notice you\'re asking for a complete solution. Consider breaking this down into smaller steps first. This helps you better understand the process.';
        }
        return 'This task looks complex. Would you like to break it down into smaller, manageable steps?';

      case 'MR2':
        return 'Welcome! I\'ll show you how I process your requests so you can better understand and verify my outputs.';

      case 'MR3':
        return 'This involves a decision. Remember to clarify which parts you handle and which AI assists with.';

      case 'MR4':
        return 'New task type detected. Consider defining your role and expectations for this interaction.';

      case 'MR5':
        return `You've iterated ${signals.iterationCount} times. Consider using branching to explore alternatives without losing progress.`;

      case 'MR6':
        if (pattern === 'D') {
          return '🔄 As a thorough verifier, you might benefit from comparing outputs across different AI models.';
        }
        return '⚠️ Given the importance of this task and current uncertainty, consider cross-validating with another AI model.';

      case 'MR7':
        return '📚 I notice a previous response didn\'t work out. Let\'s reflect on what happened and how to improve.';

      case 'MR8':
        return 'This appears to be a different type of task. I\'ve adjusted my approach accordingly.';

      case 'MR9':
        return `📊 Your trust level has changed by ${Math.abs(signals.trustChange).toFixed(0)}%. Let's calibrate expectations for this task type.`;

      case 'MR10':
        return '⚖️ This action has significant consequences. Consider weighing the costs and benefits before proceeding.';

      case 'MR11':
        if (pattern === 'F') {
          return '⚠️ Before using this output, I strongly recommend verifying the key content. Verification tools are available.';
        }
        return 'I recommend verifying the key content before use. Would you like to use the verification tools?';

      case 'MR12':
        return '🤔 This content may benefit from critical examination. Consider: What assumptions are being made? What evidence supports this?';

      case 'MR13':
        return `⚠️ Confidence level: ${(signals.aiConfidence * 100).toFixed(0)}%. I recommend additional verification for the highlighted sections.`;

      case 'MR14':
        return '📝 Reflection checkpoint: What have you learned so far? How might you apply this knowledge?';

      case 'MR15':
        if (pattern === 'E') {
          return '🎓 As a learning-oriented user, here are advanced metacognitive strategies you might find valuable...';
        }
        return '💡 You\'ve been reflecting deeply. Consider documenting your insights for future reference.';

      case 'MR16':
        return '⚠️ SKILL DEVELOPMENT ALERT: I notice you\'re accepting outputs without modification. To maintain your skills:\n' +
               '1. Try solving part of the problem yourself first\n' +
               '2. Make at least one modification to my output\n' +
               '3. Explain why you made (or didn\'t make) changes';

      case 'MR17':
        if (signals.sessionEnding) {
          return '📊 Session Summary: Here\'s your learning progress and areas for continued growth...';
        }
        return `📈 Progress Update: ${signals.iterationCount} iterations completed. Your persistence is building expertise!`;

      case 'MR18':
        return `🚨 CRITICAL: ${signals.unverifiedConsecutive} consecutive responses accepted without verification.\n` +
               'This pattern may impact your skill development and increase error risk.\n' +
               'Please verify at least one key claim before continuing.';

      case 'MR19':
        return '🎯 Milestone reached! Time for a metacognitive check-in:\n' +
               '• What strategies worked well?\n' +
               '• What would you do differently?\n' +
               '• What questions remain?';

      default:
        return MR_METADATA[mrId]?.name || 'Metacognitive support available';
    }
  }
}

export default new AdaptiveMRActivator();
