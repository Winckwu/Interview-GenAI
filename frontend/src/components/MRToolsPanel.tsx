/**
 * MRToolsPanel Component
 *
 * Displays MR (Metacognitive Response) tools section:
 * - MR tool grid selector
 * - Active MR tool display area with lazy-loaded components
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 3 refactoring.
 */

import React, { Suspense } from 'react';
import { type ActiveMRTool } from '../hooks/useMRTools';

export interface MRToolsPanelProps {
  // MR Tools state
  activeMRTool: ActiveMRTool;
  onToolChange: (tool: ActiveMRTool) => void;
  showMRToolsSection: boolean;
  onToggleMRToolsSection: () => void;

  // Tool content renderer
  renderActiveTool: () => React.ReactNode;

  // Loading fallback
  loadingFallback?: React.ReactNode;
}

const ComponentLoader: React.FC = () => (
  <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
    Loading component...
  </div>
);

export const MRToolsPanel: React.FC<MRToolsPanelProps> = ({
  activeMRTool,
  onToolChange,
  showMRToolsSection,
  onToggleMRToolsSection,
  renderActiveTool,
  loadingFallback = <ComponentLoader />,
}) => {
  // MR tool configuration with colors and titles
  const mrTools = [
    { id: 'mr1-decomposition' as ActiveMRTool, label: '📋 1', title: 'Task Decomposition - Break down complex tasks', color: '#dcfce7' },
    { id: 'mr2-transparency' as ActiveMRTool, label: '🔍 2', title: 'Process Transparency - View AI reasoning', color: '#dbeafe' },
    { id: 'mr3-agency' as ActiveMRTool, label: '🎛️ 3', title: 'Agency Control - Control AI intervention', color: '#fef3c7' },
    { id: 'mr4-roles' as ActiveMRTool, label: '🎭 4', title: 'Role Definition - Define AI roles', color: '#ffedd5' },
    { id: 'mr5-iteration' as ActiveMRTool, label: '🔄 5', title: 'Low-Cost Iteration - Branch conversations', color: '#e0f2fe' },
    { id: 'mr6-models' as ActiveMRTool, label: '🤖 6', title: 'Cross-Model - Compare AI models', color: '#fce7f3' },
    { id: 'mr7-failure' as ActiveMRTool, label: '💡 7', title: 'Failure Tolerance - Learn from mistakes', color: '#fef9c3' },
    { id: 'mr10-cost' as ActiveMRTool, label: '💰 10', title: 'Cost-Benefit Analysis - Evaluate AI assistance value', color: '#e0e7ff' },
    { id: 'mr11-verify' as ActiveMRTool, label: '✅ 11', title: 'Integrated Verification - Verify AI outputs', color: '#d1fae5' },
    { id: 'mr12-critical' as ActiveMRTool, label: '🧐 12', title: 'Critical Thinking - Socratic questions', color: '#ede9fe' },
    { id: 'mr13-uncertainty' as ActiveMRTool, label: '❓ 13', title: 'Transparent Uncertainty - Show confidence levels', color: '#fef3c7' },
    { id: 'mr14-reflection' as ActiveMRTool, label: '💭 14', title: 'Guided Reflection - Learning reflection', color: '#ccfbf1' },
    { id: 'mr15-strategies' as ActiveMRTool, label: '📚 15', title: 'Strategy Guide - AI collaboration strategies', color: '#f3e8ff' },
    { id: 'mr16-atrophy' as ActiveMRTool, label: '💪 16', title: 'Skill Atrophy Prevention - Maintain your skills', color: '#fecaca' },
    { id: 'mr17-visualization' as ActiveMRTool, label: '📈 17', title: 'Learning Visualization - Track learning progress', color: '#bfdbfe' },
  ];

  return (
    <>
      {/* MR Tools Quick Access - Collapsible */}
      <div
        style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#fff',
        }}
      >
        <button
          onClick={onToggleMRToolsSection}
          style={{
            width: '100%',
            padding: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
            }}
          >
            🧠 MR Tools
          </span>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            {showMRToolsSection ? '▼' : '▶'}
          </span>
        </button>
        {showMRToolsSection && (
          <div style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.25rem',
              }}
            >
              {/* User-facing MR tools only. MR8/9/18/19 are automatic backend systems */}
              {mrTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onToolChange(tool.id)}
                  title={tool.title}
                  style={{
                    padding: '0.4rem',
                    backgroundColor: activeMRTool === tool.id ? tool.color : '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    textAlign: 'center',
                  }}
                >
                  {tool.label}
                </button>
              ))}
              <button
                onClick={() => onToolChange('none')}
                title="Close MR tool"
                style={{
                  padding: '0.4rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.6rem',
                  textAlign: 'center',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active MR Tool Display */}
      {activeMRTool !== 'none' && (
        <div
          style={{
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#fff',
          }}
        >
          {/* Active Tool Header */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#f0fdf4',
              borderBottom: '1px solid #dcfce7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                color: '#166534',
                textTransform: 'uppercase',
              }}
            >
              Active: MR{activeMRTool.split('-')[0].replace('mr', '')}
            </span>
            <button
              onClick={() => onToolChange('none')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: '#166534',
                padding: '0.125rem 0.25rem',
              }}
              title="Close tool"
            >
              ✕
            </button>
          </div>
          {/* Tool Content */}
          <div
            style={{
              padding: '0.75rem',
              maxHeight: '50vh',
              overflowY: 'auto',
              fontSize: '0.75rem',
              lineHeight: '1.4',
            }}
          >
            <Suspense fallback={loadingFallback}>
              {renderActiveTool()}
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};

export default MRToolsPanel;
