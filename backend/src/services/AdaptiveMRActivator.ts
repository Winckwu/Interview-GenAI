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
        threshold: 2.5,
        description: 'Extreme AI reliance'
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

      // 3. Create active MR
      const activeMR: ActiveMR = {
        mrId: rule.mrId,
        name: rule.name,
        urgency: rule.urgency,
        displayMode: this.determineDisplayMode(rule.urgency),
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
