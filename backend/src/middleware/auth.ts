import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user to request
 */

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        timestamp: new Date().toISOString(),
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired',
            timestamp: new Date().toISOString(),
          });
        }
        return res.status(403).json({
          success: false,
          error: 'Invalid token',
          timestamp: new Date().toISOString(),
        });
      }

      req.user = decoded as AuthPayload;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      timestamp: new Date().toISOString(),
    });
  }
};

export const generateToken = (payload: AuthPayload, expiresIn = '24h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      timestamp: new Date().toISOString(),
    });
  }
  next();
};
