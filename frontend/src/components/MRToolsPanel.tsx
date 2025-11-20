/**
 * MRToolsPanel Component
 *
 * Displays MR (Metacognitive Response) tools section:
 * - MR tool grid selector
 * - Active MR tool display area with lazy-loaded components
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 3 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React, { Suspense } from 'react';
import { type ActiveMRTool } from '../hooks/useMRTools';
import styles from './MRToolsPanel.module.css';

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
  <div className={styles.loadingComponent}>
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
      <div className={styles.toolsSection}>
        <button
          onClick={onToggleMRToolsSection}
          className={styles.toggleButton}
        >
          <span className={styles.toggleLabel}>
            🧠 MR Tools
          </span>
          <span className={styles.toggleIcon}>
            {showMRToolsSection ? '▼' : '▶'}
          </span>
        </button>
        {showMRToolsSection && (
          <div className={styles.gridContainer}>
            <div className={styles.toolsGrid}>
              {/* User-facing MR tools only. MR8/9/18/19 are automatic backend systems */}
              {mrTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onToolChange(tool.id)}
                  title={tool.title}
                  className={styles.toolButton}
                  style={{
                    backgroundColor: activeMRTool === tool.id ? tool.color : undefined,
                  }}
                >
                  {tool.label}
                </button>
              ))}
              <button
                onClick={() => onToolChange('none')}
                title="Close MR tool"
                className={styles.closeToolButton}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active MR Tool Display */}
      {activeMRTool !== 'none' && (
        <div className={styles.activeToolSection}>
          {/* Active Tool Header */}
          <div className={styles.activeToolHeader}>
            <span className={styles.activeToolLabel}>
              Active: MR{activeMRTool.split('-')[0].replace('mr', '')}
            </span>
            <button
              onClick={() => onToolChange('none')}
              className={styles.activeToolCloseButton}
              title="Close tool"
            >
              ✕
            </button>
          </div>
          {/* Tool Content */}
          <div className={styles.activeToolContent}>
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
