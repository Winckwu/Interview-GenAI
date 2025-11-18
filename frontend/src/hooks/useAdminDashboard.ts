/**
 * useAdminDashboard Hook
 * Fetches and manages admin dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface AdminDashboard {
  totalUsers: number;
  totalSessions: number;
  totalInteractions: number;
  patternDistribution: Record<string, number>;
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

interface UseAdminDashboardReturn {
  dashboard: AdminDashboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminDashboard = (): UseAdminDashboardReturn => {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/dashboard');
      setDashboard(response.data.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch admin dashboard';
      setError(errorMsg);
      console.error('Admin dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    dashboard,
    loading,
    error,
    refetch: fetchDashboard,
  };
};
