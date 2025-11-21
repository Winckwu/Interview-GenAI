/**
 * MR14: Guided Reflection Mechanism - Utilities
 */

import { apiService } from '../../../services/api';

export interface ReflectionPrompt {
  id: string;
  text?: string;
  question?: string;
  options?: string[];
  stage: 'immediate' | 'structured' | 'metacognitive';
}

export interface ReflectionLog {
  timestamp: Date;
  reflections: Record<string, string>;
  conversationSummary: string;
  depthAnalysis: ReflectionDepth;
}

export interface ReflectionDepth {
  level: 'surface' | 'moderate' | 'deep';
  indicators: string[];
  recommendations: string[];
}

const IMMEDIATE_PROMPTS: ReflectionPrompt[] = [
  {
    id: 'what-helped',
    stage: 'immediate',
    options: [
      '✓ Provided new perspective',
      '✓ Filled knowledge gap',
      '✓ Verified my understanding',
      '✓ Exposed my misconception',
      '✓ Clarified confusion',
    ],
  },
  {
    id: 'understanding-level',
    stage: 'immediate',
    options: [
      '⭐⭐⭐⭐⭐ Completely understand (could teach others)',
      '⭐⭐⭐⭐ Mostly understand (have minor questions)',
      '⭐⭐⭐ Somewhat understand (still confused)',
      '⭐⭐ Barely understand (need more help)',
      '⭐ Don\'t understand (need different approach)',
    ],
  },
];

const STRUCTURED_PROMPTS: ReflectionPrompt[] = [
  {
    id: 'what-learned',
    stage: 'structured',
    text: 'What is one key thing you learned from this conversation?',
  },
  {
    id: 'key-difficulty',
    stage: 'structured',
    text: 'What was the hardest part to understand? Why?',
  },
  {
    id: 'how-breakthrough',
    stage: 'structured',
    text: 'How did you overcome the difficulty? What helped?',
  },
  {
    id: 'apply-next',
    stage: 'structured',
    text: 'How will you apply this learning next?',
  },
];

const METACOGNITIVE_PROMPTS: ReflectionPrompt[] = [
  {
    id: 'explain-own-words',
    stage: 'metacognitive',
    text: 'Can you explain the concept in your own words without looking back?',
  },
  {
    id: 'confidence-why',
    stage: 'metacognitive',
    text: 'How confident are you in your understanding? Why?',
  },
  {
    id: 'without-ai',
    stage: 'metacognitive',
    text: 'If you didn\'t have AI, how would you have solved this differently?',
  },
  {
    id: 'strategy-reflection',
    stage: 'metacognitive',
    text: 'Was your AI usage strategy effective? What would you change?',
  },
];

export function generateReflectionPrompts(stage: 'immediate' | 'structured' | 'metacognitive'): ReflectionPrompt[] {
  if (stage === 'immediate') return IMMEDIATE_PROMPTS;
  if (stage === 'structured') return STRUCTURED_PROMPTS;
  return METACOGNITIVE_PROMPTS;
}

export function analyzeReflectionDepth(reflections: Record<string, string>): ReflectionDepth {
  const responses = Object.values(reflections).filter(r => r.length > 0);
  const totalLength = responses.reduce((sum, r) => sum + r.length, 0);
  const avgLength = totalLength / responses.length || 0;

  let level: 'surface' | 'moderate' | 'deep' = 'surface';
  if (avgLength > 150) level = 'moderate';
  if (avgLength > 300) level = 'deep';

  const indicators: string[] = [];
  if (avgLength > 100) indicators.push('Substantial responses provided');
  if (responses.length >= 4) indicators.push('Addressed most prompts');
  if (totalLength > 600) indicators.push('Thorough reflection');

  const recommendations: string[] = [];
  if (level === 'surface') {
    recommendations.push('Try to provide more detailed responses');
    recommendations.push('Consider specific examples from the conversation');
  }
  if (level === 'moderate') {
    recommendations.push('Great reflection! Consider deeper connections to existing knowledge');
  }

  return { level, indicators, recommendations };
}

/**
 * Generate personalized reflection questions using GPT API
 */
export interface PersonalizedReflection {
  immediate: Array<{ question: string; purpose: string }>;
  structured: Array<{ question: string; purpose: string }>;
  metacognitive: Array<{ question: string; purpose: string }>;
  insights: string[];
  growthAreas: string[];
}

export async function generatePersonalizedReflection(
  messages: Array<{ role: string; content: string }>,
  sessionContext?: string
): Promise<PersonalizedReflection | null> {
  try {
    const response = await apiService.ai.generateReflection(messages, sessionContext);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
  } catch (error) {
    console.warn('[MR14] GPT reflection generation failed:', error);
  }
  return null;
}

export default { generateReflectionPrompts, analyzeReflectionDepth, generatePersonalizedReflection };
