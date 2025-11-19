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

/**
 * Chat message in a conversation
 */
export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;
}

/**
 * User signals for pattern detection
 */
export interface UserSignals {
  totalInteractions: number;
  verificationCount: number;
  modificationCount: number;
  rejectionCount: number;
  avgInputLength: number;
  avgAcceptanceTime: number;
  inputOutputRatio: number;
  lastVerificationTime?: number;
}

/**
 * Pattern F detection result
 */
export interface PatternFDetectionResult {
  detected: boolean;
  confidence: number;
  triggeredRules: string[];
  recommendedTier: 'none' | 'soft' | 'medium' | 'hard';
  severity: 'low' | 'medium' | 'high';
}

/**
 * User intervention history for fatigue tracking
 */
export interface UserInterventionHistory {
  dismissalCount: number;
  lastDismissalTime?: number;
  lastEngagementTime?: number;
  cumulativeExposureMs: number;
  actionLog: Array<{
    timestamp: number;
    action: 'dismiss' | 'skip' | 'acted' | 'override';
    mrType: string;
  }>;
}

/**
 * Intervention suppression state
 */
export interface InterventionSuppressionState {
  suppressedMRTypes: Set<string>;
  suppressionExpiryTimes: Record<string, number>;
  lastSuppressionTime?: number;
}

/**
 * Pending intervention to display
 */
export interface PendingIntervention {
  id: string;
  mrType: string;
  tier: 'soft' | 'medium' | 'hard';
  confidence: number;
  message: string;
  title?: string;
  description?: string;
  icon?: string;
  triggeredRules?: string[];
}

/**
 * Compliance metrics for a session
 */
export interface ComplianceMetrics {
  sessionId: string;
  displayCount: number;
  dismissalCount: number;
  engagementCount: number;
  complianceRate: number;
  overrideRate: number;
  avgTimeToCompliance: number;
  lastUpdated: number;
}
