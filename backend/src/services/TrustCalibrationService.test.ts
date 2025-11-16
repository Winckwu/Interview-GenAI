/**
 * Test Suite for Trust Calibration Service
 *
 * Tests MR9 functionality:
 * - Historical accuracy matrix
 * - Trust recommendations
 * - User calibration tracking
 * - Context-sensitive warnings
 */

import {
  TrustCalibrationService,
  UserHistory,
  UserVerificationRecord,
  TaskType,
  AIModel,
} from './TrustCalibrationService';

describe('TrustCalibrationService', () => {
  let service: TrustCalibrationService;

  beforeEach(() => {
    service = new TrustCalibrationService();
  });

  // ============================================================
  // Test Case 1: Academic Citation (High Risk)
  // ============================================================

  describe('Academic Citation Task', () => {
    it('should recommend very low trust for academic citations', () => {
      const result = service.recommendTrust('academic_citation', 'gpt-4-turbo');

      // Historical accuracy is 17%, should recommend 5-10% trust
      expect(result.historicalAccuracy).toBe(0.17);
      expect(result.recommendedTrust).toBeLessThanOrEqual(0.10);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('HIGH RISK');
    });

    it('should detect over-trust pattern for academic citations', () => {
      const userHistory: UserHistory = {
        userId: 'I34', // Economics PhD from MR13
        verifications: [
          {
            taskType: 'academic_citation',
            aiModel: 'gpt-4-turbo',
            wasCorrect: false,
            timestamp: new Date('2024-10-01'),
            userTrustLevel: 0.70, // User trusted 70%
          },
          {
            taskType: 'academic_citation',
            aiModel: 'gpt-4-turbo',
            wasCorrect: false,
            timestamp: new Date('2024-10-02'),
            userTrustLevel: 0.65,
          },
          {
            taskType: 'academic_citation',
            aiModel: 'gpt-4-turbo',
            wasCorrect: true,
            timestamp: new Date('2024-10-03'),
            userTrustLevel: 0.60,
          },
        ],
        totalInteractions: 3,
      };

      const result = service.recommendTrust('academic_citation', 'gpt-4-turbo', userHistory);

      // User calibration should be positive (over-trust)
      expect(result.userCalibration).toBeGreaterThan(0.3); // 65% avg trust - 17% accuracy
      expect(result.warning).toContain('CALIBRATION WARNING');
      expect(result.rationale.userPattern).toContain('over-trust');
    });
  });

  // ============================================================
  // Test Case 2: Grammar Check (Safe Task)
  // ============================================================

  describe('Grammar Check Task', () => {
    it('should recommend high trust for grammar checking', () => {
      const result = service.recommendTrust('grammar_check', 'gpt-4-turbo');

      // Historical accuracy is 85%, should recommend ~80% trust
      expect(result.historicalAccuracy).toBe(0.85);
      expect(result.recommendedTrust).toBeGreaterThanOrEqual(0.75);
      expect(result.recommendedTrust).toBeLessThanOrEqual(0.85);
      expect(result.riskLevel).toBe('safe');
      expect(result.warning).toBeUndefined();
    });
  });

  // ============================================================
  // Test Case 3: Legal Compliance (Critical Risk)
  // ============================================================

  describe('Legal Compliance Task', () => {
    it('should flag legal tasks as critical with zero-tolerance warning', () => {
      const result = service.recommendTrust('legal_compliance', 'gpt-4-turbo');

      expect(result.riskLevel).toBe('critical');
      expect(result.recommendedTrust).toBeLessThanOrEqual(0.05);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('CRITICAL');
      expect(result.warning).toContain('DO NOT use AI output directly');
      expect(result.rationale.contextFactors).toContain('Zero-tolerance domain: errors can have severe consequences');
    });
  });

  // ============================================================
  // Test Case 4: User Calibration Analysis
  // ============================================================

  describe('User Calibration Analysis', () => {
    it('should identify over-trust pattern across multiple tasks', () => {
      const userHistory: UserHistory = {
        userId: 'I2', // Product manager from MR9
        verifications: [
          // Market data: trusted 70%, should be 30%
          {
            taskType: 'market_data',
            aiModel: 'gpt-4-turbo',
            wasCorrect: false,
            timestamp: new Date('2024-09-01'),
            userTrustLevel: 0.70,
          },
          {
            taskType: 'market_data',
            aiModel: 'gpt-4-turbo',
            wasCorrect: false,
            timestamp: new Date('2024-09-02'),
            userTrustLevel: 0.68,
          },
          // Brainstorming: trusted 90%, should be 90% (good calibration)
          {
            taskType: 'brainstorming',
            aiModel: 'gpt-4-turbo',
            wasCorrect: true,
            timestamp: new Date('2024-09-03'),
            userTrustLevel: 0.90,
          },
        ],
        totalInteractions: 3,
      };

      const analysis = service.analyzeUserCalibration(userHistory);

      // Should detect over-trust
      expect(analysis.overallCalibration).toBeGreaterThan(0.1);
      expect(analysis.recommendation).toContain('over-trust');

      // Market data should show high over-trust
      const marketDataCalibration = analysis.taskCalibrations.find(
        t => t.taskType === 'market_data'
      );
      expect(marketDataCalibration).toBeDefined();
      expect(marketDataCalibration!.calibration).toBeGreaterThan(0.3); // 69% - 30%
    });

    it('should identify well-calibrated user', () => {
      const userHistory: UserHistory = {
        userId: 'I41', // User with trust matrix
        verifications: [
          {
            taskType: 'academic_citation',
            aiModel: 'gpt-4-turbo',
            wasCorrect: false,
            timestamp: new Date('2024-09-01'),
            userTrustLevel: 0.05, // Well-calibrated to 17% accuracy
          },
          {
            taskType: 'concept_explanation',
            aiModel: 'gpt-4-turbo',
            wasCorrect: true,
            timestamp: new Date('2024-09-02'),
            userTrustLevel: 0.75, // Well-calibrated to 80% accuracy
          },
          {
            taskType: 'code_debugging',
            aiModel: 'gpt-4-turbo',
            wasCorrect: true,
            timestamp: new Date('2024-09-03'),
            userTrustLevel: 0.70, // Well-calibrated to 73% accuracy
          },
        ],
        totalInteractions: 3,
      };

      const analysis = service.analyzeUserCalibration(userHistory);

      expect(analysis.overallCalibration).toBeLessThanOrEqual(0.2);
      expect(analysis.overallCalibration).toBeGreaterThanOrEqual(-0.2);
      expect(analysis.recommendation).toContain('well-balanced');
    });
  });

  // ============================================================
  // Test Case 5: Accuracy Matrix Updates
  // ============================================================

  describe('Accuracy Matrix Updates', () => {
    it('should update accuracy when new verification added', () => {
      // Initial state
      const initial = service.recommendTrust('sql_generation', 'gpt-4-turbo');
      const initialAccuracy = initial.historicalAccuracy;

      // Add correct verification
      service.updateAccuracy('sql_generation', 'gpt-4-turbo', true);

      // Check updated
      const updated = service.recommendTrust('sql_generation', 'gpt-4-turbo');
      expect(updated.historicalAccuracy).toBeGreaterThan(initialAccuracy);
    });

    it('should create new record for unknown task-model combination', () => {
      // Use a model not in initial matrix
      service.updateAccuracy('brainstorming', 'claude-3-opus', true);

      const result = service.recommendTrust('brainstorming', 'claude-3-opus');
      expect(result.historicalAccuracy).toBe(1.0); // First observation was correct
      expect(result.confidence).toBeLessThan(0.7); // Low confidence due to small sample
    });
  });

  // ============================================================
  // Test Case 6: Confidence Scoring
  // ============================================================

  describe('Confidence Scoring', () => {
    it('should have high confidence for well-documented tasks', () => {
      const result = service.recommendTrust('grammar_check', 'gpt-4-turbo');

      // Grammar check has 120 samples
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should have low confidence for tasks with limited data', () => {
      const result = service.recommendTrust('financial_decision', 'gpt-4-turbo');

      // Financial decision has only 10 samples
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should increase confidence with user history', () => {
      const userHistory: UserHistory = {
        userId: 'test-user',
        verifications: Array(15).fill(null).map((_, i) => ({
          taskType: 'code_debugging' as TaskType,
          aiModel: 'gpt-4-turbo' as AIModel,
          wasCorrect: i % 2 === 0,
          timestamp: new Date(`2024-09-${i + 1}`),
          userTrustLevel: 0.7,
        })),
        totalInteractions: 15,
      };

      const withHistory = service.recommendTrust('code_debugging', 'gpt-4-turbo', userHistory);
      const withoutHistory = service.recommendTrust('code_debugging', 'gpt-4-turbo');

      expect(withHistory.confidence).toBeGreaterThan(withoutHistory.confidence);
    });
  });

  // ============================================================
  // Test Case 7: Real-world Scenario from I33
  // ============================================================

  describe('Real-world Scenario: Economics Professor (I33)', () => {
    it('should track trust evolution for concept explanation task', () => {
      const userHistory: UserHistory = {
        userId: 'I33',
        verifications: [
          // Week 1-4: User discovers errors
          { taskType: 'concept_explanation', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-08-01'), userTrustLevel: 0.80 },
          { taskType: 'concept_explanation', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-08-05'), userTrustLevel: 0.80 },
          { taskType: 'concept_explanation', aiModel: 'gpt-4-turbo', wasCorrect: false, timestamp: new Date('2024-08-10'), userTrustLevel: 0.70 },
          { taskType: 'concept_explanation', aiModel: 'gpt-4-turbo', wasCorrect: false, timestamp: new Date('2024-08-15'), userTrustLevel: 0.60 },
          // Week 8: User learns error patterns
          { taskType: 'concept_explanation', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-09-20'), userTrustLevel: 0.70 },
        ],
        totalInteractions: 5,
      };

      const result = service.recommendTrust('concept_explanation', 'gpt-4-turbo', userHistory);

      // User's average trust: 72%, historical accuracy: 80%
      // User is slightly under-trusting (learned from errors)
      expect(result.userCalibration).toBeLessThan(0); // Negative = under-trust
      expect(result.recommendedTrust).toBeGreaterThanOrEqual(0.70);
      expect(result.rationale.userPattern).toContain('5 verifications');
    });
  });

  // ============================================================
  // Test Case 8: API Response Format
  // ============================================================

  describe('API Response Format', () => {
    it('should match the required API response structure', () => {
      const userHistory: UserHistory = {
        userId: 'test-user',
        verifications: [
          {
            taskType: 'academic_citation',
            aiModel: 'gpt-4-turbo',
            wasCorrect: false,
            timestamp: new Date('2024-10-01'),
            userTrustLevel: 0.75, // User over-trusts
          },
        ],
        totalInteractions: 1,
      };

      const result = service.recommendTrust('academic_citation', 'gpt-4-turbo', userHistory);

      // Verify all required fields exist
      expect(result).toHaveProperty('recommendedTrust');
      expect(result).toHaveProperty('historicalAccuracy');
      expect(result).toHaveProperty('userCalibration');
      expect(result).toHaveProperty('warning');

      // Verify types
      expect(typeof result.recommendedTrust).toBe('number');
      expect(typeof result.historicalAccuracy).toBe('number');
      expect(typeof result.userCalibration).toBe('number');
      expect(result.riskLevel).toMatch(/safe|moderate|high_risk|critical/);

      // Verify ranges
      expect(result.recommendedTrust).toBeGreaterThanOrEqual(0);
      expect(result.recommendedTrust).toBeLessThanOrEqual(1);
      expect(result.historicalAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.historicalAccuracy).toBeLessThanOrEqual(1);
      expect(result.userCalibration).toBeGreaterThanOrEqual(-1);
      expect(result.userCalibration).toBeLessThanOrEqual(1);
    });
  });
});
