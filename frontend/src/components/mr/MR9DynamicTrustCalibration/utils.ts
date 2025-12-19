/**
 * MR9: Dynamic Trust Calibration - Utilities
 *
 * THEORETICAL FOUNDATIONS:
 *
 * 1. Adaptive Trust Calibration Framework (Okamura & Yamada, 2020)
 *    - Trust equation: P_trust vs P_auto (actual reliability)
 *    Reference: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0229132
 *
 * 2. LLM Uncertainty Estimation (arxiv:2404.15993, 2024)
 *    - Supervised calibration improves uncertainty estimation
 *    Reference: https://arxiv.org/abs/2404.15993
 *
 * 3. Metacognitive Sensitivity (PMC, 2025)
 *    - Meta-d': How well confidence discriminates correct vs incorrect
 *    Reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC12103939/
 *
 * 4. LLM Benchmark Data (2024)
 *    - Task-specific accuracy from HumanEval, MMLU, etc.
 *    Reference: https://www.vellum.ai/blog/llm-benchmarks-overview-limits-and-model-comparison
 */

export type TaskType = 'coding' | 'writing' | 'analysis' | 'creative' | 'research' | 'design' | 'planning' | 'review';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CriticalityLevel = 'low' | 'medium' | 'high';
export type FamiliarityLevel = 'familiar' | 'moderate' | 'unfamiliar';
export type TimePressureLevel = 'low' | 'medium' | 'high';
export type ModificationType = 'correction' | 'preference' | 'extension' | 'none';

/**
 * Trust calculation factors with theoretical basis
 */
export interface TrustFactors {
  taskTypeFactor: number; // 0-100
  taskTypeBaseScore: number; // 0-100
  criticalityAdjustment: number; // -20 to +5
  aiConfidenceFactor: number; // -15 to +10
  userHistoryFactor: number; // -20 to +20
  calibrationFactor: number; // -5 to +5 (metacognitive alignment)
}

/**
 * Complete trust profile with confidence bounds
 */
export interface TrustProfile {
  score: number; // 0-100, final trust score
  factors: TrustFactors;
  confidence: number; // 0-1, how confident we are in this score
  reasoning: string;
  theoreticalBasis: string; // Citation-backed explanation
}

/**
 * Verification strategy recommendation
 */
export interface VerificationStrategy {
  primaryCheck: string;
  secondaryChecks: string[];
  redFlags: string[];
  estimatedTime: string;
  tools: string[];
}

/**
 * Task type accuracy tracking
 */
export interface TaskTypeAccuracy {
  taskType: TaskType;
  accuracy: number; // 0-1
  samplesValidated: number;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentageChange: number;
  };
}

/**
 * Modification context for intelligent handling
 */
export interface ModificationContext {
  type: ModificationType;
  changeRatio: number; // 0-1
  wasFactualCorrection: boolean;
}

/**
 * Task type metadata with benchmark sources
 *
 * EVIDENCE-BASED VALUES from LLM Benchmarks (2024):
 * - Coding: HumanEval ~92% (Claude 3.5), architectural decisions vary
 * - Writing: Grammar strong, voice/style subjective
 * - Analysis: MMLU ~82-91%, domain-specific
 * - Creative: Highly variable, no standard benchmark
 * - Research: Prone to hallucination (15-30% error rate on facts)
 * - Design: Subjective, accessibility issues common
 * - Planning: Good structure, timeline accuracy varies
 * - Review: Strong pattern matching
 */
const TASK_TYPE_METADATA: Record<TaskType, {
  baseScore: number;
  benchmarkSource: string;
  verifiability: number; // 0-1, how easily can output be checked
  subjectivity: number; // 0-1, how much depends on interpretation
  hallucinationRisk: number; // 0-1, prone to factual errors
}> = {
  'coding': {
    baseScore: 78,
    benchmarkSource: 'HumanEval ~92%, SWE-Bench',
    verifiability: 0.95,
    subjectivity: 0.2,
    hallucinationRisk: 0.1
  },
  'writing': {
    baseScore: 68,
    benchmarkSource: 'MT-Bench, grammar checkers ~95%',
    verifiability: 0.5,
    subjectivity: 0.7,
    hallucinationRisk: 0.2
  },
  'analysis': {
    baseScore: 72,
    benchmarkSource: 'MMLU ~85% average',
    verifiability: 0.7,
    subjectivity: 0.4,
    hallucinationRisk: 0.25
  },
  'creative': {
    baseScore: 55,
    benchmarkSource: 'Human evaluation studies',
    verifiability: 0.2,
    subjectivity: 0.9,
    hallucinationRisk: 0.15
  },
  'research': {
    baseScore: 52,
    benchmarkSource: 'TruthfulQA, fact-checking studies',
    verifiability: 0.8,
    subjectivity: 0.3,
    hallucinationRisk: 0.45
  },
  'design': {
    baseScore: 58,
    benchmarkSource: 'WCAG compliance tests',
    verifiability: 0.6,
    subjectivity: 0.75,
    hallucinationRisk: 0.1
  },
  'planning': {
    baseScore: 70,
    benchmarkSource: 'GAIA benchmark',
    verifiability: 0.65,
    subjectivity: 0.35,
    hallucinationRisk: 0.2
  },
  'review': {
    baseScore: 80,
    benchmarkSource: 'Code review benchmarks',
    verifiability: 0.8,
    subjectivity: 0.3,
    hallucinationRisk: 0.15
  },
};

/**
 * Criticality adjustment with theoretical basis
 *
 * Based on Okamura & Yamada (2020):
 * - Critical tasks showed 25% higher error impact
 * - Recovery cost scaling
 */
const CRITICALITY_ADJUSTMENT: Record<CriticalityLevel, {
  adjustment: number;
  rationale: string;
}> = {
  'low': {
    adjustment: 3,
    rationale: 'Low stakes - light verification acceptable'
  },
  'medium': {
    adjustment: -4,
    rationale: 'Moderate impact - selective verification'
  },
  'high': {
    adjustment: -15,
    rationale: 'High stakes - thorough verification required (Okamura framework)'
  },
};

/**
 * Familiarity adjustment
 *
 * Higher familiarity = user can better spot errors = can trust more
 */
const FAMILIARITY_ADJUSTMENT: Record<FamiliarityLevel, number> = {
  'familiar': 8,     // User knows domain, can verify
  'moderate': 0,     // Neutral
  'unfamiliar': -8,  // User less likely to spot errors
};

/**
 * Time pressure adjustment
 */
const TIME_PRESSURE_ADJUSTMENT: Record<TimePressureLevel, number> = {
  'low': 0,      // Can verify thoroughly
  'medium': -4,  // Limited verification time
  'high': -12,   // Minimal verification possible
};

/**
 * Modification type impact
 *
 * KEY INSIGHT: User modification does NOT necessarily mean AI was wrong
 */
const MODIFICATION_IMPACT: Record<ModificationType, {
  trustAdjustment: number;
  rationale: string;
}> = {
  correction: {
    trustAdjustment: -8,
    rationale: 'Factual/logical correction indicates AI error'
  },
  preference: {
    trustAdjustment: 0,
    rationale: 'Style preference - not an accuracy concern'
  },
  extension: {
    trustAdjustment: 2,
    rationale: 'User building on AI output is positive signal'
  },
  none: {
    trustAdjustment: 0,
    rationale: 'No modification'
  }
};

/**
 * Red flags by task type
 */
const RED_FLAGS_BY_TYPE: Record<TaskType, string[]> = {
  'coding': [
    'Syntax errors in examples',
    'Missing error handling',
    'Potential security vulnerabilities',
    'Performance issues on large inputs',
  ],
  'writing': [
    'Grammatical inconsistencies',
    'Tone changes mid-text',
    'Factual inaccuracies',
    'Plagiarism risks',
  ],
  'analysis': [
    'Missing data sources',
    'Biased interpretations',
    'Correlation vs causation confusion',
    'Cherry-picked data',
  ],
  'creative': [
    'Generic or clichéd content',
    'Inconsistent creative direction',
    'Plagiarism from training data',
    'Lack of originality',
  ],
  'research': [
    'Outdated citations (>2 years)',
    'Missing recent breakthroughs',
    'Incorrect source attribution',
    'Limited source diversity',
  ],
  'design': [
    'Accessibility issues',
    'Inconsistent styling',
    'Poor contrast ratios',
    'Responsive design failures',
  ],
  'planning': [
    'Unrealistic timelines',
    'Missing dependencies',
    'Resource conflicts',
    'Scope creep risks',
  ],
  'review': [
    'Missed obvious errors',
    'Inconsistent feedback',
    'Tone issues',
    'Missing context',
  ],
};

/**
 * Verification strategies by task type
 */
const VERIFICATION_STRATEGIES: Record<TaskType, Omit<VerificationStrategy, 'estimatedTime'>> = {
  'coding': {
    primaryCheck: 'Test the code in your environment',
    secondaryChecks: [
      'Check for edge cases and error handling',
      'Review security implications',
      'Verify performance on realistic data',
    ],
    redFlags: RED_FLAGS_BY_TYPE['coding'],
    tools: ['Compiler/Linter', 'Unit Tests', 'Code Review Tools'],
  },
  'writing': {
    primaryCheck: 'Read aloud for flow and clarity',
    secondaryChecks: [
      'Check for plagiarism',
      'Verify tone consistency',
      'Fact-check claims',
    ],
    redFlags: RED_FLAGS_BY_TYPE['writing'],
    tools: ['Plagiarism Checker', 'Grammar Checker', 'Fact Checker'],
  },
  'analysis': {
    primaryCheck: 'Verify data sources independently',
    secondaryChecks: [
      'Check statistical calculations',
      'Validate assumptions',
      'Cross-reference conclusions',
    ],
    redFlags: RED_FLAGS_BY_TYPE['analysis'],
    tools: ['Data Verification Tools', 'Statistical Software', 'Domain Resources'],
  },
  'creative': {
    primaryCheck: 'Evaluate originality and fit',
    secondaryChecks: [
      'Check for plagiarism',
      'Assess consistency',
      'Test with target audience feedback',
    ],
    redFlags: RED_FLAGS_BY_TYPE['creative'],
    tools: ['Plagiarism Detector', 'Style Analyzer', 'A/B Testing'],
  },
  'research': {
    primaryCheck: 'Verify all citations in original sources',
    secondaryChecks: [
      'Check publication dates',
      'Verify author credentials',
      'Cross-reference with recent surveys',
    ],
    redFlags: RED_FLAGS_BY_TYPE['research'],
    tools: ['Academic Databases', 'Citation Managers', 'Literature Review Tools'],
  },
  'design': {
    primaryCheck: 'Test with actual users/devices',
    secondaryChecks: [
      'Check accessibility (WCAG AA)',
      'Verify responsive design',
      'Validate color contrast',
    ],
    redFlags: RED_FLAGS_BY_TYPE['design'],
    tools: ['Browser Testing', 'Accessibility Checker', 'Device Emulator'],
  },
  'planning': {
    primaryCheck: 'Review timelines and dependencies',
    secondaryChecks: [
      'Identify resource conflicts',
      'Check for missing steps',
      'Validate with stakeholders',
    ],
    redFlags: RED_FLAGS_BY_TYPE['planning'],
    tools: ['Gantt Charts', 'Dependency Analyzer', 'Resource Planner'],
  },
  'review': {
    primaryCheck: 'Compare against criteria or standards',
    secondaryChecks: [
      'Check for missed issues',
      'Verify completeness',
      'Validate consistency',
    ],
    redFlags: RED_FLAGS_BY_TYPE['review'],
    tools: ['Checklist Tools', 'Comparison Tools', 'Documentation'],
  },
};

// Calibration history storage (in-memory, would persist to backend in production)
let calibrationHistory: Array<{
  predicted: number;
  actual: boolean;
  timestamp: Date;
}> = [];

/**
 * Main function: Calculate trust score based on task context
 *
 * FORMULA (based on Bayesian trust update framework):
 * TrustScore = BaselineScore
 *   + CriticalityAdjustment (risk-weighted)
 *   + FamiliarityAdjustment (user ability to verify)
 *   + AIConfidenceAdjustment (model uncertainty)
 *   + HistoryAdjustment (empirical accuracy)
 *   + CalibrationAdjustment (metacognitive alignment)
 */
export function calculateTrustScore(options: {
  taskType: TaskType;
  aiConfidenceScore: number; // 0-1
  taskCriticality: CriticalityLevel;
  taskFamiliarity: FamiliarityLevel;
  timePressure: TimePressureLevel;
  userValidationHistory?: Array<{ taskType: string; correct: boolean; timestamp: Date }>;
  modificationContext?: ModificationContext;
}): TrustProfile {
  const {
    taskType,
    aiConfidenceScore,
    taskCriticality,
    taskFamiliarity,
    timePressure,
    userValidationHistory = [],
    modificationContext,
  } = options;

  const taskMetadata = TASK_TYPE_METADATA[taskType];

  // 1. Task type base score (evidence-based)
  const taskTypeBaseScore = taskMetadata.baseScore;
  const taskTypeFactor = Math.min(taskTypeBaseScore, 100);

  // 2. Criticality adjustment (Okamura framework)
  const criticalityData = CRITICALITY_ADJUSTMENT[taskCriticality];
  const criticalityAdjustment = criticalityData.adjustment;

  // 3. Familiarity adjustment
  const familiarityAdjustment = FAMILIARITY_ADJUSTMENT[taskFamiliarity];

  // 4. Time pressure adjustment
  const timePressureAdjustment = TIME_PRESSURE_ADJUSTMENT[timePressure];

  // 5. AI confidence factor (capped to prevent overconfidence)
  // Scale: AI confidence contributes up to ±15 points, but cap positive at +10
  const rawConfidenceContribution = (aiConfidenceScore - 0.5) * 30;
  const aiConfidenceFactor = Math.min(10, Math.max(-15, rawConfidenceContribution));

  // 6. User history factor (Bayesian update with confidence weighting)
  let userHistoryFactor = 0;
  if (userValidationHistory.length > 0) {
    const taskValidations = userValidationHistory.filter(v => v.taskType === taskType);
    if (taskValidations.length >= 3) {
      const accuracy = taskValidations.filter(v => v.correct).length / taskValidations.length;
      const confidenceWeight = Math.min(1, taskValidations.length / 15);
      // Accuracy deviation from 70% baseline, scaled by confidence
      userHistoryFactor = (accuracy - 0.7) * 30 * confidenceWeight;
    }
  }

  // 7. Calibration factor (metacognitive sensitivity)
  const calibrationQuality = calculateCalibrationQuality();
  const calibrationFactor = (calibrationQuality - 0.5) * 10;

  // 8. Modification impact (if applicable)
  let modificationAdjustment = 0;
  if (modificationContext && modificationContext.type !== 'none') {
    const modData = MODIFICATION_IMPACT[modificationContext.type];
    modificationAdjustment = modData.trustAdjustment * modificationContext.changeRatio;
  }

  // Calculate final score
  let score = taskTypeFactor +
    criticalityAdjustment +
    familiarityAdjustment +
    timePressureAdjustment +
    aiConfidenceFactor +
    userHistoryFactor +
    calibrationFactor +
    modificationAdjustment;

  score = Math.max(0, Math.min(100, score)); // Clamp 0-100

  // Calculate confidence in this score
  let confidence = 0.5; // Base confidence
  if (userValidationHistory.length > 5) confidence += 0.2;
  if (calibrationHistory.length > 10) confidence += 0.1;
  if (taskMetadata.verifiability > 0.7) confidence += 0.1;
  if (Math.abs(aiConfidenceScore - score / 100) < 0.2) confidence += 0.05;
  confidence = Math.min(confidence, 0.95);

  const reasoning = generateTrustReasoning({
    taskType,
    taskTypeBaseScore,
    criticalityAdjustment,
    aiConfidenceScore,
    userHistoryFactor,
    taskMetadata,
  });

  const theoreticalBasis = generateTheoreticalBasis({
    taskMetadata,
    criticalityAdjustment,
    userHistoryFactor,
    aiConfidenceFactor,
  });

  return {
    score,
    factors: {
      taskTypeFactor,
      taskTypeBaseScore,
      criticalityAdjustment,
      aiConfidenceFactor,
      userHistoryFactor,
      calibrationFactor,
    },
    confidence,
    reasoning,
    theoreticalBasis,
  };
}

/**
 * Calculate metacognitive calibration quality
 *
 * Based on Meta-d' concept from PMC research:
 * Measures how well predicted trust scores discriminate between
 * correct and incorrect outputs.
 */
function calculateCalibrationQuality(): number {
  if (calibrationHistory.length < 5) {
    return 0.5; // Neutral until enough data
  }

  // Group predictions into bins
  const bins: Map<number, { correct: number; total: number }> = new Map();

  for (const entry of calibrationHistory.slice(-50)) {
    const bin = Math.floor(entry.predicted / 20) * 20;
    if (!bins.has(bin)) {
      bins.set(bin, { correct: 0, total: 0 });
    }
    const binData = bins.get(bin)!;
    binData.total++;
    if (entry.actual) binData.correct++;
  }

  // Calculate calibration error
  let totalError = 0;
  let weightSum = 0;

  bins.forEach((data, bin) => {
    if (data.total >= 2) {
      const expectedAccuracy = (bin + 10) / 100;
      const actualAccuracy = data.correct / data.total;
      const error = Math.abs(expectedAccuracy - actualAccuracy);
      totalError += error * data.total;
      weightSum += data.total;
    }
  });

  if (weightSum === 0) return 0.5;

  const avgError = totalError / weightSum;
  return Math.max(0, 1 - avgError * 2);
}

/**
 * Record calibration outcome for learning
 */
export function recordCalibrationOutcome(predictedScore: number, wasCorrect: boolean): void {
  calibrationHistory.push({
    predicted: predictedScore,
    actual: wasCorrect,
    timestamp: new Date()
  });

  // Keep last 100 entries
  if (calibrationHistory.length > 100) {
    calibrationHistory = calibrationHistory.slice(-100);
  }
}

/**
 * Generate human-readable reasoning for trust score
 */
function generateTrustReasoning(options: {
  taskType: TaskType;
  taskTypeBaseScore: number;
  criticalityAdjustment: number;
  aiConfidenceScore: number;
  userHistoryFactor: number;
  taskMetadata: typeof TASK_TYPE_METADATA[TaskType];
}): string {
  const {
    taskType,
    taskTypeBaseScore,
    criticalityAdjustment,
    aiConfidenceScore,
    userHistoryFactor,
    taskMetadata,
  } = options;

  const reasons: string[] = [];

  // Task type reasoning with benchmark reference
  if (taskTypeBaseScore >= 75) {
    reasons.push(`${taskType} tasks are generally verifiable (${taskMetadata.benchmarkSource})`);
  } else if (taskTypeBaseScore >= 55) {
    reasons.push(`${taskType} tasks require careful review`);
  } else {
    reasons.push(`${taskType} has elevated error risk (hallucination: ${Math.round(taskMetadata.hallucinationRisk * 100)}%)`);
  }

  // Criticality reasoning
  if (criticalityAdjustment < -10) {
    reasons.push('High stakes require thorough verification (Okamura framework)');
  } else if (criticalityAdjustment > 0) {
    reasons.push('Low stakes allow lighter verification');
  }

  // AI confidence reasoning
  if (aiConfidenceScore >= 0.8) {
    reasons.push('AI shows high confidence - but verify for overconfidence');
  } else if (aiConfidenceScore < 0.5) {
    reasons.push('AI expresses uncertainty - careful verification needed');
  }

  // User history reasoning
  if (userHistoryFactor > 5) {
    reasons.push('Your history shows strong accuracy on this type');
  } else if (userHistoryFactor < -5) {
    reasons.push('Previous errors on this type suggest extra caution');
  }

  // Subjectivity warning
  if (taskMetadata.subjectivity > 0.6) {
    reasons.push('Highly subjective task - quality depends on interpretation');
  }

  return reasons.join('; ');
}

/**
 * Generate theoretical basis explanation
 */
function generateTheoreticalBasis(options: {
  taskMetadata: typeof TASK_TYPE_METADATA[TaskType];
  criticalityAdjustment: number;
  userHistoryFactor: number;
  aiConfidenceFactor: number;
}): string {
  const { taskMetadata, criticalityAdjustment, userHistoryFactor, aiConfidenceFactor } = options;

  const factors: string[] = [];

  factors.push(`Baseline: ${taskMetadata.baseScore} (${taskMetadata.benchmarkSource})`);

  if (Math.abs(criticalityAdjustment) > 0) {
    factors.push(`Criticality: ${criticalityAdjustment > 0 ? '+' : ''}${criticalityAdjustment} (Okamura framework)`);
  }

  if (Math.abs(userHistoryFactor) > 2) {
    factors.push(`History: ${userHistoryFactor > 0 ? '+' : ''}${Math.round(userHistoryFactor)} (Bayesian update)`);
  }

  if (Math.abs(aiConfidenceFactor) > 2) {
    factors.push(`AI confidence: ${aiConfidenceFactor > 0 ? '+' : ''}${Math.round(aiConfidenceFactor)}`);
  }

  return factors.join('; ');
}

/**
 * Classify modification type based on content analysis
 */
export function classifyModification(
  original: string,
  modified: string
): ModificationContext {
  if (!modified || original === modified) {
    return { type: 'none', changeRatio: 0, wasFactualCorrection: false };
  }

  const originalWords = original.split(/\s+/);
  const modifiedWords = modified.split(/\s+/);

  // Calculate change ratio
  const longerLength = Math.max(originalWords.length, modifiedWords.length);
  const shorterLength = Math.min(originalWords.length, modifiedWords.length);
  const changeRatio = longerLength > 0 ? 1 - (shorterLength / longerLength) : 0;

  // Detect correction patterns (English and Chinese)
  const correctionPatterns = [
    /actually|incorrect|wrong|error|mistake|fix|correct|fixed/i,
    /不对|错误|修正|纠正|实际上|改正/
  ];

  const wasFactualCorrection = correctionPatterns.some(p => p.test(modified));

  // Classify type
  let type: ModificationType = 'preference';

  if (wasFactualCorrection || changeRatio > 0.5) {
    type = 'correction';
  } else if (modifiedWords.length > originalWords.length * 1.3) {
    type = 'extension';
  }

  return { type, changeRatio, wasFactualCorrection };
}

/**
 * Determine risk level based on trust profile and criticality
 */
export function getRiskLevel(trustProfile: TrustProfile, criticality: CriticalityLevel): RiskLevel {
  const { score } = trustProfile;

  // Risk thresholds vary by criticality
  if (criticality === 'high') {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  } else if (criticality === 'medium') {
    if (score >= 70) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'high';
    return 'critical';
  } else {
    // low criticality
    if (score >= 60) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }
}

/**
 * Generate verification strategy recommendation
 */
export function getVerificationStrategy(options: {
  taskType: TaskType;
  trustScore: number;
  riskLevel: RiskLevel;
  taskCriticality: CriticalityLevel;
}): VerificationStrategy {
  const { taskType, trustScore, riskLevel, taskCriticality } = options;

  const baseStrategy = VERIFICATION_STRATEGIES[taskType];

  // Estimate verification time based on trust and criticality
  let estimatedTime = '5-10 min';
  if (trustScore >= 80) {
    estimatedTime = 'Quick spot-check (2-3 min)';
  } else if (trustScore >= 65) {
    estimatedTime = 'Focused review (5-10 min)';
  } else if (trustScore >= 50) {
    estimatedTime = 'Thorough review (15-20 min)';
  } else if (trustScore >= 35) {
    estimatedTime = 'Detailed verification (25-30 min)';
  } else {
    estimatedTime = 'Expert review required (30+ min)';
  }

  if (taskCriticality === 'high' && trustScore < 70) {
    estimatedTime = 'Expert review recommended (30+ min)';
  }

  return {
    ...baseStrategy,
    estimatedTime,
  };
}

/**
 * Get task type metadata for transparency
 */
export function getTaskTypeMetadata(taskType: TaskType): typeof TASK_TYPE_METADATA[TaskType] {
  return TASK_TYPE_METADATA[taskType];
}

/**
 * Generate historical accuracy data from user validations
 */
export function generateAccuracyHistory(
  validations: Array<{
    isCorrect: boolean;
    taskType: string;
    notes?: string;
    timestamp: Date;
  }>
): TaskTypeAccuracy[] {
  if (validations.length === 0) return [];

  // Group validations by task type
  const byTaskType = new Map<string, typeof validations>();
  validations.forEach(val => {
    if (!byTaskType.has(val.taskType)) {
      byTaskType.set(val.taskType, []);
    }
    byTaskType.get(val.taskType)!.push(val);
  });

  // Calculate accuracy for each type
  const results: TaskTypeAccuracy[] = [];

  byTaskType.forEach((vals, taskType) => {
    const correct = vals.filter(v => v.isCorrect).length;
    const accuracy = correct / vals.length;

    // Calculate trend (compare recent vs older)
    let trend: TaskTypeAccuracy['trend'] | undefined;
    if (vals.length >= 4) {
      const midpoint = Math.floor(vals.length / 2);
      const olderAccuracy = vals.slice(0, midpoint).filter(v => v.isCorrect).length / midpoint;
      const recentAccuracy =
        vals.slice(midpoint).filter(v => v.isCorrect).length / (vals.length - midpoint);
      const percentageChange = olderAccuracy > 0
        ? ((recentAccuracy - olderAccuracy) / olderAccuracy) * 100
        : 0;

      if (Math.abs(percentageChange) < 5) {
        trend = { direction: 'stable', percentageChange };
      } else if (percentageChange > 0) {
        trend = { direction: 'up', percentageChange };
      } else {
        trend = { direction: 'down', percentageChange };
      }
    }

    results.push({
      taskType: taskType as TaskType,
      accuracy,
      samplesValidated: vals.length,
      trend,
    });
  });

  return results.sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Calculate confidence boost/penalty based on user's track record
 */
export function calculateUserHistoryFactor(
  validations: Array<{ taskType: string; correct: boolean; timestamp: Date }>,
  currentTaskType: string
): number {
  if (validations.length === 0) return 0;

  const taskValidations = validations.filter(v => v.taskType === currentTaskType);
  if (taskValidations.length < 3) return 0;

  const accuracy = taskValidations.filter(v => v.correct).length / taskValidations.length;
  const confidence = Math.min(1, taskValidations.length / 15);

  // Scale: 70% accuracy = 0, deviation scaled by confidence
  return (accuracy - 0.7) * 30 * confidence;
}

/**
 * Predict which output type user will find reliable
 */
export function getPersonalizedRecommendation(
  validations: Array<{ taskType: string; correct: boolean; timestamp: Date }>
): string {
  if (validations.length < 3) {
    return 'Build your accuracy profile by validating outputs';
  }

  const accuracy = generateAccuracyHistory(
    validations.map(v => ({ isCorrect: v.correct, taskType: v.taskType, timestamp: v.timestamp }))
  );

  if (accuracy.length === 0) {
    return 'Continue validating to build your profile';
  }

  const bestType = accuracy[0];
  const worstType = accuracy[accuracy.length - 1];

  return `You're most accurate with ${bestType.taskType} (${(bestType.accuracy * 100).toFixed(0)}%) and least with ${worstType.taskType} (${(worstType.accuracy * 100).toFixed(0)}%)`;
}

/**
 * Clear calibration history (for testing)
 */
export function clearCalibrationHistory(): void {
  calibrationHistory = [];
}

export default {
  calculateTrustScore,
  getRiskLevel,
  getVerificationStrategy,
  generateAccuracyHistory,
  calculateUserHistoryFactor,
  getPersonalizedRecommendation,
  classifyModification,
  recordCalibrationOutcome,
  getTaskTypeMetadata,
  clearCalibrationHistory,
};
