/**
 * Core Type Definitions for Interview-GenAI
 */

/**
 * User interaction with AI (message exchange)
 */
export interface Interaction {
  id: string;
  sessionId: string;
  userInput?: string;
  aiResponse?: string;
  timestamp: string;  // ISO8601 format
  createdAt: string;  // ISO8601 format

  // Quality assessment flags
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;
  confidenceScore?: number;
}

/**
 * Chat session
 */
export interface ChatSession {
  id: string;
  userId: string;
  taskDescription: string;
  taskType: string;
  taskImportance: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isActive: boolean;
}

/**
 * Pattern detection result
 */
export interface PatternData {
  id: string;
  sessionId: string;
  patternType: string;
  confidence: number;
  metrics?: Record<string, any>;
  detectedAt: string;
}

/**
 * User authentication state
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  preferences?: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  darkMode?: boolean;
  notificationsEnabled?: boolean;
  language?: string;
}
