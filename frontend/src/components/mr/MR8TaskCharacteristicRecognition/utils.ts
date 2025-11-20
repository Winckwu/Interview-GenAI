/**
 * MR8: Task Characteristic Recognition - Utilities
 *
 * Functions for:
 * - Detecting task type (coding, writing, analysis, creative, research, design, planning, review)
 * - Estimating criticality level (low/medium/high)
 * - Assessing user familiarity (familiar/moderate/unfamiliar)
 * - Determining time pressure (low/medium/high)
 * - Calculating task complexity (1-10)
 * - Generating adaptive recommendations
 * - Creating comprehensive task profiles
 */

export type TaskType = 'coding' | 'writing' | 'analysis' | 'creative' | 'research' | 'design' | 'planning' | 'review';

export interface TaskCharacteristics {
  type: TaskType;
  criticality: 'low' | 'medium' | 'high';
  familiarity: 'familiar' | 'moderate' | 'unfamiliar';
  timePressure: 'low' | 'medium' | 'high';
  complexity: number; // 1-10
  confidence: number; // 0-1
}

export interface AdaptationRecommendation {
  id: string;
  component: 'agency-control' | 'iteration-support' | 'verification' | 'trust-calibration' | 'strategy-guide' | 'reflection';
  title: string;
  description: string;
  rationale: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
  appliesTo: TaskType[];
}

/**
 * Main analysis function: Detect all task characteristics
 */
export async function analyzeTaskCharacteristics(
  taskDescription: string
): Promise<TaskCharacteristics> {
  const type = detectTaskType(taskDescription);
  const criticality = estimateCriticality(taskDescription);
  const familiarity = estimateFamiliarity(taskDescription);
  const timePressure = estimateTimePressure(taskDescription);
  const complexity = estimateComplexity(taskDescription);
  const confidence = calculateConfidence(taskDescription);

  return {
    type,
    criticality,
    familiarity,
    timePressure,
    complexity,
    confidence
  };
}

/**
 * Detect task type based on keywords and context
 */
export function detectTaskType(description: string): TaskType {
  const lowerDesc = description.toLowerCase();

  // Coding keywords
  if (
    /code|program|implement|function|class|debug|algorithm|script|api|database/i.test(
      lowerDesc
    )
  ) {
    return 'coding';
  }

  // Writing keywords
  if (
    /essay|article|paper|blog|story|narrative|documentation|report|email|message|letter/i.test(
      lowerDesc
    )
  ) {
    return 'writing';
  }

  // Analysis keywords
  if (
    /analyze|compare|evaluate|assess|metrics|statistics|data|findings|conclusion|summary/i.test(
      lowerDesc
    )
  ) {
    return 'analysis';
  }

  // Creative keywords
  if (
    /create|design|brainstorm|conceptualize|imagine|generate|artistic|creative|concept|vision/i.test(
      lowerDesc
    )
  ) {
    return 'creative';
  }

  // Research keywords
  if (
    /research|investigate|explore|study|literature|evidence|sources|findings|experiment|discover/i.test(
      lowerDesc
    )
  ) {
    return 'research';
  }

  // Design keywords
  if (
    /design|layout|ui|ux|visual|interface|mockup|prototype|color|typography|wireframe/i.test(
      lowerDesc
    )
  ) {
    return 'design';
  }

  // Planning keywords
  if (
    /plan|organize|structure|schedule|roadmap|strategy|goals|objectives|timeline|milestone/i.test(
      lowerDesc
    )
  ) {
    return 'planning';
  }

  // Review keywords
  if (
    /review|edit|check|proofread|revise|feedback|critique|assess|quality|verification/i.test(
      lowerDesc
    )
  ) {
    return 'review';
  }

  // Default
  return 'planning';
}

/**
 * Estimate task criticality based on keywords
 */
export function estimateCriticality(description: string): 'low' | 'medium' | 'high' {
  const lowerDesc = description.toLowerCase();

  // High criticality indicators
  if (/exam|interview|professional|job|submit|publish|deadline|production|client|crucial|critical|important/i.test(lowerDesc)) {
    return 'high';
  }

  // Low criticality indicators
  if (/practice|learning|experiment|exploration|brainstorm|draft|personal|hobby|fun/i.test(lowerDesc)) {
    return 'low';
  }

  // Default to medium
  return 'medium';
}

/**
 * Estimate user's familiarity with the task domain
 */
export function estimateFamiliarity(description: string): 'familiar' | 'moderate' | 'unfamiliar' {
  const lowerDesc = description.toLowerCase();

  // Unfamiliar indicators
  if (/new|learn|first|never|unfamiliar|unknown|strange|different|novel|never done/i.test(lowerDesc)) {
    return 'unfamiliar';
  }

  // Familiar indicators
  if (/usual|typical|normal|routine|regular|often|always|familiar|know|experienced/i.test(lowerDesc)) {
    return 'familiar';
  }

  // Default to moderate
  return 'moderate';
}

/**
 * Estimate time pressure
 */
export function estimateTimePressure(description: string): 'low' | 'medium' | 'high' {
  const lowerDesc = description.toLowerCase();

  // High time pressure indicators
  if (/urgent|asap|today|now|rush|quick|emergency|deadline today|within hours|immediately|quick turnaround/i.test(lowerDesc)) {
    return 'high';
  }

  // Low time pressure indicators
  if (/plenty of time|no rush|take your time|weeks|months|explore|thoroughly|careful|no deadline|flexible/i.test(lowerDesc)) {
    return 'low';
  }

  // Default to medium
  return 'medium';
}

/**
 * Estimate task complexity (1-10)
 */
export function estimateComplexity(description: string): number {
  const lowerDesc = description.toLowerCase();
  let complexity = 5; // Start at middle

  // Factors that increase complexity
  const complexityIncreators = [
    { pattern: /multiple|many|complex|intricate/, increase: 1 },
    { pattern: /integrate|combine|merge|connect/, increase: 1 },
    { pattern: /optimization|performance|scale/, increase: 1 },
    { pattern: /edge case|exception|error handling/, increase: 0.5 },
    { pattern: /research|investigate|explore/, increase: 1 },
    { pattern: /novel|new|untried|experimental/, increase: 1 }
  ];

  complexityIncreators.forEach(({ pattern, increase }) => {
    if (pattern.test(lowerDesc)) {
      complexity += increase;
    }
  });

  // Factors that decrease complexity
  const complexityDecreasors = [
    { pattern: /simple|easy|basic|straightforward/, decrease: 1 },
    { pattern: /single|one|focused/, decrease: 1 },
    { pattern: /routine|standard|template/, decrease: 1 }
  ];

  complexityDecreasors.forEach(({ pattern, decrease }) => {
    if (pattern.test(lowerDesc)) {
      complexity -= decrease;
    }
  });

  // Clamp to 1-10
  return Math.max(1, Math.min(10, Math.round(complexity)));
}

/**
 * Calculate confidence score for analysis
 */
function calculateConfidence(description: string): number {
  let confidence = 0.6; // Base confidence

  // More detailed description = higher confidence
  if (description.length > 100) confidence += 0.15;
  if (description.length > 200) confidence += 0.1;
  if (description.length > 300) confidence += 0.05;

  // Specific keywords = higher confidence
  const specificKeywords = /deadline|deadline:\s*\d+|time:|goal:|objective:|constraint:|requirement:/i;
  if (specificKeywords.test(description)) confidence += 0.1;

  return Math.min(confidence, 0.95);
}

/**
 * Calculate complete task profile
 */
export function calculateTaskProfile(
  characteristics: TaskCharacteristics,
  taskDescription: string
): any {
  const recommendations = generateAdaptationRecommendations({
    ...characteristics,
    criticality: characteristics.criticality,
    familiarity: characteristics.familiarity,
    timePressure: characteristics.timePressure
  } as any);

  const suggestedInterventionLevel = determineSuggestedIntervention(
    characteristics.criticality,
    characteristics.familiarity,
    characteristics.timePressure
  );

  const riskFactors = identifyRiskFactors(characteristics);

  return {
    taskDescription,
    detectedType: characteristics.type,
    criticality: characteristics.criticality,
    familiarity: characteristics.familiarity,
    timePressure: characteristics.timePressure,
    estimatedComplexity: characteristics.complexity,
    detectionConfidence: characteristics.confidence,
    recommendations,
    suggestedInterventionLevel,
    riskFactors
  };
}

/**
 * Determine suggested AI intervention level
 */
function determineSuggestedIntervention(
  criticality: string,
  familiarity: string,
  timePressure: string
): 'passive' | 'suggestive' | 'proactive' {
  // High criticality + familiar domain = passive (user is expert, doesn't need much help)
  if (criticality === 'high' && familiarity === 'familiar') {
    return 'passive';
  }

  // High time pressure + unfamiliar = proactive (urgent and need help)
  if (timePressure === 'high' && familiarity === 'unfamiliar') {
    return 'proactive';
  }

  // Unfamiliar domain = proactive (need more support)
  if (familiarity === 'unfamiliar') {
    return 'proactive';
  }

  // Low time pressure + familiar = passive (can take time, knows what to do)
  if (timePressure === 'low' && familiarity === 'familiar') {
    return 'passive';
  }

  // Default to balanced
  return 'suggestive';
}

/**
 * Identify risk factors based on characteristics
 */
function identifyRiskFactors(characteristics: TaskCharacteristics): string[] {
  const risks: string[] = [];

  // High criticality + unfamiliar = needs verification
  if (
    characteristics.criticality === 'high' &&
    characteristics.familiarity === 'unfamiliar'
  ) {
    risks.push('🔴 High-stakes work in unfamiliar domain - Verify AI outputs carefully');
  }

  // High complexity + high time pressure = risky
  if (characteristics.complexity >= 8 && characteristics.timePressure === 'high') {
    risks.push('🟠 Complex task + time pressure - May need to sacrifice quality for speed');
  }

  // High time pressure + low confidence = risky
  if (characteristics.timePressure === 'high' && characteristics.confidence < 0.6) {
    risks.push('🟡 Urgent task with unclear requirements - Ask clarifying questions first');
  }

  // Unfamiliar + complex + medium criticality = learning opportunity
  if (
    characteristics.familiarity === 'unfamiliar' &&
    characteristics.complexity >= 6 &&
    characteristics.criticality === 'medium'
  ) {
    risks.push(
      '💡 Good learning opportunity - Use this as a chance to build new skills'
    );
  }

  return risks;
}

/**
 * Generate adaptation recommendations based on task profile
 */
export function generateAdaptationRecommendations(
  taskProfile: any
): AdaptationRecommendation[] {
  const recommendations: AdaptationRecommendation[] = [];
  const { type, criticality, familiarity, timePressure, complexity } = taskProfile;

  // Recommendation 1: Agency Control
  if (criticality === 'high') {
    recommendations.push({
      id: 'rec-agency-high-crit',
      component: 'agency-control',
      title: 'Increase Approval Requirements',
      description:
        'Require manual approval for all significant AI suggestions due to high task criticality',
      rationale:
        'High-stakes work needs human decision-making. AI should not auto-execute changes.',
      expectedImpact: 'Reduced risk of serious errors; increased confidence in final output',
      priority: 'high',
      appliesTo: type ? [type] : []
    });
  }

  // Recommendation 2: Verification
  if (criticality === 'high' || familiarity === 'unfamiliar') {
    recommendations.push({
      id: 'rec-verify-unfamiliar',
      component: 'verification',
      title: 'Enable Verification Tools',
      description: 'Use verification tools (syntax check, fact-checking, code testing, etc.)',
      rationale:
        "Unfamiliar domains and high-stakes work need verification to catch mistakes early.",
      expectedImpact: 'Catch errors before they become serious; build confidence in outputs',
      priority: criticality === 'high' ? 'high' : 'medium',
      appliesTo: type ? [type] : []
    });
  }

  // Recommendation 3: Iteration Support
  if (timePressure === 'low') {
    recommendations.push({
      id: 'rec-iteration-low-pressure',
      component: 'iteration-support',
      title: 'Enable Iteration Features',
      description: 'Use branching and variant exploration for thorough refinement',
      rationale:
        'Low time pressure allows for exploring multiple approaches and thorough iteration.',
      expectedImpact: 'Higher quality outputs; deeper learning and skill development',
      priority: 'medium',
      appliesTo: type ? [type] : []
    });
  }

  // Recommendation 4: Strategy Guidance
  if (familiarity === 'unfamiliar') {
    recommendations.push({
      id: 'rec-strategy-unfamiliar',
      component: 'strategy-guide',
      title: 'Learn Recommended Strategies',
      description:
        'Review metacognitive strategies suited to unfamiliar domains (research, exploration, verification)',
      rationale:
        'New domains require different approaches. Learn strategies for successful exploration.',
      expectedImpact: 'More effective task execution; faster learning curve',
      priority: 'high',
      appliesTo: type ? [type] : []
    });
  }

  // Recommendation 5: Trust Calibration
  if (complexity >= 7) {
    recommendations.push({
      id: 'rec-trust-complex',
      component: 'trust-calibration',
      title: 'Calibrate Trust Carefully',
      description:
        'For complex tasks, verify confidence scores and scrutinize low-confidence outputs',
      rationale:
        'Complex tasks have higher error rates. Treat AI confidence scores as guides, not certainties.',
      expectedImpact: 'Better error detection; appropriate skepticism for complex work',
      priority: 'high',
      appliesTo: type ? [type] : []
    });
  }

  // Recommendation 6: Reflection
  if (timePressure === 'low' && criticality === 'high') {
    recommendations.push({
      id: 'rec-reflection-high-stakes',
      component: 'reflection',
      title: 'Post-Task Reflection',
      description: 'After completion, reflect on what you learned and what AI contributed',
      rationale:
        'High-stakes, well-paced work is ideal for metacognitive reflection and learning.',
      expectedImpact: 'Deeper learning; awareness of your AI collaboration skills',
      priority: 'medium',
      appliesTo: type ? [type] : []
    });
  }

  // Default recommendation if none generated
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-balanced',
      component: 'agency-control',
      title: 'Use Balanced Intervention',
      description: 'Use suggestive AI mode with spot-check verification',
      rationale: 'This task has balanced risk and familiarity. A moderate approach works well.',
      expectedImpact: 'Efficiency with reasonable safety; good learning opportunity',
      priority: 'medium',
      appliesTo: type ? [type] : []
    });
  }

  return recommendations;
}

export default {
  analyzeTaskCharacteristics,
  detectTaskType,
  estimateCriticality,
  estimateFamiliarity,
  estimateTimePressure,
  estimateComplexity,
  generateAdaptationRecommendations,
  calculateTaskProfile
};
