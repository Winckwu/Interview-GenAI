import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * API Client Configuration
 * Handles authentication, error handling, and request/response interceptors
 */

// 使用相对路径，让 Vite 代理处理
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
 * Handles errors and token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry on auth endpoints to prevent infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/verify') ||
                          originalRequest.url?.includes('/auth/refresh') ||
                          originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/register');

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const { token } = response.data.data || response.data;

        // Update token in localStorage
        const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        authState.state.token = token;
        localStorage.setItem('auth-storage', JSON.stringify(authState));

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 401 on auth endpoints - just reject, don't retry
    if (error.response?.status === 401 && isAuthEndpoint) {
      localStorage.removeItem('auth-storage');
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
    }

    // Handle 500+ Server errors
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
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
      api.get(`/patterns/${userId}`),

    analyze: (sessionId: string) =>
      api.post(`/patterns/analyze`, { sessionId }),
  },

  /**
   * Session endpoints
   */
  sessions: {
    create: (data: any) => api.post('/sessions', data),

    get: (sessionId: string) => api.get(`/sessions/${sessionId}`),

    list: (params?: any) => api.get('/sessions', { params }),

    end: (sessionId: string) => api.patch(`/sessions/${sessionId}`, {}),
  },

  /**
   * Interaction endpoints
   */
  interactions: {
    create: (data: any) => api.post('/interactions', data),

    get: (interactionId: string) => api.get(`/interactions/${interactionId}`),

    list: (params?: any) => api.get('/interactions', { params }),

    update: (interactionId: string, data: any) =>
      api.patch(`/interactions/${interactionId}`, data),
  },

  /**
   * Evolution endpoints
   */
  evolution: {
    list: (params?: any) => api.get('/evolution', { params }),

    get: (evolutionId: string) => api.get(`/evolution/${evolutionId}`),

    track: (data: any) => api.post(`/evolution/track`, data),

    stats: (userId: string) => api.get(`/evolution/stats/${userId}`),
  },

  /**
   * Skills endpoints
   */
  skills: {
    setBaseline: (data: any) => api.post('/skills/baseline', data),

    recordTest: (data: any) => api.post('/skills/test', data),

    getBaselines: () => api.get('/skills/baselines'),

    getHistory: (skillName: string, params?: any) =>
      api.get(`/skills/${skillName}/history`, { params }),

    getAlerts: (params?: any) => api.get('/skills/alerts', { params }),

    dismissAlert: (alertId: string) =>
      api.patch(`/skills/alerts/${alertId}`, { dismissed: true }),
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
   * Analytics endpoints
   */
  analytics: {
    summary: (params?: any) =>
      api.get('/analytics/summary', { params }),

    userMetrics: (userId: string) =>
      api.get(`/analytics/users/${userId}`, {}),

    patterns: (params?: any) =>
      api.get('/analytics/patterns', { params }),

    export: (format: 'csv' | 'json') =>
      api.get(`/analytics/export?format=${format}`),
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
