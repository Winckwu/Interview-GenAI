import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics for user
 */
router.get(
  '/dashboard',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    // Get session statistics
    const sessionStats = await pool.query(
      `SELECT
        COUNT(*) as total_sessions,
        AVG(duration_minutes) as avg_duration,
        SUM(CASE WHEN ended_at IS NOT NULL THEN 1 ELSE 0 END) as completed_sessions
       FROM sessions
       WHERE user_id = $1`,
      [userId]
    );

    // Get pattern distribution
    const patternDist = await pool.query(
      `SELECT detected_pattern, COUNT(*) as count
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1
       GROUP BY detected_pattern
       ORDER BY count DESC`,
      [userId]
    );

    // Get most recent pattern
    const recentPattern = await pool.query(
      `SELECT detected_pattern, confidence, created_at
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1
       ORDER BY pl.created_at DESC
       LIMIT 1`,
      [userId]
    );

    // Get interaction statistics
    const interactionStats = await pool.query(
      `SELECT
        COUNT(*) as total_interactions,
        SUM(CASE WHEN was_verified THEN 1 ELSE 0 END) as verified_count,
        SUM(CASE WHEN was_modified THEN 1 ELSE 0 END) as modified_count,
        SUM(CASE WHEN was_rejected THEN 1 ELSE 0 END) as rejected_count,
        AVG(prompt_word_count) as avg_prompt_length,
        AVG(response_time) as avg_response_time
       FROM interactions i
       JOIN sessions s ON i.session_id = s.id
       WHERE s.user_id = $1`,
      [userId]
    );

    // Get skill alerts
    const alerts = await pool.query(
      `SELECT severity, COUNT(*) as count
       FROM skill_alerts
       WHERE user_id = $1 AND dismissed = false
       GROUP BY severity`,
      [userId]
    );

    // Build pattern distribution object
    const distribution: { [key: string]: number } = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    patternDist.rows.forEach((row: any) => {
      distribution[row.detected_pattern] = parseInt(row.count);
    });

    res.json({
      success: true,
      data: {
        sessions: {
          totalSessions: parseInt(sessionStats.rows[0].total_sessions) || 0,
          completedSessions: parseInt(sessionStats.rows[0].completed_sessions) || 0,
          averageDuration: sessionStats.rows[0].avg_duration || 0,
        },
        patterns: {
          distribution,
          mostRecent: recentPattern.rows.length > 0 ? {
            pattern: recentPattern.rows[0].detected_pattern,
            confidence: recentPattern.rows[0].confidence,
            detectedAt: recentPattern.rows[0].created_at,
          } : null,
        },
        interactions: {
          total: parseInt(interactionStats.rows[0].total_interactions) || 0,
          verified: parseInt(interactionStats.rows[0].verified_count) || 0,
          modified: parseInt(interactionStats.rows[0].modified_count) || 0,
          rejected: parseInt(interactionStats.rows[0].rejected_count) || 0,
          verificationRate: (parseInt(interactionStats.rows[0].verified_count) || 0) / (parseInt(interactionStats.rows[0].total_interactions) || 1),
          modificationRate: (parseInt(interactionStats.rows[0].modified_count) || 0) / (parseInt(interactionStats.rows[0].total_interactions) || 1),
          avgPromptLength: interactionStats.rows[0].avg_prompt_length || 0,
          avgResponseTime: interactionStats.rows[0].avg_response_time || 0,
        },
        alerts: {
          active: alerts.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0),
          byServerity: alerts.rows.reduce((acc: { [key: string]: number }, row: any) => {
            acc[row.severity] = parseInt(row.count);
            return acc;
          }, {}),
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/sessions/:userId
 * Get user's session analytics
 */
router.get(
  '/sessions/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const requestingRole = req.user?.role;

    // Check authorization
    if (userId !== requestingUserId && requestingRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
      });
    }

    // Get session metrics by task type
    const byTaskType = await pool.query(
      `SELECT task_type, COUNT(*) as count, AVG(duration_minutes) as avg_duration
       FROM sessions
       WHERE user_id = $1 AND task_type IS NOT NULL
       GROUP BY task_type
       ORDER BY count DESC`,
      [userId]
    );

    // Get session trend (last 7 days)
    const trend = await pool.query(
      `SELECT DATE(started_at) as date, COUNT(*) as sessions, AVG(duration_minutes) as avg_duration
       FROM sessions
       WHERE user_id = $1 AND started_at > NOW() - INTERVAL '7 days'
       GROUP BY DATE(started_at)
       ORDER BY date DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        byTaskType: byTaskType.rows.map((row: any) => ({
          taskType: row.task_type,
          count: parseInt(row.count),
          averageDuration: row.avg_duration,
        })),
        sevenDayTrend: trend.rows.map((row: any) => ({
          date: row.date,
          sessions: parseInt(row.sessions),
          averageDuration: row.avg_duration,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/patterns/:userId
 * Get pattern analytics for user
 */
router.get(
  '/patterns/:userId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const requestingRole = req.user?.role;

    // Check authorization
    if (userId !== requestingUserId && requestingRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
      });
    }

    // Get pattern distribution
    const distribution = await pool.query(
      `SELECT detected_pattern, COUNT(*) as count, AVG(confidence) as avg_confidence
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1
       GROUP BY detected_pattern
       ORDER BY count DESC`,
      [userId]
    );

    // Get pattern timeline
    const timeline = await pool.query(
      `SELECT DATE(pl.created_at) as date, detected_pattern, COUNT(*) as count
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1 AND pl.created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(pl.created_at), detected_pattern
       ORDER BY date DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        distribution: distribution.rows.map((row: any) => ({
          pattern: row.detected_pattern,
          count: parseInt(row.count),
          averageConfidence: row.avg_confidence,
        })),
        thirtyDayTimeline: timeline.rows.map((row: any) => ({
          date: row.date,
          pattern: row.detected_pattern,
          count: parseInt(row.count),
        })),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/analytics/system
 * Get system-wide analytics (admin only)
 */
router.get(
  '/system',
  authenticateToken,
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    // Total users
    const users = await pool.query('SELECT COUNT(*) as total FROM users');

    // Total sessions
    const sessions = await pool.query('SELECT COUNT(*) as total FROM sessions');

    // Total interactions
    const interactions = await pool.query('SELECT COUNT(*) as total FROM interactions');

    // Global pattern distribution
    const patterns = await pool.query(
      `SELECT detected_pattern, COUNT(*) as count
       FROM pattern_logs
       GROUP BY detected_pattern
       ORDER BY count DESC`
    );

    // Alert summary
    const alerts = await pool.query(
      `SELECT severity, COUNT(*) as count
       FROM skill_alerts
       WHERE dismissed = false
       GROUP BY severity`
    );

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].total),
        totalSessions: parseInt(sessions.rows[0].total),
        totalInteractions: parseInt(interactions.rows[0].total),
        patternDistribution: patterns.rows.reduce((acc: { [key: string]: number }, row: any) => {
          acc[row.detected_pattern] = parseInt(row.count);
          return acc;
        }, {}),
        activeAlerts: alerts.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
