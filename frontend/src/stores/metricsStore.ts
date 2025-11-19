/**
 * Metrics Store: Zustand store for metrics state management
 *
 * Integrates MetricsCollector with React components
 * Provides methods to record metrics and access them in real-time
 */

import { create } from 'zustand';
import {
  metricsCollector,
  InterventionRecord,
  SessionMetrics,
  SystemMetrics,
  SystemAlert,
  AlertThresholds,
} from '../utils/MetricsCollector';

interface MetricsStoreState {
  // Current session
  currentSessionId: string | null;
  currentUserId: string | null;

  // Metrics access
  systemMetrics: SystemMetrics | null;
  sessionMetrics: SessionMetrics | null;
  alerts: SystemAlert[];

  // Methods
  setCurrentSession(sessionId: string, userId: string): void;
  recordInterventionDisplay(record: Omit<InterventionRecord, 'id'>): void;
  recordUserAction(
    sessionId: string,
    interventionId: string,
    action: 'dismiss' | 'skip' | 'acted' | 'override',
    timeToAction: number
  ): void;
  recordDetectionLatency(latencyMs: number): void;
  completeSession(messageCount: number, completed: boolean, completionTime: number): void;
  refreshMetrics(): void;
  setThresholds(thresholds: Partial<AlertThresholds>): void;
  acknowledgeAlert(alertId: string): void;
  getAlerts(limit?: number): SystemAlert[];
}

export const useMetricsStore = create<MetricsStoreState>((set) => ({
  currentSessionId: null,
  currentUserId: null,
  systemMetrics: null,
  sessionMetrics: null,
  alerts: [],

  setCurrentSession: (sessionId: string, userId: string) => {
    set({
      currentSessionId: sessionId,
      currentUserId: userId,
    });
  },

  recordInterventionDisplay: (record: Omit<InterventionRecord, 'id'>) => {
    metricsCollector.recordInterventionDisplay(record);
    set((state) => {
      // Calculate real-time sessionMetrics based on recorded interventions
      if (state.currentSessionId && state.currentUserId) {
        // Get stored session metrics or calculate from collector
        const existingMetrics = metricsCollector.getSessionMetrics(state.currentSessionId);

        if (existingMetrics) {
          console.log('[recordInterventionDisplay] Using existing metrics:', existingMetrics);
          return { sessionMetrics: existingMetrics };
        }

        // Fallback: create minimal metrics for real-time display
        const sessionMetrics: SessionMetrics = {
          sessionId: state.currentSessionId,
          userId: state.currentUserId,
          startTime: Date.now(),
          totalDetections: 1,
          averageConfidence: record.confidence,
          patternTypeBreakdown: { [record.mrType]: 1 },
          totalDisplays: 1,
          tierBreakdown: { [record.tier]: 1 },
          dismissalCount: 0,
          dismissalRate: 0,
          engagementCount: 0,
          engagementRate: 0,
          complianceCount: 0,
          complianceRate: 0,
          overrideCount: 0,
          overrideRate: 0,
          avgTimeToAction: 0,
          avgDetectionLatency: 0,
          suppressionEvents: 0,
          avgFatigueScore: 0,
          maxFatigueScore: 0,
          timeUnderFatigue: 0,
          sessionCompleted: false,
          droppedOut: false,
          completionTime: 0,
          messageCount: record.messageCountAtDisplay || 0,
        };

        console.log('[recordInterventionDisplay] Created new sessionMetrics:', sessionMetrics);
        return { sessionMetrics };
      }
      return state;
    });
  },

  recordUserAction: (
    sessionId: string,
    interventionId: string,
    action: 'dismiss' | 'skip' | 'acted' | 'override',
    timeToAction: number
  ) => {
    metricsCollector.recordUserAction(sessionId, interventionId, action, timeToAction);
    set((state) => {
      // Get updated metrics from collector after recording action
      if (state.currentSessionId && state.currentUserId) {
        const existingMetrics = metricsCollector.getSessionMetrics(state.currentSessionId);

        if (existingMetrics) {
          console.log('[recordUserAction] Updated sessionMetrics from collector:', existingMetrics);
          return { sessionMetrics: existingMetrics };
        }

        // Update current metrics if they exist
        if (state.sessionMetrics) {
          const updatedMetrics = { ...state.sessionMetrics };
          const totalDisplays = updatedMetrics.totalDisplays || 1;

          // Update counts based on action
          if (action === 'dismiss' || action === 'skip') {
            updatedMetrics.dismissalCount = (updatedMetrics.dismissalCount || 0) + 1;
          } else if (action === 'acted') {
            updatedMetrics.engagementCount = (updatedMetrics.engagementCount || 0) + 1;
            updatedMetrics.complianceCount = (updatedMetrics.complianceCount || 0) + 1;
          } else if (action === 'override') {
            updatedMetrics.overrideCount = (updatedMetrics.overrideCount || 0) + 1;
          }

          // Recalculate rates
          updatedMetrics.dismissalRate = updatedMetrics.dismissalCount / totalDisplays;
          updatedMetrics.engagementRate = updatedMetrics.engagementCount / totalDisplays;
          updatedMetrics.complianceRate = updatedMetrics.complianceCount / totalDisplays;
          updatedMetrics.overrideRate = updatedMetrics.overrideCount / totalDisplays;
          updatedMetrics.avgTimeToAction = timeToAction;

          console.log('[recordUserAction] Updated sessionMetrics:', updatedMetrics);
          return { sessionMetrics: updatedMetrics };
        }
      }
      return state;
    });
  },

  recordDetectionLatency: (latencyMs: number) => {
    metricsCollector.recordDetectionLatency(latencyMs);
    set((state) => ({
      ...state,
    }));
  },

  completeSession: (messageCount: number, completed: boolean, completionTime: number) => {
    set((state) => {
      if (state.currentSessionId && state.currentUserId) {
        const metrics = metricsCollector.calculateSessionMetrics(
          state.currentSessionId,
          state.currentUserId,
          messageCount,
          completed,
          completionTime
        );

        return {
          sessionMetrics: metrics,
          currentSessionId: null,
          currentUserId: null,
        };
      }
      return state;
    });
  },

  refreshMetrics: () => {
    set((state) => ({
      systemMetrics: metricsCollector.getSystemMetrics(),
      sessionMetrics: state.currentSessionId
        ? metricsCollector.getSessionMetrics(state.currentSessionId) || null
        : null,
      alerts: metricsCollector.getAlerts(10),
    }));
  },

  setThresholds: (thresholds: Partial<AlertThresholds>) => {
    metricsCollector.setThresholds(thresholds);
  },

  acknowledgeAlert: (alertId: string) => {
    metricsCollector.acknowledgeAlert(alertId);
    set((state) => ({
      alerts: [...metricsCollector.getAlerts(10)],
    }));
  },

  getAlerts: (limit: number = 10) => {
    return metricsCollector.getAlerts(limit);
  },
}));
