import express, { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * Detect pattern evolution/change
 */
function detectEvolution(previousPattern: string, currentPattern: string): string {
  if (previousPattern === currentPattern) {
    return 'stable';
  }

  // Define improvement paths
  const improvements: { [key: string]: string[] } = {
    F: ['E', 'D', 'C', 'B', 'A'], // Can improve to any pattern
    E: ['D', 'C', 'B', 'A'], // Can improve to others
    D: ['C', 'B', 'A'],
    C: ['B', 'A'],
    B: ['A'],
    A: [], // A is the best
  };

  if (improvements[previousPattern]?.includes(currentPattern)) {
    return 'improvement';
  }

  // Any downgrade is regression
  if (improvements[currentPattern]?.includes(previousPattern)) {
    return 'regression';
  }

  // Otherwise it's migration/oscillation
  return 'oscillation';
}

/**
 * POST /api/evolution/track
 * Track pattern evolution
 */
router.post(
  '/track',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { sessionId, currentPattern, confidence } = req.body;

    if (!sessionId || !currentPattern) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and currentPattern are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Get previous pattern
    const previousResult = await pool.query(
      `SELECT pl.detected_pattern
       FROM pattern_logs pl
       JOIN sessions s ON pl.session_id = s.id
       WHERE s.user_id = $1 AND pl.session_id != $2
       ORDER BY pl.created_at DESC
       LIMIT 1`,
      [userId, sessionId]
    );

    const previousPattern = previousResult.rows.length > 0 ? previousResult.rows[0].detected_pattern : null;

    // Determine change type
    let changeType = 'stable';
    if (previousPattern && previousPattern !== currentPattern) {
      changeType = detectEvolution(previousPattern, currentPattern);
    }

    // Create evolution record
    const evolutionId = uuidv4();
    const result = await pool.query(
      `INSERT INTO evolution_logs (id, session_id, user_id, current_pattern, previous_pattern, change_type, confidence, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, session_id, user_id, current_pattern, previous_pattern, change_type, confidence, created_at`,
      [evolutionId, sessionId, userId, currentPattern, previousPattern, changeType, confidence || 0.8, new Date()]
    );

    const evolution = result.rows[0];
    res.json({
      success: true,
      data: {
        evolution: {
          id: evolution.id,
          sessionId: evolution.session_id,
          userId: evolution.user_id,
          currentPattern: evolution.current_pattern,
          previousPattern: evolution.previous_pattern,
          changeType: evolution.change_type,
          confidence: evolution.confidence,
          createdAt: evolution.created_at,
        },
      },
      message: `Pattern ${changeType}: ${previousPattern || 'N/A'} → ${currentPattern}`,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/evolution/:userId
 * Get user's pattern evolution history
 */
router.get(
  '/:userId',
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

    const result = await pool.query(
      `SELECT id, session_id, current_pattern, previous_pattern, change_type, confidence, created_at
       FROM evolution_logs
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const evolutions = result.rows.map((e: any) => ({
      id: e.id,
      sessionId: e.session_id,
      currentPattern: e.current_pattern,
      previousPattern: e.previous_pattern,
      changeType: e.change_type,
      confidence: e.confidence,
      createdAt: e.created_at,
    }));

    // Calculate statistics
    const stats = {
      totalEvents: evolutions.length,
      improvements: evolutions.filter((e: any) => e.changeType === 'improvement').length,
      regressions: evolutions.filter((e: any) => e.changeType === 'regression').length,
      oscillations: evolutions.filter((e: any) => e.changeType === 'oscillation').length,
      stable: evolutions.filter((e: any) => e.changeType === 'stable').length,
    };

    res.json({
      success: true,
      data: {
        evolutions,
        statistics: stats,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/evolution
 * Get own evolution history
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await pool.query(
      `SELECT id, session_id, current_pattern, previous_pattern, change_type, confidence, created_at
       FROM evolution_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offsetNum]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM evolution_logs WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        evolutions: result.rows.map((e: any) => ({
          id: e.id,
          sessionId: e.session_id,
          currentPattern: e.current_pattern,
          previousPattern: e.previous_pattern,
          changeType: e.change_type,
          confidence: e.confidence,
          createdAt: e.created_at,
        })),
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/evolution/stats/:userId
 * Get evolution statistics and trends
 */
router.get(
  '/stats/:userId',
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

    const result = await pool.query(
      `SELECT change_type, COUNT(*) as count
       FROM evolution_logs
       WHERE user_id = $1
       GROUP BY change_type`,
      [userId]
    );

    const stats: { [key: string]: number } = {
      improvement: 0,
      regression: 0,
      oscillation: 0,
      stable: 0,
    };

    result.rows.forEach((row: any) => {
      stats[row.change_type] = parseInt(row.count);
    });

    const total = Object.values(stats).reduce((a: number, b: number) => a + b, 0);

    res.json({
      success: true,
      data: {
        statistics: stats,
        percentages: {
          improvement: total > 0 ? (stats.improvement / total * 100).toFixed(2) + '%' : '0%',
          regression: total > 0 ? (stats.regression / total * 100).toFixed(2) + '%' : '0%',
          oscillation: total > 0 ? (stats.oscillation / total * 100).toFixed(2) + '%' : '0%',
          stable: total > 0 ? (stats.stable / total * 100).toFixed(2) + '%' : '0%',
        },
        total,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
