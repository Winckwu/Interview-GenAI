/**
 * Adaptive Pattern Learner
 * Meta-learning system that adjusts detection algorithms based on user feedback
 * Implements continuous improvement through feedback loops
 */

export interface FeedbackData {
  userId: string;
  feedback: 'accurate' | 'inaccurate' | 'partially_accurate';
  predictedPattern: string;
  actualPattern?: string;
  timestamp: Date;
  context?: string;
}

export interface AlgorithmVersion {
  version: number;
  createdAt: Date;
  description: string;
  threshold Changes?: Record<string, number>;
  performanceMetrics: {
    accuracy: number;
    coverage: number;
    falsePositiveRate: number;
  };
}

export interface LearningUpdate {
  parameterName: string;
  oldValue: number;
  newValue: number;
  rationale: string;
}

/**
 * Adaptive Pattern Learner Class
 * Learns from feedback and adjusts detection thresholds dynamically
 */
export class AdaptivePatternLearner {
  private feedbackHistory: FeedbackData[] = [];
  private algorithmVersions: AlgorithmVersion[] = [];
  private currentThresholds: Record<string, number> = {
    patternFQueryRatio: 2.0,
    patternFVerification: 0.3,
    patternAVerification: 0.85,
    patternAQueryRatio: 1.5,
    patternBQueryRatio: 1.5,
    patternBVerification: 0.65,
    hybridConfidenceThreshold: 0.50
  };

  /**
   * Initialize learning system
   */
  static initializeLearner(): AdaptivePatternLearner {
    return new AdaptivePatternLearner();
  }

  /**
   * Collect feedback from users
   */
  collectFeedback(feedback: FeedbackData): void {
    this.feedbackHistory.push(feedback);

    // Trigger learning if enough feedback accumulated
    if (this.feedbackHistory.length % 10 === 0) {
      this.analyzeAndAdapt();
    }
  }

  /**
   * Analyze feedback and adapt thresholds
   */
  private analyzeAndAdapt(): LearningUpdate[] {
    const updates: LearningUpdate[] = [];

    // Analyze Pattern F detection
    const fFeedback = this.feedbackHistory.filter((f) => f.actualPattern === 'F');
    if (fFeedback.length > 5) {
      const accuracy = fFeedback.filter((f) => f.feedback === 'accurate').length / fFeedback.length;

      if (accuracy < 0.8) {
        // Too many misses - lower threshold
        const update = this.adjustThreshold(
          'patternFQueryRatio',
          this.currentThresholds['patternFQueryRatio'],
          -0.1,
          'Pattern F detection accuracy below 80%'
        );
        if (update) updates.push(update);
      } else if (accuracy > 0.95) {
        // Excellent - keep stable or slightly raise for precision
        const update = this.adjustThreshold(
          'patternFQueryRatio',
          this.currentThresholds['patternFQueryRatio'],
          0.05,
          'Pattern F detection excellent - optimizing precision'
        );
        if (update) updates.push(update);
      }
    }

    // Analyze Pattern A detection
    const aFeedback = this.feedbackHistory.filter((f) => f.actualPattern === 'A');
    if (aFeedback.length > 5) {
      const accuracy = aFeedback.filter((f) => f.feedback === 'accurate').length / aFeedback.length;

      if (accuracy < 0.85) {
        // Adjust verification threshold
        const update = this.adjustThreshold(
          'patternAVerification',
          this.currentThresholds['patternAVerification'],
          -0.02,
          'Pattern A verification threshold too strict'
        );
        if (update) updates.push(update);
      }
    }

    // Analyze hybrid confidence threshold
    const hybridFeedback = this.feedbackHistory.filter(
      (f) => f.context === 'hybrid' || f.predictedPattern.includes('+')
    );
    if (hybridFeedback.length > 5) {
      const accuracy =
        hybridFeedback.filter((f) => f.feedback === 'accurate').length / hybridFeedback.length;

      if (accuracy < 0.6) {
        const update = this.adjustThreshold(
          'hybridConfidenceThreshold',
          this.currentThresholds['hybridConfidenceThreshold'],
          -0.05,
          'Hybrid pattern detection confidence too high'
        );
        if (update) updates.push(update);
      }
    }

    // Record algorithm version update
    if (updates.length > 0) {
      this.recordVersionUpdate(updates);
    }

    return updates;
  }

  /**
   * Adjust a detection threshold
   */
  private adjustThreshold(
    parameterName: string,
    oldValue: number,
    change: number,
    rationale: string
  ): LearningUpdate | null {
    const newValue = Math.max(0, Math.min(1, oldValue + change));

    if (Math.abs(newValue - oldValue) < 0.001) {
      return null; // Negligible change
    }

    this.currentThresholds[parameterName] = newValue;

    return {
      parameterName,
      oldValue,
      newValue,
      rationale
    };
  }

  /**
   * Record algorithm version update
   */
  private recordVersionUpdate(updates: LearningUpdate[]): void {
    const version: AlgorithmVersion = {
      version: this.algorithmVersions.length + 1,
      createdAt: new Date(),
      description: `Adaptive update: ${updates.map((u) => u.parameterName).join(', ')}`,
      threshold Changes: {},
      performanceMetrics: {
        accuracy: this.calculateAccuracy(),
        coverage: this.calculateCoverage(),
        falsePositiveRate: this.calculateFalsePositiveRate()
      }
    };

    updates.forEach((update) => {
      version.thresholdChanges![update.parameterName] = update.newValue;
    });

    this.algorithmVersions.push(version);
  }

  /**
   * Calculate accuracy from feedback
   */
  private calculateAccuracy(): number {
    if (this.feedbackHistory.length === 0) return 0;

    const accurate = this.feedbackHistory.filter((f) => f.feedback === 'accurate').length;
    return accurate / this.feedbackHistory.length;
  }

  /**
   * Calculate coverage (how many patterns we detect)
   */
  private calculateCoverage(): number {
    const patterns = new Set(this.feedbackHistory.map((f) => f.actualPattern || f.predictedPattern));
    const totalPatterns = 6; // A-F
    return patterns.size / totalPatterns;
  }

  /**
   * Calculate false positive rate
   */
  private calculateFalsePositiveRate(): number {
    const incorrect = this.feedbackHistory.filter(
      (f) => f.feedback === 'inaccurate' && f.actualPattern !== f.predictedPattern
    );
    return incorrect.length / Math.max(1, this.feedbackHistory.length);
  }

  /**
   * Get current detection thresholds
   */
  getCurrentThresholds(): Record<string, number> {
    return { ...this.currentThresholds };
  }

  /**
   * Get algorithm version history
   */
  getVersionHistory(): AlgorithmVersion[] {
    return [...this.algorithmVersions];
  }

  /**
   * Get learning report
   */
  generateLearningReport(): string {
    const latestVersion = this.algorithmVersions[this.algorithmVersions.length - 1];
    const accuracy = this.calculateAccuracy();
    const coverage = this.calculateCoverage();

    const report = `
╔════════════════════════════════════════════╗
║     Adaptive Learning System Report        ║
╚════════════════════════════════════════════╝

ALGORITHM VERSION: ${this.algorithmVersions.length}
Last Update: ${latestVersion ? latestVersion.createdAt.toISOString() : 'Never'}

PERFORMANCE METRICS:
  Accuracy Rate:        ${(accuracy * 100).toFixed(1)}%
  Pattern Coverage:     ${(coverage * 100).toFixed(1)}%
  False Positive Rate:  ${(this.calculateFalsePositiveRate() * 100).toFixed(1)}%

CURRENT THRESHOLDS:
${Object.entries(this.currentThresholds)
  .map(([param, value]) => `  ${param}: ${value.toFixed(3)}`)
  .join('\n')}

RECENT UPDATES:
${this.algorithmVersions
  .slice(-5)
  .map(
    (v) => `
  Version ${v.version} (${v.createdAt.toLocaleDateString()}):
    ${v.description}
    Accuracy: ${(v.performanceMetrics.accuracy * 100).toFixed(1)}%
`
  )
  .join('')}

LEARNING INSIGHTS:
${this.generateLearningInsights()}

RECOMMENDATIONS:
${this.generateRecommendations()}
    `;

    return report;
  }

  /**
   * Generate learning insights
   */
  private generateLearningInsights(): string {
    const feedback = this.feedbackHistory;

    if (feedback.length < 10) {
      return '  - Insufficient feedback for detailed insights yet. Continue collecting user feedback.';
    }

    const insights: string[] = [];

    // Find most accurate pattern
    const patternAccuracy: Record<string, number> = {};
    feedback.forEach((f) => {
      const pattern = f.actualPattern || 'unknown';
      if (!patternAccuracy[pattern]) patternAccuracy[pattern] = { correct: 0, total: 0 };
      patternAccuracy[pattern].total++;
      if (f.feedback === 'accurate') {
        patternAccuracy[pattern].correct++;
      }
    });

    const accuracyList = Object.entries(patternAccuracy)
      .map(([pattern, { correct, total }]) => ({
        pattern,
        accuracy: correct / total
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    if (accuracyList.length > 0) {
      insights.push(
        `  - Best detection: Pattern ${accuracyList[0].pattern} (${(accuracyList[0].accuracy * 100).toFixed(1)}%)`
      );
      if (accuracyList.length > 1) {
        insights.push(
          `  - Needs improvement: Pattern ${accuracyList[accuracyList.length - 1].pattern} (${(accuracyList[accuracyList.length - 1].accuracy * 100).toFixed(1)}%)`
        );
      }
    }

    // Trend analysis
    const recentAccuracy = this.calculateAccuracyForPeriod(7); // Last 7 entries
    const previousAccuracy = this.calculateAccuracyForPeriod(7, 14);

    if (recentAccuracy > previousAccuracy + 0.05) {
      insights.push('  - Positive trend: Accuracy improving over time');
    } else if (recentAccuracy < previousAccuracy - 0.05) {
      insights.push('  - Negative trend: Accuracy declining - review recent changes');
    }

    return insights.length > 0 ? insights.join('\n') : '  - System performing consistently';
  }

  /**
   * Calculate accuracy for a time period
   */
  private calculateAccuracyForPeriod(days: number, daysAgo: number = 0): number {
    const cutoff = new Date(Date.now() - (daysAgo + days) * 24 * 60 * 60 * 1000);
    const recent = this.feedbackHistory.filter((f) => f.timestamp > cutoff);

    if (recent.length === 0) return 0;
    return recent.filter((f) => f.feedback === 'accurate').length / recent.length;
  }

  /**
   * Generate recommendations for system improvements
   */
  private generateRecommendations(): string {
    const accuracy = this.calculateAccuracy();
    const recommendations: string[] = [];

    if (accuracy < 0.85) {
      recommendations.push('  - Accuracy below target (85%). Collect more user feedback for better adaptation.');
    }

    if (this.feedbackHistory.length < 50) {
      recommendations.push(
        `  - Collect more feedback (${50 - this.feedbackHistory.length} more needed) for statistically sound adaptation.`
      );
    }

    const fPosFalsePositives = this.feedbackHistory.filter((f) => f.predictedPattern === 'F' && f.actualPattern !== 'F').length;
    if (fPosFalsePositives > 5) {
      recommendations.push('  - High false positives for Pattern F. Consider lowering the detection threshold.');
    }

    if (recommendations.length === 0) {
      recommendations.push('  - System is performing well. Continue monitoring and collecting feedback.');
    }

    return recommendations.join('\n');
  }
}

export default AdaptivePatternLearner;
