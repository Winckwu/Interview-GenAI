/**
 * Metacognitive Type System
 *
 * Defines 6 metacognitive capability types based on 4-dimension scores
 * and provides personalized MR recommendations for each type.
 */

export type MetacognitiveType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface DimensionScores {
  planning: number;
  monitoring: number;
  evaluation: number;
  regulation: number;
}

export interface MetacognitiveTypeProfile {
  type: MetacognitiveType;
  name: string;
  nameCN: string;
  icon: string;
  color: string;
  characteristics: string[];
  characteristicsCN: string[];
  strengths: string[];
  strengthsCN: string[];
  challenges: string[];
  challengesCN: string[];
  recommendedMRs: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    color: string;
  }>;
}

/**
 * Type A: Balanced & Mature (均衡成熟型)
 * All dimensions ≥ 0.6
 */
const TYPE_A: MetacognitiveTypeProfile = {
  type: 'A',
  name: 'Balanced & Mature',
  nameCN: '均衡成熟型',
  icon: '🌟',
  color: '#10b981',
  characteristics: [
    'All metacognitive dimensions are well-developed',
    'Strong self-awareness in AI collaboration',
    'Able to adapt strategies flexibly',
  ],
  characteristicsCN: [
    '四个元认知维度发展均衡',
    '在AI协作中有很强的自我意识',
    '能够灵活调整策略',
  ],
  strengths: [
    'Excellent planning and execution',
    'Effective monitoring and verification',
    'Strong critical evaluation skills',
  ],
  strengthsCN: [
    '出色的规划和执行能力',
    '有效的监控和验证',
    '强大的批判性评估能力',
  ],
  challenges: [
    'Risk of over-confidence',
    'May overlook subtle improvements',
  ],
  challengesCN: [
    '可能存在过度自信的风险',
    '可能忽视细微的改进空间',
  ],
  recommendedMRs: [
    {
      id: 'MR17',
      name: 'Learning Process Visualization',
      icon: '📊',
      description: 'Track your continued growth and mastery',
      priority: 'medium',
      color: '#14b8a6',
    },
    {
      id: 'MR15',
      name: 'Metacognitive Strategy Guide',
      icon: '📚',
      description: 'Explore advanced AI collaboration strategies',
      priority: 'medium',
      color: '#8b5cf6',
    },
  ],
};

/**
 * Type B: Planning-Driven (规划驱动型)
 * Planning ≥ 0.7, but Monitoring < 0.5 or Evaluation < 0.5
 */
const TYPE_B: MetacognitiveTypeProfile = {
  type: 'B',
  name: 'Planning-Driven',
  nameCN: '规划驱动型',
  icon: '📐',
  color: '#3b82f6',
  characteristics: [
    'Excellent at planning and goal-setting',
    'Weak in process monitoring',
    'May miss quality issues during execution',
  ],
  characteristicsCN: [
    '擅长规划和设定目标',
    '过程监控较弱',
    '执行中容易忽视质量问题',
  ],
  strengths: [
    'Clear task decomposition',
    'Well-defined success criteria',
    'Strategic thinking',
  ],
  strengthsCN: [
    '清晰的任务分解',
    '明确的成功标准',
    '战略性思维',
  ],
  challenges: [
    'Insufficient verification of AI outputs',
    'Lack of progress tracking',
    'May accept flawed results',
  ],
  challengesCN: [
    'AI输出验证不足',
    '缺乏进度追踪',
    '可能接受有缺陷的结果',
  ],
  recommendedMRs: [
    {
      id: 'MR2',
      name: 'Process Transparency',
      icon: '👁️',
      description: 'Track how AI outputs evolve through iterations',
      priority: 'high',
      color: '#10b981',
    },
    {
      id: 'MR11',
      name: 'Integrated Verification',
      icon: '✓',
      description: 'Guided verification of AI outputs',
      priority: 'high',
      color: '#059669',
    },
    {
      id: 'MR12',
      name: 'Critical Thinking Scaffolding',
      icon: '🤔',
      description: 'Develop critical evaluation skills',
      priority: 'medium',
      color: '#f59e0b',
    },
  ],
};

/**
 * Type C: Blind Execution (执行盲目型)
 * Planning < 0.5 and Monitoring < 0.5
 */
const TYPE_C: MetacognitiveTypeProfile = {
  type: 'C',
  name: 'Blind Execution',
  nameCN: '执行盲目型',
  icon: '🎲',
  color: '#ef4444',
  characteristics: [
    'Lacks planning before execution',
    'Insufficient monitoring during work',
    'High risk of low-quality outputs',
  ],
  characteristicsCN: [
    '执行前缺乏规划',
    '工作中监控不足',
    '输出质量风险高',
  ],
  strengths: [
    'Fast execution speed',
    'Willing to experiment',
  ],
  strengthsCN: [
    '执行速度快',
    '愿意尝试',
  ],
  challenges: [
    'No clear goals or direction',
    'Difficult to detect errors',
    'Low work efficiency',
  ],
  challengesCN: [
    '没有明确目标和方向',
    '难以发现错误',
    '工作效率低',
  ],
  recommendedMRs: [
    {
      id: 'MR1',
      name: 'Task Decomposition Scaffold',
      icon: '🧩',
      description: 'Break complex tasks into manageable subtasks',
      priority: 'high',
      color: '#3b82f6',
    },
    {
      id: 'MR8',
      name: 'Task Characteristic Recognition',
      icon: '🔍',
      description: 'Understand task requirements better',
      priority: 'high',
      color: '#06b6d4',
    },
    {
      id: 'MR15',
      name: 'Metacognitive Strategy Guide',
      icon: '📚',
      description: 'Learn effective AI collaboration strategies',
      priority: 'high',
      color: '#8b5cf6',
    },
  ],
};

/**
 * Type D: Critical but Passive (批判被动型)
 * Evaluation ≥ 0.6, but Planning < 0.5 and Regulation < 0.5
 */
const TYPE_D: MetacognitiveTypeProfile = {
  type: 'D',
  name: 'Critical but Passive',
  nameCN: '批判被动型',
  icon: '🤔',
  color: '#f59e0b',
  characteristics: [
    'Good at evaluating quality',
    'Lacks proactive planning',
    'Weak at adjusting strategies',
  ],
  characteristicsCN: [
    '善于评估质量',
    '缺乏主动规划',
    '策略调整能力弱',
  ],
  strengths: [
    'Strong critical thinking',
    'Can identify issues',
    'Quality-conscious',
  ],
  strengthsCN: [
    '强大的批判性思维',
    '能够识别问题',
    '有质量意识',
  ],
  challenges: [
    'Doesn\'t translate critique into action',
    'Reactive rather than proactive',
    'Difficulty improving workflows',
  ],
  challengesCN: [
    '不能将批判转化为行动',
    '被动应对而非主动规划',
    '难以改进工作流程',
  ],
  recommendedMRs: [
    {
      id: 'MR1',
      name: 'Task Decomposition Scaffold',
      icon: '🧩',
      description: 'Build planning capabilities',
      priority: 'high',
      color: '#3b82f6',
    },
    {
      id: 'MR9',
      name: 'Dynamic Trust Calibration',
      icon: '🎯',
      description: 'Learn to adjust AI collaboration strategies',
      priority: 'high',
      color: '#ec4899',
    },
    {
      id: 'MR14',
      name: 'Guided Reflection Mechanism',
      icon: '💭',
      description: 'Turn insights into actionable improvements',
      priority: 'medium',
      color: '#8b5cf6',
    },
  ],
};

/**
 * Type E: Over-Reliant (过度依赖型)
 * Regulation < 0.4
 */
const TYPE_E: MetacognitiveTypeProfile = {
  type: 'E',
  name: 'Over-Reliant',
  nameCN: '过度依赖型',
  icon: '⚠️',
  color: '#dc2626',
  characteristics: [
    'Lacks self-regulation',
    'Excessive dependence on AI',
    'Risk of skill atrophy',
  ],
  characteristicsCN: [
    '缺乏自我调节',
    '过度依赖AI',
    '技能退化风险',
  ],
  strengths: [
    'Comfortable with AI tools',
    'Productive with assistance',
  ],
  strengthsCN: [
    '熟练使用AI工具',
    '在辅助下工作高效',
  ],
  challenges: [
    'Difficulty working independently',
    'Low awareness of AI limitations',
    'Core skills degradation',
  ],
  challengesCN: [
    '难以独立工作',
    '对AI局限性认知不足',
    '核心能力退化',
  ],
  recommendedMRs: [
    {
      id: 'MR18',
      name: 'Over-Reliance Warning',
      icon: '⚠️',
      description: 'Detect unhealthy AI dependence',
      priority: 'high',
      color: '#ef4444',
    },
    {
      id: 'MR16',
      name: 'Skill Atrophy Prevention',
      icon: '💪',
      description: 'Maintain your core skills',
      priority: 'high',
      color: '#f43f5e',
    },
    {
      id: 'MR9',
      name: 'Dynamic Trust Calibration',
      icon: '🎯',
      description: 'Calibrate appropriate trust in AI',
      priority: 'high',
      color: '#ec4899',
    },
  ],
};

/**
 * Type F: Needs Comprehensive Development (全面提升型)
 * All dimensions < 0.5
 */
const TYPE_F: MetacognitiveTypeProfile = {
  type: 'F',
  name: 'Needs Comprehensive Development',
  nameCN: '全面提升型',
  icon: '🌱',
  color: '#6b7280',
  characteristics: [
    'All dimensions need improvement',
    'Early stage of AI collaboration',
    'High growth potential',
  ],
  characteristicsCN: [
    '四个维度均需提升',
    'AI协作处于初级阶段',
    '成长潜力大',
  ],
  strengths: [
    'Growth mindset',
    'Willingness to learn',
    'Clear improvement path',
  ],
  strengthsCN: [
    '有成长心态',
    '愿意学习',
    '改进路径清晰',
  ],
  challenges: [
    'Needs systematic capability building',
    'May feel overwhelmed',
    'Requires patience and practice',
  ],
  challengesCN: [
    '需要系统性能力建设',
    '可能感到无从下手',
    '需要耐心和练习',
  ],
  recommendedMRs: [
    {
      id: 'MR15',
      name: 'Metacognitive Strategy Guide',
      icon: '📚',
      description: 'Start with foundational strategies',
      priority: 'high',
      color: '#8b5cf6',
    },
    {
      id: 'MR1',
      name: 'Task Decomposition Scaffold',
      icon: '🧩',
      description: 'Learn to break down tasks',
      priority: 'high',
      color: '#3b82f6',
    },
    {
      id: 'MR11',
      name: 'Integrated Verification',
      icon: '✓',
      description: 'Build verification habits',
      priority: 'medium',
      color: '#059669',
    },
    {
      id: 'MR14',
      name: 'Guided Reflection Mechanism',
      icon: '💭',
      description: 'Develop reflective practice',
      priority: 'medium',
      color: '#8b5cf6',
    },
  ],
};

/**
 * All type profiles
 */
export const METACOGNITIVE_TYPES: Record<MetacognitiveType, MetacognitiveTypeProfile> = {
  A: TYPE_A,
  B: TYPE_B,
  C: TYPE_C,
  D: TYPE_D,
  E: TYPE_E,
  F: TYPE_F,
};

/**
 * Classify user into metacognitive type based on dimension scores
 */
export function classifyMetacognitiveType(scores: DimensionScores): MetacognitiveTypeProfile {
  const { planning, monitoring, evaluation, regulation } = scores;

  // Type A: Balanced & Mature (all ≥ 0.6)
  if (planning >= 0.6 && monitoring >= 0.6 && evaluation >= 0.6 && regulation >= 0.6) {
    return METACOGNITIVE_TYPES.A;
  }

  // Type E: Over-Reliant (regulation < 0.4)
  if (regulation < 0.4) {
    return METACOGNITIVE_TYPES.E;
  }

  // Type C: Blind Execution (planning < 0.5 AND monitoring < 0.5)
  if (planning < 0.5 && monitoring < 0.5) {
    return METACOGNITIVE_TYPES.C;
  }

  // Type B: Planning-Driven (planning ≥ 0.7 AND (monitoring < 0.5 OR evaluation < 0.5))
  if (planning >= 0.7 && (monitoring < 0.5 || evaluation < 0.5)) {
    return METACOGNITIVE_TYPES.B;
  }

  // Type D: Critical but Passive (evaluation ≥ 0.6 AND planning < 0.5 AND regulation < 0.5)
  if (evaluation >= 0.6 && planning < 0.5 && regulation < 0.5) {
    return METACOGNITIVE_TYPES.D;
  }

  // Type F: Needs Comprehensive Development (all < 0.5)
  if (planning < 0.5 && monitoring < 0.5 && evaluation < 0.5 && regulation < 0.5) {
    return METACOGNITIVE_TYPES.F;
  }

  // Default fallback: analyze weakest dimension
  const sortedScores = Object.entries(scores)
    .sort(([, a], [, b]) => a - b);

  const weakestDimension = sortedScores[0][0];

  // If has 2+ weak dimensions (< 0.5), classify as Type F
  const weakCount = sortedScores.filter(([, score]) => score < 0.5).length;
  if (weakCount >= 2) {
    return METACOGNITIVE_TYPES.F;
  }

  // Single weak dimension - return type based on pattern
  if (weakestDimension === 'planning') {
    return planning < 0.5 ? METACOGNITIVE_TYPES.C : METACOGNITIVE_TYPES.B;
  }
  if (weakestDimension === 'monitoring') {
    return METACOGNITIVE_TYPES.B;
  }
  if (weakestDimension === 'regulation') {
    return METACOGNITIVE_TYPES.E;
  }

  // Default to Type D (critical but passive)
  return METACOGNITIVE_TYPES.D;
}

/**
 * Get MR recommendations based on multiple weak dimensions
 * Phase 1 optimization: Consider multiple weak areas
 */
export function getMultiDimensionRecommendations(
  scores: DimensionScores
): Array<{ id: string; name: string; icon: string; description: string; color: string; dimension: string }> {
  // Dimension-specific MR mappings
  const dimensionMRs: Record<string, Array<{ id: string; name: string; icon: string; description: string; color: string }>> = {
    planning: [
      { id: 'MR1', name: 'Task Decomposition Scaffold', icon: '🧩', description: 'Break complex tasks into manageable subtasks', color: '#3b82f6' },
      { id: 'MR15', name: 'Metacognitive Strategy Guide', icon: '📚', description: 'Learn effective AI collaboration strategies', color: '#8b5cf6' },
      { id: 'MR8', name: 'Task Characteristic Recognition', icon: '🔍', description: 'Understand task requirements better', color: '#06b6d4' },
    ],
    monitoring: [
      { id: 'MR2', name: 'Process Transparency', icon: '👁️', description: 'Track how AI outputs evolve through iterations', color: '#10b981' },
      { id: 'MR17', name: 'Learning Process Visualization', icon: '📊', description: 'Visualize your learning journey', color: '#14b8a6' },
      { id: 'MR11', name: 'Integrated Verification', icon: '✓', description: 'Guided verification of AI outputs', color: '#059669' },
    ],
    evaluation: [
      { id: 'MR12', name: 'Critical Thinking Scaffolding', icon: '🤔', description: 'Develop critical evaluation skills', color: '#f59e0b' },
      { id: 'MR7', name: 'Failure Tolerance Learning', icon: '📝', description: 'Learn from AI errors and mistakes', color: '#f97316' },
      { id: 'MR10', name: 'Cost-Benefit Analysis', icon: '⚖️', description: 'Evaluate when to use AI assistance', color: '#eab308' },
    ],
    regulation: [
      { id: 'MR9', name: 'Dynamic Trust Calibration', icon: '🎯', description: 'Calibrate appropriate trust in AI', color: '#ec4899' },
      { id: 'MR18', name: 'Over-Reliance Warning', icon: '⚠️', description: 'Detect unhealthy AI dependence', color: '#ef4444' },
      { id: 'MR16', name: 'Skill Atrophy Prevention', icon: '💪', description: 'Maintain your core skills', color: '#f43f5e' },
    ],
  };

  // Find weak dimensions (< 0.6)
  const weakDimensions = Object.entries(scores)
    .filter(([, score]) => score < 0.6)
    .sort(([, a], [, b]) => a - b) // Sort by score ascending
    .map(([dimension]) => dimension);

  if (weakDimensions.length === 0) {
    return []; // No weak dimensions
  }

  const recommendations: Array<{ id: string; name: string; icon: string; description: string; color: string; dimension: string }> = [];

  if (weakDimensions.length === 1) {
    // Single weak dimension: return top 2 MRs
    const mrs = dimensionMRs[weakDimensions[0]].slice(0, 2);
    recommendations.push(...mrs.map(mr => ({ ...mr, dimension: weakDimensions[0] })));
  } else if (weakDimensions.length === 2) {
    // Two weak dimensions: return 1 MR from each
    recommendations.push({ ...dimensionMRs[weakDimensions[0]][0], dimension: weakDimensions[0] });
    recommendations.push({ ...dimensionMRs[weakDimensions[1]][0], dimension: weakDimensions[1] });
  } else {
    // 3+ weak dimensions: return 1 MR from each of the weakest 2
    recommendations.push({ ...dimensionMRs[weakDimensions[0]][0], dimension: weakDimensions[0] });
    recommendations.push({ ...dimensionMRs[weakDimensions[1]][0], dimension: weakDimensions[1] });
  }

  return recommendations;
}
