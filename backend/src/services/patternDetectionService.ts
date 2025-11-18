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
      return {
        detectedPattern: 'A',
        confidence: 0,
        features: {},
        allProbabilities: {},
        method: 'rule_based',
        evidence: ['No interactions recorded'],
        recommendations: [],
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

    return {
      detectedPattern: analysis.primaryPattern,
      confidence: analysis.confidence,
      features,
      allProbabilities: analysis.patternScores,
      method: 'rule_based',
      evidence: analysis.evidence,
      recommendations: analysis.recommendations,
    };
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
   * Get pattern statistics for user
   */
  async getUserPatternStats(userId: string): Promise<any> {
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

    return {
      dominantPattern,
      distribution,
      totalDetections: totalCount,
      patterns,
    };
  }

  /**
   * Get pattern trends over time
   */
  async getPatternTrends(userId: string, days: number = 30): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await pool.query(
      `SELECT
         DATE(created_at) as date,
         detected_pattern,
         COUNT(*) as count
       FROM pattern_logs
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY DATE(created_at), detected_pattern
       ORDER BY date ASC`,
      [userId, since]
    );

    // Transform to array of daily patterns
    const trends: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      if (!trends[row.date]) {
        trends[row.date] = row.detected_pattern;
      }
    });

    return Object.entries(trends).map(([date, pattern]) => ({
      date,
      pattern,
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
