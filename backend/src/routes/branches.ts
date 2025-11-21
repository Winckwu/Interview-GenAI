import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * POST /api/branches
 * Create a new message branch (alternative AI response)
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      interactionId,
      branchContent,
      source, // 'mr6', 'mr5', or 'manual'
      model, // Optional: model name for mr6/mr5
    } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    if (!interactionId || !branchContent || !source) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: interactionId, branchContent, source',
        timestamp: new Date().toISOString(),
      });
    }

    if (!['mr6', 'mr5', 'manual'].includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source. Must be: mr6, mr5, or manual',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify interaction exists and belongs to user
    const interactionCheck = await pool.query(
      'SELECT id FROM interactions WHERE id = $1 AND user_id = $2',
      [interactionId, userId]
    );

    if (interactionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Interaction not found or does not belong to user',
        timestamp: new Date().toISOString(),
      });
    }

    const branchId = uuidv4();

    const result = await pool.query(
      `INSERT INTO message_branches (
        id, interaction_id, branch_content, source, model,
        was_verified, was_modified, is_main, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, interaction_id, branch_content, source, model,
                was_verified, was_modified, is_main, created_by, created_at, updated_at`,
      [
        branchId,
        interactionId,
        branchContent,
        source,
        model || null,
        false, // was_verified
        false, // was_modified
        false, // is_main
        userId,
        new Date(),
      ]
    );

    const branch = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        branch: {
          id: branch.id,
          interactionId: branch.interaction_id,
          content: branch.branch_content,
          source: branch.source,
          model: branch.model,
          wasVerified: branch.was_verified,
          wasModified: branch.was_modified,
          isMain: branch.is_main,
          createdBy: branch.created_by,
          createdAt: branch.created_at,
          updatedAt: branch.updated_at,
        },
      },
      message: 'Branch created successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/branches/interaction/:interactionId
 * Get all branches for a specific interaction
 */
router.get(
  '/interaction/:interactionId',
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

    // Verify interaction belongs to user
    const interactionCheck = await pool.query(
      'SELECT id FROM interactions WHERE id = $1 AND user_id = $2',
      [interactionId, userId]
    );

    if (interactionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Interaction not found or does not belong to user',
        timestamp: new Date().toISOString(),
      });
    }

    // Get all branches for this interaction
    const result = await pool.query(
      `SELECT id, interaction_id, branch_content, source, model,
              was_verified, was_modified, is_main, created_by, created_at, updated_at
       FROM message_branches
       WHERE interaction_id = $1
       ORDER BY created_at ASC`,
      [interactionId]
    );

    const branches = result.rows.map((branch) => ({
      id: branch.id,
      interactionId: branch.interaction_id,
      content: branch.branch_content,
      source: branch.source,
      model: branch.model,
      wasVerified: branch.was_verified,
      wasModified: branch.was_modified,
      isMain: branch.is_main,
      createdBy: branch.created_by,
      createdAt: branch.created_at,
      updatedAt: branch.updated_at,
    }));

    res.json({
      success: true,
      data: {
        branches,
        count: branches.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/branches/:branchId
 * Update a branch (e.g., mark as verified, modified, or set as main)
 */
router.patch(
  '/:branchId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { branchId } = req.params;
    const userId = req.user?.id;
    const {
      wasVerified,
      wasModified,
      isMain,
      content,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify branch exists and interaction belongs to user
    const branchCheck = await pool.query(
      `SELECT mb.id, mb.interaction_id
       FROM message_branches mb
       JOIN interactions i ON mb.interaction_id = i.id
       WHERE mb.id = $1 AND i.user_id = $2`,
      [branchId, userId]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Branch not found or does not belong to user',
        timestamp: new Date().toISOString(),
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (wasVerified !== undefined) {
      updates.push(`was_verified = $${paramCounter++}`);
      values.push(wasVerified);
    }
    if (wasModified !== undefined) {
      updates.push(`was_modified = $${paramCounter++}`);
      values.push(wasModified);
    }
    if (isMain !== undefined) {
      updates.push(`is_main = $${paramCounter++}`);
      values.push(isMain);

      // If setting as main, unset all other branches for this interaction
      if (isMain) {
        const interactionId = branchCheck.rows[0].interaction_id;
        await pool.query(
          `UPDATE message_branches
           SET is_main = FALSE
           WHERE interaction_id = $1 AND id != $2`,
          [interactionId, branchId]
        );
      }
    }
    if (content !== undefined) {
      updates.push(`branch_content = $${paramCounter++}`);
      values.push(content);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        timestamp: new Date().toISOString(),
      });
    }

    updates.push(`updated_at = $${paramCounter++}`);
    values.push(new Date());
    values.push(branchId);

    const result = await pool.query(
      `UPDATE message_branches
       SET ${updates.join(', ')}
       WHERE id = $${paramCounter}
       RETURNING id, interaction_id, branch_content, source, model,
                 was_verified, was_modified, is_main, created_by, created_at, updated_at`,
      values
    );

    const branch = result.rows[0];
    res.json({
      success: true,
      data: {
        branch: {
          id: branch.id,
          interactionId: branch.interaction_id,
          content: branch.branch_content,
          source: branch.source,
          model: branch.model,
          wasVerified: branch.was_verified,
          wasModified: branch.was_modified,
          isMain: branch.is_main,
          createdBy: branch.created_by,
          createdAt: branch.created_at,
          updatedAt: branch.updated_at,
        },
      },
      message: 'Branch updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/branches/:branchId
 * Delete a branch
 */
router.delete(
  '/:branchId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { branchId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify branch exists and interaction belongs to user
    const branchCheck = await pool.query(
      `SELECT mb.id
       FROM message_branches mb
       JOIN interactions i ON mb.interaction_id = i.id
       WHERE mb.id = $1 AND i.user_id = $2`,
      [branchId, userId]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Branch not found or does not belong to user',
        timestamp: new Date().toISOString(),
      });
    }

    await pool.query('DELETE FROM message_branches WHERE id = $1', [branchId]);

    res.json({
      success: true,
      message: 'Branch deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
