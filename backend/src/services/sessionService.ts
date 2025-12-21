/**
 * Session Management Service
 * Handles user work sessions and interaction tracking
 */

import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface WorkSession {
  id: string;
  userId: string;
  taskDescription?: string;
  taskType: string;
  taskImportance: number;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsightsData {
  keyPoints?: string[];
  aiApproach?: string;
  assumptions?: string[];
  missingAspects?: string[];
  suggestedFollowups?: string[];
}

export interface Interaction {
  id: string;
  sessionId: string;
  userId: string;
  userPrompt: string;
  aiModel: string;
  aiResponse?: string;
  responseTimeMs?: number;
  wasVerified: boolean;
  wasModified: boolean;
  wasRejected: boolean;
  insights?: InsightsData;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionService {
  /**
   * Create a new work session
   */
  async createSession(
    userId: string,
    taskDescription?: string,
    taskType: string = 'general',
    taskImportance: number = 3
  ): Promise<WorkSession> {
    const id = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO work_sessions (id, user_id, task_description, task_type, task_importance, started_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, userId, taskDescription, taskType, taskImportance, now, now, now]
    );

    return this.mapToSession(result.rows[0]);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<WorkSession | null> {
    const result = await pool.query(
      'SELECT * FROM work_sessions WHERE id = $1',
      [sessionId]
    );

    return result.rows.length > 0 ? this.mapToSession(result.rows[0]) : null;
  }

  /**
   * Update session (e.g., taskDescription/title)
   */
  async updateSession(
    sessionId: string,
    updates: { taskDescription?: string; taskType?: string }
  ): Promise<WorkSession | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.taskDescription !== undefined) {
      setClauses.push(`task_description = $${paramIndex++}`);
      values.push(updates.taskDescription);
    }
    if (updates.taskType !== undefined) {
      setClauses.push(`task_type = $${paramIndex++}`);
      values.push(updates.taskType);
    }

    if (setClauses.length === 0) {
      return this.getSession(sessionId);
    }

    setClauses.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    values.push(sessionId);

    const result = await pool.query(
      `UPDATE work_sessions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapToSession(result.rows[0]) : null;
  }

  /**
   * Get user sessions
   * Prioritizes sessions that have interactions
   */
  async getUserSessions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WorkSession[]> {
    // Use LEFT JOIN to count interactions and prioritize sessions with content
    const result = await pool.query(
      `SELECT ws.*, COALESCE(interaction_counts.count, 0) as interaction_count
       FROM work_sessions ws
       LEFT JOIN (
         SELECT session_id, COUNT(*) as count
         FROM interactions
         GROUP BY session_id
       ) interaction_counts ON ws.id = interaction_counts.session_id
       WHERE ws.user_id = $1
       ORDER BY
         CASE WHEN COALESCE(interaction_counts.count, 0) > 0 THEN 0 ELSE 1 END,
         ws.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(row => this.mapToSession(row));
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<WorkSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const endedAt = new Date();
    const durationMinutes = Math.round(
      (endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60)
    );

    const result = await pool.query(
      `UPDATE work_sessions
       SET ended_at = $1, duration_minutes = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      [endedAt, durationMinutes, endedAt, sessionId]
    );

    return this.mapToSession(result.rows[0]);
  }

  /**
   * Record an interaction
   */
  async recordInteraction(
    sessionId: string,
    userId: string,
    userPrompt: string,
    aiModel: string,
    aiResponse?: string,
    responseTimeMs?: number
  ): Promise<Interaction> {
    const id = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO interactions
       (id, session_id, user_id, user_prompt, ai_model, ai_response, response_time_ms, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, sessionId, userId, userPrompt, aiModel, aiResponse, responseTimeMs, now, now]
    );

    return this.mapToInteraction(result.rows[0]);
  }

  /**
   * Get session interactions
   */
  async getSessionInteractions(
    sessionId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Interaction[]> {
    const result = await pool.query(
      `SELECT * FROM interactions
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    return result.rows.map(row => this.mapToInteraction(row));
  }

  /**
   * Update interaction status
   */
  async updateInteractionStatus(
    interactionId: string,
    verified?: boolean,
    modified?: boolean,
    rejected?: boolean
  ): Promise<Interaction> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (verified !== undefined) {
      updates.push(`was_verified = $${paramCount++}`);
      values.push(verified);
    }
    if (modified !== undefined) {
      updates.push(`was_modified = $${paramCount++}`);
      values.push(modified);
    }
    if (rejected !== undefined) {
      updates.push(`was_rejected = $${paramCount++}`);
      values.push(rejected);
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(interactionId);

    const result = await pool.query(
      `UPDATE interactions
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return this.mapToInteraction(result.rows[0]);
  }

  /**
   * Delete a session and all its interactions
   */
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    // First verify the session belongs to the user
    const session = await this.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return false;
    }

    // Delete all interactions for this session first (foreign key constraint)
    await pool.query('DELETE FROM interactions WHERE session_id = $1', [sessionId]);

    // Delete the session
    const result = await pool.query('DELETE FROM work_sessions WHERE id = $1 AND user_id = $2', [
      sessionId,
      userId,
    ]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get session statistics for analysis
   */
  async getSessionStats(sessionId: string): Promise<any> {
    const interactions = await this.getSessionInteractions(sessionId, 1000);

    const totalInteractions = interactions.length;
    const verifiedCount = interactions.filter(i => i.wasVerified).length;
    const modifiedCount = interactions.filter(i => i.wasModified).length;
    const rejectedCount = interactions.filter(i => i.wasRejected).length;

    const avgPromptLength =
      interactions.length > 0
        ? interactions.reduce((sum, i) => sum + i.userPrompt.split(' ').length, 0) / interactions.length
        : 0;

    const avgResponseTime =
      interactions.filter(i => i.responseTimeMs).length > 0
        ? interactions.reduce((sum, i) => sum + (i.responseTimeMs || 0), 0) /
          interactions.filter(i => i.responseTimeMs).length
        : 0;

    return {
      totalInteractions,
      verifiedCount,
      verificationRate: totalInteractions > 0 ? verifiedCount / totalInteractions : 0,
      modifiedCount,
      modificationRate: totalInteractions > 0 ? modifiedCount / totalInteractions : 0,
      rejectedCount,
      rejectionRate: totalInteractions > 0 ? rejectedCount / totalInteractions : 0,
      avgPromptLength,
      avgResponseTime,
      aiModelsUsed: [...new Set(interactions.map(i => i.aiModel))],
    };
  }

  private mapToSession(row: any): WorkSession {
    return {
      id: row.id,
      userId: row.user_id,
      taskDescription: row.task_description,
      taskType: row.task_type,
      taskImportance: row.task_importance,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationMinutes: row.duration_minutes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update interaction insights (MR2: AI Response Insights)
   */
  async updateInteractionInsights(
    interactionId: string,
    insights: InsightsData
  ): Promise<Interaction | null> {
    const result = await pool.query(
      `UPDATE interactions
       SET insights = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(insights), new Date(), interactionId]
    );

    return result.rows.length > 0 ? this.mapToInteraction(result.rows[0]) : null;
  }

  /**
   * Get interaction by ID
   */
  async getInteraction(interactionId: string): Promise<Interaction | null> {
    const result = await pool.query(
      'SELECT * FROM interactions WHERE id = $1',
      [interactionId]
    );

    return result.rows.length > 0 ? this.mapToInteraction(result.rows[0]) : null;
  }

  private mapToInteraction(row: any): Interaction {
    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      userPrompt: row.user_prompt,
      aiModel: row.ai_model,
      aiResponse: row.ai_response,
      responseTimeMs: row.response_time_ms,
      wasVerified: row.was_verified,
      wasModified: row.was_modified,
      wasRejected: row.was_rejected,
      insights: row.insights,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new SessionService();
