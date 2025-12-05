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
      // Use tier from unified analysis if available, otherwise infer from urgency
      const tier: 'soft' | 'medium' | 'hard' = mr.tier ||
        (mr.urgency === 'enforce' ? 'hard' : mr.urgency === 'remind' ? 'medium' : 'soft');

      const baseIntervention = {
        id: `intervention-${mr.mrId}`,
        mrType: mr.mrId,
        tier,
        confidence: 0.7, // Backend MR confidence is implicit in its activation
        timestamp: Date.now(),
        content: mr.content, // Pre-generated content from unified GPT analysis
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
          icon: '🔔',
          title: 'MCA Reminder',
          message: mr.message || 'You have not verified AI output for {count} consecutive interactions.',
          suggestion: 'Pause and review whether recent AI responses meet your expectations.',
          consecutiveCount: 3, // TODO: Get actual count from session state
          actionLabel: 'Verify Now',
          onAction: () => {
            console.log(`[InterventionManager] Medium action clicked for MR: ${mr.mrId}`);
            handleLearnMore(mr.mrId);
          },
          onDismiss: () => handleDismiss(mr.mrId),
          onSkip: () => handleSkip(mr.mrId),
        };
      }

      // Hard barrier - new simplified design with risks and suggestions
      return {
        ...baseIntervention,
        icon: '⚠️',
        title: 'Warning: Over-Reliance Risk Detected',
        message: mr.message || 'You have not verified AI output for {count} consecutive interactions.',
        consecutiveCount: 4, // TODO: Get actual count from session state
        risks: [
          'May have accepted incorrect information',
          'Independent thinking ability may decline',
          'Learning effectiveness may be affected',
        ],
        suggestions: [
          'Pause current task',
          'Review recent AI responses',
          'Try completing the next step independently',
        ],
        isDangerous: true,
        onConfirm: (value: string) => handleBarrierConfirm(value, mr.mrId),
        onCancel: () => handleDismiss(mr.mrId),
      };
    },
    [handleDismiss, handleLearnMore, handleSkip, handleBarrierConfirm]
  );

  /**
   * Generate contextual messages based on triggered rules
   */
  const generateRuleBasedContent = (triggeredRules: string[], layer1: any) => {
    const messages: string[] = [];
    const risks: string[] = [];
    const suggestions: string[] = [];

    // F-R1: Quick acceptance (skimming)
    if (triggeredRules.includes('F-R1')) {
      messages.push('You are accepting AI responses very quickly without reading carefully.');
      risks.push('May miss important details or errors in the response');
      suggestions.push('Take more time to read through AI responses before accepting');
    }

    // F-R2: Zero verification
    if (triggeredRules.includes('F-R2')) {
      messages.push('You have not verified any AI outputs.');
      risks.push('May have accepted incorrect or misleading information');
      suggestions.push('Try verifying key facts or claims in the AI response');
    }

    // F-R3: No modifications (accepting verbatim)
    if (triggeredRules.includes('F-R3')) {
      messages.push('You are accepting AI responses without any modifications.');
      risks.push('May be missing opportunities to improve or customize the output');
      suggestions.push('Consider editing or adapting the AI response to better fit your needs');
    }

    // F-R4: Burst usage pattern
    if (triggeredRules.includes('F-R4')) {
      messages.push('Your usage pattern suggests task-completion focus rather than learning.');
      risks.push('Knowledge retention may be affected by concentrated usage');
      suggestions.push('Try spacing out your learning sessions for better retention');
    }

    // F-R5: Complete passivity
    if (triggeredRules.includes('F-R5')) {
      messages.push('You have not verified, modified, or rejected any AI responses.');
      risks.push('Independent thinking ability may decline with passive consumption');
      suggestions.push('Engage more actively by questioning, editing, or critiquing responses');
    }

    // Default fallbacks
    if (messages.length === 0) {
      messages.push('We detected patterns suggesting passive AI usage.');
    }
    if (risks.length === 0) {
      risks.push('Learning effectiveness may be affected');
    }
    if (suggestions.length === 0) {
      suggestions.push('Try to engage more actively with AI responses');
    }

    return {
      message: messages.join(' '),
      risks,
      suggestions,
    };
  };

  /**
   * Create intervention UI based on detection result
   * Defined before useEffects to avoid TDZ (Temporal Dead Zone) errors
   */
  const createInterventionUI = useCallback((detection: any, tier: string, msgs: Message[]) => {
    const triggeredRules = detection.layer1?.triggeredRules || [];
    const ruleContent = generateRuleBasedContent(triggeredRules, detection.layer1);

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
