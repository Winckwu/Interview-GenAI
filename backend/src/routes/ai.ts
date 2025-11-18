import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { callOpenAI, getModelInfo } from '../services/aiService';

const router: Router = express.Router();

/**
 * POST /api/ai/chat
 * Get AI response to user prompt with conversation history
 */
router.post(
  '/chat',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { userPrompt, conversationHistory = [] } = req.body;

    // Validation
    if (!userPrompt || userPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User prompt is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (userPrompt.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt too long (max 4000 characters)',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Call OpenAI
      const startTime = Date.now();
      const aiResponse = await callOpenAI(userPrompt, conversationHistory);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          response: {
            content: aiResponse.content,
            model: aiResponse.model,
            responseTime,
            usage: aiResponse.usage,
          },
        },
        message: 'AI response generated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('AI Chat Error:', error);

      // Check for specific error types
      if (error.message.includes('API key')) {
        return res.status(500).json({
          success: false,
          error: 'AI service not properly configured',
          timestamp: new Date().toISOString(),
        });
      }

      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get AI response',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * GET /api/ai/models
 * Get available models and pricing info
 */
router.get(
  '/models',
  asyncHandler(async (_req: Request, res: Response) => {
    const models = getModelInfo();

    res.json({
      success: true,
      data: models,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ai/health
 * Check if OpenAI API is accessible
 */
router.post(
  '/health',
  authenticateToken,
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      // Try a simple call to test connectivity
      const testResponse = await callOpenAI('Say "ok"');

      res.json({
        success: true,
        data: {
          status: 'healthy',
          model: testResponse.model,
        },
        message: 'OpenAI API is accessible',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        success: false,
        error: 'OpenAI API is not accessible',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
