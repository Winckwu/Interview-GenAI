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

/**
 * Chat Session Page
 * Main interface for user-AI interaction with pattern tracking
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

  // Session metadata
  const [sessionData, setSessionData] = useState<any>(null);

  // Load session data on mount
  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }

    const loadSession = async () => {
      try {
        const response = await api.get(`/sessions/${sessionId}`);
        setSessionData(response.data.data.session);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load session');
      }
    };

    loadSession();
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
    try {
      await api.patch(`/interactions/${messageId}`, { wasVerified: true });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, wasVerified: true } : msg
        )
      );
    } catch (err: any) {
      setError('Failed to mark as verified');
    }
  };

  /**
   * Mark interaction as modified
   */
  const markAsModified = async (messageId: string) => {
    try {
      await api.patch(`/interactions/${messageId}`, { wasModified: true });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, wasModified: true } : msg
        )
      );
    } catch (err: any) {
      setError('Failed to mark as modified');
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
      A: '#10b981', // green
      B: '#3b82f6', // blue
      C: '#f59e0b', // amber
      D: '#8b5cf6', // purple
      E: '#ec4899', // pink
      F: '#ef4444', // red
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ padding: '1rem', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600' }}>Chat Session</h1>
            {sessionData && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Task: {sessionData.taskDescription || 'General Discussion'} • Type: {sessionData.taskType || 'unknown'}
              </p>
            )}
          </div>
          <button
            onClick={endSession}
            disabled={!sessionActive}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: sessionActive ? 'pointer' : 'not-allowed',
              opacity: sessionActive ? 1 : 0.5,
            }}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', borderBottom: '1px solid #fecaca', color: '#991b1b' }}>
          {error}
        </div>
      )}

      {/* Pattern detection banner */}
      {showPattern && pattern && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            borderBottom: '1px solid #bfdbfe',
            borderLeft: `4px solid ${getPatternColor(pattern.pattern)}`,
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af' }}>
              Pattern Detected
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: getPatternColor(pattern.pattern),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                }}
              >
                {pattern.pattern}
              </div>
              <div>
                <p style={{ margin: '0', fontWeight: '600', color: '#1f2937' }}>
                  {getPatternLabel(pattern.pattern)}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  Confidence: {(pattern.confidence * 100).toFixed(1)}%
                </p>
                {pattern.reasoning && (
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>
                    {pattern.reasoning.slice(0, 2).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
            <p>Start by asking a question or describing your task...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: message.role === 'user' ? '#3b82f6' : '#e5e7eb',
                color: message.role === 'user' ? '#fff' : '#1f2937',
              }}
            >
              <p style={{ margin: '0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.7 }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>

              {/* Action buttons for AI messages */}
              {message.role === 'ai' && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => markAsVerified(message.id)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: message.wasVerified ? '#10b981' : 'rgba(255,255,255,0.2)',
                      color: message.wasVerified ? '#fff' : 'currentColor',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    {message.wasVerified ? '✓ Verified' : 'Verify'}
                  </button>
                  <button
                    onClick={() => markAsModified(message.id)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: message.wasModified ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                      color: message.wasModified ? '#fff' : 'currentColor',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    {message.wasModified ? '✎ Modified' : 'Modify'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem 0' }}>
            <p>AI is thinking...</p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <form
          onSubmit={handleSendMessage}
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your prompt here..."
            disabled={!sessionActive || loading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              opacity: !sessionActive ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={!sessionActive || loading || !userInput.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: !sessionActive || loading || !userInput.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: !sessionActive || loading || !userInput.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSessionPage;
