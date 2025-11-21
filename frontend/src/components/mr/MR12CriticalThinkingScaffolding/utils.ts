/**
 * MR12: Critical Thinking Scaffolding - Utilities
 */

import { apiService } from '../../../services/api';

export type DomainType = 'code' | 'writing' | 'analysis' | 'math' | 'general';

export interface CriticalQuestion {
  id: string;
  question: string;
  hint: string;
  guidance: string;
}

export interface CriticalAssessment {
  score: number;
  level: 'weak' | 'moderate' | 'strong';
  strengths: string[];
  areasToConsider: string[];
  interpretation: string;
}

const UNIVERSAL_QUESTIONS: CriticalQuestion[] = [
  {
    id: 'assumptions',
    question: 'What assumptions does this answer make? Do you agree with them?',
    hint: 'Look for unstated beliefs that underlie the response',
    guidance: 'Strong critical thinkers identify hidden assumptions first',
  },
  {
    id: 'evidence',
    question: 'What evidence supports this claim? Is it sufficient?',
    hint: 'Look for data, sources, citations, or logical reasoning',
    guidance: 'Check if evidence is relevant, recent, and from reliable sources',
  },
  {
    id: 'alternatives',
    question: 'What are alternative explanations or approaches?',
    hint: 'Could the same evidence support a different conclusion?',
    guidance: 'Always consider at least 2 alternative perspectives',
  },
  {
    id: 'logic',
    question: 'Is the logical chain complete? Are there any jumps?',
    hint: 'Follow the argument step by step',
    guidance: 'Each conclusion should follow necessarily from its premises',
  },
  {
    id: 'bias',
    question: 'Could bias or conflicts of interest affect this answer?',
    hint: 'Who benefits? What might they ignore?',
    guidance: 'All sources have some perspective; identify it',
  },
];

const DOMAIN_CHECKLISTS: Record<DomainType, string[]> = {
  code: [
    'Edge cases handled (null, empty, negative)?',
    'Error handling implemented?',
    'Security vulnerabilities checked?',
    'Performance implications considered?',
    'Code readable and maintainable?',
    'Follows team standards?',
  ],
  writing: [
    'Argument is logically coherent?',
    'Evidence supports claims?',
    'Counterarguments addressed?',
    'Tone appropriate for audience?',
    'Grammar and spelling correct?',
    'Plagiarism check completed?',
  ],
  analysis: [
    'Data sources reliable?',
    'Sample size adequate?',
    'Confounding variables considered?',
    'Causation vs correlation distinguished?',
    'Limitations acknowledged?',
    'Alternative interpretations explored?',
  ],
  math: [
    'Problem is understood correctly?',
    'All assumptions stated?',
    'Each step is justified?',
    'Units are consistent?',
    'Answer passes sanity check?',
    'Solution method is efficient?',
  ],
  general: [
    'Main claim is clear?',
    'Supporting evidence is strong?',
    'Assumptions are reasonable?',
    'Alternative perspectives considered?',
    'Limitations acknowledged?',
    'Next steps are clear?',
  ],
};

export function generateCriticalQuestions(domain: DomainType): CriticalQuestion[] {
  return UNIVERSAL_QUESTIONS;
}

export function getDomainChecklist(domain: DomainType): string[] {
  return DOMAIN_CHECKLISTS[domain] || DOMAIN_CHECKLISTS.general;
}

export function assessCriticalThinking(
  domain: DomainType,
  responses: Record<string, string>
): CriticalAssessment {
  const responseCount = Object.values(responses).filter(r => r.length > 0).length;
  const avgLength = Object.values(responses).reduce((sum, r) => sum + r.length, 0) / responseCount || 0;

  const score = Math.min((responseCount / 5) * (1 + Math.min(avgLength / 200, 1)), 1);
  const level: 'weak' | 'moderate' | 'strong' =
    score >= 0.75 ? 'strong' : score >= 0.5 ? 'moderate' : 'weak';

  return {
    score,
    level,
    strengths:
      level === 'strong'
        ? ['Thorough analysis', 'Identifies multiple perspectives', 'Strong logical reasoning']
        : ['Some critical thinking shown', 'Good question identification'],
    areasToConsider:
      level === 'weak'
        ? ['Develop deeper analysis', 'Consider more perspectives', 'Build logical reasoning']
        : ['Explore alternative viewpoints', 'Strengthen evidence evaluation'],
    interpretation:
      level === 'strong'
        ? 'You demonstrate strong critical thinking skills. Continue this systematic approach.'
        : level === 'moderate'
          ? 'You show good critical thinking but could deepen your analysis further.'
          : 'Consider developing a more systematic critical thinking approach.',
  };
}

/**
 * AI-powered critical analysis of content - uses GPT API
 */
export interface AIContentAnalysis {
  overallScore: number;
  issues: Array<{
    type: string;
    severity: string;
    location: string;
    explanation: string;
    suggestion: string;
  }>;
  strengths: string[];
  recommendations: string[];
}

export async function analyzeContentCritically(
  content: string,
  taskType: string = 'general'
): Promise<AIContentAnalysis | null> {
  try {
    const response = await apiService.ai.criticalAnalysis(content, taskType);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
  } catch (error) {
    console.warn('[MR12] GPT critical analysis failed:', error);
  }
  return null;
}

export default { generateCriticalQuestions, getDomainChecklist, assessCriticalThinking, analyzeContentCritically };
