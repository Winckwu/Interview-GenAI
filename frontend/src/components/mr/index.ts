/**
 * MR Components - Unified Exports
 *
 * This file provides centralized exports for all Metacognitive Regulation (MR) components.
 * Import MR components from this index for cleaner import statements.
 *
 * Usage:
 *   import { MR1TaskDecompositionScaffold, MR2ProcessTransparency } from './components/mr';
 *
 * Note: For lazy loading (recommended for performance), import directly from subdirectories:
 *   const MR1 = lazy(() => import('./components/mr/MR1TaskDecompositionScaffold'));
 */

// Core MR Components (1-6)
export { default as MR1TaskDecompositionScaffold } from './MR1TaskDecompositionScaffold';
export { default as MR2ProcessTransparency } from './MR2ProcessTransparency';
export { default as MR3HumanAgencyControl } from './MR3HumanAgencyControl';
export { default as MR4RoleDefinitionGuidance } from './MR4RoleDefinitionGuidance';
export { default as MR5LowCostIteration } from './MR5LowCostIteration';
export { default as MR6CrossModelExperimentation } from './MR6CrossModelExperimentation';

// Extended MR Components (7-19)
export { default as MR7FailureToleranceLearning } from './MR7FailureToleranceLearning';
export { default as MR8TaskCharacteristicRecognition } from './MR8TaskCharacteristicRecognition';
export { default as MR9DynamicTrustCalibration } from './MR9DynamicTrustCalibration';
export { default as MR10CostBenefitAnalysis } from './MR10CostBenefitAnalysis';
export { default as MR11IntegratedVerification } from './MR11IntegratedVerification';
export { default as MR12CriticalThinkingScaffolding } from './MR12CriticalThinkingScaffolding';
export { default as MR13TransparentUncertainty } from './MR13TransparentUncertainty';
export { default as MR14GuidedReflectionMechanism } from './MR14GuidedReflectionMechanism';
export { default as MR15MetacognitiveStrategyGuide } from './MR15MetacognitiveStrategyGuide';
export { default as MR16SkillAtrophyPrevention } from './MR16SkillAtrophyPrevention';
export { default as MR17LearningProcessVisualization } from './MR17LearningProcessVisualization';
export { default as MR18OverRelianceWarning } from './MR18OverRelianceWarning';
export { default as MR19MetacognitiveCapabilityAssessment } from './MR19MetacognitiveCapabilityAssessment';

// Special MR Components
export { default as MR23PrivacyPreservingArchitecture } from './MR23PrivacyPreservingArchitecture';

// Type Exports from MR1 (example - add others as needed)
export type {
  SubtaskItem,
  DecompositionStrategy,
  TaskDecomposition,
  DecompositionDimension
} from './MR1TaskDecompositionScaffold/types';

// Type Exports from MR2
export type { InteractionVersion, ViewMode } from './MR2ProcessTransparency';

// Type Exports from MR3
export type { InterventionLevel } from './MR3HumanAgencyControl';

/**
 * Component Map for Dynamic Loading
 * Useful for programmatic component rendering based on MR type
 */
export const MR_COMPONENT_MAP = {
  MR1: 'MR1TaskDecompositionScaffold',
  MR2: 'MR2ProcessTransparency',
  MR3: 'MR3HumanAgencyControl',
  MR4: 'MR4RoleDefinitionGuidance',
  MR5: 'MR5LowCostIteration',
  MR6: 'MR6CrossModelExperimentation',
  MR7: 'MR7FailureToleranceLearning',
  MR8: 'MR8TaskCharacteristicRecognition',
  MR9: 'MR9DynamicTrustCalibration',
  MR10: 'MR10CostBenefitAnalysis',
  MR11: 'MR11IntegratedVerification',
  MR12: 'MR12CriticalThinkingScaffolding',
  MR13: 'MR13TransparentUncertainty',
  MR14: 'MR14GuidedReflectionMechanism',
  MR15: 'MR15MetacognitiveStrategyGuide',
  MR16: 'MR16SkillAtrophyPrevention',
  MR17: 'MR17LearningProcessVisualization',
  MR18: 'MR18OverRelianceWarning',
  MR19: 'MR19MetacognitiveCapabilityAssessment',
  MR23: 'MR23PrivacyPreservingArchitecture'
} as const;

export type MRComponentKey = keyof typeof MR_COMPONENT_MAP;
