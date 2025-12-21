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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    const session = await SessionService.createSession(
      userId,
      taskDescription,
      taskType || 'general',
      taskImportance || 3
    );

    res.status(201).json({
      success: true,
      data: {
        session,
      },
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
 * Get user's sessions with optional interactions
 * Query param: includeInteractions=true to avoid N+1 queries
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const includeInteractions = req.query.includeInteractions === 'true';

    const sessions = await SessionService.getUserSessions(userId, limit, offset);

    let responseData: any = sessions;

    // If interactions requested, fetch them for all sessions
    if (includeInteractions) {
      responseData = {
        sessions: await Promise.all(
          sessions.map(async (session: any) => ({
            ...session,
            interactions: await SessionService.getSessionInteractions(session.id, 100),
          }))
        ),
      };
    } else {
      // Standard response format
      responseData = { sessions };
    }

    res.json({
      success: true,
      data: responseData,
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
 * DELETE /api/sessions/:sessionId
 * Delete a session and all its interactions
 */
router.delete(
  '/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    const deleted = await SessionService.deleteSession(sessionId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or you do not have permission to delete it',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/sessions/:sessionId
 * Update session details (e.g., title/taskDescription)
 */
router.patch(
  '/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { taskDescription, taskType } = req.body;

    const session = await SessionService.updateSession(sessionId, {
      taskDescription,
      taskType,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: { session },
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

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
 * PATCH /api/sessions/:sessionId/interactions/:interactionId/insights
 * Update interaction insights (MR2: AI Response Insights)
 */
router.patch(
  '/:sessionId/interactions/:interactionId/insights',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionId } = req.params;
    const { insights } = req.body;

    if (!insights) {
      return res.status(400).json({
        success: false,
        error: 'Insights data is required',
        timestamp: new Date().toISOString(),
      });
    }

    const interaction = await SessionService.updateInteractionInsights(interactionId, insights);

    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found',
        timestamp: new Date().toISOString(),
      });
    }

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

/**
 * GET /api/sessions/:sessionId/export
 * Export session history to JSON, Markdown, or PDF
 * Supports MR2: Process Transparency
 */
router.get(
  '/:sessionId/export',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const format = (req.query.format as string) || 'json';

    // Get session and interactions
    const session = await SessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString(),
      });
    }

    const interactions = await SessionService.getSessionInteractions(sessionId, 1000);

    // Export based on format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.json"`);
      return res.json({
        session,
        interactions,
        exportedAt: new Date().toISOString(),
      });
    } else if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.md"`);

      let markdown = `# Session Export: ${session.taskDescription || 'Untitled'}\n\n`;
      markdown += `**Session ID**: ${session.id}\n`;
      markdown += `**Task Type**: ${session.taskType || 'General'}\n`;
      markdown += `**Started**: ${new Date(session.createdAt).toLocaleString()}\n`;
      markdown += `**Total Interactions**: ${interactions.length}\n\n`;
      markdown += `---\n\n`;

      interactions.forEach((interaction: any, idx: number) => {
        markdown += `## Interaction ${idx + 1}\n\n`;
        markdown += `**Time**: ${new Date(interaction.createdAt).toLocaleString()}\n`;
        markdown += `**Model**: ${interaction.aiModel || 'N/A'}\n`;
        markdown += `**Response Time**: ${interaction.responseTime || 'N/A'}ms\n\n`;

        markdown += `### User Prompt\n\n${interaction.userPrompt}\n\n`;
        markdown += `### AI Response\n\n${interaction.aiResponse}\n\n`;

        if (interaction.wasVerified || interaction.wasModified || interaction.wasRejected) {
          markdown += `**Status**: `;
          if (interaction.wasVerified) markdown += `✓ Verified `;
          if (interaction.wasModified) markdown += `✎ Modified `;
          if (interaction.wasRejected) markdown += `✗ Rejected `;
          markdown += `\n\n`;
        }

        markdown += `---\n\n`;
      });

      markdown += `\n*Exported at ${new Date().toISOString()}*\n`;
      return res.send(markdown);
    } else if (format === 'pdf') {
      // Simple PDF generation using html-like approach
      // For a quick implementation, we'll use a text-based PDF
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.pdf"`);

        doc.pipe(res);

        // Title
        doc.fontSize(20).text(`Session Export: ${session.taskDescription || 'Untitled'}`, { align: 'center' });
        doc.moveDown(0.5);

        // Metadata
        doc.fontSize(10).text(`Session ID: ${session.id}`, { align: 'left' });
        doc.text(`Task Type: ${session.taskType || 'General'}`);
        doc.text(`Started: ${new Date(session.createdAt).toLocaleString()}`);
        doc.text(`Total Interactions: ${interactions.length}`);
        doc.moveDown(1);

        // Horizontal line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Interactions
        interactions.forEach((interaction: any, idx: number) => {
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fontSize(14).text(`Interaction ${idx + 1}`, { underline: true });
          doc.moveDown(0.3);

          doc.fontSize(9)
            .text(`Time: ${new Date(interaction.createdAt).toLocaleString()}`)
            .text(`Model: ${interaction.aiModel || 'N/A'}`)
            .text(`Response Time: ${interaction.responseTime || 'N/A'}ms`);

          doc.moveDown(0.5);

          doc.fontSize(11).text('User Prompt:', { bold: true });
          doc.fontSize(10).text(interaction.userPrompt || 'N/A', { align: 'justify' });
          doc.moveDown(0.5);

          doc.fontSize(11).text('AI Response:', { bold: true });
          const aiText = interaction.aiResponse || 'N/A';
          // Truncate very long responses to prevent PDF issues
          const truncatedText = aiText.length > 1500 ? aiText.substring(0, 1500) + '...[truncated]' : aiText;
          doc.fontSize(10).text(truncatedText, { align: 'justify' });

          if (interaction.wasVerified || interaction.wasModified || interaction.wasRejected) {
            doc.moveDown(0.3);
            let status = 'Status: ';
            if (interaction.wasVerified) status += '✓ Verified ';
            if (interaction.wasModified) status += '✎ Modified ';
            if (interaction.wasRejected) status += '✗ Rejected';
            doc.fontSize(9).text(status, { italic: true });
          }

          doc.moveDown(0.8);
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.8);
        });

        // Footer
        doc.fontSize(8).text(`Exported at ${new Date().toISOString()}`, { align: 'center' });

        doc.end();
      } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF',
          details: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Use json, markdown, or pdf',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
