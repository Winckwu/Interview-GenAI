import React from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import FloatingNotification from './FloatingNotification';

/**
 * Notification Container Component
 * Displays all floating notifications in bottom-right corner
 */
const NotificationContainer: React.FC = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  // Only show the 3 most recent unread notifications as floating
  const floatingNotifications = notifications
    .filter((n) => !n.isRead)
    .slice(0, 3);

  if (floatingNotifications.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
        pointerEvents: 'none', // Allow clicks to pass through to underlying content
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {floatingNotifications.map((notification) => (
          <FloatingNotification
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
            onActionClick={() => {
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;
