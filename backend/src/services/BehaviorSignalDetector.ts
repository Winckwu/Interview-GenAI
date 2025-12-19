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

/**
 * Session context for MR triggering (from MR-Triggering-Framework-Paper.md)
 * These signals require session-level tracking beyond single message analysis
 */
export interface SessionContext {
  userId: string;
  sessionId: string;
  sessionStartTime: Date;
  messageIndex: number;                   // Current message index (0-based)
  previousTrustScore?: number;            // Trust score from previous message
  currentTrustScore: number;              // Current calculated trust score
  unverifiedCount: number;                // Consecutive unverified responses
  isNewUser: boolean;                     // First session for this user
  previousTaskType?: string;              // Task type from previous message
  currentTaskType?: string;               // Current task type
  previousAiResponse?: string;            // Previous AI response (for modification detection)
  hasFailedBefore: boolean;               // Any previous rejection/failure in session
  aiConfidence?: number;                  // AI's confidence in current response
}

export interface BehavioralSignals {
  // ========== Planning signals (P1-P4) ==========
  taskDecompositionEvidence: number;      // P1: 0-3: evidence of breaking task into parts
  goalClarityScore: number;               // P2: 0-3: clarity of stated goals
  strategyMentioned: boolean;             // P3: Has user mentioned a strategy/approach
  preparationActions: string[];           // P4: Pre-task preparation mentioned
  preparationScore: number;               // P4: 0-3 normalized score

  // ========== Monitoring signals (M1-M3) ==========
  verificationAttempted: boolean;         // M2: Did user mention verification?
  qualityCheckMentioned: boolean;         // M2: Quality assurance indicators
  qualityCheckScore: number;              // M2: 0-3 normalized score
  contextAwarenessIndicator: number;      // M3: 0-3: awareness of task context/constraints

  // ========== Evaluation signals (E1-E3) ==========
  outputEvaluationPresent: boolean;       // E1: Did user evaluate AI output?
  outputEvaluationScore: number;          // E1: 0-3 normalized score
  reflectionDepth: number;                // E2: 0-3: depth of metacognitive reflection
  capabilityJudgmentShown: boolean;       // E3: Awareness of AI limitations?
  capabilityJudgmentScore: number;        // E3: 0-3 normalized score

  // ========== Regulation signals (R1-R2) ==========
  iterationCount: number;                 // R1: Number of refinements in history
  strategyAdjustmentScore: number;        // R1: 0-3 normalized score
  trustCalibrationEvidence: string[];     // R2: Evidence of trust calibration
  trustCalibrationScore: number;          // R2: 0-3 normalized score

  // ========== Task characteristics ==========
  taskComplexity: number;                 // 0-3: inferred task complexity
  aiRelianceDegree: number;               // 0-3: extent of AI reliance in request
  inputComplexity: number;                // 0-3: complexity/detail level of user input
  taskRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactors;

  // ========== Session context signals (NEW - from MR-Triggering-Framework-Paper) ==========
  messageLength: number;                  // Character count of current message
  messageIndex: number;                   // Index of message in session (0-based)
  sessionDuration: number;                // Minutes since session start

  // Trust tracking
  trustScore: number;                     // 0-100: current trust score
  trustChange: number;                    // % change from previous trust score
  unverifiedConsecutive: number;          // Count of consecutive unverified AI responses

  // User/session state
  isNewUser: boolean;                     // First session for this user
  isNewSession: boolean;                  // First message in session
  taskTypeChanged: boolean;               // Task type differs from previous

  // Content analysis
  modified: boolean;                      // User modified previous AI output
  hasFailedBefore: boolean;               // Previous AI response was rejected/failed
  hasUncertainty: boolean;                // AI response contains uncertainty markers
  aiConfidence: number;                   // 0-1: AI's confidence in response
  containsDecisions: boolean;             // Message contains decision points
  irreversibleAction: boolean;            // Task involves irreversible actions
  controversialClaim: boolean;            // Content contains controversial claims

  // Session lifecycle
  sessionEnding: boolean;                 // User indicated session end
  isMilestone: boolean;                   // Reached a learning milestone
}

export class BehaviorSignalDetector {
  /**
   * Detect all behavioral signals from a conversation turn
   * Enhanced with session context for MR triggering (MR-Triggering-Framework-Paper.md)
   *
   * @param currentTurn - Current conversation turn
   * @param history - Previous conversation turns
   * @param sessionContext - Optional session-level context for advanced signals
   */
  detectSignals(
    currentTurn: ConversationTurn,
    history: ConversationTurn[],
    sessionContext?: SessionContext
  ): BehavioralSignals {
    const userMsg = currentTurn.userMessage.toLowerCase();
    const originalMsg = currentTurn.userMessage;

    // Detect basic signals
    const preparationActions = this.detectPreparation(userMsg);
    const verificationAttempted = this.detectVerificationIntent(userMsg);
    const qualityCheckMentioned = this.detectQualityChecks(userMsg);
    const outputEvaluationPresent = this.detectOutputEvaluation(userMsg);
    const capabilityJudgmentShown = this.detectCapabilityAwareness(userMsg);
    const trustCalibrationEvidence = this.detectTrustCalibration(userMsg);
    const iterationCount = this.countIterations(history, currentTurn);

    // Calculate normalized scores (convert boolean/array to 0-3 scale)
    const preparationScore = Math.min(preparationActions.length, 3);
    const qualityCheckScore = this.calculateQualityCheckScore(userMsg, verificationAttempted, qualityCheckMentioned);
    const outputEvaluationScore = outputEvaluationPresent ? 2 : 0;
    const capabilityJudgmentScore = capabilityJudgmentShown ? 2 : 0;
    const trustCalibrationScore = Math.min(trustCalibrationEvidence.length, 3);
    const strategyAdjustmentScore = Math.min(Math.floor(iterationCount / 2), 3);

    // Session context signals (with defaults if not provided)
    const ctx = sessionContext || this.createDefaultSessionContext();
    const sessionDuration = this.calculateSessionDuration(ctx.sessionStartTime);
    const trustChange = ctx.previousTrustScore !== undefined
      ? ((ctx.currentTrustScore - ctx.previousTrustScore) / Math.max(ctx.previousTrustScore, 1)) * 100
      : 0;

    // Content analysis signals
    const modified = this.detectModification(userMsg, ctx.previousAiResponse);
    const hasUncertainty = this.detectUncertaintyInAI(currentTurn.aiResponse);
    const containsDecisions = this.detectDecisionPoints(userMsg);
    const irreversibleAction = this.detectIrreversibleAction(userMsg);
    const controversialClaim = this.detectControversialClaim(currentTurn.aiResponse);
    const sessionEnding = this.detectSessionEnding(userMsg);
    const isMilestone = this.detectMilestone(userMsg, iterationCount);

    return {
      // ========== Planning signals (P1-P4) ==========
      taskDecompositionEvidence: this.detectDecomposition(userMsg),
      goalClarityScore: this.detectGoalClarity(userMsg),
      strategyMentioned: this.detectStrategyMention(userMsg),
      preparationActions,
      preparationScore,

      // ========== Monitoring signals (M1-M3) ==========
      verificationAttempted,
      qualityCheckMentioned,
      qualityCheckScore,
      contextAwarenessIndicator: this.detectContextAwareness(userMsg),

      // ========== Evaluation signals (E1-E3) ==========
      outputEvaluationPresent,
      outputEvaluationScore,
      reflectionDepth: this.detectReflection(userMsg),
      capabilityJudgmentShown,
      capabilityJudgmentScore,

      // ========== Regulation signals (R1-R2) ==========
      iterationCount,
      strategyAdjustmentScore,
      trustCalibrationEvidence,
      trustCalibrationScore,

      // ========== Task characteristics ==========
      taskComplexity: this.inferTaskComplexity(userMsg),
      aiRelianceDegree: this.inferAIReliance(userMsg),
      inputComplexity: this.detectInputComplexity(originalMsg),
      ...this.assessTaskRisk(userMsg),

      // ========== Session context signals ==========
      messageLength: originalMsg.length,
      messageIndex: ctx.messageIndex,
      sessionDuration,

      // Trust tracking
      trustScore: ctx.currentTrustScore,
      trustChange,
      unverifiedConsecutive: ctx.unverifiedCount,

      // User/session state
      isNewUser: ctx.isNewUser,
      isNewSession: ctx.messageIndex === 0,
      taskTypeChanged: ctx.previousTaskType !== undefined && ctx.previousTaskType !== ctx.currentTaskType,

      // Content analysis
      modified,
      hasFailedBefore: ctx.hasFailedBefore,
      hasUncertainty,
      aiConfidence: ctx.aiConfidence ?? 0.7,
      containsDecisions,
      irreversibleAction,
      controversialClaim,

      // Session lifecycle
      sessionEnding,
      isMilestone,
    };
  }

  /**
   * Create default session context when not provided
   */
  private createDefaultSessionContext(): SessionContext {
    return {
      userId: 'unknown',
      sessionId: 'unknown',
      sessionStartTime: new Date(),
      messageIndex: 0,
      currentTrustScore: 70,
      unverifiedCount: 0,
      isNewUser: false,
      hasFailedBefore: false,
    };
  }

  /**
   * Calculate session duration in minutes
   */
  private calculateSessionDuration(startTime: Date): number {
    return Math.floor((Date.now() - startTime.getTime()) / 60000);
  }

  /**
   * Calculate quality check score (M2) as 0-3
   */
  private calculateQualityCheckScore(
    message: string,
    verificationAttempted: boolean,
    qualityCheckMentioned: boolean
  ): number {
    let score = 0;
    if (verificationAttempted) score += 1;
    if (qualityCheckMentioned) score += 1;

    // Additional quality indicators
    const systematicCheck = /逐字|逐句|仔细|详细|全面|系统|word.by.word|careful|thorough|systematic/gi.test(message);
    if (systematicCheck) score += 1;

    return Math.min(score, 3);
  }

  /**
   * Detect if user modified previous AI output
   */
  private detectModification(userMessage: string, previousAiResponse?: string): boolean {
    if (!previousAiResponse) return false;

    const modificationIndicators = [
      '修改', '改', '调整', '更新', '换', '替换',
      '不对', '错了', '有问题', '改一下',
      'modify', 'change', 'update', 'fix', 'wrong', 'incorrect'
    ];

    return modificationIndicators.some(ind => userMessage.includes(ind));
  }

  /**
   * Detect uncertainty markers in AI response
   */
  private detectUncertaintyInAI(aiResponse?: string): boolean {
    if (!aiResponse) return false;

    const uncertaintyMarkers = [
      '可能', '也许', '不确定', '大概', '或许', '估计',
      '建议验证', '需要确认', '仅供参考',
      'might', 'maybe', 'perhaps', 'uncertain', 'possibly',
      'I\'m not sure', 'please verify', 'for reference only'
    ];

    return uncertaintyMarkers.some(marker => aiResponse.toLowerCase().includes(marker));
  }

  /**
   * Detect decision points in message
   */
  private detectDecisionPoints(message: string): boolean {
    const decisionIndicators = [
      '选择', '决定', '采用', '使用', '方案', '选项',
      '应该', '是否', '要不要', '还是',
      'choose', 'decide', 'option', 'should', 'whether', 'or'
    ];

    return decisionIndicators.some(ind => message.includes(ind));
  }

  /**
   * Detect irreversible actions
   */
  private detectIrreversibleAction(message: string): boolean {
    const irreversibleIndicators = [
      '删除', '发布', '提交', '确认', '签署', '执行',
      '不可逆', '永久', '最终',
      'delete', 'publish', 'submit', 'confirm', 'sign', 'execute',
      'irreversible', 'permanent', 'final'
    ];

    return irreversibleIndicators.some(ind => message.includes(ind));
  }

  /**
   * Detect controversial claims in AI response
   */
  private detectControversialClaim(aiResponse?: string): boolean {
    if (!aiResponse) return false;

    const controversialIndicators = [
      '争议', '有人认为', '不同观点', '分歧',
      'controversial', 'debated', 'some argue', 'disputed',
      'opposing views', 'contentious'
    ];

    return controversialIndicators.some(ind => aiResponse.toLowerCase().includes(ind));
  }

  /**
   * Detect session ending intent
   */
  private detectSessionEnding(message: string): boolean {
    const endingIndicators = [
      '谢谢', '好的', '明白了', '结束', '完成',
      '就这样', '足够了', '可以了',
      'thanks', 'thank you', 'got it', 'done', 'finished',
      'that\'s all', 'enough', 'perfect'
    ];

    return endingIndicators.some(ind => message.includes(ind));
  }

  /**
   * Detect learning milestone
   */
  private detectMilestone(message: string, iterationCount: number): boolean {
    // Milestone if: multiple iterations completed + learning indicator
    const learningIndicators = [
      '学会了', '理解了', '明白了', '掌握了', '懂了',
      'learned', 'understand', 'got it', 'mastered'
    ];

    const hasLearningIndicator = learningIndicators.some(ind => message.includes(ind));
    return iterationCount >= 3 && hasLearningIndicator;
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
