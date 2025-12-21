/**
 * MR1: Task Decomposition Scaffold - Type Definitions
 *
 * Centralized types for task decomposition and subtask management
 */

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
  // Enhanced guidance fields
  howToApproach?: string[];      // Step-by-step guidance
  tips?: string[];               // Practical tips
  aiCanHelp?: string[];          // What AI can assist with
  resources?: string[];          // Tools or references needed
}

export interface TaskDecomposition {
  originalTask: string;
  suggestedSubtasks: SubtaskItem[];
  decompositionStrategy: DecompositionStrategy;
  userModifications: string[];
}
