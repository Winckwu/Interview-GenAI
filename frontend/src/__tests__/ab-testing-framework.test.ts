/**
 * A/B Testing Framework Tests
 * Tests intervention strategy comparison and effectiveness measurement
 * Validates user assignment, metrics collection, and statistical analysis
 */

import {
  ABTestingFramework,
  InterventionStrategy,
  TestUserAssignment,
  InterventionMetrics,
  ABTestResult
} from '../components/ABTestingFramework';

describe('A/B Testing Framework - Intervention Strategy Comparison', () => {
  // Helper functions
  const createMetrics = (
    userId: string,
    strategy: InterventionStrategy,
    overrides?: Partial<InterventionMetrics>
  ): InterventionMetrics => {
    return {
      userId,
      strategy,
      startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endTime: new Date(),
      durationDays: 14,
      patternImprovement: 0.3,
      verificationIncrease: 0.15,
      queryEfficiency: 0.2,
      riskReduction: 0.25,
      engagementScore: 0.75,
      satisfactionRating: 4,
      completionRate: 0.85,
      ...overrides
    };
  };

  describe('User Assignment to Test Groups', () => {
    it('should assign user to a test group', () => {
      const assignment = ABTestingFramework.assignUserToGroup('user_001');

      expect(assignment.userId).toBe('user_001');
      expect(['baseline', 'aggressive', 'adaptive']).toContain(assignment.testGroup);
      expect(assignment.assignmentTime).toBeInstanceOf(Date);
    });

    it('should assign different users to groups', () => {
      const assignments: TestUserAssignment[] = [];

      for (let i = 0; i < 30; i++) {
        assignments.push(ABTestingFramework.assignUserToGroup(`user_${i}`));
      }

      // Should have distributed users across groups
      const groupCounts: Record<InterventionStrategy, number> = {
        baseline: 0,
        aggressive: 0,
        adaptive: 0
      };

      assignments.forEach((assignment) => {
        groupCounts[assignment.testGroup]++;
      });

      // With random assignment and N=30, expect some distribution
      expect(groupCounts.baseline).toBeGreaterThan(0);
      expect(groupCounts.aggressive).toBeGreaterThan(0);
      expect(groupCounts.adaptive).toBeGreaterThan(0);
    });

    it('should record assignment time', () => {
      const assignment = ABTestingFramework.assignUserToGroup('user_time');
      const timeDiff = Math.abs(new Date().getTime() - assignment.assignmentTime.getTime());

      // Should be assigned within 1 second
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('Intervention Strategy Selection', () => {
    it('should provide baseline intervention for Pattern F', () => {
      const intervention = ABTestingFramework.getInterventionForUser('user_001', 'baseline', 'F');

      expect(intervention).toBeDefined();
      expect(intervention.length).toBeGreaterThan(0);
      expect(intervention).toContain('over-reliance');
    });

    it('should provide aggressive intervention for Pattern F', () => {
      const intervention = ABTestingFramework.getInterventionForUser('user_001', 'aggressive', 'F');

      expect(intervention).toBeDefined();
      expect(intervention.toUpperCase()).toContain('CRITICAL');
      expect(intervention).toContain('50%');
    });

    it('should provide adaptive intervention for Pattern F', () => {
      const intervention = ABTestingFramework.getInterventionForUser('user_001', 'adaptive', 'F');

      expect(intervention).toBeDefined();
      expect(intervention).toContain('work together');
    });

    it('should provide different interventions for different patterns', () => {
      const baselineA = ABTestingFramework.getInterventionForUser('user_001', 'baseline', 'A');
      const baselineF = ABTestingFramework.getInterventionForUser('user_001', 'baseline', 'F');

      expect(baselineA).not.toEqual(baselineF);
    });

    it('should provide different interventions for different strategies', () => {
      const baseline = ABTestingFramework.getInterventionForUser('user_001', 'baseline', 'F');
      const aggressive = ABTestingFramework.getInterventionForUser('user_001', 'aggressive', 'F');
      const adaptive = ABTestingFramework.getInterventionForUser('user_001', 'adaptive', 'F');

      expect(baseline).not.toEqual(aggressive);
      expect(baseline).not.toEqual(adaptive);
      expect(aggressive).not.toEqual(adaptive);
    });

    it('should provide strategy-specific guidance', () => {
      const aggressive = ABTestingFramework.getInterventionForUser('user_001', 'aggressive', 'B');
      const adaptive = ABTestingFramework.getInterventionForUser('user_001', 'adaptive', 'B');

      expect(aggressive).toContain('verification');
      expect(adaptive).toContain('verification');
      // But with different tones
      expect(aggressive.length).not.toEqual(adaptive.length);
    });
  });

  describe('Metrics Recording', () => {
    it('should record metrics for user in test', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'A',
        'A',
        0.85,
        0.88,
        1.2,
        1.0,
        14,
        4
      );

      expect(metrics.userId).toBe('user_001');
      expect(metrics.strategy).toBe('baseline');
      expect(metrics.durationDays).toBe(14);
      expect(metrics.satisfactionRating).toBe(4);
    });

    it('should calculate pattern improvement', () => {
      // Improvement from F to A
      const improvement = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'F',
        'A',
        0.2,
        0.9,
        3.0,
        1.0,
        14,
        5
      );

      expect(improvement.patternImprovement).toBeGreaterThan(0);
    });

    it('should calculate regression detection', () => {
      // Regression from A to F
      const regression = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'A',
        'F',
        0.9,
        0.2,
        1.0,
        3.0,
        14,
        1
      );

      expect(regression.patternImprovement).toBeLessThan(0);
    });

    it('should calculate verification increase', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'B',
        'A',
        0.60,
        0.85,
        1.8,
        1.2,
        14,
        4
      );

      expect(metrics.verificationIncrease).toBe(0.25);
    });

    it('should calculate query efficiency', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'B',
        'B',
        0.70,
        0.75,
        2.0,
        1.5,
        14,
        4
      );

      expect(metrics.queryEfficiency).toBe(0.5); // 2.0 - 1.5
    });

    it('should calculate risk reduction', () => {
      // Moving from F to safer pattern reduces risk
      const metrics = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'F',
        'C',
        0.1,
        0.6,
        3.0,
        1.5,
        14,
        3
      );

      expect(metrics.riskReduction).toBeGreaterThan(0);
    });

    it('should calculate engagement score', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'A',
        'A',
        0.85,
        0.88,
        1.2,
        1.0,
        14,
        5
      );

      expect(metrics.engagementScore).toBeGreaterThan(0);
      expect(metrics.engagementScore).toBeLessThanOrEqual(1);
    });

    it('should calculate completion rate', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'A',
        'A',
        0.85,
        0.88,
        1.2,
        1.0,
        14,
        4
      );

      expect(metrics.completionRate).toBeGreaterThan(0);
      expect(metrics.completionRate).toBeLessThanOrEqual(1);
    });

    it('should record start and end times', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_001',
        'baseline',
        'A',
        'A',
        0.85,
        0.88,
        1.2,
        1.0,
        14,
        4
      );

      expect(metrics.startTime).toBeInstanceOf(Date);
      expect(metrics.endTime).toBeInstanceOf(Date);
      expect(metrics.startTime.getTime()).toBeLessThan(metrics.endTime.getTime());
    });
  });

  describe('Strategy Comparison', () => {
    it('should compare two intervention strategies', () => {
      const baselineMetrics = [
        createMetrics('user_1', 'baseline', { patternImprovement: 0.1, riskReduction: 0.1 }),
        createMetrics('user_2', 'baseline', { patternImprovement: 0.15, riskReduction: 0.15 })
      ];

      const aggressiveMetrics = [
        createMetrics('user_3', 'aggressive', { patternImprovement: 0.3, riskReduction: 0.3 }),
        createMetrics('user_4', 'aggressive', { patternImprovement: 0.35, riskReduction: 0.35 })
      ];

      const result = ABTestingFramework.compareStrategies(
        baselineMetrics,
        aggressiveMetrics,
        'baseline',
        'aggressive'
      );

      expect(result.strategyA).toBe('baseline');
      expect(result.strategyB).toBe('aggressive');
      expect(result.sampleSizeA).toBe(2);
      expect(result.sampleSizeB).toBe(2);
      expect(result.winner).toBeDefined();
      expect(['baseline', 'aggressive']).toContain(result.winner);
    });

    it('should calculate effect size', () => {
      const metricsA = Array.from({ length: 20 }, (_, i) =>
        createMetrics(`user_a_${i}`, 'baseline', { riskReduction: 0.2 })
      );

      const metricsB = Array.from({ length: 20 }, (_, i) =>
        createMetrics(`user_b_${i}`, 'aggressive', { riskReduction: 0.5 })
      );

      const result = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');

      expect(result.effectSize).toBeGreaterThanOrEqual(0);
      expect(typeof result.effectSize).toBe('number');
    });

    it('should determine statistical significance based on effect size', () => {
      // Small effect
      const smallMetricsA = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_a_${i}`, 'baseline', { riskReduction: 0.4 })
      );
      const smallMetricsB = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_b_${i}`, 'aggressive', { riskReduction: 0.42 })
      );

      const smallResult = ABTestingFramework.compareStrategies(
        smallMetricsA,
        smallMetricsB,
        'baseline',
        'aggressive'
      );

      // Large effect
      const largeMetricsA = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_c_${i}`, 'baseline', { riskReduction: 0.1 })
      );
      const largeMetricsB = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_d_${i}`, 'aggressive', { riskReduction: 0.7 })
      );

      const largeResult = ABTestingFramework.compareStrategies(
        largeMetricsA,
        largeMetricsB,
        'baseline',
        'aggressive'
      );

      // Larger effect should have higher chance of significance
      expect(largeResult.effectSize).toBeGreaterThan(smallResult.effectSize);
    });

    it('should include metric-by-metric comparison', () => {
      const metricsA = [createMetrics('user_1', 'baseline')];
      const metricsB = [createMetrics('user_2', 'aggressive', { verificationIncrease: 0.3 })];

      const result = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');

      expect(result.metrics).toBeDefined();
      expect(Array.isArray(result.metrics)).toBe(true);
      expect(result.metrics.length).toBeGreaterThan(0);

      result.metrics.forEach((metric) => {
        expect(['pattern_improvement', 'verification_increase', 'query_efficiency', 'risk_reduction']).toContain(
          metric.metricName
        );
        expect(typeof metric.meanA).toBe('number');
        expect(typeof metric.meanB).toBe('number');
        expect(typeof metric.improvement).toBe('number');
      });
    });

    it('should provide recommendation', () => {
      const metricsA = [createMetrics('user_1', 'baseline', { riskReduction: 0.1 })];
      const metricsB = [createMetrics('user_2', 'aggressive', { riskReduction: 0.5 })];

      const result = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');

      expect(result.recommendation).toBeDefined();
      expect(result.recommendation.length).toBeGreaterThan(0);
      expect(result.recommendation).toContain(result.winner);
    });
  });

  describe('Test Report Generation', () => {
    it('should generate formatted test report', () => {
      const metricsA = [createMetrics('user_1', 'baseline')];
      const metricsB = [createMetrics('user_2', 'aggressive')];

      const testResult = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');
      const report = ABTestingFramework.generateTestReport(testResult);

      expect(report).toBeDefined();
      expect(report).toContain('A/B Test Results Report');
      expect(report).toContain('baseline');
      expect(report).toContain('aggressive');
    });

    it('should include sample sizes in report', () => {
      const metricsA = Array.from({ length: 15 }, (_, i) => createMetrics(`user_a_${i}`, 'baseline'));
      const metricsB = Array.from({ length: 20 }, (_, i) => createMetrics(`user_b_${i}`, 'adaptive'));

      const testResult = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'adaptive');
      const report = ABTestingFramework.generateTestReport(testResult);

      expect(report).toContain('N = 15');
      expect(report).toContain('N = 20');
    });

    it('should include effect size in report', () => {
      const metricsA = [createMetrics('user_1', 'baseline')];
      const metricsB = [createMetrics('user_2', 'aggressive')];

      const testResult = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');
      const report = ABTestingFramework.generateTestReport(testResult);

      expect(report).toContain('Effect Size');
      expect(report).toContain(testResult.effectSize.toFixed(3));
    });

    it('should include statistical significance in report', () => {
      const metricsA = [createMetrics('user_1', 'baseline')];
      const metricsB = [createMetrics('user_2', 'aggressive')];

      const testResult = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');
      const report = ABTestingFramework.generateTestReport(testResult);

      expect(report).toContain('Statistical Significance');
      if (testResult.statisticalSignificance) {
        expect(report).toContain('Yes');
      } else {
        expect(report).toContain('Not significant');
      }
    });

    it('should include key metrics comparison', () => {
      const metricsA = [createMetrics('user_1', 'baseline')];
      const metricsB = [createMetrics('user_2', 'aggressive')];

      const testResult = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');
      const report = ABTestingFramework.generateTestReport(testResult);

      expect(report).toContain('KEY METRICS COMPARISON');
    });

    it('should include next steps in report', () => {
      const metricsA = [createMetrics('user_1', 'baseline')];
      const metricsB = [createMetrics('user_2', 'aggressive')];

      const testResult = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');
      const report = ABTestingFramework.generateTestReport(testResult);

      expect(report).toContain('NEXT STEPS');
      expect(report).toContain('winning strategy');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle single user per group', () => {
      const metricsA = [createMetrics('user_1', 'baseline')];
      const metricsB = [createMetrics('user_2', 'aggressive')];

      const result = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');

      expect(result.sampleSizeA).toBe(1);
      expect(result.sampleSizeB).toBe(1);
    });

    it('should handle unequal sample sizes', () => {
      const metricsA = Array.from({ length: 5 }, (_, i) => createMetrics(`user_a_${i}`, 'baseline'));
      const metricsB = Array.from({ length: 50 }, (_, i) => createMetrics(`user_b_${i}`, 'aggressive'));

      const result = ABTestingFramework.compareStrategies(metricsA, metricsB, 'baseline', 'aggressive');

      expect(result.sampleSizeA).toBe(5);
      expect(result.sampleSizeB).toBe(50);
    });

    it('should handle perfect improvement', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_perfect',
        'baseline',
        'F',
        'A',
        0.0,
        1.0,
        3.0,
        0.5,
        28,
        5
      );

      expect(metrics.patternImprovement).toBeGreaterThan(0);
      expect(metrics.verificationIncrease).toBe(1.0);
      expect(metrics.queryEfficiency).toBe(2.5);
    });

    it('should handle no improvement', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_none',
        'baseline',
        'A',
        'A',
        0.85,
        0.85,
        1.2,
        1.2,
        14,
        3
      );

      expect(metrics.patternImprovement).toBe(0);
      expect(metrics.verificationIncrease).toBe(0);
      expect(metrics.queryEfficiency).toBe(0);
    });

    it('should handle negative metrics', () => {
      const metrics = ABTestingFramework.recordMetrics(
        'user_decline',
        'baseline',
        'A',
        'F',
        0.90,
        0.20,
        1.0,
        2.5,
        14,
        1
      );

      expect(metrics.patternImprovement).toBeLessThan(0);
      expect(metrics.verificationIncrease).toBeLessThan(0);
      expect(metrics.queryEfficiency).toBeLessThan(0);
    });

    it('should handle extreme satisfaction ratings', () => {
      const metricsLow = ABTestingFramework.recordMetrics('user_low', 'baseline', 'A', 'A', 0.8, 0.8, 1.2, 1.2, 14, 1);
      const metricsHigh = ABTestingFramework.recordMetrics('user_high', 'baseline', 'A', 'A', 0.8, 0.8, 1.2, 1.2, 14, 5);

      expect(metricsLow.satisfactionRating).toBe(1);
      expect(metricsHigh.satisfactionRating).toBe(5);
      expect(metricsHigh.engagementScore).toBeGreaterThan(metricsLow.engagementScore);
    });
  });

  describe('Three-Way Strategy Comparison', () => {
    it('should compare baseline vs aggressive', () => {
      const baseline = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_base_${i}`, 'baseline', { riskReduction: 0.2 })
      );
      const aggressive = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_agg_${i}`, 'aggressive', { riskReduction: 0.5 })
      );

      const result = ABTestingFramework.compareStrategies(baseline, aggressive, 'baseline', 'aggressive');
      expect(['baseline', 'aggressive']).toContain(result.winner);
    });

    it('should compare aggressive vs adaptive', () => {
      const aggressive = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_agg_${i}`, 'aggressive', { riskReduction: 0.4 })
      );
      const adaptive = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_adapt_${i}`, 'adaptive', { riskReduction: 0.6 })
      );

      const result = ABTestingFramework.compareStrategies(aggressive, adaptive, 'aggressive', 'adaptive');
      expect(['aggressive', 'adaptive']).toContain(result.winner);
    });

    it('should compare baseline vs adaptive', () => {
      const baseline = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_base_${i}`, 'baseline', { riskReduction: 0.1 })
      );
      const adaptive = Array.from({ length: 10 }, (_, i) =>
        createMetrics(`user_adapt_${i}`, 'adaptive', { riskReduction: 0.5 })
      );

      const result = ABTestingFramework.compareStrategies(baseline, adaptive, 'baseline', 'adaptive');
      expect(['baseline', 'adaptive']).toContain(result.winner);
    });
  });

  describe('Duration Impact Analysis', () => {
    it('should track duration of intervention', () => {
      const shortDuration = ABTestingFramework.recordMetrics('user_short', 'baseline', 'A', 'A', 0.8, 0.82, 1.2, 1.1, 7, 3);
      const longDuration = ABTestingFramework.recordMetrics('user_long', 'baseline', 'A', 'A', 0.8, 0.88, 1.2, 0.8, 28, 4);

      expect(shortDuration.durationDays).toBe(7);
      expect(longDuration.durationDays).toBe(28);
      expect(longDuration.engagementScore).toBeGreaterThan(shortDuration.engagementScore);
    });

    it('should calculate engagement based on duration and satisfaction', () => {
      const engagedMetrics = ABTestingFramework.recordMetrics('user_engaged', 'baseline', 'A', 'A', 0.8, 0.85, 1.2, 1.0, 14, 5);
      const disengagedMetrics = ABTestingFramework.recordMetrics('user_disengaged', 'baseline', 'A', 'A', 0.8, 0.82, 1.2, 1.15, 14, 1);

      expect(engagedMetrics.engagementScore).toBeGreaterThan(disengagedMetrics.engagementScore);
    });
  });
});
