/**
 * Hybrid Pattern Detection Tests
 * Validates primary + secondary pattern detection
 * Tests context-switching identification and intervention recommendations
 */

import { HybridPatternDetector } from '../components/HybridPatternDetector';
import {
  ALL_MOCK_USERS,
  EXPECTED_HYBRID_PATTERNS,
  NON_HYBRID_USERS,
  getMockUserById
} from './mock-member-check-data';

describe('Hybrid Pattern Detection System - 20 User Study', () => {
  describe('Setup and Hybrid User Identification', () => {
    it('should have 5 explicitly hybrid users with secondary patterns', () => {
      const hybridUserIds = Object.keys(EXPECTED_HYBRID_PATTERNS);
      expect(hybridUserIds).toHaveLength(5);
    });

    it('should have 15 non-hybrid users', () => {
      expect(NON_HYBRID_USERS).toHaveLength(15);
    });

    it('should correctly identify hybrid users from mock data', () => {
      const hybridUsersFromData = ALL_MOCK_USERS.filter((u) => u.secondaryPattern).map((u) => u.userId);
      expect(hybridUsersFromData).toHaveLength(5);
      expect(hybridUsersFromData).toEqual(expect.arrayContaining(Object.keys(EXPECTED_HYBRID_PATTERNS)));
    });

    it('should not have secondary patterns for non-hybrid users', () => {
      const nonHybridWithSecondary = ALL_MOCK_USERS.filter(
        (u) => NON_HYBRID_USERS.includes(u.userId) && u.secondaryPattern
      );
      expect(nonHybridWithSecondary).toHaveLength(0);
    });
  });

  describe('Primary Pattern Detection', () => {
    it('should accurately detect primary patterns for all users', () => {
      ALL_MOCK_USERS.forEach((user) => {
        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        expect(result.primaryPattern).toBeTruthy();
        expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(result.primaryPattern);
      });
    });

    it('should achieve >90% primary pattern accuracy', () => {
      let correctCount = 0;
      ALL_MOCK_USERS.forEach((user) => {
        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        if (result.primaryPattern === user.actualPattern) {
          correctCount++;
        }
      });

      const accuracy = (correctCount / ALL_MOCK_USERS.length) * 100;
      console.log(`Primary Pattern Accuracy: ${accuracy.toFixed(2)}%`);
      expect(accuracy).toBeGreaterThanOrEqual(90);
    });

    it('should prioritize Pattern F detection for over-reliance', () => {
      const patternFUsers = ALL_MOCK_USERS.filter((u) => u.actualPattern === 'F');
      const allDetectedCorrectly = patternFUsers.every((user) => {
        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );
        return result.primaryPattern === 'F';
      });

      expect(allDetectedCorrectly).toBe(true);
    });
  });

  describe('Secondary Pattern Detection for Hybrid Users', () => {
    it('should detect secondary patterns with reasonable accuracy', () => {
      const explicitHybridUserIds = Object.keys(EXPECTED_HYBRID_PATTERNS);
      let detectedHybridCount = 0;
      let hybridFromExplicitCount = 0;

      ALL_MOCK_USERS.forEach((user) => {
        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        // Count explicit hybrid users that are detected as hybrid
        if (explicitHybridUserIds.includes(user.userId) && result.isHybridPattern) {
          hybridFromExplicitCount++;
        }

        // Count all detected hybrid users
        if (result.isHybridPattern) {
          detectedHybridCount++;
        }
      });

      // Should detect at least 4 out of 5 explicit hybrid users
      console.log(
        `\nHybrid Detection: ${hybridFromExplicitCount}/5 explicit hybrid users detected as hybrid`
      );
      expect(hybridFromExplicitCount).toBeGreaterThanOrEqual(4);

      // Should detect 5-7 hybrid users total (explicit + inferred)
      expect(detectedHybridCount).toBeGreaterThanOrEqual(5);
      expect(detectedHybridCount).toBeLessThanOrEqual(7);
    });

    it('should accurately detect secondary patterns for hybrid users', () => {
      const hybridUserIds = Object.keys(EXPECTED_HYBRID_PATTERNS);
      const correctDetections = [];

      hybridUserIds.forEach((userId) => {
        const user = getMockUserById(userId);
        if (!user) return;

        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        const expectedSecondary = EXPECTED_HYBRID_PATTERNS[userId];
        const detected = result.secondaryPattern || 'none';
        const matches = detected === expectedSecondary;

        correctDetections.push({
          userId,
          expected: expectedSecondary,
          detected,
          matches
        });
      });

      const correctCount = correctDetections.filter((c) => c.matches).length;
      const accuracy = correctCount / correctDetections.length;
      console.log(`\nSecondary Pattern Detection Results (Explicit Hybrid Users):`);
      console.log(
        correctDetections
          .map((c) => `  ${c.userId}: Expected ${c.expected}, Got ${c.detected} ${c.matches ? '✓' : '✗'}`)
          .join('\n')
      );
      console.log(`Secondary Pattern Accuracy: ${(accuracy * 100).toFixed(2)}% (${correctCount}/${correctDetections.length})`);

      // Minimum 60% accuracy for explicitly defined hybrid patterns
      expect(accuracy).toBeGreaterThanOrEqual(0.6);
    });

    it('should provide confidence scores for pattern detection', () => {
      ALL_MOCK_USERS.forEach((user) => {
        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        expect(result.primaryConfidence).toBeGreaterThan(0);
        expect(result.primaryConfidence).toBeLessThanOrEqual(1);

        if (result.isHybridPattern) {
          expect(result.secondaryConfidence).toBeGreaterThan(0);
          expect(result.secondaryConfidence).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Context Switching Detection', () => {
    it('should identify context-switching triggers for hybrid users', () => {
      const hybridUserIds = Object.keys(EXPECTED_HYBRID_PATTERNS);

      hybridUserIds.forEach((userId) => {
        const user = getMockUserById(userId);
        if (!user) return;

        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        if (result.isHybridPattern) {
          expect(result.contextSwitchingTriggers).toBeTruthy();
          expect(result.contextSwitchingTriggers!.length).toBeGreaterThan(0);
        }
      });
    });

    it('should map contextual behaviors correctly', () => {
      const hybridUserIds = Object.keys(EXPECTED_HYBRID_PATTERNS);

      hybridUserIds.forEach((userId) => {
        const user = getMockUserById(userId);
        if (!user || !user.contextualBehaviors) return;

        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        if (result.contextualBehaviors) {
          Object.entries(result.contextualBehaviors).forEach(([context, behavior]) => {
            expect(behavior.context).toBeTruthy();
            expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(behavior.pattern);
            expect(behavior.queryRatio).toBeGreaterThan(0);
            expect(behavior.verificationRate).toBeGreaterThanOrEqual(0);
            expect(behavior.verificationRate).toBeLessThanOrEqual(1);
          });
        }
      });
    });
  });

  describe('Hybrid Description Generation', () => {
    it('should generate human-readable hybrid descriptions', () => {
      const hybridUserIds = Object.keys(EXPECTED_HYBRID_PATTERNS);

      hybridUserIds.forEach((userId) => {
        const user = getMockUserById(userId);
        if (!user) return;

        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        if (result.isHybridPattern) {
          expect(result.hybridDescription).toBeTruthy();
          expect(result.hybridDescription!.length).toBeGreaterThan(10);
          console.log(`${userId} (${user.userName}): ${result.hybridDescription}`);
        }
      });
    });
  });

  describe('Intervention Recommendations for Hybrid Users', () => {
    it('should generate customized interventions for hybrid patterns', () => {
      const hybridUserIds = Object.keys(EXPECTED_HYBRID_PATTERNS);

      hybridUserIds.forEach((userId) => {
        const user = getMockUserById(userId);
        const secondaryPattern = EXPECTED_HYBRID_PATTERNS[userId];

        const intervention = HybridPatternDetector.generateInterventionForHybrid(
          user!.actualPattern,
          secondaryPattern,
          user!.userType
        );

        expect(intervention.mainIntervention).toBeTruthy();
        expect(intervention.hybridIntervention).toBeTruthy();
        expect(intervention.contextualGuidance).toBeTruthy();

        console.log(`\n${userId} (${user!.userName}) - ${user!.actualPattern}+${secondaryPattern}:`);
        console.log(`  Main: ${intervention.mainIntervention}`);
        console.log(`  Hybrid: ${intervention.hybridIntervention}`);
        console.log(`  Context: ${intervention.contextualGuidance}`);
      });
    });

    it('should provide different interventions for efficient vs. struggling users', () => {
      const efficientHybrid = 'eff_001'; // A+C
      const strugglingHybrid = 'str_005'; // B+A

      const efficientUser = getMockUserById(efficientHybrid)!;
      const strugglingUser = getMockUserById(strugglingHybrid)!;

      const efficientIntervention = HybridPatternDetector.generateInterventionForHybrid(
        efficientUser.actualPattern,
        EXPECTED_HYBRID_PATTERNS[efficientHybrid],
        efficientUser.userType
      );

      const strugglingIntervention = HybridPatternDetector.generateInterventionForHybrid(
        strugglingUser.actualPattern,
        EXPECTED_HYBRID_PATTERNS[strugglingHybrid],
        strugglingUser.userType
      );

      // They should be different
      expect(efficientIntervention.contextualGuidance).not.toEqual(
        strugglingIntervention.contextualGuidance
      );

      console.log(`\nEfficient vs. Struggling Interventions:`);
      console.log(`Efficient Guidance: ${efficientIntervention.contextualGuidance}`);
      console.log(`Struggling Guidance: ${strugglingIntervention.contextualGuidance}`);
    });
  });

  describe('Hybrid Pattern Statistics', () => {
    it('should generate comprehensive hybrid pattern statistics', () => {
      const stats = {
        totalHybridUsers: 0,
        hybridByPrimaryPattern: {} as Record<string, number>,
        hybridByUserType: { efficient: 0, struggling: 0 },
        avgPrimaryConfidence: 0,
        avgSecondaryConfidence: 0,
        contextSwitchingTriggers: new Set<string>()
      };

      let totalPrimaryConfidence = 0;
      let totalSecondaryConfidence = 0;
      let secondaryCount = 0;

      ALL_MOCK_USERS.forEach((user) => {
        const result = HybridPatternDetector.detectHybridPattern(
          user.aiQueryCount,
          user.verificationRate,
          user.independenceRate,
          user.taskCount,
          user.contextAware,
          user.userType,
          user.actualPattern,
          user.contextualBehaviors
        );

        if (result.isHybridPattern) {
          stats.totalHybridUsers++;
          stats.hybridByPrimaryPattern[result.primaryPattern] =
            (stats.hybridByPrimaryPattern[result.primaryPattern] || 0) + 1;
          stats.hybridByUserType[user.userType]++;

          if (result.secondaryConfidence) {
            totalSecondaryConfidence += result.secondaryConfidence;
            secondaryCount++;
          }

          result.contextSwitchingTriggers?.forEach((trigger) =>
            stats.contextSwitchingTriggers.add(trigger)
          );
        }

        totalPrimaryConfidence += result.primaryConfidence;
      });

      stats.avgPrimaryConfidence = totalPrimaryConfidence / ALL_MOCK_USERS.length;
      stats.avgSecondaryConfidence = secondaryCount > 0 ? totalSecondaryConfidence / secondaryCount : 0;

      console.log(`
        ╔════════════════════════════════════╗
        ║   Hybrid Pattern Statistics        ║
        ╚════════════════════════════════════╝
        Total Hybrid Users:        ${stats.totalHybridUsers}
        Avg Primary Confidence:    ${stats.avgPrimaryConfidence.toFixed(3)}
        Avg Secondary Confidence:  ${stats.avgSecondaryConfidence.toFixed(3)}

        By Primary Pattern:
        ${Object.entries(stats.hybridByPrimaryPattern)
          .map(([pattern, count]) => `          ${pattern}: ${count} users`)
          .join('\n')}

        By User Type:
          Efficient: ${stats.hybridByUserType.efficient}
          Struggling: ${stats.hybridByUserType.struggling}

        Context Triggers Found: ${stats.contextSwitchingTriggers.size}
      `);

      // At least 5 explicit hybrid users, possibly more from inference
      expect(stats.totalHybridUsers).toBeGreaterThanOrEqual(5);
      expect(stats.totalHybridUsers).toBeLessThanOrEqual(7);
      expect(stats.avgPrimaryConfidence).toBeGreaterThan(0.5);
      expect(stats.contextSwitchingTriggers.size).toBeGreaterThan(0);
    });
  });
});
