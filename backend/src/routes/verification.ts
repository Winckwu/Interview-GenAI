/**
 * MR11 Verification API Routes
 *
 * Provides real verification endpoints for:
 * - Code execution
 * - Math evaluation
 * - Fact checking
 */

import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  verifyCode,
  verifyMath,
  verifyFact,
  checkSyntax,
  VerificationRequest,
} from '../services/verificationService';
import webSearchService from '../services/webSearchService';

const router: Router = express.Router();

/**
 * POST /api/verification/verify
 * Verify content based on type and method
 */
router.post(
  '/verify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { content, contentType, method, context } = req.body as VerificationRequest;

    if (!content || !contentType || !method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, contentType, method',
      });
    }

    let result;

    switch (method) {
      case 'code-execution':
        result = await verifyCode(content);
        break;

      case 'syntax-check':
        result = await checkSyntax(content);
        break;

      case 'math-check':
        result = await verifyMath(content, context);
        break;

      case 'fact-check':
        // Use web search for fact checking
        result = await verifyFact(content, async (query) => {
          try {
            const searchResults = await webSearchService.searchWeb(query, 5);
            return {
              results: searchResults.map((r: { title: string; snippet?: string; url: string }) => ({
                title: r.title,
                snippet: r.snippet || '',
                url: r.url,
              })),
            };
          } catch (error) {
            return { results: [] };
          }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown verification method: ${method}`,
        });
    }

    res.json({
      success: true,
      data: {
        verification: {
          method,
          contentType,
          ...result,
          timestamp: new Date().toISOString(),
        },
      },
    });
  })
);

/**
 * POST /api/verification/code
 * Quick code verification endpoint
 */
router.post(
  '/code',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: code',
      });
    }

    const result = await verifyCode(code);

    res.json({
      success: true,
      data: { verification: result },
    });
  })
);

/**
 * POST /api/verification/math
 * Quick math verification endpoint
 */
router.post(
  '/math',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { expression, context } = req.body;

    if (!expression) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: expression',
      });
    }

    const result = await verifyMath(expression, context);

    res.json({
      success: true,
      data: { verification: result },
    });
  })
);

/**
 * POST /api/verification/fact
 * Quick fact verification endpoint
 */
router.post(
  '/fact',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { claim } = req.body;

    if (!claim) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: claim',
      });
    }

    const result = await verifyFact(claim, async (query) => {
      try {
        const searchResults = await webSearchService.searchWeb(query, 5);
        return {
          results: searchResults.map((r: { title: string; snippet?: string; url: string }) => ({
            title: r.title,
            snippet: r.snippet || '',
            url: r.url,
          })),
        };
      } catch (error) {
        return { results: [] };
      }
    });

    res.json({
      success: true,
      data: { verification: result },
    });
  })
);

export default router;
