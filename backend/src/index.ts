/**
 * Interview-GenAI Backend Server
 * Complete API service for AI pattern recognition system
 */

import 'express-async-errors';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import pool from './config/database';
import redisClient from './config/redis';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import authRoutes from './routes/auth';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '5001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// Middleware Setup
// ============================================================================

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Health Check Endpoints
// ============================================================================

app.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
}));

app.get('/health/detailed', asyncHandler(async (_req: Request, res: Response) => {
  try {
    // Check database
    await pool.query('SELECT NOW()');
    const dbHealth = 'ok';

    // Check Redis (optional)
    const redisHealth = redisClient.isReady ? 'ok' : 'disconnected';

    res.json({
      status: dbHealth === 'ok' ? 'ok' : 'degraded',
      database: dbHealth,
      redis: redisHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}));

// ============================================================================
// Import Routes
// ============================================================================
import sessionsRoutes from './routes/sessions';
import patternsRoutes from './routes/patterns';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import abtestRoutes from './routes/abtest';

// ============================================================================
// API Routes
// ============================================================================

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Session management
app.use('/api/sessions', sessionsRoutes);

// Pattern detection and analysis
app.use('/api/patterns', patternsRoutes);

// Analytics and dashboard data
app.use('/api/analytics', analyticsRoutes);

// Admin endpoints
app.use('/api/admin', adminRoutes);

// A/B testing endpoints
app.use('/api/ab-test', abtestRoutes);

// Placeholder routes - backward compatibility
app.get('/api/users/:userId', authenticateToken, asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'User endpoint ready' },
    timestamp: new Date().toISOString(),
  });
}));

app.post('/api/predictions/predict', authenticateToken, asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Prediction endpoint ready' },
    timestamp: new Date().toISOString(),
  });
}));

app.get('/api/evolution', authenticateToken, asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    message: 'Evolution tracking endpoint ready',
    timestamp: new Date().toISOString(),
  });
}));

app.get('/api/assessments/:userId/latest', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Assessment endpoint ready' },
    timestamp: new Date().toISOString(),
  });
}));

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// Server Initialization
// ============================================================================

let server: any;

export const startServer = async () => {
  try {
    // Initialize Redis (optional - don't fail if Redis is not available)
    if (NODE_ENV !== 'development') {
      try {
        await redisClient.connect();
        console.log('✓ Redis connected');
      } catch (redisError) {
        console.warn('⚠ Redis connection failed (optional in development)');
      }
    } else {
      console.log('ℹ Redis skipped in development mode');
    }

    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected');

    // Start Express server
    server = app.listen(PORT, () => {
      console.log(`\n🚀 Interview-GenAI Backend Server`);
      console.log(`📍 Running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`✓ Ready to accept connections\n`);
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

export const stopServer = async () => {
  return new Promise<void>((resolve) => {
    if (server) {
      server.close(async () => {
        try {
          await redisClient.quit();
        } catch (e) {
          // Redis might not be connected
        }
        console.log('Server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// Start server if this is the main module
if (require.main === module) {
  startServer().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await stopServer();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await stopServer();
    process.exit(0);
  });
}

export default app;
