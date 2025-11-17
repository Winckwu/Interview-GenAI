/**
 * Pattern Evolution Tracker
 * Tracks how users' patterns change over time (temporal analysis)
 * Enables detection of pattern migration, learning effects, and behavior change
 */

export interface TimePointData {
  timestamp: Date;
  timeIndex: number; // 0 (T0) to 4 (T4)
  pattern: string;
  confidence: number;
  queryRatio: number;
  verificationRate: number;
  independenceRate: number;
  contextAware: boolean;
  notes?: string;
}

export interface UserEvolution {
  userId: string;
  userName: string;
  startingPattern: string;
  currentPattern: string;
  timePoints: TimePointData[];
  evolutionSummary: {
    hasChanged: boolean;
    changeType?: 'improvement' | 'regression' | 'oscillation' | 'migration';
    milestones: string[];
    totalTimePoints: number;
  };
}

export interface EvolutionInsight {
  userId: string;
  insight: string;
  timelineIndicator: string; // e.g., "T0→T4"
  changeIntensity: number; // 0-1
  relatedFactors: string[];
}

/**
 * Pattern Evolution Tracker Class
 * Analyzes how users' AI usage patterns change over time
 */
export class PatternEvolutionTracker {
  private userEvolutions: Map<string, UserEvolution> = new Map();

  /**
   * Initialize evolution tracking for a user
   */
  static initializeUserTracking(userId: string, userName: string, initialPattern: string): UserEvolution {
    return {
      userId,
      userName,
      startingPattern: initialPattern,
      currentPattern: initialPattern,
      timePoints: [
        {
          timestamp: new Date(),
          timeIndex: 0,
          pattern: initialPattern,
          confidence: 0.8,
          queryRatio: 1.5,
          verificationRate: 0.6,
          independenceRate: 0.6,
          contextAware: false,
          notes: 'Baseline measurement'
        }
      ],
      evolutionSummary: {
        hasChanged: false,
        milestones: ['Tracking started'],
        totalTimePoints: 1
      }
    };
  }

  /**
   * Record a new time point for user evolution
   */
  static recordTimePoint(
    evolution: UserEvolution,
    pattern: string,
    confidence: number,
    queryRatio: number,
    verificationRate: number,
    independenceRate: number,
    contextAware: boolean,
    notes?: string
  ): void {
    const timeIndex = evolution.timePoints.length;

    if (timeIndex > 4) {
      console.warn(`User ${evolution.userId} already has 5 time points (T0-T4)`);
      return;
    }

    const newTimePoint: TimePointData = {
      timestamp: new Date(),
      timeIndex,
      pattern,
      confidence,
      queryRatio,
      verificationRate,
      independenceRate,
      contextAware,
      notes
    };

    evolution.timePoints.push(newTimePoint);
    evolution.currentPattern = pattern;
    evolution.evolutionSummary.totalTimePoints = timeIndex + 1;

    // Detect changes
    if (pattern !== evolution.startingPattern) {
      evolution.evolutionSummary.hasChanged = true;
      evolution.evolutionSummary.changeType = this.detectChangeType(evolution);
      evolution.evolutionSummary.milestones.push(
        `Pattern changed to ${pattern} at T${timeIndex}`
      );
    }
  }

  /**
   * Detect the type of change in user's pattern
   */
  private static detectChangeType(
    evolution: UserEvolution
  ): 'improvement' | 'regression' | 'oscillation' | 'migration' {
    const points = evolution.timePoints;

    if (points.length < 2) {
      return 'migration';
    }

    // Check for oscillation (pattern changes back and forth)
    const patternChanges = points.map((p) => p.pattern);
    const uniquePatterns = new Set(patternChanges);

    if (uniquePatterns.size > 2) {
      return 'oscillation';
    }

    // Check for improvement (verification increases, query ratio decreases)
    const startVerification = points[0].verificationRate;
    const endVerification = points[points.length - 1].verificationRate;
    const startQueryRatio = points[0].queryRatio;
    const endQueryRatio = points[points.length - 1].queryRatio;

    const verificationImproved = endVerification > startVerification + 0.1;
    const queryEfficiency = endQueryRatio < startQueryRatio - 0.2;

    if (verificationImproved && queryEfficiency) {
      return 'improvement';
    }

    // Check for regression
    if (endVerification < startVerification - 0.1 && endQueryRatio > startQueryRatio + 0.2) {
      return 'regression';
    }

    return 'migration';
  }

  /**
   * Generate evolution insights for a user
   */
  static generateEvolutionInsights(evolution: UserEvolution): EvolutionInsight[] {
    const insights: EvolutionInsight[] = [];
    const points = evolution.timePoints;

    if (points.length < 2) {
      return [];
    }

    // Insight 1: Pattern change
    if (evolution.evolutionSummary.hasChanged) {
      const startPattern = points[0].pattern;
      const endPattern = points[points.length - 1].pattern;

      const changeIntensity = Math.abs(
        points[0].verificationRate - points[points.length - 1].verificationRate
      );

      const factors = this.identifyChangeFactors(points);

      insights.push({
        userId: evolution.userId,
        insight: `Pattern evolved from ${startPattern} to ${endPattern}. ${this.getChangeDescription(evolution.evolutionSummary.changeType!)}`,
        timelineIndicator: `T0→T${points.length - 1}`,
        changeIntensity,
        relatedFactors: factors
      });
    }

    // Insight 2: Verification trend
    const verificationTrend = this.analyzeVerificationTrend(points);
    if (verificationTrend.trend !== 'stable') {
      insights.push({
        userId: evolution.userId,
        insight: `Verification rate is ${verificationTrend.trend}: ${verificationTrend.description}`,
        timelineIndicator: `T0→T${points.length - 1}`,
        changeIntensity: Math.abs(verificationTrend.change),
        relatedFactors: ['verification_accuracy', 'quality_control']
      });
    }

    // Insight 3: Query efficiency trend
    const queryTrend = this.analyzeQueryTrend(points);
    if (queryTrend.trend !== 'stable') {
      insights.push({
        userId: evolution.userId,
        insight: `AI query efficiency is ${queryTrend.trend}: ${queryTrend.description}`,
        timelineIndicator: `T0→T${points.length - 1}`,
        changeIntensity: Math.abs(queryTrend.change),
        relatedFactors: ['query_efficiency', 'ai_reliance']
      });
    }

    // Insight 4: Context awareness adoption
    const contextAdoption = this.analyzeContextAdoption(points);
    if (contextAdoption.adopted) {
      insights.push({
        userId: evolution.userId,
        insight: `User adopted context-aware strategies (from ${contextAdoption.startTimestamp} onwards)`,
        timelineIndicator: `T${contextAdoption.startIndex}→T${points.length - 1}`,
        changeIntensity: 0.7,
        relatedFactors: ['context_awareness', 'adaptive_behavior']
      });
    }

    return insights;
  }

  /**
   * Identify factors related to pattern change
   */
  private static identifyChangeFactors(points: TimePointData[]): string[] {
    const factors: string[] = [];

    // Check if verification improved
    if (points[points.length - 1].verificationRate > points[0].verificationRate) {
      factors.push('increased_verification');
    }

    // Check if query ratio changed
    if (points[points.length - 1].queryRatio < points[0].queryRatio) {
      factors.push('improved_efficiency');
    }

    // Check if context awareness was adopted
    const hadContextAwareness = points.some((p) => p.contextAware);
    if (hadContextAwareness && !points[0].contextAware) {
      factors.push('context_awareness_adoption');
    }

    // Check if independence changed
    if (points[points.length - 1].independenceRate > points[0].independenceRate + 0.1) {
      factors.push('increased_independence');
    }

    if (factors.length === 0) {
      factors.push('unknown_factors');
    }

    return factors;
  }

  /**
   * Get description of change type
   */
  private static getChangeDescription(changeType: string): string {
    const descriptions: Record<string, string> = {
      improvement: 'This represents positive progress with better verification and efficiency.',
      regression: 'This represents a decline in performance metrics.',
      oscillation: 'This shows fluctuating behavior across multiple patterns.',
      migration: 'This indicates a shift to a different usage strategy.'
    };

    return descriptions[changeType] || 'Pattern change detected.';
  }

  /**
   * Analyze verification trend
   */
  private static analyzeVerificationTrend(
    points: TimePointData[]
  ): { trend: 'improving' | 'declining' | 'stable'; description: string; change: number } {
    const start = points[0].verificationRate;
    const end = points[points.length - 1].verificationRate;
    const change = end - start;

    if (Math.abs(change) < 0.05) {
      return {
        trend: 'stable',
        description: 'Verification rate remains consistent',
        change: 0
      };
    }

    if (change > 0) {
      return {
        trend: 'improving',
        description: `Verification increased from ${(start * 100).toFixed(0)}% to ${(end * 100).toFixed(0)}%`,
        change
      };
    } else {
      return {
        trend: 'declining',
        description: `Verification decreased from ${(start * 100).toFixed(0)}% to ${(end * 100).toFixed(0)}%`,
        change
      };
    }
  }

  /**
   * Analyze query efficiency trend
   */
  private static analyzeQueryTrend(
    points: TimePointData[]
  ): { trend: 'improving' | 'declining' | 'stable'; description: string; change: number } {
    const start = points[0].queryRatio;
    const end = points[points.length - 1].queryRatio;
    const change = start - end; // Lower is better

    if (Math.abs(change) < 0.3) {
      return {
        trend: 'stable',
        description: 'Query efficiency remains stable',
        change: 0
      };
    }

    if (change > 0) {
      return {
        trend: 'improving',
        description: `Query ratio improved from ${start.toFixed(2)} to ${end.toFixed(2)}`,
        change
      };
    } else {
      return {
        trend: 'declining',
        description: `Query ratio increased from ${start.toFixed(2)} to ${end.toFixed(2)}`,
        change: Math.abs(change)
      };
    }
  }

  /**
   * Analyze context awareness adoption
   */
  private static analyzeContextAdoption(
    points: TimePointData[]
  ): { adopted: boolean; startIndex: number; startTimestamp: string } {
    const startAware = points[0].contextAware;

    // Find when context awareness was adopted
    for (let i = 1; i < points.length; i++) {
      if (!startAware && points[i].contextAware) {
        return {
          adopted: true,
          startIndex: i,
          startTimestamp: `T${i}`
        };
      }
    }

    return { adopted: false, startIndex: -1, startTimestamp: 'Never' };
  }

  /**
   * Generate evolution summary statistics
   */
  static generateEvolutionStatistics(evolutions: UserEvolution[]) {
    const stats = {
      totalUsers: evolutions.length,
      usersWithChange: evolutions.filter((e) => e.evolutionSummary.hasChanged).length,
      changePercentage: 0,
      changeTypeDistribution: {} as Record<string, number>,
      improvementCount: 0,
      regressionCount: 0,
      averageTimePoints: 0,
      contextAdoptionCount: 0
    };

    let totalTimePoints = 0;

    evolutions.forEach((evolution) => {
      if (evolution.evolutionSummary.hasChanged) {
        const changeType = evolution.evolutionSummary.changeType || 'migration';
        stats.changeTypeDistribution[changeType] =
          (stats.changeTypeDistribution[changeType] || 0) + 1;

        if (changeType === 'improvement') {
          stats.improvementCount++;
        } else if (changeType === 'regression') {
          stats.regressionCount++;
        }
      }

      totalTimePoints += evolution.evolutionSummary.totalTimePoints;

      // Check context adoption
      const firstPoint = evolution.timePoints[0];
      const hasContextLater = evolution.timePoints.some((p) => p.contextAware);
      if (!firstPoint.contextAware && hasContextLater) {
        stats.contextAdoptionCount++;
      }
    });

    stats.changePercentage = (stats.usersWithChange / stats.totalUsers) * 100;
    stats.averageTimePoints = totalTimePoints / evolutions.length;

    return stats;
  }
}

export default PatternEvolutionTracker;
