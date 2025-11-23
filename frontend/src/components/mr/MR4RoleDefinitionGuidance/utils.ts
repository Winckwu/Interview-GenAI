/**
 * MR4: Role Definition Guidance - Utilities
 *
 * Functions for:
 * - Defining AI role templates
 * - Recommending roles based on task type
 * - Managing role context
 */

export type AIRole = 'research' | 'draft' | 'verifier' | 'brainstorm' | 'tutor' | 'critic';

export type TrustLevel = 'high' | 'medium' | 'low';

/**
 * Role template definition
 */
export interface RoleTemplate {
  id: AIRole;
  displayName: string;
  description: string;
  canDo: string[];
  cannotDo: string[];
  trustLevel: TrustLevel;
  trustLevelDescription: string;
  example: string; // From research
  promptGuidance: string;
  promptExamples: string[];
  recommendedForTaskTypes: string[];
  interactionStyle: string;
}

/**
 * Role context for confirmation
 */
export interface RoleContext {
  selectedRoles: AIRole[];
  taskType: string;
  notes?: string;
  timestamp: Date;
  multipleRoles: boolean;
}

/**
 * All available AI roles
 */
export const ALL_ROLES: AIRole[] = ['research', 'draft', 'verifier', 'brainstorm', 'tutor', 'critic'];

/**
 * Role templates with full definitions
 * Based on grounded theory from 49 interviews
 */
export const ROLE_TEMPLATES: Record<AIRole, RoleTemplate> = {
  research: {
    id: 'research',
    displayName: 'Research Assistant',
    description: 'Gathers, organizes, and synthesizes information',
    canDo: [
      'Search for and summarize information on specific topics',
      'Organize data into structured formats (tables, lists, outlines)',
      'Cross-reference multiple sources',
      'Identify information gaps and suggest additional research areas',
      'Create literature summaries and overviews',
    ],
    cannotDo: [
      'Make judgments about importance or relevance (that\'s your role)',
      'Verify accuracy of sources without your validation',
      'Draw conclusions (only present findings)',
      'Make final recommendations based on research',
    ],
    trustLevel: 'medium',
    trustLevelDescription: 'Medium - Verify sources and dates',
    example:
      'I002 (Account) uses AI to find public financial data and organize it by category. AI succeeds at data gathering; I002 then validates sources and draws conclusions.',
    promptGuidance:
      'Give specific topics or questions. Ask for structured output. Always verify sources mentioned.',
    promptExamples: [
      '"Find information about [topic] from 2023-2024 and organize into: [categories]"',
      '"Summarize the key findings from research on [question] and list your sources"',
      '"Create a comparison table of [options] with pros/cons"',
    ],
    recommendedForTaskTypes: ['research', 'analysis', 'planning'],
    interactionStyle: 'informational - provide facts and structure, not opinions',
  },

  draft: {
    id: 'draft',
    displayName: 'Draft Generator',
    description: 'Creates initial versions or frameworks for your refinement',
    canDo: [
      'Generate first drafts of documents, emails, code, or creative content',
      'Create structural frameworks or outlines',
      'Provide multiple draft options with different tones',
      'Fill in templates with relevant content',
      'Speed up the initial ideation phase',
    ],
    cannotDo: [
      'Decide final tone, style, or direction (that\'s your judgment)',
      'Create brand-voice content (usually needs significant revision)',
      'Guarantee grammatical perfection',
      'Make content-level decisions about what to include/exclude',
    ],
    trustLevel: 'low',
    trustLevelDescription: 'Low - Expect substantial revisions',
    example:
      'I001 (Marketing PhD) asks AI for email templates then rewrites 70% of the content to match her tone. AI succeeds at jumpstarting the drafting process.',
    promptGuidance:
      'Be specific about context, audience, and desired tone. Plan for 50%+ revision. Don\'t treat drafts as final output.',
    promptExamples: [
      '"Draft an email to [recipient] about [topic] in a [tone] style"',
      '"Create 3 different opening paragraphs for [document] targeting [audience]"',
      '"Generate a [language] code skeleton for [task] using [framework]"',
    ],
    recommendedForTaskTypes: ['writing', 'planning', 'design'],
    interactionStyle: 'creative - generate options quickly, not perfection',
  },

  verifier: {
    id: 'verifier',
    displayName: 'Verification Tool',
    description: 'Checks accuracy, logic, grammar, and technical details',
    canDo: [
      'Check grammar, spelling, and punctuation',
      'Verify logical consistency and argument flow',
      'Validate mathematical calculations',
      'Check code syntax and common errors',
      'Identify factual inconsistencies',
      'Suggest improvements in clarity and precision',
    ],
    cannotDo: [
      'Judge content quality or importance',
      'Make creative decisions about style or tone',
      'Verify complex domain-specific claims without your input',
      'Make judgment calls on subjective matters',
    ],
    trustLevel: 'high',
    trustLevelDescription: 'High - Often accurate for mechanical issues',
    example:
      'I016 (CS PhD) asks AI to check code for bugs and security issues before deployment. AI succeeds at catching syntax errors; I016 validates security claims.',
    promptGuidance:
      'Clearly specify what to verify: "Check for grammar", "Verify calculations", "Review logic flow". Be specific about domain requirements.',
    promptExamples: [
      '"Check this code for syntax errors and suggest fixes"',
      '"Verify the logic in this argument and identify weak points"',
      '"Review this essay for grammar, spelling, and clarity"',
    ],
    recommendedForTaskTypes: ['coding', 'writing', 'analysis'],
    interactionStyle: 'analytical - identify errors, not make judgment calls',
  },

  brainstorm: {
    id: 'brainstorm',
    displayName: 'Brainstorm Partner',
    description: 'Generates ideas and perspectives for creative work',
    canDo: [
      'Generate multiple ideas and perspectives on a topic',
      'Suggest creative directions and approaches',
      'Challenge assumptions and offer alternative viewpoints',
      'Help expand on ideas with new angles',
      'Provide inspiration and spark new thinking',
    ],
    cannotDo: [
      'Make final creative decisions (that\'s your expertise)',
      'Guarantee originality (ideas may echo training data)',
      'Commit to quality of creative output',
      'Understand your specific audience/brand as well as you do',
    ],
    trustLevel: 'low',
    trustLevelDescription: 'Low - Treat as inspiration, not direction',
    example:
      'I023 (Designer) uses AI to brainstorm visual concepts and color schemes, then applies personal aesthetic judgment. AI succeeds at quantity of ideas; I023 selects quality.',
    promptGuidance:
      'Ask for multiple ideas, not the best one. Encourage variety. Use AI to expand thinking, then apply your judgment.',
    promptExamples: [
      '"Generate 10 different visual directions for [project]"',
      '"What are creative ways to approach [challenge]?"',
      '"Suggest alternative perspectives on [problem]"',
    ],
    recommendedForTaskTypes: ['creative', 'planning', 'design'],
    interactionStyle: 'generative - produce volume, let you filter for quality',
  },

  tutor: {
    id: 'tutor',
    displayName: 'Tutor / Explainer',
    description: 'Teaches concepts and explains complex topics',
    canDo: [
      'Explain complex concepts in accessible language',
      'Break down difficult topics into manageable pieces',
      'Provide examples and analogies',
      'Answer follow-up questions to clarify understanding',
      'Suggest learning resources and further reading',
      'Adapt explanation level to your understanding',
    ],
    cannotDo: [
      'Understand your specific learning gaps better than you do',
      'Guarantee correct understanding (verify key concepts)',
      'Teach hands-on skills that require practice',
      'Adapt to real-time feedback as well as a human tutor',
    ],
    trustLevel: 'medium',
    trustLevelDescription: 'Medium - Verify with authoritative sources',
    example:
      'I004 (Researcher) asks AI to explain statistical methods before applying them. AI succeeds at conceptual explanation; I004 validates with textbook sources.',
    promptGuidance:
      'Ask for explanations at different levels. Request examples. Ask follow-up questions. Verify critical concepts independently.',
    promptExamples: [
      '"Explain [concept] in simple terms"',
      '"What are the key differences between [related concepts]?"',
      '"Help me understand [topic] step by step"',
    ],
    recommendedForTaskTypes: ['research', 'analysis', 'planning'],
    interactionStyle: 'educational - explain clearly, support understanding',
  },

  critic: {
    id: 'critic',
    displayName: 'Constructive Critic',
    description: 'Provides critical feedback and identifies weaknesses',
    canDo: [
      'Identify logical weaknesses in arguments',
      'Point out missing evidence or unsupported claims',
      'Suggest improvements to structure and clarity',
      'Challenge assumptions and question premises',
      'Identify potential biases or blind spots',
      'Provide critical feedback on work quality',
    ],
    cannotDo: [
      'Understand your intent or context fully',
      'Judge subjective quality or taste',
      'Provide feedback on emotional or interpersonal content',
      'Make final decisions about revisions',
    ],
    trustLevel: 'medium',
    trustLevelDescription: 'Medium - Consider feedback carefully',
    example:
      'I017 (Lawyer) asks AI to identify logical weaknesses in legal arguments before presentation. AI succeeds at identifying gaps; I017 decides which to address.',
    promptGuidance:
      'Ask for specific types of critique. Listen to feedback but apply your judgment. Don\'t revise solely because AI suggested it.',
    promptExamples: [
      '"Critically review this argument for weaknesses"',
      '"What evidence is missing or unsupported in this analysis?"',
      '"Identify assumptions that might not hold in [context]"',
    ],
    recommendedForTaskTypes: ['analysis', 'writing', 'planning'],
    interactionStyle: 'critical - identify problems, not solutions',
  },
};

/**
 * Get role template by ID
 */
export function getRoleTemplate(role: AIRole): RoleTemplate {
  return ROLE_TEMPLATES[role];
}

/**
 * Recommend roles based on task type
 */
export function getRecommendedRoles(taskType: string): AIRole[] {
  const lowerTaskType = taskType.toLowerCase();

  // Map task types to recommended roles
  const recommendations: Record<string, AIRole[]> = {
    research: ['research', 'tutor'],
    analysis: ['research', 'verifier', 'critic'],
    writing: ['draft', 'verifier', 'critic'],
    coding: ['verifier', 'tutor', 'critic'],
    creative: ['brainstorm', 'critic'],
    planning: ['research', 'draft', 'tutor'],
    design: ['brainstorm', 'draft'],
    review: ['verifier', 'critic'],
    general: ['research', 'draft', 'verifier'],
  };

  return recommendations[lowerTaskType] || recommendations['general'];
}

/**
 * Get all roles recommended for a specific task type
 */
export function getRolesByTaskType(taskType: string): AIRole[] {
  const lowerTaskType = taskType.toLowerCase();

  return ALL_ROLES.filter(role => {
    const template = getRoleTemplate(role);
    return template.recommendedForTaskTypes.some(t => t.includes(lowerTaskType));
  });
}

/**
 * Validate role selection
 */
export function validateRoleSelection(roles: AIRole[]): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (roles.length === 0) {
    return { valid: false, warnings: ['At least one role must be selected'] };
  }

  // Check for conflicting roles
  if (roles.includes('draft') && roles.includes('verifier') && roles.length === 2) {
    warnings.push(
      'Draft + Verifier combo works well: Draft creates content, Verifier checks it.'
    );
  }

  if (roles.includes('brainstorm') && roles.includes('critic') && roles.length === 2) {
    warnings.push('Brainstorm + Critic combo works well: Brainstorm generates, Critic refines.');
  }

  return { valid: true, warnings };
}

/**
 * Get role-specific prompting guidelines
 */
export function getRolePromptingTips(role: AIRole): string[] {
  const template = getRoleTemplate(role);
  return [
    `Explicitly mention the ${template.displayName} role in your prompts`,
    `Reference what this role should do: "${template.canDo[0]}"`,
    `Remember limitations: Don't ask it to "${template.cannotDo[0]}"`,
    template.promptGuidance,
  ];
}

/**
 * Create a role context
 */
export function createRoleContext(
  selectedRoles: AIRole[],
  taskType: string,
  notes?: string
): RoleContext {
  return {
    selectedRoles,
    taskType,
    notes,
    timestamp: new Date(),
    multipleRoles: selectedRoles.length > 1,
  };
}

/**
 * Get a summary description of role context
 */
export function getRoleContextSummary(context: RoleContext): string {
  const roleNames = context.selectedRoles.map(r => getRoleTemplate(r).displayName).join(' + ');
  return `${roleNames} for ${context.taskType} task`;
}

/**
 * System prompts for each AI role
 * These are injected to constrain AI behavior based on selected role
 */
export const ROLE_SYSTEM_PROMPTS: Record<AIRole, string> = {
  research: `You are acting as a Research Assistant. Your role is to:
- Gather, organize, and synthesize information on the topics the user requests
- Present findings in structured formats (tables, lists, outlines)
- Cross-reference multiple sources when possible
- Identify information gaps and suggest additional research areas

IMPORTANT CONSTRAINTS:
- Do NOT make judgments about importance or relevance - that's the user's role
- Do NOT draw conclusions - only present findings objectively
- Do NOT make final recommendations based on research
- Always note the sources or basis of your information
- If you're uncertain about accuracy, explicitly state it`,

  draft: `You are acting as a Draft Generator. Your role is to:
- Create initial versions or frameworks for documents, emails, code, or creative content
- Provide multiple draft options with different approaches when helpful
- Speed up the ideation phase by generating starting points quickly

IMPORTANT CONSTRAINTS:
- Do NOT decide final tone, style, or direction - the user makes those decisions
- Do NOT treat your drafts as final output - expect 50%+ revision by the user
- Do NOT make content-level decisions about what to include/exclude without user guidance
- Explicitly label your outputs as "DRAFT" to remind the user to revise
- When generating code, create skeletons that the user will refine`,

  verifier: `You are acting as a Verification Tool. Your role is to:
- Check grammar, spelling, and punctuation
- Verify logical consistency and argument flow
- Validate mathematical calculations
- Check code syntax and identify common errors
- Identify factual inconsistencies or unsupported claims

IMPORTANT CONSTRAINTS:
- Do NOT judge content quality or importance - only accuracy
- Do NOT make creative decisions about style or tone
- Do NOT rewrite content - only point out issues
- Be specific about what errors you find and where
- For complex domain claims, ask the user to verify rather than asserting correctness`,

  brainstorm: `You are acting as a Brainstorm Partner. Your role is to:
- Generate multiple diverse ideas and perspectives
- Suggest creative directions and approaches
- Challenge assumptions and offer alternative viewpoints
- Help expand on ideas with new angles
- Prioritize quantity and variety of ideas

IMPORTANT CONSTRAINTS:
- Do NOT select the "best" idea - generate options and let the user choose
- Do NOT guarantee originality - ideas may echo common patterns
- Do NOT make final creative decisions - that's the user's expertise
- Label ideas as "suggestions for consideration" not "recommendations"
- Encourage the user to combine, modify, or reject ideas freely`,

  tutor: `You are acting as a Tutor/Explainer. Your role is to:
- Explain complex concepts in accessible language
- Break down difficult topics into manageable pieces
- Provide examples and analogies to aid understanding
- Answer follow-up questions patiently
- Adapt explanation level based on user's responses

IMPORTANT CONSTRAINTS:
- Do NOT assume you know the user's learning gaps better than they do
- Do NOT skip verification steps - encourage the user to verify key concepts
- Do NOT just give answers - guide the user to understand
- Explicitly note when concepts should be verified with authoritative sources
- Ask clarifying questions to understand the user's current level`,

  critic: `You are acting as a Constructive Critic. Your role is to:
- Identify logical weaknesses in arguments
- Point out missing evidence or unsupported claims
- Suggest improvements to structure and clarity
- Challenge assumptions and question premises
- Identify potential biases or blind spots

IMPORTANT CONSTRAINTS:
- Do NOT make final decisions about revisions - the user decides what to address
- Do NOT judge subjective quality or taste
- Do NOT be harsh - frame feedback constructively
- Acknowledge strengths before discussing weaknesses
- Present critique as "considerations" not "requirements"`,
};

/**
 * Get system prompt for a role
 */
export function getRoleSystemPrompt(role: AIRole): string {
  return ROLE_SYSTEM_PROMPTS[role];
}

/**
 * Get combined system prompt for multiple roles
 */
export function getCombinedRoleSystemPrompt(roles: AIRole[]): string {
  if (roles.length === 0) {
    return '';
  }

  if (roles.length === 1) {
    return ROLE_SYSTEM_PROMPTS[roles[0]];
  }

  // For multiple roles, combine them with clear separation
  const rolePrompts = roles.map((role, index) => {
    const template = getRoleTemplate(role);
    return `ROLE ${index + 1}: ${template.displayName.toUpperCase()}
${ROLE_SYSTEM_PROMPTS[role]}`;
  });

  return `You are operating with MULTIPLE ROLES. Apply each role appropriately based on context.

${rolePrompts.join('\n\n---\n\n')}

When the user's request spans multiple roles, clearly indicate which role you're using for each part of your response.`;
}

/**
 * Generate a role indicator prefix for AI responses
 */
export function getRoleIndicatorPrefix(roles: AIRole[]): string {
  if (roles.length === 0) return '';

  const roleNames = roles.map(r => getRoleTemplate(r).displayName);
  if (roles.length === 1) {
    return `[Acting as ${roleNames[0]}]`;
  }
  return `[Acting as ${roleNames.join(' + ')}]`;
}

export default {
  getRoleTemplate,
  getRecommendedRoles,
  getRolesByTaskType,
  validateRoleSelection,
  getRolePromptingTips,
  createRoleContext,
  getRoleContextSummary,
  getRoleSystemPrompt,
  getCombinedRoleSystemPrompt,
  getRoleIndicatorPrefix,
  ROLE_SYSTEM_PROMPTS,
};
