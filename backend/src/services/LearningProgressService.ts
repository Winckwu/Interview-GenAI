/**
 * Learning Progress Service
 * Handles user learning progress tracking and achievements
 */

import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Achievement {
  id: string;
  name: string;
  unlockedAt: Date;
}

export interface LearningProgress {
  id: string;
  userId: string;
  verifyCount: number;
  modifyCount: number;
  streakCount: number;
  bestStreak: number;
  totalSessions: number;
  achievementsUnlocked: Achievement[];
  lastActivityDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_VERIFY: { id: 'first_verify', name: 'First Verification', threshold: 1, type: 'verify' },
  VERIFY_5: { id: 'verify_5', name: 'Critical Thinker', threshold: 5, type: 'verify' },
  VERIFY_10: { id: 'verify_10', name: 'Verification Pro', threshold: 10, type: 'verify' },
  VERIFY_25: { id: 'verify_25', name: 'Master Verifier', threshold: 25, type: 'verify' },
  FIRST_MODIFY: { id: 'first_modify', name: 'First Modification', threshold: 1, type: 'modify' },
  MODIFY_5: { id: 'modify_5', name: 'Personalizer', threshold: 5, type: 'modify' },
  MODIFY_10: { id: 'modify_10', name: 'Modification Pro', threshold: 10, type: 'modify' },
  STREAK_3: { id: 'streak_3', name: 'On a Roll', threshold: 3, type: 'streak' },
  STREAK_5: { id: 'streak_5', name: 'Hot Streak', threshold: 5, type: 'streak' },
  STREAK_10: { id: 'streak_10', name: 'Unstoppable', threshold: 10, type: 'streak' },
} as const;

export class LearningProgressService {
  /**
   * Get or create learning progress for a user
   */
  async getOrCreateProgress(userId: string): Promise<LearningProgress> {
    // Try to get existing progress
    const existing = await pool.query(
      'SELECT * FROM user_learning_progress WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      return this.mapToProgress(existing.rows[0]);
    }

    // Create new progress record
    const id = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO user_learning_progress (id, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, now, now]
    );

    return this.mapToProgress(result.rows[0]);
  }

  /**
   * Increment verify count and check for achievements
   */
  async incrementVerifyCount(userId: string): Promise<{ progress: LearningProgress; newAchievements: Achievement[] }> {
    const progress = await this.getOrCreateProgress(userId);
    const newVerifyCount = progress.verifyCount + 1;
    const today = new Date().toISOString().split('T')[0];

    // Update streak
    let newStreakCount = progress.streakCount;
    let newBestStreak = progress.bestStreak;

    if (progress.lastActivityDate) {
      const lastDate = progress.lastActivityDate.toISOString().split('T')[0];
      if (lastDate !== today) {
        // New day, increment streak if consecutive
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
          newStreakCount += 1;
        } else {
          newStreakCount = 1; // Reset streak
        }
      }
    } else {
      newStreakCount = 1;
    }

    newBestStreak = Math.max(newBestStreak, newStreakCount);

    // Check for new achievements
    const newAchievements: Achievement[] = [];
    const existingIds = progress.achievementsUnlocked.map(a => a.id);

    // Check verify achievements
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      if (achievement.type === 'verify' &&
          newVerifyCount >= achievement.threshold &&
          !existingIds.includes(achievement.id)) {
        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          unlockedAt: new Date(),
        });
      }
    }

    // Check streak achievements
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      if (achievement.type === 'streak' &&
          newStreakCount >= achievement.threshold &&
          !existingIds.includes(achievement.id)) {
        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          unlockedAt: new Date(),
        });
      }
    }

    const allAchievements = [...progress.achievementsUnlocked, ...newAchievements];

    // Update database
    const result = await pool.query(
      `UPDATE user_learning_progress
       SET verify_count = $1, streak_count = $2, best_streak = $3,
           achievements_unlocked = $4, last_activity_date = $5, updated_at = $6
       WHERE user_id = $7
       RETURNING *`,
      [newVerifyCount, newStreakCount, newBestStreak, JSON.stringify(allAchievements), today, new Date(), userId]
    );

    return {
      progress: this.mapToProgress(result.rows[0]),
      newAchievements,
    };
  }

  /**
   * Increment modify count and check for achievements
   */
  async incrementModifyCount(userId: string): Promise<{ progress: LearningProgress; newAchievements: Achievement[] }> {
    const progress = await this.getOrCreateProgress(userId);
    const newModifyCount = progress.modifyCount + 1;
    const today = new Date().toISOString().split('T')[0];

    // Check for new achievements
    const newAchievements: Achievement[] = [];
    const existingIds = progress.achievementsUnlocked.map(a => a.id);

    for (const achievement of Object.values(ACHIEVEMENTS)) {
      if (achievement.type === 'modify' &&
          newModifyCount >= achievement.threshold &&
          !existingIds.includes(achievement.id)) {
        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          unlockedAt: new Date(),
        });
      }
    }

    const allAchievements = [...progress.achievementsUnlocked, ...newAchievements];

    // Update database
    const result = await pool.query(
      `UPDATE user_learning_progress
       SET modify_count = $1, achievements_unlocked = $2, last_activity_date = $3, updated_at = $4
       WHERE user_id = $5
       RETURNING *`,
      [newModifyCount, JSON.stringify(allAchievements), today, new Date(), userId]
    );

    return {
      progress: this.mapToProgress(result.rows[0]),
      newAchievements,
    };
  }

  /**
   * Increment session count
   */
  async incrementSessionCount(userId: string): Promise<LearningProgress> {
    const progress = await this.getOrCreateProgress(userId);

    const result = await pool.query(
      `UPDATE user_learning_progress
       SET total_sessions = total_sessions + 1, updated_at = $1
       WHERE user_id = $2
       RETURNING *`,
      [new Date(), userId]
    );

    return this.mapToProgress(result.rows[0]);
  }

  /**
   * Get user's learning progress
   */
  async getProgress(userId: string): Promise<LearningProgress | null> {
    const result = await pool.query(
      'SELECT * FROM user_learning_progress WHERE user_id = $1',
      [userId]
    );

    return result.rows.length > 0 ? this.mapToProgress(result.rows[0]) : null;
  }

  private mapToProgress(row: any): LearningProgress {
    return {
      id: row.id,
      userId: row.user_id,
      verifyCount: row.verify_count || 0,
      modifyCount: row.modify_count || 0,
      streakCount: row.streak_count || 0,
      bestStreak: row.best_streak || 0,
      totalSessions: row.total_sessions || 0,
      achievementsUnlocked: row.achievements_unlocked || [],
      lastActivityDate: row.last_activity_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new LearningProgressService();
