/**
 * Training Data Extraction Tool
 *
 * Based on 08-Training-Data-Extraction-Guide.md
 * Extracts metacognitive features from interview transcripts
 * for ML model training
 *
 * Process:
 * 1. Read interview transcripts
 * 2. Apply 12-subprocess coding rules
 * 3. Calculate 12-dimensional ML features
 * 4. Output training data CSV
 */

import fs from 'fs';
import path from 'path';

// ============================================================
// Type Definitions
// ============================================================

export type EvidenceStrength = 0 | 1 | 2 | 3;
export type PatternType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type ConfidenceLevel = 'high' | 'moderate' | 'low';

/**
 * 12 Metacognitive Subprocesses Scores
 * Based on evidence strength coding (0-3)
 */
export interface SubprocessScores {
  // Planning (4 subprocesses)
  p1_task_decomposition: EvidenceStrength;
  p2_goal_setting: EvidenceStrength;
  p3_strategy_selection: EvidenceStrength;
  p4_role_definition: EvidenceStrength;

  // Monitoring (3 subprocesses)
  m1_progress_tracking: EvidenceStrength;
  m2_quality_checking: EvidenceStrength;
  m3_trust_calibration: EvidenceStrength;

  // Evaluation (3 subprocesses)
  e1_output_quality_assessment: EvidenceStrength;
  e2_risk_assessment: EvidenceStrength;
  e3_capability_judgment: EvidenceStrength;

  // Regulation (2 subprocesses)
  r1_strategy_adjustment: EvidenceStrength;
  r2_tool_switching: EvidenceStrength;
}

/**
 * 12-dimensional ML features
 * Derived from subprocess scores
 */
export interface MLFeatures {
  // Direct mappings
  taskDecompositionScore: number; // P1: 0-3
  promptSpecificity: number; // P2+P3: 0-10
  strategyDiversity: number; // P3+R2: 0-3
  independentAttemptRate: number; // P4+E3: 0-1

  sessionDurationPattern: number; // M1: 0-1
  verificationRate: number; // M2: 0-1 (CORE!)
  trustCalibrationAccuracy: number; // M3: 0-1

  modificationRate: number; // M2+E1: 0-1
  confidenceScore: number; // E2: 0-1
  errorAwareness: number; // E3: 0-1

  iterationFrequency: number; // R1: 0-1 (CORE!)
  crossModelUsage: number; // R2: 0-3
}

export interface TrainingDataPoint {
  user_id: string;
  pattern: PatternType;
  subprocess_scores: SubprocessScores;
  ml_features: MLFeatures;
  total_score: number; // Sum of all subprocess scores (0-36)
  confidence: ConfidenceLevel;
  notes: string;
  metadata: {
    interview_date?: string;
    duration_minutes?: number;
    language: 'en' | 'zh' | 'mixed';
    discipline?: string;
    role?: string;
  };
}

// ============================================================
// Coding Rules and Evidence Criteria
// ============================================================

/**
 * Evidence criteria for each subprocess
 * Based on coding manual from 08-Training-Data-Extraction-Guide.md
 */
export const CODING_CRITERIA = {
  P1: {
    name: 'Task Decomposition',
    strong: [
      'explicitly lists sub-tasks',
      'draws flowcharts/mind maps',
      'uses project management tools',
      'explains rationale for decomposition',
    ],
    moderate: ['splits tasks but not detailed', 'mentions breaking down'],
    weak: ['aware but rarely does', 'knows should decompose'],
    none: ['never decomposes', 'random approach'],
    keywords: ['分解', '拆分', '子任务', 'breakdown', 'split', 'subtask', 'decompose', '大纲', 'outline'],
  },

  P2: {
    name: 'Goal Setting',
    strong: [
      'SMART goals',
      'clear success criteria',
      'measurable objectives',
      'specific deadlines',
    ],
    moderate: ['vague goals', 'general direction'],
    weak: ['minimal goals', 'just exploring'],
    none: ['no goals mentioned', 'random browsing'],
    keywords: ['目标', '标准', 'goal', 'objective', 'criterion', 'success', '完成', 'complete'],
  },

  P3: {
    name: 'Strategy Selection',
    strong: [
      'compares different methods',
      'explains tool choice',
      'task-adaptive strategies',
      'multiple AI models',
    ],
    moderate: ['uses one main tool, occasional others'],
    weak: ['single tool only'],
    none: ['unaware of alternatives'],
    keywords: ['策略', '方法', '工具', 'strategy', 'method', 'tool', 'model', 'approach', 'GPT', 'Claude'],
  },

  P4: {
    name: 'Role Definition',
    strong: [
      'clear AI vs human boundaries',
      'has forbidden zones',
      'maintains final decision',
      'explicit rules',
    ],
    moderate: ['rough boundaries', 'not formalized'],
    weak: ['never thought about it'],
    none: ['AI does everything'],
    keywords: ['边界', '规则', '我负责', 'boundary', 'rule', 'I do', 'AI does', 'responsibility', '不能'],
  },

  M1: {
    name: 'Progress Tracking',
    strong: [
      'uses checklists/progress bars',
      'time management',
      'milestone checking',
    ],
    moderate: ['informal tracking', 'mental notes'],
    weak: ['minimal awareness'],
    none: ['no tracking'],
    keywords: ['进度', '完成', 'progress', 'checklist', 'milestone', 'track', '剩余'],
  },

  M2: {
    name: 'Quality Checking',
    strong: [
      'systematic verification',
      'tests AI output',
      'cross-checks facts',
      'always verifies',
    ],
    moderate: ['occasional verification', 'depends on task'],
    weak: ['aware but rarely does'],
    none: ['never verifies', 'trusts blindly'],
    keywords: ['验证', '检查', '测试', 'verify', 'check', 'test', 'validate', '对不对', 'correct'],
  },

  M3: {
    name: 'Trust Calibration',
    strong: [
      'task-specific trust levels',
      'dynamic adjustment',
      'historical learning',
    ],
    moderate: ['some awareness', 'inconsistent'],
    weak: ['fixed trust level'],
    none: ['never calibrates'],
    keywords: ['信任', '可靠', 'trust', 'reliable', 'confidence', '准确', 'accuracy', '相信'],
  },

  E1: {
    name: 'Output Quality Assessment',
    strong: [
      'comprehensive evaluation',
      'compares to standards',
      'peer review',
    ],
    moderate: ['basic evaluation'],
    weak: ['superficial check'],
    none: ['no evaluation'],
    keywords: ['质量', '评估', 'quality', 'assess', 'evaluate', '好不好', 'good enough'],
  },

  E2: {
    name: 'Risk Assessment',
    strong: [
      'identifies potential errors',
      'considers consequences',
      'risk-aware decisions',
    ],
    moderate: ['some risk awareness'],
    weak: ['minimal risk thinking'],
    none: ['no risk consideration'],
    keywords: ['风险', '错误', '后果', 'risk', 'error', 'consequence', '如果错了', 'what if'],
  },

  E3: {
    name: 'Capability Judgment',
    strong: [
      'self-assessment',
      'independent attempts',
      'baseline comparison',
      'knows own limits',
    ],
    moderate: ['rough self-awareness'],
    weak: ['minimal self-assessment'],
    none: ['no self-reflection'],
    keywords: ['能力', '自己能', 'capability', 'I can', 'my skill', '不会', 'cannot', '先试试'],
  },

  R1: {
    name: 'Strategy Adjustment',
    strong: [
      'iterative refinement',
      'learns from feedback',
      'systematic adjustment',
    ],
    moderate: ['some iteration', 'random trial'],
    weak: ['minimal adjustment'],
    none: ['gives up if fails once'],
    keywords: ['调整', '改进', '迭代', 'adjust', 'refine', 'iterate', 'improve', '再试', '换个'],
  },

  R2: {
    name: 'Tool Switching',
    strong: [
      'cross-model comparison',
      'downgrades to traditional',
      'combined approaches',
    ],
    moderate: ['occasional switching'],
    weak: ['mostly one tool'],
    none: ['single tool only'],
    keywords: ['切换', '换', '试试', 'switch', 'change', 'try', 'different', 'Google', 'Claude', 'GPT'],
  },
};

// ============================================================
// ML Feature Calculation
// ============================================================

/**
 * Calculate 12-dimensional ML features from subprocess scores
 * Based on mapping rules from 08-Training-Data-Extraction-Guide.md
 */
export function calculateMLFeatures(scores: SubprocessScores): MLFeatures {
  // Direct mappings (1:1)
  const taskDecompositionScore = scores.p1_task_decomposition; // 0-3

  // Composite mappings
  const promptSpecificity =
    ((scores.p2_goal_setting + scores.p3_strategy_selection) / 6) * 10; // 0-10 scale

  const strategyDiversity =
    (scores.p3_strategy_selection + scores.r2_tool_switching) / 2; // 0-3

  const independentAttemptRate =
    (scores.p4_role_definition + scores.e3_capability_judgment) / 6; // 0-1

  const sessionDurationPattern = scores.m1_progress_tracking / 3; // 0-1

  const verificationRate = scores.m2_quality_checking / 3; // 0-1 (CORE!)

  const trustCalibrationAccuracy = scores.m3_trust_calibration / 3; // 0-1

  const modificationRate =
    (scores.m2_quality_checking + scores.e1_output_quality_assessment) / 6; // 0-1

  const confidenceScore = scores.e2_risk_assessment / 3; // 0-1

  const errorAwareness = scores.e3_capability_judgment / 3; // 0-1

  const iterationFrequency = scores.r1_strategy_adjustment / 3; // 0-1 (CORE!)

  const crossModelUsage = scores.r2_tool_switching; // 0-3

  return {
    taskDecompositionScore,
    promptSpecificity,
    strategyDiversity,
    independentAttemptRate,
    sessionDurationPattern,
    verificationRate,
    trustCalibrationAccuracy,
    modificationRate,
    confidenceScore,
    errorAwareness,
    iterationFrequency,
    crossModelUsage,
  };
}

/**
 * Calculate total metacognitive score (sum of all 12 subprocess scores)
 * Range: 0-36
 */
export function calculateTotalScore(scores: SubprocessScores): number {
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
}

/**
 * Determine pattern based on subprocess scores
 * Based on clustering analysis from 08-Training-Data-Extraction-Guide.md
 */
export function determinePattern(
  scores: SubprocessScores,
  totalScore: number
): { pattern: PatternType; confidence: ConfidenceLevel } {
  const { p1, p2, p4, m2, e3, r1, r2, m3 } = {
    p1: scores.p1_task_decomposition,
    p2: scores.p2_goal_setting,
    p4: scores.p4_role_definition,
    m2: scores.m2_quality_checking,
    e3: scores.e3_capability_judgment,
    r1: scores.r1_strategy_adjustment,
    r2: scores.r2_tool_switching,
    m3: scores.m3_trust_calibration,
  };

  // Pattern F: Ineffective/Passive (total_score < 15)
  if (totalScore < 15) {
    const redFlags = [
      m2 === 0, // No verification
      r1 === 0, // No iteration
      e3 === 0, // No self-assessment
      p1 === 0, // No planning
    ].filter(Boolean).length;

    return {
      pattern: 'F',
      confidence: redFlags >= 3 ? 'high' : 'moderate',
    };
  }

  // Pattern A: Strategic Decomposition & Control
  // High P1, P4, M2, E3
  if (p1 >= 2 && p4 >= 2 && m2 >= 2 && e3 >= 2) {
    return {
      pattern: 'A',
      confidence: totalScore >= 28 ? 'high' : 'moderate',
    };
  }

  // Pattern B: Iterative Optimization
  // High R1, R2
  if (r1 >= 2 && r2 >= 2) {
    return {
      pattern: 'B',
      confidence: totalScore >= 25 ? 'high' : 'moderate',
    };
  }

  // Pattern D: Deep Verification
  // High M2, very high verification behavior
  if (m2 === 3 && scores.e1_output_quality_assessment >= 2) {
    return {
      pattern: 'D',
      confidence: 'high',
    };
  }

  // Pattern C: Context-Sensitive
  // High M3 (trust calibration) + high R2 (tool switching)
  if (m3 >= 2 && r2 >= 2 && scores.p3_strategy_selection >= 2) {
    return {
      pattern: 'C',
      confidence: totalScore >= 28 ? 'high' : 'moderate',
    };
  }

  // Pattern E: Learning-Oriented
  // High E-scores + reflection
  if (
    scores.e1_output_quality_assessment >= 2 &&
    e3 >= 2 &&
    scores.e2_risk_assessment >= 2
  ) {
    return {
      pattern: 'E',
      confidence: 'moderate',
    };
  }

  // Default to closest pattern
  // If high planning: A
  // If high regulation: B
  // Otherwise: C (most adaptive)
  if (p1 + p4 >= 4) {
    return { pattern: 'A', confidence: 'low' };
  }
  if (r1 + r2 >= 4) {
    return { pattern: 'B', confidence: 'low' };
  }

  return { pattern: 'C', confidence: 'low' };
}

// ============================================================
// Transcript Reading and Parsing
// ============================================================

/**
 * Read transcript file
 */
export function readTranscript(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading transcript ${filePath}:`, error);
    return '';
  }
}

/**
 * Parse VTT format (for Zoom transcripts)
 */
export function parseVTT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip WEBVTT header, timestamps, and empty lines
    if (
      !line.startsWith('WEBVTT') &&
      !line.match(/^\d{2}:\d{2}:\d{2}/) &&
      !line.match(/^\d+$/) &&
      line.length > 0
    ) {
      textLines.push(line);
    }
  }

  return textLines.join('\n');
}

/**
 * Simple keyword-based coding assistant
 * This is a HELPER tool - manual review is still required
 */
export function assistCoding(transcriptText: string): Partial<SubprocessScores> {
  const text = transcriptText.toLowerCase();
  const scores: Partial<SubprocessScores> = {};

  // Count keyword matches for each subprocess
  Object.entries(CODING_CRITERIA).forEach(([subprocess, criteria]) => {
    const keywordMatches = criteria.keywords.filter(keyword =>
      text.includes(keyword.toLowerCase())
    ).length;

    // Very rough heuristic - REQUIRES MANUAL REVIEW
    let score: EvidenceStrength = 0;
    if (keywordMatches >= 10) score = 3;
    else if (keywordMatches >= 5) score = 2;
    else if (keywordMatches >= 2) score = 1;

    const key = `${subprocess.toLowerCase()}_${criteria.name
      .toLowerCase()
      .replace(/ /g, '_')}` as keyof SubprocessScores;

    scores[key] = score;
  });

  return scores;
}

// ============================================================
// CSV Output Generation
// ============================================================

/**
 * Convert training data points to CSV format
 */
export function generateCSV(data: TrainingDataPoint[]): string {
  const headers = [
    'user_id',
    'pattern',
    'p1',
    'p2',
    'p3',
    'p4',
    'm1',
    'm2',
    'm3',
    'e1',
    'e2',
    'e3',
    'r1',
    'r2',
    'total_score',
    'confidence',
    'notes',
  ];

  const rows = data.map(point => {
    const s = point.subprocess_scores;
    return [
      point.user_id,
      point.pattern,
      s.p1_task_decomposition,
      s.p2_goal_setting,
      s.p3_strategy_selection,
      s.p4_role_definition,
      s.m1_progress_tracking,
      s.m2_quality_checking,
      s.m3_trust_calibration,
      s.e1_output_quality_assessment,
      s.e2_risk_assessment,
      s.e3_capability_judgment,
      s.r1_strategy_adjustment,
      s.r2_tool_switching,
      point.total_score,
      point.confidence,
      `"${point.notes}"`, // Quote notes field
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Save training data to CSV file
 */
export function saveCSV(data: TrainingDataPoint[], outputPath: string): void {
  const csv = generateCSV(data);
  fs.writeFileSync(outputPath, csv, 'utf-8');
  console.log(`✅ Training data saved to ${outputPath}`);
  console.log(`   Total samples: ${data.length}`);

  // Print pattern distribution
  const distribution: Record<string, number> = {};
  data.forEach(point => {
    distribution[point.pattern] = (distribution[point.pattern] || 0) + 1;
  });

  console.log('\n📊 Pattern Distribution:');
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      console.log(`   Pattern ${pattern}: ${count} samples (${Math.round((count / data.length) * 100)}%)`);
    });
}

// ============================================================
// Main Extraction Function
// ============================================================

/**
 * Extract training data from transcript directory
 *
 * NOTE: This is a SEMI-AUTOMATED tool
 * - Keyword matching provides initial suggestions
 * - Human coder must review and adjust all scores
 * - Follow the coding manual strictly
 * - Use this to speed up the process, not replace judgment
 */
export function extractTrainingData(
  transcriptDir: string,
  outputPath: string
): void {
  console.log('🔬 Training Data Extraction Tool');
  console.log('Based on 08-Training-Data-Extraction-Guide.md\n');

  // List of transcript files
  const transcriptFiles = [
    '受访人录音转文字1-15.txt',
    '受访人录音转文字16-25.txt',
    '受访人语音转文字26-33.txt',
    '受访人录音转文字34-42.txt',
    '43-GMT20251015-094409_Recording.transcript.vtt',
    '44-GMT20251022-085638_Recording.transcript.vtt',
    '45-Ganesh M 15 October audio1962495788.txt',
    '46-Ng Chen Kian 21 October audio1912572062.txt',
    '47-Leticia Ramirez 28 October audio1676479019.txt',
    '48-Tze Shuo Koay 27 October audio1968322064.txt',
    '49-Wee Chen Xian 24 October audio1098084502.txt',
  ];

  const trainingData: TrainingDataPoint[] = [];

  console.log('⚠️  IMPORTANT: This tool provides SUGGESTIONS only.');
  console.log('   All scores must be manually reviewed by trained coders.\n');

  for (const filename of transcriptFiles) {
    const filePath = path.join(transcriptDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
      continue;
    }

    console.log(`📄 Processing: ${filename}`);

    let content = readTranscript(filePath);

    // Parse VTT if needed
    if (filename.endsWith('.vtt')) {
      content = parseVTT(content);
    }

    // Get suggested scores (REQUIRES MANUAL REVIEW!)
    const suggestedScores = assistCoding(content) as SubprocessScores;

    // Fill in missing scores with 0
    const completeScores: SubprocessScores = {
      p1_task_decomposition: suggestedScores.p1_task_decomposition || 0,
      p2_goal_setting: suggestedScores.p2_goal_setting || 0,
      p3_strategy_selection: suggestedScores.p3_strategy_selection || 0,
      p4_role_definition: suggestedScores.p4_role_definition || 0,
      m1_progress_tracking: suggestedScores.m1_progress_tracking || 0,
      m2_quality_checking: suggestedScores.m2_quality_checking || 0,
      m3_trust_calibration: suggestedScores.m3_trust_calibration || 0,
      e1_output_quality_assessment: suggestedScores.e1_output_quality_assessment || 0,
      e2_risk_assessment: suggestedScores.e2_risk_assessment || 0,
      e3_capability_judgment: suggestedScores.e3_capability_judgment || 0,
      r1_strategy_adjustment: suggestedScores.r1_strategy_adjustment || 0,
      r2_tool_switching: suggestedScores.r2_tool_switching || 0,
    };

    const totalScore = calculateTotalScore(completeScores);
    const { pattern, confidence } = determinePattern(completeScores, totalScore);
    const mlFeatures = calculateMLFeatures(completeScores);

    // Extract user ID from filename
    const userId = filename.match(/\d+/)?.[0] || filename.split('.')[0];

    const dataPoint: TrainingDataPoint = {
      user_id: `I${userId.padStart(3, '0')}`,
      pattern,
      subprocess_scores: completeScores,
      ml_features: mlFeatures,
      total_score: totalScore,
      confidence,
      notes: `Auto-coded from ${filename} - REQUIRES MANUAL REVIEW`,
      metadata: {
        language: filename.includes('Ganesh') || filename.includes('Ng') ? 'en' : 'zh',
      },
    };

    trainingData.push(dataPoint);

    console.log(`   → Pattern ${pattern} (confidence: ${confidence}, score: ${totalScore}/36)`);
  }

  // Save to CSV
  saveCSV(trainingData, outputPath);

  console.log('\n✅ Extraction complete!');
  console.log('\n⚠️  NEXT STEPS:');
  console.log('   1. Open the CSV file');
  console.log('   2. Read each transcript carefully');
  console.log('   3. Adjust scores based on coding manual');
  console.log('   4. Add detailed notes for each case');
  console.log('   5. Calculate inter-rater reliability');
}

// ============================================================
// Export
// ============================================================

export default {
  extractTrainingData,
  calculateMLFeatures,
  calculateTotalScore,
  determinePattern,
  readTranscript,
  parseVTT,
  assistCoding,
  generateCSV,
  saveCSV,
};
