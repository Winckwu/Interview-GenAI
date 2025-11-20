/**
 * Pattern Stability Calculator
 * Calculates pattern stability metrics over time
 *
 * Purpose:
 * - Track pattern convergence/divergence over conversation turns
 * - Identify stable vs volatile pattern behavior
 * - Detect oscillations between patterns (A↔D)
 *
 * Metrics:
 * - Stability score (0-1): How stable the pattern is
 * - Streak length: Consecutive turns with same pattern
 * - Volatility (0-1): Inverse of stability
 * - Trend direction: converging/diverging/oscillating/stable
 */

import { Pattern } from './RealtimePatternRecognizer';

export interface PatternHistoryEntry {
  pattern: Pattern;
  confidence: number;
  timestamp: number;
}

export interface StabilityMetrics {
  stability: number;              // 0-1: primary metric (weighted pattern consistency)
  dominantPattern: Pattern;       // Most frequent pattern in window
  streakLength: number;           // Consecutive turns with same pattern
  volatility: number;             // 0-1: instability (1 - stability)
  isStable: boolean;              // stability >= threshold
  trendDirection: 'converging' | 'diverging' | 'oscillating' | 'stable';
}

export class PatternStabilityCalculator {
  private readonly WINDOW_SIZE = 5;
  private readonly STABILITY_THRESHOLD = 0.7;

  /**
   * Calculate pattern stability from history
   *
   * @param history - Array of pattern detections with confidence scores
   * @returns Stability metrics
   */
  calculateStability(history: PatternHistoryEntry[]): StabilityMetrics {
    if (history.length < 2) {
      return this.getDefaultMetrics();
    }

    // Take last WINDOW_SIZE turns
    const recentHistory = history.slice(-this.WINDOW_SIZE);

    // 1. Calculate weighted stability
    const stability = this.calculateWeightedStability(recentHistory);

    // 2. Find dominant pattern
    const dominantPattern = this.findDominantPattern(recentHistory);

    // 3. Calculate streak length (consecutive same pattern)
    const streakLength = this.calculateStreakLength(history);

    // 4. Volatility = 1 - stability
    const volatility = 1 - stability;

    // 5. Check if stable
    const isStable = stability >= this.STABILITY_THRESHOLD;

    // 6. Analyze trend direction
    const trendDirection = this.analyzeTrend(history);

    return {
      stability,
      dominantPattern,
      streakLength,
      volatility,
      isStable,
      trendDirection
    };
  }

  /**
   * Calculate weighted stability
   * Recent turns and high-confidence predictions have higher weights
   *
   * Algorithm:
   * 1. Assign time weights (recent = higher)
   * 2. Weight by confidence
   * 3. Calculate dominant pattern's weight ratio
   *
   * @returns Stability score 0-1
   */
  private calculateWeightedStability(history: PatternHistoryEntry[]): number {
    if (history.length === 0) return 0;

    // Time weights: more recent = higher weight [0.4, 0.6, 0.8, 0.9, 1.0]
    const timeWeights = history.map((_, idx) =>
      history.length === 1 ? 1.0 : 0.4 + (idx / (history.length - 1)) * 0.6
    );

    // Count weighted occurrences of each pattern
    const patternWeights: Record<string, number> = {};
    let totalWeight = 0;

    history.forEach((entry, idx) => {
      const weight = timeWeights[idx] * entry.confidence;
      patternWeights[entry.pattern] = (patternWeights[entry.pattern] || 0) + weight;
      totalWeight += weight;
    });

    // Stability = max pattern weight / total weight
    const maxWeight = Math.max(...Object.values(patternWeights));
    const stability = totalWeight > 0 ? maxWeight / totalWeight : 0;

    return Math.min(stability, 1.0);
  }

  /**
   * Find dominant pattern (most frequent)
   */
  private findDominantPattern(history: PatternHistoryEntry[]): Pattern {
    const patternCounts: Record<string, number> = {};

    history.forEach(entry => {
      patternCounts[entry.pattern] = (patternCounts[entry.pattern] || 0) + 1;
    });

    const sorted = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1]);

    return (sorted[0]?.[0] as Pattern) || 'B';
  }

  /**
   * Calculate streak length (consecutive same pattern)
   * Counts backwards from most recent
   */
  private calculateStreakLength(history: PatternHistoryEntry[]): number {
    if (history.length === 0) return 0;

    const currentPattern = history[history.length - 1].pattern;
    let streak = 1;

    // Count backwards while pattern matches
    for (let i = history.length - 2; i >= 0; i--) {
      if (history[i].pattern === currentPattern) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Analyze trend direction
   *
   * - stable: 5 consecutive same pattern
   * - converging: recent 3 same pattern
   * - diverging: 3+ different patterns in last 5
   * - oscillating: 2 patterns alternating frequently
   */
  private analyzeTrend(history: PatternHistoryEntry[]): 'converging' | 'diverging' | 'oscillating' | 'stable' {
    if (history.length < 5) return 'converging';

    const recent5 = history.slice(-5);
    const uniquePatterns = new Set(recent5.map(e => e.pattern));

    // All 5 turns same pattern → stable
    if (uniquePatterns.size === 1) {
      return 'stable';
    }

    // Last 3 turns same pattern → converging
    const recent3 = history.slice(-3);
    const recent3Unique = new Set(recent3.map(e => e.pattern));
    if (recent3Unique.size === 1) {
      return 'converging';
    }

    // Pattern shift detected (first 2 = A, last 3 = B) → converging to new pattern
    const first2Pattern = recent5[0].pattern;
    const last3Pattern = recent5[4].pattern;
    const first2Same = recent5[0].pattern === recent5[1].pattern;
    const last3Same =
      recent5[2].pattern === recent5[3].pattern &&
      recent5[3].pattern === recent5[4].pattern;

    if (first2Same && last3Same && first2Pattern !== last3Pattern) {
      return 'converging';
    }

    // 3+ different patterns → diverging
    if (uniquePatterns.size >= 3) {
      return 'diverging';
    }

    // 2 patterns alternating → oscillating
    if (uniquePatterns.size === 2) {
      let switches = 0;

      for (let i = 1; i < recent5.length; i++) {
        if (recent5[i].pattern !== recent5[i - 1].pattern) {
          switches++;
        }
      }

      // 3+ switches in 5 turns = oscillation (A-D-A-D-A)
      if (switches >= 3) {
        return 'oscillating';
      }
    }

    return 'converging';
  }

  /**
   * Get default metrics when insufficient data
   */
  private getDefaultMetrics(): StabilityMetrics {
    return {
      stability: 0,
      dominantPattern: 'B' as Pattern,
      streakLength: 0,
      volatility: 1,
      isStable: false,
      trendDirection: 'converging'
    };
  }

  /**
   * Record stability snapshot to database (for historical analysis)
   */
  async recordStabilitySnapshot(
    userId: string,
    sessionId: string,
    metrics: StabilityMetrics,
    turnNumber: number
  ): Promise<void> {
    // Import pool dynamically to avoid circular dependencies
    const { default: pool } = await import('../config/database');

    try {
      await pool.query(
        `INSERT INTO pattern_stability_snapshots
         (user_id, session_id, dominant_pattern, stability_score, streak_length, volatility, trend_direction, window_size, turn_number, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          userId,
          sessionId,
          metrics.dominantPattern,
          metrics.stability,
          metrics.streakLength,
          metrics.volatility,
          metrics.trendDirection,
          this.WINDOW_SIZE,
          turnNumber
        ]
      );

      console.log(
        `[PatternStabilityCalculator] Recorded stability snapshot: ${metrics.dominantPattern} (stability=${metrics.stability.toFixed(2)}, trend=${metrics.trendDirection})`
      );
    } catch (error: any) {
      console.error('[PatternStabilityCalculator] Database error:', error.message);
      // Don't throw - non-critical operation
    }
  }
}

export default PatternStabilityCalculator;
