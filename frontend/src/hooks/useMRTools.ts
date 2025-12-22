/**
 * useMRTools Hook
 *
 * Manages all MR (Metacognitive Response) tool-related state and operations:
 * - Active tool selection and navigation
 * - MR tool panel visibility
 * - MR tool-specific state (verification logs, conversation branches, etc.)
 * - Tool usage tracking
 * - Helper functions to open specific MR tools
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 1 refactoring.
 */

import { useState, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

export type ActiveMRTool =
  | 'none'
  | 'mr1-decomposition'
  | 'mr2-transparency'
  | 'mr3-agency'
  | 'mr4-roles'
  | 'mr5-iteration'
  | 'mr6-models'
  | 'mr7-failure'
  | 'mr10-cost'
  | 'mr11-verify'
  | 'mr12-critical'
  | 'mr13-uncertainty'
  | 'mr14-reflection'
  | 'mr15-strategies'
  | 'mr16-atrophy'
  | 'mr17-visualization'
  | 'mr19-assessment';

// New simplified intervention levels (MR3 refactor)
// - minimal: Only hard tier (critical warnings)
// - balanced: Medium + hard tier (moderate guidance) - DEFAULT
// - active: All tiers (comprehensive coaching)
export type InterventionLevel = 'minimal' | 'balanced' | 'active';

// Backwards compatibility mapping for old values
export const INTERVENTION_LEVEL_MIGRATION: Record<string, InterventionLevel> = {
  'passive': 'minimal',
  'suggestive': 'balanced',
  'proactive': 'active',
};

export interface UseMRToolsOptions {
  onToolOpened?: (toolId: ActiveMRTool) => void;
  onSuccessMessage?: (message: string) => void;
}

export interface UseMRToolsReturn {
  // State
  activeMRTool: ActiveMRTool;
  showMRToolsSection: boolean;
  showMRToolsPanel: boolean;
  interventionLevel: InterventionLevel;
  conversationBranches: any[];
  verificationLogs: any[];
  usedMRTools: string[];

  // Setters
  setActiveMRTool: React.Dispatch<React.SetStateAction<ActiveMRTool>>;
  setShowMRToolsSection: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMRToolsPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setInterventionLevel: React.Dispatch<React.SetStateAction<InterventionLevel>>;
  setConversationBranches: React.Dispatch<React.SetStateAction<any[]>>;
  setVerificationLogs: React.Dispatch<React.SetStateAction<any[]>>;

  // Tool tracking
  trackMRToolUsage: (toolId: string) => void;

  // Tool openers (convenience methods)
  openMR1Decomposition: () => void;
  openMR2History: () => void;
  openMR3AgencyControl: () => void;
  openMR4RoleDefinition: () => void;
  openMR5Iteration: () => void;
  openMR6CrossModel: () => void;
  openMR7FailureLearning: () => void;
  openMR8TaskRecognition: () => void;
  openMR9TrustCalibration: () => void;
  openMR10CostBenefit: () => void;
  openMR11Verification: () => void;
  openMR12CriticalThinking: () => void;
  openMR13Uncertainty: () => void;
  openMR14Reflection: () => void;
  openMR15StrategyGuide: () => void;
  openMR16SkillAtrophy: () => void;
  openMR17LearningVisualization: () => void;
  openMR19CapabilityAssessment: () => void;

  // Utility
  closeMRTool: () => void;
  openTool: (toolId: ActiveMRTool, message?: string) => void;
}

// ============================================================
// HOOK
// ============================================================

export function useMRTools(options: UseMRToolsOptions = {}): UseMRToolsReturn {
  const { onToolOpened, onSuccessMessage } = options;

  // MR Tools Panel state
  const [activeMRTool, setActiveMRTool] = useState<ActiveMRTool>('none');
  const [showMRToolsPanel, setShowMRToolsPanel] = useState(false);
  const [showMRToolsSection, setShowMRToolsSection] = useState(true);

  // MR Tool-specific state - Load from localStorage or use default
  const [interventionLevel, setInterventionLevel] = useState<InterventionLevel>(() => {
    const saved = localStorage.getItem('mr3-intervention-level');
    if (saved && (saved === 'minimal' || saved === 'balanced' || saved === 'active')) {
      return saved;
    }
    // Migrate old values
    if (saved && saved in INTERVENTION_LEVEL_MIGRATION) {
      return INTERVENTION_LEVEL_MIGRATION[saved];
    }
    return 'balanced';
  });
  const [conversationBranches, setConversationBranches] = useState<any[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
  const [usedMRTools, setUsedMRTools] = useState<string[]>([]);

  /**
   * Track when MR tools are opened
   */
  const trackMRToolUsage = useCallback((toolId: string) => {
    setUsedMRTools(prev => {
      if (prev.includes(toolId)) return prev;
      return [...prev, toolId];
    });
  }, []);

  /**
   * Generic function to open any MR tool
   */
  const openTool = useCallback((toolId: ActiveMRTool, message?: string) => {
    setActiveMRTool(toolId);
    setShowMRToolsSection(true);
    trackMRToolUsage(toolId);

    if (message) {
      onSuccessMessage?.(message);
      setTimeout(() => onSuccessMessage?.(''), 2000);
    }

    onToolOpened?.(toolId);
  }, [trackMRToolUsage, onToolOpened, onSuccessMessage]);

  /**
   * Close active MR tool
   */
  const closeMRTool = useCallback(() => {
    setActiveMRTool('none');
  }, []);

  // ============================================================
  // Individual tool openers
  // ============================================================

  const openMR1Decomposition = useCallback(() => {
    openTool('mr1-decomposition', '✓ Opened Task Decomposition (MR1)');
  }, [openTool]);

  const openMR2History = useCallback(() => {
    openTool('mr2-transparency', '✓ Opened Process History (MR2)');
  }, [openTool]);

  const openMR3AgencyControl = useCallback(() => {
    openTool('mr3-agency', '✓ Opened Agency Control (MR3)');
  }, [openTool]);

  const openMR4RoleDefinition = useCallback(() => {
    openTool('mr4-roles', '✓ Opened AI Role Definition (MR4)');
  }, [openTool]);

  const openMR5Iteration = useCallback(() => {
    openTool('mr5-iteration', '✓ Opened Iteration Tool (MR5)');
  }, [openTool]);

  const openMR6CrossModel = useCallback(() => {
    openTool('mr6-models', '✓ Opened Cross-Model Comparison (MR6)');
  }, [openTool]);

  const openMR7FailureLearning = useCallback(() => {
    openTool('mr7-failure', '✓ Opened Failure Learning (MR7)');
  }, [openTool]);

  const openMR8TaskRecognition = useCallback(() => {
    // MR8 is typically automatic, but can be opened manually
    openTool('none', '✓ Task Recognition Active (MR8)');
  }, [openTool]);

  const openMR9TrustCalibration = useCallback(() => {
    // MR9 is typically automatic, but can be opened manually
    openTool('none', '✓ Trust Calibration Active (MR9)');
  }, [openTool]);

  const openMR10CostBenefit = useCallback(() => {
    openTool('mr10-cost', '✓ Opened Cost-Benefit Analysis (MR10)');
  }, [openTool]);

  const openMR11Verification = useCallback(() => {
    openTool('mr11-verify', '📋 Verification Tool Opened - Complete the workflow to mark as verified');
  }, [openTool]);

  const openMR12CriticalThinking = useCallback(() => {
    openTool('mr12-critical', '✓ Activated Critical Thinking (MR12)');
  }, [openTool]);

  const openMR13Uncertainty = useCallback(() => {
    openTool('mr13-uncertainty', '✓ Opened Uncertainty Analysis (MR13)');
  }, [openTool]);

  const openMR14Reflection = useCallback(() => {
    openTool('mr14-reflection', '✓ Opened Guided Reflection (MR14)');
  }, [openTool]);

  const openMR15StrategyGuide = useCallback(() => {
    openTool('mr15-strategies', '✓ Opened Strategy Guide (MR15)');
  }, [openTool]);

  const openMR16SkillAtrophy = useCallback(() => {
    openTool('mr16-atrophy', '✓ Opened Skill Atrophy Prevention (MR16)');
  }, [openTool]);

  const openMR17LearningVisualization = useCallback(() => {
    openTool('mr17-visualization', '✓ Opened Learning Visualization (MR17)');
  }, [openTool]);

  const openMR19CapabilityAssessment = useCallback(() => {
    openTool('mr19-assessment', '✓ Opened Capability Assessment (MR19)');
  }, [openTool]);

  return {
    // State
    activeMRTool,
    showMRToolsSection,
    showMRToolsPanel,
    interventionLevel,
    conversationBranches,
    verificationLogs,
    usedMRTools,

    // Setters
    setActiveMRTool,
    setShowMRToolsSection,
    setShowMRToolsPanel,
    setInterventionLevel,
    setConversationBranches,
    setVerificationLogs,

    // Tracking
    trackMRToolUsage,

    // Tool openers
    openMR1Decomposition,
    openMR2History,
    openMR3AgencyControl,
    openMR4RoleDefinition,
    openMR5Iteration,
    openMR6CrossModel,
    openMR7FailureLearning,
    openMR8TaskRecognition,
    openMR9TrustCalibration,
    openMR10CostBenefit,
    openMR11Verification,
    openMR12CriticalThinking,
    openMR13Uncertainty,
    openMR14Reflection,
    openMR15StrategyGuide,
    openMR16SkillAtrophy,
    openMR17LearningVisualization,
    openMR19CapabilityAssessment,

    // Utility
    closeMRTool,
    openTool,
  };
}

export default useMRTools;
