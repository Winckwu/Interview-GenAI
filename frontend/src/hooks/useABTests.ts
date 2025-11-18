/**
 * useABTests Hook
 * Manages A/B testing data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed';
  controlGroup: string;
  treatmentGroup: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ABTestResult {
  testId: string;
  testName: string;
  controlGroup: {
    name: string;
    participantCount: number;
    conversionRate: number;
  };
  treatmentGroup: {
    name: string;
    participantCount: number;
    conversionRate: number;
  };
  statisticalSignificance: number;
  winner: string | null;
}

interface UseABTestsReturn {
  tests: ABTest[];
  loading: boolean;
  error: string | null;
  createTest: (test: Partial<ABTest>) => Promise<ABTest>;
  updateTest: (testId: string, updates: Partial<ABTest>) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;
  startTest: (testId: string) => Promise<void>;
  getTestResults: (testId: string) => Promise<ABTestResult>;
  refetch: () => Promise<void>;
}

export const useABTests = (): UseABTestsReturn => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/ab-test');
      setTests(response.data.data.tests || []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch A/B tests';
      setError(errorMsg);
      console.error('A/B tests fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTest = useCallback(async (test: Partial<ABTest>): Promise<ABTest> => {
    try {
      const response = await api.post('/ab-test', test);
      const newTest = response.data.data;
      setTests((prev) => [newTest, ...prev]);
      return newTest;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create A/B test';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const updateTest = useCallback(async (testId: string, updates: Partial<ABTest>) => {
    try {
      await api.patch(`/ab-test/${testId}`, updates);
      setTests((prev) =>
        prev.map((test) => (test.id === testId ? { ...test, ...updates } : test))
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update A/B test';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const deleteTest = useCallback(async (testId: string) => {
    try {
      await api.delete(`/ab-test/${testId}`);
      setTests((prev) => prev.filter((test) => test.id !== testId));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete A/B test';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const startTest = useCallback(async (testId: string) => {
    try {
      await api.post(`/ab-test/${testId}/start`, {});
      setTests((prev) =>
        prev.map((test) =>
          test.id === testId ? { ...test, status: 'running' as const } : test
        )
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to start A/B test';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const getTestResults = useCallback(async (testId: string): Promise<ABTestResult> => {
    try {
      const response = await api.get(`/ab-test/${testId}/results`);
      return response.data.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch A/B test results';
      setError(errorMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, []);

  return {
    tests,
    loading,
    error,
    createTest,
    updateTest,
    deleteTest,
    startTest,
    getTestResults,
    refetch: fetchTests,
  };
};
