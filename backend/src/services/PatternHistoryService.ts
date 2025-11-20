/**
 * Pattern History Service
 * Manages cross-session pattern memory and historical prior calculation
 *
 * Purpose:
 * - Store pattern detection results across sessions
 * - Calculate historical prior probabilities for Bayesian initialization
 * - Track user's dominant pattern and stability over time
 *
 * Used by: RealtimePatternRecognizer to initialize with informed priors
 */

import pool from '../config/database';

export type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface UserPatternHistory {
  userId: string;
  dominantPattern: Pattern;
  dominantConfidence: number;
  patternDistribution: Record<Pattern, number>;
  totalSessions: number;
  lastSessionAt: Date;
}

export interface DominantPatternInfo {
  pattern: Pattern;
  confidence: number;
  stability: number;  // 0-1: how consistent this pattern is
  totalDetections: number;
}

export class PatternHistoryService {
  /**
   * Get user's historical pattern prior for Bayesian initialization
   * Returns a probability distribution biased towards the user's historical patterns
   *
   * @param userId - User ID
   * @param daysBack - How many days of history to consider (default 30)
   * @returns Pattern prior distribution
   */
  async getUserPatternPrior(
    userId: string,
    daysBack: number = 30
  ): Promise<Record<Pattern, number>> {
    try {
      // Query recent pattern detections
      const result = await pool.query(
        `SELECT pattern_type, AVG(confidence) as avg_confidence, COUNT(*) as count
         FROM pattern_detections
         WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '${daysBack} days'
         GROUP BY pattern_type`,
        [userId]
      );

      // If no history, return uniform prior
      if (result.rows.length === 0) {
        return this.getUniformPrior();
      }

      // Calculate weighted historical distribution
      const totalCount = result.rows.reduce((sum: number, row: any) =>
        sum + parseInt(row.count), 0
      );

      const historicalDistribution: Record<string, number> = {};

      result.rows.forEach((row: any) => {
        const pattern = row.pattern_type;
        const weight = parseInt(row.count) / totalCount;
        const confidence = parseFloat(row.avg_confidence);

        // Weight by frequency × confidence
        historicalDistribution[pattern] = weight * confidence;
      });

      // Normalize to probability distribution
      const total = Object.values(historicalDistribution)
        .reduce((sum, val) => sum + val, 0);

      const normalizedDistribution: Record<Pattern, number> = {} as any;

      (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
        if (historicalDistribution[pattern]) {
          normalizedDistribution[pattern] = historicalDistribution[pattern] / total;
        } else {
          normalizedDistribution[pattern] = 0.01; // Minimum value
        }
      });

      // Smooth with uniform prior (80% historical + 20% uniform)
      const smoothedPrior = this.smoothPrior(normalizedDistribution, 0.8);

      console.log(`[PatternHistoryService] Loaded prior for user ${userId}:`, smoothedPrior);

      return smoothedPrior;
    } catch (error) {
      console.error('[PatternHistoryService] Error loading prior:', error);
      // Fallback to uniform prior on error
      return this.getUniformPrior();
    }
  }

  /**
   * Get user's dominant pattern (most frequent over time)
   *
   * @param userId - User ID
   * @param daysBack - Days to look back (default 30)
   * @returns Dominant pattern info or null if insufficient data
   */
  async getDominantPattern(
    userId: string,
    daysBack: number = 30
  ): Promise<DominantPatternInfo | null> {
    try {
      // Get last 10 pattern detections
      const result = await pool.query(
        `SELECT pattern_type, confidence, created_at
         FROM pattern_detections
         WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '${daysBack} days'
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
      );

      if (result.rows.length < 3) {
        return null; // Insufficient data
      }

      // Count pattern frequencies
      const patternCounts: Record<string, number> = {};
      result.rows.forEach((row: any) => {
        const pattern = row.pattern_type;
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });

      // Find dominant pattern
      const sortedPatterns = Object.entries(patternCounts)
        .sort((a, b) => b[1] - a[1]);

      const dominantPattern = sortedPatterns[0][0] as Pattern;
      const dominantCount = sortedPatterns[0][1];

      // Calculate stability (how often dominant pattern appears)
      const stability = dominantCount / result.rows.length;

      // Calculate average confidence for dominant pattern
      const avgConfidence = result.rows
        .filter((row: any) => row.pattern_type === dominantPattern)
        .reduce((sum: number, row: any) => sum + parseFloat(row.confidence), 0) / dominantCount;

      return {
        pattern: dominantPattern,
        confidence: avgConfidence,
        stability,
        totalDetections: result.rows.length
      };
    } catch (error) {
      console.error('[PatternHistoryService] Error getting dominant pattern:', error);
      return null;
    }
  }

  /**
   * Record a pattern detection result
   *
   * @param userId - User ID
   * @param sessionId - Session ID
   * @param pattern - Detected pattern
   * @param confidence - Confidence score (0-1)
   * @param probabilities - Full probability distribution
   */
  async recordPatternDetection(
    userId: string,
    sessionId: string,
    pattern: Pattern,
    confidence: number,
    probabilities: Record<Pattern, number>
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO pattern_detections
         (user_id, session_id, pattern_type, confidence, probabilities, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, sessionId, pattern, confidence, JSON.stringify(probabilities)]
      );

      console.log(`[PatternHistoryService] Recorded pattern ${pattern} (confidence=${confidence.toFixed(2)}) for user ${userId}`);
    } catch (error) {
      console.error('[PatternHistoryService] Error recording pattern:', error);
      // Don't throw - non-critical operation
    }
  }

  /**
   * Get pattern distribution statistics for a user
   *
   * @param userId - User ID
   * @param daysBack - Days to analyze
   * @returns Pattern distribution percentages
   */
  async getPatternDistribution(
    userId: string,
    daysBack: number = 30
  ): Promise<Record<Pattern, number>> {
    try {
      const result = await pool.query(
        `SELECT pattern_type, COUNT(*) as count
         FROM pattern_detections
         WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '${daysBack} days'
         GROUP BY pattern_type`,
        [userId]
      );

      if (result.rows.length === 0) {
        return this.getUniformPrior();
      }

      const totalCount = result.rows.reduce((sum: number, row: any) =>
        sum + parseInt(row.count), 0
      );

      const distribution: Record<Pattern, number> = {} as any;

      (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
        const row = result.rows.find((r: any) => r.pattern_type === pattern);
        distribution[pattern] = row ? parseInt(row.count) / totalCount : 0;
      });

      return distribution;
    } catch (error) {
      console.error('[PatternHistoryService] Error getting distribution:', error);
      return this.getUniformPrior();
    }
  }

  /**
   * Get uniform prior (no historical bias)
   * @private
   */
  private getUniformPrior(): Record<Pattern, number> {
    return {
      'A': 1 / 6,
      'B': 1 / 6,
      'C': 1 / 6,
      'D': 1 / 6,
      'E': 1 / 6,
      'F': 1 / 6
    };
  }

  /**
   * Smooth prior by mixing with uniform distribution
   * Prevents overfitting to historical data
   *
   * @param historicalPrior - Prior based on history
   * @param historicalWeight - Weight of historical prior (0-1)
   * @private
   */
  private smoothPrior(
    historicalPrior: Record<Pattern, number>,
    historicalWeight: number = 0.8
  ): Record<Pattern, number> {
    const uniformPrior = this.getUniformPrior();
    const uniformWeight = 1 - historicalWeight;

    const smoothed: Record<Pattern, number> = {} as any;

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      smoothed[pattern] =
        historicalPrior[pattern] * historicalWeight +
        uniformPrior[pattern] * uniformWeight;
    });

    // Renormalize
    const total = Object.values(smoothed).reduce((sum, val) => sum + val, 0);
    Object.keys(smoothed).forEach(pattern => {
      smoothed[pattern as Pattern] = smoothed[pattern as Pattern] / total;
    });

    return smoothed;
  }
}

export default new PatternHistoryService();
