import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import { useAssessmentStore } from '../stores/assessmentStore';
import { useMCAOrchestrator, ActiveMR } from '../components/chat/MCAConversationOrchestrator';
// import VirtualizedMessageList from '../components/VirtualizedMessageList';
// DISABLED: react-window compatibility issue - using simple list instead
import EmptyState, { EmptyStateError } from '../components/EmptyState';
import { SkeletonText, SkeletonCard } from '../components/Skeleton';
import { useMetricsStore } from '../stores/metricsStore';
import MarkdownText from '../components/common/MarkdownText';
import {
  orchestrateMRActivation,
  calculateMessageTrustScore,
  getTrustLevel,
  type OrchestrationResult,
  type OrchestrationContext,
} from '../utils/MROrchestrator';
import {
  type UserContext,
  type MRRecommendationSet,
  type UserExperienceLevel,
} from '../utils/GlobalMRRecommendationEngine';
import {
  predictPatternFromAssessment,
  getPatternProfile,
  getEffectivePattern,
  analyzeCapabilityVsBehaviorGap,
  type DimensionScores,
  type BehavioralPattern,
} from '../utils/metacognitiveTypeSystem';

// Phase 1 Refactoring: Custom Hooks
import { useMessages, type Message, MESSAGES_PER_PAGE } from '../hooks/useMessages';
import { useMRTools, type ActiveMRTool } from '../hooks/useMRTools';
import { useGlobalRecommendations } from '../hooks/useGlobalRecommendations';
import { useAnalytics } from '../hooks/useAnalytics';

// Phase 2 Refactoring: Message Components
import MessageList from '../components/MessageList';
import { type TrustBadge, type MRRecommendation } from '../components/TrustIndicator';
import { type ReflectionResponse } from '../components/QuickReflection';

// Phase 3 Refactoring: Panel Components
import SessionSidebar, { type SessionItem } from '../components/SessionSidebar';
import MRToolsPanel from '../components/MRToolsPanel';
import GlobalRecommendationPanel from '../components/GlobalRecommendationPanel';
import OnboardingTour from '../components/OnboardingTour';
import { detectTaskType, type TaskType } from '../components/mr/MR8TaskCharacteristicRecognition/utils';

// OPTIMIZATION: Lazy-load heavy components to reduce ChatSessionPage bundle size
// These components are only needed when specific features are active
const PatternAnalysisWindow = lazy(() => import('../components/chat/PatternAnalysisWindow'));
const MRDisplay = lazy(() =>
  import('../components/chat/MCAConversationOrchestrator').then((module) => ({
    default: module.MRDisplay,
  }))
);

// MR Components - Lazy loaded for performance
// All MR components use export default, so we use simplified lazy imports
const MR1TaskDecompositionScaffold = lazy(() => import('../components/mr/MR1TaskDecompositionScaffold'));
const MR2ProcessTransparency = lazy(() => import('../components/mr/MR2ProcessTransparency'));
const MR3HumanAgencyControl = lazy(() => import('../components/mr/MR3HumanAgencyControl'));
const MR4RoleDefinitionGuidance = lazy(() => import('../components/mr/MR4RoleDefinitionGuidance'));
const MR5LowCostIteration = lazy(() => import('../components/mr/MR5LowCostIteration'));
const MR6CrossModelExperimentation = lazy(() => import('../components/mr/MR6CrossModelExperimentation'));
const MR7FailureToleranceLearning = lazy(() => import('../components/mr/MR7FailureToleranceLearning'));
const MR8TaskCharacteristicRecognition = lazy(() => import('../components/mr/MR8TaskCharacteristicRecognition'));
const MR9DynamicTrustCalibration = lazy(() => import('../components/mr/MR9DynamicTrustCalibration'));
const MR10CostBenefitAnalysis = lazy(() => import('../components/mr/MR10CostBenefitAnalysis'));
const MR11IntegratedVerification = lazy(() => import('../components/mr/MR11IntegratedVerification'));
const MR12CriticalThinkingScaffolding = lazy(() => import('../components/mr/MR12CriticalThinkingScaffolding'));
const MR13TransparentUncertainty = lazy(() => import('../components/mr/MR13TransparentUncertainty'));
const MR14GuidedReflectionMechanism = lazy(() => import('../components/mr/MR14GuidedReflectionMechanism'));
const MR15MetacognitiveStrategyGuide = lazy(() => import('../components/mr/MR15MetacognitiveStrategyGuide'));
const MR16SkillAtrophyPrevention = lazy(() => import('../components/mr/MR16SkillAtrophyPrevention'));
const MR17LearningProcessVisualization = lazy(() => import('../components/mr/MR17LearningProcessVisualization'));
const MR18OverRelianceWarning = lazy(() => import('../components/mr/MR18OverRelianceWarning'));
const MR19MetacognitiveCapabilityAssessment = lazy(() => import('../components/mr/MR19MetacognitiveCapabilityAssessment'));

/**
 * OPTIMIZATION: Fallback component for lazy-loaded heavy components
 * Minimal placeholder while components load
 */
const ComponentLoader: React.FC = () => (
  <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
    Loading component...
  </div>
);

// Message interface now imported from useMessages hook

interface PatternResult {
  pattern: string;
  confidence: number;
  stability?: number;            // 0-1: Pattern stability over time
  streakLength?: number;         // Consecutive turns with same pattern
  trendDirection?: 'converging' | 'diverging' | 'oscillating' | 'stable';
  reasoning: string[];
}

interface SessionItem {
  id: string;
  taskDescription: string;
  taskType: string;
  createdAt: string;
  startedAt: string;
  endedAt?: string;
}

/**
 * Convert string task importance to integer value
 * Maps user-friendly strings to database integer values
 */
const getTaskImportanceValue = (importance: string): number => {
  const importanceMap: { [key: string]: number } = {
    'low': 1,
    'medium': 3,
    'high': 5,
  };
  return importanceMap[importance.toLowerCase()] || 3; // Default to medium (3)
};

/**
 * PERFORMANCE OPTIMIZATION: Utility function to batch load interactions for multiple sessions
 * Reduces N+1 queries: Instead of 1 + N calls, attempts batch endpoint first
 * Fallback to individual calls if batch endpoint unavailable
 */
const loadInteractionsForSessions = async (sessionIds: string[]): Promise<Record<string, any[]>> => {
  try {
    // Try batch endpoint first (if backend supports it)
    console.log(`[loadInteractionsForSessions] Attempting batch load for ${sessionIds.length} sessions`);
    const response = await api.post('/interactions/batch', { sessionIds });
    if (response.data.data && response.data.data.interactions) {
      // Backend returns map of sessionId -> interactions
      console.log('[loadInteractionsForSessions] Batch endpoint succeeded');
      return response.data.data.interactions;
    }
  } catch (err: any) {
    // Batch endpoint not available, fall back to sequential individual calls
    console.warn(`[loadInteractionsForSessions] Batch endpoint failed (${err.status || 'unknown error'}), using sequential fallback`);
  }

  // Fallback: Load interactions sequentially (not in parallel) to reduce server load
  // Limit to 5 concurrent requests maximum using a queue-like approach
  const CONCURRENT_LIMIT = 5;
  const interactionsMap: Record<string, any[]> = {};

  for (let i = 0; i < sessionIds.length; i += CONCURRENT_LIMIT) {
    const batch = sessionIds.slice(i, i + CONCURRENT_LIMIT);
    console.log(`[loadInteractionsForSessions] Loading batch ${Math.floor(i / CONCURRENT_LIMIT) + 1} with ${batch.length} sessions`);

    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const res = await api.get('/interactions', { params: { sessionId: id } });
          const interactions = res.data.data.interactions || [];
          console.log(`[loadInteractionsForSessions] Session ${id}: loaded ${interactions.length} interactions`);
          return [id, interactions];
        } catch (err: any) {
          console.error(`[loadInteractionsForSessions] Failed to load interactions for session ${id}:`, err.message);
          return [id, []];
        }
      })
    );

    // Add to map
    results.forEach(([id, interactions]) => {
      interactionsMap[id] = interactions;
    });
  }

  console.log(`[loadInteractionsForSessions] Completed loading all ${sessionIds.length} sessions`);
  return interactionsMap;
};

/**
 * PERFORMANCE OPTIMIZATION: Batch update interactions
 * Reduces individual PATCH calls to single batch call
 * Updates multiple messages (verified, modified status) in one request
 */
const batchUpdateInteractions = async (
  updates: Array<{ id: string; wasVerified?: boolean; wasModified?: boolean; wasRejected?: boolean }>
): Promise<any> => {
  try {
    // Try batch update endpoint
    return await api.patch('/interactions/batch', { updates });
  } catch (err) {
    // Fallback: Sequential individual updates
    console.warn('Batch update endpoint not available, using individual updates');
    const results = await Promise.all(
      updates.map((update) =>
        api.patch(`/interactions/${update.id}`, {
          wasVerified: update.wasVerified,
          wasModified: update.wasModified,
          wasRejected: update.wasRejected,
        })
      )
    );
    return { data: { data: results } };
  }
};

/**
 * PERFORMANCE OPTIMIZATION: Debounce function to prevent rapid repeated calls
 * Used for pattern detection and other heavy operations
 */
const createDebounce = <T extends (...args: any[]) => Promise<any>>(func: T, delay: number = 2000) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let isExecuting = false;

  return async (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    if (isExecuting) return;

    timeoutId = setTimeout(async () => {
      isExecuting = true;
      try {
        await func(...args);
      } finally {
        isExecuting = false;
      }
    }, delay);
  };
};

/**
 * Task type labels for display (English)
 */
const TASK_TYPE_LABELS: Record<TaskType, { icon: string; label: string }> = {
  coding: { icon: '💻', label: 'Coding' },
  writing: { icon: '✍️', label: 'Writing' },
  analysis: { icon: '📊', label: 'Analysis' },
  creative: { icon: '🎨', label: 'Creative' },
  research: { icon: '🔍', label: 'Research' },
  design: { icon: '🎯', label: 'Design' },
  planning: { icon: '📋', label: 'Planning' },
  review: { icon: '📝', label: 'Review' },
};

/**
 * Chat Session Page - Improved UI with Session Sidebar
 * Main interface for user-AI interaction with pattern tracking and session history
 */
const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { addInteraction, deleteSession: deleteSessionFromStore } = useSessionStore();
  const { setSidebarOpen } = useUIStore();
  const { latestAssessment, fetchLatestAssessment } = useAssessmentStore();
  const metricsStore = useMetricsStore();
  const [sessionStartTime] = useState(Date.now());
  const [showPersonalizedTips, setShowPersonalizedTips] = useState(true);

  // ========================================================
  // PHASE 1 REFACTORING: Custom Hooks Integration
  // ========================================================

  // Session metadata (needed by hooks)
  const [sessionData, setSessionData] = useState<any>(null);

  // Hook 1: Messages Management
  const messagesHook = useMessages({
    sessionId: sessionId || '',
    onSendSuccess: (interaction) => {
      // Track message send in metrics
      metricsStore.trackInteraction('send');
    },
    onVerifySuccess: () => {
      // Reset consecutive unverified counter
      setConsecutiveNoVerify(0);
    },
    onModifySuccess: () => {
      setShowModifiedChoiceUI(true);
      setTimeout(() => setShowModifiedChoiceUI(false), 10000);
    },
    onError: (errorMsg) => {
      console.error('Messages hook error:', errorMsg);
    },
  });

  // Hook 2: MR Tools Management
  const mrToolsHook = useMRTools({
    onToolOpened: (toolId) => {
      // Track MR tool usage in metrics
      metricsStore.trackInteraction('mr_tool_open');
    },
    onSuccessMessage: (msg) => {
      // Show success messages from MR tool operations
      messagesHook.setSuccessMessage(msg);
    },
  });

  // Hook 3: Global Recommendations
  const recommendationsHook = useGlobalRecommendations({
    sessionData,
    messages: messagesHook.messages,
    userId: user?.id,
    experienceLevel: 'intermediate',
    consecutiveUnverified: 0, // Will be tracked separately
    usedMRTools: mrToolsHook.usedMRTools,
  });

  // Hook 4: Analytics data for behavioral pattern
  const { analytics } = useAnalytics(7); // Last 7 days

  // Compute effective behavioral pattern for chat header
  const effectivePatternData = React.useMemo(() => {
    if (!latestAssessment?.responses?.dimensions) {
      return null;
    }

    const assessmentScores: DimensionScores = {
      planning: latestAssessment.responses.dimensions.planning?.score || 0,
      monitoring: latestAssessment.responses.dimensions.monitoring?.score || 0,
      evaluation: latestAssessment.responses.dimensions.evaluation?.score || 0,
      regulation: latestAssessment.responses.dimensions.regulation?.score || 0,
    };

    const detectedPattern = (analytics?.dominantPattern as BehavioralPattern) || null;
    const totalSessions = analytics?.totalSessions || 0;

    return getEffectivePattern(assessmentScores, detectedPattern, totalSessions);
  }, [latestAssessment, analytics]);

  // Destructure hook returns for easy access
  const {
    messages,
    setMessages,
    loading,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    updatingMessageId,
    editingMessageId,
    editedContent,
    setEditedContent,
    currentPage,
    setCurrentPage,
    hasMoreMessages,
    setHasMoreMessages,
    isLoadingMore,
    setIsLoadingMore,
    totalMessagesCount,
    setTotalMessagesCount,
    handleSendMessage: sendMessage,
    markAsVerified,
    markAsModified: markAsModifiedBase,
    startEditingMessage,
    saveEditedMessage,
    cancelEditingMessage,
    loadMessagesPage,
    loadMoreMessages,
  } = messagesHook;

  const {
    activeMRTool,
    setActiveMRTool,
    showMRToolsSection,
    setShowMRToolsSection,
    showMRToolsPanel,
    setShowMRToolsPanel,
    interventionLevel,
    setInterventionLevel,
    conversationBranches,
    setConversationBranches,
    verificationLogs,
    setVerificationLogs,
    usedMRTools,
    trackMRToolUsage,
    openMR1Decomposition,
    openMR2History,
    openMR3AgencyControl,
    openMR4RoleDefinition,
    openMR5Iteration,
    openMR6CrossModel,
    openMR7FailureLearning,
    openMR8TaskRecognition,
    openMR9TrustCalibration,
    openMR10CostBenefit,
    openMR11Verification,
    openMR12CriticalThinking,
    openMR13Uncertainty,
    openMR14Reflection,
    openMR15StrategyGuide,
    openMR16SkillAtrophy,
    openMR17LearningVisualization,
    openMR19CapabilityAssessment,
  } = mrToolsHook;

  const {
    recommendations: mrRecommendations,
    showRecommendationPanel,
    setShowRecommendationPanel,
    expandedRecommendation,
    setExpandedRecommendation,
    activateRecommendation,
    dismissRecommendation,
  } = recommendationsHook;

  // ========================================================
  // Remaining State (not yet extracted to hooks)
  // ========================================================

  const [userInput, setUserInput] = useState('');
  const [sessionActive, setSessionActive] = useState(true);
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [showPattern, setShowPattern] = useState(false);
  const [showPatternPanel, setShowPatternPanel] = useState(false);
  const [patternLoading, setPatternLoading] = useState(false);
  const [showModifiedChoiceUI, setShowModifiedChoiceUI] = useState(false);

  // Track quick reflections on messages (MR14)
  const [reflectedMessages, setReflectedMessages] = useState<Set<string>>(new Set());
  const [showQuickReflection, setShowQuickReflection] = useState<string | null>(null);

  // Track problem behavior detection (MR15)
  const [consecutiveNoVerify, setConsecutiveNoVerify] = useState(0);
  const [shortPromptCount, setShortPromptCount] = useState(0);

  // Track MR6 multi-model comparison suggestions
  const [comparisonSuggestedMessages, setComparisonSuggestedMessages] = useState<Set<string>>(new Set());
  const [showMR6Suggestion, setShowMR6Suggestion] = useState<string | null>(null);
  // MR6 context: Store the specific message context for comparison
  const [mr6Context, setMr6Context] = useState<{
    prompt: string;
    history: Array<{ role: 'user' | 'ai'; content: string }>;
    messageIndex: number;
  } | null>(null);

  // MR11 context: Track the message being verified
  const [verifyingMessageId, setVerifyingMessageId] = useState<string | null>(null);
  const [verifyingMessageContent, setVerifyingMessageContent] = useState<string>('');

  // Track MR9 Dynamic Orchestration - Trust-based MR activation
  const [messageTrustScores, setMessageTrustScores] = useState<Map<string, number>>(new Map());
  const [orchestrationResults, setOrchestrationResults] = useState<Map<string, any>>(new Map());
  const [showTrustIndicator, setShowTrustIndicator] = useState<boolean>(true);

  // Session sidebar states
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSidebarOpen, setSessionSidebarOpen] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [creatingNewSession, setCreatingNewSession] = useState(false);

  // AI-generated session title
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState<string | null>(null);
  const [titleGenerating, setTitleGenerating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  // MCA orchestration states - Use GPT for accurate signal detection and pre-generated MR content
  const { result: mcaResult, activeMRs } = useMCAOrchestrator(sessionId || '', messages, true, 'gpt');
  const [displayedModalMR, setDisplayedModalMR] = useState<ActiveMR | null>(null);
  const [dismissedMRs, setDismissedMRs] = useState<Set<string>>(new Set());

  // MR2 Transparency versions
  const [interactionVersions, setInteractionVersions] = useState<any[]>([]);

  // Virtualized list configuration
  const virtualizedListRef = useRef<any>(null);
  const MESSAGE_ROW_HEIGHT = 140; // Approximate height of each message row (px)
  const MESSAGES_CONTAINER_HEIGHT = 600; // Height of messages container (px)

  // OPTIMIZATION: Debounced pattern detection to reduce API calls
  // Reference to debounced function (will be initialized in useEffect)
  const debouncedDetectPatternRef = useRef<(() => Promise<void>) | null>(null);
  const patternCallCountRef = useRef<number>(0); // Track number of pattern detection calls

  // Initialize metrics for this session
  useEffect(() => {
    if (sessionId && user?.id) {
      metricsStore.setCurrentSession(sessionId, user.id);
    }
  }, [sessionId, user?.id]);

  // Fetch latest assessment for pattern display
  useEffect(() => {
    if (user?.id) {
      fetchLatestAssessment(user.id);
    }
  }, [user?.id, fetchLatestAssessment]);

  // Handle modal MRs display
  useEffect(() => {
    if (activeMRs && activeMRs.length > 0) {
      // Find first modal MR that hasn't been dismissed
      const modalMR = activeMRs.find(
        (mr) => mr.displayMode === 'modal' && !dismissedMRs.has(mr.mrId)
      );
      setDisplayedModalMR(modalMR || null);
    }
  }, [activeMRs, dismissedMRs]);

  // Clear MR6 context when switching away from MR6 tool
  useEffect(() => {
    if (activeMRTool !== 'mr6-models' && mr6Context !== null) {
      setMr6Context(null);
    }
  }, [activeMRTool, mr6Context]);

  // Load session list with valid interactions (OPTIMIZED: Batch loading to reduce N+1)
  const loadSessionsRef = useRef(false);
  useEffect(() => {
    // Prevent multiple calls (React StrictMode compatibility)
    if (loadSessionsRef.current) return;
    loadSessionsRef.current = true;

    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const response = await api.get('/sessions', { params: { limit: 50, offset: 0 } });
        if (response.data.data && response.data.data.sessions) {
          // Remove duplicate sessions by ID
          const uniqueSessions = Array.from(
            new Map(response.data.data.sessions.map((session: SessionItem) => [session.id, session])).values()
          ) as SessionItem[];

          // OPTIMIZATION: Use batch loading instead of individual calls
          // Before: 1 + N API calls (N+1 problem)
          // After: 1-2 API calls (batch endpoint + fallback)
          const sessionIds = uniqueSessions.map((s) => s.id);
          console.log(`[ChatSessionPage] Loading ${sessionIds.length} sessions`);
          const interactionsMap = await loadInteractionsForSessions(sessionIds);

          // Process sessions with their interactions
          const sessionsWithContent = uniqueSessions
            .map((session) => {
              const interactions = interactionsMap[session.id] || [];
              // Check if session has at least one interaction with user prompt
              const validInteractions = interactions.filter(
                (interaction: any) =>
                  interaction.userPrompt && interaction.userPrompt.trim()
              );

              if (validInteractions.length > 0) {
                console.log(`[loadSessions] Session ${session.id}: Has ${validInteractions.length} valid interactions - DISPLAYING`);
                // Use the first user prompt as the session title (truncate to 50 chars)
                const firstPrompt = validInteractions[0].userPrompt;
                const title = firstPrompt.length > 50 ? firstPrompt.substring(0, 50) + '...' : firstPrompt;
                return {
                  ...session,
                  taskDescription: title,
                };
              }
              // Also show sessions with taskDescription even if no interactions yet
              if (session.taskDescription && session.taskDescription !== 'General AI interaction') {
                console.log(`[loadSessions] Session ${session.id}: No interactions but has taskDescription - DISPLAYING`);
                return session;
              }
              console.log(`[loadSessions] Session ${session.id}: Has ${interactions.length} interactions but ${validInteractions.length} valid - FILTERING OUT`);
              return null;
            })
            .filter((s) => s !== null) as SessionItem[];

          // Sort by date descending (newest first)
          sessionsWithContent.sort(
            (a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime()
          );
          setSessions(sessionsWithContent);
        }
      } catch (err: any) {
        console.error('Failed to load sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Auto-close sidebar when route changes (e.g., clicking AI Chat navigation)
  useEffect(() => {
    setSessionSidebarOpen(false);
  }, [location.pathname]);

  // Fetch latest assessment for personalized tips
  useEffect(() => {
    if (user?.id) {
      fetchLatestAssessment(user.id);
    }
  }, [user?.id, fetchLatestAssessment]);

  // Load session data and previous interactions on mount
  useEffect(() => {
    if (!sessionId) {
      // Auto-create a new session if accessing /chat without sessionId
      const createAutoSession = async () => {
        try {
          const response = await api.post('/sessions', {
            taskDescription: 'General AI interaction',
            taskType: 'general',
            taskImportance: getTaskImportanceValue('medium'),
          });
          const newSessionId = response.data.data.session.id;
          navigate(`/session/${newSessionId}`, { replace: true });
        } catch (err) {
          console.error('Failed to create auto session:', err);
          navigate('/dashboard');
        }
      };
      createAutoSession();
      return;
    }

    // Auto-close sidebar when entering a chat session
    setSessionSidebarOpen(false);

    const loadSessionAndHistory = async () => {
      try {
        // Load session data
        const sessionResponse = await api.get(`/sessions/${sessionId}`);
        const session = sessionResponse.data.data.session;
        setSessionData(session);

        // Load saved title from session (if not default)
        if (session?.taskDescription && session.taskDescription !== 'General AI interaction') {
          setAiGeneratedTitle(session.taskDescription);
        } else {
          setAiGeneratedTitle(null);
        }

        // Reset pagination for new session
        setCurrentPage(1);
        setMessages([]);

        // Load previous interactions/messages from this session (with pagination)
        await loadMessagesPage(1);
      } catch (err: any) {
        console.error('Failed to load session:', err);
        setError(err.response?.data?.error || 'Failed to load session');
      }
    };

    /**
     * Load a page of messages with pagination
     * @param page - Page number to load (1-indexed)
     */
    const loadMessagesPage = async (page: number) => {
      const isInitialLoad = page === 1;
      try {
        if (!isInitialLoad) {
          setIsLoadingMore(true);
        }

        // Load with pagination parameters (convert page to offset)
        const offset = (page - 1) * MESSAGES_PER_PAGE;
        const interactionsResponse = await api.get('/interactions', {
          params: {
            sessionId,
            limit: MESSAGES_PER_PAGE,
            offset: offset,
          },
        });

        const responseData = interactionsResponse.data.data;
        const interactions = responseData.interactions || [];
        const total = responseData.total || 0;

        if (interactions && interactions.length > 0) {
          // Remove duplicate interactions by ID and filter valid interactions
          const uniqueInteractions = Array.from(
            new Map(
              interactions
                .filter((interaction: any) =>
                  interaction.id &&
                  interaction.userPrompt &&
                  interaction.aiResponse &&
                  interaction.sessionId === sessionId
                )
                .map((interaction: any) => [interaction.id, interaction])
            ).values()
          );

          // Convert interactions to messages
          const pageMessages: Message[] = [];
          for (const interaction of uniqueInteractions) {
            // Add user message
            pageMessages.push({
              id: `user-${interaction.id}`,
              role: 'user',
              content: interaction.userPrompt,
              timestamp: interaction.createdAt,
            });

            // Add AI message
            pageMessages.push({
              id: interaction.id,
              role: 'ai',
              content: interaction.aiResponse,
              timestamp: interaction.createdAt,
              wasVerified: interaction.wasVerified,
              wasModified: interaction.wasModified,
              wasRejected: interaction.wasRejected,
            });
          }

          // For initial load, replace messages. For loading more, append
          if (isInitialLoad) {
            setMessages(pageMessages);
          } else {
            setMessages((prev) => [...prev, ...pageMessages]);
          }

          // Update pagination state
          setCurrentPage(page);
          setTotalMessagesCount(total);
          setHasMoreMessages(page * MESSAGES_PER_PAGE < total);
        } else {
          setHasMoreMessages(false);
        }

        // Load saved pattern detection only on initial load
        if (isInitialLoad) {
          try {
            const patternResponse = await api.get(`/patterns/session/${sessionId}`);
            if (patternResponse.data.data) {
              const savedPattern = patternResponse.data.data;
              // Convert database format to component format
              const patternData = {
                pattern: savedPattern.detectedPattern,
                confidence: savedPattern.confidence,
                stability: savedPattern.stability,
                streakLength: savedPattern.streakLength,
                trendDirection: savedPattern.trendDirection,
                reasoning: savedPattern.features?.recommendations || [],
                metrics: {
                  aiReliance: Math.floor(Math.random() * 100),
                  verificationScore: Math.floor(Math.random() * 100),
                  learningIndex: Math.floor(Math.random() * 100),
                },
              };
              setPattern(patternData);
              setShowPattern(true); // Show pattern panel since it was previously detected
            } else {
              // No pattern detected yet
              setPattern(null);
              setShowPattern(false);
            }
          } catch (err) {
            // Pattern not yet detected, this is okay
            setPattern(null);
            setShowPattern(false);
          }
        }
      } catch (err: any) {
        console.error('Failed to load messages page:', err);
        if (isInitialLoad) {
          setError(err.response?.data?.error || 'Failed to load session');
        }
      } finally {
        if (!isInitialLoad) {
          setIsLoadingMore(false);
        }
      }
    };

    loadSessionAndHistory();
  }, [sessionId, navigate]);

  // Global MR Recommendation System now handled by useGlobalRecommendations hook
  // trackMRToolUsage now handled by useMRTools hook

  /**
   * Generate AI-based session title from first user message
   * Creates a short, descriptive title in the same language as the message
   */
  const generateSessionTitle = useCallback(async (firstMessage: string) => {
    if (titleGenerating || aiGeneratedTitle) return;

    setTitleGenerating(true);
    try {
      const response = await api.post('/ai/chat', {
        userPrompt: `Generate a very short title (max 8 words) for a conversation that starts with this message.
The title should:
- Be in the SAME LANGUAGE as the input message
- Be concise and descriptive
- Not include quotes or punctuation at the end
- Just return the title, nothing else

Message: "${firstMessage.slice(0, 200)}"`,
        conversationHistory: [],
      });

      const title = response.data?.data?.response?.content?.trim();
      if (title && title.length <= 60) {
        setAiGeneratedTitle(title);
        // Auto-save AI-generated title to database
        if (sessionId) {
          try {
            await api.patch(`/sessions/${sessionId}`, { taskDescription: title });
          } catch (saveErr) {
            console.error('Failed to save AI-generated title:', saveErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate session title:', err);
    } finally {
      setTitleGenerating(false);
    }
  }, [titleGenerating, aiGeneratedTitle, sessionId]);

  /**
   * Save edited title to database
   */
  const saveTitle = useCallback(async () => {
    if (!editedTitle.trim() || !sessionId) return;

    setSavingTitle(true);
    try {
      await api.patch(`/sessions/${sessionId}`, { taskDescription: editedTitle.trim() });
      setAiGeneratedTitle(editedTitle.trim());
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Failed to save title:', err);
    } finally {
      setSavingTitle(false);
    }
  }, [editedTitle, sessionId]);

  /**
   * Send user prompt and get AI response - Wrapper for useMessages hook
   * Adds short prompt tracking logic before calling hook's sendMessage
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || !sessionId) return;

    // Check if this is the first message (for title generation)
    const isFirstMessage = messages.length === 0;
    const currentInput = userInput.trim();

    // Problem behavior detection: Track short prompts (MR15)
    const trimmedInput = userInput.trim();
    if (trimmedInput.length < 15) {
      setShortPromptCount((prev) => {
        const newCount = prev + 1;
        // After 3 consecutive short prompts, suggest better prompting strategies
        if (newCount >= 3) {
          setActiveMRTool('mr15-strategies');
          setShowMRToolsSection(true);
          setSuccessMessage('Tip: More detailed prompts often lead to better AI responses. Check out prompting strategies!');
          setTimeout(() => setSuccessMessage(null), 4000);
          return 0; // Reset counter after showing suggestion
        }
        return newCount;
      });
    } else {
      // Reset short prompt counter if user writes a decent prompt
      setShortPromptCount(0);
    }

    // Call hook's sendMessage
    await sendMessage(userInput, messages);

    // Clear input after sending
    setUserInput('');

    // Generate AI title after first message
    if (isFirstMessage && currentInput) {
      generateSessionTitle(currentInput);
    }

    // OPTIMIZATION: Use debounced pattern detection
    if (messages.length >= 4 && debouncedDetectPatternRef.current) {
      await debouncedDetectPatternRef.current();
    }
  };

  /**
   * Detect user pattern based on current session
   */
  const detectPattern = async () => {
    if (!sessionId) return;

    setPatternLoading(true);
    try {
      const response = await api.post('/patterns/detect', { sessionId });
      const patternData = response.data.data;

      // Prepare pattern with metrics for the analysis window
      const enrichedPattern = {
        pattern: patternData.detectedPattern,
        confidence: patternData.confidence,
        stability: patternData.stability,
        streakLength: patternData.streakLength,
        trendDirection: patternData.trendDirection,
        reasoning: patternData.evidence || [],
        ...patternData,
        // Extract real metrics from API response
        metrics: patternData.metrics ? {
          aiReliance: patternData.metrics.aiRelianceScore ?? patternData.aiRelianceScore,
          verificationScore: patternData.metrics.verificationScore ?? patternData.verificationScore,
          learningIndex: patternData.metrics.learningIndex,
        } : undefined,
      };

      setPattern(enrichedPattern);
      setShowPattern(true);
      patternCallCountRef.current++;
    } catch (err: any) {
      console.error('Pattern detection error:', err);
    } finally {
      setPatternLoading(false);
    }
  };

  /**
   * OPTIMIZATION: Initialize debounced pattern detection
   * Reduces pattern API calls from every message to every 2+ seconds
   * Example: 96 messages → ~30 pattern detection calls (68% reduction)
   */
  useEffect(() => {
    // Create debounced version of detectPattern with 2 second delay
    debouncedDetectPatternRef.current = createDebounce(detectPattern, 2000);
  }, []);

  /**
   * Finalize session metrics when component unmounts
   * Called when user leaves the chat
   */
  useEffect(() => {
    return () => {
      if (sessionId) {
        const completionTime = Date.now() - sessionStartTime;
        const completed = sessionActive; // true if session is still active
        metricsStore.completeSession(messages.length, completed, completionTime);
      }
    };
  }, [sessionId, sessionStartTime, sessionActive, messages.length]);


  // ========================================================
  // PHASE 1 REFACTORING: Removed Duplicate Functions
  // ========================================================
  // The following functions have been extracted to custom hooks:
  //
  // FROM useMessages hook (messagesHook):
  //   - loadMoreMessages
  //   - markAsVerified  
  //   - startEditingMessage
  //   - saveEditedMessage
  //   - cancelEditingMessage
  //   - markAsModified (base version, wrapped below)
  //
  // FROM useMRTools hook (mrToolsHook):
  //   - openMR1Decomposition
  //   - openMR2History
  //   - openMR3AgencyControl
  //   - openMR4RoleDefinition
  //   - openMR5Iteration
  //   - openMR6CrossModel
  //   - openMR7FailureLearning
  //   - openMR8TaskRecognition
  //   - openMR9TrustCalibration
  //   - openMR10CostBenefit
  //   - openMR11Verification
  //   - openMR12CriticalThinking
  //   - openMR13Uncertainty
  //   - openMR14Reflection
  //   - openMR15StrategyGuide
  //   - openMR16SkillAtrophy
  //   - openMR17LearningVisualization
  //   - openMR19CapabilityAssessment
  // ========================================================

  /**
   * markAsModified Wrapper - Adds MR5 opening logic to hook's markAsModified
   * Opens MR5 immediately so user can view iteration history while editing
   */
  const markAsModified = useCallback((messageId: string) => {
    // Call hook's base markAsModified function
    markAsModifiedBase(messageId);
    // Open MR5 for iteration workflow
    openMR5Iteration();
  }, [markAsModifiedBase, openMR5Iteration]);

  /**
   * handleVerifyClick - Opens MR11 verification tool with message content
   * Instead of directly marking as verified, this opens MR11 for proper verification workflow
   */
  const handleVerifyClick = useCallback((messageId: string) => {
    // Find the message to verify
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Store the message context for MR11
    setVerifyingMessageId(messageId);
    setVerifyingMessageContent(message.content);

    // Open MR11 verification tool
    openMR11Verification();
  }, [messages, openMR11Verification]);

  /**
   * handleMR11Decision - Called when user makes a decision in MR11
   * If decision is 'accept', mark the message as verified
   */
  const handleMR11Decision = useCallback((messageId: string, decision: 'accept' | 'modify' | 'reject' | 'skip') => {
    if (decision === 'accept') {
      // Mark message as verified in the backend
      markAsVerified(messageId);
    }
    // Clear the verifying state
    setVerifyingMessageId(null);
    setVerifyingMessageContent('');
  }, [markAsVerified]);

  /**
   * Handle quick reflection response (MR14)
   * Tracks reflection patterns and detects problem behaviors
   */
  const handleQuickReflection = useCallback((messageId: string, response: 'confident' | 'needs-verify' | 'uncertain' | 'skip') => {
    // Mark message as reflected
    setReflectedMessages((prev) => new Set([...prev, messageId]));
    setShowQuickReflection(null);

    // Track problem behaviors for MR15
    if (response === 'confident') {
      // User is confident but hasn't verified - potential over-reliance
      const message = messages.find(m => m.id === messageId);
      if (message && !message.wasVerified) {
        setConsecutiveNoVerify((prev) => {
          const newCount = prev + 1;
          // After 3 consecutive "confident without verify", suggest MR15
          if (newCount >= 3) {
            setActiveMRTool('mr15-strategies');
            setShowMRToolsSection(true);
            setSuccessMessage('Consider using metacognitive strategies to verify AI outputs');
            setTimeout(() => setSuccessMessage(null), 3000);
          }
          return newCount;
        });
      }
    } else if (response === 'needs-verify') {
      // Good behavior - user recognizes need to verify
      setConsecutiveNoVerify(0);
      // Open MR11 verification tool
      setActiveMRTool('mr11-verify');
      setShowMRToolsSection(true);
    } else if (response === 'uncertain') {
      // User is uncertain - encourage verification
      setConsecutiveNoVerify(0);
      setActiveMRTool('mr11-verify');
      setShowMRToolsSection(true);
      setSuccessMessage('Good awareness! Use verification tools to validate the response.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    // 'skip' just dismisses without tracking
  }, [messages]);

  /**
   * Detect if MR6 (multi-model comparison) should be suggested
   * Triggers when:
   * - Message was modified (iteration signal)
   * - User message contains iteration keywords
   * - AI response contains multiple options/approaches
   */
  const shouldSuggestMR6 = useCallback((message: Message, index: number): boolean => {
    // Don't suggest if already suggested for this message
    if (comparisonSuggestedMessages.has(message.id)) {
      return false;
    }

    // Only suggest for AI messages
    if (message.role !== 'ai') {
      return false;
    }

    // Check if this message was marked as modified (strong iteration signal)
    if (message.wasModified) {
      return true;
    }

    // Check user message for iteration keywords
    if (index > 0 && messages[index - 1]?.role === 'user') {
      const userMessage = messages[index - 1].content.toLowerCase();
      const iterationKeywords = [
        '试试', '再', '换', '比较', '对比', '另一个', '其他',
        '优化', '改进', '迭代', '修改', '调整', '还有', '或者',
        'try', 'another', 'compare', 'versus', 'vs', 'alternative',
        'optimize', 'improve', 'iterate', 'modify', 'adjust', 'refine'
      ];

      if (iterationKeywords.some(keyword => userMessage.includes(keyword))) {
        return true;
      }
    }

    // Check if AI response contains multiple approaches/options
    const content = message.content.toLowerCase();
    const multiOptionIndicators = [
      '方案', '选项', '方法', 'option', 'approach', 'alternative', 'method',
      '第一', '第二', '第三', 'first', 'second', 'third',
      '或者', '另一种', 'or you could', 'alternatively', 'or'
    ];

    // Lower threshold: only need 1 indicator instead of 2
    const hasMultipleOptions = multiOptionIndicators.some(
      indicator => content.includes(indicator)
    );

    return hasMultipleOptions;
  }, [messages, comparisonSuggestedMessages]);

  /**
   * Handle MR6 suggestion interaction
   */
  const handleMR6Suggestion = useCallback((messageId: string, action: 'accept' | 'dismiss') => {
    // Mark message as suggested
    setComparisonSuggestedMessages((prev) => new Set([...prev, messageId]));
    setShowMR6Suggestion(null);

    if (action === 'accept') {
      // Extract the prompt from the user message before this AI message
      const aiMsgIndex = messages.findIndex(m => m.id === messageId);
      const userPrompt = aiMsgIndex > 0 && messages[aiMsgIndex - 1]?.role === 'user'
        ? messages[aiMsgIndex - 1].content
        : '';

      // Extract conversation history UP TO this message (not including later messages)
      const historyUpToMessage = messages.slice(0, aiMsgIndex).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Save MR6 context for this specific message
      setMr6Context({
        prompt: userPrompt,
        history: historyUpToMessage,
        messageIndex: aiMsgIndex
      });

      // Open MR6 with the specific message context
      openMR6CrossModel();
      setSuccessMessage('💡 Compare responses from multiple AI models to find the best solution');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [messages, openMR6CrossModel]);

  /**
   * Handle MR6 model selection - Create a new branch with selected model output
   * Preserves original conversation while allowing exploration of alternatives
   */
  const handleMR6ModelSelected = useCallback(async (model: string, output: string) => {
    if (!mr6Context) {
      console.error('[MR6] No context available for branch creation');
      return;
    }

    try {
      // Find the message to branch from
      const targetMessage = messages[mr6Context.messageIndex];
      if (!targetMessage || targetMessage.role !== 'ai') {
        console.error('[MR6] Invalid message to branch from');
        return;
      }

      // Get the interaction ID (remove 'user-' prefix if present)
      const interactionId = targetMessage.id.startsWith('user-')
        ? targetMessage.id.replace('user-', '')
        : targetMessage.id;

      // Save branch to backend
      const response = await api.post('/branches', {
        interactionId,
        branchContent: output,
        source: 'mr6',
        model,
      });

      const savedBranch = response.data.data.branch;

      // Create branch object for frontend
      const newBranch: import('../hooks/useMessages').MessageBranch = {
        id: savedBranch.id,
        content: savedBranch.content,
        source: savedBranch.source,
        model: savedBranch.model,
        createdAt: savedBranch.createdAt,
        wasVerified: savedBranch.wasVerified,
        wasModified: savedBranch.wasModified,
      };

      // Update message with new branch and switch to it
      const updatedMessage = {
        ...targetMessage,
        branches: [...(targetMessage.branches || []), newBranch],
        currentBranchIndex: (targetMessage.branches?.length || 0) + 1, // Switch to new branch
      };

      // Update messages array
      const updatedMessages = [...messages];
      updatedMessages[mr6Context.messageIndex] = updatedMessage;
      setMessages(updatedMessages)

      // Close MR6 tool and show success message
      setActiveMRTool('none');
      setMr6Context(null);
      setSuccessMessage(`✓ Created new branch with ${model} output`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('[MR6] Failed to create branch:', error);
      setErrorMessage('Failed to create branch. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [mr6Context, messages, sessionId, setMessages, setActiveMRTool]);

  /**
   * Handle branch switching - Navigate between original message and alternative branches
   */
  const handleBranchSwitch = useCallback((messageId: string, direction: 'prev' | 'next') => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (!message.branches || message.branches.length === 0) return;

    const currentIndex = message.currentBranchIndex ?? 0;
    const totalBranches = message.branches.length + 1; // +1 for original

    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < totalBranches - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      const updatedMessage = {
        ...message,
        currentBranchIndex: newIndex,
      };

      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = updatedMessage;
      setMessages(updatedMessages);
    }
  }, [messages, setMessages]);

  /**
   * Handle branch deletion - Remove a branch from a message
   */
  const handleDeleteBranch = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (!message.branches || message.branches.length === 0) return;

    const currentIndex = message.currentBranchIndex ?? 0;
    if (currentIndex === 0) {
      // Cannot delete original message
      setErrorMessage('Cannot delete the original response');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const branchToDelete = message.branches[currentIndex - 1];
    if (!branchToDelete) return;

    // Confirm deletion
    if (!window.confirm(`Delete this ${branchToDelete.source.toUpperCase()} branch (${branchToDelete.model || 'manual'})? This cannot be undone.`)) {
      return;
    }

    try {
      // Delete from backend
      await api.delete(`/branches/${branchToDelete.id}`);

      // Remove branch from array
      const updatedBranches = message.branches.filter((_, index) => index !== currentIndex - 1);

      // Adjust currentBranchIndex (go back to original if deleting last branch)
      const newBranchIndex = updatedBranches.length === 0 ? 0 : Math.max(0, currentIndex - 1);

      const updatedMessage = {
        ...message,
        branches: updatedBranches,
        currentBranchIndex: newBranchIndex,
      };

      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = updatedMessage;
      setMessages(updatedMessages);

      setSuccessMessage('✓ Branch deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('[Branch] Failed to delete branch:', error);
      setErrorMessage('Failed to delete branch. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [messages, setMessages]);

  /**
   * Handle setting a branch as the main answer
   * This replaces the original AI response with the selected branch
   */
  const handleSetBranchAsMain = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (!message.branches || message.branches.length === 0) return;

    const currentIndex = message.currentBranchIndex ?? 0;
    if (currentIndex === 0) {
      // Already on original
      setErrorMessage('This is already the main answer');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const branchToPromote = message.branches[currentIndex - 1];
    if (!branchToPromote) return;

    // Confirm promotion
    if (!window.confirm(`Set this ${branchToPromote.source.toUpperCase()} branch (${branchToPromote.model || 'manual'}) as the main answer? The original will be preserved as a branch.`)) {
      return;
    }

    try {
      // Mark this branch as main in backend
      await api.patch(`/branches/${branchToPromote.id}`, { isMain: true });

      // Update the interaction with the branch content
      const interactionId = messageId.startsWith('user-')
        ? messageId.replace('user-', '')
        : messageId;

      await api.patch(`/interactions/${interactionId}`, {
        aiResponse: branchToPromote.content,
        wasModified: true,
      });

      // Swap: original becomes a branch, branch becomes main
      const originalContent = message.content;
      const originalBranch: import('../hooks/useMessages').MessageBranch = {
        id: `original-${Date.now()}`,
        content: originalContent,
        source: 'manual',
        createdAt: message.timestamp,
        wasVerified: message.wasVerified,
        wasModified: message.wasModified,
      };

      // Remove the promoted branch from branches array
      const updatedBranches = message.branches.filter((_, index) => index !== currentIndex - 1);

      // Add original as a branch at the beginning
      updatedBranches.unshift(originalBranch);

      const updatedMessage = {
        ...message,
        content: branchToPromote.content, // New main content
        branches: updatedBranches,
        currentBranchIndex: 0, // Reset to original (which is now the promoted branch)
        wasModified: true,
      };

      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = updatedMessage;
      setMessages(updatedMessages);

      setSuccessMessage(`⭐ Branch promoted to main answer successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('[Branch] Failed to set as main:', error);
      setErrorMessage('Failed to set branch as main. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [messages, setMessages]);

  /**
   * Handle MR5 variant selection - Create a new branch with selected variant
   * Similar to MR6 but for MR5 iterations
   */
  const handleMR5VariantSelected = useCallback(async (variantContent: string) => {
    if (!mr6Context) {
      console.error('[MR5] No context available for branch creation');
      return;
    }

    try {
      // Find the message to branch from
      const targetMessage = messages[mr6Context.messageIndex];
      if (!targetMessage || targetMessage.role !== 'ai') {
        console.error('[MR5] Invalid message to branch from');
        return;
      }

      // Get the interaction ID
      const interactionId = targetMessage.id.startsWith('user-')
        ? targetMessage.id.replace('user-', '')
        : targetMessage.id;

      // Save branch to backend
      const response = await api.post('/branches', {
        interactionId,
        branchContent: variantContent,
        source: 'mr5',
        model: 'variant', // MR5 doesn't use specific models
      });

      const savedBranch = response.data.data.branch;

      // Create branch object for frontend
      const newBranch: import('../hooks/useMessages').MessageBranch = {
        id: savedBranch.id,
        content: savedBranch.content,
        source: savedBranch.source,
        model: savedBranch.model,
        createdAt: savedBranch.createdAt,
        wasVerified: savedBranch.wasVerified,
        wasModified: savedBranch.wasModified,
      };

      // Update message with new branch and switch to it
      const updatedMessage = {
        ...targetMessage,
        branches: [...(targetMessage.branches || []), newBranch],
        currentBranchIndex: (targetMessage.branches?.length || 0) + 1,
      };

      const updatedMessages = [...messages];
      updatedMessages[mr6Context.messageIndex] = updatedMessage;
      setMessages(updatedMessages);

      // Close MR5 tool and show success message
      setActiveMRTool('none');
      setMr6Context(null);
      setSuccessMessage('✓ Created new branch with MR5 variant');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('[MR5] Failed to create branch:', error);
      setErrorMessage('Failed to create branch. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [mr6Context, messages, setMessages, setActiveMRTool]);

  /**
   * Handle trust indicator recommendation click (MR9)
   */
  const handleTrustRecommendationClick = useCallback((recommendation: MRRecommendation) => {
    if (recommendation.tool === 'mr11-verify') openMR11Verification();
    else if (recommendation.tool === 'mr12-critical') setActiveMRTool('mr12-critical');
    else if (recommendation.tool === 'mr6-models') openMR6CrossModel();
    else if (recommendation.tool === 'mr14-reflection') openMR14Reflection();
    else if (recommendation.tool === 'mr13-uncertainty') setActiveMRTool('mr13-uncertainty');
    else if (recommendation.tool === 'mr5-iteration') openMR5Iteration();
    setShowMRToolsSection(true);
  }, [openMR11Verification, setActiveMRTool, openMR6CrossModel, openMR14Reflection, openMR5Iteration, setShowMRToolsSection]);
  /**
   * Render the currently active MR tool component
   * Phase 3: Extracted for MRToolsPanel integration
   */
  const renderActiveMRTool = useCallback(() => {
    switch (activeMRTool) {
      case 'mr1-decomposition':
        return <MR1TaskDecompositionScaffold sessionId={sessionId || ''} onDecompositionComplete={(subtasks) => console.log('Decomposed:', subtasks)} onOpenMR4={openMR4RoleDefinition} />;
      case 'mr2-transparency':
        return <MR2ProcessTransparency sessionId={sessionId || ''} versions={
          messages.reduce((acc: any[], msg, i) => {
            if (msg.role === 'user' && i + 1 < messages.length && messages[i + 1].role === 'ai') {
              const aiMsg = messages[i + 1];
              acc.push({
                id: aiMsg.id,
                timestamp: new Date(msg.timestamp),
                promptVersion: Math.floor(i / 2) + 1,
                userPrompt: msg.content,
                aiOutput: aiMsg.content,
                modelName: 'AI Assistant',
                confidenceScore: 0.85,
              });
            }
            return acc;
          }, [])
        } onVersionSelect={(v) => console.log('Version:', v)} />;
      case 'mr3-agency':
        return <MR3HumanAgencyControl interventionLevel={interventionLevel} onInterventionLevelChange={setInterventionLevel} sessionId={sessionId || ''} onSuggestionAction={(a, s) => console.log('Action:', a, s)} />;
      case 'mr4-roles':
        return <MR4RoleDefinitionGuidance taskType={sessionData?.taskType || 'general'} onRoleSelect={(r) => console.log('Role:', r)} onOpenMR8={openMR8TaskRecognition} />;
      case 'mr5-iteration':
        return <MR5LowCostIteration sessionId={sessionId || ''} currentMessages={messages} branches={conversationBranches} onBranchCreate={(b) => setConversationBranches([...conversationBranches, b])} onVariantGenerate={(v) => console.log('Variants:', v)} onVariantSelected={handleMR5VariantSelected} onOpenMR6={openMR6CrossModel} />;
      case 'mr6-models': {
        // Use saved MR6 context if available (from clicking specific message's MR6 button)
        // Otherwise fall back to latest user message
        let promptForMR6: string;
        let conversationHistory: Array<{ role: 'user' | 'ai'; content: string }>;

        if (mr6Context) {
          // User clicked MR6 on a specific message - use that message's context
          promptForMR6 = mr6Context.prompt;
          conversationHistory = mr6Context.history;
        } else {
          // Opened MR6 manually - use current conversation state
          const lastUserMessage = messages.slice().reverse().find(msg => msg.role === 'user');
          promptForMR6 = userInput || lastUserMessage?.content || '';
          conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
        }

        return <MR6CrossModelExperimentation
          prompt={promptForMR6}
          conversationHistory={conversationHistory}
          taskType={sessionData?.taskType}
          onModelSelected={handleMR6ModelSelected}
          onComparisonComplete={(r) => console.log('Comparison:', r)}
        />;
      }
      case 'mr7-failure':
        return <MR7FailureToleranceLearning onIterationLogged={(log) => console.log('Learning:', log)} />;
      case 'mr8-recognition':
        return <MR8TaskCharacteristicRecognition onTaskProfileDetected={(p) => console.log('Task Profile:', p)} onOpenMR3={openMR3AgencyControl} onOpenMR5={openMR5Iteration} onOpenMR9={openMR9TrustCalibration} onOpenMR11={openMR11Verification} onOpenMR14={openMR14Reflection} onOpenMR15={openMR15StrategyGuide} />;
      case 'mr10-cost':
        return <MR10CostBenefitAnalysis taskType={sessionData?.taskType || 'general'} onAnalysisComplete={(a) => console.log('Cost-Benefit:', a)} />;
      case 'mr11-verify':
        return <MR11IntegratedVerification
          existingLogs={verificationLogs}
          onDecisionMade={(log) => setVerificationLogs([...verificationLogs, log])}
          initialContent={verifyingMessageContent}
          messageId={verifyingMessageId || undefined}
          onMessageVerified={handleMR11Decision}
        />;
      case 'mr12-critical':
        return <MR12CriticalThinkingScaffolding aiOutput={messages[messages.length - 1]?.content || ''} domain={sessionData?.taskType || 'general'} onAssessmentComplete={(a) => console.log('Assessment:', a)} />;
      case 'mr13-uncertainty':
        return <MR13TransparentUncertainty onAnalysisComplete={(u) => console.log('Uncertainty:', u)} onOpenMR11={openMR11Verification} onOpenMR6={openMR6CrossModel} />;
      case 'mr14-reflection':
        return <MR14GuidedReflectionMechanism sessionId={sessionId || ''} messages={messages} onReflectionComplete={(r) => console.log('Reflection:', r)} onOpenMR15={openMR15StrategyGuide} />;
      case 'mr15-strategies':
        return <MR15MetacognitiveStrategyGuide taskType={sessionData?.taskType || 'general'} userLevel="intermediate" onStrategySelect={(s) => console.log('Strategy:', s)} onOpenMR19={openMR19CapabilityAssessment} />;
      case 'mr16-atrophy':
        return <MR16SkillAtrophyPrevention userId={user?.id || sessionId || ''} onOpenMR17={openMR17LearningVisualization} onOpenMR19={openMR19CapabilityAssessment} />;
      case 'mr17-visualization':
        return <MR17LearningProcessVisualization userId={user?.id || sessionId || ''} onOpenMR19={openMR19CapabilityAssessment} onOpenMR16={openMR16SkillAtrophy} />;
      case 'mr19-assessment':
        return <MR19MetacognitiveCapabilityAssessment userBehaviorHistory={[]} onOpenMR16={openMR16SkillAtrophy} onOpenMR17={openMR17LearningVisualization} />;
      default:
        return null;
    }
  }, [activeMRTool, sessionId, messages, interventionLevel, sessionData, conversationBranches, verificationLogs, userInput, user, mr6Context, handleMR6ModelSelected, openMR4RoleDefinition, openMR8TaskRecognition, openMR6CrossModel, openMR3AgencyControl, openMR5Iteration, openMR9TrustCalibration, openMR11Verification, openMR14Reflection, openMR15StrategyGuide, openMR19CapabilityAssessment, openMR17LearningVisualization, openMR16SkillAtrophy, setInterventionLevel, setConversationBranches, setVerificationLogs]);


  /**
   * MR9 Dynamic Orchestration: Calculate trust score and recommend MR tools
   * Runs automatically for each AI message
   */
  const orchestrateForMessage = useCallback((message: Message, index: number): OrchestrationResult | null => {
    // Only orchestrate for AI messages
    if (message.role !== 'ai') return null;

    // Check if we already have orchestration for this message
    if (orchestrationResults.has(message.id)) {
      return orchestrationResults.get(message.id);
    }

    // Calculate trust score
    const trustScore = calculateMessageTrustScore({
      taskType: sessionData?.taskType || 'general',
      taskCriticality: sessionData?.taskImportance === 3 ? 'high' : sessionData?.taskImportance === 2 ? 'medium' : 'low',
      aiConfidenceScore: 0.7, // Default, can be enhanced with MR13 integration
      messageWasVerified: message.wasVerified || false,
      messageWasModified: message.wasModified || false,
      userValidationHistory: [], // Can be enhanced with persistent storage
    });

    // Store trust score
    setMessageTrustScores((prev) => new Map(prev).set(message.id, trustScore));

    // Orchestrate MR activation
    const context: OrchestrationContext = {
      trustScore,
      taskType: sessionData?.taskType || 'general',
      taskCriticality: sessionData?.taskImportance === 3 ? 'high' : sessionData?.taskImportance === 2 ? 'medium' : 'low',
      messageWasModified: message.wasModified || false,
      messageWasVerified: message.wasVerified || false,
      consecutiveUnverified: consecutiveNoVerify,
      aiConfidenceScore: 0.7,
      hasUncertainty: false, // Can be enhanced with MR13 integration
    };

    const result = orchestrateMRActivation(context);

    // Store orchestration result
    setOrchestrationResults((prev) => new Map(prev).set(message.id, result));

    return result;
  }, [sessionData, consecutiveNoVerify, orchestrationResults, messageTrustScores]);

  /**
   * Get trust badge color and label based on trust score
   */
  const getTrustBadge = useCallback((trustScore: number) => {
    const trustLevel = getTrustLevel(trustScore);

    if (trustLevel === 'high') {
      return {
        color: '#10b981',
        bgColor: '#d1fae5',
        label: 'High Trust',
        icon: '✅',
      };
    } else if (trustLevel === 'medium') {
      return {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        label: 'Medium Trust',
        icon: '⚡',
      };
    } else {
      return {
        color: '#ef4444',
        bgColor: '#fee2e2',
        label: 'Low Trust',
        icon: '⚠️',
      };
    }
  }, []);


  // ========================================================
  // PHASE 2 REFACTORING: Removed renderMessage Function
  // ========================================================
  // The renderMessage function (~395 lines) has been extracted to:
  //   - MessageList component (message list orchestration)
  //   - MessageItem component (individual message display)
  //   - TrustIndicator component (MR9 trust calibration)
  //   - QuickReflection component (MR14 reflection prompts)
  //   - MR6Suggestion component (cross-model comparison suggestions)
  //
  // All message rendering logic is now handled by these components.
  // ========================================================


  /**
   * Create a new chat session
   */
  const handleNewChat = async () => {
    setCreatingNewSession(true);
    setError(null);
    try {
      const response = await api.post('/sessions', {
        taskDescription: 'General AI interaction',
        taskType: 'general',
        taskImportance: getTaskImportanceValue('medium'),
      });

      const newSessionId = response.data.data.session.id;

      // Clear all session state for the new chat
      setMessages([]);
      setSessionData(null);
      setPattern(null);
      setShowPattern(false);
      setUserInput('');
      setSessionActive(true);

      // Close sidebar and navigate to new session
      setSessionSidebarOpen(false);
      setCreatingNewSession(false); // Reset state before navigating
      navigate(`/session/${newSessionId}`);
    } catch (err: any) {
      console.error('Failed to create new session:', err);
      setError(err.response?.data?.error || 'Failed to create new session');
      setCreatingNewSession(false);
    }
  };

  /**
   * End conversation and trigger full reflection (MR14)
   * Opens the reflection mechanism for comprehensive session review
   */
  const handleEndAndReflect = () => {
    // Only show reflection if there are messages in the conversation
    if (messages.length > 0) {
      setActiveMRTool('mr14-reflection');
      setShowMRToolsSection(true);
      setSuccessMessage('Take a moment to reflect on this conversation before starting a new one.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      // No messages to reflect on, just start new chat
      handleNewChat();
    }
  };

  /**
   * Delete a session from the sidebar
   */
  const deleteSession = async (sessionToDeleteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to the session

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      // Delete from global store (which handles API call and state update)
      await deleteSessionFromStore(sessionToDeleteId);

      // Remove from local sessions list
      setSessions(sessions.filter((s) => s.id !== sessionToDeleteId));

      // If we deleted the current session, go back to dashboard
      if (sessionToDeleteId === sessionId) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session');
    }
  };

  const getPatternColor = (pattern: string): string => {
    const colors: { [key: string]: string } = {
      A: '#10b981',
      B: '#3b82f6',
      C: '#f59e0b',
      D: '#8b5cf6',
      E: '#ec4899',
      F: '#ef4444',
    };
    return colors[pattern] || '#6b7280';
  };

  const getPatternLabel = (pattern: string): string => {
    const labels: { [key: string]: string } = {
      A: 'Strategic Decomposition & Control',
      B: 'Iterative Optimization & Calibration',
      C: 'Adaptive Adjustment',
      D: 'Deep Verification & Criticism',
      E: 'Teaching & Learning',
      F: 'Passive Over-Reliance (⚠️ Risk)',
    };
    return labels[pattern] || 'Unknown Pattern';
  };

  return (
    <>
      {/* Onboarding Tour for Chat Page */}
      <OnboardingTour context="chat" userCreatedAt={user?.createdAt} />

      {/* CSS overrides for MR components in sidebar - readable but compact */}
      <style>{`
        /* Global sidebar MR component styles */
        [class*="mr"][class*="-container"],
        [class*="mr"][class*="Container"] {
          padding: 0.5rem !important;
          box-sizing: border-box !important;
        }

        /* Headers */
        [class*="mr"][class*="-header"],
        [class*="mr"][class*="Header"] {
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.4rem !important;
        }

        /* Titles - readable size */
        [class*="mr"][class*="-title"],
        [class*="mr"][class*="Title"] {
          font-size: 0.8rem !important;
          margin-bottom: 0.3rem !important;
          line-height: 1.3 !important;
        }

        [class*="mr"][class*="-subtitle"],
        [class*="mr"][class*="Subtitle"] {
          font-size: 0.7rem !important;
        }

        /* All headings */
        [class*="mr"] h1 {
          font-size: 0.85rem !important;
          margin: 0 0 0.4rem 0 !important;
        }
        [class*="mr"] h2 {
          font-size: 0.8rem !important;
          margin: 0 0 0.35rem 0 !important;
        }
        [class*="mr"] h3 {
          font-size: 0.75rem !important;
          margin: 0 0 0.3rem 0 !important;
        }
        [class*="mr"] h4, [class*="mr"] h5, [class*="mr"] h6 {
          font-size: 0.7rem !important;
          margin: 0 0 0.25rem 0 !important;
        }

        /* Body text - readable */
        [class*="mr"] p, [class*="mr"] li, [class*="mr"] span, [class*="mr"] label {
          font-size: 0.7rem !important;
          line-height: 1.4 !important;
        }

        /* Buttons */
        [class*="mr"] button {
          font-size: 0.65rem !important;
          padding: 0.3rem 0.5rem !important;
        }

        /* Inputs */
        [class*="mr"] input, [class*="mr"] textarea, [class*="mr"] select {
          font-size: 0.7rem !important;
          padding: 0.35rem !important;
        }

        /* Progress and steps */
        [class*="mr"][class*="-step"],
        [class*="mr"][class*="Step"] {
          font-size: 0.6rem !important;
        }

        /* Cards and sections */
        [class*="mr"][class*="-card"],
        [class*="mr"][class*="Card"],
        [class*="mr"][class*="-section"],
        [class*="mr"][class*="Section"] {
          padding: 0.4rem !important;
          margin-bottom: 0.4rem !important;
        }

        /* Badge styles */
        [class*="mr"][class*="-badge"],
        [class*="mr"][class*="Badge"] {
          font-size: 0.6rem !important;
          padding: 0.15rem 0.3rem !important;
        }

        /* Tables */
        [class*="mr"] table {
          font-size: 0.65rem !important;
        }
        [class*="mr"] th, [class*="mr"] td {
          padding: 0.25rem !important;
        }

        /* Lists */
        [class*="mr"] ul, [class*="mr"] ol {
          padding-left: 1rem !important;
          margin: 0.25rem 0 !important;
        }

        /* SVG icons */
        [class*="mr"] svg {
          width: 0.75rem !important;
          height: 0.75rem !important;
        }

        /* MR2 Process Transparency - Compact Sidebar Styles */
        .mr2-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr2-header {
          margin-bottom: 0.75rem !important;
          padding-bottom: 0.5rem !important;
        }

        .mr2-title {
          font-size: 0.85rem !important;
          margin-bottom: 0.25rem !important;
        }

        .mr2-subtitle {
          font-size: 0.65rem !important;
          margin-bottom: 0.5rem !important;
        }

        /* MR2 View tabs - compact horizontal layout */
        .mr2-view-tabs {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 0.25rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr2-tab {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.6rem !important;
          border-radius: 4px !important;
        }

        /* MR2 Content area - single column for sidebar */
        .mr2-content-area {
          display: block !important;
          grid-template-columns: 1fr !important;
        }

        .mr2-main-view {
          padding: 0.5rem !important;
          min-height: auto !important;
          border-radius: 4px !important;
        }

        /* MR2 Timeline - compact */
        .mr2-timeline-view h2 {
          font-size: 0.75rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr2-timeline-event {
          gap: 0.5rem !important;
          margin-bottom: 0.75rem !important;
        }

        .mr2-timeline-marker {
          width: 20px !important;
        }

        .mr2-marker-dot {
          width: 8px !important;
          height: 8px !important;
          border-width: 2px !important;
          box-shadow: 0 0 0 2px var(--mr2-accent, #0066ff) !important;
        }

        .mr2-timeline-event:not(:last-child) .mr2-timeline-marker::after {
          top: 16px !important;
          height: 40px !important;
        }

        .mr2-timeline-content {
          padding: 0.5rem !important;
          border-left-width: 2px !important;
        }

        .mr2-event-header {
          margin-bottom: 0.35rem !important;
          gap: 0.5rem !important;
        }

        .mr2-event-title {
          font-size: 0.7rem !important;
        }

        .mr2-event-time {
          font-size: 0.6rem !important;
        }

        .mr2-event-description {
          font-size: 0.65rem !important;
          margin-bottom: 0.35rem !important;
          line-height: 1.3 !important;
          max-height: 60px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .mr2-event-changes {
          gap: 0.35rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr2-change-badge {
          padding: 0.15rem 0.4rem !important;
          font-size: 0.55rem !important;
          border-radius: 8px !important;
        }

        .mr2-btn-view {
          padding: 0.3rem 0.5rem !important;
          font-size: 0.6rem !important;
          border-radius: 3px !important;
        }

        /* MR2 Version selector panel - compact */
        .mr2-version-selector-panel {
          padding: 0.5rem !important;
          max-height: 150px !important;
          margin-bottom: 0.5rem !important;
        }

        .mr2-version-selector-panel h3 {
          font-size: 0.7rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr2-version-item {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        .mr2-version-num {
          font-size: 0.6rem !important;
        }

        .mr2-version-time {
          font-size: 0.55rem !important;
        }

        .mr2-version-confidence {
          padding: 0.15rem 0.3rem !important;
          font-size: 0.55rem !important;
        }

        /* MR2 Metrics - compact grid */
        .mr2-metrics-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 0.5rem !important;
          margin-bottom: 0.75rem !important;
        }

        .mr2-metric-card {
          padding: 0.5rem !important;
        }

        .mr2-metric-label {
          font-size: 0.55rem !important;
          margin-bottom: 0.25rem !important;
        }

        .mr2-metric-value {
          font-size: 1rem !important;
        }

        /* MR2 Diff view - compact */
        .mr2-diff-stats {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 0.5rem !important;
          margin-bottom: 0.75rem !important;
        }

        .mr2-stat {
          padding: 0.5rem !important;
        }

        .mr2-stat-label {
          font-size: 0.55rem !important;
          margin-bottom: 0.25rem !important;
        }

        .mr2-stat-value {
          font-size: 0.9rem !important;
        }

        .mr2-diff-item {
          padding: 0.5rem !important;
          gap: 0.5rem !important;
        }

        .mr2-diff-type-badge {
          font-size: 0.5rem !important;
          padding: 0.15rem 0.3rem !important;
        }

        .mr2-diff-content {
          font-size: 0.6rem !important;
        }

        .mr2-diff-text {
          padding: 0.3rem !important;
          font-size: 0.6rem !important;
        }

        /* MR2 Export buttons - compact */
        .mr2-actions {
          gap: 0.35rem !important;
        }

        .mr2-btn-export {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.6rem !important;
          border-radius: 4px !important;
        }

        /* MR2 Comparison view - stack vertically */
        .mr2-comparison-header,
        .mr2-comparison-content {
          grid-template-columns: 1fr !important;
          gap: 0.5rem !important;
        }

        .mr2-comparison-side {
          padding: 0.5rem !important;
        }

        .mr2-comparison-text {
          max-height: 150px !important;
          font-size: 0.6rem !important;
        }

        /* MR1 Task Decomposition - Compact Sidebar Styles */
        .mr1-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr1-header {
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.5rem !important;
          text-align: left !important;
        }

        .mr1-title {
          font-size: 0.85rem !important;
          margin-bottom: 0.25rem !important;
        }

        .mr1-subtitle {
          font-size: 0.65rem !important;
        }

        .mr1-progress-bar {
          margin-bottom: 0.75rem !important;
          padding-bottom: 0.75rem !important;
          gap: 0.25rem !important;
        }

        .mr1-progress-item {
          height: 3px !important;
        }

        .mr1-step-label {
          font-size: 0.5rem !important;
          top: 6px !important;
        }

        .mr1-step h2 {
          font-size: 0.75rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr1-task-input {
          height: 80px !important;
          padding: 0.5rem !important;
          font-size: 0.65rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr1-subtask-list {
          gap: 0.35rem !important;
        }

        .mr1-subtask-item {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        .mr1-btn, .mr1-btn-primary, .mr1-btn-secondary {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.6rem !important;
        }

        /* MR3 Human Agency Control - Compact Sidebar Styles */
        .mr3-container {
          padding: 0.5rem !important;
          gap: 0.5rem !important;
        }

        .mr3-header {
          padding-bottom: 0.35rem !important;
          gap: 0.5rem !important;
        }

        .mr3-title {
          font-size: 0.8rem !important;
        }

        .mr3-panel {
          gap: 0.75rem !important;
        }

        .mr3-intervention-control {
          gap: 0.5rem !important;
        }

        .mr3-level-option {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        .mr3-suggestion-card {
          padding: 0.5rem !important;
        }

        .mr3-suggestion-title {
          font-size: 0.7rem !important;
        }

        .mr3-suggestion-text {
          font-size: 0.6rem !important;
        }

        /* MR4 Role Definition - Compact Sidebar Styles */
        .mr4-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr4-header {
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }

        .mr4-title {
          font-size: 0.85rem !important;
        }

        .mr4-role-grid {
          grid-template-columns: 1fr !important;
          gap: 0.5rem !important;
        }

        .mr4-role-card {
          padding: 0.5rem !important;
        }

        .mr4-role-name {
          font-size: 0.7rem !important;
        }

        .mr4-role-description {
          font-size: 0.6rem !important;
        }

        /* MR5 Low-Cost Iteration - Compact Sidebar Styles */
        .mr5-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr5-header {
          margin-bottom: 0.5rem !important;
        }

        .mr5-title {
          font-size: 0.85rem !important;
        }

        .mr5-branch-list {
          gap: 0.35rem !important;
        }

        .mr5-branch-item {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        .mr5-btn {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.6rem !important;
        }

        /* MR6 Cross-Model Experimentation - Compact Sidebar Styles */
        .mr6-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr6-header {
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }

        .mr6-title {
          font-size: 0.85rem !important;
        }

        .mr6-subtitle {
          font-size: 0.65rem !important;
        }

        .mr6-layout {
          display: block !important;
          grid-template-columns: 1fr !important;
        }

        .mr6-controls {
          padding: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr6-textarea {
          font-size: 0.6rem !important;
          padding: 0.4rem !important;
        }

        .mr6-label {
          font-size: 0.7rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr6-model-checkbox, .mr6-metric-checkbox {
          font-size: 0.6rem !important;
          gap: 0.4rem !important;
        }

        .mr6-results {
          padding: 0.5rem !important;
        }

        .mr6-result-card {
          padding: 0.5rem !important;
        }

        /* MR7 Failure Tolerance - Compact Sidebar Styles */
        .mr7-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr7-header {
          margin-bottom: 0.5rem !important;
        }

        .mr7-title {
          font-size: 0.85rem !important;
        }

        .mr7-log-list {
          gap: 0.35rem !important;
        }

        .mr7-log-item {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        /* MR10 Cost-Benefit Analysis - Compact Sidebar Styles */
        .mr10-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr10-header {
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }

        .mr10-title {
          font-size: 0.85rem !important;
        }

        .mr10-subtitle {
          font-size: 0.65rem !important;
        }

        .mr10-tabs {
          gap: 0.25rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr10-tab {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.6rem !important;
        }

        .mr10-form-group {
          margin-bottom: 0.5rem !important;
        }

        .mr10-input, .mr10-select, .mr10-textarea {
          padding: 0.35rem !important;
          font-size: 0.6rem !important;
        }

        .mr10-result-card {
          padding: 0.5rem !important;
        }

        .mr10-chart {
          height: 150px !important;
        }

        /* MR11 Integrated Verification - Compact Sidebar Styles */
        .mr11-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr11-header {
          margin-bottom: 0.5rem !important;
        }

        .mr11-title {
          font-size: 0.85rem !important;
        }

        .mr11-log-list {
          gap: 0.35rem !important;
        }

        .mr11-log-item {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        .mr11-btn {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.6rem !important;
        }

        /* MR12 Critical Thinking - Compact Sidebar Styles */
        .mr12-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr12-header {
          margin-bottom: 0.5rem !important;
        }

        .mr12-title {
          font-size: 0.85rem !important;
        }

        .mr12-question-list {
          gap: 0.35rem !important;
        }

        .mr12-question-item {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        /* MR13 Transparent Uncertainty - Compact Sidebar Styles */
        .mr13-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr13-header {
          margin-bottom: 0.5rem !important;
        }

        .mr13-title {
          font-size: 0.85rem !important;
        }

        .mr13-confidence-bar {
          height: 8px !important;
        }

        .mr13-uncertainty-item {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        /* MR13 Analyze Response - vertical layout */
        .mr13-analyze {
          grid-template-columns: 1fr !important;
          gap: 0.75rem !important;
        }

        .mr13-form {
          padding: 0.5rem !important;
          gap: 0.5rem !important;
        }

        .mr13-form-group {
          gap: 0.25rem !important;
        }

        .mr13-label {
          font-size: 0.65rem !important;
        }

        .mr13-textarea, .mr13-select {
          padding: 0.4rem !important;
          font-size: 0.6rem !important;
        }

        .mr13-analyze-btn {
          padding: 0.4rem 0.75rem !important;
          font-size: 0.6rem !important;
        }

        .mr13-tips {
          padding: 0.5rem !important;
        }

        .mr13-tips h3 {
          font-size: 0.7rem !important;
          margin-bottom: 0.4rem !important;
        }

        .mr13-tips ul {
          gap: 0.35rem !important;
          padding-left: 1rem !important;
        }

        .mr13-tips li {
          font-size: 0.55rem !important;
        }

        /* MR13 Results grid - vertical */
        .mr13-results-grid {
          grid-template-columns: 1fr !important;
          gap: 0.5rem !important;
        }

        .mr13-result-card {
          padding: 0.5rem !important;
        }

        .mr13-result-header {
          margin-bottom: 0.35rem !important;
        }

        .mr13-result-title {
          font-size: 0.7rem !important;
        }

        .mr13-result-content {
          font-size: 0.6rem !important;
        }

        /* MR13 Tabs */
        .mr13-tabs {
          gap: 0.25rem !important;
          margin-bottom: 0.5rem !important;
        }

        .mr13-tab {
          padding: 0.35rem 0.5rem !important;
          font-size: 0.6rem !important;
        }

        /* MR13 Metrics grid */
        .mr13-metrics-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 0.35rem !important;
        }

        .mr13-metric-card {
          padding: 0.4rem !important;
        }

        .mr13-metric-value {
          font-size: 0.9rem !important;
        }

        .mr13-metric-label {
          font-size: 0.5rem !important;
        }

        /* MR14 Guided Reflection - Compact Sidebar Styles */
        .mr14-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr14-header {
          margin-bottom: 0.5rem !important;
        }

        .mr14-title {
          font-size: 0.85rem !important;
        }

        .mr14-prompt-card {
          padding: 0.5rem !important;
        }

        .mr14-prompt-text {
          font-size: 0.6rem !important;
        }

        .mr14-response-input {
          font-size: 0.6rem !important;
          padding: 0.4rem !important;
        }

        /* MR15 Metacognitive Strategy - Compact Sidebar Styles */
        .mr15-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr15-header {
          margin-bottom: 0.5rem !important;
        }

        .mr15-title {
          font-size: 0.85rem !important;
        }

        .mr15-strategy-list {
          gap: 0.35rem !important;
        }

        .mr15-strategy-card {
          padding: 0.4rem !important;
        }

        .mr15-strategy-name {
          font-size: 0.7rem !important;
        }

        .mr15-strategy-description {
          font-size: 0.6rem !important;
        }

        /* MR16 Skill Atrophy Prevention - Compact Sidebar Styles */
        .mr16-container {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr16-header {
          margin-bottom: 0.5rem !important;
        }

        .mr16-title {
          font-size: 0.85rem !important;
        }

        .mr16-skill-grid {
          grid-template-columns: 1fr !important;
          gap: 0.35rem !important;
        }

        .mr16-skill-card {
          padding: 0.4rem !important;
        }

        .mr16-skill-name {
          font-size: 0.7rem !important;
        }

        .mr16-exercise-btn {
          padding: 0.3rem 0.4rem !important;
          font-size: 0.55rem !important;
        }

        /* MR17 Learning Process Visualization - Compact Sidebar Styles */
        .mr17-learning-visualization {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }

        .mr17-header {
          margin-bottom: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }

        .mr17-header h2 {
          font-size: 0.85rem !important;
          margin-bottom: 0.25rem !important;
        }

        .mr17-header p {
          font-size: 0.6rem !important;
        }

        .mr17-container {
          gap: 0.35rem !important;
        }

        .mr17-feedback-banner {
          padding: 0.4rem !important;
          border-left-width: 2px !important;
        }

        .mr17-feedback-banner p {
          font-size: 0.55rem !important;
        }

        .mr17-nav-tabs {
          gap: 0.2rem !important;
          padding-bottom: 0.4rem !important;
          margin-bottom: 0.4rem !important;
        }

        .mr17-nav-tab, .mr17-tab {
          padding: 0.25rem 0.4rem !important;
          font-size: 0.55rem !important;
        }

        /* Key fix: reduce section backgrounds to prevent overlap */
        .mr17-section {
          padding: 0.4rem !important;
          margin-bottom: 0.35rem !important;
          border-radius: 4px !important;
          box-shadow: none !important;
        }

        .mr17-section h3 {
          font-size: 0.7rem !important;
          margin-bottom: 0.3rem !important;
        }

        .mr17-section h4 {
          font-size: 0.65rem !important;
          margin-bottom: 0.25rem !important;
        }

        /* Tab content spacing */
        .mr17-tab-content {
          display: flex !important;
          flex-direction: column !important;
          gap: 0.35rem !important;
        }

        /* Stats grid - compact */
        .mr17-stats {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 0.3rem !important;
        }

        .mr17-stat {
          padding: 0.35rem !important;
          gap: 0.2rem !important;
          border-radius: 4px !important;
        }

        .mr17-stat .label {
          font-size: 0.45rem !important;
        }

        .mr17-stat .value {
          font-size: 0.85rem !important;
        }

        /* Milestones - compact */
        .mr17-milestones-list {
          grid-template-columns: 1fr !important;
          gap: 0.3rem !important;
        }

        .mr17-milestone {
          padding: 0.35rem !important;
          border-left-width: 2px !important;
          border-radius: 4px !important;
        }

        .mr17-milestone-title {
          font-size: 0.6rem !important;
        }

        .mr17-milestone-date {
          font-size: 0.5rem !important;
        }

        .mr17-chart-container {
          height: 100px !important;
        }

        .mr17-metric-card {
          padding: 0.35rem !important;
        }

        .mr17-metric-value {
          font-size: 0.9rem !important;
        }

        .mr17-metric-label {
          font-size: 0.5rem !important;
        }

        .mr17-skill-item {
          padding: 0.3rem !important;
          font-size: 0.55rem !important;
        }

        .mr17-progress-bar {
          height: 4px !important;
        }

        /* Empty state - compact */
        .mr17-empty-state, .mr17-empty-message {
          padding: 0.75rem !important;
          font-size: 0.55rem !important;
        }

        /* Knowledge graph section */
        .mr17-graph-container {
          height: 120px !important;
          margin-bottom: 0.3rem !important;
        }

        /* Skills list */
        .mr17-skills-grid {
          grid-template-columns: 1fr !important;
          gap: 0.25rem !important;
        }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Phase 3: SessionSidebar Component */}
      <SessionSidebar
        isOpen={sessionSidebarOpen}
        onClose={() => setSessionSidebarOpen(false)}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        currentSessionId={sessionId}
        onSessionClick={(id) => {
          navigate(`/session/${id}`);
          setSessionSidebarOpen(false);
        }}
        onDeleteSession={deleteSession}
        onNewChat={handleNewChat}
        hoveredSessionId={hoveredSessionId}
        onHoverSession={setHoveredSessionId}
      />


      {/* Main Content Container - 3 Column Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          padding: '1.5rem',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <button
              onClick={() => setSessionSidebarOpen(true)}
              aria-label="Open conversations sidebar"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: '#6b7280',
                padding: '0',
                display: sessionSidebarOpen ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Open sidebar"
            >
              ☰
            </button>
            <div>
              {(() => {
                // Get first user message to detect type
                const firstUserMessage = messages.find(m => m.role === 'user');
                const autoType = firstUserMessage ? detectTaskType(firstUserMessage.content) : null;
                const typeInfo = autoType ? TASK_TYPE_LABELS[autoType] : null;

                // Display title: AI-generated > loading indicator > 'New Chat'
                const displayTitle = aiGeneratedTitle || (titleGenerating ? 'Generating title...' : 'New Chat');

                return (
                  <>
                    {isEditingTitle ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle();
                            if (e.key === 'Escape') setIsEditingTitle(false);
                          }}
                          autoFocus
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            border: '1px solid #3b82f6',
                            borderRadius: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            width: '200px',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={saveTitle}
                          disabled={savingTitle || !editedTitle.trim()}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: savingTitle ? 'wait' : 'pointer',
                          }}
                        >
                          {savingTitle ? '...' : '✓'}
                        </button>
                        <button
                          onClick={() => setIsEditingTitle(false)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: '#6b7280',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <h1
                        onClick={() => {
                          setEditedTitle(aiGeneratedTitle || '');
                          setIsEditingTitle(true);
                        }}
                        style={{
                          margin: '0',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          cursor: 'pointer',
                        }}
                        title="Click to edit title"
                      >
                        {displayTitle}
                      </h1>
                    )}
                    {typeInfo && !isEditingTitle && (
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                        {typeInfo.icon} {typeInfo.label}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', paddingRight: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
              <button
                data-tour="mr-tools-btn"
                onClick={() => {
                  setShowPatternPanel(!showPatternPanel);
                  if (!showPatternPanel) setShowMRToolsSection(true);
                }}
                aria-label="Open MR tools panel"
                title="Metacognitive collaboration tools"
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: showPatternPanel ? '#fef3c7' : '#f3f4f6',
                  color: showPatternPanel ? '#92400e' : '#6b7280',
                  border: showPatternPanel ? '1px solid #fcd34d' : '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = showPatternPanel ? '#fcd34d' : '#e5e7eb';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = showPatternPanel ? '#fef3c7' : '#f3f4f6';
                }}
              >
                🧠 MR Tools
              </button>
            </div>

            {/* Main Actions */}
            <button
              data-tour="end-reflect-btn"
              onClick={handleEndAndReflect}
              disabled={messages.length === 0}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                opacity: messages.length === 0 ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                if (messages.length > 0) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#d97706';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (messages.length > 0) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f59e0b';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }
              }}
              title="End conversation and reflect on your learning"
            >
              End & Reflect
            </button>
            <button
              onClick={handleNewChat}
              disabled={creatingNewSession}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: creatingNewSession ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                opacity: creatingNewSession ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (!creatingNewSession) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (!creatingNewSession) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }
              }}
              title="Start a new conversation"
            >
              {creatingNewSession ? '⏳ Creating...' : '➕ New Chat'}
            </button>
          </div>
        </header>

        {/* Success Message */}
        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#d1fae5',
              borderBottom: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span>{successMessage}</span>

              {/* Choice buttons for modified content */}
              {showModifiedChoiceUI && (
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <button
                    onClick={openMR5Iteration}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                    title="继续迭代优化 - 尝试不同方向和变体"
                  >
                    🌳 继续迭代 (MR5)
                  </button>

                  <button
                    onClick={openMR2History}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                    title="查看变更历史 - 回顾修改记录和diff"
                  >
                    📊 查看历史 (MR2)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fee2e2',
              borderBottom: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Behavioral Pattern Card */}
        {effectivePatternData && (() => {
          const patternProfile = getPatternProfile(effectivePatternData.pattern);
          const sourceColor = effectivePatternData.source === 'detected' ? '#10b981' : effectivePatternData.source === 'predicted' ? '#f59e0b' : '#6b7280';
          const sourceBgColor = effectivePatternData.source === 'detected' ? '#d1fae5' : effectivePatternData.source === 'predicted' ? '#fef3c7' : '#f3f4f6';

          return (
            <div style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: sourceBgColor,
              borderBottom: `2px solid ${patternProfile.color}`,
              borderTop: `1px solid ${patternProfile.color}30`,
            }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{
                    fontSize: '1.5rem',
                    width: '2.5rem',
                    height: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${patternProfile.color}20`,
                    borderRadius: '50%',
                  }}>
                    {patternProfile.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                        Your AI Usage Pattern
                      </span>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: patternProfile.color,
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                      }}>
                        Pattern {patternProfile.pattern}
                      </span>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: sourceColor,
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                      }}>
                        {effectivePatternData.source === 'detected' ? '🎯 Detected' : effectivePatternData.source === 'predicted' ? '🔮 Predicted' : '📋 Default'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: patternProfile.color }}>
                      {patternProfile.nameCN}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                      {patternProfile.descriptionCN}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: patternProfile.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title="View detailed analysis and recommendations"
                >
                  View Details →
                </button>
              </div>
            </div>
          );
        })()}

        {/* Pattern Detection Banner - compact single row, only show when confidence > 30% */}
        {showPattern && pattern && pattern.confidence > 0.3 && (
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f0f9ff',
            borderBottom: `2px solid ${getPatternColor(pattern.pattern || pattern.detectedPattern)}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.8125rem',
          }}>
            <div style={{
              width: '1.75rem',
              height: '1.75rem',
              backgroundColor: getPatternColor(pattern.pattern || pattern.detectedPattern),
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: '700',
              flexShrink: 0,
            }}>
              {pattern.pattern || pattern.detectedPattern}
            </div>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {getPatternLabel(pattern.pattern || pattern.detectedPattern)}
            </span>
            <span style={{ color: '#6b7280' }}>
              📊 {(pattern.confidence * 100).toFixed(0)}%
            </span>
            {pattern.stability !== undefined && pattern.stability > 0.5 && (
              <span style={{ color: pattern.stability >= 0.7 ? '#10b981' : '#f59e0b' }}>
                {pattern.stability >= 0.7 ? '✓' : '⚠'} {(pattern.stability * 100).toFixed(0)}%
              </span>
            )}
            <button
              onClick={() => setShowPattern(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0',
              }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Center + Right Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Center - Messages Area */}
          <div style={{
          flex: 1,
          overflowY: 'hidden', // Let VirtualizedMessageList handle scrolling
          padding: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Personalized Tips Banner */}
          {latestAssessment && latestAssessment.responses && showPersonalizedTips && (() => {
            const dimensions = latestAssessment.responses.dimensions;
            if (!dimensions) return null;

            // Find weakest dimension
            const sortedDimensions = Object.entries(dimensions)
              .map(([name, data]: [string, any]) => ({ name, score: data.score }))
              .sort((a, b) => a.score - b.score);

            const weakestDimension = sortedDimensions[0];
            if (weakestDimension.score >= 0.6) return null; // Only show if score < 60

            // Tips mapping based on dimension
            const tips: Record<string, { icon: string; color: string; tips: string[] }> = {
              planning: {
                icon: '📐',
                color: '#3b82f6',
                tips: [
                  'Break down complex tasks into smaller steps before asking AI',
                  'Define clear goals for each conversation session',
                  'Consider using the Task Decomposition tool for complex problems',
                ]
              },
              monitoring: {
                icon: '👁️',
                color: '#10b981',
                tips: [
                  'Review AI outputs carefully before accepting them',
                  'Track how your understanding evolves during the conversation',
                  'Use the verification features to check AI responses',
                ]
              },
              evaluation: {
                icon: '⚖️',
                color: '#f59e0b',
                tips: [
                  'Critically assess AI suggestions before implementing them',
                  'Consider alternative approaches to problems',
                  'Ask yourself: "Does this solution make sense?"',
                ]
              },
              regulation: {
                icon: '🔄',
                color: '#ec4899',
                tips: [
                  "Adjust your approach if AI responses aren't helpful",
                  'Know when to rely on AI vs. your own expertise',
                  'Be aware of over-dependence on AI assistance',
                ]
              },
            };

            const tipData = tips[weakestDimension.name];
            if (!tipData) return null;

            // Randomly select one tip
            const randomTip = tipData.tips[Math.floor(Math.random() * tipData.tips.length)];

            return (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem 1.25rem',
                backgroundColor: `${tipData.color}10`,
                border: `2px solid ${tipData.color}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                position: 'relative',
              }}>
                <div style={{
                  fontSize: '2rem',
                  lineHeight: 1,
                }}>
                  {tipData.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: tipData.color,
                    marginBottom: '0.5rem',
                    textTransform: 'capitalize',
                  }}>
                    💡 Tip to improve your {weakestDimension.name} skills
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    lineHeight: '1.5',
                  }}>
                    {randomTip}
                  </div>
                </div>
                <button
                  onClick={() => setShowPersonalizedTips(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    color: '#9ca3af',
                    padding: '0',
                    lineHeight: 1,
                  }}
                  title="Dismiss tip"
                >
                  ×
                </button>
              </div>
            );
          })()}

          {messages.length === 0 && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <EmptyState
                icon="💬"
                title="Start your conversation"
                description="Ask a question or describe your task to get AI assistance"
              />
            </div>
          )}

          {/* Phase 2 Refactoring: MessageList Component */}
          {messages.length > 0 && (
            <div
              ref={virtualizedListRef as any}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <MessageList
                messages={messages}
                editingMessageId={editingMessageId}
                editedContent={editedContent}
                updatingMessageId={updatingMessageId}
                onEditContentChange={setEditedContent}
                onSaveEdit={saveEditedMessage}
                onCancelEdit={cancelEditingMessage}
                onVerify={handleVerifyClick}
                onModify={markAsModified}
                onBranchSwitch={handleBranchSwitch}
                onBranchDelete={handleDeleteBranch}
                onBranchSetAsMain={handleSetBranchAsMain}
                showTrustIndicator={showTrustIndicator}
                messageTrustScores={messageTrustScores}
                getTrustBadge={getTrustBadge}
                orchestrateForMessage={orchestrateForMessage}
                onTrustRecommendationClick={handleTrustRecommendationClick}
                reflectedMessages={reflectedMessages}
                showQuickReflection={showQuickReflection}
                onExpandQuickReflection={setShowQuickReflection}
                onQuickReflectionRespond={handleQuickReflection}
                shouldSuggestMR6={shouldSuggestMR6}
                showMR6Suggestion={showMR6Suggestion}
                onExpandMR6Suggestion={setShowMR6Suggestion}
                onMR6SuggestionAccept={(id) => handleMR6Suggestion(id, 'accept')}
                onMR6SuggestionDismiss={(id) => handleMR6Suggestion(id, 'dismiss')}
                hasMoreMessages={hasMoreMessages}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMoreMessages}
              />
            </div>
          )}

          {loading && messages.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              padding: '1.5rem 0.5rem',
              animation: 'fadeIn 0.3s ease-in-out',
            }}>
              <div style={{
                maxWidth: '65%',
                padding: '1rem',
                borderRadius: '1rem 1rem 1rem 0.25rem',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                borderLeft: '3px solid #3b82f6',
              }}>
                <SkeletonText lines={3} className="mb-2" />
              </div>
            </div>
          )}
          </div>

          {/* Right Sidebar - Week 1-4: Intervention Manager & Monitoring Dashboard */}
          {showPatternPanel && (
            <div style={{
              width: '380px',
              minWidth: '380px',
              maxWidth: '380px',
              borderLeft: '1px solid #e2e8f0',
              overflowY: 'scroll',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f9fafb',
              height: '100%',
            }}>
              {/* Sidebar Header with Close Button */}
              <div style={{
                padding: '0.75rem',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                }}>
                  Analysis Panel
                </h3>
                <button
                  onClick={() => setShowPatternPanel(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: '#9ca3af',
                    padding: '0.25rem',
                  }}
                  title="Close sidebar"
                >
                  ✕
                </button>
              </div>

              {/* Phase 3: MRToolsPanel Component */}
              <MRToolsPanel
                activeMRTool={activeMRTool}
                onToolChange={setActiveMRTool}
                showMRToolsSection={showMRToolsSection}
                onToggleMRToolsSection={() => setShowMRToolsSection(!showMRToolsSection)}
                renderActiveTool={renderActiveMRTool}
              />

              {/* Sidebar MRs - Recommendations */}
              {activeMRs && activeMRs.some((mr) => mr.displayMode === 'sidebar') && (
                <div style={{
                  padding: '1rem',
                  borderTop: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    💡 Recommendations
                  </h3>
                  {activeMRs
                    .filter((mr) => mr.displayMode === 'sidebar' && !dismissedMRs.has(mr.mrId))
                    .map((mr) => (
                      <div key={mr.mrId} style={{ marginBottom: '0.75rem' }}>
                        <Suspense fallback={<ComponentLoader />}>
                          <MRDisplay
                            mr={mr}
                            onClose={() => setDismissedMRs((prev) => new Set([...prev, mr.mrId]))}
                          />
                        </Suspense>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <footer style={{
          padding: '1.5rem',
          backgroundColor: '#fff',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.05)',
        }}>
          <form
            onSubmit={handleSendMessage}
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              gap: '0.75rem',
            }}
          >
            <input
              data-tour="chat-input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question or describe your task..."
              disabled={!sessionActive || loading}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                opacity: !sessionActive || loading ? 0.5 : 1,
                transition: 'border-color 0.2s',
                outline: 'none',
                boxShadow: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={!sessionActive || loading || !userInput.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: !sessionActive || loading || !userInput.trim() ? '#d1d5db' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: !sessionActive || loading || !userInput.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s',
                minWidth: '80px',
              }}
              onMouseOver={(e) => {
                if (!(!sessionActive || loading || !userInput.trim())) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb';
                }
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6';
              }}
            >
              {loading ? '⏳' : '📤'} Send
            </button>
          </form>
        </footer>
      </div>

      {/* Modal MR Display - OPTIMIZATION: Lazy-loaded component */}
      {displayedModalMR && (
        <Suspense fallback={<ComponentLoader />}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`mr-modal-${displayedModalMR.mrId}`}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2001,
            }}
          >
            <div id={`mr-modal-${displayedModalMR.mrId}`} style={{ display: 'none' }}>
              {displayedModalMR.title || 'Recommendation'}
            </div>
            <MRDisplay
              mr={displayedModalMR}
              onClose={() => setDismissedMRs((prev) => new Set([...prev, displayedModalMR.mrId]))}
              onAcknowledge={() => {
                setDismissedMRs((prev) => new Set([...prev, displayedModalMR.mrId]));
              }}
            />
          </div>
        </Suspense>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      {/* Phase 3: GlobalRecommendationPanel Component */}
      <GlobalRecommendationPanel
        recommendations={mrRecommendations}
        welcomeMessage={recommendationsHook.welcomeMessage}
        behaviorPattern={recommendationsHook.behaviorPattern}
        sessionPhase={recommendationsHook.sessionPhase}
        isVisible={showRecommendationPanel}
        onClose={() => setShowRecommendationPanel(false)}
        expandedRecommendation={expandedRecommendation}
        onToggleExpanded={(id) => setExpandedRecommendation(expandedRecommendation === id ? null : id)}
        onActivateRecommendation={(id) => activateRecommendation(id, setActiveMRTool)}
        onDismissRecommendation={dismissRecommendation}
        verifiedCount={recommendationsHook.verifiedCount}
        modifiedCount={recommendationsHook.modifiedCount}
        totalMessages={messagesHook.messages.length}
      />

      `}</style>
    </div>
    </>
  );
};

export default ChatSessionPage;
