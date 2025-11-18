/**
 * Admin Routes
 * Administrative endpoints for system management and user administration
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import pool from '../config/database';

const router = Router();

/**
 * Middleware to check if user is admin
 */
const isAdmin = asyncHandler(async (req: Request, res: Response, next) => {
  const userId = (req as any).userId;

  const result = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      timestamp: new Date().toISOString(),
    });
  }

  next();
});

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data with system overview
 */
router.get(
  '/dashboard',
  authenticateToken,
  isAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    // Get dashboard statistics
    const usersResult = await pool.query(
      'SELECT COUNT(*) as total_users FROM users'
    );

    const sessionsResult = await pool.query(
      'SELECT COUNT(*) as total_sessions FROM work_sessions'
    );

    const interactionsResult = await pool.query(
      'SELECT COUNT(*) as total_interactions FROM interactions'
    );

    const patternsResult = await pool.query(
      `SELECT
        pattern,
        COUNT(*) as count
      FROM pattern_detections
      GROUP BY pattern
      ORDER BY count DESC`
    );

    const recentUsersResult = await pool.query(
      `SELECT
        id,
        username,
        email,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10`
    );

    const dashboard = {
      totalUsers: parseInt(usersResult.rows[0]?.total_users || 0),
      totalSessions: parseInt(sessionsResult.rows[0]?.total_sessions || 0),
      totalInteractions: parseInt(interactionsResult.rows[0]?.total_interactions || 0),
      patternDistribution: patternsResult.rows.reduce((acc: any, row: any) => {
        acc[row.pattern] = row.count;
        return acc;
      }, {}),
      recentUsers: recentUsersResult.rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
      })),
    };

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/admin/stats
 * Get system statistics and metrics
 */
router.get(
  '/stats',
  authenticateToken,
  isAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM work_sessions) as total_sessions,
        (SELECT COUNT(*) FROM interactions) as total_interactions,
        (SELECT COUNT(DISTINCT user_id) FROM work_sessions) as active_users,
        (SELECT AVG(duration_minutes) FROM work_sessions WHERE ended_at IS NOT NULL) as avg_session_duration,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_this_week
    `);

    const stats = {
      totalUsers: parseInt(statsResult.rows[0]?.total_users || 0),
      totalSessions: parseInt(statsResult.rows[0]?.total_sessions || 0),
      totalInteractions: parseInt(statsResult.rows[0]?.total_interactions || 0),
      activeUsers: parseInt(statsResult.rows[0]?.active_users || 0),
      averageSessionDuration: Math.round(parseFloat(statsResult.rows[0]?.avg_session_duration || 0)),
      newUsersThisWeek: parseInt(statsResult.rows[0]?.new_users_this_week || 0),
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/admin/logs
 * Get system logs
 */
router.get(
  '/logs',
  authenticateToken,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const level = (req.query.level || 'info') as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    // For now, return mock logs structure
    // In production, this would query an actual logging service
    const logs = {
      level,
      limit,
      offset,
      total: 0,
      logs: [] as any[],
    };

    res.json({
      success: true,
      data: logs,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/admin/users
 * List all users
 */
router.get(
  '/users',
  authenticateToken,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const usersResult = await pool.query(
      `SELECT
        id,
        username,
        email,
        role,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: {
        users: usersResult.rows.map((row: any) => ({
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        pagination: {
          total: parseInt(countResult.rows[0]?.count || 0),
          limit,
          offset,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete(
  '/users/:userId',
  authenticateToken,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Delete user (cascade deletes sessions, interactions, etc.)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/admin/users/:userId/role
 * Update user role
 */
router.patch(
  '/users/:userId/role',
  authenticateToken,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be "user" or "admin"',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
      message: 'User role updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/admin/config
 * Update system configuration (mock implementation)
 */
router.patch(
  '/config',
  authenticateToken,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const config = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: config,
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
