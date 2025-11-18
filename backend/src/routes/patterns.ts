/**
 * Patterns Routes
 * Endpoints for pattern detection and analysis
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import PatternDetectionService from '../services/patternDetectionService';
import SessionService from '../services/sessionService';

const router = Router();

/**
 * POST /api/patterns/detect
 * Detect pattern for a session
 */
router.post(
  '/detect',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
    }

    // Analyze session
    const detection = await PatternDetectionService.detectSessionPattern(sessionId);

    // Save to database
    const patternLog = await PatternDetectionService.savePatternDetection(
      sessionId,
      userId,
      detection
    );

    res.json({
      success: true,
      data: {
        ...detection,
        logId: patternLog.id,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/patterns/history/:userId
 * Get user's pattern detection history
 */
router.get(
  '/history/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const history = await PatternDetectionService.getUserPatternHistory(userId, limit);

    res.json({
      success: true,
      data: history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/patterns/stats/:userId
 * Get user's pattern statistics
 */
router.get(
  '/stats/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const stats = await PatternDetectionService.getUserPatternStats(userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/patterns/trends/:userId
 * Get pattern trends over time
 */
router.get(
  '/trends/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const trends = await PatternDetectionService.getPatternTrends(userId, days);

    res.json({
      success: true,
      data: trends,
      count: trends.length,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/patterns (backward compatibility)
 * Get user's current pattern
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const stats = await PatternDetectionService.getUserPatternStats(userId);
    const trends = await PatternDetectionService.getPatternTrends(userId, 7);

    res.json({
      success: true,
      data: [
        {
          id: '1',
          userId,
          patternType: stats.dominantPattern,
          confidence: stats.patterns[stats.dominantPattern]?.avgConfidence || 0.5,
          distribution: stats.distribution,
          trends,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
