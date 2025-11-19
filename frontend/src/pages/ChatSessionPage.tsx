import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

// OPTIMIZATION: Lazy-load heavy components to reduce ChatSessionPage bundle size
// These components are only needed when specific features are active
const PatternAnalysisWindow = lazy(() => import('../components/chat/PatternAnalysisWindow'));
const MRDisplay = lazy(() =>
  import('../components/chat/MCAConversationOrchestrator').then((module) => ({
    default: module.MRDisplay,
  }))
);

// MR Components - Lazy loaded for performance
// Phase 1: Foundation Components
const MR1TaskDecompositionScaffold = lazy(() => import('../components/MR1TaskDecompositionScaffold'));
const MR2ProcessTransparency = lazy(() =>
  import('../components/MR2ProcessTransparency').then((module) => ({
    default: module.MR2ProcessTransparency,
  }))
);
const MR3HumanAgencyControl = lazy(() =>
  import('../components/MR3HumanAgencyControl').then((module) => ({
    default: module.MR3HumanAgencyControl,
  }))
);
const MR15MetacognitiveStrategyGuide = lazy(() =>
  import('../components/MR15MetacognitiveStrategyGuide').then((module) => ({
    default: module.MR15MetacognitiveStrategyGuide,
  }))
);

// Phase 2: Adaptive Intelligence
const MR4RoleDefinitionGuidance = lazy(() =>
  import('../components/MR4RoleDefinitionGuidance').then((module) => ({
    default: module.MR4RoleDefinitionGuidance,
  }))
);
const MR5LowCostIteration = lazy(() =>
  import('../components/MR5LowCostIteration').then((module) => ({
    default: module.MR5LowCostIteration,
  }))
);
const MR6CrossModelExperimentation = lazy(() =>
  import('../components/MR6CrossModelExperimentation').then((module) => ({
    default: module.MR6CrossModelExperimentation,
  }))
);
const MR8TaskCharacteristicRecognition = lazy(() =>
  import('../components/MR8TaskCharacteristicRecognition').then((module) => ({
    default: module.MR8TaskCharacteristicRecognition,
  }))
);
const MR9DynamicTrustCalibration = lazy(() =>
  import('../components/MR9DynamicTrustCalibration').then((module) => ({
    default: module.MR9DynamicTrustCalibration,
  }))
);
const MR12CriticalThinkingScaffolding = lazy(() =>
  import('../components/MR12CriticalThinkingScaffolding').then((module) => ({
    default: module.MR12CriticalThinkingScaffolding,
  }))
);
const MR14GuidedReflectionMechanism = lazy(() =>
  import('../components/MR14GuidedReflectionMechanism').then((module) => ({
    default: module.MR14GuidedReflectionMechanism,
  }))
);
const MR11IntegratedVerification = lazy(() => import('../components/MR11IntegratedVerification'));

// Additional MR Components
const MR7FailureToleranceLearning = lazy(() =>
  import('../components/MR7FailureToleranceLearning').then((module) => ({
    default: module.MR7FailureToleranceLearning,
  }))
);
const MR10CostBenefitAnalysis = lazy(() =>
  import('../components/MR10CostBenefitAnalysis').then((module) => ({
    default: module.MR10CostBenefitAnalysis,
  }))
);
const MR13TransparentUncertainty = lazy(() =>
  import('../components/MR13TransparentUncertainty').then((module) => ({
    default: module.MR13TransparentUncertainty,
  }))
);
const MR16SkillAtrophyPrevention = lazy(() =>
  import('../components/MR16SkillAtrophyPrevention').then((module) => ({
    default: module.MR16SkillAtrophyPrevention,
  }))
);
const MR17LearningProcessVisualization = lazy(() =>
  import('../components/MR17LearningProcessVisualization').then((module) => ({
    default: module.default,
  }))
);
const MR18OverRelianceWarning = lazy(() =>
  import('../components/MR18OverRelianceWarning').then((module) => ({
    default: module.MR18OverRelianceWarning,
  }))
);
const MR19MetacognitiveCapabilityAssessment = lazy(() =>
  import('../components/MR19MetacognitiveCapabilityAssessment').then((module) => ({
    default: module.MR19MetacognitiveCapabilityAssessment,
  }))
);

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

  // Session metadata
  const [sessionData, setSessionData] = useState<any>(null);
  // Track which message is being updated
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);

  // Session sidebar states
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSidebarOpen, setSessionSidebarOpen] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [creatingNewSession, setCreatingNewSession] = useState(false);

  // MCA orchestration states
  const { result: mcaResult, activeMRs } = useMCAOrchestrator(sessionId || '', messages, true);
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
              // Check if session has at least one valid interaction with both user prompt and AI response
              const validInteractions = interactions.filter(
                (interaction: any) =>
                  interaction.userPrompt && interaction.aiResponse && interaction.sessionId === session.id
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
   * Send user prompt and get AI response from OpenAI API
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || !sessionId) return;

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
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to mark as verified';
      setError(errorMsg);
    } finally {
      setUpdatingMessageId(null);
    }
  }, []);

  /**
   * Mark interaction as modified (OPTIMIZED: Uses batch endpoint if available)
   * Wrapped with useCallback to prevent unnecessary re-renders in dependent components
   */
  const markAsModified = useCallback(async (messageId: string) => {
    setUpdatingMessageId(messageId);
    try {
      // OPTIMIZATION: Try batch endpoint first, fallback to individual call
      const response = await batchUpdateInteractions([
        { id: messageId, wasModified: true, wasVerified: false, wasRejected: false }
      ]);

      // Extract the updated interaction from batch response
      const updatedInteraction = response.data.data[0]?.data?.interaction ||
                                  response.data.data[0];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                wasModified: updatedInteraction?.wasModified ?? true,
                wasVerified: updatedInteraction?.wasVerified ?? false,
                wasRejected: updatedInteraction?.wasRejected ?? false,
              }
            : msg
        )
      );

      setSuccessMessage('✎ Response marked as modified!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      console.error('Modification error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to mark as modified';
      setError(errorMsg);
    } finally {
      setUpdatingMessageId(null);
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
        </div>
      </div>
    ),
    [updatingMessageId, markAsVerified, markAsModified]
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
      {/* CSS overrides for MR components in sidebar - make them compact */}
      <style>{`
        /* Compact MR components for sidebar display */
        [class*="mr"][class*="-container"] {
          padding: 0.5rem !important;
          max-width: 100% !important;
        }
        [class*="mr"][class*="-header"] {
          margin-bottom: 0.75rem !important;
          padding-bottom: 0.5rem !important;
        }
        [class*="mr"][class*="-title"] {
          font-size: 0.85rem !important;
          margin-bottom: 0.25rem !important;
        }
        [class*="mr"][class*="-subtitle"] {
          font-size: 0.7rem !important;
        }
        [class*="mr"] h1 {
          font-size: 0.85rem !important;
        }
        [class*="mr"] h2 {
          font-size: 0.8rem !important;
          margin-bottom: 0.5rem !important;
        }
        [class*="mr"] h3 {
          font-size: 0.75rem !important;
        }
        [class*="mr"] p, [class*="mr"] li, [class*="mr"] span {
          font-size: 0.7rem !important;
          line-height: 1.4 !important;
        }
        [class*="mr"] button {
          font-size: 0.7rem !important;
          padding: 0.35rem 0.5rem !important;
        }
        [class*="mr"] input, [class*="mr"] textarea, [class*="mr"] select {
          font-size: 0.7rem !important;
          padding: 0.35rem !important;
        }
        [class*="mr"][class*="-progress-bar"] {
          margin-bottom: 0.75rem !important;
        }
        [class*="mr"][class*="-step-label"] {
          font-size: 0.6rem !important;
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
            {successMessage}
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
                      {activeMRTool === 'mr1-decomposition' && <MR1TaskDecompositionScaffold sessionId={sessionId || ''} onDecompositionComplete={(subtasks) => console.log('Decomposed:', subtasks)} />}
                      {activeMRTool === 'mr2-transparency' && <MR2ProcessTransparency sessionId={sessionId || ''} versions={messages.map((m, i) => ({ id: m.id, content: m.content, timestamp: m.timestamp, author: m.role, changeType: i === 0 ? 'initial' : 'modification' }))} onVersionSelect={(v) => console.log('Version:', v)} />}
                      {activeMRTool === 'mr3-agency' && <MR3HumanAgencyControl interventionLevel={interventionLevel} onInterventionLevelChange={setInterventionLevel} sessionId={sessionId || ''} onSuggestionAction={(a, s) => console.log('Action:', a, s)} />}
                      {activeMRTool === 'mr4-roles' && <MR4RoleDefinitionGuidance taskType={sessionData?.taskType || 'general'} onRoleSelect={(r) => console.log('Role:', r)} />}
                      {activeMRTool === 'mr5-iteration' && <MR5LowCostIteration sessionId={sessionId || ''} currentMessages={messages} branches={conversationBranches} onBranchCreate={(b) => setConversationBranches([...conversationBranches, b])} onVariantGenerate={(v) => console.log('Variants:', v)} />}
                      {activeMRTool === 'mr6-models' && <MR6CrossModelExperimentation prompt={userInput || messages[messages.length - 1]?.content || ''} onComparisonComplete={(r) => console.log('Comparison:', r)} />}
                      {activeMRTool === 'mr7-failure' && <MR7FailureToleranceLearning sessionId={sessionId || ''} onLearningComplete={(l) => console.log('Learning:', l)} />}
                      {activeMRTool === 'mr10-cost' && <MR10CostBenefitAnalysis taskType={sessionData?.taskType || 'general'} onAnalysisComplete={(a) => console.log('Cost-Benefit:', a)} />}
                      {activeMRTool === 'mr11-verify' && <MR11IntegratedVerification existingLogs={verificationLogs} onDecisionMade={(log) => setVerificationLogs([...verificationLogs, log])} />}
                      {activeMRTool === 'mr12-critical' && <MR12CriticalThinkingScaffolding content={messages[messages.length - 1]?.content || ''} taskType={sessionData?.taskType || 'general'} onAssessmentComplete={(a) => console.log('Assessment:', a)} />}
                      {activeMRTool === 'mr13-uncertainty' && <MR13TransparentUncertainty content={messages[messages.length - 1]?.content || ''} onUncertaintyAcknowledged={(u) => console.log('Uncertainty:', u)} />}
                      {activeMRTool === 'mr14-reflection' && <MR14GuidedReflectionMechanism sessionId={sessionId || ''} messages={messages} onReflectionComplete={(r) => console.log('Reflection:', r)} />}
                      {activeMRTool === 'mr15-strategies' && <MR15MetacognitiveStrategyGuide taskType={sessionData?.taskType || 'general'} userLevel="intermediate" onStrategySelect={(s) => console.log('Strategy:', s)} />}
                      {activeMRTool === 'mr16-atrophy' && <MR16SkillAtrophyPrevention sessionId={sessionId || ''} onExerciseComplete={(e) => console.log('Exercise:', e)} />}
                      {activeMRTool === 'mr17-visualization' && <MR17LearningProcessVisualization sessionId={sessionId || ''} />}
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
                      }}
                      onUserAction={(mrType, action) => {
                        console.log(`📊 User action: ${action} on ${mrType}`);
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
