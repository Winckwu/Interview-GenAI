import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import PatternAnalysisWindow from '../components/chat/PatternAnalysisWindow';
import { useMCAOrchestrator, MRDisplay, ActiveMR } from '../components/chat/MCAConversationOrchestrator';
import MR11IntegratedVerification from '../components/MR11IntegratedVerification';

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
 * Chat Session Page - Improved UI with Session Sidebar
 * Main interface for user-AI interaction with pattern tracking and session history
 */
const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addInteraction, deleteSession: deleteSessionFromStore } = useSessionStore();
  const { setSidebarOpen } = useUIStore();

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sessionActive, setSessionActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [showPattern, setShowPattern] = useState(false);
  const [showPatternPanel, setShowPatternPanel] = useState(true); // Show pattern panel on right
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

  // Verification tools state
  const [showVerificationTools, setShowVerificationTools] = useState(false);

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

  // Load session list with valid interactions
  useEffect(() => {
    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const response = await api.get('/sessions', { params: { limit: 50, offset: 0 } });
        if (response.data.data && response.data.data.sessions) {
          // Remove duplicate sessions by ID
          const uniqueSessions = Array.from(
            new Map(response.data.data.sessions.map((session: SessionItem) => [session.id, session])).values()
          ) as SessionItem[];

          // Filter sessions that have valid interactions (with actual content)
          const sessionsWithContent = await Promise.all(
            uniqueSessions.map(async (session) => {
              try {
                const interactionsResponse = await api.get('/interactions', {
                  params: { sessionId: session.id },
                });
                const interactions = interactionsResponse.data.data.interactions || [];
                // Check if session has at least one valid interaction with both user prompt and AI response
                const validInteractions = interactions.filter(
                  (interaction: any) =>
                    interaction.userPrompt && interaction.aiResponse && interaction.sessionId === session.id
                );

                if (validInteractions.length > 0) {
                  // Use the first user prompt as the session title (truncate to 50 chars)
                  const firstPrompt = validInteractions[0].userPrompt;
                  const title = firstPrompt.length > 50 ? firstPrompt.substring(0, 50) + '...' : firstPrompt;
                  return {
                    ...session,
                    taskDescription: title,
                  };
                }
                return null;
              } catch (err) {
                console.error(`Failed to load interactions for session ${session.id}:`, err);
                return null;
              }
            })
          );

          // Filter out null values and sort by date descending (newest first)
          const filteredSessions = sessionsWithContent.filter((s) => s !== null) as SessionItem[];
          filteredSessions.sort((a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime());
          setSessions(filteredSessions);
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

        // Load previous interactions/messages from this session
        const interactionsResponse = await api.get('/interactions', {
          params: { sessionId },
        });

        if (interactionsResponse.data.data.interactions && interactionsResponse.data.data.interactions.length > 0) {
          // Remove duplicate interactions by ID and filter valid interactions
          const uniqueInteractions = Array.from(
            new Map(
              interactionsResponse.data.data.interactions
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
          const previousMessages: Message[] = [];
          for (const interaction of uniqueInteractions) {
            // Add user message
            previousMessages.push({
              id: `user-${interaction.id}`,
              role: 'user',
              content: interaction.userPrompt,
              timestamp: interaction.createdAt,
            });

            // Add AI message
            previousMessages.push({
              id: interaction.id,
              role: 'ai',
              content: interaction.aiResponse,
              timestamp: interaction.createdAt,
              wasVerified: interaction.wasVerified,
              wasModified: interaction.wasModified,
              wasRejected: interaction.wasRejected,
            });
          }
          // Sort chronologically (oldest first)
          previousMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setMessages(previousMessages);
        }

        // Load saved pattern detection for this session (if any)
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
      } catch (err: any) {
        console.error('Failed to load session:', err);
        setError(err.response?.data?.error || 'Failed to load session');
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

      // Check if we should detect pattern (after 3 interactions)
      if (messages.length >= 4) {
        await detectPattern();
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
    } catch (err: any) {
      console.error('Pattern detection error:', err);
    } finally {
      setPatternLoading(false);
    }
  };

  /**
   * Mark interaction as verified
   */
  const markAsVerified = async (messageId: string) => {
    setUpdatingMessageId(messageId);
    try {
      const response = await api.patch(`/interactions/${messageId}`, { wasVerified: true });
      const updatedInteraction = response.data.data.interaction;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, wasVerified: updatedInteraction.wasVerified }
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
  };

  /**
   * Mark interaction as modified
   */
  const markAsModified = async (messageId: string) => {
    setUpdatingMessageId(messageId);
    try {
      const response = await api.patch(`/interactions/${messageId}`, { wasModified: true });
      const updatedInteraction = response.data.data.interaction;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, wasModified: updatedInteraction.wasModified }
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
  };

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
            <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              No conversations yet
            </div>
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
                onClick={() => setShowPatternPanel(!showPatternPanel)}
                title="Toggle pattern analysis panel"
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: showPatternPanel ? '#dbeafe' : '#f3f4f6',
                  color: showPatternPanel ? '#1e40af' : '#6b7280',
                  border: showPatternPanel ? '1px solid #93c5fd' : '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = showPatternPanel ? '#93c5fd' : '#e5e7eb';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = showPatternPanel ? '#dbeafe' : '#f3f4f6';
                }}
              >
                📊 {showPatternPanel ? 'Hide' : 'Show'} Analysis
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
          <div style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#d1fae5',
            borderBottom: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#fee2e2',
            borderBottom: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}>
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
          overflowY: 'auto',
          padding: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              padding: '3rem 0',
              fontSize: '0.95rem',
            }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</p>
              <p>Start by asking a question or describing your task...</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
              <div style={{
                maxWidth: '65%',
                padding: '1rem',
                borderRadius: message.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                backgroundColor: message.role === 'user' ? '#93c5fd' : '#fff',
                color: message.role === 'user' ? '#0c4a6e' : '#1f2937',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                borderLeft: message.role === 'ai' ? `3px solid ${message.wasVerified ? '#10b981' : '#3b82f6'}` : 'none',
              }}>
                <p style={{
                  margin: '0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.5',
                }}>
                  {message.content}
                </p>
                <p style={{
                  margin: '0.75rem 0 0 0',
                  fontSize: '0.75rem',
                  opacity: 0.6,
                }}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>

                {/* Action buttons for AI messages */}
                {message.role === 'ai' && (
                  <div style={{
                    marginTop: '0.75rem',
                    display: 'flex',
                    gap: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                  }}>
                    <button
                      onClick={() => markAsVerified(message.id)}
                      disabled={updatingMessageId === message.id}
                      title="✓ VERIFY: Confirm this AI response is correct and helpful. This feedback helps us understand what quality looks like."
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
                      onMouseOver={(e) => {
                        if (updatingMessageId !== message.id) {
                          (e.target as HTMLButtonElement).style.backgroundColor = message.wasVerified ? '#059669' : '#e5e7eb';
                        }
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.backgroundColor = message.wasVerified ? '#10b981' : '#f3f4f6';
                      }}
                    >
                      {updatingMessageId === message.id ? '⏳ Saving...' : message.wasVerified ? '✓ Verified' : '✓ Verify'}
                    </button>
                    <button
                      onClick={() => markAsModified(message.id)}
                      disabled={updatingMessageId === message.id}
                      title="✎ MODIFY: Check this if you edited, rewrote, or improved the AI's response. This shows you're actively learning and not just copying."
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
                      onMouseOver={(e) => {
                        if (updatingMessageId !== message.id) {
                          (e.target as HTMLButtonElement).style.backgroundColor = message.wasModified ? '#d97706' : '#e5e7eb';
                        }
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.backgroundColor = message.wasModified ? '#f59e0b' : '#f3f4f6';
                      }}
                    >
                      {updatingMessageId === message.id ? '⏳ Saving...' : message.wasModified ? '✎ Modified' : '✎ Modify'}
                    </button>
                  </div>
                )}
              </div>
              {/* Inline MRs - displayed after AI messages */}
              {message.role === 'ai' && activeMRs && activeMRs.length > 0 && (
                <>
                  {activeMRs
                    .filter((mr) => mr.displayMode === 'inline')
                    .map((mr) => (
                      <div key={mr.mrId} style={{ marginTop: '0.75rem' }}>
                        <MRDisplay
                          mr={mr}
                          onClose={() => setDismissedMRs((prev) => new Set([...prev, mr.mrId]))}
                        />
                      </div>
                    ))}
                </>
              )}
            </div>
          ))}

          {loading && (
            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              padding: '1.5rem 0',
            }}>
              <p style={{ fontSize: '1rem' }}>🤔 AI is thinking...</p>
            </div>
          )}
          </div>

          {/* Right Sidebar - Pattern Analysis Window & MR Panel */}
          {showPatternPanel && (
            <div style={{
              width: '320px',
              borderLeft: '1px solid #e2e8f0',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f9fafb',
            }}>
              {/* Sidebar MRs */}
              {activeMRs && activeMRs.some((mr) => mr.displayMode === 'sidebar') && (
                <div style={{
                  padding: '1rem',
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
                        <MRDisplay
                          mr={mr}
                          onClose={() => setDismissedMRs((prev) => new Set([...prev, mr.mrId]))}
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Pattern Analysis Window */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <PatternAnalysisWindow
                  pattern={pattern}
                  isLoading={patternLoading}
                  onClose={() => setShowPatternPanel(false)}
                />
              </div>
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
              type="button"
              onClick={() => setShowVerificationTools(true)}
              title="Open verification tools to verify AI-generated code, math, citations, facts, or text"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#8b5cf6',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s',
                minWidth: '80px',
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#7c3aed';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#8b5cf6';
              }}
            >
              🔍 Verify
            </button>
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

      {/* Verification Tools Modal */}
      {showVerificationTools && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          overflowY: 'auto',
          padding: '2rem',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '0.75rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowVerificationTools(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                zIndex: 10,
              }}
              title="Close verification tools"
            >
              ✕
            </button>
            <MR11IntegratedVerification
              onDecisionMade={() => {
                // Optional: Close on decision made
                // setShowVerificationTools(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal MR Display */}
      {displayedModalMR && (
        <MRDisplay
          mr={displayedModalMR}
          onClose={() => setDismissedMRs((prev) => new Set([...prev, displayedModalMR.mrId]))}
          onAcknowledge={() => {
            setDismissedMRs((prev) => new Set([...prev, displayedModalMR.mrId]));
          }}
        />
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
  );
};

export default ChatSessionPage;
