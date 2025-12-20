/**
 * MRToolsPanel Component
 *
 * Displays MR (Metacognitive Response) tools section:
 * - MR tool grid selector
 * - Floating modal for active MR tool content
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 3 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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

// MR tool configuration with colors and titles
const mrTools = [
  { id: 'mr1-decomposition' as ActiveMRTool, label: '📋 1', title: 'Task Decomposition', fullTitle: 'Break down complex tasks', color: '#dcfce7' },
  { id: 'mr2-transparency' as ActiveMRTool, label: '🔍 2', title: 'Process Transparency', fullTitle: 'View AI reasoning', color: '#dbeafe' },
  { id: 'mr3-agency' as ActiveMRTool, label: '🎛️ 3', title: 'Agency Control', fullTitle: 'Control AI intervention', color: '#fef3c7' },
  { id: 'mr4-roles' as ActiveMRTool, label: '🎭 4', title: 'Role Definition', fullTitle: 'Define AI roles', color: '#ffedd5' },
  { id: 'mr5-iteration' as ActiveMRTool, label: '🔄 5', title: 'Low-Cost Iteration', fullTitle: 'Branch conversations', color: '#e0f2fe' },
  { id: 'mr6-models' as ActiveMRTool, label: '🤖 6', title: 'Cross-Model', fullTitle: 'Compare AI models', color: '#fce7f3' },
  { id: 'mr7-failure' as ActiveMRTool, label: '💡 7', title: 'Failure Tolerance', fullTitle: 'Learn from mistakes', color: '#fef9c3' },
  { id: 'mr10-cost' as ActiveMRTool, label: '💰 10', title: 'Cost-Benefit', fullTitle: 'Evaluate AI assistance value', color: '#e0e7ff' },
  { id: 'mr11-verify' as ActiveMRTool, label: '✅ 11', title: 'Verification', fullTitle: 'Verify AI outputs', color: '#d1fae5' },
  { id: 'mr12-critical' as ActiveMRTool, label: '🧐 12', title: 'Critical Thinking', fullTitle: 'Socratic questions', color: '#ede9fe' },
  { id: 'mr13-uncertainty' as ActiveMRTool, label: '❓ 13', title: 'Uncertainty', fullTitle: 'Show confidence levels', color: '#fef3c7' },
  { id: 'mr14-reflection' as ActiveMRTool, label: '💭 14', title: 'Reflection', fullTitle: 'Learning reflection', color: '#ccfbf1' },
  { id: 'mr15-strategies' as ActiveMRTool, label: '📚 15', title: 'Strategy Guide', fullTitle: 'AI collaboration strategies', color: '#f3e8ff' },
  { id: 'mr16-atrophy' as ActiveMRTool, label: '💪 16', title: 'Skill Prevention', fullTitle: 'Maintain your skills', color: '#fecaca' },
  { id: 'mr17-visualization' as ActiveMRTool, label: '📈 17', title: 'Visualization', fullTitle: 'Track learning progress', color: '#bfdbfe' },
];

export const MRToolsPanel: React.FC<MRToolsPanelProps> = ({
  activeMRTool,
  onToolChange,
  showMRToolsSection,
  onToggleMRToolsSection,
  renderActiveTool,
  loadingFallback = <ComponentLoader />,
}) => {
  // Get active tool info
  const activeTool = mrTools.find(t => t.id === activeMRTool);
  const isModalOpen = activeMRTool !== 'none' && !!activeTool;

  // Resizable modal state
  const [modalSize, setModalSize] = useState({ width: 900, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Draggable modal state
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        onToolChange('none');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, onToolChange]);

  // Handle resize from any edge/corner
  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: modalSize.width,
      startHeight: modalSize.height,
      startPosX: modalPosition.x,
      startPosY: modalPosition.y,
    };
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current || !resizeDirection) return;

      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;

      let newWidth = resizeRef.current.startWidth;
      let newHeight = resizeRef.current.startHeight;
      let newPosX = resizeRef.current.startPosX;
      let newPosY = resizeRef.current.startPosY;

      // Handle horizontal resizing
      // Note: Modal is centered via flexbox, so position change = half of size change
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(400, Math.min(window.innerWidth * 0.95, resizeRef.current.startWidth + deltaX));
        // Compensate for flexbox centering: move right by half the width increase
        newPosX = resizeRef.current.startPosX + (newWidth - resizeRef.current.startWidth) / 2;
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.max(400, resizeRef.current.startWidth - deltaX);
        // Compensate for flexbox centering: move left by half the width increase
        newPosX = resizeRef.current.startPosX - (newWidth - resizeRef.current.startWidth) / 2;
      }

      // Handle vertical resizing
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(300, Math.min(window.innerHeight * 0.9, resizeRef.current.startHeight + deltaY));
        // Compensate for flexbox centering: move down by half the height increase
        newPosY = resizeRef.current.startPosY + (newHeight - resizeRef.current.startHeight) / 2;
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.max(300, resizeRef.current.startHeight - deltaY);
        // Compensate for flexbox centering: move up by half the height increase
        newPosY = resizeRef.current.startPosY - (newHeight - resizeRef.current.startHeight) / 2;
      }

      setModalSize({ width: newWidth, height: newHeight });
      setModalPosition({ x: newPosX, y: newPosY });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      setResizeDirection(null);
      resizeRef.current = null;
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, resizeDirection]);

  // Handle drag
  const handleDragStart = (e: React.MouseEvent) => {
    // Only start drag if clicking on the header area (not buttons)
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: modalPosition.x,
      startPosY: modalPosition.y,
    };
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setModalPosition({
        x: dragRef.current.startPosX + deltaX,
        y: dragRef.current.startPosY + deltaY,
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // Reset position when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setModalPosition({ x: 0, y: 0 });
    }
  }, [isModalOpen]);

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
                  title={`${tool.title} - ${tool.fullTitle}`}
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

      {/* Floating Modal for Active MR Tool - rendered via portal */}
      {/* Modal can be dragged and allows interaction with chat behind */}
      {isModalOpen && activeTool && createPortal(
        <div
          className={styles.modalOverlay}
          style={{
            cursor: isResizing
              ? resizeDirection === 'n' || resizeDirection === 's' ? 'ns-resize'
              : resizeDirection === 'e' || resizeDirection === 'w' ? 'ew-resize'
              : resizeDirection === 'ne' || resizeDirection === 'sw' ? 'nesw-resize'
              : 'nwse-resize'
              : isDragging ? 'grabbing' : undefined
          }}
        >
          <div
            className={styles.modalContent}
            style={{
              width: modalSize.width,
              height: modalSize.height,
              maxWidth: '95vw',
              maxHeight: '90vh',
              transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
            }}
          >
            {/* Modal Header - Draggable */}
            <div
              className={styles.modalHeader}
              style={{ borderColor: activeTool.color, cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleDragStart}
            >
              <div className={styles.modalTitleArea}>
                <span className={styles.modalIcon}>{activeTool.label.split(' ')[0]}</span>
                <div>
                  <h2 className={styles.modalTitle}>{activeTool.title}</h2>
                  <p className={styles.modalSubtitle}>{activeTool.fullTitle}</p>
                </div>
              </div>
              <button
                onClick={() => onToolChange('none')}
                className={styles.modalCloseButton}
                title="Close (ESC)"
              >
                ✕
              </button>
            </div>
            {/* Modal Body */}
            <div className={styles.modalBody}>
              <Suspense fallback={loadingFallback}>
                {renderActiveTool()}
              </Suspense>
            </div>
            {/* Resize Handles - All edges and corners */}
            <div className={styles.resizeHandleN} onMouseDown={handleResizeStart('n')} />
            <div className={styles.resizeHandleS} onMouseDown={handleResizeStart('s')} />
            <div className={styles.resizeHandleE} onMouseDown={handleResizeStart('e')} />
            <div className={styles.resizeHandleW} onMouseDown={handleResizeStart('w')} />
            <div className={styles.resizeHandleNE} onMouseDown={handleResizeStart('ne')} />
            <div className={styles.resizeHandleNW} onMouseDown={handleResizeStart('nw')} />
            <div className={styles.resizeHandleSE} onMouseDown={handleResizeStart('se')} />
            <div className={styles.resizeHandleSW} onMouseDown={handleResizeStart('sw')} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MRToolsPanel;
