/**
 * useGlobalRecommendations Hook
 *
 * Manages the Global MR Recommendation System:
 * - Analyzes user behavior patterns (over-reliant, cautious, balanced, experimental)
 * - Determines session phase (starting, active, iterating, completing)
 * - Generates context-aware MR tool chain recommendations
 * - Tracks which MR tools have been used
 * - Provides recommendations based on task criticality and user experience level
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 1 refactoring.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  generateMRRecommendations,
  analyzeBehaviorPattern,
  determineSessionPhase,
  generateWelcomeMessage,
  getChainCompletionStatus,
  type UserContext,
  type MRRecommendationSet,
  type UserExperienceLevel,
  type BehaviorPattern,
  type SessionPhase,
} from '../utils/GlobalMRRecommendationEngine';

// ============================================================
// TYPES
// ============================================================

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;
}

export interface SessionData {
  id: string;
  taskType?: string;
  taskImportance?: 1 | 2 | 3; // 1=low, 2=medium, 3=high
  [key: string]: any;
}

export type InterventionLevel = 'passive' | 'suggestive' | 'proactive';

export interface UseGlobalRecommendationsOptions {
  sessionData: SessionData | null;
  messages: Message[];
  userId?: string;
  experienceLevel?: UserExperienceLevel;
  consecutiveUnverified?: number;
  usedMRTools?: string[];
  /** MR3 intervention level - controls recommendation visibility */
  interventionLevel?: InterventionLevel;
}

export interface UseGlobalRecommendationsReturn {
  // State
  recommendations: MRRecommendationSet[];
  showRecommendationPanel: boolean;
  expandedRecommendation: string | null;
  behaviorPattern: BehaviorPattern;
  sessionPhase: SessionPhase;
  welcomeMessage: string;

  // Setters
  setShowRecommendationPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setExpandedRecommendation: React.Dispatch<React.SetStateAction<string | null>>;

  // Actions
  activateRecommendation: (recommendationId: string, onToolOpen: (toolId: string) => void) => void;
  dismissRecommendation: (recommendationId: string) => void;
  refreshRecommendations: () => void;

  // Computed values
  verifiedCount: number;
  modifiedCount: number;
  userContext: UserContext | null;
}

// ============================================================
// HOOK
// ============================================================

export function useGlobalRecommendations(
  options: UseGlobalRecommendationsOptions
): UseGlobalRecommendationsReturn {
  const {
    sessionData,
    messages,
    userId,
    experienceLevel = 'intermediate',
    consecutiveUnverified = 0,
    usedMRTools = [],
    interventionLevel = 'suggestive',
  } = options;

  // State
  const [recommendations, setRecommendations] = useState<MRRecommendationSet[]>([]);
  const [showRecommendationPanel, setShowRecommendationPanel] = useState<boolean>(true);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());

  // Computed values
  const verifiedCount = messages.filter(m => m.role === 'ai' && m.wasVerified).length;
  const modifiedCount = messages.filter(m => m.role === 'ai' && m.wasModified).length;

  /**
   * Build user context for recommendation engine
   */
  const buildUserContext = useCallback((): UserContext | null => {
    if (!sessionData) return null;

    const taskCriticality =
      sessionData.taskImportance === 3 ? 'high' :
      sessionData.taskImportance === 2 ? 'medium' : 'low';

    const baseContext: UserContext = {
      userId,
      experienceLevel,
      taskType: sessionData.taskType || 'general',
      taskCriticality,
      sessionPhase: 'active',
      messageCount: messages.length,
      verifiedCount,
      modifiedCount,
      consecutiveUnverified,
      hasUsedMRTools: usedMRTools,
    };

    // Determine session phase
    const sessionPhase = determineSessionPhase(baseContext);
    baseContext.sessionPhase = sessionPhase;

    // Analyze behavior pattern
    const behaviorPattern = analyzeBehaviorPattern(baseContext);
    baseContext.behaviorPattern = behaviorPattern;

    return baseContext;
  }, [sessionData, messages, userId, experienceLevel, verifiedCount, modifiedCount, consecutiveUnverified, usedMRTools]);

  /**
   * Generate recommendations based on current context
   * Respects MR3 intervention level:
   * - passive: No automatic recommendations (user must request)
   * - suggestive: Show recommendations normally (default)
   * - proactive: Show recommendations more prominently
   */
  const refreshRecommendations = useCallback(() => {
    // In passive mode, don't show automatic recommendations
    if (interventionLevel === 'passive') {
      setRecommendations([]);
      return;
    }

    const userContext = buildUserContext();
    if (!userContext) {
      setRecommendations([]);
      return;
    }

    // Generate recommendations
    const allRecommendations = generateMRRecommendations(userContext);

    // Filter out dismissed recommendations
    let activeRecommendations = allRecommendations.filter(
      rec => !dismissedRecommendations.has(rec.id)
    );

    // In proactive mode, show more recommendations (don't limit)
    // In suggestive mode, limit to top 3
    if (interventionLevel === 'suggestive') {
      activeRecommendations = activeRecommendations.slice(0, 3);
    }

    setRecommendations(activeRecommendations);
  }, [buildUserContext, dismissedRecommendations, interventionLevel]);

  /**
   * Auto-generate recommendations when context changes
   */
  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  /**
   * Activate a recommendation (opens its tool chain)
   */
  const activateRecommendation = useCallback((
    recommendationId: string,
    onToolOpen: (toolId: string) => void
  ) => {
    const recommendation = recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    // Open the first tool in the chain
    if (recommendation.tools.length > 0) {
      onToolOpen(recommendation.tools[0]);
    }

    // Mark as expanded
    setExpandedRecommendation(recommendationId);
  }, [recommendations]);

  /**
   * Dismiss a recommendation
   */
  const dismissRecommendation = useCallback((recommendationId: string) => {
    setDismissedRecommendations(prev => new Set([...prev, recommendationId]));
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId));

    // Clear expansion if this was expanded
    setExpandedRecommendation(prev => prev === recommendationId ? null : prev);
  }, []);

  // Derive computed values
  const userContext = buildUserContext();
  const behaviorPattern = userContext?.behaviorPattern || 'balanced';
  const sessionPhase = userContext?.sessionPhase || 'starting';
  const welcomeMessage = userContext ? generateWelcomeMessage(userContext) : '';

  return {
    // State
    recommendations,
    showRecommendationPanel,
    expandedRecommendation,
    behaviorPattern,
    sessionPhase,
    welcomeMessage,

    // Setters
    setShowRecommendationPanel,
    setExpandedRecommendation,

    // Actions
    activateRecommendation,
    dismissRecommendation,
    refreshRecommendations,

    // Computed values
    verifiedCount,
    modifiedCount,
    userContext,
  };
}

export default useGlobalRecommendations;
