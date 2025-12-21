import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * Initialize thinking_records table if it doesn't exist
 */
const initTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS thinking_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR(255),
      message_id VARCHAR(255),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      message_content TEXT NOT NULL,
      content_type VARCHAR(50) NOT NULL,
      ai_questions JSONB NOT NULL DEFAULT '[]',
      user_responses JSONB NOT NULL DEFAULT '[]',
      needs_verification BOOLEAN DEFAULT FALSE,
      summary TEXT,
      ai_insights TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE
    )
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_thinking_records_session ON thinking_records(session_id);
    CREATE INDEX IF NOT EXISTS idx_thinking_records_user ON thinking_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_thinking_records_created ON thinking_records(created_at DESC);
  `);
};

// Initialize table on module load
initTable().catch(console.error);

/**
 * POST /api/thinking-records
 * Create a new thinking record
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      sessionId,
      messageId,
      messageContent,
      contentType,
      aiQuestions,
      userResponses = [],
      needsVerification = false,
      summary,
      aiInsights,
    } = req.body;

    if (!messageContent || !contentType || !aiQuestions) {
      return res.status(400).json({
        success: false,
        error: 'messageContent, contentType, and aiQuestions are required',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const id = uuidv4();
      const result = await pool.query(
        `INSERT INTO thinking_records
          (id, session_id, message_id, user_id, message_content, content_type,
           ai_questions, user_responses, needs_verification, summary, ai_insights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          id,
          sessionId || null,
          messageId || null,
          userId || null,
          messageContent,
          contentType,
          JSON.stringify(aiQuestions),
          JSON.stringify(userResponses),
          needsVerification,
          summary || null,
          aiInsights || null,
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Thinking record created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Create thinking record error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create thinking record',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * PUT /api/thinking-records/:id
 * Update a thinking record (add responses, complete)
 */
router.put(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      userResponses,
      needsVerification,
      summary,
      aiInsights,
      completedAt,
    } = req.body;

    try {
      // Verify ownership
      const existing = await pool.query(
        'SELECT * FROM thinking_records WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Thinking record not found',
          timestamp: new Date().toISOString(),
        });
      }

      const record = existing.rows[0];
      if (record.user_id && record.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this record',
          timestamp: new Date().toISOString(),
        });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (userResponses !== undefined) {
        updates.push(`user_responses = $${paramIndex++}`);
        values.push(JSON.stringify(userResponses));
      }
      if (needsVerification !== undefined) {
        updates.push(`needs_verification = $${paramIndex++}`);
        values.push(needsVerification);
      }
      if (summary !== undefined) {
        updates.push(`summary = $${paramIndex++}`);
        values.push(summary);
      }
      if (aiInsights !== undefined) {
        updates.push(`ai_insights = $${paramIndex++}`);
        values.push(aiInsights);
      }
      if (completedAt !== undefined) {
        updates.push(`completed_at = $${paramIndex++}`);
        values.push(completedAt ? new Date(completedAt) : null);
      }

      if (updates.length === 0) {
        return res.json({
          success: true,
          data: record,
          message: 'No updates provided',
          timestamp: new Date().toISOString(),
        });
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE thinking_records SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Thinking record updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Update thinking record error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update thinking record',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * GET /api/thinking-records
 * Get thinking records for the current user
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { sessionId, limit = '20', offset = '0' } = req.query;

    try {
      let whereClause = 'WHERE 1=1';
      const values: any[] = [];
      let paramIndex = 1;

      // Filter by user if logged in
      if (userId) {
        whereClause += ` AND user_id = $${paramIndex++}`;
        values.push(userId);
      }

      // Filter by session if provided
      if (sessionId) {
        whereClause += ` AND session_id = $${paramIndex++}`;
        values.push(sessionId);
      }

      const limitVal = parseInt(limit as string);
      const offsetVal = parseInt(offset as string);

      const [recordsResult, countResult] = await Promise.all([
        pool.query(
          `SELECT * FROM thinking_records ${whereClause}
           ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
          [...values, limitVal, offsetVal]
        ),
        pool.query(
          `SELECT COUNT(*) as total FROM thinking_records ${whereClause}`,
          values
        ),
      ]);

      res.json({
        success: true,
        data: {
          records: recordsResult.rows,
          total: parseInt(countResult.rows[0].total),
          limit: limitVal,
          offset: offsetVal,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get thinking records error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch thinking records',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * GET /api/thinking-records/:id
 * Get a specific thinking record
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        'SELECT * FROM thinking_records WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Thinking record not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get thinking record error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch thinking record',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * DELETE /api/thinking-records/:id
 * Delete a thinking record
 */
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
      // Verify ownership
      const existing = await pool.query(
        'SELECT * FROM thinking_records WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Thinking record not found',
          timestamp: new Date().toISOString(),
        });
      }

      const record = existing.rows[0];
      if (record.user_id && record.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this record',
          timestamp: new Date().toISOString(),
        });
      }

      await pool.query('DELETE FROM thinking_records WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Thinking record deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Delete thinking record error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete thinking record',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * GET /api/thinking-records/session/:sessionId/stats
 * Get thinking stats for a session
 */
router.get(
  '/session/:sessionId/stats',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
      const result = await pool.query(
        'SELECT * FROM thinking_records WHERE session_id = $1',
        [sessionId]
      );

      const records = result.rows;
      const stats = {
        totalRecords: records.length,
        completedRecords: records.filter((r: any) => r.completed_at).length,
        needsVerification: records.filter((r: any) => r.needs_verification).length,
        byContentType: records.reduce((acc: any, r: any) => {
          acc[r.content_type] = (acc[r.content_type] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get thinking stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch thinking stats',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
