/**
 * Sessions Routes
 * Endpoints for managing user work sessions
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import SessionService from '../services/sessionService';

const router = Router();

/**
 * POST /api/sessions
 * Create a new work session
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { taskDescription, taskType, taskImportance } = req.body;
    const userId = (req as any).userId;

    const session = await SessionService.createSession(
      userId,
      taskDescription,
      taskType || 'general',
      taskImportance || 3
    );

    res.status(201).json({
      success: true,
      data: session,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
router.get(
  '/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await SessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const interactions = await SessionService.getSessionInteractions(sessionId, 100);

    res.json({
      success: true,
      data: {
        session,
        interactions,
        count: interactions.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/sessions
 * Get user's sessions
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const sessions = await SessionService.getUserSessions(userId, limit, offset);

    res.json({
      success: true,
      data: sessions,
      pagination: { limit, offset, count: sessions.length },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/sessions/:sessionId/end
 * End a session
 */
router.post(
  '/:sessionId/end',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await SessionService.endSession(sessionId);

    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/sessions/:sessionId/interactions
 * Record an interaction in a session
 */
router.post(
  '/:sessionId/interactions',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { userPrompt, aiModel, aiResponse, responseTimeMs } = req.body;
    const userId = (req as any).userId;

    const interaction = await SessionService.recordInteraction(
      sessionId,
      userId,
      userPrompt,
      aiModel || 'claude-sonnet-4-5',
      aiResponse,
      responseTimeMs
    );

    res.status(201).json({
      success: true,
      data: interaction,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/sessions/:sessionId/interactions
 * Get session interactions
 */
router.get(
  '/:sessionId/interactions',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const interactions = await SessionService.getSessionInteractions(sessionId, limit, offset);

    res.json({
      success: true,
      data: interactions,
      pagination: { limit, offset, count: interactions.length },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/sessions/:sessionId/interactions/:interactionId
 * Update interaction status
 */
router.patch(
  '/:sessionId/interactions/:interactionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionId } = req.params;
    const { wasVerified, wasModified, wasRejected } = req.body;

    const interaction = await SessionService.updateInteractionStatus(
      interactionId,
      wasVerified,
      wasModified,
      wasRejected
    );

    res.json({
      success: true,
      data: interaction,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/sessions/:sessionId/stats
 * Get session statistics
 */
router.get(
  '/:sessionId/stats',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const stats = await SessionService.getSessionStats(sessionId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
