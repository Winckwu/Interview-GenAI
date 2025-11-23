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
import { BranchFilterPanel, BranchFilter } from './BranchFilterPanel';
import { BranchAnalytics } from './BranchAnalytics';
import { BranchBulkOperations } from './BranchBulkOperations';
import { exportBranches } from '../utils/branchExport';
import api from '../services/api';

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

  // Branch navigation
  onBranchPrev?: () => void;
  onBranchNext?: () => void;
  onBranchDelete?: () => void;
  onBranchSetAsMain?: () => void;

  // Child components (intervention panels)
  trustIndicator?: React.ReactNode;
  quickReflection?: React.ReactNode;
  mr6Suggestion?: React.ReactNode;

  // Hide action buttons for simple messages (greetings, etc.)
  hideActionButtons?: boolean;

  // Streaming state - shows typing cursor when true
  isStreaming?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isEditing,
  editedContent,
  isUpdating,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onVerify,
  onModify,
  onBranchPrev,
  onBranchNext,
  onBranchDelete,
  onBranchSetAsMain,
  trustIndicator,
  quickReflection,
  mr6Suggestion,
  hideActionButtons = false,
  isStreaming = false,
}) => {
  // Modal states
  const [showComparison, setShowComparison] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [branchFilter, setBranchFilter] = useState<BranchFilter>({
    sources: new Set(['mr6', 'mr5', 'manual']),
    showVerified: null,
    showModified: null,
  });

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // Filter branches based on filter settings
  const filteredBranches = useMemo(() => {
    if (!hasBranches || !message.branches) return [];

    return message.branches.filter(branch => {
      // Check source filter
      if (!branchFilter.sources.has(branch.source)) return false;

      // Check verified filter
      if (branchFilter.showVerified === true && !branch.wasVerified) return false;
      if (branchFilter.showVerified === false && branch.wasVerified) return false;

      // Check modified filter
      if (branchFilter.showModified === true && !branch.wasModified) return false;
      if (branchFilter.showModified === false && branch.wasModified) return false;

      return true;
    });
  }, [hasBranches, message.branches, branchFilter]);

  const filteredTotalBranches = filteredBranches.length + 1; // +1 for original
  const hasFilteredBranches = filteredBranches.length > 0;
  const canGoPrev = hasFilteredBranches && currentBranchIndex > 0;
  const canGoNext = hasFilteredBranches && currentBranchIndex < filteredTotalBranches - 1;

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

  // Calculate branch statistics (use filtered branches if filters are active)
  const getBranchStatistics = () => {
    if (!hasBranches) return null;

    const branches = filteredBranches;
    const mr6Count = branches.filter(b => b.source === 'mr6').length;
    const mr5Count = branches.filter(b => b.source === 'mr5').length;
    const manualCount = branches.filter(b => b.source === 'manual').length;
    const verifiedCount = branches.filter(b => b.wasVerified).length;
    const modifiedCount = branches.filter(b => b.wasModified).length;

    const hasActiveFilter =
      branchFilter.sources.size !== 3 ||
      branchFilter.showVerified !== null ||
      branchFilter.showModified !== null;

    return {
      total: filteredTotalBranches,
      totalAll: totalBranches,
      mr6: mr6Count,
      mr5: mr5Count,
      manual: manualCount,
      verified: verifiedCount,
      modified: modifiedCount,
      filtered: hasActiveFilter,
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
                  backgroundColor: branchStats.filtered ? '#fef3c7' : '#f3f4f6',
                  border: `1px solid ${branchStats.filtered ? '#fbbf24' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  fontWeight: '500',
                }}
                title={`${branchStats.filtered ? 'Filtered: ' : ''}Total: ${branchStats.total} branches${branchStats.filtered ? ` (of ${branchStats.totalAll})` : ''}\nMR6: ${branchStats.mr6} | MR5: ${branchStats.mr5} | Manual: ${branchStats.manual}\nVerified: ${branchStats.verified} | Modified: ${branchStats.modified}`}
              >
                <span style={{ color: '#374151' }}>
                  📊 {branchStats.total} {branchStats.filtered && `/ ${branchStats.totalAll}`} branches
                </span>
                {branchStats.mr6 > 0 && <span>MR6: {branchStats.mr6}</span>}
                {branchStats.mr5 > 0 && <span>MR5: {branchStats.mr5}</span>}
                {branchStats.manual > 0 && <span>Manual: {branchStats.manual}</span>}
                {branchStats.verified > 0 && <span style={{ color: '#10b981' }}>✓ {branchStats.verified}</span>}
                {branchStats.modified > 0 && <span style={{ color: '#f59e0b' }}>✎ {branchStats.modified}</span>}
              </div>
            )}

            {/* Branch Navigation */}
            {hasBranches && (
              <div
                className={styles.branchNavigation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.625rem',
                  backgroundColor: currentBranchIndex === 0 ? '#e0f2fe' : '#fce7f3',
                  border: `1px solid ${currentBranchIndex === 0 ? '#bae6fd' : '#fbcfe8'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
                title="Keyboard: ← Previous | → Next | Delete to remove | Ctrl+Enter to set as main"
              >
                <button
                  onClick={onBranchPrev}
                  disabled={!canGoPrev}
                  title="Previous branch"
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
                  {branchInfo.label} ({currentBranchIndex + 1}/{filteredTotalBranches})
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
                  onClick={onBranchNext}
                  disabled={!canGoNext}
                  title="Next branch"
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

                {/* Set as Main button - only show for branches (not original) */}
                {currentBranchIndex > 0 && onBranchSetAsMain && (
                  <button
                    onClick={onBranchSetAsMain}
                    title="Set this branch as the main answer"
                    style={{
                      background: 'none',
                      border: '1px solid #10b981',
                      cursor: 'pointer',
                      padding: '0.125rem 0.375rem',
                      fontSize: '0.7rem',
                      color: '#10b981',
                      marginLeft: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '500',
                    }}
                  >
                    ⭐ Set as Main
                  </button>
                )}

                {/* Delete button - only show for branches (not original) */}
                {currentBranchIndex > 0 && onBranchDelete && (
                  <button
                    onClick={onBranchDelete}
                    title="Delete this branch"
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

                {/* Compare branches button - show when there are multiple branches */}
                {totalBranches > 1 && (
                  <button
                    onClick={() => setShowComparison(true)}
                    title="Compare branches side-by-side"
                    style={{
                      background: 'none',
                      border: '1px solid #3b82f6',
                      cursor: 'pointer',
                      padding: '0.125rem 0.375rem',
                      fontSize: '0.7rem',
                      color: '#3b82f6',
                      marginLeft: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '500',
                    }}
                  >
                    🔍 Compare
                  </button>
                )}

                {/* Filter branches button - show when there are branches */}
                {hasBranches && message.branches && (
                  <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
                    <button
                      onClick={() => setShowFilter(!showFilter)}
                      title="Filter branches by source and status"
                      style={{
                        background: 'none',
                        border: '1px solid #8b5cf6',
                        cursor: 'pointer',
                        padding: '0.125rem 0.375rem',
                        fontSize: '0.7rem',
                        color: '#8b5cf6',
                        borderRadius: '0.25rem',
                        fontWeight: '500',
                      }}
                    >
                      🔧 Filter {filteredBranches.length !== message.branches.length ? `(${filteredBranches.length})` : ''}
                    </button>

                    {/* Filter Panel */}
                    {showFilter && (
                      <BranchFilterPanel
                        branches={message.branches}
                        filter={branchFilter}
                        onFilterChange={setBranchFilter}
                        onClose={() => setShowFilter(false)}
                      />
                    )}
                  </div>
                )}

                {/* Export branches button - show when there are branches */}
                {hasBranches && message.branches && (
                  <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      title="Export branch history"
                      style={{
                        background: 'none',
                        border: '1px solid #059669',
                        cursor: 'pointer',
                        padding: '0.125rem 0.375rem',
                        fontSize: '0.7rem',
                        color: '#059669',
                        borderRadius: '0.25rem',
                        fontWeight: '500',
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
                          marginTop: '0.5rem',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          padding: '0.5rem',
                          minWidth: '150px',
                          zIndex: 100,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <button
                            onClick={() => handleExport('json')}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
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
                              padding: '0.5rem 0.75rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
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
                              padding: '0.5rem 0.75rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
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

                {/* Analytics button - show when there are branches */}
                {hasBranches && message.branches && (
                  <button
                    onClick={() => setShowAnalytics(true)}
                    title="View branch analytics"
                    style={{
                      background: 'none',
                      border: '1px solid #f59e0b',
                      cursor: 'pointer',
                      padding: '0.125rem 0.375rem',
                      fontSize: '0.7rem',
                      color: '#f59e0b',
                      marginLeft: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '500',
                    }}
                  >
                    📈 Analytics
                  </button>
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
            {!hideActionButtons && (
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
              </div>
            )}

            {/* Quick Reflection Prompt (MR14) - Rendered from parent */}
            {quickReflection}

            {/* MR6 Multi-Model Comparison Suggestion - Rendered from parent */}
            {mr6Suggestion}
          </div>
        )}

        {/* Timestamp for user messages */}
        {message.role === 'user' && !isEditing && (
          <p className={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
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

      {/* Branch Analytics Modal */}
      {showAnalytics && hasBranches && message.branches && (
        <BranchAnalytics
          originalContent={message.content}
          branches={message.branches}
          onClose={() => setShowAnalytics(false)}
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
