/**
 * MR3 Human Agency Control - Utility Functions
 *
 * Supports:
 * - Agency scoring and metrics
 * - Human version snapshot storage and retrieval
 * - Intervention level management
 * - Session tracking
 */

import { InterventionLevel } from './MR3HumanAgencyControl';

/**
 * Agency score levels
 */
export interface AgencyScore {
  score: number; // 0-1
  level: 'low' | 'moderate' | 'high';
  interpretation: string;
}

/**
 * Human version snapshot for storage
 */
export interface HumanVersionSnapshot {
  sessionId: string;
  content: string;
  timestamp: Date;
  interventionLevel: InterventionLevel;
  reason: string; // 'user-chose-ai-free' | 'user-requested-checkpoint' | 'auto-save'
}

/**
 * Session activity tracker
 */
export interface SessionActivity {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  interventionLevel: InterventionLevel;
  totalSuggestions: number;
  approvalsCount: number;
  rejectionsCount: number;
  pauseDuration: number; // milliseconds
  userInterventions: number;
  humanVersionsSaved: number;
}

/**
 * Calculate agency/autonomy risk score
 *
 * The more a user approves suggestions without rejecting,
 * the higher the risk of over-dependence on AI.
 *
 * Score interpretation:
 * - 0.8-1.0: High autonomy (user frequently rejects)
 * - 0.5-0.8: Moderate autonomy (balanced approval/rejection)
 * - 0.0-0.5: Low autonomy (mostly approves, rarely rejects) ⚠️
 */
export function calculateAIAgencyRisk(
  approvalCount: number,
  rejectionCount: number
): AgencyScore {
  const totalFeedback = approvalCount + rejectionCount;

  if (totalFeedback === 0) {
    return {
      score: 0.5,
      level: 'moderate',
      interpretation: 'No feedback yet - autonomy neutral'
    };
  }

  // Rejection rate indicates critical evaluation
  const rejectionRate = rejectionCount / totalFeedback;
  const score = rejectionRate; // Higher rejection = higher autonomy

  let level: 'low' | 'moderate' | 'high';
  let interpretation: string;

  if (score > 0.7) {
    level = 'high';
    interpretation = 'Strong autonomy - you frequently evaluate and reject suggestions';
  } else if (score > 0.3) {
    level = 'moderate';
    interpretation = 'Moderate autonomy - you have a balanced approval/rejection pattern';
  } else {
    level = 'low';
    interpretation = 'Low autonomy - consider evaluating and rejecting more suggestions';
  }

  return { score, level, interpretation };
}

/**
 * Get human-readable label for intervention level
 */
export function getInterventionLabel(level: InterventionLevel): string {
  const labels = {
    passive: '🤐 Passive: Only suggest when requested',
    suggestive: '🤝 Suggestive: Suggest, wait for approval',
    proactive: '🚀 Proactive: Actively intervene frequently'
  };
  return labels[level];
}

/**
 * Store human-only version snapshot to localStorage
 */
export function storeHumanVersionSnapshot(snapshot: HumanVersionSnapshot): void {
  try {
    const key = `human-version-${snapshot.sessionId}`;
    const versionsKey = `human-versions-index-${snapshot.sessionId}`;

    // Store individual version
    const versionData = {
      ...snapshot,
      timestamp: snapshot.timestamp.toISOString()
    };
    localStorage.setItem(key + '-' + snapshot.timestamp.getTime(), JSON.stringify(versionData));

    // Update index
    const existing = localStorage.getItem(versionsKey);
    const index = existing ? JSON.parse(existing) : [];
    index.push({
      timestamp: snapshot.timestamp.toISOString(),
      reason: snapshot.reason,
      key: key + '-' + snapshot.timestamp.getTime()
    });

    localStorage.setItem(versionsKey, JSON.stringify(index));
  } catch (error) {
    console.error('Failed to store human version snapshot:', error);
  }
}

/**
 * Retrieve human version history for a session
 */
export function retrieveHumanVersionHistory(sessionId: string): HumanVersionSnapshot[] {
  try {
    const versionsKey = `human-versions-index-${sessionId}`;
    const indexString = localStorage.getItem(versionsKey);

    if (!indexString) return [];

    const index = JSON.parse(indexString);
    const versions: HumanVersionSnapshot[] = [];

    for (const entry of index) {
      const versionString = localStorage.getItem(entry.key);
      if (versionString) {
        const versionData = JSON.parse(versionString);
        versions.push({
          ...versionData,
          timestamp: new Date(versionData.timestamp)
        });
      }
    }

    // Sort by timestamp (newest first)
    return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Failed to retrieve human version history:', error);
    return [];
  }
}

/**
 * Restore human-only version
 */
export function restoreHumanVersion(snapshot: HumanVersionSnapshot): string {
  return snapshot.content;
}

/**
 * Clear human version history (useful for cleanup)
 */
export function clearHumanVersionHistory(sessionId: string): void {
  try {
    const versionsKey = `human-versions-index-${sessionId}`;
    const indexString = localStorage.getItem(versionsKey);

    if (indexString) {
      const index = JSON.parse(indexString);
      for (const entry of index) {
        localStorage.removeItem(entry.key);
      }
      localStorage.removeItem(versionsKey);
    }
  } catch (error) {
    console.error('Failed to clear human version history:', error);
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Track session activity
 */
export function createSessionActivity(sessionId: string): SessionActivity {
  return {
    sessionId,
    startTime: new Date(),
    totalSuggestions: 0,
    approvalsCount: 0,
    rejectionsCount: 0,
    pauseDuration: 0,
    userInterventions: 0,
    humanVersionsSaved: 0
  };
}

/**
 * Calculate autonomy metrics for analytics
 */
export interface AutonomyMetrics {
  approvalRate: number; // 0-1
  rejectionRate: number; // 0-1
  modificationRate: number; // 0-1
  pauseFrequency: number; // times paused per session
  humanVersionCheckpoints: number; // total saved versions
  averageDecisionTime: number; // milliseconds
  interventionPreference: InterventionLevel;
}

export function calculateAutonomyMetrics(activity: SessionActivity): AutonomyMetrics {
  const total = activity.totalSuggestions;

  return {
    approvalRate: total > 0 ? activity.approvalsCount / total : 0,
    rejectionRate: total > 0 ? activity.rejectionsCount / total : 0,
    modificationRate: total > 0 ? 0 : 0, // Placeholder
    pauseFrequency: activity.pauseDuration > 0 ? 1 : 0,
    humanVersionCheckpoints: activity.humanVersionsSaved,
    averageDecisionTime: 0, // Placeholder
    interventionPreference: 'suggestive' // Default
  };
}

/**
 * Generate autonomy report
 */
export function generateAutonomyReport(metrics: AutonomyMetrics): {
  summary: string;
  recommendations: string[];
} {
  const recommendations: string[] = [];

  // If high approval rate, suggest more evaluation
  if (metrics.approvalRate > 0.8 && metrics.rejectionRate < 0.1) {
    recommendations.push(
      'You approve most suggestions. Consider spending more time evaluating and rejecting suggestions.'
    );
  }

  // If frequently pausing, might be careful user
  if (metrics.pauseFrequency > 2) {
    recommendations.push(
      'You frequently pause AI assistance. This is good for autonomy! Consider your intervention level settings.'
    );
  }

  // If saving human versions frequently
  if (metrics.humanVersionCheckpoints > 3) {
    recommendations.push(
      'Great practice: You frequently save human-only versions. This helps maintain your independence.'
    );
  }

  // If low checkpoint rate
  if (metrics.humanVersionCheckpoints === 0) {
    recommendations.push(
      'Consider saving human-only versions periodically to maintain independent work samples.'
    );
  }

  let summary = '';
  if (metrics.rejectionRate > 0.4) {
    summary = 'High autonomy: You critically evaluate AI suggestions';
  } else if (metrics.rejectionRate > 0.2) {
    summary = 'Moderate autonomy: You have a balanced evaluation pattern';
  } else {
    summary = 'Low autonomy: You mostly approve suggestions without rejection';
  }

  return { summary, recommendations };
}

/**
 * Detect over-dependence warning signs
 */
export function detectOverDependenceWarnings(activity: SessionActivity): string[] {
  const warnings: string[] = [];

  // High approval rate without rejection
  if (
    activity.totalSuggestions > 10 &&
    activity.rejectionsCount === 0
  ) {
    warnings.push(
      'Warning: You have not rejected any suggestions yet. Consider being more critical.'
    );
  }

  // No pause in long session (possible passivity)
  const sessionDuration = new Date().getTime() - activity.startTime.getTime();
  if (sessionDuration > 3600000 && activity.pauseDuration === 0) {
    warnings.push(
      'Long session without pausing AI. Consider taking control breaks.'
    );
  }

  // No human versions saved
  if (activity.totalSuggestions > 20 && activity.humanVersionsSaved === 0) {
    warnings.push(
      'No human-only versions saved. Create checkpoints of independent work.'
    );
  }

  // High suggestion volume with auto-acceptance
  if (
    activity.totalSuggestions > 30 &&
    activity.approvalsCount / activity.totalSuggestions > 0.9
  ) {
    warnings.push(
      'Very high auto-acceptance rate. Are you reviewing suggestions carefully?'
    );
  }

  return warnings;
}

/**
 * Calculate agency erosion risk based on behavior
 *
 * Returns a score 0-1 indicating risk of skill degradation from over-reliance
 */
export function calculateAgencyErosionRisk(
  approvalRate: number,
  pauseFrequency: number,
  checkpointRate: number,
  sessionDuration: number
): number {
  let risk = 0;

  // High approval = higher risk (0.4 weight)
  risk += approvalRate * 0.4;

  // Low pause frequency = higher risk (0.2 weight)
  risk += (1 - Math.min(pauseFrequency / 3, 1)) * 0.2;

  // Low checkpoint rate = higher risk (0.2 weight)
  risk += (1 - Math.min(checkpointRate / 5, 1)) * 0.2;

  // Long sessions with low control interventions = higher risk (0.2 weight)
  const sessionHours = sessionDuration / 3600000;
  if (sessionHours > 2) {
    risk += 0.2;
  }

  return Math.min(risk, 1);
}

export default {
  calculateAIAgencyRisk,
  getInterventionLabel,
  storeHumanVersionSnapshot,
  retrieveHumanVersionHistory,
  restoreHumanVersion,
  clearHumanVersionHistory,
  formatTimestamp,
  createSessionActivity,
  calculateAutonomyMetrics,
  generateAutonomyReport,
  detectOverDependenceWarnings,
  calculateAgencyErosionRisk
};
