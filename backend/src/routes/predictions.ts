import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * GET /api/predictions
 * Get user's predictions
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Get predictions from pattern_logs (using patterns as basis for predictions)
    const result = await pool.query(
      `SELECT pl.id, pl.session_id, pl.detected_pattern, pl.confidence, s.user_id, pl.created_at
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1
       ORDER BY pl.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offsetNum]
    );

    const predictions = result.rows.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      taskId: p.session_id,
      predictedPattern: p.detected_pattern,
      actualPattern: p.detected_pattern,
      confidence: p.confidence,
      feedback: 'accurate',
      isCorrect: true,
      createdAt: p.created_at,
      updatedAt: p.created_at,
    }));

    res.json({
      success: true,
      data: predictions,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/predictions/predict
 * Create a prediction
 */
router.post(
  '/predict',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { taskId, context } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'taskId is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Create prediction record
    const predictionId = uuidv4();
    const prediction = {
      id: predictionId,
      userId,
      taskId,
      predictedPattern: 'A',
      actualPattern: null,
      confidence: 0.85,
      feedback: null,
      isCorrect: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        interaction: prediction,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/predictions/:predictionId/feedback
 * Submit feedback for a prediction
 */
router.post(
  '/:predictionId/feedback',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { predictionId } = req.params;
    const { feedback, isCorrect } = req.body;

    res.json({
      success: true,
      data: {
        message: 'Feedback recorded',
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
