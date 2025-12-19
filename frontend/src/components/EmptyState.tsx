import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty State Component
 *
 * Displayed when there's no content to show.
 * Provides helpful information and suggested actions.
 *
 * Usage:
 * <EmptyState
 *   icon="📭"
 *   title="No messages yet"
 *   description="Start a conversation to get going"
 *   action={{ label: 'New message', onClick: handleNew }}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </div>

      <h3 className="empty-state-title">{title}</h3>

      {description && <p className="empty-state-description">{description}</p>}

      {action && (
        <button onClick={action.onClick} className="empty-state-action">
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

/* ============================================
   Empty State Variants
   ============================================ */

export const EmptyStateNotFound: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  return (
    <EmptyState
      icon="🔍"
      title="Not found"
      description="The page or content you're looking for doesn't exist"
      action={onGoBack ? { label: 'Go back', onClick: onGoBack } : undefined}
    />
  );
};

export const EmptyStateNoResults: React.FC<{ query?: string; onClear?: () => void }> = ({
  query,
  onClear,
}) => {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={
        query ? `No results found for "${query}". Try a different search.` : 'Try adjusting your search criteria'
      }
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
};

export const EmptyStateError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description="We encountered an error while loading the content"
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  );
};

export const EmptyStateNoAccess: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  return (
    <EmptyState
      icon="🔒"
      title="Access denied"
      description="You don't have permission to access this resource"
      action={onGoBack ? { label: 'Go back', onClick: onGoBack } : undefined}
    />
  );
};
