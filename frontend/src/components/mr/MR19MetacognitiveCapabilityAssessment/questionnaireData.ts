/**
 * MR19: Self-Report Questionnaire Data
 * 36-item metacognitive behavior frequency assessment
 * Based on Schraw & Dennison (1994) MAI and 12-subprocess framework
 */

export type QuestionID = string; // Format: "P1.1", "M2.3", etc.

export interface QuestionItem {
  id: QuestionID;
  dimension: string; // P1, P2, M1, etc.
  category: 'Planning' | 'Monitoring' | 'Evaluation' | 'Regulation';
  text: string;
  textCN: string; // Chinese translation
  reversed: boolean; // True for reverse-scored items
}

/**
 * 36-item questionnaire covering 12 subdimensions
 * 3 items per subdimension
 */
export const QUESTIONNAIRE_ITEMS: QuestionItem[] = [
  // ========== PLANNING (P1-P4, 12 items) ==========

  // P1: Task Decomposition (3 items)
  {
    id: 'P1.1',
    dimension: 'P1',
    category: 'Planning',
    text: 'Before asking AI to help me, I break down the task into smaller steps.',
    textCN: '在让AI帮助我之前，我会先将任务分解为更小的步骤。',
    reversed: false,
  },
  {
    id: 'P1.2',
    dimension: 'P1',
    category: 'Planning',
    text: 'I create a list of sub-goals and work through them one by one with AI.',
    textCN: '我会列出任务的子目标清单，然后逐个与AI协作完成。',
    reversed: false,
  },
  {
    id: 'P1.3',
    dimension: 'P1',
    category: 'Planning',
    text: 'I typically give the entire task to AI without breaking it down. (Reverse)',
    textCN: '我通常把整个任务直接交给AI，不做拆分。（反向）',
    reversed: true,
  },

  // P2: Goal Setting (3 items)
  {
    id: 'P2.1',
    dimension: 'P2',
    category: 'Planning',
    text: 'Before working with AI, I clearly define what success looks like (e.g., "Output should include X, Y, Z").',
    textCN: '在开始与AI协作前，我会明确定义成功标准（例如："输出应该包含X、Y、Z要素"）。',
    reversed: false,
  },
  {
    id: 'P2.2',
    dimension: 'P2',
    category: 'Planning',
    text: 'I specify my concrete goals explicitly in my prompts to the AI.',
    textCN: '我会在提示词中明确说明我想要达到的具体目标。',
    reversed: false,
  },
  {
    id: 'P2.3',
    dimension: 'P2',
    category: 'Planning',
    text: 'I set clear quality benchmarks for each sub-task.',
    textCN: '我对每个子任务都设定了清晰的质量基准。',
    reversed: false,
  },

  // P3: Strategy Selection (3 items)
  {
    id: 'P3.1',
    dimension: 'P3',
    category: 'Planning',
    text: 'I choose different prompting strategies based on task characteristics (e.g., step-by-step for code, creative for writing).',
    textCN: '我会根据任务特性选择不同的提示策略（例如：写代码用分步，写文章用创意）。',
    reversed: false,
  },
  {
    id: 'P3.2',
    dimension: 'P3',
    category: 'Planning',
    text: 'I consider multiple AI collaboration approaches and select the one best suited for the current task.',
    textCN: '我会考虑多种AI协作方式，选择最适合当前任务的方法。',
    reversed: false,
  },
  {
    id: 'P3.3',
    dimension: 'P3',
    category: 'Planning',
    text: 'No matter what the task, I use the same way to interact with AI. (Reverse)',
    textCN: '无论什么任务，我都用相同的方式与AI交互。（反向）',
    reversed: true,
  },

  // P4: Resource Planning (3 items)
  {
    id: 'P4.1',
    dimension: 'P4',
    category: 'Planning',
    text: 'I clearly define which parts of the work I should do myself and which parts AI should assist with.',
    textCN: '我会明确划分哪些工作自己做，哪些让AI辅助。',
    reversed: false,
  },
  {
    id: 'P4.2',
    dimension: 'P4',
    category: 'Planning',
    text: 'I insist that core thinking is done by me, with AI only handling supportive work.',
    textCN: '我坚持核心思考由自己完成，AI只负责辅助性工作。',
    reversed: false,
  },
  {
    id: 'P4.3',
    dimension: 'P4',
    category: 'Planning',
    text: 'Before using AI, I try to think through the problem independently first.',
    textCN: '使用AI前，我会先尝试独立思考这个问题。',
    reversed: false,
  },

  // ========== MONITORING (M1-M3, 9 items) ==========

  // M1: Progress Tracking (3 items)
  {
    id: 'M1.1',
    dimension: 'M1',
    category: 'Monitoring',
    text: 'In multi-step tasks, I track "which step am I on now".',
    textCN: '在多步骤任务中，我会追踪"已完成到第几步"。',
    reversed: false,
  },
  {
    id: 'M1.2',
    dimension: 'M1',
    category: 'Monitoring',
    text: 'I periodically check whether current progress aligns with the expected timeline.',
    textCN: '我会定期检查当前进展是否符合预期时间线。',
    reversed: false,
  },
  {
    id: 'M1.3',
    dimension: 'M1',
    category: 'Monitoring',
    text: 'After AI gives output, I confirm "did this solve my sub-goal?"',
    textCN: '当AI给出输出后，我会确认"这解决了我的子目标吗？"',
    reversed: false,
  },

  // M2: Quality Checking (3 items)
  {
    id: 'M2.1',
    dimension: 'M2',
    category: 'Monitoring',
    text: 'I review AI-generated code/text line-by-line rather than using it directly.',
    textCN: '我会逐行检查AI生成的代码/文本，而非直接使用。',
    reversed: false,
  },
  {
    id: 'M2.2',
    dimension: 'M2',
    category: 'Monitoring',
    text: 'I verify correctness of AI outputs through testing or cross-validation.',
    textCN: '我会通过测试或交叉验证来确认AI输出的正确性。',
    reversed: false,
  },
  {
    id: 'M2.3',
    dimension: 'M2',
    category: 'Monitoring',
    text: 'I usually assume AI output is correct and don\'t spend time verifying. (Reverse)',
    textCN: '我通常假设AI的输出是正确的，不花时间验证。（反向）',
    reversed: true,
  },

  // M3: Context Monitoring (3 items)
  {
    id: 'M3.1',
    dimension: 'M3',
    category: 'Monitoring',
    text: 'I adjust my trust in AI based on task risk (high risk → low trust, low risk → high trust).',
    textCN: '我会根据任务风险调整对AI的信任程度（高风险→低信任，低风险→高信任）。',
    reversed: false,
  },
  {
    id: 'M3.2',
    dimension: 'M3',
    category: 'Monitoring',
    text: 'For different types of tasks, I use different levels of verification strictness.',
    textCN: '对于不同类型任务，我使用不同的验证严格程度。',
    reversed: false,
  },
  {
    id: 'M3.3',
    dimension: 'M3',
    category: 'Monitoring',
    text: 'I recognize that AI is more reliable for certain tasks and needs more oversight for others.',
    textCN: '我会意识到AI在某些任务上更可靠，在其他任务上需要更多监督。',
    reversed: false,
  },

  // ========== EVALUATION (E1-E3, 9 items) ==========

  // E1: Result Evaluation (3 items)
  {
    id: 'E1.1',
    dimension: 'E1',
    category: 'Evaluation',
    text: 'After completing a task, I systematically evaluate output quality.',
    textCN: '任务完成后，我会系统性地评估输出质量。',
    reversed: false,
  },
  {
    id: 'E1.2',
    dimension: 'E1',
    category: 'Evaluation',
    text: 'I compare AI output against my expected standards item by item.',
    textCN: '我会将AI的输出与我的预期标准逐项对照。',
    reversed: false,
  },
  {
    id: 'E1.3',
    dimension: 'E1',
    category: 'Evaluation',
    text: 'I compare multiple solutions and select the best output.',
    textCN: '我会比较多个方案，选择最佳输出。',
    reversed: false,
  },

  // E2: Learning Reflection (3 items)
  {
    id: 'E2.1',
    dimension: 'E2',
    category: 'Evaluation',
    text: 'I reflect on "what did I learn through this collaboration?"',
    textCN: '我会思考"通过这次协作我学到了什么"。',
    reversed: false,
  },
  {
    id: 'E2.2',
    dimension: 'E2',
    category: 'Evaluation',
    text: 'I record which strategies worked and which didn\'t for future improvement.',
    textCN: '我会记录哪些策略有效，哪些无效，以便未来改进。',
    reversed: false,
  },
  {
    id: 'E2.3',
    dimension: 'E2',
    category: 'Evaluation',
    text: 'I analyze AI responses to deepen my understanding of the problem.',
    textCN: '我会分析AI的回答来加深我对问题的理解。',
    reversed: false,
  },

  // E3: Capability Judgment (3 items)
  {
    id: 'E3.1',
    dimension: 'E3',
    category: 'Evaluation',
    text: 'I periodically assess "what could I achieve without AI?"',
    textCN: '我会定期评估"不用AI我能做到什么程度"。',
    reversed: false,
  },
  {
    id: 'E3.2',
    dimension: 'E3',
    category: 'Evaluation',
    text: 'I pay attention to whether my skills are degrading due to AI reliance.',
    textCN: '我关注自己的技能是否因依赖AI而退化。',
    reversed: false,
  },
  {
    id: 'E3.3',
    dimension: 'E3',
    category: 'Evaluation',
    text: 'I recognize AI\'s capability boundaries (what it\'s good at, what it\'s not).',
    textCN: '我会识别AI的能力边界（擅长什么，不擅长什么）。',
    reversed: false,
  },

  // ========== REGULATION (R1-R2, 6 items) ==========

  // R1: Strategy Adjustment (3 items)
  {
    id: 'R1.1',
    dimension: 'R1',
    category: 'Regulation',
    text: 'When AI output doesn\'t meet expectations, I adjust my prompting strategy.',
    textCN: '当AI的输出不符合预期时，我会调整我的提示策略。',
    reversed: false,
  },
  {
    id: 'R1.2',
    dimension: 'R1',
    category: 'Regulation',
    text: 'I iterate multiple rounds for improvement rather than accepting the first output.',
    textCN: '我会进行多轮迭代改进，而非接受第一次输出。',
    reversed: false,
  },
  {
    id: 'R1.3',
    dimension: 'R1',
    category: 'Regulation',
    text: 'I record "what methods work" and apply them in future tasks.',
    textCN: '我会记录"什么方法有效"，并在未来任务中应用。',
    reversed: false,
  },

  // R2: Trust Calibration (3 items)
  {
    id: 'R2.1',
    dimension: 'R2',
    category: 'Regulation',
    text: 'I try different AI tools/models and compare their strengths and weaknesses.',
    textCN: '我会尝试不同的AI工具/模型，比较它们的优劣。',
    reversed: false,
  },
  {
    id: 'R2.2',
    dimension: 'R2',
    category: 'Regulation',
    text: 'When AI consistently makes errors, I reduce trust and increase human oversight.',
    textCN: '当AI持续出错时，我会降低信任并增加人工监督。',
    reversed: false,
  },
  {
    id: 'R2.3',
    dimension: 'R2',
    category: 'Regulation',
    text: 'I dynamically adjust my reliance on AI based on task type.',
    textCN: '我会根据任务类型动态调整对AI的依赖程度。',
    reversed: false,
  },
];

/**
 * Rating scale labels
 */
export const RATING_LABELS = {
  1: { en: 'Never', cn: '从不', description: '0% of the time' },
  2: { en: 'Rarely', cn: '很少', description: '~20% of the time' },
  3: { en: 'Sometimes', cn: '有时', description: '~50% of the time' },
  4: { en: 'Often', cn: '经常', description: '~80% of the time' },
  5: { en: 'Always', cn: '总是', description: '100% of the time' },
};

/**
 * Subdimension labels
 */
export const SUBDIMENSION_LABELS: Record<string, { en: string; cn: string }> = {
  P1: { en: 'Task Decomposition', cn: '任务分解' },
  P2: { en: 'Goal Setting', cn: '目标设定' },
  P3: { en: 'Strategy Selection', cn: '策略选择' },
  P4: { en: 'Resource Planning', cn: '资源规划' },
  M1: { en: 'Progress Tracking', cn: '进度追踪' },
  M2: { en: 'Quality Checking', cn: '质量检查' },
  M3: { en: 'Context Monitoring', cn: '上下文监控' },
  E1: { en: 'Result Evaluation', cn: '结果评估' },
  E2: { en: 'Learning Reflection', cn: '学习反思' },
  E3: { en: 'Capability Judgment', cn: '能力判断' },
  R1: { en: 'Strategy Adjustment', cn: '策略调整' },
  R2: { en: 'Trust Calibration', cn: '信任校准' },
};

/**
 * Category labels
 */
export const CATEGORY_LABELS = {
  Planning: { en: 'Planning', cn: '规划', icon: '📐' },
  Monitoring: { en: 'Monitoring', cn: '监控', icon: '👁️' },
  Evaluation: { en: 'Evaluation', cn: '评估', icon: '⚖️' },
  Regulation: { en: 'Regulation', cn: '调节', icon: '🔄' },
};
