/**
 * QuickReflection Component - Compact Version
 *
 * Displays MR14 Guided Reflection quick prompts after AI messages.
 * Redesigned: Icon button with dropdown menu on click.
 */

import React, { useState, useRef, useEffect } from 'react';

export type ReflectionResponse = 'confident' | 'needs-verify' | 'uncertain' | 'skip';

export interface QuickReflectionProps {
  messageId: string;
  isExpanded: boolean;
  onExpand: () => void;
  onRespond: (response: ReflectionResponse) => void;
}

export const QuickReflection: React.FC<QuickReflectionProps> = ({
  messageId,
  isExpanded,
  onExpand,
  onRespond,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Icon Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        title="Quick Reflection: How confident are you in this response?"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          padding: 0,
          backgroundColor: showMenu ? '#fef3c7' : '#fffbeb',
          border: 'none',
          borderRadius: '50%',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef3c7';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          if (!showMenu) e.currentTarget.style.backgroundColor = '#fffbeb';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        💭
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '0.5rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            padding: '0.5rem',
            minWidth: '160px',
            zIndex: 100,
          }}
        >
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: '#6b7280',
            padding: '0.25rem 0.5rem',
            marginBottom: '0.25rem',
          }}>
            Quick Reflection
          </div>

          <button
            onClick={() => { onRespond('confident'); setShowMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#10b981',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✓ Confident
          </button>

          <button
            onClick={() => { onRespond('needs-verify'); setShowMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#f59e0b',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fefce8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            🔍 Need to Verify
          </button>

          <button
            onClick={() => { onRespond('uncertain'); setShowMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#ef4444',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ❓ Uncertain
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickReflection;
