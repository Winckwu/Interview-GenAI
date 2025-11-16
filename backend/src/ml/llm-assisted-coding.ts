/**
 * LLM-Assisted Interview Coding
 *
 * Uses Claude's semantic understanding to code interviews according to
 * the 12-subprocess metacognitive framework with evidence-based scoring.
 *
 * Follows constructivist grounded theory approach with:
 * - Three-level evidence strength (✓✓✓=3, ✓✓=2, ✓=1, ✗=0)
 * - High-risk task dominance principle
 * - Mixed pattern recognition
 */

import * as fs from 'fs';
import * as path from 'path';

type EvidenceStrength = 0 | 1 | 2 | 3;
type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type Confidence = 'high' | 'moderate' | 'low';

interface SubprocessCoding {
  subprocess: string;
  score: EvidenceStrength;
  rationale: string;
  evidence: string[]; // Direct quotes
}

interface InterviewAnalysis {
  interviewId: string;
  participant: {
    background: string;
    aiUsageFrequency: string;
  };
  highRiskScenarios: string[];
  lowRiskScenarios: string[];
  subprocessCoding: SubprocessCoding[];
  totalScore: number;
  primaryPattern: Pattern;
  secondaryPattern?: Pattern;
  confidence: Confidence;
  isMixed: boolean;
  analysisSummary: string;
}

const SUBPROCESS_DEFINITIONS = {
  P1: {
    name: 'Task Decomposition',
    description: '将复杂任务分解为子任务或步骤',
    strongEvidence: '明确描述分段、分块、逐步处理的习惯性行为，多次提及，跨情境一致',
    moderateEvidence: '描述了具体的分解行为，至少一次清晰示例',
    weakEvidence: '提及分解概念但无具体行为描述，或仅在特定情境下使用',
  },
  P2: {
    name: 'Goal Setting',
    description: '明确设定任务目标和期望结果',
    strongEvidence: '详细描述如何设定明确、具体的目标，包含评判标准',
    moderateEvidence: '提及设定目标或要求，有一定具体性',
    weakEvidence: '模糊提及目标或期望',
  },
  P3: {
    name: 'Strategy Selection',
    description: '选择和组合多种工具或方法',
    strongEvidence: '使用3+种工具，或根据任务类型系统性调整策略',
    moderateEvidence: '使用2种工具，或有任务适应性考虑',
    weakEvidence: '仅使用1种工具，策略单一',
  },
  P4: {
    name: 'Resource Planning',
    description: '提前准备、自己先做基础工作',
    strongEvidence: '明确的"自己先做，AI辅助"原则，多次强调',
    moderateEvidence: '描述了某些准备行为',
    weakEvidence: '偶尔提及准备',
  },
  M1: {
    name: 'Progress Monitoring',
    description: '持续跟踪任务进展',
    strongEvidence: '描述每一步都检查、持续监控的习惯',
    moderateEvidence: '提及阶段性检查',
    weakEvidence: '模糊提及进度关注',
  },
  M2: {
    name: 'Quality Checking',
    description: '验证AI输出质量',
    strongEvidence: '系统化验证流程（如交叉验证、逐句对比），"每次都"、"总是"等绝对频率词',
    moderateEvidence: '"经常"、"会"进行验证，有具体方法描述',
    weakEvidence: '偶尔验证，或仅意识到应该验证但未实施',
  },
  M3: {
    name: 'Context Monitoring',
    description: '根据情境调整使用方式',
    strongEvidence: '详细描述不同情境下的不同策略，有多个对比示例',
    moderateEvidence: '提及情境差异，至少一个对比',
    weakEvidence: '模糊意识到情境重要性',
  },
  E1: {
    name: 'Result Evaluation',
    description: '评估输出结果质量',
    strongEvidence: '有明确的评价标准和系统化评估流程',
    moderateEvidence: '描述了评价行为和判断依据',
    weakEvidence: '简单的满意/不满意判断',
  },
  E2: {
    name: 'Learning Reflection',
    description: '总结经验、反思学习',
    strongEvidence: '明确描述从使用中总结规律、调整理解',
    moderateEvidence: '提及学习或经验积累',
    weakEvidence: '模糊的学习意识',
  },
  E3: {
    name: 'Capability Judgment',
    description: '判断AI能力边界',
    strongEvidence: '"自己先做"原则，明确AI局限性，任务-能力匹配意识',
    moderateEvidence: '提及AI不擅长某些任务，或选择性信任',
    weakEvidence: '模糊的能力意识',
  },
  R1: {
    name: 'Strategy Adjustment',
    description: '迭代调整、多轮优化',
    strongEvidence: '详细描述多轮调整流程（3+轮），或主动切换方法',
    moderateEvidence: '提及调整或优化，2轮左右',
    weakEvidence: '偶尔调整',
  },
  R2: {
    name: 'Trust Calibration',
    description: '根据任务调整信任水平',
    strongEvidence: '明确区分不同任务类型的信任程度，有具体百分比或对比',
    moderateEvidence: '提及信任差异或校准',
    weakEvidence: '简单的信/不信判断',
  },
};

const PATTERN_DEFINITIONS = {
  A: {
    name: 'Strategic Decomposition & Control',
    description: '战略性分解与控制',
    necessaryConditions: 'P1≥2 AND M2≥2 AND E3≥2 AND total≥24',
    sufficientConditions: 'P1+P4+M2+E3≥10 for high confidence',
    behaviorSignature: '系统分解、严格验证、独立优先',
  },
  B: {
    name: 'Iterative Optimization',
    description: '迭代优化与校准',
    necessaryConditions: 'R1≥2 AND total≥20',
    sufficientConditions: 'R1=3 for high confidence',
    behaviorSignature: '多轮调整、持续优化',
  },
  C: {
    name: 'Context-Sensitive Adaptation',
    description: '情境敏感的适配',
    necessaryConditions: 'P3≥2 AND R2≥2 AND total≥22',
    sufficientConditions: 'P3+M3+R2≥7 for high confidence',
    behaviorSignature: '多工具选择、任务适配、信任校准',
  },
  D: {
    name: 'Deep Verification',
    description: '深度核验与批判性介入',
    necessaryConditions: 'M2=3 AND E1≥2 AND total≥20',
    sufficientConditions: 'Cross-validation or systematic verification',
    behaviorSignature: '交叉验证、深度检查、批判性评估',
  },
  E: {
    name: 'Learning-Oriented',
    description: '教学化反思与自我监控',
    necessaryConditions: 'E1+E2+E3≥6 AND total≥20',
    sufficientConditions: 'All E scores ≥2',
    behaviorSignature: '反思学习、能力判断、持续改进',
  },
  F: {
    name: 'Ineffective/Passive',
    description: '无效与被动使用',
    necessaryConditions: 'total<15 OR (P1=0 AND M2=0 AND E3=0)',
    sufficientConditions: '≥2 core subprocesses (P1,M2,E3) = 0',
    behaviorSignature: '缺乏规划、不验证、盲目信任',
  },
};

/**
 * Analyze a single interview and generate coding
 */
function analyzeInterview(interviewId: string, content: string): InterviewAnalysis {
  console.log(`\n📋 Analyzing ${interviewId}...`);
  console.log(`Content length: ${content.length} chars`);

  // This is a placeholder - in practice, you would:
  // 1. Use Claude API to analyze the interview
  // 2. Or perform manual analysis following the template

  // For now, return a template structure
  return {
    interviewId,
    participant: {
      background: 'To be analyzed',
      aiUsageFrequency: 'To be analyzed',
    },
    highRiskScenarios: [],
    lowRiskScenarios: [],
    subprocessCoding: Object.entries(SUBPROCESS_DEFINITIONS).map(([key, def]) => ({
      subprocess: `${key}: ${def.name}`,
      score: 0 as EvidenceStrength,
      rationale: 'To be analyzed',
      evidence: [],
    })),
    totalScore: 0,
    primaryPattern: 'F',
    confidence: 'low',
    isMixed: false,
    analysisSummary: 'Analysis pending',
  };
}

/**
 * Generate analysis prompt for Claude API
 */
function generateAnalysisPrompt(interviewId: string, content: string): string {
  return `You are an expert qualitative researcher analyzing an interview about AI usage patterns.

INTERVIEW: ${interviewId}

TRANSCRIPT:
${content}

TASK: Analyze this interview using the metacognitive framework with 12 subprocesses. Follow these steps:

1. IDENTIFY SCENARIOS
   - List 2-3 HIGH-RISK scenarios (academic papers, core code, research, critical decisions)
   - List 2-3 LOW-RISK scenarios (daily emails, simple queries, formatting)

2. CODE EACH SUBPROCESS (P1-P4, M1-M3, E1-E3, R1-R2)
   For each subprocess, assign a score 0-3:

   ✓✓✓ (3 = STRONG): Multiple explicit statements + consistent behavior + cross-context evidence + meta-statements
   ✓✓ (2 = MODERATE): Clear behavior description (at least once) OR explicit statement with concrete example
   ✓ (1 = WEAK): Inferred from context OR brief mention without detail
   ✗ (0 = NONE): Not mentioned OR explicitly denied

   CRITICAL DISTINCTIONS:
   - "我知道应该验证" (aware) = 1, NOT 2
   - "我每次都验证" (always does) = 3
   - "我经常验证" (usually does) = 2
   - "我有时验证" (sometimes) = 1
   - "从不验证" (never) = 0

   FOCUS ON HIGH-RISK SCENARIOS for primary pattern determination.

3. SUBPROCESS DEFINITIONS:
   ${Object.entries(SUBPROCESS_DEFINITIONS).map(([key, def]) =>
     `${key} - ${def.name}: ${def.description}
     Strong(3): ${def.strongEvidence}
     Moderate(2): ${def.moderateEvidence}
     Weak(1): ${def.weakEvidence}`
   ).join('\n\n')}

4. DETERMINE PATTERN
   Primary pattern based on HIGH-RISK task behavior:
   ${Object.entries(PATTERN_DEFINITIONS).map(([key, def]) =>
     `Pattern ${key} - ${def.name}: ${def.necessaryConditions}`
   ).join('\n')}

5. OUTPUT FORMAT (JSON):
{
  "participant_background": "...",
  "ai_usage_frequency": "...",
  "high_risk_scenarios": ["scenario 1", "scenario 2"],
  "low_risk_scenarios": ["scenario 1", "scenario 2"],
  "subprocess_scores": {
    "P1": { "score": 0-3, "rationale": "...", "evidence": ["quote 1", "quote 2"] },
    "P2": { "score": 0-3, "rationale": "...", "evidence": ["..."] },
    ...all 12 subprocesses...
  },
  "total_score": 0-36,
  "primary_pattern": "A/B/C/D/E/F",
  "secondary_pattern": "optional if mixed",
  "confidence": "high/moderate/low",
  "is_mixed": true/false,
  "analysis_summary": "2-3 sentences explaining the primary pattern and key evidence"
}

Be rigorous in evidence evaluation. Prefer lower scores when uncertain.`;
}

/**
 * Process all interviews (placeholder for batch processing)
 */
function processAllInterviews(inputDir: string, outputDir: string): void {
  console.log('🔬 LLM-Assisted Interview Coding');
  console.log('Using Claude for semantic analysis\n');

  const files = fs.readdirSync(inputDir)
    .filter(f => f.match(/^I\d{3}\.txt$/))
    .sort();

  console.log(`Found ${files.length} interviews\n`);
  console.log('INSTRUCTIONS:');
  console.log('1. This tool generates analysis prompts for Claude API');
  console.log('2. Copy each prompt to Claude or use API integration');
  console.log('3. Save responses as JSON in output directory\n');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate prompts for first 5 interviews as examples
  for (let i = 0; i < Math.min(5, files.length); i++) {
    const file = files[i];
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const interviewId = file.replace('.txt', '');

    const prompt = generateAnalysisPrompt(interviewId, content);
    const promptPath = path.join(outputDir, `${interviewId}_prompt.txt`);

    fs.writeFileSync(promptPath, prompt, 'utf-8');
    console.log(`✅ Generated prompt: ${promptPath}`);
  }

  console.log(`\n📁 Prompts saved to: ${outputDir}`);
  console.log('\nNEXT STEPS:');
  console.log('1. Review the generated prompts');
  console.log('2. Process through Claude (manually or via API)');
  console.log('3. Save responses as {interview_id}_analysis.json');
  console.log('4. Run aggregation script to compile results');
}

// Export for testing
export {
  analyzeInterview,
  generateAnalysisPrompt,
  SUBPROCESS_DEFINITIONS,
  PATTERN_DEFINITIONS,
};

// CLI
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename || process.argv[1].endsWith('llm-assisted-coding.ts');

if (isMainModule) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx llm-assisted-coding.ts <interviews-dir> <output-dir>');
    console.error('Example: npx tsx llm-assisted-coding.ts ./interviews-split ./llm-analysis');
    process.exit(1);
  }

  processAllInterviews(args[0], args[1]);
}
