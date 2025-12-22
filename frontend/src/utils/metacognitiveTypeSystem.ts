/**
 * Metacognitive Assessment to Behavioral Pattern Mapping System
 *
 * PURPOSE:
 * This module bridges static assessment scores with dynamic behavioral patterns (A-F).
 *
 * KEY DESIGN PRINCIPLES:
 * 1. **Assessment scores are STATIC**: Users take MR19 assessment occasionally (not frequently updated)
 * 2. **Behavioral patterns are DYNAMIC**: Continuously detected from actual usage behavior
 * 3. **Cold Start Solution**: Use assessment scores to predict initial pattern when behavioral data is insufficient
 * 4. **Mature State**: Use actual detected behavioral patterns when sufficient data exists
 * 5. **Gap Analysis**: Compare "potential capability" (assessment) vs "actual behavior" (pattern)
 *
 * USAGE FLOW:
 * - Stage 1 (New users, sessions < 5): Use predictPatternFromAssessment() to get initial pattern
 * - Stage 2 (Active users, sessions >= 5): Use actual detected pattern from backend
 * - Stage 3 (Analysis): Use analyzeCapabilityVsBehaviorGap() to identify discrepancies
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DimensionScores {
  planning: number;      // 0-1, from MR19 assessment
  monitoring: number;    // 0-1, from MR19 assessment
  evaluation: number;    // 0-1, from MR19 assessment
  regulation: number;    // 0-1, from MR19 assessment
}

export type BehavioralPattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/**
 * 6 Behavioral Patterns (from docs/guides/PATTERN_DETECTION_GUIDE.md)
 *
 * Pattern A: Strategic Decomposition & Control (战略分解与控制)
 *   - Careful task planning, high verification, independent thinking
 *   - Detection: planning ≥ 10, monitoring ≥ 7, evaluation ≥ 7
 *
 * Pattern B: Iterative Refinement (迭代精进)
 *   - Rapid experimentation with 3-7 iterations, active learning through trial and error
 *   - Detection: iteration_frequency ≥ 2.5, reflection_depth ≥ 1.5
 *
 * Pattern C: Context-Sensitive Adaptation (情境适应)
 *   - Flexible strategies adapting to task complexity, switches approaches based on context
 *   - Detection: strategy_diversity ≥ 2, cross_model_usage ≥ 1.5
 *
 * Pattern D: Deep Verification (深度验证)
 *   - Systematic verification, parallel problem-solving, thorough validation
 *   - Detection: verification_rate ≥ 2.5, error_awareness ≥ 2, planning ≤ 9
 *
 * Pattern E: Pedagogical Reflection (教学反思)
 *   - Learning-oriented, uses AI for self-development, focuses on understanding
 *   - Detection: reflection_depth ≥ 2.5, modification_rate ≥ 2
 *
 * Pattern F: Passive Dependency (被动依赖 - HIGH RISK)
 *   - Minimal metacognitive engagement, accepts AI outputs without verification
 *   - Detection: reflection_depth = 0, total_score < 15
 */

export interface BehavioralPatternProfile {
  pattern: BehavioralPattern;
  name: string;
  nameCN: string;
  icon: string;
  color: string;
  description: string;
  descriptionCN: string;
  characteristics: string[];
  characteristicsCN: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendedMRs: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    color: string;
  }>;
}

// ============================================================================
// PATTERN PROFILES
// ============================================================================

const PATTERN_PROFILES: Record<BehavioralPattern, BehavioralPatternProfile> = {
  A: {
    pattern: 'A',
    name: 'Strategic Decomposition & Control',
    nameCN: '战略分解与控制',
    icon: '🎯',
    color: '#10b981',
    description: 'Careful planning, high verification, independent thinking',
    descriptionCN: '仔细规划、高度验证、独立思考',
    characteristics: [
      'Careful task planning and decomposition',
      'High verification and monitoring awareness',
      'Independent thinking, not over-reliant on AI',
      'Comprehensive evaluation approach',
    ],
    characteristicsCN: [
      '仔细的任务规划和分解',
      '高度的验证和监控意识',
      '独立思考，不过度依赖AI',
      '全面的评估方法',
    ],
    riskLevel: 'low',
    recommendedMRs: [
      {
        id: 'MR6',
        name: 'Cross-Model Experimentation',
        icon: '🔬',
        description: 'Compare different models to leverage your analytical skills',
        priority: 'medium',
        color: '#8b5cf6',
      },
      {
        id: 'MR15',
        name: 'Metacognitive Strategy Guide',
        icon: '🎓',
        description: 'Advanced strategies for effective AI collaboration',
        priority: 'low',
        color: '#06b6d4',
      },
    ],
  },
  B: {
    pattern: 'B',
    name: 'Iterative Refinement',
    nameCN: '迭代精进',
    icon: '🔄',
    color: '#3b82f6',
    description: 'Rapid experimentation with 3-7 iterations, active learning through trial and error',
    descriptionCN: '快速迭代实验、通过试错主动学习',
    characteristics: [
      'Rapid experimentation with multiple iterations',
      'Active learning through trial and error',
      'Continuous improvement mindset',
      'Selective acceptance of AI suggestions',
    ],
    characteristicsCN: [
      '多次迭代的快速实验',
      '通过试错主动学习',
      '持续改进的心态',
      '有选择性地接受AI建议',
    ],
    riskLevel: 'low',
    recommendedMRs: [
      {
        id: 'MR5',
        name: 'Low-Cost Iteration',
        icon: '⚡',
        description: 'Streamline your iteration process with variant generation',
        priority: 'high',
        color: '#f59e0b',
      },
      {
        id: 'MR2',
        name: 'Process Transparency',
        icon: '👁️',
        description: 'Track how outputs evolve through iterations',
        priority: 'medium',
        color: '#06b6d4',
      },
    ],
  },
  C: {
    pattern: 'C',
    name: 'Context-Sensitive Adaptation',
    nameCN: '情境适应',
    icon: '🎨',
    color: '#8b5cf6',
    description: 'Flexible strategies adapting to task complexity, switches approaches based on context',
    descriptionCN: '灵活策略适应任务复杂度、根据情境切换方法',
    characteristics: [
      'Flexible strategies adapting to task complexity',
      'Context-aware approach switching',
      'Dynamic strategy adaptation (44.9% of users)',
      'Balanced but variable engagement',
    ],
    characteristicsCN: [
      '灵活策略适应任务复杂度',
      '上下文感知的方法切换',
      '动态战略切换（44.9%用户）',
      '平衡但多变的参与度',
    ],
    riskLevel: 'low',
    recommendedMRs: [
      {
        id: 'MR8',
        name: 'Task Characteristic Recognition',
        icon: '🔍',
        description: 'Analyze tasks to recommend appropriate AI usage patterns',
        priority: 'high',
        color: '#0ea5e9',
      },
      {
        id: 'MR6',
        name: 'Cross-Model Experimentation',
        icon: '🔬',
        description: 'Compare models across different tasks',
        priority: 'medium',
        color: '#8b5cf6',
      },
    ],
  },
  D: {
    pattern: 'D',
    name: 'Deep Verification',
    nameCN: '深度验证',
    icon: '🔍',
    color: '#f59e0b',
    description: 'Systematic verification, parallel problem-solving, thorough validation of AI outputs',
    descriptionCN: '系统性验证、并行问题解决、彻底验证AI输出',
    characteristics: [
      'Systematic verification of AI outputs',
      'Parallel problem-solving approach',
      'Thorough validation before acceptance',
      'Strong verification habits',
    ],
    characteristicsCN: [
      '系统性验证AI输出',
      '并行问题解决方法',
      '接受前彻底验证',
      '强健的验证习惯',
    ],
    riskLevel: 'low',
    recommendedMRs: [
      {
        id: 'MR11',
        name: 'Integrated Verification',
        icon: '✅',
        description: 'Streamline your verification process',
        priority: 'high',
        color: '#10b981',
      },
      {
        id: 'MR12',
        name: 'Critical Thinking Scaffolding',
        icon: '🧠',
        description: 'Structured approach to critical evaluation',
        priority: 'medium',
        color: '#6366f1',
      },
    ],
  },
  E: {
    pattern: 'E',
    name: 'Pedagogical Reflection',
    nameCN: '教学反思',
    icon: '📚',
    color: '#06b6d4',
    description: 'Learning-oriented approach, uses AI for self-development, focuses on understanding',
    descriptionCN: '学习导向方法、用AI促进自我发展、注重理解',
    characteristics: [
      'Learning-oriented approach to AI usage',
      'Uses AI for self-development',
      'Focuses on understanding rather than just results',
      'Growth mindset with strong metacognitive awareness',
    ],
    characteristicsCN: [
      '学习导向的AI使用方法',
      '用AI促进自我发展',
      '注重理解而非仅仅结果',
      '成长心态与强元认知意识',
    ],
    riskLevel: 'low',
    recommendedMRs: [
      {
        id: 'MR14',
        name: 'Guided Reflection Mechanism',
        icon: '💭',
        description: 'Deepen your learning reflection practice',
        priority: 'high',
        color: '#8b5cf6',
      },
      {
        id: 'MR17',
        name: 'Learning Process Visualization',
        icon: '📊',
        description: 'Visualize your learning journey',
        priority: 'medium',
        color: '#06b6d4',
      },
    ],
  },
  F: {
    pattern: 'F',
    name: 'Passive Dependency',
    nameCN: '被动依赖',
    icon: '⚠️',
    color: '#ef4444',
    description: 'Minimal metacognitive engagement, accepts AI outputs without verification - HIGH RISK',
    descriptionCN: '元认知参与度低、不验证就接受AI输出 - 高风险',
    characteristics: [
      'Minimal metacognitive engagement',
      'Accepts AI outputs without verification',
      'Low verification rate and short prompts',
      'High risk for skill atrophy',
    ],
    characteristicsCN: [
      '元认知参与度低',
      '不验证就接受AI输出',
      '低验证率和简短提示',
      '技能退化风险高',
    ],
    riskLevel: 'high',
    recommendedMRs: [
      {
        id: 'MR18',
        name: 'Over-Reliance Warning',
        icon: '⚠️',
        description: 'Detect and warn about unhealthy AI dependence',
        priority: 'high',
        color: '#ef4444',
      },
      {
        id: 'MR16',
        name: 'Skill Atrophy Prevention',
        icon: '💪',
        description: 'Prevent skill degradation from over-reliance',
        priority: 'high',
        color: '#f97316',
      },
      {
        id: 'MR1',
        name: 'Task Decomposition Scaffold',
        icon: '🧩',
        description: 'Build planning skills through scaffolding',
        priority: 'medium',
        color: '#3b82f6',
      },
    ],
  },
};

// ============================================================================
// CORE FUNCTION: PREDICT PATTERN FROM ASSESSMENT
// ============================================================================

/**
 * Predict initial behavioral pattern based on assessment scores
 *
 * Use this function for:
 * - Cold start: When user has insufficient behavioral data (< 5 sessions)
 * - Initial classification: To provide early personalized recommendations
 * - Baseline setting: Establish "potential capability" profile
 *
 * Mapping logic (based on 4-dimension scores):
 * - Pattern F (Priority 1): Low regulation + low overall → Passive Dependency
 * - Pattern A (Priority 2): High all dimensions → Strategic Decomposition
 * - Pattern D (Priority 3): High eval/monitor, low planning → Deep Verification
 * - Pattern E (Priority 4): High regulation + high evaluation → Pedagogical Reflection
 * - Pattern B (Priority 5): High regulation + moderate others → Iterative Refinement
 * - Pattern C (Default): Balanced dimensions → Context-Sensitive Adaptation
 *
 * @param scores - 4-dimension assessment scores (0-1 range)
 * @returns Predicted behavioral pattern (A-F)
 */
export function predictPatternFromAssessment(scores: DimensionScores): BehavioralPattern {
  const { planning, monitoring, evaluation, regulation } = scores;

  // Calculate overall average
  const avgScore = (planning + monitoring + evaluation + regulation) / 4;

  // Priority 1: Pattern F - Passive Dependency (CRITICAL to detect early!)
  // Low regulation (<0.4) AND low overall score (<0.5) indicates potential over-reliance
  if (regulation < 0.4 && avgScore < 0.5) {
    return 'F';
  }

  // Priority 2: Pattern A - Strategic Decomposition & Control
  // All dimensions strong (≥0.7) indicates strategic, well-rounded approach
  if (planning >= 0.7 && monitoring >= 0.7 && evaluation >= 0.7 && regulation >= 0.7) {
    return 'A';
  }

  // Priority 3: Pattern D - Deep Verification
  // High evaluation + high monitoring, but lower planning → focus on verification over planning
  if (evaluation >= 0.7 && monitoring >= 0.7 && planning < 0.7) {
    return 'D';
  }

  // Priority 4: Pattern E - Pedagogical Reflection
  // High regulation (self-adjustment) + high evaluation (reflection) → learning-focused
  if (regulation >= 0.7 && evaluation >= 0.7) {
    return 'E';
  }

  // Priority 5: Pattern B - Iterative Refinement
  // High regulation (≥0.6) with moderate other dimensions → iterative improvement tendency
  if (regulation >= 0.6 && avgScore >= 0.5) {
    return 'B';
  }

  // Default: Pattern C - Context-Sensitive Adaptation
  // Balanced dimensions without clear specialization → flexible, adaptive approach
  return 'C';
}

/**
 * Get behavioral pattern profile details
 *
 * @param pattern - Behavioral pattern (A-F)
 * @returns Complete pattern profile with characteristics and recommendations
 */
export function getPatternProfile(pattern: BehavioralPattern): BehavioralPatternProfile {
  return PATTERN_PROFILES[pattern];
}

// ============================================================================
// GAP ANALYSIS: POTENTIAL VS ACTUAL
// ============================================================================

/**
 * Analyze gap between potential capability (assessment) and actual behavior (pattern)
 *
 * This function identifies discrepancies that indicate:
 * - **Underperformance**: High capability but lower behavioral pattern
 *   → User has potential but not applying it in practice
 * - **Alignment**: Assessment matches behavior
 *   → User's capabilities are well-expressed in behavior
 * - **Overperformance**: Lower assessment but higher behavioral pattern (rare)
 *   → User developed skills through practice beyond initial assessment
 *
 * @param assessmentScores - 4-dimension scores from MR19 assessment
 * @param actualPattern - Currently detected behavioral pattern from usage data
 * @returns Gap analysis with insights and recommendations
 */
export function analyzeCapabilityVsBehaviorGap(
  assessmentScores: DimensionScores,
  actualPattern: BehavioralPattern
): {
  predictedPattern: BehavioralPattern;
  actualPattern: BehavioralPattern;
  gapType: 'underperforming' | 'aligned' | 'overperforming';
  gapSeverity: 'none' | 'minor' | 'moderate' | 'significant';
  insights: string[];
  insightsCN: string[];
  recommendations: string[];
  recommendationsCN: string[];
} {
  const predictedPattern = predictPatternFromAssessment(assessmentScores);

  // Define pattern quality hierarchy (lower index = better)
  const patternHierarchy: BehavioralPattern[] = ['A', 'B', 'E', 'D', 'C', 'F'];
  const predictedIdx = patternHierarchy.indexOf(predictedPattern);
  const actualIdx = patternHierarchy.indexOf(actualPattern);

  // Determine gap type and severity
  let gapType: 'underperforming' | 'aligned' | 'overperforming';
  let gapSeverity: 'none' | 'minor' | 'moderate' | 'significant';

  if (predictedIdx === actualIdx) {
    gapType = 'aligned';
    gapSeverity = 'none';
  } else if (actualIdx > predictedIdx) {
    // Actual pattern is lower quality than predicted
    gapType = 'underperforming';
    const gap = actualIdx - predictedIdx;
    if (gap === 1) gapSeverity = 'minor';
    else if (gap === 2) gapSeverity = 'moderate';
    else gapSeverity = 'significant';
  } else {
    // Actual pattern is higher quality than predicted (rare but positive!)
    gapType = 'overperforming';
    const gap = predictedIdx - actualIdx;
    if (gap === 1) gapSeverity = 'minor';
    else if (gap === 2) gapSeverity = 'moderate';
    else gapSeverity = 'significant';
  }

  // Generate insights and recommendations based on gap analysis
  const insights: string[] = [];
  const insightsCN: string[] = [];
  const recommendations: string[] = [];
  const recommendationsCN: string[] = [];

  const predictedProfile = PATTERN_PROFILES[predictedPattern];
  const actualProfile = PATTERN_PROFILES[actualPattern];

  if (gapType === 'aligned') {
    insights.push(`Your behavior aligns well with your capabilities (both ${actualProfile.name})`);
    insights.push('You are effectively applying your metacognitive skills in practice');
    insightsCN.push(`您的行为与能力很好地对齐（都是${actualProfile.nameCN}）`);
    insightsCN.push('您有效地将元认知能力应用于实践中');
    recommendations.push('Continue current practices and explore advanced features');
    recommendationsCN.push('继续当前实践并探索高级功能');
  } else if (gapType === 'underperforming') {
    insights.push(`Assessment suggests ${predictedProfile.name} capability, but behavior shows ${actualProfile.name}`);
    insights.push('There is a gap between your potential and actual AI usage patterns');

    if (actualPattern === 'F') {
      insights.push('⚠️ Critical: Your behavior shows over-reliance despite better capabilities');
      insightsCN.push(`评估显示${predictedProfile.nameCN}能力，但行为表现为${actualProfile.nameCN}`);
      insightsCN.push('您的潜力与实际AI使用模式之间存在差距');
      insightsCN.push('⚠️ 严重：尽管有更好的能力，您的行为显示过度依赖');
      recommendations.push('URGENT: Activate MR18 (Over-Reliance Warning) immediately');
      recommendations.push('Reflect on why you are not applying your metacognitive skills');
      recommendationsCN.push('紧急：立即激活MR18（过度依赖警告）');
      recommendationsCN.push('反思为什么您没有应用元认知能力');
    } else {
      insightsCN.push(`评估显示${predictedProfile.nameCN}能力，但行为表现为${actualProfile.nameCN}`);
      insightsCN.push('您的潜力与实际AI使用模式之间存在差距');
      recommendations.push(`Work towards applying ${predictedProfile.name} practices more consistently`);
      recommendations.push('Review MR recommendations for your predicted pattern');
      recommendationsCN.push(`努力更一致地应用${predictedProfile.nameCN}实践`);
      recommendationsCN.push('查看针对您预测模式的MR建议');
    }
  } else {
    // Overperforming - positive gap!
    insights.push(`Great! Your behavior (${actualProfile.name}) exceeds initial assessment (${predictedProfile.name})`);
    insights.push('You have developed stronger AI collaboration skills through practice');
    insightsCN.push(`很好！您的行为（${actualProfile.nameCN}）超过了初始评估（${predictedProfile.nameCN}）`);
    insightsCN.push('您通过实践培养了更强的AI协作能力');
    recommendations.push('Consider retaking the assessment to update your capability baseline');
    recommendations.push('Share your learning strategies with others');
    recommendationsCN.push('考虑重新进行评估以更新能力基线');
    recommendationsCN.push('与他人分享您的学习策略');
  }

  return {
    predictedPattern,
    actualPattern,
    gapType,
    gapSeverity,
    insights,
    insightsCN,
    recommendations,
    recommendationsCN,
  };
}

// ============================================================================
// MULTI-DIMENSION AWARE MR RECOMMENDATIONS
// ============================================================================

/**
 * Get MR recommendations based on multiple weak dimensions
 *
 * Instead of only addressing the weakest dimension, this function:
 * - Identifies ALL weak dimensions (score < 0.6)
 * - Prioritizes recommendations based on number and severity of weak areas
 * - Returns 2 MRs that address the most critical needs
 *
 * Logic:
 * - 1 weak dimension: Return top 2 MRs from that dimension
 * - 2 weak dimensions: Return 1 MR from each
 * - 3+ weak dimensions: Return 1 MR from each of the weakest 2
 *
 * @param scores - 4-dimension assessment scores
 * @returns Array of 2 recommended MRs with priority information
 */
export function getMultiDimensionRecommendations(
  scores: DimensionScores
): Array<{
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  dimension: string;
}> {
  // Dimension-specific MR mappings
  const dimensionMRs: Record<
    string,
    Array<{
      id: string;
      name: string;
      icon: string;
      description: string;
      color: string;
    }>
  > = {
    planning: [
      {
        id: 'MR1',
        name: 'Task Decomposition Scaffold',
        icon: '🧩',
        description: 'Break complex tasks into manageable subtasks with guided analysis',
        color: '#3b82f6',
      },
      {
        id: 'MR8',
        name: 'Task Characteristic Recognition',
        icon: '🔍',
        description: 'Analyze task characteristics to recommend appropriate AI usage',
        color: '#0ea5e9',
      },
    ],
    monitoring: [
      {
        id: 'MR2',
        name: 'Process Transparency',
        icon: '👁️',
        description: 'Visualize how AI outputs evolved through iterations',
        color: '#06b6d4',
      },
      {
        id: 'MR9',
        name: 'Dynamic Trust Calibration',
        icon: '⚖️',
        description: 'Real-time trust calibration based on AI performance',
        color: '#8b5cf6',
      },
    ],
    evaluation: [
      {
        id: 'MR11',
        name: 'Integrated Verification',
        icon: '✅',
        description: 'Guided verification processes to ensure AI output quality',
        color: '#10b981',
      },
      {
        id: 'MR12',
        name: 'Critical Thinking Scaffolding',
        icon: '🧠',
        description: 'Promote critical evaluation with guided questioning',
        color: '#6366f1',
      },
    ],
    regulation: [
      {
        id: 'MR3',
        name: 'Reminder Frequency',
        icon: '🎚️',
        description: 'Control how often you receive metacognitive reminders (Minimal/Balanced/Active)',
        color: '#ec4899',
      },
      {
        id: 'MR16',
        name: 'Skill Atrophy Prevention',
        icon: '💪',
        description: 'Prevent skill degradation from AI over-reliance',
        color: '#f97316',
      },
    ],
  };

  // Find all weak dimensions (< 0.6) and sort by score (weakest first)
  const weakDimensions = Object.entries(scores)
    .filter(([, score]) => score < 0.6)
    .sort(([, a], [, b]) => a - b)
    .map(([dim]) => dim);

  const recommendations: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    dimension: string;
  }> = [];

  if (weakDimensions.length === 0) {
    // No weak dimensions - return empty (caller should use pattern-based recommendations)
    return [];
  } else if (weakDimensions.length === 1) {
    // Single weak dimension: return top 2 MRs from that dimension
    const dim = weakDimensions[0];
    const mrs = dimensionMRs[dim] || [];
    recommendations.push(
      ...mrs.slice(0, 2).map(mr => ({ ...mr, dimension: dim }))
    );
  } else if (weakDimensions.length === 2) {
    // Two weak dimensions: return 1 MR from each
    weakDimensions.forEach(dim => {
      const mrs = dimensionMRs[dim] || [];
      if (mrs[0]) {
        recommendations.push({ ...mrs[0], dimension: dim });
      }
    });
  } else {
    // 3+ weak dimensions: return 1 MR from each of the weakest 2
    weakDimensions.slice(0, 2).forEach(dim => {
      const mrs = dimensionMRs[dim] || [];
      if (mrs[0]) {
        recommendations.push({ ...mrs[0], dimension: dim });
      }
    });
  }

  return recommendations;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine if user has sufficient behavioral data for pattern detection
 *
 * @param totalSessions - Total number of AI interaction sessions
 * @returns true if sufficient data exists, false if cold start needed
 */
export function hasSufficientBehavioralData(totalSessions: number): boolean {
  return totalSessions >= 5;
}

/**
 * Get appropriate pattern to display based on data availability
 *
 * @param assessmentScores - Assessment scores (if available)
 * @param detectedPattern - Detected behavioral pattern (if available)
 * @param totalSessions - Total session count
 * @returns Pattern to use and whether it's predicted or actual
 */
export function getEffectivePattern(
  assessmentScores: DimensionScores | null,
  detectedPattern: BehavioralPattern | null,
  totalSessions: number
): {
  pattern: BehavioralPattern;
  source: 'predicted' | 'detected' | 'default';
  confidence: 'low' | 'medium' | 'high';
} {
  if (hasSufficientBehavioralData(totalSessions) && detectedPattern) {
    return {
      pattern: detectedPattern,
      source: 'detected',
      confidence: 'high',
    };
  }

  if (assessmentScores) {
    return {
      pattern: predictPatternFromAssessment(assessmentScores),
      source: 'predicted',
      confidence: 'medium',
    };
  }

  // No data available - default to Pattern C (adaptive, neutral)
  return {
    pattern: 'C',
    source: 'default',
    confidence: 'low',
  };
}
