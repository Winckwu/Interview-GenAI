import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/assessments
 * Save a metacognitive assessment result for a user
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      planningScore,
      monitoringScore,
      evaluationScore,
      regulationScore,
      overallScore,
      strengths,
      areasForGrowth,
      recommendations,
      assessmentType,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
    }

    const assessmentId = uuidv4();
    const now = new Date();

    try {
      await pool.query(
        `INSERT INTO assessments (
          id, user_id, planning_score, monitoring_score, evaluation_score,
          regulation_score, overall_score, strengths, areas_for_growth,
          recommendations, assessment_type, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          assessmentId,
          userId,
          planningScore,
          monitoringScore,
          evaluationScore,
          regulationScore,
          overallScore,
          JSON.stringify(strengths),
          JSON.stringify(areasForGrowth),
          JSON.stringify(recommendations),
          assessmentType || 'standard',
          now,
        ]
      );

      res.status(201).json({
        success: true,
        data: {
          assessmentId,
          userId,
          planningScore,
          monitoringScore,
          evaluationScore,
          regulationScore,
          overallScore,
        },
        message: 'Assessment saved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to save assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save assessment',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * GET /api/assessments/:userId
 * Get user's assessment history
 */
router.get(
  '/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Users can only access their own assessments
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const result = await pool.query(
        `SELECT * FROM assessments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      const assessments = result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        planningScore: row.planning_score,
        monitoringScore: row.monitoring_score,
        evaluationScore: row.evaluation_score,
        regulationScore: row.regulation_score,
        overallScore: row.overall_score,
        strengths: JSON.parse(row.strengths || '[]'),
        areasForGrowth: JSON.parse(row.areas_for_growth || '[]'),
        recommendations: JSON.parse(row.recommendations || '[]'),
        assessmentType: row.assessment_type,
        createdAt: row.created_at,
      }));

      const mostRecent = assessments.length > 0 ? assessments[0] : null;

      res.json({
        success: true,
        data: {
          assessments,
          mostRecent,
          count: assessments.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to fetch assessments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessments',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * GET /api/assessments/:userId/latest
 * Get the most recent assessment for a user
 */
router.get(
  '/:userId/latest',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Users can only access their own assessments
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const result = await pool.query(
        `SELECT * FROM assessments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          data: { assessment: null },
          message: 'No assessments found',
          timestamp: new Date().toISOString(),
        });
      }

      const row = result.rows[0];
      const assessment = {
        id: row.id,
        userId: row.user_id,
        planningScore: row.planning_score,
        monitoringScore: row.monitoring_score,
        evaluationScore: row.evaluation_score,
        regulationScore: row.regulation_score,
        overallScore: row.overall_score,
        strengths: JSON.parse(row.strengths || '[]'),
        areasForGrowth: JSON.parse(row.areas_for_growth || '[]'),
        recommendations: JSON.parse(row.recommendations || '[]'),
        assessmentType: row.assessment_type,
        createdAt: row.created_at,
      };

      res.json({
        success: true,
        data: { assessment },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to fetch latest assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
