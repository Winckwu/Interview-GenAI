import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

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
 * Chat Session Page - Improved UI with Session Sidebar
 * Main interface for user-AI interaction with pattern tracking and session history
 */
const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sessionActive, setSessionActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [showPattern, setShowPattern] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Session metadata
  const [sessionData, setSessionData] = useState<any>(null);
  // Track which message is being updated
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);

  // Session sidebar states
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load session list
  useEffect(() => {
    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const response = await api.get('/sessions', { params: { limit: 50, offset: 0 } });
        if (response.data.data && response.data.data.sessions) {
          // Remove duplicate sessions by ID
          const uniqueSessions = Array.from(
            new Map(response.data.data.sessions.map((session: SessionItem) => [session.id, session])).values()
          );
          setSessions(uniqueSessions);
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
      navigate('/dashboard');
      return;
    }

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

    try {
      const response = await api.post('/patterns/analyze', { sessionId });
      setPattern(response.data.data.pattern);
      setShowPattern(true);
    } catch (err: any) {
      console.error('Pattern detection error:', err);
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
   * End session
   */
  const endSession = async () => {
    if (!sessionId) return;

    try {
      await api.patch(`/sessions/${sessionId}`, {});
      setSessionActive(false);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError('Failed to end session');
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
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '0',
        backgroundColor: '#fff',
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto',
        transition: 'width 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: sidebarOpen ? '2px 0 8px rgba(0, 0, 0, 0.08)' : 'none',
        zIndex: 10,
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Conversations</h3>
          <button
            onClick={() => setSidebarOpen(false)}
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
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  navigate(`/session/${session.id}`);
                  setSidebarOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
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
                    (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseOut={(e) => {
                  if (session.id !== sessionId) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#fff';
                  }
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {session.taskDescription.substring(0, 20)}
                  {session.taskDescription.length > 20 ? '...' : ''}
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
            ))
          )}
        </div>

        {/* New Session Button */}
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6';
            }}
          >
            ➕ New Chat
          </button>
        </div>
      </aside>

      {/* Main Content */}
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
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: '#6b7280',
                padding: '0',
                display: sidebarOpen ? 'none' : 'flex',
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
          <button
            onClick={endSession}
            disabled={!sessionActive}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: sessionActive ? '#ef4444' : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: sessionActive ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s',
            }}
          >
            🔚 End Session
          </button>
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
            borderBottom: `2px solid ${getPatternColor(pattern.pattern)}`,
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
                  backgroundColor: getPatternColor(pattern.pattern),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                }}>
                  {pattern.pattern}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0', fontWeight: '600', color: '#1f2937' }}>
                    {getPatternLabel(pattern.pattern)}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Confidence: {(pattern.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
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
                backgroundColor: message.role === 'user' ? '#60a5fa' : '#fff',
                color: message.role === 'user' ? '#fff' : '#1f2937',
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
                      title="Mark this response as verified/correct"
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
                      title="Mark this response as modified/learned"
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
