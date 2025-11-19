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

import React, { useEffect, useCallback, useState } from 'react';
import { Message } from '../../types';
import { detectPatternF, extractUserSignals } from '../../utils/PatternDetector';
import {
  scheduleIntervention,
  recordInterventionAction as updateInterventionAction,
  calculateFatigueScore,
  calculateSuppressionExpiry,
} from '../../utils/InterventionScheduler';
import { useInterventionStore } from '../../stores/interventionStore';
import { useMetricsStore } from '../../stores/metricsStore';
import Tier1SoftSignal from './Tier1SoftSignal';
import Tier2MediumAlert from './Tier2MediumAlert';
import Tier3HardBarrier, { BarrierOption } from './Tier3HardBarrier';
import { ActiveMR } from '../chat/MCAConversationOrchestrator';

export interface InterventionManagerProps {
  sessionId: string;
  messages: Message[];
  onInterventionDisplayed?: (tier: string, mrType: string) => void;
  onUserAction?: (mrType: string, action: string) => void;
  minMessagesForDetection?: number; // Min messages before analyzing (avoid early noise)
  activeMRs?: ActiveMR[]; // Backend MCA orchestrator results - takes priority over frontend detection
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
}) => {
  const store = useInterventionStore();
  const metricsStore = useMetricsStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastInterventionId, setLastInterventionId] = useState<string | null>(null);
  const [interventionStartTime, setInterventionStartTime] = useState<number>(0);
  const [lastDisplayedMRId, setLastDisplayedMRId] = useState<string | null>(null);

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
   */
  const convertActiveMRToIntervention = useCallback(
    (mr: ActiveMR) => {
      const tier: 'soft' | 'medium' | 'hard' =
        mr.urgency === 'enforce' ? 'hard' : mr.urgency === 'remind' ? 'medium' : 'soft';

      const baseIntervention = {
        id: `intervention-${mr.mrId}`,
        mrType: mr.mrId,
        tier,
        confidence: 0.7, // Backend MR confidence is implicit in its activation
        timestamp: Date.now(),
      };

      if (tier === 'soft') {
        return {
          ...baseIntervention,
          icon: '📊',
          title: mr.name,
          message: mr.message,
          description: `Priority: ${mr.priority}`,
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
          icon: '⚠️',
          title: 'Review Recommended',
          message: mr.message,
          description: `MR: ${mr.name}`,
          actionLabel: 'View Details',
          onAction: () => {
            console.log(`[InterventionManager] Medium action clicked for MR: ${mr.mrId}`);
            handleLearnMore(mr.mrId);
          },
          onDismiss: () => handleDismiss(mr.mrId),
          onSkip: () => handleSkip(mr.mrId),
        };
      }

      // Hard barrier
      const options: BarrierOption[] = [
        {
          label: '✓ I will verify it carefully',
          value: 'verify',
          description: 'Review the response for accuracy before accepting',
        },
        {
          label: '✎ I will modify it before use',
          value: 'modify',
          description: 'Edit or improve the response',
        },
        {
          label: '↻ I will reject and re-ask',
          value: 'reject',
          description: 'Ask the AI to regenerate the response',
        },
        {
          label: '→ I understand risks, proceed anyway',
          value: 'override',
          description: 'Accept the response as-is',
        },
      ];

      return {
        ...baseIntervention,
        icon: '🚨',
        title: 'Safety Check Required',
        message: mr.message,
        description: `MR: ${mr.name}`,
        options,
        isDangerous: true,
        onConfirm: (value: string) => handleBarrierConfirm(value, mr.mrId),
        onCancel: () => handleDismiss(mr.mrId),
      };
    },
    [handleDismiss, handleLearnMore, handleSkip, handleBarrierConfirm]
  );

  /**
   * Create intervention UI based on detection result
   * Defined before useEffects to avoid TDZ (Temporal Dead Zone) errors
   */
  const createInterventionUI = useCallback((detection: any, tier: string, msgs: Message[]) => {
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
      return {
        ...baseIntervention,
        icon: '📊',
        title: 'Pattern Insight',
        message: detection.explanation.summary,
        description: `Confidence: ${(detection.confidence * 100).toFixed(0)}%`,
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
        icon: '⚠️',
        title: 'Review Recommended',
        message: detection.explanation.summary,
        description: `Based on ${detection.layer1.triggeredCount} pattern indicators`,
        actionLabel: 'View Details',
        onAction: () => {
          console.log(`[createInterventionUI] Medium alert action clicked for ${baseIntervention.mrType}`);
          handleLearnMore(baseIntervention.mrType);
        },
        onDismiss: () => handleDismiss(baseIntervention.mrType),
        onSkip: () => handleSkip(baseIntervention.mrType),
      };
    }

    // Hard barrier
    const options: BarrierOption[] = [
      {
        label: '✓ I will verify it carefully',
        value: 'verify',
        description: 'Review the response for accuracy before accepting',
      },
      {
        label: '✎ I will modify it before use',
        value: 'modify',
        description: 'Edit or improve the response',
      },
      {
        label: '↻ I will reject and re-ask',
        value: 'reject',
        description: 'Ask the AI to regenerate the response',
      },
      {
        label: '→ I understand risks, proceed anyway',
        value: 'override',
        description: 'Accept the response as-is',
      },
    ];

    return {
      ...baseIntervention,
      icon: '🚨',
      title: 'Safety Check Required',
      message:
        'We detected a pattern suggesting this response should be verified before use in real-world context.',
      description: detection.explanation.triggeredRuleDetails
        .map((r: any) => r.ruleName)
        .join(', '),
      options,
      isDangerous: true,
      onConfirm: (value: string) => handleBarrierConfirm(value, baseIntervention.mrType),
      onCancel: () => handleDismiss(baseIntervention.mrType),
    };
  }, [handleDismiss, handleLearnMore, handleSkip, handleBarrierConfirm]);

  // Initialize session in store
  useEffect(() => {
    store.setCurrentSession(sessionId);
  }, [sessionId]);

  /**
   * Handle backend MCA orchestrator MRs
   * Priority: Backend MRs > Frontend detection
   */
  useEffect(() => {
    if (activeMRs.length === 0) {
      // Clear any previously displayed backend MR if activeMRs is now empty
      if (lastDisplayedMRId) {
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

    console.log(`[InterventionManager] Displaying backend MR: ${topMR.mrId} (${topMR.name})`);

    const intervention = convertActiveMRToIntervention(topMR);

    // Record intervention display
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

    // Track intervention
    setLastInterventionId(intervention.id);
    setInterventionStartTime(Date.now());
    setLastDisplayedMRId(topMR.mrId);

    // Display the intervention
    store.setActiveIntervention(intervention);
    onInterventionDisplayed?.(intervention.tier, topMR.mrId);
  }, [activeMRs, lastDisplayedMRId, convertActiveMRToIntervention, sessionId, messages.length, onInterventionDisplayed]);

  /**
   * Core detection and scheduling logic - Frontend fallback
   * Only runs if no backend activeMRs are available
   */
  useEffect(() => {
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

        // Only proceed if pattern detected with meaningful confidence
        // Lowered threshold to 0.2 (1 rule triggered) for easier testing
        if (detection.confidence < 0.2) {
          setIsAnalyzing(false);
          return;
        }

        // Check suppression and schedule intervention
        const decision = scheduleIntervention(
          detection.recommendedTier === 'hard'
            ? 'MR_PATTERN_F_BARRIER'
            : detection.recommendedTier === 'medium'
              ? 'MR18_OverDependence'
              : 'MR13_Uncertainty',
          detection.confidence,
          detection.recommendedTier,
          store.userHistory,
          store.suppressionState
        );

        // If suppressed, don't display anything
        if (!decision.shouldDisplay) {
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
  }, [messages, minMessagesForDetection, isAnalyzing, sessionId, onInterventionDisplayed, activeMRs.length, createInterventionUI]);

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
      />
    );
  }

  if (intervention.tier === 'medium') {
    return (
      <Tier2MediumAlert
        id={intervention.id}
        icon={intervention.icon}
        title={intervention.title}
        message={intervention.message}
        description={intervention.description}
        actionLabel={intervention.actionLabel || 'Learn More'}
        onAction={intervention.onAction}
        onDismiss={intervention.onDismiss}
        onSkip={intervention.onSkip}
      />
    );
  }

  if (intervention.tier === 'hard') {
    return (
      <Tier3HardBarrier
        id={intervention.id}
        icon={intervention.icon}
        title={intervention.title}
        message={intervention.message}
        description={intervention.description}
        options={intervention.options || []}
        isDangerous={intervention.isDangerous}
        onConfirm={intervention.onConfirm}
        onCancel={intervention.onCancel}
      />
    );
  }

  return null;
};

export default InterventionManager;
