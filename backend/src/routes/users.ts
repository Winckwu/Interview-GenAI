import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get(
  '/profile',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const result = await pool.query(
      'SELECT id, email, username, user_type, created_at, updated_at FROM users WHERE id = $1',
      [userId]
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
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          username: result.rows[0].username,
          userType: result.rows[0].user_type,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/users/:userId
 * Get specific user's profile (admin only or self)
 */
router.get(
  '/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // Check authorization
    if (userId !== currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await pool.query(
      'SELECT id, email, username, user_type, created_at FROM users WHERE id = $1',
      [userId]
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
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          username: result.rows[0].username,
          userType: result.rows[0].user_type,
          createdAt: result.rows[0].created_at,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/users/:userId
 * Update user profile
 */
router.patch(
  '/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const { username, userType } = req.body;

    // Check authorization
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Can only update your own profile',
        timestamp: new Date().toISOString(),
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (userType) {
      updates.push(`user_type = $${paramCount++}`);
      values.push(userType);
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(userId);

    if (updates.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        timestamp: new Date().toISOString(),
      });
    }

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, username, user_type, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          userType: user.user_type,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get(
  '/',
  authenticateToken,
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await pool.query(
      'SELECT id, email, username, user_type, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limitNum, offsetNum]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: result.rows.map((user: any) => ({
          id: user.id,
          email: user.email,
          username: user.username,
          userType: user.user_type,
          createdAt: user.created_at,
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

/**
 * DELETE /api/users/:userId
 * Delete user (admin only)
 */
router.delete(
  '/:userId',
  authenticateToken,
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/users/profile
 * Update current user's profile and preferences
 */
router.patch(
  '/profile',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { username, preferences } = req.body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (preferences) {
      updates.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(preferences));
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(userId);

    if (updates.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        timestamp: new Date().toISOString(),
      });
    }

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, username, user_type, preferences, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.user_type,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/users/password
 * Change user password
 */
router.patch(
  '/password',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    // Get user
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    // In production, verify oldPassword with bcrypt
    // For now, just update the password
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Both old and new password are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPassword, userId] // In production, hash the password with bcrypt
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
