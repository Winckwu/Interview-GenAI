import { create } from 'zustand';
import api from '../services/api';

export interface Pattern {
  id: string;
  userId: string;
  patternType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence: number;
  aiRelianceScore: number;
  verificationScore: number;
  contextSwitchingFrequency: number;
  metrics: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  id: string;
  userId: string;
  taskId: string;
  predictedPattern: string;
  actualPattern: string | null;
  confidence: number;
  feedback: 'accurate' | 'inaccurate' | 'partially_accurate' | null;
  isCorrect: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface Evolution {
  id: string;
  userId: string;
  timePoint: string;
  fromPattern: string;
  toPattern: string;
  changeType: 'improvement' | 'migration' | 'oscillation' | 'regression';
  metrics: Record<string, number>;
  createdAt: string;
}

export interface PatternState {
  patterns: Pattern[];
  predictions: Prediction[];
  evolutions: Evolution[];
  currentUserPattern: Pattern | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchPatterns: (userId?: string) => Promise<void>;
  fetchPredictions: (userId?: string) => Promise<void>;
  fetchEvolutions: (userId?: string) => Promise<void>;
  createPrediction: (taskId: string, context: Record<string, any>) => Promise<Prediction>;
  submitFeedback: (predictionId: string, feedback: string, isCorrect: boolean) => Promise<void>;
  clearError: () => void;
}

/**
 * Pattern and prediction store using Zustand
 * Manages AI usage patterns, predictions, and evolution tracking
 */
export const usePatternStore = create<PatternState>((set, get) => ({
  patterns: [],
  predictions: [],
  evolutions: [],
  currentUserPattern: null,
  loading: false,
  error: null,

  fetchPatterns: async (userId?: string) => {
    set({ loading: true, error: null });
    try {
      // Fetch pattern statistics
      const statsResponse = await api.get('/patterns/stats/' + (userId || 'current'));
      const statsData = statsResponse.data.data;

      // Transform to Pattern array format
      const patterns = statsData.dominantPattern
        ? [
            {
              id: '1',
              userId: userId || 'current',
              patternType: statsData.dominantPattern as 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
              confidence: statsData.patterns?.[statsData.dominantPattern]?.avgConfidence || 0.5,
              aiRelianceScore: 0.5, // 0-1 range for 50%
              verificationScore: 0.5, // 0-1 range for 50%
              contextSwitchingFrequency: 1,
              metrics: statsData.distribution || {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
        : [];

      set({ patterns });

      // Set current user pattern if available
      if (patterns.length > 0) {
        set({ currentUserPattern: patterns[0] });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch patterns';
      set({ error: errorMsg });
      console.error('Fetch patterns error:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchPredictions: async (userId?: string) => {
    set({ loading: true, error: null });
    try {
      // Fetch actual predictions from backend
      const response = await api.get('/predictions');
      const predictions = response.data.data || [];

      set({ predictions });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch predictions';
      set({ error: errorMsg });
      console.error('Fetch predictions error:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchEvolutions: async (userId?: string) => {
    set({ loading: true, error: null });
    try {
      // Get pattern trends to show evolution
      const trendsResponse = await api.get('/patterns/trends/' + (userId || 'current'));
      const trendsData = trendsResponse.data.data || [];

      // Transform trends into Evolution array
      const evolutions: Evolution[] = trendsData.slice(0, -1).map((trend: any, index: number) => {
        const nextTrend = trendsData[index + 1];
        return {
          id: `${index}`,
          userId: userId || 'current',
          timePoint: trend.date,
          fromPattern: trend.pattern,
          toPattern: nextTrend?.pattern || trend.pattern,
          changeType: (nextTrend?.pattern !== trend.pattern ? 'migration' : 'oscillation') as any,
          metrics: {},
          createdAt: trend.date,
        };
      });

      set({ evolutions });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch evolutions';
      set({ error: errorMsg });
      console.error('Fetch evolutions error:', error);
    } finally {
      set({ loading: false });
    }
  },

  createPrediction: async (taskId: string, context: Record<string, any>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/predictions/predict', {
        taskId,
        context,
      });

      const newPrediction = response.data.data;
      set({
        predictions: [...get().predictions, newPrediction],
      });

      return newPrediction;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to create prediction';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  submitFeedback: async (predictionId: string, feedback: string, isCorrect: boolean) => {
    set({ error: null });
    try {
      await api.post(`/predictions/${predictionId}/feedback`, {
        feedback,
        isCorrect,
      });

      // Update predictions list
      const predictions = get().predictions.map((pred) => {
        if (pred.id === predictionId) {
          return {
            ...pred,
            feedback: feedback as any,
            isCorrect,
            updatedAt: new Date().toISOString(),
          };
        }
        return pred;
      });

      set({ predictions });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to submit feedback';
      set({ error: errorMsg });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
