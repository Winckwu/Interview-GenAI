/**
 * Admin Authentication Routes
 * Simple authentication for backend web interface
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import jwt from 'jsonwebtoken';

const router = Router();

// Simple in-memory admin credentials
// In production, these should be in a database and hashed
const ADMIN_USERNAME = 'admin01';
const ADMIN_PASSWORD = 'qweasd';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

interface AuthRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

interface TokenPayload {
  type: 'admin';
  username: string;
  iat: number;
  exp: number;
}

/**
 * POST /api/admin/auth/login
 * Admin login endpoint - returns JWT token
 */
router.post(
  '/login',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password cannot be empty',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate JWT token (24 hour expiration)
      const token = jwt.sign(
        {
          type: 'admin',
          username: username,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`✓ Admin login successful: ${username} at ${new Date().toISOString()}`);

      return res.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          username: username,
          role: 'admin',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Invalid credentials
    console.warn(`✗ Admin login failed: ${username} at ${new Date().toISOString()}`);

    return res.status(401).json({
      success: false,
      error: 'Invalid username or password',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/admin/auth/logout
 * Admin logout endpoint
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    console.log('Admin logout at', new Date().toISOString());

    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/admin/auth/verify
 * Verify if token is valid
 */
router.get(
  '/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      if (decoded.type !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Invalid token type',
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        message: 'Token is valid',
        user: {
          username: decoded.username,
          role: 'admin',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
