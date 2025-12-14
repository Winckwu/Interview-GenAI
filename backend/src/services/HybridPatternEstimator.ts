/**
 * Hybrid Pattern Estimator
 * Fuses Bayesian and CatBoost predictions with pattern stability tracking
 *
 * Purpose:
 * - Dynamic ensemble prediction with turn-adaptive weights
 * - Stability-aware confidence adjustment
 * - Graceful fallback to Bayesian-only if CatBoost unavailable
 * - Integration with initial assessment questionnaire (NEW)
 *
 * Architecture (Updated 2024-12):
 * - Bayesian: Uses combined prior (assessment + history), hand-crafted likelihoods
 * - CatBoost: 93.0% accuracy, 97.9% Pattern F recall (trained on 378 real users)
 * - Dynamic weights: Early turns favor Bayesian, later turns favor CatBoost
 *
 * Weight Schedule (Default - no assessment):
 * - Turn 1-2: 70% Bayesian / 30% CatBoost (cold-start, limited signals)
 * - Turn 3-4: 50% Bayesian / 50% CatBoost (transition phase)
 * - Turn 5+:  30% Bayesian / 70% CatBoost (warm-start, trust CatBoost accuracy)
 *
 * Weight Schedule (With assessment questionnaire):
 * - Turn 1-2: 80% Bayesian / 20% CatBoost (informed prior from questionnaire)
 * - Turn 3-4: 55% Bayesian / 45% CatBoost (still favor informed Bayesian)
 * - Turn 5+:  35% Bayesian / 65% CatBoost (CatBoost with more weight, but Bayesian still contributes)
 */

import RealtimePatternRecognizer, { PatternEstimate, Pattern } from './RealtimePatternRecognizer';
import CatBoostPatternClassifier from './CatBoostPatternClassifier';
import PatternStabilityCalculator, { PatternHistoryEntry, StabilityMetrics } from './PatternStabilityCalculator';
import PatternHistoryService from './PatternHistoryService';
import { BehavioralSignals } from './BehaviorSignalDetector';

export interface HybridPatternEstimate extends PatternEstimate {
  // Enhanced with stability metrics
  stability: StabilityMetrics;

  // Individual predictions
  bayesianPrediction: PatternEstimate;
  catboostPrediction: PatternEstimate | null;

  // Metadata
  method: 'bayesian' | 'catboost' | 'ensemble';  // Which method was used
  turnCount: number;
}

export class HybridPatternEstimator {
  private bayesianRecognizer: RealtimePatternRecognizer;
  private stabilityCalculator = new PatternStabilityCalculator();
  private patternHistory: PatternHistoryEntry[] = [];
  private userId: string;
  private sessionId: string;
  private turnCount: number = 0;

  // NEW: Track prior source to adjust weights
  private priorSource: 'assessment' | 'history' | 'uniform' = 'uniform';
  private priorConfidence: number = 0;

  // Dynamic ensemble weights based on turn count
  // Rationale: CatBoost achieves 93.0% accuracy with real data, but needs sufficient signals
  // Early turns: Bayesian prior is more reliable (limited signal data)
  // Later turns: CatBoost is more accurate (sufficient data accumulated)

  // Default weights (no assessment data)
  private readonly DEFAULT_WEIGHT_SCHEDULE = {
    early: { bayesian: 0.70, catboost: 0.30 },  // Turn 1-2
    mid: { bayesian: 0.50, catboost: 0.50 },    // Turn 3-4
    late: { bayesian: 0.30, catboost: 0.70 }    // Turn 5+
  };

  // Enhanced weights when assessment questionnaire is available
  // Rationale: Assessment provides informed prior, so Bayesian is more trustworthy
  private readonly ASSESSMENT_WEIGHT_SCHEDULE = {
    early: { bayesian: 0.80, catboost: 0.20 },  // Turn 1-2: Strong trust in informed prior
    mid: { bayesian: 0.55, catboost: 0.45 },    // Turn 3-4: Still favor informed Bayesian
    late: { bayesian: 0.35, catboost: 0.65 }    // Turn 5+: CatBoost gains more weight, but Bayesian still contributes
  };

  constructor(userId: string, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.bayesianRecognizer = new RealtimePatternRecognizer(userId, sessionId);
  }

  /**
   * Initialize hybrid estimator
   * Loads combined prior (assessment + history) for Bayesian
   * Also determines which weight schedule to use based on prior availability
   */
  async initialize(): Promise<void> {
    await this.bayesianRecognizer.initialize();

    // Check prior source to determine weight schedule
    try {
      const combinedPrior = await PatternHistoryService.getCombinedPrior(this.userId);
      this.priorSource = combinedPrior.source;
      this.priorConfidence = combinedPrior.confidence;

      const weightSchedule = this.priorSource !== 'uniform'
        ? 'ASSESSMENT_WEIGHT_SCHEDULE'
        : 'DEFAULT_WEIGHT_SCHEDULE';

      console.log(`[HybridPatternEstimator] Initialized for user ${this.userId}:`, {
        priorSource: this.priorSource,
        priorConfidence: this.priorConfidence.toFixed(2),
        weightSchedule,
        assessmentId: combinedPrior.assessmentId || 'none'
      });
    } catch (error) {
      console.error('[HybridPatternEstimator] Error checking prior:', error);
      // Default to no-assessment weights
      this.priorSource = 'uniform';
      this.priorConfidence = 0;
    }
  }

  /**
   * Hybrid prediction: Bayesian + SVM + Stability
   *
   * @param signals - Behavioral signals from current turn
   * @returns Hybrid pattern estimate with stability metrics
   */
  async estimate(signals: BehavioralSignals): Promise<HybridPatternEstimate> {
    this.turnCount++;

    // 1. Bayesian prediction (always available)
    const bayesianEstimate = this.bayesianRecognizer.updateProbabilities(signals);

    // 2. CatBoost prediction (optional - may fail if service unavailable)
    let catboostEstimate: PatternEstimate | null = null;
    let useCatBoost = false;

    try {
      catboostEstimate = await CatBoostPatternClassifier.predictPattern(signals);
      useCatBoost = true;
      console.log(`[HybridPatternEstimator] CatBoost prediction: ${catboostEstimate.topPattern} (${(catboostEstimate.probability * 100).toFixed(1)}%)`);
    } catch (error: any) {
      // Silently fall back to Bayesian-only
      console.log('[HybridPatternEstimator] CatBoost unavailable, using Bayesian only');
    }

    // 3. Fuse predictions
    let fusedEstimate: PatternEstimate;
    let method: 'bayesian' | 'catboost' | 'ensemble';

    if (useCatBoost && catboostEstimate) {
      // Ensemble: weighted average of Bayesian and CatBoost
      fusedEstimate = this.fusePredictions(bayesianEstimate, catboostEstimate);
      method = 'ensemble';
    } else {
      // Fallback: Bayesian only
      fusedEstimate = bayesianEstimate;
      method = 'bayesian';
    }

    // 4. Update pattern history
    this.patternHistory.push({
      pattern: fusedEstimate.topPattern,
      confidence: fusedEstimate.confidence,
      timestamp: Date.now()
    });

    // Keep window size limited
    if (this.patternHistory.length > 10) {
      this.patternHistory.shift();
    }

    // 5. Calculate stability metrics
    const stability = this.stabilityCalculator.calculateStability(this.patternHistory);

    // 6. Adjust confidence based on stability
    // Unstable patterns → lower confidence
    let adjustedConfidence = fusedEstimate.confidence;
    if (!stability.isStable) {
      adjustedConfidence *= 0.8;  // Reduce by 20%
      console.log(`[HybridPatternEstimator] Pattern unstable (${stability.trendDirection}), reduced confidence by 20%`);
    }

    // 7. Record stability snapshot to database (non-blocking)
    this.stabilityCalculator.recordStabilitySnapshot(
      this.userId,
      this.sessionId,
      stability,
      this.turnCount
    ).catch((err: any) => {
      console.error('[HybridPatternEstimator] Failed to record stability:', err);
    });

    // 8. Return hybrid estimate with stability metrics
    return {
      topPattern: fusedEstimate.topPattern,
      probability: fusedEstimate.probability,
      confidence: adjustedConfidence,  // Stability-adjusted
      probabilities: fusedEstimate.probabilities,
      needMoreData: fusedEstimate.needMoreData,
      evidence: fusedEstimate.evidence,

      // Stability metrics
      stability,

      // Individual predictions
      bayesianPrediction: bayesianEstimate,
      catboostPrediction: catboostEstimate,

      // Metadata
      method,
      turnCount: this.turnCount
    };
  }

  /**
   * Get dynamic weights based on current turn count and prior availability
   *
   * Default (no assessment):
   * - Turn 1-2: 70% Bayesian / 30% CatBoost
   * - Turn 3-4: 50% Bayesian / 50% CatBoost
   * - Turn 5+:  30% Bayesian / 70% CatBoost
   *
   * With assessment/history:
   * - Turn 1-2: 80% Bayesian / 20% CatBoost (informed prior)
   * - Turn 3-4: 55% Bayesian / 45% CatBoost
   * - Turn 5+:  35% Bayesian / 65% CatBoost
   */
  private getCurrentWeights(): { bayesian: number; catboost: number } {
    // Select weight schedule based on whether we have informed prior
    const schedule = this.priorSource !== 'uniform'
      ? this.ASSESSMENT_WEIGHT_SCHEDULE
      : this.DEFAULT_WEIGHT_SCHEDULE;

    if (this.turnCount <= 2) {
      return schedule.early;
    } else if (this.turnCount <= 4) {
      return schedule.mid;
    } else {
      return schedule.late;
    }
  }

  /**
   * Fuse Bayesian and CatBoost predictions with dynamic weights
   *
   * Algorithm:
   * 1. Get turn-adaptive weights
   * 2. Weighted average of probability distributions
   * 3. Normalize probabilities
   * 4. Calculate new top pattern and confidence
   *
   * Weight Evolution:
   * - Early (turn 1-2): 70% Bayesian / 30% CatBoost
   * - Mid (turn 3-4): 50% Bayesian / 50% CatBoost
   * - Late (turn 5+): 30% Bayesian / 70% CatBoost
   */
  private fusePredictions(
    bayesian: PatternEstimate,
    catboost: PatternEstimate
  ): PatternEstimate {
    // Get dynamic weights based on turn count
    const weights = this.getCurrentWeights();

    // Weighted average of probability distributions
    const fusedProbs = new Map<Pattern, number>();

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      const bayesianProb = bayesian.probabilities.get(pattern) || 0;
      const catboostProb = catboost.probabilities.get(pattern) || 0;

      const fusedProb =
        bayesianProb * weights.bayesian +
        catboostProb * weights.catboost;

      fusedProbs.set(pattern, fusedProb);
    });

    // Normalize to sum to 1
    const total = Array.from(fusedProbs.values()).reduce((sum, p) => sum + p, 0);
    fusedProbs.forEach((prob, pattern) => {
      fusedProbs.set(pattern, prob / total);
    });

    // Find top pattern
    const sorted = Array.from(fusedProbs.entries())
      .sort((a, b) => b[1] - a[1]);

    const topPattern = sorted[0][0];
    const topProb = sorted[0][1];
    const secondProb = sorted[1][1];
    const confidence = topProb - secondProb;

    // Log weight usage for debugging
    console.log(`[HybridPatternEstimator] Turn ${this.turnCount}: Using weights ${Math.round(weights.bayesian * 100)}% Bayesian / ${Math.round(weights.catboost * 100)}% CatBoost`);

    return {
      topPattern,
      probability: topProb,
      confidence,
      probabilities: fusedProbs,
      needMoreData: confidence < 0.3 && this.turnCount < 5,
      evidence: [
        ...bayesian.evidence,
        `CatBoost prediction: ${catboost.topPattern} (${(catboost.probability * 100).toFixed(0)}% confidence)`,
        `Ensemble: ${Math.round(weights.bayesian * 100)}% Bayesian + ${Math.round(weights.catboost * 100)}% CatBoost (turn ${this.turnCount})`
      ]
    };
  }

  /**
   * Get current stability metrics
   */
  getStabilityMetrics(): StabilityMetrics {
    return this.stabilityCalculator.calculateStability(this.patternHistory);
  }

  /**
   * Get pattern history for analysis
   */
  getPatternHistory(): PatternHistoryEntry[] {
    return [...this.patternHistory];
  }

  /**
   * Get underlying Bayesian recognizer
   * Useful for accessing Bayesian-specific methods
   */
  getBayesianRecognizer(): RealtimePatternRecognizer {
    return this.bayesianRecognizer;
  }
}

export default HybridPatternEstimator;
