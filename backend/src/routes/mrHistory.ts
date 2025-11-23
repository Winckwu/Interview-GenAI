/**
 * MR Tools History Routes
 *
 * Unified API endpoints for saving and retrieving history from various MR tools:
 * - MR7: Failure Learning Logs
 * - MR11: Verification Logs
 * - MR5: Iteration Branches & Variants
 * - MR14: Reflection Logs
 * - MR6: Model Comparisons
 * - MR12: Critical Thinking Evaluations
 */

import { Router, Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// MR7: Failure Learning Logs
// ============================================================================

/**
 * GET /mr-history/mr7 - Get user's learning logs
 */
router.get('/mr7', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM mr7_learning_logs
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM mr7_learning_logs WHERE user_id = $1`;
    const countParams: any[] = [userId];
    if (sessionId) {
      countQuery += ` AND session_id = $2`;
      countParams.push(sessionId);
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        logs: result.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          taskDescription: row.task_description,
          attemptNumber: row.attempt_number,
          rejectionReason: row.rejection_reason,
          userFeedback: row.user_feedback,
          lessonsLearned: row.lessons_learned,
          keyTakeaways: row.key_takeaways,
          nextTimeStrategy: row.next_time_strategy,
          failurePatterns: row.failure_patterns,
          learningInsights: row.learning_insights,
          recoveryStrategies: row.recovery_strategies,
          rating: row.rating,
          createdAt: row.created_at,
        })),
        total: parseInt(countResult.rows[0].total, 10),
      },
    });
  } catch (error) {
    console.error('[mr-history/mr7] GET error:', error);
    next(error);
  }
});

/**
 * POST /mr-history/mr7 - Save a learning log
 */
router.post('/mr7', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      taskDescription,
      attemptNumber = 1,
      rejectionReason,
      userFeedback,
      lessonsLearned,
      keyTakeaways,
      nextTimeStrategy,
      failurePatterns,
      learningInsights,
      recoveryStrategies,
      rating,
    } = req.body;

    if (!taskDescription || !lessonsLearned) {
      return res.status(400).json({
        success: false,
        error: 'taskDescription and lessonsLearned are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO mr7_learning_logs
        (user_id, session_id, task_description, attempt_number, rejection_reason,
         user_feedback, lessons_learned, key_takeaways, next_time_strategy,
         failure_patterns, learning_insights, recovery_strategies, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        taskDescription,
        attemptNumber,
        rejectionReason || null,
        userFeedback || null,
        lessonsLearned,
        JSON.stringify(keyTakeaways || []),
        nextTimeStrategy || null,
        JSON.stringify(failurePatterns || []),
        JSON.stringify(learningInsights || []),
        JSON.stringify(recoveryStrategies || []),
        rating || null,
      ]
    );

    const row = result.rows[0];
    console.log('[mr-history/mr7] Saved learning log:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        sessionId: row.session_id,
        taskDescription: row.task_description,
        lessonsLearned: row.lessons_learned,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr7] POST error:', error);
    next(error);
  }
});

// ============================================================================
// MR11: Verification Logs
// ============================================================================

/**
 * GET /mr-history/mr11 - Get user's verification logs
 */
router.get('/mr11', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, contentType, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM mr11_verification_logs
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }
    if (contentType) {
      query += ` AND content_type = $${paramIndex++}`;
      params.push(contentType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM mr11_verification_logs WHERE user_id = $1`;
    const countParams: any[] = [userId];
    if (sessionId) {
      countQuery += ` AND session_id = $2`;
      countParams.push(sessionId);
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        logs: result.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          messageId: row.message_id,
          contentType: row.content_type,
          contentText: row.content_text,
          verificationMethod: row.verification_method,
          toolUsed: row.tool_used,
          verificationStatus: row.verification_status,
          confidenceScore: row.confidence_score,
          findings: row.findings,
          discrepancies: row.discrepancies,
          suggestions: row.suggestions,
          userDecision: row.user_decision,
          userNotes: row.user_notes,
          actualCorrectness: row.actual_correctness,
          createdAt: row.created_at,
        })),
        total: parseInt(countResult.rows[0].total, 10),
      },
    });
  } catch (error) {
    console.error('[mr-history/mr11] GET error:', error);
    next(error);
  }
});

/**
 * POST /mr-history/mr11 - Save a verification log
 */
router.post('/mr11', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      messageId,
      contentType,
      contentText,
      verificationMethod,
      toolUsed,
      verificationStatus,
      confidenceScore,
      findings,
      discrepancies,
      suggestions,
      userDecision,
      userNotes,
    } = req.body;

    if (!contentType || !verificationMethod || !userDecision) {
      return res.status(400).json({
        success: false,
        error: 'contentType, verificationMethod, and userDecision are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO mr11_verification_logs
        (user_id, session_id, message_id, content_type, content_text,
         verification_method, tool_used, verification_status, confidence_score,
         findings, discrepancies, suggestions, user_decision, user_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        messageId || null,
        contentType,
        contentText || null,
        verificationMethod,
        toolUsed || null,
        verificationStatus || 'unverified',
        confidenceScore || null,
        JSON.stringify(findings || []),
        JSON.stringify(discrepancies || []),
        JSON.stringify(suggestions || []),
        userDecision,
        userNotes || null,
      ]
    );

    const row = result.rows[0];
    console.log('[mr-history/mr11] Saved verification log:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        sessionId: row.session_id,
        contentType: row.content_type,
        userDecision: row.user_decision,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr11] POST error:', error);
    next(error);
  }
});

// ============================================================================
// MR5: Low-Cost Iteration - Branches
// ============================================================================

/**
 * GET /mr-history/mr5/branches - Get user's conversation branches
 */
router.get('/mr5/branches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM mr5_conversation_branches
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        branches: result.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          branchName: row.branch_name,
          parentBranchId: row.parent_branch_id,
          parentMessageIndex: row.parent_message_index,
          conversationHistory: row.conversation_history,
          nextPrompt: row.next_prompt,
          rating: row.rating,
          variantsCount: row.variants_count,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[mr-history/mr5/branches] GET error:', error);
    next(error);
  }
});

/**
 * POST /mr-history/mr5/branches - Save a conversation branch
 */
router.post('/mr5/branches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      branchName,
      parentBranchId,
      parentMessageIndex,
      conversationHistory,
      nextPrompt,
      rating = 0,
    } = req.body;

    if (!branchName || !conversationHistory) {
      return res.status(400).json({
        success: false,
        error: 'branchName and conversationHistory are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO mr5_conversation_branches
        (user_id, session_id, branch_name, parent_branch_id, parent_message_index,
         conversation_history, next_prompt, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        branchName,
        parentBranchId || null,
        parentMessageIndex || null,
        JSON.stringify(conversationHistory),
        nextPrompt || null,
        rating,
      ]
    );

    const row = result.rows[0];
    console.log('[mr-history/mr5/branches] Saved branch:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        branchName: row.branch_name,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr5/branches] POST error:', error);
    next(error);
  }
});

/**
 * PUT /mr-history/mr5/branches/:id - Update a conversation branch
 */
router.put('/mr5/branches/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const branchId = req.params.id;
    const {
      branchName,
      conversationHistory,
      nextPrompt,
      rating,
    } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (branchName !== undefined) {
      updates.push(`branch_name = $${paramIndex++}`);
      params.push(branchName);
    }
    if (conversationHistory !== undefined) {
      updates.push(`conversation_history = $${paramIndex++}`);
      params.push(JSON.stringify(conversationHistory));
    }
    if (nextPrompt !== undefined) {
      updates.push(`next_prompt = $${paramIndex++}`);
      params.push(nextPrompt);
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      params.push(rating);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    // Add WHERE conditions
    params.push(branchId, userId);

    const result = await pool.query(
      `UPDATE mr5_conversation_branches
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found or unauthorized',
      });
    }

    const row = result.rows[0];
    console.log('[mr-history/mr5/branches] Updated branch:', row.id);

    res.json({
      success: true,
      data: {
        id: row.id,
        branchName: row.branch_name,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr5/branches] PUT error:', error);
    next(error);
  }
});

/**
 * GET /mr-history/mr5/variants - Get user's iteration variants
 */
router.get('/mr5/variants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, branchId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM mr5_iteration_variants
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }
    if (branchId) {
      query += ` AND branch_id = $${paramIndex++}`;
      params.push(branchId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        variants: result.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          branchId: row.branch_id,
          prompt: row.prompt,
          content: row.content,
          temperature: row.temperature,
          style: row.style,
          promptTokens: row.prompt_tokens,
          completionTokens: row.completion_tokens,
          totalTokens: row.total_tokens,
          rating: row.rating,
          wasSelected: row.was_selected,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[mr-history/mr5/variants] GET error:', error);
    next(error);
  }
});

/**
 * POST /mr-history/mr5/variants - Save an iteration variant
 */
router.post('/mr5/variants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      branchId,
      prompt,
      content,
      temperature,
      style,
      promptTokens,
      completionTokens,
      totalTokens,
      rating,
      wasSelected = false,
    } = req.body;

    if (!prompt || !content) {
      return res.status(400).json({
        success: false,
        error: 'prompt and content are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO mr5_iteration_variants
        (user_id, session_id, branch_id, prompt, content, temperature, style,
         prompt_tokens, completion_tokens, total_tokens, rating, was_selected)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        branchId || null,
        prompt,
        content,
        temperature || null,
        style || null,
        promptTokens || null,
        completionTokens || null,
        totalTokens || null,
        rating || null,
        wasSelected,
      ]
    );

    const row = result.rows[0];
    console.log('[mr-history/mr5/variants] Saved variant:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        style: row.style,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr5/variants] POST error:', error);
    next(error);
  }
});

// ============================================================================
// MR14: Guided Reflection
// ============================================================================

/**
 * GET /mr-history/mr14 - Get user's reflection logs
 */
router.get('/mr14', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM mr14_reflection_logs
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        logs: result.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          conversationSummary: row.conversation_summary,
          immediateReflections: row.immediate_reflections,
          structuredReflections: row.structured_reflections,
          metacognitiveReflections: row.metacognitive_reflections,
          depthLevel: row.depth_level,
          depthScore: row.depth_score,
          depthFeedback: row.depth_feedback,
          completedStages: row.completed_stages,
          isComplete: row.is_complete,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[mr-history/mr14] GET error:', error);
    next(error);
  }
});

/**
 * POST /mr-history/mr14 - Save a reflection log
 */
router.post('/mr14', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      conversationSummary,
      immediateReflections,
      structuredReflections,
      metacognitiveReflections,
      depthLevel,
      depthScore,
      depthFeedback,
      completedStages,
      isComplete = false,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO mr14_reflection_logs
        (user_id, session_id, conversation_summary, immediate_reflections,
         structured_reflections, metacognitive_reflections, depth_level,
         depth_score, depth_feedback, completed_stages, is_complete)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        conversationSummary || null,
        JSON.stringify(immediateReflections || {}),
        JSON.stringify(structuredReflections || {}),
        JSON.stringify(metacognitiveReflections || {}),
        depthLevel || null,
        depthScore || null,
        depthFeedback || null,
        JSON.stringify(completedStages || []),
        isComplete,
      ]
    );

    const row = result.rows[0];
    console.log('[mr-history/mr14] Saved reflection log:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        isComplete: row.is_complete,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr14] POST error:', error);
    next(error);
  }
});

// ============================================================================
// MR6: Cross-Model Comparison
// ============================================================================

/**
 * GET /mr-history/mr6 - Get user's model comparisons
 */
router.get('/mr6', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM mr6_model_comparisons
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        comparisons: result.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          prompt: row.prompt,
          modelResponses: row.model_responses,
          preferredModel: row.preferred_model,
          preferenceReason: row.preference_reason,
          comparisonNotes: row.comparison_notes,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[mr-history/mr6] GET error:', error);
    next(error);
  }
});

/**
 * POST /mr-history/mr6 - Save a model comparison
 */
router.post('/mr6', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      prompt,
      modelResponses,
      preferredModel,
      preferenceReason,
      comparisonNotes,
    } = req.body;

    if (!prompt || !modelResponses) {
      return res.status(400).json({
        success: false,
        error: 'prompt and modelResponses are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO mr6_model_comparisons
        (user_id, session_id, prompt, model_responses, preferred_model,
         preference_reason, comparison_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        prompt,
        JSON.stringify(modelResponses),
        preferredModel || null,
        preferenceReason || null,
        comparisonNotes || null,
      ]
    );

    const row = result.rows[0];
    console.log('[mr-history/mr6] Saved model comparison:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        preferredModel: row.preferred_model,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr6] POST error:', error);
    next(error);
  }
});

// ============================================================================
// MR12: Critical Thinking Evaluation
// ============================================================================

/**
 * GET /mr-history/mr12 - Get user's evaluation sessions
 */
router.get('/mr12', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { sessionId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM mr12_evaluation_sessions
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        sessions: result.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          contentToEvaluate: row.content_to_evaluate,
          contentSource: row.content_source,
          evaluationCriteria: row.evaluation_criteria,
          overallScore: row.overall_score,
          strengths: row.strengths,
          weaknesses: row.weaknesses,
          recommendations: row.recommendations,
          userAssessment: row.user_assessment,
          agreedWithAi: row.agreed_with_ai,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[mr-history/mr12] GET error:', error);
    next(error);
  }
});

/**
 * POST /mr-history/mr12 - Save an evaluation session
 */
router.post('/mr12', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const {
      sessionId,
      contentToEvaluate,
      contentSource,
      evaluationCriteria,
      overallScore,
      strengths,
      weaknesses,
      recommendations,
      userAssessment,
      agreedWithAi,
    } = req.body;

    if (!contentToEvaluate || !evaluationCriteria) {
      return res.status(400).json({
        success: false,
        error: 'contentToEvaluate and evaluationCriteria are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO mr12_evaluation_sessions
        (user_id, session_id, content_to_evaluate, content_source, evaluation_criteria,
         overall_score, strengths, weaknesses, recommendations, user_assessment, agreed_with_ai)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        sessionId || null,
        contentToEvaluate,
        contentSource || null,
        JSON.stringify(evaluationCriteria),
        overallScore || null,
        JSON.stringify(strengths || []),
        JSON.stringify(weaknesses || []),
        JSON.stringify(recommendations || []),
        userAssessment || null,
        agreedWithAi ?? null,
      ]
    );

    const row = result.rows[0];
    console.log('[mr-history/mr12] Saved evaluation session:', row.id);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        overallScore: row.overall_score,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[mr-history/mr12] POST error:', error);
    next(error);
  }
});

// ============================================================================
// Aggregated Statistics
// ============================================================================

/**
 * GET /mr-history/stats - Get aggregated statistics for all MR tools
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const [mr7Stats, mr11Stats, mr5Stats, mr14Stats, mr6Stats, mr12Stats] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM mr7_learning_logs WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) as count FROM mr11_verification_logs WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) as branches FROM mr5_conversation_branches WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) as count FROM mr14_reflection_logs WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) as count FROM mr6_model_comparisons WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) as count FROM mr12_evaluation_sessions WHERE user_id = $1`, [userId]),
    ]);

    res.json({
      success: true,
      data: {
        mr7: { learningLogs: parseInt(mr7Stats.rows[0].count, 10) },
        mr11: { verificationLogs: parseInt(mr11Stats.rows[0].count, 10) },
        mr5: { branches: parseInt(mr5Stats.rows[0].branches, 10) },
        mr14: { reflectionLogs: parseInt(mr14Stats.rows[0].count, 10) },
        mr6: { modelComparisons: parseInt(mr6Stats.rows[0].count, 10) },
        mr12: { evaluationSessions: parseInt(mr12Stats.rows[0].count, 10) },
      },
    });
  } catch (error) {
    console.error('[mr-history/stats] GET error:', error);
    next(error);
  }
});

export default router;
