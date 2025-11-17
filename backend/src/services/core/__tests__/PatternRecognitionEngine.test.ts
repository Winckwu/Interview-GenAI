/**
 * Tests for PatternRecognitionEngine
 * Coverage: Pattern detection accuracy, boundary conditions, recommendations
 */

import PatternRecognitionEngine, { UserBehaviorData } from '../PatternRecognitionEngine';

describe('PatternRecognitionEngine', () => {
  let engine: PatternRecognitionEngine;

  beforeEach(() => {
    engine = new PatternRecognitionEngine();
  });

  /**
   * Test Pattern A: Strategic Use
   * Characteristics: Long prompts, high verification, regular iteration, high independence
   */
  describe('Pattern A Detection (Strategic Use)', () => {
    it('should identify Pattern A with strategic user behavior', () => {
      const strategicUser: UserBehaviorData = {
        userId: 'strategic-user',
        totalSessions: 50,
        avgPromptLength: 35,
        verificationRate: 0.75,
        iterationRate: 0.5,
        questionsAskedRate: 0.4,
        acceptanceRate: 0.6,
        independenceRate: 0.8,
        reflectionFrequency: 0.5,
        strategyDiversity: 0.7,
        totalTimeSpent: 500
      };

      const analysis = engine.analyzeUserBehavior(strategicUser);

      expect(analysis.primaryPattern).toBe('A');
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.riskLevel).toBe('low');
    });

    it('should generate evidence for Pattern A', () => {
      const strategicUser: UserBehaviorData = {
        userId: 'strategic-user',
        totalSessions: 50,
        avgPromptLength: 30,
        verificationRate: 0.7,
        iterationRate: 0.4,
        questionsAskedRate: 0.3,
        acceptanceRate: 0.65,
        independenceRate: 0.75,
        reflectionFrequency: 0.4,
        strategyDiversity: 0.6,
        totalTimeSpent: 450
      };

      const analysis = engine.analyzeUserBehavior(strategicUser);

      expect(analysis.evidence.length).toBeGreaterThan(0);
      expect(analysis.evidence.join().toLowerCase()).toContain('planning');
    });
  });

  /**
   * Test Pattern B: Iterative Optimization
   * Characteristics: High iteration rate, asks questions, selective acceptance
   */
  describe('Pattern B Detection (Iterative Optimization)', () => {
    it('should identify Pattern B with iterative behavior', () => {
      const iterativeUser: UserBehaviorData = {
        userId: 'iterative-user',
        totalSessions: 50,
        avgPromptLength: 18,
        verificationRate: 0.5,
        iterationRate: 0.7,
        questionsAskedRate: 0.6,
        acceptanceRate: 0.5,
        independenceRate: 0.6,
        reflectionFrequency: 0.4,
        strategyDiversity: 0.75,
        totalTimeSpent: 600
      };

      const analysis = engine.analyzeUserBehavior(iterativeUser);

      expect(analysis.primaryPattern).toBe('B');
      expect(analysis.riskLevel).toBe('low');
    });

    it('should recommend MR5 for Pattern B', () => {
      const iterativeUser: UserBehaviorData = {
        userId: 'iterative-user',
        totalSessions: 50,
        avgPromptLength: 20,
        verificationRate: 0.5,
        iterationRate: 0.6,
        questionsAskedRate: 0.5,
        acceptanceRate: 0.5,
        independenceRate: 0.6,
        reflectionFrequency: 0.4,
        strategyDiversity: 0.7,
        totalTimeSpent: 550
      };

      const analysis = engine.analyzeUserBehavior(iterativeUser);

      expect(analysis.recommendations.some(r => r.includes('MR5'))).toBe(true);
    });
  });

  /**
   * Test Pattern C: Adaptive Adjustment
   * Characteristics: Strategy diversity, moderate prompts, reflection
   */
  describe('Pattern C Detection (Adaptive Adjustment)', () => {
    it('should identify Pattern C with diverse strategy use', () => {
      const adaptiveUser: UserBehaviorData = {
        userId: 'adaptive-user',
        totalSessions: 50,
        avgPromptLength: 25,
        verificationRate: 0.5,
        iterationRate: 0.4,
        questionsAskedRate: 0.4,
        acceptanceRate: 0.7,
        independenceRate: 0.65,
        reflectionFrequency: 0.5,
        strategyDiversity: 0.85,
        totalTimeSpent: 480
      };

      const analysis = engine.analyzeUserBehavior(adaptiveUser);

      expect(analysis.primaryPattern).toBe('C');
      expect(analysis.riskLevel).toBe('low');
    });
  });

  /**
   * Test Pattern D: Deep Verification
   * Characteristics: High verification rate, asks questions, deep reflection
   */
  describe('Pattern D Detection (Deep Verification)', () => {
    it('should identify Pattern D with verification focus', () => {
      const verifyingUser: UserBehaviorData = {
        userId: 'verifying-user',
        totalSessions: 50,
        avgPromptLength: 22,
        verificationRate: 0.8,
        iterationRate: 0.3,
        questionsAskedRate: 0.7,
        acceptanceRate: 0.55,
        independenceRate: 0.65,
        reflectionFrequency: 0.6,
        strategyDiversity: 0.6,
        totalTimeSpent: 520
      };

      const analysis = engine.analyzeUserBehavior(verifyingUser);

      expect(analysis.primaryPattern).toBe('D');
      expect(analysis.riskLevel).toBe('low');
    });

    it('should recommend MR11 for Pattern D', () => {
      const verifyingUser: UserBehaviorData = {
        userId: 'verifying-user',
        totalSessions: 50,
        avgPromptLength: 20,
        verificationRate: 0.8,
        iterationRate: 0.3,
        questionsAskedRate: 0.7,
        acceptanceRate: 0.55,
        independenceRate: 0.65,
        reflectionFrequency: 0.6,
        strategyDiversity: 0.6,
        totalTimeSpent: 500
      };

      const analysis = engine.analyzeUserBehavior(verifyingUser);

      expect(analysis.recommendations.some(r => r.includes('MR11'))).toBe(true);
    });
  });

  /**
   * Test Pattern E: Teaching & Learning
   * Characteristics: High reflection, curiosity-driven, iterative learning
   */
  describe('Pattern E Detection (Teaching & Learning)', () => {
    it('should identify Pattern E with learning focus', () => {
      const learningUser: UserBehaviorData = {
        userId: 'learning-user',
        totalSessions: 50,
        avgPromptLength: 20,
        verificationRate: 0.5,
        iterationRate: 0.45,
        questionsAskedRate: 0.6,
        acceptanceRate: 0.7,
        independenceRate: 0.6,
        reflectionFrequency: 0.75,
        strategyDiversity: 0.65,
        totalTimeSpent: 700
      };

      const analysis = engine.analyzeUserBehavior(learningUser);

      expect(analysis.primaryPattern).toBe('E');
      expect(analysis.riskLevel).toBe('low');
    });
  });

  /**
   * Test Pattern F: Passive Over-Reliance (CRITICAL)
   * Characteristics: Minimal verification, short prompts, uncritical acceptance
   */
  describe('Pattern F Detection (Passive Over-Reliance)', () => {
    it('should identify Pattern F with over-reliance behavior', () => {
      const overRelyingUser: UserBehaviorData = {
        userId: 'over-relying-user',
        totalSessions: 50,
        avgPromptLength: 8,
        verificationRate: 0.05,
        iterationRate: 0.05,
        questionsAskedRate: 0.1,
        acceptanceRate: 0.98,
        independenceRate: 0.2,
        reflectionFrequency: 0.05,
        strategyDiversity: 0.2,
        totalTimeSpent: 150
      };

      const analysis = engine.analyzeUserBehavior(overRelyingUser);

      expect(analysis.primaryPattern).toBe('F');
      expect(analysis.riskLevel).toMatch(/high|critical/);
    });

    it('should flag Pattern F as critical risk', () => {
      const overRelyingUser: UserBehaviorData = {
        userId: 'over-relying-user',
        totalSessions: 50,
        avgPromptLength: 5,
        verificationRate: 0.01,
        iterationRate: 0.02,
        questionsAskedRate: 0.05,
        acceptanceRate: 0.99,
        independenceRate: 0.15,
        reflectionFrequency: 0.02,
        strategyDiversity: 0.1,
        totalTimeSpent: 100
      };

      const analysis = engine.analyzeUserBehavior(overRelyingUser);

      expect(analysis.riskLevel).toBe('critical');
    });

    it('should recommend MR18 for Pattern F', () => {
      const overRelyingUser: UserBehaviorData = {
        userId: 'over-relying-user',
        totalSessions: 50,
        avgPromptLength: 7,
        verificationRate: 0.05,
        iterationRate: 0.05,
        questionsAskedRate: 0.1,
        acceptanceRate: 0.97,
        independenceRate: 0.2,
        reflectionFrequency: 0.05,
        strategyDiversity: 0.2,
        totalTimeSpent: 150
      };

      const analysis = engine.analyzeUserBehavior(overRelyingUser);

      expect(analysis.recommendations.some(r => r.includes('MR18'))).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('⚠️'))).toBe(true);
    });
  });

  /**
   * Boundary Condition Tests
   */
  describe('Boundary Conditions', () => {
    it('should handle mixed Pattern A-B behavior', () => {
      const mixedUser: UserBehaviorData = {
        userId: 'mixed-user',
        totalSessions: 50,
        avgPromptLength: 28,
        verificationRate: 0.65,
        iterationRate: 0.55,
        questionsAskedRate: 0.45,
        acceptanceRate: 0.6,
        independenceRate: 0.7,
        reflectionFrequency: 0.45,
        strategyDiversity: 0.7,
        totalTimeSpent: 500
      };

      const analysis = engine.analyzeUserBehavior(mixedUser);

      expect(['A', 'B'].includes(analysis.primaryPattern)).toBe(true);
      expect(analysis.secondaryPattern).toBeDefined();
    });

    it('should handle Pattern F with mixed indicators', () => {
      // User has some good indicators but overall passive
      const mixedOverRelying: UserBehaviorData = {
        userId: 'mixed-over-relying',
        totalSessions: 50,
        avgPromptLength: 12,
        verificationRate: 0.15,
        iterationRate: 0.08,
        questionsAskedRate: 0.12,
        acceptanceRate: 0.92,
        independenceRate: 0.35,
        reflectionFrequency: 0.1,
        strategyDiversity: 0.3,
        totalTimeSpent: 200
      };

      const analysis = engine.analyzeUserBehavior(mixedOverRelying);

      // Should still detect as Pattern F despite some better metrics
      expect(analysis.riskLevel).toMatch(/high|critical/);
    });

    it('should require minimum session data', () => {
      const minimalData: UserBehaviorData = {
        userId: 'minimal-user',
        totalSessions: 0,
        avgPromptLength: 20,
        verificationRate: 0.5,
        iterationRate: 0.3,
        questionsAskedRate: 0.3,
        acceptanceRate: 0.7,
        independenceRate: 0.6,
        reflectionFrequency: 0.3,
        strategyDiversity: 0.5,
        totalTimeSpent: 0
      };

      expect(() => engine.analyzeUserBehavior(minimalData)).toThrow();
    });

    it('should handle critical boundary (F threshold)', () => {
      // Just barely Pattern F
      const borderlineF: UserBehaviorData = {
        userId: 'borderline-f',
        totalSessions: 50,
        avgPromptLength: 10,
        verificationRate: 0.2,
        iterationRate: 0.1,
        questionsAskedRate: 0.2,
        acceptanceRate: 0.94,
        independenceRate: 0.3,
        reflectionFrequency: 0.1,
        strategyDiversity: 0.3,
        totalTimeSpent: 200
      };

      const analysis = engine.analyzeUserBehavior(borderlineF);

      // Should be warned even if not 100% Pattern F
      expect(analysis.riskLevel).toMatch(/medium|high|critical/);
    });
  });

  /**
   * Pattern Score Normalization
   */
  describe('Pattern Score Normalization', () => {
    it('should normalize pattern scores to sum to 100', () => {
      const user: UserBehaviorData = {
        userId: 'test-user',
        totalSessions: 50,
        avgPromptLength: 20,
        verificationRate: 0.5,
        iterationRate: 0.4,
        questionsAskedRate: 0.3,
        acceptanceRate: 0.7,
        independenceRate: 0.6,
        reflectionFrequency: 0.3,
        strategyDiversity: 0.5,
        totalTimeSpent: 300
      };

      const analysis = engine.analyzeUserBehavior(user);

      const total = Object.values(analysis.patternScores).reduce((sum, score) => sum + score, 0);
      expect(Math.round(total)).toBe(100);
    });

    it('should rank patterns correctly', () => {
      const strategicUser: UserBehaviorData = {
        userId: 'strategic-user',
        totalSessions: 50,
        avgPromptLength: 35,
        verificationRate: 0.75,
        iterationRate: 0.5,
        questionsAskedRate: 0.4,
        acceptanceRate: 0.6,
        independenceRate: 0.8,
        reflectionFrequency: 0.5,
        strategyDiversity: 0.7,
        totalTimeSpent: 500
      };

      const analysis = engine.analyzeUserBehavior(strategicUser);

      // Pattern A should have highest score
      const scores = Object.entries(analysis.patternScores)
        .map(([pattern, score]) => ({ pattern, score }))
        .sort((a, b) => b.score - a.score);

      expect(scores[0].pattern).toBe('A');
      expect(scores[0].score).toBeGreaterThan(scores[1].score);
    });
  });

  /**
   * Confidence Calculation
   */
  describe('Confidence Scores', () => {
    it('should have high confidence for clear patterns', () => {
      const clearPatternF: UserBehaviorData = {
        userId: 'clear-f',
        totalSessions: 50,
        avgPromptLength: 5,
        verificationRate: 0.02,
        iterationRate: 0.02,
        questionsAskedRate: 0.05,
        acceptanceRate: 0.99,
        independenceRate: 0.1,
        reflectionFrequency: 0.01,
        strategyDiversity: 0.1,
        totalTimeSpent: 100
      };

      const analysis = engine.analyzeUserBehavior(clearPatternF);

      expect(analysis.confidence).toBeGreaterThan(0.7);
    });

    it('should have low confidence for mixed patterns', () => {
      const mixedUser: UserBehaviorData = {
        userId: 'mixed-user',
        totalSessions: 50,
        avgPromptLength: 15,
        verificationRate: 0.4,
        iterationRate: 0.4,
        questionsAskedRate: 0.35,
        acceptanceRate: 0.75,
        independenceRate: 0.5,
        reflectionFrequency: 0.35,
        strategyDiversity: 0.45,
        totalTimeSpent: 300
      };

      const analysis = engine.analyzeUserBehavior(mixedUser);

      expect(analysis.confidence).toBeLessThan(0.6);
    });
  });
});
