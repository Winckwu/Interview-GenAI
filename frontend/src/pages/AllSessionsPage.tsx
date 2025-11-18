import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

import type { SessionItem } from '../stores/sessionStore';

/**
 * All Sessions Page
 * Shows a comprehensive list of all user conversations with search and filtering
 */
const AllSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sessions, sessionsLoading, loadSessions, deleteSession: deleteSessionFromStore, error: sessionError } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<SessionItem[]>([]);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Filter sessions based on search query
  useEffect(() => {
    if (!sessions) {
      setFilteredSessions([]);
      return;
    }

    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sessions.filter(
        (session) =>
          session.taskDescription.toLowerCase().includes(query) ||
          session.taskType.toLowerCase().includes(query)
      );
      setFilteredSessions(filtered);
    }
  }, [sessions, searchQuery]);

  /**
   * Delete a session from the list
   */
  const deleteSession = async (sessionToDeleteId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await deleteSessionFromStore(sessionToDeleteId);
    } catch (err: any) {
      console.error('Failed to delete session:', err);
    }
  };

  if (sessionsLoading) {
    return <LoadingSpinner message="Loading all conversations..." />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                color: '#0284c7',
                fontSize: '1rem',
                fontWeight: '500',
                borderRadius: '6px',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ← Back
            </button>
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            All Conversations
          </h1>
          <p className="page-subtitle" style={{ margin: '0', color: '#666', fontSize: '1rem' }}>
            Viewing {filteredSessions.length} of {sessions.length} conversations
          </p>
        </div>
      </div>

      {sessionError && (
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#fef2f2',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            color: '#991b1b',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>✕</span>
          <span style={{ fontWeight: '500' }}>{sessionError}</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search conversations by title or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            transition: 'all 200ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
          }}
        />
      </div>

      {/* Conversations List */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}>
        {filteredSessions.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
              {searchQuery ? 'Try a different search term' : 'Start a new chat to create your first conversation'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
            {filteredSessions.map((session, index) => {
              const isHoveringCard = hoveredSessionId === session.id;
              return (
                <div
                  key={session.id}
                  style={{
                    position: 'relative',
                    borderBottom: index < filteredSessions.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: '#fff',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                >
                  <button
                    onClick={() => navigate(`/session/${session.id}`)}
                    style={{
                      padding: '1.5rem',
                      background: isHoveringCard ? '#f9fafb' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      border: 'none',
                      flex: 1,
                    }}
                  >
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {session.taskDescription}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'center',
                    }}>
                      <span>
                        📅 {new Date(session.startedAt || session.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span style={{ textTransform: 'capitalize' }}>
                        📌 Type: {session.taskType}
                      </span>
                    </div>
                  </button>
                  {isHoveringCard && (
                    <div style={{
                      padding: '0.75rem',
                      borderTop: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      backgroundColor: '#fafafa',
                    }}>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
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
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSessionsPage;
