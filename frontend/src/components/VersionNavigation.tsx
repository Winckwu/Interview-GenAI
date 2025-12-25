/**
 * VersionNavigation Component
 *
 * Unified version navigation for both user messages and AI responses.
 * Shows a simple <1/N> navigation that works the same way for all message types.
 *
 * Visual Design:
 * - User messages: Green theme (📝)
 * - AI messages: Blue theme (🤖)
 */

import React from 'react';

export interface VersionNavigationProps {
  /** Current version index (0-based) */
  currentIndex: number;
  /** Total number of versions */
  totalVersions: number;
  /** Message type for styling */
  type: 'user' | 'ai';
  /** Callback when user clicks previous */
  onPrevious: () => void;
  /** Callback when user clicks next */
  onNext: () => void;
  /** Optional: Version label to display (e.g., "Original", "GPT-4o") */
  versionLabel?: string;
  /** Optional: Show version label instead of just numbers */
  showLabel?: boolean;
  /** Optional: Tooltip text */
  tooltip?: string;
  /** Optional: Compact mode for smaller display */
  compact?: boolean;
  /** Optional: Disable navigation (e.g., during loading) */
  disabled?: boolean;
}

export const VersionNavigation: React.FC<VersionNavigationProps> = ({
  currentIndex,
  totalVersions,
  type,
  onPrevious,
  onNext,
  versionLabel,
  showLabel = false,
  tooltip,
  compact = false,
  disabled = false,
}) => {
  const canGoPrev = currentIndex > 0 && !disabled;
  const canGoNext = currentIndex < totalVersions - 1 && !disabled;

  // Theme colors based on message type
  const theme = type === 'user'
    ? {
        bg: currentIndex === 0 ? '#f0fdf4' : '#fef3c7',
        border: currentIndex === 0 ? '#86efac' : '#fcd34d',
        text: currentIndex === 0 ? '#15803d' : '#b45309',
        icon: '📝',
        activeColor: '#15803d',
        disabledColor: '#d1d5db',
      }
    : {
        bg: currentIndex === 0 ? '#eff6ff' : '#fce7f3',
        border: currentIndex === 0 ? '#93c5fd' : '#fbcfe8',
        text: currentIndex === 0 ? '#1d4ed8' : '#be185d',
        icon: '🤖',
        activeColor: '#1d4ed8',
        disabledColor: '#d1d5db',
      };

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: compact ? '0.15rem' : '0.25rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '0.375rem',
    padding: compact ? '0.1rem 0.25rem' : '0.15rem 0.35rem',
    fontSize: compact ? '0.65rem' : '0.75rem',
  };

  const buttonStyle = (enabled: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    padding: compact ? '0 0.15rem' : '0 0.25rem',
    fontSize: compact ? '0.65rem' : '0.75rem',
    color: enabled ? theme.activeColor : theme.disabledColor,
    fontWeight: 'bold',
    opacity: enabled ? 1 : 0.4,
    transition: 'opacity 0.15s',
  });

  const labelStyle: React.CSSProperties = {
    color: theme.text,
    fontWeight: '600',
    minWidth: showLabel ? '50px' : 'auto',
    textAlign: 'center',
  };

  const displayText = showLabel && versionLabel
    ? versionLabel
    : `${currentIndex + 1}/${totalVersions}`;

  return (
    <div
      style={containerStyle}
      title={tooltip || `${type === 'user' ? 'Message' : 'Response'} version ${currentIndex + 1} of ${totalVersions}`}
    >
      <span style={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>{theme.icon}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canGoPrev) onPrevious();
        }}
        disabled={!canGoPrev}
        style={buttonStyle(canGoPrev)}
        title={`Previous ${type === 'user' ? 'message version' : 'AI response'}`}
      >
        ◀
      </button>
      <span style={labelStyle}>
        {displayText}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canGoNext) onNext();
        }}
        disabled={!canGoNext}
        style={buttonStyle(canGoNext)}
        title={`Next ${type === 'user' ? 'message version' : 'AI response'}`}
      >
        ▶
      </button>
    </div>
  );
};

export default VersionNavigation;
