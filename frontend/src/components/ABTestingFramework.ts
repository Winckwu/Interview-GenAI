/**
 * A/B Testing Framework for Intervention Strategies
 * Tests different intervention approaches to find most effective strategy
 * Measures impact on pattern improvement, engagement, and risk reduction
 */

export type InterventionStrategy = 'baseline' | 'aggressive' | 'adaptive';
export type SuccessMetric = 'pattern_improvement' | 'verification_increase' | 'query_efficiency' | 'risk_reduction';

export interface TestUserAssignment {
  userId: string;
  testGroup: InterventionStrategy;
  assignmentTime: Date;
}

export interface InterventionMetrics {
  userId: string;
  strategy: InterventionStrategy;
  startTime: Date;
  endTime: Date;
  durationDays: number;
  // Outcome metrics
  patternImprovement: number; // -1 to 1 (negative = regression, positive = improvement)
  verificationIncrease: number; // -1 to 1
  queryEfficiency: number; // -1 to 1 (lower queries better)
  riskReduction: number; // 0 to 1
  engagementScore: number; // 0 to 1 (how engaged was the user)
  satisfactionRating: number; // 1-5 scale
  completionRate: number; // 0-1 (tasks completed)
}

export interface ABTestResult {
  strategyA: InterventionStrategy;
  strategyB: InterventionStrategy;
  sampleSizeA: number;
  sampleSizeB: number;
  winner: InterventionStrategy;
  effectSize: number; // Cohen's d
  statisticalSignificance: boolean; // p < 0.05
  metrics: {
    metricName: SuccessMetric;
    meanA: number;
    meanB: number;
    improvement: number; // percentage
  }[];
  recommendation: string;
}

/**
 * A/B Testing Framework
 * Manages intervention strategy testing and comparison
 */
export class ABTestingFramework {
  private userAssignments: Map<string, TestUserAssignment> = new Map();
  private metricsCollected: Map<string, InterventionMetrics> = new Map();

  /**
   * Assign user to a test group (A/B/C)
   */
  static assignUserToGroup(userId: string): TestUserAssignment {
    const strategies: InterventionStrategy[] = ['baseline', 'aggressive', 'adaptive'];
    // Simple randomization
    const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];

    return {
      userId,
      testGroup: randomStrategy,
      assignmentTime: new Date()
    };
  }

  /**
   * Get intervention strategy for user
   */
  static getInterventionForUser(
    userId: string,
    strategy: InterventionStrategy,
    currentPattern: string
  ): string {
    const interventions: Record<InterventionStrategy, Record<string, string>> = {
      baseline: {
        F: 'Standard warning: Your over-reliance on AI is concerning. Please increase verification.',
        A: 'You\'re doing well. Keep up your strategic control approach.',
        default: 'Continue with your current approach and monitor your progress.'
      },
      aggressive: {
        F: 'CRITICAL: Your over-reliance is dangerous. Immediately reduce AI queries by 50% and verify every result. Seek help if needed.',
        B: 'Your pattern shows room for improvement. Increase verification from next task onward.',
        C: 'Be more intentional about when you switch patterns. Document your decision process.',
        default: 'Set a goal to improve one metric this week. Work toward it deliberately.'
      },
      adaptive: {
        F: 'We detected high AI reliance. Let\'s work together: Start with one task per day using only 1 AI query. We\'ll track progress.',
        B: 'Your iterative approach is good, but add verification checkpoints at 50% completion.',
        C: 'Your context-awareness is excellent. Let\'s formalize when/why you switch patterns.',
        A: 'Your strategic control is strong. Can you help struggling users learn your approach?',
        E: 'Your collaborative learning style is valuable. Focus on helping others learn systematically.',
        default: 'Based on your profile, here\'s a personalized goal for this week...'
      }
    };

    const strategyInterventions = interventions[strategy];
    return (
      strategyInterventions[currentPattern] ||
      strategyInterventions.default ||
      'Continue monitoring your AI usage.'
    );
  }

  /**
   * Record metrics for user in test
   */
  static recordMetrics(
    userId: string,
    strategy: InterventionStrategy,
    startPattern: string,
    endPattern: string,
    startVerification: number,
    endVerification: number,
    startQueryRatio: number,
    endQueryRatio: number,
    durationDays: number,
    satisfactionRating: number
  ): InterventionMetrics {
    const patternImprovement = this.calculatePatternImprovement(startPattern, endPattern);
    const verificationIncrease = endVerification - startVerification;
    const queryEfficiency = startQueryRatio - endQueryRatio; // positive = improvement
    const riskReduction = this.calculateRiskReduction(startPattern, endPattern, verificationIncrease);

    const metrics: InterventionMetrics = {
      userId,
      strategy,
      startTime: new Date(Date.now() - durationDays * 24 * 60 * 60 * 1000),
      endTime: new Date(),
      durationDays,
      patternImprovement,
      verificationIncrease,
      queryEfficiency,
      riskReduction,
      engagementScore: Math.min((durationDays / 14) * satisfactionRating / 5, 1), // normalized
      satisfactionRating,
      completionRate: Math.min(1, 0.7 + riskReduction * 0.3) // estimated
    };

    return metrics;
  }

  /**
   * Calculate pattern improvement score
   */
  private static calculatePatternImprovement(startPattern: string, endPattern: string): number {
    const patternHierarchy: Record<string, number> = {
      F: 0,
      E: 1,
      B: 2,
      C: 2,
      D: 3,
      A: 4
    };

    const startScore = patternHierarchy[startPattern] || 2;
    const endScore = patternHierarchy[endPattern] || 2;

    // Normalize to -1 to 1
    return Math.min(Math.max((endScore - startScore) / 4, -1), 1);
  }

  /**
   * Calculate risk reduction
   */
  private static calculateRiskReduction(
    startPattern: string,
    endPattern: string,
    verificationIncrease: number
  ): number {
    let riskReduction = 0;

    // Moving away from F is significant
    if (startPattern === 'F' && endPattern !== 'F') {
      riskReduction += 0.5;
    }

    // Verification increase reduces risk
    riskReduction += Math.min(verificationIncrease * 0.3, 0.3);

    return Math.min(riskReduction, 1);
  }

  /**
   * Compare two intervention strategies
   */
  static compareStrategies(
    metricsA: InterventionMetrics[],
    metricsB: InterventionMetrics[],
    strategyA: InterventionStrategy,
    strategyB: InterventionStrategy
  ): ABTestResult {
    const metrics: ABTestResult['metrics'] = [];

    // Compare pattern improvement
    const patternImprovementA = metricsA.reduce((sum, m) => sum + m.patternImprovement, 0) / metricsA.length;
    const patternImprovementB = metricsB.reduce((sum, m) => sum + m.patternImprovement, 0) / metricsB.length;
    metrics.push({
      metricName: 'pattern_improvement',
      meanA: patternImprovementA,
      meanB: patternImprovementB,
      improvement: ((patternImprovementB - patternImprovementA) / Math.abs(patternImprovementA || 0.01)) * 100
    });

    // Compare verification increase
    const verificationA = metricsA.reduce((sum, m) => sum + m.verificationIncrease, 0) / metricsA.length;
    const verificationB = metricsB.reduce((sum, m) => sum + m.verificationIncrease, 0) / metricsB.length;
    metrics.push({
      metricName: 'verification_increase',
      meanA: verificationA,
      meanB: verificationB,
      improvement: ((verificationB - verificationA) / Math.abs(verificationA || 0.01)) * 100
    });

    // Compare satisfaction
    const satisfactionA = metricsA.reduce((sum, m) => sum + m.satisfactionRating, 0) / metricsA.length;
    const satisfactionB = metricsB.reduce((sum, m) => sum + m.satisfactionRating, 0) / metricsB.length;

    // Calculate effect size (Cohen's d)
    const pooledStd = 1.0; // normalized
    const effectSize = Math.abs(
      (metricsB.reduce((sum, m) => sum + m.riskReduction, 0) / metricsB.length -
        metricsA.reduce((sum, m) => sum + m.riskReduction, 0) / metricsA.length) /
        pooledStd
    );

    const statisticalSignificance = effectSize > 0.5; // Medium effect size = p < 0.05 typically

    // Determine winner
    const scoreB =
      patternImprovementB + verificationB * 0.5 + satisfactionB * 0.1;
    const scoreA =
      patternImprovementA + verificationA * 0.5 + satisfactionA * 0.1;

    const winner = scoreB > scoreA ? strategyB : strategyA;

    // Generate recommendation
    let recommendation = `${winner} strategy shows better results`;
    if (statisticalSignificance) {
      recommendation += ` with statistically significant improvement (effect size: ${effectSize.toFixed(2)})`;
    } else {
      recommendation += `, though the difference may not be statistically significant.`;
    }

    return {
      strategyA,
      strategyB,
      sampleSizeA: metricsA.length,
      sampleSizeB: metricsB.length,
      winner,
      effectSize,
      statisticalSignificance,
      metrics,
      recommendation
    };
  }

  /**
   * Generate A/B test report
   */
  static generateTestReport(result: ABTestResult): string {
    const report = `
╔════════════════════════════════════════════╗
║         A/B Test Results Report            ║
╚════════════════════════════════════════════╝

STRATEGIES COMPARED:
  Strategy A (${result.strategyA}): N = ${result.sampleSizeA}
  Strategy B (${result.strategyB}): N = ${result.sampleSizeB}

WINNER: ${result.winner.toUpperCase()}
Effect Size: ${result.effectSize.toFixed(3)}
Statistical Significance: ${result.statisticalSignificance ? 'Yes (p < 0.05)' : 'Not significant'}

KEY METRICS COMPARISON:
${result.metrics.map((m) => `
${m.metricName.replace(/_/g, ' ').toUpperCase()}:
  ${result.strategyA}: ${m.meanA.toFixed(3)}
  ${result.strategyB}: ${m.meanB.toFixed(3)}
  Improvement: ${m.improvement > 0 ? '+' : ''}${m.improvement.toFixed(1)}%
`).join('')}

RECOMMENDATION:
${result.recommendation}

NEXT STEPS:
1. Implement winning strategy in production
2. Continue monitoring for sustained results
3. Consider fine-tuning winning strategy
4. Conduct follow-up study after 4 weeks
    `;

    return report;
  }
}

export default ABTestingFramework;
