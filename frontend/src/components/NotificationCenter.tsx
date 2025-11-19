import React from 'react';
import './NotificationCenter.css';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // in ms, 0 = permanent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

/**
 * Global Notification Center Component
 *
 * Displays toast notifications with support for:
 * - Multiple notification types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Custom actions (retry, undo, etc.)
 * - WCAG 2.1 AA accessibility (aria-live regions)
 * - Stacked layout with fade in/out animations
 *
 * Usage:
 * 1. Add to your app root
 * 2. Use notification store or context to add notifications
 * 3. Notifications automatically dismiss after duration
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
}) => {
  const getIcon = (type: Notification['type']) => {
    const icons: Record<Notification['type'], string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type];
  };

  const getAriaLive = (type: Notification['type']) => {
    // Errors and warnings need immediate announcement
    return type === 'error' || type === 'warning' ? 'assertive' : 'polite';
  };

  return (
    <div
      className="notification-center"
      role="region"
      aria-label="Notifications"
      aria-live={notifications.some((n) => n.type === 'error' || n.type === 'warning') ? 'assertive' : 'polite'}
      aria-atomic="false"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          role="alert"
          aria-live={getAriaLive(notification.type)}
          aria-atomic="true"
        >
          <div className="notification-content">
            <div className="notification-icon">
              {getIcon(notification.type)}
            </div>
            <div className="notification-text">
              <div className="notification-title">{notification.title}</div>
              {notification.message && (
                <div className="notification-message">{notification.message}</div>
              )}
            </div>
          </div>

          {(notification.action || notification.duration === 0) && (
            <div className="notification-actions">
              {notification.action && (
                <button
                  className="notification-action-btn"
                  onClick={notification.action.onClick}
                  aria-label={notification.action.label}
                >
                  {notification.action.label}
                </button>
              )}
              <button
                className="notification-close-btn"
                onClick={() => onDismiss(notification.id)}
                aria-label={`Dismiss notification: ${notification.title}`}
                title="Close"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;

/* ============================================
   Notification Hook for Easy Usage
   ============================================ */

import { useCallback as useCallbackHook } from 'react';

export interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

/**
 * Hook to use the notification store
 * Must be used within a NotificationProvider context
 */
/**
 * Implementation note: This is a template for notification management.
 * In a real application, use a state management solution (Zustand, Redux, Context)
 * with proper cleanup of timeouts when notifications are dismissed.
 *
 * Example with React Context + useReducer:
 * - Track timeout IDs for each notification
 * - Clear timeout when notification is dismissed manually
 * - Allow callbacks to handle dismissal and cleanup
 */
export const useNotifications = (): NotificationStore => {
  // This would normally come from a context/state management
  // For now, we'll document the expected interface
  // Implementation depends on your state management solution (Zustand, Redux, etc.)

  // In production, maintain a Map of notification IDs to timeout IDs
  const timeoutMap = new Map<string, NodeJS.Timeout>();

  const addNotification = useCallbackHook((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;

    // Auto-dismiss if duration is set (0 = permanent)
    if (notification.duration !== undefined && notification.duration > 0) {
      // IMPORTANT: In production, store this timeout ID to clear it on manual dismiss
      const timeoutId = setTimeout(() => {
        // Call dismissNotification through state management
        // dismissNotification(id);
        timeoutMap.delete(id);
      }, notification.duration);

      timeoutMap.set(id, timeoutId);
    }

    return id;
  }, []);

  // Ensure timeouts are cleared when dismissing
  const dismissNotification = useCallbackHook((id: string) => {
    const timeoutId = timeoutMap.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutMap.delete(id);
    }
    // Call actual dismiss logic through state management
  }, []);

  return {
    notifications: [],
    addNotification,
    dismissNotification,
    clearNotifications: () => {
      // Clear all pending timeouts
      timeoutMap.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutMap.clear();
    },
  };
};

/* ============================================
   Retry Logic for API Calls
   ============================================ */

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Wrapper function with exponential backoff retry logic
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Promise with retry logic
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = config;

  let lastError: Error = new Error('Unknown error');
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
};

/* ============================================
   Confirmation Dialog Utilities
   ============================================ */

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

/**
 * Native confirmation dialog (can be replaced with custom modal)
 * @param options - Confirmation options
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export const confirm = async (options: ConfirmationOptions): Promise<boolean> => {
  // This would typically be replaced with a proper modal component
  // For now, we'll provide a documented interface

  const message = `${options.title}\n\n${options.message}`;
  return window.confirm(message);
};
