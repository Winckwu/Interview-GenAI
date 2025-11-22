/**
 * Pattern Detection Service
 * Integrates PatternRecognitionEngine with database persistence
 */

import pool from '../config/database';
import { PatternRecognitionEngine } from './core/PatternRecognitionEngine';
import SessionService, { Interaction } from './sessionService';
import { v4 as uuidv4 } from 'uuid';

export interface PatternDetectionResult {
  detectedPattern: string;
  confidence: number;
  stability?: number;            // 0-1: Pattern stability over time
  streakLength?: number;         // Consecutive turns with same pattern
  trendDirection?: 'converging' | 'diverging' | 'oscillating' | 'stable';
  features: Record<string, number>;
  allProbabilities: Record<string, number>;
  method: 'rule_based' | 'ml_ensemble';
  evidence: string[];
  recommendations: string[];
}

export interface PatternLog {
  id: string;
  sessionId: string;
  userId: string;
  detectedPattern: string;
  confidence: number;
  detectionMethod: string;
  features: Record<string, any>;
  allProbabilities: Record<string, number>;
  createdAt: Date;
}

export class PatternDetectionService {
  private patternEngine = new PatternRecognitionEngine();

  /**
   * Analyze a session and detect user's AI usage pattern
   */
  async detectSessionPattern(sessionId: string): Promise<PatternDetectionResult> {
    // Get session interactions
    const interactions = await SessionService.getSessionInteractions(sessionId, 1000);

    if (interactions.length === 0) {
      // Try to get user's historical pattern for better initial estimate
      const session = await SessionService.getSession(sessionId);
      let defaultPattern = 'B'; // Most common pattern
      let defaultConfidence = 0.4; // Low but not zero - indicates "early estimation"

      if (session?.userId) {
        try {
          // Check user's historical dominant pattern
          const { PatternHistoryService } = await import('./PatternHistoryService');
          const historyService = new PatternHistoryService();
          const dominant = await historyService.getDominantPattern(session.userId);

          if (dominant && dominant.totalDetections >= 3) {
            // Use historical pattern with adjusted confidence
            defaultPattern = dominant.pattern;
            // Scale historical confidence: 0.3-0.5 range for initial estimate
            defaultConfidence = Math.max(0.3, Math.min(0.5, dominant.confidence * 0.6));
          }
        } catch (error) {
          console.log('[PatternDetection] No historical data available, using defaults');
        }
      }

      return {
        detectedPattern: defaultPattern,
        confidence: defaultConfidence,
        features: {},
        allProbabilities: {
          A: defaultPattern === 'A' ? defaultConfidence : 0.25,
          B: defaultPattern === 'B' ? defaultConfidence : 0.25,
          C: defaultPattern === 'C' ? defaultConfidence : 0.25,
          D: defaultPattern === 'D' ? defaultConfidence : 0.25,
        },
        method: 'rule_based',
        evidence: [
          'Session just started - using historical pattern estimate',
          `Initial pattern: ${defaultPattern}`,
          'Confidence will improve as you interact'
        ],
        recommendations: [
          'Continue the conversation to refine pattern detection',
          'Your pattern will be more accurately detected after 3-5 interactions'
        ],
      };
    }

    // Calculate features from interactions
    const features = this.extractFeaturesFromInteractions(interactions);

    // Analyze pattern using PatternRecognitionEngine
    const analysis = this.patternEngine.analyzeUserBehavior({
      totalInteractions: interactions.length,
      verificationRate: features.verification_rate,
      modificationRate: features.modification_rate,
      iterationFrequency: features.iteration_frequency,
      promptSpecificity: features.prompt_specificity,
      reflectionDepth: features.reflection_depth,
      taskDecompositionScore: features.task_decomposition_score,
      strategyDiversity: features.strategy_diversity,
      independentAttemptRate: features.independent_attempt_rate,
      errorAwareness: features.error_awareness,
      crossModelUsage: features.cross_model_usage,
      trustCalibrationAccuracy: features.trust_calibration_accuracy,
    });

    // Calculate pattern stability from session history
    let stabilityMetrics = null;
    try {
      const sessionPatternHistory = await this.getSessionPatternHistory(sessionId);
      if (sessionPatternHistory.length >= 2) {
        const { PatternStabilityCalculator } = await import('./PatternStabilityCalculator');
        const stabilityCalc = new PatternStabilityCalculator();

        // Add current detection to history
        const historyWithCurrent = [
          ...sessionPatternHistory,
          {
            pattern: analysis.primaryPattern as any,
            confidence: analysis.confidence,
            timestamp: Date.now()  // Unix timestamp in milliseconds
          }
        ];

        stabilityMetrics = stabilityCalc.calculateStability(historyWithCurrent);
      }
    } catch (error) {
      console.log('[PatternDetection] Could not calculate stability:', error);
    }

    return {
      detectedPattern: analysis.primaryPattern,
      confidence: analysis.confidence,
      stability: stabilityMetrics?.stability,
      streakLength: stabilityMetrics?.streakLength,
      trendDirection: stabilityMetrics?.trendDirection,
      features,
      allProbabilities: analysis.patternScores,
      method: 'rule_based',
      evidence: analysis.evidence,
      recommendations: analysis.recommendations,
    };
  }

  /**
   * Get pattern detection history for a session
   */
  private async getSessionPatternHistory(sessionId: string): Promise<Array<{
    pattern: string;
    confidence: number;
    timestamp: number;  // Unix timestamp in milliseconds
  }>> {
    try {
      const result = await pool.query(
        `SELECT detected_pattern, confidence, created_at
         FROM pattern_logs
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [sessionId]
      );

      return result.rows.map(row => ({
        pattern: row.detected_pattern,
        confidence: parseFloat(row.confidence),
        timestamp: new Date(row.created_at).getTime()  // Convert to Unix timestamp
      }));
    } catch (error) {
      console.error('[PatternDetection] Error fetching session history:', error);
      return [];
    }
  }

  /**
   * Save pattern detection to database
   */
  async savePatternDetection(
    sessionId: string,
    userId: string,
    detection: PatternDetectionResult
  ): Promise<PatternLog> {
    const id = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO pattern_logs
       (id, session_id, user_id, detected_pattern, confidence, detection_method, features, all_probabilities, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        sessionId,
        userId,
        detection.detectedPattern,
        detection.confidence,
        detection.method,
        JSON.stringify(detection.features),
        JSON.stringify(detection.allProbabilities),
        now,
      ]
    );

    return this.mapToPatternLog(result.rows[0]);
  }

  /**
   * Get the last pattern detection for a specific session
   */
  async getSessionPatternDetection(sessionId: string): Promise<PatternLog | null> {
    const result = await pool.query(
      `SELECT * FROM pattern_logs
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [sessionId]
    );

    return result.rows.length > 0 ? this.mapToPatternLog(result.rows[0]) : null;
  }

  /**
   * Get user's pattern history
   */
  async getUserPatternHistory(userId: string, limit: number = 100): Promise<PatternLog[]> {
    const result = await pool.query(
      `SELECT * FROM pattern_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapToPatternLog(row));
  }

  /**
   * Get pattern statistics for user with detailed metrics
   */
  async getUserPatternStats(userId: string): Promise<any> {
    // Basic pattern distribution
    const result = await pool.query(
      `SELECT detected_pattern, COUNT(*) as count, AVG(confidence::float) as avg_confidence
       FROM pattern_logs
       WHERE user_id = $1
       GROUP BY detected_pattern
       ORDER BY count DESC`,
      [userId]
    );

    const patterns: Record<string, any> = {};
    let totalCount = 0;

    result.rows.forEach((row: any) => {
      patterns[row.detected_pattern] = {
        count: parseInt(row.count),
        avgConfidence: parseFloat(row.avg_confidence),
      };
      totalCount += parseInt(row.count);
    });

    const distribution: Record<string, number> = {};
    Object.keys(patterns).forEach(pattern => {
      distribution[pattern] = patterns[pattern].count / totalCount;
    });

    const dominantPattern = result.rows.length > 0 ? result.rows[0].detected_pattern : null;

    // Calculate verification score (how often user verifies AI responses)
    const verificationResult = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN was_verified = true THEN 1 ELSE 0 END) as verified_count
       FROM interactions i
       JOIN work_sessions s ON i.session_id = s.id
       WHERE s.user_id = $1`,
      [userId]
    );
    const totalInteractions = parseInt(verificationResult.rows[0]?.total || '0');
    const verifiedCount = parseInt(verificationResult.rows[0]?.verified_count || '0');
    const verificationScore = totalInteractions > 0 ? verifiedCount / totalInteractions : 0;

    // Calculate AI reliance score (how often user accepts AI responses without modification)
    const modificationResult = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN was_modified = true THEN 1 ELSE 0 END) as modified_count
       FROM interactions i
       JOIN work_sessions s ON i.session_id = s.id
       WHERE s.user_id = $1`,
      [userId]
    );
    const modifiedCount = parseInt(modificationResult.rows[0]?.modified_count || '0');
    // AI reliance = (total - modified) / total = 1 - modification rate
    // Higher means more reliance on AI without modification
    const aiRelianceScore = totalInteractions > 0 ? (totalInteractions - modifiedCount) / totalInteractions : 0;

    // Calculate context switching frequency (average pattern changes per session)
    const sessionPatternResult = await pool.query(
      `SELECT session_id, detected_pattern, created_at
       FROM pattern_logs
       WHERE user_id = $1
       ORDER BY session_id, created_at`,
      [userId]
    );

    let contextSwitches = 0;
    let sessionsAnalyzed = 0;
    let lastSessionId = '';
    let lastPattern = '';

    sessionPatternResult.rows.forEach((row: any) => {
      if (row.session_id !== lastSessionId) {
        // New session
        lastSessionId = row.session_id;
        lastPattern = row.detected_pattern;
        sessionsAnalyzed++;
      } else if (row.detected_pattern !== lastPattern) {
        // Pattern changed within same session
        contextSwitches++;
        lastPattern = row.detected_pattern;
      }
    });

    const contextSwitchingFrequency = sessionsAnalyzed > 0 ? contextSwitches / sessionsAnalyzed : 0;

    // Calculate stability (how consistent the pattern is over recent sessions)
    const recentPatternsResult = await pool.query(
      `SELECT DISTINCT ON (session_id) session_id, detected_pattern
       FROM pattern_logs
       WHERE user_id = $1
       ORDER BY session_id, created_at DESC
       LIMIT 10`,
      [userId]
    );

    const recentPatterns = recentPatternsResult.rows.map((r: any) => r.detected_pattern);
    const dominantInRecent = recentPatterns.filter((p: string) => p === dominantPattern).length;
    const stability = recentPatterns.length > 0 ? dominantInRecent / recentPatterns.length : 0;

    // Calculate streak length (consecutive sessions with same pattern)
    const sessionOrderResult = await pool.query(
      `SELECT DISTINCT ON (session_id) session_id, detected_pattern, created_at
       FROM pattern_logs
       WHERE user_id = $1
       ORDER BY session_id, created_at DESC`,
      [userId]
    );

    let streakLength = 0;
    const sortedSessions = sessionOrderResult.rows.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const session of sortedSessions) {
      if (session.detected_pattern === dominantPattern) {
        streakLength++;
      } else {
        break;
      }
    }

    // Enhance patterns with additional metrics
    if (dominantPattern && patterns[dominantPattern]) {
      patterns[dominantPattern].aiReliance = aiRelianceScore;
      patterns[dominantPattern].verification = verificationScore;
      patterns[dominantPattern].contextSwitching = contextSwitchingFrequency;
      patterns[dominantPattern].stability = stability;
      patterns[dominantPattern].streakLength = streakLength;
    }

    return {
      dominantPattern,
      distribution,
      totalDetections: totalCount,
      patterns,
      // Also include at top level for easier access
      metrics: {
        aiRelianceScore,
        verificationScore,
        contextSwitchingFrequency,
        stability,
        streakLength,
        totalInteractions,
      },
    };
  }

  /**
   * Get pattern trends over time with daily verification rates
   */
  async getPatternTrends(userId: string, days: number = 30): Promise<any[]> {
    const now = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Get user's registration date
    const userResult = await pool.query(
      'SELECT created_at FROM users WHERE id = $1',
      [userId]
    );
    const userCreatedAt = userResult.rows[0]?.created_at;

    // Calculate days since user registration
    const userRegDate = userCreatedAt ? new Date(userCreatedAt) : now;
    const daysSinceRegistration = Math.floor((now.getTime() - userRegDate.getTime()) / (1000 * 60 * 60 * 24));

    // Logic:
    // - If user registered less than N days ago: show ALL data from registration to today
    // - If user registered more than N days ago: apply the N-day filter
    const effectiveSince = daysSinceRegistration < days
      ? userRegDate  // New user: show from registration date
      : daysAgo;     // Old user: apply the day filter

    // Get pattern trends (only after user registration)
    const patternResult = await pool.query(
      `SELECT
         DATE(created_at) as date,
         detected_pattern,
         COUNT(*) as count
       FROM pattern_logs
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY DATE(created_at), detected_pattern
       ORDER BY date ASC`,
      [userId, effectiveSince]
    );

    // Get daily verification rates (only after user registration)
    const verificationResult = await pool.query(
      `SELECT
         DATE(i.created_at) as date,
         COUNT(*) as total_interactions,
         SUM(CASE WHEN i.was_verified THEN 1 ELSE 0 END) as verified_count
       FROM interactions i
       JOIN work_sessions s ON i.session_id = s.id
       WHERE s.user_id = $1 AND i.created_at >= $2
       GROUP BY DATE(i.created_at)
       ORDER BY date ASC`,
      [userId, effectiveSince]
    );

    // Create a map of daily verification rates
    const dailyVerificationMap: Record<string, number> = {};
    verificationResult.rows.forEach((row: any) => {
      const dateStr = row.date.toISOString().split('T')[0];
      const verificationRate = row.total_interactions > 0
        ? (parseInt(row.verified_count) / parseInt(row.total_interactions)) * 100
        : 0;
      dailyVerificationMap[dateStr] = verificationRate;
    });

    // Create a map of patterns by date
    const patternsByDate: Record<string, string> = {};
    patternResult.rows.forEach((row: any) => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (!patternsByDate[dateStr]) {
        patternsByDate[dateStr] = row.detected_pattern;
      }
    });

    // Generate ALL dates from effectiveSince to today
    // This ensures the chart shows the complete date range even if some days have no data
    const allDates: string[] = [];
    const currentDate = new Date(effectiveSince);
    currentDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (currentDate <= today) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Build trends array with all dates (0 for days with no data)
    return allDates.map(dateStr => ({
      date: dateStr,
      pattern: patternsByDate[dateStr] || 'A',
      verificationRate: Math.round(dailyVerificationMap[dateStr] || 0),
    }));
  }

  /**
   * Extract features from interaction list
   */
  private extractFeaturesFromInteractions(interactions: Interaction[]): Record<string, number> {
    const totalInteractions = interactions.length;

    if (totalInteractions === 0) {
      return {
        prompt_specificity: 0,
        verification_rate: 0,
        iteration_frequency: 0,
        modification_rate: 0,
        task_decomposition_score: 0,
        reflection_depth: 0,
        cross_model_usage: 0,
        independent_attempt_rate: 0,
        error_awareness: 0,
        strategy_diversity: 0,
        trust_calibration_accuracy: 0,
        time_before_ai_query_ms: 0,
      };
    }

    // Calculate verification rate
    const verifiedCount = interactions.filter(i => i.wasVerified).length;
    const verificationRate = verifiedCount / totalInteractions;

    // Calculate modification rate
    const modifiedCount = interactions.filter(i => i.wasModified).length;
    const modificationRate = modifiedCount / totalInteractions;

    // Calculate prompt specificity (based on word count)
    const avgPromptWords = interactions.reduce((sum, i) => {
      return sum + i.userPrompt.split(/\s+/).length;
    }, 0) / totalInteractions;
    const promptSpecificity = Math.min(avgPromptWords / 20, 1.0) * 100;

    // Calculate cross-model usage
    const uniqueModels = new Set(interactions.map(i => i.aiModel));
    const crossModelUsage = (uniqueModels.size / Math.min(3, totalInteractions)) * 100;

    // Calculate average response time
    const avgResponseTime = interactions
      .filter(i => i.responseTimeMs)
      .reduce((sum, i) => sum + (i.responseTimeMs || 0), 0) /
      (interactions.filter(i => i.responseTimeMs).length || 1);

    return {
      prompt_specificity: promptSpecificity,
      verification_rate: verificationRate * 100,
      iteration_frequency: (modifiedCount / totalInteractions) * 100,
      modification_rate: modificationRate * 100,
      task_decomposition_score: Math.random() * 100, // Placeholder - would need more context
      reflection_depth: Math.random() * 100, // Placeholder
      cross_model_usage: crossModelUsage,
      independent_attempt_rate: Math.random() * 100, // Placeholder
      error_awareness: Math.random() * 100, // Placeholder
      strategy_diversity: Math.random() * 100, // Placeholder
      trust_calibration_accuracy: Math.random() * 100, // Placeholder
      time_before_ai_query_ms: avgResponseTime,
    };
  }

  private mapToPatternLog(row: any): PatternLog {
    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      detectedPattern: row.detected_pattern,
      confidence: row.confidence,
      detectionMethod: row.detection_method,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      allProbabilities: typeof row.all_probabilities === 'string' ? JSON.parse(row.all_probabilities) : row.all_probabilities,
      createdAt: row.created_at,
    };
  }
}

export default new PatternDetectionService();
