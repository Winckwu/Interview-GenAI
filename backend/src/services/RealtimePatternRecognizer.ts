/**
 * Realtime Pattern Recognizer
 * Uses Bayesian updating to dynamically recognize user patterns in real-time
 * Based on behavioral signals from each conversation turn
 */

import { BehavioralSignals } from './BehaviorSignalDetector';

export type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface PatternEstimate {
  topPattern: Pattern;
  probability: number;      // P(topPattern | observed signals)
  confidence: number;       // Margin between top 2 patterns
  probabilities: Map<Pattern, number>;
  needMoreData: boolean;
  evidence: string[];
}

/**
 * Pattern-Signal Likelihood Mapping
 * How likely is each signal given each pattern?
 * P(Signal | Pattern)
 */
const SIGNAL_LIKELIHOODS: Record<Pattern, Record<string, number>> = {
  'A': {
    // Strategic Decomposition & Control
    taskDecomposition_high: 2.5,       // Pattern A users decompose heavily
    goalClarity_high: 2.0,
    verification_high: 2.5,
    reflection_high: 1.8,
    aiReliance_low: 2.2,
    contextAwareness_high: 2.0,
  },
  'B': {
    // Iterative Refinement
    iteration_high: 2.5,
    verification_medium: 2.0,
    goalClarity_low: 1.2,              // Often starts vague
    taskDecomposition_medium: 1.5,
    reflection_medium: 1.8,
    trustCalibration: 2.0,
  },
  'C': {
    // Context-Sensitive Adaptation
    contextAwareness_high: 2.8,
    taskComplexity_varies: 2.0,
    strategyMentioned: 2.0,
    aiReliance_medium: 1.8,
    reflection_medium: 1.5,
  },
  'D': {
    // Deep Verification & Critical
    verification_high: 3.0,             // Highest verification
    reflection_high: 2.5,
    capabilityAwareness: 2.8,
    qualityCheck_high: 2.5,
    outputEvaluation_high: 2.5,
  },
  'E': {
    // Pedagogical Reflection
    reflection_high: 3.0,               // Highest reflection
    capabilityAwareness: 2.0,
    qualityCheck_high: 2.0,
    preparation_high: 2.2,
    contextAwareness_medium: 1.8,
  },
  'F': {
    // Ineffective & Passive (HIGH RISK)
    verification_none: 0.05,            // Almost no verification
    taskDecomposition_none: 0.1,
    iteration_none: 0.1,
    reflection_none: 0.1,
    aiReliance_extreme: 3.0,            // Maximum reliance
    qualityCheck_none: 0.05,
    capabilityAwareness_none: 0.1,
  }
};

export class RealtimePatternRecognizer {
  /**
   * Initialize with uniform prior distribution
   * Each pattern equally likely initially
   */
  private patternProbabilities: Map<Pattern, number> = new Map([
    ['A', 0.20],
    ['B', 0.20],
    ['C', 0.20],
    ['D', 0.20],
    ['E', 0.20],
    // F starts very low (0% prior, only updates based on evidence)
  ]);

  private turnCount: number = 0;
  private signalHistory: BehavioralSignals[] = [];
  private evidenceLog: string[] = [];

  /**
   * Update pattern probabilities based on observed behavioral signals
   * Uses Bayesian updating: P(Pattern|Signal) ∝ P(Signal|Pattern) × P(Pattern)
   */
  updateProbabilities(signals: BehavioralSignals): PatternEstimate {
    this.turnCount++;
    this.signalHistory.push(signals);

    // Step 1: Calculate likelihood for each pattern
    const likelihoods = new Map<Pattern, number>();

    for (const pattern of ['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]) {
      let likelihood = 1.0;
      const evidence: string[] = [];

      // Check task decomposition
      if (signals.taskDecompositionEvidence === 3) {
        likelihood *= SIGNAL_LIKELIHOODS[pattern]['taskDecomposition_high'] ?? 1.0;
        evidence.push('Strong task decomposition');
      } else if (signals.taskDecompositionEvidence === 0 && pattern === 'F') {
        likelihood *= 3.0;
        evidence.push('No task decomposition (Pattern F risk)');
      }

      // Check verification behavior
      if (signals.verificationAttempted) {
        likelihood *= SIGNAL_LIKELIHOODS[pattern]['verification_high'] ?? 1.0;
        evidence.push('User attempted verification');
      } else if (!signals.verificationAttempted && pattern === 'F') {
        likelihood *= 3.5;
        evidence.push('No verification attempt (critical F indicator)');
      }

      // Check AI reliance degree
      if (signals.aiRelianceDegree >= 2) {
        likelihood *= SIGNAL_LIKELIHOODS[pattern]['aiReliance_extreme'] ?? 1.0;
        if (pattern === 'F') evidence.push('High AI reliance');
      }

      // Check reflection depth
      if (signals.reflectionDepth >= 2) {
        likelihood *= SIGNAL_LIKELIHOODS[pattern]['reflection_high'] ?? 1.0;
        evidence.push('Deep reflection');
      }

      // Check goal clarity
      if (signals.goalClarityScore === 3) {
        likelihood *= SIGNAL_LIKELIHOODS[pattern]['goalClarity_high'] ?? 1.0;
      }

      // Check context awareness
      if (signals.contextAwarenessIndicator >= 2) {
        likelihood *= SIGNAL_LIKELIHOODS[pattern]['contextAwareness_high'] ?? 1.0;
        evidence.push('High context awareness');
      }

      // Check iteration count
      if (signals.iterationCount >= 2) {
        likelihood *= SIGNAL_LIKELIHOODS[pattern]['iteration_high'] ?? 1.0;
        evidence.push(`Iterations: ${signals.iterationCount}`);
      }

      likelihoods.set(pattern, likelihood);
    }

    // Step 2: Bayesian update
    const patterns: Pattern[] = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (const pattern of patterns) {
      const prior = this.patternProbabilities.get(pattern) || 0.0001;
      const likelihood = likelihoods.get(pattern) || 1.0;
      const posterior = prior * likelihood;
      this.patternProbabilities.set(pattern, posterior);
    }

    // Step 3: Normalize to probabilities
    const total = Array.from(this.patternProbabilities.values())
      .reduce((sum, p) => sum + p, 0);

    this.patternProbabilities.forEach((prob, pattern) => {
      const normalized = total > 0 ? prob / total : 1 / 6;
      this.patternProbabilities.set(pattern, normalized);
    });

    // Step 4: Calculate confidence (margin between top 2)
    const sorted = Array.from(this.patternProbabilities.entries())
      .sort((a, b) => b[1] - a[1]);

    const topPattern = sorted[0][0];
    const topProbability = sorted[0][1];
    const secondProbability = sorted[1][1];
    const confidence = topProbability - secondProbability;

    // Record evidence
    this.evidenceLog.push(
      `Turn ${this.turnCount}: Top=${topPattern} (${(topProbability * 100).toFixed(1)}%), ` +
      `Confidence=${(confidence * 100).toFixed(1)}%, Evidence: ${evidence.join(' | ')}`
    );

    return {
      topPattern,
      probability: topProbability,
      confidence,
      probabilities: new Map(this.patternProbabilities),
      needMoreData: confidence < 0.3 && this.turnCount < 10,
      evidence: evidence,
    };
  }

  /**
   * Get current pattern estimate
   */
  getCurrentEstimate(): PatternEstimate {
    const sorted = Array.from(this.patternProbabilities.entries())
      .sort((a, b) => b[1] - a[1]);

    const topPattern = sorted[0][0];
    const topProbability = sorted[0][1];
    const secondProbability = sorted[1][1];
    const confidence = topProbability - secondProbability;

    return {
      topPattern,
      probability: topProbability,
      confidence,
      probabilities: new Map(this.patternProbabilities),
      needMoreData: confidence < 0.3 && this.turnCount < 10,
      evidence: this.evidenceLog.slice(-3), // Last 3 updates
    };
  }

  /**
   * Check if user shows high risk of Pattern F
   * Used for critical interventions
   */
  isHighRiskF(signals: BehavioralSignals): boolean {
    const fProbability = this.patternProbabilities.get('F') || 0;

    return (
      fProbability > 0.5 &&                              // High F probability
      signals.verificationAttempted === false &&         // No verification
      signals.iterationCount < 2 &&                      // No iterations
      signals.taskDecompositionEvidence === 0 &&         // No decomposition
      signals.aiRelianceDegree >= 2                      // High AI reliance
    );
  }

  /**
   * Reset recognizer for new session
   */
  reset() {
    this.patternProbabilities = new Map([
      ['A', 0.20],
      ['B', 0.20],
      ['C', 0.20],
      ['D', 0.20],
      ['E', 0.20],
    ]);
    this.turnCount = 0;
    this.signalHistory = [];
    this.evidenceLog = [];
  }

  /**
   * Get detailed analysis log
   */
  getAnalysisLog(): string[] {
    return this.evidenceLog;
  }

  /**
   * Get current probability distribution
   */
  getProbabilities(): Record<Pattern, number> {
    const result: Record<Pattern, number> = {
      A: this.patternProbabilities.get('A') || 0,
      B: this.patternProbabilities.get('B') || 0,
      C: this.patternProbabilities.get('C') || 0,
      D: this.patternProbabilities.get('D') || 0,
      E: this.patternProbabilities.get('E') || 0,
      F: this.patternProbabilities.get('F') || 0,
    };
    return result;
  }
}

export default new RealtimePatternRecognizer();
