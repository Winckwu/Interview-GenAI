/**
 * Pattern Transition Detector
 * Detects when users shift between AI usage patterns (A→B/D/F)
 *
 * Purpose:
 * - Monitor pattern degradation (especially A→F critical regressions)
 * - Identify trigger factors for pattern changes
 * - Enable proactive intervention
 *
 * Used by: RealtimePatternRecognizer to track pattern evolution over time
 */

import pool from '../config/database';
import { BehavioralSignals } from './BehaviorSignalDetector';
import { PatternEstimate, Pattern } from './RealtimePatternRecognizer';

export type TransitionType = 'improvement' | 'regression' | 'lateral' | 'oscillation';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface TriggerFactors {
  taskComplexityIncrease?: boolean;
  timePressure?: boolean;
  fatigueIndicator?: boolean;
  consecutiveFailures?: number;
  verificationRateDrop?: number;
  aiRelianceIncrease?: boolean;
  criticalRegression?: boolean;
  [key: string]: boolean | number | undefined;
}

export interface PatternTransition {
  fromPattern: Pattern;
  toPattern: Pattern;
  transitionType: TransitionType;
  confidence: number;
  triggerFactors: TriggerFactors;
  timestamp: Date;
  severity: Severity;
}

interface PatternHistoryEntry {
  pattern: Pattern;
  timestamp: number;
  confidence: number;
  signals?: BehavioralSignals;
}

export class PatternTransitionDetector {
  private patternHistory: PatternHistoryEntry[] = [];
  private readonly HISTORY_WINDOW = 5; // Keep last 5 pattern estimates
  private sessionStartTime: number;
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.sessionStartTime = Date.now();
  }

  /**
   * Detect pattern transitions
   * Called after each RealtimePatternRecognizer update
   *
   * @param currentEstimate - Current pattern estimate
   * @param signals - Behavioral signals from current turn
   * @param sessionContext - Session metadata
   * @returns PatternTransition if detected, null otherwise
   */
  detectTransition(
    currentEstimate: PatternEstimate,
    signals: BehavioralSignals,
    sessionContext: {
      messageCount: number;
      taskComplexity: number;
      timeElapsed: number;
    }
  ): PatternTransition | null {
    // 1. Add to history
    this.patternHistory.push({
      pattern: currentEstimate.topPattern,
      timestamp: Date.now(),
      confidence: currentEstimate.confidence,
      signals
    });

    // 2. Maintain window size
    if (this.patternHistory.length > this.HISTORY_WINDOW) {
      this.patternHistory.shift();
    }

    // 3. Need at least 3 data points to detect transition
    if (this.patternHistory.length < 3) {
      return null;
    }

    // 4. Detect stable transition (3 consecutive same pattern → new pattern)
    const recent3 = this.patternHistory.slice(-3);
    const prev2Same = recent3[0].pattern === recent3[1].pattern;
    const currentDifferent = recent3[2].pattern !== recent3[1].pattern;

    if (prev2Same && currentDifferent) {
      const fromPattern = recent3[1].pattern;
      const toPattern = recent3[2].pattern;

      // 5. Classify transition type
      const transitionType = this.classifyTransition(fromPattern, toPattern);

      // 6. Analyze trigger factors
      const triggerFactors = this.analyzeTriggerFactors(
        fromPattern,
        toPattern,
        signals,
        sessionContext,
        recent3
      );

      // 7. Calculate severity
      const severity = this.calculateSeverity(fromPattern, toPattern, triggerFactors);

      const transition: PatternTransition = {
        fromPattern,
        toPattern,
        transitionType,
        confidence: recent3[2].confidence,
        triggerFactors,
        timestamp: new Date(),
        severity
      };

      // 8. Record to database (non-blocking)
      this.recordTransition(transition, sessionContext).catch((err: any) => {
        console.error('[PatternTransitionDetector] Failed to record transition:', err);
      });

      return transition;
    }

    return null;
  }

  /**
   * Classify transition type based on pattern quality change
   *
   * Pattern hierarchy: A/D > C/E > B > F
   */
  private classifyTransition(from: Pattern, to: Pattern): TransitionType {
    // Pattern rank (higher = better)
    const patternRank: Record<Pattern, number> = {
      'A': 5, 'D': 5,  // Optimal
      'C': 4, 'E': 4,  // Good
      'B': 3,          // Medium
      'F': 1           // Dangerous
    };

    const rankChange = patternRank[to] - patternRank[from];

    if (rankChange > 0) return 'improvement';
    if (rankChange < 0) return 'regression';

    // Check oscillation (A↔D, C↔E frequent switching)
    if ((from === 'A' && to === 'D') || (from === 'D' && to === 'A')) {
      return 'oscillation';
    }
    if ((from === 'C' && to === 'E') || (from === 'E' && to === 'C')) {
      return 'oscillation';
    }

    return 'lateral';
  }

  /**
   * Analyze trigger factors that caused the transition
   * Focus on A→B/D/F degradation factors
   */
  private analyzeTriggerFactors(
    from: Pattern,
    to: Pattern,
    signals: BehavioralSignals,
    context: { messageCount: number; taskComplexity: number; timeElapsed: number },
    recent3: PatternHistoryEntry[]
  ): TriggerFactors {
    const factors: TriggerFactors = {};

    // Get previous signals for comparison
    const prevSignals = recent3[1].signals;

    // Factor 1: Verification rate drop
    if (prevSignals && prevSignals.verificationAttempted && !signals.verificationAttempted) {
      factors.verificationRateDrop = 1.0; // Dropped from verified to unverified
    }

    // Factor 2: Task complexity increase
    if (signals.taskComplexity > 2) {
      factors.taskComplexityIncrease = true;
    }

    // Factor 3: Time pressure (rapid-fire messages)
    const avgInterval = this.getAverageMessageInterval();
    if (avgInterval < 30000) { // < 30 seconds
      factors.timePressure = true;
    }

    // Factor 4: Fatigue indicator (session > 60 min)
    if (context.timeElapsed > 60 * 60 * 1000) {
      factors.fatigueIndicator = true;
    }

    // Factor 5: AI reliance increase
    if (prevSignals && signals.aiRelianceDegree > prevSignals.aiRelianceDegree) {
      factors.aiRelianceIncrease = true;
    }

    // Factor 6: A→F critical regression
    if (from === 'A' && to === 'F') {
      factors.criticalRegression = true;
    }

    return factors;
  }

  /**
   * Calculate severity of transition
   *
   * Critical: A→F (expert degrades to passive)
   * High: Any pattern→F
   * Medium: A→B/D (expert shows degradation)
   * Low: All other transitions
   */
  private calculateSeverity(
    from: Pattern,
    to: Pattern,
    factors: TriggerFactors
  ): Severity {
    // A→F = critical (expert degrades to passive blind acceptance)
    if (from === 'A' && to === 'F') return 'critical';

    // Any pattern→F = high (user becoming over-reliant)
    if (to === 'F') return 'high';

    // A→B/D = medium (potential degradation from expert)
    if (from === 'A' && (to === 'B' || to === 'D')) return 'medium';

    // Other regressions = medium
    if (factors.verificationRateDrop && factors.verificationRateDrop > 0.5) return 'medium';

    return 'low';
  }

  /**
   * Record transition to database for historical analysis
   */
  private async recordTransition(
    transition: PatternTransition,
    sessionContext: { messageCount: number; taskComplexity: number; timeElapsed: number }
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO pattern_transitions
         (user_id, session_id, from_pattern, to_pattern, transition_type, confidence, severity, trigger_factors, turn_number, message_count, session_elapsed_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          this.userId,
          this.sessionId,
          transition.fromPattern,
          transition.toPattern,
          transition.transitionType,
          transition.confidence,
          transition.severity,
          JSON.stringify(transition.triggerFactors),
          sessionContext.messageCount,
          sessionContext.messageCount,
          sessionContext.timeElapsed
        ]
      );

      console.log(
        `[PatternTransitionDetector] Recorded ${transition.severity} transition: ${transition.fromPattern}→${transition.toPattern} for user ${this.userId}`
      );
    } catch (error: any) {
      console.error('[PatternTransitionDetector] Database error:', error.message);
      // Don't throw - non-critical operation
    }
  }

  /**
   * Calculate average time between messages in session
   * Used to detect time pressure
   */
  private getAverageMessageInterval(): number {
    if (this.patternHistory.length < 2) {
      return 60000; // Default: 1 minute
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.patternHistory.length; i++) {
      intervals.push(this.patternHistory[i].timestamp - this.patternHistory[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return avgInterval;
  }

  /**
   * Get pattern history for debugging/analysis
   */
  getPatternHistory(): PatternHistoryEntry[] {
    return [...this.patternHistory];
  }

  /**
   * Reset detector state (used when starting new session)
   */
  reset(): void {
    this.patternHistory = [];
    this.sessionStartTime = Date.now();
  }
}

export default PatternTransitionDetector;
