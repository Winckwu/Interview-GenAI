import React, { useState } from 'react';
import { MessageBranch } from '../hooks/useMessages';
import styles from './BranchComparisonModal.module.css';

interface BranchComparisonModalProps {
  originalContent: string;
  branches: MessageBranch[];
  currentBranchIndex: number;
  onClose: () => void;
}

export const BranchComparisonModal: React.FC<BranchComparisonModalProps> = ({
  originalContent,
  branches,
  currentBranchIndex,
  onClose,
}) => {
  const [leftBranchIndex, setLeftBranchIndex] = useState(0); // 0 = original
  const [rightBranchIndex, setRightBranchIndex] = useState(currentBranchIndex);

  // Get content for a branch index (0 = original, 1+ = branches)
  const getBranchContent = (index: number): string => {
    if (index === 0) return originalContent;
    return branches[index - 1]?.content || '';
  };

  // Get branch label
  const getBranchLabel = (index: number): string => {
    if (index === 0) return 'Original';
    const branch = branches[index - 1];
    if (!branch) return `Branch ${index}`;

    if (branch.source === 'mr6' && branch.model) return `MR6: ${branch.model}`;
    if (branch.source === 'mr5' && branch.model) return `MR5: ${branch.model}`;
    return `Branch ${index}`;
  };

  // Get branch metadata
  const getBranchMetadata = (index: number) => {
    if (index === 0) return null;
    return branches[index - 1];
  };

  // Simple word-level diff highlighting
  const getWordDiff = (text1: string, text2: string) => {
    const words1 = text1.split(/(\s+)/);
    const words2 = text2.split(/(\s+)/);

    return {
      left: words1,
      right: words2,
      // For simplicity, we'll just show the text without complex diff algorithm
      // A production implementation would use a proper diff library
    };
  };

  const leftContent = getBranchContent(leftBranchIndex);
  const rightContent = getBranchContent(rightBranchIndex);
  const leftMetadata = getBranchMetadata(leftBranchIndex);
  const rightMetadata = getBranchMetadata(rightBranchIndex);

  const totalBranches = branches.length + 1;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Branch Comparison</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.branchSelectors}>
          <div className={styles.selectorGroup}>
            <label>Left Branch:</label>
            <select
              value={leftBranchIndex}
              onChange={(e) => setLeftBranchIndex(Number(e.target.value))}
            >
              {Array.from({ length: totalBranches }, (_, i) => (
                <option key={i} value={i}>
                  {getBranchLabel(i)} ({i === 0 ? 'Original' : `${i}/${totalBranches}`})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectorGroup}>
            <label>Right Branch:</label>
            <select
              value={rightBranchIndex}
              onChange={(e) => setRightBranchIndex(Number(e.target.value))}
            >
              {Array.from({ length: totalBranches }, (_, i) => (
                <option key={i} value={i}>
                  {getBranchLabel(i)} ({i === 0 ? 'Original' : `${i}/${totalBranches}`})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.comparisonContainer}>
          {/* Left Branch */}
          <div className={styles.branchPanel}>
            <div className={styles.panelHeader}>
              <h3>{getBranchLabel(leftBranchIndex)}</h3>
              {leftMetadata && (
                <div className={styles.metadata}>
                  <span className={styles.metadataItem}>
                    📅 {new Date(leftMetadata.createdAt).toLocaleString()}
                  </span>
                  <span className={styles.metadataItem}>
                    🔧 {leftMetadata.source.toUpperCase()}
                  </span>
                  {leftMetadata.wasVerified && (
                    <span className={styles.metadataItem} style={{ color: '#10b981' }}>
                      ✓ Verified
                    </span>
                  )}
                  {leftMetadata.wasModified && (
                    <span className={styles.metadataItem} style={{ color: '#f59e0b' }}>
                      ✎ Modified
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className={styles.contentPanel}>
              <pre className={styles.contentText}>{leftContent}</pre>
            </div>
            <div className={styles.stats}>
              Characters: {leftContent.length} | Words: {leftContent.split(/\s+/).filter(w => w).length}
            </div>
          </div>

          {/* Divider */}
          <div className={styles.divider}></div>

          {/* Right Branch */}
          <div className={styles.branchPanel}>
            <div className={styles.panelHeader}>
              <h3>{getBranchLabel(rightBranchIndex)}</h3>
              {rightMetadata && (
                <div className={styles.metadata}>
                  <span className={styles.metadataItem}>
                    📅 {new Date(rightMetadata.createdAt).toLocaleString()}
                  </span>
                  <span className={styles.metadataItem}>
                    🔧 {rightMetadata.source.toUpperCase()}
                  </span>
                  {rightMetadata.wasVerified && (
                    <span className={styles.metadataItem} style={{ color: '#10b981' }}>
                      ✓ Verified
                    </span>
                  )}
                  {rightMetadata.wasModified && (
                    <span className={styles.metadataItem} style={{ color: '#f59e0b' }}>
                      ✎ Modified
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className={styles.contentPanel}>
              <pre className={styles.contentText}>{rightContent}</pre>
            </div>
            <div className={styles.stats}>
              Characters: {rightContent.length} | Words: {rightContent.split(/\s+/).filter(w => w).length}
            </div>
          </div>
        </div>

        {/* Comparison Stats */}
        <div className={styles.comparisonStats}>
          {leftContent === rightContent ? (
            <span className={styles.identical}>✓ Branches are identical</span>
          ) : (
            <>
              <span className={styles.different}>⚠ Branches differ</span>
              <span className={styles.statDetail}>
                Character difference: {Math.abs(leftContent.length - rightContent.length)}
              </span>
              <span className={styles.statDetail}>
                Word difference: {Math.abs(
                  leftContent.split(/\s+/).filter(w => w).length -
                  rightContent.split(/\s+/).filter(w => w).length
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
