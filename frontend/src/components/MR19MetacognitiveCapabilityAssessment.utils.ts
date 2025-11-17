/**
 * MR19: Metacognitive Capability Assessment - Utilities
 *
 * Functions for:
 * - Assessing metacognitive dimensions (Planning, Monitoring, Evaluation, Regulation)
 * - Analyzing behavioral patterns
 * - Generating diagnostic profiles
 * - Creating personalized adaptation recommendations
 *
 * Based on Flavell's metacognitive framework:
 * - Planning: Goal setting and strategy selection
 * - Monitoring: Ongoing awareness and checking
 * - Evaluation: Assessing work quality and understanding
 * - Regulation: Adjusting strategies based on feedback
 */

export type AssessmentDimension = 'planning' | 'monitoring' | 'evaluation' | 'regulation';

export type BehaviorType = 'plan' | 'monitor' | 'evaluate' | 'regulate';

/**
 * Raw assessment scores for a dimension
 */
export interface DimensionAssessment {
  score: number; // 0-1
  evidence: string;
  indicators: string[];
  confidence: number; // 0-1, how confident we are in this score
}

/**
 * Detailed dimension information in profile
 */
export interface DimensionProfile {
  score: number;
  level: 'weak' | 'moderate' | 'strong';
  interpretation: string;
  behavioralMarkers: string[];
  supportNeeded: string;
}

/**
 * Complete metacognitive profile
 */
export interface MetacognitiveProfile {
  assessedAt: Date;
  dimensions: Record<AssessmentDimension, DimensionProfile>;
  overallInterpretation: string;
  topStrengths: string[];
  areasForGrowth: string[];
  confidenceLevel: number; // 0-1
  dataSource: 'behavioral' | 'self-report' | 'combined';
}

/**
 * Adaptation recommendation
 */
export interface DiagnosisRecommendation {
  title: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  features: string[];
  relatedMRs?: string[];
  expectedImpact: string;
}

/**
 * Assessment from behavior history
 */
export interface BehavioralAssessmentResult {
  planning: DimensionAssessment;
  monitoring: DimensionAssessment;
  evaluation: DimensionAssessment;
  regulation: DimensionAssessment;
}

/**
 * Assess metacognitive dimensions from behavioral history
 */
export function assessMetacognitiveDimensions(
  behaviorHistory: Array<{
    type: BehaviorType;
    count: number;
    effectiveness: number;
  }>
): BehavioralAssessmentResult {
  // Map behaviors to dimensions
  const dimensionBehaviors: Record<AssessmentDimension, BehaviorType[]> = {
    planning: ['plan'],
    monitoring: ['monitor'],
    evaluation: ['evaluate'],
    regulation: ['regulate'],
  };

  const results: BehavioralAssessmentResult = {
    planning: assessDimension('planning', behaviorHistory, dimensionBehaviors),
    monitoring: assessDimension('monitoring', behaviorHistory, dimensionBehaviors),
    evaluation: assessDimension('evaluation', behaviorHistory, dimensionBehaviors),
    regulation: assessDimension('regulation', behaviorHistory, dimensionBehaviors),
  };

  return results;
}

/**
 * Assess a single dimension based on behaviors
 */
function assessDimension(
  dimension: AssessmentDimension,
  behaviorHistory: Array<{ type: BehaviorType; count: number; effectiveness: number }>,
  dimensionBehaviors: Record<AssessmentDimension, BehaviorType[]>
): DimensionAssessment {
  const relevantBehaviors = behaviorHistory.filter(b =>
    dimensionBehaviors[dimension].includes(b.type)
  );

  if (relevantBehaviors.length === 0) {
    return {
      score: 0.5, // Default middle score
      evidence: `No behavioral data for ${dimension}`,
      indicators: [],
      confidence: 0.3,
    };
  }

  // Calculate score from frequency and effectiveness
  const totalCount = relevantBehaviors.reduce((sum, b) => sum + b.count, 0);
  const avgEffectiveness = relevantBehaviors.reduce((sum, b) => sum + b.effectiveness, 0) / relevantBehaviors.length;

  // Score = (frequency factor) * (effectiveness)
  const frequencyFactor = Math.min(totalCount / 10, 1); // Normalize to 0-1
  const score = frequencyFactor * avgEffectiveness;

  return {
    score,
    evidence: getEvidenceText(dimension, score, totalCount),
    indicators: getIndicators(dimension, score),
    confidence: Math.min(0.3 + (relevantBehaviors.length * 0.1), 0.95),
  };
}

/**
 * Get human-readable evidence text
 */
function getEvidenceText(dimension: AssessmentDimension, score: number, count: number): string {
  if (dimension === 'planning') {
    if (score >= 0.75) return `Strong planner: ${count}+ planning actions with high success rate`;
    if (score >= 0.5) return `Moderate planning: ${count} planning actions with mixed results`;
    return `Limited planning: Few planning attempts observed`;
  }

  if (dimension === 'monitoring') {
    if (score >= 0.75) return `Thorough monitor: ${count}+ verification checks with good catch rate`;
    if (score >= 0.5) return `Occasional checking: ${count} monitoring actions observed`;
    return `Minimal monitoring: Rarely checks progress or catches errors`;
  }

  if (dimension === 'evaluation') {
    if (score >= 0.75) return `Critical evaluator: ${count}+ quality assessments with sound judgment`;
    if (score >= 0.5) return `Selective evaluation: ${count} assessment actions observed`;
    return `Limited evaluation: Accepts outputs without critical review`;
  }

  if (dimension === 'regulation') {
    if (score >= 0.75) return `Flexible strategist: ${count}+ successful strategy adjustments`;
    if (score >= 0.5) return `Some adaptability: ${count} strategy changes observed`;
    return `Fixed approach: Uses same strategy regardless of results`;
  }

  return '';
}

/**
 * Get behavioral indicators for a dimension
 */
function getIndicators(dimension: AssessmentDimension, score: number): string[] {
  const indicators: Record<AssessmentDimension, Record<string, string[]>> = {
    planning: {
      strong: [
        'Creates detailed task breakdowns',
        'Identifies dependencies before starting',
        'Estimates time and resources accurately',
        'Reviews plan before execution',
      ],
      moderate: [
        'Sometimes outlines tasks',
        'Occasional forward thinking',
        'Basic time estimates',
      ],
      weak: [
        'Jumps straight into tasks',
        'Plans discovered mid-execution',
        'Frequent surprises and rework',
      ],
    },
    monitoring: {
      strong: [
        'Checks progress frequently',
        'Catches errors before completion',
        'Verifies understanding continuously',
        'Asks clarifying questions',
      ],
      moderate: [
        'Some spot-checking of work',
        'Occasional verification',
        'Some awareness of progress',
      ],
      weak: [
        'Minimal progress checking',
        'Errors discovered only in review',
        'Assumes understanding without verification',
      ],
    },
    evaluation: {
      strong: [
        'Compares outputs against criteria',
        'Identifies quality gaps',
        'Seeks alternative perspectives',
        'Makes evidence-based judgments',
      ],
      moderate: [
        'Basic quality checks',
        'Some comparative analysis',
        'Surface-level assessment',
      ],
      weak: [
        'Accepts outputs uncritically',
        'No comparative analysis',
        'Assumption-based judgment',
      ],
    },
    regulation: {
      strong: [
        'Adjusts approach based on feedback',
        'Tries alternative strategies',
        'Learns from mistakes',
        'Flexible goal adjustment',
      ],
      moderate: [
        'Some strategy variation',
        'Occasional adaptability',
        'Mixed learning from feedback',
      ],
      weak: [
        'Fixed approach regardless of results',
        'Resists strategy changes',
        'Repeats same mistakes',
      ],
    },
  };

  const level = score >= 0.75 ? 'strong' : score >= 0.5 ? 'moderate' : 'weak';
  return indicators[dimension][level] || [];
}

/**
 * Calculate complete metacognitive profile
 */
export function calculateProfile(options: {
  behavioral?: BehavioralAssessmentResult;
  selfReport?: Record<AssessmentDimension, number>;
  dataSource: 'behavioral' | 'self-report' | 'combined';
}): MetacognitiveProfile {
  const { behavioral, selfReport, dataSource } = options;

  // Determine final scores
  const dimensions: Record<AssessmentDimension, DimensionProfile> = {
    planning: calculateDimensionProfile('planning', behavioral, selfReport),
    monitoring: calculateDimensionProfile('monitoring', behavioral, selfReport),
    evaluation: calculateDimensionProfile('evaluation', behavioral, selfReport),
    regulation: calculateDimensionProfile('regulation', behavioral, selfReport),
  };

  // Calculate overall interpretation
  const scores = Object.values(dimensions).map(d => d.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const overallInterpretation = getOverallInterpretation(dimensions, avgScore);
  const topStrengths = getTopStrengths(dimensions);
  const areasForGrowth = getAreasForGrowth(dimensions);

  // Calculate confidence level
  const confidence = behavioral ? 0.8 : selfReport ? 0.6 : 0.5;

  return {
    assessedAt: new Date(),
    dimensions,
    overallInterpretation,
    topStrengths,
    areasForGrowth,
    confidenceLevel: confidence,
    dataSource,
  };
}

/**
 * Calculate profile for a single dimension
 */
function calculateDimensionProfile(
  dimension: AssessmentDimension,
  behavioral?: BehavioralAssessmentResult,
  selfReport?: Record<AssessmentDimension, number>
): DimensionProfile {
  let score = 0.5; // Default
  let confidence = 0.5;

  if (behavioral) {
    score = behavioral[dimension].score;
    confidence = behavioral[dimension].confidence;
  }

  if (selfReport && selfReport[dimension]) {
    // Convert self-report (1-5) to 0-1 scale
    const selfReportScore = (selfReport[dimension] - 1) / 4;
    if (behavioral) {
      // Average behavioral and self-report
      score = (score + selfReportScore) / 2;
    } else {
      score = selfReportScore;
    }
  }

  const level: 'weak' | 'moderate' | 'strong' =
    score >= 0.75 ? 'strong' : score >= 0.5 ? 'moderate' : 'weak';

  return {
    score,
    level,
    interpretation: getDimensionInterpretation(dimension, level),
    behavioralMarkers: getIndicators(dimension, score),
    supportNeeded: getSupportNeeded(dimension, level),
  };
}

/**
 * Get interpretation text for dimension level
 */
function getDimensionInterpretation(
  dimension: AssessmentDimension,
  level: 'weak' | 'moderate' | 'strong'
): string {
  const interpretations: Record<AssessmentDimension, Record<string, string>> = {
    planning: {
      strong: 'You excel at breaking down complex tasks and planning thoroughly',
      moderate: 'You plan adequately but could benefit from more structured approaches',
      weak: 'You tend to dive into tasks without much planning',
    },
    monitoring: {
      strong: 'You actively verify progress and catch errors proactively',
      moderate: 'You check your progress occasionally but could be more systematic',
      weak: 'You rarely monitor progress during execution',
    },
    evaluation: {
      strong: 'You critically assess quality and compare alternatives thoroughly',
      moderate: 'You evaluate work but sometimes accept it without deep analysis',
      weak: 'You tend to accept outputs without critical evaluation',
    },
    regulation: {
      strong: 'You flexibly adjust strategies based on what works',
      moderate: 'You adjust approaches sometimes but could be more adaptive',
      weak: 'You tend to stick with the same approach even when it\'s not working',
    },
  };

  return interpretations[dimension][level];
}

/**
 * Get support recommendations for dimension level
 */
function getSupportNeeded(dimension: AssessmentDimension, level: 'weak' | 'moderate' | 'strong'): string {
  const supports: Record<AssessmentDimension, Record<string, string>> = {
    planning: {
      strong: 'Light-touch scaffolding, you\'re already strong here',
      moderate: 'Occasional planning reminders and structure templates',
      weak: 'Strong planning support: task decomposition, step-by-step guides',
    },
    monitoring: {
      strong: 'Minimal support, you naturally catch errors',
      moderate: 'Regular check-in prompts and verification reminders',
      weak: 'Active monitoring support: continuous checking, progress visualization',
    },
    evaluation: {
      strong: 'You need minimal guidance on quality assessment',
      moderate: 'Evaluation frameworks and comparison tools',
      weak: 'Strong evaluation support: criteria checklists, quality comparisons',
    },
    regulation: {
      strong: 'You adapt naturally, minimal intervention needed',
      moderate: 'Suggestion of alternative approaches when stuck',
      weak: 'Strategy suggestions, alternative technique prompts, flexibility training',
    },
  };

  return supports[dimension][level];
}

/**
 * Get overall interpretation
 */
function getOverallInterpretation(
  dimensions: Record<AssessmentDimension, DimensionProfile>,
  avgScore: number
): string {
  if (avgScore >= 0.75) {
    return 'You have strong metacognitive skills across the board. You\'re likely an independent learner who carefully plans, monitors progress, evaluates critically, and adapts strategies. The system will provide light-touch support.';
  } else if (avgScore >= 0.5) {
    return 'You have moderate metacognitive skills. You\'re generally thoughtful but have some areas where more structured support would help. The system will provide targeted assistance in your weaker areas.';
  } else {
    return 'You have developing metacognitive skills. You\'d benefit significantly from structured support in thinking, planning, and evaluation. The system will provide substantial guidance to help you develop stronger habits.';
  }
}

/**
 * Get top strengths
 */
function getTopStrengths(dimensions: Record<AssessmentDimension, DimensionProfile>): string[] {
  return Object.entries(dimensions)
    .filter(([_, d]) => d.level === 'strong')
    .map(([name, _]) => {
      return name === 'planning'
        ? 'Structured task planning'
        : name === 'monitoring'
          ? 'Progress verification'
          : name === 'evaluation'
            ? 'Critical assessment'
            : 'Strategy flexibility';
    });
}

/**
 * Get areas for growth
 */
function getAreasForGrowth(dimensions: Record<AssessmentDimension, DimensionProfile>): string[] {
  return Object.entries(dimensions)
    .filter(([_, d]) => d.level === 'weak' || d.level === 'moderate')
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, 2)
    .map(([name, _]) => {
      return name === 'planning'
        ? 'Task decomposition and structured planning'
        : name === 'monitoring'
          ? 'Ongoing progress verification'
          : name === 'evaluation'
            ? 'Critical quality assessment'
            : 'Strategy flexibility and adaptation';
    });
}

/**
 * Get adaptation recommendations for the system
 */
export function getAdaptationRecommendations(profile: MetacognitiveProfile): DiagnosisRecommendation[] {
  const recommendations: DiagnosisRecommendation[] = [];

  // Planning recommendations
  if (profile.dimensions.planning.level !== 'strong') {
    recommendations.push({
      title: 'Enhanced Task Planning Support',
      priority: profile.dimensions.planning.level === 'weak' ? 'high' : 'medium',
      rationale: 'You benefit from structured guidance when breaking down complex tasks',
      features: [
        'Automatic task decomposition suggestions (MR1)',
        'Step-by-step workflow guidance',
        'Dependency identification',
        'Time estimation assistance',
      ],
      relatedMRs: ['MR1', 'MR8'],
      expectedImpact: 'Reduce rework and improve task completion rate',
    });
  }

  // Monitoring recommendations
  if (profile.dimensions.monitoring.level !== 'strong') {
    recommendations.push({
      title: 'Active Progress Verification',
      priority: profile.dimensions.monitoring.level === 'weak' ? 'high' : 'medium',
      rationale: 'Proactive checking helps you catch errors and misunderstandings early',
      features: [
        'Regular progress check-in prompts',
        'Automated error detection',
        'Understanding verification questions',
        'Progress visualization',
      ],
      relatedMRs: ['MR14', 'MR17'],
      expectedImpact: 'Catch errors earlier, improve output quality',
    });
  }

  // Evaluation recommendations
  if (profile.dimensions.evaluation.level !== 'strong') {
    recommendations.push({
      title: 'Guided Quality Evaluation',
      priority: profile.dimensions.evaluation.level === 'weak' ? 'high' : 'medium',
      rationale: 'Critical thinking tools help you assess work against clear standards',
      features: [
        'Quality assessment checklists',
        'Side-by-side output comparison (MR5)',
        'Evaluation criteria guidance',
        'Critical thinking prompts (MR12)',
        'Multiple perspective views (MR6)',
      ],
      relatedMRs: ['MR5', 'MR12', 'MR6'],
      expectedImpact: 'Improve decision-making, reduce uncritical acceptance',
    });
  }

  // Regulation recommendations
  if (profile.dimensions.regulation.level !== 'strong') {
    recommendations.push({
      title: 'Strategy Flexibility Training',
      priority: profile.dimensions.regulation.level === 'weak' ? 'high' : 'medium',
      rationale: 'Alternative approach suggestions help you get unstuck',
      features: [
        'Strategy suggestion when stuck',
        'Multi-variant generation to explore options',
        'Technique library and examples',
        'Adaptive recommendations (MR15)',
        'Role flexibility (MR4)',
      ],
      relatedMRs: ['MR5', 'MR15', 'MR4'],
      expectedImpact: 'Break out of ineffective patterns, try new approaches',
    });
  }

  // Add universal recommendations
  recommendations.push({
    title: 'Continuous Learning and Growth',
    priority: 'medium',
    rationale: 'Your metacognitive skills will improve over time with practice and feedback',
    features: [
      'Progress tracking on each dimension',
      'Periodic reassessment (every 50 tasks)',
      'Personalized strategy suggestions (MR15)',
      'Metacognitive capability dashboard',
    ],
    relatedMRs: ['MR15', 'MR19'],
    expectedImpact: 'Gradual improvement in thinking and learning habits',
  });

  return recommendations;
}

/**
 * Get dimension score from profile
 */
export function getDimensionScore(profile: MetacognitiveProfile, dimension: AssessmentDimension): number {
  return profile.dimensions[dimension].score;
}

/**
 * Update profile with new behavioral data
 */
export function updateProfileWithBehavior(
  currentProfile: MetacognitiveProfile,
  newBehaviors: Array<{ type: BehaviorType; count: number; effectiveness: number }>
): MetacognitiveProfile {
  // Recalculate assessment with combined data
  const updatedAssessment = assessMetacognitiveDimensions(newBehaviors);
  return calculateProfile({
    behavioral: updatedAssessment,
    dataSource: 'behavioral',
  });
}

export default {
  assessMetacognitiveDimensions,
  calculateProfile,
  getAdaptationRecommendations,
  getDimensionScore,
  updateProfileWithBehavior,
};
