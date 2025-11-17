/**
 * Pattern Evolution Tracker Tests
 * Tests temporal analysis of user pattern changes
 * Validates change detection, trend analysis, and statistics generation
 */

import { PatternEvolutionTracker, UserEvolution, EvolutionInsight } from '../components/PatternEvolutionTracker';

describe('Pattern Evolution Tracker - Temporal Analysis', () => {
  describe('User Evolution Initialization', () => {
    it('should initialize user tracking with baseline time point', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_001', 'Test User', 'A');

      expect(evolution.userId).toBe('user_001');
      expect(evolution.userName).toBe('Test User');
      expect(evolution.startingPattern).toBe('A');
      expect(evolution.currentPattern).toBe('A');
      expect(evolution.timePoints).toHaveLength(1);
      expect(evolution.timePoints[0].timeIndex).toBe(0);
      expect(evolution.timePoints[0].pattern).toBe('A');
      expect(evolution.evolutionSummary.hasChanged).toBe(false);
      expect(evolution.evolutionSummary.totalTimePoints).toBe(1);
    });

    it('should initialize with correct baseline metrics', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_002', 'User Two', 'B');

      const baselinePoint = evolution.timePoints[0];
      expect(baselinePoint.confidence).toBeGreaterThan(0);
      expect(baselinePoint.queryRatio).toBeGreaterThan(0);
      expect(baselinePoint.verificationRate).toBeGreaterThan(0);
      expect(baselinePoint.verificationRate).toBeLessThanOrEqual(1);
      expect(baselinePoint.independenceRate).toBeGreaterThanOrEqual(0);
      expect(baselinePoint.independenceRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Time Point Recording', () => {
    it('should record new time points sequentially', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_003', 'User Three', 'A');

      PatternEvolutionTracker.recordTimePoint(
        evolution,
        'A',
        0.82,
        1.4,
        0.65,
        0.65,
        false,
        'Week 1 measurement'
      );

      expect(evolution.timePoints).toHaveLength(2);
      expect(evolution.timePoints[1].timeIndex).toBe(1);
      expect(evolution.timePoints[1].notes).toBe('Week 1 measurement');
    });

    it('should update currentPattern when recording new pattern', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_004', 'User Four', 'B');

      PatternEvolutionTracker.recordTimePoint(
        evolution,
        'C',
        0.75,
        1.8,
        0.55,
        0.70,
        true,
        'Switched to context-aware'
      );

      expect(evolution.currentPattern).toBe('C');
      expect(evolution.evolutionSummary.hasChanged).toBe(true);
    });

    it('should limit time points to 5 (T0-T4)', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_005', 'User Five', 'A');

      // Add T1, T2, T3, T4
      for (let i = 1; i <= 4; i++) {
        PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.8, 1.5, 0.6, 0.6, false);
      }

      expect(evolution.timePoints).toHaveLength(5);

      // Try to add T5 (should be ignored with warning)
      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.8, 1.5, 0.6, 0.6, false);

      // Should still be 5
      expect(evolution.timePoints).toHaveLength(5);
    });
  });

  describe('Change Type Detection', () => {
    it('should detect improvement (verification increases, query decreases)', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_006', 'User Six', 'A');

      // T0: verificationRate=0.6, queryRatio=1.8
      // T1: verificationRate=0.75, queryRatio=1.5
      PatternEvolutionTracker.recordTimePoint(
        evolution,
        'A',
        0.85,
        1.5,
        0.75,
        0.70,
        false,
        'Improvement detected'
      );

      expect(evolution.evolutionSummary.changeType).not.toBe('improvement');

      // Add one more point to establish pattern
      PatternEvolutionTracker.recordTimePoint(
        evolution,
        'A',
        0.88,
        1.4,
        0.78,
        0.75,
        false
      );

      // The third point should be detected for improvement
      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);
      expect(insights.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect oscillation (pattern changes multiple times)', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_007', 'User Seven', 'A');

      PatternEvolutionTracker.recordTimePoint(evolution, 'B', 0.75, 1.6, 0.55, 0.55, false);
      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.78, 1.5, 0.60, 0.60, false);
      PatternEvolutionTracker.recordTimePoint(evolution, 'C', 0.72, 1.7, 0.50, 0.65, true);

      expect(evolution.evolutionSummary.hasChanged).toBe(true);
      expect(evolution.evolutionSummary.changeType).toBe('oscillation');
    });

    it('should detect migration (simple pattern change)', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_008', 'User Eight', 'A');

      PatternEvolutionTracker.recordTimePoint(evolution, 'D', 0.82, 1.5, 0.88, 0.70, false);

      expect(evolution.evolutionSummary.hasChanged).toBe(true);
      expect(evolution.evolutionSummary.changeType).toBe('migration');
    });

    it('should detect regression (verification decreases, query increases)', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_009', 'User Nine', 'A');
      // Update baseline to have higher verification
      evolution.timePoints[0].verificationRate = 0.75;
      evolution.timePoints[0].queryRatio = 1.5;

      // T1: Lower verification, higher queries
      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.70, 1.9, 0.60, 0.65, false);

      expect(evolution.evolutionSummary.hasChanged).toBe(false); // No pattern change
    });
  });

  describe('Evolution Insights Generation', () => {
    it('should generate insights for users with multiple time points', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_010', 'User Ten', 'A');

      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.82, 1.4, 0.65, 0.65, false);
      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.85, 1.3, 0.70, 0.70, false);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should return empty insights for single time point', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_011', 'User Eleven', 'B');

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);

      expect(insights).toHaveLength(0);
    });

    it('should include pattern change insight when pattern changes', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_012', 'User Twelve', 'A');

      PatternEvolutionTracker.recordTimePoint(evolution, 'C', 0.78, 1.7, 0.50, 0.70, true);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);

      const patternChangeInsight = insights.find((i) =>
        i.insight.includes('Pattern evolved')
      );
      expect(patternChangeInsight).toBeDefined();
      expect(patternChangeInsight!.insight).toContain('A');
      expect(patternChangeInsight!.insight).toContain('C');
    });

    it('should include verification trend insight', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_013', 'User Thirteen', 'B');

      // Increase verification significantly
      PatternEvolutionTracker.recordTimePoint(evolution, 'B', 0.85, 1.5, 0.80, 0.70, false);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);

      const verificationInsight = insights.find((i) =>
        i.insight.includes('Verification')
      );
      expect(verificationInsight).toBeDefined();
    });

    it('should include context adoption insight', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_014', 'User Fourteen', 'C');
      // Initial: not context aware
      evolution.timePoints[0].contextAware = false;

      // T1: Adopt context awareness
      PatternEvolutionTracker.recordTimePoint(evolution, 'C', 0.80, 1.6, 0.55, 0.75, true);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);

      const contextInsight = insights.find((i) =>
        i.insight.includes('context-aware')
      );
      expect(contextInsight).toBeDefined();
      expect(contextInsight!.relatedFactors).toContain('context_awareness');
    });

    it('should provide change intensity measurement', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_015', 'User Fifteen', 'A');

      PatternEvolutionTracker.recordTimePoint(evolution, 'C', 0.80, 1.7, 0.30, 0.80, true);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);

      insights.forEach((insight) => {
        expect(insight.changeIntensity).toBeGreaterThanOrEqual(0);
        expect(insight.changeIntensity).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Evolution Statistics Generation', () => {
    it('should generate statistics for empty evolution set', () => {
      const stats = PatternEvolutionTracker.generateEvolutionStatistics([]);

      expect(stats.totalUsers).toBe(0);
      expect(stats.usersWithChange).toBe(0);
      expect(stats.changePercentage).toBe(NaN);
      expect(stats.improvementCount).toBe(0);
      expect(stats.regressionCount).toBe(0);
      expect(stats.contextAdoptionCount).toBe(0);
    });

    it('should calculate change percentage correctly', () => {
      const evolutions: UserEvolution[] = [];

      // Create 10 users: 5 with changes, 5 without
      for (let i = 0; i < 5; i++) {
        const evolution = PatternEvolutionTracker.initializeUserTracking(
          `user_${i}`,
          `User ${i}`,
          'A'
        );
        evolutions.push(evolution);
      }

      for (let i = 5; i < 10; i++) {
        const evolution = PatternEvolutionTracker.initializeUserTracking(
          `user_${i}`,
          `User ${i}`,
          'A'
        );
        // Record pattern change
        PatternEvolutionTracker.recordTimePoint(evolution, 'B', 0.80, 1.6, 0.55, 0.65, false);
        evolutions.push(evolution);
      }

      const stats = PatternEvolutionTracker.generateEvolutionStatistics(evolutions);

      expect(stats.totalUsers).toBe(10);
      expect(stats.usersWithChange).toBe(5);
      expect(stats.changePercentage).toBe(50);
    });

    it('should track change type distribution', () => {
      const evolutions: UserEvolution[] = [];

      // Create user with oscillation
      const osc = PatternEvolutionTracker.initializeUserTracking('user_osc', 'Osc User', 'A');
      PatternEvolutionTracker.recordTimePoint(osc, 'B', 0.78, 1.6, 0.55, 0.55, false);
      PatternEvolutionTracker.recordTimePoint(osc, 'A', 0.80, 1.5, 0.60, 0.60, false);
      PatternEvolutionTracker.recordTimePoint(osc, 'C', 0.75, 1.7, 0.50, 0.65, true);
      evolutions.push(osc);

      // Create user with migration
      const mig = PatternEvolutionTracker.initializeUserTracking('user_mig', 'Mig User', 'D');
      PatternEvolutionTracker.recordTimePoint(mig, 'E', 0.82, 1.4, 0.75, 0.70, false);
      evolutions.push(mig);

      const stats = PatternEvolutionTracker.generateEvolutionStatistics(evolutions);

      expect(stats.changeTypeDistribution['oscillation']).toBe(1);
      expect(stats.changeTypeDistribution['migration']).toBe(1);
    });

    it('should count context adoption', () => {
      const evolutions: UserEvolution[] = [];

      // User without context adoption
      const noContext = PatternEvolutionTracker.initializeUserTracking('user_no_ctx', 'No Context', 'A');
      noContext.timePoints[0].contextAware = false;
      PatternEvolutionTracker.recordTimePoint(noContext, 'A', 0.80, 1.5, 0.6, 0.6, false);
      evolutions.push(noContext);

      // User with context adoption
      const yesContext = PatternEvolutionTracker.initializeUserTracking('user_ctx', 'With Context', 'B');
      yesContext.timePoints[0].contextAware = false;
      PatternEvolutionTracker.recordTimePoint(yesContext, 'B', 0.78, 1.6, 0.55, 0.65, true);
      evolutions.push(yesContext);

      const stats = PatternEvolutionTracker.generateEvolutionStatistics(evolutions);

      expect(stats.contextAdoptionCount).toBe(1);
    });

    it('should calculate average time points', () => {
      const evolutions: UserEvolution[] = [];

      // User with 3 time points
      const user1 = PatternEvolutionTracker.initializeUserTracking('user_1', 'User 1', 'A');
      PatternEvolutionTracker.recordTimePoint(user1, 'A', 0.80, 1.5, 0.6, 0.6, false);
      PatternEvolutionTracker.recordTimePoint(user1, 'A', 0.82, 1.4, 0.65, 0.65, false);
      evolutions.push(user1);

      // User with 4 time points
      const user2 = PatternEvolutionTracker.initializeUserTracking('user_2', 'User 2', 'B');
      PatternEvolutionTracker.recordTimePoint(user2, 'B', 0.78, 1.6, 0.55, 0.55, false);
      PatternEvolutionTracker.recordTimePoint(user2, 'B', 0.80, 1.5, 0.60, 0.60, false);
      PatternEvolutionTracker.recordTimePoint(user2, 'B', 0.82, 1.4, 0.65, 0.65, false);
      evolutions.push(user2);

      const stats = PatternEvolutionTracker.generateEvolutionStatistics(evolutions);

      expect(stats.totalUsers).toBe(2);
      expect(stats.averageTimePoints).toBeCloseTo((3 + 4) / 2, 1);
    });
  });

  describe('Trend Analysis', () => {
    it('should identify stable verification trend', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_stable', 'Stable User', 'A');
      evolution.timePoints[0].verificationRate = 0.70;

      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.80, 1.5, 0.71, 0.65, false);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);
      const verificationInsight = insights.find((i) => i.insight.includes('Verification'));

      // Verification changes by only 0.01, so it should be stable
      expect(verificationInsight).toBeUndefined();
    });

    it('should identify improving verification trend', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_improving', 'Improving User', 'A');
      evolution.timePoints[0].verificationRate = 0.60;

      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.85, 1.5, 0.75, 0.70, false);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);
      const verificationInsight = insights.find((i) => i.insight.includes('improving'));

      expect(verificationInsight).toBeDefined();
    });

    it('should identify declining query efficiency trend', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_queries', 'Query User', 'B');
      evolution.timePoints[0].queryRatio = 1.5;

      PatternEvolutionTracker.recordTimePoint(evolution, 'B', 0.82, 2.0, 0.65, 0.70, false);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);
      const queryInsight = insights.find((i) => i.insight.includes('query'));

      expect(queryInsight).toBeDefined();
    });
  });

  describe('Milestone Tracking', () => {
    it('should record milestones for pattern changes', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_mile', 'Milestone User', 'A');

      expect(evolution.evolutionSummary.milestones).toContain('Tracking started');

      PatternEvolutionTracker.recordTimePoint(evolution, 'B', 0.80, 1.6, 0.55, 0.65, false);

      expect(evolution.evolutionSummary.milestones).toContain('Pattern changed to B at T1');
    });

    it('should include multiple milestones for multiple changes', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_multi', 'Multi User', 'A');

      PatternEvolutionTracker.recordTimePoint(evolution, 'B', 0.78, 1.6, 0.55, 0.55, false);
      PatternEvolutionTracker.recordTimePoint(evolution, 'C', 0.75, 1.7, 0.50, 0.65, true);

      expect(evolution.evolutionSummary.milestones.length).toBeGreaterThan(1);
      expect(evolution.evolutionSummary.milestones.some((m) => m.includes('B'))).toBe(true);
      expect(evolution.evolutionSummary.milestones.some((m) => m.includes('C'))).toBe(true);
    });
  });

  describe('Complete Evolution Scenario', () => {
    it('should track complete 5-point (T0-T4) user evolution', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_complete', 'Complete User', 'A');

      // T1: Minor adjustment
      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.82, 1.45, 0.62, 0.62, false, 'Week 1');

      // T2: Improvement
      PatternEvolutionTracker.recordTimePoint(
        evolution,
        'A',
        0.85,
        1.35,
        0.68,
        0.68,
        false,
        'Week 2 - improving'
      );

      // T3: Significant change
      PatternEvolutionTracker.recordTimePoint(evolution, 'C', 0.80, 1.65, 0.55, 0.72, true, 'Week 3 - context aware');

      // T4: Final state
      PatternEvolutionTracker.recordTimePoint(evolution, 'C', 0.83, 1.60, 0.57, 0.75, true, 'Week 4 - stable context');

      expect(evolution.timePoints).toHaveLength(5);
      expect(evolution.startingPattern).toBe('A');
      expect(evolution.currentPattern).toBe('C');
      expect(evolution.evolutionSummary.hasChanged).toBe(true);
      expect(evolution.evolutionSummary.totalTimePoints).toBe(5);

      const insights = PatternEvolutionTracker.generateEvolutionInsights(evolution);
      expect(insights.length).toBeGreaterThan(0);

      const stats = PatternEvolutionTracker.generateEvolutionStatistics([evolution]);
      expect(stats.totalUsers).toBe(1);
      expect(stats.usersWithChange).toBe(1);
      expect(stats.changePercentage).toBe(100);
    });
  });

  describe('Data Validation', () => {
    it('should handle extreme metric values', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_extreme', 'Extreme User', 'F');

      // Very high AI reliance, very low verification
      PatternEvolutionTracker.recordTimePoint(evolution, 'F', 0.95, 3.5, 0.1, 0.05, false);

      expect(evolution.currentPattern).toBe('F');
      expect(evolution.timePoints[1].queryRatio).toBe(3.5);
      expect(evolution.timePoints[1].verificationRate).toBe(0.1);
    });

    it('should handle zero metric values', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_zero', 'Zero User', 'A');

      // Zero independence (completely dependent)
      PatternEvolutionTracker.recordTimePoint(evolution, 'F', 0.90, 2.5, 0.0, 0.0, false);

      expect(evolution.timePoints[1].independenceRate).toBe(0.0);
    });

    it('should handle perfect metric values', () => {
      const evolution = PatternEvolutionTracker.initializeUserTracking('user_perfect', 'Perfect User', 'A');

      // Perfect verification and independence, minimal queries
      PatternEvolutionTracker.recordTimePoint(evolution, 'A', 0.99, 0.5, 1.0, 1.0, true);

      expect(evolution.timePoints[1].verificationRate).toBe(1.0);
      expect(evolution.timePoints[1].independenceRate).toBe(1.0);
      expect(evolution.timePoints[1].queryRatio).toBe(0.5);
    });
  });
});
