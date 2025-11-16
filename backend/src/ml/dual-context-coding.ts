/**
 * Dual-Context Interview Coding
 *
 * Strategy: Code the SAME interview TWICE based on filtered content
 * 1. High-Risk Context: Only analyze paragraphs discussing high-risk tasks
 * 2. Low-Risk Context: Only analyze paragraphs discussing low-risk tasks
 * 3. Primary Pattern = High-Risk Context Pattern
 *
 * Example (I001):
 * - High-risk: Academic paper compression (10000→1000 words) → Pattern A (score 28/36)
 * - Low-risk: Daily email generation → Pattern C (score 18/36)
 * - PRIMARY PATTERN = A (from high-risk)
 */

import * as fs from 'fs';
import * as path from 'path';

type EvidenceStrength = 0 | 1 | 2 | 3;
type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type Confidence = 'high' | 'moderate' | 'low';

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

interface ContextCoding {
  context: 'high-risk' | 'low-risk';
  filteredContent: string;
  wordCount: number;
  subprocessScores: SubprocessScores;
  totalScore: number;
  pattern: Pattern;
  confidence: Confidence;
}

interface DualCoding {
  interviewId: string;
  highRiskCoding: ContextCoding;
  lowRiskCoding: ContextCoding;
  primaryPattern: Pattern;
  primaryScore: number;
  primaryConfidence: Confidence;
}

// ============================================================================
// Risk Keywords (More Comprehensive)
// ============================================================================

const HIGH_RISK_INDICATORS = [
  // Academic (simplified - single words)
  /学术/gi,
  /论文/gi,
  /引用/gi,
  /发表/gi,
  /投稿/gi,
  /academic/gi,
  /paper/gi,
  /publication/gi,
  /citation/gi,
  /manuscript/gi,
  /文献/gi,

  // Code/algorithms (simplified)
  /算法/gi,
  /代码/gi,
  /核心/gi,
  /algorithm/gi,
  /code/gi,
  /programming/gi,

  // Research
  /研究/gi,
  /实验/gi,
  /research/gi,
  /experiment/gi,

  // Dangerous operations
  /删除.*?(所有|磁盘|all|disk)/gi,
  /危险.*?(命令|操作)/gi,
  /rm -rf/gi,

  // High-stakes
  /重要决策/gi,
  /critical decision/gi,

  // Data security
  /数据.*?(安全|隐私|保密)/gi,
  /security|privacy/gi,

  // Originality
  /原创/gi,
  /创新/gi,
  /original/gi,
  /innovative/gi,
];

const LOW_RISK_INDICATORS = [
  // Daily communication
  /日常.{0,10}(邮件|沟通|交流)/gi,
  /daily.{0,10}(email|communication)/gi,
  /(简单|基础).{0,10}(邮件|查询)/gi,

  // Format/grammar
  /(格式|排版|语法).{0,10}(调整|检查|修改)/gi,
  /(format|grammar|spelling).{0,10}(check|adjust)/gi,
  /润色|polish|proofread/gi,

  // Information retrieval
  /(搜索|查询|检索).{0,10}(信息|资料)/gi,
  /search|query|lookup/gi,

  // Brainstorming
  /头脑风暴|brainstorm|idea generation/gi,
  /草稿|draft/gi,

  // Basic tasks
  /简单.{0,10}(任务|工作|代码)/gi,
  /basic.{0,10}(task|work|code)/gi,
];

// ============================================================================
// Content Filtering
// ============================================================================

function filterByRiskLevel(content: string, riskLevel: 'high' | 'low'): string {
  const lines = content.split('\n');
  const indicators = riskLevel === 'high' ? HIGH_RISK_INDICATORS : LOW_RISK_INDICATORS;

  const relevantLines: string[] = [];
  const CONTEXT_WINDOW = 10; // Include 10 lines before and after match

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line matches risk indicators
    const matches = indicators.some(regex => regex.test(line));

    if (matches) {
      // Include context window
      const start = Math.max(0, i - CONTEXT_WINDOW);
      const end = Math.min(lines.length, i + CONTEXT_WINDOW + 1);

      for (let j = start; j < end; j++) {
        if (!relevantLines.includes(lines[j])) {
          relevantLines.push(lines[j]);
        }
      }
    }
  }

  return relevantLines.join('\n');
}

// ============================================================================
// Behavioral Analysis (Same as advanced-coding.ts)
// ============================================================================

function analyzeTaskDecomposition(content: string): EvidenceStrength {
  if (/(一段一段|逐段|分块|分段|step-by-step).{0,20}(输入|处理|分析|做)/i.test(content)) {
    return 3;
  } else if (/(先.*?然后.*?最后|首先.*?接着|第一.*?第二.*?第三)/i.test(content)) {
    return 2;
  } else if (/(分解|拆分|breakdown|decompose)/i.test(content)) {
    return 1;
  }

  if (/(从不|never|不会).{0,15}(分解|拆分)/i.test(content)) {
    return 0;
  }

  return 0;
}

function analyzeGoalSetting(content: string): EvidenceStrength {
  if (/(明确|清晰|specific).{0,15}(目标|要求|goal)/i.test(content)) {
    return 2;
  } else if (/(目标|goal|objective|requirement)/i.test(content)) {
    return 1;
  }
  return 0;
}

function analyzeStrategySelection(content: string): EvidenceStrength {
  const lower = content.toLowerCase();
  const tools = ['gpt', 'chatgpt', 'claude', 'gemini', 'copilot', 'deepseek', 'kimi'];
  const toolCount = tools.filter(tool => lower.includes(tool)).length;

  const hasTaskAdaptation = /(不同.*?任务|different.*?task|根据.*?情况)/i.test(content);

  if (toolCount >= 3 || (toolCount >= 2 && hasTaskAdaptation)) {
    return 3;
  } else if (toolCount >= 2 || hasTaskAdaptation) {
    return 2;
  } else if (toolCount >= 1) {
    return 1;
  }
  return 0;
}

function analyzeResourcePlanning(content: string): EvidenceStrength {
  if (/(自己先|自己.*?做好|前期.*?工作|prepare|beforehand)/i.test(content)) {
    return 3;
  } else if (/(准备|计划|plan|prepare)/i.test(content)) {
    return 1;
  }
  return 0;
}

function analyzeProgressMonitoring(content: string): EvidenceStrength {
  if (/(每一步|每次|持续|constantly).{0,15}(检查|监控|看|monitor)/i.test(content)) {
    return 2;
  } else if (/(进度|progress|track)/i.test(content)) {
    return 1;
  }
  return 0;
}

function analyzeQualityChecking(content: string): EvidenceStrength {
  // Cross-validation (strongest signal)
  if (/(两个AI|再问一下|double check|交叉验证|逐字逐句|逐句对比)/i.test(content)) {
    return 3;
  }

  // Frequency-based
  if (/(每次|总是|都会|always|一定).{0,15}(验证|检查|测试|对比|核实)/i.test(content)) {
    return 3;
  } else if (/(经常|usually|会).{0,15}(验证|检查|对比)/i.test(content)) {
    return 2;
  } else if (/(有时|sometimes).{0,15}(验证|检查)/i.test(content)) {
    return 1;
  } else if (/(验证|检查|测试|对比|verify|check|compare)/i.test(content)) {
    return 1;
  }

  // Negations
  if (/(从不|很少|never).{0,15}(验证|检查)/i.test(content)) {
    return 0;
  }

  return 0;
}

function analyzeContextMonitoring(content: string): EvidenceStrength {
  if (/(根据.*?情况|depending on|视.*?而定|context-dependent)/i.test(content)) {
    return 2;
  } else if (/(情况|context|situation)/i.test(content)) {
    return 1;
  }
  return 0;
}

function analyzeResultEvaluation(content: string): EvidenceStrength {
  if (/(评估|评价|判断).{0,15}(结果|质量|效果|outcome|quality)/i.test(content)) {
    return 2;
  } else if (/(满意|不满意|好|不好|satisfied|good|bad)/i.test(content)) {
    return 1;
  }
  return 0;
}

function analyzeLearningReflection(content: string): EvidenceStrength {
  if (/(总结|反思|经验|教训|lesson|reflect|learn from)/i.test(content)) {
    return 2;
  } else if (/(学习|learning)/i.test(content)) {
    return 1;
  }
  return 0;
}

function analyzeCapabilityJudgment(content: string): EvidenceStrength {
  // Independent-first (strongest)
  if (/(自己先|先自己|我先.*?再用|independent first)/i.test(content)) {
    return 3;
  }

  // Explicit limitations
  if (/(AI.*?(不能|不会|局限|limitation|cannot)|能力.*?(有限|不够|不太行))/i.test(content)) {
    return 2;
  }

  // Selective trust
  if (/(不太相信|不完全信任|需要验证)/i.test(content)) {
    return 2;
  }

  // Aware of risks
  if (/(可能.*?错|might be wrong|不一定.*?对)/i.test(content)) {
    return 1;
  }

  return 0;
}

function analyzeStrategyAdjustment(content: string): EvidenceStrength {
  // Multiple iterations
  if (/(多次|多轮|迭代|3-4次|好多次|several times)/i.test(content)) {
    return 3;
  }

  // Proactive switching
  if (/(换.*?方法|换.*?工具|自己.*?重新|switch)/i.test(content)) {
    return 3;
  }

  // Adjustment
  if (/(再.*?调整|再.*?修改|adjust|refine)/i.test(content)) {
    return 2;
  } else if (/(修改|调整|change)/i.test(content)) {
    return 1;
  }

  return 0;
}

function analyzeTrustCalibration(content: string): EvidenceStrength {
  // Task-specific trust
  if (/(不同.*?任务.*?信任|different.*?task.*?trust)/i.test(content)) {
    return 3;
  }

  // Multiple trust levels
  const trustMentions = content.match(/(\d+)%/g);
  if (trustMentions && trustMentions.length >= 2) {
    return 2;
  }

  // Calibrated trust
  if (/(比较相信|不太相信|更信任|less trust|more trust)/i.test(content)) {
    return 2;
  }

  return 0;
}

// ============================================================================
// Subprocess Scoring
// ============================================================================

function scoreSubprocesses(content: string): SubprocessScores {
  return {
    p1_task_decomposition: analyzeTaskDecomposition(content),
    p2_goal_setting: analyzeGoalSetting(content),
    p3_strategy_selection: analyzeStrategySelection(content),
    p4_resource_planning: analyzeResourcePlanning(content),
    m1_progress_monitoring: analyzeProgressMonitoring(content),
    m2_quality_checking: analyzeQualityChecking(content),
    m3_context_monitoring: analyzeContextMonitoring(content),
    e1_result_evaluation: analyzeResultEvaluation(content),
    e2_learning_reflection: analyzeLearningReflection(content),
    e3_capability_judgment: analyzeCapabilityJudgment(content),
    r1_strategy_adjustment: analyzeStrategyAdjustment(content),
    r2_trust_calibration: analyzeTrustCalibration(content),
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

  // Pattern F: Ineffective (score < 15)
  if (totalScore < 15) {
    const redFlags = [P1, M2, E3].filter(s => s === 0).length;
    return { pattern: 'F', confidence: redFlags >= 2 ? 'high' : 'moderate' };
  }

  // Pattern A: Strategic Decomposition & Control
  if (P1 >= 2 && M2 >= 2 && E3 >= 2 && totalScore >= 24) {
    const aScore = P1 + P4 + M2 + E3;
    return { pattern: 'A', confidence: aScore >= 10 ? 'high' : 'moderate' };
  }

  // Pattern D: Deep Verification
  if (M2 === 3 && E1 >= 2 && totalScore >= 20) {
    return { pattern: 'D', confidence: 'high' };
  }

  // Pattern B: Iterative Optimization
  if (R1 >= 2 && totalScore >= 20) {
    return { pattern: 'B', confidence: R1 === 3 ? 'high' : 'moderate' };
  }

  // Pattern C: Context-Sensitive Adaptation
  if (P3 >= 2 && R2 >= 2 && totalScore >= 22) {
    return { pattern: 'C', confidence: 'moderate' };
  }

  // Pattern E: Learning-Oriented
  if ((E1 + E2 + E3) >= 6 && totalScore >= 20) {
    return { pattern: 'E', confidence: 'moderate' };
  }

  // Default classification
  if (totalScore >= 20) {
    const maxScore = Math.max(P1 + P4, M2 + E1, R1 + R2, P3 + M3);
    if (maxScore === R1 + R2) return { pattern: 'B', confidence: 'low' };
    if (maxScore === M2 + E1) return { pattern: 'D', confidence: 'low' };
    if (maxScore === P3 + M3) return { pattern: 'C', confidence: 'low' };
    return { pattern: 'A', confidence: 'low' };
  }

  return { pattern: 'F', confidence: 'moderate' };
}

// ============================================================================
// Main Dual Coding Function
// ============================================================================

function codeDualContext(interviewId: string, content: string): DualCoding {
  // Filter content by risk level
  const highRiskContent = filterByRiskLevel(content, 'high');
  const lowRiskContent = filterByRiskLevel(content, 'low');

  // Code high-risk context
  const highRiskScores = scoreSubprocesses(highRiskContent);
  const highRiskTotal = Object.values(highRiskScores).reduce((a, b) => a + b, 0);
  const highRiskPattern = determinePattern(highRiskScores, highRiskTotal);

  const highRiskCoding: ContextCoding = {
    context: 'high-risk',
    filteredContent: highRiskContent.substring(0, 500), // First 500 chars for inspection
    wordCount: highRiskContent.split(/\s+/).length,
    subprocessScores: highRiskScores,
    totalScore: highRiskTotal,
    pattern: highRiskPattern.pattern,
    confidence: highRiskPattern.confidence,
  };

  // Code low-risk context
  const lowRiskScores = scoreSubprocesses(lowRiskContent);
  const lowRiskTotal = Object.values(lowRiskScores).reduce((a, b) => a + b, 0);
  const lowRiskPattern = determinePattern(lowRiskScores, lowRiskTotal);

  const lowRiskCoding: ContextCoding = {
    context: 'low-risk',
    filteredContent: lowRiskContent.substring(0, 500),
    wordCount: lowRiskContent.split(/\s+/).length,
    subprocessScores: lowRiskScores,
    totalScore: lowRiskTotal,
    pattern: lowRiskPattern.pattern,
    confidence: lowRiskPattern.confidence,
  };

  // Primary pattern = high-risk pattern (if sufficient content)
  const usePrimary = highRiskContent.length > 200 ? 'high' : 'low';
  const primaryCoding = usePrimary === 'high' ? highRiskCoding : lowRiskCoding;

  return {
    interviewId,
    highRiskCoding,
    lowRiskCoding,
    primaryPattern: primaryCoding.pattern,
    primaryScore: primaryCoding.totalScore,
    primaryConfidence: primaryCoding.confidence,
  };
}

// ============================================================================
// Batch Processing
// ============================================================================

function codeAllInterviews(inputDir: string, outputPath: string): void {
  console.log('🔬 Dual-Context Interview Coding');
  console.log('Strategy: High-Risk Pattern = Primary, Low-Risk Pattern = Secondary\n');

  const files = fs.readdirSync(inputDir)
    .filter(f => f.match(/^I\d{3}\.txt$/))
    .sort();

  const results: DualCoding[] = [];
  const csvLines: string[] = [
    'interview_id,primary_pattern,primary_score,primary_confidence,high_risk_pattern,high_risk_score,high_risk_words,low_risk_pattern,low_risk_score,low_risk_words',
  ];

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const interviewId = file.replace('.txt', '');

    console.log(`📄 Coding ${interviewId}...`);
    const coding = codeDualContext(interviewId, content);
    results.push(coding);

    csvLines.push([
      interviewId,
      coding.primaryPattern,
      coding.primaryScore,
      coding.primaryConfidence,
      coding.highRiskCoding.pattern,
      coding.highRiskCoding.totalScore,
      coding.highRiskCoding.wordCount,
      coding.lowRiskCoding.pattern,
      coding.lowRiskCoding.totalScore,
      coding.lowRiskCoding.wordCount,
    ].join(','));

    console.log(`   → PRIMARY: ${coding.primaryPattern} (${coding.primaryConfidence}, score: ${coding.primaryScore}/36)`);
    console.log(`   → High-risk: ${coding.highRiskCoding.pattern} (${coding.highRiskCoding.totalScore}/36, ${coding.highRiskCoding.wordCount} words)`);
    console.log(`   → Low-risk: ${coding.lowRiskCoding.pattern} (${coding.lowRiskCoding.totalScore}/36, ${coding.lowRiskCoding.wordCount} words)`);
  }

  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n✅ Coded ${results.length} interviews`);
  console.log(`📁 Output: ${outputPath}`);

  // Distribution
  const distribution: Record<Pattern, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  results.forEach(r => distribution[r.primaryPattern]++);

  console.log('\n📊 PRIMARY Pattern Distribution:');
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      const pct = Math.round((count / results.length) * 100);
      console.log(`   Pattern ${pattern}: ${count} (${pct}%)`);
    });

  // High-confidence
  console.log('\n🎯 High-Confidence Samples:');
  ['A', 'B', 'C', 'D', 'E'].forEach(pattern => {
    const highConf = results.filter(r => r.primaryPattern === pattern && r.primaryConfidence === 'high');
    console.log(`   Pattern ${pattern}: ${highConf.length} high-confidence`);
  });
}

// ============================================================================
// CLI
// ============================================================================

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename || process.argv[1].endsWith('dual-context-coding.ts');

if (isMainModule) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx dual-context-coding.ts <interviews-dir> <output.csv>');
    process.exit(1);
  }

  codeAllInterviews(args[0], args[1]);
}

export { codeDualContext, codeAllInterviews };
