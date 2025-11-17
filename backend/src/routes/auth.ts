import express, { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { generateToken, authenticateToken } from '../middleware/auth';
import { LoginRequest, RegisterRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();

/**
 * POST /auth/register
 * Register new user
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password, userType } = req.body as RegisterRequest;

    // Validation
    if (!email || !username || !password || !userType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [
      email,
      username,
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        timestamp: new Date().toISOString(),
      });
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);
    const userId = uuidv4();
    const now = new Date();

    // Create user
    const result = await pool.query(
      'INSERT INTO users (id, email, username, password_hash, user_type, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, username, user_type, created_at',
      [userId, email, username, passwordHash, userType, now, now]
    );

    const user = result.rows[0];
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      userType: user.user_type,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'Registration successful',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /auth/login
 * Login user
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginRequest;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required',
        timestamp: new Date().toISOString(),
      });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString(),
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcryptjs.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      userType: user.user_type,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          userType: user.user_type,
          createdAt: user.created_at,
        },
        token,
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /auth/verify
 * Verify current token
 */
router.get(
  '/verify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await pool.query('SELECT id, email, username, user_type, created_at FROM users WHERE id = $1', [
      req.user?.id,
    ]);

    if (user.rows.length === 0) {
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
          id: user.rows[0].id,
          email: user.rows[0].email,
          username: user.rows[0].username,
          userType: user.rows[0].user_type,
          createdAt: user.rows[0].created_at,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /auth/logout
 * Logout user (for cleanup, token removed on client)
 */
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
