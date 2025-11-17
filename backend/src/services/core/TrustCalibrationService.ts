/**
 * TrustCalibrationService
 * Provides context-aware trust scoring for AI outputs
 * Evidence: 48/49 users (98%) mention context-dependent trust
 */

export type TaskType = 'coding' | 'writing' | 'analysis' | 'creative' | 'research' | 'design' | 'planning' | 'review';
export type Criticality = 'low' | 'medium' | 'high' | 'critical';

export interface TaskContext {
  taskType: TaskType;
  criticality: Criticality;
  userFamiliarity: number; // 0-1
  timeConstraint: number; // 0-1, 1 = no time pressure
  complexity: number; // 0-1
}

export interface HistoricalAccuracy {
  taskType: TaskType;
  totalOutputs: number;
  correctOutputs: number;
  accuracy: number; // 0-1
  lastUpdated: Date;
}

export interface TrustScore {
  overall: number; // 0-100
  baselineScore: number; // task type baseline
  adjustments: {
    criticality: number;
    familiarity: number;
    history: number;
    complexity: number;
  };
  recommendation: string;
  riskFactors: string[];
}

/**
 * Task type baseline trust scores
 * Based on typical AI accuracy for each domain
 */
const TASK_BASELINE_SCORES: Record<TaskType, number> = {
  coding: 75, // Strong in syntax, varies on architecture
  writing: 65, // Good at grammar, varies on voice/style
  analysis: 70, // Decent at pattern recognition
  creative: 60, // Varies greatly by creativity level
  research: 55, // Can hallucinate sources
  design: 50, // Very subjective
  planning: 65, // Good at structure
  review: 70 // Good at finding issues
};

export class TrustCalibrationService {
  private historicalData: Map<TaskType, HistoricalAccuracy> = new Map();

  /**
   * Calculate context-aware trust score
   */
  calculateTrustScore(
    context: TaskContext,
    userHistory?: HistoricalAccuracy[]
  ): TrustScore {
    const baselineScore = TASK_BASELINE_SCORES[context.taskType];

    // Initialize adjustments
    const adjustments = {
      criticality: 0,
      familiarity: 0,
      history: 0,
      complexity: 0
    };

    // Criticality adjustment
    switch (context.criticality) {
      case 'critical':
        adjustments.criticality = -25; // Reduce trust for critical tasks
        break;
      case 'high':
        adjustments.criticality = -15;
        break;
      case 'medium':
        adjustments.criticality = -5;
        break;
      case 'low':
        adjustments.criticality = 0;
        break;
    }

    // Familiarity adjustment
    // Lower familiarity = lower trust in AI output (need verification)
    adjustments.familiarity = context.userFamiliarity * 20 - 10;

    // History adjustment based on past accuracy
    if (userHistory && userHistory.length > 0) {
      const taskHistory = userHistory.find(h => h.taskType === context.taskType);
      if (taskHistory) {
        adjustments.history = (taskHistory.accuracy - 0.5) * 20;
      }
    }

    // Complexity adjustment
    // Higher complexity reduces trust
    adjustments.complexity = (0.5 - context.complexity) * 20;

    // Calculate overall score
    const overallScore = Math.min(
      100,
      Math.max(
        0,
        baselineScore +
          adjustments.criticality +
          adjustments.familiarity +
          adjustments.history +
          adjustments.complexity
      )
    );

    const riskFactors = this.identifyRiskFactors(context, adjustments);
    const recommendation = this.generateRecommendation(overallScore, context);

    return {
      overall: Math.round(overallScore),
      baselineScore,
      adjustments,
      recommendation,
      riskFactors
    };
  }

  /**
   * Update historical accuracy based on verification
   */
  updateAccuracyHistory(
    taskType: TaskType,
    wasCorrect: boolean,
    _totalSoFar: number = 1
  ): HistoricalAccuracy {
    const existing = this.historicalData.get(taskType);

    const updated: HistoricalAccuracy = {
      taskType,
      totalOutputs: (existing?.totalOutputs ?? 0) + 1,
      correctOutputs: (existing?.correctOutputs ?? 0) + (wasCorrect ? 1 : 0),
      lastUpdated: new Date(),
      accuracy: 0
    };

    // Calculate accuracy
    updated.accuracy = updated.totalOutputs > 0
      ? updated.correctOutputs / updated.totalOutputs
      : 0;

    this.historicalData.set(taskType, updated);
    return updated;
  }

  /**
   * Get current accuracy history for a task type
   */
  getAccuracyHistory(taskType: TaskType): HistoricalAccuracy | null {
    return this.historicalData.get(taskType) ?? null;
  }

  /**
   * Get all historical data
   */
  getAllHistory(): HistoricalAccuracy[] {
    return Array.from(this.historicalData.values());
  }

  /**
   * Personalize baseline score based on user's historical accuracy
   */
  personalizeBaseline(
    taskType: TaskType,
    baselineScore: number,
    userHistory: HistoricalAccuracy[]
  ): number {
    const taskHistory = userHistory.find(h => h.taskType === taskType);

    if (!taskHistory || taskHistory.totalOutputs < 5) {
      // Not enough data, use baseline
      return baselineScore;
    }

    // Weight baseline with user's experience
    const userScore = taskHistory.accuracy * 100;
    const weight = Math.min(1, taskHistory.totalOutputs / 20); // Max weight at 20 outputs
    return baselineScore * (1 - weight) + userScore * weight;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(context: TaskContext, _adjustments: any): string[] {
    const risks: string[] = [];

    // Critical task risk
    if (context.criticality === 'critical') {
      risks.push('Critical task - verification essential');
    }

    // Low familiarity risk
    if (context.userFamiliarity < 0.3) {
      risks.push('Low familiarity - high risk of misusing output');
    }

    // High complexity risk
    if (context.complexity > 0.7) {
      risks.push('High complexity - AI may miss edge cases');
    }

    // High criticality + low familiarity
    if (context.criticality === 'critical' && context.userFamiliarity < 0.5) {
      risks.push('Critical + unfamiliar - extreme caution needed');
    }

    // Time constraint risk
    if (context.timeConstraint < 0.2) {
      risks.push('Tight deadline - less time for verification');
    }

    return risks;
  }

  /**
   * Generate action recommendation
   */
  private generateRecommendation(score: number, _context: TaskContext): string {
    if (score >= 80) {
      return 'High confidence - suitable for use with light review';
    }
    if (score >= 60) {
      return 'Moderate confidence - verify critical sections';
    }
    if (score >= 40) {
      return 'Low confidence - thorough verification recommended';
    }
    return 'Very low confidence - extensive verification or human rework required';
  }

  /**
   * Compare trust scores for the same task across multiple strategies
   */
  compareStrategies(
    contexts: TaskContext[],
    userHistory?: HistoricalAccuracy[]
  ): Array<{ context: TaskContext; score: TrustScore }> {
    return contexts.map(context => ({
      context,
      score: this.calculateTrustScore(context, userHistory)
    }));
  }

  /**
   * Clear historical data (for testing)
   */
  clearHistory(): void {
    this.historicalData.clear();
  }
}

export default TrustCalibrationService;
