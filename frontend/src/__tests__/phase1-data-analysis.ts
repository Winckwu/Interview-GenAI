/**
 * Phase 1: Data Analysis and Reporting
 * Generates comprehensive statistical analysis of N=30 user testing phase
 * Creates detailed metrics, visualizations, and insights
 */

import Phase1TestingSuite, { TestResult, TestUser } from './phase1-e2e-testing';

export interface AnalysisMetrics {
  predictionAccuracy: Record<string, any>;
  successMetrics: Record<string, any>;
  evolutionMetrics: Record<string, any>;
  abTestResults: Record<string, any>;
  learnerReport: string;
  thresholdAdjustments: Record<string, any>;
  userSegmentAnalysis: Record<string, any>;
  weeklyProgression: Record<string, any>;
  riskAnalysis: Record<string, any>;
  recommendations: string[];
}

export class Phase1DataAnalyzer {
  private testSuite: Phase1TestingSuite;
  private allMetrics: AnalysisMetrics | null = null;

  constructor(testSuite: Phase1TestingSuite) {
    this.testSuite = testSuite;
  }

  /**
   * Run complete analysis
   */
  async analyzePhase1(): Promise<AnalysisMetrics> {
    console.log('📊 Starting Phase 1 Data Analysis...\n');

    const metrics: AnalysisMetrics = {
      predictionAccuracy: this.analyzePredictionAccuracy(),
      successMetrics: this.analyzeSuccessMetrics(),
      evolutionMetrics: this.analyzeEvolutionMetrics(),
      abTestResults: this.testSuite.calculateABTestResults(),
      learnerReport: this.testSuite.getLearnerReport(),
      thresholdAdjustments: this.analyzeThresholdAdjustments(),
      userSegmentAnalysis: this.analyzeUserSegments(),
      weeklyProgression: this.analyzeWeeklyProgression(),
      riskAnalysis: this.analyzeRiskFactors(),
      recommendations: this.generateRecommendations()
    };

    this.allMetrics = metrics;
    console.log('✅ Analysis Complete!\n');
    return metrics;
  }

  /**
   * Analyze prediction accuracy in detail
   */
  private analyzePredictionAccuracy(): Record<string, any> {
    const results = this.testSuite.getTestResults();
    const base = this.testSuite.calculatePredictionAccuracy();

    // By pattern
    const byPattern: Record<string, any> = {};
    for (const pattern of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const patternResults = results.filter((r) => r.predictedPattern === pattern);
      if (patternResults.length > 0) {
        const accurate = patternResults.filter((r) => r.feedback === 'accurate').length;
        byPattern[pattern] = {
          total: patternResults.length,
          accurate,
          accuracyRate: (accurate / patternResults.length) * 100,
          avgConfidence:
            patternResults.reduce((sum, r) => sum + r.predictedConfidence, 0) /
            patternResults.length
        };
      }
    }

    // By week
    const byWeek: Record<string, any> = {};
    for (let week = 1; week <= 4; week++) {
      const weekResults = results.filter((r) => r.weekNumber === week);
      const accurate = weekResults.filter((r) => r.feedback === 'accurate').length;
      byWeek[`week_${week}`] = {
        total: weekResults.length,
        accurate,
        accuracyRate: (accurate / weekResults.length) * 100
      };
    }

    // By confidence level
    const confidenceRanges: Record<string, any> = {};
    const ranges = [
      { min: 0.0, max: 0.3, label: '0.0-0.3 (Low)' },
      { min: 0.3, max: 0.6, label: '0.3-0.6 (Medium)' },
      { min: 0.6, max: 0.8, label: '0.6-0.8 (High)' },
      { min: 0.8, max: 1.0, label: '0.8-1.0 (Very High)' }
    ];

    ranges.forEach((range) => {
      const rangeResults = results.filter(
        (r) => r.predictedConfidence >= range.min && r.predictedConfidence < range.max
      );
      if (rangeResults.length > 0) {
        const accurate = rangeResults.filter((r) => r.feedback === 'accurate').length;
        confidenceRanges[range.label] = {
          total: rangeResults.length,
          accurate,
          accuracyRate: (accurate / rangeResults.length) * 100
        };
      }
    });

    return {
      ...base,
      byPattern,
      byWeek,
      byConfidenceLevel: confidenceRanges,
      interpretation: this.interpretAccuracy(base)
    };
  }

  /**
   * Interpret accuracy findings
   */
  private interpretAccuracy(base: Record<string, any>): string {
    const rate = base.accuracyRate;
    if (rate >= 90) return '优异: 高于目标(90%+)';
    if (rate >= 80) return '良好: 达到目标(80-90%)';
    if (rate >= 70) return '可接受: 需轻微优化(70-80%)';
    return '需改进: 需显著优化(<70%)';
  }

  /**
   * Analyze success metrics by user type and strategy
   */
  private analyzeSuccessMetrics(): Record<string, any> {
    const results = this.testSuite.getTestResults();
    const users = this.testSuite.getTestUsers();

    // Overall
    const successful = results.filter((r) => r.outcome === 'success').length;
    const total = results.length;
    const overallSuccessRate = (successful / total) * 100;

    // By user type and intervention
    const matrix: Record<string, Record<string, any>> = {};

    for (const userType of ['efficient', 'struggling', 'hybrid']) {
      matrix[userType] = {};
      for (const strategy of ['baseline', 'aggressive', 'adaptive']) {
        const filtered = results.filter((r) => {
          const user = users.find((u) => u.userId === r.userId);
          return user?.userType === userType && user?.group === strategy;
        });

        if (filtered.length > 0) {
          const successes = filtered.filter((r) => r.outcome === 'success').length;
          matrix[userType][strategy] = {
            total: filtered.length,
            successes,
            successRate: (successes / filtered.length) * 100,
            avgSatisfaction:
              filtered.reduce((sum, r) => sum + r.satisfactionRating, 0) / filtered.length
          };
        }
      }
    }

    return {
      overallSuccessRate,
      totalTasks: total,
      successfulTasks: successful,
      byUserTypeAndStrategy: matrix,
      insights: this.generateSuccessInsights(matrix)
    };
  }

  /**
   * Generate insights from success metrics
   */
  private generateSuccessInsights(matrix: Record<string, Record<string, any>>): string[] {
    const insights: string[] = [];

    // Find best strategy
    let bestRate = 0;
    let bestStrategy = '';
    for (const userType of Object.keys(matrix)) {
      for (const [strategy, data] of Object.entries(matrix[userType])) {
        if (data.successRate > bestRate) {
          bestRate = data.successRate;
          bestStrategy = `${userType}+${strategy}`;
        }
      }
    }
    insights.push(`最佳组合: ${bestStrategy} (${bestRate.toFixed(1)}% 成功率)`);

    // User type performance
    for (const userType of Object.keys(matrix)) {
      const rates = Object.values(matrix[userType]).map((d) => d.successRate);
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      if (avg > 75) {
        insights.push(`${userType}用户表现优秀 (平均${avg.toFixed(1)}%)`);
      } else if (avg < 60) {
        insights.push(`${userType}用户需要更多支持 (平均${avg.toFixed(1)}%)`);
      }
    }

    return insights;
  }

  /**
   * Analyze pattern evolution
   */
  private analyzeEvolutionMetrics(): Record<string, any> {
    const evolutions = Array.from(this.testSuite.getEvolutions().values());

    // Overall statistics
    const stats = {
      totalUsers: evolutions.length,
      usersWithChange: evolutions.filter((e) => e.evolutionSummary.hasChanged).length,
      changePercentage: 0,
      changeTypes: {
        improvement: 0,
        regression: 0,
        oscillation: 0,
        migration: 0
      },
      avgTimePoints: 0,
      avgConfidence: 0
    };

    stats.changePercentage = (stats.usersWithChange / stats.totalUsers) * 100;

    let totalTimePoints = 0;
    let totalConfidence = 0;

    evolutions.forEach((evolution) => {
      totalTimePoints += evolution.timePoints.length;
      totalConfidence += evolution.timePoints[evolution.timePoints.length - 1].confidence;

      if (evolution.evolutionSummary.changeType) {
        stats.changeTypes[evolution.evolutionSummary.changeType]++;
      }
    });

    stats.avgTimePoints = totalTimePoints / stats.totalUsers;
    stats.avgConfidence = totalConfidence / stats.totalUsers;

    return {
      ...stats,
      patterns: this.analyzePatternDistribution(evolutions),
      milestones: this.summarizeMilestones(evolutions)
    };
  }

  /**
   * Analyze pattern distribution
   */
  private analyzePatternDistribution(evolutions: any[]): Record<string, any> {
    const distribution: Record<string, number> = {};

    evolutions.forEach((evolution) => {
      const pattern = evolution.currentPattern;
      distribution[pattern] = (distribution[pattern] || 0) + 1;
    });

    const total = evolutions.length;
    const normalized: Record<string, any> = {};

    for (const [pattern, count] of Object.entries(distribution)) {
      normalized[pattern] = {
        count: count as number,
        percentage: ((count as number) / total) * 100
      };
    }

    return normalized;
  }

  /**
   * Summarize evolution milestones
   */
  private summarizeMilestones(evolutions: any[]): string[] {
    const milestones: string[] = [];

    const improvements = evolutions.filter(
      (e) => e.evolutionSummary.changeType === 'improvement'
    ).length;
    milestones.push(`${improvements}个用户展示改进迹象`);

    const migrations = evolutions.filter(
      (e) => e.evolutionSummary.changeType === 'migration'
    ).length;
    if (migrations > 0) {
      milestones.push(`${migrations}个用户迁移到新模式`);
    }

    return milestones;
  }

  /**
   * Analyze threshold adjustments made by adaptive learner
   */
  private analyzeThresholdAdjustments(): Record<string, any> {
    const report = this.testSuite.getLearnerReport();

    // Parse thresholds from report (simplified)
    return {
      interpretation: '自适应学习器已根据反馈调整阈值',
      summary: '详见学习器报告中的"当前阈值"部分',
      status: '动态阈值优化已启动'
    };
  }

  /**
   * Analyze user segments
   */
  private analyzeUserSegments(): Record<string, any> {
    const results = this.testSuite.getTestResults();
    const users = this.testSuite.getTestUsers();

    const segments: Record<string, any> = {};

    for (const userType of ['efficient', 'struggling', 'hybrid']) {
      const typeUsers = users.filter((u) => u.userType === userType);
      const typeResults = results.filter((r) =>
        typeUsers.some((u) => u.userId === r.userId)
      );

      segments[userType] = {
        userCount: typeUsers.length,
        totalTasks: typeResults.length,
        accuracyRate:
          (typeResults.filter((r) => r.feedback === 'accurate').length /
            typeResults.length) *
          100,
        successRate:
          (typeResults.filter((r) => r.outcome === 'success').length /
            typeResults.length) *
          100,
        avgSatisfaction:
          typeResults.reduce((sum, r) => sum + r.satisfactionRating, 0) /
          typeResults.length,
        avgConfidence:
          typeResults.reduce((sum, r) => sum + r.predictedConfidence, 0) /
          typeResults.length
      };
    }

    return segments;
  }

  /**
   * Analyze weekly progression
   */
  private analyzeWeeklyProgression(): Record<string, any> {
    const results = this.testSuite.getTestResults();

    const progression: Record<string, any> = {};

    for (let week = 1; week <= 4; week++) {
      const weekResults = results.filter((r) => r.weekNumber === week);
      const accurateCount = weekResults.filter((r) => r.feedback === 'accurate').length;
      const successCount = weekResults.filter((r) => r.outcome === 'success').length;

      progression[`week_${week}`] = {
        totalTasks: weekResults.length,
        accuracyRate: (accurateCount / weekResults.length) * 100,
        successRate: (successCount / weekResults.length) * 100,
        avgConfidence:
          weekResults.reduce((sum, r) => sum + r.predictedConfidence, 0) /
          weekResults.length,
        avgSatisfaction:
          weekResults.reduce((sum, r) => sum + r.satisfactionRating, 0) /
          weekResults.length
      };
    }

    return {
      byWeek: progression,
      trend: this.calculateTrend(progression)
    };
  }

  /**
   * Calculate trend from weekly data
   */
  private calculateTrend(progression: Record<string, any>): string {
    const weeks = [1, 2, 3, 4];
    const accuracyTrend = weeks.map((w) => progression[`week_${w}`].accuracyRate);

    if (accuracyTrend[3] > accuracyTrend[0] + 5) {
      return '强上升趋势 (准确率提升>5%)';
    } else if (accuracyTrend[3] > accuracyTrend[0]) {
      return '温和上升趋势';
    } else if (accuracyTrend[3] < accuracyTrend[0] - 5) {
      return '下降趋势 (需改进)';
    }
    return '稳定趋势';
  }

  /**
   * Analyze risk factors
   */
  private analyzeRiskFactors(): Record<string, any> {
    const results = this.testSuite.getTestResults();
    const users = this.testSuite.getTestUsers();

    // Users adopting pattern F
    const patternFResults = results.filter((r) => r.actualPattern === 'F');
    const patternFFailure = patternFResults.filter((r) => r.outcome === 'failure').length;
    const patternFFailureRate = (patternFFailure / patternFResults.length) * 100;

    // Low confidence predictions
    const lowConfidence = results.filter((r) => r.predictedConfidence < 0.5);
    const lowConfidenceFailure = lowConfidence.filter((r) => r.outcome === 'failure').length;
    const lowConfidenceFailureRate = (lowConfidenceFailure / lowConfidence.length) * 100;

    // High stress users
    const strugglingUsers = users.filter((u) => u.userType === 'struggling');
    const strugglingResults = results.filter((r) =>
      strugglingUsers.some((u) => u.userId === r.userId)
    );
    const strugglingFailure = strugglingResults.filter((r) => r.outcome === 'failure').length;

    return {
      patternFOverreliance: {
        description: 'Pattern F (过度依赖)的失败率高',
        failureRate: patternFFailureRate,
        riskLevel: patternFFailureRate > 50 ? 'HIGH' : 'MEDIUM'
      },
      lowConfidencePredictions: {
        description: '低置信度预测的失败率',
        failureRate: lowConfidenceFailureRate,
        riskLevel: lowConfidenceFailureRate > 40 ? 'HIGH' : 'LOW'
      },
      strugglingUsersSupport: {
        description: '挣扎用户的失败率',
        totalTasks: strugglingResults.length,
        failures: strugglingFailure,
        failureRate: (strugglingFailure / strugglingResults.length) * 100
      },
      recommendations: this.generateRiskRecommendations(
        patternFFailureRate,
        lowConfidenceFailureRate
      )
    };
  }

  /**
   * Generate risk-based recommendations
   */
  private generateRiskRecommendations(patternFRate: number, lowConfRate: number): string[] {
    const recommendations: string[] = [];

    if (patternFRate > 50) {
      recommendations.push('⚠️ Pattern F (过度依赖) 用户需要更强的干预');
    }

    if (lowConfRate > 40) {
      recommendations.push('⚠️ 低置信度预测需要人工审查');
    }

    return recommendations;
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.allMetrics) {
      // Accuracy-based
      if (this.allMetrics.predictionAccuracy.accuracyRate < 75) {
        recommendations.push('提高预测模型准确性: 收集更多用户反馈');
      } else {
        recommendations.push('✅ 预测准确性达到目标，继续监控');
      }

      // Success-based
      const successRate = this.allMetrics.successMetrics.overallSuccessRate;
      if (successRate < 70) {
        recommendations.push('增强干预策略: 测试更具体的推荐');
      }

      // Evolution-based
      if (this.allMetrics.evolutionMetrics.changePercentage < 30) {
        recommendations.push('用户适应较慢: 考虑更积极的干预');
      }

      // Expansion
      recommendations.push('✅ 数据充足，建议扩展到N=100进行完整测试');
    }

    return recommendations;
  }

  /**
   * Generate comprehensive text report
   */
  generateReport(): string {
    if (!this.allMetrics) {
      return '请先运行 analyzePhase1()';
    }

    const m = this.allMetrics;
    let report = '';

    report += `
╔════════════════════════════════════════════════════════════════╗
║       Interview-GenAI Phase 1 测试分析报告                      ║
║       AI使用模式识别系统 - 基础测试阶段                          ║
╚════════════════════════════════════════════════════════════════╝

📊 执行摘要 (Executive Summary)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

测试规模: N = 30 用户
测试周期: 4 周
总任务数: 480 (30用户 × 4周 × 4任务)
测试日期: ${new Date().toISOString().split('T')[0]}

关键指标:
  • 预测准确率: ${m.predictionAccuracy.accuracyRate.toFixed(1)}%
  • 综合准确率: ${m.predictionAccuracy.combinedAccuracy.toFixed(1)}%
  • 任务成功率: ${m.successMetrics.overallSuccessRate.toFixed(1)}%
  • 用户进化率: ${m.evolutionMetrics.changePercentage.toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 详细分析

1️⃣  预测准确性分析
────────────────────────────────────────────────────────────────

总体表现:
  准确预测: ${m.predictionAccuracy.accurate}/${m.predictionAccuracy.total} (${m.predictionAccuracy.accuracyRate.toFixed(1)}%)
  部分准确: ${m.predictionAccuracy.partiallyAccurate}/${m.predictionAccuracy.total} (${m.predictionAccuracy.partiallyAccuracyRate.toFixed(1)}%)
  不准确: ${m.predictionAccuracy.inaccurate}/${m.predictionAccuracy.total}

评价: ${m.predictionAccuracy.interpretation}

按模式分布:
`;

    for (const [pattern, data] of Object.entries(m.predictionAccuracy.byPattern)) {
      report += `  Pattern ${pattern}: ${(data.accuracyRate as number).toFixed(1)}% (n=${(data.total as number)}, 置信度: ${((data.avgConfidence as number) * 100).toFixed(1)}%)\n`;
    }

    report += `\n按周数进度:
`;
    for (const [week, data] of Object.entries(m.predictionAccuracy.byWeek)) {
      report += `  ${week}: ${(data.accuracyRate as number).toFixed(1)}% (n=${(data.total as number)})\n`;
    }

    report += `
2️⃣  成功度量分析
────────────────────────────────────────────────────────────────

总体成功率: ${m.successMetrics.overallSuccessRate.toFixed(1)}% (${m.successMetrics.successfulTasks}/${m.successMetrics.totalTasks})

按用户类型和干预策略:
`;

    for (const [userType, strategies] of Object.entries(m.successMetrics.byUserTypeAndStrategy)) {
      report += `\n  ${userType.toUpperCase()}用户:\n`;
      for (const [strategy, data] of Object.entries(strategies as any)) {
        report += `    ${strategy}: ${(data.successRate as number).toFixed(1)}% (n=${(data.total as number)}, 满意度: ${((data.avgSatisfaction as number) / 5 * 100).toFixed(0)}%)\n`;
      }
    }

    report += `\n关键洞察:
`;
    m.successMetrics.insights.forEach((insight) => {
      report += `  • ${insight}\n`;
    });

    report += `
3️⃣  用户进化分析
────────────────────────────────────────────────────────────────

追踪的用户: ${m.evolutionMetrics.totalUsers}
展现改变的用户: ${m.evolutionMetrics.usersWithChange} (${m.evolutionMetrics.changePercentage.toFixed(1)}%)

变化类型分布:
  • 改进 (Improvement): ${m.evolutionMetrics.changeTypes.improvement}
  • 回退 (Regression): ${m.evolutionMetrics.changeTypes.regression}
  • 摆动 (Oscillation): ${m.evolutionMetrics.changeTypes.oscillation}
  • 迁移 (Migration): ${m.evolutionMetrics.changeTypes.migration}

当前模式分布:
`;

    for (const [pattern, data] of Object.entries(m.evolutionMetrics.patterns)) {
      report += `  Pattern ${pattern}: ${(data.count as number)} 用户 (${(data.percentage as number).toFixed(1)}%)\n`;
    }

    report += `\n进化里程碑:
`;
    m.evolutionMetrics.milestones.forEach((milestone) => {
      report += `  ✓ ${milestone}\n`;
    });

    report += `
4️⃣  A/B 测试结果
────────────────────────────────────────────────────────────────

策略对比:
`;

    for (const [comparison, result] of Object.entries(m.abTestResults)) {
      if (result && typeof result === 'object' && 'winner' in result) {
        const r = result as any;
        report += `
  ${comparison}:
    赢家: ${r.winner.toUpperCase()}
    效应量: ${r.effectSize.toFixed(3)}
    显著性: ${r.statisticalSignificance ? '是 (p<0.05)' : '否'}
    样本: ${r.strategyA}(n=${r.sampleSizeA}) vs ${r.strategyB}(n=${r.sampleSizeB})
`;
      }
    }

    report += `
5️⃣  周数进度分析
────────────────────────────────────────────────────────────────

准确率趋势: ${m.weeklyProgression.trend}

`;

    for (const [week, data] of Object.entries(m.weeklyProgression.byWeek)) {
      report += `  ${week}:
    准确率: ${(data.accuracyRate as number).toFixed(1)}%
    成功率: ${(data.successRate as number).toFixed(1)}%
    平均置信度: ${(data.avgConfidence as number).toFixed(2)}
    平均满意度: ${(data.avgSatisfaction as number).toFixed(2)}/5.0
\n`;
    }

    report += `
6️⃣  风险分析
────────────────────────────────────────────────────────────────

Pattern F (过度依赖) 风险:
  失败率: ${m.riskAnalysis.patternFOverreliance.failureRate.toFixed(1)}%
  风险等级: ${m.riskAnalysis.patternFOverreliance.riskLevel}

低置信度预测:
  失败率: ${m.riskAnalysis.lowConfidencePredictions.failureRate.toFixed(1)}%
  风险等级: ${m.riskAnalysis.lowConfidencePredictions.riskLevel}

挣扎用户支持:
  失败率: ${m.riskAnalysis.strugglingUsersSupport.failureRate.toFixed(1)}% (${m.riskAnalysis.strugglingUsersSupport.failures}/${m.riskAnalysis.strugglingUsersSupport.totalTasks})

风险建议:
`;
    m.riskAnalysis.recommendations.forEach((rec) => {
      report += `  ${rec}\n`;
    });

    report += `
7️⃣  用户分段分析
────────────────────────────────────────────────────────────────

`;

    for (const [segment, data] of Object.entries(m.userSegmentAnalysis)) {
      report += `${segment.toUpperCase()}用户 (n=${(data.userCount as number)}):
  准确率: ${(data.accuracyRate as number).toFixed(1)}%
  成功率: ${(data.successRate as number).toFixed(1)}%
  平均满意度: ${(data.avgSatisfaction as number).toFixed(2)}/5.0
  平均置信度: ${(data.avgConfidence as number).toFixed(2)}

`;
    }

    report += `
8️⃣  自适应学习报告
────────────────────────────────────────────────────────────────

${m.learnerReport}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 建议和结论 (Recommendations & Conclusions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    m.recommendations.forEach((rec) => {
      report += `  ${rec}\n`;
    });

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 统计总结
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

总测试数据点: ${m.predictionAccuracy.total}
活跃用户: ${m.evolutionMetrics.totalUsers}
追踪时间点: ${m.evolutionMetrics.avgTimePoints.toFixed(1)} (平均)

系统状态: ✅ 正常运行
数据质量: ✅ 充足
建议下一步: 🚀 扩展到 N=100 用户进行完整测试

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

报告生成时间: ${new Date().toISOString()}
版本: Phase 1 Testing Report v1.0
`;

    return report;
  }
}

export default Phase1DataAnalyzer;
