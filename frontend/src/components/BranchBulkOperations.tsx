import React, { useState } from 'react';
import { MessageBranch } from '../hooks/useMessages';
import styles from './BranchBulkOperations.module.css';

interface BranchBulkOperationsProps {
  branches: MessageBranch[];
  onDelete: (branchIds: string[]) => Promise<void>;
  onVerify: (branchIds: string[]) => Promise<void>;
  onExport: (branchIds: string[], format: 'json' | 'csv' | 'markdown') => void;
  onClose: () => void;
}

export const BranchBulkOperations: React.FC<BranchBulkOperationsProps> = ({
  branches,
  onDelete,
  onVerify,
  onExport,
  onClose,
}) => {
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toggleBranch = (branchId: string) => {
    const newSelection = new Set(selectedBranches);
    if (newSelection.has(branchId)) {
      newSelection.delete(branchId);
    } else {
      newSelection.add(branchId);
    }
    setSelectedBranches(newSelection);
  };

  const selectAll = () => {
    setSelectedBranches(new Set(branches.map(b => b.id)));
  };

  const deselectAll = () => {
    setSelectedBranches(new Set());
  };

  const selectBySource = (source: 'mr6' | 'mr5' | 'manual') => {
    const filtered = branches.filter(b => b.source === source);
    setSelectedBranches(new Set(filtered.map(b => b.id)));
  };

  const handleDelete = async () => {
    if (selectedBranches.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedBranches.size} selected branch${selectedBranches.size > 1 ? 'es' : ''}?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await onDelete(Array.from(selectedBranches));
      setSelectedBranches(new Set());
    } catch (error) {
      console.error('Failed to delete branches:', error);
      alert('Failed to delete some branches. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (selectedBranches.size === 0) return;

    setIsProcessing(true);
    try {
      await onVerify(Array.from(selectedBranches));
      setSelectedBranches(new Set());
    } catch (error) {
      console.error('Failed to verify branches:', error);
      alert('Failed to verify some branches. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'markdown') => {
    if (selectedBranches.size === 0) return;
    onExport(Array.from(selectedBranches), format);
    setShowExportMenu(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Bulk Branch Operations</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.selectionControls}>
          <div className={styles.selectionStats}>
            <strong>{selectedBranches.size}</strong> of <strong>{branches.length}</strong> branches selected
          </div>
          <div className={styles.selectionButtons}>
            <button onClick={selectAll} className={styles.selectBtn}>
              Select All
            </button>
            <button onClick={deselectAll} className={styles.selectBtn}>
              Deselect All
            </button>
            <button onClick={() => selectBySource('mr6')} className={styles.selectBtn}>
              Select MR6
            </button>
            <button onClick={() => selectBySource('mr5')} className={styles.selectBtn}>
              Select MR5
            </button>
            <button onClick={() => selectBySource('manual')} className={styles.selectBtn}>
              Select Manual
            </button>
          </div>
        </div>

        <div className={styles.branchList}>
          {branches.map((branch, index) => {
            const isSelected = selectedBranches.has(branch.id);
            return (
              <div
                key={branch.id}
                className={`${styles.branchItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => toggleBranch(branch.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleBranch(branch.id)}
                  className={styles.checkbox}
                />
                <div className={styles.branchInfo}>
                  <div className={styles.branchHeader}>
                    <span className={styles.branchIndex}>Branch #{index + 1}</span>
                    <span className={`${styles.branchSource} ${styles[branch.source]}`}>
                      {branch.source.toUpperCase()}
                      {branch.model && ` (${branch.model})`}
                    </span>
                  </div>
                  <div className={styles.branchContent}>
                    {branch.content.substring(0, 100)}
                    {branch.content.length > 100 && '...'}
                  </div>
                  <div className={styles.branchMeta}>
                    <span className={styles.metaItem}>
                      📅 {new Date(branch.createdAt).toLocaleString()}
                    </span>
                    {branch.wasVerified && (
                      <span className={styles.metaItem} style={{ color: '#10b981' }}>
                        ✓ Verified
                      </span>
                    )}
                    {branch.wasModified && (
                      <span className={styles.metaItem} style={{ color: '#f59e0b' }}>
                        ✎ Modified
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      {branch.content.length} chars
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.actionBar}>
          <button
            onClick={handleVerify}
            disabled={selectedBranches.size === 0 || isProcessing}
            className={`${styles.actionBtn} ${styles.verifyBtn}`}
          >
            ✓ Verify Selected ({selectedBranches.size})
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={selectedBranches.size === 0 || isProcessing}
              className={`${styles.actionBtn} ${styles.exportBtn}`}
            >
              📥 Export Selected ({selectedBranches.size})
            </button>

            {showExportMenu && (
              <div className={styles.exportMenu}>
                <button onClick={() => handleExport('json')}>📄 Export as JSON</button>
                <button onClick={() => handleExport('csv')}>📊 Export as CSV</button>
                <button onClick={() => handleExport('markdown')}>📝 Export as Markdown</button>
              </div>
            )}
          </div>

          <button
            onClick={handleDelete}
            disabled={selectedBranches.size === 0 || isProcessing}
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
          >
            🗑️ Delete Selected ({selectedBranches.size})
          </button>
        </div>

        {isProcessing && (
          <div className={styles.processingOverlay}>
            <div className={styles.spinner}></div>
            <p>Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
};
