/**
 * MR15: Metacognitive Strategy Instruction - Utilities & Content Library
 *
 * Contains:
 * - Strategy library (4 categories: Planning, Monitoring, Evaluation, Regulation)
 * - Case studies (effective vs ineffective examples)
 * - Behavior pattern detection
 * - Scaffold fading logic
 * - Just-in-time prompts
 */

import { apiService } from '../../../services/api';

export type StrategyCategory = 'planning' | 'monitoring' | 'evaluation' | 'regulation';

/**
 * Individual strategy with learning content
 */
export interface Strategy {
  title: string;
  description: string;
  whenToUse: string;
  howToApply: string[];
  whyItMatters: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToLearn: string; // e.g., "5 minutes"
}

/**
 * Case study: real-world example of effective or ineffective use
 */
export interface CaseStudy {
  title: string;
  type: 'effective' | 'ineffective';
  brief: string;
  scenario: string;
  approach: string;
  outcome: string;
  lesson: string;
  relatedStrategies: string[];
}

/**
 * Behavior pattern that triggers just-in-time guidance
 */
export interface BehaviorPattern {
  type: 'short-prompt' | 'no-iteration' | 'no-verification' | 'passive-acceptance';
  indicators: string[];
  risk: 'low' | 'medium' | 'high';
  suggestedStrategies: string[];
}

/**
 * STRATEGY LIBRARY
 * ================================================================
 */

export const STRATEGY_LIBRARY: Record<StrategyCategory, Strategy[]> = {
  /**
   * PLANNING STRATEGIES
   * How to set up AI collaboration effectively
   */
  planning: [
    {
      title: 'Pre-Think Before Asking',
      description: 'Spend 5-10 minutes thinking independently before requesting AI help',
      whenToUse: 'Every time you start a task or hit a problem',
      howToApply: [
        'Set a timer for 5 minutes',
        'Write down your initial thoughts, approaches, or questions',
        'Identify what you already know vs. what you need help with',
        'Then ask AI a targeted question (not a vague one)'
      ],
      whyItMatters:
        'Pre-thinking activates your own knowledge and creates clear question targets. AI responds better to specific questions and you learn more by combining your thinking with AI input.',
      difficulty: 'beginner',
      timeToLearn: '3 minutes'
    },

    {
      title: 'Decompose Complex Tasks First',
      description: 'Break tasks into subtasks before asking AI to help',
      whenToUse: 'For any task with multiple components or steps',
      howToApply: [
        'Write down the main goal',
        'Identify 3-5 subtasks needed to achieve it',
        'Ask AI for help on one subtask at a time',
        'Review each response before moving to the next'
      ],
      whyItMatters:
        'Decomposition increases clarity and reduces errors. It keeps you in control of the overall direction while getting AI help on specific parts.',
      difficulty: 'beginner',
      timeToLearn: '5 minutes'
    },

    {
      title: 'Clarify Your Role & AI Role',
      description: 'Define upfront what you will do vs. what AI will do',
      whenToUse: 'At the start of any significant collaboration',
      howToApply: [
        'State your role: "I will handle design decisions"',
        'State AI role: "Help generate options"',
        'Include boundaries: "Don\'t make final decisions"',
        'Refer back to this agreement during the task'
      ],
      whyItMatters:
        'Clear role boundaries prevent AI from overstepping and keep you actively involved instead of passively accepting outputs.',
      difficulty: 'beginner',
      timeToLearn: '3 minutes'
    },

    {
      title: 'Set Clear Iteration Goals',
      description: 'Plan in advance how many iterations you\'ll do and what each aims to achieve',
      whenToUse: 'Before starting iterative work (writing, coding, design)',
      howToApply: [
        'Plan 2-3 iteration rounds: rough → improved → polished',
        'Define what "improved" means (clarity, detail, accuracy)',
        'Review after each round against your criteria',
        'Stop when goals are met'
      ],
      whyItMatters:
        'Goal-based iteration prevents endless back-and-forth and keeps focus on actual improvement. You maintain strategic control.',
      difficulty: 'intermediate',
      timeToLearn: '8 minutes'
    }
  ],

  /**
   * MONITORING STRATEGIES
   * How to track and adjust during collaboration
   */
  monitoring: [
    {
      title: 'Tag Suspicious AI Outputs',
      description: 'Mark sections of AI output you should verify or are unsure about',
      whenToUse: 'While reading AI responses',
      howToApply: [
        'Use mental notes or highlighting: "Verify this"',
        'Focus on: stats, dates, technical details, claims',
        'Separate what you\'re confident about vs. doubtful',
        'Later: verify the flagged items'
      ],
      whyItMatters:
        'Marking uncertainties creates a verification checklist and prevents errors from slipping through. It\'s active reading, not passive consumption.',
      difficulty: 'beginner',
      timeToLearn: '2 minutes'
    },

    {
      title: 'Regular Comprehension Checks',
      description: 'Stop periodically to confirm you actually understand what AI provided',
      whenToUse: 'After reading complex explanations or code',
      howToApply: [
        'Pause and ask yourself: "Can I explain this in my own words?"',
        'Try summarizing the key points out loud or in writing',
        'If you can\'t explain it, ask AI to clarify',
        'Teach it to someone else or write it down'
      ],
      whyItMatters:
        'Understanding comprehension gaps early prevents misuse and supports real learning instead of just copying outputs.',
      difficulty: 'beginner',
      timeToLearn: '4 minutes'
    },

    {
      title: 'Track Accuracy Over Time',
      description: 'Keep running notes on when AI is right or wrong in your domain',
      whenToUse: 'In ongoing projects over days/weeks',
      howToApply: [
        'Maintain simple log: "AI was right about X, wrong about Y"',
        'Notice patterns: certain topics, formats, etc.',
        'Build personalized trust model for your AI',
        'Adjust how much you verify based on patterns'
      ],
      whyItMatters:
        'Tracking accuracy helps calibrate trust. You learn when to rely on AI vs. when to verify. This builds true expertise.',
      difficulty: 'intermediate',
      timeToLearn: '6 minutes'
    },

    {
      title: 'Monitor Your Independence',
      description: 'Regularly assess whether you could still do this task without AI',
      whenToUse: 'Especially for tasks you perform repeatedly',
      howToApply: [
        'Ask yourself: "Could I do this alone if I needed to?"',
        'If the answer is "no" → spend time learning the skill',
        'Set "AI-free days" where you work alone',
        'Use AI for efficiency, not as a crutch'
      ],
      whyItMatters:
        'Prevents skill degradation (Pattern F). Ensures AI amplifies your abilities rather than replacing them.',
      difficulty: 'advanced',
      timeToLearn: '10 minutes'
    }
  ],

  /**
   * EVALUATION STRATEGIES
   * How to critically assess AI outputs and advice
   */
  evaluation: [
    {
      title: 'Use the 5 Whys Method',
      description: 'Dig into AI reasoning by asking "why" five times',
      whenToUse: 'When AI provides important advice or complex explanations',
      howToApply: [
        'AI says: "You should do X"',
        'You ask: "Why?" → Gets reason 1',
        'You ask: "Why is that?" → Gets reason 2',
        'Continue 3 more times until you reach root logic',
        'Evaluate if root assumption is sound'
      ],
      whyItMatters:
        'Reveals AI\'s reasoning chain. Often finds flawed assumptions or overgeneralizations. Builds critical thinking habit.',
      difficulty: 'intermediate',
      timeToLearn: '7 minutes'
    },

    {
      title: 'Find Counter-Examples',
      description: 'Ask AI for cases where its advice would NOT apply',
      whenToUse: 'After receiving general advice or rules',
      howToApply: [
        'Listen to AI advice',
        'Ask: "When would this NOT work?"',
        'Request edge cases or exceptions',
        'Understand boundary conditions',
        'Update your mental model'
      ],
      whyItMatters:
        'Counter-examples expose limitations and exceptions. Prevents over-applying rules and builds nuanced understanding.',
      difficulty: 'intermediate',
      timeToLearn: '6 minutes'
    },

    {
      title: 'Compare Multiple Sources',
      description: 'Get AI input, but also check other sources independently',
      whenToUse: 'For important decisions or factual claims',
      howToApply: [
        'Get AI\'s answer to question',
        'Check 1-2 other sources (web, books, experts)',
        'Compare alignment and differences',
        'Make decision based on preponderance of evidence',
        'Note AI accuracy for future reference'
      ],
      whyItMatters:
        'Prevents over-reliance on single source. Cross-referencing is cornerstone of critical thinking and quality work.',
      difficulty: 'intermediate',
      timeToLearn: '8 minutes'
    },

    {
      title: 'Assess Bias & Limitations',
      description: 'Critically evaluate what biases might be in AI response',
      whenToUse: 'For subjective topics, controversial issues, recommendations',
      howToApply: [
        'Ask: "What perspective is missing here?"',
        'Ask: "What would the opposite view say?"',
        'Ask: "What assumptions underlie this?"',
        'Ask: "Who might disagree and why?"',
        'Synthesize multiple views'
      ],
      whyItMatters:
        'AI often presents single perspective as complete. This strategy develops bias detection and perspective-taking skills.',
      difficulty: 'advanced',
      timeToLearn: '10 minutes'
    }
  ],

  /**
   * REGULATION STRATEGIES
   * How to adjust your approach based on results
   */
  regulation: [
    {
      title: 'Set Iteration Success Criteria',
      description: 'Define what "better" means before iterating',
      whenToUse: 'Before requesting revisions or variations',
      howToApply: [
        'Define criteria: "Better = more concise, more accurate, clearer"',
        'Give AI specific feedback: "Too long, reduce by 20%"',
        'Review against criteria: "Is it actually better?"',
        'Iterate until criteria met, then stop'
      ],
      whyItMatters:
        'Prevents endless iterations and ensures improvements are real. Keeps you in control of quality targets.',
      difficulty: 'intermediate',
      timeToLearn: '6 minutes'
    },

    {
      title: 'Adjust AI Intervention Level',
      description: 'Change how much you ask AI to do based on task importance',
      whenToUse: 'Dynamically throughout project',
      howToApply: [
        'High-stakes task → Ask for suggestions, you make decisions',
        'Medium-stakes → AI can draft, you review heavily',
        'Low-stakes → AI can work more autonomously',
        'Adjust as confidence changes'
      ],
      whyItMatters:
        'Matches AI usage to task risk level. Prevents over-reliance on important decisions and over-caution on routine work.',
      difficulty: 'advanced',
      timeToLearn: '8 minutes'
    },

    {
      title: 'Implement "AI-Free" Practice Sessions',
      description: 'Regularly work on similar tasks without AI to maintain skill',
      whenToUse: 'Weekly or bi-weekly',
      howToApply: [
        'Pick a task type you regularly use AI for',
        'Complete one instance without AI',
        'Notice what you struggle with',
        'Learn those skills or accept human limitations',
        'Resume using AI for efficiency'
      ],
      whyItMatters:
        'Prevents skill degradation and builds true competence. You know what AI is actually augmenting, not replacing.',
      difficulty: 'advanced',
      timeToLearn: '15 minutes practice'
    },

    {
      title: 'Conduct Post-Task Reflection',
      description: 'After major tasks, reflect on what you learned and how well you collaborated with AI',
      whenToUse: 'After project completion',
      howToApply: [
        'Write down 3 things that went well',
        'Write down 3 things you could improve',
        'What did AI do better than you? What did you do better?',
        'What metacognitive skills improved?',
        'Update your personal "AI collaboration playbook"'
      ],
      whyItMatters:
        'Reflection consolidates learning and builds metacognitive awareness. Continuous improvement of collaboration skills.',
      difficulty: 'advanced',
      timeToLearn: '10 minutes'
    }
  ]
};

/**
 * CASE STUDIES
 * ================================================================
 * Real-world examples of effective vs. ineffective AI use
 */

export const CASE_STUDIES: CaseStudy[] = [
  {
    title: 'Effective: Strategic Writing with Iteration',
    type: 'effective',
    brief: 'User structures writing task, uses AI for drafts, provides specific feedback',
    scenario: 'Software engineer needs to write technical documentation for new API',
    approach:
      'User: 1) Outlined main sections 2) Wrote intro and key concepts themselves 3) Asked AI to draft detailed explanations 4) Reviewed and provided specific feedback: "Too technical, explain for intermediate developers" 5) AI revised based on feedback 6) User added real examples from codebase 7) Final review and minor edits',
    outcome:
      'Documentation was clear, technically accurate, and reflected the user\'s voice. User learned about technical writing. 2 hours total time (would be 4+ hours fully manual).',
    lesson:
      'Effective use: Pre-think, structure, collaborate on parts (not whole), guide with feedback, maintain authorship. AI amplifies your work.',
    relatedStrategies: ['Decompose Complex Tasks First', 'Clarify Your Role & AI Role']
  },

  {
    title: 'Ineffective: Passive Copy-Paste Work',
    type: 'ineffective',
    brief: 'User accepts first AI output without review, doesn\'t understand results',
    scenario: 'Student assigned research paper on climate change policy',
    approach:
      'User: 1) Asks AI "Write me a research paper on climate policy" 2) Copies entire output into submission 3) Doesn\'t read it carefully 4) Doesn\'t verify citations 5) Doesn\'t understand main arguments',
    outcome:
      'Paper submitted with fabricated citations, biased perspective, and poor academic standards. Student failed assignment and learned nothing. 20 minutes "work" resulted in failure.',
    lesson:
      'Ineffective use: Vague requests, no decomposition, minimal review, passive acceptance. You must remain owner of your work. Pattern F.',
    relatedStrategies: ['Pre-Think Before Asking', 'Tag Suspicious AI Outputs']
  },

  {
    title: 'Effective: Iterative Code Development',
    type: 'effective',
    brief: 'Developer uses AI for scaffolding, refines with knowledge, learns new patterns',
    scenario: 'Developer needs to implement React component with complex state management',
    approach:
      'Dev: 1) Understands requirements deeply 2) Asks AI for pattern suggestions (shows 3 options) 3) Evaluates which fits their needs 4) Uses AI to scaffold basic structure 5) Manually implements custom logic 6) Asks AI to review for patterns/issues 7) Tests thoroughly 8) Understands every line before deploying',
    outcome:
      'High-quality component delivered in 1 hour (vs. 3+ hours manual). Developer learned new state pattern. Can write similar code in future.',
    lesson:
      'Effective use: Deep understanding, strategic AI use, active refinement, learning focus. AI is collaborator, not replacement.',
    relatedStrategies: [
      'Monitor Your Independence',
      'Regular Comprehension Checks',
      'Assess Bias & Limitations'
    ]
  },

  {
    title: 'Ineffective: Endless Iteration Without Direction',
    type: 'ineffective',
    brief: 'User gets stuck in iterative loop, each attempt slightly different but never right',
    scenario: 'Content creator needs to write product description',
    approach:
      'User: 1) Asks AI to write description 2) Doesn\'t like it, asks "Make it better" 3) Gets different version, still not right 4) "Try a different tone" 5) "Make it shorter" 6) "Actually longer" 7) Repeats 15+ times 8) Eventually gives up and uses mediocre version',
    outcome:
      'After 2 hours of back-and-forth, no clear description produced. Frustration and wasted time. User now distrusts AI.',
    lesson:
      'Ineffective use: No clear success criteria, vague feedback, endless iteration. Set goals upfront, provide specific guidance.',
    relatedStrategies: ['Set Clear Iteration Goals', 'Set Iteration Success Criteria']
  },

  {
    title: 'Effective: Learning Through Verification',
    type: 'effective',
    brief: 'User verifies AI claims, discovers gaps in understanding, deepens learning',
    scenario: 'Student learning data structures, asks AI to explain binary trees',
    approach:
      'Student: 1) Reads AI explanation 2) Tags parts they\'re unsure about 3) Asks AI "Why is rebalancing important?" 4) Gets answer, asks "What happens without it?" 5) Tries to code example themselves 6) Compares to AI code 7) Identifies what they don\'t understand 8) Asks AI specific clarification questions 9) Deep understanding builds',
    outcome:
      'Student truly understands binary trees, can explain to peers, can implement variations. 45 minutes of active learning > 2 hours of passive reading.',
    lesson:
      'Effective use: Active engagement, verification, asking why, hands-on practice. Understanding > content consumption.',
    relatedStrategies: ['Regular Comprehension Checks', 'Use the 5 Whys Method']
  },

  {
    title: 'Ineffective: Skill Degradation from Overuse',
    type: 'ineffective',
    brief: 'User increasingly relies on AI for routine tasks, skills atrophy significantly',
    scenario: 'Programmer relies on AI for every coding task for 6 months',
    approach:
      'Programmer: 1) Initially uses AI to boost productivity 2) Gradually asks AI to write more code 3) Stops reviewing code carefully 4) Stops thinking through problems independently 5) Asks AI for increasingly trivial tasks 6) Skills become rusty from disuse 7) In job interview, cannot code without AI assistance',
    outcome:
      'Programmer fails interview, loses job opportunity. Realizes too late that reliance prevented skill growth. 6 months wasted.',
    lesson:
      'Ineffective use: Unchecked reliance leads to skill degradation. Regularly practice skills without AI. Maintain independence.',
    relatedStrategies: ['Monitor Your Independence', 'Implement "AI-Free" Practice Sessions']
  }
];

/**
 * BEHAVIOR PATTERNS THAT TRIGGER GUIDANCE
 * ================================================================
 */

export const BEHAVIOR_PATTERNS: Record<string, BehaviorPattern> = {
  'short-prompt': {
    type: 'short-prompt',
    indicators: [
      'Prompts average < 10 words',
      'Vague queries without context',
      'Repeated similar requests without variation'
    ],
    risk: 'medium',
    suggestedStrategies: ['Pre-Think Before Asking', 'Clarify Your Role & AI Role']
  },

  'no-iteration': {
    type: 'no-iteration',
    indicators: [
      'No follow-up requests or refinements',
      'Never asking for variations or alternatives',
      'Accepting first output 100% of time'
    ],
    risk: 'high',
    suggestedStrategies: ['Set Clear Iteration Goals', 'Set Iteration Success Criteria']
  },

  'no-verification': {
    type: 'no-verification',
    indicators: [
      'Never checking facts or accuracy',
      'Not comparing with other sources',
      'Using outputs in high-stakes contexts without review'
    ],
    risk: 'high',
    suggestedStrategies: ['Tag Suspicious AI Outputs', 'Compare Multiple Sources']
  },

  'passive-acceptance': {
    type: 'passive-acceptance',
    indicators: [
      'High approval rate (>80%) with no rejections',
      'No evidence of understanding outputs',
      'Using outputs that user themselves wouldn\'t create'
    ],
    risk: 'high',
    suggestedStrategies: [
      'Regular Comprehension Checks',
      'Monitor Your Independence',
      'Conduct Post-Task Reflection'
    ]
  }
};

/**
 * Just-in-Time Prompts
 * ================================================================
 * Context-specific guidance triggered by detected behaviors
 */

export const JUST_IN_TIME_PROMPTS: Record<
  string,
  { title: string; message: string; recommendation: string }
> = {
  'no-verification': {
    title: 'Verify Before Using',
    message:
      'We noticed you haven\'t verified any AI outputs yet. Without verification, errors can slip through, especially in important work.',
    recommendation:
      'Try the "Tag Suspicious Outputs" strategy: Mark any claims about facts, dates, or technical details that you should verify later. Spend 5 minutes checking these.'
  },

  'no-iteration': {
    title: 'Try Iteration',
    message:
      'You\'ve accepted the first AI output for multiple tasks. Sometimes the first draft isn\'t the best draft.',
    recommendation:
      'Ask AI for 2-3 variations with different approaches. Compare them. Which one is actually best for your specific need? This builds critical evaluation skills.'
  },

  'passive-acceptance': {
    title: 'Are You Understanding?',
    message:
      'You\'ve approved many suggestions. A quick check: Can you explain in your own words why the last one was good?',
    recommendation:
      'Try "Regular Comprehension Checks": Before accepting suggestions, pause and explain them to yourself. If you can\'t explain it, ask AI to clarify.'
  },

  'short-prompt': {
    title: 'Give More Context',
    message:
      'Short prompts often get generic responses. AI works better when it understands your specific situation.',
    recommendation:
      'Try "Pre-Think Before Asking": Spend 5 minutes writing down the context, what you\'ve already tried, what you need specifically. Then ask AI a detailed question.'
  }
};

/**
 * Calculate scaffold fading level based on user competency
 *
 * As users demonstrate competence, guidance is gradually reduced
 * to encourage independence and metacognitive autonomy
 */
export function calculateScaffoldLevel(userMetrics: {
  suggestionCount: number;
  verificationRate: number; // 0-1
  iterationRate: number; // 0-1
  sessionDuration: number; // ms
}): 'high' | 'medium' | 'low' {
  // High competence indicators:
  // - Moderate verification (0.3-0.7): Shows critical evaluation without paranoia
  // - Active iteration (>0.3): Requests variations and refinements
  // - Long sessions (>30 min): Engaged deep work, not quick copy-paste
  // - Multiple suggestions (>20): Substantial usage with good patterns

  const competencyScore = calculateCompetencyScore(userMetrics);

  if (competencyScore > 0.65) {
    return 'high'; // Advanced user: fade guidance
  } else if (competencyScore > 0.4) {
    return 'medium'; // Intermediate: provide as needed
  } else {
    return 'low'; // Beginner: detailed guidance
  }
}

/**
 * Calculate overall competency score (0-1)
 */
function calculateCompetencyScore(metrics: {
  suggestionCount: number;
  verificationRate: number;
  iterationRate: number;
  sessionDuration: number;
}): number {
  let score = 0;

  // Verification: 0.3-0.7 is ideal (shows critical thinking without paranoia)
  const verificationScore = 1 - Math.abs(metrics.verificationRate - 0.5) * 2;
  score += verificationScore * 0.35;

  // Iteration: Higher is better (shows refinement mindset)
  const iterationScore = Math.min(metrics.iterationRate / 0.5, 1); // Normalize
  score += iterationScore * 0.35;

  // Session depth: Longer sessions show engagement
  const sessionHours = metrics.sessionDuration / 3600000;
  const sessionScore = Math.min(sessionHours / 1, 1); // 1+ hour = full score
  score += sessionScore * 0.2;

  // Suggestion volume: Some experience needed
  const volumeScore = Math.min(metrics.suggestionCount / 30, 1); // 30+ = full score
  score += volumeScore * 0.1;

  return Math.min(score, 1);
}

/**
 * Get just-in-time prompt based on detected behavior
 */
export function getJustInTimePrompt(behaviorType: string): {
  title: string;
  message: string;
  recommendation: string;
} {
  return JUST_IN_TIME_PROMPTS[behaviorType] || JUST_IN_TIME_PROMPTS['short-prompt'];
}

/**
 * Get recommended strategies for user based on competency
 */
export function getRecommendedStrategies(
  scaffoldLevel: 'high' | 'medium' | 'low',
  detectedBehaviors?: string[]
): string[] {
  const baseStrategies = {
    low: [
      'Pre-Think Before Asking',
      'Decompose Complex Tasks First',
      'Tag Suspicious AI Outputs'
    ],
    medium: [
      'Set Clear Iteration Goals',
      'Regular Comprehension Checks',
      'Use the 5 Whys Method'
    ],
    high: [
      'Monitor Your Independence',
      'Assess Bias & Limitations',
      'Implement "AI-Free" Practice Sessions'
    ]
  };

  let recommendations = baseStrategies[scaffoldLevel];

  // Add behavior-specific recommendations
  if (detectedBehaviors?.includes('no-verification')) {
    recommendations.push('Compare Multiple Sources');
  }
  if (detectedBehaviors?.includes('no-iteration')) {
    recommendations.push('Set Iteration Success Criteria');
  }
  if (detectedBehaviors?.includes('passive-acceptance')) {
    recommendations.push('Conduct Post-Task Reflection');
  }

  return recommendations;
}

/**
 * AI-powered strategy recommendation based on task - uses GPT API
 */
export interface AIStrategyRecommendation {
  primaryStrategy: {
    name: string;
    description: string;
    steps: string[];
    benefits: string[];
    whenToUse: string;
  };
  alternativeStrategies: Array<{
    name: string;
    description: string;
    tradeoffs: string;
  }>;
  pitfalls: string[];
  checkpoints: Array<{ when: string; check: string }>;
  adaptations: {
    beginner: string;
    advanced: string;
  };
}

export async function getAIStrategyRecommendation(
  taskType: string,
  taskDescription?: string,
  userLevel?: string
): Promise<AIStrategyRecommendation | null> {
  try {
    const response = await apiService.ai.recommendStrategy(taskType, taskDescription, userLevel);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
  } catch (error) {
    console.warn('[MR15] GPT strategy recommendation failed:', error);
  }
  return null;
}

export default {
  STRATEGY_LIBRARY,
  CASE_STUDIES,
  BEHAVIOR_PATTERNS,
  JUST_IN_TIME_PROMPTS,
  calculateScaffoldLevel,
  getJustInTimePrompt,
  getRecommendedStrategies,
  getAIStrategyRecommendation
};
