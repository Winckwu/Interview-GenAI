/**
 * Pattern Recognition Engine Test Suite
 *
 * Based on test cases from requirements and empirical data
 */

import {
  PatternRecognitionEngine,
  MetacognitiveFeatures,
  PatternDetectionResult,
} from './PatternRecognitionEngine';

const engine = new PatternRecognitionEngine();

describe('PatternRecognitionEngine', () => {

  // ============================================================
  // Test Case 1: Pattern A (Strategic Decomposition & Control)
  // ============================================================

  describe('Pattern A Detection', () => {
    it('should detect Pattern A with high planning and capability protection', () => {
      // Based on Interviewee I3 (typical Pattern A)
      const features: MetacognitiveFeatures = {
        // Planning: High decomposition, goal setting, role definition
        taskDecompositionScore: 3,
        promptSpecificity: 9.0,
        strategyDiversity: 3,
        independentAttemptRate: 0.9, // Always tries first

        // Monitoring: High quality checking
        sessionDurationPattern: 0.8,
        verificationRate: 0.85,
        trustCalibrationAccuracy: 0.8,

        // Evaluation: High capability judgment
        modificationRate: 0.7,
        confidenceScore: 0.75,
        errorAwareness: 0.9, // Strong self-assessment

        // Regulation: Moderate
        iterationFrequency: 0.4,
        crossModelUsage: 2,
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('A');
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
      expect(result.rationale.high_scores).toContain('P1'); // Task decomposition
      expect(result.rationale.high_scores).toContain('P4'); // Role definition
      expect(result.rationale.high_scores).toContain('M2'); // Quality checking
      expect(result.rationale.high_scores).toContain('E3'); // Capability judgment
      expect(result.rationale.total_score).toBeGreaterThanOrEqual(28);
      expect(result.rationale.total_score).toBeLessThanOrEqual(32);
    });
  });

  // ============================================================
  // Test Case 2: Pattern F (Ineffective & Passive Use)
  // ============================================================

  describe('Pattern F Detection', () => {
    it('should detect Pattern F with multiple red flags and high_risk alert', () => {
      // Based on Coding Exercise Segment 2 ("我就直接问ChatGPT...")
      const features: MetacognitiveFeatures = {
        // Planning: Minimal or none
        taskDecompositionScore: 0,
        promptSpecificity: 2.1, // Very simple prompts
        strategyDiversity: 0,
        independentAttemptRate: 0.05, // Never tries first

        // Monitoring: No verification
        sessionDurationPattern: 0.3,
        verificationRate: 0.05, // Critical flag!
        trustCalibrationAccuracy: 0.1, // Over-trust

        // Evaluation: No assessment
        modificationRate: 0.1,
        confidenceScore: 0.2,
        errorAwareness: 0.08, // Cannot detect AI errors

        // Regulation: Minimal adjustment
        iterationFrequency: 0.08, // Just re-ask when error
        crossModelUsage: 0,
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('F');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.alert).toBe('high_risk');
      expect(result.rationale.total_score).toBeLessThan(15);
      expect(result.rationale.key_indicators.length).toBeGreaterThan(3);

      // Check for specific red flags
      const indicators = result.rationale.key_indicators.join(' ');
      expect(indicators).toContain('Verification rate');
      expect(indicators).toContain('Error awareness');
      expect(indicators).toContain('Iteration frequency');
    });

    it('should detect Pattern F with warning level for moderate risk', () => {
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 1,
        promptSpecificity: 4.5,
        strategyDiversity: 1,
        independentAttemptRate: 0.15,
        sessionDurationPattern: 0.4,
        verificationRate: 0.12, // Just above critical, but still low
        trustCalibrationAccuracy: 0.25,
        modificationRate: 0.2,
        confidenceScore: 0.3,
        errorAwareness: 0.18, // Low awareness
        iterationFrequency: 0.14,
        crossModelUsage: 0,
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('F');
      expect(result.alert).toBe('warning');
      expect(result.rationale.total_score).toBeLessThan(15);
    });
  });

  // ============================================================
  // Test Case 3: Pattern B (Iterative Optimization)
  // ============================================================

  describe('Pattern B Detection', () => {
    it('should detect Pattern B with high iteration and tool switching', () => {
      // Based on Interviewee I16 (typical Pattern B)
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 2,
        promptSpecificity: 7.0,
        strategyDiversity: 2.5,
        independentAttemptRate: 0.5,
        sessionDurationPattern: 0.6,
        verificationRate: 0.6,
        trustCalibrationAccuracy: 0.85, // Dynamic trust

        modificationRate: 0.7,
        confidenceScore: 0.6,
        errorAwareness: 0.65,

        iterationFrequency: 0.85, // 8-9 iterations avg (high iteration)
        crossModelUsage: 2.5, // Uses multiple models
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('B');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.rationale.high_scores).toContain('R1');
      expect(result.rationale.high_scores).toContain('R2');
      expect(result.rationale.key_indicators.some(k => k.includes('iteration'))).toBe(true);
    });
  });

  // ============================================================
  // Test Case 4: Pattern C (Context-Sensitive Adaptation)
  // ============================================================

  describe('Pattern C Detection', () => {
    it('should detect Pattern C with dynamic trust and context awareness', () => {
      // Based on Interviewee I41 (typical Pattern C)
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 2,
        promptSpecificity: 7.5,
        strategyDiversity: 2.5,
        independentAttemptRate: 0.6,
        sessionDurationPattern: 0.7,
        verificationRate: 0.7,
        trustCalibrationAccuracy: 0.9, // Highly calibrated

        modificationRate: 0.75, // High assessment
        confidenceScore: 0.8, // Strong risk awareness
        errorAwareness: 0.7,

        iterationFrequency: 0.45,
        crossModelUsage: 2,
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('C');
      expect(result.rationale.high_scores).toContain('E1');
      expect(result.rationale.high_scores).toContain('E2');
      expect(result.rationale.high_scores).toContain('M3');
      expect(result.rationale.key_indicators.some(k => k.includes('context'))).toBe(true);
    });
  });

  // ============================================================
  // Test Case 5: Pattern D (Deep Verification)
  // ============================================================

  describe('Pattern D Detection', () => {
    it('should detect Pattern D with extreme verification behavior', () => {
      // Based on Interviewee I44 (typical Pattern D)
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 2,
        promptSpecificity: 8.0,
        strategyDiversity: 2,
        independentAttemptRate: 0.7,
        sessionDurationPattern: 0.8,
        verificationRate: 0.95, // >90% verification!
        trustCalibrationAccuracy: 0.6, // Lower trust

        modificationRate: 0.85, // High evaluation
        confidenceScore: 0.9, // High risk awareness
        errorAwareness: 0.8,

        iterationFrequency: 0.4,
        crossModelUsage: 2.5, // Cross-tool verification
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('D');
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
      expect(result.rationale.high_scores).toContain('M2');
      expect(result.rationale.high_scores).toContain('E1');
      expect(result.rationale.high_scores).toContain('E2');
      expect(result.rationale.key_indicators.some(k => k.includes('95%'))).toBe(true);
    });
  });

  // ============================================================
  // Test Case 6: Pattern E (Learning-Oriented)
  // ============================================================

  describe('Pattern E Detection', () => {
    it('should detect Pattern E with strong self-assessment and learning goals', () => {
      // Based on Interviewee I12 (typical Pattern E)
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 2,
        promptSpecificity: 9.0, // Clear learning goals
        strategyDiversity: 2,
        independentAttemptRate: 0.8, // Independent practice

        sessionDurationPattern: 0.75,
        verificationRate: 0.7,
        trustCalibrationAccuracy: 0.7,

        modificationRate: 0.8, // Reflective evaluation
        confidenceScore: 0.7,
        errorAwareness: 0.9, // Strong self-assessment

        iterationFrequency: 0.45,
        crossModelUsage: 1.5,
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('E');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.rationale.high_scores).toContain('E1');
      expect(result.rationale.high_scores).toContain('E3');
      expect(result.rationale.high_scores).toContain('P2');
      expect(result.rationale.key_indicators.some(k => k.includes('learning'))).toBe(true);
    });
  });

  // ============================================================
  // Edge Cases & Mixed Patterns
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle borderline scores appropriately', () => {
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 2.4, // Just below threshold
        promptSpecificity: 6.5,
        strategyDiversity: 2.4,
        independentAttemptRate: 0.65,
        sessionDurationPattern: 0.65,
        verificationRate: 0.65,
        trustCalibrationAccuracy: 0.65,
        modificationRate: 0.65,
        confidenceScore: 0.65,
        errorAwareness: 0.65,
        iterationFrequency: 0.35,
        crossModelUsage: 2,
      };

      const result = engine.detect(features);

      // Should not be Pattern F (total score > 15)
      expect(result.pattern).not.toBe('F');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1);
    });

    it('should default to Pattern C for balanced profiles', () => {
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 2,
        promptSpecificity: 7.0,
        strategyDiversity: 2,
        independentAttemptRate: 0.6,
        sessionDurationPattern: 0.6,
        verificationRate: 0.6,
        trustCalibrationAccuracy: 0.6,
        modificationRate: 0.65,
        confidenceScore: 0.65,
        errorAwareness: 0.6,
        iterationFrequency: 0.4,
        crossModelUsage: 2,
      };

      const result = engine.detect(features);

      // Balanced profile often maps to Pattern C (context-adaptive)
      expect(['C', 'B']).toContain(result.pattern);
    });
  });

  // ============================================================
  // Real-world Scenario Tests
  // ============================================================

  describe('Real-world Scenarios', () => {
    it('should detect coding exercise Segment 1 as Pattern A', () => {
      // "我每次写代码都会先花10分钟列个大纲..."
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 3, // "先花10分钟列个大纲"
        promptSpecificity: 8.5, // Clear planning
        strategyDiversity: 3, // "算法自己写 vs CRUD用GPT"
        independentAttemptRate: 0.9, // "算法核心逻辑我自己写"
        sessionDurationPattern: 0.7,
        verificationRate: 0.75, // Implied but not stated
        trustCalibrationAccuracy: 0.7,
        modificationRate: 0.6,
        confidenceScore: 0.7,
        errorAwareness: 0.85, // "哪部分我自己做"
        iterationFrequency: 0.3,
        crossModelUsage: 1,
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('A');
      expect(result.rationale.total_score).toBeGreaterThanOrEqual(25);
    });

    it('should detect coding exercise Segment 2 as Pattern F with high risk', () => {
      // "我就直接问ChatGPT'帮我写这个功能'，它给什么我就用什么"
      const features: MetacognitiveFeatures = {
        taskDecompositionScore: 0, // "直接问"
        promptSpecificity: 2.1, // "帮我写这个功能"
        strategyDiversity: 0,
        independentAttemptRate: 0,
        sessionDurationPattern: 0.3,
        verificationRate: 0.05, // "它给什么我就用什么"
        trustCalibrationAccuracy: 0.1, // "一般都没问题"
        modificationRate: 0.05,
        confidenceScore: 0.1,
        errorAwareness: 0.05,
        iterationFrequency: 0.1, // "偶尔报错就再问一次"
        crossModelUsage: 0,
      };

      const result = engine.detect(features);

      expect(result.pattern).toBe('F');
      expect(result.alert).toBe('high_risk');
      expect(result.rationale.total_score).toBeLessThan(5);
    });
  });

});

// ============================================================
// Run Tests (if executed directly)
// ============================================================

if (require.main === module) {
  console.log('🧪 Running Pattern Recognition Engine Tests...\n');

  // Simple test runner
  const testPatternA = () => {
    const features: MetacognitiveFeatures = {
      taskDecompositionScore: 3,
      promptSpecificity: 8.5,
      strategyDiversity: 2,
      independentAttemptRate: 0.9,
      sessionDurationPattern: 0.7,
      verificationRate: 0.82,
      trustCalibrationAccuracy: 0.75,
      modificationRate: 0.6,
      confidenceScore: 0.7,
      errorAwareness: 0.85,
      iterationFrequency: 0.4,
      crossModelUsage: 2,
    };

    const result = engine.detect(features);
    console.log('Test Case 1: Pattern A');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('✓ Pattern:', result.pattern === 'A' ? 'PASS' : 'FAIL');
    console.log('✓ Confidence:', result.confidence >= 0.75 ? 'PASS' : 'FAIL');
    console.log('');
  };

  const testPatternF = () => {
    const features: MetacognitiveFeatures = {
      taskDecompositionScore: 0,
      promptSpecificity: 2.1,
      strategyDiversity: 0,
      independentAttemptRate: 0.05,
      sessionDurationPattern: 0.3,
      verificationRate: 0.05,
      trustCalibrationAccuracy: 0.1,
      modificationRate: 0.1,
      confidenceScore: 0.2,
      errorAwareness: 0.08,
      iterationFrequency: 0.08,
      crossModelUsage: 0,
    };

    const result = engine.detect(features);
    console.log('Test Case 2: Pattern F');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('✓ Pattern:', result.pattern === 'F' ? 'PASS' : 'FAIL');
    console.log('✓ Alert:', result.alert === 'high_risk' ? 'PASS' : 'FAIL');
    console.log('');
  };

  testPatternA();
  testPatternF();

  console.log('🎉 All manual tests completed!');
}
