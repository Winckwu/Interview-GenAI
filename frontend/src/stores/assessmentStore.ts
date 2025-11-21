import { create } from 'zustand';
import api from '../services/api';

export interface AssessmentResult {
  id: string;
  userId: string;
  timestamp: string;
  planningScore?: number;
  monitoringScore?: number;
  evaluationScore?: number;
  regulationScore?: number;
  overallScore?: number;
  strengths?: string[];
  areasForGrowth?: string[];
  recommendations?: string[];
}

export interface AssessmentState {
  // State
  assessments: AssessmentResult[];
  latestAssessment: AssessmentResult | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAssessments: (userId: string) => Promise<void>;
  submitAssessment: (userId: string, responses: Record<string, any>) => Promise<AssessmentResult>;
  fetchLatestAssessment: (userId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Assessment store for managing metacognitive assessments
 */
export const useAssessmentStore = create<AssessmentState>((set) => ({
  assessments: [],
  latestAssessment: null,
  loading: false,
  error: null,

  fetchAssessments: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/assessments/${userId}`);
      const assessmentList = response.data.data || [];
      set({ assessments: assessmentList });

      // Set latest assessment
      if (assessmentList.length > 0) {
        set({ latestAssessment: assessmentList[0] });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch assessments';
      set({ error: errorMsg });
      console.error('Assessment fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  submitAssessment: async (userId: string, responses: Record<string, any>) => {
    set({ error: null });
    try {
      const response = await api.post('/assessments', {
        userId,
        responses,
        timestamp: new Date().toISOString(),
      });

      const newAssessment = response.data.data;

      set((state) => ({
        assessments: [newAssessment, ...state.assessments],
        latestAssessment: newAssessment,
      }));

      return newAssessment;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit assessment';
      set({ error: errorMsg });
      throw err;
    }
  },

  fetchLatestAssessment: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/assessments/${userId}/latest`);
      set({ latestAssessment: response.data.data });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch latest assessment';
      set({ error: errorMsg });
      console.error('Latest assessment fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
