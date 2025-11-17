/**
 * MR16: Skill Atrophy Prevention System - Utilities
 *
 * Monitor skill degradation over time and intervene before capabilities fade.
 * Evidence: 21/49 users (43%) worried about ability atrophy (e.g., "I've forgotten how to code without AI")
 * Interviewed user I38: Discovered 6 months after job interview that programming ability severely declined
 */

export type SkillCategory = 'coding' | 'writing' | 'analysis' | 'design' | 'math' | 'research' | 'creative' | 'planning';
export type AtrophyLevel = 'healthy' | 'warning' | 'critical' | 'severe';
export type InterventionType = 'gentle-reminder' | 'practice-suggestion' | 'ai-restriction' | 'maintenance-plan';

export interface SkillBaseline {
  skillId: string;
  category: SkillCategory;
  timestamp: Date;
  independenceRate: number; // 0-1 percentage of tasks completed independently
  proficiencyScore: number; // 1-10 scale
  taskCount: number;
  notes: string;
}

export interface SkillUsageSession {
  sessionId: string;
  timestamp: Date;
  skillCategory: SkillCategory;
  tasksCompleted: number;
  independentlyCompleted: number; // without AI
  withAIAssistance: number; // with AI
  qualityRating: number; // 1-5
  timeSpent: number; // minutes
}

export interface SkillHealthProfile {
  skillId: string;
  category: SkillCategory;
  currentIndependenceRate: number; // 0-1
  baselineIndependenceRate: number; // 0-1
  rateOfChange: number; // percentage change per month
  lastAssessmentDate: Date;
  sessionCount: number;
  monthsSinceBaseline: number;
  atrophyLevel: AtrophyLevel;
  riskScore: number; // 0-100
  estimatedMonthsUntilCritical: number;
}

export interface SkillAtrophyWarning {
  id: string;
  timestamp: Date;
  skillCategory: SkillCategory;
  atrophyLevel: AtrophyLevel;
  independenceRate: number;
  declinePercentage: number;
  interventionType: InterventionType;
  warning: string;
  suggestedActions: string[];
  resources: string[];
  userAcknowledged: boolean;
}

export interface MaintenancePlan {
  id: string;
  skillCategory: SkillCategory;
  createdDate: Date;
  targetIndependenceRate: number; // goal: return to baseline
  practiceFrequency: 'daily' | 'weekly' | 'bi-weekly';
  suggestedTasks: Array<{
    id: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedMinutes: number;
    aiDisabled: boolean;
  }>;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
}

// Thresholds for atrophy detection
const ATROPHY_THRESHOLDS = {
  warningDecline: 0.15, // 15% drop from baseline
  criticalDecline: 0.30, // 30% drop
  severeDecline: 0.50, // 50% drop
  minMonthsToTrack: 1, // need at least 1 month of data
  healthyMinIndependence: 0.6, // 60%+ = healthy
  assessmentIntervalMonths: 1
};

/**
 * Calculate skill health profile based on usage sessions
 */
export function calculateSkillHealthProfile(
  baseline: SkillBaseline,
  sessions: SkillUsageSession[],
  currentDate: Date = new Date()
): SkillHealthProfile {
  if (sessions.length === 0) {
    return {
      skillId: baseline.skillId,
      category: baseline.category,
      currentIndependenceRate: baseline.independenceRate,
      baselineIndependenceRate: baseline.independenceRate,
      rateOfChange: 0,
      lastAssessmentDate: baseline.timestamp,
      sessionCount: 0,
      monthsSinceBaseline: 0,
      atrophyLevel: 'healthy',
      riskScore: 0,
      estimatedMonthsUntilCritical: 999
    };
  }

  // Calculate current independence rate
  const totalTasks = sessions.reduce((sum, s) => sum + s.tasksCompleted, 0);
  const independentTasks = sessions.reduce((sum, s) => sum + s.independentlyCompleted, 0);
  const currentIndependenceRate = totalTasks > 0 ? independentTasks / totalTasks : 0;

  // Calculate months since baseline
  const monthsSinceBaseline = Math.max(
    1,
    (currentDate.getTime() - baseline.timestamp.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Calculate rate of change (percentage points per month)
  const decline = baseline.independenceRate - currentIndependenceRate;
  const rateOfChange = (decline / monthsSinceBaseline) * 100;

  // Determine atrophy level
  const declinePercentage = (decline / baseline.independenceRate) * 100;
  let atrophyLevel: AtrophyLevel = 'healthy';
  if (declinePercentage >= ATROPHY_THRESHOLDS.severeDecline * 100) {
    atrophyLevel = 'severe';
  } else if (declinePercentage >= ATROPHY_THRESHOLDS.criticalDecline * 100) {
    atrophyLevel = 'critical';
  } else if (declinePercentage >= ATROPHY_THRESHOLDS.warningDecline * 100) {
    atrophyLevel = 'warning';
  }

  // Calculate risk score (0-100)
  const riskScore = Math.min(100, declinePercentage);

  // Estimate months until critical
  let estimatedMonthsUntilCritical = 999;
  if (rateOfChange > 0) {
    const remainingDeclineForCritical =
      (baseline.independenceRate - baseline.independenceRate * (1 - ATROPHY_THRESHOLDS.criticalDecline)) * 100;
    estimatedMonthsUntilCritical = Math.max(0, remainingDeclineForCritical / rateOfChange);
  }

  return {
    skillId: baseline.skillId,
    category: baseline.category,
    currentIndependenceRate,
    baselineIndependenceRate: baseline.independenceRate,
    rateOfChange,
    lastAssessmentDate: new Date(Math.max(...sessions.map(s => s.timestamp.getTime()))),
    sessionCount: sessions.length,
    monthsSinceBaseline,
    atrophyLevel,
    riskScore,
    estimatedMonthsUntilCritical
  };
}

/**
 * Detect atrophy and generate warning
 */
export function detectAtrophy(profile: SkillHealthProfile): SkillAtrophyWarning | null {
  if (profile.atrophyLevel === 'healthy') {
    return null;
  }

  const declinePercentage = ((profile.baselineIndependenceRate - profile.currentIndependenceRate) /
    profile.baselineIndependenceRate) * 100;

  let interventionType: InterventionType = 'gentle-reminder';
  let warning = '';

  if (profile.atrophyLevel === 'severe') {
    interventionType = 'ai-restriction';
    warning = `🚨 CRITICAL SKILL ATROPHY: Your ${profile.category} independence dropped from ${Math.round(
      profile.baselineIndependenceRate * 100
    )}% to ${Math.round(profile.currentIndependenceRate * 100)}% (${Math.round(declinePercentage)}% decline).
    IMMEDIATE ACTION: AI will be disabled for ${profile.category} tasks until you complete independent practice.`;
  } else if (profile.atrophyLevel === 'critical') {
    interventionType = 'practice-suggestion';
    warning = `⚠️ CRITICAL: Your ${profile.category} skills are atrophying rapidly.
    You were once ${Math.round(profile.baselineIndependenceRate * 100)}% independent but now only ${Math.round(
      profile.currentIndependenceRate * 100
    )}%.
    We recommend a 2-week focused practice plan with AI assistance disabled.`;
  } else if (profile.atrophyLevel === 'warning') {
    interventionType = 'practice-suggestion';
    warning = `⚠️ Warning: Your ${profile.category} independence has declined from ${Math.round(
      profile.baselineIndependenceRate * 100
    )}% to ${Math.round(profile.currentIndependenceRate * 100)}%.
    Consider practicing 1-2 tasks independently this week to maintain your skills.`;
  }

  const suggestedActions: string[] = [];
  const resources: string[] = [];

  if (interventionType === 'ai-restriction') {
    suggestedActions.push(`Complete 5 independent ${profile.category} tasks without AI`);
    suggestedActions.push('Re-take the skill assessment after 1 week');
    suggestedActions.push('Review learned strategies for effective ${profile.category}');
  } else if (interventionType === 'practice-suggestion') {
    suggestedActions.push(`Start a 2-week maintenance plan for ${profile.category}`);
    suggestedActions.push('Target: Return to 70%+ independence rate');
    suggestedActions.push(`Complete 2-3 ${profile.category} tasks independently per week`);
  } else {
    suggestedActions.push(`Try one ${profile.category} task this week without AI`);
    suggestedActions.push('Monitor your independence rate over the next month');
  }

  resources.push('Metacognitive Strategy Guide (MR15)');
  resources.push('Failure Tolerance Learning (MR7)');
  resources.push(`Critical Thinking Scaffolding (MR12)`);

  return {
    id: `atrophy-${Date.now()}`,
    timestamp: new Date(),
    skillCategory: profile.category,
    atrophyLevel: profile.atrophyLevel,
    independenceRate: profile.currentIndependenceRate,
    declinePercentage,
    interventionType,
    warning,
    suggestedActions,
    resources,
    userAcknowledged: false
  };
}

/**
 * Generate maintenance plan for skill recovery
 */
export function generateMaintenancePlan(
  category: SkillCategory,
  targetIndependenceRate: number = 0.75
): MaintenancePlan {
  const taskDifficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
  const suggestedTasks = taskDifficulties.flatMap((difficulty, index) =>
    Array(2)
      .fill(null)
      .map((_, i) => ({
        id: `${category}-${difficulty}-${i}`,
        description: generateTaskDescription(category, difficulty, i),
        difficulty,
        estimatedMinutes: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 45,
        aiDisabled: true
      }))
  );

  return {
    id: `plan-${Date.now()}`,
    skillCategory: category,
    createdDate: new Date(),
    targetIndependenceRate,
    practiceFrequency: 'weekly',
    suggestedTasks,
    completedTasks: 0,
    totalTasks: suggestedTasks.length,
    progressPercentage: 0
  };
}

/**
 * Generate contextual task descriptions based on skill category
 */
function generateTaskDescription(
  category: SkillCategory,
  difficulty: 'easy' | 'medium' | 'hard',
  index: number
): string {
  const tasks: Record<SkillCategory, Record<string, string[]>> = {
    coding: {
      easy: [
        'Write a function that validates email addresses',
        'Create a simple sorting algorithm from scratch',
        'Debug a provided code snippet with 3 intentional errors'
      ],
      medium: [
        'Build a mini project (todo app, calculator) with no AI assistance',
        'Refactor complex code to improve performance',
        'Write unit tests for a pre-existing function'
      ],
      hard: [
        'Design and implement a data structure from first principles',
        'Optimize an algorithm for a novel constraint',
        'Build a full-stack feature with complex requirements'
      ]
    },
    writing: {
      easy: [
        'Write a 500-word essay on a topic of your choice',
        'Create a detailed job description for a role',
        'Draft a professional email explaining a complex topic'
      ],
      medium: [
        'Write a comprehensive report (2000+ words) with citations',
        'Compose marketing copy for a product or service',
        'Write technical documentation for a software feature'
      ],
      hard: [
        'Write a research paper with original analysis',
        'Compose a persuasive article on a controversial topic',
        'Write a creative short story with complex characters'
      ]
    },
    analysis: {
      easy: [
        'Analyze a dataset and identify 3 key patterns',
        'Compare two approaches and justify which is better',
        'Break down a complex problem into component parts'
      ],
      medium: [
        'Conduct a SWOT analysis for a business scenario',
        'Analyze trade-offs between multiple solutions',
        'Create a competitive analysis framework'
      ],
      hard: [
        'Perform root cause analysis on a complex failure',
        'Develop a strategic framework for a new market',
        'Conduct scenario analysis for business planning'
      ]
    },
    design: {
      easy: [
        'Sketch a wireframe for a simple mobile app screen',
        'Design a color palette for a brand',
        'Create a simple infographic explaining a process'
      ],
      medium: [
        'Design a complete user interface for an application',
        'Create a design system with 5+ components',
        'Design a user journey for a multi-step process'
      ],
      hard: [
        'Design an accessible, inclusive product experience',
        'Create a comprehensive design system from scratch',
        'Design an interaction model for a complex application'
      ]
    },
    math: {
      easy: [
        'Solve 10 algebra problems without calculator',
        'Derive a simple mathematical proof',
        'Apply calculus to optimize a real-world problem'
      ],
      medium: [
        'Solve a system of equations with multiple variables',
        'Prove a mathematical theorem step-by-step',
        'Apply statistics to analyze experimental data'
      ],
      hard: [
        'Prove an advanced mathematical theorem',
        'Solve a complex optimization problem',
        'Develop a novel mathematical model for a scenario'
      ]
    },
    research: {
      easy: [
        'Research a topic and summarize 5 key sources',
        'Find and evaluate credibility of 10 sources',
        'Create an annotated bibliography for a topic'
      ],
      medium: [
        'Conduct literature review and identify research gaps',
        'Synthesize findings from 20+ sources',
        'Create a research methodology for a study'
      ],
      hard: [
        'Design an original research study',
        'Conduct meta-analysis across multiple studies',
        'Develop a theoretical framework from research'
      ]
    },
    creative: {
      easy: [
        'Brainstorm 20 ideas for a creative project',
        'Create a mood board and explain design rationale',
        'Write 5 alternative concepts for a campaign'
      ],
      medium: [
        'Develop a complete creative concept from scratch',
        'Create multiple iterations of a creative solution',
        'Pitch a creative idea with full visual mockups'
      ],
      hard: [
        'Create an award-winning campaign concept',
        'Develop an innovative product concept',
        'Create a comprehensive creative strategy'
      ]
    },
    planning: {
      easy: [
        'Create a project plan with 10+ discrete tasks',
        'Identify risks and mitigation strategies',
        'Create a timeline with dependencies and milestones'
      ],
      medium: [
        'Develop a quarterly strategic plan',
        'Create a roadmap for a multi-year initiative',
        'Plan resource allocation for complex project'
      ],
      hard: [
        'Develop a multi-year organizational strategy',
        'Create a transformation plan for a business',
        'Develop contingency plans for multiple scenarios'
      ]
    }
  };

  return tasks[category][difficulty][index % tasks[category][difficulty].length];
}

/**
 * Update maintenance plan progress
 */
export function updateMaintenancePlanProgress(
  plan: MaintenancePlan,
  completedTaskId: string
): MaintenancePlan {
  const updatedPlan = { ...plan };
  const completedTask = updatedPlan.suggestedTasks.find(t => t.id === completedTaskId);

  if (completedTask && !completedTask.id.includes('completed')) {
    updatedPlan.completedTasks++;
    updatedPlan.progressPercentage = Math.round((updatedPlan.completedTasks / updatedPlan.totalTasks) * 100);
  }

  return updatedPlan;
}

/**
 * Get intervention message based on atrophy level
 */
export function getAtrophyMessage(level: AtrophyLevel): string {
  const messages: Record<AtrophyLevel, string> = {
    healthy: '✅ Your skills are in great shape! Keep practicing regularly.',
    warning:
      '⚠️ We noticed a slight decline in your skill independence. Try practicing independently this week.',
    critical: '⚠️ ⚠️ Your skills are declining noticeably. Starting a maintenance plan is strongly recommended.',
    severe: '🚨 🚨 CRITICAL: Your skills are atrophying rapidly. AI access will be restricted until you practice.'
  };

  return messages[level];
}

/**
 * Get color for atrophy level
 */
export function getAtrophyColor(level: AtrophyLevel): string {
  const colors: Record<AtrophyLevel, string> = {
    healthy: '#4caf50', // green
    warning: '#2196f3', // blue
    critical: '#ff9800', // orange
    severe: '#f44336' // red
  };

  return colors[level];
}

/**
 * Check if skill assessment is due
 */
export function isAssessmentDue(lastAssessmentDate: Date, currentDate: Date = new Date()): boolean {
  const monthsElapsed = (currentDate.getTime() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return monthsElapsed >= ATROPHY_THRESHOLDS.assessmentIntervalMonths;
}

/**
 * Acknowledge atrophy warning
 */
export function acknowledgeAtrophyWarning(warning: SkillAtrophyWarning): SkillAtrophyWarning {
  return {
    ...warning,
    userAcknowledged: true
  };
}

export default {
  calculateSkillHealthProfile,
  detectAtrophy,
  generateMaintenancePlan,
  updateMaintenancePlanProgress,
  getAtrophyMessage,
  getAtrophyColor,
  isAssessmentDue,
  acknowledgeAtrophyWarning
};
