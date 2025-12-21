/**
 * useLearningProgress Hook
 * Manages user learning progress and achievements with persistent storage
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export interface Achievement {
  id: string;
  name: string;
  unlockedAt: Date;
}

export interface LearningProgress {
  verifyCount: number;
  modifyCount: number;
  streakCount: number;
  bestStreak: number;
  totalSessions: number;
  achievementsUnlocked: Achievement[];
  lastActivityDate: Date | null;
}

interface UseLearningProgressReturn {
  progress: LearningProgress | null;
  loading: boolean;
  error: string | null;
  incrementVerify: () => Promise<{ newAchievements: Achievement[] }>;
  incrementModify: () => Promise<{ newAchievements: Achievement[] }>;
  incrementSession: () => Promise<void>;
  refetch: () => Promise<void>;
}

const defaultProgress: LearningProgress = {
  verifyCount: 0,
  modifyCount: 0,
  streakCount: 0,
  bestStreak: 0,
  totalSessions: 0,
  achievementsUnlocked: [],
  lastActivityDate: null,
};

export const useLearningProgress = (): UseLearningProgressReturn => {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.learningProgress.get();
      setProgress(response.data.data);
    } catch (err: any) {
      // If not authenticated or error, use default progress
      console.warn('Learning progress fetch error:', err);
      setProgress(defaultProgress);
      // Don't set error for auth issues - just use default
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to fetch learning progress');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const incrementVerify = useCallback(async (): Promise<{ newAchievements: Achievement[] }> => {
    try {
      const response = await apiService.learningProgress.incrementVerify();
      const { verifyCount, modifyCount, streakCount, bestStreak, newAchievements } = response.data.data;

      setProgress(prev => prev ? {
        ...prev,
        verifyCount,
        modifyCount,
        streakCount,
        bestStreak,
        achievementsUnlocked: [
          ...prev.achievementsUnlocked,
          ...newAchievements,
        ],
      } : null);

      return { newAchievements };
    } catch (err: any) {
      console.error('Failed to increment verify count:', err);
      // Fallback: increment locally
      setProgress(prev => prev ? {
        ...prev,
        verifyCount: prev.verifyCount + 1,
      } : null);
      return { newAchievements: [] };
    }
  }, []);

  const incrementModify = useCallback(async (): Promise<{ newAchievements: Achievement[] }> => {
    try {
      const response = await apiService.learningProgress.incrementModify();
      const { verifyCount, modifyCount, streakCount, newAchievements } = response.data.data;

      setProgress(prev => prev ? {
        ...prev,
        verifyCount,
        modifyCount,
        streakCount,
        achievementsUnlocked: [
          ...prev.achievementsUnlocked,
          ...newAchievements,
        ],
      } : null);

      return { newAchievements };
    } catch (err: any) {
      console.error('Failed to increment modify count:', err);
      // Fallback: increment locally
      setProgress(prev => prev ? {
        ...prev,
        modifyCount: prev.modifyCount + 1,
      } : null);
      return { newAchievements: [] };
    }
  }, []);

  const incrementSession = useCallback(async (): Promise<void> => {
    try {
      const response = await apiService.learningProgress.incrementSession();
      const { totalSessions } = response.data.data;

      setProgress(prev => prev ? {
        ...prev,
        totalSessions,
      } : null);
    } catch (err: any) {
      console.error('Failed to increment session count:', err);
      // Fallback: increment locally
      setProgress(prev => prev ? {
        ...prev,
        totalSessions: prev.totalSessions + 1,
      } : null);
    }
  }, []);

  return {
    progress,
    loading,
    error,
    incrementVerify,
    incrementModify,
    incrementSession,
    refetch: fetchProgress,
  };
};

export default useLearningProgress;
