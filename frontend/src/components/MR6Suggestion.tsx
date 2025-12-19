/**
 * MR6Suggestion Component - Compact Version
 *
 * Displays MR6 Cross-Model Comparison suggestion after AI messages.
 * Redesigned: Icon button with tooltip, click to expand options.
 */

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Scale } from 'lucide-react';

export interface MR6SuggestionProps {
  messageId: string;
  isExpanded: boolean;
  onExpand: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

export const MR6Suggestion: React.FC<MR6SuggestionProps> = ({
  messageId,
  isExpanded,
  onExpand,
  onAccept,
  onDismiss,
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
        title="Compare with other AI models (GPT-4, Claude, Gemini)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          padding: 0,
          backgroundColor: showMenu ? '#dbeafe' : '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '50%',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#dbeafe';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          if (!showMenu) e.currentTarget.style.backgroundColor = '#eff6ff';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Scale size={16} strokeWidth={2} />
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
            padding: '0.75rem',
            minWidth: '200px',
            zIndex: 100,
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            <Scale size={14} strokeWidth={2} /> Multi-Model Comparison
          </div>

          <div style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            marginBottom: '0.75rem',
            lineHeight: 1.4,
          }}>
            Compare outputs from GPT-4, Claude, and Gemini to find the best solution.
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { onAccept(); setShowMenu(false); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Compare
            </button>

            <button
              onClick={() => { onDismiss(); setShowMenu(false); }}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'none',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MR6Suggestion;
