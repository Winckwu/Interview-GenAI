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
const PORT = process.env.PORT || 5000;
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

app.get('/health', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
}));

app.get('/health/detailed', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check database
    const dbTest = await pool.query('SELECT NOW()');
    const dbHealth = dbTest.rows.length > 0 ? 'ok' : 'failed';

    // Check Redis
    const redisHealth = redisClient.isReady ? 'ok' : 'disconnected';

    res.json({
      status: dbHealth === 'ok' && redisHealth === 'ok' ? 'ok' : 'degraded',
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
// API Routes
// ============================================================================

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Placeholder routes - to be implemented
app.get('/api/users/:userId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'User endpoint ready' },
    timestamp: new Date().toISOString(),
  });
}));

app.get('/api/patterns', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    message: 'Patterns endpoint ready',
    timestamp: new Date().toISOString(),
  });
}));

app.post('/api/predictions/predict', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Prediction endpoint ready' },
    timestamp: new Date().toISOString(),
  });
}));

app.get('/api/evolution', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    message: 'Evolution tracking endpoint ready',
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
    // Initialize Redis
    await redisClient.connect();
    console.log('✓ Redis connected');

    // Test database connection
    const result = await pool.query('SELECT NOW()');
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
        await redisClient.quit();
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
