/**
 * MR12: Critical Thinking Scaffolding - Utilities
 *
 * New design: Guided one-question-at-a-time flow with content-type specific questions
 */

export type ContentType = 'code' | 'math' | 'writing' | 'design' | 'general';

export type ResponseOption = 'yes' | 'no' | 'unsure' | 'skip';

export interface ThinkingQuestion {
  id: string;
  question: string;
  description: string;
  options: {
    yes: { label: string; tip: string };
    no: { label: string; tip: string };
    unsure: { label: string; tip: string };
  };
  followUpTip: string;
}

export interface UserResponse {
  questionId: string;
  response: ResponseOption;
  timestamp: number;
}

export interface ThinkingAssessment {
  contentType: ContentType;
  responses: UserResponse[];
  completedAt: number;
  needsVerification: boolean;
  summary: string;
}

/**
 * Content-type specific questions
 */
const CODE_QUESTIONS: ThinkingQuestion[] = [
  {
    id: 'code-edge-cases',
    question: 'Edge cases handled?',
    description: 'Empty arrays, null values, negative numbers, etc.',
    options: {
      yes: { label: 'Yes, checked', tip: 'Good! Edge cases are common bug sources.' },
      no: { label: 'No, missing', tip: 'Add tests for: [], null, -1, MAX_INT, empty string' },
      unsure: { label: 'Need to test', tip: 'Try these inputs: [], null, undefined, -1, ""' },
    },
    followUpTip: 'Run unit tests with boundary values to verify.',
  },
  {
    id: 'code-errors',
    question: 'Error handling OK?',
    description: 'Try-catch, validation, graceful failures',
    options: {
      yes: { label: 'Yes, handled', tip: 'Good! Robust error handling prevents crashes.' },
      no: { label: 'No, missing', tip: 'Add try-catch for risky operations, validate inputs' },
      unsure: { label: 'Need to check', tip: 'Look for: network calls, file I/O, user input, parsing' },
    },
    followUpTip: 'Consider what happens when things fail.',
  },
  {
    id: 'code-performance',
    question: 'Performance acceptable?',
    description: 'Time complexity, memory usage, scalability',
    options: {
      yes: { label: 'Yes, efficient', tip: 'Good! Always consider scale.' },
      no: { label: 'Could be better', tip: 'Look for nested loops, repeated calculations, large copies' },
      unsure: { label: 'Need to profile', tip: 'Test with large inputs (1000+, 10000+ items)' },
    },
    followUpTip: 'O(n) is usually fine, O(n²) be careful, O(2^n) avoid.',
  },
  {
    id: 'code-security',
    question: 'Security risks?',
    description: 'Injection, XSS, sensitive data exposure',
    options: {
      yes: { label: 'Yes, safe', tip: 'Good! Security is often overlooked.' },
      no: { label: 'Has risks', tip: 'Sanitize inputs, escape outputs, validate permissions' },
      unsure: { label: 'Need review', tip: 'Check: user inputs, SQL/HTML, auth, secrets in code' },
    },
    followUpTip: 'Never trust user input. Always sanitize and validate.',
  },
];

const MATH_QUESTIONS: ThinkingQuestion[] = [
  {
    id: 'math-understand',
    question: 'Problem understood?',
    description: 'Do you understand what is being asked?',
    options: {
      yes: { label: 'Yes, clear', tip: 'Good! Clear understanding is the first step.' },
      no: { label: 'Confused', tip: 'Re-read the problem, identify knowns and unknowns' },
      unsure: { label: 'Partially', tip: 'Write down: What is given? What is asked?' },
    },
    followUpTip: 'Restate the problem in your own words.',
  },
  {
    id: 'math-steps',
    question: 'Steps complete?',
    description: 'Is each step of the derivation shown and justified?',
    options: {
      yes: { label: 'Yes, complete', tip: 'Good! Clear steps help catch errors.' },
      no: { label: 'Gaps exist', tip: 'Fill in missing steps, don\'t skip algebra' },
      unsure: { label: 'Need to verify', tip: 'Work through each step manually' },
    },
    followUpTip: 'Check each transformation: is it mathematically valid?',
  },
  {
    id: 'math-calculation',
    question: 'Calculations correct?',
    description: 'Any arithmetic or algebraic errors?',
    options: {
      yes: { label: 'Yes, verified', tip: 'Good! Rechecking prevents silly mistakes.' },
      no: { label: 'Found errors', tip: 'Redo the calculation step by step' },
      unsure: { label: 'Need to check', tip: 'Use a calculator or compute by hand again' },
    },
    followUpTip: 'Try plugging the answer back into the original equation.',
  },
  {
    id: 'math-reasonable',
    question: 'Answer reasonable?',
    description: 'Does the answer make sense? Right units? Right magnitude?',
    options: {
      yes: { label: 'Yes, sensible', tip: 'Good! Sanity checks catch big errors.' },
      no: { label: 'Seems off', tip: 'Check units, estimate expected range, verify sign' },
      unsure: { label: 'Hard to tell', tip: 'Estimate roughly, compare with similar problems' },
    },
    followUpTip: 'If distance is negative or probability > 1, something is wrong.',
  },
];

const WRITING_QUESTIONS: ThinkingQuestion[] = [
  {
    id: 'writing-thesis',
    question: 'Main point clear?',
    description: 'Is there a clear central argument or thesis?',
    options: {
      yes: { label: 'Yes, clear', tip: 'Good! A strong thesis guides the reader.' },
      no: { label: 'Unclear', tip: 'Ask: What is the ONE thing this piece argues?' },
      unsure: { label: 'Somewhat', tip: 'Try summarizing in one sentence' },
    },
    followUpTip: 'Every paragraph should support the main point.',
  },
  {
    id: 'writing-evidence',
    question: 'Evidence sufficient?',
    description: 'Are claims backed by data, examples, or citations?',
    options: {
      yes: { label: 'Yes, supported', tip: 'Good! Evidence builds credibility.' },
      no: { label: 'Lacks support', tip: 'Add: statistics, quotes, examples, studies' },
      unsure: { label: 'Some gaps', tip: 'Check each major claim - is it proven or assumed?' },
    },
    followUpTip: 'Distinguish opinion from fact. Back up opinions with evidence.',
  },
  {
    id: 'writing-counterargument',
    question: 'Counterarguments addressed?',
    description: 'Does it consider opposing viewpoints?',
    options: {
      yes: { label: 'Yes, considered', tip: 'Good! Acknowledging opposition strengthens arguments.' },
      no: { label: 'One-sided', tip: 'Add: "Critics might argue...", "On the other hand..."' },
      unsure: { label: 'Partially', tip: 'Think: What would a skeptic say?' },
    },
    followUpTip: 'Addressing counterarguments shows intellectual honesty.',
  },
  {
    id: 'writing-bias',
    question: 'Bias or assumptions?',
    description: 'Are there hidden assumptions or one-sided perspectives?',
    options: {
      yes: { label: 'Found some', tip: 'Consider if the bias affects the conclusion' },
      no: { label: 'Seems balanced', tip: 'Good! But stay alert for subtle bias.' },
      unsure: { label: 'Need to check', tip: 'Ask: Who benefits? What\'s left out?' },
    },
    followUpTip: 'Everyone has perspective. Identify it, don\'t ignore it.',
  },
];

const DESIGN_QUESTIONS: ThinkingQuestion[] = [
  {
    id: 'design-requirements',
    question: 'Requirements covered?',
    description: 'Does the design address all stated requirements?',
    options: {
      yes: { label: 'Yes, all covered', tip: 'Good! Requirements alignment is key.' },
      no: { label: 'Missing some', tip: 'List requirements, check each one' },
      unsure: { label: 'Need to verify', tip: 'Make a checklist of requirements' },
    },
    followUpTip: 'Missed requirements cause costly rework later.',
  },
  {
    id: 'design-edge-cases',
    question: 'Edge cases considered?',
    description: 'What about unusual inputs, errors, edge scenarios?',
    options: {
      yes: { label: 'Yes, handled', tip: 'Good! Edge cases often cause real-world failures.' },
      no: { label: 'Not really', tip: 'Think: What if empty? What if too large? What if error?' },
      unsure: { label: 'Some maybe', tip: 'List 5 unusual scenarios and trace through' },
    },
    followUpTip: 'Users will do unexpected things. Plan for it.',
  },
  {
    id: 'design-feasibility',
    question: 'Technically feasible?',
    description: 'Can this actually be built with current technology/resources?',
    options: {
      yes: { label: 'Yes, doable', tip: 'Good! Feasibility check prevents wasted effort.' },
      no: { label: 'Has blockers', tip: 'Identify blockers early, find alternatives' },
      unsure: { label: 'Need to research', tip: 'Prototype the risky parts first' },
    },
    followUpTip: 'Build a small proof-of-concept for uncertain parts.',
  },
  {
    id: 'design-alternatives',
    question: 'Alternatives explored?',
    description: 'Were other approaches considered? Why was this one chosen?',
    options: {
      yes: { label: 'Yes, compared', tip: 'Good! Comparing options leads to better decisions.' },
      no: { label: 'First idea only', tip: 'Generate 2-3 alternatives, compare trade-offs' },
      unsure: { label: 'Somewhat', tip: 'Make a pros/cons table for each approach' },
    },
    followUpTip: 'The first idea is rarely the best. Explore options.',
  },
];

const GENERAL_QUESTIONS: ThinkingQuestion[] = [
  {
    id: 'general-understand',
    question: 'Do you understand it?',
    description: 'Can you explain this in your own words?',
    options: {
      yes: { label: 'Yes, clear', tip: 'Good! Understanding is the foundation.' },
      no: { label: 'Confused', tip: 'Ask for clarification, break it into parts' },
      unsure: { label: 'Mostly', tip: 'Try explaining it to someone else' },
    },
    followUpTip: 'If you can\'t explain it simply, you don\'t understand it well enough.',
  },
  {
    id: 'general-accurate',
    question: 'Is it accurate?',
    description: 'Are the facts and claims correct?',
    options: {
      yes: { label: 'Yes, verified', tip: 'Good! Always verify important facts.' },
      no: { label: 'Found errors', tip: 'Cross-check with reliable sources' },
      unsure: { label: 'Need to check', tip: 'Search for the key claims, verify sources' },
    },
    followUpTip: 'Use MR11 Verification to fact-check specific claims.',
  },
  {
    id: 'general-complete',
    question: 'Is it complete?',
    description: 'Is anything important missing?',
    options: {
      yes: { label: 'Yes, comprehensive', tip: 'Good! Completeness prevents gaps.' },
      no: { label: 'Missing parts', tip: 'Ask: What else should be included?' },
      unsure: { label: 'Maybe gaps', tip: 'List what you expected vs what\'s provided' },
    },
    followUpTip: 'Missing information can be as misleading as wrong information.',
  },
  {
    id: 'general-useful',
    question: 'Is it useful?',
    description: 'Does it actually help with your task?',
    options: {
      yes: { label: 'Yes, helpful', tip: 'Good! Usefulness is what matters.' },
      no: { label: 'Not really', tip: 'Clarify what you need, ask a more specific question' },
      unsure: { label: 'Partially', tip: 'Identify which parts are useful, ask for more on those' },
    },
    followUpTip: 'If it\'s not useful, rephrase your question or ask for specifics.',
  },
];

/**
 * Get questions for a specific content type
 */
export function getQuestionsForType(contentType: ContentType): ThinkingQuestion[] {
  switch (contentType) {
    case 'code':
      return CODE_QUESTIONS;
    case 'math':
      return MATH_QUESTIONS;
    case 'writing':
      return WRITING_QUESTIONS;
    case 'design':
      return DESIGN_QUESTIONS;
    default:
      return GENERAL_QUESTIONS;
  }
}

/**
 * Auto-detect content type from text
 */
export function detectContentType(text: string): ContentType {
  const trimmed = text.trim().toLowerCase();

  // Code detection
  const codePatterns = [
    /^(function|const|let|var|class|import|export|if|for|while|return|def|public|private)\s/m,
    /[{}\[\]();]\s*$/m,
    /=>\s*{/,
    /\b(async|await|try|catch|throw)\b/,
    /^\s*(\/\/|#|\/\*)/m,
  ];
  if (codePatterns.some(p => p.test(text))) {
    return 'code';
  }

  // Math detection
  const mathPatterns = [
    /[=+\-*/^]\s*\d/,
    /\b(sin|cos|tan|log|sqrt|sum|integral|derivative)\b/i,
    /\d+\s*[+\-*/^]\s*\d+/,
    /[∫∑∏√π∞≤≥≠±×÷]/,
    /\b(equation|formula|calculate|solve|proof)\b/i,
  ];
  if (mathPatterns.some(p => p.test(text))) {
    return 'math';
  }

  // Design detection
  const designPatterns = [
    /\b(design|architecture|component|module|interface|api|schema|diagram|flow)\b/i,
    /\b(requirement|specification|user story|use case)\b/i,
    /\b(database|backend|frontend|microservice|endpoint)\b/i,
  ];
  if (designPatterns.some(p => p.test(text))) {
    return 'design';
  }

  // Writing detection (longer text with paragraphs)
  if (text.length > 200 && text.includes('\n\n')) {
    return 'writing';
  }

  return 'general';
}

/**
 * Get content type display info
 */
export function getContentTypeInfo(type: ContentType): { icon: string; label: string; color: string } {
  switch (type) {
    case 'code':
      return { icon: '💻', label: 'Code', color: '#3b82f6' };
    case 'math':
      return { icon: '🔢', label: 'Math', color: '#8b5cf6' };
    case 'writing':
      return { icon: '📝', label: 'Writing', color: '#10b981' };
    case 'design':
      return { icon: '🎨', label: 'Design', color: '#f59e0b' };
    default:
      return { icon: '💬', label: 'General', color: '#6b7280' };
  }
}

/**
 * Generate assessment based on responses
 */
export function generateAssessment(
  contentType: ContentType,
  responses: UserResponse[]
): ThinkingAssessment {
  const needsVerification = responses.some(r => r.response === 'no' || r.response === 'unsure');

  let summary = '';
  const issues = responses.filter(r => r.response === 'no').length;
  const unsures = responses.filter(r => r.response === 'unsure').length;
  const oks = responses.filter(r => r.response === 'yes').length;

  if (issues === 0 && unsures === 0) {
    summary = 'All checks passed. The content looks good!';
  } else if (issues > 0) {
    summary = `Found ${issues} issue(s) that need attention.`;
  } else if (unsures > 0) {
    summary = `${unsures} item(s) need verification.`;
  }

  return {
    contentType,
    responses,
    completedAt: Date.now(),
    needsVerification,
    summary,
  };
}

// Keep backward compatibility exports
export type DomainType = ContentType;
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

export function generateCriticalQuestions(domain: DomainType): CriticalQuestion[] {
  const questions = getQuestionsForType(domain);
  return questions.map(q => ({
    id: q.id,
    question: q.question,
    hint: q.description,
    guidance: q.followUpTip,
  }));
}

export function getDomainChecklist(domain: DomainType): string[] {
  const questions = getQuestionsForType(domain);
  return questions.map(q => q.question);
}

export function assessCriticalThinking(
  domain: DomainType,
  responses: Record<string, string>
): CriticalAssessment {
  const responseCount = Object.values(responses).filter(r => r.length > 0).length;
  const avgLength = Object.values(responses).reduce((sum, r) => sum + r.length, 0) / responseCount || 0;
  const score = Math.min((responseCount / 4) * (1 + Math.min(avgLength / 100, 1)), 1);
  const level: 'weak' | 'moderate' | 'strong' =
    score >= 0.75 ? 'strong' : score >= 0.5 ? 'moderate' : 'weak';

  return {
    score,
    level,
    strengths: level === 'strong'
      ? ['Thorough analysis', 'Systematic evaluation']
      : ['Some critical thinking shown'],
    areasToConsider: level === 'weak'
      ? ['Develop deeper analysis', 'Consider more aspects']
      : ['Continue systematic evaluation'],
    interpretation: level === 'strong'
      ? 'Good critical thinking demonstrated.'
      : level === 'moderate'
        ? 'Moderate analysis. Consider going deeper.'
        : 'Try to think more systematically about each aspect.',
  };
}
