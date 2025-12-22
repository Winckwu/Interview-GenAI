/**
 * MessageItem Component
 *
 * Displays a single message (user or AI) with:
 * - Message content (markdown support)
 * - Inline editing capability
 * - Timestamp
 * - Action buttons (Verify, Modify for AI messages)
 * - Intervention panels (Trust Indicator, Quick Reflection, MR6 Suggestions)
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import MarkdownText from './common/MarkdownText';
import styles from './MessageItem.module.css';
import { type Message } from '../hooks/useMessages';
import { BranchComparisonModal } from './BranchComparisonModal';
import { BranchBulkOperations } from './BranchBulkOperations';
import { exportBranches } from '../utils/branchExport';
import api from '../services/api';
import { RegenerateDropdown, type RegenerateOptions } from './RegenerateDropdown';

// Re-export Message type for backward compatibility
export type { Message };

export interface MessageItemProps {
  message: Message;
  index: number;

  // Editing state
  isEditing: boolean;
  editedContent: string;
  isUpdating: boolean;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;

  // Actions
  onVerify: () => void;
  onModify: () => void;
  onRegenerate?: (options: RegenerateOptions) => void; // Regenerate AI response with model/branch options
  onViewInsights?: () => void; // Open MR2 insights for this message
  onCriticalThinking?: (content: string) => void; // Open MR12 Critical Thinking for this message
  onEditUserMessage?: () => void; // Edit user message (creates new branch)

  // Branch navigation
  onBranchPrev?: () => void;
  onBranchNext?: () => void;
  onBranchDelete?: () => void;
  onBranchSetAsMain?: () => void;

  // Conversation forking (true branch from this message)
  onForkConversation?: () => void;

  // Conversation branch paths (for user message edits)
  availableBranchPaths?: string[];
  currentBranchPath?: string;
  onSwitchBranchPath?: (branchPath: string) => void;
  editForkMessageIndex?: number | null;

  // Child components (intervention panels)
  trustIndicator?: React.ReactNode;

  // Hide action buttons for simple messages (greetings, etc.)
  hideActionButtons?: boolean;

  // Streaming state - shows typing cursor when true
  isStreaming?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  isEditing,
  editedContent,
  isUpdating,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onVerify,
  onModify,
  onRegenerate,
  onViewInsights,
  onCriticalThinking,
  onEditUserMessage,
  onBranchPrev,
  onBranchNext,
  onBranchDelete,
  onBranchSetAsMain,
  onForkConversation,
  availableBranchPaths = ['main'],
  currentBranchPath = 'main',
  onSwitchBranchPath,
  editForkMessageIndex = null,
  trustIndicator,
  hideActionButtons = false,
  isStreaming = false,
}) => {
  // Modal states
  const [showComparison, setShowComparison] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Fork hint state - shows tooltip when navigating branches
  const [showForkHint, setShowForkHint] = useState(false);
  const forkHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show fork hint when navigating branches
  const handleBranchNavWithHint = (direction: 'prev' | 'next') => {
    // Call the actual navigation
    if (direction === 'prev' && onBranchPrev) {
      onBranchPrev();
    } else if (direction === 'next' && onBranchNext) {
      onBranchNext();
    }

    // Show fork hint if fork is available
    if (onForkConversation) {
      setShowForkHint(true);
      // Clear any existing timeout
      if (forkHintTimeoutRef.current) {
        clearTimeout(forkHintTimeoutRef.current);
      }
      // Auto-hide after 4 seconds
      forkHintTimeoutRef.current = setTimeout(() => {
        setShowForkHint(false);
      }, 4000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (forkHintTimeoutRef.current) {
        clearTimeout(forkHintTimeoutRef.current);
      }
    };
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Export handler
  const handleExport = (format: 'json' | 'csv' | 'markdown') => {
    if (message.branches) {
      exportBranches(message.content, message.branches, message.id, [format]);
      setShowExportMenu(false);
    }
  };

  // Bulk operations handlers
  const handleBulkDelete = async (branchIds: string[]) => {
    if (!message.branches) return;

    // Delete branches from backend
    await Promise.all(branchIds.map(id => api.delete(`/branches/${id}`)));

    // Note: Parent component should handle refreshing the message data
    // This is just for the API calls
  };

  const handleBulkVerify = async (branchIds: string[]) => {
    if (!message.branches) return;

    // Verify branches in backend
    await Promise.all(
      branchIds.map(id => api.patch(`/branches/${id}`, { wasVerified: true }))
    );

    // Note: Parent component should handle refreshing the message data
  };

  const handleBulkExport = (branchIds: string[], format: 'json' | 'csv' | 'markdown') => {
    if (!message.branches) return;

    const selectedBranches = message.branches.filter(b => branchIds.includes(b.id));
    exportBranches(message.content, selectedBranches, message.id, [format]);
  };

  // Calculate branch information
  const hasBranches = message.branches && message.branches.length > 0;
  const currentBranchIndex = message.currentBranchIndex ?? 0;
  const totalBranches = hasBranches ? (message.branches?.length ?? 0) + 1 : 1; // +1 for original

  const canGoPrev = hasBranches && currentBranchIndex > 0;
  const canGoNext = hasBranches && currentBranchIndex < totalBranches - 1;

  // Get current content (either original or from a branch)
  const getCurrentContent = () => {
    if (currentBranchIndex === 0 || !message.branches) {
      return message.content;
    }
    const branch = message.branches[currentBranchIndex - 1];
    return branch?.content || message.content;
  };

  // Get current branch source info
  const getCurrentBranchInfo = () => {
    if (currentBranchIndex === 0) {
      return { label: 'Original', model: undefined };
    }
    const branch = message.branches?.[currentBranchIndex - 1];
    if (branch?.source === 'mr6' && branch.model) {
      return { label: `MR6: ${branch.model}`, model: branch.model };
    }
    if (branch?.source === 'mr5' && branch.model) {
      return { label: `MR5: ${branch.model}`, model: branch.model };
    }
    return { label: `Branch ${currentBranchIndex}`, model: undefined };
  };

  // Get current branch metadata for history display
  const getCurrentBranchMetadata = () => {
    if (currentBranchIndex === 0) {
      return {
        createdAt: message.timestamp,
        source: 'original',
        model: undefined,
        wasVerified: message.wasVerified,
        wasModified: message.wasModified,
      };
    }
    const branch = message.branches?.[currentBranchIndex - 1];
    return branch || null;
  };

  // Calculate branch statistics
  const getBranchStatistics = () => {
    if (!hasBranches || !message.branches) return null;

    const branches = message.branches;
    const mr6Count = branches.filter(b => b.source === 'mr6').length;
    const mr5Count = branches.filter(b => b.source === 'mr5').length;
    const manualCount = branches.filter(b => b.source === 'manual').length;
    const verifiedCount = branches.filter(b => b.wasVerified).length;
    const modifiedCount = branches.filter(b => b.wasModified).length;

    return {
      total: totalBranches,
      mr6: mr6Count,
      mr5: mr5Count,
      manual: manualCount,
      verified: verifiedCount,
      modified: modifiedCount,
    };
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentContent = getCurrentContent();
  const branchInfo = getCurrentBranchInfo();
  const branchMetadata = getCurrentBranchMetadata();
  const branchStats = getBranchStatistics();

  // Keyboard shortcuts for branch navigation
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable keyboard shortcuts for AI messages with branches
    if (message.role !== 'ai' || !hasBranches || isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if this message is in viewport and focused
      if (!messageRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (canGoPrev && onBranchPrev) {
            e.preventDefault();
            onBranchPrev();
          }
          break;
        case 'ArrowRight':
          if (canGoNext && onBranchNext) {
            e.preventDefault();
            onBranchNext();
          }
          break;
        case 'Delete':
          if (currentBranchIndex > 0 && onBranchDelete) {
            e.preventDefault();
            onBranchDelete();
          }
          break;
        case 'Enter':
          if (e.ctrlKey && currentBranchIndex > 0 && onBranchSetAsMain) {
            e.preventDefault();
            onBranchSetAsMain();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasBranches, canGoPrev, canGoNext, currentBranchIndex, isEditing, onBranchPrev, onBranchNext, onBranchDelete, onBranchSetAsMain, message.role]);
  return (
    <div
      ref={messageRef}
      className={`${styles.messageContainer} ${styles[message.role]}`}
      data-message-id={message.id}
      data-message-role={message.role}
      tabIndex={hasBranches && message.role === 'ai' ? 0 : undefined}
    >
      <div
        className={`${styles.messageBubble} ${styles[message.role]} ${
          message.role === 'ai' ? (message.wasVerified ? styles.verified : styles.unverified) : ''
        }`}
      >
        {/* Message Content or Editing UI */}
        {isEditing ? (
          <div className={styles.messageContent}>
            <textarea
              value={editedContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className={styles.editTextarea}
              autoFocus
            />
            <div className={styles.editButtonGroup}>
              <button
                onClick={onSaveEdit}
                disabled={isUpdating}
                className={`${styles.editButton} ${styles.saveButton}`}
              >
                {isUpdating ? '⏳ Saving...' : '💾 Save'}
              </button>
              <button
                onClick={onCancelEdit}
                className={`${styles.editButton} ${styles.cancelButton}`}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messageContent}>
            {/* Web Search Indicator */}
            {message.role === 'ai' && message.webSearchUsed && message.searchResults && (
              <div style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#ecfdf5',
                border: '1px solid #10b981',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#059669',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                }}>
                  🌐 Web Search Results ({message.searchResults.resultCount} sources)
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.25rem',
                }}>
                  {message.searchResults.results.map((result, idx) => (
                    <a
                      key={idx}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.7rem',
                        color: '#047857',
                        textDecoration: 'none',
                        padding: '0.125rem 0.375rem',
                        backgroundColor: '#d1fae5',
                        borderRadius: '0.25rem',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={result.url}
                    >
                      {result.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <MarkdownText content={currentContent} />
            {/* Blinking cursor for streaming */}
            {isStreaming && message.role === 'ai' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1.2em',
                  backgroundColor: '#3b82f6',
                  marginLeft: '2px',
                  animation: 'blink 1s infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </div>
        )}

        {/* Footer Section for AI Messages - metadata & interventions */}
        {message.role === 'ai' && !isEditing && (
          <div className={styles.messageFooter}>
            {/* Timestamp */}
            <div className={styles.timestamp}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* Branch Statistics */}
            {branchStats && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  fontWeight: '500',
                }}
                title={`Total: ${branchStats.total} branches\nMR6: ${branchStats.mr6} | MR5: ${branchStats.mr5} | Manual: ${branchStats.manual}\nVerified: ${branchStats.verified} | Modified: ${branchStats.modified}`}
              >
                <span style={{ color: '#374151' }}>
                  📊 {branchStats.total} branches
                </span>
                {branchStats.mr6 > 0 && <span>MR6: {branchStats.mr6}</span>}
                {branchStats.mr5 > 0 && <span>MR5: {branchStats.mr5}</span>}
                {branchStats.manual > 0 && <span>Manual: {branchStats.manual}</span>}
                {branchStats.verified > 0 && <span style={{ color: '#10b981' }}>✓ {branchStats.verified}</span>}
                {branchStats.modified > 0 && <span style={{ color: '#f59e0b' }}>✎ {branchStats.modified}</span>}
              </div>
            )}

            {/* AI Response Alternatives Navigation - BLUE/PINK theme */}
            {/* Different from user message version navigation (GREEN theme) */}
            {hasBranches && (
              <div
                className={styles.branchNavigation}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.625rem',
                  backgroundColor: currentBranchIndex === 0 ? '#e0f2fe' : '#fce7f3',
                  border: `1px solid ${currentBranchIndex === 0 ? '#bae6fd' : '#fbcfe8'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
                title="Alternative AI responses at this point. Keyboard: ← Previous | → Next | Delete to remove | Ctrl+Enter to set as main"
              >
                {/* Response icon to differentiate from user version navigation */}
                <span style={{ fontSize: '0.7rem', marginRight: '0.15rem' }}>🤖</span>
                <button
                  onClick={() => handleBranchNavWithHint('prev')}
                  disabled={!canGoPrev}
                  title="Previous AI response alternative (←)"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: canGoPrev ? 'pointer' : 'not-allowed',
                    padding: '0.125rem 0.25rem',
                    opacity: canGoPrev ? 1 : 0.3,
                    fontSize: '0.875rem',
                  }}
                >
                  ◀
                </button>
                <span style={{ fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>
                  {branchInfo.label} ({currentBranchIndex + 1}/{totalBranches})
                </span>

                {/* Branch metadata info button */}
                {branchMetadata && (
                  <span
                    title={`Created: ${formatTimestamp(branchMetadata.createdAt)}\nSource: ${branchMetadata.source?.toUpperCase() || 'N/A'}${branchMetadata.model ? `\nModel: ${branchMetadata.model}` : ''}${branchMetadata.wasVerified ? '\n✓ Verified' : ''}${branchMetadata.wasModified ? '\n✎ Modified' : ''}`}
                    style={{
                      marginLeft: '0.25rem',
                      cursor: 'help',
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}
                  >
                    ℹ️
                  </span>
                )}

                <button
                  onClick={() => handleBranchNavWithHint('next')}
                  disabled={!canGoNext}
                  title="Next AI response alternative (→)"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: canGoNext ? 'pointer' : 'not-allowed',
                    padding: '0.125rem 0.25rem',
                    opacity: canGoNext ? 1 : 0.3,
                    fontSize: '0.875rem',
                  }}
                >
                  ▶
                </button>

                {/* Set as Main button - only show for alternatives (not original) */}
                {currentBranchIndex > 0 && onBranchSetAsMain && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBranchSetAsMain();
                    }}
                    title="Set this AI response as the primary answer"
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #f59e0b',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      color: '#92400e',
                      marginLeft: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '600',
                    }}
                  >
                    ⭐ Set as Main
                  </button>
                )}

                {/* Delete button - only show for alternatives (not original) */}
                {currentBranchIndex > 0 && onBranchDelete && (
                  <button
                    onClick={onBranchDelete}
                    title="Delete this AI response alternative"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.125rem 0.25rem',
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      marginLeft: '0.25rem',
                    }}
                  >
                    🗑️
                  </button>
                )}

                {/* Compare AI responses button - show when there are multiple alternatives */}
                {totalBranches > 1 && (
                  <button
                    onClick={() => setShowComparison(true)}
                    title="Compare AI response alternatives side-by-side"
                    style={{
                      background: '#dbeafe',
                      border: '1px solid #3b82f6',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      color: '#1e40af',
                      marginLeft: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '600',
                    }}
                  >
                    🔍 Compare
                  </button>
                )}

                {/* Export branches button - show when there are branches */}
                {hasBranches && message.branches && (
                  <div ref={exportMenuRef} style={{ position: 'relative', marginLeft: '0.5rem' }}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      title="Export branch history"
                      style={{
                        background: '#d1fae5',
                        border: '1px solid #10b981',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        color: '#065f46',
                        borderRadius: '0.25rem',
                        fontWeight: '600',
                      }}
                    >
                      📥 Export
                    </button>

                    {/* Export Menu */}
                    {showExportMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '0.375rem',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          padding: '0.375rem',
                          minWidth: '130px',
                          zIndex: 1000,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <button
                            onClick={() => handleExport('json')}
                            style={{
                              padding: '0.375rem 0.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              color: '#374151',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            📄 Export as JSON
                          </button>
                          <button
                            onClick={() => handleExport('csv')}
                            style={{
                              padding: '0.375rem 0.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              color: '#374151',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            📊 Export as CSV
                          </button>
                          <button
                            onClick={() => handleExport('markdown')}
                            style={{
                              padding: '0.375rem 0.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              color: '#374151',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            📝 Export as Markdown
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fork Conversation button - creates a new conversation timeline from this message */}
                {onForkConversation && (
                  <div style={{ position: 'relative', display: 'inline-block', marginLeft: '0.5rem' }}>
                    <button
                      onClick={onForkConversation}
                      title="Fork conversation from this point - create a new conversation timeline"
                      style={{
                        background: showForkHint ? '#c4b5fd' : '#ddd6fe',
                        border: `1px solid ${showForkHint ? '#7c3aed' : '#8b5cf6'}`,
                        cursor: 'pointer',
                        padding: '0.125rem 0.375rem',
                        fontSize: '0.7rem',
                        color: '#5b21b6',
                        borderRadius: '0.25rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        transform: showForkHint ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: showForkHint ? '0 2px 8px rgba(139, 92, 246, 0.4)' : 'none',
                      }}
                    >
                      🔀 Fork
                    </button>
                    {/* Fork hint tooltip */}
                    {showForkHint && (
                      <div
                        className="fork-hint-tooltip"
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#5b21b6',
                          color: '#fff',
                          fontSize: '0.7rem',
                          borderRadius: '0.375rem',
                          whiteSpace: 'nowrap',
                          zIndex: 100,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }}
                      >
                        💡 Click Fork to create a new conversation branch!
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #5b21b6',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Bulk operations button - show when there are multiple branches */}
                {hasBranches && message.branches && message.branches.length > 1 && (
                  <button
                    onClick={() => setShowBulkOps(true)}
                    title="Bulk operations on branches"
                    style={{
                      background: 'none',
                      border: '1px solid #dc2626',
                      cursor: 'pointer',
                      padding: '0.125rem 0.375rem',
                      fontSize: '0.7rem',
                      color: '#dc2626',
                      marginLeft: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '500',
                    }}
                  >
                    ⚙️ Bulk Ops
                  </button>
                )}
              </div>
            )}

            {/* Trust Indicator (MR9) - Rendered from parent */}
            {trustIndicator}

            {/* Action Buttons - Hidden for simple messages */}
            {!hideActionButtons && (() => {
              // Calculate word count for conditional button display
              const wordCount = message.content.split(/\s+/).filter(w => w.length > 0).length;
              const showInsightsButton = wordCount >= 30 && onViewInsights; // Show for responses >= 30 words

              return (
                <div className={styles.actionButtons}>
                  <button
                    onClick={onVerify}
                    disabled={isUpdating}
                    title="✓ VERIFY: Confirm this AI response is correct and helpful."
                    className={`${styles.actionButton} ${message.wasVerified ? styles.verifiedBadge : styles.verifyButton}`}
                    style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                  >
                    {isUpdating ? '⏳' : message.wasVerified ? '✓' : '✓'} {message.wasVerified ? 'Verified' : 'Verify'}
                  </button>
                  <button
                    onClick={onModify}
                    disabled={isUpdating}
                    title="✎ MODIFY: Check this if you edited or improved the AI's response."
                    className={`${styles.actionButton} ${message.wasModified ? styles.modifiedBadge : styles.modifyButton}`}
                    style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                  >
                    {isUpdating ? '⏳' : message.wasModified ? '✎' : '✎'} {message.wasModified ? 'Modified' : 'Modify'}
                  </button>
                  {showInsightsButton && (
                    <button
                      onClick={onViewInsights}
                      disabled={isUpdating}
                      title="🔍 INSIGHTS: Analyze this response - key points, assumptions, and follow-up questions"
                      className={`${styles.actionButton} ${styles.insightsButton}`}
                      style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                    >
                      🔍 Insights
                    </button>
                  )}
                  {showInsightsButton && onCriticalThinking && (
                    <button
                      onClick={() => onCriticalThinking(currentContent)}
                      disabled={isUpdating}
                      title="🧠 THINK: Critically evaluate this AI response"
                      className={`${styles.actionButton} ${styles.thinkButton}`}
                      style={{ opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                    >
                      🧠 Think
                    </button>
                  )}
                  {onRegenerate && (
                    <RegenerateDropdown
                      onRegenerate={onRegenerate}
                      disabled={isUpdating}
                    />
                  )}
                </div>
              );
            })()}

          </div>
        )}

        {/* Footer for user messages - timestamp, branch navigation, and edit button */}
        {message.role === 'user' && !isEditing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            gap: '0.5rem',
          }}>
            <p className={styles.timestamp} style={{ margin: 0 }}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Conversation version navigation for user messages - GREEN theme to differentiate from AI branches */}
              {/* Only show on the ACTUAL fork point message, not all user messages */}
              {availableBranchPaths.length > 1 && onSwitchBranchPath && (
                // Known fork point (during current editing session)
                editForkMessageIndex === index ||
                // After refresh on edit branch: show ONLY on the user message that's on an edit branch
                // (this is the edited message - the fork point)
                (editForkMessageIndex === null && message.branchPath && message.branchPath.startsWith('edit-'))
                // NOTE: On main branch after refresh, use the header dropdown to switch branches
                // We don't show inline navigation because we can't identify the exact fork point
              ) && (() => {
                // Find current branch index
                const currentIndex = availableBranchPaths.indexOf(currentBranchPath);
                const canGoPrev = currentIndex > 0;
                const canGoNext = currentIndex < availableBranchPaths.length - 1;
                const editBranchCount = availableBranchPaths.filter(p => p.startsWith('edit-')).length;

                // Format branch name for display - use "Version" terminology for clarity
                const formatBranchName = (path: string) => {
                  if (path === 'main') return 'Original';
                  if (path.startsWith('edit-')) {
                    const editIndex = availableBranchPaths.filter(p => p.startsWith('edit-')).indexOf(path) + 1;
                    return `Version ${editIndex}`;
                  }
                  return path;
                };

                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: currentBranchPath === 'main' ? '#f0fdf4' : '#fef3c7',
                    border: `1px solid ${currentBranchPath === 'main' ? '#86efac' : '#fcd34d'}`,
                    borderRadius: '0.375rem',
                    padding: '0.15rem 0.35rem',
                  }}
                  title={`Conversation versions: ${editBranchCount} edit${editBranchCount > 1 ? 's' : ''} + original. Switching changes the entire conversation.`}
                  >
                    {/* Version icon to differentiate from AI branch navigation */}
                    <span style={{ fontSize: '0.7rem', marginRight: '0.15rem' }}>📝</span>
                    <button
                      onClick={() => canGoPrev && onSwitchBranchPath(availableBranchPaths[currentIndex - 1])}
                      disabled={!canGoPrev}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: canGoPrev ? 'pointer' : 'not-allowed',
                        padding: '0 0.25rem',
                        fontSize: '0.75rem',
                        color: canGoPrev ? '#15803d' : '#cbd5e1',
                        fontWeight: 'bold',
                      }}
                      title="Previous conversation version"
                    >
                      ◀
                    </button>
                    <span style={{
                      fontSize: '0.7rem',
                      color: currentBranchPath === 'main' ? '#15803d' : '#b45309',
                      fontWeight: '600',
                      minWidth: '55px',
                      textAlign: 'center',
                    }}>
                      {formatBranchName(currentBranchPath)}
                    </span>
                    <button
                      onClick={() => canGoNext && onSwitchBranchPath(availableBranchPaths[currentIndex + 1])}
                      disabled={!canGoNext}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: canGoNext ? 'pointer' : 'not-allowed',
                        padding: '0 0.25rem',
                        fontSize: '0.75rem',
                        color: canGoNext ? '#15803d' : '#cbd5e1',
                        fontWeight: 'bold',
                      }}
                      title="Next conversation version"
                    >
                      ▶
                    </button>
                    <span style={{
                      fontSize: '0.65rem',
                      color: '#64748b',
                      marginLeft: '0.15rem',
                    }}>
                      {currentIndex + 1}/{availableBranchPaths.length}
                    </span>
                  </div>
                );
              })()}
              {/* Edit button for user messages - shows badge when versions exist */}
              {onEditUserMessage && (() => {
                const editVersionCount = availableBranchPaths.filter(p => p.startsWith('edit-')).length;
                const hasVersions = editVersionCount > 0;

                return (
                  <button
                    onClick={onEditUserMessage}
                    title={hasVersions
                      ? `Edit this message (${editVersionCount} version${editVersionCount > 1 ? 's' : ''} exist)`
                      : "Edit this message and regenerate AI response (creates a new version)"
                    }
                    style={{
                      background: hasVersions ? '#f0fdf4' : 'none',
                      border: `1px solid ${hasVersions ? '#86efac' : '#9ca3af'}`,
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      color: hasVersions ? '#15803d' : '#6b7280',
                      borderRadius: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#22c55e';
                      e.currentTarget.style.color = '#15803d';
                      e.currentTarget.style.background = '#dcfce7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = hasVersions ? '#86efac' : '#9ca3af';
                      e.currentTarget.style.color = hasVersions ? '#15803d' : '#6b7280';
                      e.currentTarget.style.background = hasVersions ? '#f0fdf4' : 'none';
                    }}
                  >
                    <span style={{ fontSize: '0.875rem' }}>✎</span>
                    Edit
                    {/* Version count badge */}
                    {hasVersions && (
                      <span style={{
                        marginLeft: '0.25rem',
                        padding: '0 0.3rem',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        borderRadius: '9999px',
                        minWidth: '1rem',
                        textAlign: 'center',
                      }}>
                        {editVersionCount}
                      </span>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Branch Comparison Modal */}
      {showComparison && hasBranches && message.branches && (
        <BranchComparisonModal
          originalContent={message.content}
          branches={message.branches}
          currentBranchIndex={currentBranchIndex}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Bulk Operations Modal */}
      {showBulkOps && hasBranches && message.branches && (
        <BranchBulkOperations
          branches={message.branches}
          onDelete={handleBulkDelete}
          onVerify={handleBulkVerify}
          onExport={handleBulkExport}
          onClose={() => setShowBulkOps(false)}
        />
      )}
    </div>
  );
};

export default MessageItem;
