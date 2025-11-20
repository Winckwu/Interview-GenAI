/**
 * Hybrid Pattern Estimator
 * Fuses Bayesian and SVM predictions with pattern stability tracking
 *
 * Purpose:
 * - Ensemble prediction: 60% Bayesian + 40% SVM (when available)
 * - Stability-aware confidence adjustment
 * - Graceful fallback to Bayesian-only if SVM unavailable
 *
 * Benefits:
 * - Bayesian: Fast, no dependencies, good with historical prior
 * - SVM: 77% accuracy, good for cold-start (first turns)
 * - Ensemble: Best of both worlds
 */

import RealtimePatternRecognizer, { PatternEstimate, Pattern } from './RealtimePatternRecognizer';
import SVMPatternClassifier from './SVMPatternClassifier';
import PatternStabilityCalculator, { PatternHistoryEntry, StabilityMetrics } from './PatternStabilityCalculator';
import { BehavioralSignals } from './BehaviorSignalDetector';

export interface HybridPatternEstimate extends PatternEstimate {
  // ✨ Enhanced with stability metrics
  stability: StabilityMetrics;

  // Individual predictions
  bayesianPrediction: PatternEstimate;
  svmPrediction: PatternEstimate | null;

  // Metadata
  method: 'bayesian' | 'svm' | 'ensemble';  // Which method was used
  turnCount: number;
}

export class HybridPatternEstimator {
  private bayesianRecognizer: RealtimePatternRecognizer;
  private stabilityCalculator = new PatternStabilityCalculator();
  private patternHistory: PatternHistoryEntry[] = [];
  private userId: string;
  private sessionId: string;
  private turnCount: number = 0;

  // Ensemble weights (can be tuned)
  private readonly BAYESIAN_WEIGHT = 0.6;  // Bayesian more stable with prior
  private readonly SVM_WEIGHT = 0.4;        // SVM good for cold-start

  constructor(userId: string, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.bayesianRecognizer = new RealtimePatternRecognizer(userId, sessionId);
  }

  /**
   * Initialize hybrid estimator
   * Loads historical prior for Bayesian
   */
  async initialize(): Promise<void> {
    await this.bayesianRecognizer.initialize();
    console.log(`[HybridPatternEstimator] Initialized for user ${this.userId}`);
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

    // 2. SVM prediction (optional - may fail if service unavailable)
    let svmEstimate: PatternEstimate | null = null;
    let useSVM = false;

    try {
      svmEstimate = await SVMPatternClassifier.predictPattern(signals);
      useSVM = true;
      console.log(`[HybridPatternEstimator] SVM prediction: ${svmEstimate.topPattern} (${(svmEstimate.probability * 100).toFixed(1)}%)`);
    } catch (error: any) {
      // Silently fall back to Bayesian-only
      console.log('[HybridPatternEstimator] SVM unavailable, using Bayesian only');
    }

    // 3. Fuse predictions
    let fusedEstimate: PatternEstimate;
    let method: 'bayesian' | 'svm' | 'ensemble';

    if (useSVM && svmEstimate) {
      // Ensemble: weighted average of Bayesian and SVM
      fusedEstimate = this.fusePredictions(bayesianEstimate, svmEstimate);
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
      confidence: adjustedConfidence,  // ✅ Stability-adjusted
      probabilities: fusedEstimate.probabilities,
      needMoreData: fusedEstimate.needMoreData,
      evidence: fusedEstimate.evidence,

      // ✨ NEW: Stability metrics
      stability,

      // Individual predictions
      bayesianPrediction: bayesianEstimate,
      svmPrediction: svmEstimate,

      // Metadata
      method,
      turnCount: this.turnCount
    };
  }

  /**
   * Fuse Bayesian and SVM predictions
   *
   * Algorithm:
   * 1. Weighted average: 60% Bayesian + 40% SVM
   * 2. Normalize probabilities
   * 3. Calculate new top pattern and confidence
   *
   * Rationale:
   * - Bayesian: Better with historical prior (warm start)
   * - SVM: Better for cold start (first turns)
   * - 60/40 blend: Balanced approach
   */
  private fusePredictions(
    bayesian: PatternEstimate,
    svm: PatternEstimate
  ): PatternEstimate {
    // Weighted average of probability distributions
    const fusedProbs = new Map<Pattern, number>();

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      const bayesianProb = bayesian.probabilities.get(pattern) || 0;
      const svmProb = svm.probabilities.get(pattern) || 0;

      const fusedProb =
        bayesianProb * this.BAYESIAN_WEIGHT +
        svmProb * this.SVM_WEIGHT;

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

    return {
      topPattern,
      probability: topProb,
      confidence,
      probabilities: fusedProbs,
      needMoreData: confidence < 0.3 && this.turnCount < 5,
      evidence: [
        ...bayesian.evidence,
        `SVM prediction: ${svm.topPattern} (${(svm.probability * 100).toFixed(0)}% confidence)`,
        `Ensemble: 60% Bayesian + 40% SVM`
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
