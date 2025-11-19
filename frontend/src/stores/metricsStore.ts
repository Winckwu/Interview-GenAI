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
        // Calculate metrics with reasonable defaults for ongoing session
        const records = metricsCollector['interventionRecords']?.get(state.currentSessionId) || [];
        const totalDisplays = records.length;

        if (totalDisplays > 0) {
          const dismissals = records.filter((r: any) => r.userAction === 'dismiss').length;
          const engagements = records.filter((r: any) => r.userAction === 'acted').length;
          const compliances = records.filter((r: any) => r.userAction === 'acted').length;
          const overrides = records.filter((r: any) => r.userAction === 'override').length;

          const sessionMetrics: SessionMetrics = {
            sessionId: state.currentSessionId,
            userId: state.currentUserId,
            totalInterventions: totalDisplays,
            complianceRate: compliances / totalDisplays,
            dismissalRate: dismissals / totalDisplays,
            engagementRate: engagements / totalDisplays,
            overrideRate: overrides / totalDisplays,
            avgTimeToAction: records
              .filter((r: any) => r.timeToAction)
              .reduce((sum: number, r: any) => sum + (r.timeToAction || 0), 0) / totalDisplays,
            avgConfidence: records.reduce((sum: number, r: any) => sum + r.confidence, 0) / totalDisplays,
            fatigueScore: 0,
            completionRate: 0,
          };

          console.log('[recordInterventionDisplay] Updated sessionMetrics:', sessionMetrics);
          return { sessionMetrics };
        }
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
      // Calculate real-time sessionMetrics based on recorded interventions
      if (state.currentSessionId && state.currentUserId) {
        const records = metricsCollector['interventionRecords']?.get(state.currentSessionId) || [];
        const totalDisplays = records.length;

        if (totalDisplays > 0) {
          const dismissals = records.filter((r: any) => r.userAction === 'dismiss' || r.userAction === 'skip').length;
          const engagements = records.filter((r: any) => r.userAction === 'acted').length;
          const compliances = records.filter((r: any) => r.userAction === 'acted').length;
          const overrides = records.filter((r: any) => r.userAction === 'override').length;

          const sessionMetrics: SessionMetrics = {
            sessionId: state.currentSessionId,
            userId: state.currentUserId,
            totalInterventions: totalDisplays,
            complianceRate: compliances / totalDisplays,
            dismissalRate: dismissals / totalDisplays,
            engagementRate: engagements / totalDisplays,
            overrideRate: overrides / totalDisplays,
            avgTimeToAction: records
              .filter((r: any) => r.timeToAction)
              .reduce((sum: number, r: any) => sum + (r.timeToAction || 0), 0) / totalDisplays,
            avgConfidence: records.reduce((sum: number, r: any) => sum + r.confidence, 0) / totalDisplays,
            fatigueScore: 0,
            completionRate: 0,
          };

          console.log('[recordUserAction] Updated sessionMetrics:', sessionMetrics);
          return { sessionMetrics };
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
