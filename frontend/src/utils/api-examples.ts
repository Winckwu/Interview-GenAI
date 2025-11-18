/**
 * API Examples for Interview-GenAI
 * Shows how to interact with all API endpoints
 */

import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

/**
 * Register a new user
 */
export const registerUser = async (email: string, username: string, password: string, userType: string) => {
  const response = await api.post('/auth/register', {
    email,
    username,
    password,
    userType,
  });
  return response.data;
};

/**
 * Login user
 */
export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

/**
 * Verify JWT token
 */
export const verifyToken = async (token: string) => {
  const response = await api.get('/auth/verify', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Logout user
 */
export const logoutUser = async (token: string) => {
  const response = await api.post(
    '/auth/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// ============================================
// AI CHAT ENDPOINTS
// ============================================

/**
 * Send message to AI and get response
 */
export const sendMessageToAI = async (
  userPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  token: string
) => {
  const response = await api.post(
    '/ai/chat',
    {
      userPrompt,
      conversationHistory,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Get available AI models and pricing
 */
export const getAvailableModels = async () => {
  const response = await api.get('/ai/models');
  return response.data;
};

/**
 * Check if OpenAI API is accessible
 */
export const checkAIHealth = async (token: string) => {
  const response = await api.post(
    '/ai/health',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// ============================================
// CHAT SESSION ENDPOINTS
// ============================================

/**
 * Get all sessions for current user
 */
export const getSessions = async (token: string) => {
  const response = await api.get('/sessions', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Create a new chat session
 */
export const createSession = async (title: string, description: string, token: string) => {
  const response = await api.post(
    '/sessions',
    {
      title,
      description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Get session details
 */
export const getSessionDetails = async (sessionId: string, token: string) => {
  const response = await api.get(`/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Update session
 */
export const updateSession = async (sessionId: string, title: string, description: string, token: string) => {
  const response = await api.put(
    `/sessions/${sessionId}`,
    {
      title,
      description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Delete session
 */
export const deleteSession = async (sessionId: string, token: string) => {
  const response = await api.delete(`/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ============================================
// PATTERN ENDPOINTS
// ============================================

/**
 * Get patterns for current user
 */
export const getPatterns = async (token: string) => {
  const response = await api.get('/patterns', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Create a new pattern
 */
export const createPattern = async (patternData: any, token: string) => {
  const response = await api.post('/patterns', patternData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ============================================
// PREDICTION ENDPOINTS
// ============================================

/**
 * Get predictions for current user
 */
export const getPredictions = async (token: string) => {
  const response = await api.get('/predictions', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Create a new prediction
 */
export const createPrediction = async (predictionData: any, token: string) => {
  const response = await api.post('/predictions', predictionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ============================================
// EVOLUTION TRACKING ENDPOINTS
// ============================================

/**
 * Get evolution data for current user
 */
export const getEvolutions = async (token: string) => {
  const response = await api.get('/evolution', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Track user evolution
 */
export const trackEvolution = async (evolutionData: any, token: string) => {
  const response = await api.post('/evolution/track', evolutionData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * Get user analytics
 */
export const getAnalytics = async (token: string) => {
  const response = await api.get('/analytics/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get system health status
 */
export const getSystemHealth = async () => {
  try {
    const response = await api.get('/analytics/health');
    return response.data;
  } catch (error) {
    return { success: false, error: 'System health check failed' };
  }
};

// ============================================
// ERROR HANDLING
// ============================================

export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    return {
      status: error.response.status,
      message: error.response.data?.error || 'An error occurred',
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 0,
      message: 'No response from server. Is the backend running?',
    };
  } else {
    // Error in request setup
    return {
      status: 0,
      message: error.message,
    };
  }
};

export default api;
