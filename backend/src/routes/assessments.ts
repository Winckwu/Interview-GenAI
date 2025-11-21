/**
 * Assessments Routes
 * Endpoints for managing metacognitive assessments
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/assessments/:userId
 * Get assessment history for a user
 */
router.get(
  '/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Check authorization
    if (userId !== currentUserId && (req as any).userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
      });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT
        id,
        user_id,
        planning_score,
        monitoring_score,
        evaluation_score,
        regulation_score,
        overall_score,
        strengths,
        areas_for_growth,
        recommendations,
        created_at,
        updated_at
      FROM assessments
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const assessments = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      timestamp: row.created_at,
      planningScore: row.planning_score,
      monitoringScore: row.monitoring_score,
      evaluationScore: row.evaluation_score,
      regulationScore: row.regulation_score,
      overallScore: row.overall_score,
      strengths: row.strengths ? JSON.parse(row.strengths) : [],
      areasForGrowth: row.areas_for_growth ? JSON.parse(row.areas_for_growth) : [],
      recommendations: row.recommendations ? JSON.parse(row.recommendations) : [],
    }));

    res.json({
      success: true,
      data: assessments,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/assessments/:userId/latest
 * Get latest assessment for a user
 */
router.get(
  '/:userId/latest',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Check authorization
    if (userId !== currentUserId && (req as any).userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        user_id,
        planning_score,
        monitoring_score,
        evaluation_score,
        regulation_score,
        overall_score,
        strengths,
        areas_for_growth,
        recommendations,
        created_at,
        updated_at
      FROM assessments
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      });
    }

    const row = result.rows[0];
    const assessment = {
      id: row.id,
      userId: row.user_id,
      timestamp: row.created_at,
      planningScore: row.planning_score,
      monitoringScore: row.monitoring_score,
      evaluationScore: row.evaluation_score,
      regulationScore: row.regulation_score,
      overallScore: row.overall_score,
      strengths: row.strengths ? JSON.parse(row.strengths) : [],
      areasForGrowth: row.areas_for_growth ? JSON.parse(row.areas_for_growth) : [],
      recommendations: row.recommendations ? JSON.parse(row.recommendations) : [],
    };

    res.json({
      success: true,
      data: assessment,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/assessments
 * Submit a new assessment
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, responses, timestamp } = req.body;
    const currentUserId = req.user?.id;

    // Debug logging
    console.log('[POST /assessments] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[POST /assessments] userId:', userId);
    console.log('[POST /assessments] currentUserId:', currentUserId);
    console.log('[POST /assessments] responses type:', typeof responses);
    console.log('[POST /assessments] responses keys:', responses ? Object.keys(responses) : 'null');

    // Check authorization
    if (userId !== currentUserId && (req as any).userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Can only submit assessments for yourself',
        timestamp: new Date().toISOString(),
      });
    }

    const id = uuidv4();
    const now = new Date();

    // Calculate score based on responses
    // Support both legacy simple format and new MR19 metacognitive format
    let score = 0;
    let pattern = 'A';

    if (responses?.dimensions) {
      // MR19 metacognitive assessment format
      // Calculate average score across 4 dimensions (Planning, Monitoring, Evaluation, Regulation)
      const dimensions = responses.dimensions;
      const dimensionScores = Object.values(dimensions).map((dim: any) => dim.score || 0);
      score = dimensionScores.length > 0
        ? Math.round((dimensionScores.reduce((a: number, b: number) => a + b, 0) / dimensionScores.length) * 100)
        : 0;

      // Map metacognitive profile to pattern (based on strongest dimension)
      const dimensionNames = Object.keys(dimensions);
      let maxScore = 0;
      let strongestDimension = 'planning';

      dimensionNames.forEach((name: string) => {
        const dimScore = dimensions[name]?.score || 0;
        if (dimScore > maxScore) {
          maxScore = dimScore;
          strongestDimension = name;
        }
      });

      // Map metacognitive strengths to AI usage patterns
      const metacognitiveToPattern: Record<string, string> = {
        'planning': 'A',      // Strategic Decomposition & Control
        'monitoring': 'B',    // Iterative Refinement & Verification
        'evaluation': 'D',    // Critical Evaluation & Comparison
        'regulation': 'C',    // Adaptive Learning & Flexibility
      };

      pattern = metacognitiveToPattern[strongestDimension] || 'A';
    } else {
      // Legacy simple format (for backward compatibility)
      const responseValues = Object.values(responses || {}) as any[];
      score = responseValues.length > 0
        ? Math.round((responseValues.filter((v: any) => v).length / responseValues.length) * 100)
        : 0;

      // Identify pattern based on responses (legacy logic)
      const patternMap: Record<string, string> = {
        'high_verification': 'A',
        'iterative_learning': 'B',
        'adaptive': 'C',
        'critical_thinking': 'D',
        'pedagogical': 'E',
        'passive': 'F',
      };

      for (const [key, value] of Object.entries(responses || {})) {
        if (value && patternMap[key]) {
          pattern = patternMap[key];
          break;
        }
      }
    }

    // Extract dimension scores for database columns
    const planningScore = responses?.dimensions?.planning?.score || 0;
    const monitoringScore = responses?.dimensions?.monitoring?.score || 0;
    const evaluationScore = responses?.dimensions?.evaluation?.score || 0;
    const regulationScore = responses?.dimensions?.regulation?.score || 0;
    const overallScore = score / 100; // Convert from 0-100 to 0-1 for double precision

    const strengths = responses?.topStrengths || [];
    const areasForGrowth = responses?.areasForGrowth || [];
    const recommendations = [
      'Continue practicing critical thinking',
      'Regular engagement with AI tools',
      'Document learning progress',
    ];

    // Debug logging before insert
    console.log('[POST /assessments] About to insert:');
    console.log('  id:', id);
    console.log('  userId:', userId);
    console.log('  planning_score:', planningScore);
    console.log('  monitoring_score:', monitoringScore);
    console.log('  evaluation_score:', evaluationScore);
    console.log('  regulation_score:', regulationScore);
    console.log('  overall_score:', overallScore);

    let result;
    try {
      result = await pool.query(
        `INSERT INTO assessments
          (id, user_id, planning_score, monitoring_score, evaluation_score, regulation_score,
           overall_score, strengths, areas_for_growth, recommendations, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          id,
          userId,
          planningScore,
          monitoringScore,
          evaluationScore,
          regulationScore,
          overallScore,
          JSON.stringify(strengths),
          JSON.stringify(areasForGrowth),
          JSON.stringify(recommendations),
          now,
          now,
        ]
      );
      console.log('[POST /assessments] Insert successful');
    } catch (error: any) {
      console.error('[POST /assessments] Database error:', error.message);
      console.error('[POST /assessments] Error stack:', error.stack);
      throw error; // Re-throw to be caught by asyncHandler
    }

    const assessment = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: assessment.id,
        userId: assessment.user_id,
        timestamp: assessment.created_at,
        planningScore: assessment.planning_score,
        monitoringScore: assessment.monitoring_score,
        evaluationScore: assessment.evaluation_score,
        regulationScore: assessment.regulation_score,
        overallScore: assessment.overall_score,
        strengths: assessment.strengths ? JSON.parse(assessment.strengths) : [],
        areasForGrowth: assessment.areas_for_growth ? JSON.parse(assessment.areas_for_growth) : [],
        recommendations: assessment.recommendations ? JSON.parse(assessment.recommendations) : [],
      },
      message: 'Assessment submitted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
