import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * POST /api/skills/baseline
 * Set skill baseline for user
 */
router.post(
  '/baseline',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { skillName, baselineScore } = req.body;

    if (!skillName || baselineScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'skillName and baselineScore are required',
        timestamp: new Date().toISOString(),
      });
    }

    if (baselineScore < 0 || baselineScore > 100) {
      return res.status(400).json({
        success: false,
        error: 'baselineScore must be between 0-100',
        timestamp: new Date().toISOString(),
      });
    }

    const baselineId = uuidv4();
    const result = await pool.query(
      `INSERT INTO skill_baselines (id, user_id, skill_name, baseline_score, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, skill_name) DO UPDATE
       SET baseline_score = $4, updated_at = $5
       RETURNING id, user_id, skill_name, baseline_score, created_at`,
      [baselineId, userId, skillName, baselineScore, new Date()]
    );

    const baseline = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        baseline: {
          id: baseline.id,
          userId: baseline.user_id,
          skillName: baseline.skill_name,
          baselineScore: baseline.baseline_score,
          createdAt: baseline.created_at,
        },
      },
      message: 'Skill baseline set successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/skills/test
 * Log a skill test result
 */
router.post(
  '/test',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { skillName, score, independencePercentage, qualityScore, speedScore } = req.body;

    if (!skillName || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'skillName and score are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Get baseline
    const baselineResult = await pool.query(
      `SELECT id FROM skill_baselines WHERE user_id = $1 AND skill_name = $2`,
      [userId, skillName]
    );

    if (baselineResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Skill baseline not found. Please set baseline first.',
        timestamp: new Date().toISOString(),
      });
    }

    const baselineId = baselineResult.rows[0].id;
    const testId = uuidv4();

    const result = await pool.query(
      `INSERT INTO skill_tests (id, baseline_id, score, independence_percentage, quality_score, speed_score, tested_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, baseline_id, score, independence_percentage, quality_score, speed_score, tested_at`,
      [testId, baselineId, score, independencePercentage || null, qualityScore || null, speedScore || null, new Date()]
    );

    const test = result.rows[0];

    // Check for atrophy
    const baselineData = await pool.query(
      `SELECT baseline_score FROM skill_baselines WHERE id = $1`,
      [baselineId]
    );
    const baseline = baselineData.rows[0].baseline_score;
    const degradation = ((baseline - score) / baseline) * 100;

    // Create alert if significant degradation
    if (degradation > 30) {
      const alertId = uuidv4();
      const severity = degradation > 50 ? 'critical' : 'warning';
      const message = `Skill "${skillName}" degraded by ${degradation.toFixed(1)}% (from ${baseline} to ${score})`;

      await pool.query(
        `INSERT INTO skill_alerts (id, user_id, alert_type, severity, message, triggered_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [alertId, userId, 'skill_atrophy', severity, message, new Date()]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        test: {
          id: test.id,
          baselineId: test.baseline_id,
          score: test.score,
          independencePercentage: test.independence_percentage,
          qualityScore: test.quality_score,
          speedScore: test.speed_score,
          testedAt: test.tested_at,
        },
        degradation: degradation > 0 ? `${degradation.toFixed(1)}% decrease` : `${Math.abs(degradation).toFixed(1)}% improvement`,
      },
      message: 'Skill test recorded successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/skills/baselines
 * Get all skill baselines for user
 */
router.get(
  '/baselines',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT id, user_id, skill_name, baseline_score, created_at
       FROM skill_baselines
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        baselines: result.rows.map((b: any) => ({
          id: b.id,
          userId: b.user_id,
          skillName: b.skill_name,
          baselineScore: b.baseline_score,
          createdAt: b.created_at,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/skills/:skillName/history
 * Get skill test history
 */
router.get(
  '/:skillName/history',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { skillName } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await pool.query(
      `SELECT st.id, st.baseline_id, st.score, st.independence_percentage, st.quality_score, st.speed_score, st.tested_at,
              sb.baseline_score, sb.skill_name
       FROM skill_tests st
       JOIN skill_baselines sb ON st.baseline_id = sb.id
       WHERE sb.user_id = $1 AND sb.skill_name = $2
       ORDER BY st.tested_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, skillName, limitNum, offsetNum]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No test history found for this skill',
        timestamp: new Date().toISOString(),
      });
    }

    const tests = result.rows;
    const baseline = tests[0].baseline_score;

    // Calculate trends
    const degradations = tests.map((t: any) => ((baseline - t.score) / baseline) * 100);
    const avgDegradation = degradations.reduce((a: number, b: number) => a + b, 0) / degradations.length;
    const trend = degradations[0] > degradations[degradations.length - 1] ? 'improving' : 'declining';

    res.json({
      success: true,
      data: {
        skillName,
        baselineScore: baseline,
        tests: tests.map((t: any) => ({
          id: t.id,
          score: t.score,
          independencePercentage: t.independence_percentage,
          qualityScore: t.quality_score,
          speedScore: t.speed_score,
          degradation: (((baseline - t.score) / baseline) * 100).toFixed(1) + '%',
          testedAt: t.tested_at,
        })),
        analytics: {
          averageDegradation: avgDegradation.toFixed(1) + '%',
          trend,
          totalTests: tests.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/skills/alerts
 * Get skill alerts for user
 */
router.get(
  '/alerts',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { severity, dismissed = false } = req.query;

    let query = `SELECT id, user_id, alert_type, severity, message, dismissed, triggered_at
                 FROM skill_alerts WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramCount = 2;

    if (severity) {
      query += ` AND severity = $${paramCount++}`;
      params.push(severity);
    }

    if (dismissed !== undefined) {
      query += ` AND dismissed = $${paramCount++}`;
      params.push(dismissed === 'true');
    }

    query += ` ORDER BY triggered_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        alerts: result.rows.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          alertType: a.alert_type,
          severity: a.severity,
          message: a.message,
          dismissed: a.dismissed,
          triggeredAt: a.triggered_at,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/skills/alerts/:alertId
 * Dismiss skill alert
 */
router.patch(
  '/alerts/:alertId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { alertId } = req.params;
    const userId = req.user?.id;
    const { dismissed } = req.body;

    const result = await pool.query(
      `UPDATE skill_alerts
       SET dismissed = $1, updated_at = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, alert_type, severity, message, dismissed, triggered_at`,
      [dismissed ?? true, new Date(), alertId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
        timestamp: new Date().toISOString(),
      });
    }

    const alert = result.rows[0];
    res.json({
      success: true,
      data: {
        alert: {
          id: alert.id,
          userId: alert.user_id,
          alertType: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          dismissed: alert.dismissed,
          triggeredAt: alert.triggered_at,
        },
      },
      message: 'Alert updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
