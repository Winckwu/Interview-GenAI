import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * POST /api/interactions
 * Log a user-AI interaction
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      sessionId,
      userPrompt,
      aiResponse,
      aiModel = 'gpt-4-turbo',
      responseTime = 0,
      wasVerified = false,
      wasModified = false,
      wasRejected = false,
      confidenceScore,
    } = req.body;

    // Validation
    if (!sessionId || !userPrompt || !aiResponse) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userPrompt, aiResponse',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Session not found or does not belong to user',
        timestamp: new Date().toISOString(),
      });
    }

    const interactionId = uuidv4();
    const promptWordCount = userPrompt.split(/\s+/).length;

    const result = await pool.query(
      `INSERT INTO interactions (
        id, session_id, user_prompt, ai_response, ai_model, prompt_word_count,
        response_time, was_verified, was_modified, was_rejected, confidence_score, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, session_id, user_prompt, ai_response, ai_model, prompt_word_count,
                response_time, was_verified, was_modified, was_rejected, confidence_score, created_at`,
      [
        interactionId,
        sessionId,
        userPrompt,
        aiResponse,
        aiModel,
        promptWordCount,
        responseTime,
        wasVerified,
        wasModified,
        wasRejected,
        confidenceScore || null,
        new Date(),
      ]
    );

    const interaction = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        interaction: {
          id: interaction.id,
          sessionId: interaction.session_id,
          userPrompt: interaction.user_prompt,
          aiResponse: interaction.ai_response,
          aiModel: interaction.ai_model,
          promptWordCount: interaction.prompt_word_count,
          responseTime: interaction.response_time,
          wasVerified: interaction.was_verified,
          wasModified: interaction.was_modified,
          wasRejected: interaction.was_rejected,
          confidenceScore: interaction.confidence_score,
          createdAt: interaction.created_at,
        },
      },
      message: 'Interaction logged successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/interactions/:interactionId
 * Get interaction details
 */
router.get(
  '/:interactionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionId } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT i.id, i.session_id, i.user_prompt, i.ai_response, i.ai_model, i.prompt_word_count,
              i.response_time, i.was_verified, i.was_modified, i.was_rejected, i.confidence_score, i.created_at
       FROM interactions i
       JOIN sessions s ON i.session_id = s.id
       WHERE i.id = $1 AND s.user_id = $2`,
      [interactionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found',
        timestamp: new Date().toISOString(),
      });
    }

    const interaction = result.rows[0];
    res.json({
      success: true,
      data: {
        interaction: {
          id: interaction.id,
          sessionId: interaction.session_id,
          userPrompt: interaction.user_prompt,
          aiResponse: interaction.ai_response,
          aiModel: interaction.ai_model,
          promptWordCount: interaction.prompt_word_count,
          responseTime: interaction.response_time,
          wasVerified: interaction.was_verified,
          wasModified: interaction.was_modified,
          wasRejected: interaction.was_rejected,
          confidenceScore: interaction.confidence_score,
          createdAt: interaction.created_at,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/interactions/:interactionId
 * Update interaction verification/feedback
 */
router.patch(
  '/:interactionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionId } = req.params;
    const userId = req.user?.id;
    const { wasVerified, wasModified, wasRejected, confidenceScore } = req.body;

    // Verify interaction belongs to user
    const check = await pool.query(
      `SELECT i.id FROM interactions i
       JOIN sessions s ON i.session_id = s.id
       WHERE i.id = $1 AND s.user_id = $2`,
      [interactionId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (wasVerified !== undefined) {
      updates.push(`was_verified = $${paramCount++}`);
      values.push(wasVerified);
    }

    if (wasModified !== undefined) {
      updates.push(`was_modified = $${paramCount++}`);
      values.push(wasModified);
    }

    if (wasRejected !== undefined) {
      updates.push(`was_rejected = $${paramCount++}`);
      values.push(wasRejected);
    }

    if (confidenceScore !== undefined) {
      updates.push(`confidence_score = $${paramCount++}`);
      values.push(confidenceScore);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        timestamp: new Date().toISOString(),
      });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(interactionId);

    const updateQuery = `
      UPDATE interactions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, session_id, user_prompt, ai_response, ai_model, prompt_word_count,
                response_time, was_verified, was_modified, was_rejected, confidence_score, created_at
    `;

    const result = await pool.query(updateQuery, values);
    const interaction = result.rows[0];

    res.json({
      success: true,
      data: {
        interaction: {
          id: interaction.id,
          sessionId: interaction.session_id,
          userPrompt: interaction.user_prompt,
          aiResponse: interaction.ai_response,
          aiModel: interaction.ai_model,
          promptWordCount: interaction.prompt_word_count,
          responseTime: interaction.response_time,
          wasVerified: interaction.was_verified,
          wasModified: interaction.was_modified,
          wasRejected: interaction.was_rejected,
          confidenceScore: interaction.confidence_score,
          createdAt: interaction.created_at,
        },
      },
      message: 'Interaction updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/interactions
 * Get session interactions
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { sessionId, limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = `SELECT i.id, i.session_id, i.user_prompt, i.ai_response, i.ai_model,
                        i.prompt_word_count, i.response_time, i.was_verified, i.was_modified,
                        i.was_rejected, i.confidence_score, i.created_at
                 FROM interactions i
                 JOIN sessions s ON i.session_id = s.id
                 WHERE s.user_id = $1`;
    const params: any[] = [userId];
    let paramCount = 2;

    if (sessionId) {
      query += ` AND i.session_id = $${paramCount++}`;
      params.push(sessionId);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limitNum, offsetNum);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        interactions: result.rows.map((i: any) => ({
          id: i.id,
          sessionId: i.session_id,
          userPrompt: i.user_prompt,
          aiResponse: i.ai_response,
          aiModel: i.ai_model,
          promptWordCount: i.prompt_word_count,
          responseTime: i.response_time,
          wasVerified: i.was_verified,
          wasModified: i.was_modified,
          wasRejected: i.was_rejected,
          confidenceScore: i.confidence_score,
          createdAt: i.created_at,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
