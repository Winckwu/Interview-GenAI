/**
 * useAnalytics Hook
 * Fetches and manages user analytics data for dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export interface UserAnalyticsData {
  totalSessions: number;
  totalInteractions: number;
  averageSessionDuration: number;
  dominantPattern: string;
  patternDistribution: Record<string, number>;
  metacognitiveMetrics: Record<string, number>;
  modelUsage: Record<string, number>;
  patternTrend: Array<{ date: string; pattern: string }>;
  verificationRate: number;
  modificationRate: number;
}

interface UseAnalyticsReturn {
  analytics: UserAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAnalytics = (days: number = 30): UseAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.analytics.getUser(days);
      setAnalytics(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch analytics';
      setError(errorMsg);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};

/**
 * usePatternStats Hook
 * Fetches pattern statistics and trends
 */
interface PatternStats {
  dominantPattern: string;
  distribution: Record<string, number>;
  totalDetections: number;
  patterns: Record<string, any>;
}

interface UsePatternStatsReturn {
  stats: PatternStats | null;
  trends: Array<{ date: string; pattern: string }> | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePatternStats = (userId: string, days: number = 30): UsePatternStatsReturn => {
  const [stats, setStats] = useState<PatternStats | null>(null);
  const [trends, setTrends] = useState<Array<{ date: string; pattern: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatternStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResponse, trendsResponse] = await Promise.all([
        apiService.patternDetection.getStats(userId),
        apiService.patternDetection.getTrends(userId, days),
      ]);

      setStats(statsResponse.data.data);
      setTrends(trendsResponse.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch pattern stats';
      setError(errorMsg);
      console.error('Pattern stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, days]);

  useEffect(() => {
    if (userId) {
      fetchPatternStats();
    }
  }, [userId, days]);

  return {
    stats,
    trends,
    loading,
    error,
    refetch: fetchPatternStats,
  };
};

/**
 * useSessions Hook
 * Manages user sessions
 */
interface Session {
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

interface UseSessionsReturn {
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
  createSession: (taskDescription: string, taskType?: string, taskImportance?: number) => Promise<Session>;
  endSession: (sessionId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useSessions = (): UseSessionsReturn => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.sessions.list(50, 0);
      setSessions(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch sessions';
      setError(errorMsg);
      console.error('Sessions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (
      taskDescription: string,
      taskType: string = 'general',
      taskImportance: number = 3
    ): Promise<Session> => {
      try {
        const response = await apiService.sessions.create(taskDescription, taskType, taskImportance);
        const newSession = response.data.data;
        setCurrentSession(newSession);
        setSessions(prev => [newSession, ...prev]);
        return newSession;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to create session';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const endSession = useCallback(async (sessionId: string) => {
    try {
      await apiService.sessions.end(sessionId);
      setCurrentSession(null);
      await fetchSessions();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to end session';
      setError(errorMsg);
      throw err;
    }
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    currentSession,
    loading,
    error,
    createSession,
    endSession,
    refetch: fetchSessions,
  };
};
