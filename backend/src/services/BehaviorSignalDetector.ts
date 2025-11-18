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
    };
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
      { pattern: /多个|多个维度|综合|交叉/gi, weight: 1 },
      { pattern: /长|详细|完整/gi, weight: 0.5 },
      { pattern: /creative|complex|difficult/gi, weight: 1 },
    ];

    const wordCount = message.split(/\s+/).length;
    const wordComplexity = Math.min(wordCount / 30, 1); // normalize by ~30 words

    const indicatorWeight = complexityIndicators
      .filter(ind => ind.pattern.test(message))
      .reduce((sum, ind) => sum + ind.weight, 0);

    return Math.min(indicatorWeight + wordComplexity, 3);
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
}

export default new BehaviorSignalDetector();
