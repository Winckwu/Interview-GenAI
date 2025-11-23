/**
 * MR1 Task Decomposition History Routes
 *
 * Endpoints for saving and retrieving task decomposition history.
 */

import { Router, Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /decompositions - Get user's decomposition history
 * Query params:
 *   - sessionId: Filter by session (optional)
 *   - limit: Number of results (default 20)
 *   - offset: Pagination offset (default 0)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        td.id,
        td.session_id,
        td.original_task,
        td.decomposition_strategy,
        td.dimensions,
        td.subtasks,
        td.scaffold_level,
        td.total_estimated_time,
        td.was_completed,
        td.created_at,
        ws.task_description as session_task
      FROM task_decompositions td
      LEFT JOIN work_sessions ws ON td.session_id = ws.id
      WHERE td.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND td.session_id = $${paramIndex++}`;
      params.push(sessionId);
    }

    query += ` ORDER BY td.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM task_decompositions WHERE user_id = $1`;
    const countParams: any[] = [userId];
    if (sessionId) {
      countQuery += ` AND session_id = $2`;
      countParams.push(sessionId);
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        decompositions: result.rows.map((row: any) => ({
          id: row.id,
          sessionId: row.session_id,
          originalTask: row.original_task,
          strategy: row.decomposition_strategy,
          dimensions: row.dimensions,
          subtasks: row.subtasks,
          scaffoldLevel: row.scaffold_level,
          totalEstimatedTime: row.total_estimated_time,
          wasCompleted: row.was_completed,
          createdAt: row.created_at,
          sessionTask: row.session_task,
        })),
        total: parseInt(countResult.rows[0].total, 10),
      },
    });
  } catch (error) {
    console.error('[decompositions] GET error:', error);
    next(error);
  }
});

/**
 * GET /decompositions/:id - Get a specific decomposition
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM task_decompositions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Decomposition not found',
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        sessionId: row.session_id,
        originalTask: row.original_task,
        strategy: row.decomposition_strategy,
        dimensions: row.dimensions,
        subtasks: row.subtasks,
        scaffoldLevel: row.scaffold_level,
        totalEstimatedTime: row.total_estimated_time,
        wasCompleted: row.was_completed,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[decompositions] GET/:id error:', error);
    next(error);
  }
});

/**
 * POST /decompositions - Save a new decomposition
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      originalTask,
      strategy = 'sequential',
      dimensions,
      subtasks,
      scaffoldLevel = 'medium',
      totalEstimatedTime,
      wasCompleted = false,
    } = req.body;

    if (!originalTask || !subtasks) {
      return res.status(400).json({
        success: false,
        error: 'originalTask and subtasks are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO task_decompositions
        (user_id, session_id, original_task, decomposition_strategy, dimensions, subtasks, scaffold_level, total_estimated_time, was_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        originalTask,
        strategy,
        JSON.stringify(dimensions || []),
        JSON.stringify(subtasks),
        scaffoldLevel,
        totalEstimatedTime || null,
        wasCompleted,
      ]
    );

    const row = result.rows[0];
    console.log('[decompositions] Saved decomposition:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        sessionId: row.session_id,
        originalTask: row.original_task,
        strategy: row.decomposition_strategy,
        dimensions: row.dimensions,
        subtasks: row.subtasks,
        scaffoldLevel: row.scaffold_level,
        totalEstimatedTime: row.total_estimated_time,
        wasCompleted: row.was_completed,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[decompositions] POST error:', error);
    next(error);
  }
});

/**
 * DELETE /decompositions/:id - Delete a decomposition
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM task_decompositions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Decomposition not found',
      });
    }

    res.json({
      success: true,
      data: { deleted: true, id },
    });
  } catch (error) {
    console.error('[decompositions] DELETE error:', error);
    next(error);
  }
});

export default router;
