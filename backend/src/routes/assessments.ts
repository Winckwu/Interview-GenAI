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
    const currentUserId = (req as any).userId;

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
        responses,
        score,
        feedback,
        pattern_identified,
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
      responses: row.responses ? JSON.parse(row.responses) : {},
      score: row.score,
      feedback: row.feedback,
      patternIdentified: row.pattern_identified,
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
    const currentUserId = (req as any).userId;

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
        responses,
        score,
        feedback,
        pattern_identified,
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
      responses: row.responses ? JSON.parse(row.responses) : {},
      score: row.score,
      feedback: row.feedback,
      patternIdentified: row.pattern_identified,
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
    const currentUserId = (req as any).userId;

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

    // Calculate score based on responses (simple scoring logic)
    const responseValues = Object.values(responses || {}) as any[];
    const score = responseValues.length > 0
      ? Math.round((responseValues.filter((v: any) => v).length / responseValues.length) * 100)
      : 0;

    // Identify pattern based on responses
    const patternMap: Record<string, string> = {
      'high_verification': 'A',
      'iterative_learning': 'B',
      'adaptive': 'C',
      'critical_thinking': 'D',
      'pedagogical': 'E',
      'passive': 'F',
    };

    let pattern = 'A';
    for (const [key, value] of Object.entries(responses || {})) {
      if (value && patternMap[key]) {
        pattern = patternMap[key];
        break;
      }
    }

    const result = await pool.query(
      `INSERT INTO assessments
        (id, user_id, responses, score, pattern_identified, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        id,
        userId,
        JSON.stringify(responses),
        score,
        pattern,
        now,
        now,
      ]
    );

    const assessment = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: assessment.id,
        userId: assessment.user_id,
        timestamp: assessment.created_at,
        responses: assessment.responses ? JSON.parse(assessment.responses) : {},
        score: assessment.score,
        patternIdentified: assessment.pattern_identified,
        recommendations: [
          'Continue practicing critical thinking',
          'Regular engagement with AI tools',
          'Document learning progress',
        ],
      },
      message: 'Assessment submitted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
