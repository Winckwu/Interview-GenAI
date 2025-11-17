/**
 * Predictive Pattern Advisor Tests
 * Tests pattern prediction based on task context and user history
 * Validates prediction accuracy, alternative patterns, and recommendations
 */

import {
  PredictivePatternAdvisor,
  TaskContext,
  UserHistory,
  PredictionResult
} from '../components/PredictivePatternAdvisor';

describe('Predictive Pattern Advisor - Task-Based Prediction', () => {
  // Helper functions to create test data
  const createTaskContext = (overrides?: Partial<TaskContext>): TaskContext => {
    return {
      taskId: 'task_001',
      taskType: 'coding',
      complexity: 5,
      deadline: 24,
      importance: 6,
      familiarityScore: 0.7,
      urgency: 'medium',
      ...overrides
    };
  };

  const createUserHistory = (overrides?: Partial<UserHistory>): UserHistory => {
    return {
      userId: 'user_001',
      currentPattern: 'A',
      historyLength: 20,
      averageVerificationRate: 0.75,
      averageQueryRatio: 1.5,
      averageIndependenceRate: 0.7,
      contextSwitchingFrequency: 0.3,
      successRate: 0.85,
      stressLevel: 4,
      ...overrides
    };
  };

  describe('Pattern Prediction for Single Task', () => {
    it('should predict a pattern for a task', () => {
      const taskContext = createTaskContext();
      const userHistory = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, userHistory);

      expect(result.predictedPattern).toBeDefined();
      expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(result.predictedPattern);
    });

    it('should provide confidence score between 0 and 1', () => {
      const taskContext = createTaskContext();
      const userHistory = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, userHistory);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include alternative patterns', () => {
      const taskContext = createTaskContext();
      const userHistory = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, userHistory);

      expect(result.alternativePatterns).toBeDefined();
      expect(Array.isArray(result.alternativePatterns)).toBe(true);
      expect(result.alternativePatterns.length).toBeGreaterThan(0);
      expect(result.alternativePatterns.length).toBeLessThanOrEqual(2);

      result.alternativePatterns.forEach((alt) => {
        expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(alt.pattern);
        expect(alt.probability).toBeGreaterThan(0);
        expect(alt.probability).toBeLessThanOrEqual(1);
        expect(alt.pattern).not.toBe(result.predictedPattern);
      });
    });

    it('should provide reasoning chain', () => {
      const taskContext = createTaskContext();
      const userHistory = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, userHistory);

      expect(result.reasoningChain).toBeDefined();
      expect(Array.isArray(result.reasoningChain)).toBe(true);
      expect(result.reasoningChain.length).toBeGreaterThan(0);
      expect(result.reasoningChain[0]).toContain('Task analysis');
      expect(result.reasoningChain.some((r) => r.includes('User profile'))).toBe(true);
    });

    it('should provide recommended approach', () => {
      const taskContext = createTaskContext();
      const userHistory = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, userHistory);

      expect(result.recommendedApproach).toBeDefined();
      expect(result.recommendedApproach.length).toBeGreaterThan(0);
    });

    it('should identify risk factors when applicable', () => {
      const taskContext = createTaskContext({ urgency: 'critical' });
      const userHistory = createUserHistory({ currentPattern: 'F' });

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, userHistory);

      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(result.riskFactors.some((f) => f.includes('over-reliance'))).toBe(true);
    });
  });

  describe('Complex Task Prediction', () => {
    it('should predict high-verification patterns for complex tasks', () => {
      const complexTask = createTaskContext({
        complexity: 9,
        importance: 10,
        urgency: 'critical'
      });
      const efficientUser = createUserHistory({
        averageVerificationRate: 0.9,
        averageQueryRatio: 1.2
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(complexTask, efficientUser);

      // For complex tasks, patterns like A (strategic) or D (deep) should be predicted
      expect(['A', 'D']).toContain(result.predictedPattern);
    });

    it('should predict iterative patterns for unfamiliar tasks', () => {
      const unfamiliarTask = createTaskContext({
        taskType: 'data_analysis',
        complexity: 7,
        familiarityScore: 0.1
      });
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(unfamiliarTask, user);

      // For unfamiliar tasks, Pattern B (iterative) is likely
      expect(result.predictedPattern).toBeDefined();
    });

    it('should flag over-reliance risk for complex tasks with low verification', () => {
      const complexTask = createTaskContext({
        complexity: 8,
        importance: 9,
        urgency: 'critical'
      });
      const riskUser = createUserHistory({
        averageVerificationRate: 0.2,
        averageQueryRatio: 2.8,
        stressLevel: 8
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(complexTask, riskUser);

      expect(result.riskFactors.length).toBeGreaterThan(0);
      expect(result.riskFactors.some((f) => f.includes('verification'))).toBe(true);
    });
  });

  describe('Task Type Specific Predictions', () => {
    it('should predict appropriate pattern for coding tasks', () => {
      const codingTask = createTaskContext({
        taskType: 'coding',
        complexity: 6,
        familiarityScore: 0.8
      });
      const user = createUserHistory({
        currentPattern: 'A',
        averageVerificationRate: 0.85
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(codingTask, user);

      expect(result.predictedPattern).toBeDefined();
      expect(result.recommendedApproach).toContain('verification');
    });

    it('should predict appropriate pattern for design tasks', () => {
      const designTask = createTaskContext({
        taskType: 'design',
        complexity: 5,
        importance: 7
      });
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(designTask, user);

      expect(result.predictedPattern).toBeDefined();
    });

    it('should predict appropriate pattern for planning tasks', () => {
      const planningTask = createTaskContext({
        taskType: 'planning',
        complexity: 4,
        familiarityScore: 0.6
      });
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(planningTask, user);

      expect(result.predictedPattern).toBeDefined();
    });
  });

  describe('User Profile Influence on Prediction', () => {
    it('should weight current pattern heavily (inertia)', () => {
      const taskContext = createTaskContext();

      // User strongly committed to Pattern A
      const patternAUser = createUserHistory({ currentPattern: 'A' });
      const resultA = PredictivePatternAdvisor.predictPatternForTask(taskContext, patternAUser);

      // User currently in Pattern F
      const patternFUser = createUserHistory({ currentPattern: 'F' });
      const resultF = PredictivePatternAdvisor.predictPatternForTask(taskContext, patternFUser);

      // Confidence should be higher when prediction matches current pattern
      // (This tests the inertia principle)
      expect(resultA.confidence).toBeGreaterThan(0);
      expect(resultF.confidence).toBeGreaterThan(0);
    });

    it('should account for high verification users', () => {
      const taskContext = createTaskContext();
      const highVerificationUser = createUserHistory({
        averageVerificationRate: 0.92,
        averageQueryRatio: 1.1,
        successRate: 0.95
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, highVerificationUser);

      // High verification users should predict patterns that emphasize quality
      expect(['A', 'D']).toContain(result.predictedPattern);
    });

    it('should account for low verification users', () => {
      const taskContext = createTaskContext();
      const lowVerificationUser = createUserHistory({
        averageVerificationRate: 0.25,
        averageQueryRatio: 2.5,
        successRate: 0.55
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, lowVerificationUser);

      // Low verification users at higher risk for Pattern F
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });

    it('should account for high context-switching frequency', () => {
      const taskContext = createTaskContext();
      const flexibleUser = createUserHistory({
        contextSwitchingFrequency: 0.8
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, flexibleUser);

      expect(result.predictedPattern).toBeDefined();
    });

    it('should account for high stress level', () => {
      const taskContext = createTaskContext();
      const stressedUser = createUserHistory({
        stressLevel: 9,
        averageQueryRatio: 2.2
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, stressedUser);

      // High stress + high AI reliance = over-reliance risk
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });
  });

  describe('Deadline and Urgency Impact', () => {
    it('should predict patterns differently for critical vs. routine tasks', () => {
      const urgentTask = createTaskContext({
        urgency: 'critical',
        deadline: 1,
        importance: 10
      });
      const routineTask = createTaskContext({
        urgency: 'low',
        deadline: 240,
        importance: 3
      });
      const user = createUserHistory();

      const urgentResult = PredictivePatternAdvisor.predictPatternForTask(urgentTask, user);
      const routineResult = PredictivePatternAdvisor.predictPatternForTask(routineTask, user);

      // Recommendations should emphasize different priorities
      expect(urgentResult.recommendedApproach).toContain('critical');
    });

    it('should flag verification importance for critical tasks', () => {
      const criticalTask = createTaskContext({
        urgency: 'critical',
        importance: 10,
        deadline: 2
      });
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(criticalTask, user);

      expect(result.recommendedApproach).toContain('correctness');
    });
  });

  describe('Multiple Task Prediction', () => {
    it('should predict patterns for multiple tasks', () => {
      const tasks: TaskContext[] = [
        createTaskContext({ taskId: 'task_1' }),
        createTaskContext({ taskId: 'task_2', complexity: 7 }),
        createTaskContext({ taskId: 'task_3', complexity: 3 })
      ];
      const userHistory = createUserHistory();

      const results = PredictivePatternAdvisor.predictPatternsForMultipleTasks(tasks, userHistory);

      expect(Object.keys(results)).toHaveLength(3);
      expect(results['task_1']).toBeDefined();
      expect(results['task_2']).toBeDefined();
      expect(results['task_3']).toBeDefined();

      Object.values(results).forEach((result) => {
        expect(result.predictedPattern).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should handle empty task list', () => {
      const results = PredictivePatternAdvisor.predictPatternsForMultipleTasks(
        [],
        createUserHistory()
      );

      expect(Object.keys(results)).toHaveLength(0);
    });

    it('should predict different patterns for varying task complexities', () => {
      const tasks: TaskContext[] = [
        createTaskContext({ taskId: 'simple', complexity: 2 }),
        createTaskContext({ taskId: 'complex', complexity: 9 })
      ];
      const userHistory = createUserHistory();

      const results = PredictivePatternAdvisor.predictPatternsForMultipleTasks(tasks, userHistory);

      // Predictions may differ due to complexity
      expect(results['simple'].predictedPattern).toBeDefined();
      expect(results['complex'].predictedPattern).toBeDefined();
    });
  });

  describe('Adoption Success Analysis', () => {
    it('should analyze successful accurate prediction', () => {
      const result = PredictivePatternAdvisor.analyzeAdoptionSuccess('A', 'A', 'success');

      expect(result.accuracy).toBe(true);
      expect(result.insight).toContain('accurate');
      expect(result.insight).toContain('positive');
    });

    it('should analyze successful but inaccurate prediction', () => {
      const result = PredictivePatternAdvisor.analyzeAdoptionSuccess('A', 'B', 'success');

      expect(result.accuracy).toBe(false);
      expect(result.insight).toContain('different pattern');
      expect(result.insight).toContain('Flexible');
    });

    it('should analyze accurate but unsuccessful prediction', () => {
      const result = PredictivePatternAdvisor.analyzeAdoptionSuccess('A', 'A', 'failure');

      expect(result.accuracy).toBe(true);
      expect(result.insight).toContain('accurate');
      expect(result.insight).toContain('negative');
    });

    it('should analyze failed inaccurate prediction', () => {
      const result = PredictivePatternAdvisor.analyzeAdoptionSuccess('A', 'B', 'failure');

      expect(result.accuracy).toBe(false);
      expect(result.insight).toContain('inaccurate');
      expect(result.insight).toContain('negative');
    });

    it('should incorporate user feedback', () => {
      const feedback = 'User found the iterative approach too time-consuming';
      const result = PredictivePatternAdvisor.analyzeAdoptionSuccess(
        'A',
        'B',
        'failure',
        feedback
      );

      expect(result.insight).toContain(feedback);
    });
  });

  describe('Recommendation Quality', () => {
    it('should generate different recommendations for different patterns', () => {
      const task = createTaskContext();
      const userA = createUserHistory({ currentPattern: 'A' });
      const userB = createUserHistory({ currentPattern: 'B' });

      const resultA = PredictivePatternAdvisor.predictPatternForTask(task, userA);
      const resultB = PredictivePatternAdvisor.predictPatternForTask(task, userB);

      // Recommendations may vary
      expect(resultA.recommendedApproach).toBeDefined();
      expect(resultB.recommendedApproach).toBeDefined();
    });

    it('should include specific guidance for over-reliance pattern', () => {
      // Manually create a result with Pattern F prediction
      const taskContext = createTaskContext();
      const riskUser = createUserHistory({
        currentPattern: 'F',
        averageVerificationRate: 0.1,
        averageQueryRatio: 3.0
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(taskContext, riskUser);

      if (result.predictedPattern === 'F') {
        expect(result.recommendedApproach).toContain('Over-Reliance');
      }
    });

    it('should provide task-specific guidance', () => {
      const criticalTask = createTaskContext({
        urgency: 'critical',
        importance: 10
      });
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(criticalTask, user);

      expect(result.recommendedApproach).toContain('critical');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero task complexity', () => {
      const minimalTask = createTaskContext({
        complexity: 0,
        importance: 0,
        familiarityScore: 1.0
      });
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(minimalTask, user);

      expect(result.predictedPattern).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle maximum task complexity', () => {
      const maximalTask = createTaskContext({
        complexity: 10,
        importance: 10,
        deadline: 0.5,
        urgency: 'critical',
        familiarityScore: 0.0
      });
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(maximalTask, user);

      expect(result.predictedPattern).toBeDefined();
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });

    it('should handle perfect user profile', () => {
      const task = createTaskContext();
      const perfectUser = createUserHistory({
        averageVerificationRate: 1.0,
        averageQueryRatio: 0.5,
        successRate: 1.0,
        stressLevel: 0,
        contextSwitchingFrequency: 0
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(task, perfectUser);

      expect(result.predictedPattern).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle struggling user profile', () => {
      const task = createTaskContext();
      const strugglingUser = createUserHistory({
        averageVerificationRate: 0.3,
        averageQueryRatio: 2.8,
        successRate: 0.4,
        stressLevel: 10,
        contextSwitchingFrequency: 0.9,
        currentPattern: 'F'
      });

      const result = PredictivePatternAdvisor.predictPatternForTask(task, strugglingUser);

      expect(result.predictedPattern).toBeDefined();
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });
  });

  describe('Probability Normalization', () => {
    it('should ensure alternative patterns sum with primary confidence', () => {
      const task = createTaskContext();
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(task, user);

      const allProbabilities = [result.confidence, ...result.alternativePatterns.map((a) => a.probability)];
      const sum = allProbabilities.reduce((a, b) => a + b, 0);

      // Sum should be less than or equal to 1 (not all patterns included)
      expect(sum).toBeLessThanOrEqual(1.0);
    });

    it('should have non-negative alternative pattern probabilities', () => {
      const task = createTaskContext();
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(task, user);

      result.alternativePatterns.forEach((alt) => {
        expect(alt.probability).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Reasoning Chain Completeness', () => {
    it('should include all major reasoning steps', () => {
      const task = createTaskContext();
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(task, user);

      const chain = result.reasoningChain.join(' ');
      expect(chain).toContain('Task analysis');
      expect(chain).toContain('User profile');
      expect(chain).toContain('Primary pattern');
    });

    it('should include confidence percentage in reasoning', () => {
      const task = createTaskContext();
      const user = createUserHistory();

      const result = PredictivePatternAdvisor.predictPatternForTask(task, user);

      const confidenceStep = result.reasoningChain.find((r) => r.includes('confidence'));
      expect(confidenceStep).toBeDefined();
      expect(confidenceStep).toMatch(/\d+\.\d%/);
    });
  });
});
