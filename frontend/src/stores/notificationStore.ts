import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'pattern' | 'suggestion' | 'achievement' | 'system' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
  autoDismissMs?: number; // Auto-dismiss after X milliseconds, null for never
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearOld: (olderThanMs: number) => void;
}

/**
 * Notification Store
 * Manages system-wide notifications for user awareness
 *
 * Notification types:
 * - pattern: Pattern recognition updates
 * - suggestion: Smart improvement suggestions
 * - achievement: User achievements/milestones
 * - system: General system announcements
 * - error: Error/warning messages
 */
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      isRead: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Auto-dismiss if specified
    if (notification.autoDismissMs) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.autoDismissMs);
    }

    return id;
  },

  removeNotification: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.isRead ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id && !n.isRead
          ? { ...n, isRead: true }
          : n
      ),
      unreadCount: state.notifications.find((n) => n.id === id)?.isRead === false
        ? state.unreadCount - 1
        : state.unreadCount,
    }));
  },

  markAllAsRead: () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  clearOld: (olderThanMs: number) => {
    const cutoffTime = new Date(Date.now() - olderThanMs);
    set((state) => {
      const remainingNotifications = state.notifications.filter(
        (n) => new Date(n.timestamp) > cutoffTime
      );
      const removedUnread = state.notifications
        .filter((n) => new Date(n.timestamp) <= cutoffTime && !n.isRead)
        .length;

      return {
        notifications: remainingNotifications,
        unreadCount: Math.max(0, state.unreadCount - removedUnread),
      };
    });
  },
}));
