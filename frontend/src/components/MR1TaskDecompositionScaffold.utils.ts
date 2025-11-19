/**
 * MR1: Task Decomposition Scaffold - Utilities
 *
 * Functions for:
 * - Task analysis (dimensions: scope, dependencies, complexity)
 * - Decomposition generation (3 strategies: sequential, parallel, hierarchical)
 * - Validation and verification
 * - Scaffold level calculation
 */

import { apiService } from '../services/api';

export type DecompositionStrategy = 'sequential' | 'parallel' | 'hierarchical';

export interface DecompositionDimension {
  name: string;
  value: string;
  analysis?: string;
}

export interface SubtaskItem {
  id: string;
  description: string;
  dependencies: string[];
  verificationMethod: string;
  userApproved: boolean;
  userModification?: string;
  estimatedTime?: number;
  difficulty?: 'low' | 'medium' | 'high';
}

export interface TaskDecomposition {
  originalTask: string;
  suggestedSubtasks: SubtaskItem[];
  decompositionStrategy: DecompositionStrategy;
  userModifications: string[];
}

/**
 * Analyze task dimensions - uses GPT API with fallback to local analysis
 */
export async function analyzeTaskDimensions(task: string): Promise<DecompositionDimension[]> {
  try {
    // Try GPT-powered analysis
    const response = await apiService.ai.decompose(task, 'sequential');
    if (response.data?.success && response.data?.data?.dimensions) {
      return response.data.data.dimensions.map((d: any) => ({
        name: d.name,
        value: d.value,
        analysis: d.analysis
      }));
    }
  } catch (error) {
    console.warn('[MR1] GPT analysis failed, using local fallback:', error);
  }

  // Fallback to local analysis
  return [
    {
      name: '🎯 Scope',
      value: estimateScope(task),
      analysis: 'What are the boundaries of this task?'
    },
    {
      name: '⚙️ Complexity',
      value: estimateComplexity(task),
      analysis: 'How many moving parts are involved?'
    },
    {
      name: '🔗 Dependencies',
      value: estimateDependencies(task),
      analysis: 'What must be done first?'
    },
    {
      name: '⏱️ Estimated Duration',
      value: estimateDuration(task),
      analysis: 'How long might this take?'
    },
    {
      name: '🛠️ Skills Required',
      value: estimateSkillsRequired(task),
      analysis: 'What expertise is needed?'
    }
  ];
}

/**
 * Generate initial decomposition based on strategy - uses GPT API with fallback
 */
export async function generateInitialDecomposition(
  task: string,
  strategy: DecompositionStrategy
): Promise<TaskDecomposition> {
  try {
    // Try GPT-powered decomposition
    const response = await apiService.ai.decompose(task, strategy);
    if (response.data?.success && response.data?.data?.subtasks) {
      const aiSubtasks = response.data.data.subtasks.map((s: any, idx: number) => ({
        id: s.id || `st-${idx}`,
        description: s.title || s.description,
        dependencies: s.dependencies || [],
        verificationMethod: s.verificationMethod || 'Review and verify completion',
        userApproved: false,
        estimatedTime: parseInt(s.estimatedTime) || 30,
        difficulty: s.difficulty || 'medium'
      }));

      return {
        originalTask: task,
        suggestedSubtasks: aiSubtasks,
        decompositionStrategy: strategy,
        userModifications: []
      };
    }
  } catch (error) {
    console.warn('[MR1] GPT decomposition failed, using local fallback:', error);
  }

  // Fallback to local decomposition
  let subtasks: SubtaskItem[] = [];

  if (strategy === 'sequential') {
    subtasks = generateSequentialDecomposition(task);
  } else if (strategy === 'parallel') {
    subtasks = generateParallelDecomposition(task);
  } else {
    subtasks = generateHierarchicalDecomposition(task);
  }

  return {
    originalTask: task,
    suggestedSubtasks: subtasks,
    decompositionStrategy: strategy,
    userModifications: []
  };
}

/**
 * Generate sequential decomposition (steps that must be done in order)
 */
function generateSequentialDecomposition(task: string): SubtaskItem[] {
  // This would normally use LLM to generate actual decomposition
  // For demo, return template structure
  const baseSubtasks = generateBaseSubtasks(task);

  // Add sequential dependencies
  return baseSubtasks.map((subtask, idx) => ({
    ...subtask,
    dependencies: idx > 0 ? [baseSubtasks[idx - 1].id] : [],
    difficulty: idx === 0 ? 'low' : idx === baseSubtasks.length - 1 ? 'high' : 'medium'
  }));
}

/**
 * Generate parallel decomposition (independent tasks)
 */
function generateParallelDecomposition(task: string): SubtaskItem[] {
  const baseSubtasks = generateBaseSubtasks(task);

  // No dependencies for parallel execution
  return baseSubtasks.map(subtask => ({
    ...subtask,
    dependencies: []
  }));
}

/**
 * Generate hierarchical decomposition (nested structure)
 */
function generateHierarchicalDecomposition(task: string): SubtaskItem[] {
  const baseSubtasks = generateBaseSubtasks(task);

  // Group into layers
  const groupSize = Math.ceil(baseSubtasks.length / 3);
  return baseSubtasks.map((subtask, idx) => ({
    ...subtask,
    dependencies:
      idx < groupSize ? [] : [baseSubtasks[Math.floor((idx - groupSize) / groupSize) - 1].id]
  }));
}

/**
 * Generate base subtask structure
 */
function generateBaseSubtasks(task: string): SubtaskItem[] {
  // Extract keywords to inform decomposition
  const keywords = extractKeywords(task);
  const count = Math.min(keywords.length, 5); // 3-5 subtasks typical

  const subtasks: SubtaskItem[] = [];

  // Planning phase
  subtasks.push({
    id: 'st-0',
    description: `Plan and prepare for ${task.split(' ')[0]} work`,
    dependencies: [],
    verificationMethod: 'Checklist of requirements reviewed',
    userApproved: false,
    estimatedTime: 15,
    difficulty: 'low'
  });

  // Analysis/Design phase
  if (count >= 2) {
    subtasks.push({
      id: 'st-1',
      description: `Analyze and design the approach for ${keywords[0] || 'core functionality'}`,
      dependencies: ['st-0'],
      verificationMethod: 'Design document reviewed and approved',
      userApproved: false,
      estimatedTime: 30,
      difficulty: 'medium'
    });
  }

  // Implementation phase
  if (count >= 3) {
    subtasks.push({
      id: 'st-2',
      description: `Implement ${keywords[1] || 'required features'}`,
      dependencies: ['st-1'],
      verificationMethod: 'Code passes tests and meets requirements',
      userApproved: false,
      estimatedTime: 60,
      difficulty: 'high'
    });
  }

  // Testing phase
  if (count >= 4) {
    subtasks.push({
      id: 'st-3',
      description: `Test and validate ${keywords[0] || 'implementation'}`,
      dependencies: ['st-2'],
      verificationMethod: 'All tests pass, edge cases handled',
      userApproved: false,
      estimatedTime: 30,
      difficulty: 'medium'
    });
  }

  // Review/Finalization phase
  if (count >= 5) {
    subtasks.push({
      id: 'st-4',
      description: `Review, refine, and finalize`,
      dependencies: ['st-3'],
      verificationMethod: 'Code review approved, documentation complete',
      userApproved: false,
      estimatedTime: 20,
      difficulty: 'low'
    });
  }

  return subtasks;
}

/**
 * Extract key terms from task description
 */
function extractKeywords(task: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'for', 'of', 'to', 'with']);
  return task
    .toLowerCase()
    .split(/\s+/)
    .filter(word => !stopWords.has(word) && word.length > 3)
    .slice(0, 5);
}

/**
 * Estimate task scope
 */
function estimateScope(task: string): string {
  const length = task.length;
  if (length < 50) return 'Small scope - well-defined single focus';
  if (length < 150) return 'Medium scope - 2-3 major components';
  if (length < 300) return 'Large scope - multiple complex areas';
  return 'Very large scope - needs careful prioritization';
}

/**
 * Estimate task complexity
 */
function estimateComplexity(task: string): string {
  const keywords = ['multiple', 'complex', 'integration', 'dependencies', 'various'];
  const matches = keywords.filter(kw => task.toLowerCase().includes(kw)).length;

  if (matches === 0) return 'Low - straightforward implementation';
  if (matches <= 1) return 'Medium - some interdependencies';
  if (matches <= 2) return 'High - many moving parts';
  return 'Very high - careful planning needed';
}

/**
 * Estimate dependencies
 */
function estimateDependencies(task: string): string {
  const depKeywords = ['before', 'first', 'prerequisite', 'depends', 'after', 'then'];
  const mentions = depKeywords.filter(kw => task.toLowerCase().includes(kw)).length;

  if (mentions === 0) return 'Low - mostly independent tasks';
  if (mentions === 1) return 'Medium - some ordering required';
  return 'High - careful sequencing needed';
}

/**
 * Estimate duration
 */
function estimateDuration(task: string): string {
  const length = task.length;
  if (length < 50) return '1-2 hours';
  if (length < 150) return '4-8 hours (1 day)';
  if (length < 300) return '1-3 days';
  return '1-2 weeks';
}

/**
 * Estimate skills required
 */
function estimateSkillsRequired(task: string): string {
  const skillKeywords = {
    'programming|code|development|coding|backend|frontend': 'Software Development',
    'design|ui|ux|interface|visual': 'Design & UX',
    'database|data|sql|schema': 'Database Design',
    'api|integration|connect|third-party': 'API Integration',
    'testing|test|qa|quality': 'Testing & QA',
    'documentation|write|document': 'Documentation',
    'infrastructure|deploy|cloud|server': 'Infrastructure & DevOps'
  };

  const skills: Set<string> = new Set();

  for (const [pattern, skill] of Object.entries(skillKeywords)) {
    if (new RegExp(pattern, 'i').test(task)) {
      skills.add(skill);
    }
  }

  return skills.size > 0 ? Array.from(skills).join(', ') : 'Technical expertise';
}

/**
 * Calculate scaffold level based on decomposition complexity
 */
export function calculateScaffoldLevel(
  subtasks: SubtaskItem[]
): 'high' | 'medium' | 'low' {
  if (subtasks.length <= 2) return 'high'; // Very simple: needs support
  if (subtasks.length >= 5) return 'low'; // Complex: user can handle
  return 'medium'; // Moderate: some support helpful
}

/**
 * Validate decomposition completeness
 */
export function validateDecomposition(decomposition: TaskDecomposition): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (decomposition.suggestedSubtasks.length === 0) {
    warnings.push('No subtasks defined. Add at least 1 subtask.');
  }

  if (decomposition.suggestedSubtasks.length > 10) {
    warnings.push('Many subtasks (>10). Consider grouping related tasks.');
  }

  // Check for circular dependencies
  const hasCycle = checkDependencyCycles(decomposition.suggestedSubtasks);
  if (hasCycle) {
    warnings.push('Circular dependency detected. Review dependency chain.');
  }

  // Check verification methods defined
  const missingVerification = decomposition.suggestedSubtasks.filter(
    s => !s.verificationMethod || s.verificationMethod.trim() === ''
  );
  if (missingVerification.length > 0) {
    warnings.push(`${missingVerification.length} subtask(s) missing verification methods.`);
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Check for circular dependencies in task graph
 */
function checkDependencyCycles(subtasks: SubtaskItem[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycleDFS = (id: string): boolean => {
    visited.add(id);
    recursionStack.add(id);

    const subtask = subtasks.find(s => s.id === id);
    if (!subtask) return false;

    for (const depId of subtask.dependencies) {
      if (!visited.has(depId)) {
        if (hasCycleDFS(depId)) return true;
      } else if (recursionStack.has(depId)) {
        return true;
      }
    }

    recursionStack.delete(id);
    return false;
  };

  for (const subtask of subtasks) {
    if (!visited.has(subtask.id)) {
      if (hasCycleDFS(subtask.id)) return true;
    }
  }

  return false;
}

export default {
  analyzeTaskDimensions,
  generateInitialDecomposition,
  calculateScaffoldLevel,
  validateDecomposition
};
