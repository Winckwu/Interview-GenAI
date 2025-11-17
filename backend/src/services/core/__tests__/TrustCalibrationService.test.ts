/**
 * Tests for TrustCalibrationService
 * Coverage: Historical accuracy, personalization, task-type calibration
 */

import TrustCalibrationService, { TaskContext, HistoricalAccuracy } from '../TrustCalibrationService';

describe('TrustCalibrationService', () => {
  let service: TrustCalibrationService;

  beforeEach(() => {
    service = new TrustCalibrationService();
  });

  /**
   * Task Type Baseline Tests
   */
  describe('Task Type Baselines', () => {
    it('should return baseline scores for all task types', () => {
      const taskTypes = ['coding', 'writing', 'analysis', 'creative', 'research', 'design', 'planning', 'review'] as const;

      taskTypes.forEach(taskType => {
        const context: TaskContext = {
          taskType,
          criticality: 'low',
          userFamiliarity: 0.5,
          timeConstraint: 1,
          complexity: 0.5
        };

        const score = service.calculateTrustScore(context);
        expect(score.baselineScore).toBeGreaterThan(0);
        expect(score.baselineScore).toBeLessThanOrEqual(100);
      });
    });

    it('should have higher baseline for coding than research', () => {
      const codingContext: TaskContext = {
        taskType: 'coding',
        criticality: 'low',
        userFamiliarity: 0.5,
        timeConstraint: 1,
        complexity: 0.5
      };

      const researchContext: TaskContext = {
        taskType: 'research',
        criticality: 'low',
        userFamiliarity: 0.5,
        timeConstraint: 1,
        complexity: 0.5
      };

      const codingScore = service.calculateTrustScore(codingContext);
      const researchScore = service.calculateTrustScore(researchContext);

      expect(codingScore.baselineScore).toBeGreaterThan(researchScore.baselineScore);
    });
  });

  /**
   * Criticality Adjustment Tests
   */
  describe('Criticality Adjustments', () => {
    it('should reduce trust for critical tasks', () => {
      const baseContext: TaskContext = {
        taskType: 'coding',
        criticality: 'low',
        userFamiliarity: 0.5,
        timeConstraint: 1,
        complexity: 0.5
      };

      const criticalContext: TaskContext = {
        ...baseContext,
        criticality: 'critical'
      };

      const baseScore = service.calculateTrustScore(baseContext);
      const criticalScore = service.calculateTrustScore(criticalContext);

      expect(criticalScore.overall).toBeLessThan(baseScore.overall);
      expect(criticalScore.adjustments.criticality).toBeLessThan(0);
    });

    it('should apply graduated criticality adjustments', () => {
      const baseContext: TaskContext = {
        taskType: 'coding',
        criticality: 'low',
        userFamiliarity: 0.5,
        timeConstraint: 1,
        complexity: 0.5
      };

      const lowScore = service.calculateTrustScore(baseContext);
      const mediumScore = service.calculateTrustScore({ ...baseContext, criticality: 'medium' });
      const highScore = service.calculateTrustScore({ ...baseContext, criticality: 'high' });
      const criticalScore = service.calculateTrustScore({ ...baseContext, criticality: 'critical' });

      expect(lowScore.overall).toBeGreaterThan(mediumScore.overall);
      expect(mediumScore.overall).toBeGreaterThan(highScore.overall);
      expect(highScore.overall).toBeGreaterThan(criticalScore.overall);
    });
  });

  /**
   * Familiarity Adjustment Tests
   */
  describe('Familiarity Adjustments', () => {
    it('should increase trust with higher familiarity', () => {
      const baseContext: TaskContext = {
        taskType: 'coding',
        criticality: 'low',
        userFamiliarity: 0.2,
        timeConstraint: 1,
        complexity: 0.5
      };

      const familiareContext: TaskContext = {
        ...baseContext,
        userFamiliarity: 0.8
      };

      const lowFamiliarityScore = service.calculateTrustScore(baseContext);
      const highFamiliarityScore = service.calculateTrustScore(familiareContext);

      expect(highFamiliarityScore.overall).toBeGreaterThan(lowFamiliarityScore.overall);
    });
  });

  /**
   * Historical Accuracy Tests
   */
  describe('Historical Accuracy Tracking', () => {
    it('should update accuracy history correctly', () => {
      service.updateAccuracyHistory('coding', true);
      service.updateAccuracyHistory('coding', true);
      service.updateAccuracyHistory('coding', false);

      const history = service.getAccuracyHistory('coding');

      expect(history).not.toBeNull();
      expect(history!.totalOutputs).toBe(3);
      expect(history!.correctOutputs).toBe(2);
      expect(Math.round(history!.accuracy * 100)).toBe(67);
    });

    it('should track multiple task types independently', () => {
      service.updateAccuracyHistory('coding', true);
      service.updateAccuracyHistory('writing', false);
      service.updateAccuracyHistory('coding', true);

      const codingHistory = service.getAccuracyHistory('coding');
      const writingHistory = service.getAccuracyHistory('writing');

      expect(codingHistory!.correctOutputs).toBe(2);
      expect(writingHistory!.correctOutputs).toBe(0);
    });

    it('should calculate accuracy rate correctly', () => {
      for (let i = 0; i < 7; i++) {
        service.updateAccuracyHistory('analysis', true);
      }
      for (let i = 0; i < 3; i++) {
        service.updateAccuracyHistory('analysis', false);
      }

      const history = service.getAccuracyHistory('analysis');
      expect(history!.accuracy).toBe(0.7);
    });

    it('should update timestamp on accuracy change', () => {
      service.updateAccuracyHistory('coding', true);
      const history1 = service.getAccuracyHistory('coding')!;
      const time1 = history1.lastUpdated.getTime();

      // Wait a moment
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {}

      service.updateAccuracyHistory('coding', false);
      const history2 = service.getAccuracyHistory('coding')!;
      const time2 = history2.lastUpdated.getTime();

      expect(time2).toBeGreaterThanOrEqual(time1);
    });
  });

  /**
   * Personalization Tests
   */
  describe('Personalized Baseline Calibration', () => {
    it('should use pure baseline with insufficient data', () => {
      const emptyHistory: HistoricalAccuracy[] = [];
      const personalizedScore = service.personalizeBaseline('coding', 75, emptyHistory);

      expect(personalizedScore).toBe(75);
    });

    it('should blend baseline with user history', () => {
      const history: HistoricalAccuracy[] = [
        {
          taskType: 'coding',
          totalOutputs: 10,
          correctOutputs: 8,
          accuracy: 0.8,
          lastUpdated: new Date()
        }
      ];

      const personalizedScore = service.personalizeBaseline('coding', 75, history);

      // Should be blend of 75 and 80, weighted by totalOutputs
      expect(personalizedScore).toBeGreaterThan(75);
      expect(personalizedScore).toBeLessThanOrEqual(80);
    });

    it('should fully weight user history at 20+ outputs', () => {
      const history: HistoricalAccuracy[] = [
        {
          taskType: 'writing',
          totalOutputs: 25,
          correctOutputs: 20,
          accuracy: 0.8,
          lastUpdated: new Date()
        }
      ];

      const personalizedScore = service.personalizeBaseline('writing', 50, history);

      // With 25 outputs, weight = 1.0, so score should approach user's 80
      expect(personalizedScore).toBeGreaterThan(70);
    });

    it('should not affect other task types', () => {
      const history: HistoricalAccuracy[] = [
        {
          taskType: 'coding',
          totalOutputs: 20,
          correctOutputs: 16,
          accuracy: 0.8,
          lastUpdated: new Date()
        }
      ];

      const writingScore = service.personalizeBaseline('writing', 65, history);

      expect(writingScore).toBe(65); // No history for writing
    });
  });

  /**
   * Risk Factor Identification
   */
  describe('Risk Factor Identification', () => {
    it('should identify critical task risk', () => {
      const context: TaskContext = {
        taskType: 'coding',
        criticality: 'critical',
        userFamiliarity: 0.7,
        timeConstraint: 0.8,
        complexity: 0.5
      };

      const score = service.calculateTrustScore(context);

      expect(score.riskFactors.some(r => r.includes('critical'))).toBe(true);
    });

    it('should identify low familiarity risk', () => {
      const context: TaskContext = {
        taskType: 'analysis',
        criticality: 'medium',
        userFamiliarity: 0.2,
        timeConstraint: 0.8,
        complexity: 0.5
      };

      const score = service.calculateTrustScore(context);

      expect(score.riskFactors.some(r => r.includes('familiarity'))).toBe(true);
    });

    it('should identify high complexity risk', () => {
      const context: TaskContext = {
        taskType: 'design',
        criticality: 'low',
        userFamiliarity: 0.5,
        timeConstraint: 0.8,
        complexity: 0.85
      };

      const score = service.calculateTrustScore(context);

      expect(score.riskFactors.some(r => r.includes('complexity'))).toBe(true);
    });

    it('should identify compound risk (critical + unfamiliar)', () => {
      const context: TaskContext = {
        taskType: 'research',
        criticality: 'critical',
        userFamiliarity: 0.3,
        timeConstraint: 0.8,
        complexity: 0.6
      };

      const score = service.calculateTrustScore(context);

      const compoundRisk = score.riskFactors.some(r => r.includes('extreme'));
      expect(compoundRisk).toBe(true);
    });

    it('should identify tight deadline risk', () => {
      const context: TaskContext = {
        taskType: 'writing',
        criticality: 'high',
        userFamiliarity: 0.7,
        timeConstraint: 0.1,
        complexity: 0.5
      };

      const score = service.calculateTrustScore(context);

      expect(score.riskFactors.some(r => r.includes('deadline'))).toBe(true);
    });
  });

  /**
   * Score Boundaries
   */
  describe('Score Boundaries', () => {
    it('should never exceed 100', () => {
      const context: TaskContext = {
        taskType: 'coding',
        criticality: 'low',
        userFamiliarity: 1,
        timeConstraint: 1,
        complexity: 0
      };

      const score = service.calculateTrustScore(context);

      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('should never be negative', () => {
      const context: TaskContext = {
        taskType: 'research',
        criticality: 'critical',
        userFamiliarity: 0,
        timeConstraint: 0,
        complexity: 1
      };

      const score = service.calculateTrustScore(context);

      expect(score.overall).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * Recommendation Generation
   */
  describe('Trust Recommendation Generation', () => {
    it('should recommend high confidence action for high scores', () => {
      const context: TaskContext = {
        taskType: 'coding',
        criticality: 'low',
        userFamiliarity: 0.9,
        timeConstraint: 1,
        complexity: 0.3
      };

      const score = service.calculateTrustScore(context);

      expect(score.recommendation).toContain('High confidence');
    });

    it('should recommend verification for moderate scores', () => {
      const context: TaskContext = {
        taskType: 'writing',
        criticality: 'medium',
        userFamiliarity: 0.5,
        timeConstraint: 0.8,
        complexity: 0.5
      };

      const score = service.calculateTrustScore(context);

      expect(score.recommendation).toContain('verify');
    });

    it('should recommend extensive verification for low scores', () => {
      const context: TaskContext = {
        taskType: 'research',
        criticality: 'critical',
        userFamiliarity: 0.2,
        timeConstraint: 0.2,
        complexity: 0.8
      };

      const score = service.calculateTrustScore(context);

      expect(score.recommendation.toLowerCase()).toContain('extensive');
    });
  });

  /**
   * Strategy Comparison
   */
  describe('Strategy Comparison', () => {
    it('should compare multiple strategies for same task', () => {
      const contexts: TaskContext[] = [
        {
          taskType: 'coding',
          criticality: 'high',
          userFamiliarity: 0.3,
          timeConstraint: 0.5,
          complexity: 0.7
        },
        {
          taskType: 'coding',
          criticality: 'medium',
          userFamiliarity: 0.6,
          timeConstraint: 0.7,
          complexity: 0.6
        },
        {
          taskType: 'coding',
          criticality: 'low',
          userFamiliarity: 0.9,
          timeConstraint: 0.9,
          complexity: 0.3
        }
      ];

      const comparison = service.compareStrategies(contexts);

      expect(comparison.length).toBe(3);
      // Third strategy should have higher score
      expect(comparison[2].score.overall).toBeGreaterThan(comparison[0].score.overall);
    });
  });

  /**
   * History Management
   */
  describe('History Management', () => {
    it('should return all history entries', () => {
      service.updateAccuracyHistory('coding', true);
      service.updateAccuracyHistory('writing', false);
      service.updateAccuracyHistory('analysis', true);

      const allHistory = service.getAllHistory();

      expect(allHistory.length).toBe(3);
    });

    it('should clear history when requested', () => {
      service.updateAccuracyHistory('coding', true);
      service.clearHistory();

      const history = service.getAccuracyHistory('coding');

      expect(history).toBeNull();
    });
  });
});
