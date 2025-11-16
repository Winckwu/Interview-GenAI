/**
 * Pattern Recognition Engine
 *
 * Based on 03-Pattern-Framework-Supplement.md
 * Implements 12-subprocess metacognitive framework for pattern detection
 *
 * Theory: Flavell (1979), Schraw (1994), Azevedo & Hadwin (2005)
 */

// ============================================================
// Type Definitions
// ============================================================

/**
 * 12-dimensional ML feature vector
 * Mapped from session interactions
 */
export interface MetacognitiveFeatures {
  // Planning features
  taskDecompositionScore: number;      // P1: 0-3 (direct)
  promptSpecificity: number;           // P2: 0-10 (indirect, measures goal clarity)
  strategyDiversity: number;           // P3: 0-3 (direct)
  independentAttemptRate: number;      // P4: 0-1 (indirect)

  // Monitoring features
  sessionDurationPattern: number;      // M1: 0-1 (indirect)
  verificationRate: number;            // M2: 0-1 (direct, core!)
  trustCalibrationAccuracy: number;    // M3: 0-1 (direct)

  // Evaluation features
  modificationRate: number;            // E1: 0-1 (indirect)
  confidenceScore: number;             // E2: 0-1 (composite)
  errorAwareness: number;              // E3: 0-1 (direct)

  // Regulation features
  iterationFrequency: number;          // R1: 0-1 (direct, core!)
  crossModelUsage: number;             // R2: 0-3 (direct)
}

/**
 * 12 subprocess scores (0-3 scale)
 * Used for pattern matching
 */
export interface SubprocessScores {
  P1: number; // Task Decomposition
  P2: number; // Goal Setting
  P3: number; // Strategy Selection
  P4: number; // Role Definition
  M1: number; // Progress Tracking
  M2: number; // Quality Checking
  M3: number; // Trust Calibration
  E1: number; // Output Quality Assessment
  E2: number; // Risk Assessment
  E3: number; // Capability Judgment
  R1: number; // Strategy Adjustment
  R2: number; // Tool Switching
}

export type PatternType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface PatternDetectionResult {
  pattern: PatternType;
  confidence: number; // 0-1
  rationale: {
    high_scores: string[];      // Which subprocesses scored high
    total_score: number;        // Sum of 12 subprocess scores
    key_indicators?: string[];  // Pattern-specific indicators
  };
  alert?: 'warning' | 'high_risk'; // For Pattern F
  alternative_patterns?: PatternType[]; // Mixed patterns
}

// ============================================================
// Pattern Recognition Engine
// ============================================================

export class PatternRecognitionEngine {

  /**
   * Main detection method
   * @param features 12-dimensional ML feature vector
   * @returns Pattern classification with confidence and rationale
   */
  detect(features: MetacognitiveFeatures): PatternDetectionResult {
    // Step 1: Convert ML features to 12 subprocess scores
    const scores = this.convertToSubprocessScores(features);
    const totalScore = this.calculateTotalScore(scores);

    // Step 2: Check Pattern F first (early detection of risk)
    const patternF = this.detectPatternF(features, scores, totalScore);
    if (patternF) return patternF;

    // Step 3: Check other patterns (order matters for mixed cases)
    const patterns = [
      this.detectPatternA(scores, totalScore),
      this.detectPatternD(features, scores, totalScore),
      this.detectPatternE(scores, totalScore),
      this.detectPatternC(scores, totalScore),
      this.detectPatternB(features, scores, totalScore),
    ];

    // Step 4: Select best match by confidence
    const validPatterns = patterns.filter(p => p !== null);
    if (validPatterns.length === 0) {
      // Fallback to Pattern C (context-adaptive default)
      return this.detectPatternC(scores, totalScore)!;
    }

    // Return highest confidence pattern
    validPatterns.sort((a, b) => b!.confidence - a!.confidence);
    return validPatterns[0]!;
  }

  // ============================================================
  // Feature to Subprocess Score Conversion
  // ============================================================

  /**
   * Convert 12-dimensional ML features to 12 subprocess scores (0-3)
   */
  private convertToSubprocessScores(features: MetacognitiveFeatures): SubprocessScores {
    return {
      // Planning (P1-P4)
      P1: features.taskDecompositionScore, // Direct 0-3
      P2: this.normalize(features.promptSpecificity, 0, 10, 0, 3), // Map 0-10 to 0-3
      P3: features.strategyDiversity, // Direct 0-3
      P4: this.normalize(features.independentAttemptRate, 0, 1, 0, 3), // Map 0-1 to 0-3

      // Monitoring (M1-M3)
      M1: this.normalize(features.sessionDurationPattern, 0, 1, 0, 3),
      M2: this.normalize(features.verificationRate, 0, 1, 0, 3), // Critical!
      M3: this.normalize(features.trustCalibrationAccuracy, 0, 1, 0, 3),

      // Evaluation (E1-E3)
      E1: this.normalize(features.modificationRate, 0, 1, 0, 3),
      E2: this.normalize(features.confidenceScore, 0, 1, 0, 3),
      E3: this.normalize(features.errorAwareness, 0, 1, 0, 3),

      // Regulation (R1-R2)
      R1: this.normalize(features.iterationFrequency, 0, 1, 0, 3), // Critical!
      R2: features.crossModelUsage, // Direct 0-3
    };
  }

  /**
   * Normalize value from one range to another
   */
  private normalize(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    const clamped = Math.max(inMin, Math.min(inMax, value));
    return ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }

  /**
   * Calculate total score (sum of 12 subprocesses)
   */
  private calculateTotalScore(scores: SubprocessScores): number {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  }

  /**
   * Get high-scoring subprocesses (score >= 2.5)
   */
  private getHighScores(scores: SubprocessScores): string[] {
    return Object.entries(scores)
      .filter(([_, score]) => score >= 2.5)
      .map(([key]) => key);
  }

  // ============================================================
  // Pattern Detection Methods
  // ============================================================

  /**
   * Pattern A: 战略性分解与控制 (Strategic Decomposition & Control)
   *
   * Rule: High(P1, P2, P4) + High(M2) + High(E3)
   * Score range: 28-32
   */
  private detectPatternA(scores: SubprocessScores, totalScore: number): PatternDetectionResult | null {
    const { P1, P2, P4, M2, E3 } = scores;

    // Core indicators must be high (P1, P4, E3 most critical; M2 or P2 can be slightly lower)
    const coreCount = [P1 >= 2.5, P4 >= 2.5, E3 >= 2.5].filter(Boolean).length;

    if (coreCount >= 3 && (M2 >= 2.3 || P2 >= 2.3)) {
      const confidence = this.calculateConfidence([
        P1 >= 2.5,        // Planning: Task decomposition
        P2 >= 2.3,        // Planning: Goal setting
        P4 >= 2.5,        // Planning: Role definition
        M2 >= 2.3,        // Monitoring: Quality checking
        E3 >= 2.5,        // Evaluation: Capability judgment
        totalScore >= 24, // Overall strength (relaxed from 25)
      ]);

      if (confidence >= 0.55) { // Slightly relaxed threshold
        return {
          pattern: 'A',
          confidence,
          rationale: {
            high_scores: this.getHighScores(scores),
            total_score: Math.round(totalScore * 10) / 10,
            key_indicators: [
              P1 >= 2.5 ? '✓ Task decomposition (P1)' : '',
              P4 >= 2.5 ? '✓ Role boundary definition (P4)' : '',
              M2 >= 2.3 ? '✓ Quality checking (M2)' : '',
              E3 >= 2.5 ? '✓ Capability protection (E3)' : '',
            ].filter(Boolean),
          },
        };
      }
    }

    return null;
  }

  /**
   * Pattern B: 迭代优化与校准 (Iterative Optimization & Calibration)
   *
   * Rule: High(R1, R2) + Dynamic(M3) + Tolerance(Failure)
   * Key: iterationFrequency high (3-7 iterations)
   */
  private detectPatternB(
    features: MetacognitiveFeatures,
    scores: SubprocessScores,
    totalScore: number
  ): PatternDetectionResult | null {
    const { R1, R2, M3 } = scores;

    // Core: High iteration and tool switching
    // R1 >= 1.2 corresponds to iterationFrequency >= 0.4 (4+ iterations)
    if (R1 >= 1.2 && (R2 >= 1.5 || features.crossModelUsage >= 1.5)) {
      const confidence = this.calculateConfidence([
        R1 >= 1.5,                         // Strategy adjustment (5+ iterations)
        R2 >= 1.5,                         // Tool switching
        M3 >= 1.8,                         // Trust calibration
        features.iterationFrequency >= 0.3, // 3+ iterations typical
        totalScore >= 20,
      ]);

      if (confidence >= 0.55) { // Relaxed threshold
        return {
          pattern: 'B',
          confidence,
          rationale: {
            high_scores: this.getHighScores(scores),
            total_score: Math.round(totalScore * 10) / 10,
            key_indicators: [
              R1 >= 1.2 ? '✓ High iteration frequency (R1)' : '',
              R2 >= 1.5 ? '✓ Tool/model switching (R2)' : '',
              M3 >= 1.8 ? '✓ Dynamic trust calibration (M3)' : '',
              features.iterationFrequency >= 0.3 ? `✓ ${Math.round(features.iterationFrequency * 10)} iterations/session` : '',
            ].filter(Boolean),
          },
        };
      }
    }

    return null;
  }

  /**
   * Pattern C: 情境敏感适配 (Context-Sensitive Adaptation)
   *
   * Rule: Dynamic(ALL) + Context-Aware
   * Key: E1, E2, M3 very high + adaptive behavior
   */
  private detectPatternC(scores: SubprocessScores, totalScore: number): PatternDetectionResult | null {
    const { E1, E2, M3, P3, R1 } = scores;

    // Multi-faceted with emphasis on evaluation and adaptation
    const contextualStrength = (E1 + E2 + M3) / 3;

    if (contextualStrength >= 2.3 && totalScore >= 22) {
      const confidence = this.calculateConfidence([
        E1 >= 2.5, // Output assessment
        E2 >= 2.5, // Risk assessment
        M3 >= 2.5, // Trust calibration
        P3 >= 2,   // Strategy selection
        R1 >= 2,   // Strategy adjustment
        totalScore >= 24,
      ]);

      // Pattern C is often a fallback for "good but not specialized"
      const adjustedConfidence = Math.max(0.5, confidence * 0.9);

      return {
        pattern: 'C',
        confidence: adjustedConfidence,
        rationale: {
          high_scores: this.getHighScores(scores),
          total_score: Math.round(totalScore * 10) / 10,
          key_indicators: [
            E2 >= 2.5 ? '✓ Context-aware risk assessment (E2)' : '',
            M3 >= 2.5 ? '✓ Dynamic trust calibration (M3)' : '',
            P3 >= 2 ? '✓ Adaptive strategy selection (P3)' : '',
            'Multi-strategy user adapting to context',
          ].filter(Boolean),
        },
      };
    }

    return null;
  }

  /**
   * Pattern D: 深度核验与批判介入 (Deep Verification & Critical Intervention)
   *
   * Rule: Extreme(Verification) + Low(Trust)
   * Key: M2, E1, E2 very high + verificationRate > 0.9
   */
  private detectPatternD(
    features: MetacognitiveFeatures,
    scores: SubprocessScores,
    totalScore: number
  ): PatternDetectionResult | null {
    const { M2, E1, E2, R2 } = scores;

    // Extreme verification behavior
    if (M2 >= 2.5 && E1 >= 2.5 && E2 >= 2.5 && features.verificationRate >= 0.85) {
      const confidence = this.calculateConfidence([
        M2 >= 2.5,                          // Quality checking
        E1 >= 2.5,                          // Output assessment
        E2 >= 2.5,                          // Risk assessment
        features.verificationRate >= 0.9,   // >90% verification rate
        R2 >= 2,                            // Cross-tool verification
        totalScore >= 28,
      ]);

      if (confidence >= 0.6) {
        return {
          pattern: 'D',
          confidence,
          rationale: {
            high_scores: this.getHighScores(scores),
            total_score: Math.round(totalScore * 10) / 10,
            key_indicators: [
              M2 >= 2.5 ? '✓ Systematic quality checking (M2)' : '',
              E2 >= 2.5 ? '✓ Comprehensive risk assessment (E2)' : '',
              features.verificationRate >= 0.9 ? `✓ ${Math.round(features.verificationRate * 100)}% verification rate` : '',
              R2 >= 2 ? '✓ Multi-tool cross-verification (R2)' : '',
            ].filter(Boolean),
          },
        };
      }
    }

    return null;
  }

  /**
   * Pattern E: 教学化反思与自我监控 (Learning-Oriented Reflection)
   *
   * Rule: Learning-Oriented + High(Reflection)
   * Key: E1, E3, P2 very high + goal is learning not just completion
   */
  private detectPatternE(scores: SubprocessScores, totalScore: number): PatternDetectionResult | null {
    const { E1, E3, P2, M1, R1 } = scores;

    // Learning orientation: self-assessment + goal clarity + reflection
    if (E1 >= 2.5 && E3 >= 2.5 && P2 >= 2.5) {
      const confidence = this.calculateConfidence([
        E1 >= 2.5, // Output quality assessment (learning journal)
        E3 >= 2.5, // Capability judgment (self-testing)
        P2 >= 2.5, // Goal setting (learning goals)
        M1 >= 2,   // Progress tracking
        R1 >= 2,   // Strategy adjustment (learning from mistakes)
        totalScore >= 26,
      ]);

      if (confidence >= 0.6) {
        return {
          pattern: 'E',
          confidence,
          rationale: {
            high_scores: this.getHighScores(scores),
            total_score: Math.round(totalScore * 10) / 10,
            key_indicators: [
              E3 >= 2.5 ? '✓ Active capability self-assessment (E3)' : '',
              P2 >= 2.5 ? '✓ Clear learning goals (P2)' : '',
              E1 >= 2.5 ? '✓ Reflective output evaluation (E1)' : '',
              'AI as teaching tool, not task tool',
            ].filter(Boolean),
          },
        };
      }
    }

    return null;
  }

  /**
   * Pattern F: 无效与被动使用 (Ineffective & Passive Use)
   *
   * Rule: Absence(Metacognition)
   * Key: Total score < 15 (avg < 1.25 per subprocess)
   *
   * Multi-layered warning system based on red flags
   */
  private detectPatternF(
    features: MetacognitiveFeatures,
    scores: SubprocessScores,
    totalScore: number
  ): PatternDetectionResult | null {
    // Red flag system (from 03-Pattern-Framework-Supplement.md)
    let redFlags = 0;
    const flagDetails: string[] = [];

    // Signal 1: Extremely low verification rate
    if (features.verificationRate < 0.10) {
      redFlags += 3;
      flagDetails.push(`⚠️ Verification rate: ${Math.round(features.verificationRate * 100)}% (critical)`);
    }

    // Signal 2: Overly simple prompts
    if (features.promptSpecificity < 5) {
      redFlags += 2;
      flagDetails.push(`⚠️ Prompt specificity: ${features.promptSpecificity.toFixed(1)}/10 (very low)`);
    }

    // Signal 3: No iteration
    if (features.iterationFrequency < 0.15) {
      redFlags += 2;
      flagDetails.push(`⚠️ Iteration frequency: ${Math.round(features.iterationFrequency * 100)}% (passive)`);
    }

    // Signal 4: No error awareness
    if (features.errorAwareness < 0.20) {
      redFlags += 3;
      flagDetails.push(`⚠️ Error awareness: ${Math.round(features.errorAwareness * 100)}% (blind spots)`);
    }

    // Signal 5: Total score below threshold
    if (totalScore < 15) {
      redFlags += 3;
      flagDetails.push(`⚠️ Total metacognitive score: ${totalScore.toFixed(1)}/36 (severely low)`);
    }

    // Determine severity
    if (redFlags >= 5) {
      const alert = redFlags >= 8 ? 'high_risk' : 'warning';
      const confidence = Math.min(0.95, 0.6 + (redFlags - 5) * 0.05);

      return {
        pattern: 'F',
        confidence,
        alert,
        rationale: {
          high_scores: this.getHighScores(scores), // Usually none or very few
          total_score: Math.round(totalScore * 10) / 10,
          key_indicators: [
            `🚨 Risk Level: ${alert === 'high_risk' ? 'CRITICAL' : 'WARNING'}`,
            `Red flags detected: ${redFlags}/13`,
            ...flagDetails,
            '',
            'Pattern F = Absence of metacognitive strategies',
            'Recommended: Immediate intervention (MR15, MR16, MR18)',
          ],
        },
      };
    }

    return null;
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * Calculate confidence based on boolean conditions
   * @param conditions Array of boolean checks
   * @returns Confidence score 0-1
   */
  private calculateConfidence(conditions: boolean[]): number {
    const trueCount = conditions.filter(Boolean).length;
    const baseConfidence = trueCount / conditions.length;

    // Boost confidence if core conditions are met
    const coreCount = conditions.slice(0, 3).filter(Boolean).length;
    const boost = coreCount === 3 ? 0.1 : 0;

    return Math.min(0.95, baseConfidence + boost);
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const patternRecognitionEngine = new PatternRecognitionEngine();
