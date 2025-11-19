/**
 * Unit Tests for Intervention Scheduler: Fatigue Management
 *
 * Tests:
 * 1. Fatigue score calculation (0-100 scale)
 * 2. Suppression decision logic
 * 3. Suppression expiry calculation
 * 4. User action recording and history updates
 * 5. Integration: scheduling decisions based on pattern confidence + fatigue
 */

import {
  calculateFatigueScore,
  shouldSuppressIntervention,
  calculateSuppressionExpiry,
  scheduleIntervention,
  recordInterventionAction,
  calculateOverallFatigue,
  getSuppressionSummary,
  UserInterventionHistory,
  InterventionSuppressionState,
} from '../InterventionScheduler';

/**
 * Helper to create default intervention history
 */
function createEmptyHistory(): UserInterventionHistory {
  return {};
}

/**
 * Helper to create pre-populated history
 */
function createHistoryWithEntry(
  mrType: string,
  options: {
    dismissalCount?: number;
    userActedOnCount?: number;
    cumulativeExposureMs?: number;
  } = {}
): UserInterventionHistory {
  return {
    [mrType]: {
      dismissalCount: options.dismissalCount ?? 0,
      lastDismissalTime: Date.now(),
      userActedOnCount: options.userActedOnCount ?? 0,
      cumulativeExposureMs: options.cumulativeExposureMs ?? 0,
      createdAtMs: Date.now(),
    },
  };
}

/**
 * Helper to create empty suppression state
 */
function createEmptySuppressionState(): InterventionSuppressionState {
  return {
    suppressedMRTypes: new Set(),
    suppressionExpiresAt: {},
    lastCalculatedFatigueScore: 0,
    lastCalculatedAt: Date.now(),
  };
}

describe('InterventionScheduler: Fatigue Management', () => {
  describe('calculateFatigueScore: Core Algorithm', () => {
    it('should return 0 fatigue when no history', () => {
      const history = createEmptyHistory();
      const fatigue = calculateFatigueScore('MR18_OverDependence', history);

      expect(fatigue).toBe(0);
    });

    it('should add points for each dismissal', () => {
      // 1 dismissal = 10 points
      const history1 = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 1,
      });
      expect(calculateFatigueScore('MR18_OverDependence', history1)).toBe(10);

      // 2 dismissals = 20 points
      const history2 = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 2,
      });
      expect(calculateFatigueScore('MR18_OverDependence', history2)).toBe(20);

      // 3+ dismissals = 40 points
      const history3 = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 3,
      });
      expect(calculateFatigueScore('MR18_OverDependence', history3)).toBeGreaterThanOrEqual(
        40
      );
    });

    it('should add points for zero engagement + dismissals', () => {
      // User dismissed but never acted = extra fatigue
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 2,
        userActedOnCount: 0,
      });

      const fatigue = calculateFatigueScore('MR18_OverDependence', history);

      // Should be >= 20 (from dismissals) + 30 (zero engagement) = >= 50
      expect(fatigue).toBeGreaterThanOrEqual(50);
    });

    it('should NOT penalize zero engagement with only 1 dismissal', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 1,
        userActedOnCount: 0,
      });

      const fatigue = calculateFatigueScore('MR18_OverDependence', history);

      // 1 dismissal (10) + partial zero engagement penalty = ~20
      expect(fatigue).toBeLessThan(40);
    });

    it('should apply time decay: reset after 30 minutes', () => {
      // Fresh dismissal
      const freshHistory = {
        MR18_OverDependence: {
          dismissalCount: 3,
          lastDismissalTime: Date.now(), // Just now
          userActedOnCount: 0,
          cumulativeExposureMs: 0,
          createdAtMs: Date.now(),
        },
      };

      const freshFatigue = calculateFatigueScore(
        'MR18_OverDependence',
        freshHistory
      );

      // Simulate 40 minutes passing
      const stalledHistory = {
        MR18_OverDependence: {
          dismissalCount: 3,
          lastDismissalTime: Date.now() - 40 * 60 * 1000, // 40 minutes ago
          userActedOnCount: 0,
          cumulativeExposureMs: 0,
          createdAtMs: Date.now(),
        },
      };

      const stalledFatigue = calculateFatigueScore(
        'MR18_OverDependence',
        stalledHistory
      );

      // After 30+ minutes, fatigue should decay by 50%
      expect(stalledFatigue).toBeLessThan(freshFatigue);
      expect(stalledFatigue).toBeLessThan(freshFatigue * 0.6);
    });

    it('should apply partial decay: reduce after 15 minutes', () => {
      const recentHistory = {
        MR18_OverDependence: {
          dismissalCount: 3,
          lastDismissalTime: Date.now() - 20 * 60 * 1000, // 20 minutes ago
          userActedOnCount: 0,
          cumulativeExposureMs: 0,
          createdAtMs: Date.now(),
        },
      };

      const recentFatigue = calculateFatigueScore(
        'MR18_OverDependence',
        recentHistory
      );

      const freshFatigue = calculateFatigueScore('MR18_OverDependence', {
        MR18_OverDependence: {
          dismissalCount: 3,
          lastDismissalTime: Date.now(),
          userActedOnCount: 0,
          cumulativeExposureMs: 0,
          createdAtMs: Date.now(),
        },
      });

      // Recent (20 min) should be between fresh and decayed
      expect(recentFatigue).toBeLessThan(freshFatigue);
      expect(recentFatigue).toBeGreaterThan(freshFatigue * 0.6);
    });

    it('should cap fatigue at 100', () => {
      const extremeHistory = {
        MR18_OverDependence: {
          dismissalCount: 10,
          lastDismissalTime: Date.now(),
          userActedOnCount: 0,
          cumulativeExposureMs: 100 * 60 * 1000, // 100 minutes shown
          createdAtMs: Date.now(),
        },
      };

      const fatigue = calculateFatigueScore('MR18_OverDependence', extremeHistory);

      expect(fatigue).toBeLessThanOrEqual(100);
    });
  });

  describe('shouldSuppressIntervention: Decision Logic', () => {
    it('should NOT suppress when fatigue is low', () => {
      const result = shouldSuppressIntervention(
        'MR18_OverDependence',
        20, // fatigue = 20
        1, // 1 dismissal
        null // no active suppression
      );

      expect(result).toBe(false);
    });

    it('should suppress after 3 dismissals with fatigue >= 40', () => {
      const result = shouldSuppressIntervention(
        'MR18_OverDependence',
        40, // fatigue = 40
        3, // 3 dismissals
        null
      );

      expect(result).toBe(true);
    });

    it('should suppress if fatigue > 70', () => {
      const result = shouldSuppressIntervention(
        'MR18_OverDependence',
        75, // fatigue > 70
        2, // even with just 2 dismissals
        null
      );

      expect(result).toBe(true);
    });

    it('should respect active suppression timer', () => {
      const futureExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

      const result = shouldSuppressIntervention(
        'MR18_OverDependence',
        10, // low fatigue
        1, // 1 dismissal
        futureExpiry // but timer is active
      );

      expect(result).toBe(true);
    });

    it('should NOT suppress when suppression timer has expired', () => {
      const pastExpiry = Date.now() - 1000; // 1 second ago

      const result = shouldSuppressIntervention(
        'MR18_OverDependence',
        60,
        3,
        pastExpiry // timer expired
      );

      expect(result).toBe(false);
    });
  });

  describe('calculateSuppressionExpiry: Duration Logic', () => {
    it('should suppress 30 min after 3 dismissals', () => {
      const expiry = calculateSuppressionExpiry(40, 3);
      const durationMin = (expiry - Date.now()) / 60000;

      expect(durationMin).toBeCloseTo(30, 1); // Within 1 minute
    });

    it('should suppress 15 min when fatigue > 70', () => {
      const expiry = calculateSuppressionExpiry(75, 2);
      const durationMin = (expiry - Date.now()) / 60000;

      expect(durationMin).toBeCloseTo(15, 1);
    });

    it('should suppress 10 min after 2 dismissals', () => {
      const expiry = calculateSuppressionExpiry(20, 2);
      const durationMin = (expiry - Date.now()) / 60000;

      expect(durationMin).toBeCloseTo(10, 1);
    });

    it('should suppress 5 min after 1 dismissal', () => {
      const expiry = calculateSuppressionExpiry(10, 1);
      const durationMin = (expiry - Date.now()) / 60000;

      expect(durationMin).toBeCloseTo(5, 1);
    });

    it('should return 0 when no suppression needed', () => {
      const expiry = calculateSuppressionExpiry(0, 0);

      expect(expiry).toBe(0);
    });
  });

  describe('scheduleIntervention: Integration Decision', () => {
    it('should NOT display suppressed intervention', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 3,
      });
      const suppression = createEmptySuppressionState();
      suppression.suppressedMRTypes.add('MR18_OverDependence');
      suppression.suppressionExpiresAt['MR18_OverDependence'] =
        Date.now() + 30 * 60 * 1000;

      const decision = scheduleIntervention(
        'MR18_OverDependence' as any,
        0.7, // confidence 70%
        'medium',
        history,
        suppression
      );

      expect(decision.shouldDisplay).toBe(false);
      expect(decision.tier).toBe('suppress');
    });

    it('should display hard barrier when confidence >= 0.85', () => {
      const history = createEmptyHistory();
      const suppression = createEmptySuppressionState();

      const decision = scheduleIntervention(
        'MR_PATTERN_F_BARRIER' as any,
        0.87, // high confidence
        'hard',
        history,
        suppression
      );

      expect(decision.shouldDisplay).toBe(true);
      expect(decision.tier).toBe('hard');
      expect(decision.requiresAuthorization).toBe(true);
    });

    it('should NOT display hard barrier when confidence < 0.85', () => {
      const history = createEmptyHistory();
      const suppression = createEmptySuppressionState();

      const decision = scheduleIntervention(
        'MR_PATTERN_F_BARRIER' as any,
        0.75, // below threshold
        'medium',
        history,
        suppression
      );

      expect(decision.shouldDisplay).toBe(false);
      expect(decision.tier).toBe('suppress');
    });

    it('should display soft signal at 0.4-0.6 confidence', () => {
      const history = createEmptyHistory();
      const suppression = createEmptySuppressionState();

      const decision = scheduleIntervention(
        'MR13_Uncertainty' as any,
        0.55, // Within soft range
        'soft',
        history,
        suppression
      );

      expect(decision.shouldDisplay).toBe(true);
      expect(decision.tier).toBe('soft');
    });

    it('should display medium alert at 0.6-0.75 confidence', () => {
      const history = createEmptyHistory();
      const suppression = createEmptySuppressionState();

      const decision = scheduleIntervention(
        'MR18_OverDependence' as any,
        0.68, // Within medium range
        'medium',
        history,
        suppression
      );

      expect(decision.shouldDisplay).toBe(true);
      expect(decision.tier).toBe('medium');
    });

    it('should NOT display when confidence < 0.4', () => {
      const history = createEmptyHistory();
      const suppression = createEmptySuppressionState();

      const decision = scheduleIntervention(
        'MR13_Uncertainty' as any,
        0.3, // Below threshold
        'soft',
        history,
        suppression
      );

      expect(decision.shouldDisplay).toBe(false);
      expect(decision.tier).toBe('suppress');
    });
  });

  describe('recordInterventionAction: History Updates', () => {
    it('should increment dismissal count when user dismisses', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 1,
      });

      const { updatedHistory } = recordInterventionAction(
        'MR18_OverDependence',
        'dismiss',
        history,
        createEmptySuppressionState()
      );

      expect(updatedHistory['MR18_OverDependence'].dismissalCount).toBe(2);
    });

    it('should generate fatigue alert after 3rd dismissal', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 2,
      });

      const { fatigueAlert } = recordInterventionAction(
        'MR18_OverDependence',
        'dismiss',
        history,
        createEmptySuppressionState()
      );

      expect(fatigueAlert).toBeDefined();
      expect(fatigueAlert).toContain('3 times');
      expect(fatigueAlert).toContain('30 minutes');
    });

    it('should set suppression timer after 3 dismissals', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 2,
      });

      const suppression = createEmptySuppressionState();

      const { updatedSuppressionState } = recordInterventionAction(
        'MR18_OverDependence',
        'dismiss',
        history,
        suppression
      );

      expect(updatedSuppressionState.suppressedMRTypes.has('MR18_OverDependence')).toBe(
        true
      );
      expect(
        updatedSuppressionState.suppressionExpiresAt['MR18_OverDependence']
      ).toBeGreaterThan(Date.now());
    });

    it('should increment acted-on count when user acts', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        userActedOnCount: 0,
      });

      const { updatedHistory } = recordInterventionAction(
        'MR18_OverDependence',
        'acted',
        history,
        createEmptySuppressionState()
      );

      expect(updatedHistory['MR18_OverDependence'].userActedOnCount).toBe(1);
    });

    it('should reset dismissal count when user acts', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 3,
        userActedOnCount: 0,
      });

      const { updatedHistory } = recordInterventionAction(
        'MR18_OverDependence',
        'acted',
        history,
        createEmptySuppressionState()
      );

      // Acting on intervention resets fatigue
      expect(updatedHistory['MR18_OverDependence'].dismissalCount).toBe(0);
    });

    it('should clear suppression when user acts', () => {
      const history = createHistoryWithEntry('MR18_OverDependence', {
        dismissalCount: 3,
      });

      const suppression = createEmptySuppressionState();
      suppression.suppressedMRTypes.add('MR18_OverDependence');
      suppression.suppressionExpiresAt['MR18_OverDependence'] =
        Date.now() + 30 * 60 * 1000;

      const { updatedSuppressionState } = recordInterventionAction(
        'MR18_OverDependence',
        'acted',
        history,
        suppression
      );

      expect(
        updatedSuppressionState.suppressedMRTypes.has('MR18_OverDependence')
      ).toBe(false);
    });

    it('should track override as engagement (valuable data)', () => {
      const history = createHistoryWithEntry('MR_PATTERN_F_BARRIER', {
        userActedOnCount: 0,
      });

      const { updatedHistory } = recordInterventionAction(
        'MR_PATTERN_F_BARRIER',
        'override',
        history,
        createEmptySuppressionState()
      );

      // Override is counted as user engagement/action
      expect(updatedHistory['MR_PATTERN_F_BARRIER'].userActedOnCount).toBe(1);
    });
  });

  describe('calculateOverallFatigue: Cross-MR Fatigue', () => {
    it('should return 0 when no history', () => {
      const history = createEmptyHistory();
      const fatigue = calculateOverallFatigue(history);

      expect(fatigue).toBe(0);
    });

    it('should average fatigue across MR types', () => {
      const history = {
        MR13_Uncertainty: {
          dismissalCount: 1,
          lastDismissalTime: Date.now(),
          userActedOnCount: 0,
          cumulativeExposureMs: 0,
          createdAtMs: Date.now(),
        },
        MR18_OverDependence: {
          dismissalCount: 3,
          lastDismissalTime: Date.now(),
          userActedOnCount: 0,
          cumulativeExposureMs: 0,
          createdAtMs: Date.now(),
        },
      };

      const fatigue = calculateOverallFatigue(history);

      // Should be average of both
      expect(fatigue).toBeGreaterThan(0);
      expect(fatigue).toBeLessThan(100);
    });
  });

  describe('getSuppressionSummary: Dashboard Metrics', () => {
    it('should return empty when no suppressions active', () => {
      const suppression = createEmptySuppressionState();

      const summary = getSuppressionSummary(suppression);

      expect(summary.activeSuppressionsCount).toBe(0);
      expect(summary.suppessionsByType).toHaveLength(0);
    });

    it('should list active suppressions', () => {
      const suppression = createEmptySuppressionState();
      suppression.suppressedMRTypes.add('MR18_OverDependence');
      suppression.suppressionExpiresAt['MR18_OverDependence'] =
        Date.now() + 15 * 60 * 1000;

      const summary = getSuppressionSummary(suppression);

      expect(summary.activeSuppressionsCount).toBe(1);
      expect(summary.suppessionsByType[0].mrType).toBe('MR18_OverDependence');
      expect(summary.suppessionsByType[0].minutesRemaining).toBeCloseTo(15, 1);
    });

    it('should NOT list expired suppressions', () => {
      const suppression = createEmptySuppressionState();
      suppression.suppressedMRTypes.add('MR18_OverDependence');
      suppression.suppressionExpiresAt['MR18_OverDependence'] = Date.now() - 1000; // Expired

      const summary = getSuppressionSummary(suppression);

      expect(summary.activeSuppressionsCount).toBe(0);
      expect(summary.suppessionsByType).toHaveLength(0);
    });
  });
});
