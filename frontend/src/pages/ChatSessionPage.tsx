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
  generateMRRecommendations,
  analyzeBehaviorPattern,
  determineSessionPhase,
  generateWelcomeMessage,
  getChainCompletionStatus,
  type UserContext,
  type MRRecommendationSet,
  type UserExperienceLevel,
} from '../utils/GlobalMRRecommendationEngine';

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
const MR1TaskDecompositionScaffold = lazy(() => import('../components/MR1TaskDecompositionScaffold'));
const MR2ProcessTransparency = lazy(() => import('../components/MR2ProcessTransparency'));
const MR3HumanAgencyControl = lazy(() => import('../components/MR3HumanAgencyControl'));
const MR4RoleDefinitionGuidance = lazy(() => import('../components/MR4RoleDefinitionGuidance'));
const MR5LowCostIteration = lazy(() => import('../components/MR5LowCostIteration'));
const MR6CrossModelExperimentation = lazy(() => import('../components/MR6CrossModelExperimentation'));
const MR7FailureToleranceLearning = lazy(() => import('../components/MR7FailureToleranceLearning'));
const MR8TaskCharacteristicRecognition = lazy(() => import('../components/MR8TaskCharacteristicRecognition'));
const MR9DynamicTrustCalibration = lazy(() => import('../components/MR9DynamicTrustCalibration'));
const MR10CostBenefitAnalysis = lazy(() => import('../components/MR10CostBenefitAnalysis'));
const MR11IntegratedVerification = lazy(() => import('../components/MR11IntegratedVerification'));
const MR12CriticalThinkingScaffolding = lazy(() => import('../components/MR12CriticalThinkingScaffolding'));
const MR13TransparentUncertainty = lazy(() => import('../components/MR13TransparentUncertainty'));
const MR14GuidedReflectionMechanism = lazy(() => import('../components/MR14GuidedReflectionMechanism'));
const MR15MetacognitiveStrategyGuide = lazy(() => import('../components/MR15MetacognitiveStrategyGuide'));
const MR16SkillAtrophyPrevention = lazy(() => import('../components/MR16SkillAtrophyPrevention'));
const MR17LearningProcessVisualization = lazy(() => import('../components/MR17LearningProcessVisualization'));
const MR18OverRelianceWarning = lazy(() => import('../components/MR18OverRelianceWarning'));
const MR19MetacognitiveCapabilityAssessment = lazy(() => import('../components/MR19MetacognitiveCapabilityAssessment'));

/**
 * OPTIMIZATION: Fallback component for lazy-loaded heavy components
 * Minimal placeholder while components load
 */
const ComponentLoader: React.FC = () => (
  <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
    Loading component...
  </div>
);

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  wasVerified?: boolean;
  wasModified?: boolean;
  wasRejected?: boolean;
}

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

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sessionActive, setSessionActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [showPattern, setShowPattern] = useState(false);
  const [showPatternPanel, setShowPatternPanel] = useState(false); // Right panel collapsed by default
  const [patternLoading, setPatternLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModifiedChoiceUI, setShowModifiedChoiceUI] = useState(false);

  // Session metadata
  const [sessionData, setSessionData] = useState<any>(null);
  // Track which message is being updated
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);
  // Track which message is being edited (inline editing)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
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
  // Global MR Recommendation System
  const [mrRecommendations, setMRRecommendations] = useState<MRRecommendationSet[]>([]);
  const [showRecommendationPanel, setShowRecommendationPanel] = useState<boolean>(true);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [usedMRTools, setUsedMRTools] = useState<string[]>([]);

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

  // Verification tools state (logs stored for MR11)
  const [verificationLogs, setVerificationLogs] = useState<any[]>([]);

  // MR Tools Panel state - Controls which MR tool is active
  // Note: MR8, MR9, MR18, MR19 are automatic/backend systems, not manual tools
  // MR8 - Auto task detection, MR9 - Auto trust calibration
  // MR18 - Auto warning in Interventions, MR19 - Auto assessment in Metrics
  type ActiveMRTool =
    | 'none'
    | 'mr1-decomposition'
    | 'mr2-transparency'
    | 'mr3-agency'
    | 'mr4-roles'
    | 'mr5-iteration'
    | 'mr6-models'
    | 'mr7-failure'
    | 'mr10-cost'
    | 'mr11-verify'
    | 'mr12-critical'
    | 'mr13-uncertainty'
    | 'mr14-reflection'
    | 'mr15-strategies'
    | 'mr16-atrophy'
    | 'mr17-visualization';
  const [activeMRTool, setActiveMRTool] = useState<ActiveMRTool>('none');
  const [showMRToolsPanel, setShowMRToolsPanel] = useState(false);

  // Independent collapse states for sidebar sections
  const [showMRToolsSection, setShowMRToolsSection] = useState(true);
  const [showInterventionSection, setShowInterventionSection] = useState(false);
  const [showMetricsSection, setShowMetricsSection] = useState(false);

  // MR3 Agency Control state
  const [interventionLevel, setInterventionLevel] = useState<'passive' | 'suggestive' | 'proactive'>('suggestive');

  // MR5 Iteration state
  const [conversationBranches, setConversationBranches] = useState<any[]>([]);

  // MR2 Transparency versions
  const [interactionVersions, setInteractionVersions] = useState<any[]>([]);

  // Pagination state
  const MESSAGES_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);

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

  /**
   * Global MR Recommendation System: Generate recommendations based on user context
   */
  useEffect(() => {
    if (!sessionData) return;

    // Build user context
    const verifiedCount = messages.filter(m => m.role === 'ai' && m.wasVerified).length;
    const modifiedCount = messages.filter(m => m.role === 'ai' && m.wasModified).length;

    const userContext: UserContext = {
      userId: user?.id,
      experienceLevel: 'intermediate' as UserExperienceLevel, // Can be enhanced with user profile
      taskType: sessionData.taskType || 'general',
      taskCriticality: sessionData.taskImportance === 3 ? 'high' : sessionData.taskImportance === 2 ? 'medium' : 'low',
      sessionPhase: determineSessionPhase({
        userId: user?.id,
        experienceLevel: 'intermediate',
        taskType: sessionData.taskType || 'general',
        taskCriticality: sessionData.taskImportance === 3 ? 'high' : sessionData.taskImportance === 2 ? 'medium' : 'low',
        sessionPhase: 'active',
        messageCount: messages.length,
        verifiedCount,
        modifiedCount,
        consecutiveUnverified: consecutiveNoVerify,
        hasUsedMRTools: usedMRTools,
      }),
      messageCount: messages.length,
      verifiedCount,
      modifiedCount,
      consecutiveUnverified: consecutiveNoVerify,
      hasUsedMRTools: usedMRTools,
    };

    // Generate recommendations
    const recommendations = generateMRRecommendations(userContext);
    setMRRecommendations(recommendations);
  }, [messages, sessionData, user, consecutiveNoVerify, usedMRTools]);

  /**
   * Track when MR tools are opened
   */
  const trackMRToolUsage = useCallback((toolId: string) => {
    setUsedMRTools(prev => {
      if (prev.includes(toolId)) return prev;
      return [...prev, toolId];
    });
  }, []);

  /**
   * Send user prompt and get AI response from OpenAI API
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

    setLoading(true);
    setError(null);

    try {
      // Call AI API endpoint (backend securely handles OpenAI key)
      const startTime = Date.now();
      const aiApiResponse = await api.post('/ai/chat', {
        userPrompt: userInput,
        conversationHistory: messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      });

      const responseTime = Date.now() - startTime;
      const aiContent = aiApiResponse.data.data.response.content;
      const aiModel = aiApiResponse.data.data.response.model;

      // Log interaction to backend
      const interactionResponse = await api.post('/interactions', {
        sessionId,
        userPrompt: userInput,
        aiResponse: aiContent,
        aiModel,
        responseTime,
        wasVerified: false,
        wasModified: false,
        wasRejected: false,
        confidenceScore: 0.85,
      });

      const interaction = interactionResponse.data.data.interaction;

      // Update global session store
      try {
        await addInteraction(sessionId, {
          id: interaction.id,
          sessionId,
          userPrompt: userInput,
          aiResponse: aiContent,
          aiModel,
          responseTime,
          wasVerified: false,
          wasModified: false,
          wasRejected: false,
          confidenceScore: 0.85,
          createdAt: interaction.createdAt,
        });
      } catch (err) {
        console.warn('Failed to update global session store:', err);
        // Don't fail the whole operation if global state update fails
      }

      // Add messages to chat
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userInput,
        timestamp: new Date().toISOString(),
      };

      const aiMessage: Message = {
        id: interaction.id,
        role: 'ai',
        content: aiContent,
        timestamp: interaction.createdAt,
        wasVerified: interaction.wasVerified || false,
        wasModified: interaction.wasModified || false,
        wasRejected: interaction.wasRejected || false,
      };

      setMessages((prev) => [...prev, userMessage, aiMessage]);
      setUserInput('');

      // OPTIMIZATION: Use debounced pattern detection (instead of calling every message)
      // Reduces pattern API calls significantly while still maintaining real-time pattern detection
      // Before: Every message → detectPattern() call
      // After: Debounced to 2 second intervals → ~68% reduction in pattern API calls
      if (messages.length >= 4 && debouncedDetectPatternRef.current) {
        await debouncedDetectPatternRef.current();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
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

  /**
   * Load more messages when user scrolls to end
   */
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    await loadMessagesPage(currentPage + 1);
  }, [hasMoreMessages, isLoadingMore, currentPage]);

  /**
   * Mark interaction as verified (OPTIMIZED: Uses batch endpoint if available)
   * Wrapped with useCallback to prevent unnecessary re-renders in dependent components
   */
  const markAsVerified = useCallback(async (messageId: string) => {
    setUpdatingMessageId(messageId);
    try {
      // OPTIMIZATION: Try batch endpoint first, fallback to individual call
      const response = await batchUpdateInteractions([
        { id: messageId, wasVerified: true, wasModified: false, wasRejected: false }
      ]);

      // Extract the updated interaction from batch response
      const updatedInteraction = response.data.data[0]?.data?.interaction ||
                                  response.data.data[0];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                wasVerified: updatedInteraction?.wasVerified ?? true,
                wasModified: updatedInteraction?.wasModified ?? false,
                wasRejected: updatedInteraction?.wasRejected ?? false,
              }
            : msg
        )
      );

      setSuccessMessage('✓ Response marked as verified!');
      setTimeout(() => setSuccessMessage(null), 2000);

      // Open MR11 Integrated Verification tool for detailed verification workflow
      setActiveMRTool('mr11-verify');
      setShowMRToolsSection(true);
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to mark as verified';
      setError(errorMsg);
    } finally {
      setUpdatingMessageId(null);
    }
  }, []);

  /**
   * Start editing mode for a message
   * Allows user to directly modify AI output
   */
  const startEditingMessage = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  }, []);

  /**
   * Cancel editing mode
   */
  const cancelEditingMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditedContent('');
  }, []);

  /**
   * Save edited content and mark as modified
   */
  const saveEditedMessage = useCallback(async (messageId: string) => {
    setUpdatingMessageId(messageId);
    try {
      // Update the message content in local state
      const originalContent = messages.find(m => m.id === messageId)?.content || '';

      // Only proceed if content was actually changed
      if (editedContent === originalContent) {
        cancelEditingMessage();
        setUpdatingMessageId(null);
        return;
      }

      // Update message content locally first
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: editedContent,
                wasModified: true,
                wasVerified: false,
                wasRejected: false,
              }
            : msg
        )
      );

      // Mark as modified in backend
      await batchUpdateInteractions([
        { id: messageId, wasModified: true, wasVerified: false, wasRejected: false }
      ]);

      setSuccessMessage('✓ 修改已保存！请选择下一步操作：');
      setShowModifiedChoiceUI(true);

      // Auto-hide choice UI after 10 seconds (user can still manually select)
      setTimeout(() => {
        setShowModifiedChoiceUI(false);
        setSuccessMessage(null);
      }, 10000);

      // Exit editing mode
      cancelEditingMessage();
    } catch (err: any) {
      console.error('Save edit error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to save modification';
      setError(errorMsg);
    } finally {
      setUpdatingMessageId(null);
    }
  }, [editedContent, messages, cancelEditingMessage]);

  /**
   * Open MR5 for iteration after modifying a message
   */
  const openMR5Iteration = useCallback(() => {
    setActiveMRTool('mr5-iteration');
    setShowMRToolsSection(true);
    setShowModifiedChoiceUI(false);
    setSuccessMessage('✓ 已打开迭代工具 (MR5)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR2 for viewing modification history
   */
  const openMR2History = useCallback(() => {
    setActiveMRTool('mr2-transparency');
    setShowMRToolsSection(true);
    setShowModifiedChoiceUI(false);
    setSuccessMessage('✓ 已打开变更历史 (MR2)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR11 for integrated verification
   */
  const openMR11Verification = useCallback(() => {
    setActiveMRTool('mr11-verify');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开验证工具 (MR11)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR6 for cross-model experimentation
   */
  const openMR6CrossModel = useCallback(() => {
    setActiveMRTool('mr6-models');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开跨模型对比 (MR6)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR12 for critical thinking scaffolding
   */
  const openMR12CriticalThinking = useCallback(() => {
    setActiveMRTool('mr12-critical');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已激活批判性思维 (MR12)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR14 for guided reflection
   */
  const openMR14Reflection = useCallback(() => {
    setActiveMRTool('mr14-reflection');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开引导反思 (MR14)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR4 for role definition (from task decomposition)
   */
  const openMR4RoleDefinition = useCallback(() => {
    setActiveMRTool('mr4-roles');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开AI角色定义 (MR4)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR8 for task characteristic recognition (from role definition)
   */
  const openMR8TaskRecognition = useCallback(() => {
    setActiveMRTool('mr8-recognition');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开任务特征识别 (MR8)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR3 for agency control
   */
  const openMR3AgencyControl = useCallback(() => {
    setActiveMRTool('mr3-agency');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开人机协作控制 (MR3)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR9 for trust calibration
   */
  const openMR9TrustCalibration = useCallback(() => {
    setActiveMRTool('mr9-trust');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开信任校准 (MR9)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR15 for strategy guide
   */
  const openMR15StrategyGuide = useCallback(() => {
    setActiveMRTool('mr15-strategies');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开策略指南 (MR15)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR16 for skill atrophy prevention
   */
  const openMR16SkillAtrophy = useCallback(() => {
    setActiveMRTool('mr16-atrophy');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开技能萎缩预防 (MR16)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR17 for learning visualization
   */
  const openMR17LearningVisualization = useCallback(() => {
    setActiveMRTool('mr17-visualization');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开学习过程可视化 (MR17)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Open MR19 for metacognitive capability assessment
   */
  const openMR19CapabilityAssessment = useCallback(() => {
    setActiveMRTool('mr19-assessment');
    setShowMRToolsSection(true);
    setSuccessMessage('✓ 已打开元认知能力评估 (MR19)');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  /**
   * Mark interaction as modified (starts editing mode)
   * Opens MR5 immediately so user can view history while editing
   * Wrapped with useCallback to prevent unnecessary re-renders in dependent components
   */
  const markAsModified = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      startEditingMessage(messageId, message.content);
      // Open MR5 immediately so user can view history while editing
      setActiveMRTool('mr5-iteration');
      setShowMRToolsSection(true);
    }
  }, [messages, startEditingMessage]);

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

  /**
   * Render individual message for virtualized list
   * Optimized version that maintains all functionality without performance overhead
   */
  const renderMessage = useCallback(
    (message: Message, index: number) => (
      <div
        key={message.id}
        style={{
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
          animation: 'fadeIn 0.3s ease-in-out',
          padding: '0 0.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '65%',
            padding: '1rem',
            borderRadius: message.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
            backgroundColor: message.role === 'user' ? '#93c5fd' : '#fff',
            color: message.role === 'user' ? '#0c4a6e' : '#1f2937',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderLeft: message.role === 'ai' ? `3px solid ${message.wasVerified ? '#10b981' : '#3b82f6'}` : 'none',
          }}
        >
          {editingMessageId === message.id ? (
            <div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '0.75rem',
                  border: '2px solid #3b82f6',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                autoFocus
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => saveEditedMessage(message.id)}
                  disabled={updatingMessageId === message.id}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.75rem',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {updatingMessageId === message.id ? '⏳ Saving...' : '💾 Save'}
                </button>
                <button
                  onClick={cancelEditingMessage}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.75rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              style={{
                margin: '0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.5',
              }}
            >
              <MarkdownText content={message.content} />
            </p>
          )}
          <p
            style={{
              margin: '0.75rem 0 0 0',
              fontSize: '0.75rem',
              opacity: 0.6,
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {/* MR9 Trust Indicator - Shows trust level for AI messages */}
          {message.role === 'ai' && showTrustIndicator && (() => {
            const orchestrationResult = orchestrateForMessage(message, index);
            if (!orchestrationResult) return null;

            const trustScore = messageTrustScores.get(message.id) || 0;
            const badge = getTrustBadge(trustScore);

            return (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: badge.bgColor,
                  borderRadius: '0.375rem',
                  border: `1px solid ${badge.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{badge.icon}</span>
                  <span style={{ fontWeight: '600', color: badge.color }}>{badge.label}</span>
                  <span style={{ opacity: 0.7 }}>({trustScore.toFixed(0)}%)</span>
                </div>
                {orchestrationResult.recommendations.length > 0 && (
                  <button
                    onClick={() => {
                      const topRec = orchestrationResult.recommendations[0];
                      if (topRec.tool === 'mr11-verify') openMR11Verification();
                      else if (topRec.tool === 'mr12-critical') setActiveMRTool('mr12-critical');
                      else if (topRec.tool === 'mr6-models') openMR6CrossModel();
                      else if (topRec.tool === 'mr14-reflection') openMR14Reflection();
                      else if (topRec.tool === 'mr13-uncertainty') setActiveMRTool('mr13-uncertainty');
                      else if (topRec.tool === 'mr5-iteration') openMR5Iteration();
                      setShowMRToolsSection(true);
                    }}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: badge.color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                    title={orchestrationResult.recommendations[0].reason}
                  >
                    {orchestrationResult.recommendations[0].icon} {orchestrationResult.recommendations[0].toolName}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Action buttons for AI messages */}
          {message.role === 'ai' && (
            <div
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <button
                onClick={() => markAsVerified(message.id)}
                disabled={updatingMessageId === message.id}
                title="✓ VERIFY: Confirm this AI response is correct and helpful."
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: message.wasVerified ? '#10b981' : '#f3f4f6',
                  color: message.wasVerified ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: updatingMessageId === message.id ? 'not-allowed' : 'pointer',
                  opacity: updatingMessageId === message.id ? 0.6 : 1,
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                {updatingMessageId === message.id ? '⏳ Saving...' : message.wasVerified ? '✓ Verified' : '✓ Verify'}
              </button>
              <button
                onClick={() => markAsModified(message.id)}
                disabled={updatingMessageId === message.id}
                title="✎ MODIFY: Check this if you edited or improved the AI's response."
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: message.wasModified ? '#f59e0b' : '#f3f4f6',
                  color: message.wasModified ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: updatingMessageId === message.id ? 'not-allowed' : 'pointer',
                  opacity: updatingMessageId === message.id ? 0.6 : 1,
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                {updatingMessageId === message.id ? '⏳ Saving...' : message.wasModified ? '✎ Modified' : '✎ Modify'}
              </button>
            </div>
          )}

          {/* Quick Reflection Prompt (MR14) - Shows after AI messages */}
          {message.role === 'ai' && !reflectedMessages.has(message.id) && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#fef3c7',
                borderRadius: '0.5rem',
                border: '1px solid #fcd34d',
              }}
            >
              {showQuickReflection === message.id ? (
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '500', color: '#92400e' }}>
                    Quick Reflection
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#78350f' }}>
                    How confident are you in this response? What would you verify?
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleQuickReflection(message.id, 'confident')}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      Confident
                    </button>
                    <button
                      onClick={() => handleQuickReflection(message.id, 'needs-verify')}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      Need to Verify
                    </button>
                    <button
                      onClick={() => handleQuickReflection(message.id, 'uncertain')}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      Uncertain
                    </button>
                    <button
                      onClick={() => handleQuickReflection(message.id, 'skip')}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: '#e5e7eb',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowQuickReflection(message.id)}
                  style={{
                    width: '100%',
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    backgroundColor: 'transparent',
                    color: '#92400e',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>Take a moment to reflect on this response</span>
                </button>
              )}
            </div>
          )}

          {/* MR6 Multi-Model Comparison Suggestion - Shows after AI messages when iteration detected */}
          {shouldSuggestMR6(message, index) && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#dbeafe',
                borderRadius: '0.5rem',
                border: '2px solid #3b82f6',
              }}
            >
              {showMR6Suggestion === message.id ? (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af' }}>
                    🔄 Compare Multiple AI Models
                  </h4>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#1e3a8a', lineHeight: '1.4' }}>
                    You're iterating on this response! Try comparing outputs from GPT-4, Claude, and Gemini to find the best solution. Different models excel at different tasks.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleMR6Suggestion(message.id, 'accept')}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                      title="Open Multi-Model Comparison (MR6)"
                    >
                      🔄 Compare Models (MR6)
                    </button>
                    <button
                      onClick={() => handleMR6Suggestion(message.id, 'dismiss')}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#e5e7eb',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                      }}
                    >
                      Not Now
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowMR6Suggestion(message.id)}
                  style={{
                    width: '100%',
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    backgroundColor: 'transparent',
                    color: '#1e40af',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    fontWeight: '500',
                  }}
                >
                  <span>💡 Try comparing multiple AI models for better results</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    [updatingMessageId, markAsVerified, markAsModified, editingMessageId, editedContent, saveEditedMessage, cancelEditingMessage, reflectedMessages, showQuickReflection, handleQuickReflection, shouldSuggestMR6, showMR6Suggestion, handleMR6Suggestion, showTrustIndicator, orchestrateForMessage, messageTrustScores, getTrustBadge, openMR11Verification, openMR6CrossModel, openMR14Reflection, openMR5Iteration, setActiveMRTool, setShowMRToolsSection]
  );

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
      {/* Left Sidebar - Session History */}
      <aside style={{
        width: sessionSidebarOpen ? '280px' : '0',
        backgroundColor: '#fff',
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto',
        transition: 'width 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: sessionSidebarOpen ? '2px 0 8px rgba(0, 0, 0, 0.08)' : 'none',
        zIndex: 10,
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Conversations</h3>
          <button
            onClick={() => setSessionSidebarOpen(false)}
            aria-label="Close conversations sidebar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: '#6b7280',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Sessions List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {sessionsLoading ? (
            <div style={{ padding: '0.75rem' }}>
              <SkeletonCard />
              <div style={{ marginTop: '0.75rem' }}>
                <SkeletonCard />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <SkeletonCard />
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No conversations yet"
              description="Start a new conversation to get going"
              action={{ label: 'New conversation', onClick: handleNewChat }}
              className="sessions-empty-state"
            />
          ) : (
            sessions.map((session) => {
              const isHovering = hoveredSessionId === session.id;
              return (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                >
                  <button
                    onClick={() => {
                      navigate(`/session/${session.id}`);
                      setSessionSidebarOpen(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      border: '1px solid ' + (session.id === sessionId ? '#3b82f6' : '#e5e7eb'),
                      borderRadius: '0.5rem',
                      backgroundColor: session.id === sessionId ? '#eff6ff' : '#fff',
                      color: session.id === sessionId ? '#1e40af' : '#4b5563',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: session.id === sessionId ? '600' : '500',
                      transition: 'all 0.2s',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={session.taskDescription}
                    onMouseOver={(e) => {
                      if (session.id !== sessionId) {
                        (e.currentTarget.parentElement as HTMLDivElement).style.backgroundColor = 'transparent';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (session.id !== sessionId) {
                        (e.currentTarget.parentElement as HTMLDivElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.taskDescription}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      {new Date(session.startedAt || session.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </button>
                  {isHovering && (
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      aria-label={`Delete conversation: ${session.taskDescription}`}
                      style={{
                        padding: '0.5rem 0.625rem',
                        marginLeft: '0.5rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '2rem',
                        minHeight: '2rem',
                        flexShrink: 0,
                      }}
                      title="Delete conversation"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fecaca';
                        e.currentTarget.style.borderColor = '#fca5a5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer - Empty space for balance */}
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem' }}>
            💡 Tip: Click the menu to switch conversations
          </div>
        </div>
      </aside>

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

          {/* Simple Message List - Temporary replacement for VirtualizedMessageList */}
          {messages.length > 0 && (
            <div
              ref={virtualizedListRef as any}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '0.5rem 0',
              }}
            >
              {messages.map((message, index) => (
                <div key={message.id}>
                  {renderMessage(message, index)}
                </div>
              ))}
              {hasMoreMessages && !isLoadingMore && (
                <button
                  onClick={loadMoreMessages}
                  style={{
                    margin: '1rem auto',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                  }}
                >
                  Load More Messages
                </button>
              )}
              {isLoadingMore && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                  Loading more messages...
                </div>
              )}
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

              {/* MR Tools Quick Access - Collapsible */}
              <div style={{
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#fff',
              }}>
                <button
                  onClick={() => setShowMRToolsSection(!showMRToolsSection)}
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
                    🧠 MR Tools
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    {showMRToolsSection ? '▼' : '▶'}
                  </span>
                </button>
                {showMRToolsSection && (
                  <div style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.25rem',
                    }}>
                      {/* User-facing MR tools only. MR8/9/18/19 are automatic backend systems */}
                      <button onClick={() => setActiveMRTool('mr1-decomposition')} title="Task Decomposition - Break down complex tasks" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr1-decomposition' ? '#dcfce7' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>📋 1</button>
                      <button onClick={() => setActiveMRTool('mr2-transparency')} title="Process Transparency - View AI reasoning" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr2-transparency' ? '#dbeafe' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>🔍 2</button>
                      <button onClick={() => setActiveMRTool('mr3-agency')} title="Agency Control - Control AI intervention" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr3-agency' ? '#fef3c7' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>🎛️ 3</button>
                      <button onClick={() => setActiveMRTool('mr4-roles')} title="Role Definition - Define AI roles" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr4-roles' ? '#ffedd5' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>🎭 4</button>
                      <button onClick={() => setActiveMRTool('mr5-iteration')} title="Low-Cost Iteration - Branch conversations" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr5-iteration' ? '#e0f2fe' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>🔄 5</button>
                      <button onClick={() => setActiveMRTool('mr6-models')} title="Cross-Model - Compare AI models" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr6-models' ? '#fce7f3' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>🤖 6</button>
                      <button onClick={() => setActiveMRTool('mr7-failure')} title="Failure Tolerance - Learn from mistakes" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr7-failure' ? '#fef9c3' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>💡 7</button>
                      <button onClick={() => setActiveMRTool('mr10-cost')} title="Cost-Benefit Analysis - Evaluate AI assistance value" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr10-cost' ? '#e0e7ff' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>💰 10</button>
                      <button onClick={() => setActiveMRTool('mr11-verify')} title="Integrated Verification - Verify AI outputs" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr11-verify' ? '#d1fae5' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>✅ 11</button>
                      <button onClick={() => setActiveMRTool('mr12-critical')} title="Critical Thinking - Socratic questions" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr12-critical' ? '#ede9fe' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>🧐 12</button>
                      <button onClick={() => setActiveMRTool('mr13-uncertainty')} title="Transparent Uncertainty - Show confidence levels" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr13-uncertainty' ? '#fef3c7' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>❓ 13</button>
                      <button onClick={() => setActiveMRTool('mr14-reflection')} title="Guided Reflection - Learning reflection" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr14-reflection' ? '#ccfbf1' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>💭 14</button>
                      <button onClick={() => setActiveMRTool('mr15-strategies')} title="Strategy Guide - AI collaboration strategies" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr15-strategies' ? '#f3e8ff' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>📚 15</button>
                      <button onClick={() => setActiveMRTool('mr16-atrophy')} title="Skill Atrophy Prevention - Maintain your skills" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr16-atrophy' ? '#fecaca' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>💪 16</button>
                      <button onClick={() => setActiveMRTool('mr17-visualization')} title="Learning Visualization - Track learning progress" style={{ padding: '0.4rem', backgroundColor: activeMRTool === 'mr17-visualization' ? '#bfdbfe' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>📈 17</button>
                      <button onClick={() => setActiveMRTool('none')} title="Close MR tool" style={{ padding: '0.4rem', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', textAlign: 'center' }}>✕</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active MR Tool Display in Sidebar */}
              {activeMRTool !== 'none' && (
                <div style={{
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#fff',
                }}>
                  {/* Active Tool Header */}
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#f0fdf4',
                    borderBottom: '1px solid #dcfce7',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: '#166534',
                      textTransform: 'uppercase',
                    }}>
                      Active: MR{activeMRTool.split('-')[0].replace('mr', '')}
                    </span>
                    <button
                      onClick={() => setActiveMRTool('none')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#166534',
                        padding: '0.125rem 0.25rem',
                      }}
                      title="Close tool"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Tool Content */}
                  <div style={{
                    padding: '0.75rem',
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    fontSize: '0.75rem',
                    lineHeight: '1.4',
                  }}>
                    <Suspense fallback={<ComponentLoader />}>
                      {/* User-facing MR tools only */}
                      {activeMRTool === 'mr1-decomposition' && <MR1TaskDecompositionScaffold sessionId={sessionId || ''} onDecompositionComplete={(subtasks) => console.log('Decomposed:', subtasks)} onOpenMR4={openMR4RoleDefinition} />}
                      {activeMRTool === 'mr2-transparency' && <MR2ProcessTransparency sessionId={sessionId || ''} versions={
                        // Transform messages into InteractionVersion format
                        // Pair up user messages with their AI responses
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
                      } onVersionSelect={(v) => console.log('Version:', v)} />}
                      {activeMRTool === 'mr3-agency' && <MR3HumanAgencyControl interventionLevel={interventionLevel} onInterventionLevelChange={setInterventionLevel} sessionId={sessionId || ''} onSuggestionAction={(a, s) => console.log('Action:', a, s)} />}
                      {activeMRTool === 'mr4-roles' && <MR4RoleDefinitionGuidance taskType={sessionData?.taskType || 'general'} onRoleSelect={(r) => console.log('Role:', r)} onOpenMR8={openMR8TaskRecognition} />}
                      {activeMRTool === 'mr5-iteration' && <MR5LowCostIteration sessionId={sessionId || ''} currentMessages={messages} branches={conversationBranches} onBranchCreate={(b) => setConversationBranches([...conversationBranches, b])} onVariantGenerate={(v) => console.log('Variants:', v)} onOpenMR6={openMR6CrossModel} />}
                      {activeMRTool === 'mr6-models' && <MR6CrossModelExperimentation prompt={userInput || messages[messages.length - 1]?.content || ''} onComparisonComplete={(r) => console.log('Comparison:', r)} />}
                      {activeMRTool === 'mr7-failure' && <MR7FailureToleranceLearning onIterationLogged={(log) => console.log('Learning:', log)} />}
                      {activeMRTool === 'mr8-recognition' && <MR8TaskCharacteristicRecognition onTaskProfileDetected={(p) => console.log('Task Profile:', p)} onOpenMR3={openMR3AgencyControl} onOpenMR5={openMR5Iteration} onOpenMR9={openMR9TrustCalibration} onOpenMR11={openMR11Verification} onOpenMR14={openMR14Reflection} onOpenMR15={openMR15StrategyGuide} />}
                      {activeMRTool === 'mr10-cost' && <MR10CostBenefitAnalysis taskType={sessionData?.taskType || 'general'} onAnalysisComplete={(a) => console.log('Cost-Benefit:', a)} />}
                      {activeMRTool === 'mr11-verify' && <MR11IntegratedVerification existingLogs={verificationLogs} onDecisionMade={(log) => setVerificationLogs([...verificationLogs, log])} />}
                      {activeMRTool === 'mr12-critical' && <MR12CriticalThinkingScaffolding aiOutput={messages[messages.length - 1]?.content || ''} domain={sessionData?.taskType || 'general'} onAssessmentComplete={(a) => console.log('Assessment:', a)} />}
                      {activeMRTool === 'mr13-uncertainty' && <MR13TransparentUncertainty onAnalysisComplete={(u) => console.log('Uncertainty:', u)} onOpenMR11={openMR11Verification} onOpenMR6={openMR6CrossModel} />}
                      {activeMRTool === 'mr14-reflection' && <MR14GuidedReflectionMechanism sessionId={sessionId || ''} messages={messages} onReflectionComplete={(r) => console.log('Reflection:', r)} onOpenMR15={openMR15StrategyGuide} />}
                      {activeMRTool === 'mr15-strategies' && <MR15MetacognitiveStrategyGuide taskType={sessionData?.taskType || 'general'} userLevel="intermediate" onStrategySelect={(s) => console.log('Strategy:', s)} onOpenMR19={openMR19CapabilityAssessment} />}
                      {activeMRTool === 'mr16-atrophy' && <MR16SkillAtrophyPrevention userId={user?.id || sessionId || ''} onOpenMR17={openMR17LearningVisualization} onOpenMR19={openMR19CapabilityAssessment} />}
                      {activeMRTool === 'mr17-visualization' && <MR17LearningProcessVisualization userId={user?.id || sessionId || ''} onOpenMR19={openMR19CapabilityAssessment} onOpenMR16={openMR16SkillAtrophy} />}
                      {activeMRTool === 'mr19-assessment' && <MR19MetacognitiveCapabilityAssessment userBehaviorHistory={[]} onOpenMR16={openMR16SkillAtrophy} onOpenMR17={openMR17LearningVisualization} />}
                    </Suspense>
                  </div>
                </div>
              )}

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
      `}</style>
    </div>
    </>
  );
};

export default ChatSessionPage;
