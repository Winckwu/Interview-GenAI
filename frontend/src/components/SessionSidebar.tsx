/**
 * SessionSidebar Component
 *
 * Left sidebar displaying:
 * - List of conversation sessions
 * - Session selection and navigation
 * - Delete session functionality
 * - New conversation button
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 3 refactoring.
 */

import React from 'react';
import EmptyState from './EmptyState';
import { SkeletonCard } from './Skeleton';

export interface SessionItem {
  id: string;
  taskDescription: string;
  startedAt?: string;
  createdAt: string;
  taskType?: string;
  taskImportance?: number;
}

export interface SessionSidebarProps {
  // Visibility
  isOpen: boolean;
  onClose: () => void;

  // Sessions data
  sessions: SessionItem[];
  sessionsLoading: boolean;
  currentSessionId: string | undefined;

  // Session actions
  onSessionClick: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onNewChat: () => void;

  // Hover state
  hoveredSessionId: string | null;
  onHoverSession: (sessionId: string | null) => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  sessionsLoading,
  currentSessionId,
  onSessionClick,
  onDeleteSession,
  onNewChat,
  hoveredSessionId,
  onHoverSession,
}) => {
  return (
    <aside
      style={{
        width: isOpen ? '280px' : '0',
        backgroundColor: '#fff',
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto',
        transition: 'width 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isOpen ? '2px 0 8px rgba(0, 0, 0, 0.08)' : 'none',
        zIndex: 10,
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          Conversations
        </h3>
        <button
          onClick={onClose}
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
            action={{ label: 'New conversation', onClick: onNewChat }}
            className="sessions-empty-state"
          />
        ) : (
          sessions.map((session) => {
            const isHovering = hoveredSessionId === session.id;
            const isActive = session.id === currentSessionId;

            return (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                  position: 'relative',
                }}
                onMouseEnter={() => onHoverSession(session.id)}
                onMouseLeave={() => onHoverSession(null)}
              >
                <button
                  onClick={() => onSessionClick(session.id)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: `1px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    backgroundColor: isActive ? '#eff6ff' : '#fff',
                    color: isActive ? '#1e40af' : '#4b5563',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={session.taskDescription}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {session.taskDescription}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {new Date(session.startedAt || session.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </button>
                {isHovering && (
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
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

      {/* Sidebar Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem' }}>
          💡 Tip: Click the menu to switch conversations
        </div>
      </div>
    </aside>
  );
};

export default SessionSidebar;
