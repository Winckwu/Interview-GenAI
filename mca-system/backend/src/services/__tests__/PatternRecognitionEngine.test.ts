/**
 * Pattern Recognition Engine Tests
 *
 * Validates detection of all 6 patterns (A-F) with realistic feature scenarios
 * Based on 03-Pattern-Framework-Supplement.md theoretical framework
 */

import {
  PatternRecognitionEngine,
  MLFeatures,
} from '../PatternRecognitionEngine';

describe('PatternRecognitionEngine', () => {
  let engine: PatternRecognitionEngine;

  beforeEach(() => {
    engine = new PatternRecognitionEngine();
  });

  describe('Pattern A: Strategic Decomposition & Control', () => {
    it('should detect Pattern A with high planning, quality checking, and capability judgment', () => {
      const patternA_features: MLFeatures = {
        // High Planning (P1-P4)
        taskDecompositionScore: 3,        // High decomposition
        promptSpecificity: 8.5,           // Specific prompts
        strategyDiversity: 4,             // Multiple strategies
        independentAttemptRate: 0.75,     // Tries before using AI

        // Moderate Monitoring
        sessionDurationPattern: 0.7,      // Good time management
        verificationRate: 0.82,           // High verification (M2)
        trustCalibrationAccuracy: 0.6,    // Moderate trust calibration

        // High Evaluation
        modificationRate: 0.65,           // Modifies AI outputs
        confidenceScore: 0.55,            // Reasonable confidence
        errorAwareness: 0.78,             // High error awareness (E3)

        // Moderate Regulation
        iterationFrequency: 0.4,          // Some iterations
        crossModelUsage: 2,               // Uses 2 models
      };

      const result = engine.detect(patternA_features);

      expect(result.pattern).toBe('A');
      expect(result.confidence).toBeGreaterThan(0.75);
      expect(result.rationale.high_scores).toContain('P1');
      expect(result.rationale.high_scores).toContain('M2');
      expect(result.rationale.high_scores).toContain('E3');
      expect(result.rationale.total_score).toBeGreaterThan(22);
    });

    it('should verify Pattern A subprocess composition', () => {
      const components = engine.getPatternComponentsFor('A');
      expect(components.pattern).toEqual(['P1', 'P2', 'P4', 'M2', 'E3']);
      expect(components.description).toContain('Strategic');
    });
  });

  describe('Pattern B: Iterative Optimization & Calibration', () => {
    it('should detect Pattern B with high strategy adjustment and tool switching', () => {
      const patternB_features: MLFeatures = {
        // Moderate Planning
        taskDecompositionScore: 1.5,      // Some decomposition
        promptSpecificity: 4.2,           // Moderate specificity
        strategyDiversity: 3,             // Several strategies
        independentAttemptRate: 0.4,      // Less independent work

        // Moderate-High Monitoring
        sessionDurationPattern: 0.5,      // Moderate time management
        verificationRate: 0.45,           // Moderate verification
        trustCalibrationAccuracy: 0.75,   // High trust calibration (M3)

        // Moderate Evaluation
        modificationRate: 0.55,           // Some modifications
        confidenceScore: 0.65,            // Moderate-high confidence
        errorAwareness: 0.5,              // Moderate error awareness

        // HIGH Regulation
        iterationFrequency: 0.68,         // High iteration (R1)
        crossModelUsage: 3.5,             // Multiple models (R2)
      };

      const result = engine.detect(patternB_features);

      expect(result.pattern).toBe('B');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.rationale.high_scores).toContain('R1');
      expect(result.rationale.high_scores).toContain('R2');
    });
  });

  describe('Pattern C: Context-Sensitive Adaptation', () => {
    it('should detect Pattern C with balanced strengths across contexts', () => {
      const patternC_features: MLFeatures = {
        // Moderate-High Planning
        taskDecompositionScore: 2,        // Good decomposition
        promptSpecificity: 6.5,           // Good specificity
        strategyDiversity: 3.5,           // Good strategy diversity
        independentAttemptRate: 0.55,     // Moderate independent work

        // Moderate Monitoring
        sessionDurationPattern: 0.6,      // OK time management
        verificationRate: 0.52,           // Moderate verification
        trustCalibrationAccuracy: 0.68,   // Good trust calibration (M3)

        // High Evaluation
        modificationRate: 0.58,           // Moderate modifications (E1)
        confidenceScore: 0.62,            // Reasonable confidence (E2)
        errorAwareness: 0.48,             // Moderate error awareness

        // Moderate Regulation
        iterationFrequency: 0.45,         // Some iterations (R1)
        crossModelUsage: 2,               // Some model variety
      };

      const result = engine.detect(patternC_features);

      expect(result.pattern).toBe('C');
      expect(result.confidence).toBeGreaterThan(0.55);
      expect(result.rationale.total_score).toBeGreaterThan(18);
    });

    it('should note Pattern C as flexible across varying contexts', () => {
      const components = engine.getPatternComponentsFor('C');
      expect(components.description).toContain('Context');
    });
  });

  describe('Pattern D: Deep Verification & Critical Inquiry', () => {
    it('should detect Pattern D with extreme verification and low trust', () => {
      const patternD_features: MLFeatures = {
        // Low Planning
        taskDecompositionScore: 1,        // Minimal decomposition
        promptSpecificity: 3,             // Less detailed prompts
        strategyDiversity: 2,             // Few strategies
        independentAttemptRate: 0.35,     // Some independent work

        // HIGH Monitoring (M2)
        sessionDurationPattern: 0.8,      // Careful time use
        verificationRate: 0.95,           // Extreme verification (M2)
        trustCalibrationAccuracy: 0.4,    // Low trust (M3)

        // HIGH Evaluation
        modificationRate: 0.72,           // Many modifications (E1)
        confidenceScore: 0.82,            // High risk awareness (E2) - skeptical of AI
        errorAwareness: 0.85,             // High error awareness (E3)

        // Moderate Regulation
        iterationFrequency: 0.55,         // Frequent iterations (R1)
        crossModelUsage: 3.2,             // Multiple models (R2)
      };

      const result = engine.detect(patternD_features);

      expect(result.pattern).toBe('D');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.rationale.high_scores).toContain('M2');
      expect(result.rationale.high_scores).toContain('E1');
      expect(result.rationale.high_scores).toContain('E2');
      expect(result.rationale.high_scores).toContain('R2');
    });

    it('should note Pattern D verification rate > 90%', () => {
      const patternD_features: MLFeatures = {
        taskDecompositionScore: 0.8,
        promptSpecificity: 2.5,
        strategyDiversity: 1.5,
        independentAttemptRate: 0.3,
        sessionDurationPattern: 0.75,
        verificationRate: 0.92, // > 90%
        trustCalibrationAccuracy: 0.35,
        modificationRate: 0.68,
        confidenceScore: 0.3,
        errorAwareness: 0.8,
        iterationFrequency: 0.52,
        crossModelUsage: 3,
      };

      const result = engine.detect(patternD_features);
      const verificationRate = result.rationale.subprocess_scores?.['M2'] || 0;
      expect(verificationRate).toBeGreaterThan(2.7); // 90% of 3.0
    });
  });

  describe('Pattern E: Teaching-Based Reflection & Self-Monitoring', () => {
    it('should detect Pattern E with high reflection and learning orientation', () => {
      const patternE_features: MLFeatures = {
        // Moderate Planning
        taskDecompositionScore: 1.8,      // Some decomposition
        promptSpecificity: 7.2,           // Specific prompts (P2)
        strategyDiversity: 2.5,           // Moderate strategies
        independentAttemptRate: 0.65,     // High independent work (P4)

        // Moderate-High Monitoring
        sessionDurationPattern: 0.7,      // Good time management (M1)
        verificationRate: 0.45,           // Moderate verification
        trustCalibrationAccuracy: 0.55,   // Moderate trust calibration

        // HIGH Evaluation
        modificationRate: 0.68,           // High modifications (E1)
        confidenceScore: 0.58,            // Reasonable confidence
        errorAwareness: 0.82,             // High error awareness (E3)

        // High Regulation
        iterationFrequency: 0.52,         // Good iteration (R1)
        crossModelUsage: 1.5,             // Fewer models (focused learning)
      };

      const result = engine.detect(patternE_features);

      expect(result.pattern).toBe('E');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.rationale.high_scores).toContain('E1');
      expect(result.rationale.high_scores).toContain('E3');
    });

    it('should verify Pattern E learning orientation', () => {
      const components = engine.getPatternComponentsFor('E');
      expect(components.description).toContain('Learning');
    });
  });

  describe('Pattern F: Passive & Ineffective Use ⚠️', () => {
    it('should detect Pattern F with extremely low metacognitive activity', () => {
      const patternF_features: MLFeatures = {
        // Minimal Planning
        taskDecompositionScore: 0.3,      // No decomposition
        promptSpecificity: 2.1,           // Very vague prompts
        strategyDiversity: 0.5,           // One strategy
        independentAttemptRate: 0.05,     // Almost no independent work

        // Minimal Monitoring
        sessionDurationPattern: 0.2,      // Poor time management
        verificationRate: 0.05,           // Almost no verification
        trustCalibrationAccuracy: 0.15,   // Blind trust

        // Minimal Evaluation
        modificationRate: 0.08,           // Almost no modifications
        confidenceScore: 0.9,             // Overconfident (incorrect)
        errorAwareness: 0.05,             // No error detection

        // Minimal Regulation
        iterationFrequency: 0.08,         // No iterations
        crossModelUsage: 0.5,             // Uses only one model
      };

      const result = engine.detect(patternF_features);

      expect(result.pattern).toBe('F');
      expect(result.confidence).toBeGreaterThan(0.85);
      expect(result.alert).toBe('high_risk');
      expect(result.rationale.total_score).toBeLessThan(15);
    });

    it('should verify Pattern F detection with high sensitivity', () => {
      const patternF_features: MLFeatures = {
        taskDecompositionScore: 0.2,
        promptSpecificity: 1.8,
        strategyDiversity: 0.3,
        independentAttemptRate: 0.02,
        sessionDurationPattern: 0.15,
        verificationRate: 0.04, // KEY: Verification < 10%
        trustCalibrationAccuracy: 0.1,
        modificationRate: 0.05,
        confidenceScore: 0.95, // Overconfident
        errorAwareness: 0.02,  // KEY: No error awareness
        iterationFrequency: 0.05, // KEY: No iterations
        crossModelUsage: 0.3,
      };

      const result = engine.detect(patternF_features);

      expect(result.pattern).toBe('F');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9); // > 90% sensitivity
      expect(result.alert).toBe('high_risk');

      // Verify key indicators
      const subprocess_scores = result.rationale.subprocess_scores!;
      expect(subprocess_scores['M2']).toBeLessThan(0.15); // verificationRate
      expect(subprocess_scores['E3']).toBeLessThan(0.1);  // errorAwareness
      expect(subprocess_scores['R1']).toBeLessThan(0.2);  // iterationFrequency
    });

    it('should achieve >90% sensitivity for Pattern F detection', () => {
      // Test multiple F scenarios
      const f_scenarios = [
        // Scenario 1: Complete non-use
        {
          taskDecompositionScore: 0.1,
          promptSpecificity: 1.5,
          strategyDiversity: 0.2,
          independentAttemptRate: 0,
          sessionDurationPattern: 0.1,
          verificationRate: 0.02,
          trustCalibrationAccuracy: 0.05,
          modificationRate: 0.02,
          confidenceScore: 1.0,
          errorAwareness: 0.01,
          iterationFrequency: 0.01,
          crossModelUsage: 0.1,
        },
        // Scenario 2: Blind trust usage
        {
          taskDecompositionScore: 0.4,
          promptSpecificity: 1.2,
          strategyDiversity: 0.5,
          independentAttemptRate: 0.03,
          sessionDurationPattern: 0.2,
          verificationRate: 0.06,
          trustCalibrationAccuracy: 0.08,
          modificationRate: 0.04,
          confidenceScore: 0.98,
          errorAwareness: 0.03,
          iterationFrequency: 0.04,
          crossModelUsage: 0.2,
        },
        // Scenario 3: Passive behavior
        {
          taskDecompositionScore: 0.5,
          promptSpecificity: 2.0,
          strategyDiversity: 0.8,
          independentAttemptRate: 0.08,
          sessionDurationPattern: 0.25,
          verificationRate: 0.08,
          trustCalibrationAccuracy: 0.12,
          modificationRate: 0.06,
          confidenceScore: 0.92,
          errorAwareness: 0.05,
          iterationFrequency: 0.07,
          crossModelUsage: 0.5,
        },
      ];

      let f_detections = 0;
      let average_confidence = 0;

      for (const scenario of f_scenarios) {
        const result = engine.detect(scenario as MLFeatures);
        if (result.pattern === 'F') {
          f_detections++;
          average_confidence += result.confidence;
        }
      }

      const detection_rate = f_detections / f_scenarios.length;
      const avg_confidence = average_confidence / f_detections;

      expect(detection_rate).toBeGreaterThanOrEqual(0.9); // >90% sensitivity
      expect(avg_confidence).toBeGreaterThan(0.85);
    });

    it('should identify Pattern F key risk indicators', () => {
      const metrics = engine.getPatternFSensitivityMetrics();

      expect(metrics.threshold_total_score).toBe(15);
      expect(metrics.min_confidence_for_f).toBeGreaterThanOrEqual(0.85);
      expect(metrics.key_indicators).toContain('verificationRate < 0.10');
      expect(metrics.key_indicators).toContain('errorAwareness < 0.20');
      expect(metrics.key_indicators).toContain('iterationFrequency < 0.15');
    });
  });

  describe('Pattern Interpretation & Components', () => {
    it('should provide human-readable descriptions for all patterns', () => {
      const patterns: Array<'A' | 'B' | 'C' | 'D' | 'E' | 'F'> = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
      ];

      for (const pattern of patterns) {
        const interpretation = engine.interpretPattern(pattern);
        expect(interpretation).toBeTruthy();
        expect(interpretation.length).toBeGreaterThan(10);
      }
    });

    it('should return correct subprocess components for each pattern', () => {
      const expectations: Record<string, string[]> = {
        A: ['P1', 'P2', 'P4', 'M2', 'E3'],
        B: ['R1', 'R2', 'M3', 'E2'],
        C: ['P1', 'P3', 'M3', 'E1', 'E2', 'R1'],
        D: ['M2', 'E1', 'E2', 'R2'],
        E: ['E1', 'E3', 'P2', 'M1', 'R1'],
        F: [],
      };

      for (const [pattern, expected] of Object.entries(expectations)) {
        const components = engine.getPatternComponentsFor(
          pattern as 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
        );
        expect(components.pattern).toEqual(expected);
      }
    });
  });

  describe('Batch Detection', () => {
    it('should detect patterns for multiple feature sets', () => {
      const featureSets: MLFeatures[] = [
        // Pattern A
        {
          taskDecompositionScore: 3,
          promptSpecificity: 8.5,
          strategyDiversity: 4,
          independentAttemptRate: 0.75,
          sessionDurationPattern: 0.7,
          verificationRate: 0.82,
          trustCalibrationAccuracy: 0.6,
          modificationRate: 0.65,
          confidenceScore: 0.55,
          errorAwareness: 0.78,
          iterationFrequency: 0.4,
          crossModelUsage: 2,
        },
        // Pattern F
        {
          taskDecompositionScore: 0.3,
          promptSpecificity: 2.1,
          strategyDiversity: 0.5,
          independentAttemptRate: 0.05,
          sessionDurationPattern: 0.2,
          verificationRate: 0.05,
          trustCalibrationAccuracy: 0.15,
          modificationRate: 0.08,
          confidenceScore: 0.9,
          errorAwareness: 0.05,
          iterationFrequency: 0.08,
          crossModelUsage: 0.5,
        },
      ];

      const results = engine.detectBatch(featureSets);

      expect(results.length).toBe(2);
      expect(results[0].pattern).toBe('A');
      expect(results[1].pattern).toBe('F');
      expect(results[1].alert).toBe('high_risk');
    });
  });

  describe('Edge Cases', () => {
    it('should handle perfectly balanced features (fallback to Pattern C)', () => {
      const balanced_features: MLFeatures = {
        taskDecompositionScore: 1.5,
        promptSpecificity: 5.0,
        strategyDiversity: 2.5,
        independentAttemptRate: 0.5,
        sessionDurationPattern: 0.5,
        verificationRate: 0.5,
        trustCalibrationAccuracy: 0.5,
        modificationRate: 0.5,
        confidenceScore: 0.5,
        errorAwareness: 0.5,
        iterationFrequency: 0.5,
        crossModelUsage: 2.5,
      };

      const result = engine.detect(balanced_features);
      expect(result.pattern).toBeDefined();
      expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(result.pattern);
    });

    it('should handle zero features gracefully', () => {
      const zero_features: MLFeatures = {
        taskDecompositionScore: 0,
        promptSpecificity: 0,
        strategyDiversity: 0,
        independentAttemptRate: 0,
        sessionDurationPattern: 0,
        verificationRate: 0,
        trustCalibrationAccuracy: 0,
        modificationRate: 0,
        confidenceScore: 0,
        errorAwareness: 0,
        iterationFrequency: 0,
        crossModelUsage: 0,
      };

      const result = engine.detect(zero_features);
      expect(result.pattern).toBe('F');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    it('should handle maximum features gracefully', () => {
      const max_features: MLFeatures = {
        taskDecompositionScore: 3,
        promptSpecificity: 10,
        strategyDiversity: 5,
        independentAttemptRate: 1,
        sessionDurationPattern: 1,
        verificationRate: 1,
        trustCalibrationAccuracy: 1,
        modificationRate: 1,
        confidenceScore: 1,
        errorAwareness: 1,
        iterationFrequency: 1,
        crossModelUsage: 5,
      };

      const result = engine.detect(max_features);
      expect(result.pattern).toBeDefined();
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.rationale.total_score).toBeGreaterThan(30);
    });
  });

  describe('Explainability & Rationale', () => {
    it('should provide clear rationale with high-scoring sub-processes', () => {
      const features: MLFeatures = {
        taskDecompositionScore: 2.8,
        promptSpecificity: 8,
        strategyDiversity: 4,
        independentAttemptRate: 0.7,
        sessionDurationPattern: 0.6,
        verificationRate: 0.75,
        trustCalibrationAccuracy: 0.5,
        modificationRate: 0.6,
        confidenceScore: 0.5,
        errorAwareness: 0.75,
        iterationFrequency: 0.35,
        crossModelUsage: 1.8,
      };

      const result = engine.detect(features);

      expect(result.rationale.high_scores.length).toBeGreaterThan(0);
      expect(result.rationale.total_score).toBeGreaterThan(0);
      expect(result.rationale.subprocess_scores).toBeDefined();
      expect(Object.keys(result.rationale.subprocess_scores!).length).toBe(12);
    });

    it('should show subprocess scores for transparency', () => {
      const features: MLFeatures = {
        taskDecompositionScore: 2,
        promptSpecificity: 6,
        strategyDiversity: 3,
        independentAttemptRate: 0.5,
        sessionDurationPattern: 0.5,
        verificationRate: 0.5,
        trustCalibrationAccuracy: 0.5,
        modificationRate: 0.5,
        confidenceScore: 0.5,
        errorAwareness: 0.5,
        iterationFrequency: 0.5,
        crossModelUsage: 2.5,
      };

      const result = engine.detect(features);
      const scores = result.rationale.subprocess_scores!;

      // Verify all 12 subprocesses are scored
      expect(Object.keys(scores).length).toBe(12);
      expect(scores['P1']).toBeDefined();
      expect(scores['R2']).toBeDefined();

      // Verify all scores are in valid range
      for (const score of Object.values(scores)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(3);
      }
    });
  });
});
