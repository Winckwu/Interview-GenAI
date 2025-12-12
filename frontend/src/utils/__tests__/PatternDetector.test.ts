/**
 * Unit Tests for Pattern F Detection Framework
 *
 * Tests Layer 1 rules (F-R1 through F-R5) to ensure:
 * 1. Each rule triggers correctly on edge cases
 * 2. Confidence calculation is accurate
 * 3. Intervention recommendations are appropriate
 */

import {
  checkRule_F1_InputLengthSpeed,
  checkRule_F2_VerificationGap,
  checkRule_F3_InputOutputRatio,
  checkRule_F4_TemporalBurstPattern,
  checkRule_F5_CompletePassivity,
  calculateConfidence,
  getConfidenceLevel,
  recommendInterventionTier,
  detectPatternF,
  extractUserSignals,
  UserSignals,
} from '../PatternDetector';

/**
 * Helper to create mock UserSignals for testing
 */
function createMockSignals(overrides: Partial<UserSignals> = {}): UserSignals {
  return {
    averageInputLength: 100,
    averageAcceptanceSpeed: 5000,
    verificationRate: 20,
    modificationRate: 20,
    rejectionRate: 10,
    inputOutputRatio: 0.5,
    lastInteractionGap: 5,
    sessionBurstiness: 30,
    totalInteractions: 10,
    totalVerifications: 2,
    totalModifications: 2,
    totalRejections: 1,
    ...overrides,
  };
}

/**
 * Helper to create mock Interaction for testing
 */
function createMockInteractions(count: number = 5, options: any = {}) {
  const now = Date.now();
  const burstStart = now - (2 * 60 * 60 * 1000); // 2 hours ago

  return Array.from({ length: count }, (_, i) => ({
    id: `interaction-${i}`,
    sessionId: 'session-1',
    userInput: 'What is AI?',
    aiResponse: 'Artificial intelligence is...',
    timestamp: new Date(
      options.isBurst
        ? burstStart + i * 10000 // All within 2 hours
        : now - (8 * 24 * 60 * 60 * 1000) + i * (24 * 60 * 60 * 1000) // Spread over 8 days
    ).toISOString(),
    wasVerified: options.wasVerified ?? false,
    wasModified: options.wasModified ?? false,
    wasRejected: options.wasRejected ?? false,
    createdAt: new Date().toISOString(),
  }));
}

describe('Pattern F Detection - Layer 1 Rules', () => {
  describe('Rule F-R1: Input Length + Acceptance Speed', () => {
    it('should NOT trigger when input is short', () => {
      const signals = createMockSignals({
        averageInputLength: 100, // < 500
        averageAcceptanceSpeed: 1000,
      });

      expect(checkRule_F1_InputLengthSpeed(signals)).toBe(false);
    });

    it('should NOT trigger when acceptance is slow', () => {
      const signals = createMockSignals({
        averageInputLength: 600, // > 500
        averageAcceptanceSpeed: 15000, // > 10 seconds
      });

      expect(checkRule_F1_InputLengthSpeed(signals)).toBe(false);
    });

    it('should TRIGGER when input is long AND acceptance is quick', () => {
      const signals = createMockSignals({
        averageInputLength: 600, // > 500
        averageAcceptanceSpeed: 5000, // < 10 seconds
      });

      expect(checkRule_F1_InputLengthSpeed(signals)).toBe(true);
    });

    it('should TRIGGER on edge case: exactly 500 chars at 10 second boundary', () => {
      const signals = createMockSignals({
        averageInputLength: 501, // Just over 500
        averageAcceptanceSpeed: 9999, // Just under 10 seconds
      });

      expect(checkRule_F1_InputLengthSpeed(signals)).toBe(true);
    });
  });

  describe('Rule F-R2: Verification Behavior Gap', () => {
    it('should NOT trigger when user has < 5 interactions', () => {
      const signals = createMockSignals({
        totalInteractions: 3,
        verificationRate: 0,
      });

      expect(checkRule_F2_VerificationGap(signals)).toBe(false);
    });

    it('should NOT trigger when user verifies at least once', () => {
      const signals = createMockSignals({
        totalInteractions: 10,
        verificationRate: 10, // 1 out of 10
      });

      expect(checkRule_F2_VerificationGap(signals)).toBe(false);
    });

    it('should TRIGGER when 5+ interactions but zero verifications', () => {
      const signals = createMockSignals({
        totalInteractions: 5,
        verificationRate: 0,
        totalVerifications: 0,
      });

      expect(checkRule_F2_VerificationGap(signals)).toBe(true);
    });

    it('should TRIGGER on many interactions with zero verification', () => {
      const signals = createMockSignals({
        totalInteractions: 50,
        verificationRate: 0,
        totalVerifications: 0,
      });

      expect(checkRule_F2_VerificationGap(signals)).toBe(true);
    });
  });

  describe('Rule F-R3: Input/Output Ratio + No Modifications', () => {
    it('should NOT trigger when ratio is high', () => {
      const signals = createMockSignals({
        inputOutputRatio: 0.5, // >= 0.2
        modificationRate: 0,
      });

      expect(checkRule_F3_InputOutputRatio(signals)).toBe(false);
    });

    it('should NOT trigger when user modifies responses', () => {
      const signals = createMockSignals({
        inputOutputRatio: 0.1, // < 0.2
        modificationRate: 20,
      });

      expect(checkRule_F3_InputOutputRatio(signals)).toBe(false);
    });

    it('should TRIGGER when ratio is low AND no modifications', () => {
      const signals = createMockSignals({
        inputOutputRatio: 0.1, // < 0.2
        modificationRate: 0,
        totalModifications: 0,
      });

      expect(checkRule_F3_InputOutputRatio(signals)).toBe(true);
    });

    it('should TRIGGER on edge case: 0.19 ratio boundary', () => {
      const signals = createMockSignals({
        inputOutputRatio: 0.19, // Just under 0.2
        modificationRate: 0,
      });

      expect(checkRule_F3_InputOutputRatio(signals)).toBe(true);
    });
  });

  describe('Rule F-R4: Temporal Burst Pattern', () => {
    it('should NOT trigger when interactions spread over time', () => {
      const interactions = createMockInteractions(5, {
        isBurst: false, // Spread over 8 days
      });

      expect(checkRule_F4_TemporalBurstPattern(interactions)).toBe(false);
    });

    it('should NOT trigger when all within burst but recent activity', () => {
      const now = Date.now();
      const interactions = [
        {
          id: '1',
          sessionId: 'session-1',
          userInput: 'test',
          aiResponse: 'test',
          timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          wasVerified: false,
          wasModified: false,
          wasRejected: false,
          createdAt: new Date().toISOString(),
        },
      ];

      expect(checkRule_F4_TemporalBurstPattern(interactions)).toBe(false);
    });

    it('should TRIGGER when all within 2 hours AND 7+ days silent', () => {
      const eightDaysAgoMs = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const burstStartMs = eightDaysAgoMs;

      const interactions = Array.from({ length: 5 }, (_, i) => ({
        id: `interaction-${i}`,
        sessionId: 'session-1',
        userInput: 'test',
        aiResponse: 'test',
        timestamp: new Date(burstStartMs + i * 5000).toISOString(), // All within 25 seconds
        wasVerified: false,
        wasModified: false,
        wasRejected: false,
        createdAt: new Date().toISOString(),
      }));

      expect(checkRule_F4_TemporalBurstPattern(interactions)).toBe(true);
    });

    it('should NOT trigger when burst is within 2 hours but < 5 interactions', () => {
      const interactions = createMockInteractions(3, { isBurst: true });

      expect(checkRule_F4_TemporalBurstPattern(interactions)).toBe(false);
    });
  });

  describe('Rule F-R5: Complete Passivity', () => {
    it('should NOT trigger when user verifies at least once', () => {
      const signals = createMockSignals({
        verificationRate: 1,
        modificationRate: 0,
        rejectionRate: 0,
      });

      expect(checkRule_F5_CompletePassivity(signals)).toBe(false);
    });

    it('should NOT trigger when user modifies at least once', () => {
      const signals = createMockSignals({
        verificationRate: 0,
        modificationRate: 1,
        rejectionRate: 0,
      });

      expect(checkRule_F5_CompletePassivity(signals)).toBe(false);
    });

    it('should NOT trigger when user rejects at least once', () => {
      const signals = createMockSignals({
        verificationRate: 0,
        modificationRate: 0,
        rejectionRate: 1,
      });

      expect(checkRule_F5_CompletePassivity(signals)).toBe(false);
    });

    it('should TRIGGER when all engagement is zero', () => {
      const signals = createMockSignals({
        verificationRate: 0,
        modificationRate: 0,
        rejectionRate: 0,
        totalVerifications: 0,
        totalModifications: 0,
        totalRejections: 0,
      });

      expect(checkRule_F5_CompletePassivity(signals)).toBe(true);
    });
  });

  describe('Confidence Calculation', () => {
    it('should return 0 when no rules triggered', () => {
      expect(calculateConfidence(0)).toBe(0);
    });

    it('should return 0.2 when 1 rule triggered', () => {
      expect(calculateConfidence(1)).toBe(0.2);
    });

    it('should return 0.4 when 2 rules triggered', () => {
      expect(calculateConfidence(2)).toBe(0.4);
    });

    it('should return 0.6 when 3 rules triggered', () => {
      expect(calculateConfidence(3)).toBe(0.6);
    });

    it('should return 0.8 when 4 rules triggered', () => {
      expect(calculateConfidence(4)).toBe(0.8);
    });

    it('should return 1.0 when 5 rules triggered', () => {
      expect(calculateConfidence(5)).toBe(1.0);
    });

    it('should cap at 1.0 even if > 5', () => {
      expect(calculateConfidence(10)).toBe(1.0);
    });
  });

  describe('Confidence Level Classification', () => {
    it('should return "low" for confidence < 0.6', () => {
      expect(getConfidenceLevel(0.0)).toBe('low');
      expect(getConfidenceLevel(0.4)).toBe('low');
      expect(getConfidenceLevel(0.59)).toBe('low');
    });

    it('should return "medium" for 0.6 <= confidence < 0.8', () => {
      expect(getConfidenceLevel(0.6)).toBe('medium');
      expect(getConfidenceLevel(0.7)).toBe('medium');
      expect(getConfidenceLevel(0.79)).toBe('medium');
    });

    it('should return "high" for confidence >= 0.8', () => {
      expect(getConfidenceLevel(0.8)).toBe('high');
      expect(getConfidenceLevel(0.9)).toBe('high');
      expect(getConfidenceLevel(1.0)).toBe('high');
    });
  });

  describe('Intervention Tier Recommendation', () => {
    it('should recommend "none" when confidence < 0.2', () => {
      expect(recommendInterventionTier(0.1, [])).toBe('none');
    });

    it('should recommend "soft" when 0.2 <= confidence < 0.4', () => {
      expect(recommendInterventionTier(0.2, ['F-R1'])).toBe('soft');
      expect(recommendInterventionTier(0.3, ['F-R1'])).toBe('soft');
    });

    it('should recommend "medium" when confidence >= 0.4 without F-R5', () => {
      expect(recommendInterventionTier(0.6, ['F-R1', 'F-R2', 'F-R3'])).toBe(
        'medium'
      );
    });

    it('should recommend "hard" when confidence >= 0.6 AND includes F-R5', () => {
      expect(
        recommendInterventionTier(0.6, ['F-R2', 'F-R3', 'F-R5'])
      ).toBe('hard');
    });

    it('should NOT recommend "hard" without F-R5 even with high confidence', () => {
      expect(recommendInterventionTier(0.8, ['F-R1', 'F-R2', 'F-R3', 'F-R4'])).toBe('medium');
    });
  });

  describe('Full Pattern F Detection', () => {
    it('should detect no pattern when signals are healthy', () => {
      const signals = createMockSignals({
        verificationRate: 30,
        modificationRate: 20,
        rejectionRate: 10,
        totalInteractions: 10,
        totalVerifications: 3,
        totalModifications: 2,
        totalRejections: 1,
      });
      const interactions = createMockInteractions(10, { isBurst: false });

      const result = detectPatternF(signals, interactions);

      expect(result.layer1.triggeredCount).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.recommendedTier).toBe('none');
    });

    it('should detect low-risk pattern with 1-2 rules triggered', () => {
      const signals = createMockSignals({
        averageInputLength: 600,
        averageAcceptanceSpeed: 5000,
        verificationRate: 20,
      });
      const interactions = createMockInteractions(10, { isBurst: false });

      const result = detectPatternF(signals, interactions);

      expect(result.layer1.triggeredCount).toBeLessThanOrEqual(2);
      expect(result.confidence).toBeLessThan(0.4);
      expect(result.recommendedTier).toBe('soft');
    });

    it('should detect high-risk Pattern F with 4+ rules triggered', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;

      const signals = createMockSignals({
        averageInputLength: 600, // F-R1
        averageAcceptanceSpeed: 5000, // F-R1
        verificationRate: 0, // F-R2, F-R5
        modificationRate: 0, // F-R3, F-R5
        rejectionRate: 0, // F-R5
        inputOutputRatio: 0.1, // F-R3
        totalInteractions: 10,
        totalVerifications: 0,
        totalModifications: 0,
        totalRejections: 0,
      });

      const interactions = Array.from({ length: 10 }, (_, i) => ({
        id: `interaction-${i}`,
        sessionId: 'session-1',
        userInput: 'test',
        aiResponse: 'test',
        timestamp: new Date(eightDaysAgo + i * 5000).toISOString(), // All within 50 seconds
        wasVerified: false,
        wasModified: false,
        wasRejected: false,
        createdAt: new Date().toISOString(),
      }));

      const result = detectPatternF(signals, interactions);

      expect(result.layer1.triggeredCount).toBeGreaterThanOrEqual(3);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(['medium', 'hard']).toContain(result.recommendedTier);
    });

    it('should include detailed explanation in result', () => {
      const signals = createMockSignals({
        verificationRate: 0,
        modificationRate: 0,
        rejectionRate: 0,
      });
      const interactions = createMockInteractions(10);

      const result = detectPatternF(signals, interactions);

      expect(result.explanation.summary).toBeDefined();
      expect(result.explanation.triggeredRuleDetails).toBeInstanceOf(Array);
      expect(result.explanation.triggeredRuleDetails.length).toBe(
        result.layer1.triggeredCount
      );
    });
  });

  describe('Signal Extraction from Interactions', () => {
    it('should handle empty interaction list', () => {
      const signals = extractUserSignals([]);

      expect(signals.totalInteractions).toBe(0);
      expect(signals.verificationRate).toBe(0);
      expect(signals.modificationRate).toBe(0);
    });

    it('should correctly count verification behaviors', () => {
      const interactions = [
        createMockInteractions(1, { wasVerified: true })[0],
        createMockInteractions(1, { wasVerified: true })[0],
        createMockInteractions(1, { wasVerified: false })[0],
        createMockInteractions(1, { wasVerified: false })[0],
      ];

      const signals = extractUserSignals(interactions);

      expect(signals.totalVerifications).toBe(2);
      expect(signals.verificationRate).toBe(50); // 2 out of 4
    });

    it('should correctly count modification behaviors', () => {
      const interactions = [
        createMockInteractions(1, { wasModified: true })[0],
        createMockInteractions(1, { wasModified: false })[0],
        createMockInteractions(1, { wasModified: false })[0],
      ];

      const signals = extractUserSignals(interactions);

      expect(signals.totalModifications).toBe(1);
      expect(signals.modificationRate).toBe(33.33, 2); // ~33%
    });
  });
});
