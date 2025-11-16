/**
 * Test Suite for Training Data Extraction
 */

import {
  calculateMLFeatures,
  calculateTotalScore,
  determinePattern,
  parseVTT,
  assistCoding,
  generateCSV,
  SubprocessScores,
  TrainingDataPoint,
  type EvidenceStrength,
} from './extractTrainingData';

describe('Training Data Extraction', () => {
  // ============================================================
  // Test Case 1: ML Feature Calculation
  // ============================================================

  describe('ML Feature Calculation', () => {
    it('should calculate correct ML features from subprocess scores', () => {
      const scores: SubprocessScores = {
        p1_task_decomposition: 3,
        p2_goal_setting: 3,
        p3_strategy_selection: 2,
        p4_role_definition: 3,
        m1_progress_tracking: 2,
        m2_quality_checking: 3,
        m3_trust_calibration: 2,
        e1_output_quality_assessment: 2,
        e2_risk_assessment: 2,
        e3_capability_judgment: 3,
        r1_strategy_adjustment: 2,
        r2_tool_switching: 2,
      };

      const mlFeatures = calculateMLFeatures(scores);

      // Direct mappings
      expect(mlFeatures.taskDecompositionScore).toBe(3);
      expect(mlFeatures.verificationRate).toBeCloseTo(1.0); // 3/3
      expect(mlFeatures.iterationFrequency).toBeCloseTo(0.67, 2); // 2/3
      expect(mlFeatures.crossModelUsage).toBe(2);

      // Composite mappings
      expect(mlFeatures.promptSpecificity).toBeCloseTo(8.33, 2); // ((3+2)/6)*10
      expect(mlFeatures.strategyDiversity).toBe(2); // (2+2)/2
      expect(mlFeatures.independentAttemptRate).toBe(1.0); // (3+3)/6
    });
  });

  // ============================================================
  // Test Case 2: Total Score Calculation
  // ============================================================

  describe('Total Score Calculation', () => {
    it('should sum all subprocess scores correctly', () => {
      const scores: SubprocessScores = {
        p1_task_decomposition: 3,
        p2_goal_setting: 3,
        p3_strategy_selection: 2,
        p4_role_definition: 3,
        m1_progress_tracking: 2,
        m2_quality_checking: 3,
        m3_trust_calibration: 2,
        e1_output_quality_assessment: 2,
        e2_risk_assessment: 2,
        e3_capability_judgment: 3,
        r1_strategy_adjustment: 2,
        r2_tool_switching: 2,
      };

      const total = calculateTotalScore(scores);
      expect(total).toBe(29);
    });

    it('should handle zero scores', () => {
      const scores: SubprocessScores = {
        p1_task_decomposition: 0,
        p2_goal_setting: 0,
        p3_strategy_selection: 0,
        p4_role_definition: 0,
        m1_progress_tracking: 0,
        m2_quality_checking: 0,
        m3_trust_calibration: 0,
        e1_output_quality_assessment: 0,
        e2_risk_assessment: 0,
        e3_capability_judgment: 0,
        r1_strategy_adjustment: 0,
        r2_tool_switching: 0,
      };

      const total = calculateTotalScore(scores);
      expect(total).toBe(0);
    });
  });

  // ============================================================
  // Test Case 3: Pattern Determination
  // ============================================================

  describe('Pattern Determination', () => {
    it('should identify Pattern A (Strategic Decomposition)', () => {
      const scores: SubprocessScores = {
        p1_task_decomposition: 3,
        p2_goal_setting: 3,
        p3_strategy_selection: 2,
        p4_role_definition: 3,
        m1_progress_tracking: 2,
        m2_quality_checking: 3,
        m3_trust_calibration: 2,
        e1_output_quality_assessment: 2,
        e2_risk_assessment: 2,
        e3_capability_judgment: 3,
        r1_strategy_adjustment: 2,
        r2_tool_switching: 2,
      };

      const totalScore = calculateTotalScore(scores);
      const { pattern, confidence } = determinePattern(scores, totalScore);

      expect(pattern).toBe('A');
      expect(confidence).toBe('high'); // Total score 29 >= 28
    });

    it('should identify Pattern B (Iterative Optimization)', () => {
      const scores: SubprocessScores = {
        p1_task_decomposition: 2,
        p2_goal_setting: 2,
        p3_strategy_selection: 2,
        p4_role_definition: 1,
        m1_progress_tracking: 2,
        m2_quality_checking: 2,
        m3_trust_calibration: 2,
        e1_output_quality_assessment: 2,
        e2_risk_assessment: 2,
        e3_capability_judgment: 2,
        r1_strategy_adjustment: 3, // High iteration
        r2_tool_switching: 3, // High tool switching
      };

      const totalScore = calculateTotalScore(scores);
      const { pattern, confidence } = determinePattern(scores, totalScore);

      expect(pattern).toBe('B');
      expect(confidence).toBe('high'); // Total score 25
    });

    it('should identify Pattern F (Ineffective/Passive)', () => {
      const scores: SubprocessScores = {
        p1_task_decomposition: 0,
        p2_goal_setting: 1,
        p3_strategy_selection: 1,
        p4_role_definition: 0,
        m1_progress_tracking: 0,
        m2_quality_checking: 0, // No verification
        m3_trust_calibration: 0,
        e1_output_quality_assessment: 0,
        e2_risk_assessment: 0,
        e3_capability_judgment: 0, // No self-assessment
        r1_strategy_adjustment: 0, // No iteration
        r2_tool_switching: 1,
      };

      const totalScore = calculateTotalScore(scores);
      const { pattern, confidence } = determinePattern(scores, totalScore);

      expect(pattern).toBe('F');
      expect(totalScore).toBeLessThan(15);
      expect(confidence).toMatch(/high|moderate/);
    });

    it('should identify Pattern D (Deep Verification)', () => {
      const scores: SubprocessScores = {
        p1_task_decomposition: 2,
        p2_goal_setting: 2,
        p3_strategy_selection: 2,
        p4_role_definition: 2,
        m1_progress_tracking: 2,
        m2_quality_checking: 3, // Very high verification
        m3_trust_calibration: 2,
        e1_output_quality_assessment: 3, // High quality assessment
        e2_risk_assessment: 2,
        e3_capability_judgment: 2,
        r1_strategy_adjustment: 2,
        r2_tool_switching: 2,
      };

      const totalScore = calculateTotalScore(scores);
      const { pattern, confidence } = determinePattern(scores, totalScore);

      expect(pattern).toBe('D');
      expect(confidence).toBe('high');
    });
  });

  // ============================================================
  // Test Case 4: VTT Parsing
  // ============================================================

  describe('VTT Parsing', () => {
    it('should parse VTT format correctly', () => {
      const vttContent = `WEBVTT

1
00:00:01.000 --> 00:00:05.000
Hello, I will demonstrate my workflow.

2
00:00:05.000 --> 00:00:10.000
First, I decompose the task into smaller parts.

3
00:00:10.000 --> 00:00:15.000
Then I verify the AI output carefully.`;

      const parsed = parseVTT(vttContent);

      expect(parsed).toContain('Hello, I will demonstrate my workflow.');
      expect(parsed).toContain('First, I decompose the task into smaller parts.');
      expect(parsed).toContain('Then I verify the AI output carefully.');
      expect(parsed).not.toContain('WEBVTT');
      expect(parsed).not.toContain('00:00:01.000');
    });
  });

  // ============================================================
  // Test Case 5: Keyword-based Coding Assistant
  // ============================================================

  describe('Coding Assistant', () => {
    it('should detect task decomposition keywords', () => {
      const transcript = `
        I always decompose my tasks into smaller subtasks.
        First I break down the problem and create an outline.
        Then I split each section into manageable pieces.
      `;

      const scores = assistCoding(transcript);

      expect(scores.p1_task_decomposition).toBeGreaterThan(0);
    });

    it('should detect verification keywords', () => {
      const transcript = `
        I always verify the AI output.
        I check if the answer is correct.
        I test the code and validate the results.
      `;

      const scores = assistCoding(transcript);

      expect(scores.m2_quality_checking).toBeGreaterThan(0);
    });

    it('should detect iteration keywords', () => {
      const transcript = `
        If it doesn't work, I adjust my approach.
        I iterate and refine my prompts.
        I keep improving until I get the right result.
      `;

      const scores = assistCoding(transcript);

      expect(scores.r1_strategy_adjustment).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Test Case 6: CSV Generation
  // ============================================================

  describe('CSV Generation', () => {
    it('should generate correct CSV format', () => {
      const data: TrainingDataPoint[] = [
        {
          user_id: 'I001',
          pattern: 'A',
          subprocess_scores: {
            p1_task_decomposition: 3,
            p2_goal_setting: 3,
            p3_strategy_selection: 2,
            p4_role_definition: 3,
            m1_progress_tracking: 2,
            m2_quality_checking: 3,
            m3_trust_calibration: 2,
            e1_output_quality_assessment: 2,
            e2_risk_assessment: 2,
            e3_capability_judgment: 3,
            r1_strategy_adjustment: 2,
            r2_tool_switching: 2,
          },
          ml_features: {} as any,
          total_score: 29,
          confidence: 'high',
          notes: 'Typical Pattern A user',
          metadata: {
            language: 'en',
          },
        },
      ];

      const csv = generateCSV(data);

      expect(csv).toContain('user_id,pattern,p1,p2,p3,p4,m1,m2,m3,e1,e2,e3,r1,r2,total_score,confidence,notes');
      expect(csv).toContain('I001,A,3,3,2,3,2,3,2,2,2,3,2,2,29,high,"Typical Pattern A user"');
    });

    it('should handle multiple data points', () => {
      const data: TrainingDataPoint[] = [
        {
          user_id: 'I001',
          pattern: 'A',
          subprocess_scores: {
            p1_task_decomposition: 3,
            p2_goal_setting: 2,
            p3_strategy_selection: 2,
            p4_role_definition: 3,
            m1_progress_tracking: 2,
            m2_quality_checking: 3,
            m3_trust_calibration: 2,
            e1_output_quality_assessment: 2,
            e2_risk_assessment: 2,
            e3_capability_judgment: 3,
            r1_strategy_adjustment: 2,
            r2_tool_switching: 2,
          },
          ml_features: {} as any,
          total_score: 28,
          confidence: 'high',
          notes: 'Pattern A',
          metadata: { language: 'en' },
        },
        {
          user_id: 'I002',
          pattern: 'B',
          subprocess_scores: {
            p1_task_decomposition: 2,
            p2_goal_setting: 2,
            p3_strategy_selection: 2,
            p4_role_definition: 1,
            m1_progress_tracking: 2,
            m2_quality_checking: 2,
            m3_trust_calibration: 2,
            e1_output_quality_assessment: 2,
            e2_risk_assessment: 2,
            e3_capability_judgment: 2,
            r1_strategy_adjustment: 3,
            r2_tool_switching: 3,
          },
          ml_features: {} as any,
          total_score: 25,
          confidence: 'high',
          notes: 'Pattern B',
          metadata: { language: 'zh' },
        },
      ];

      const csv = generateCSV(data);
      const lines = csv.split('\n');

      expect(lines.length).toBe(3); // header + 2 data rows
      expect(lines[1]).toContain('I001,A');
      expect(lines[2]).toContain('I002,B');
    });
  });
});
