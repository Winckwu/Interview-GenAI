import React, { useRef, useEffect } from 'react';
import { MessageBranch } from '../hooks/useMessages';
import styles from './BranchFilterPanel.module.css';

export interface BranchFilter {
  sources: Set<'mr6' | 'mr5' | 'manual'>;
  showVerified: boolean | null; // null = all, true = only verified, false = only unverified
  showModified: boolean | null; // null = all, true = only modified, false = only unmodified
}

interface BranchFilterPanelProps {
  branches: MessageBranch[];
  filter: BranchFilter;
  onFilterChange: (filter: BranchFilter) => void;
  onClose: () => void;
}

export const BranchFilterPanel: React.FC<BranchFilterPanelProps> = ({
  branches,
  filter,
  onFilterChange,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  // Count branches by source
  const sourceCounts = {
    mr6: branches.filter(b => b.source === 'mr6').length,
    mr5: branches.filter(b => b.source === 'mr5').length,
    manual: branches.filter(b => b.source === 'manual').length,
  };

  const verifiedCount = branches.filter(b => b.wasVerified).length;
  const modifiedCount = branches.filter(b => b.wasModified).length;

  const toggleSource = (source: 'mr6' | 'mr5' | 'manual') => {
    const newSources = new Set(filter.sources);
    if (newSources.has(source)) {
      newSources.delete(source);
    } else {
      newSources.add(source);
    }
    onFilterChange({ ...filter, sources: newSources });
  };

  const toggleVerified = () => {
    const newValue = filter.showVerified === null ? true : filter.showVerified === true ? false : null;
    onFilterChange({ ...filter, showVerified: newValue });
  };

  const toggleModified = () => {
    const newValue = filter.showModified === null ? true : filter.showModified === true ? false : null;
    onFilterChange({ ...filter, showModified: newValue });
  };

  const resetFilters = () => {
    onFilterChange({
      sources: new Set(['mr6', 'mr5', 'manual']),
      showVerified: null,
      showModified: null,
    });
  };

  const hasActiveFilters =
    filter.sources.size !== 3 ||
    filter.showVerified !== null ||
    filter.showModified !== null;

  return (
    <div ref={panelRef} className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <h3>Filter Branches</h3>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div className={styles.filterSection}>
        <h4>Source</h4>
        <div className={styles.filterOptions}>
          <button
            className={`${styles.filterButton} ${filter.sources.has('mr6') ? styles.active : ''}`}
            onClick={() => toggleSource('mr6')}
            disabled={sourceCounts.mr6 === 0}
          >
            <span className={styles.filterIcon}>🤖</span>
            MR6
            <span className={styles.count}>({sourceCounts.mr6})</span>
          </button>
          <button
            className={`${styles.filterButton} ${filter.sources.has('mr5') ? styles.active : ''}`}
            onClick={() => toggleSource('mr5')}
            disabled={sourceCounts.mr5 === 0}
          >
            <span className={styles.filterIcon}>💰</span>
            MR5
            <span className={styles.count}>({sourceCounts.mr5})</span>
          </button>
          <button
            className={`${styles.filterButton} ${filter.sources.has('manual') ? styles.active : ''}`}
            onClick={() => toggleSource('manual')}
            disabled={sourceCounts.manual === 0}
          >
            <span className={styles.filterIcon}>✏️</span>
            Manual
            <span className={styles.count}>({sourceCounts.manual})</span>
          </button>
        </div>
      </div>

      <div className={styles.filterSection}>
        <h4>Status</h4>
        <div className={styles.filterOptions}>
          <button
            className={`${styles.filterButton} ${
              filter.showVerified === true ? styles.active :
              filter.showVerified === false ? styles.excluded : ''
            }`}
            onClick={toggleVerified}
            disabled={verifiedCount === 0}
            title={
              filter.showVerified === null ? 'Show all' :
              filter.showVerified === true ? 'Only verified' :
              'Only unverified'
            }
          >
            <span className={styles.filterIcon}>✓</span>
            Verified
            <span className={styles.count}>({verifiedCount})</span>
            {filter.showVerified === true && <span className={styles.stateIndicator}>✓</span>}
            {filter.showVerified === false && <span className={styles.stateIndicator}>✕</span>}
          </button>
          <button
            className={`${styles.filterButton} ${
              filter.showModified === true ? styles.active :
              filter.showModified === false ? styles.excluded : ''
            }`}
            onClick={toggleModified}
            disabled={modifiedCount === 0}
            title={
              filter.showModified === null ? 'Show all' :
              filter.showModified === true ? 'Only modified' :
              'Only unmodified'
            }
          >
            <span className={styles.filterIcon}>✎</span>
            Modified
            <span className={styles.count}>({modifiedCount})</span>
            {filter.showModified === true && <span className={styles.stateIndicator}>✓</span>}
            {filter.showModified === false && <span className={styles.stateIndicator}>✕</span>}
          </button>
        </div>
      </div>

      <div className={styles.filterActions}>
        {hasActiveFilters && (
          <button className={styles.resetButton} onClick={resetFilters}>
            Reset Filters
          </button>
        )}
        <div className={styles.filterSummary}>
          Showing {getFilteredCount(branches, filter)} / {branches.length + 1} branches
        </div>
      </div>
    </div>
  );
};

// Helper function to count filtered branches
function getFilteredCount(branches: MessageBranch[], filter: BranchFilter): number {
  let count = 1; // Always count original

  branches.forEach(branch => {
    // Check source filter
    if (!filter.sources.has(branch.source)) return;

    // Check verified filter
    if (filter.showVerified === true && !branch.wasVerified) return;
    if (filter.showVerified === false && branch.wasVerified) return;

    // Check modified filter
    if (filter.showModified === true && !branch.wasModified) return;
    if (filter.showModified === false && branch.wasModified) return;

    count++;
  });

  return count;
}
