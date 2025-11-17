/**
 * Predictive Pattern Advisor
 * Predicts which AI usage pattern a user will adopt for upcoming tasks
 * Based on: Task context, user history, current pattern, and environmental factors
 */

export interface TaskContext {
  taskId: string;
  taskType: 'data_analysis' | 'coding' | 'writing' | 'design' | 'planning' | 'other';
  complexity: number; // 0-10 scale
  deadline: number; // hours until deadline
  importance: number; // 0-10 scale (criticality)
  familiarityScore: number; // 0-1 scale (how familiar is the user with this type of task)
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserHistory {
  userId: string;
  currentPattern: string;
  historyLength: number; // number of past tasks analyzed
  averageVerificationRate: number;
  averageQueryRatio: number;
  averageIndependenceRate: number;
  contextSwitchingFrequency: number; // 0-1 (how often does user switch patterns)
  successRate: number; // 0-1 (task completion success)
  stressLevel: number; // 0-10 (user perceived stress)
}

export interface PredictionResult {
  predictedPattern: string;
  confidence: number; // 0-1 scale
  alternativePatterns: Array<{ pattern: string; probability: number }>;
  reasoningChain: string[];
  recommendedApproach: string;
  riskFactors: string[];
}

/**
 * Predictive Pattern Advisor Class
 * Uses task context and user history to predict pattern adoption
 */
export class PredictivePatternAdvisor {
  /**
   * Predict user's pattern for an upcoming task
   */
  static predictPatternForTask(
    taskContext: TaskContext,
    userHistory: UserHistory
  ): PredictionResult {
    const reasoningChain: string[] = [];
    const riskFactors: string[] = [];

    // Step 1: Analyze task characteristics
    const taskCharacteristics = this.analyzeTaskCharacteristics(taskContext);
    reasoningChain.push(`Task analysis: ${taskCharacteristics.description}`);

    // Step 2: Analyze user profile
    const userProfile = this.analyzeUserProfile(userHistory);
    reasoningChain.push(`User profile: ${userProfile.description}`);

    // Step 3: Calculate pattern probabilities
    const patternProbabilities = this.calculatePatternProbabilities(
      taskContext,
      userHistory,
      taskCharacteristics,
      userProfile
    );

    // Step 4: Select predicted pattern
    const predictions = Object.entries(patternProbabilities).sort(
      ([, probA], [, probB]) => probB - probA
    );
    const predictedPattern = predictions[0][0];
    const confidence = predictions[0][1];

    reasoningChain.push(
      `Primary pattern: ${predictedPattern} (confidence: ${(confidence * 100).toFixed(1)}%)`
    );

    // Step 5: Identify risk factors
    if (taskContext.urgency === 'critical' && userHistory.currentPattern === 'F') {
      riskFactors.push('Critical task with over-reliance pattern - high risk');
    }
    if (taskContext.complexity > 8 && userHistory.averageQueryRatio > 2.5) {
      riskFactors.push('Complex task with high AI dependency - consider verification');
    }
    if (userHistory.stressLevel > 7) {
      riskFactors.push('High stress level - may affect pattern adoption');
    }

    // Step 6: Generate recommendation
    const recommendedApproach = this.generateRecommendation(
      predictedPattern,
      taskContext,
      userHistory,
      riskFactors
    );

    return {
      predictedPattern,
      confidence,
      alternativePatterns: predictions.slice(1, 3).map(([pattern, prob]) => ({
        pattern,
        probability: prob
      })),
      reasoningChain,
      recommendedApproach,
      riskFactors
    };
  }

  /**
   * Analyze task characteristics
   */
  private static analyzeTaskCharacteristics(taskContext: TaskContext): {
    description: string;
    demandingScore: number;
  } {
    let description = '';
    let score = 0;

    // Analyze complexity
    if (taskContext.complexity > 7) {
      description += 'High complexity task. ';
      score += 0.3;
    } else if (taskContext.complexity > 4) {
      description += 'Moderate complexity task. ';
      score += 0.15;
    } else {
      description += 'Low complexity task. ';
    }

    // Analyze urgency
    if (taskContext.urgency === 'critical') {
      description += 'Critical deadline. ';
      score += 0.25;
    } else if (taskContext.urgency === 'high') {
      description += 'High priority. ';
      score += 0.15;
    }

    // Analyze familiarity
    if (taskContext.familiarityScore < 0.3) {
      description += 'Unfamiliar task type. ';
      score += 0.2;
    } else if (taskContext.familiarityScore > 0.8) {
      description += 'Familiar task type. ';
    }

    return { description, demandingScore: Math.min(score, 1) };
  }

  /**
   * Analyze user profile characteristics
   */
  private static analyzeUserProfile(userHistory: UserHistory): { description: string } {
    let description = '';

    // Verification behavior
    if (userHistory.averageVerificationRate > 0.8) {
      description += 'High verification user. ';
    } else if (userHistory.averageVerificationRate < 0.4) {
      description += 'Low verification user. ';
    } else {
      description += 'Moderate verification user. ';
    }

    // AI dependency
    if (userHistory.averageQueryRatio > 2.0) {
      description += 'High AI dependency. ';
    } else if (userHistory.averageQueryRatio < 1.0) {
      description += 'Low AI dependency. ';
    } else {
      description += 'Balanced AI usage. ';
    }

    // Pattern switching behavior
    if (userHistory.contextSwitchingFrequency > 0.5) {
      description += 'Frequently switches patterns based on context. ';
    }

    // Stress level
    if (userHistory.stressLevel > 7) {
      description += 'High stress level - may affect decision making. ';
    }

    return { description };
  }

  /**
   * Calculate probability for each pattern (A-F)
   */
  private static calculatePatternProbabilities(
    taskContext: TaskContext,
    userHistory: UserHistory,
    taskCharacteristics: { description: string; demandingScore: number },
    userProfile: { description: string }
  ): Record<string, number> {
    const baseProbabilities: Record<string, number> = {
      A: 0.15,
      B: 0.25,
      C: 0.15,
      D: 0.15,
      E: 0.15,
      F: 0.15
    };

    // Adjust based on task demands
    if (taskCharacteristics.demandingScore > 0.7) {
      // Complex/urgent tasks
      baseProbabilities.A += 0.1; // More strategic control
      baseProbabilities.D += 0.1; // More deep verification
      baseProbabilities.F += 0.05;
      baseProbabilities.E -= 0.1; // Less collaborative
    }

    // Adjust based on familiarity
    if (taskContext.familiarityScore > 0.8) {
      baseProbabilities.A += 0.1; // Strategic control for familiar tasks
      baseProbabilities.B -= 0.05;
    } else if (taskContext.familiarityScore < 0.3) {
      baseProbabilities.B += 0.1; // Iteration for unfamiliar tasks
      baseProbabilities.E += 0.05; // Learning approach
      baseProbabilities.F += 0.05; // Risk of over-reliance
    }

    // Adjust based on user history
    if (userHistory.averageVerificationRate > 0.8) {
      baseProbabilities.A += 0.1;
      baseProbabilities.D += 0.05;
      baseProbabilities.F -= 0.1;
    } else if (userHistory.averageVerificationRate < 0.4) {
      baseProbabilities.F += 0.1;
      baseProbabilities.A -= 0.05;
    }

    // Adjust based on current pattern (inertia)
    const currentPatternBonus = 0.15;
    if (userHistory.currentPattern in baseProbabilities) {
      baseProbabilities[userHistory.currentPattern] += currentPatternBonus;
    }

    // Adjust based on stress level
    if (userHistory.stressLevel > 7) {
      baseProbabilities.F += 0.1; // Higher stress → higher over-reliance risk
      baseProbabilities.A -= 0.05;
    }

    // Normalize to sum to 1
    const total = Object.values(baseProbabilities).reduce((a, b) => a + b, 0);
    const normalized: Record<string, number> = {};

    Object.entries(baseProbabilities).forEach(([pattern, prob]) => {
      normalized[pattern] = prob / total;
    });

    return normalized;
  }

  /**
   * Generate personalized recommendation based on prediction
   */
  private static generateRecommendation(
    predictedPattern: string,
    taskContext: TaskContext,
    userHistory: UserHistory,
    riskFactors: string[]
  ): string {
    const patterns: Record<string, string> = {
      A: 'Adopt Strategic Control: Verify outputs independently before accepting. Plan each step.',
      B: 'Use Iterative Refinement: Query AI multiple times, refining results between queries.',
      C: 'Apply Context Adaptation: Adjust your AI reliance based on task importance.',
      D: 'Practice Deep Verification: Understand why AI suggestions work, not just accept them.',
      E: 'Leverage Teaching Approach: Focus on learning principles, explain reasoning to yourself.',
      F: 'WARNING - Over-Reliance Risk: Increase verification, reduce AI dependency, focus on independence.'
    };

    let recommendation = patterns[predictedPattern] || 'Maintain current approach';

    // Add context-specific guidance
    if (taskContext.urgency === 'critical') {
      recommendation += ' Given the critical deadline, prioritize correctness over speed.';
    }

    if (riskFactors.length > 0) {
      recommendation += ` Risk Alert: ${riskFactors[0]}`;
    }

    return recommendation;
  }

  /**
   * Predict pattern for multiple upcoming tasks
   */
  static predictPatternsForMultipleTasks(
    tasks: TaskContext[],
    userHistory: UserHistory
  ): Record<string, PredictionResult> {
    const predictions: Record<string, PredictionResult> = {};

    tasks.forEach((task) => {
      predictions[task.taskId] = this.predictPatternForTask(task, userHistory);
    });

    return predictions;
  }

  /**
   * Analyze pattern adoption success
   */
  static analyzeAdoptionSuccess(
    predicted: string,
    actual: string,
    outcome: 'success' | 'failure',
    feedback?: string
  ): { accuracy: boolean; insight: string } {
    const accuracy = predicted === actual;

    let insight = '';
    if (accuracy && outcome === 'success') {
      insight = 'Prediction was accurate and outcome was positive. Pattern choice was effective.';
    } else if (accuracy && outcome === 'failure') {
      insight = 'Prediction was accurate but outcome was negative. This pattern may not suit this user well.';
    } else if (!accuracy && outcome === 'success') {
      insight = 'User adopted different pattern but still succeeded. Flexible approach is effective.';
    } else {
      insight = 'Prediction was inaccurate and outcome was negative. Need to refine prediction model.';
    }

    if (feedback) {
      insight += ` User feedback: ${feedback}`;
    }

    return { accuracy, insight };
  }
}

export default PredictivePatternAdvisor;
