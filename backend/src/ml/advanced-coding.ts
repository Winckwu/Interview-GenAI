/**
 * Advanced Interview Coding Tool
 *
 * Uses semantic analysis and behavior pattern recognition
 * instead of simple keyword matching
 */

import fs from 'fs';
import path from 'path';
import {
  SubprocessScores,
  calculateMLFeatures,
  calculateTotalScore,
  determinePattern,
  TrainingDataPoint,
  generateCSV,
  type EvidenceStrength,
} from './extractTrainingData.js';

interface BehaviorEvidence {
  subprocess: string;
  score: EvidenceStrength;
  quotes: string[];
  rationale: string;
}

/**
 * Advanced behavioral analysis
 * Looks for patterns beyond simple keywords
 */
function analyzeInterview(content: string, userId: string): {
  scores: SubprocessScores;
  evidence: BehaviorEvidence[];
  language: 'zh' | 'en' | 'mixed';
} {
  const evidence: BehaviorEvidence[] = [];
  const lower = content.toLowerCase();

  // Detect language
  const hasChinese = /[\u4e00-\u9fa5]/.test(content);
  const hasEnglish = /[a-z]/i.test(content);
  const language = hasChinese && hasEnglish ? 'mixed' : hasChinese ? 'zh' : 'en';

  // P1: Task Decomposition
  const p1_score = analyzeTaskDecomposition(content, lower);
  evidence.push({
    subprocess: 'P1',
    score: p1_score,
    quotes: extractRelevantQuotes(content, ['分解', '拆分', '大纲', 'breakdown', 'outline', 'step by step'], 2),
    rationale: p1_score >= 2 ? 'Evidence of systematic task decomposition' : 'Limited or no task decomposition'
  });

  // P2: Goal Setting
  const p2_score = analyzeGoalSetting(content, lower);
  evidence.push({
    subprocess: 'P2',
    score: p2_score,
    quotes: extractRelevantQuotes(content, ['目标', '标准', 'goal', 'objective', 'deadline'], 2),
    rationale: p2_score >= 2 ? 'Clear goal setting behavior' : 'Vague or no explicit goals'
  });

  // P3: Strategy Selection
  const p3_score = analyzeStrategySelection(content, lower);
  evidence.push({
    subprocess: 'P3',
    score: p3_score,
    quotes: extractRelevantQuotes(content, ['策略', '方法', 'strategy', 'approach', 'GPT', 'Claude'], 2),
    rationale: p3_score >= 2 ? 'Multiple strategies/tools mentioned' : 'Single strategy only'
  });

  // P4: Role Definition
  const p4_score = analyzeRoleDefinition(content, lower);
  evidence.push({
    subprocess: 'P4',
    score: p4_score,
    quotes: extractRelevantQuotes(content, ['我负责', 'AI负责', '不能', 'boundary', 'I do', 'AI does'], 2),
    rationale: p4_score >= 2 ? 'Clear AI-human boundaries' : 'No boundary awareness'
  });

  // M1: Progress Tracking
  const m1_score = analyzeProgressTracking(content, lower);
  evidence.push({
    subprocess: 'M1',
    score: m1_score,
    quotes: extractRelevantQuotes(content, ['进度', '完成', 'progress', 'track', 'checklist'], 1),
    rationale: m1_score >= 2 ? 'Active progress monitoring' : 'Minimal tracking'
  });

  // M2: Quality Checking (CORE!)
  const m2_score = analyzeQualityChecking(content, lower);
  evidence.push({
    subprocess: 'M2',
    score: m2_score,
    quotes: extractRelevantQuotes(content, ['验证', '检查', '测试', 'verify', 'check', 'test'], 3),
    rationale: m2_score >= 2 ? 'Systematic verification behavior' : 'Minimal or no verification'
  });

  // M3: Trust Calibration
  const m3_score = analyzeTrustCalibration(content, lower);
  evidence.push({
    subprocess: 'M3',
    score: m3_score,
    quotes: extractRelevantQuotes(content, ['信任', '可靠', 'trust', 'reliable', '准确'], 2),
    rationale: m3_score >= 2 ? 'Dynamic trust adjustment' : 'Fixed trust level'
  });

  // E1: Output Quality Assessment
  const e1_score = analyzeOutputQuality(content, lower);
  evidence.push({
    subprocess: 'E1',
    score: e1_score,
    quotes: extractRelevantQuotes(content, ['质量', '评估', 'quality', 'assess', 'evaluate'], 1),
    rationale: e1_score >= 2 ? 'Comprehensive quality evaluation' : 'Superficial assessment'
  });

  // E2: Risk Assessment
  const e2_score = analyzeRiskAssessment(content, lower);
  evidence.push({
    subprocess: 'E2',
    score: e2_score,
    quotes: extractRelevantQuotes(content, ['风险', '错误', 'risk', 'error', 'consequence'], 1),
    rationale: e2_score >= 2 ? 'Risk-aware decision making' : 'Low risk awareness'
  });

  // E3: Capability Judgment
  const e3_score = analyzeCapabilityJudgment(content, lower);
  evidence.push({
    subprocess: 'E3',
    score: e3_score,
    quotes: extractRelevantQuotes(content, ['自己能', '先试', 'I can', 'try myself', '能力'], 2),
    rationale: e3_score >= 2 ? 'Strong self-assessment and independent attempts' : 'Low capability awareness'
  });

  // R1: Strategy Adjustment (CORE!)
  const r1_score = analyzeStrategyAdjustment(content, lower);
  evidence.push({
    subprocess: 'R1',
    score: r1_score,
    quotes: extractRelevantQuotes(content, ['调整', '改进', '迭代', 'adjust', 'refine', 'iterate'], 2),
    rationale: r1_score >= 2 ? 'Iterative refinement behavior' : 'One-shot approach'
  });

  // R2: Tool Switching
  const r2_score = analyzeToolSwitching(content, lower);
  evidence.push({
    subprocess: 'R2',
    score: r2_score,
    quotes: extractRelevantQuotes(content, ['切换', '换', 'switch', 'Google', 'Claude', 'different'], 2),
    rationale: r2_score >= 2 ? 'Flexible tool usage' : 'Single tool dependency'
  });

  const scores: SubprocessScores = {
    p1_task_decomposition: p1_score,
    p2_goal_setting: p2_score,
    p3_strategy_selection: p3_score,
    p4_role_definition: p4_score,
    m1_progress_tracking: m1_score,
    m2_quality_checking: m2_score,
    m3_trust_calibration: m3_score,
    e1_output_quality_assessment: e1_score,
    e2_risk_assessment: e2_score,
    e3_capability_judgment: e3_score,
    r1_strategy_adjustment: r1_score,
    r2_tool_switching: r2_score,
  };

  return { scores, evidence, language };
}

// Behavioral analysis functions

function analyzeTaskDecomposition(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Check for explicit decomposition behavior
  if (/((每次|总是|都会).{0,10}(分解|拆分|列.{0,5}大纲))|((always|usually).{0,20}(break|decompose|outline))/i.test(content)) {
    score += 2; // Strong habitual behavior
  } else if (/(分解|拆分|大纲|breakdown|outline|step)/i.test(content)) {
    score += 1;
  }

  // Check for tools (Notion, checklist, etc.)
  if (/(notion|trello|checklist|清单|项目管理)/i.test(content)) {
    score += 1;
  }

  // Check for negations
  if (/(从不|从来不|never).{0,15}(分解|decompose)/i.test(content)) {
    return 0;
  }

  return Math.min(score, 3) as EvidenceStrength;
}

function analyzeGoalSetting(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // SMART goals (Specific, Measurable, Time-bound)
  const hasSpecific = /((\d+)(字|词|页|word|page))|((完成|finish|complete).{0,20}(\d+))/i.test(content);
  const hasDeadline = /(周|月|天|week|month|day|deadline|before)/i.test(content);
  const hasQuality = /(标准|质量|quality|standard|criteria)/i.test(content);

  if (hasSpecific && hasDeadline) score += 2;
  else if (hasSpecific || hasDeadline) score += 1;

  if (hasQuality) score += 1;

  return Math.min(score, 3) as EvidenceStrength;
}

function analyzeStrategySelection(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Count different tools/models mentioned
  const tools = ['gpt', 'claude', 'gemini', 'copilot', 'wolfram', 'google'];
  const toolCount = tools.filter(tool => lower.includes(tool)).length;

  if (toolCount >= 3) score = 3;
  else if (toolCount >= 2) score = 2;
  else if (toolCount >= 1) score = 1;

  // Check for task-specific strategy
  if (/(不同|different).{0,20}(任务|task).{0,20}(用|use)/i.test(content)) {
    score = Math.min(score + 1, 3);
  }

  return score as EvidenceStrength;
}

function analyzeRoleDefinition(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Explicit boundary statements
  if (/(ai.{0,10}负责|ai.{0,10}做|ai (does|handle))/i.test(content) &&
      /(我.{0,10}负责|我.{0,10}做|i (do|handle))/i.test(content)) {
    score += 2;
  }

  // Independent attempt first
  if (/(先.{0,10}自己.{0,10}试|一定.{0,10}先|always.{0,20}try.{0,20}myself)/i.test(content)) {
    score += 1;
  }

  // Forbidden zones
  if (/(不能|禁止|never|shouldn't).{0,15}(让ai|ai)/i.test(content)) {
    score += 1;
  }

  return Math.min(score, 3) as EvidenceStrength;
}

function analyzeProgressTracking(content: string, lower: string): EvidenceStrength {
  let score = 0;

  if (/(notion|trello|清单|checklist).{0,30}(进度|progress)/i.test(content)) {
    score = 2;
  } else if (/(进度|完成|progress|track)/i.test(content)) {
    score = 1;
  }

  return score as EvidenceStrength;
}

function analyzeQualityChecking(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Frequency indicators
  if (/(每次|总是|都会|always).{0,15}(验证|检查|测试|verify|check|test)/i.test(content)) {
    score = 3; // Always verifies
  } else if (/(经常|usually|often).{0,15}(验证|检查|verify|check)/i.test(content)) {
    score = 2; // Usually verifies
  } else if (/(有时|sometimes|occasionally).{0,15}(验证|检查|verify)/i.test(content)) {
    score = 1; // Sometimes verifies
  } else if (/(验证|检查|测试|verify|check|test)/i.test(content)) {
    score = 1;
  }

  // Negations
  if (/(从不|很少|rarely|never).{0,15}(验证|检查|verify)/i.test(content)) {
    score = 0;
  }

  // Awareness but no action
  if (/(知道应该|should).{0,20}(验证|verify).{0,20}(但|but).{0,20}(没|don't)/i.test(content)) {
    score = Math.min(score, 1); // Only awareness, no behavior
  }

  return score as EvidenceStrength;
}

function analyzeTrustCalibration(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Task-specific trust
  if (/(不同.{0,10}任务.{0,10}信任|different.{0,20}task.{0,20}trust)/i.test(content)) {
    score = 2;
  }

  // Trust percentages mentioned
  const trustMentions = content.match(/(\d+)%/g);
  if (trustMentions && trustMentions.length >= 2) {
    score = Math.max(score, 2); // Multiple trust levels = calibration
  } else if (trustMentions) {
    score = Math.max(score, 1);
  }

  // Learning/adjustment
  if (/(发现|learn|adjust).{0,20}(信任|trust)/i.test(content)) {
    score = Math.min(score + 1, 3);
  }

  return score as EvidenceStrength;
}

function analyzeOutputQuality(content: string, lower: string): EvidenceStrength {
  let score = 0;

  if (/(评估|对比|compare|assess|evaluate).{0,20}(质量|quality)/i.test(content)) {
    score = 2;
  } else if (/(质量|quality)/i.test(content)) {
    score = 1;
  }

  return score as EvidenceStrength;
}

function analyzeRiskAssessment(content: string, lower: string): EvidenceStrength {
  let score = 0;

  if (/(风险|后果|consequence|risk).{0,20}(评估|考虑|aware)/i.test(content)) {
    score = 2;
  } else if (/(风险|错误|risk|error)/i.test(content)) {
    score = 1;
  }

  // High-risk awareness
  if (/(高风险|重要|critical|important).{0,30}(验证|careful)/i.test(content)) {
    score = Math.min(score + 1, 3);
  }

  return score as EvidenceStrength;
}

function analyzeCapabilityJudgment(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Independent attempts
  if (/(一定|总是|always).{0,15}(先.{0,10}试|try.{0,10}myself)/i.test(content)) {
    score = 3;
  } else if (/(先.{0,10}试|try.{0,10}first|自己.{0,10}试)/i.test(content)) {
    score = 2;
  }

  // Self-awareness
  if (/(知道.{0,10}(自己|我).{0,10}(能力|strengths|weaknesses))|((自己|我).{0,10}(擅长|不擅长))/i.test(content)) {
    score = Math.max(score, 2);
  }

  // Skill maintenance
  if (/(练习|保持|maintain|practice).{0,20}(技能|skill)/i.test(content)) {
    score = Math.min(score + 1, 3);
  }

  return score as EvidenceStrength;
}

function analyzeStrategyAdjustment(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Iteration frequency
  const iterations = content.match(/(试|try|iterate|adjust|改|refine).{0,30}((\d+)|多|several|again)/gi);
  if (iterations && iterations.length >= 3) {
    score = 3; // High iteration
  } else if (iterations && iterations.length >= 2) {
    score = 2;
  } else if (/(调整|改|iterate|refine|adjust)/i.test(content)) {
    score = 1;
  }

  // Learning from feedback
  if (/(根据|based on|from).{0,15}(反馈|错误|feedback|error).{0,15}(调整|adjust|learn)/i.test(content)) {
    score = Math.min(score + 1, 3);
  }

  return score as EvidenceStrength;
}

function analyzeToolSwitching(content: string, lower: string): EvidenceStrength {
  let score = 0;

  // Count tools mentioned
  const tools = ['gpt', 'chatgpt', 'claude', 'gemini', 'copilot', 'google', 'wolfram'];
  const toolCount = tools.filter(tool => lower.includes(tool)).length;

  score = Math.min(toolCount, 3) as EvidenceStrength;

  // Explicit switching behavior
  if (/(切换|换|switch|change|try different)/i.test(content)) {
    score = Math.min(score + 1, 3) as EvidenceStrength;
  }

  return score;
}

function extractRelevantQuotes(content: string, keywords: string[], maxQuotes: number = 2): string[] {
  const quotes: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (quotes.length >= maxQuotes) break;

    for (const keyword of keywords) {
      if (new RegExp(keyword, 'i').test(line) && line.length > 20 && line.length < 200) {
        quotes.push(line.trim().substring(0, 150));
        break;
      }
    }
  }

  return quotes;
}

// Main processing function
export function codeAllInterviews(inputDir: string, outputPath: string): void {
  console.log('🔬 Advanced Interview Coding Tool');
  console.log('Using semantic analysis and behavior pattern recognition\n');

  const files = fs.readdirSync(inputDir).filter(f => f.match(/^I\d{3}\.txt$/)).sort();
  const trainingData: TrainingDataPoint[] = [];

  for (const file of files) {
    const userId = file.replace('.txt', '');
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`📄 Coding ${userId}...`);

    const { scores, evidence, language } = analyzeInterview(content, userId);
    const totalScore = calculateTotalScore(scores);
    const { pattern, confidence } = determinePattern(scores, totalScore);
    const mlFeatures = calculateMLFeatures(scores);

    // Generate notes with key evidence
    const keyEvidence = evidence
      .filter(e => e.score >= 2)
      .map(e => `${e.subprocess}=${e.score}`)
      .join(', ');

    const notes = `Pattern ${pattern} - ${keyEvidence || 'Low scores across board'} (Lang: ${language})`;

    trainingData.push({
      user_id: userId,
      pattern,
      subprocess_scores: scores,
      ml_features: mlFeatures,
      total_score: totalScore,
      confidence,
      notes,
      metadata: {
        language,
      },
    });

    console.log(`   → Pattern ${pattern} (${confidence}, score: ${totalScore}/36)`);
  }

  // Save to CSV
  const csv = generateCSV(trainingData);
  fs.writeFileSync(outputPath, csv, 'utf-8');

  console.log(`\n✅ Coded ${trainingData.length} interviews`);
  console.log(`📁 Output: ${outputPath}`);

  // Print distribution
  const distribution: Record<string, number> = {};
  trainingData.forEach(point => {
    distribution[point.pattern] = (distribution[point.pattern] || 0) + 1;
  });

  console.log('\n📊 Pattern Distribution:');
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      console.log(`   Pattern ${pattern}: ${count} (${Math.round((count / trainingData.length) * 100)}%)`);
    });
}

// CLI (ES module compatible)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename || process.argv[1].endsWith('advanced-coding.ts');

if (isMainModule) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx advanced-coding.ts <interviews-dir> <output.csv>');
    process.exit(1);
  }

  codeAllInterviews(args[0], args[1]);
}
