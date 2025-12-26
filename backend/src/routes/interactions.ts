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
                              i.was_rejected, i.parent_id, i.branch_path, i.reasoning, i.insights,
                              i.selected_branch_id, i.created_at, i.updated_at
                       FROM interactions i
                       ${whereClause}
                       ORDER BY i.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limitNum, offsetNum);

    console.log(`[interactions] Data query: ${dataQuery}, params: ${JSON.stringify(params)}`);
    const result = await pool.query(dataQuery, params);
    console.log(`[interactions] Result rows: ${result.rows.length}`);

    // Debug: Check if insights exist in the returned data
    if (result.rows.length > 0) {
      const insightsStatus = result.rows.map((r: any) => ({
        id: r.id?.substring(0, 8),
        hasInsights: r.insights !== null && r.insights !== undefined,
        insightsKeys: r.insights ? Object.keys(r.insights) : []
      }));
      console.log(`[interactions] Insights status:`, JSON.stringify(insightsStatus));
    }

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
          selectedBranchId: i.selected_branch_id, // Currently selected branch (null = original)
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

/**
 * GET /api/interactions/tree-v2/:sessionId
 * Get interactions as a TRUE tree structure with sibling information
 * Returns messages with their siblings (different versions at the same position)
 */
router.get(
  '/tree-v2/:sessionId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    // selectedPath is a JSON array of interaction IDs representing the current path through the tree
    const { selectedPath } = req.query;

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

    // Get ALL interactions for this session (we'll build the tree client-side)
    const result = await pool.query(
      `SELECT i.id, i.session_id, i.user_id, i.user_prompt, i.ai_response, i.ai_model,
              i.response_time_ms, i.was_verified, i.was_modified, i.was_rejected,
              i.parent_id, i.branch_path, i.insights, i.selected_branch_id, i.created_at, i.updated_at
       FROM interactions i
       WHERE i.session_id = $1
       ORDER BY i.created_at ASC`,
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

    // Build tree structure: group messages by their parent_id to find siblings
    const messagesByParent = new Map<string | null, any[]>();
    const messagesById = new Map<string, any>();

    for (const row of result.rows) {
      const msg = {
        id: row.id,
        sessionId: row.session_id,
        userId: row.user_id,
        userPrompt: row.user_prompt,
        aiResponse: row.ai_response,
        aiModel: row.ai_model,
        responseTimeMs: row.response_time_ms,
        wasVerified: row.was_verified,
        wasModified: row.was_modified,
        wasRejected: row.was_rejected,
        parentId: row.parent_id,
        branchPath: row.branch_path,
        insights: row.insights,
        selectedBranchId: row.selected_branch_id, // Currently selected branch
        branches: branchesMap.get(row.id) || [], // AI response branches
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Will be populated below
        siblingIds: [] as string[],
        siblingIndex: 0,
        childIds: [] as string[],
      };

      messagesById.set(msg.id, msg);

      const parentKey = msg.parentId || 'root';
      if (!messagesByParent.has(parentKey)) {
        messagesByParent.set(parentKey, []);
      }
      messagesByParent.get(parentKey)!.push(msg);
    }

    // Calculate siblings for each message
    Array.from(messagesByParent.entries()).forEach(([parentId, siblings]) => {
      // Sort siblings by created_at
      siblings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const siblingIds = siblings.map((s: any) => s.id);
      siblings.forEach((msg: any, index: number) => {
        msg.siblingIds = siblingIds;
        msg.siblingIndex = index;
      });
    });

    // Calculate children for each message
    Array.from(messagesById.values()).forEach((msg: any) => {
      if (msg.parentId && messagesById.has(msg.parentId)) {
        const parent = messagesById.get(msg.parentId);
        if (!parent.childIds.includes(msg.id)) {
          parent.childIds.push(msg.id);
        }
      }
    });

    // Parse selected path or determine default path
    let pathIds: string[] = [];
    let targetMessageId: string | null = null;

    if (selectedPath) {
      try {
        const parsed = JSON.parse(selectedPath as string);
        if (Array.isArray(parsed) && parsed.length === 1) {
          // Single message ID - this is a sibling switch request
          targetMessageId = parsed[0];
        } else if (Array.isArray(parsed)) {
          pathIds = parsed;
        }
      } catch {
        // If not valid JSON, treat as a single message ID
        targetMessageId = selectedPath as string;
      }
    }

    // Helper function to build path from root to a specific message
    const buildPathToMessage = (targetId: string): string[] => {
      const target = messagesById.get(targetId);
      if (!target) return [];

      const path: string[] = [];
      let current = target;

      // Build path from target up to root
      while (current) {
        path.unshift(current.id);
        if (current.parentId) {
          current = messagesById.get(current.parentId);
        } else {
          break;
        }
      }

      // Then follow children to the end
      current = target;
      while (true) {
        const children = messagesByParent.get(current.id) || [];
        if (children.length === 0) break;
        // Follow main branch or first child
        current = children.find(c => c.branchPath === 'main') || children[0];
        path.push(current.id);
      }

      return path;
    };

    // If a specific target message was requested, build path to it
    if (targetMessageId) {
      pathIds = buildPathToMessage(targetMessageId);
    }

    // If no path specified, follow the "main" branch or first sibling at each level
    if (pathIds.length === 0) {
      // Start with root messages (no parent)
      const rootMessages = messagesByParent.get('root') || [];
      // Find the "main" branch or first message
      let current = rootMessages.find(m => m.branchPath === 'main') || rootMessages[0];

      while (current) {
        pathIds.push(current.id);
        // Get children of current message
        const children = messagesByParent.get(current.id) || [];
        // Follow main branch or first child
        current = children.find(c => c.branchPath === 'main') || children[0];
      }
    }

    // Build the conversation following the selected path
    const conversation: any[] = [];
    for (const id of pathIds) {
      const msg = messagesById.get(id);
      if (msg) {
        conversation.push(msg);
      }
    }

    // Get unique branch paths for compatibility
    const branchPaths = Array.from(new Set(result.rows.map((r: any) => r.branch_path)));

    res.json({
      success: true,
      data: {
        // The conversation following the selected path
        conversation,
        // The selected path through the tree
        selectedPath: pathIds,
        // All messages for client-side tree building
        allMessages: Array.from(messagesById.values()),
        // Messages grouped by parent for easy sibling lookup
        messagesByParent: Object.fromEntries(
          Array.from(messagesByParent.entries()).map(([k, v]) => [k, v.map(m => m.id)])
        ),
        // For backwards compatibility
        availableBranchPaths: branchPaths,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/interactions/edit-message
 * Edit a user message by creating a sibling (same parent) instead of copying history
 * This is the GPT/Claude style editing - creates a true tree branch
 */
router.post(
  '/edit-message',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      originalMessageId,  // The message being edited
      newUserPrompt,      // The new content
      sessionId,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    if (!originalMessageId || !newUserPrompt || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: originalMessageId, newUserPrompt, sessionId',
        timestamp: new Date().toISOString(),
      });
    }

    // Get the original message to find its parent
    const originalResult = await pool.query(
      `SELECT * FROM interactions WHERE id = $1 AND user_id = $2`,
      [originalMessageId, userId]
    );

    if (originalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Original message not found',
        timestamp: new Date().toISOString(),
      });
    }

    const original = originalResult.rows[0];

    // Create a sibling message with the SAME parent_id
    // This creates a true tree branch at this position
    const newInteractionId = uuidv4();
    const branchPath = `edit-${Date.now()}`; // Simple branch identifier

    const result = await pool.query(
      `INSERT INTO interactions (
        id, session_id, user_id, user_prompt, ai_response, ai_model,
        response_time_ms, was_verified, was_modified, was_rejected, reasoning,
        parent_id, branch_path, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        newInteractionId,
        sessionId,
        userId,
        newUserPrompt,
        null, // AI response will be generated separately
        original.ai_model,
        0,
        false,
        false,
        false,
        null,
        original.parent_id, // SAME parent as original - this creates a sibling!
        branchPath,
        new Date(),
      ]
    );

    const newMessage = result.rows[0];

    // Get sibling count for this parent
    const siblingsResult = await pool.query(
      `SELECT id FROM interactions
       WHERE (parent_id = $1 OR (parent_id IS NULL AND $1 IS NULL))
       AND session_id = $2
       ORDER BY created_at ASC`,
      [original.parent_id, sessionId]
    );

    const siblingIds = siblingsResult.rows.map((r: any) => r.id);
    const siblingIndex = siblingIds.indexOf(newInteractionId);

    res.status(201).json({
      success: true,
      data: {
        interaction: {
          id: newMessage.id,
          sessionId: newMessage.session_id,
          userId: newMessage.user_id,
          userPrompt: newMessage.user_prompt,
          aiResponse: newMessage.ai_response,
          parentId: newMessage.parent_id,
          branchPath: newMessage.branch_path,
          createdAt: newMessage.created_at,
          // Sibling info
          siblingIds,
          siblingIndex,
          totalSiblings: siblingIds.length,
        },
      },
      message: 'Message edited - created new version at same position',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/interactions/:interactionId/select-branch
 * Update the selected branch for an AI message
 * When branchId is null, selects the original AI response
 */
router.patch(
  '/:interactionId/select-branch',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionId } = req.params;
    const { branchId } = req.body; // null = original, UUID = specific branch
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify interaction belongs to user
    const interactionCheck = await pool.query(
      'SELECT id, session_id FROM interactions WHERE id = $1 AND user_id = $2',
      [interactionId, userId]
    );

    if (interactionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Interaction not found or does not belong to user',
        timestamp: new Date().toISOString(),
      });
    }

    // If branchId is provided, verify it exists and belongs to this interaction
    if (branchId) {
      const branchCheck = await pool.query(
        'SELECT id FROM message_branches WHERE id = $1 AND interaction_id = $2',
        [branchId, interactionId]
      );

      if (branchCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Branch not found or does not belong to this interaction',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update selected_branch_id
    await pool.query(
      `UPDATE interactions
       SET selected_branch_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [branchId || null, interactionId]
    );

    res.json({
      success: true,
      data: {
        interactionId,
        selectedBranchId: branchId || null,
      },
      message: branchId ? 'Branch selected' : 'Original response selected',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
