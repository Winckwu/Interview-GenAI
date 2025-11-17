/**
 * Tests for SkillMonitoringService
 * Coverage: Atrophy detection sensitivity, intervention triggering, skill tracking
 */

import SkillMonitoringService, { SkillBaseline, SkillSession } from '../SkillMonitoringService';

describe('SkillMonitoringService', () => {
  let service: SkillMonitoringService;

  beforeEach(() => {
    service = new SkillMonitoringService();
  });

  /**
   * Baseline Registration Tests
   */
  describe('Baseline Registration', () => {
    it('should register skill baseline', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);
      const profile = service.getHealthProfile('skill-1');

      expect(profile).not.toBeNull();
      expect(profile!.baselineIndependenceRate).toBe(0.8);
    });

    it('should validate independence rate bounds', () => {
      const invalidBaseline: SkillBaseline = {
        skillId: 'invalid',
        category: 'writing',
        timestamp: new Date(),
        independenceRate: 1.5,
        proficiencyScore: 8
      };

      expect(() => service.registerBaseline(invalidBaseline)).toThrow();
    });

    it('should validate proficiency score bounds', () => {
      const invalidBaseline: SkillBaseline = {
        skillId: 'invalid',
        category: 'analysis',
        timestamp: new Date(),
        independenceRate: 0.7,
        proficiencyScore: 15
      };

      expect(() => service.registerBaseline(invalidBaseline)).toThrow();
    });
  });

  /**
   * Session Logging Tests
   */
  describe('Session Logging and Calculation', () => {
    it('should record session and calculate health profile', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      const session: SkillSession = {
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      };

      const profile = service.recordSession(session);

      expect(profile).not.toBeNull();
      expect(profile!.currentIndependenceRate).toBe(0.8);
      expect(profile!.sessionCount).toBe(1);
    });

    it('should calculate independence rate from multiple sessions', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // First session: 8/10 = 80%
      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      });

      // Second session: 6/10 = 60%
      const profile = service.recordSession({
        sessionId: 'session-2',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 6,
        qualityRating: 4
      });

      // Overall: 14/20 = 70%
      expect(profile!.currentIndependenceRate).toBe(0.7);
    });
  });

  /**
   * Atrophy Detection Tests
   */
  describe('Atrophy Detection and Levels', () => {
    it('should detect warning level atrophy (15% decline)', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Simulate 15% decline: 80% → 68%
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      expect(profile!.atrophyLevel).toBe('warning');
    });

    it('should detect critical level atrophy (30% decline)', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Simulate 30% decline: 80% → 56%
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 56,
        qualityRating: 3
      });

      expect(profile!.atrophyLevel).toBe('critical');
    });

    it('should detect severe level atrophy (50% decline)', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'writing',
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Simulate 50% decline: 80% → 40%
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'writing',
        tasksCompleted: 100,
        independentlyCompleted: 40,
        qualityRating: 2
      });

      expect(profile!.atrophyLevel).toBe('severe');
    });

    it('should stay healthy with no significant decline', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'analysis',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Minimal decline: 80% → 78%
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'analysis',
        tasksCompleted: 100,
        independentlyCompleted: 78,
        qualityRating: 4
      });

      expect(profile!.atrophyLevel).toBe('healthy');
    });
  });

  /**
   * Intervention Triggering Tests
   */
  describe('Intervention Triggering', () => {
    it('should not trigger intervention for healthy state', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      });

      expect(service.shouldTriggerIntervention(profile!)).toBe(false);
    });

    it('should trigger intervention for warning level', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'writing',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'writing',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      expect(service.shouldTriggerIntervention(profile!)).toBe(true);
      expect(service.getInterventionType('warning')).toBe('gentle-reminder');
    });

    it('should trigger practice suggestion for critical', () => {
      expect(service.getInterventionType('critical')).toBe('practice-suggestion');
    });

    it('should trigger AI restriction for severe', () => {
      expect(service.getInterventionType('severe')).toBe('ai-restriction');
    });
  });

  /**
   * Risk Score Calculation
   */
  describe('Risk Score Calculation', () => {
    it('should calculate risk score from decline percentage', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 48, // 40% decline
        qualityRating: 2
      });

      expect(profile!.riskScore).toBeGreaterThan(30);
      expect(profile!.riskScore).toBeLessThanOrEqual(100);
    });
  });

  /**
   * Critical Time Until Atrophy Calculation
   */
  describe('Months Until Critical Calculation', () => {
    it('should estimate months until critical degradation', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'analysis',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // 10% decline after 1 month → predict ~3 months until 30% (critical)
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'analysis',
        tasksCompleted: 100,
        independentlyCompleted: 72, // 10% decline
        qualityRating: 4
      });

      expect(profile!.monthsUntilCritical).toBeGreaterThan(1);
      expect(profile!.monthsUntilCritical).toBeLessThan(10);
    });

    it('should return 999 if already at or past critical', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 40, // 50% decline - already severe
        qualityRating: 2
      });

      expect(profile!.monthsUntilCritical).toBe(999);
    });
  });

  /**
   * Warning History Tests
   */
  describe('Warning History', () => {
    it('should track warnings for each skill', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Trigger warning
      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      const warnings = service.getWarnings('skill-1');

      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should generate appropriate warning message for level', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'writing',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'writing',
        tasksCompleted: 100,
        independentlyCompleted: 48,
        qualityRating: 2
      });

      const warnings = service.getWarnings('skill-1');
      const criticalWarning = warnings.find(w => w.atrophyLevel === 'critical');

      expect(criticalWarning).toBeDefined();
      expect(criticalWarning!.message.toLowerCase()).toContain('critical');
    });

    it('should get all warnings across skills', () => {
      const baseline1: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      const baseline2: SkillBaseline = {
        skillId: 'skill-2',
        category: 'writing',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.75,
        proficiencyScore: 7
      };

      service.registerBaseline(baseline1);
      service.registerBaseline(baseline2);

      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      service.recordSession({
        sessionId: 'session-2',
        timestamp: new Date(),
        skillCategory: 'writing',
        tasksCompleted: 100,
        independentlyCompleted: 54,
        qualityRating: 3
      });

      const allWarnings = service.getAllWarnings();

      expect(allWarnings.length).toBeGreaterThanOrEqual(2);
    });
  });

  /**
   * Detection Sensitivity Tests
   */
  describe('Detection Sensitivity', () => {
    it('should calculate detection sensitivity', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      const sessions: SkillSession[] = [
        {
          sessionId: 'session-1',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 10,
          independentlyCompleted: 8,
          qualityRating: 4
        },
        {
          sessionId: 'session-2',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 10,
          independentlyCompleted: 6,
          qualityRating: 3
        }
      ];

      const sensitivity = service.getDetectionSensitivity(baseline, sessions);

      expect(sensitivity).toBeGreaterThanOrEqual(0);
      expect(sensitivity).toBeLessThanOrEqual(1);
    });

    it('should be more sensitive with faster decline', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      // Fast decline
      const fastDecline: SkillSession[] = [
        {
          sessionId: 'session-1',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 100,
          independentlyCompleted: 68,
          qualityRating: 3
        }
      ];

      // Slow decline
      const slowDecline: SkillSession[] = [
        {
          sessionId: 'session-1',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 10,
          independentlyCompleted: 8,
          qualityRating: 4
        },
        {
          sessionId: 'session-2',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 10,
          independentlyCompleted: 7,
          qualityRating: 4
        },
        {
          sessionId: 'session-3',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 10,
          independentlyCompleted: 6,
          qualityRating: 3
        }
      ];

      const fastSensitivity = service.getDetectionSensitivity(baseline, fastDecline);
      const slowSensitivity = service.getDetectionSensitivity(baseline, slowDecline);

      expect(fastSensitivity).toBeGreaterThan(slowSensitivity);
    });
  });

  /**
   * Data Management
   */
  describe('Data Management', () => {
    it('should clear all data', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);
      service.clearData();

      const profile = service.getHealthProfile('skill-1');

      expect(profile).toBeNull();
    });
  });

  /**
   * Edge Case Tests - Additional Coverage
   */
  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle session with zero tasks completed', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 0,
        independentlyCompleted: 0,
        qualityRating: 0
      });

      // With 0 tasks, independence rate becomes 0
      expect(profile).not.toBeNull();
      expect(profile!.currentIndependenceRate).toBe(0);
    });

    it('should handle session with zero independent completions', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 0,
        qualityRating: 1
      });

      expect(profile!.currentIndependenceRate).toBe(0);
      expect(profile!.declinePercentage).toBe(100);
    });

    it('should use most recent baseline when multiple exist for same category', () => {
      const olderBaseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        independenceRate: 0.6,
        proficiencyScore: 6
      };

      const newerBaseline: SkillBaseline = {
        skillId: 'skill-2',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(olderBaseline);
      service.registerBaseline(newerBaseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      });

      // Should use the newer baseline (0.8)
      expect(profile!.baselineIndependenceRate).toBe(0.8);
      expect(profile!.skillId).toBe('skill-2');
    });

    it('should return null when recording session without baseline', () => {
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      });

      expect(profile).toBeNull();
    });

    it('should handle getHealthProfile for unregistered skill', () => {
      const profile = service.getHealthProfile('nonexistent');
      expect(profile).toBeNull();
    });

    it('should track multiple different skills independently', () => {
      const baseline1: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      const baseline2: SkillBaseline = {
        skillId: 'skill-2',
        category: 'writing',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.7,
        proficiencyScore: 7
      };

      service.registerBaseline(baseline1);
      service.registerBaseline(baseline2);

      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      service.recordSession({
        sessionId: 'session-2',
        timestamp: new Date(),
        skillCategory: 'writing',
        tasksCompleted: 100,
        independentlyCompleted: 70,
        qualityRating: 4
      });

      const profile1 = service.getHealthProfile('skill-1');
      const profile2 = service.getHealthProfile('skill-2');

      // Skill 1 should have warning level decline
      expect(profile1!.atrophyLevel).toBe('warning');
      // Skill 2 should have no decline (70% maintained from 70%)
      expect(profile2!.currentIndependenceRate).toBe(0.7);
    });

    it('should calculate accurate decline percentage with fractional values', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'analysis',
        timestamp: new Date(),
        independenceRate: 0.6,
        proficiencyScore: 6
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'analysis',
        tasksCompleted: 100,
        independentlyCompleted: 51, // 51% - 15% decline from 60%
        qualityRating: 3
      });

      const expectedDeclipne = ((0.6 - 0.51) / 0.6) * 100;
      expect(profile!.declinePercentage).toBeCloseTo(expectedDeclipne, 1);
    });

    it('should detect sensitivity of zero when no sessions provided', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      const sensitivity = service.getDetectionSensitivity(baseline, []);
      expect(sensitivity).toBe(0);
    });

    it('should handle detection sensitivity when decline never meets threshold', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      // Sessions with minimal decline
      const sessions: SkillSession[] = [
        {
          sessionId: 'session-1',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 10,
          independentlyCompleted: 9,
          qualityRating: 4
        },
        {
          sessionId: 'session-2',
          timestamp: new Date(),
          skillCategory: 'coding',
          tasksCompleted: 10,
          independentlyCompleted: 9,
          qualityRating: 4
        }
      ];

      const sensitivity = service.getDetectionSensitivity(baseline, sessions);
      expect(sensitivity).toBe(0);
    });

    it('should handle very low baseline independence rate', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.1,
        proficiencyScore: 2
      };

      service.registerBaseline(baseline);

      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 5, // 50% decline
        qualityRating: 1
      });

      expect(profile!.currentIndependenceRate).toBe(0.05);
      expect(profile!.declinePercentage).toBe(50);
    });

    it('should handle months until critical with zero decline rate', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Perfect performance - no decline
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 80,
        qualityRating: 5
      });

      expect(profile!.monthsUntilCritical).toBe(999);
    });

    it('should handle rapid decline prediction', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // 20% decline in 10 days (2% per day)
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 64, // 20% decline
        qualityRating: 2
      });

      // With rapid decline, months until critical should be smaller
      expect(profile!.monthsUntilCritical).toBeGreaterThan(0);
      expect(profile!.monthsUntilCritical).toBeLessThan(5);
    });

    it('should properly handle getInterventionType for all atrophy levels', () => {
      expect(service.getInterventionType('healthy')).toBe('none');
      expect(service.getInterventionType('warning')).toBe('gentle-reminder');
      expect(service.getInterventionType('critical')).toBe('practice-suggestion');
      expect(service.getInterventionType('severe')).toBe('ai-restriction');
    });

    it('should track multiple warnings for same skill', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // First session - triggers warning level
      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      // Second session - triggers critical level
      service.recordSession({
        sessionId: 'session-2',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 56,
        qualityRating: 2
      });

      const warnings = service.getWarnings('skill-1');
      expect(warnings.length).toBeGreaterThanOrEqual(2);
      expect(warnings.some(w => w.atrophyLevel === 'warning')).toBe(true);
      expect(warnings.some(w => w.atrophyLevel === 'critical')).toBe(true);
    });

    it('should handle session count tracking accurately', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      });

      service.recordSession({
        sessionId: 'session-2',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      });

      service.recordSession({
        sessionId: 'session-3',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 10,
        independentlyCompleted: 8,
        qualityRating: 4
      });

      const profile = service.getHealthProfile('skill-1');
      expect(profile!.sessionCount).toBe(3);
    });

    it('should handle shouldTriggerIntervention correctly for each level', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Healthy case
      const healthyProfile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 78,
        qualityRating: 4
      });

      expect(service.shouldTriggerIntervention(healthyProfile!)).toBe(false);

      // Clear and test warning case
      service.clearData();

      service.registerBaseline(baseline);
      const warningProfile = service.recordSession({
        sessionId: 'session-2',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      expect(service.shouldTriggerIntervention(warningProfile!)).toBe(true);
    });

    it('should track atrophy boundary at exactly 15% decline', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 1.0,
        proficiencyScore: 10
      };

      service.registerBaseline(baseline);

      // Exactly 15% decline: 100% → 85%
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 85,
        qualityRating: 4
      });

      expect(profile!.declinePercentage).toBe(15);
      expect(profile!.atrophyLevel).toBe('warning');
    });

    it('should track atrophy boundary at exactly 30% decline', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        independenceRate: 1.0,
        proficiencyScore: 10
      };

      service.registerBaseline(baseline);

      // Exactly 30% decline: 100% → 70%
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 70,
        qualityRating: 3
      });

      expect(profile!.declinePercentage).toBe(30);
      expect(profile!.atrophyLevel).toBe('critical');
    });

    it('should track atrophy boundary at exactly 50% decline', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        independenceRate: 1.0,
        proficiencyScore: 10
      };

      service.registerBaseline(baseline);

      // Exactly 50% decline: 100% → 50%
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 50,
        qualityRating: 2
      });

      expect(profile!.declinePercentage).toBe(50);
      expect(profile!.atrophyLevel).toBe('severe');
    });

    it('should calculate risk score accurately at boundaries', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // Create sessions with known decline percentages
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 200,
        independentlyCompleted: 120, // 60% independence, 25% decline
        qualityRating: 2
      });

      // Risk score should cap at 100
      expect(profile!.riskScore).toBeLessThanOrEqual(100);
      expect(profile!.riskScore).toBeGreaterThan(20);
    });

    it('should generate correct message for severe atrophy warning', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'design',
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        independenceRate: 0.9,
        proficiencyScore: 9
      };

      service.registerBaseline(baseline);

      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'design',
        tasksCompleted: 100,
        independentlyCompleted: 36, // >50% decline
        qualityRating: 1
      });

      const warnings = service.getWarnings('skill-1');
      const severeWarning = warnings.find(w => w.atrophyLevel === 'severe');

      expect(severeWarning).toBeDefined();
      expect(severeWarning!.interventionType).toBe('ai-restriction');
      expect(severeWarning!.message).toContain('design');
    });

    it('should handle multiple skills with mixed atrophy states', () => {
      const baseline1: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      const baseline2: SkillBaseline = {
        skillId: 'skill-2',
        category: 'writing',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      const baseline3: SkillBaseline = {
        skillId: 'skill-3',
        category: 'analysis',
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline1);
      service.registerBaseline(baseline2);
      service.registerBaseline(baseline3);

      // Skill 1: healthy
      service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 78,
        qualityRating: 4
      });

      // Skill 2: warning
      service.recordSession({
        sessionId: 'session-2',
        timestamp: new Date(),
        skillCategory: 'writing',
        tasksCompleted: 100,
        independentlyCompleted: 68,
        qualityRating: 3
      });

      // Skill 3: critical
      service.recordSession({
        sessionId: 'session-3',
        timestamp: new Date(),
        skillCategory: 'analysis',
        tasksCompleted: 100,
        independentlyCompleted: 56,
        qualityRating: 2
      });

      const allWarnings = service.getAllWarnings();

      // Should have warnings for skills 2 and 3, but not 1
      expect(allWarnings.length).toBeGreaterThanOrEqual(2);
      expect(allWarnings.some(w => w.skillCategory === 'writing')).toBe(true);
      expect(allWarnings.some(w => w.skillCategory === 'analysis')).toBe(true);
    });

    it('should estimate months until critical with high accuracy', () => {
      const baseline: SkillBaseline = {
        skillId: 'skill-1',
        category: 'coding',
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        independenceRate: 0.8,
        proficiencyScore: 8
      };

      service.registerBaseline(baseline);

      // 20% decline after 2 months = 10% per month decline rate
      // Should reach 30% critical in about 1 more month
      const profile = service.recordSession({
        sessionId: 'session-1',
        timestamp: new Date(),
        skillCategory: 'coding',
        tasksCompleted: 100,
        independentlyCompleted: 64, // 20% decline
        qualityRating: 2
      });

      expect(profile!.monthsUntilCritical).toBeGreaterThan(0);
      expect(profile!.monthsUntilCritical).toBeLessThanOrEqual(2);
    });

    it('should handle session with proficiency score validation edge case', () => {
      expect(() => {
        service.registerBaseline({
          skillId: 'bad',
          category: 'coding',
          timestamp: new Date(),
          independenceRate: 0.5,
          proficiencyScore: 0 // Below minimum of 1
        });
      }).toThrow();

      expect(() => {
        service.registerBaseline({
          skillId: 'bad2',
          category: 'coding',
          timestamp: new Date(),
          independenceRate: 0.5,
          proficiencyScore: 11 // Above maximum of 10
        });
      }).toThrow();
    });

    it('should handle independence rate validation edge case', () => {
      expect(() => {
        service.registerBaseline({
          skillId: 'bad',
          category: 'coding',
          timestamp: new Date(),
          independenceRate: -0.1,
          proficiencyScore: 5
        });
      }).toThrow();

      expect(() => {
        service.registerBaseline({
          skillId: 'bad2',
          category: 'coding',
          timestamp: new Date(),
          independenceRate: 1.01,
          proficiencyScore: 5
        });
      }).toThrow();
    });
  });
});
