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
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React from 'react';
import EmptyState from './EmptyState';
import { SkeletonCard } from './Skeleton';
import styles from './SessionSidebar.module.css';

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
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      {/* Sidebar Header */}
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Conversations</h3>
        <button
          onClick={onClose}
          aria-label="Close conversations sidebar"
          className={styles.closeButton}
          title="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* Sessions List */}
      <div className={styles.sessionsList}>
        {sessionsLoading ? (
          <div className={styles.loadingContainer}>
            <SkeletonCard />
            <div className={styles.skeletonSpacer}>
              <SkeletonCard />
            </div>
            <div className={styles.skeletonSpacer}>
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
                className={styles.sessionItemContainer}
                onMouseEnter={() => onHoverSession(session.id)}
                onMouseLeave={() => onHoverSession(null)}
              >
                <button
                  onClick={() => onSessionClick(session.id)}
                  className={`${styles.sessionButton} ${isActive ? styles.active : ''}`}
                  title={session.taskDescription}
                >
                  <div className={styles.sessionTitle}>
                    {session.taskDescription}
                  </div>
                  <div className={styles.sessionTimestamp}>
                    {new Date(session.startedAt || session.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </button>
                {isHovering && (
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    aria-label={`Delete conversation: ${session.taskDescription}`}
                    className={styles.deleteButton}
                    title="Delete conversation"
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
      <div className={styles.footer}>
        <div className={styles.footerTip}>
          💡 Tip: Click the menu to switch conversations
        </div>
      </div>
    </aside>
  );
};

export default SessionSidebar;
