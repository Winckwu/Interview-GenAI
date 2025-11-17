/**
 * TypeScript Type Definitions
 * Core types used throughout the backend
 */

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  userType: 'efficient' | 'struggling' | 'hybrid' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  id: string;
  email: string;
  username: string;
  userType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  userType: string;
}

// Pattern Types
export interface Pattern {
  id: string;
  userId: string;
  patternType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence: number;
  aiRelianceScore: number;
  verificationScore: number;
  contextSwitchingFrequency: number;
  metrics: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// Prediction Types
export interface Prediction {
  id: string;
  userId: string;
  taskId: string;
  predictedPattern: string;
  actualPattern: string | null;
  confidence: number;
  feedback: 'accurate' | 'inaccurate' | 'partially_accurate' | null;
  isCorrect: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

// Evolution Types
export interface Evolution {
  id: string;
  userId: string;
  timePoint: string;
  fromPattern: string;
  toPattern: string;
  changeType: 'improvement' | 'migration' | 'oscillation' | 'regression';
  metrics: Record<string, number>;
  createdAt: Date;
}

// Intervention Types
export interface Intervention {
  id: string;
  userId: string;
  strategy: 'baseline' | 'aggressive' | 'adaptive';
  successRate: number;
  satisfactionRating: number;
  metricsSnapshot: Record<string, number>;
  createdAt: Date;
}

// Feedback Types
export interface Feedback {
  id: string;
  predictionId: string;
  userId: string;
  feedback: 'accurate' | 'inaccurate' | 'partially_accurate';
  isCorrect: boolean;
  notes: string | null;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Analytics Types
export interface UserMetrics {
  userId: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentPattern: string;
  evolutionCount: number;
  lastActivity: Date;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPredictions: number;
  averageAccuracy: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  uptime: string;
  avgResponseTime: number;
}

// Export all types
export type * from './index';
