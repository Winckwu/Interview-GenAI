import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import learningProgressService from '../services/LearningProgressService';

const router: Router = express.Router();

/**
 * GET /api/learning-progress
 * Get current user's learning progress and achievements
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    const progress = await learningProgressService.getOrCreateProgress(userId);

    res.json({
      success: true,
      data: {
        verifyCount: progress.verifyCount,
        modifyCount: progress.modifyCount,
        streakCount: progress.streakCount,
        bestStreak: progress.bestStreak,
        totalSessions: progress.totalSessions,
        achievementsUnlocked: progress.achievementsUnlocked,
        lastActivityDate: progress.lastActivityDate,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/learning-progress/verify
 * Increment verify count and check for achievements
 */
router.post(
  '/verify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    const { progress, newAchievements } = await learningProgressService.incrementVerifyCount(userId);

    res.json({
      success: true,
      data: {
        verifyCount: progress.verifyCount,
        modifyCount: progress.modifyCount,
        streakCount: progress.streakCount,
        bestStreak: progress.bestStreak,
        newAchievements,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/learning-progress/modify
 * Increment modify count and check for achievements
 */
router.post(
  '/modify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    const { progress, newAchievements } = await learningProgressService.incrementModifyCount(userId);

    res.json({
      success: true,
      data: {
        verifyCount: progress.verifyCount,
        modifyCount: progress.modifyCount,
        streakCount: progress.streakCount,
        newAchievements,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/learning-progress/session
 * Increment session count
 */
router.post(
  '/session',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    const progress = await learningProgressService.incrementSessionCount(userId);

    res.json({
      success: true,
      data: {
        totalSessions: progress.totalSessions,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
