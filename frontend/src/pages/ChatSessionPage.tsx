import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import { useMCAOrchestrator, ActiveMR } from '../components/chat/MCAConversationOrchestrator';
// import VirtualizedMessageList from '../components/VirtualizedMessageList';
// DISABLED: react-window compatibility issue - using simple list instead
import EmptyState, { EmptyStateError } from '../components/EmptyState';
import { SkeletonText, SkeletonCard } from '../components/Skeleton';
import InterventionManager from '../components/interventions/InterventionManager';
import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
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

// Phase 1 Refactoring: Custom Hooks
import { useMessages, type Message, MESSAGES_PER_PAGE } from '../hooks/useMessages';
import { useMRTools, type ActiveMRTool } from '../hooks/useMRTools';
import { useGlobalRecommendations } from '../hooks/useGlobalRecommendations';

// Phase 2 Refactoring: Message Components
import MessageList from '../components/MessageList';
import { type TrustBadge, type MRRecommendation } from '../components/TrustIndicator';
import { type ReflectionResponse } from '../components/QuickReflection';

// Phase 3 Refactoring: Panel Components
import SessionSidebar, { type SessionItem } from '../components/SessionSidebar';
import MRToolsPanel from '../components/MRToolsPanel';
import GlobalRecommendationPanel from '../components/GlobalRecommendationPanel';

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
  const metricsStore = useMetricsStore();
  const [sessionStartTime] = useState(Date.now());

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

  // MCA orchestration states - Use GPT for accurate signal detection and pre-generated MR content
  const { result: mcaResult, activeMRs } = useMCAOrchestrator(sessionId || '', messages, true, 'gpt');
  const [displayedModalMR, setDisplayedModalMR] = useState<ActiveMR | null>(null);
  const [dismissedMRs, setDismissedMRs] = useState<Set<string>>(new Set());

  // MR2 Transparency versions
  const [interactionVersions, setInteractionVersions] = useState<any[]>([]);

  // Independent collapse states for sidebar sections
  const [showInterventionSection, setShowInterventionSection] = useState(false);
  const [showMetricsSection, setShowMetricsSection] = useState(false);

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
        setSessionData(sessionResponse.data.data.session);

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
   * Send user prompt and get AI response - Wrapper for useMessages hook
   * Adds short prompt tracking logic before calling hook's sendMessage
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || !sessionId) return;

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
        ...patternData,
        metrics: {
          aiReliance: Math.floor(Math.random() * 100), // TODO: Replace with actual metrics from API
          verificationScore: Math.floor(Math.random() * 100),
          learningIndex: Math.floor(Math.random() * 100),
        },
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

    const hasMultipleOptions = multiOptionIndicators.filter(
      indicator => content.includes(indicator)
    ).length >= 2;

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

      // Open MR6 with the prompt
      openMR6CrossModel();
      setSuccessMessage('💡 Compare responses from multiple AI models to find the best solution');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [messages, openMR6CrossModel]);

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
        return <MR5LowCostIteration sessionId={sessionId || ''} currentMessages={messages} branches={conversationBranches} onBranchCreate={(b) => setConversationBranches([...conversationBranches, b])} onVariantGenerate={(v) => console.log('Variants:', v)} onOpenMR6={openMR6CrossModel} />;
      case 'mr6-models':
        return <MR6CrossModelExperimentation prompt={userInput || messages[messages.length - 1]?.content || ''} onComparisonComplete={(r) => console.log('Comparison:', r)} />;
      case 'mr7-failure':
        return <MR7FailureToleranceLearning onIterationLogged={(log) => console.log('Learning:', log)} />;
      case 'mr8-recognition':
        return <MR8TaskCharacteristicRecognition onTaskProfileDetected={(p) => console.log('Task Profile:', p)} onOpenMR3={openMR3AgencyControl} onOpenMR5={openMR5Iteration} onOpenMR9={openMR9TrustCalibration} onOpenMR11={openMR11Verification} onOpenMR14={openMR14Reflection} onOpenMR15={openMR15StrategyGuide} />;
      case 'mr10-cost':
        return <MR10CostBenefitAnalysis taskType={sessionData?.taskType || 'general'} onAnalysisComplete={(a) => console.log('Cost-Benefit:', a)} />;
      case 'mr11-verify':
        return <MR11IntegratedVerification existingLogs={verificationLogs} onDecisionMade={(log) => setVerificationLogs([...verificationLogs, log])} />;
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
  }, [activeMRTool, sessionId, messages, interventionLevel, sessionData, conversationBranches, verificationLogs, userInput, user, openMR4RoleDefinition, openMR8TaskRecognition, openMR6CrossModel, openMR3AgencyControl, openMR5Iteration, openMR9TrustCalibration, openMR11Verification, openMR14Reflection, openMR15StrategyGuide, openMR19CapabilityAssessment, openMR17LearningVisualization, openMR16SkillAtrophy, setInterventionLevel, setConversationBranches, setVerificationLogs]);


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
              <h1 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>Chat Session</h1>
              {sessionData && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  📝 {sessionData.taskDescription || 'General Discussion'} • Type: {sessionData.taskType || 'unknown'}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', paddingRight: '0.5rem', borderRight: '1px solid #e5e7eb' }}>
              <button
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

        {/* Pattern Detection Banner */}
        {showPattern && pattern && (
          <div style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#f0f9ff',
            borderBottom: `2px solid ${getPatternColor(pattern.pattern || pattern.detectedPattern)}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af' }}>
                🎯 Pattern Detected
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: getPatternColor(pattern.pattern || pattern.detectedPattern),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                }}>
                  {pattern.pattern || pattern.detectedPattern}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0', fontWeight: '600', color: '#1f2937' }}>
                    {getPatternLabel(pattern.pattern || pattern.detectedPattern)}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Confidence: {(pattern.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
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
                onVerify={markAsVerified}
                onModify={markAsModified}
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

              {/* Intervention Manager - Collapsible */}
              <div style={{
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#fff',
              }}>
                <button
                  onClick={() => setShowInterventionSection(!showInterventionSection)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}>
                    🔔 Interventions
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    {showInterventionSection ? '▼' : '▶'}
                  </span>
                </button>
                {showInterventionSection && (
                  <div style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
                    <InterventionManager
                      sessionId={sessionId || ''}
                      messages={messages}
                      minMessagesForDetection={3}
                      activeMRs={activeMRs}
                      onInterventionDisplayed={(tier, mrType) => {
                        console.log(`✅ Intervention displayed: ${tier} (${mrType})`);
                        // Auto-expand intervention section when intervention is shown
                        setShowInterventionSection(true);
                      }}
                      onUserAction={(mrType, action) => {
                        console.log(`📊 User action: ${action} on ${mrType}`);
                        // Open corresponding MR tool when user clicks "View Details" or "Learn More"
                        if (action === 'learn_more' || action === 'acted') {
                          // Comprehensive mapping for all MR types (handles various naming formats)
                          const mrToolMap: Record<string, ActiveMRTool> = {
                            // Pattern-based interventions
                            'MR13_Uncertainty': 'mr13-uncertainty',
                            'MR18_OverDependence': 'mr17-visualization',
                            'MR_PATTERN_F_BARRIER': 'mr14-reflection',
                            // Backend MR IDs (both simple and descriptive formats)
                            'MR1': 'mr1-decomposition', 'MR1_TaskDecomposition': 'mr1-decomposition',
                            'MR2': 'mr2-transparency', 'MR2_ProcessTransparency': 'mr2-transparency',
                            'MR3': 'mr3-agency', 'MR3_HumanAgency': 'mr3-agency',
                            'MR4': 'mr4-roles', 'MR4_RoleDefinition': 'mr4-roles',
                            'MR5': 'mr5-iteration', 'MR5_LowCostIteration': 'mr5-iteration',
                            'MR6': 'mr6-models', 'MR6_CrossModel': 'mr6-models',
                            'MR7': 'mr7-failure', 'MR7_FailureTolerance': 'mr7-failure',
                            'MR10': 'mr10-cost', 'MR10_CostBenefit': 'mr10-cost',
                            'MR11': 'mr11-verify', 'MR11_IntegratedVerification': 'mr11-verify',
                            'MR12': 'mr12-critical', 'MR12_CriticalThinking': 'mr12-critical',
                            'MR13': 'mr13-uncertainty', 'MR13_TransparentUncertainty': 'mr13-uncertainty',
                            'MR14': 'mr14-reflection', 'MR14_GuidedReflection': 'mr14-reflection',
                            'MR15': 'mr15-strategies', 'MR15_MetacognitiveStrategy': 'mr15-strategies',
                            'MR16': 'mr16-atrophy', 'MR16_SkillAtrophy': 'mr16-atrophy',
                            'MR17': 'mr17-visualization', 'MR17_LearningVisualization': 'mr17-visualization',
                          };

                          let tool = mrToolMap[mrType];

                          // Fallback: try to extract MR number from string
                          if (!tool) {
                            const match = mrType.match(/MR(\d+)/);
                            if (match) {
                              tool = mrToolMap[`MR${match[1]}`];
                            }
                          }

                          if (tool) {
                            setActiveMRTool(tool);
                            setShowPatternPanel(true);
                            setShowMRToolsSection(true);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Monitoring Dashboard - Collapsible */}
              <div style={{
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#fff',
              }}>
                <button
                  onClick={() => setShowMetricsSection(!showMetricsSection)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}>
                    📊 System Metrics
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    {showMetricsSection ? '▼' : '▶'}
                  </span>
                </button>
                {showMetricsSection && (
                  <div style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
                    <MonitoringDashboard
                      sessionId={sessionId}
                      refreshIntervalMs={5000}
                      showAlerts={true}
                      compactMode={true}
                    />
                  </div>
                )}
              </div>

              {/* Sidebar MRs - Keep existing recommendations */}
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
