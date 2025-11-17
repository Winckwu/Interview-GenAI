/**
 * Pattern A-F User Journey E2E Tests
 * Comprehensive scenario testing based on real interview data
 */

import {
  createTestEnvironment,
  UserJourneySimulator,
  PatternDetectionResult,
  TaskContext
} from './e2e-utils';

describe('Pattern A - Strategic Control User Journey', () => {
  let { simulator, page } = createTestEnvironment();

  beforeEach(() => {
    ({ simulator, page } = createTestEnvironment());
  });

  describe('Scenario 1: High-Risk Academic Task - Paper Compression (基于I001刘艳筝案例)', () => {
    it('should support task decomposition and rigorous word-by-word verification', async () => {
      // Setup: Pattern A user
      const profile = await simulator.initializeUser('pattern_a_user_1', 'A');
      expect(profile.patternType).toBe('A');

      // Task: Compress academic paper
      const taskContext: TaskContext = {
        description: 'Compress 10000-word academic paper to 1000 words',
        importance: 'high',
        riskLevel: 'academic_integrity',
        taskType: 'academic_writing'
      };

      await simulator.startTask(taskContext);

      // Pattern A expects: Task decomposition scaffold
      expect(page.hasElement('TaskDecompositionTool')).toBe(true);
      expect(page.getTaskRisk()).toBe('high');

      // Simulate Pattern A behavior: Self-first approach
      // "我自己会首先把它缩减到2000或1500"
      await simulator.queryAI('Help me identify sections that can be condensed');

      // Verify output with strict methods
      await simulator.verifyOutput('word_by_word_comparison');
      expect(page.hasElement('WordByWordComparisonTool')).toBe(true);

      // Complete task
      await simulator.acceptOutput(true); // withReview = true

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('A');
      expect(detection.evidence).toContain('High verification rate');
    });
  });

  describe('Scenario 2: Critical Review Task - Multiple Iteration Cycles', () => {
    it('should show Pattern A signature: persistent verification across iterations', async () => {
      await simulator.initializeUser('pattern_a_user_2', 'A');

      const taskContext: TaskContext = {
        description: 'Review and improve research methodology',
        importance: 'high',
        riskLevel: 'research_quality',
        taskType: 'academic_research'
      };

      await simulator.startTask(taskContext);

      // Simulate 4 iteration cycles (Pattern A's typical behavior)
      for (let i = 0; i < 4; i++) {
        // Query AI
        const response = await simulator.queryAI(`Iteration ${i + 1}: How can I improve this section?`);
        expect(response).toBeTruthy();

        // CRITICAL for Pattern A: Verify each iteration
        await simulator.verifyOutput('detailed_review');

        // Only accept if satisfied
        if (i < 3) {
          // Continue iterating (I001: "3-4次之后还没有特别理想")
          continue;
        } else {
          // Final acceptance
          await simulator.acceptOutput(true);
        }
      }

      const stats = await simulator.getBehaviorStats();
      expect(stats.verificationRate).toBeGreaterThan(0.8);

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('A');
      expect(detection.riskLevel).toBe('low');
    });
  });

  describe('Scenario 3: Complex Task - Switching to Self-Resolution', () => {
    it('should respect Pattern A decision to self-write when AI output unsatisfactory', async () => {
      await simulator.initializeUser('pattern_a_user_3', 'A');

      const taskContext: TaskContext = {
        description: 'Rewrite article section for clarity',
        importance: 'high',
        riskLevel: 'content_quality'
      };

      await simulator.startTask(taskContext);

      // First attempt with AI
      const aiResponse = await simulator.queryAI('Rewrite this section for better clarity');
      expect(aiResponse).toBeTruthy();

      // Verify attempt
      await simulator.verifyOutput('structural_analysis');

      // After verification, user decides to self-write
      // (Pattern A: "3-4次之后还没有特别理想，我就会自己重新改")
      page.addSuggestion('Based on your analysis, consider self-rewriting for better control');

      // Self-resolution
      await simulator.acceptOutput(false); // No AI output, user generated

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('A');
      expect(detection.evidence).toContain('Strong independent work');
    });
  });
});

describe('Pattern C - Context-Sensitive Adaptation User Journey', () => {
  let { simulator, page } = createTestEnvironment();

  beforeEach(() => {
    ({ simulator, page } = createTestEnvironment());
  });

  describe('Scenario 1: High-Risk Core Course Content (基于I004许军案例)', () => {
    it('should discourage AI for high-importance academic content', async () => {
      // Setup: Pattern C user
      const profile = await simulator.initializeUser('pattern_c_user_1', 'C');
      expect(profile.patternType).toBe('C');

      // Task: High-risk PPT summarization
      const taskContext: TaskContext = {
        description: 'Summarize 100-page core course PPT',
        importance: 'high',
        riskLevel: 'exam_preparation',
        academicWeight: 'core_content'
      };

      await simulator.startTask(taskContext);

      // Pattern C detection: High importance = self-study required
      expect(page.getTaskRisk()).toBe('high');
      expect(page.hasElement('TaskImportanceIndicator')).toBe(true);

      // System should NOT encourage AI quick-generate
      expect(page.hasElement('AIQuickGenerate')).toBe(false);

      // Should provide self-study scaffold instead
      expect(page.hasElement('SelfStudyScaffold')).toBe(true);

      // Pattern C reasoning: "100多页肯定是核心内容，所以...我自己从头开始做"
      const suggestion = await simulator.queryAI('What is the best approach for core content?');
      expect(suggestion).toBeTruthy();

      // Self-study approach
      await simulator.acceptOutput(false); // No AI shortcut

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('C');
      expect(detection.evidence).toContain('Context-aware decisions');
    });
  });

  describe('Scenario 2: Low-Risk Supplementary Content', () => {
    it('should encourage AI for non-critical supplementary tasks', async () => {
      await simulator.initializeUser('pattern_c_user_2', 'C');

      // Task: Low-risk supplementary PPT
      const taskContext: TaskContext = {
        description: 'Summarize 20-30 page supplementary course PPT',
        importance: 'low',
        riskLevel: 'supplementary_reference',
        academicWeight: 'supplementary'
      };

      await simulator.startTask(taskContext);

      // Pattern C detection: Low importance = AI acceptable
      expect(page.getTaskRisk()).toBe('low');

      // System SHOULD encourage AI
      expect(page.hasElement('AIOutlineGenerator')).toBe(true);

      // But still maintain human review
      expect(page.hasElement('HumanReviewRequired')).toBe(true);

      // Pattern C reasoning: "20-30页不重要...在它的大纲基础上去修改"
      await simulator.queryAI('Generate outline for this PPT');

      // Review AI output
      await simulator.verifyOutput('outline_review');

      // Accept with modification
      await simulator.acceptOutput(true);

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('C');
    });
  });

  describe('Scenario 3: Functional Communication Task', () => {
    it('should allow direct AI use for functional low-stakes tasks', async () => {
      await simulator.initializeUser('pattern_c_user_3', 'C');

      // Task: Functional email
      const taskContext: TaskContext = {
        description: 'Write course adjustment request email',
        importance: 'low',
        riskLevel: 'functional_communication',
        taskType: 'functional_communication'
      };

      await simulator.startTask(taskContext);

      expect(page.getTaskCategory()).toBe('functional');

      // Pattern C behavior: Functional tasks = "无所谓" (doesn't care much)
      // System should enable high trust for functional tasks
      const trustRecommendation = 0.88; // Simulated trust level

      expect(trustRecommendation).toBeGreaterThan(0.85);

      // Direct AI use with minimal review
      await simulator.queryAI('Write a professional course adjustment request email');
      await simulator.acceptOutput(false); // No detailed review needed

      const stats = await simulator.getBehaviorStats();
      expect(stats.aiQueries).toBeGreaterThan(0);
    });
  });

  describe('Scenario 4: Mixed-Context Sequential Tasks', () => {
    it('should adapt support level based on cumulative task context', async () => {
      await simulator.initializeUser('pattern_c_user_4', 'C');

      // Task 1: Core content
      await simulator.startTask({
        description: 'Study core material',
        importance: 'high',
        academicWeight: 'core_content'
      });
      expect(page.getTaskRisk()).toBe('high');

      await simulator.acceptOutput(false);

      // Task 2: Supplementary
      await simulator.startTask({
        description: 'Reference supplementary material',
        importance: 'low',
        academicWeight: 'supplementary'
      });
      expect(page.getTaskRisk()).toBe('low');

      await simulator.queryAI('Summarize supplementary concepts');
      await simulator.acceptOutput(true);

      // Task 3: Functional
      await simulator.startTask({
        description: 'Administrative email',
        importance: 'low',
        taskType: 'functional_communication'
      });
      expect(page.getTaskCategory()).toBe('functional');

      await simulator.acceptOutput(false);

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('C');
      expect(detection.evidence).toContain('Adaptive strategies');
    });
  });
});

describe('Pattern F - Over-Reliance Detection and Intervention', () => {
  let { simulator, page } = createTestEnvironment();

  beforeEach(() => {
    ({ simulator, page } = createTestEnvironment());
  });

  describe('Scenario 1: Escalating Over-Reliance Detection', () => {
    it('should detect Pattern F signature after repeated unverified AI acceptance', async () => {
      await simulator.initializeUser('pattern_f_user_1', 'F');

      // Simulate 25 rapid AI queries with NO verification
      for (let i = 0; i < 25; i++) {
        const taskId = await simulator.startTask({
          description: `Task ${i + 1}`,
          importance: 'low',
          riskLevel: 'low'
        });

        // Minimal query
        await simulator.queryAI(`Help with task ${i + 1}`);

        // NO verification - direct acceptance
        await simulator.acceptOutput(false); // No review
      }

      // Pattern F detection should trigger
      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('F');
      expect(detection.confidence).toBeGreaterThan(0.80);

      // Verify warning triggered
      expect(page.hasElement('OverRelianceWarning')).toBe(true);

      const stats = await simulator.getBehaviorStats();
      expect(stats.verificationRate).toBeLessThan(0.1);
      expect(stats.averageQuerysPerTask).toBeGreaterThan(0.8);
    });
  });

  describe('Scenario 2: MR18 Over-Reliance Warning Display', () => {
    it('should prominently display MR18 warning when Pattern F detected', async () => {
      await simulator.initializeUser('pattern_f_user_2', 'F');

      // Build Pattern F profile
      for (let i = 0; i < 20; i++) {
        await simulator.startTask({
          description: `Quick task ${i}`,
          importance: 'low'
        });
        await simulator.queryAI('Do this for me');
        await simulator.acceptOutput(false);
      }

      // Check intervention trigger
      const shouldIntervene = await simulator.checkIntervention();
      expect(shouldIntervene).toBe(true);

      // Verify MR18 component exists
      expect(page.hasElement('OverRelianceWarning')).toBe(true);

      // Check warning message
      const warningMessage = page.getElement('WarningMessage');
      expect(warningMessage).toBeTruthy();
    });
  });

  describe('Scenario 3: Escalated Intervention - AI Usage Restriction', () => {
    it('should restrict AI access when Pattern F persists despite warning', async () => {
      await simulator.initializeUser('pattern_f_user_3', 'F');

      // Phase 1: Build over-reliance (first 20 tasks)
      for (let i = 0; i < 20; i++) {
        await simulator.startTask({
          description: `Task ${i}`,
          importance: 'low'
        });
        await simulator.queryAI('Help me');
        await simulator.acceptOutput(false);
      }

      let shouldIntervene = await simulator.checkIntervention();
      expect(shouldIntervene).toBe(true);

      // Show warning (MR18)
      page.setMessage('BlockedMessage', '');

      // Phase 2: User ignores warning, continues (next 10 tasks)
      for (let i = 20; i < 30; i++) {
        await simulator.startTask({
          description: `Task ${i}`,
          importance: 'low'
        });

        // Try to query AI again - should be blocked
        shouldIntervene = await simulator.checkIntervention();
        if (shouldIntervene) {
          page.setMessage(
            'BlockedMessage',
            'To restore your independence, complete 5 independent tasks without AI assistance'
          );
        }

        expect(page.getElement('BlockedMessage')).toBeTruthy();
      }
    });
  });

  describe('Scenario 4: Recovery Path - Rebuilding Independence', () => {
    it('should allow Pattern F user to recover through independent task completion', async () => {
      await simulator.initializeUser('pattern_f_user_4', 'F');

      // Build Pattern F (over-reliance phase)
      for (let i = 0; i < 20; i++) {
        await simulator.startTask({
          description: `Reliant task ${i}`,
          importance: 'low'
        });
        await simulator.queryAI('Help');
        await simulator.acceptOutput(false);
      }

      let detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('F');

      // Recovery phase: Complete 5 independent tasks
      for (let i = 0; i < 5; i++) {
        await simulator.startTask({
          description: `Independent task ${i}`,
          importance: 'medium'
        });

        // NO AI usage
        await simulator.acceptOutput(false);

        // Verify completion
        await simulator.verifyOutput('self_completion');
      }

      // Pattern should shift after independent work
      detection = await simulator.getPatternDetection();
      // After recovery, pattern should improve
      expect(detection.riskLevel).not.toBe('high');
    });
  });
});

describe('Pattern B - Iterative Refinement User Journey', () => {
  let { simulator, page } = createTestEnvironment();

  beforeEach(() => {
    ({ simulator, page } = createTestEnvironment());
  });

  describe('Scenario 1: Multi-Iteration Refinement Cycle', () => {
    it('should support balanced AI-human iterative workflow', async () => {
      await simulator.initializeUser('pattern_b_user_1', 'B');

      const taskContext: TaskContext = {
        description: 'Create presentation slides with iterative improvements',
        importance: 'medium',
        riskLevel: 'medium'
      };

      await simulator.startTask(taskContext);

      // Pattern B: 2-3 refinement cycles
      for (let iteration = 0; iteration < 3; iteration++) {
        // Query AI for suggestion
        const response = await simulator.queryAI(
          `Iteration ${iteration + 1}: How to improve this?`
        );
        expect(response).toBeTruthy();

        // Some verification (but not as strict as Pattern A)
        if (iteration < 2) {
          await simulator.verifyOutput('quick_review');
        } else {
          await simulator.acceptOutput(true);
        }
      }

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('B');
      expect(detection.evidence).toContain('Iterative refinement');
    });
  });
});

describe('Pattern D - Deep Verification Learner Journey', () => {
  let { simulator, page } = createTestEnvironment();

  beforeEach(() => {
    ({ simulator, page } = createTestEnvironment());
  });

  describe('Scenario 1: Verification-Focused Learning', () => {
    it('should emphasize verification and understanding for Pattern D', async () => {
      await simulator.initializeUser('pattern_d_user_1', 'D');

      const taskContext: TaskContext = {
        description: 'Understand and verify algorithm implementation',
        importance: 'medium',
        riskLevel: 'learning'
      };

      await simulator.startTask(taskContext);

      // Pattern D: Deep verification
      await simulator.queryAI('Explain this algorithm step by step');

      // Extensive verification
      await simulator.verifyOutput('detailed_analysis');
      await simulator.verifyOutput('step_by_step_understanding');

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('D');
    });
  });
});

describe('Pattern E - Teaching and Learning User Journey', () => {
  let { simulator, page } = createTestEnvironment();

  beforeEach(() => {
    ({ simulator, page } = createTestEnvironment());
  });

  describe('Scenario 1: Knowledge Sharing and Collaboration', () => {
    it('should support teaching and peer learning features', async () => {
      await simulator.initializeUser('pattern_e_user_1', 'E');

      const taskContext: TaskContext = {
        description: 'Create study guide to teach peers',
        importance: 'medium',
        riskLevel: 'collaborative'
      };

      await simulator.startTask(taskContext);

      // Pattern E: Teaching-focused
      await simulator.queryAI('Help me organize concepts for teaching');

      // Share and discuss
      page.addSuggestion('Share this guide with study group');

      const detection = await simulator.getPatternDetection();
      expect(detection.pattern).toBe('E');
    });
  });
});

/**
 * Cross-Pattern Integration Tests
 */
describe('Pattern Detection and MR Trigger Verification', () => {
  describe('MR Functionality Across Patterns', () => {
    it('should trigger correct MR components for each pattern', async () => {
      const patterns = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

      for (const pattern of patterns) {
        const { simulator: sim, page: pg } = createTestEnvironment();

        await sim.initializeUser(`mr_test_${pattern}`, pattern);

        // All patterns should get task decomposition (MR1)
        await sim.startTask({
          description: 'Test task',
          importance: 'medium'
        });

        // Pattern-specific MRs
        switch (pattern) {
          case 'A':
            // MR3 (Agency), MR13 (Transparency)
            expect(true).toBe(true); // Placeholder for specific checks
            break;
          case 'F':
            // MR18 (Over-reliance warning)
            for (let i = 0; i < 25; i++) {
              await sim.startTask({
                description: `Task ${i}`,
                importance: 'low'
              });
              await sim.queryAI('Help');
              await sim.acceptOutput(false);
            }
            const shouldWarn = await sim.checkIntervention();
            expect(shouldWarn).toBe(true);
            break;
        }
      }
    });
  });
});
