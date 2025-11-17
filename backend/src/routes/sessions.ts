import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * POST /api/sessions
 * Create a new session for user
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { taskDescription, taskType, taskImportance } = req.body;

    const sessionId = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO sessions (id, user_id, task_description, task_type, task_importance, started_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, started_at, task_description, task_type, task_importance`,
      [sessionId, userId, taskDescription || null, taskType || null, taskImportance || null, now]
    );

    const session = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        session: {
          id: session.id,
          userId: session.user_id,
          startedAt: session.started_at,
          taskDescription: session.task_description,
          taskType: session.task_type,
          taskImportance: session.task_importance,
        },
      },
      message: 'Session created successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
router.get(
  '/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT id, user_id, started_at, ended_at, duration_minutes, task_description, task_type, task_importance
       FROM sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString(),
      });
    }

    const session = result.rows[0];
    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          userId: session.user_id,
          startedAt: session.started_at,
          endedAt: session.ended_at,
          durationMinutes: session.duration_minutes,
          taskDescription: session.task_description,
          taskType: session.task_type,
          taskImportance: session.task_importance,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/sessions/:sessionId
 * End session
 */
router.patch(
  '/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const endedAt = new Date();

    // Get session to calculate duration
    const sessionResult = await pool.query(
      `SELECT started_at FROM sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString(),
      });
    }

    const startedAt = new Date(sessionResult.rows[0].started_at);
    const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

    const result = await pool.query(
      `UPDATE sessions
       SET ended_at = $1, duration_minutes = $2, updated_at = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, started_at, ended_at, duration_minutes, task_description, task_type, task_importance`,
      [endedAt, durationMinutes, endedAt, sessionId, userId]
    );

    const session = result.rows[0];
    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          userId: session.user_id,
          startedAt: session.started_at,
          endedAt: session.ended_at,
          durationMinutes: session.duration_minutes,
          taskDescription: session.task_description,
          taskType: session.task_type,
          taskImportance: session.task_importance,
        },
      },
      message: 'Session ended successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/sessions
 * Get user's sessions
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await pool.query(
      `SELECT id, user_id, started_at, ended_at, duration_minutes, task_description, task_type, task_importance
       FROM sessions WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offsetNum]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM sessions WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        sessions: result.rows.map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          startedAt: s.started_at,
          endedAt: s.ended_at,
          durationMinutes: s.duration_minutes,
          taskDescription: s.task_description,
          taskType: s.task_type,
          taskImportance: s.task_importance,
        })),
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
