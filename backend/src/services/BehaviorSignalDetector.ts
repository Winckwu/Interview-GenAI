/**
 * Behavior Signal Detector
 * Extracts 12-dimensional behavioral signals from conversation turns
 *
 * Maps to 12 metacognitive subprocesses:
 * Planning (P1-P4): task decomposition, goal clarity, strategy, resources
 * Monitoring (M1-M3): attention, verification, context awareness
 * Evaluation (E1-E3): output evaluation, reflection, capability judgment
 * Regulation (R1-R2): iteration, calibration
 */

export interface ConversationTurn {
  id: string;
  userMessage: string;
  aiResponse?: string;
  timestamp: Date;
  sessionId: string;
}

export interface RiskFactors {
  domainCriticality: number;       // 0-3: domain criticality (medical/legal/financial=3)
  consequenceSeverity: number;     // 0-3: consequence severity
  timeConstraint: boolean;         // time pressure indicator
  stakeholders: number;            // 0-3: number of stakeholders inferred
  isPublicFacing: boolean;         // public-facing task indicator
}

export interface BehavioralSignals {
  // Planning signals (P1-P4)
  taskDecompositionEvidence: number;      // 0-3: evidence of breaking task into parts
  goalClarityScore: number;               // 0-3: clarity of stated goals
  strategyMentioned: boolean;             // Has user mentioned a strategy/approach
  preparationActions: string[];           // Pre-task preparation mentioned

  // Monitoring signals (M1-M3)
  verificationAttempted: boolean;         // Did user mention verification?
  qualityCheckMentioned: boolean;         // Quality assurance indicators
  contextAwarenessIndicator: number;      // 0-3: awareness of task context/constraints

  // Evaluation signals (E1-E3)
  outputEvaluationPresent: boolean;       // Did user evaluate AI output?
  reflectionDepth: number;                // 0-3: depth of metacognitive reflection
  capabilityJudgmentShown: boolean;       // Awareness of AI limitations?

  // Regulation signals (R1-R2)
  iterationCount: number;                 // Number of refinements in history
  trustCalibrationEvidence: string[];     // Evidence of trust calibration

  // Additional signals
  taskComplexity: number;                 // 0-3: inferred task complexity
  aiRelianceDegree: number;               // 0-3: extent of AI reliance in request

  // ✨ NEW: Input quality assessment (added 2024-11-24 based on real data analysis)
  inputComplexity: number;                // 0-3: complexity/detail level of user input
                                          // Real data: 21.9% users had <30 char avg (low complexity)

  // ✨ Task risk assessment
  taskRiskLevel: 'low' | 'medium' | 'high' | 'critical';  // comprehensive risk level
  riskFactors: RiskFactors;               // detailed risk breakdown
}

export class BehaviorSignalDetector {
  /**
   * Detect all 12 behavioral signals from a single conversation turn
   */
  detectSignals(
    currentTurn: ConversationTurn,
    history: ConversationTurn[]
  ): BehavioralSignals {
    const userMsg = currentTurn.userMessage.toLowerCase();
    const prevTurns = history.map(t => t.userMessage.toLowerCase());

    return {
      // P1: Task Decomposition
      taskDecompositionEvidence: this.detectDecomposition(userMsg),

      // P2: Goal Clarity
      goalClarityScore: this.detectGoalClarity(userMsg),

      // P4: Strategy Mention
      strategyMentioned: this.detectStrategyMention(userMsg),

      // P3: Preparation Actions
      preparationActions: this.detectPreparation(userMsg),

      // M2: Verification Intent
      verificationAttempted: this.detectVerificationIntent(userMsg),

      // M1/M3: Quality Checks
      qualityCheckMentioned: this.detectQualityChecks(userMsg),

      // M3: Context Awareness
      contextAwarenessIndicator: this.detectContextAwareness(userMsg),

      // E1: Output Evaluation
      outputEvaluationPresent: this.detectOutputEvaluation(userMsg),

      // E2: Reflection
      reflectionDepth: this.detectReflection(userMsg),

      // E3: Capability Awareness
      capabilityJudgmentShown: this.detectCapabilityAwareness(userMsg),

      // R1: Iteration
      iterationCount: this.countIterations(history, currentTurn),

      // R2: Trust Calibration
      trustCalibrationEvidence: this.detectTrustCalibration(userMsg),

      // Additional features
      taskComplexity: this.inferTaskComplexity(userMsg),
      aiRelianceDegree: this.inferAIReliance(userMsg),

      // ✨ NEW: Input complexity assessment (2024-11-24)
      inputComplexity: this.detectInputComplexity(currentTurn.userMessage),

      // ✨ Task risk assessment
      ...this.assessTaskRisk(userMsg),
    };
  }

  /**
   * Detect input complexity based on message characteristics
   * Based on real data analysis: 21.9% users had <30 char avg (Pattern F indicator)
   * Returns: 0 (very short/simple) to 3 (detailed/complex)
   */
  private detectInputComplexity(message: string): number {
    const length = message.length;
    const wordCount = message.split(/\s+/).filter(w => w.length > 0).length;

    // Check for detail indicators
    const hasContext = /because|since|context|background|situation/i.test(message);
    const hasSpecifics = /specifically|exactly|for example|such as/i.test(message);
    const hasQuestion = /\?|how|what|why|when|where|which/i.test(message);
    const hasMultipleParts = /and also|additionally|moreover|furthermore|1\.|2\./i.test(message);

    let score = 0;

    // Length-based scoring (calibrated from real data: avg 68 chars)
    if (length < 30) score = 0;           // Very short (21.9% of real users)
    else if (length < 80) score = 1;       // Short
    else if (length < 150) score = 2;      // Medium
    else score = 3;                        // Detailed

    // Bonus for quality indicators
    if (hasContext) score = Math.min(score + 1, 3);
    if (hasSpecifics) score = Math.min(score + 1, 3);
    if (hasMultipleParts) score = Math.min(score + 1, 3);

    return score;
  }

  /**
   * P1: Detect task decomposition (breaking into subtasks)
   * Returns: 0 (no evidence) to 3 (strong evidence)
   */
  private detectDecomposition(message: string): number {
    const decompositionKeywords = [
      '首先', '然后', '接下来', '最后',
      '分成', '步骤', '阶段', '部分',
      '第', '个',
      'first', 'then', 'next', 'finally',
      'break down', 'step', 'stage', 'phase',
      'part', 'section'
    ];

    const structurePatterns = [
      /第[一二三四五]步/gi,
      /第\d+步/gi,
      /step\s*[1-5]/gi,
      /part\s*[a-e]/gi,
      /阶段[一二三]/gi,
    ];

    const keywordMatches = decompositionKeywords.filter(kw =>
      message.includes(kw)
    ).length;

    const hasStructure = structurePatterns.some(pattern =>
      pattern.test(message)
    );

    if (keywordMatches >= 3 && hasStructure) return 3; // ✓✓✓
    if (keywordMatches >= 2 || hasStructure) return 2;  // ✓✓
    if (keywordMatches >= 1) return 1;                  // ✓
    return 0;                                           // ✗
  }

  /**
   * P2: Detect clarity of stated goals
   * Returns: 0 (vague) to 3 (very specific)
   */
  private detectGoalClarity(message: string): number {
    const goalIndicators = [
      '我想', '我要', '目标是', '希望',
      '需要', '要求', '目的',
      'want', 'need', 'goal', 'objective',
      'should', 'must'
    ];

    const specificityIndicators = [
      /\d+\s*(字|词|页|分|行|个)/gi,  // 数字具体性
      /\d+\s*(words?|pages?|lines?|items?)/gi,
      /(准确|详细|具体)/gi,
      /(specific|detailed|exact|precise)/gi
    ];

    const hasGoal = goalIndicators.some(ind => message.includes(ind));
    const isSpecific = specificityIndicators.some(pattern => pattern.test(message));
    const hasCriteria = /标准|要求|条件|criteria|requirement|standard/gi.test(message);

    if (hasGoal && isSpecific && hasCriteria) return 3;
    if (hasGoal && (isSpecific || hasCriteria)) return 2;
    if (hasGoal) return 1;
    return 0;
  }

  /**
   * P4: Detect mention of strategy/approach
   */
  private detectStrategyMention(message: string): boolean {
    const strategyKeywords = [
      '方法', '策略', '方案', '思路',
      '从...出发', '基于', '根据',
      'approach', 'method', 'strategy', 'plan',
      'based on', 'following', 'using'
    ];

    return strategyKeywords.some(kw => message.includes(kw));
  }

  /**
   * P3: Detect preparation actions
   */
  private detectPreparation(message: string): string[] {
    const preparationIndicators = [
      { pattern: /已经|已|曾|之前|之后|读了|查了|了解/gi, action: 'prior_research' },
      { pattern: /列了|整理了|做了|准备了/gi, action: 'content_preparation' },
      { pattern: /反思|思考|分析|研究/gi, action: 'analysis' },
      { pattern: /背景|经验|知识/gi, action: 'background_knowledge' },
    ];

    const actions = preparationIndicators
      .filter(ind => ind.pattern.test(message))
      .map(ind => ind.action);

    return actions;
  }

  /**
   * M2: Detect verification intent
   */
  private detectVerificationIntent(message: string): boolean {
    const verificationPhrases = [
      '检查', '验证', '确认', '对比', '核对',
      '检验', '验算', '核实',
      'check', 'verify', 'confirm', 'compare', 'validate',
      'double-check', 'review'
    ];

    return verificationPhrases.some(phrase =>
      message.includes(phrase)
    );
  }

  /**
   * M1/M3: Detect quality checks
   */
  private detectQualityChecks(message: string): boolean {
    const qualityKeywords = [
      '准确', '正确', '错误', '质量',
      '语法', '拼写', '格式',
      '有问题', '不对',
      'accurate', 'correct', 'error', 'quality',
      'grammar', 'spelling', 'format', 'issue'
    ];

    return qualityKeywords.some(kw => message.includes(kw));
  }

  /**
   * M3: Detect context awareness
   * Returns: 0 (ignores context) to 3 (very context-aware)
   */
  private detectContextAwareness(message: string): number {
    const contextIndicators = [
      { pattern: /虑|注意|考虑|考量|背景|环境/gi, weight: 1 },
      { pattern: /限制|约束|条件|特殊情况|情境/gi, weight: 1 },
      { pattern: /不同的|取决于|根据|具体/gi, weight: 1 },
      { pattern: /constraint|context|situatio|depends|varies/gi, weight: 1 },
    ];

    const matches = contextIndicators.filter(ind => ind.pattern.test(message)).length;
    return Math.min(matches, 3);
  }

  /**
   * E1: Detect output evaluation
   */
  private detectOutputEvaluation(message: string): boolean {
    const evaluationPhrases = [
      '评价', '评估', '觉得', '看起来',
      '有几个', '问题', '改进',
      'evaluate', 'assess', 'think', 'seems',
      'issue', 'improve', 'fix'
    ];

    return evaluationPhrases.some(phrase => message.includes(phrase));
  }

  /**
   * E2: Detect reflection depth
   * Returns: 0 (none) to 3 (deep)
   */
  private detectReflection(message: string): number {
    const reflectionIndicators = [
      { pattern: /为什么|怎样|如何|原因|理由/gi, weight: 2 },
      { pattern: /理解|学到|意识到|发现|明白/gi, weight: 1 },
      { pattern: /思考|反思|想想|琢磨/gi, weight: 1 },
      { pattern: /why|how|learn|understand|realize/gi, weight: 1 },
    ];

    const weight = reflectionIndicators
      .filter(ind => ind.pattern.test(message))
      .reduce((sum, ind) => sum + ind.weight, 0);

    return Math.min(weight, 3);
  }

  /**
   * E3: Detect capability awareness
   */
  private detectCapabilityAwareness(message: string): boolean {
    const awarenessIndicators = [
      'AI可能',  'AI不太', '可能有错', '不确定',
      '可能不准确', '需要核实', '有局限',
      'AI might', 'may be wrong', 'not sure',
      'uncertain', 'limitation', 'could be inaccurate'
    ];

    return awarenessIndicators.some(indicator =>
      message.includes(indicator)
    );
  }

  /**
   * R1: Count iterations in conversation history
   */
  private countIterations(history: ConversationTurn[], currentTurn: ConversationTurn): number {
    // Count messages that indicate refinement/iteration
    const refinementKeywords = [
      '再', '重新', '改', '调整', '修改',
      'again', 'revise', 'modify', 'adjust', 'refine'
    ];

    return history.filter(turn =>
      refinementKeywords.some(kw => turn.userMessage.includes(kw))
    ).length;
  }

  /**
   * R2: Detect trust calibration evidence
   */
  private detectTrustCalibration(message: string): string[] {
    const calibrationIndicators = [
      { pattern: /靠得住|不靠谱|信任|怀疑/gi, type: 'trust_judgment' },
      { pattern: /以前|之前|经验告诉|一般都/gi, type: 'historical_reference' },
      { pattern: /这个任务|这类/gi, type: 'task_type_awareness' },
      { pattern: /可以接受|需要改进|有问题/gi, type: 'calibration_action' },
    ];

    return calibrationIndicators
      .filter(ind => ind.pattern.test(message))
      .map(ind => ind.type);
  }

  /**
   * Infer task complexity from message characteristics
   */
  private inferTaskComplexity(message: string): number {
    const complexityIndicators = [
      { pattern: /复杂|难|困难|不容易/gi, weight: 1 },
      { pattern: /多个|多种|综合|交叉|集成/gi, weight: 1 },
      { pattern: /长|详细|完整|全面/gi, weight: 0.5 },
      { pattern: /creative|complex|difficult/gi, weight: 1 },
      { pattern: /系统|平台|应用|网站|项目/gi, weight: 0.5 },
      { pattern: /包含|需要|功能|模块|组件/gi, weight: 0.3 },
    ];

    // Count characters properly for Chinese text (not whitespace-based)
    const charCount = message.replace(/\s/g, '').length;
    const charComplexity = Math.min(charCount / 50, 1); // normalize by ~50 chars

    // Count enumerated items (Chinese 、 or commas) - indicates multiple features
    const enumCount = (message.match(/、|，/g) || []).length;
    const enumComplexity = Math.min(enumCount * 0.3, 1.5); // each item adds 0.3, max 1.5

    const indicatorWeight = complexityIndicators
      .filter(ind => ind.pattern.test(message))
      .reduce((sum, ind) => sum + ind.weight, 0);

    return Math.min(indicatorWeight + charComplexity + enumComplexity, 3);
  }

  /**
   * Infer degree of AI reliance in request
   * Returns: 0 (independent) to 3 (full dependence)
   */
  private inferAIReliance(message: string): number {
    // Low reliance: user mentions prior work, decomposition, verification
    const lowRelianceKeywords = [
      '我', '我自己', '我负责', '我已经',
      '我会', '自己', '独立'
    ];

    // High reliance: direct requests for complete solutions
    const highRelianceKeywords = [
      '帮我', '给我', '写给', '直接',
      '完整', '全部', '所有',
      'help me', 'give me', 'write', 'complete', 'all'
    ];

    const hasLowReliance = lowRelianceKeywords.some(kw => message.includes(kw));
    const hasHighReliance = highRelianceKeywords.some(kw => message.includes(kw));

    if (hasLowReliance) return 0;
    if (hasHighReliance) return 3;
    if (hasHighReliance && !hasLowReliance) return 2;
    return 1; // neutral
  }

  /**
   * ✨ NEW: Assess task risk level based on multiple factors
   * Returns: { taskRiskLevel, riskFactors }
   */
  private assessTaskRisk(message: string): {
    taskRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: RiskFactors;
  } {
    // 1. Detect domain criticality
    const domainCriticality = this.detectDomainCriticality(message);

    // 2. Detect consequence severity
    const consequenceSeverity = this.detectConsequenceSeverity(message);

    // 3. Detect time constraints
    const timeConstraint = this.detectTimeConstraint(message);

    // 4. Infer stakeholders
    const stakeholders = this.inferStakeholders(message);

    // 5. Detect public-facing
    const isPublicFacing = this.detectPublicFacing(message);

    const riskFactors: RiskFactors = {
      domainCriticality,
      consequenceSeverity,
      timeConstraint,
      stakeholders,
      isPublicFacing
    };

    // 6. Calculate comprehensive risk score
    const riskScore = this.calculateRiskScore(riskFactors);

    // 7. Classify risk level
    let taskRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 9) taskRiskLevel = 'critical';
    else if (riskScore >= 6) taskRiskLevel = 'high';
    else if (riskScore >= 3) taskRiskLevel = 'medium';
    else taskRiskLevel = 'low';

    return { taskRiskLevel, riskFactors };
  }

  /**
   * Detect domain criticality (medical/legal/financial/safety)
   * Returns: 0-3
   */
  private detectDomainCriticality(message: string): number {
    const criticalDomains = {
      medical: ['medical', 'diagnosis', 'treatment', 'patient', 'health', 'disease', '症状', '诊断', '治疗', '病人'],
      legal: ['legal', 'contract', 'lawsuit', 'compliance', 'regulation', '法律', '合同', '诉讼', '法规'],
      financial: ['financial', 'investment', 'tax', 'audit', 'accounting', '财务', '投资', '税务', '审计'],
      safety: ['safety', 'risk', 'hazard', 'accident', 'critical', '安全', '风险', '危险', '事故']
    };

    let score = 0;
    Object.values(criticalDomains).forEach(keywords => {
      if (keywords.some(kw => message.includes(kw))) {
        score += 1;
      }
    });

    return Math.min(score, 3);
  }

  /**
   * Detect consequence severity
   * Returns: 0-3
   */
  private detectConsequenceSeverity(message: string): number {
    const severityIndicators = [
      { keywords: ['critical', 'essential', 'must', 'important', '关键', '重要', '必须'], score: 1 },
      { keywords: ['impact', 'consequence', 'affect', 'loss', '影响', '后果', '损失'], score: 1 },
      { keywords: ['life', 'health', 'harm', 'damage', '生命', '健康', '损害'], score: 2 },
      { keywords: ['irreversible', 'permanent', 'fatal', 'catastrophic', '不可逆', '永久', '致命'], score: 3 }
    ];

    let maxScore = 0;
    severityIndicators.forEach(indicator => {
      if (indicator.keywords.some(kw => message.includes(kw))) {
        maxScore = Math.max(maxScore, indicator.score);
      }
    });

    return maxScore;
  }

  /**
   * Detect time constraints/urgency
   * Returns: boolean
   */
  private detectTimeConstraint(message: string): boolean {
    const timeKeywords = [
      'urgent', 'asap', 'immediately', 'today', 'deadline', 'rush', 'emergency',
      '紧急', '急', '马上', '立即', '今天', '明天', '截止'
    ];

    return timeKeywords.some(kw => message.includes(kw));
  }

  /**
   * Infer number of stakeholders
   * Returns: 0-3
   */
  private inferStakeholders(message: string): number {
    const stakeholderIndicators = [
      { keywords: ['team', 'organization', 'group', '团队', '组织'], count: 1 },
      { keywords: ['client', 'user', 'customer', 'users', '客户', '用户'], count: 2 },
      { keywords: ['public', 'society', 'community', 'citizens', '公众', '大众', '社会'], count: 3 }
    ];

    let maxCount = 0;
    stakeholderIndicators.forEach(indicator => {
      if (indicator.keywords.some(kw => message.includes(kw))) {
        maxCount = Math.max(maxCount, indicator.count);
      }
    });

    return maxCount;
  }

  /**
   * Detect if task is public-facing
   * Returns: boolean
   */
  private detectPublicFacing(message: string): boolean {
    const publicKeywords = [
      'publish', 'public', 'release', 'advertise', 'display', 'announcement',
      '发布', '公开', '宣传', '广告', '展示', '公告'
    ];

    return publicKeywords.some(kw => message.includes(kw));
  }

  /**
   * Calculate comprehensive risk score
   * Returns: 0-12
   */
  private calculateRiskScore(factors: RiskFactors): number {
    let score = 0;

    // Domain criticality (0-3)
    score += factors.domainCriticality;

    // Consequence severity (0-3)
    score += factors.consequenceSeverity;

    // Time constraint (+2)
    if (factors.timeConstraint) score += 2;

    // Stakeholders (0-3)
    score += factors.stakeholders;

    // Public-facing (+1)
    if (factors.isPublicFacing) score += 1;

    return score;
  }
}

export default new BehaviorSignalDetector();
