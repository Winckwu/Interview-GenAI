/**
 * Intervention Manager: Central Orchestrator
 *
 * Purpose: Coordinate pattern detection, fatigue management, and UI display
 *
 * Integration Flow:
 * 1. ChatSessionPage passes message history
 * 2. InterventionManager calls PatternDetector to detect patterns
 * 3. InterventionManager calls InterventionScheduler to check fatigue/suppression
 * 4. Decides which tier to display (soft/medium/hard)
 * 5. Handles user actions and updates state
 * 6. Logs metrics for dashboard
 *
 * This component is invisible - it manages everything behind the scenes
 */

import React, { useEffect, useCallback, useState, useRef, useMemo, ReactNode } from 'react';
import { Message } from '../../types';
import { detectPatternF, extractUserSignals } from '../../utils/PatternDetector';
import {
  Puzzle,
  Search,
  Target,
  Users,
  GitBranch,
  Scale,
  BookOpen,
  ClipboardList,
  BarChart3,
  CheckCircle,
  Brain,
  HelpCircle,
  FileText,
  GraduationCap,
  Dumbbell,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import {
  scheduleIntervention,
  recordInterventionAction as updateInterventionAction,
  calculateFatigueScore,
  calculateSuppressionExpiry,
  UserPatternType,
} from '../../utils/InterventionScheduler';
import { useInterventionStore } from '../../stores/interventionStore';
import { useMetricsStore } from '../../stores/metricsStore';
import Tier1SoftSignal from './Tier1SoftSignal';
import Tier2MediumAlert from './Tier2MediumAlert';
import Tier3HardBarrier, { BarrierOption } from './Tier3HardBarrier';
import { ActiveMR } from '../chat/MCAConversationOrchestrator';

// ============================================================================
// MR15 Contextual Strategy Tips (merged into Soft Tier)
// ============================================================================

// User's current phase in conversation
type UserPhase = 'composing' | 'waiting' | 'received' | 'idle';

// Contextual tip structure
interface ContextualTip {
  id: string;
  phase: UserPhase | UserPhase[];
  tip: string;
  detail?: string;
  actionLabel?: string;
  priority: number;
}

// MR15 Tips - shown in soft tier based on user phase and behavior
const MR15_CONTEXTUAL_TIPS: ContextualTip[] = [
  // COMPOSING phase - before sending
  {
    id: 'think-first',
    phase: 'composing',
    tip: 'Think for 2 minutes before asking',
    detail: 'Try thinking it through first - you might already know the answer!',
    actionLabel: 'Learn more',
    priority: 10
  },
  {
    id: 'be-specific',
    phase: 'composing',
    tip: 'Be specific for better answers',
    detail: 'Describe your specific situation instead of asking general questions',
    actionLabel: 'Learn more',
    priority: 8
  },
  {
    id: 'break-down',
    phase: 'composing',
    tip: 'Break big tasks into small steps',
    detail: 'Ask one small question at a time for better results',
    priority: 7
  },

  // WAITING phase - after sending
  {
    id: 'predict',
    phase: 'waiting',
    tip: 'Predict what AI will say',
    detail: 'While waiting, think: what do you expect? This helps you evaluate the response',
    priority: 6
  },

  // RECEIVED phase - after getting response
  {
    id: 'verify-facts',
    phase: 'received',
    tip: 'Verify key facts before trusting',
    detail: 'Double-check dates, data, and technical terms from other sources',
    actionLabel: 'Learn more',
    priority: 10
  },
  {
    id: 'ask-why',
    phase: 'received',
    tip: 'Ask "why" to understand the reasoning',
    detail: "Don't just accept - understand why this is the answer",
    actionLabel: 'Learn more',
    priority: 8
  },
  {
    id: 'get-options',
    phase: 'received',
    tip: 'Ask for alternatives',
    detail: 'Get multiple options so you can make a better choice',
    priority: 7
  },

  // IDLE phase - general
  {
    id: 'reflect',
    phase: 'idle',
    tip: 'Reflect on what you learned',
    detail: 'What did you learn? How can you ask better next time?',
    actionLabel: 'Learn more',
    priority: 5
  }
];

// Get a contextual tip based on phase and dismissed tips
const getContextualTip = (phase: UserPhase, dismissedTips: Set<string>): ContextualTip | null => {
  return MR15_CONTEXTUAL_TIPS
    .filter(tip => {
      const phases = Array.isArray(tip.phase) ? tip.phase : [tip.phase];
      return phases.includes(phase) && !dismissedTips.has(tip.id);
    })
    .sort((a, b) => b.priority - a.priority)[0] || null;
};

export interface InterventionManagerProps {
  sessionId: string;
  messages: Message[];
  onInterventionDisplayed?: (tier: string, mrType: string) => void;
  onUserAction?: (mrType: string, action: string) => void;
  minMessagesForDetection?: number; // Min messages before analyzing (avoid early noise)
  activeMRs?: ActiveMR[]; // Backend MCA orchestrator results - takes priority over frontend detection
  isStreaming?: boolean; // Whether AI is currently generating response
  userInput?: string; // Current user input (for phase detection)
  userPattern?: UserPatternType; // User's behavioral pattern (A-F) for intervention threshold adjustment
}

/**
 * InterventionManager Component
 * Manages entire intervention lifecycle:
 * - Pattern detection on new messages
 * - Fatigue-aware scheduling decisions
 * - UI tier selection and display
 * - User action handling
 * - Metrics logging
 *
 * Usage in ChatSessionPage:
 * <InterventionManager
 *   sessionId={sessionId}
 *   messages={messages}
 *   onInterventionDisplayed={(tier, mrType) => console.log(tier, mrType)}
 *   onUserAction={(mrType, action) => console.log(action)}
 *   minMessagesForDetection={5}
 * />
 */
const InterventionManager: React.FC<InterventionManagerProps> = ({
  sessionId,
  messages,
  onInterventionDisplayed,
  onUserAction,
  minMessagesForDetection = 5,
  activeMRs = [],
  isStreaming = false,
  userInput = '',
  userPattern = 'unknown',
}) => {
  const store = useInterventionStore();
  const metricsStore = useMetricsStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastInterventionId, setLastInterventionId] = useState<string | null>(null);
  const [interventionStartTime, setInterventionStartTime] = useState<number>(0);
  const [lastDisplayedMRId, setLastDisplayedMRId] = useState<string | null>(null);

  // MR15: Track dismissed contextual tips
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('mr15-soft-tier-dismissed');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist dismissed tips
  useEffect(() => {
    localStorage.setItem('mr15-soft-tier-dismissed', JSON.stringify([...dismissedTips]));
  }, [dismissedTips]);

  // MR15: Detect user phase from messages and streaming state
  const userPhase: UserPhase = useMemo(() => {
    if (isStreaming) return 'waiting';
    if (userInput.trim().length > 0) return 'composing';
    if (messages.length === 0) return 'composing'; // New conversation
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'ai') return 'received';
    return 'idle';
  }, [isStreaming, userInput, messages]);

  // Use ref for lastHardBarrierTime to avoid triggering re-renders and infinite loops
  const lastHardBarrierTimeRef = useRef<number>(0);
  // Track if we've recorded metrics for current MR to avoid duplicates
  const lastRecordedMRIdRef = useRef<string | null>(null);

  // Hard barrier cooldown: 5 minutes between hard barriers
  const HARD_BARRIER_COOLDOWN_MS = 5 * 60 * 1000;

  /**
   * Handle soft signal dismiss
   */
  const handleDismiss = useCallback(
    (mrType: string) => {
      store.recordUserAction(mrType, 'dismiss');

      // Record action in metrics store
      if (lastInterventionId) {
        const timeToAction = Date.now() - interventionStartTime;
        metricsStore.recordUserAction(sessionId, lastInterventionId, 'dismiss', timeToAction);
      }

      store.clearActiveIntervention();
      onUserAction?.(mrType, 'dismiss');
      setLastInterventionId(null);
    },
    // Note: store and metricsStore are stable Zustand stores, removed from deps to prevent infinite loops
    [sessionId, lastInterventionId, interventionStartTime, onUserAction]
  );

  /**
   * Handle learn more click
   */
  const handleLearnMore = useCallback(
    (mrType: string) => {
      console.log(`[handleLearnMore] User clicked Learn More for ${mrType}`);
      store.recordUserAction(mrType, 'acted');
      store.recordEngagement(sessionId, 'engagement');

      // Record action in metrics store (compliance action)
      if (lastInterventionId) {
        const timeToAction = Date.now() - interventionStartTime;
        console.log(`[handleLearnMore] Recording action: ${timeToAction}ms`);
        metricsStore.recordUserAction(sessionId, lastInterventionId, 'acted', timeToAction);
      }

      // Could open detailed explanation modal here
      console.log(`[handleLearnMore] Clearing active intervention`);
      store.clearActiveIntervention();
      onUserAction?.(mrType, 'learn_more');
      setLastInterventionId(null);
    },
    // Note: store and metricsStore are stable Zustand stores, removed from deps to prevent infinite loops
    [sessionId, lastInterventionId, interventionStartTime, onUserAction]
  );

  /**
   * Handle skip button
   */
  const handleSkip = useCallback(
    (mrType: string) => {
      store.recordUserAction(mrType, 'skip');

      // Record action in metrics store (skip is same as dismiss for metrics)
      if (lastInterventionId) {
        const timeToAction = Date.now() - interventionStartTime;
        metricsStore.recordUserAction(sessionId, lastInterventionId, 'dismiss', timeToAction);
      }

      store.clearActiveIntervention();
      onUserAction?.(mrType, 'skip');
      setLastInterventionId(null);
    },
    // Note: store and metricsStore are stable Zustand stores, removed from deps to prevent infinite loops
    [sessionId, lastInterventionId, interventionStartTime, onUserAction]
  );

  /**
   * Handle hard barrier confirm
   */
  const handleBarrierConfirm = useCallback(
    async (selectedValue: string, mrType: string) => {
      const action: 'acted' | 'override' = selectedValue === 'override' ? 'override' : 'acted';

      if (selectedValue === 'override') {
        // User chose to proceed anyway - valuable metacognitive data
        store.recordUserAction(mrType, 'override');
      } else {
        // User chose a safer action (verify, modify, reject)
        store.recordUserAction(mrType, 'acted');
        store.recordEngagement(sessionId, 'compliance');
      }

      // Record action in metrics store
      if (lastInterventionId) {
        const timeToAction = Date.now() - interventionStartTime;
        metricsStore.recordUserAction(sessionId, lastInterventionId, action, timeToAction);
      }

      store.clearActiveIntervention();
      onUserAction?.(mrType, selectedValue);
      setLastInterventionId(null);
    },
    // Note: store and metricsStore are stable Zustand stores, removed from deps to prevent infinite loops
    [sessionId, lastInterventionId, interventionStartTime, onUserAction]
  );

  /**
   * Convert backend ActiveMR to intervention UI format
   * Note: Does NOT set lastHardBarrierTime - caller must handle that to avoid infinite loops
   */
  const convertActiveMRToIntervention = useCallback(
    (mr: ActiveMR, currentLastHardBarrierTime: number) => {
      // Use tier from unified analysis if available, otherwise infer from urgency
      let tier: 'soft' | 'medium' | 'hard' = mr.tier ||
        (mr.urgency === 'enforce' ? 'hard' : mr.urgency === 'remind' ? 'medium' : 'soft');

      // Hard barrier cooldown: downgrade to medium if last hard barrier was too recent
      const timeSinceLastHardBarrier = Date.now() - currentLastHardBarrierTime;
      if (tier === 'hard' && timeSinceLastHardBarrier < HARD_BARRIER_COOLDOWN_MS) {
        console.log(`[InterventionManager] Downgrading hard to medium (cooldown: ${Math.round(timeSinceLastHardBarrier / 1000)}s < ${HARD_BARRIER_COOLDOWN_MS / 1000}s)`);
        tier = 'medium';
      }

      // Note: caller must update lastHardBarrierTimeRef.current if tier === 'hard'

      // MR-specific metadata for diverse, personalized interventions (using Lucide icons)
      const iconSize = 18;
      const iconStyle = { strokeWidth: 2 };
      const MR_METADATA: Record<string, { icon: ReactNode; category: string; risks: string[]; suggestions: string[] }> = {
        MR1:  { icon: <Puzzle size={iconSize} {...iconStyle} />, category: 'Task Planning', risks: ['May feel overwhelmed by complexity', 'Missing important subtasks'], suggestions: ['Break task into 3-5 smaller steps', 'Identify dependencies between steps'] },
        MR2:  { icon: <Search size={iconSize} {...iconStyle} />, category: 'Process Understanding', risks: ['May not understand AI reasoning', 'Harder to verify correctness'], suggestions: ['Ask AI to explain its process', 'Request step-by-step breakdown'] },
        MR3:  { icon: <Target size={iconSize} {...iconStyle} />, category: 'Human Agency', risks: ['AI may make decisions for you', 'Reduced sense of control'], suggestions: ['Clarify your decision points', 'Take ownership of key choices'] },
        MR4:  { icon: <Users size={iconSize} {...iconStyle} />, category: 'Role Definition', risks: ['Unclear expectations', 'Misaligned collaboration'], suggestions: ['Define your role clearly', 'Specify what you want AI to do'] },
        MR5:  { icon: <GitBranch size={iconSize} {...iconStyle} />, category: 'Iteration', risks: ['Losing previous good versions', 'Inefficient exploration'], suggestions: ['Use branching to preserve progress', 'Compare multiple approaches'] },
        MR6:  { icon: <Scale size={iconSize} {...iconStyle} />, category: 'Cross-Validation', risks: ['Single point of failure', 'Unverified claims'], suggestions: ['Compare with another AI model', 'Cross-check important facts'] },
        MR7:  { icon: <BookOpen size={iconSize} {...iconStyle} />, category: 'Learning from Failure', risks: ['Repeating same mistakes', 'Missing learning opportunities'], suggestions: ['Reflect on what went wrong', 'Document lessons learned'] },
        MR8:  { icon: <ClipboardList size={iconSize} {...iconStyle} />, category: 'Task Recognition', risks: ['Using wrong approach', 'Suboptimal results'], suggestions: ['Consider task characteristics', 'Adjust strategy accordingly'] },
        MR9:  { icon: <BarChart3 size={iconSize} {...iconStyle} />, category: 'Trust Calibration', risks: ['Over/under trusting AI', 'Uncalibrated expectations'], suggestions: ['Adjust trust based on evidence', 'Track AI accuracy over time'] },
        MR10: { icon: <Scale size={iconSize} {...iconStyle} />, category: 'Cost-Benefit', risks: ['Unintended consequences', 'Resource waste'], suggestions: ['Weigh pros and cons', 'Consider reversibility'] },
        MR11: { icon: <CheckCircle size={iconSize} {...iconStyle} />, category: 'Verification', risks: ['Accepting incorrect info', 'Building on faulty assumptions'], suggestions: ['Verify key claims', 'Use fact-checking tools'] },
        MR12: { icon: <Brain size={iconSize} {...iconStyle} />, category: 'Critical Thinking', risks: ['Accepting at face value', 'Missing logical flaws'], suggestions: ['Question assumptions', 'Look for evidence'] },
        MR13: { icon: <HelpCircle size={iconSize} {...iconStyle} />, category: 'Uncertainty', risks: ['False confidence', 'Ignoring limitations'], suggestions: ['Note confidence levels', 'Verify uncertain parts'] },
        MR14: { icon: <FileText size={iconSize} {...iconStyle} />, category: 'Reflection', risks: ['Shallow learning', 'Missing insights'], suggestions: ['Pause and reflect', 'Connect to prior knowledge'] },
        MR15: { icon: <GraduationCap size={iconSize} {...iconStyle} />, category: 'Metacognitive Strategy', risks: ['Ineffective learning', 'Missed opportunities'], suggestions: ['Apply learning strategies', 'Monitor your understanding'] },
        MR16: { icon: <Dumbbell size={iconSize} {...iconStyle} />, category: 'Skill Development', risks: ['Skill atrophy', 'Over-dependence on AI'], suggestions: ['Practice independently', 'Modify AI outputs'] },
        MR17: { icon: <TrendingUp size={iconSize} {...iconStyle} />, category: 'Progress Tracking', risks: ['Unclear progress', 'Missed milestones'], suggestions: ['Review your learning journey', 'Celebrate achievements'] },
        MR18: { icon: <AlertTriangle size={iconSize} {...iconStyle} />, category: 'Over-Reliance Warning', risks: ['Critical thinking decline', 'Accepting errors', 'Reduced learning'], suggestions: ['Verify before accepting', 'Make modifications', 'Question AI output'] },
        MR19: { icon: <Lightbulb size={iconSize} {...iconStyle} />, category: 'Self-Assessment', risks: ['Overestimating abilities', 'Blind spots'], suggestions: ['Assess your understanding', 'Identify knowledge gaps'] },
      };

      const metadata = MR_METADATA[mr.mrId] || MR_METADATA.MR18;

      const baseIntervention = {
        id: `intervention-${mr.mrId}`,
        mrType: mr.mrId,
        tier,
        confidence: 0.7,
        timestamp: Date.now(),
        content: mr.content,
      };

      if (tier === 'soft') {
        return {
          ...baseIntervention,
          icon: metadata.icon,
          title: mr.name,
          message: mr.message,
          description: `${metadata.category} • Priority: ${mr.priority}`,
          onDismiss: () => handleDismiss(mr.mrId),
          onLearnMore: () => {
            console.log(`[InterventionManager] Learn More clicked for MR: ${mr.mrId}`);
            handleLearnMore(mr.mrId);
          },
        };
      }

      if (tier === 'medium') {
        return {
          ...baseIntervention,
          icon: metadata.icon,
          title: mr.name,  // Use MR-specific title instead of generic "MCA Reminder"
          message: mr.message,
          suggestion: metadata.suggestions[0],
          consecutiveCount: 3,
          actionLabel: 'Take Action',
          onAction: () => {
            console.log(`[InterventionManager] Medium action clicked for MR: ${mr.mrId}`);
            handleLearnMore(mr.mrId);
          },
          onDismiss: () => handleDismiss(mr.mrId),
          onSkip: () => handleSkip(mr.mrId),
        };
      }

      // Hard barrier - use MR-specific risks and suggestions
      return {
        ...baseIntervention,
        icon: metadata.icon,
        title: `Warning: ${mr.name}`,  // MR-specific title
        message: mr.message,
        consecutiveCount: 4,
        risks: metadata.risks,
        suggestions: metadata.suggestions,
        isDangerous: true,
        onConfirm: (value: string) => handleBarrierConfirm(value, mr.mrId),
        onCancel: () => handleDismiss(mr.mrId),
      };
    },
    [handleDismiss, handleLearnMore, handleSkip, handleBarrierConfirm, HARD_BARRIER_COOLDOWN_MS]
  );

  /**
   * Generate contextual messages based on triggered rules
   * Returns arrays for flexible formatting at each tier level
   */
  const generateRuleBasedContent = (triggeredRules: string[], layer1: any) => {
    const messages: string[] = [];
    const risks: string[] = [];
    const suggestions: string[] = [];

    // F-R1: Quick acceptance (skimming)
    if (triggeredRules.includes('F-R1')) {
      messages.push('Accepting AI responses too quickly');
      risks.push('May miss important details or errors in the response');
      suggestions.push('Take more time to read through AI responses before accepting');
    }

    // F-R2: Zero verification
    if (triggeredRules.includes('F-R2')) {
      messages.push('No verification of AI outputs');
      risks.push('May have accepted incorrect or misleading information');
      suggestions.push('Try verifying key facts or claims in the AI response');
    }

    // F-R3: No modifications (accepting verbatim)
    if (triggeredRules.includes('F-R3')) {
      messages.push('Accepting responses without modifications');
      risks.push('May be missing opportunities to improve or customize the output');
      suggestions.push('Consider editing or adapting the AI response to better fit your needs');
    }

    // F-R4: Burst usage pattern
    if (triggeredRules.includes('F-R4')) {
      messages.push('Task-completion focused usage pattern');
      risks.push('Knowledge retention may be affected by concentrated usage');
      suggestions.push('Try spacing out your learning sessions for better retention');
    }

    // F-R5: Complete passivity
    if (triggeredRules.includes('F-R5')) {
      messages.push('Complete passive consumption');
      risks.push('Independent thinking ability may decline with passive consumption');
      suggestions.push('Engage more actively by questioning, editing, or critiquing responses');
    }

    // Default fallbacks
    if (messages.length === 0) {
      messages.push('Passive AI usage detected');
    }
    if (risks.length === 0) {
      risks.push('Learning effectiveness may be affected');
    }
    if (suggestions.length === 0) {
      suggestions.push('Try to engage more actively with AI responses');
    }

    return {
      // For single display: join with " • " for readability
      message: messages.length === 1 ? messages[0] : messages.join(' • '),
      // Keep arrays for list display
      messageList: messages,
      risks,
      suggestions,
    };
  };

  /**
   * Create intervention UI based on detection result
   * Defined before useEffects to avoid TDZ (Temporal Dead Zone) errors
   */
  const createInterventionUI = useCallback((detection: any, tierInput: string, msgs: Message[]) => {
    const triggeredRules = detection.layer1?.triggeredRules || [];
    const ruleContent = generateRuleBasedContent(triggeredRules, detection.layer1);

    // Apply hard barrier cooldown
    let tier = tierInput;
    const timeSinceLastHardBarrier = Date.now() - lastHardBarrierTimeRef.current;
    if (tier === 'hard' && timeSinceLastHardBarrier < HARD_BARRIER_COOLDOWN_MS) {
      console.log(`[createInterventionUI] Downgrading hard to medium (cooldown)`);
      tier = 'medium';
    }

    // Track hard barrier time (using ref to avoid triggering re-renders)
    if (tier === 'hard') {
      lastHardBarrierTimeRef.current = Date.now();
    }

    const baseIntervention = {
      id: `intervention-${Date.now()}`,
      mrType:
        tier === 'hard'
          ? 'MR_PATTERN_F_BARRIER'
          : tier === 'medium'
            ? 'MR18_OverDependence'
            : 'MR13_Uncertainty',
      tier: tier as 'soft' | 'medium' | 'hard',
      confidence: detection.confidence,
      timestamp: Date.now(),
    };

    if (tier === 'soft') {
      // MR15: Get contextual tip based on user phase
      const contextualTip = getContextualTip(userPhase, dismissedTips);

      // If we have a contextual tip, show it with the pattern insight
      if (contextualTip) {
        return {
          ...baseIntervention,
          mrType: `MR15_${contextualTip.id}`,
          icon: '💡',
          title: contextualTip.tip,
          message: contextualTip.detail || ruleContent.message,
          description: `Strategy tip • ${ruleContent.message}`,
          contextualTipId: contextualTip.id, // Track which tip was shown
          onDismiss: () => {
            // Dismiss the contextual tip permanently
            setDismissedTips(prev => new Set([...prev, contextualTip.id]));
            handleDismiss(baseIntervention.mrType);
          },
          onLearnMore: contextualTip.actionLabel ? () => {
            console.log(`[createInterventionUI] Contextual tip action clicked: ${contextualTip.id}`);
            // Dismiss the tip after action
            setDismissedTips(prev => new Set([...prev, contextualTip.id]));
            handleLearnMore(baseIntervention.mrType);
          } : undefined,
        };
      }

      // Fallback to standard pattern insight if no contextual tip
      return {
        ...baseIntervention,
        icon: '📊',
        title: 'Pattern Insight',
        message: ruleContent.message,
        description: `Based on ${triggeredRules.length} behavior indicator${triggeredRules.length > 1 ? 's' : ''}`,
        onDismiss: () => handleDismiss(baseIntervention.mrType),
        onLearnMore: () => {
          console.log(`[createInterventionUI] Soft signal Learn More clicked for ${baseIntervention.mrType}`);
          handleLearnMore(baseIntervention.mrType);
        },
      };
    }

    if (tier === 'medium') {
      return {
        ...baseIntervention,
        icon: '🔔',
        title: 'MCA Reminder',
        message: ruleContent.message,
        detectedBehaviors: ruleContent.messageList, // For list display when multiple
        suggestion: ruleContent.suggestions[0] || 'Pause and review whether recent AI responses meet your expectations.',
        consecutiveCount: detection.layer1.triggeredCount,
        actionLabel: 'Review Now',
        onAction: () => {
          console.log(`[createInterventionUI] Medium alert action clicked for ${baseIntervention.mrType}`);
          handleLearnMore(baseIntervention.mrType);
        },
        onDismiss: () => handleDismiss(baseIntervention.mrType),
        onSkip: () => handleSkip(baseIntervention.mrType),
      };
    }

    // Hard barrier - contextual design based on triggered rules
    return {
      ...baseIntervention,
      icon: '⚠️',
      title: 'Warning: Passive Usage Pattern Detected',
      message: ruleContent.message,
      consecutiveCount: detection.layer1.triggeredCount,
      risks: ruleContent.risks,
      suggestions: [
        'Pause current task',
        ...ruleContent.suggestions,
        'Try completing the next step independently',
      ],
      isDangerous: true,
      onConfirm: (value: string) => handleBarrierConfirm(value, baseIntervention.mrType),
      onCancel: () => handleDismiss(baseIntervention.mrType),
    };
  }, [handleDismiss, handleLearnMore, handleSkip, handleBarrierConfirm, HARD_BARRIER_COOLDOWN_MS, userPhase, dismissedTips]);

  // Initialize session in store
  useEffect(() => {
    store.setCurrentSession(sessionId);
  }, [sessionId]);

  /**
   * Handle backend MCA orchestrator MRs
   * Priority: Backend MRs > Frontend detection
   */
  useEffect(() => {
    // Minimum display time: don't replace intervention too quickly (10 seconds)
    const MIN_DISPLAY_TIME_MS = 10000;
    const timeSinceLastIntervention = Date.now() - interventionStartTime;

    if (activeMRs.length === 0) {
      // Clear any previously displayed backend MR if activeMRs is now empty
      // But only after minimum display time has passed
      if (lastDisplayedMRId && timeSinceLastIntervention > MIN_DISPLAY_TIME_MS) {
        setLastDisplayedMRId(null);
      }
      return;
    }

    // If we have active MRs from backend, display the first one
    // Sort by priority to show most important first
    const sortedMRs = [...activeMRs].sort((a, b) => b.priority - a.priority);
    const topMR = sortedMRs[0];

    // Avoid re-displaying the same MR
    if (lastDisplayedMRId === topMR.mrId) {
      return;
    }

    // Don't replace current intervention if it hasn't been displayed long enough
    if (lastDisplayedMRId && timeSinceLastIntervention < MIN_DISPLAY_TIME_MS) {
      return;
    }

    console.log(`[InterventionManager] Displaying backend MR: ${topMR.mrId} (${topMR.name})`);

    // Pass lastHardBarrierTime as parameter to avoid dependency issues
    const intervention = convertActiveMRToIntervention(topMR, lastHardBarrierTimeRef.current);

    // Update hard barrier time if needed (using ref to avoid triggering re-renders)
    if (intervention.tier === 'hard') {
      lastHardBarrierTimeRef.current = Date.now();
    }

    // Record intervention display - only if we haven't already recorded this MR
    if (lastRecordedMRIdRef.current !== topMR.mrId) {
      lastRecordedMRIdRef.current = topMR.mrId;
      try {
        metricsStore.recordInterventionDisplay({
          sessionId,
          timestamp: Date.now(),
          mrType: topMR.mrId,
          patternType: 'Pattern from MCA Orchestrator',
          confidence: 0.7,
          triggeredRules: [topMR.name],
          tier: intervention.tier as 'soft' | 'medium' | 'hard',
          messageCountAtDisplay: messages.length,
        });
      } catch (err) {
        console.error('[InterventionManager] Error recording metrics:', err);
      }
    }

    // Track intervention
    setLastInterventionId(intervention.id);
    setInterventionStartTime(Date.now());
    setLastDisplayedMRId(topMR.mrId);

    // Display the intervention
    store.setActiveIntervention(intervention);
    onInterventionDisplayed?.(intervention.tier, topMR.mrId);
    // Note: metricsStore and store are stable Zustand stores, excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMRs, lastDisplayedMRId, sessionId, messages.length, onInterventionDisplayed, interventionStartTime]);

  /**
   * Core detection and scheduling logic - Frontend fallback
   * Only runs if no backend activeMRs are available
   */
  useEffect(() => {
    // DEBUG: Log check conditions
    console.log('[InterventionManager] Check conditions:', {
      activeMRsLength: activeMRs.length,
      messagesLength: messages.length,
      minMessagesForDetection,
      isAnalyzing,
      willSkip: activeMRs.length > 0 || messages.length < minMessagesForDetection || isAnalyzing
    });

    // Skip if we have backend MRs or messages too short or analyzing
    if (activeMRs.length > 0 || messages.length < minMessagesForDetection || isAnalyzing) {
      return;
    }

    const performAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        // Extract signals from messages
        const signals = extractUserSignals(messages);

        // Run pattern detection
        const detection = detectPatternF(signals, messages);

        // DEBUG: Log detection results
        console.log('[InterventionManager] Pattern Detection:', {
          messageCount: messages.length,
          aiMessageCount: messages.filter(m => m.role === 'ai').length,
          signals: {
            verificationRate: signals.verificationRate,
            modificationRate: signals.modificationRate,
            rejectionRate: signals.rejectionRate,
            totalInteractions: signals.totalInteractions,
          },
          detection: {
            confidence: detection.confidence,
            triggeredRules: detection.layer1?.triggeredRules,
            recommendedTier: detection.recommendedTier,
          }
        });

        // Only proceed if pattern detected with meaningful confidence
        // Lowered threshold to 0.2 (1 rule triggered) for easier testing
        if (detection.confidence < 0.2) {
          console.log('[InterventionManager] Confidence too low, skipping intervention');
          setIsAnalyzing(false);
          return;
        }

        // Check suppression and schedule intervention
        // userPattern affects tier thresholds:
        // - Pattern F users get intervention at lower confidence (aggressive)
        // - Pattern A/B/D/E users rarely see interventions (high thresholds)
        const decision = scheduleIntervention(
          detection.recommendedTier === 'hard'
            ? 'MR_PATTERN_F_BARRIER'
            : detection.recommendedTier === 'medium'
              ? 'MR18_OverDependence'
              : 'MR13_Uncertainty',
          detection.confidence,
          detection.recommendedTier,
          store.userHistory,
          store.suppressionState,
          userPattern
        );

        console.log('[InterventionManager] Suppression decision:', decision);

        // If suppressed, don't display anything
        if (!decision.shouldDisplay) {
          console.log('[InterventionManager] Intervention suppressed');
          setIsAnalyzing(false);
          return;
        }

        // Create intervention UI based on tier
        const intervention = createInterventionUI(
          detection,
          decision.tier,
          messages
        );

        // Record intervention display in metrics
        metricsStore.recordInterventionDisplay({
          sessionId,
          timestamp: Date.now(),
          mrType: intervention.mrType,
          patternType: detection.patternType || 'Pattern F',
          confidence: detection.confidence,
          triggeredRules: detection.layer1?.triggeredRules || [],
          tier: decision.tier as 'soft' | 'medium' | 'hard',
          messageCountAtDisplay: messages.length,
        });

        // Track intervention for later action recording
        setLastInterventionId(intervention.id);
        setInterventionStartTime(Date.now());

        // Display the intervention
        store.setActiveIntervention(intervention);
        onInterventionDisplayed?.(decision.tier, intervention.mrType);

      } catch (err) {
        console.error('Error in intervention analysis:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Debounce analysis to avoid excessive checking
    const timer = setTimeout(() => {
      performAnalysis();
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, minMessagesForDetection, isAnalyzing, sessionId, onInterventionDisplayed, activeMRs.length, createInterventionUI, userPattern]);

  /**
   * Render active intervention
   */
  const intervention = store.activeIntervention;

  if (!intervention) {
    return null;
  }

  // Render based on tier
  if (intervention.tier === 'soft') {
    return (
      <Tier1SoftSignal
        id={intervention.id}
        icon={intervention.icon}
        title={intervention.title}
        message={intervention.message}
        description={intervention.description}
        onDismiss={intervention.onDismiss}
        onLearnMore={intervention.onLearnMore}
        learnMoreLabel="Learn more"
        autoCloseSec={60}
      />
    );
  }

  if (intervention.tier === 'medium') {
    return (
      <Tier2MediumAlert
        id={intervention.id}
        icon={intervention.icon || '🔔'}
        title={intervention.title || 'MCA Reminder'}
        message={intervention.message}
        detectedBehaviors={intervention.detectedBehaviors}
        suggestion={intervention.suggestion || 'Pause and review whether recent AI responses meet your expectations.'}
        description={intervention.description}
        consecutiveCount={intervention.consecutiveCount}
        actionLabel={intervention.actionLabel || 'Verify Now'}
        onAction={intervention.onAction}
        onRemindLater={intervention.onSkip}
        onDontShowAgain={intervention.onDismiss}
        onDismiss={intervention.onDismiss}
        onSkip={intervention.onSkip}
        autoCloseSec={0}
      />
    );
  }

  if (intervention.tier === 'hard') {
    return (
      <Tier3HardBarrier
        id={intervention.id}
        icon={intervention.icon || '⚠️'}
        title={intervention.title || 'Warning: Over-Reliance Risk Detected'}
        message={intervention.message}
        description={intervention.description}
        consecutiveCount={intervention.consecutiveCount}
        risks={intervention.risks}
        suggestions={intervention.suggestions}
        options={intervention.options}
        isDangerous={intervention.isDangerous}
        onConfirm={intervention.onConfirm}
        onCancel={intervention.onCancel}
      />
    );
  }

  return null;
};

export default InterventionManager;
