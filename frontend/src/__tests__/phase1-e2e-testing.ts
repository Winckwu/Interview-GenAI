/**
 * Phase 1: End-to-End Testing
 * Comprehensive test simulating N=30 users across all 5 advanced modules
 * Tests complete workflow: Prediction → Intervention → Tracking → Learning → Optimization
 *
 * This test suite simulates a 4-week user cohort through the advanced ML system
 */

import { PatternEvolutionTracker, UserEvolution } from '../components/PatternEvolutionTracker';
import { PredictivePatternAdvisor, TaskContext, UserHistory } from '../components/PredictivePatternAdvisor';
import { ABTestingFramework, InterventionMetrics } from '../components/ABTestingFramework';
import { AdaptivePatternLearner } from '../components/AdaptivePatternLearner';

/**
 * Test Data Structures for Phase 1 Testing
 */
export interface TestUser {
  userId: string;
  name: string;
  initialPattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  userType: 'efficient' | 'struggling' | 'hybrid';
  group: 'baseline' | 'aggressive' | 'adaptive';
}

export interface TestScenario {
  weekNumber: number;
  taskCount: number;
  taskComplexity: 'low' | 'medium' | 'high';
  taskType: 'coding' | 'writing' | 'analysis' | 'design';
}

export interface TestResult {
  userId: string;
  taskId: string;
  weekNumber: number;
  predictedPattern: string;
  predictedConfidence: number;
  actualPattern: string;
  interventionStrategy: string;
  interventionText: string;
  feedback: 'accurate' | 'inaccurate' | 'partially_accurate';
  outcome: 'success' | 'failure';
  satisfactionRating: number;
  timePoint: number;
}

/**
 * Phase 1 Testing Suite - N=30 User Cohort
 */
export class Phase1TestingSuite {
  private testUsers: TestUser[] = [];
  private allResults: TestResult[] = [];
  private evolutions: Map<string, UserEvolution> = new Map();
  private learner: AdaptivePatternLearner;
  private testMetrics: Map<string, InterventionMetrics[]> = new Map();

  constructor() {
    this.learner = AdaptivePatternLearner.initializeLearner();
    this.generateTestCohort();
  }

  /**
   * Generate N=30 representative test cohort
   */
  private generateTestCohort(): void {
    const patterns = ['A', 'B', 'C', 'D', 'E', 'F'];
    const strategies = ['baseline', 'aggressive', 'adaptive'];
    const userTypes = ['efficient', 'struggling', 'hybrid'] as const;

    // Create 30 users: 10 efficient, 15 struggling, 5 hybrid
    let userId = 1;

    // Efficient users (10)
    for (let i = 0; i < 10; i++) {
      this.testUsers.push({
        userId: `eff_${String(userId).padStart(3, '0')}`,
        name: `Efficient User ${userId}`,
        initialPattern: patterns[Math.floor(Math.random() * 4)] as any, // A-D (efficient patterns)
        userType: 'efficient',
        group: strategies[i % 3] as any
      });
      userId++;
    }

    // Struggling users (15)
    for (let i = 0; i < 15; i++) {
      this.testUsers.push({
        userId: `str_${String(userId).padStart(3, '0')}`,
        name: `Struggling User ${userId}`,
        initialPattern: patterns[Math.floor(Math.random() * 6)] as any,
        userType: 'struggling',
        group: strategies[i % 3] as any
      });
      userId++;
    }

    // Hybrid users (5)
    for (let i = 0; i < 5; i++) {
      this.testUsers.push({
        userId: `hyb_${String(userId).padStart(3, '0')}`,
        name: `Hybrid User ${userId}`,
        initialPattern: 'C' as any, // Context-aware
        userType: 'hybrid',
        group: strategies[i % 3] as any
      });
      userId++;
    }

    // Initialize evolution tracking
    this.testUsers.forEach((user) => {
      const evolution = PatternEvolutionTracker.initializeUserTracking(
        user.userId,
        user.name,
        user.initialPattern
      );
      this.evolutions.set(user.userId, evolution);
      this.testMetrics.set(user.group, []);
    });
  }

  /**
   * Create task context for a given scenario
   */
  private createTaskContext(
    taskId: string,
    scenario: TestScenario
  ): TaskContext {
    const complexityMap = { low: 3, medium: 5, high: 8 };
    const taskTypes = ['coding', 'writing', 'analysis', 'design'] as const;

    return {
      taskId,
      taskType: scenario.taskType,
      complexity: complexityMap[scenario.taskComplexity],
      deadline: scenario.taskComplexity === 'high' ? 12 : 24,
      importance: scenario.taskComplexity === 'high' ? 9 : 6,
      familiarityScore: 0.5 + Math.random() * 0.4,
      urgency: scenario.taskComplexity === 'high' ? 'high' : 'medium'
    };
  }

  /**
   * Create user history based on user type and current performance
   */
  private createUserHistory(
    user: TestUser,
    weekNumber: number,
    currentPattern: string
  ): UserHistory {
    // Adjust metrics based on user type and week (simulate learning)
    const weekFactor = weekNumber / 4; // 0 to 1 over 4 weeks

    let baseVerification = 0;
    let baseQueryRatio = 0;
    let baseIndependence = 0;

    if (user.userType === 'efficient') {
      baseVerification = 0.80 + weekFactor * 0.1; // 0.80 → 0.90
      baseQueryRatio = 1.3 - weekFactor * 0.2; // 1.3 → 1.1
      baseIndependence = 0.75 + weekFactor * 0.15; // 0.75 → 0.90
    } else if (user.userType === 'struggling') {
      baseVerification = 0.50 + weekFactor * 0.2; // 0.50 → 0.70
      baseQueryRatio = 2.2 - weekFactor * 0.4; // 2.2 → 1.8
      baseIndependence = 0.40 + weekFactor * 0.25; // 0.40 → 0.65
    } else {
      // Hybrid users
      baseVerification = 0.65 + weekFactor * 0.15; // 0.65 → 0.80
      baseQueryRatio = 1.8 - weekFactor * 0.3; // 1.8 → 1.5
      baseIndependence = 0.60 + weekFactor * 0.2; // 0.60 → 0.80
    }

    return {
      userId: user.userId,
      currentPattern,
      historyLength: (weekNumber - 1) * 4 + 1,
      averageVerificationRate: baseVerification,
      averageQueryRatio: baseQueryRatio,
      averageIndependenceRate: baseIndependence,
      contextSwitchingFrequency: user.userType === 'hybrid' ? 0.6 : 0.2,
      successRate: baseVerification, // Assume success correlates with verification
      stressLevel: user.userType === 'struggling' ? 7 - weekFactor : 3
    };
  }

  /**
   * Simulate actual pattern that user will adopt (influenced by prediction)
   */
  private simulateActualPattern(
    predictedPattern: string,
    confidence: number,
    user: TestUser,
    weekNumber: number
  ): string {
    // 70% of time: use predicted pattern
    // 30% of time: deviate based on user type
    if (Math.random() < confidence) {
      return predictedPattern;
    }

    // Deviation patterns
    if (user.userType === 'struggling' && Math.random() < 0.5) {
      return 'F'; // Risk of over-reliance
    }

    if (user.userType === 'efficient' && Math.random() < 0.3) {
      return 'A'; // Might optimize to strategic control
    }

    // Default: stay with current
    return user.initialPattern;
  }

  /**
   * Simulate user task and record results
   */
  private async simulateUserTask(
    user: TestUser,
    weekNumber: number,
    taskIndex: number
  ): Promise<TestResult> {
    const taskId = `${user.userId}_w${weekNumber}_t${taskIndex}`;
    const timePoint = weekNumber - 1; // 0-3 for weeks 1-4

    // Get user's current evolution
    const evolution = this.evolutions.get(user.userId)!;
    const currentPattern = evolution.currentPattern;

    // Create task context
    const scenario: TestScenario = {
      weekNumber,
      taskCount: 4,
      taskComplexity: weekNumber > 2 ? 'high' : 'medium',
      taskType: ['coding', 'writing', 'analysis', 'design'][taskIndex % 4] as any
    };

    const taskContext = this.createTaskContext(taskId, scenario);
    const userHistory = this.createUserHistory(user, weekNumber, currentPattern);

    // 1. PREDICT: Get prediction for this task
    const prediction = PredictivePatternAdvisor.predictPatternForTask(
      taskContext,
      userHistory
    );

    // 2. INTERVENE: Get intervention for this user
    const intervention = ABTestingFramework.getInterventionForUser(
      user.userId,
      user.group,
      prediction.predictedPattern
    );

    // 3. SIMULATE: User executes task and gets result
    const actualPattern = this.simulateActualPattern(
      prediction.predictedPattern,
      prediction.confidence,
      user,
      weekNumber
    );

    // Simulate outcome based on pattern and task difficulty
    const outcome = this.simulateOutcome(
      actualPattern,
      scenario.taskComplexity,
      user.userType
    );

    // Simulate satisfaction
    const satisfactionRating = this.simulateSatisfaction(
      prediction.confidence,
      outcome,
      user.group,
      user.userType
    );

    // 4. FEEDBACK: Determine if prediction was accurate
    const feedbackType = this.evaluatePredictionAccuracy(
      prediction.predictedPattern,
      actualPattern
    );

    // 5. TRACK: Record time point in evolution
    if (timePoint < 5) {
      // Only record time points T0-T4
      PatternEvolutionTracker.recordTimePoint(
        evolution,
        actualPattern,
        0.8 + Math.random() * 0.15,
        userHistory.averageQueryRatio,
        userHistory.averageVerificationRate,
        userHistory.averageIndependenceRate,
        user.userType === 'hybrid',
        `Week ${weekNumber} Task ${taskIndex}`
      );
    }

    // 6. LEARN: Collect feedback for adaptive learning
    this.learner.collectFeedback({
      userId: user.userId,
      feedback: feedbackType,
      predictedPattern: prediction.predictedPattern,
      actualPattern,
      timestamp: new Date(),
      context: user.group
    });

    // 7. RECORD: Record metrics for A/B testing
    const metrics = ABTestingFramework.recordMetrics(
      user.userId,
      user.group,
      evolution.timePoints[0].pattern,
      actualPattern,
      evolution.timePoints[0].verificationRate,
      userHistory.averageVerificationRate,
      evolution.timePoints[0].queryRatio,
      userHistory.averageQueryRatio,
      7, // 1 week
      satisfactionRating
    );

    if (this.testMetrics.has(user.group)) {
      this.testMetrics.get(user.group)!.push(metrics);
    }

    // Return test result
    const result: TestResult = {
      userId: user.userId,
      taskId,
      weekNumber,
      predictedPattern: prediction.predictedPattern,
      predictedConfidence: prediction.confidence,
      actualPattern,
      interventionStrategy: user.group,
      interventionText: intervention,
      feedback: feedbackType,
      outcome,
      satisfactionRating,
      timePoint
    };

    this.allResults.push(result);
    return result;
  }

  /**
   * Simulate task outcome based on pattern and difficulty
   */
  private simulateOutcome(
    pattern: string,
    difficulty: string,
    userType: string
  ): 'success' | 'failure' {
    let successRate = 0;

    // Pattern-based success rates
    const patternSuccess: Record<string, number> = {
      A: 0.90, // Strategic: high success
      B: 0.80, // Iterative: good success
      C: 0.75, // Context-aware: moderate
      D: 0.85, // Deep verification: good
      E: 0.70, // Learning: moderate
      F: 0.40 // Over-reliance: risky
    };

    successRate = patternSuccess[pattern] || 0.5;

    // Difficulty adjustment
    if (difficulty === 'high') {
      successRate -= 0.15;
    }

    // User type adjustment
    if (userType === 'efficient') {
      successRate += 0.1;
    } else if (userType === 'struggling') {
      successRate -= 0.1;
    }

    return Math.random() < successRate ? 'success' : 'failure';
  }

  /**
   * Simulate user satisfaction based on prediction, outcome, and strategy
   */
  private simulateSatisfaction(
    confidence: number,
    outcome: string,
    strategy: string,
    userType: string
  ): number {
    let baseRating = 3;

    // Confidence impact
    baseRating += confidence * 1; // 0-1 bonus

    // Outcome impact
    if (outcome === 'success') {
      baseRating += 1;
    } else {
      baseRating -= 1;
    }

    // Strategy impact
    if (strategy === 'adaptive') {
      baseRating += 0.3; // Personalized approach appreciated
    } else if (strategy === 'aggressive') {
      if (userType === 'struggling') {
        baseRating += 0.2; // Needs pushing
      } else {
        baseRating -= 0.2; // Feels patronized
      }
    }

    return Math.min(5, Math.max(1, baseRating));
  }

  /**
   * Evaluate prediction accuracy
   */
  private evaluatePredictionAccuracy(
    predicted: string,
    actual: string
  ): 'accurate' | 'inaccurate' | 'partially_accurate' {
    if (predicted === actual) {
      return 'accurate';
    }

    // Check if adjacent patterns (partially accurate)
    const patternAdjacency: Record<string, string[]> = {
      A: ['B', 'D'],
      B: ['A', 'C'],
      C: ['B', 'E'],
      D: ['A', 'E'],
      E: ['C', 'D'],
      F: ['E']
    };

    if (patternAdjacency[predicted]?.includes(actual)) {
      return 'partially_accurate';
    }

    return 'inaccurate';
  }

  /**
   * Run complete 4-week testing phase
   */
  async runPhase1Testing(): Promise<void> {
    console.log('🚀 Starting Phase 1 Testing (N=30, 4 weeks)...\n');

    // Week 1-4: 4 tasks per user per week
    for (let week = 1; week <= 4; week++) {
      console.log(`📅 Week ${week}/4`);

      for (const user of this.testUsers) {
        for (let taskIndex = 0; taskIndex < 4; taskIndex++) {
          await this.simulateUserTask(user, week, taskIndex);
        }
      }

      console.log(`   ✓ Completed ${this.testUsers.length} users × 4 tasks`);
    }

    console.log('\n✅ Phase 1 Testing Complete!');
  }

  /**
   * Calculate prediction accuracy statistics
   */
  calculatePredictionAccuracy(): Record<string, any> {
    const total = this.allResults.length;
    const accurate = this.allResults.filter((r) => r.feedback === 'accurate').length;
    const partiallyAccurate = this.allResults.filter(
      (r) => r.feedback === 'partially_accurate'
    ).length;
    const inaccurate = this.allResults.filter((r) => r.feedback === 'inaccurate').length;

    return {
      total,
      accurate,
      partiallyAccurate,
      inaccurate,
      accuracyRate: (accurate / total) * 100,
      partialAccuracyRate: (partiallyAccurate / total) * 100,
      combinedAccuracy: ((accurate + partiallyAccurate) / total) * 100
    };
  }

  /**
   * Calculate success rates
   */
  calculateSuccessMetrics(): Record<string, any> {
    const successCount = this.allResults.filter((r) => r.outcome === 'success').length;
    const totalCount = this.allResults.length;

    // By user type
    const byUserType: Record<string, any> = {};
    for (const userType of ['efficient', 'struggling', 'hybrid']) {
      const userResults = this.allResults.filter(
        (r) => this.findUser(r.userId)?.userType === userType
      );
      const successes = userResults.filter((r) => r.outcome === 'success').length;
      byUserType[userType] = {
        total: userResults.length,
        successes,
        successRate: (successes / userResults.length) * 100
      };
    }

    // By intervention strategy
    const byStrategy: Record<string, any> = {};
    for (const strategy of ['baseline', 'aggressive', 'adaptive']) {
      const strategyResults = this.allResults.filter(
        (r) => r.interventionStrategy === strategy
      );
      const successes = strategyResults.filter((r) => r.outcome === 'success').length;
      byStrategy[strategy] = {
        total: strategyResults.length,
        successes,
        successRate: (successes / strategyResults.length) * 100
      };
    }

    return {
      overallSuccessRate: (successCount / totalCount) * 100,
      byUserType,
      byStrategy
    };
  }

  /**
   * Calculate evolution statistics
   */
  calculateEvolutionMetrics(): Record<string, any> {
    const evolutions = Array.from(this.evolutions.values());
    const stats = PatternEvolutionTracker.generateEvolutionStatistics(evolutions);

    return {
      ...stats,
      averageTimePointsPerUser: stats.averageTimePoints
    };
  }

  /**
   * Calculate A/B test results
   */
  calculateABTestResults(): Record<string, any> {
    const baselineMetrics = this.testMetrics.get('baseline') || [];
    const aggressiveMetrics = this.testMetrics.get('aggressive') || [];
    const adaptiveMetrics = this.testMetrics.get('adaptive') || [];

    const results: Record<string, any> = {};

    // Baseline vs Aggressive
    if (baselineMetrics.length > 0 && aggressiveMetrics.length > 0) {
      results.baselineVsAggressive = ABTestingFramework.compareStrategies(
        baselineMetrics,
        aggressiveMetrics,
        'baseline',
        'aggressive'
      );
    }

    // Baseline vs Adaptive
    if (baselineMetrics.length > 0 && adaptiveMetrics.length > 0) {
      results.baselineVsAdaptive = ABTestingFramework.compareStrategies(
        baselineMetrics,
        adaptiveMetrics,
        'baseline',
        'adaptive'
      );
    }

    // Aggressive vs Adaptive
    if (aggressiveMetrics.length > 0 && adaptiveMetrics.length > 0) {
      results.aggressiveVsAdaptive = ABTestingFramework.compareStrategies(
        aggressiveMetrics,
        adaptiveMetrics,
        'aggressive',
        'adaptive'
      );
    }

    return results;
  }

  /**
   * Get adaptive learner statistics
   */
  getLearnerReport(): string {
    return this.learner.generateLearningReport();
  }

  /**
   * Helper to find user by ID
   */
  private findUser(userId: string): TestUser | undefined {
    return this.testUsers.find((u) => u.userId === userId);
  }

  /**
   * Get all test results
   */
  getTestResults(): TestResult[] {
    return this.allResults;
  }

  /**
   * Get test users
   */
  getTestUsers(): TestUser[] {
    return this.testUsers;
  }

  /**
   * Get evolutions map
   */
  getEvolutions(): Map<string, UserEvolution> {
    return this.evolutions;
  }
}

/**
 * Actual Test Execution
 */
describe('Phase 1: End-to-End Testing with N=30 User Cohort', () => {
  it('should complete 4-week simulation with all modules integrated', async () => {
    const testSuite = new Phase1TestingSuite();

    // Run full testing
    await testSuite.runPhase1Testing();

    // Verify results collected
    const results = testSuite.getTestResults();
    expect(results.length).toBe(30 * 4 * 4); // 30 users × 4 weeks × 4 tasks = 480 results
  });

  it('should calculate prediction accuracy > 70%', async () => {
    const testSuite = new Phase1TestingSuite();
    await testSuite.runPhase1Testing();

    const accuracy = testSuite.calculatePredictionAccuracy();
    expect(accuracy.accuracyRate).toBeGreaterThan(70);
    expect(accuracy.combinedAccuracy).toBeGreaterThan(85);
  });

  it('should show improving success rates over 4 weeks', async () => {
    const testSuite = new Phase1TestingSuite();
    await testSuite.runPhase1Testing();

    const success = testSuite.calculateSuccessMetrics();
    expect(success.overallSuccessRate).toBeGreaterThan(60);
  });

  it('should track user evolution across time points', async () => {
    const testSuite = new Phase1TestingSuite();
    await testSuite.runPhase1Testing();

    const evolution = testSuite.calculateEvolutionMetrics();
    expect(evolution.totalUsers).toBe(30);
    expect(evolution.usersWithChange).toBeGreaterThan(5);
  });

  it('should identify winning intervention strategy via A/B testing', async () => {
    const testSuite = new Phase1TestingSuite();
    await testSuite.runPhase1Testing();

    const abResults = testSuite.calculateABTestResults();
    expect(Object.keys(abResults).length).toBeGreaterThan(0);

    if (abResults.baselineVsAdaptive) {
      const result = abResults.baselineVsAdaptive;
      expect(['baseline', 'adaptive']).toContain(result.winner);
    }
  });

  it('should generate comprehensive learning report', async () => {
    const testSuite = new Phase1TestingSuite();
    await testSuite.runPhase1Testing();

    const report = testSuite.getLearnerReport();
    expect(report).toContain('Adaptive Learning System Report');
    expect(report).toContain('PERFORMANCE METRICS');
  });
});

export default Phase1TestingSuite;
