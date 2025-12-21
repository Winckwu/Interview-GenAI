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

    update: (sessionId: string, data: { taskDescription?: string; taskType?: string }) =>
      api.patch(`/sessions/${sessionId}`, data),

    list: (limit?: number, offset?: number) =>
      api.get('/sessions', { params: { limit, offset } }),

    getAll: (params?: { limit?: number; offset?: number; includeInteractions?: boolean }) =>
      api.get('/sessions', { params }),

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

    // MR2: Save insights for an interaction
    saveInsights: (sessionId: string, interactionId: string, insights: any) =>
      api.patch(`/sessions/${sessionId}/interactions/${interactionId}/insights`, { insights }),

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

    getVerificationStrategy: (days?: number) => api.get('/analytics/verification-strategy', { params: { days } }),

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

  /**
   * AI/MR endpoints - GPT-powered MR tools
   * Note: AI endpoints use longer timeout (60s) as GPT calls can be slow
   */
  ai: {
    // Basic chat (non-streaming fallback)
    chat: (userPrompt: string, conversationHistory: any[] = []) =>
      api.post('/ai/chat', { userPrompt, conversationHistory }, { timeout: 60000 }),

    // Streaming chat - returns an EventSource-like interface
    chatStream: (
      userPrompt: string,
      conversationHistory: any[] = [],
      options: {
        useWebSearch?: boolean;
        autoDetectSearch?: boolean;
        systemPrompt?: string;  // MR4: Role-based system prompt to constrain AI behavior
      } = {}
    ): Promise<{
      stream: ReadableStreamDefaultReader<Uint8Array>;
      abort: () => void;
    }> => {
      const token = localStorage.getItem('auth-storage')
        ? JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token
        : null;

      const controller = new AbortController();

      return fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          userPrompt,
          conversationHistory,
          useWebSearch: options.useWebSearch || false,
          autoDetectSearch: options.autoDetectSearch || false,
          systemPrompt: options.systemPrompt || undefined,  // MR4: Role constraint
        }),
        signal: controller.signal,
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (!response.body) {
          throw new Error('No response body');
        }
        return {
          stream: response.body.getReader(),
          abort: () => controller.abort(),
        };
      });
    },

    // Get available models
    getModels: () => api.get('/ai/models'),

    // Health check
    healthCheck: () => api.post('/ai/health', {}),

    // MR1: Task Decomposition (30s timeout - fallback to local if slow)
    decompose: (task: string, strategy: string = 'sequential') =>
      api.post('/ai/mr/decompose', { task, strategy }, { timeout: 30000 }),

    // MR2: Response Insights (30s timeout)
    analyzeResponse: (userPrompt: string, aiResponse: string) =>
      api.post('/ai/mr/insights', { userPrompt, aiResponse }, { timeout: 30000 }),

    // MR5: Generate Variants (60s - generates multiple responses)
    generateVariants: (prompt: string, count: number = 3) =>
      api.post('/ai/mr/variants', { prompt, count }, { timeout: 60000 }),

    // MR7: Failure Analysis (60s - GPT analysis)
    analyzeFailure: (task: string, issue: string, originalPrompt?: string, previousFailures?: any[]) =>
      api.post('/ai/mr/failure-analysis', { task, issue, originalPrompt, previousFailures }, { timeout: 60000 }),

    // MR12: Critical Analysis (60s - GPT analysis)
    criticalAnalysis: (content: string, taskType: string = 'general') =>
      api.post('/ai/mr/critical-analysis', { content, taskType }, { timeout: 60000 }),

    // MR13: Uncertainty Analysis (60s - GPT analysis)
    analyzeUncertainty: (content: string) =>
      api.post('/ai/mr/uncertainty', { content }, { timeout: 60000 }),

    // MR14: Generate Reflection (60s - GPT analysis)
    generateReflection: (messages: any[], sessionContext?: string) =>
      api.post('/ai/mr/reflection', { messages, sessionContext }, { timeout: 60000 }),

    // MR15: Recommend Strategy (60s - GPT analysis)
    recommendStrategy: (taskType: string, taskDescription?: string, userLevel?: string) =>
      api.post('/ai/mr/strategy', { taskType, taskDescription, userLevel }, { timeout: 60000 }),

    // NEW: Batch Variants with Temperature & Style (MR5) - 90s for multiple generations
    batchVariants: (
      userPrompt: string,
      conversationHistory: any[] = [],
      variants: Array<{
        temperature?: number;
        style?: string;
        maxTokens?: number;
      }> = []
    ) =>
      api.post('/ai/batch-variants', { userPrompt, conversationHistory, variants }, { timeout: 90000 }),

    // NEW: Multi-Model Comparison (MR6) - 90s for multiple model calls
    multiModel: (
      userPrompt: string,
      conversationHistory: any[] = [],
      models: string[] = []
    ) =>
      api.post('/ai/multi-model', { userPrompt, conversationHistory, models }, { timeout: 90000 }),
  },

  /**
   * Message Branches endpoints - Conversation branching for MR6/MR5
   */
  branches: {
    // Create a new branch for an interaction
    create: (interactionId: string, branchContent: string, source: 'mr6' | 'mr5' | 'manual', model?: string) =>
      api.post('/branches', { interactionId, branchContent, source, model }),

    // Get all branches for an interaction
    getByInteraction: (interactionId: string) =>
      api.get(`/branches/interaction/${interactionId}`),

    // Update a branch (verify, modify, set as main)
    update: (branchId: string, data: { wasVerified?: boolean; wasModified?: boolean; isMain?: boolean; content?: string }) =>
      api.patch(`/branches/${branchId}`, data),

    // Delete a branch
    delete: (branchId: string) =>
      api.delete(`/branches/${branchId}`),
  },

  /**
   * MR1 Task Decomposition History endpoints
   */
  decompositions: {
    // Get user's decomposition history
    list: (params?: { sessionId?: string; limit?: number; offset?: number }) =>
      api.get('/decompositions', { params }),

    // Get a specific decomposition
    get: (id: string) =>
      api.get(`/decompositions/${id}`),

    // Save a new decomposition
    create: (data: {
      sessionId?: string;
      originalTask: string;
      strategy: string;
      dimensions?: any[];
      subtasks: any[];
      scaffoldLevel?: string;
      totalEstimatedTime?: number;
      wasCompleted?: boolean;
    }) =>
      api.post('/decompositions', data),

    // Delete a decomposition
    delete: (id: string) =>
      api.delete(`/decompositions/${id}`),
  },

  /**
   * MR History endpoints - Unified history for all MR tools
   */
  mrHistory: {
    // ============ MR7: Failure Learning ============
    mr7: {
      list: (params?: { sessionId?: string; limit?: number; offset?: number }) =>
        api.get('/mr-history/mr7', { params }),

      create: (data: {
        sessionId?: string;
        taskDescription: string;
        attemptNumber?: number;
        rejectionReason?: string;
        userFeedback?: string;
        lessonsLearned: string;
        keyTakeaways?: string[];
        nextTimeStrategy?: string;
        failurePatterns?: Array<{ pattern: string; preventionTip: string }>;
        learningInsights?: string[];
        recoveryStrategies?: string[];
        rating?: 'valuable' | 'somewhat' | 'not_useful';
      }) => api.post('/mr-history/mr7', data),
    },

    // ============ MR11: Verification ============
    mr11: {
      list: (params?: { sessionId?: string; contentType?: string; limit?: number; offset?: number }) =>
        api.get('/mr-history/mr11', { params }),

      create: (data: {
        sessionId?: string;
        messageId?: string;
        contentType: 'code' | 'math' | 'citation' | 'fact' | 'text';
        contentText?: string;
        verificationMethod: string;
        toolUsed?: string;
        verificationStatus: 'error-found' | 'verified' | 'partially-verified' | 'unverified';
        confidenceScore?: number;
        findings?: string[];
        discrepancies?: string[];
        suggestions?: string[];
        userDecision: 'accept' | 'modify' | 'reject' | 'skip';
        userNotes?: string;
      }) => api.post('/mr-history/mr11', data),
    },

    // ============ MR5: Low-Cost Iteration ============
    mr5: {
      // Branches
      listBranches: (params?: { sessionId?: string; limit?: number; offset?: number }) =>
        api.get('/mr-history/mr5/branches', { params }),

      createBranch: (data: {
        sessionId?: string;
        branchName: string;
        parentBranchId?: string;
        parentMessageIndex?: number;
        conversationHistory: Array<{ role: string; content: string; timestamp?: string }>;
        nextPrompt?: string;
        rating?: number;
      }) => api.post('/mr-history/mr5/branches', data),

      updateBranch: (branchId: string, data: {
        branchName?: string;
        conversationHistory?: Array<{ role: string; content: string; timestamp?: string }>;
        nextPrompt?: string;
        rating?: number;
      }) => api.put(`/mr-history/mr5/branches/${branchId}`, data),

      // Variants
      listVariants: (params?: { sessionId?: string; branchId?: string; limit?: number; offset?: number }) =>
        api.get('/mr-history/mr5/variants', { params }),

      createVariant: (data: {
        sessionId?: string;
        branchId?: string;
        prompt: string;
        content: string;
        temperature?: number;
        style?: string;
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
        rating?: 'good' | 'okay' | 'poor';
        wasSelected?: boolean;
      }) => api.post('/mr-history/mr5/variants', data),
    },

    // ============ MR14: Guided Reflection ============
    mr14: {
      list: (params?: { sessionId?: string; limit?: number; offset?: number }) =>
        api.get('/mr-history/mr14', { params }),

      create: (data: {
        sessionId?: string;
        conversationSummary?: string;
        immediateReflections?: Record<string, string>;
        structuredReflections?: Record<string, string>;
        metacognitiveReflections?: Record<string, string>;
        depthLevel?: 'surface' | 'moderate' | 'deep';
        depthScore?: number;
        depthFeedback?: string;
        completedStages?: string[];
        isComplete?: boolean;
      }) => api.post('/mr-history/mr14', data),
    },

    // ============ MR6: Cross-Model Comparison ============
    mr6: {
      list: (params?: { sessionId?: string; limit?: number; offset?: number }) =>
        api.get('/mr-history/mr6', { params }),

      create: (data: {
        sessionId?: string;
        prompt: string;
        modelResponses: Array<{
          model: string;
          content: string;
          responseTime?: number;
          tokens?: number;
        }>;
        preferredModel?: string;
        preferenceReason?: string;
        comparisonNotes?: string;
      }) => api.post('/mr-history/mr6', data),
    },

    // ============ MR12: Critical Thinking ============
    mr12: {
      list: (params?: { sessionId?: string; limit?: number; offset?: number }) =>
        api.get('/mr-history/mr12', { params }),

      create: (data: {
        sessionId?: string;
        contentToEvaluate: string;
        contentSource?: string;
        evaluationCriteria: Array<{
          criterion: string;
          score: number;
          notes?: string;
        }>;
        overallScore?: number;
        strengths?: string[];
        weaknesses?: string[];
        recommendations?: string[];
        userAssessment?: string;
        agreedWithAi?: boolean;
      }) => api.post('/mr-history/mr12', data),
    },

    // ============ Aggregated Stats ============
    getStats: () => api.get('/mr-history/stats'),
  },
};

export default api;
