import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * API Client Configuration
 * Handles authentication, error handling, and request/response interceptors
 */

// Use relative paths, let Vite proxy handle it
const API_BASE_URL = '/api';

/**
 * Create axios instance with base configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds auth token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token
      : null;

    console.log('[API.request]', config.method?.toUpperCase(), config.url, 'token present:', !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors - simple error handling without token refresh
 */
api.interceptors.response.use(
  (response) => {
    console.log('[API.response]', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.log('[API.error]', error.response?.status, error.config?.url, error.message);

    // Handle 401 Unauthorized - just redirect to login
    if (error.response?.status === 401) {
      console.log('[API.error] 401 - Redirecting to login');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[API.error] 403 - Access denied:', error.response.data);
    }

    // Handle 500+ Server errors
    if (error.response?.status && error.response.status >= 500) {
      console.error('[API.error] 5xx - Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

/**
 * Type-safe API methods
 */
export const apiService = {
  /**
   * Auth endpoints
   */
  auth: {
    login: (email: string, password: string) =>
      api.post('/auth/login', { email, password }),

    register: (email: string, username: string, password: string, userType: string) =>
      api.post('/auth/register', { email, username, password, userType }),

    verify: () => api.get('/auth/verify'),

    refresh: () => api.post('/auth/refresh', {}),

    logout: () => api.post('/auth/logout', {}),
  },

  /**
   * User endpoints
   */
  users: {
    list: (params?: any) => api.get('/users', { params }),

    get: (userId: string) => api.get(`/users/${userId}`),

    update: (userId: string, data: any) =>
      api.patch(`/users/${userId}`, data),

    delete: (userId: string) => api.delete(`/users/${userId}`),

    profile: () => api.get('/users/profile'),

    updateProfile: (data: any) => api.patch('/users/profile', data),
  },

  /**
   * Pattern endpoints
   */
  patterns: {
    list: (params?: any) => api.get('/patterns', { params }),

    get: (patternId: string) => api.get(`/patterns/${patternId}`),

    getUserPattern: (userId: string) =>
      api.get(`/users/${userId}/pattern`),

    analyze: (userId: string) =>
      api.post(`/patterns/analyze`, { userId }),
  },

  /**
   * Prediction endpoints
   */
  predictions: {
    list: (params?: any) => api.get('/predictions', { params }),

    get: (predictionId: string) => api.get(`/predictions/${predictionId}`),

    predict: (taskId: string, context: any) =>
      api.post('/predictions/predict', { taskId, context }),

    submitFeedback: (predictionId: string, feedback: any) =>
      api.post(`/predictions/${predictionId}/feedback`, feedback),

    listByUser: (userId: string, params?: any) =>
      api.get(`/users/${userId}/predictions`, { params }),
  },

  /**
   * Evolution tracking endpoints
   */
  evolution: {
    list: (params?: any) => api.get('/evolution', { params }),

    get: (evolutionId: string) => api.get(`/evolution/${evolutionId}`),

    getUserEvolution: (userId: string) =>
      api.get(`/users/${userId}/evolution`),

    analyze: (userId: string) =>
      api.post(`/evolution/analyze`, { userId }),
  },

  /**
   * Session management endpoints
   */
  sessions: {
    create: (taskDescription: string, taskType: string = 'general', taskImportance: number = 3) =>
      api.post('/sessions', { taskDescription, taskType, taskImportance }),

    get: (sessionId: string) => api.get(`/sessions/${sessionId}`),

    list: (limit?: number, offset?: number) =>
      api.get('/sessions', { params: { limit, offset } }),

    end: (sessionId: string) => api.post(`/sessions/${sessionId}/end`, {}),

    recordInteraction: (
      sessionId: string,
      userPrompt: string,
      aiModel: string = 'claude-sonnet-4-5',
      aiResponse?: string,
      responseTimeMs?: number
    ) =>
      api.post(`/sessions/${sessionId}/interactions`, {
        userPrompt,
        aiModel,
        aiResponse,
        responseTimeMs,
      }),

    getInteractions: (sessionId: string, limit?: number, offset?: number) =>
      api.get(`/sessions/${sessionId}/interactions`, { params: { limit, offset } }),

    updateInteraction: (sessionId: string, interactionId: string, data: any) =>
      api.patch(`/sessions/${sessionId}/interactions/${interactionId}`, data),

    getStats: (sessionId: string) => api.get(`/sessions/${sessionId}/stats`),
  },

  /**
   * Pattern detection endpoints
   */
  patternDetection: {
    detect: (sessionId: string) => api.post('/patterns/detect', { sessionId }),

    getHistory: (userId: string, limit?: number) =>
      api.get(`/patterns/history/${userId}`, { params: { limit } }),

    getStats: (userId: string) => api.get(`/patterns/stats/${userId}`),

    getTrends: (userId: string, days?: number) =>
      api.get(`/patterns/trends/${userId}`, { params: { days } }),
  },

  /**
   * Analytics endpoints
   */
  analytics: {
    // User analytics
    getUser: (days?: number) => api.get('/analytics/user', { params: { days } }),

    getSessionDetails: (sessionId: string) =>
      api.get(`/analytics/session/${sessionId}`),

    getSummary: (days?: number) => api.get('/analytics/summary', { params: { days } }),

    // User metrics and patterns analytics
    userMetrics: (userId: string) =>
      api.get(`/analytics/users/${userId}`, {}),

    patterns: (params?: any) =>
      api.get('/analytics/patterns', { params }),

    // Export functionality
    export: (format: 'csv' | 'json') =>
      api.get(`/analytics/export?format=${format}`),
  },

  /**
   * A/B Testing endpoints
   */
  abTest: {
    list: (params?: any) => api.get('/ab-test', { params }),

    get: (testId: string) => api.get(`/ab-test/${testId}`),

    start: (config: any) => api.post('/ab-test/start', config),

    getResults: (testId: string) =>
      api.get(`/ab-test/${testId}/results`),
  },

  /**
   * Admin endpoints
   */
  admin: {
    getDashboard: () => api.get('/admin/dashboard'),

    getSystemStats: () => api.get('/admin/stats'),

    getLogs: (params?: any) => api.get('/admin/logs', { params }),

    deleteUser: (userId: string) =>
      api.delete(`/admin/users/${userId}`),

    updateSystemConfig: (config: any) =>
      api.patch('/admin/config', config),
  },
};

export default api;
