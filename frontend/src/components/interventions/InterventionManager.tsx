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
import Tier1SoftSignal from './Tier1SoftSignal';
import Tier2MediumAlert from './Tier2MediumAlert';
import Tier3HardBarrier, { BarrierOption } from './Tier3HardBarrier';

export interface InterventionManagerProps {
  sessionId: string;
  messages: Message[];
  onInterventionDisplayed?: (tier: string, mrType: string) => void;
  onUserAction?: (mrType: string, action: string) => void;
  minMessagesForDetection?: number; // Min messages before analyzing (avoid early noise)
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
}) => {
  const store = useInterventionStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize session in store
  useEffect(() => {
    store.setCurrentSession(sessionId);
  }, [sessionId, store]);

  /**
   * Core detection and scheduling logic
   * Runs whenever message history changes
   */
  useEffect(() => {
    if (messages.length < minMessagesForDetection || isAnalyzing) {
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
        if (detection.confidence < 0.4) {
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
  }, [messages, minMessagesForDetection, isAnalyzing, store, onInterventionDisplayed]);

  /**
   * Create intervention UI based on detection result
   */
  const createInterventionUI = (detection: any, tier: string, msgs: Message[]) => {
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
        onLearnMore: () => handleLearnMore(baseIntervention.mrType),
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
        onAction: () => handleLearnMore(baseIntervention.mrType),
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
  };

  /**
   * Handle soft signal dismiss
   */
  const handleDismiss = useCallback(
    (mrType: string) => {
      store.recordUserAction(mrType, 'dismiss');
      store.clearActiveIntervention();
      onUserAction?.(mrType, 'dismiss');
    },
    [store, onUserAction]
  );

  /**
   * Handle learn more click
   */
  const handleLearnMore = useCallback(
    (mrType: string) => {
      store.recordUserAction(mrType, 'acted');
      store.recordEngagement(sessionId, 'engagement');
      // Could open detailed explanation modal here
      store.clearActiveIntervention();
      onUserAction?.(mrType, 'learn_more');
    },
    [store, sessionId, onUserAction]
  );

  /**
   * Handle skip button
   */
  const handleSkip = useCallback(
    (mrType: string) => {
      store.recordUserAction(mrType, 'skip');
      store.clearActiveIntervention();
      onUserAction?.(mrType, 'skip');
    },
    [store, onUserAction]
  );

  /**
   * Handle hard barrier confirm
   */
  const handleBarrierConfirm = useCallback(
    async (selectedValue: string, mrType: string) => {
      if (selectedValue === 'override') {
        // User chose to proceed anyway - valuable metacognitive data
        store.recordUserAction(mrType, 'override');
      } else {
        // User chose a safer action (verify, modify, reject)
        store.recordUserAction(mrType, 'acted');
        store.recordEngagement(sessionId, 'compliance');
      }

      store.clearActiveIntervention();
      onUserAction?.(mrType, selectedValue);
    },
    [store, sessionId, onUserAction]
  );

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
