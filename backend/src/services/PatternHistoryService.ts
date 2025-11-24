/**
 * Pattern History Service
 * Manages cross-session pattern memory and historical prior calculation
 *
 * Purpose:
 * - Store pattern detection results across sessions
 * - Calculate historical prior probabilities for Bayesian initialization
 * - Track user's dominant pattern and stability over time
 * - Integrate initial assessment questionnaire data (NEW)
 *
 * Data Sources (Priority Order):
 * 1. pattern_detections table (behavioral history)
 * 2. assessments table (questionnaire results)
 * 3. Uniform prior (fallback)
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

// NEW: Assessment data interface
export interface AssessmentPrior {
  source: 'assessment' | 'history' | 'uniform';
  prior: Record<Pattern, number>;
  confidence: number;  // How confident we are in this prior
  assessmentId?: string;
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
   * NEW: Get assessment-based prior from questionnaire results
   *
   * Maps 4-dimensional metacognitive scores to pattern probabilities:
   * - High Planning → Pattern A (Strategic Decomposition)
   * - High Monitoring → Pattern B (Iterative Refinement)
   * - High Evaluation → Pattern D (Critical Evaluation)
   * - High Regulation → Pattern C (Adaptive Learning)
   * - Low overall → Pattern F (Passive Over-Reliance)
   *
   * @param userId - User ID
   * @returns Assessment-based prior with confidence
   */
  async getAssessmentBasedPrior(userId: string): Promise<AssessmentPrior | null> {
    try {
      // Get latest assessment
      const result = await pool.query(
        `SELECT id, planning_score, monitoring_score, evaluation_score, regulation_score, overall_score
         FROM assessments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const assessment = result.rows[0];
      const planning = parseFloat(assessment.planning_score) || 0;
      const monitoring = parseFloat(assessment.monitoring_score) || 0;
      const evaluation = parseFloat(assessment.evaluation_score) || 0;
      const regulation = parseFloat(assessment.regulation_score) || 0;
      const overall = parseFloat(assessment.overall_score) || 0;

      // Calculate pattern probabilities based on metacognitive profile
      // Higher dimension score → higher probability for corresponding pattern
      const prior = this.calculateAssessmentPrior(planning, monitoring, evaluation, regulation, overall);

      console.log(`[PatternHistoryService] Assessment-based prior for user ${userId}:`, {
        scores: { planning, monitoring, evaluation, regulation, overall },
        prior
      });

      return {
        source: 'assessment',
        prior,
        confidence: overall, // Use overall score as confidence
        assessmentId: assessment.id
      };
    } catch (error) {
      console.error('[PatternHistoryService] Error getting assessment prior:', error);
      return null;
    }
  }

  /**
   * NEW: Calculate pattern probabilities from metacognitive assessment scores
   *
   * Mapping logic:
   * - Pattern A: Planning-dominant (strategic, goal-oriented)
   * - Pattern B: Monitoring-dominant (iterative, verification-focused)
   * - Pattern C: Regulation-dominant (adaptive, flexible)
   * - Pattern D: Evaluation-dominant (critical, analytical)
   * - Pattern E: Balanced high scores (pedagogical, reflective)
   * - Pattern F: Low overall (passive, over-reliant)
   *
   * @param planning - Planning dimension score (0-1)
   * @param monitoring - Monitoring dimension score (0-1)
   * @param evaluation - Evaluation dimension score (0-1)
   * @param regulation - Regulation dimension score (0-1)
   * @param overall - Overall score (0-1)
   * @returns Pattern probability distribution
   */
  private calculateAssessmentPrior(
    planning: number,
    monitoring: number,
    evaluation: number,
    regulation: number,
    overall: number
  ): Record<Pattern, number> {
    // Base probabilities from dimension strengths
    const rawProbs: Record<Pattern, number> = {
      'A': planning * 0.8,      // Planning → Strategic Decomposition
      'B': monitoring * 0.8,    // Monitoring → Iterative Refinement
      'C': regulation * 0.8,    // Regulation → Adaptive Learning
      'D': evaluation * 0.8,    // Evaluation → Critical Evaluation
      'E': 0.1,                 // E is rare, give small base probability
      'F': 0.1                  // F probability based on overall score
    };

    // Pattern E: High balanced scores (all dimensions > 0.6)
    const allHigh = planning > 0.6 && monitoring > 0.6 && evaluation > 0.6 && regulation > 0.6;
    if (allHigh) {
      rawProbs['E'] = 0.4;
    }

    // Pattern F: Low overall metacognitive engagement
    // If overall < 0.4, increase F probability significantly
    if (overall < 0.4) {
      rawProbs['F'] = 0.6;
      // Reduce other probabilities
      (['A', 'B', 'C', 'D', 'E'] as Pattern[]).forEach(p => {
        rawProbs[p] *= 0.5;
      });
    } else if (overall < 0.6) {
      rawProbs['F'] = 0.3;
    }

    // Normalize to sum to 1
    const total = Object.values(rawProbs).reduce((sum, val) => sum + val, 0);
    const normalized: Record<Pattern, number> = {} as any;

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      normalized[pattern] = Math.max(rawProbs[pattern] / total, 0.01); // Minimum 1%
    });

    // Re-normalize after floor
    const newTotal = Object.values(normalized).reduce((sum, val) => sum + val, 0);
    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      normalized[pattern] /= newTotal;
    });

    return normalized;
  }

  /**
   * NEW: Get combined prior (assessment + history)
   * Priority: History > Assessment > Uniform
   *
   * If user has pattern history: use history (80%) + assessment (20%)
   * If user only has assessment: use assessment (70%) + uniform (30%)
   * If user has neither: use uniform
   *
   * @param userId - User ID
   * @returns Combined prior with source information
   */
  async getCombinedPrior(userId: string): Promise<AssessmentPrior> {
    const historyPrior = await this.getUserPatternPrior(userId);
    const assessmentData = await this.getAssessmentBasedPrior(userId);

    // Check if history has meaningful data (not uniform)
    const isUniform = Object.values(historyPrior).every(
      v => Math.abs(v - 1/6) < 0.01
    );

    if (!isUniform) {
      // Has history data
      if (assessmentData) {
        // Blend history (80%) + assessment (20%)
        const blended = this.blendPriors(historyPrior, assessmentData.prior, 0.8);
        console.log(`[PatternHistoryService] Using blended prior (80% history + 20% assessment)`);
        return {
          source: 'history',
          prior: blended,
          confidence: 0.8,
          assessmentId: assessmentData.assessmentId
        };
      } else {
        // History only
        return {
          source: 'history',
          prior: historyPrior,
          confidence: 0.7
        };
      }
    } else if (assessmentData) {
      // No history, but has assessment
      // Blend assessment (70%) + uniform (30%)
      const blended = this.blendPriors(assessmentData.prior, this.getUniformPrior(), 0.7);
      console.log(`[PatternHistoryService] Using assessment-based prior (70% assessment + 30% uniform)`);
      return {
        source: 'assessment',
        prior: blended,
        confidence: assessmentData.confidence * 0.7,
        assessmentId: assessmentData.assessmentId
      };
    } else {
      // Neither history nor assessment
      return {
        source: 'uniform',
        prior: this.getUniformPrior(),
        confidence: 0.0
      };
    }
  }

  /**
   * Blend two priors with specified weights
   * @private
   */
  private blendPriors(
    prior1: Record<Pattern, number>,
    prior2: Record<Pattern, number>,
    weight1: number
  ): Record<Pattern, number> {
    const blended: Record<Pattern, number> = {} as any;
    const weight2 = 1 - weight1;

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      blended[pattern] = prior1[pattern] * weight1 + prior2[pattern] * weight2;
    });

    return blended;
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
