/**
 * PatternRecognitionEngine
 *
 * Based on 03-Pattern-Framework-Supplement.md
 * Detects 6 metacognitive usage patterns (A-F) from 12-dimensional ML features
 *
 * 12 Sub-processes:
 * Planning (P1-P4): Decomposition, Goal Setting, Strategy Selection, Role Definition
 * Monitoring (M1-M3): Progress Tracking, Quality Checking, Trust Calibration
 * Evaluation (E1-E3): Output Assessment, Risk Assessment, Capability Judgment
 * Regulation (R1-R2): Strategy Adjustment, Tool Switching
 */

export interface MLFeatures {
  // Planning (P1-P4)
  taskDecompositionScore: number;      // P1: 0-3
  promptSpecificity: number;           // P2: 0-10 (prompt quality/specificity)
  strategyDiversity: number;           // P3: 0-5 (number of strategies used)
  independentAttemptRate: number;      // P4: 0-1 (proportion before using AI)

  // Monitoring (M1-M3)
  sessionDurationPattern: number;      // M1: 0-1 (time management quality)
  verificationRate: number;            // M2: 0-1 (# verification / # total interactions)
  trustCalibrationAccuracy: number;    // M3: 0-1 (1 - |actual - optimal|)

  // Evaluation (E1-E3)
  modificationRate: number;            // E1: 0-1 (# modifications / # interactions)
  confidenceScore: number;             // E2: 0-1 (risk × verification)
  errorAwareness: number;              // E3: 0-1 (ability to find AI errors)

  // Regulation (R1-R2)
  iterationFrequency: number;          // R1: 0-1 (# iterations / session duration)
  crossModelUsage: number;             // R2: 0-5 (number of different models used)
}

export interface PatternDetectionResult {
  pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence: number;                  // 0-1
  rationale: {
    high_scores: string[];             // Which sub-processes scored high
    total_score: number;               // Sum of all 12 sub-process scores
    subprocess_scores?: Record<string, number>;
  };
  alert?: 'high_risk' | 'warning';    // For Pattern F
}

export class PatternRecognitionEngine {
  /**
   * Normalize features to 0-3 scale (matching subprocess evidence strength)
   */
  private normalizeFeatures(features: MLFeatures): Record<string, number> {
    return {
      // Planning (P1-P4)
      'P1': Math.min(features.taskDecompositionScore, 3),
      'P2': (features.promptSpecificity / 10) * 3,  // Scale 0-10 → 0-3
      'P3': (features.strategyDiversity / 5) * 3,   // Scale 0-5 → 0-3
      'P4': features.independentAttemptRate * 3,    // Scale 0-1 → 0-3

      // Monitoring (M1-M3)
      'M1': features.sessionDurationPattern * 3,    // Scale 0-1 → 0-3
      'M2': features.verificationRate * 3,          // Scale 0-1 → 0-3
      'M3': features.trustCalibrationAccuracy * 3,  // Scale 0-1 → 0-3

      // Evaluation (E1-E3)
      'E1': features.modificationRate * 3,          // Scale 0-1 → 0-3
      'E2': features.confidenceScore * 3,           // Scale 0-1 → 0-3
      'E3': features.errorAwareness * 3,            // Scale 0-1 → 0-3

      // Regulation (R1-R2)
      'R1': (features.iterationFrequency) * 3,      // Scale 0-1 → 0-3
      'R2': (features.crossModelUsage / 5) * 3,     // Scale 0-5 → 0-3
    }
  }

  /**
   * Calculate pattern-specific scores based on subprocess strengths
   */
  private calculatePatternScores(
    normalized: Record<string, number>
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    // Pattern A: High(P1, P2, P4) + High(M2) + High(E3)
    // Strategic decomposition and control
    scores['A'] =
      (normalized['P1'] +
        normalized['P2'] +
        normalized['P4'] +
        normalized['M2'] +
        normalized['E3']) /
      5;

    // Pattern B: High(R1, R2) + Dynamic(M3) + Tolerance(Failure)
    // Iterative optimization and calibration
    scores['B'] =
      (normalized['R1'] +
        normalized['R2'] +
        normalized['M3'] +
        normalized['E2']) /
      4;

    // Pattern C: Dynamic(ALL) + Context-Aware
    // Context-sensitive adaptation (balanced across all)
    scores['C'] =
      (normalized['P1'] +
        normalized['P3'] +
        normalized['M3'] +
        normalized['E1'] +
        normalized['E2'] +
        normalized['R1']) /
      6;

    // Pattern D: Extreme(Verification) + Low(Trust)
    // Deep verification and critical inquiry
    scores['D'] =
      (normalized['M2'] +
        normalized['E1'] +
        normalized['E2'] +
        normalized['R2']) /
      4;

    // Pattern E: Learning-Oriented + High(Reflection)
    // Teaching-based reflection and self-monitoring
    scores['E'] =
      (normalized['E1'] +
        normalized['E3'] +
        normalized['P2'] +
        normalized['M1'] +
        normalized['R1']) /
      5;

    // Pattern F: Absence(Metacognition)
    // Passive and ineffective use
    // Pattern F is detected as "no pattern" → low total score
    const totalScore = Object.values(normalized).reduce((a, b) => a + b, 0);
    scores['F'] = totalScore < 15 ? 1 : 0; // High F score when total is very low

    return scores;
  }

  /**
   * Identify high-scoring sub-processes for explainability
   */
  private identifyHighScores(
    normalized: Record<string, number>,
    threshold: number = 1.8
  ): string[] {
    return Object.entries(normalized)
      .filter(([_, score]) => score >= threshold)
      .map(([key, _]) => key)
      .sort();
  }

  /**
   * Main detection method: Classify pattern and return confidence + reasoning
   */
  public detect(features: MLFeatures): PatternDetectionResult {
    const normalized = this.normalizeFeatures(features);
    const patternScores = this.calculatePatternScores(normalized);
    const totalScore = Object.values(normalized).reduce((a, b) => a + b, 0);
    const highScores = this.identifyHighScores(normalized);

    // Find dominant pattern
    let dominantPattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'C'; // Default
    let maxScore = -1;

    for (const [pattern, score] of Object.entries(patternScores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantPattern = pattern as 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      }
    }

    // Adjust for Pattern F detection
    // If total score is extremely low, force Pattern F classification
    if (totalScore < 15) {
      dominantPattern = 'F';
      maxScore = 1; // High confidence in F detection
    }

    // Calculate confidence
    // Based on pattern score strength and distinctiveness
    const confidence = this.calculateConfidence(
      dominantPattern,
      patternScores,
      totalScore
    );

    // Build result
    const result: PatternDetectionResult = {
      pattern: dominantPattern,
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
      rationale: {
        high_scores: highScores,
        total_score: Math.round(totalScore * 100) / 100,
        subprocess_scores: normalized,
      },
    };

    // Add alert for Pattern F
    if (dominantPattern === 'F') {
      result.alert = 'high_risk';
    }

    return result;
  }

  /**
   * Calculate confidence based on pattern strength and distinctiveness
   */
  private calculateConfidence(
    pattern: string,
    patternScores: Record<string, number>,
    totalScore: number
  ): number {
    const patternScore = patternScores[pattern];

    // Base confidence from pattern score
    let confidence = patternScore / 3; // Max 1.0 when pattern score = 3.0

    // Bonus for distinct patterns (much higher than others)
    const otherScores = Object.entries(patternScores)
      .filter(([p, _]) => p !== pattern)
      .map(([_, score]) => score);
    const avgOtherScore =
      otherScores.reduce((a, b) => a + b, 0) / otherScores.length;
    const distinctiveness = patternScore - avgOtherScore;

    // For Pattern F, higher confidence if very low total score
    if (pattern === 'F') {
      // F detection confidence: 0.90 at totalScore=10, 0.95 at totalScore=5, 0.98 at totalScore=0
      // Formula: 0.90 + (15 - totalScore) / 150
      confidence = Math.min(1.0, 0.90 + Math.max(0, 15 - totalScore) / 150);
    } else {
      // For other patterns, boost confidence if distinctive
      confidence = Math.min(
        1.0,
        confidence + Math.max(0, distinctiveness / 10)
      );
    }

    return confidence;
  }

  /**
   * Get pattern interpretation (human-readable description)
   */
  public interpretPattern(pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'): string {
    const interpretations: Record<string, string> = {
      A: 'Strategic Decomposition & Control - Careful planning with clear boundaries',
      B: 'Iterative Optimization & Calibration - Experimental with adaptive trust',
      C: 'Context-Sensitive Adaptation - Flexible approach across varying contexts',
      D: 'Deep Verification & Critical Inquiry - Systematic verification of all outputs',
      E: 'Teaching-Based Reflection - Learning-focused with high self-monitoring',
      F: '⚠️ Passive & Ineffective Use - Minimal metacognition, high risk of over-reliance',
    };

    return interpretations[pattern] || 'Unknown Pattern';
  }

  /**
   * Identify subprocess categories for the detected pattern
   */
  public getPatternComponentsFor(
    pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  ): { pattern: string[]; description: string } {
    const components: Record<string, string[]> = {
      A: ['P1', 'P2', 'P4', 'M2', 'E3'],
      B: ['R1', 'R2', 'M3', 'E2'],
      C: ['P1', 'P3', 'M3', 'E1', 'E2', 'R1'],
      D: ['M2', 'E1', 'E2', 'R2'],
      E: ['E1', 'E3', 'P2', 'M1', 'R1'],
      F: [],
    };

    return {
      pattern: components[pattern],
      description: this.interpretPattern(pattern),
    };
  }

  /**
   * Batch detect patterns for multiple feature sets
   * Useful for bulk analysis
   */
  public detectBatch(
    featureSets: MLFeatures[]
  ): PatternDetectionResult[] {
    return featureSets.map(features => this.detect(features));
  }

  /**
   * Calculate Pattern F detection sensitivity
   * Returns sensitivity metrics for Pattern F detection
   */
  public getPatternFSensitivityMetrics(): {
    threshold_total_score: number;
    min_confidence_for_f: number;
    key_indicators: string[];
  } {
    return {
      threshold_total_score: 15, // Total of all 12 sub-processes
      min_confidence_for_f: 0.85, // Minimum confidence for F detection
      key_indicators: [
        'verificationRate < 0.10',
        'iterationFrequency < 0.15',
        'errorAwareness < 0.20',
        'promptSpecificity < 2.0',
        'modificationRate < 0.15',
      ],
    };
  }
}

export const patternRecognitionEngine = new PatternRecognitionEngine();
