/**
 * useAssessment Hook
 * Manages metacognitive assessment data and history
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface AssessmentResult {
  id: string;
  userId: string;
  timestamp: string;
  responses: Record<string, any>;
  score?: number;
  feedback?: string;
  patternIdentified?: string;
  recommendations?: string[];
}

interface UseAssessmentReturn {
  assessments: AssessmentResult[];
  latestAssessment: AssessmentResult | null;
  loading: boolean;
  error: string | null;
  submitAssessment: (responses: Record<string, any>) => Promise<AssessmentResult>;
  fetchAssessments: (userId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAssessment = (userId: string): UseAssessmentReturn => {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAssessments = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/assessments/${id}`);
      const assessmentList = response.data.data || [];
      setAssessments(assessmentList);

      // Get latest assessment
      if (assessmentList.length > 0) {
        setLatestAssessment(assessmentList[0]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch assessments';
      setError(errorMsg);
      console.error('Assessment fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAssessment = useCallback(async (responses: Record<string, any>): Promise<AssessmentResult> => {
    try {
      const response = await api.post('/assessments', {
        userId,
        responses,
        timestamp: new Date().toISOString(),
      });

      const newAssessment = response.data.data;
      setAssessments((prev) => [newAssessment, ...prev]);
      setLatestAssessment(newAssessment);

      return newAssessment;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit assessment';
      setError(errorMsg);
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserAssessments(userId);
    }
  }, [userId]);

  return {
    assessments,
    latestAssessment,
    loading,
    error,
    submitAssessment,
    fetchAssessments: fetchUserAssessments,
    refetch: () => fetchUserAssessments(userId),
  };
};
