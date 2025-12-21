/**
 * RegenerateDropdown Component
 *
 * Dropdown menu for regenerating AI responses with model selection.
 * Creates a new branch so you can switch between different responses.
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './MessageItem.module.css';

export type ModelType = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';

export interface RegenerateOptions {
  model: ModelType;
  createNewBranch: boolean; // Always true now, kept for API compatibility
}

interface RegenerateDropdownProps {
  onRegenerate: (options: RegenerateOptions) => void;
  disabled?: boolean;
  currentModel?: ModelType;
}

const MODEL_INFO: Record<ModelType, { name: string; desc: string; icon: string }> = {
  'gpt-4o': { name: 'GPT-4o', desc: 'Most capable', icon: '🚀' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', desc: 'Fast & balanced', icon: '⚡' },
  'gpt-3.5-turbo': { name: 'GPT-3.5', desc: 'Quick & simple', icon: '💨' },
};

export const RegenerateDropdown: React.FC<RegenerateDropdownProps> = ({
  onRegenerate,
  disabled = false,
  currentModel = 'gpt-4o-mini',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(currentModel);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      await onRegenerate({ model: selectedModel, createNewBranch: true });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Main button */}
      <button
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        title="Regenerate - Create alternative response"
        className={`${styles.actionButton} ${styles.regenerateButton}`}
        style={{
          opacity: (disabled || isLoading) ? 0.6 : 1,
          cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? '⏳' : '↻'}
        <span style={{ fontSize: '10px' }}>▾</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && !isLoading && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: '0',
            marginBottom: '8px',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            minWidth: '200px',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
              🔄 Regenerate Response
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
              Creates a new branch (use ← → to switch)
            </div>
          </div>

          {/* Model selection */}
          <div style={{ padding: '8px' }}>
            {(Object.keys(MODEL_INFO) as ModelType[]).map((model) => (
              <div
                key={model}
                onClick={() => setSelectedModel(model)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedModel === model ? '#eff6ff' : 'transparent',
                  border: selectedModel === model ? '1px solid #3b82f6' : '1px solid transparent',
                  marginBottom: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>{MODEL_INFO[model].icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 500,
                    fontSize: '12px',
                    color: selectedModel === model ? '#1d4ed8' : '#374151',
                  }}>
                    {MODEL_INFO[model].name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                    {MODEL_INFO[model].desc}
                  </div>
                </div>
                {selectedModel === model && (
                  <span style={{ color: '#3b82f6', fontSize: '14px' }}>✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Action button */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={handleRegenerate}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              🔄 Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegenerateDropdown;
