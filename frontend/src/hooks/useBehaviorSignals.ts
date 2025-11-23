/**
 * useBehaviorSignals Hook
 *
 * Tracks OBSERVABLE user behaviors as proxy measures for metacognitive engagement.
 *
 * ⚠️ IMPORTANT: Measurement Philosophy
 * =====================================
 * These are PROXY MEASURES - we observe behaviors that CORRELATE with verification,
 * not verification itself. We cannot detect:
 * - Mental review without observable action
 * - External verification in other applications
 * - Phone calls to experts
 *
 * What we CAN observe (browser-detectable behaviors):
 *
 * | Signal                | What It Measures                          | Proxy For                    |
 * |-----------------------|-------------------------------------------|------------------------------|
 * | dwellTime             | Time spent viewing AI response            | Reading/thinking time        |
 * | copyEvents            | User copies AI text                       | May verify externally        |
 * | selectionEvents       | User selects/highlights text              | Focused attention            |
 * | tabSwitchCount        | User switches browser tabs                | External research activity   |
 * | tabAwayDuration       | Time spent in other tabs                  | External verification time   |
 * | scrollDepth           | How far user scrolled in response         | Content review thoroughness  |
 * | hoverDuration         | Time hovering over response               | Careful reading              |
 * | followUpQuestions     | User asks clarifying questions            | Critical engagement          |
 * | modificationAttempts  | User edits AI response                    | Active refinement            |
 *
 * Confidence Levels:
 * - HIGH: Direct in-system actions (copy, select, modify, follow-up)
 * - MEDIUM: Timing signals (dwell time, hover duration)
 * - LOW: Tab switches (we see switch, not what they did)
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface BehaviorSignalData {
  messageId: string;

  // Timing signals (MEDIUM confidence)
  dwellTimeMs: number;              // Time from response shown to next user action
  hoverDurationMs: number;          // Cumulative hover time on AI response

  // Interaction signals (HIGH confidence)
  copyCount: number;                // Number of copy events
  selectionCount: number;           // Number of text selection events
  copiedTextLength: number;         // Total characters copied
  selectedTextLength: number;       // Total characters selected

  // Tab visibility signals (LOW confidence - we see switch, not activity)
  tabSwitchCount: number;           // Times user left this tab
  tabAwayDurationMs: number;        // Total time spent away from tab

  // Scroll signals (MEDIUM confidence)
  maxScrollDepth: number;           // 0-100%, how far user scrolled
  scrollEventCount: number;         // Number of scroll actions

  // Semantic signals (HIGH confidence)
  hasFollowUpQuestion: boolean;     // Did user ask follow-up
  followUpQuestionCount: number;    // Number of follow-up questions

  // Modification signals (HIGHEST confidence - direct action)
  wasModified: boolean;             // User edited the response
  wasExplicitlyVerified: boolean;   // User clicked verify button

  // Derived scores
  engagementScore: number;          // 0-100 composite score
  verificationLikelihood: number;   // 0-100 estimated likelihood of verification
}

export interface UseBehaviorSignalsOptions {
  onSignalUpdate?: (signal: BehaviorSignalData) => void;
  enableTabTracking?: boolean;
  enableScrollTracking?: boolean;
}

export interface UseBehaviorSignalsReturn {
  // Current tracking state
  currentMessageId: string | null;
  signals: Map<string, BehaviorSignalData>;

  // Control methods
  startTracking: (messageId: string) => void;
  stopTracking: () => BehaviorSignalData | null;

  // Event handlers (attach to message components)
  handleCopy: (e: ClipboardEvent) => void;
  handleSelection: () => void;
  handleScroll: (scrollPercent: number) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;

  // Manual markers
  markFollowUp: () => void;
  markModified: () => void;
  markVerified: () => void;

  // Analysis
  getSignalsForMessage: (messageId: string) => BehaviorSignalData | null;
  calculateVerificationLikelihood: (messageId: string) => number;
}

// ============================================================
// DEFAULT VALUES
// ============================================================

const createEmptySignals = (messageId: string): BehaviorSignalData => ({
  messageId,
  dwellTimeMs: 0,
  hoverDurationMs: 0,
  copyCount: 0,
  selectionCount: 0,
  copiedTextLength: 0,
  selectedTextLength: 0,
  tabSwitchCount: 0,
  tabAwayDurationMs: 0,
  maxScrollDepth: 0,
  scrollEventCount: 0,
  hasFollowUpQuestion: false,
  followUpQuestionCount: 0,
  wasModified: false,
  wasExplicitlyVerified: false,
  engagementScore: 0,
  verificationLikelihood: 0,
});

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

export function useBehaviorSignals(
  options: UseBehaviorSignalsOptions = {}
): UseBehaviorSignalsReturn {
  const {
    onSignalUpdate,
    enableTabTracking = true,
    enableScrollTracking = true,
  } = options;

  // State
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [signals, setSignals] = useState<Map<string, BehaviorSignalData>>(new Map());

  // Refs for timing
  const trackingStartTime = useRef<number>(0);
  const hoverStartTime = useRef<number>(0);
  const tabHiddenTime = useRef<number>(0);
  const isHovering = useRef<boolean>(false);

  // ============================================================
  // TAB VISIBILITY TRACKING
  // ============================================================

  useEffect(() => {
    if (!enableTabTracking || !currentMessageId) return;

    const handleVisibilityChange = () => {
      if (!currentMessageId) return;

      setSignals(prev => {
        const newMap = new Map(prev);
        const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);

        if (document.hidden) {
          // User switched away
          tabHiddenTime.current = Date.now();
          newMap.set(currentMessageId, {
            ...data,
            tabSwitchCount: data.tabSwitchCount + 1,
          });
        } else {
          // User returned
          if (tabHiddenTime.current > 0) {
            const awayDuration = Date.now() - tabHiddenTime.current;
            newMap.set(currentMessageId, {
              ...data,
              tabAwayDurationMs: data.tabAwayDurationMs + awayDuration,
            });
            tabHiddenTime.current = 0;
          }
        }

        return newMap;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableTabTracking, currentMessageId]);

  // ============================================================
  // CONTROL METHODS
  // ============================================================

  const startTracking = useCallback((messageId: string) => {
    setCurrentMessageId(messageId);
    trackingStartTime.current = Date.now();

    setSignals(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(messageId)) {
        newMap.set(messageId, createEmptySignals(messageId));
      }
      return newMap;
    });
  }, []);

  const stopTracking = useCallback((): BehaviorSignalData | null => {
    if (!currentMessageId) return null;

    const dwellTime = Date.now() - trackingStartTime.current;

    let finalData: BehaviorSignalData | null = null;

    setSignals(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(currentMessageId);

      if (data) {
        finalData = {
          ...data,
          dwellTimeMs: dwellTime,
          engagementScore: calculateEngagementScore(data, dwellTime),
          verificationLikelihood: calculateVerificationLikelihoodInternal(data, dwellTime),
        };
        newMap.set(currentMessageId, finalData);

        if (onSignalUpdate) {
          onSignalUpdate(finalData);
        }
      }

      return newMap;
    });

    setCurrentMessageId(null);
    return finalData;
  }, [currentMessageId, onSignalUpdate]);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (!currentMessageId) return;

    const selection = window.getSelection();
    const copiedText = selection?.toString() || '';

    setSignals(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);
      newMap.set(currentMessageId, {
        ...data,
        copyCount: data.copyCount + 1,
        copiedTextLength: data.copiedTextLength + copiedText.length,
      });
      return newMap;
    });
  }, [currentMessageId]);

  const handleSelection = useCallback(() => {
    if (!currentMessageId) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';

    if (selectedText.length > 0) {
      setSignals(prev => {
        const newMap = new Map(prev);
        const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);
        newMap.set(currentMessageId, {
          ...data,
          selectionCount: data.selectionCount + 1,
          selectedTextLength: data.selectedTextLength + selectedText.length,
        });
        return newMap;
      });
    }
  }, [currentMessageId]);

  const handleScroll = useCallback((scrollPercent: number) => {
    if (!currentMessageId || !enableScrollTracking) return;

    setSignals(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);
      newMap.set(currentMessageId, {
        ...data,
        maxScrollDepth: Math.max(data.maxScrollDepth, scrollPercent),
        scrollEventCount: data.scrollEventCount + 1,
      });
      return newMap;
    });
  }, [currentMessageId, enableScrollTracking]);

  const handleMouseEnter = useCallback(() => {
    if (!currentMessageId) return;
    hoverStartTime.current = Date.now();
    isHovering.current = true;
  }, [currentMessageId]);

  const handleMouseLeave = useCallback(() => {
    if (!currentMessageId || !isHovering.current) return;

    const hoverDuration = Date.now() - hoverStartTime.current;
    isHovering.current = false;

    setSignals(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);
      newMap.set(currentMessageId, {
        ...data,
        hoverDurationMs: data.hoverDurationMs + hoverDuration,
      });
      return newMap;
    });
  }, [currentMessageId]);

  // ============================================================
  // MANUAL MARKERS
  // ============================================================

  const markFollowUp = useCallback(() => {
    if (!currentMessageId) return;

    setSignals(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);
      newMap.set(currentMessageId, {
        ...data,
        hasFollowUpQuestion: true,
        followUpQuestionCount: data.followUpQuestionCount + 1,
      });
      return newMap;
    });
  }, [currentMessageId]);

  const markModified = useCallback(() => {
    if (!currentMessageId) return;

    setSignals(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);
      newMap.set(currentMessageId, {
        ...data,
        wasModified: true,
      });
      return newMap;
    });
  }, [currentMessageId]);

  const markVerified = useCallback(() => {
    if (!currentMessageId) return;

    setSignals(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(currentMessageId) || createEmptySignals(currentMessageId);
      newMap.set(currentMessageId, {
        ...data,
        wasExplicitlyVerified: true,
      });
      return newMap;
    });
  }, [currentMessageId]);

  // ============================================================
  // ANALYSIS METHODS
  // ============================================================

  const getSignalsForMessage = useCallback((messageId: string): BehaviorSignalData | null => {
    return signals.get(messageId) || null;
  }, [signals]);

  const calculateVerificationLikelihood = useCallback((messageId: string): number => {
    const data = signals.get(messageId);
    if (!data) return 0;
    return calculateVerificationLikelihoodInternal(data, data.dwellTimeMs);
  }, [signals]);

  return {
    currentMessageId,
    signals,
    startTracking,
    stopTracking,
    handleCopy,
    handleSelection,
    handleScroll,
    handleMouseEnter,
    handleMouseLeave,
    markFollowUp,
    markModified,
    markVerified,
    getSignalsForMessage,
    calculateVerificationLikelihood,
  };
}

// ============================================================
// SCORING ALGORITHMS
// ============================================================

/**
 * Calculate engagement score (0-100)
 *
 * Weighted combination of observable behaviors:
 * - Dwell time: 20% (MEDIUM confidence)
 * - Copy/selection: 25% (HIGH confidence)
 * - Tab switches: 15% (LOW confidence)
 * - Scroll depth: 15% (MEDIUM confidence)
 * - Follow-up: 25% (HIGH confidence)
 */
function calculateEngagementScore(data: BehaviorSignalData, dwellTimeMs: number): number {
  let score = 0;

  // Dwell time (20 points max)
  // < 5s = 0, 5-15s = 5, 15-30s = 10, 30-60s = 15, >60s = 20
  if (dwellTimeMs > 60000) score += 20;
  else if (dwellTimeMs > 30000) score += 15;
  else if (dwellTimeMs > 15000) score += 10;
  else if (dwellTimeMs > 5000) score += 5;

  // Copy/selection (25 points max)
  if (data.copyCount > 0) score += 15;
  if (data.selectionCount > 2) score += 10;
  else if (data.selectionCount > 0) score += 5;

  // Tab switches (15 points max) - indicates external activity
  if (data.tabSwitchCount > 0 && data.tabAwayDurationMs > 10000) score += 15;
  else if (data.tabSwitchCount > 0) score += 8;

  // Scroll depth (15 points max)
  score += Math.min(data.maxScrollDepth / 100 * 15, 15);

  // Follow-up questions (25 points max)
  if (data.hasFollowUpQuestion) score += 25;

  return Math.min(score, 100);
}

/**
 * Calculate verification likelihood (0-100)
 *
 * This is an ESTIMATE based on observable behaviors.
 *
 * HIGH confidence indicators:
 * - User copied text (likely to paste elsewhere for verification)
 * - User asked follow-up questions (critical engagement)
 * - User explicitly clicked verify button
 * - User modified the response
 *
 * MEDIUM confidence indicators:
 * - User spent significant time (dwell time > 30s)
 * - User scrolled through entire response
 * - User selected text multiple times
 *
 * LOW confidence indicators:
 * - User switched tabs (might be verifying, might be distracted)
 */
function calculateVerificationLikelihoodInternal(
  data: BehaviorSignalData,
  dwellTimeMs: number
): number {
  // Explicit verification = 100%
  if (data.wasExplicitlyVerified) return 100;

  let likelihood = 0;

  // HIGH confidence signals (up to 60 points)
  if (data.copyCount > 0) {
    // Copying suggests external verification intent
    likelihood += Math.min(data.copyCount * 15, 30);
  }
  if (data.hasFollowUpQuestion) {
    // Follow-up questions indicate critical engagement
    likelihood += 20;
  }
  if (data.wasModified) {
    // Modification indicates careful review
    likelihood += 10;
  }

  // MEDIUM confidence signals (up to 30 points)
  if (dwellTimeMs > 30000) {
    // Extended reading time suggests careful review
    likelihood += Math.min((dwellTimeMs - 30000) / 60000 * 15, 15);
  }
  if (data.maxScrollDepth > 80) {
    // Read entire response
    likelihood += 10;
  }
  if (data.selectionCount > 2) {
    // Multiple selections suggest careful reading
    likelihood += 5;
  }

  // LOW confidence signals (up to 10 points)
  if (data.tabSwitchCount > 0 && data.tabAwayDurationMs > 15000) {
    // Tab switch with significant away time might indicate external verification
    // But we can't be sure - could be distraction
    likelihood += 10;
  }

  return Math.min(likelihood, 100);
}

export default useBehaviorSignals;
