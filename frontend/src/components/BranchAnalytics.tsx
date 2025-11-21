import React from 'react';
import { MessageBranch } from '../hooks/useMessages';
import styles from './BranchAnalytics.module.css';

interface BranchAnalyticsProps {
  originalContent: string;
  branches: MessageBranch[];
  onClose: () => void;
}

interface AnalyticsData {
  totalBranches: number;
  bySource: {
    mr6: number;
    mr5: number;
    manual: number;
  };
  byStatus: {
    verified: number;
    modified: number;
    unmodified: number;
  };
  averageLength: {
    characters: number;
    words: number;
  };
  lengthRange: {
    shortest: { index: number; length: number };
    longest: { index: number; length: number };
  };
  timeline: Array<{
    branchIndex: number;
    source: string;
    timestamp: Date;
    daysSinceOriginal: number;
  }>;
  modelUsage: Record<string, number>;
}

export const BranchAnalytics: React.FC<BranchAnalyticsProps> = ({
  originalContent,
  branches,
  onClose,
}) => {
  // Calculate analytics data
  const analytics: AnalyticsData = React.useMemo(() => {
    const allContents = [originalContent, ...branches.map(b => b.content)];

    // Word and character counts
    const lengths = allContents.map(content => ({
      characters: content.length,
      words: content.split(/\s+/).filter(w => w).length,
    }));

    const totalChars = lengths.reduce((sum, l) => sum + l.characters, 0);
    const totalWords = lengths.reduce((sum, l) => sum + l.words, 0);

    // Find shortest and longest
    const charLengths = lengths.map(l => l.characters);
    const shortestIndex = charLengths.indexOf(Math.min(...charLengths));
    const longestIndex = charLengths.indexOf(Math.max(...charLengths));

    // Count by source
    const bySource = {
      mr6: branches.filter(b => b.source === 'mr6').length,
      mr5: branches.filter(b => b.source === 'mr5').length,
      manual: branches.filter(b => b.source === 'manual').length,
    };

    // Count by status
    const byStatus = {
      verified: branches.filter(b => b.wasVerified).length,
      modified: branches.filter(b => b.wasModified).length,
      unmodified: branches.filter(b => !b.wasModified).length,
    };

    // Model usage
    const modelUsage: Record<string, number> = {};
    branches.forEach(branch => {
      if (branch.model) {
        modelUsage[branch.model] = (modelUsage[branch.model] || 0) + 1;
      }
    });

    // Timeline
    const originalDate = new Date();
    const timeline = branches.map((branch, index) => {
      const timestamp = new Date(branch.createdAt);
      const daysSinceOriginal = Math.floor(
        (timestamp.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        branchIndex: index + 1,
        source: branch.source,
        timestamp,
        daysSinceOriginal,
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      totalBranches: branches.length + 1,
      bySource,
      byStatus,
      averageLength: {
        characters: Math.round(totalChars / allContents.length),
        words: Math.round(totalWords / allContents.length),
      },
      lengthRange: {
        shortest: { index: shortestIndex, length: charLengths[shortestIndex] },
        longest: { index: longestIndex, length: charLengths[longestIndex] },
      },
      timeline,
      modelUsage,
    };
  }, [originalContent, branches]);

  // Calculate percentages
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📊 Branch Analytics</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.analyticsGrid}>
          {/* Overview Card */}
          <div className={styles.card}>
            <h3>Overview</h3>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Branches:</span>
                <span className={styles.statValue}>{analytics.totalBranches}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Average Length:</span>
                <span className={styles.statValue}>
                  {analytics.averageLength.characters} chars / {analytics.averageLength.words} words
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Shortest Branch:</span>
                <span className={styles.statValue}>
                  #{analytics.lengthRange.shortest.index} ({analytics.lengthRange.shortest.length} chars)
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Longest Branch:</span>
                <span className={styles.statValue}>
                  #{analytics.lengthRange.longest.index} ({analytics.lengthRange.longest.length} chars)
                </span>
              </div>
            </div>
          </div>

          {/* Source Distribution Card */}
          <div className={styles.card}>
            <h3>Source Distribution</h3>
            <div className={styles.chartContainer}>
              <div className={styles.barChart}>
                <div className={styles.barItem}>
                  <div className={styles.barLabel}>
                    <span>🤖 MR6</span>
                    <span className={styles.barValue}>{analytics.bySource.mr6}</span>
                  </div>
                  <div className={styles.barWrapper}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${getPercentage(analytics.bySource.mr6, branches.length)}%`,
                        backgroundColor: '#3b82f6',
                      }}
                    ></div>
                  </div>
                  <div className={styles.barPercentage}>
                    {getPercentage(analytics.bySource.mr6, branches.length)}%
                  </div>
                </div>

                <div className={styles.barItem}>
                  <div className={styles.barLabel}>
                    <span>💰 MR5</span>
                    <span className={styles.barValue}>{analytics.bySource.mr5}</span>
                  </div>
                  <div className={styles.barWrapper}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${getPercentage(analytics.bySource.mr5, branches.length)}%`,
                        backgroundColor: '#10b981',
                      }}
                    ></div>
                  </div>
                  <div className={styles.barPercentage}>
                    {getPercentage(analytics.bySource.mr5, branches.length)}%
                  </div>
                </div>

                <div className={styles.barItem}>
                  <div className={styles.barLabel}>
                    <span>✏️ Manual</span>
                    <span className={styles.barValue}>{analytics.bySource.manual}</span>
                  </div>
                  <div className={styles.barWrapper}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${getPercentage(analytics.bySource.manual, branches.length)}%`,
                        backgroundColor: '#8b5cf6',
                      }}
                    ></div>
                  </div>
                  <div className={styles.barPercentage}>
                    {getPercentage(analytics.bySource.manual, branches.length)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className={styles.card}>
            <h3>Status</h3>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem} style={{ backgroundColor: '#d1fae5' }}>
                <div className={styles.statusIcon}>✓</div>
                <div className={styles.statusLabel}>Verified</div>
                <div className={styles.statusCount}>{analytics.byStatus.verified}</div>
                <div className={styles.statusPercentage}>
                  {getPercentage(analytics.byStatus.verified, branches.length)}%
                </div>
              </div>
              <div className={styles.statusItem} style={{ backgroundColor: '#fef3c7' }}>
                <div className={styles.statusIcon}>✎</div>
                <div className={styles.statusLabel}>Modified</div>
                <div className={styles.statusCount}>{analytics.byStatus.modified}</div>
                <div className={styles.statusPercentage}>
                  {getPercentage(analytics.byStatus.modified, branches.length)}%
                </div>
              </div>
            </div>
          </div>

          {/* Model Usage Card */}
          {Object.keys(analytics.modelUsage).length > 0 && (
            <div className={styles.card}>
              <h3>Model Usage</h3>
              <div className={styles.modelList}>
                {Object.entries(analytics.modelUsage)
                  .sort(([, a], [, b]) => b - a)
                  .map(([model, count]) => (
                    <div key={model} className={styles.modelItem}>
                      <span className={styles.modelName}>{model}</span>
                      <span className={styles.modelCount}>
                        {count} {count === 1 ? 'branch' : 'branches'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <h3>Branch Creation Timeline</h3>
            <div className={styles.timelineContainer}>
              {analytics.timeline.length > 0 ? (
                <div className={styles.timeline}>
                  {analytics.timeline.map((item) => (
                    <div key={item.branchIndex} className={styles.timelineItem}>
                      <div className={styles.timelineDot}></div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineHeader}>
                          <span className={styles.timelineBranch}>Branch #{item.branchIndex}</span>
                          <span className={styles.timelineSource}>
                            {item.source.toUpperCase()}
                          </span>
                        </div>
                        <div className={styles.timelineDate}>
                          {item.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noData}>No branch creation data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
