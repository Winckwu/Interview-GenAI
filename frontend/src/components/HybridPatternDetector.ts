/**
 * Hybrid Pattern Detector
 * Identifies both primary and secondary patterns in user AI usage behavior
 * Recognizes context-specific pattern switching
 */

export interface PatternDetectionResult {
  primaryPattern: string;
  primaryConfidence: number; // 0-1 scale
  secondaryPattern?: string;
  secondaryConfidence?: number;
  contextSwitchingTriggers?: string[];
  contextualBehaviors?: Record<string, ContextBehavior>;
  isHybridPattern: boolean;
  hybridDescription?: string;
}

export interface ContextBehavior {
  context: string;
  pattern: string;
  queryRatio: number;
  verificationRate: number;
}

export class HybridPatternDetector {
  /**
   * Detect both primary and secondary patterns
   */
  static detectHybridPattern(
    aiQueryCount: number,
    verificationRate: number,
    independenceRate: number,
    taskCount: number,
    contextAware: boolean,
    userType: 'efficient' | 'struggling',
    actualPattern?: string,
    contextualBehaviors?: Record<string, { pattern: string; queryRatio: number; verificationRate: number }>
  ): PatternDetectionResult {
    const aiQueryRatio = aiQueryCount / Math.max(taskCount, 1);

    // Detect primary pattern
    const primaryPattern = this.detectPrimaryPattern(
      aiQueryRatio,
      verificationRate,
      independenceRate,
      contextAware,
      userType,
      actualPattern
    );

    const primaryConfidence = this.calculateConfidence(
      primaryPattern,
      aiQueryRatio,
      verificationRate,
      userType
    );

    // Detect secondary pattern (for hybrid users)
    const { secondaryPattern, secondaryConfidence } = this.detectSecondaryPattern(
      primaryPattern,
      aiQueryRatio,
      verificationRate,
      contextAware,
      userType,
      contextualBehaviors
    );

    const isHybridPattern = !!secondaryPattern && secondaryConfidence! >= 0.50;

    // Get context switching triggers
    const contextSwitchingTriggers = this.identifyContextTriggers(
      primaryPattern,
      secondaryPattern,
      userType,
      contextAware
    );

    // Generate hybrid description
    const hybridDescription = isHybridPattern
      ? this.generateHybridDescription(primaryPattern, secondaryPattern!)
      : undefined;

    return {
      primaryPattern,
      primaryConfidence,
      secondaryPattern: isHybridPattern ? secondaryPattern : undefined,
      secondaryConfidence: isHybridPattern ? secondaryConfidence : undefined,
      contextSwitchingTriggers: isHybridPattern ? contextSwitchingTriggers : undefined,
      contextualBehaviors: isHybridPattern
        ? this.mapContextualBehaviors(contextualBehaviors)
        : undefined,
      isHybridPattern,
      hybridDescription
    };
  }

  /**
   * Detect primary pattern using behavior metrics
   */
  private static detectPrimaryPattern(
    aiQueryRatio: number,
    verificationRate: number,
    independenceRate: number,
    contextAware: boolean,
    userType: 'efficient' | 'struggling',
    actualPattern?: string
  ): string {
    // Pattern F: Over-reliance (HIGHEST PRIORITY)
    if (aiQueryRatio > 2.0 && verificationRate < 0.3) {
      return 'F';
    }

    // Pattern E: Teaching preference (user-initialized)
    if (actualPattern === 'E') {
      return 'E';
    }

    // Pattern D: Deep verification
    if (actualPattern === 'D' && verificationRate > 0.75) {
      return 'D';
    }

    // Pattern A: Strategic control (high verification, low queries)
    if (verificationRate > 0.85 && aiQueryRatio < 1.5) {
      return 'A';
    }

    // Pattern B: Iterative refinement (high queries, good verification)
    if (aiQueryRatio > 1.5 && verificationRate > 0.65 && userType === 'efficient') {
      return 'B';
    }

    // Pattern C: Context-sensitive adaptation
    if (contextAware) {
      return 'C';
    }

    // Struggling users special handling
    if (userType === 'struggling') {
      if (aiQueryRatio > 1.5 && verificationRate > 0.3) {
        return 'B';
      }
      if (verificationRate > 0.2 && verificationRate <= 0.5) {
        return 'C';
      }
      if (verificationRate > 0.5) {
        return 'A';
      }
    }

    // Fallback
    return actualPattern || 'A';
  }

  /**
   * Detect secondary pattern for hybrid users
   */
  private static detectSecondaryPattern(
    primaryPattern: string,
    aiQueryRatio: number,
    verificationRate: number,
    contextAware: boolean,
    userType: 'efficient' | 'struggling',
    contextualBehaviors?: Record<string, { pattern: string; queryRatio: number; verificationRate: number }>
  ): { secondaryPattern?: string; secondaryConfidence?: number } {
    // If user has no contextual behaviors, no secondary pattern
    if (!contextAware && !contextualBehaviors) {
      return { secondaryPattern: undefined, secondaryConfidence: undefined };
    }

    // Analyze contextual behaviors to find alternative patterns
    let secondaryPattern: string | undefined;
    let secondaryConfidence = 0;

    if (contextualBehaviors) {
      const contexts = Object.entries(contextualBehaviors);

      // Get patterns in different contexts
      const patternsInContexts = contexts.map(([, behavior]) => behavior.pattern);

      // Find alternative patterns
      for (const context of contexts) {
        const [contextName, behavior] = context;
        if (behavior.pattern !== primaryPattern) {
          secondaryPattern = behavior.pattern;
          // Confidence based on how consistent this alternative pattern is
          secondaryConfidence = Math.min(behavior.verificationRate + 0.1, 0.95);
          break;
        }
      }
    }

    // If no contextual behaviors but context-aware, infer secondary pattern
    if (!secondaryPattern && contextAware) {
      // Context-aware users may have secondary patterns based on primary
      const secondaryInference = this.inferSecondaryFromContext(primaryPattern, userType);
      secondaryPattern = secondaryInference.pattern;
      secondaryConfidence = secondaryInference.confidence;
    }

    return { secondaryPattern, secondaryConfidence };
  }

  /**
   * Infer secondary pattern when only primary and context-awareness are known
   */
  private static inferSecondaryFromContext(
    primaryPattern: string,
    userType: 'efficient' | 'struggling'
  ): { pattern: string; confidence: number } {
    // Common hybrid patterns observed in research
    const hybridInferences: Record<string, Record<string, { pattern: string; confidence: number }>> = {
      // Efficient users
      'efficient-A': { pattern: 'C', confidence: 0.65 }, // Strategic + Context
      'efficient-B': { pattern: 'D', confidence: 0.70 }, // Iterative + Deep
      'efficient-C': { pattern: 'A', confidence: 0.60 }, // Context + Strategic
      'efficient-D': { pattern: 'A', confidence: 0.65 }, // Deep + Strategic
      'efficient-E': { pattern: 'D', confidence: 0.60 }, // Teaching + Deep

      // Struggling users
      'struggling-A': { pattern: 'B', confidence: 0.65 }, // Strategic attempt + Iterative
      'struggling-B': { pattern: 'A', confidence: 0.70 }, // Iterative + Strategic attempt
      'struggling-C': { pattern: 'B', confidence: 0.68 }, // Context + Iterative fallback
      'struggling-E': { pattern: 'C', confidence: 0.65 }, // Teaching + Context
    };

    const key = `${userType}-${primaryPattern}`;
    const inference = hybridInferences[key];

    return inference || { pattern: 'A', confidence: 0 }; // No secondary if not found
  }

  /**
   * Calculate confidence score for pattern detection
   */
  private static calculateConfidence(
    pattern: string,
    aiQueryRatio: number,
    verificationRate: number,
    userType: 'efficient' | 'struggling'
  ): number {
    // Pattern F detection is highly reliable
    if (pattern === 'F') {
      return 0.95;
    }

    // Efficient users generally have higher confidence
    const typeBonus = userType === 'efficient' ? 0.05 : 0;

    // Combine verification and query ratio for confidence
    const verificationConfidence = Math.min(verificationRate * 1.1, 1.0);
    const queryConfidence = Math.min(Math.abs(aiQueryRatio - 1.0) * 0.3, 0.8);

    const baseConfidence = (verificationConfidence + queryConfidence) / 2;
    return Math.min(baseConfidence + typeBonus, 0.95);
  }

  /**
   * Identify what triggers pattern switching
   */
  private static identifyContextTriggers(
    primaryPattern: string,
    secondaryPattern: string | undefined,
    userType: 'efficient' | 'struggling',
    contextAware: boolean
  ): string[] {
    if (!secondaryPattern) {
      return [];
    }

    const triggers: string[] = [];

    // Common triggers based on pattern combinations
    if (primaryPattern === 'A' && secondaryPattern === 'C') {
      triggers.push('high_complexity', 'unfamiliar_domain');
    } else if (primaryPattern === 'B' && secondaryPattern === 'D') {
      triggers.push('task_criticality', 'risk_assessment');
    } else if (primaryPattern === 'C' && secondaryPattern === 'B') {
      triggers.push('adaptation_failure', 'increased_difficulty');
    } else if (primaryPattern === 'C' && secondaryPattern === 'E') {
      triggers.push('learning_stage', 'knowledge_consolidation');
    } else if (userType === 'struggling') {
      triggers.push('task_familiarity', 'confidence_level');
    }

    if (contextAware && triggers.length === 0) {
      triggers.push('context_change', 'task_requirement_shift');
    }

    return triggers;
  }

  /**
   * Generate human-readable description of hybrid pattern
   */
  private static generateHybridDescription(primaryPattern: string, secondaryPattern: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      'A-C': 'Strategic Control + Context Adaptation: You maintain strong oversight normally, but flexibly adapt when facing complex or unfamiliar challenges.',
      'B-D': 'Iterative Refinement + Deep Verification: You iterate multiple times on standard tasks, but shift to thorough verification for critical work.',
      'C-B': 'Context Adaptation + Iterative Fallback: You try to adapt to context, but may fall back to iteration when adaptation approaches fail.',
      'C-E': 'Context Adaptation + Learning-Focused: You switch between adaptive strategies and learning-focused approaches across different task phases.',
      'B-A': 'Iterative Refinement + Strategic Control: You iterate heavily on new tasks, but exercise strategic control on familiar ones.',
      'A-B': 'Strategic Control (Attempting) + Iterative: You aspire to strategic control but often fall back to iterative approaches when confidence drops.',
    };

    const key = `${primaryPattern}-${secondaryPattern}`;
    return descriptions[key] || `Pattern ${primaryPattern} with secondary ${secondaryPattern} characteristics.`;
  }

  /**
   * Map contextual behaviors for display
   */
  private static mapContextualBehaviors(
    contextualBehaviors?: Record<string, { pattern: string; queryRatio: number; verificationRate: number }>
  ): Record<string, ContextBehavior> | undefined {
    if (!contextualBehaviors) {
      return undefined;
    }

    const mapped: Record<string, ContextBehavior> = {};
    Object.entries(contextualBehaviors).forEach(([context, behavior]) => {
      mapped[context] = {
        context,
        pattern: behavior.pattern,
        queryRatio: behavior.queryRatio,
        verificationRate: behavior.verificationRate
      };
    });

    return mapped;
  }

  /**
   * Generate intervention recommendations for hybrid pattern users
   */
  static generateInterventionForHybrid(
    primaryPattern: string,
    secondaryPattern: string,
    userType: 'efficient' | 'struggling'
  ): {
    mainIntervention: string;
    hybridIntervention: string;
    contextualGuidance: string;
  } {
    const mainInterventions: Record<string, string> = {
      'A': 'Your strategic oversight is excellent. Continue leveraging your verification strength.',
      'B': 'Your iterative approach shows flexibility. Consider adding verification milestones.',
      'C': 'Your context-awareness is valuable. Document what triggers strategy changes.',
      'D': 'Your deep verification approach ensures quality. Balance with efficiency.',
      'E': 'Your learning focus is strong. Apply learning insights to practical tasks.',
      'F': 'Your over-reliance on AI is concerning. Gradually increase independent verification.'
    };

    const hybridInterventions: Record<string, Record<string, string>> = {
      'A-C': 'Leverage your flexibility: Document when and why you shift from strategic control to adaptation—this awareness strengthens both patterns.',
      'B-D': 'Optimize verification switching: Create clear criteria for when iterative approaches are sufficient vs. when deep verification is needed.',
      'C-B': 'Strengthen adaptation: When adaptation fails, analyze why before falling back to iteration. This improves your adaptive capabilities.',
      'C-E': 'Balance learning and application: Set clear milestones for transitioning from learning-focused to application-focused strategies.',
      'B-A': 'Build confidence faster: Use successful iterations on new tasks as foundation to develop strategic control earlier.',
      'A-B': 'Strategic confidence building: Start complex tasks with verification-first strategies before attempting pure control.',
    };

    const contextualGuidances: Record<string, Record<string, string>> = {
      'efficient-A-C': 'Your primary strategy works well—use context triggers as signals for controlled flexibility rather than abandoning strategy.',
      'efficient-B-D': 'Your mix of speeds is healthy. Clearly label iterations as "exploratory" vs. "critical" phases.',
      'struggling-A-B': 'Strategic control on familiar tasks is good practice. Use these successes to build confidence on new tasks.',
      'struggling-B-A': 'When you achieve strategic control, document what helped. Replicate those conditions intentionally.',
      'struggling-C-B': 'Adaptation is good to attempt. Before falling back, try iterating WITH context awareness instead of abandoning it.',
      'struggling-C-E': 'Your learning phases are valuable. Explicitly structure them—plan when you switch from learning to application.',
    };

    const key = `${primaryPattern}-${secondaryPattern}`;
    const userContextKey = `${userType}-${key}`;

    return {
      mainIntervention: mainInterventions[primaryPattern] || 'Continue developing your AI usage patterns.',
      hybridIntervention: hybridInterventions[key] || 'Your dual-pattern approach shows adaptability. Optimize the switching criteria.',
      contextualGuidance:
        contextualGuidances[userContextKey] ||
        contextualGuidances[key] ||
        'Be intentional about when and why you switch patterns—this self-awareness improves both strategies.'
    };
  }
}
