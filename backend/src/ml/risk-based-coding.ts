/**
 * Risk-Based Multi-Pattern Interview Coding
 *
 * Key Insight: Users exhibit different metacognitive patterns depending on task risk level.
 * Main pattern = pattern exhibited in HIGH-RISK tasks (academic papers, core code, critical decisions)
 *
 * Based on empirical observation:
 * - I001: Low-risk email (Pattern F) → High-risk paper writing (Pattern A)
 * - I016: Low-risk basic code (Pattern F) → High-risk dangerous commands (Pattern D)
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

type EvidenceStrength = 0 | 1 | 2 | 3;
type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type RiskLevel = 'high' | 'low';
type Confidence = 'high' | 'moderate' | 'low';

interface TaskScenario {
  taskDescription: string;
  riskLevel: RiskLevel;
  subprocessScores: SubprocessScores;
  totalScore: number;
  pattern: Pattern;
  confidence: Confidence;
  evidenceQuotes: string[];
}

interface SubprocessScores {
  p1_task_decomposition: EvidenceStrength;
  p2_goal_setting: EvidenceStrength;
  p3_strategy_selection: EvidenceStrength;
  p4_resource_planning: EvidenceStrength;
  m1_progress_monitoring: EvidenceStrength;
  m2_quality_checking: EvidenceStrength;
  m3_context_monitoring: EvidenceStrength;
  e1_result_evaluation: EvidenceStrength;
  e2_learning_reflection: EvidenceStrength;
  e3_capability_judgment: EvidenceStrength;
  r1_strategy_adjustment: EvidenceStrength;
  r2_trust_calibration: EvidenceStrength;
}

interface InterviewCoding {
  interviewId: string;
  scenarios: TaskScenario[];
  primaryPattern: Pattern;
  primaryPatternConfidence: Confidence;
  highRiskScenarios: TaskScenario[];
  lowRiskScenarios: TaskScenario[];
  overallScore: number;
}

// ============================================================================
// Risk Classification
// ============================================================================

const HIGH_RISK_KEYWORDS = [
  // Academic/Research
  '论文', '学术', '引用', 'paper', 'academic', 'citation', 'publication', 'thesis', 'dissertation',
  // Code/Technical
  '核心代码', '算法', '生产环境', 'production', 'algorithm', 'core code', 'deployment', '删除', 'delete', 'rm -rf',
  // Critical decisions
  '财务', '法律', '医疗', 'financial', 'legal', 'medical', 'compliance',
  // Data security
  '数据安全', '隐私', 'security', 'privacy', 'sensitive data',
  // High-stakes
  '重要决策', '关键', 'critical', 'important decision', 'key',
  // Originality requirements
  '原创', '创新', 'original', 'innovative', 'novel',
];

const LOW_RISK_KEYWORDS = [
  // Routine tasks
  '日常', '简单', '基础', 'daily', 'simple', 'basic', 'routine',
  // Low-stakes communication
  '邮件', '格式', '润色', 'email', 'format', 'polish', 'grammar',
  // Information retrieval
  '查询', '搜索', 'search', 'query', 'lookup',
  // Brainstorming
  '头脑风暴', '草稿', 'brainstorm', 'draft', 'idea generation',
];

function classifyTaskRisk(taskDescription: string): RiskLevel {
  const lower = taskDescription.toLowerCase();

  // Explicit high-risk indicators
  if (/(学术论文|academic paper|核心代码|core code|重要|critical|危险|dangerous|删除所有|delete all)/.test(lower)) {
    return 'high';
  }

  // Count high-risk vs low-risk keyword matches
  const highRiskCount = HIGH_RISK_KEYWORDS.filter(keyword => lower.includes(keyword.toLowerCase())).length;
  const lowRiskCount = LOW_RISK_KEYWORDS.filter(keyword => lower.includes(keyword.toLowerCase())).length;

  if (highRiskCount > lowRiskCount) {
    return 'high';
  } else if (lowRiskCount > highRiskCount) {
    return 'low';
  }

  // Default: treat ambiguous as high-risk (conservative)
  return 'high';
}

// ============================================================================
// Scenario Extraction
// ============================================================================

interface ScenarioCandidate {
  description: string;
  startIndex: number;
  endIndex: number;
  content: string;
}

function extractTaskScenarios(content: string): ScenarioCandidate[] {
  const scenarios: ScenarioCandidate[] = [];

  // Split by speaker or paragraph
  const lines = content.split('\n');

  // Look for task descriptions: "场景", "任务", "我会用", "我让他", etc.
  const taskIndicators = [
    /场景.*?[:：](.{10,200})/gi,
    /任务.*?[:：](.{10,200})/gi,
    /(我会|我让他|我用它|我使用).{0,10}(GPT|AI|Claude|Gemini).{0,20}(来|去|帮我).{10,100}/gi,
    /(比如说|例如|比如).{0,20}(我|需要|写|做|处理).{10,150}/gi,
  ];

  let currentScenario = '';
  let startIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains task description
    for (const regex of taskIndicators) {
      const matches = Array.from(line.matchAll(regex));
      if (matches.length > 0) {
        if (currentScenario) {
          // Save previous scenario
          scenarios.push({
            description: currentScenario.substring(0, 100),
            startIndex,
            endIndex: i - 1,
            content: currentScenario,
          });
        }

        // Start new scenario
        currentScenario = line;
        startIndex = i;
      }
    }

    // Continue building current scenario
    if (currentScenario) {
      currentScenario += '\n' + line;
    }

    // End scenario if switching speakers or hitting separator
    if (/(^Speaker|^受访人|^吴淇|^---)/i.test(line) && currentScenario.length > 200) {
      scenarios.push({
        description: currentScenario.substring(0, 100),
        startIndex,
        endIndex: i,
        content: currentScenario,
      });
      currentScenario = '';
    }
  }

  // Add final scenario
  if (currentScenario.length > 100) {
    scenarios.push({
      description: currentScenario.substring(0, 100),
      startIndex,
      endIndex: lines.length - 1,
      content: currentScenario,
    });
  }

  return scenarios;
}

// ============================================================================
// Behavioral Analysis Functions (Same as advanced-coding.ts but applied per scenario)
// ============================================================================

function analyzeTaskDecomposition(content: string, lower: string): EvidenceStrength {
  let score: EvidenceStrength = 0;

  // Strong evidence: explicit decomposition behavior
  if (/(一段一段|逐段|分块|分段|step by step|段落|模块|拆分).{0,20}(输入|处理|分析|做)/i.test(content)) {
    score = 3;
  } else if (/(先.*?然后.*?最后|首先.*?接着|第一.*?第二)/i.test(content)) {
    score = 2;
  } else if (/(分解|拆分|breakdown|decompose)/i.test(content)) {
    score = 1;
  }

  // Negation
  if (/(从不|never|不会).{0,15}(分解|拆分)/i.test(content)) {
    score = 0;
  }

  return score;
}

function analyzeQualityChecking(content: string, lower: string): EvidenceStrength {
  let score: EvidenceStrength = 0;

  // Frequency-based scoring
  if (/(每次|总是|都会|always|一定).{0,15}(验证|检查|测试|对比|核实|verify|check|compare)/i.test(content)) {
    score = 3; // Always verifies
  } else if (/(经常|usually|often|会).{0,15}(验证|检查|对比)/i.test(content)) {
    score = 2; // Usually verifies
  } else if (/(有时|sometimes|偶尔).{0,15}(验证|检查)/i.test(content)) {
    score = 1; // Sometimes verifies
  } else if (/(验证|检查|测试|对比|verify|check|test|compare)/i.test(content)) {
    score = 1;
  }

  // Cross-validation (very strong signal)
  if (/(两个AI|再问一下|double check|交叉验证|对比|逐句对比)/i.test(content)) {
    score = 3;
  }

  // Negations
  if (/(从不|很少|rarely|never).{0,15}(验证|检查|verify)/i.test(content)) {
    score = 0;
  }

  // Awareness but no action
  if (/(知道应该|should).{0,20}(验证|verify).{0,20}(但|but).{0,20}(没|don't|懒|时间)/i.test(content)) {
    score = Math.min(score, 1) as EvidenceStrength;
  }

  return score;
}

function analyzeStrategySelection(content: string, lower: string): EvidenceStrength {
  // Count distinct AI tools mentioned
  const tools = ['gpt', 'chatgpt', 'claude', 'gemini', 'copilot', 'deepseek', 'kimi', 'wolfram', 'perplexity'];
  const toolCount = tools.filter(tool => lower.includes(tool)).length;

  // Task-specific strategy adaptation
  const hasTaskAdaptation = /(不同.*?任务|different.*?task|根据.*?情况|depending on)/i.test(content);

  if (toolCount >= 3 || (toolCount >= 2 && hasTaskAdaptation)) {
    return 3;
  } else if (toolCount >= 2 || hasTaskAdaptation) {
    return 2;
  } else if (toolCount >= 1) {
    return 1;
  }

  return 0;
}

function analyzeCapabilityJudgment(content: string, lower: string): EvidenceStrength {
  let score: EvidenceStrength = 0;

  // Strong: explicit statements about AI limitations
  if (/(AI.*?(不能|不会|局限|limitation|cannot|weak at)|我觉得.*?(能力有限|不太行|不够好))/i.test(content)) {
    score = 2;
  }

  // Strong: independent-first principle
  if (/(自己先|先自己|我先.*?再用AI|independent first|自己.*?然后.*?AI)/i.test(content)) {
    score = 3;
  }

  // Medium: selective trust
  if (/(不太相信|不完全信任|需要验证|need to verify)/i.test(content)) {
    score = 2;
  }

  // Weak: aware of risks
  if (/(可能.*?错|might be wrong|不一定.*?对)/i.test(content)) {
    score = 1;
  }

  // Complete trust (score 0)
  if (/(完全相信|完全信任|directly use|直接用)/i.test(content)) {
    score = 0;
  }

  return score;
}

function analyzeStrategyAdjustment(content: string, lower: string): EvidenceStrength {
  let score: EvidenceStrength = 0;

  // Iterative refinement
  if (/(多次|多轮|迭代|iterate|好多次|3-4次|several times)/i.test(content)) {
    score = 3;
  } else if (/(再.*?调整|再.*?修改|adjust|refine)/i.test(content)) {
    score = 2;
  } else if (/(修改|调整|change|adjust)/i.test(content)) {
    score = 1;
  }

  // Proactive strategy switching
  if (/(换.*?方法|换.*?工具|switch.*?tool|自己.*?重新)/i.test(content)) {
    score = 3;
  }

  return score;
}

function analyzeTrustCalibration(content: string, lower: string): EvidenceStrength {
  let score: EvidenceStrength = 0;

  // Task-specific trust levels
  if (/(不同.*?任务.*?信任|different.*?task.*?trust|根据.*?任务.*?相信)/i.test(content)) {
    score = 3;
  }

  // Multiple trust percentages mentioned
  const trustMentions = content.match(/(\d+)%/g);
  if (trustMentions && trustMentions.length >= 2) {
    score = 2;
  }

  // Explicit calibration language
  if (/(比较相信|不太相信|更信任|less trust|more trust)/i.test(content)) {
    score = 2;
  }

  // Binary trust (all or nothing)
  if (/(完全相信|完全不信|completely trust|don't trust at all)/.test(content) && !/不同/.test(content)) {
    score = 0;
  }

  return score;
}

// ============================================================================
// Subprocess Scoring (Applied to each scenario)
// ============================================================================

function scoreSubprocesses(scenarioContent: string): SubprocessScores {
  const lower = scenarioContent.toLowerCase();

  return {
    p1_task_decomposition: analyzeTaskDecomposition(scenarioContent, lower),
    p2_goal_setting: lower.includes('目标') || lower.includes('goal') ? 1 : 0,
    p3_strategy_selection: analyzeStrategySelection(scenarioContent, lower),
    p4_resource_planning: lower.includes('准备') || lower.includes('resource') ? 1 : 0,
    m1_progress_monitoring: lower.includes('进度') || lower.includes('progress') ? 1 : 0,
    m2_quality_checking: analyzeQualityChecking(scenarioContent, lower),
    m3_context_monitoring: lower.includes('根据情况') || lower.includes('depending on') ? 1 : 0,
    e1_result_evaluation: lower.includes('评估') || lower.includes('evaluate') ? 1 : 0,
    e2_learning_reflection: lower.includes('总结') || lower.includes('reflect') ? 1 : 0,
    e3_capability_judgment: analyzeCapabilityJudgment(scenarioContent, lower),
    r1_strategy_adjustment: analyzeStrategyAdjustment(scenarioContent, lower),
    r2_trust_calibration: analyzeTrustCalibration(scenarioContent, lower),
  };
}

// ============================================================================
// Pattern Determination
// ============================================================================

function determinePattern(scores: SubprocessScores, totalScore: number): { pattern: Pattern; confidence: Confidence } {
  const {
    p1_task_decomposition: P1, p2_goal_setting: P2, p3_strategy_selection: P3, p4_resource_planning: P4,
    m1_progress_monitoring: M1, m2_quality_checking: M2, m3_context_monitoring: M3,
    e1_result_evaluation: E1, e2_learning_reflection: E2, e3_capability_judgment: E3,
    r1_strategy_adjustment: R1, r2_trust_calibration: R2,
  } = scores;

  // Pattern F: Ineffective/Passive (totalScore < 15)
  if (totalScore < 15) {
    const redFlags = [P1, P2, M2, E3].filter(s => s === 0).length;
    if (redFlags >= 2) {
      return { pattern: 'F', confidence: 'high' };
    }
    return { pattern: 'F', confidence: 'moderate' };
  }

  // Pattern A: Strategic Decomposition & Control (high P1, P4, M2, E3)
  if (P1 >= 2 && M2 >= 2 && E3 >= 2 && totalScore >= 24) {
    const aScore = P1 + P4 + M2 + E3;
    if (aScore >= 10) {
      return { pattern: 'A', confidence: 'high' };
    }
    return { pattern: 'A', confidence: 'moderate' };
  }

  // Pattern D: Deep Verification (M2=3, cross-validation)
  if (M2 === 3 && E1 >= 2) {
    return { pattern: 'D', confidence: 'high' };
  }

  // Pattern B: Iterative Optimization (high R1, R2)
  if (R1 >= 2 && totalScore >= 20) {
    return { pattern: 'B', confidence: 'moderate' };
  }

  // Pattern C: Context-Sensitive Adaptation (high M3, R2, P3)
  if (P3 >= 2 && R2 >= 2 && totalScore >= 22) {
    return { pattern: 'C', confidence: 'moderate' };
  }

  // Pattern E: Learning-Oriented (high E1, E2, E3)
  if (E1 + E2 + E3 >= 6 && totalScore >= 20) {
    return { pattern: 'E', confidence: 'moderate' };
  }

  // Default: classify based on highest subprocess cluster
  const planningScore = P1 + P2 + P3 + P4;
  const monitoringScore = M1 + M2 + M3;
  const evaluationScore = E1 + E2 + E3;
  const regulationScore = R1 + R2;

  const maxScore = Math.max(planningScore, monitoringScore, evaluationScore, regulationScore);

  if (maxScore === regulationScore && R1 >= 2) {
    return { pattern: 'B', confidence: 'low' };
  } else if (maxScore === monitoringScore && M2 >= 2) {
    return { pattern: 'D', confidence: 'low' };
  } else if (maxScore === evaluationScore) {
    return { pattern: 'E', confidence: 'low' };
  } else if (planningScore >= 6) {
    return { pattern: 'A', confidence: 'low' };
  } else {
    return { pattern: 'C', confidence: 'low' };
  }
}

// ============================================================================
// Main Coding Function
// ============================================================================

function codeInterview(interviewId: string, content: string): InterviewCoding {
  // Extract scenarios
  const scenarioCandidates = extractTaskScenarios(content);

  // If no scenarios found, treat whole interview as single scenario
  if (scenarioCandidates.length === 0) {
    scenarioCandidates.push({
      description: 'General AI usage',
      startIndex: 0,
      endIndex: content.length,
      content: content,
    });
  }

  // Code each scenario
  const scenarios: TaskScenario[] = scenarioCandidates.map(candidate => {
    const riskLevel = classifyTaskRisk(candidate.content);
    const subprocessScores = scoreSubprocesses(candidate.content);
    const totalScore = Object.values(subprocessScores).reduce((a, b) => a + b, 0);
    const { pattern, confidence } = determinePattern(subprocessScores, totalScore);

    // Extract evidence quotes (first 2 relevant sentences)
    const quotes: string[] = [];
    const sentences = candidate.content.split(/[。！？.!?]\s*/);
    for (const sentence of sentences) {
      if (sentence.length > 20 && sentence.length < 200) {
        if (/(验证|检查|分解|调整|信任|AI|GPT)/i.test(sentence)) {
          quotes.push(sentence.trim());
          if (quotes.length >= 2) break;
        }
      }
    }

    return {
      taskDescription: candidate.description.replace(/\n/g, ' ').substring(0, 150),
      riskLevel,
      subprocessScores,
      totalScore,
      pattern,
      confidence,
      evidenceQuotes: quotes,
    };
  });

  // Separate high-risk and low-risk scenarios
  const highRiskScenarios = scenarios.filter(s => s.riskLevel === 'high');
  const lowRiskScenarios = scenarios.filter(s => s.riskLevel === 'low');

  // Determine primary pattern from high-risk scenarios (if any)
  let primaryPattern: Pattern;
  let primaryPatternConfidence: Confidence;
  let overallScore: number;

  if (highRiskScenarios.length > 0) {
    // Use highest-scoring high-risk scenario
    const bestHighRisk = highRiskScenarios.reduce((best, current) =>
      current.totalScore > best.totalScore ? current : best
    );
    primaryPattern = bestHighRisk.pattern;
    primaryPatternConfidence = bestHighRisk.confidence;
    overallScore = bestHighRisk.totalScore;
  } else {
    // Fallback to overall average if no high-risk scenarios
    const avgScore = scenarios.reduce((sum, s) => sum + s.totalScore, 0) / scenarios.length;
    const avgScores = scoreSubprocesses(content);
    const result = determinePattern(avgScores, Math.round(avgScore));
    primaryPattern = result.pattern;
    primaryPatternConfidence = result.confidence;
    overallScore = Math.round(avgScore);
  }

  return {
    interviewId,
    scenarios,
    primaryPattern,
    primaryPatternConfidence,
    highRiskScenarios,
    lowRiskScenarios,
    overallScore,
  };
}

// ============================================================================
// Batch Processing
// ============================================================================

function codeAllInterviews(inputDir: string, outputPath: string): void {
  console.log('🔬 Risk-Based Multi-Pattern Interview Coding');
  console.log('Strategy: Extract primary pattern from HIGH-RISK task scenarios\n');

  const files = fs.readdirSync(inputDir)
    .filter(f => f.match(/^I\d{3}\.txt$/))
    .sort();

  const results: InterviewCoding[] = [];
  const csvLines: string[] = [
    'interview_id,primary_pattern,confidence,overall_score,high_risk_count,low_risk_count,avg_high_risk_score,avg_low_risk_score',
  ];

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const interviewId = file.replace('.txt', '');

    console.log(`📄 Coding ${interviewId}...`);
    const coding = codeInterview(interviewId, content);
    results.push(coding);

    const avgHighRisk = coding.highRiskScenarios.length > 0
      ? coding.highRiskScenarios.reduce((sum, s) => sum + s.totalScore, 0) / coding.highRiskScenarios.length
      : 0;
    const avgLowRisk = coding.lowRiskScenarios.length > 0
      ? coding.lowRiskScenarios.reduce((sum, s) => sum + s.totalScore, 0) / coding.lowRiskScenarios.length
      : 0;

    csvLines.push([
      interviewId,
      coding.primaryPattern,
      coding.primaryPatternConfidence,
      coding.overallScore,
      coding.highRiskScenarios.length,
      coding.lowRiskScenarios.length,
      avgHighRisk.toFixed(1),
      avgLowRisk.toFixed(1),
    ].join(','));

    console.log(`   → Primary Pattern: ${coding.primaryPattern} (${coding.primaryPatternConfidence}, score: ${coding.overallScore}/36)`);
    console.log(`   → High-risk scenarios: ${coding.highRiskScenarios.length}, Low-risk: ${coding.lowRiskScenarios.length}`);
  }

  // Write CSV
  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n✅ Coded ${results.length} interviews`);
  console.log(`📁 Output: ${outputPath}`);

  // Distribution analysis
  const distribution: Record<Pattern, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  results.forEach(r => distribution[r.primaryPattern]++);

  console.log('\n📊 Primary Pattern Distribution (from high-risk tasks):');
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      const pct = Math.round((count / results.length) * 100);
      console.log(`   Pattern ${pattern}: ${count} (${pct}%)`);
    });

  // High-confidence samples
  console.log('\n🎯 High-Confidence Samples:');
  ['A', 'B', 'C', 'D', 'E'].forEach(pattern => {
    const highConf = results.filter(r => r.primaryPattern === pattern && r.primaryPatternConfidence === 'high');
    console.log(`   Pattern ${pattern}: ${highConf.length} high-confidence samples`);
  });
}

// ============================================================================
// CLI
// ============================================================================

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename || process.argv[1].endsWith('risk-based-coding.ts');

if (isMainModule) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx risk-based-coding.ts <interviews-dir> <output.csv>');
    process.exit(1);
  }

  codeAllInterviews(args[0], args[1]);
}

export { codeInterview, codeAllInterviews, classifyTaskRisk };
