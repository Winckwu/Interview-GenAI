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
      aiModel = 'claude-sonnet-4-5',
      responseTime = 0,
      wasVerified = false,
      wasModified = false,
      wasRejected = false,
      reasoning = null,
      parentId = null,  // For conversation tree support
      branchPath = 'main',  // For conversation tree support
    } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    if (!sessionId || !userPrompt || !aiResponse) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userPrompt, aiResponse',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      'SELECT id FROM work_sessions WHERE id = $1 AND user_id = $2',
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

    const result = await pool.query(
      `INSERT INTO interactions (
        id, session_id, user_id, user_prompt, ai_response, ai_model,
        response_time_ms, was_verified, was_modified, was_rejected, reasoning,
        parent_id, branch_path, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, session_id, user_id, user_prompt, ai_response, ai_model,
                response_time_ms, was_verified, was_modified, was_rejected, reasoning,
                parent_id, branch_path, created_at, updated_at`,
      [
        interactionId,
        sessionId,
        userId,
        userPrompt,
        aiResponse,
        aiModel,
        responseTime,
        wasVerified,
        wasModified,
        wasRejected,
        reasoning,
        parentId,
        branchPath,
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
          userId: interaction.user_id,
          userPrompt: interaction.user_prompt,
          aiResponse: interaction.ai_response,
          aiModel: interaction.ai_model,
          responseTimeMs: interaction.response_time_ms,
          wasVerified: interaction.was_verified,
          wasModified: interaction.was_modified,
          wasRejected: interaction.was_rejected,
          reasoning: interaction.reasoning,
          parentId: interaction.parent_id,
          branchPath: interaction.branch_path,
          createdAt: interaction.created_at,
          updatedAt: interaction.updated_at,
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

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await pool.query(
      `SELECT i.id, i.session_id, i.user_id, i.user_prompt, i.ai_response, i.ai_model,
              i.response_time_ms, i.was_verified, i.was_modified, i.was_rejected,
              i.parent_id, i.branch_path, i.insights, i.created_at, i.updated_at
       FROM interactions i
       WHERE i.id = $1 AND i.user_id = $2`,
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
          userId: interaction.user_id,
          userPrompt: interaction.user_prompt,
          aiResponse: interaction.ai_response,
          aiModel: interaction.ai_model,
          responseTimeMs: interaction.response_time_ms,
          wasVerified: interaction.was_verified,
          wasModified: interaction.was_modified,
          wasRejected: interaction.was_rejected,
          parentId: interaction.parent_id,
          branchPath: interaction.branch_path,
          insights: interaction.insights,
          createdAt: interaction.created_at,
          updatedAt: interaction.updated_at,
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
    const { wasVerified, wasModified, wasRejected } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify interaction belongs to user
    const check = await pool.query(
      `SELECT i.id FROM interactions i
       WHERE i.id = $1 AND i.user_id = $2`,
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
      RETURNING id, session_id, user_id, user_prompt, ai_response, ai_model,
                response_time_ms, was_verified, was_modified, was_rejected, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);
    const interaction = result.rows[0];

    res.json({
      success: true,
      data: {
        interaction: {
          id: interaction.id,
          sessionId: interaction.session_id,
          userId: interaction.user_id,
          userPrompt: interaction.user_prompt,
          aiResponse: interaction.ai_response,
          aiModel: interaction.ai_model,
          responseTimeMs: interaction.response_time_ms,
          wasVerified: interaction.was_verified,
          wasModified: interaction.was_modified,
          wasRejected: interaction.was_rejected,
          createdAt: interaction.created_at,
          updatedAt: interaction.updated_at,
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

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // DEBUG: Check total interactions for this user (regardless of session)
    const debugTotal = await pool.query(
      'SELECT COUNT(*) as total FROM interactions WHERE user_id = $1',
      [userId]
    );
    console.log(`[interactions] DEBUG: Total interactions for user ${userId}: ${debugTotal.rows[0].total}`);

    // DEBUG: Show which session_ids have interactions
    if (parseInt(debugTotal.rows[0].total) > 0) {
      const debugSessions = await pool.query(
        'SELECT DISTINCT session_id, COUNT(*) as count FROM interactions WHERE user_id = $1 GROUP BY session_id LIMIT 10',
        [userId]
      );
      console.log(`[interactions] DEBUG: Sessions with interactions: ${JSON.stringify(debugSessions.rows)}`);
    }

    // Build base query conditions
    let whereClause = 'WHERE i.user_id = $1';
    let params: any[] = [userId];
    let paramCount = 2;

    // If sessionId provided, verify ownership then query by session_id only
    // This matches SessionService.getSessionInteractions behavior
    if (sessionId) {
      // Verify session belongs to user
      const sessionCheck = await pool.query(
        'SELECT id FROM work_sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );

      console.log(`[interactions] Session check for ${sessionId} by user ${userId}: ${sessionCheck.rows.length} rows`);

      if (sessionCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Session not found or does not belong to user',
          timestamp: new Date().toISOString(),
        });
      }

      // Query by session_id only (consistent with AnalyticsService)
      whereClause = 'WHERE i.session_id = $1';
      params = [sessionId];
      paramCount = 2;
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM interactions i ${whereClause}`;
    const countParams = params.slice(0, paramCount - 1);
    console.log(`[interactions] Count query: ${countQuery}, params: ${JSON.stringify(countParams)}`);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);
    console.log(`[interactions] Total count: ${total}`);

    // Get paginated results
    const dataQuery = `SELECT i.id, i.session_id, i.user_id, i.user_prompt, i.ai_response, i.ai_model,
                              i.response_time_ms, i.was_verified, i.was_modified,
                              i.was_rejected, i.parent_id, i.branch_path, i.reasoning, i.insights, i.created_at, i.updated_at
                       FROM interactions i
                       ${whereClause}
                       ORDER BY i.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limitNum, offsetNum);

    console.log(`[interactions] Data query: ${dataQuery}, params: ${JSON.stringify(params)}`);
    const result = await pool.query(dataQuery, params);
    console.log(`[interactions] Result rows: ${result.rows.length}`);

    // Load branches for all interactions
    const interactionIds = result.rows.map((i: any) => i.id);
    let branchesMap = new Map<string, any[]>();

    if (interactionIds.length > 0) {
      const branchesResult = await pool.query(
        `SELECT id, interaction_id, branch_content, source, model,
                was_verified, was_modified, is_main, created_by, created_at, updated_at
         FROM message_branches
         WHERE interaction_id = ANY($1)
         ORDER BY created_at ASC`,
        [interactionIds]
      );

      // Group branches by interaction_id
      for (const branch of branchesResult.rows) {
        const interactionId = branch.interaction_id;
        if (!branchesMap.has(interactionId)) {
          branchesMap.set(interactionId, []);
        }
        branchesMap.get(interactionId)!.push({
          id: branch.id,
          content: branch.branch_content,
          source: branch.source,
          model: branch.model,
          wasVerified: branch.was_verified,
          wasModified: branch.was_modified,
          isMain: branch.is_main,
          createdBy: branch.created_by,
          createdAt: branch.created_at,
          updatedAt: branch.updated_at,
        });
      }
    }

    res.json({
      success: true,
      data: {
        interactions: result.rows.map((i: any) => ({
          id: i.id,
          sessionId: i.session_id,
          userId: i.user_id,
          userPrompt: i.user_prompt,
          aiResponse: i.ai_response,
          aiModel: i.ai_model,
          responseTimeMs: i.response_time_ms,
          wasVerified: i.was_verified,
          wasModified: i.was_modified,
          wasRejected: i.was_rejected,
          parentId: i.parent_id,
          branchPath: i.branch_path,
          reasoning: i.reasoning, // AI chain-of-thought reasoning
          insights: i.insights, // MR2 insights data
          createdAt: i.created_at,
          updatedAt: i.updated_at,
          branches: branchesMap.get(i.id) || [], // Include branches
        })),
        total: total,
      },
      count: result.rows.length,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/interactions/tree/:sessionId
 * Get interactions for a session organized as a conversation tree
 * Returns messages filtered by branchPath for tree navigation
 */
router.get(
  '/tree/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const { branchPath = 'main' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      'SELECT id FROM work_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Session not found or does not belong to user',
        timestamp: new Date().toISOString(),
      });
    }

    // Get all messages for this session and branch path
    const result = await pool.query(
      `SELECT i.id, i.session_id, i.user_id, i.user_prompt, i.ai_response, i.ai_model,
              i.response_time_ms, i.was_verified, i.was_modified, i.was_rejected,
              i.parent_id, i.branch_path, i.insights, i.created_at, i.updated_at
       FROM interactions i
       WHERE i.session_id = $1 AND i.branch_path = $2
       ORDER BY i.created_at ASC`,
      [sessionId, branchPath]
    );

    // Get all available branch paths for this session
    const branchPathsResult = await pool.query(
      `SELECT DISTINCT branch_path FROM interactions WHERE session_id = $1 ORDER BY branch_path`,
      [sessionId]
    );

    // Load branches for all interactions
    const interactionIds = result.rows.map((i: any) => i.id);
    let branchesMap = new Map<string, any[]>();

    if (interactionIds.length > 0) {
      const branchesResult = await pool.query(
        `SELECT id, interaction_id, branch_content, source, model,
                was_verified, was_modified, is_main, created_by, created_at, updated_at
         FROM message_branches
         WHERE interaction_id = ANY($1)
         ORDER BY created_at ASC`,
        [interactionIds]
      );

      for (const branch of branchesResult.rows) {
        const interactionId = branch.interaction_id;
        if (!branchesMap.has(interactionId)) {
          branchesMap.set(interactionId, []);
        }
        branchesMap.get(interactionId)!.push({
          id: branch.id,
          content: branch.branch_content,
          source: branch.source,
          model: branch.model,
          wasVerified: branch.was_verified,
          wasModified: branch.was_modified,
          isMain: branch.is_main,
          createdBy: branch.created_by,
          createdAt: branch.created_at,
          updatedAt: branch.updated_at,
        });
      }
    }

    res.json({
      success: true,
      data: {
        interactions: result.rows.map((i: any) => ({
          id: i.id,
          sessionId: i.session_id,
          userId: i.user_id,
          userPrompt: i.user_prompt,
          aiResponse: i.ai_response,
          aiModel: i.ai_model,
          responseTimeMs: i.response_time_ms,
          wasVerified: i.was_verified,
          wasModified: i.was_modified,
          wasRejected: i.was_rejected,
          parentId: i.parent_id,
          branchPath: i.branch_path,
          insights: i.insights,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
          branches: branchesMap.get(i.id) || [],
        })),
        currentBranchPath: branchPath,
        availableBranchPaths: branchPathsResult.rows.map((r: any) => r.branch_path),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/interactions/fork
 * Create a new conversation branch from an existing message
 * Copies the message and sets up a new branch path
 */
router.post(
  '/fork',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      sourceInteractionId,  // The interaction to fork from
      newBranchPath,        // The new branch path name
      userPrompt,           // Optional: new user prompt for this branch
      aiResponse,           // Optional: new AI response for this branch
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    if (!sourceInteractionId || !newBranchPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceInteractionId, newBranchPath',
        timestamp: new Date().toISOString(),
      });
    }

    // Get the source interaction
    const sourceResult = await pool.query(
      `SELECT * FROM interactions WHERE id = $1 AND user_id = $2`,
      [sourceInteractionId, userId]
    );

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Source interaction not found',
        timestamp: new Date().toISOString(),
      });
    }

    const source = sourceResult.rows[0];
    const newInteractionId = uuidv4();

    // Create the forked interaction
    const result = await pool.query(
      `INSERT INTO interactions (
        id, session_id, user_id, user_prompt, ai_response, ai_model,
        response_time_ms, was_verified, was_modified, was_rejected, reasoning,
        parent_id, branch_path, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        newInteractionId,
        source.session_id,
        userId,
        userPrompt || source.user_prompt,
        aiResponse || source.ai_response,
        source.ai_model,
        source.response_time_ms,
        false,
        false,
        false,
        source.reasoning,
        sourceInteractionId,  // Link to parent
        newBranchPath,
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
          userId: interaction.user_id,
          userPrompt: interaction.user_prompt,
          aiResponse: interaction.ai_response,
          aiModel: interaction.ai_model,
          responseTimeMs: interaction.response_time_ms,
          wasVerified: interaction.was_verified,
          wasModified: interaction.was_modified,
          wasRejected: interaction.was_rejected,
          reasoning: interaction.reasoning,
          parentId: interaction.parent_id,
          branchPath: interaction.branch_path,
          createdAt: interaction.created_at,
          updatedAt: interaction.updated_at,
        },
      },
      message: 'Conversation forked successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/interactions/fork-for-edit
 * Create a new branch with conversation history up to (but not including) a specific message
 * Used when editing a user message - preserves original conversation and creates new branch
 */
router.post(
  '/fork-for-edit',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      sessionId,           // The session to fork from
      beforeMessageIndex,  // Copy all messages before this index
      newBranchPath,       // The new branch path name
      originalBranchPath = 'main', // The original branch to copy from
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    if (!sessionId || beforeMessageIndex === undefined || !newBranchPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, beforeMessageIndex, newBranchPath',
        timestamp: new Date().toISOString(),
      });
    }

    // Get all interactions from the original branch up to the specified index
    const sourceResult = await pool.query(
      `SELECT * FROM interactions
       WHERE session_id = $1 AND branch_path = $2 AND user_id = $3
       ORDER BY created_at ASC`,
      [sessionId, originalBranchPath, userId]
    );

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No interactions found in source branch',
        timestamp: new Date().toISOString(),
      });
    }

    // Get interactions to copy (up to but not including beforeMessageIndex)
    // Note: Each interaction is a pair (user prompt + AI response), so we count interactions
    const interactionsToCopy = sourceResult.rows.slice(0, beforeMessageIndex);

    if (interactionsToCopy.length === 0) {
      // No history to copy - just return success, the new message will be first on the branch
      return res.status(200).json({
        success: true,
        data: {
          copiedCount: 0,
          newBranchPath,
        },
        message: 'Branch created (no history to copy)',
        timestamp: new Date().toISOString(),
      });
    }

    // Copy each interaction to the new branch
    const copiedInteractions = [];
    for (const source of interactionsToCopy) {
      const newInteractionId = uuidv4();
      const result = await pool.query(
        `INSERT INTO interactions (
          id, session_id, user_id, user_prompt, ai_response, ai_model,
          response_time_ms, was_verified, was_modified, was_rejected, reasoning,
          parent_id, branch_path, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          newInteractionId,
          source.session_id,
          userId,
          source.user_prompt,
          source.ai_response,
          source.ai_model,
          source.response_time_ms,
          source.was_verified,
          source.was_modified,
          source.was_rejected,
          source.reasoning,
          source.id, // Link to original as parent
          newBranchPath,
          source.created_at, // Keep original timestamp for ordering
        ]
      );
      copiedInteractions.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      data: {
        copiedCount: copiedInteractions.length,
        newBranchPath,
        interactions: copiedInteractions.map((i: any) => ({
          id: i.id,
          sessionId: i.session_id,
          userPrompt: i.user_prompt,
          aiResponse: i.ai_response,
          parentId: i.parent_id,
          branchPath: i.branch_path,
          createdAt: i.created_at,
        })),
      },
      message: `Forked ${copiedInteractions.length} interactions to new branch`,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
