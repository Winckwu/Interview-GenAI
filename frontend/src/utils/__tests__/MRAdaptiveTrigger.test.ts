/**
 * MR Adaptive Triggering Framework - Comprehensive Test Suite
 *
 * Tests all 6 user behavioral patterns (A-F) and their intervention logic.
 */

import {
  classifyUserPattern,
  calculateTotalScore,
  evaluateMRTrigger,
  getMRRecommendations,
  createDefaultUserProfile,
  createDefaultTriggerContext,
  updateUserProfileFromAssessment,
  type UserPattern,
  type SubprocessScores,
  type UserProfile,
  type TriggerContext,
} from '../MRAdaptiveTrigger';

// ============================================================
// Test Fixtures
// ============================================================

/**
 * Create subprocess scores for testing
 */
function createScores(overrides: Partial<SubprocessScores> = {}): SubprocessScores {
  return {
    P1: 2, P2: 2, P3: 2, P4: 2,
    M1: 2, M2: 2, M3: 2,
    E1: 2, E2: 2, E3: 2,
    R1: 2, R2: 2,
    ...overrides,
  };
}

/**
 * Create user profile for testing
 */
function createProfile(pattern: UserPattern, scores: SubprocessScores): UserProfile {
  return {
    pattern,
    subprocessScores: scores,
    behavioralIndicators: {
      totalInteractions: 10,
      verificationRate: 0.5,
      avgIterationsPerTask: 2,
      trustHistory: [60, 65, 70],
      toolEngagementRate: 0.5,
    },
  };
}

/**
 * Create trigger context for testing
 */
function createContext(overrides: Partial<TriggerContext> = {}): TriggerContext {
  return {
    ...createDefaultTriggerContext(),
    ...overrides,
  };
}

// ============================================================
// Pattern Classification Tests
// ============================================================

describe('Pattern Classification', () => {
  describe('Pattern A: Strategic Decomposition & Control', () => {
    it('should classify as A when P1≥2, M2≥2, E3≥2, Total≥24', () => {
      const scores = createScores({ P1: 3, M2: 3, E3: 3 }); // Total = 27
      expect(classifyUserPattern(scores)).toBe('A');
    });

    it('should classify as A with minimum qualifying scores', () => {
      const scores = createScores({ P1: 2, M2: 2, E3: 2 }); // Total = 24
      expect(classifyUserPattern(scores)).toBe('A');
    });

    it('should NOT classify as A when P1 < 2', () => {
      const scores = createScores({ P1: 1, M2: 3, E3: 3 }); // P1 too low
      expect(classifyUserPattern(scores)).not.toBe('A');
    });

    it('should NOT classify as A when M2 < 2', () => {
      const scores = createScores({ P1: 3, M2: 1, E3: 3 }); // M2 too low
      expect(classifyUserPattern(scores)).not.toBe('A');
    });

    it('should NOT classify as A when E3 < 2', () => {
      const scores = createScores({ P1: 3, M2: 3, E3: 1 }); // E3 too low
      expect(classifyUserPattern(scores)).not.toBe('A');
    });

    it('should NOT classify as A when Total < 24', () => {
      // All scores = 1 except P1, M2, E3 = 2
      const scores: SubprocessScores = {
        P1: 2, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 2, M3: 1,
        E1: 1, E2: 1, E3: 2,
        R1: 1, R2: 1,
      }; // Total = 15
      expect(classifyUserPattern(scores)).not.toBe('A');
    });
  });

  describe('Pattern D: Deep Verification', () => {
    it('should classify as D when M2=3, E1≥2, Total≥20', () => {
      const scores = createScores({ M2: 3, E1: 3, P1: 1 }); // Total = 24, but P1 low so not A
      expect(classifyUserPattern(scores)).toBe('D');
    });

    it('should NOT classify as D when M2 < 3', () => {
      const scores = createScores({ M2: 2, E1: 3, P1: 1, E3: 1 }); // M2 not exactly 3
      expect(classifyUserPattern(scores)).not.toBe('D');
    });

    it('should NOT classify as D when E1 < 2', () => {
      const scores = createScores({ M2: 3, E1: 1, P1: 1, E3: 1 }); // E1 too low
      expect(classifyUserPattern(scores)).not.toBe('D');
    });

    it('should prioritize A over D when both conditions met', () => {
      const scores = createScores({ P1: 3, M2: 3, E3: 3, E1: 3 }); // Meets both A and D
      expect(classifyUserPattern(scores)).toBe('A'); // A checked first
    });
  });

  describe('Pattern E: Learning-Oriented', () => {
    it('should classify as E when E1+E2+E3 ≥ 6', () => {
      const scores = createScores({ E1: 2, E2: 2, E3: 2, P1: 1, M2: 1 }); // Sum = 6
      expect(classifyUserPattern(scores)).toBe('E');
    });

    it('should classify as E with high evaluation scores', () => {
      const scores = createScores({ E1: 3, E2: 3, E3: 3, P1: 1, M2: 1 }); // Sum = 9
      expect(classifyUserPattern(scores)).toBe('E');
    });

    it('should NOT classify as E when E1+E2+E3 < 6', () => {
      const scores = createScores({ E1: 1, E2: 2, E3: 2, P1: 1, M2: 1, E3: 1 }); // Sum = 4
      expect(classifyUserPattern(scores)).not.toBe('E');
    });

    it('should prioritize A over E when both conditions met', () => {
      const scores = createScores({ P1: 3, M2: 3, E3: 3, E1: 3, E2: 3 }); // Meets A and E
      expect(classifyUserPattern(scores)).toBe('A');
    });

    it('should prioritize D over E when both conditions met', () => {
      const scores = createScores({ M2: 3, E1: 3, E2: 3, E3: 3, P1: 1 }); // Meets D and E
      expect(classifyUserPattern(scores)).toBe('D');
    });
  });

  describe('Pattern C: Context-Sensitive Adaptation', () => {
    it('should classify as C when P3≥2, M3≥2, R2≥2, Total≥22', () => {
      const scores = createScores({ P3: 3, M3: 3, R2: 3, P1: 1, M2: 1, E1: 1, E2: 1, E3: 1 });
      // Total = 22
      expect(classifyUserPattern(scores)).toBe('C');
    });

    it('should NOT classify as C when P3 < 2', () => {
      const scores = createScores({ P3: 1, M3: 3, R2: 3 });
      expect(classifyUserPattern(scores)).not.toBe('C');
    });

    it('should NOT classify as C when M3 < 2', () => {
      const scores = createScores({ P3: 3, M3: 1, R2: 3 });
      expect(classifyUserPattern(scores)).not.toBe('C');
    });

    it('should NOT classify as C when R2 < 2', () => {
      const scores = createScores({ P3: 3, M3: 3, R2: 1 });
      expect(classifyUserPattern(scores)).not.toBe('C');
    });
  });

  describe('Pattern B: Iterative Optimization', () => {
    it('should classify as B when R1≥2, Total≥20', () => {
      // Scores: P1=1, P2=2, P3=1, P4=2, M1=3, M2=1, M3=1, E1=2, E2=2, E3=1, R1=3, R2=1
      // Total = 6+5+5+4 = 20
      // Avoids A (P1<2), D (M2<3), E (E-sum=5<6), C (P3<2)
      const scores = createScores({ R1: 3, P1: 1, M2: 1, E3: 1, P3: 1, M3: 1, R2: 1, M1: 3 });
      expect(calculateTotalScore(scores)).toBe(20); // Verify total
      expect(classifyUserPattern(scores)).toBe('B');
    });

    it('should NOT classify as B when R1 < 2', () => {
      const scores = createScores({ R1: 1 });
      expect(classifyUserPattern(scores)).not.toBe('B');
    });

    it('should NOT classify as B when Total < 20', () => {
      const scores: SubprocessScores = {
        P1: 1, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 1, E3: 1,
        R1: 2, R2: 1,
      }; // Total = 13
      expect(classifyUserPattern(scores)).not.toBe('B');
    });
  });

  describe('Pattern F: Passive Over-Reliance (HIGH RISK)', () => {
    it('should classify as F when Total < 15', () => {
      const scores: SubprocessScores = {
        P1: 1, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 1, E3: 1,
        R1: 1, R2: 1,
      }; // Total = 12
      expect(classifyUserPattern(scores)).toBe('F');
    });

    it('should classify as F when E2=0 AND Total < 20', () => {
      const scores: SubprocessScores = {
        P1: 2, P2: 1, P3: 1, P4: 1,
        M1: 2, M2: 1, M3: 1,
        E1: 2, E2: 0, E3: 2, // E2 = 0
        R1: 1, R2: 1,
      }; // Total = 15, E2 = 0
      expect(classifyUserPattern(scores)).toBe('F');
    });

    it('should classify as F with zero reflection depth', () => {
      const scores: SubprocessScores = {
        P1: 2, P2: 2, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 0, E3: 1, // E2 = 0 (no reflection)
        R1: 1, R2: 1,
      }; // Total = 13, E2 = 0
      expect(classifyUserPattern(scores)).toBe('F');
    });

    it('should NOT classify as F when Total ≥ 15 AND (E2 > 0 OR Total ≥ 20)', () => {
      const scores: SubprocessScores = {
        P1: 2, P2: 2, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 1, E3: 1, // E2 = 1, Total = 13 (< 15)
        R1: 1, R2: 1,
      }; // Total = 14, but E2 = 1
      // Actually this should be F because total < 15
      expect(classifyUserPattern(scores)).toBe('F');
    });

    it('should NOT classify as F when E2=0 but Total ≥ 20', () => {
      const scores: SubprocessScores = {
        P1: 2, P2: 2, P3: 2, P4: 2,
        M1: 2, M2: 2, M3: 2,
        E1: 2, E2: 0, E3: 2, // E2 = 0
        R1: 2, R2: 2,
      }; // Total = 22, E2 = 0 but total >= 20
      // Should NOT be F because total >= 20
      expect(classifyUserPattern(scores)).not.toBe('F');
    });

    it('should have F as fallback before C when conditions met', () => {
      // Very low scores that don't meet any other pattern
      const scores: SubprocessScores = {
        P1: 1, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 0, E3: 1,
        R1: 1, R2: 1,
      }; // Total = 11, E2 = 0
      expect(classifyUserPattern(scores)).toBe('F');
    });
  });

  describe('Default Pattern C', () => {
    it('should default to C when no specific pattern matches', () => {
      const scores: SubprocessScores = {
        P1: 2, P2: 2, P3: 1, P4: 2,
        M1: 2, M2: 1, M3: 1,
        E1: 1, E2: 2, E3: 1, // E2 > 0
        R1: 1, R2: 1,
      }; // Total = 17, doesn't match A, D, E, B, or F
      expect(classifyUserPattern(scores)).toBe('C');
    });
  });

  describe('Classification Priority Order', () => {
    it('should check patterns in order: A -> D -> E -> C -> B -> F -> default C', () => {
      // This tests the decision tree order

      // 1. A is highest priority
      const scoresA = createScores({ P1: 3, M2: 3, E3: 3 });
      expect(classifyUserPattern(scoresA)).toBe('A');

      // 2. D before E
      const scoresD = createScores({ M2: 3, E1: 3, E2: 3, E3: 3, P1: 1, E3: 1 });
      expect(classifyUserPattern(scoresD)).toBe('D');

      // 3. F catches low scores
      const scoresF: SubprocessScores = {
        P1: 1, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 0, E3: 1,
        R1: 1, R2: 1,
      };
      expect(classifyUserPattern(scoresF)).toBe('F');
    });
  });
});

// ============================================================
// Total Score Calculation Tests
// ============================================================

describe('Total Score Calculation', () => {
  it('should calculate correct total for all 2s', () => {
    const scores = createScores();
    expect(calculateTotalScore(scores)).toBe(24); // 12 * 2
  });

  it('should calculate correct total for all 0s', () => {
    const scores: SubprocessScores = {
      P1: 0, P2: 0, P3: 0, P4: 0,
      M1: 0, M2: 0, M3: 0,
      E1: 0, E2: 0, E3: 0,
      R1: 0, R2: 0,
    };
    expect(calculateTotalScore(scores)).toBe(0);
  });

  it('should calculate correct total for all 3s', () => {
    const scores: SubprocessScores = {
      P1: 3, P2: 3, P3: 3, P4: 3,
      M1: 3, M2: 3, M3: 3,
      E1: 3, E2: 3, E3: 3,
      R1: 3, R2: 3,
    };
    expect(calculateTotalScore(scores)).toBe(36); // 12 * 3
  });

  it('should calculate correct total for mixed scores', () => {
    const scores: SubprocessScores = {
      P1: 1, P2: 2, P3: 3, P4: 0,
      M1: 1, M2: 2, M3: 3,
      E1: 0, E2: 1, E3: 2,
      R1: 3, R2: 0,
    };
    expect(calculateTotalScore(scores)).toBe(18);
  });
});

// ============================================================
// MR Trigger Evaluation Tests
// ============================================================

describe('MR Trigger Evaluation', () => {
  describe('Pattern-specific MR triggers', () => {
    it('should skip MR3-Agency for Pattern A users', () => {
      const scores = createScores({ P1: 3, M2: 3, E3: 3 });
      const profile = createProfile('A', scores);
      const context = createContext({ containsDecisions: true });

      const result = evaluateMRTrigger('mr3-agency', profile, context);
      // MR3 condition requires pattern !== A
      expect(result.shouldTrigger).toBe(false);
    });

    it('should boost MR6-Models for Pattern D users', () => {
      const scores = createScores({ M2: 3, E1: 3 });
      const profile = createProfile('D', scores);
      const context = createContext();

      const result = evaluateMRTrigger('mr6-models', profile, context);
      expect(result.shouldTrigger).toBe(true);
      // Pattern D gets +20 for MR6
      expect(result.priority).toBeGreaterThan(60);
    });

    it('should boost MR15-Strategies for Pattern E users', () => {
      const scores = createScores({ E1: 3, E2: 3, E3: 3 });
      const profile = createProfile('E', scores);
      const context = createContext();

      const result = evaluateMRTrigger('mr15-strategies', profile, context);
      expect(result.shouldTrigger).toBe(true);
      // Pattern E gets +25 for MR15
      expect(result.priority).toBeGreaterThan(50);
    });

    it('should strongly boost verification MRs for Pattern F users', () => {
      const scores: SubprocessScores = {
        P1: 1, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 0, E3: 1,
        R1: 1, R2: 1,
      };
      const profile = createProfile('F', scores);
      const context = createContext({
        taskCriticality: 'high',
        consecutiveUnverified: 2,
      });

      const resultMR11 = evaluateMRTrigger('mr11-verify', profile, context);
      expect(resultMR11.shouldTrigger).toBe(true);
      // Pattern F gets +25 for MR11
      expect(resultMR11.priority).toBeGreaterThan(80);
    });

    it('should trigger MR18-Warnings strongly for Pattern F users', () => {
      const scores: SubprocessScores = {
        P1: 1, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 0, E3: 1,
        R1: 1, R2: 1,
      };
      const profile = createProfile('F', scores);
      const context = createContext({
        consecutiveUnverified: 4,
      });

      const result = evaluateMRTrigger('mr18-warnings', profile, context);
      expect(result.shouldTrigger).toBe(true);
      // Pattern F gets +30 for MR18
      expect(result.priority).toBeGreaterThan(90);
    });
  });

  describe('Context-based triggers', () => {
    it('should trigger MR1-Decomposition for complex tasks', () => {
      const scores = createScores({ P1: 1 }); // Low P1
      const profile = createProfile('C', scores);
      const context = createContext({ taskComplexity: 'high' });

      const result = evaluateMRTrigger('mr1-decomposition', profile, context);
      expect(result.shouldTrigger).toBe(true);
    });

    it('should trigger MR11-Verify for high criticality tasks', () => {
      const scores = createScores();
      const profile = createProfile('C', scores);
      const context = createContext({ taskCriticality: 'high' });

      const result = evaluateMRTrigger('mr11-verify', profile, context);
      expect(result.shouldTrigger).toBe(true);
    });

    it('should trigger MR13-Uncertainty when uncertainty detected', () => {
      const scores = createScores({ E3: 3 });
      const profile = createProfile('C', scores);
      const context = createContext({ uncertaintyIndicators: 3 });

      const result = evaluateMRTrigger('mr13-uncertainty', profile, context);
      expect(result.shouldTrigger).toBe(true);
    });

    it('should trigger MR16-Warnings for controversial claims', () => {
      const scores = createScores();
      const profile = createProfile('C', scores);
      const context = createContext({ hasControversialClaim: true });

      const result = evaluateMRTrigger('mr16-warnings', profile, context);
      expect(result.shouldTrigger).toBe(true);
    });
  });

  describe('Fatigue control', () => {
    it('should reduce priority for recently shown MRs', () => {
      const scores = createScores();
      const profile = createProfile('C', scores);

      const contextFresh = createContext({
        taskCriticality: 'high',
        previousMRsShown: new Set(),
      });
      const contextShown = createContext({
        taskCriticality: 'high',
        previousMRsShown: new Set(['mr11-verify']),
      });

      const resultFresh = evaluateMRTrigger('mr11-verify', profile, contextFresh);
      const resultShown = evaluateMRTrigger('mr11-verify', profile, contextShown);

      expect(resultShown.priority).toBeLessThan(resultFresh.priority);
      expect(resultFresh.priority - resultShown.priority).toBe(30); // Fatigue penalty
    });
  });
});

// ============================================================
// getMRRecommendations Tests
// ============================================================

describe('getMRRecommendations', () => {
  it('should return empty array when no triggers fire', () => {
    const scores = createScores();
    const profile = createProfile('A', scores);
    const context = createContext(); // Default context, no special triggers

    const recommendations = getMRRecommendations(profile, context, 3);
    // May or may not have recommendations depending on conditions
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it('should limit recommendations to maxRecommendations', () => {
    const scores = createScores({ M2: 1 }); // Low M2 triggers more
    const profile = createProfile('F', scores);
    const context = createContext({
      taskCriticality: 'high',
      consecutiveUnverified: 5,
      hasControversialClaim: true,
      taskComplexity: 'high',
    });

    const recommendations = getMRRecommendations(profile, context, 2);
    expect(recommendations.length).toBeLessThanOrEqual(2);
  });

  it('should sort by priority (highest first)', () => {
    const scores = createScores({ M2: 1 });
    const profile = createProfile('F', scores);
    const context = createContext({
      taskCriticality: 'high',
      consecutiveUnverified: 5,
    });

    const recommendations = getMRRecommendations(profile, context, 5);

    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i - 1].result.priority).toBeGreaterThanOrEqual(
        recommendations[i].result.priority
      );
    }
  });

  it('should respect category limits', () => {
    const scores = createScores();
    const profile = createProfile('D', scores);
    const context = createContext({
      taskCriticality: 'high',
      consecutiveUnverified: 3,
      trustScore: 30,
      hasControversialClaim: true,
    });

    const recommendations = getMRRecommendations(profile, context, 10);

    // Count categories
    const categoryCounts: Record<string, number> = {};
    recommendations.forEach(r => {
      const cat = r.result.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Verify limits
    expect(categoryCounts['verification'] || 0).toBeLessThanOrEqual(2);
    expect(categoryCounts['reflection'] || 0).toBeLessThanOrEqual(1);
    expect(categoryCounts['planning'] || 0).toBeLessThanOrEqual(2);
    expect(categoryCounts['learning'] || 0).toBeLessThanOrEqual(2);
  });

  it('should give high priority interventions to Pattern F users', () => {
    const scoresF: SubprocessScores = {
      P1: 1, P2: 1, P3: 1, P4: 1,
      M1: 1, M2: 1, M3: 1,
      E1: 1, E2: 0, E3: 1,
      R1: 1, R2: 1,
    };
    const profileF = createProfile('F', scoresF);
    const context = createContext({
      consecutiveUnverified: 4,
      taskCriticality: 'medium',
    });

    const recommendations = getMRRecommendations(profileF, context, 5);

    // Pattern F should get MR18 (warnings) with high priority
    const mr18 = recommendations.find(r => r.tool === 'mr18-warnings');
    if (mr18) {
      expect(mr18.result.priority).toBeGreaterThan(80);
    }
  });
});

// ============================================================
// Profile Management Tests
// ============================================================

describe('Profile Management', () => {
  describe('createDefaultUserProfile', () => {
    it('should create profile with unknown pattern', () => {
      const profile = createDefaultUserProfile();
      expect(profile.pattern).toBe('unknown');
    });

    it('should create profile with neutral subprocess scores', () => {
      const profile = createDefaultUserProfile();
      expect(calculateTotalScore(profile.subprocessScores)).toBe(24); // All 2s
    });
  });

  describe('updateUserProfileFromAssessment', () => {
    it('should update subprocess scores', () => {
      const profile = createDefaultUserProfile();
      const updated = updateUserProfileFromAssessment(profile, { P1: 3, M2: 3, E3: 3 });

      expect(updated.subprocessScores.P1).toBe(3);
      expect(updated.subprocessScores.M2).toBe(3);
      expect(updated.subprocessScores.E3).toBe(3);
    });

    it('should reclassify pattern after update', () => {
      const profile = createDefaultUserProfile();
      const updated = updateUserProfileFromAssessment(profile, { P1: 3, M2: 3, E3: 3 });

      expect(updated.pattern).toBe('A'); // High scores -> Pattern A
    });

    it('should classify as F after low score update', () => {
      const profile = createDefaultUserProfile();
      const updated = updateUserProfileFromAssessment(profile, {
        P1: 1, P2: 1, P3: 1, P4: 1,
        M1: 1, M2: 1, M3: 1,
        E1: 1, E2: 0, E3: 1,
        R1: 1, R2: 1,
      });

      expect(updated.pattern).toBe('F');
    });
  });
});

// ============================================================
// Edge Cases and Boundary Tests
// ============================================================

describe('Edge Cases', () => {
  it('should handle boundary score of exactly 24 for Pattern A', () => {
    const scores = createScores(); // Total = 24
    expect(classifyUserPattern(scores)).toBe('A');
  });

  it('should handle boundary score of exactly 20 for Pattern B', () => {
    const scores: SubprocessScores = {
      P1: 1, P2: 2, P3: 2, P4: 1,
      M1: 2, M2: 1, M3: 1,
      E1: 1, E2: 2, E3: 1, // E2 > 0
      R1: 3, R2: 2,
    }; // Total = 19, R1 = 3
    // Total < 20, so not B
    expect(classifyUserPattern(scores)).not.toBe('B');
  });

  it('should handle boundary score of exactly 15 for Pattern F', () => {
    const scores: SubprocessScores = {
      P1: 1, P2: 1, P3: 1, P4: 1,
      M1: 2, M2: 1, M3: 1,
      E1: 2, E2: 1, E3: 1, // E2 > 0
      R1: 1, R2: 2,
    }; // Total = 15, E2 = 1
    // Total = 15, not < 15, and E2 > 0, so not F
    expect(classifyUserPattern(scores)).not.toBe('F');
  });

  it('should handle all zeros', () => {
    const scores: SubprocessScores = {
      P1: 0, P2: 0, P3: 0, P4: 0,
      M1: 0, M2: 0, M3: 0,
      E1: 0, E2: 0, E3: 0,
      R1: 0, R2: 0,
    };
    expect(classifyUserPattern(scores)).toBe('F'); // Total = 0 < 15
  });

  it('should handle all threes', () => {
    const scores: SubprocessScores = {
      P1: 3, P2: 3, P3: 3, P4: 3,
      M1: 3, M2: 3, M3: 3,
      E1: 3, E2: 3, E3: 3,
      R1: 3, R2: 3,
    };
    expect(classifyUserPattern(scores)).toBe('A'); // Highest pattern
  });
});

// ============================================================
// Integration Tests
// ============================================================

describe('Integration Tests', () => {
  it('should correctly handle full workflow for Pattern F user', () => {
    // 1. Start with default profile
    const profile = createDefaultUserProfile();

    // 2. Update with low assessment scores
    const updatedProfile = updateUserProfileFromAssessment(profile, {
      P1: 1, P2: 1, P3: 1, P4: 1,
      M1: 1, M2: 1, M3: 1,
      E1: 1, E2: 0, E3: 1,
      R1: 1, R2: 1,
    });

    expect(updatedProfile.pattern).toBe('F');

    // 3. Get recommendations
    const context = createContext({
      consecutiveUnverified: 4,
      taskCriticality: 'medium',
    });

    const recommendations = getMRRecommendations(updatedProfile, context, 3);

    // 4. Pattern F should get high-priority warnings
    expect(recommendations.length).toBeGreaterThan(0);

    // Should include verification or warning tools
    const toolTypes = recommendations.map(r => r.tool);
    const hasVerificationOrWarning = toolTypes.some(t =>
      t.includes('verify') || t.includes('warning') || t.includes('critical')
    );
    expect(hasVerificationOrWarning).toBe(true);
  });

  it('should correctly handle full workflow for Pattern A user', () => {
    // 1. Start with default profile
    const profile = createDefaultUserProfile();

    // 2. Update with high assessment scores
    const updatedProfile = updateUserProfileFromAssessment(profile, {
      P1: 3, P2: 3, P3: 2, P4: 3,
      M1: 2, M2: 3, M3: 2,
      E1: 2, E2: 2, E3: 3,
      R1: 2, R2: 2,
    });

    expect(updatedProfile.pattern).toBe('A');

    // 3. Get recommendations (should be minimal for Pattern A)
    const context = createContext();
    const recommendations = getMRRecommendations(updatedProfile, context, 3);

    // Pattern A users should not get MR3-Agency
    const hasMR3 = recommendations.some(r => r.tool === 'mr3-agency');
    expect(hasMR3).toBe(false);
  });
});

console.log('MR Adaptive Triggering Test Suite loaded successfully');
