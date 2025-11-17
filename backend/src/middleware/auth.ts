import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        userType: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.user = decoded;
    next();
  });
};

export const generateToken = (
  payload: { id: string; email: string; username: string; userType: string },
  expiresIn: string = '24h'
): string => {
  return (jwt.sign as any)(payload, JWT_SECRET, { expiresIn });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (decoded.userType !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.user = decoded;
    next();
  });
};
