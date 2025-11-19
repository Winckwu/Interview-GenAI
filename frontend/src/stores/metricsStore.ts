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
    set((state) => ({
      ...state, // Trigger re-render
    }));
  },

  recordUserAction: (
    sessionId: string,
    interventionId: string,
    action: 'dismiss' | 'skip' | 'acted' | 'override',
    timeToAction: number
  ) => {
    metricsCollector.recordUserAction(sessionId, interventionId, action, timeToAction);
    set((state) => ({
      ...state,
    }));
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
