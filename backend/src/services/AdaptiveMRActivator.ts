/**
 * Adaptive MR Activator
 * Determines which MRs should be active based on:
 * 1. Detected behavioral signals
 * 2. Current pattern estimate
 * 3. Conversation context
 */

import { BehavioralSignals } from './BehaviorSignalDetector';
import { PatternEstimate, Pattern } from './RealtimePatternRecognizer';

export type Urgency = 'observe' | 'remind' | 'enforce';
export type DisplayMode = 'inline' | 'sidebar' | 'modal';

export interface TriggerCondition {
  signal: keyof BehavioralSignals;
  operator: '<' | '>' | '<=' | '>=' | '==' | '!=' | 'in';
  threshold: number | boolean | string[];
  description: string;
}

export interface MRActivationRule {
  mrId: string;
  name: string;
  triggerConditions: TriggerCondition[];
  urgency: Urgency;
  targetPatterns?: Pattern[];
  description: string;
}

export interface ActiveMR {
  mrId: string;
  name: string;
  urgency: Urgency;
  displayMode: DisplayMode;
  message: string;
  priority: number;
}

/**
 * Define all MR activation rules
 * Based on Phase-5.5 design document
 *
 * CALIBRATED 2024-11-24: Thresholds adjusted based on real user data analysis
 * - 378 real users from course interaction data
 * - 54.8% Pattern F prevalence (passive over-reliance)
 * - E1 (verification) average: 0.00 (critical concern)
 * - M1 (iteration) average: 0.84 (very low)
 */
const MR_ACTIVATION_RULES: MRActivationRule[] = [
  {
    mrId: 'MR1',
    name: 'Task Decomposition Scaffold',
    triggerConditions: [
      {
        signal: 'taskDecompositionEvidence',
        operator: '<',
        threshold: 2,
        description: 'User lacks task decomposition'
      },
      {
        signal: 'taskComplexity',
        operator: '>',
        threshold: 1.5,
        description: 'Task is moderately complex'
      }
    ],
    urgency: 'remind',
    targetPatterns: ['B', 'F'],
    description: 'Help user break down complex tasks'
  },

  {
    mrId: 'MR3',
    name: 'Human Agency Control',
    triggerConditions: [
      {
        signal: 'strategyMentioned',
        operator: '==',
        threshold: true,
        description: 'User mentioned a strategy'
      },
      {
        signal: 'taskDecompositionEvidence',
        operator: '>=',
        threshold: 2,
        description: 'Clear task decomposition'
      }
    ],
    urgency: 'observe',
    targetPatterns: ['A', 'C'],
    description: 'Remind about role definition'
  },

  {
    mrId: 'MR11',
    name: 'Integrated Verification Tools',
    triggerConditions: [
      {
        signal: 'verificationAttempted',
        operator: '==',
        threshold: false,
        description: 'User has not verified'
      }
    ],
    urgency: 'remind',
    targetPatterns: ['B', 'F'],
    description: 'Provide verification tools and suggestions'
  },

  {
    mrId: 'MR13',
    name: 'Transparent Uncertainty Display',
    triggerConditions: [
      {
        signal: 'taskComplexity',
        operator: '>',
        threshold: 1,
        description: 'Any non-trivial task'
      }
    ],
    urgency: 'observe',
    description: 'Display uncertainty indicators (always available)'
  },

  {
    mrId: 'MR16',
    name: 'Skill Degradation Prevention',
    triggerConditions: [
      {
        signal: 'aiRelianceDegree',
        operator: '>',
        threshold: 2,
        description: 'High AI reliance'
      },
      {
        signal: 'iterationCount',
        operator: '<',
        threshold: 1,
        description: 'Low iteration/refinement'
      }
    ],
    urgency: 'enforce',
    targetPatterns: ['F', 'B'],
    description: 'Prevent skill degradation'
  },

  {
    mrId: 'MR18',
    name: 'Over-reliance Warning',
    triggerConditions: [
      {
        signal: 'aiRelianceDegree',
        operator: '>',
        threshold: 2.0,  // CALIBRATED: lowered from 2.5 based on real data (M1 avg: 0.84)
        description: 'High AI reliance detected'
      },
      {
        signal: 'verificationAttempted',
        operator: '==',
        threshold: false,
        description: 'No verification behavior'
      }
    ],
    urgency: 'enforce',
    targetPatterns: ['F'],
    description: 'Alert about over-reliance on AI'
  },

  // NEW RULE: Added based on real data analysis (2024-11-24)
  // 21.9% of users had short inputs (<30 chars avg), correlating with Pattern F
  {
    mrId: 'MR19',
    name: 'Input Enhancement Prompt',
    triggerConditions: [
      {
        signal: 'inputComplexity',
        operator: '<',
        threshold: 2,
        description: 'Short or simple input detected'
      }
    ],
    urgency: 'remind',
    targetPatterns: ['F', 'C'],
    description: 'Encourage more detailed input for better AI assistance'
  },

  // ========== PATTERN D (Deep Verification) RULES ==========
  // Pattern D users already verify thoroughly - help them optimize efficiency
  {
    mrId: 'MR10',
    name: 'Verification Efficiency Optimizer',
    triggerConditions: [
      {
        signal: 'verificationAttempted',
        operator: '==',
        threshold: true,
        description: 'User actively verifies'
      },
      {
        signal: 'taskComplexity',
        operator: '<',
        threshold: 2,
        description: 'Task is relatively simple'
      }
    ],
    urgency: 'observe',
    targetPatterns: ['D'],
    description: 'Suggest proportional verification for low-complexity tasks'
  },

  {
    mrId: 'MR15',
    name: 'Advanced Verification Strategies',
    triggerConditions: [
      {
        signal: 'verificationAttempted',
        operator: '==',
        threshold: true,
        description: 'User shows verification behavior'
      },
      {
        signal: 'qualityCheckMentioned',
        operator: '==',
        threshold: true,
        description: 'Quality check behavior present'
      }
    ],
    urgency: 'observe',
    targetPatterns: ['D'],
    description: 'Provide advanced metacognitive strategies for expert verifiers'
  },

  // ========== PATTERN E (Teaching & Learning) RULES ==========
  // Pattern E users reflect deeply - help them convert insights to action
  {
    mrId: 'MR14',
    name: 'Reflection to Action Bridge',
    triggerConditions: [
      {
        signal: 'reflectionDepth',
        operator: '>=',
        threshold: 2,
        description: 'Deep reflection demonstrated'
      }
    ],
    urgency: 'observe',
    targetPatterns: ['E'],
    description: 'Help convert deep reflection into practical application'
  },

  {
    mrId: 'MR17',
    name: 'Learning Progress Visualization',
    triggerConditions: [
      {
        signal: 'reflectionDepth',
        operator: '>=',
        threshold: 2,
        description: 'Reflective learning behavior'
      },
      {
        signal: 'capabilityJudgmentShown',
        operator: '==',
        threshold: true,
        description: 'Shows capability awareness'
      }
    ],
    urgency: 'observe',
    targetPatterns: ['E'],
    description: 'Visualize learning journey and knowledge growth'
  },

  // Pattern E also benefits from guided reflection enhancement
  {
    mrId: 'MR14-Enhanced',
    name: 'Structured Reflection Guide',
    triggerConditions: [
      {
        signal: 'reflectionDepth',
        operator: '>=',
        threshold: 1,
        description: 'Some reflection shown'
      },
      {
        signal: 'outputEvaluationPresent',
        operator: '==',
        threshold: true,
        description: 'Evaluates AI output'
      }
    ],
    urgency: 'observe',
    targetPatterns: ['E', 'D'],
    description: 'Provide structured reflection framework for deep learners'
  },
];

export class AdaptiveMRActivator {
  /**
   * Determine which MRs should be activated based on signals and pattern
   */
  determineActiveMRs(
    signals: BehavioralSignals,
    patternEstimate: PatternEstimate,
    turnCount: number
  ): ActiveMR[] {
    const activeMRs: ActiveMR[] = [];

    for (const rule of MR_ACTIVATION_RULES) {
      // 1. Check if rule applies to current pattern
      if (rule.targetPatterns &&
          !rule.targetPatterns.includes(patternEstimate.topPattern)) {
        continue;
      }

      // 2. Evaluate all trigger conditions (AND logic)
      const conditionsMet = rule.triggerConditions.every(condition =>
        this.evaluateCondition(condition, signals)
      );

      if (!conditionsMet) continue;

      // 3. ✨ Adjust urgency based on task risk level
      let adjustedUrgency = rule.urgency;

      // Pattern A + High Risk Task → upgrade observe to remind
      if (patternEstimate.topPattern === 'A' &&
          signals.taskRiskLevel === 'high' &&
          rule.urgency === 'observe') {
        adjustedUrgency = 'remind';
        console.log(`🔼 [RiskAdjustment] Pattern A in high-risk task: upgrading ${rule.mrId} from observe to remind`);
      }

      // Pattern A + Critical Risk Task → upgrade observe to enforce
      if (patternEstimate.topPattern === 'A' &&
          signals.taskRiskLevel === 'critical' &&
          rule.urgency === 'observe') {
        adjustedUrgency = 'enforce';
        console.log(`🔼 [RiskAdjustment] Pattern A in critical-risk task: upgrading ${rule.mrId} from observe to enforce`);
      }

      // Pattern F + High/Critical Risk → force enforce
      if (patternEstimate.topPattern === 'F' &&
          (signals.taskRiskLevel === 'high' || signals.taskRiskLevel === 'critical')) {
        adjustedUrgency = 'enforce';
        console.log(`🚨 [RiskAdjustment] Pattern F in high-risk task: forcing enforce for ${rule.mrId}`);
      }

      // Any pattern + Critical Risk → upgrade at least to remind
      if (signals.taskRiskLevel === 'critical' && adjustedUrgency === 'observe') {
        adjustedUrgency = 'remind';
        console.log(`🔼 [RiskAdjustment] Critical-risk task: upgrading ${rule.mrId} from observe to remind`);
      }

      // 4. Create active MR with adjusted urgency
      const activeMR: ActiveMR = {
        mrId: rule.mrId,
        name: rule.name,
        urgency: adjustedUrgency,  // ✅ Use adjusted urgency
        displayMode: this.determineDisplayMode(adjustedUrgency),
        message: this.generateContextualMessage(
          rule,
          signals,
          patternEstimate,
          turnCount
        ),
        priority: this.calculatePriority(rule, patternEstimate, signals),
      };

      activeMRs.push(activeMR);
    }

    // Sort by priority and return top 3
    return this.prioritizeAndDedup(activeMRs);
  }

  /**
   * Evaluate a single trigger condition
   */
  private evaluateCondition(
    condition: TriggerCondition,
    signals: BehavioralSignals
  ): boolean {
    const signalValue = signals[condition.signal];

    switch (condition.operator) {
      case '<':
        return (signalValue as number) < (condition.threshold as number);
      case '>':
        return (signalValue as number) > (condition.threshold as number);
      case '<=':
        return (signalValue as number) <= (condition.threshold as number);
      case '>=':
        return (signalValue as number) >= (condition.threshold as number);
      case '==':
        return signalValue === condition.threshold;
      case '!=':
        return signalValue !== condition.threshold;
      case 'in':
        if (Array.isArray(condition.threshold)) {
          return condition.threshold.includes(signalValue as unknown as string);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Generate contextual message based on pattern and signals
   */
  private generateContextualMessage(
    rule: MRActivationRule,
    signals: BehavioralSignals,
    pattern: PatternEstimate,
    turnCount: number
  ): string {
    const topPattern = pattern.topPattern;

    // MR1: Task Decomposition
    if (rule.mrId === 'MR1') {
      if (topPattern === 'F') {
        return 'I notice you\'re asking for a complete solution. Consider breaking this down into smaller steps first. This helps you better understand the process.';
      } else if (signals.taskComplexity > 2) {
        return 'This task looks complex. Would you like to use task decomposition to plan the steps?';
      }
      return 'Breaking down the task first makes it easier to manage.';
    }

    // MR3: Human Agency Control
    if (rule.mrId === 'MR3') {
      return 'Remember to clarify which parts you handle and which AI assists with. This helps you maintain control of your work.';
    }

    // MR11: Verification Tools
    if (rule.mrId === 'MR11') {
      if (topPattern === 'F') {
        return '⚠️ Before using this output, I strongly recommend verifying the key content. I\'ve prepared verification tools for you.';
      }
      return 'Before using this output, I recommend verifying the key content. Verification tools are available.';
    }

    // MR13: Uncertainty
    if (rule.mrId === 'MR13') {
      return 'Note: Some parts may have lower confidence. I recommend verifying this information.';
    }

    // MR16: Skill Degradation
    if (rule.mrId === 'MR16') {
      if (signals.iterationCount === 0) {
        return 'I notice you\'re accepting AI outputs without making modifications or iterations. To maintain your skills, try making some independent changes or verification.';
      }
      return 'Remember to maintain control of your work and avoid over-relying on AI. I recommend more independent thinking and verification.';
    }

    // MR18: Over-reliance Warning
    if (rule.mrId === 'MR18') {
      return '⚠️ CRITICAL: Over-reliance on AI detected. This may impact your skill development. I recommend:\n' +
             '1. Try solving problems yourself first\n' +
             '2. Verify AI output accuracy\n' +
             '3. Regularly complete tasks without AI\n' +
             'Please confirm you understand the risks before continuing.';
    }

    // MR19: Input Enhancement Prompt (NEW - based on real data analysis)
    if (rule.mrId === 'MR19') {
      if (topPattern === 'F') {
        return '💡 Your question is quite brief. To get better assistance and develop your understanding, try:\n' +
               '• Describe your current understanding\n' +
               '• Explain what you\'ve already tried\n' +
               '• Ask specific questions about concepts you find confusing';
      }
      return '💡 Adding more detail to your question can help me provide more targeted assistance. What specific aspects would you like to explore?';
    }

    // ========== Pattern D (Deep Verification) Messages ==========

    // MR10: Verification Efficiency Optimizer
    if (rule.mrId === 'MR10') {
      if (signals.taskComplexity < 1.5) {
        return '✨ Great verification habit! For this simpler task, a quick spot-check may be sufficient. ' +
               'Save your thorough verification energy for higher-stakes content.';
      }
      return '✨ Your thorough verification approach is excellent. Consider prioritizing verification ' +
             'effort based on task criticality to optimize your workflow.';
    }

    // MR15: Advanced Verification Strategies
    if (rule.mrId === 'MR15') {
      return '🎯 Advanced Verification Strategies for Expert Users:\n' +
             '• Cross-reference with authoritative sources\n' +
             '• Test edge cases and boundary conditions\n' +
             '• Use the "explain back" technique to verify understanding\n' +
             '• Consider creating verification checklists for repeated tasks';
    }

    // ========== Pattern E (Teaching & Learning) Messages ==========

    // MR14: Reflection to Action Bridge
    if (rule.mrId === 'MR14') {
      return '🌱 Your reflection shows deep understanding. Ready to apply these insights?\n' +
             '• What specific action can you take based on this learning?\n' +
             '• How might you teach this concept to someone else?\n' +
             '• What would be a good practice exercise to solidify this knowledge?';
    }

    // MR17: Learning Progress Visualization
    if (rule.mrId === 'MR17') {
      return '📊 Your Learning Journey:\n' +
             '• You\'ve demonstrated strong reflection and self-awareness\n' +
             '• Consider mapping your knowledge growth over time\n' +
             '• Track concepts you\'ve mastered vs. areas for growth\n' +
             '• Your metacognitive skills are developing well!';
    }

    // MR14-Enhanced: Structured Reflection Guide
    if (rule.mrId === 'MR14-Enhanced') {
      return '📝 Structured Reflection Framework:\n' +
             '1. What did I learn from this interaction?\n' +
             '2. How does this connect to what I already know?\n' +
             '3. Where might I apply this knowledge?\n' +
             '4. What questions remain for deeper exploration?';
    }

    return rule.description;
  }

  /**
   * Determine display mode based on urgency
   */
  private determineDisplayMode(urgency: Urgency): DisplayMode {
    switch (urgency) {
      case 'observe':
        return 'inline';     // Non-intrusive, part of message
      case 'remind':
        return 'sidebar';    // Visible but not blocking
      case 'enforce':
        return 'modal';      // Blocks interaction, requires response
      default:
        return 'inline';
    }
  }

  /**
   * Calculate priority for MR activation
   * Used to determine which MRs to show when multiple are active
   */
  private calculatePriority(
    rule: MRActivationRule,
    pattern: PatternEstimate,
    signals: BehavioralSignals
  ): number {
    let priority = 0;

    // Base urgency score
    const urgencyScore = { observe: 1, remind: 2, enforce: 3 };
    priority += urgencyScore[rule.urgency] * 10;

    // Pattern F is highest priority
    if (pattern.topPattern === 'F') priority += 50;

    // Critical risk indicators
    if (signals.aiRelianceDegree > 2.5 && !signals.verificationAttempted) {
      priority += 30;
    }

    if (signals.iterationCount === 0 && pattern.topPattern !== 'A') {
      priority += 20;
    }

    return priority;
  }

  /**
   * Remove duplicate MRs and return top by priority
   */
  private prioritizeAndDedup(activeMRs: ActiveMR[]): ActiveMR[] {
    // Remove duplicates (keep highest priority)
    const uniqueMRs = new Map<string, ActiveMR>();
    activeMRs.forEach(mr => {
      if (!uniqueMRs.has(mr.mrId) || mr.priority > uniqueMRs.get(mr.mrId)!.priority) {
        uniqueMRs.set(mr.mrId, mr);
      }
    });

    // Sort by priority and return top 3
    return Array.from(uniqueMRs.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }
}

export default new AdaptiveMRActivator();
