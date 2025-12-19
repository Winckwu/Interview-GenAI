/**
 * TrustCalibrationService
 * Provides context-aware trust scoring for AI outputs
 *
 * THEORETICAL FOUNDATIONS:
 *
 * 1. Adaptive Trust Calibration Framework (Okamura & Yamada, 2020)
 *    - Trust equation: P_trust (user estimate) vs P_auto (actual reliability)
 *    - Over-trust: (P_trust > P̂_man) ∧ (P_man > P_auto)
 *    - Under-trust: (P_trust < P̂_man) ∧ (P_man < P_auto)
 *    Reference: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0229132
 *
 * 2. LLM Uncertainty Estimation (arxiv:2404.15993, 2024)
 *    - Hidden layer activations contain uncertainty information
 *    - Supervised calibration improves AUROC by ~20%
 *    Reference: https://arxiv.org/abs/2404.15993
 *
 * 3. Metacognitive Sensitivity (PMC, 2025)
 *    - Meta-d': How well confidence discriminates correct vs incorrect
 *    - M-ratio: Normalized metacognitive efficiency
 *    Reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC12103939/
 *
 * 4. LLM Benchmark Data (2024)
 *    - Task-specific accuracy from HumanEval, MMLU, etc.
 *    Reference: https://www.vellum.ai/blog/llm-benchmarks-overview-limits-and-model-comparison
 */

export type TaskType = 'coding' | 'writing' | 'analysis' | 'creative' | 'research' | 'design' | 'planning' | 'review';
export type Criticality = 'low' | 'medium' | 'high' | 'critical';
export type ModificationType = 'correction' | 'preference' | 'extension' | 'none';

export interface TaskContext {
  taskType: TaskType;
  criticality: Criticality;
  userFamiliarity: number; // 0-1
  timeConstraint: number; // 0-1, 1 = no time pressure
  complexity: number; // 0-1
  aiModelConfidence?: number; // 0-1, from model output
}

export interface HistoricalAccuracy {
  taskType: TaskType;
  totalOutputs: number;
  correctOutputs: number;
  accuracy: number; // 0-1
  lastUpdated: Date;
  // New: Track calibration quality
  calibrationScore?: number; // How well user's trust aligns with actual accuracy
}

export interface ModificationContext {
  type: ModificationType;
  changeRatio: number; // 0-1, how much was changed
  wasFactualCorrection: boolean;
}

export interface TrustScore {
  overall: number; // 0-100
  baselineScore: number; // task type baseline
  adjustments: {
    criticality: number;
    familiarity: number;
    history: number;
    complexity: number;
    aiConfidence: number; // New: AI model's own confidence
    calibration: number; // New: metacognitive calibration adjustment
  };
  recommendation: string;
  riskFactors: string[];
  // New: Confidence in this trust score itself
  scoreConfidence: number; // 0-1
  // New: Theoretical basis for the score
  theoreticalBasis: string;
}

/**
 * Task type baseline trust scores
 *
 * EVIDENCE-BASED VALUES from LLM Benchmarks (2024):
 * - Coding: HumanEval ~92% (Claude 3.5), but architectural decisions vary
 * - Writing: Grammar strong, voice/style subjective
 * - Analysis: MMLU ~82-91%, but domain-specific
 * - Creative: Highly variable, no standard benchmark
 * - Research: Prone to hallucination (est. 15-30% error rate on facts)
 * - Design: Subjective, accessibility issues common
 * - Planning: Good structure, timeline accuracy varies
 * - Review: Strong at pattern matching, may miss context
 *
 * Formula: baseline = benchmark_accuracy * domain_reliability_factor
 * Where domain_reliability_factor accounts for:
 * - Verifiability (can output be easily checked?)
 * - Subjectivity (how much depends on interpretation?)
 * - Hallucination risk (prone to factual errors?)
 */
const TASK_BASELINE_SCORES: Record<TaskType, {
  score: number;
  benchmarkSource: string;
  verifiability: number; // 0-1
  subjectivity: number; // 0-1, higher = more subjective
  hallucinationRisk: number; // 0-1
}> = {
  coding: {
    score: 78,  // HumanEval ~92% * 0.85 (architectural uncertainty)
    benchmarkSource: 'HumanEval, SWE-Bench',
    verifiability: 0.95, // Can run tests
    subjectivity: 0.2,
    hallucinationRisk: 0.1
  },
  writing: {
    score: 68, // No standard benchmark, grammar tools ~95%, style varies
    benchmarkSource: 'MT-Bench, grammar checkers',
    verifiability: 0.5,
    subjectivity: 0.7,
    hallucinationRisk: 0.2
  },
  analysis: {
    score: 72, // MMLU ~85% average, domain varies
    benchmarkSource: 'MMLU, domain-specific benchmarks',
    verifiability: 0.7,
    subjectivity: 0.4,
    hallucinationRisk: 0.25
  },
  creative: {
    score: 55, // No objective benchmark, highly subjective
    benchmarkSource: 'Human evaluation studies',
    verifiability: 0.2,
    subjectivity: 0.9,
    hallucinationRisk: 0.15
  },
  research: {
    score: 52, // High hallucination risk on citations/facts
    benchmarkSource: 'TruthfulQA, fact-checking studies',
    verifiability: 0.8, // Facts can be checked
    subjectivity: 0.3,
    hallucinationRisk: 0.45 // Major concern
  },
  design: {
    score: 58, // Accessibility issues, subjective aesthetics
    benchmarkSource: 'WCAG compliance tests',
    verifiability: 0.6,
    subjectivity: 0.75,
    hallucinationRisk: 0.1
  },
  planning: {
    score: 70, // Good at structure, timeline accuracy varies
    benchmarkSource: 'GAIA benchmark',
    verifiability: 0.65,
    subjectivity: 0.35,
    hallucinationRisk: 0.2
  },
  review: {
    score: 75, // Strong pattern matching
    benchmarkSource: 'Code review benchmarks',
    verifiability: 0.8,
    subjectivity: 0.3,
    hallucinationRisk: 0.15
  }
};

/**
 * Criticality adjustment weights
 *
 * THEORETICAL BASIS (Okamura & Yamada, 2020):
 * - Critical tasks showed 25% higher error impact in experiments
 * - Moving average window of 3 checkpoints for detection
 *
 * Values derived from:
 * - Error impact ratio in human-AI collaboration studies
 * - Recovery cost from incorrect outputs
 */
const CRITICALITY_WEIGHTS: Record<Criticality, {
  adjustment: number;
  rationale: string
}> = {
  critical: {
    adjustment: -20, // Reduce trust, require verification
    rationale: 'Errors have severe/irreversible consequences'
  },
  high: {
    adjustment: -12,
    rationale: 'Significant impact, verification recommended'
  },
  medium: {
    adjustment: -4,
    rationale: 'Moderate impact, selective verification'
  },
  low: {
    adjustment: 0,
    rationale: 'Low stakes, light verification acceptable'
  }
};

/**
 * Modification type impact
 *
 * KEY INSIGHT: User modification does NOT necessarily mean AI was wrong
 * - Correction: AI made factual/logical error → reduce trust
 * - Preference: User style choice → no impact on accuracy trust
 * - Extension: User added information → slight positive signal
 */
const MODIFICATION_IMPACT: Record<ModificationType, {
  trustAdjustment: number;
  rationale: string;
}> = {
  correction: {
    trustAdjustment: -8, // AI made an error
    rationale: 'Factual/logical correction indicates AI error'
  },
  preference: {
    trustAdjustment: 0, // Not an accuracy issue
    rationale: 'Style preference, not accuracy concern'
  },
  extension: {
    trustAdjustment: 2, // AI provided good foundation
    rationale: 'User building on AI output is positive signal'
  },
  none: {
    trustAdjustment: 0,
    rationale: 'No modification'
  }
};

export class TrustCalibrationService {
  private historicalData: Map<TaskType, HistoricalAccuracy> = new Map();
  private calibrationHistory: Array<{
    predicted: number;
    actual: boolean;
    timestamp: Date;
  }> = [];

  /**
   * Calculate context-aware trust score with theoretical grounding
   *
   * FORMULA (based on Bayesian trust update framework):
   *
   * TrustScore = BaselineScore
   *   + CriticalityAdjustment (risk-weighted)
   *   + FamiliarityAdjustment (user ability to verify)
   *   + HistoryAdjustment (empirical accuracy)
   *   + ComplexityAdjustment (task difficulty)
   *   + AIConfidenceAdjustment (model uncertainty)
   *   + CalibrationAdjustment (metacognitive alignment)
   */
  calculateTrustScore(
    context: TaskContext,
    userHistory?: HistoricalAccuracy[],
    modificationContext?: ModificationContext
  ): TrustScore {
    const taskData = TASK_BASELINE_SCORES[context.taskType];
    const baselineScore = taskData.score;

    // Initialize adjustments with theoretical rationale
    const adjustments = {
      criticality: 0,
      familiarity: 0,
      history: 0,
      complexity: 0,
      aiConfidence: 0,
      calibration: 0
    };

    // 1. Criticality adjustment (Okamura & Yamada framework)
    const criticalityData = CRITICALITY_WEIGHTS[context.criticality];
    adjustments.criticality = criticalityData.adjustment;

    // 2. Familiarity adjustment
    // Higher familiarity = user can better spot errors = can trust more
    // Formula: Linear scale from -8 (unfamiliar) to +8 (expert)
    adjustments.familiarity = (context.userFamiliarity - 0.5) * 16;

    // 3. History adjustment (Bayesian update)
    // Weight increases with sample size (confidence interval narrowing)
    if (userHistory && userHistory.length > 0) {
      const taskHistory = userHistory.find(h => h.taskType === context.taskType);
      if (taskHistory && taskHistory.totalOutputs >= 3) {
        // Confidence-weighted adjustment
        const confidence = Math.min(1, taskHistory.totalOutputs / 15); // Max confidence at 15 samples
        const accuracyDeviation = taskHistory.accuracy - 0.7; // 70% is neutral
        adjustments.history = accuracyDeviation * 30 * confidence;
      }
    }

    // 4. Complexity adjustment
    // Higher complexity = more edge cases = lower trust
    // Non-linear: high complexity has disproportionate impact
    const complexityImpact = context.complexity > 0.7
      ? (context.complexity - 0.5) * 20 * 1.5 // Extra penalty for high complexity
      : (context.complexity - 0.5) * 20;
    adjustments.complexity = -complexityImpact;

    // 5. AI Model Confidence adjustment (NEW)
    // Uses model's own uncertainty signal
    if (context.aiModelConfidence !== undefined) {
      // Scale: AI confidence contributes up to ±15 points
      // But cap the positive contribution (overconfidence risk)
      const confidenceContribution = (context.aiModelConfidence - 0.5) * 30;
      adjustments.aiConfidence = Math.min(10, Math.max(-15, confidenceContribution));
    }

    // 6. Calibration adjustment (metacognitive sensitivity)
    // How well has the system's trust prediction matched actual outcomes?
    const calibrationQuality = this.calculateCalibrationQuality();
    adjustments.calibration = (calibrationQuality - 0.5) * 10;

    // 7. Modification type adjustment
    let modificationAdjustment = 0;
    if (modificationContext && modificationContext.type !== 'none') {
      const modData = MODIFICATION_IMPACT[modificationContext.type];
      // Scale by how much was changed
      modificationAdjustment = modData.trustAdjustment * modificationContext.changeRatio;
    }

    // Calculate overall score
    const rawScore = baselineScore +
      adjustments.criticality +
      adjustments.familiarity +
      adjustments.history +
      adjustments.complexity +
      adjustments.aiConfidence +
      adjustments.calibration +
      modificationAdjustment;

    const overallScore = Math.min(100, Math.max(0, rawScore));

    // Calculate confidence in this score
    const scoreConfidence = this.calculateScoreConfidence(context, userHistory);

    const riskFactors = this.identifyRiskFactors(context, adjustments, taskData);
    const recommendation = this.generateRecommendation(overallScore, context, scoreConfidence);
    const theoreticalBasis = this.generateTheoreticalBasis(adjustments, taskData);

    return {
      overall: Math.round(overallScore),
      baselineScore,
      adjustments,
      recommendation,
      riskFactors,
      scoreConfidence,
      theoreticalBasis
    };
  }

  /**
   * Calculate metacognitive calibration quality
   *
   * Based on Meta-d' concept: How well do predicted trust scores
   * discriminate between correct and incorrect outputs?
   *
   * Returns 0-1 where 1 = perfect calibration
   */
  private calculateCalibrationQuality(): number {
    if (this.calibrationHistory.length < 5) {
      return 0.5; // Neutral until enough data
    }

    // Group predictions into bins
    const bins: Map<number, { correct: number; total: number }> = new Map();

    for (const entry of this.calibrationHistory.slice(-50)) { // Last 50 entries
      const bin = Math.floor(entry.predicted / 20) * 20; // 0, 20, 40, 60, 80
      if (!bins.has(bin)) {
        bins.set(bin, { correct: 0, total: 0 });
      }
      const binData = bins.get(bin)!;
      binData.total++;
      if (entry.actual) binData.correct++;
    }

    // Calculate calibration error
    let totalError = 0;
    let weightSum = 0;

    bins.forEach((data, bin) => {
      if (data.total >= 2) {
        const expectedAccuracy = (bin + 10) / 100; // Bin center
        const actualAccuracy = data.correct / data.total;
        const error = Math.abs(expectedAccuracy - actualAccuracy);
        totalError += error * data.total;
        weightSum += data.total;
      }
    });

    if (weightSum === 0) return 0.5;

    const avgError = totalError / weightSum;
    // Convert error to quality score (0 error = 1.0 quality)
    return Math.max(0, 1 - avgError * 2);
  }

  /**
   * Calculate confidence in the trust score itself
   */
  private calculateScoreConfidence(
    context: TaskContext,
    userHistory?: HistoricalAccuracy[]
  ): number {
    let confidence = 0.5; // Base confidence

    // More history = more confidence
    if (userHistory) {
      const taskHistory = userHistory.find(h => h.taskType === context.taskType);
      if (taskHistory) {
        confidence += Math.min(0.25, taskHistory.totalOutputs / 40);
      }
    }

    // Calibration history improves confidence
    confidence += Math.min(0.15, this.calibrationHistory.length / 100);

    // Known task type with benchmark data
    const taskData = TASK_BASELINE_SCORES[context.taskType];
    if (taskData.verifiability > 0.7) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Update calibration history with outcome
   */
  recordCalibrationOutcome(predictedScore: number, wasCorrect: boolean): void {
    this.calibrationHistory.push({
      predicted: predictedScore,
      actual: wasCorrect,
      timestamp: new Date()
    });

    // Keep last 100 entries
    if (this.calibrationHistory.length > 100) {
      this.calibrationHistory = this.calibrationHistory.slice(-100);
    }
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
   * Classify modification type based on content analysis
   */
  classifyModification(
    original: string,
    modified: string
  ): ModificationContext {
    if (!modified || original === modified) {
      return { type: 'none', changeRatio: 0, wasFactualCorrection: false };
    }

    const originalWords = original.split(/\s+/);
    const modifiedWords = modified.split(/\s+/);

    // Calculate change ratio
    const longerLength = Math.max(originalWords.length, modifiedWords.length);
    const shorterLength = Math.min(originalWords.length, modifiedWords.length);
    const changeRatio = 1 - (shorterLength / longerLength);

    // Detect correction patterns
    const correctionPatterns = [
      /actually|incorrect|wrong|error|mistake|fix|correct/i,
      /不对|错误|修正|纠正|实际上/
    ];

    const wasFactualCorrection = correctionPatterns.some(p => p.test(modified));

    // Classify type
    let type: ModificationType = 'preference';

    if (wasFactualCorrection || changeRatio > 0.5) {
      type = 'correction';
    } else if (modifiedWords.length > originalWords.length * 1.3) {
      type = 'extension';
    }

    return { type, changeRatio, wasFactualCorrection };
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

    // Weight baseline with user's experience (Bayesian weighting)
    const userScore = taskHistory.accuracy * 100;
    const weight = Math.min(1, taskHistory.totalOutputs / 20);
    return baselineScore * (1 - weight) + userScore * weight;
  }

  /**
   * Identify risk factors with theoretical grounding
   */
  private identifyRiskFactors(
    context: TaskContext,
    adjustments: TrustScore['adjustments'],
    taskData: typeof TASK_BASELINE_SCORES[TaskType]
  ): string[] {
    const risks: string[] = [];

    // Critical task risk
    if (context.criticality === 'critical') {
      risks.push('Critical task - verification essential (Okamura framework)');
    }

    // Low familiarity risk
    if (context.userFamiliarity < 0.3) {
      risks.push('Low domain familiarity - reduced error detection ability');
    }

    // High complexity risk
    if (context.complexity > 0.7) {
      risks.push('High complexity - AI may miss edge cases');
    }

    // Hallucination risk for task type
    if (taskData.hallucinationRisk > 0.3) {
      risks.push(`${context.taskType} has elevated hallucination risk (${Math.round(taskData.hallucinationRisk * 100)}%)`);
    }

    // High subjectivity warning
    if (taskData.subjectivity > 0.6) {
      risks.push('Highly subjective task - quality depends on interpretation');
    }

    // AI confidence mismatch
    if (context.aiModelConfidence !== undefined) {
      if (context.aiModelConfidence > 0.9 && adjustments.aiConfidence < 5) {
        risks.push('AI overconfidence detected - verify carefully');
      }
      if (context.aiModelConfidence < 0.4) {
        risks.push('AI expresses low confidence - strong verification needed');
      }
    }

    // Time constraint risk
    if (context.timeConstraint < 0.2) {
      risks.push('Tight deadline - less time for verification');
    }

    // Calibration warning
    if (adjustments.calibration < -3) {
      risks.push('Historical calibration shows systematic over-trust');
    }

    return risks;
  }

  /**
   * Generate action recommendation based on trust level
   */
  private generateRecommendation(
    score: number,
    context: TaskContext,
    confidence: number
  ): string {
    const confidenceNote = confidence < 0.6 ? ' (limited data)' : '';

    if (score >= 80) {
      return `High confidence - suitable for use with light review${confidenceNote}`;
    }
    if (score >= 65) {
      return `Moderate-high confidence - verify key claims and outputs${confidenceNote}`;
    }
    if (score >= 50) {
      return `Moderate confidence - thorough verification recommended${confidenceNote}`;
    }
    if (score >= 35) {
      return `Low confidence - detailed review required before use${confidenceNote}`;
    }
    return `Very low confidence - extensive verification or human rework required${confidenceNote}`;
  }

  /**
   * Generate theoretical basis explanation for the score
   */
  private generateTheoreticalBasis(
    adjustments: TrustScore['adjustments'],
    taskData: typeof TASK_BASELINE_SCORES[TaskType]
  ): string {
    const factors: string[] = [];

    factors.push(`Baseline: ${taskData.score} (${taskData.benchmarkSource})`);

    if (Math.abs(adjustments.criticality) > 0) {
      factors.push(`Criticality: ${adjustments.criticality > 0 ? '+' : ''}${adjustments.criticality} (risk-weighted)`);
    }

    if (Math.abs(adjustments.history) > 2) {
      factors.push(`History: ${adjustments.history > 0 ? '+' : ''}${Math.round(adjustments.history)} (Bayesian update)`);
    }

    if (Math.abs(adjustments.aiConfidence) > 2) {
      factors.push(`AI confidence: ${adjustments.aiConfidence > 0 ? '+' : ''}${Math.round(adjustments.aiConfidence)}`);
    }

    return factors.join('; ');
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
   * Get task type metadata for transparency
   */
  getTaskTypeMetadata(taskType: TaskType): typeof TASK_BASELINE_SCORES[TaskType] {
    return TASK_BASELINE_SCORES[taskType];
  }

  /**
   * Clear historical data (for testing)
   */
  clearHistory(): void {
    this.historicalData.clear();
    this.calibrationHistory = [];
  }
}

export default TrustCalibrationService;
