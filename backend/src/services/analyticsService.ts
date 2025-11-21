/**
 * Analytics Service
 * Provides user analytics and dashboard data
 */

import pool from '../config/database';
import SessionService from './sessionService';
import PatternDetectionService from './patternDetectionService';

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalInteractions: number;
  averageSessionDuration: number;
  dominantPattern: string;
  patternDistribution: Record<string, number>;
  metacognitiveMetrics: Record<string, number>;
  modelUsage: Record<string, number>;
  patternTrend: Array<{ date: string; pattern: string }>;
  verificationRate: number;
  modificationRate: number;
}

export class AnalyticsService {
  /**
   * Get comprehensive user analytics
   */
  async getUserAnalytics(userId: string, days: number = 30): Promise<UserAnalytics> {
    // Get sessions
    const sessions = await SessionService.getUserSessions(userId, 1000);
    const recentSessions = sessions.filter(s => {
      const sessionAge = Date.now() - s.createdAt.getTime();
      return sessionAge < days * 24 * 60 * 60 * 1000;
    });

    // Get pattern statistics
    const patternStats = await PatternDetectionService.getUserPatternStats(userId);
    const patternTrend = await PatternDetectionService.getPatternTrends(userId, days);

    // Calculate metrics from interactions
    let totalVerified = 0;
    let totalModified = 0;
    let interactionCount = 0;
    let modelUsage: Record<string, number> = {};
    let sessionsWithInteractions = 0; // Only count sessions that have actual interactions

    for (const session of recentSessions) {
      const interactions = await SessionService.getSessionInteractions(session.id, 1000);

      // Only count sessions that have at least one interaction
      if (interactions.length > 0) {
        sessionsWithInteractions++;
      }

      totalVerified += interactions.filter(i => i.wasVerified).length;
      totalModified += interactions.filter(i => i.wasModified).length;
      interactionCount += interactions.length;

      interactions.forEach(i => {
        modelUsage[i.aiModel] = (modelUsage[i.aiModel] || 0) + 1;
      });
    }

    // Use sessions with interactions as totalSessions (not empty sessions)
    const totalSessions = sessionsWithInteractions;

    const verificationRate = interactionCount > 0 ? totalVerified / interactionCount : 0;
    const modificationRate = interactionCount > 0 ? totalModified / interactionCount : 0;

    // Calculate average session duration
    const avgDuration =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / recentSessions.length
        : 0;

    // Get metacognitive metrics
    const metricsResult = await pool.query(
      `SELECT
         AVG(prompt_specificity) as avg_prompt_specificity,
         AVG(verification_rate) as avg_verification_rate,
         AVG(iteration_frequency) as avg_iteration_frequency,
         AVG(modification_rate) as avg_modification_rate,
         AVG(task_decomposition_score) as avg_task_decomposition,
         AVG(reflection_depth) as avg_reflection_depth
       FROM metacognitive_metrics
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2`,
      [userId, days]
    );

    const metrics = metricsResult.rows[0] || {};

    return {
      userId,
      totalSessions,
      totalInteractions: interactionCount,
      averageSessionDuration: Math.round(avgDuration),
      dominantPattern: patternStats.dominantPattern || 'A',
      patternDistribution: patternStats.distribution || {},
      metacognitiveMetrics: {
        promptSpecificity: parseFloat(metrics.avg_prompt_specificity) || 0,
        verificationRate: parseFloat(metrics.avg_verification_rate) || 0,
        iterationFrequency: parseFloat(metrics.avg_iteration_frequency) || 0,
        modificationRate: parseFloat(metrics.avg_modification_rate) || 0,
        taskDecomposition: parseFloat(metrics.avg_task_decomposition) || 0,
        reflectionDepth: parseFloat(metrics.avg_reflection_depth) || 0,
      },
      modelUsage,
      patternTrend,
      verificationRate: verificationRate * 100,
      modificationRate: modificationRate * 100,
    };
  }

  /**
   * Get session details with metrics
   */
  async getSessionDetails(sessionId: string): Promise<any> {
    const session = await SessionService.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const interactions = await SessionService.getSessionInteractions(sessionId, 1000);
    const stats = await SessionService.getSessionStats(sessionId);

    // Get pattern log for this session
    const patternResult = await pool.query(
      'SELECT * FROM pattern_logs WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );

    const patternLog = patternResult.rows[0] || null;

    return {
      session,
      stats,
      interactionCount: interactions.length,
      pattern: patternLog ? {
        detectedPattern: patternLog.detected_pattern,
        confidence: patternLog.confidence,
        features: patternLog.features,
      } : null,
    };
  }

  /**
   * Get verification strategy impact based on real user data
   */
  async getVerificationStrategyImpact(userId: string, days: number = 30): Promise<any[]> {
    // Get recent sessions
    const sessions = await SessionService.getUserSessions(userId, 1000);
    const recentSessions = sessions.filter(s => {
      const sessionAge = Date.now() - s.createdAt.getTime();
      return sessionAge < days * 24 * 60 * 60 * 1000;
    });

    // Collect all interactions with their verification status
    const allInteractions: any[] = [];
    for (const session of recentSessions) {
      const interactions = await SessionService.getSessionInteractions(session.id, 1000);
      allInteractions.push(...interactions);
    }

    if (allInteractions.length === 0) {
      // Return default structure if no data
      return [
        { strategy: 'Low Verification', qualityScore: 0, sampleSize: 0 },
        { strategy: 'Medium Verification', qualityScore: 0, sampleSize: 0 },
        { strategy: 'High Verification', qualityScore: 0, sampleSize: 0 },
      ];
    }

    // Group interactions by verification behavior
    // Low: wasVerified = false
    // Medium: wasVerified = true, but wasModified = true (user found issues)
    // High: wasVerified = true AND wasModified = false (user verified and accepted)
    const lowVerification = allInteractions.filter(i => !i.wasVerified);
    const mediumVerification = allInteractions.filter(i => i.wasVerified && i.wasModified);
    const highVerification = allInteractions.filter(i => i.wasVerified && !i.wasModified);

    // Calculate quality score for each group
    // Quality metric: percentage of interactions that were NOT modified (higher = better)
    // This represents how often the AI output was correct/acceptable
    const calculateQualityScore = (interactions: any[]) => {
      if (interactions.length === 0) return 0;
      const acceptableCount = interactions.filter(i => !i.wasModified).length;
      return (acceptableCount / interactions.length) * 100;
    };

    return [
      {
        strategy: 'Low Verification',
        qualityScore: Math.round(calculateQualityScore(lowVerification)),
        sampleSize: lowVerification.length,
      },
      {
        strategy: 'Medium Verification',
        qualityScore: Math.round(calculateQualityScore(mediumVerification)),
        sampleSize: mediumVerification.length,
      },
      {
        strategy: 'High Verification',
        qualityScore: Math.round(calculateQualityScore(highVerification)),
        sampleSize: highVerification.length,
      },
    ];
  }

  /**
   * Get system-wide statistics (for admin)
   */
  async getSystemStats(): Promise<any> {
    const userCountResult = await pool.query('SELECT COUNT(DISTINCT id) as count FROM users');
    const sessionCountResult = await pool.query('SELECT COUNT(DISTINCT id) as count FROM work_sessions');
    const interactionCountResult = await pool.query('SELECT COUNT(DISTINCT id) as count FROM interactions');

    const userCount = parseInt(userCountResult.rows[0].count);
    const sessionCount = parseInt(sessionCountResult.rows[0].count);
    const interactionCount = parseInt(interactionCountResult.rows[0].count);

    // Get pattern distribution
    const patternDistResult = await pool.query(
      `SELECT detected_pattern, COUNT(*) as count FROM pattern_logs GROUP BY detected_pattern`
    );

    const patternDistribution: Record<string, number> = {};
    let totalPatterns = 0;
    patternDistResult.rows.forEach((row: any) => {
      patternDistribution[row.detected_pattern] = parseInt(row.count);
      totalPatterns += parseInt(row.count);
    });

    Object.keys(patternDistribution).forEach(pattern => {
      patternDistribution[pattern] = patternDistribution[pattern] / totalPatterns;
    });

    return {
      userCount,
      sessionCount,
      interactionCount,
      averageInteractionsPerSession: sessionCount > 0 ? interactionCount / sessionCount : 0,
      patternDistribution,
    };
  }
}

export default new AnalyticsService();
