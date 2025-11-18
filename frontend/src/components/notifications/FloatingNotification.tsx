import React, { useState, useEffect } from 'react';
import { Notification } from '../../stores/notificationStore';

interface FloatingNotificationProps {
  notification: Notification;
  onDismiss: () => void;
  onActionClick?: () => void;
}

/**
 * Floating Notification Component
 * Displays transient notifications in the bottom-right corner
 */
const FloatingNotification: React.FC<FloatingNotificationProps> = ({
  notification,
  onDismiss,
  onActionClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss if specified
    if (notification.autoDismissMs) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow animation to complete
      }, notification.autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [notification.autoDismissMs, onDismiss]);

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'pattern':
        return { bg: '#f0fdf4', border: '#86efac', icon: '🎯' };
      case 'suggestion':
        return { bg: '#fef3c7', border: '#fcd34d', icon: '💡' };
      case 'achievement':
        return { bg: '#eff6ff', border: '#93c5fd', icon: '⭐' };
      case 'system':
        return { bg: '#f3f4f6', border: '#d1d5db', icon: '🔔' };
      case 'error':
        return { bg: '#fee2e2', border: '#fecaca', icon: '⚠️' };
      default:
        return { bg: '#f9fafb', border: '#e5e7eb', icon: '📢' };
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'pattern':
        return { text: '#166534', muted: '#15803d' };
      case 'suggestion':
        return { text: '#92400e', muted: '#b45309' };
      case 'achievement':
        return { text: '#0c4a6e', muted: '#075985' };
      case 'system':
        return { text: '#374151', muted: '#6b7280' };
      case 'error':
        return { text: '#991b1b', muted: '#dc2626' };
      default:
        return { text: '#1f2937', muted: '#6b7280' };
    }
  };

  const colors = getBackgroundColor();
  const textColors = getTextColor();

  return (
    <div
      style={{
        animation: isVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          padding: '1rem',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px',
          minWidth: '300px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{colors.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: textColors.text, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              {notification.title}
            </div>
            <div style={{ fontSize: '0.85rem', color: textColors.muted, lineHeight: '1.4' }}>
              {notification.message}
            </div>
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: textColors.muted,
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.5rem',
              height: '1.5rem',
              flexShrink: 0,
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Action Button */}
        {notification.actionLabel && (
          <div style={{ marginTop: '0.75rem' }}>
            <button
              onClick={() => {
                onActionClick?.();
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: 'transparent',
                color: textColors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                width: '100%',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bg;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              {notification.actionLabel}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: '0.7rem', color: textColors.muted, marginTop: '0.5rem' }}>
          {new Date(notification.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(400px);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingNotification;
