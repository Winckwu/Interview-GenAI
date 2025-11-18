/**
 * A/B Testing Routes
 * Endpoints for managing and tracking A/B tests
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/ab-test
 * List all A/B tests
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const countResult = await pool.query('SELECT COUNT(*) as count FROM ab_tests');
    const testsResult = await pool.query(
      `SELECT
        id,
        name,
        description,
        status,
        control_group,
        treatment_group,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM ab_tests
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: {
        tests: testsResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          status: row.status,
          controlGroup: row.control_group,
          treatmentGroup: row.treatment_group,
          startDate: row.start_date,
          endDate: row.end_date,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        pagination: {
          total: parseInt(countResult.rows[0]?.count || 0),
          limit,
          offset,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ab-test/:testId
 * Get A/B test details
 */
router.get(
  '/:testId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;

    const result = await pool.query(
      `SELECT
        id,
        name,
        description,
        status,
        control_group,
        treatment_group,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM ab_tests
      WHERE id = $1`,
      [testId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'A/B test not found',
        timestamp: new Date().toISOString(),
      });
    }

    const test = result.rows[0];
    res.json({
      success: true,
      data: {
        id: test.id,
        name: test.name,
        description: test.description,
        status: test.status,
        controlGroup: test.control_group,
        treatmentGroup: test.treatment_group,
        startDate: test.start_date,
        endDate: test.end_date,
        createdAt: test.created_at,
        updatedAt: test.updated_at,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ab-test
 * Create a new A/B test
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, controlGroup, treatmentGroup, startDate, endDate } = req.body;

    const id = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO ab_tests
        (id, name, description, status, control_group, treatment_group, start_date, end_date, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [id, name, description, 'pending', controlGroup, treatmentGroup, startDate, endDate, now, now]
    );

    const test = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: test.id,
        name: test.name,
        description: test.description,
        status: test.status,
        controlGroup: test.control_group,
        treatmentGroup: test.treatment_group,
        startDate: test.start_date,
        endDate: test.end_date,
        createdAt: test.created_at,
        updatedAt: test.updated_at,
      },
      message: 'A/B test created successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/ab-test/:testId
 * Update A/B test
 */
router.patch(
  '/:testId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;
    const { name, description, status, endDate } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(endDate);
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(testId);

    const result = await pool.query(
      `UPDATE ab_tests
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'A/B test not found',
        timestamp: new Date().toISOString(),
      });
    }

    const test = result.rows[0];
    res.json({
      success: true,
      data: {
        id: test.id,
        name: test.name,
        description: test.description,
        status: test.status,
        controlGroup: test.control_group,
        treatmentGroup: test.treatment_group,
        startDate: test.start_date,
        endDate: test.end_date,
        createdAt: test.created_at,
        updatedAt: test.updated_at,
      },
      message: 'A/B test updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/ab-test/:testId/results
 * Get A/B test results
 */
router.get(
  '/:testId/results',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;

    // Get test details
    const testResult = await pool.query(
      'SELECT * FROM ab_tests WHERE id = $1',
      [testId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'A/B test not found',
        timestamp: new Date().toISOString(),
      });
    }

    const test = testResult.rows[0];

    // Get results from ab_test_results table (if exists)
    const resultsQuery = `
      SELECT
        COALESCE((SELECT COUNT(*) FROM ab_test_results WHERE test_id = $1 AND group = 'control'), 0) as control_count,
        COALESCE((SELECT COUNT(*) FROM ab_test_results WHERE test_id = $1 AND group = 'treatment'), 0) as treatment_count,
        COALESCE((SELECT AVG(CAST(metric_value AS NUMERIC)) FROM ab_test_results WHERE test_id = $1 AND metric_name = 'conversion' AND group = 'control'), 0) as control_conversion,
        COALESCE((SELECT AVG(CAST(metric_value AS NUMERIC)) FROM ab_test_results WHERE test_id = $1 AND metric_name = 'conversion' AND group = 'treatment'), 0) as treatment_conversion
    `;

    const resultsResult = await pool.query(resultsQuery, [testId]);
    const metrics = resultsResult.rows[0] || {};

    res.json({
      success: true,
      data: {
        testId: test.id,
        testName: test.name,
        controlGroup: {
          name: test.control_group,
          participantCount: parseInt(metrics.control_count || 0),
          conversionRate: parseFloat(metrics.control_conversion || 0),
        },
        treatmentGroup: {
          name: test.treatment_group,
          participantCount: parseInt(metrics.treatment_count || 0),
          conversionRate: parseFloat(metrics.treatment_conversion || 0),
        },
        statisticalSignificance: 0.5,
        winner: null,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ab-test/:testId/start
 * Start A/B test
 */
router.post(
  '/:testId/start',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;

    const result = await pool.query(
      `UPDATE ab_tests
       SET status = 'running', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [testId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'A/B test not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'A/B test started',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/ab-test/:testId
 * Delete A/B test
 */
router.delete(
  '/:testId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { testId } = req.params;

    await pool.query('DELETE FROM ab_tests WHERE id = $1', [testId]);

    res.json({
      success: true,
      message: 'A/B test deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
