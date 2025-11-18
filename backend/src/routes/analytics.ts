/**
 * Analytics Routes
 * Endpoints for user analytics and dashboard data
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import AnalyticsService from '../services/analyticsService';

const router = Router();

/**
 * GET /api/analytics/user
 * Get user's analytics
 */
router.get(
  '/user',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 30;

    const analytics = await AnalyticsService.getUserAnalytics(userId, days);

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/session/:sessionId
 * Get session analytics details
 */
router.get(
  '/session/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const details = await AnalyticsService.getSessionDetails(sessionId);

    res.json({
      success: true,
      data: details,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/summary
 * Get analytics summary (for dashboard)
 */
router.get(
  '/summary',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 30;

    const analytics = await AnalyticsService.getUserAnalytics(userId, days);

    // Return summary format
    res.json({
      success: true,
      data: {
        totalSessions: analytics.totalSessions,
        totalInteractions: analytics.totalInteractions,
        averageSessionDuration: analytics.averageSessionDuration,
        dominantPattern: analytics.dominantPattern,
        patternDistribution: analytics.patternDistribution,
        verificationRate: analytics.verificationRate,
        modificationRate: analytics.modificationRate,
        modelUsage: analytics.modelUsage,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
