/**
 * Interview-GenAI Backend Server
 * Complete API service for AI pattern recognition system
 */

// IMPORTANT: Load environment variables FIRST, before any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import 'express-async-errors';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import pool from './config/database';
import { initializeDatabase } from './config/initializeDatabase';
import redisClient from './config/redis';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import authRoutes from './routes/auth';

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

// Static files for admin web interface
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Admin Web Interface Routes
// ============================================================================

// Redirect root and admin paths to appropriate pages
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/login.html');
});

app.get('/login', (_req: Request, res: Response) => {
  res.redirect('/login.html');
});

app.get('/admin', (_req: Request, res: Response) => {
  res.redirect('/admin-dashboard.html');
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
import adminAuthRoutes from './routes/adminAuth';
import abtestRoutes from './routes/abtest';
import assessmentsRoutes from './routes/assessments';
import usersRoutes from './routes/users';
import interactionsRoutes from './routes/interactions';
import aiRoutes from './routes/ai';
import mcaRoutes from './routes/mca';
import branchesRoutes from './routes/branches';
import decompositionsRoutes from './routes/decompositions';
import mrHistoryRoutes from './routes/mrHistory';
import verificationRoutes from './routes/verification';

// ============================================================================
// API Routes
// ============================================================================

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Admin authentication (for web interface)
app.use('/api/admin/auth', adminAuthRoutes);

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

// User management endpoints
app.use('/api/users', usersRoutes);

// Assessment endpoints
app.use('/api/assessments', assessmentsRoutes);

// Interactions endpoints
app.use('/api/interactions', interactionsRoutes);

// Message branches endpoints (conversation branching for MR6/MR5)
app.use('/api/branches', branchesRoutes);

// AI chat and endpoints
app.use('/api/ai', aiRoutes);

// MCA (Metacognitive Assessment) - Real-time pattern recognition and MR activation
app.use('/api/mca', mcaRoutes);

// MR1 Task Decomposition History
app.use('/api/decompositions', decompositionsRoutes);

// MR Tools History (MR5, MR6, MR7, MR11, MR12, MR14)
app.use('/api/mr-history', mrHistoryRoutes);

// MR11 Verification API
app.use('/api/verification', verificationRoutes);

// Placeholder routes - backward compatibility
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
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected');

    // Initialize database schema and migrations
    await initializeDatabase();

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
