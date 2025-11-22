/**
 * MRInterventionNotification Component
 *
 * Non-intrusive corner notification for MR intervention recommendations.
 * Displays in the top-right corner when MR panel is closed.
 *
 * Behavior based on user pattern:
 * - Pattern F (HIGH RISK) or Critical priority: Auto-open sidebar
 * - Other patterns: Show corner notification, user clicks to view
 */

import React, { useState, useEffect, useCallback } from 'react';
import { type UserPattern } from '../utils/MRAdaptiveTrigger';

export interface MRNotification {
  id: string;
  icon: string;
  title: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tool: string;
  timestamp: number;
}

export interface MRInterventionNotificationProps {
  notifications: MRNotification[];
  userPattern: UserPattern;
  onNotificationClick: (notification: MRNotification) => void;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  autoOpenThreshold?: 'critical' | 'high' | 'medium'; // Auto-open sidebar for this priority or higher
}

// Priority order for comparison
const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Check if notification should auto-open sidebar
 */
export function shouldAutoOpenSidebar(
  notification: MRNotification,
  userPattern: UserPattern,
  threshold: 'critical' | 'high' | 'medium' = 'high'
): boolean {
  // Pattern F always auto-opens (high-risk users need immediate attention)
  if (userPattern === 'F') {
    return true;
  }

  // Critical priority always auto-opens
  if (notification.priority === 'critical') {
    return true;
  }

  // Check against threshold
  const notificationLevel = PRIORITY_ORDER[notification.priority] || 0;
  const thresholdLevel = PRIORITY_ORDER[threshold] || 0;

  return notificationLevel >= thresholdLevel;
}

/**
 * Single notification card
 */
const NotificationCard: React.FC<{
  notification: MRNotification;
  onClose: () => void;
  onClick: () => void;
  isNew: boolean;
}> = ({ notification, onClose, onClick, isNew }) => {
  const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
    high: { bg: '#fff7ed', border: '#f97316', text: '#ea580c' },
    medium: { bg: '#fefce8', border: '#eab308', text: '#ca8a04' },
    low: { bg: '#f0fdf4', border: '#22c55e', text: '#16a34a' },
  };

  const colors = priorityColors[notification.priority] || priorityColors.medium;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: isNew ? 'slideIn 0.3s ease-out' : 'none',
        maxWidth: '320px',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{notification.icon}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.25rem',
          }}
        >
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1f2937',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {notification.title}
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: colors.text,
              backgroundColor: `${colors.border}20`,
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              flexShrink: 0,
            }}
          >
            {notification.priority}
          </span>
        </div>
        <p
          style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            margin: 0,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {notification.reason}
        </p>
        <span
          style={{
            fontSize: '0.625rem',
            color: '#9ca3af',
            marginTop: '0.375rem',
            display: 'block',
          }}
        >
          Click to view details
        </span>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          padding: '0.25rem',
          fontSize: '1rem',
          lineHeight: 1,
          borderRadius: '0.25rem',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.color = '#4b5563';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }}
        title="Dismiss"
      >
        &times;
      </button>
    </div>
  );
};

/**
 * Main notification container
 */
export const MRInterventionNotification: React.FC<MRInterventionNotificationProps> = ({
  notifications,
  userPattern,
  onNotificationClick,
  onDismiss,
  onDismissAll,
}) => {
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());

  // Track new notifications for animation
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const newIds = notifications
      .filter((n) => !newNotificationIds.has(n.id))
      .map((n) => n.id);

    if (newIds.length > 0) {
      setNewNotificationIds((prev) => new Set([...prev, ...newIds]));

      // Remove "new" status after animation
      setTimeout(() => {
        setNewNotificationIds((prev) => {
          const updated = new Set(prev);
          newIds.forEach((id) => updated.delete(id));
          return updated;
        });
      }, 300);
    }
  }, [notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* CSS Animation */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
            }
            50% {
              box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
            }
          }
        `}
      </style>

      {/* Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
        }}
      >
        {/* Header with dismiss all */}
        {notifications.length > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '0.5rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#4b5563',
              }}
            >
              {notifications.length} MR Recommendations
            </span>
            <button
              onClick={onDismissAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline',
              }}
            >
              Dismiss all
            </button>
          </div>
        )}

        {/* Notification Cards */}
        {notifications.slice(0, 3).map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            isNew={newNotificationIds.has(notification.id)}
            onClick={() => onNotificationClick(notification)}
            onClose={() => onDismiss(notification.id)}
          />
        ))}

        {/* More indicator */}
        {notifications.length > 3 && (
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#6b7280',
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '0.375rem',
            }}
          >
            +{notifications.length - 3} more recommendations
          </div>
        )}
      </div>
    </>
  );
};

export default MRInterventionNotification;
