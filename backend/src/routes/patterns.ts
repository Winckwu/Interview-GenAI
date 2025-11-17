import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * Pattern Detection Algorithm (Based on SVM Analysis)
 * 6 AI usage patterns: A, B, C, D, E, F
 */

interface PatternScores {
  [key: string]: number;
}

interface FeatureVector {
  promptSpecificity: number; // P1: 0-3
  taskDecompositionScore: number; // P2: 0-3
  strategyDiversity: number; // P3: 0-3
  independentAttemptRate: number; // P4: 0-3

  verificationRate: number; // M1: 0-3
  trustCalibrationAccuracy: number; // M2: 0-3
  sessionDurationPatterns: number; // M3: 0-3

  modificationRate: number; // E1: 0-3
  reflectionDepth: number; // E2: 0-3 (KEY FEATURE FOR PATTERN F)
  errorAwareness: number; // E3: 0-3

  iterationFrequency: number; // R1: 0-3
  crossModelUsage: number; // R2: 0-3
}

/**
 * Detect pattern based on feature vector
 * Uses rule-based classification + SVM-inspired thresholding
 */
function detectPattern(features: FeatureVector): { pattern: string; confidence: number; reasoning: string[] } {
  const reasons: string[] = [];

  // Total scores by dimension
  const planningTotal = features.promptSpecificity + features.taskDecompositionScore + features.strategyDiversity + features.independentAttemptRate;
  const monitoringTotal = features.verificationRate + features.trustCalibrationAccuracy + features.sessionDurationPatterns;
  const evaluationTotal = features.modificationRate + features.reflectionDepth + features.errorAwareness;
  const regulationTotal = features.iterationFrequency + features.crossModelUsage;

  const totalScore = planningTotal + monitoringTotal + evaluationTotal + regulationTotal;

  // Pattern F: Passive Low Efficiency - E2 (reflectionDepth) = 0 is the strongest signal
  if (features.reflectionDepth === 0 && totalScore < 15) {
    reasons.push('No learning reflection (E2=0)');
    reasons.push('Low overall engagement score');
    return {
      pattern: 'F',
      confidence: 0.95,
      reasoning: reasons,
    };
  }

  // Pattern E: Teaching Type Reflection - High E2
  if (features.reflectionDepth >= 2.5) {
    reasons.push('High learning reflection (E2≥2.5)');
    if (features.modificationRate >= 2) {
      reasons.push('Strong modification behavior');
      return {
        pattern: 'E',
        confidence: 0.92,
        reasoning: reasons,
      };
    }
  }

  // Pattern A: Strategic Decomposition - High on all dimensions
  if (planningTotal >= 10 && monitoringTotal >= 7 && evaluationTotal >= 7) {
    reasons.push('High planning dimension score');
    reasons.push('Strong verification and monitoring');
    reasons.push('Comprehensive evaluation approach');
    return {
      pattern: 'A',
      confidence: 0.90,
      reasoning: reasons,
    };
  }

  // Pattern D: Deep Verification - High verification but less planning
  if (features.verificationRate >= 2.5 && features.errorAwareness >= 2 && planningTotal <= 9) {
    reasons.push('Strong verification and scrutiny');
    reasons.push('Critical evaluation focused');
    return {
      pattern: 'D',
      confidence: 0.85,
      reasoning: reasons,
    };
  }

  // Pattern C: Context-Sensitive Adaptation - Balanced middle
  if (features.strategyDiversity >= 2 && features.crossModelUsage >= 1.5) {
    reasons.push('Diverse strategy usage');
    reasons.push('Multiple model experimentation');
    return {
      pattern: 'C',
      confidence: 0.80,
      reasoning: reasons,
    };
  }

  // Pattern B: Iterative Optimization - High iteration frequency
  if (features.iterationFrequency >= 2.5 && features.reflectionDepth >= 1.5) {
    reasons.push('Frequent iteration and refinement');
    reasons.push('Moderate learning reflection');
    return {
      pattern: 'B',
      confidence: 0.80,
      reasoning: reasons,
    };
  }

  // Default: Pattern A if we can't clearly classify
  reasons.push('Unable to match specific pattern criteria');
  reasons.push('Defaulting to Pattern A');
  return {
    pattern: 'A',
    confidence: 0.5,
    reasoning: reasons,
  };
}

/**
 * Calculate feature vector from session interactions
 */
async function calculateFeatures(sessionId: string): Promise<FeatureVector> {
  const interactions = await pool.query(
    `SELECT was_verified, was_modified, was_rejected, confidence_score, prompt_word_count, response_time
     FROM interactions WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );

  const rows = interactions.rows;

  if (rows.length === 0) {
    // Return default values if no interactions
    return {
      promptSpecificity: 0,
      taskDecompositionScore: 0,
      strategyDiversity: 0,
      independentAttemptRate: 0,
      verificationRate: 0,
      trustCalibrationAccuracy: 0,
      sessionDurationPatterns: 0,
      modificationRate: 0,
      reflectionDepth: 0,
      errorAwareness: 0,
      iterationFrequency: 0,
      crossModelUsage: 0,
    };
  }

  // Calculate metrics from interactions
  const verificationCount = rows.filter((r: any) => r.was_verified).length;
  const modificationCount = rows.filter((r: any) => r.was_modified).length;
  const rejectionCount = rows.filter((r: any) => r.was_rejected).length;

  const avgPromptLength = rows.reduce((sum: number, r: any) => sum + r.prompt_word_count, 0) / rows.length;
  const avgResponseTime = rows.reduce((sum: number, r: any) => sum + r.response_time, 0) / rows.length;
  const avgConfidence = rows.filter((r: any) => r.confidence_score).reduce((sum: number, r: any) => sum + r.confidence_score, 0) / rows.length || 0;

  const verificationRate = rows.length > 0 ? Math.min(verificationCount / rows.length * 3, 3) : 0;
  const modificationRate = rows.length > 0 ? Math.min(modificationCount / rows.length * 3, 3) : 0;
  const iterationFrequency = Math.min(modificationCount / Math.max(rows.length - 1, 1) * 2 + 0.5, 3);

  // Assume if modifications are made, there's reflection (E2)
  const reflectionDepth = modificationCount > 0 ? Math.min(Math.max(modificationCount / rows.length * 3, 0.5), 3) : 0;

  // Error awareness from rejections and modifications
  const errorAwareness = (modificationCount + rejectionCount) > 0 ? 2.5 : 1;

  return {
    promptSpecificity: Math.min(avgPromptLength / 25 * 3, 3), // 25 words = 3 points
    taskDecompositionScore: Math.min(avgPromptLength / 20 * 3, 3),
    strategyDiversity: modificationCount > 1 ? 2.5 : 1,
    independentAttemptRate: rejectionCount > 0 ? 2.5 : 1.5,

    verificationRate,
    trustCalibrationAccuracy: Math.min(avgConfidence / 100 * 3, 3),
    sessionDurationPatterns: avgResponseTime > 2000 ? 2.5 : 1.5,

    modificationRate,
    reflectionDepth,
    errorAwareness: Math.min(errorAwareness, 3),

    iterationFrequency,
    crossModelUsage: 0, // Would need model tracking
  };
}

/**
 * POST /api/patterns/analyze
 * Analyze session and detect pattern
 */
router.post(
  '/analyze',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    // Validate session
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
        timestamp: new Date().toISOString(),
      });
    }

    const sessionCheck = await pool.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate features
    const features = await calculateFeatures(sessionId);

    // Detect pattern
    const { pattern, confidence, reasoning } = detectPattern(features);

    // Save pattern log
    const patternLogId = uuidv4();
    await pool.query(
      `INSERT INTO pattern_logs (id, session_id, detected_pattern, confidence, features, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [patternLogId, sessionId, pattern, confidence, JSON.stringify(features), new Date()]
    );

    res.json({
      success: true,
      data: {
        pattern: {
          id: patternLogId,
          sessionId,
          detectedPattern: pattern,
          confidence,
          features,
          reasoning,
          descriptions: {
            A: 'Strategic Decomposition & Control - Careful planning, high verification, maintains independence',
            B: 'Iterative Optimization & Calibration - Multiple iterations, questions outputs, selective acceptance',
            C: 'Adaptive Adjustment - Dynamic strategy switching, context-aware approach',
            D: 'Deep Verification & Criticism - Thorough scrutiny, probing questions, high reflection',
            E: 'Teaching & Learning - Uses AI as educational tool, high learning reflection',
            F: 'Passive Over-Reliance ⚠️ - Uncritical acceptance, minimal verification (HIGH RISK)',
          },
        },
      },
      message: 'Pattern analysis completed',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/patterns/:userId
 * Get user's pattern history
 */
router.get(
  '/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const requestingRole = req.user?.role;

    // Check authorization
    if (userId !== requestingUserId && requestingRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await pool.query(
      `SELECT pl.id, pl.session_id, pl.detected_pattern, pl.confidence, pl.features, pl.created_at
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1
       ORDER BY pl.created_at DESC`,
      [userId]
    );

    const patterns = result.rows.map((p: any) => ({
      id: p.id,
      sessionId: p.session_id,
      detectedPattern: p.detected_pattern,
      confidence: p.confidence,
      features: p.features,
      createdAt: p.created_at,
    }));

    // Get most recent pattern
    const mostRecent = patterns.length > 0 ? patterns[0] : null;

    // Calculate pattern distribution
    const distribution: { [key: string]: number } = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    patterns.forEach((p: any) => {
      distribution[p.detectedPattern]++;
    });

    res.json({
      success: true,
      data: {
        patterns,
        mostRecent,
        distribution,
        totalSessions: patterns.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/patterns
 * Get all patterns (admin only or own patterns)
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await pool.query(
      `SELECT pl.id, pl.session_id, pl.detected_pattern, pl.confidence, pl.features, pl.created_at,
              s.user_id
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1
       ORDER BY pl.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offsetNum]
    );

    res.json({
      success: true,
      data: {
        patterns: result.rows.map((p: any) => ({
          id: p.id,
          sessionId: p.session_id,
          detectedPattern: p.detected_pattern,
          confidence: p.confidence,
          features: p.features,
          createdAt: p.created_at,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
