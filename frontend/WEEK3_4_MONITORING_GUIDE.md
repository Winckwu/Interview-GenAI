# Week 3-4 Monitoring Guide: Real-time Metrics & Alerting System

## Overview

Completed implementation of **monitoring and metrics collection system** to track intervention effectiveness, user compliance, and system health.

### What's Included

```
frontend/src/
├── utils/
│   └── MetricsCollector.ts (400+ lines)
│       ├── InterventionRecord: Track each intervention display
│       ├── SessionMetrics: Per-session aggregated stats
│       ├── SystemMetrics: System-wide aggregated stats
│       ├── SystemAlert: Alert generation and tracking
│       └── MetricsCollector class: Main API
│
├── stores/
│   └── metricsStore.ts (100+ lines)
│       └── Zustand store for metrics state management
│
└── components/monitoring/
    ├── MonitoringDashboard.tsx (350+ lines)
    │   ├── KPI Cards (compliance, dismissal, engagement, override, fatigue)
    │   ├── Tier effectiveness breakdown
    │   ├── Pattern frequency analysis
    │   ├── Alert management (acknowledge, expand)
    │   └── Real-time auto-refresh
    │
    └── MonitoringDashboard.css (450+ lines)
        ├── Dark mode support
        ├── Responsive grid layout
        ├── Alert severity colors
        ├── Progress bar animations
        └── Accessibility support
```

## Key Metrics Tracked

### Detection Metrics
- **Total Detections**: How many patterns detected
- **Average Confidence**: Average detection confidence (0-1)
- **Pattern Type Breakdown**: Which patterns most common

### Intervention Metrics
- **Total Displays**: How many interventions shown
- **Tier Breakdown**: Distribution across Tier 1/2/3
- **Time to Action**: How long until user acts on intervention

### Compliance Metrics
- **Compliance Rate**: % of users who acted after intervention
- **Dismissal Rate**: % of users who dismissed
- **Engagement Rate**: % who clicked "learn more"
- **Override Rate**: % who used "proceed anyway" (valuable data!)

### Fatigue Metrics
- **Fatigue Score**: 0-100 scale (average and max)
- **Suppression Events**: How many times fatigue suppression triggered
- **Time Under Fatigue**: Total time user was fatigued

### Performance Metrics
- **Detection Latency**: P50/P95/P99 milliseconds
- **UI Render Time**: Time from intervention to display

### Outcome Metrics
- **Session Completion Rate**: % of sessions completed
- **Dropout Rate**: % that abandoned before completion
- **False Positive Rate**: % overrides (user disagreed with detection)

## Alert System

### Alert Types

```typescript
type AlertType =
  | 'high_dismissal'      // Dismissal rate > 70%
  | 'low_compliance'      // Compliance rate < 30%
  | 'high_fatigue'        // Fatigue score > 70
  | 'high_latency'        // Detection latency > 200ms
  | 'session_dropout'     // User abandoned session
  | 'high_dismissal_count' // >= 5 dismissals in session
```

### Alert Severities

- **🔵 Info**: Informational, no action needed
- **🟠 Warning**: Investigate but not urgent
- **🔴 Critical**: Requires immediate attention

### Configurable Thresholds

```typescript
interface AlertThresholds {
  dismissalRateHigh: number;          // Default: 0.7
  dismissalCountWarning: number;      // Default: 5
  complianceRateLow: number;          // Default: 0.3
  fatigueScoreHigh: number;           // Default: 70
  suppressionEventWarning: number;    // Default: 3
  detectionLatencyHigh: number;       // Default: 200ms
  dropoutRateHigh: number;            // Default: 0.2
}
```

---

## Integration into ChatSessionPage

### Step 1: Import Components

```typescript
import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
import { useMetricsStore } from '../stores/metricsStore';
import { metricsCollector } from '../utils/MetricsCollector';
```

### Step 2: Initialize Session Metrics

In `ChatSessionPage.tsx`:

```typescript
const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const metricsStore = useMetricsStore();
  const [sessionStartTime] = useState(Date.now());

  // Initialize metrics for this session
  useEffect(() => {
    if (sessionId && userId) {
      metricsStore.setCurrentSession(sessionId, userId);
    }
  }, [sessionId, userId]);

  // ... rest of component
};
```

### Step 3: Record Intervention Displays

When InterventionManager displays an intervention:

```typescript
// In InterventionManager.tsx or wherever intervention is shown
const recordInterventionMetrics = (
  detection: PatternFDetectionResult,
  tier: 'soft' | 'medium' | 'hard'
) => {
  const displayTimestamp = Date.now();
  const interventionId = `${sessionId}-${displayTimestamp}`;

  metricsStore.recordInterventionDisplay({
    id: interventionId,  // removed from params, auto-generated
    sessionId,
    timestamp: displayTimestamp,
    mrType: 'MR18_OverDependence', // example
    patternType: 'Pattern F',
    confidence: detection.confidence,
    triggeredRules: detection.triggeredRules,
    tier,
    fatigueScore: currentFatigueScore,
    suppressionActive: isSuppressionActive,
    messageCountAtDisplay: messages.length,
  });

  // Return interventionId for later action tracking
  return interventionId;
};
```

### Step 4: Record User Actions

When user takes action on intervention:

```typescript
const handleInterventionAction = (
  interventionId: string,
  action: 'dismiss' | 'skip' | 'acted' | 'override'
) => {
  const timeToAction = Date.now() - interventionDisplayTime;

  metricsStore.recordUserAction(
    sessionId,
    interventionId,
    action,
    timeToAction
  );

  // Track in store for reporting
  if (action === 'acted') {
    metricsStore.refreshMetrics();
  }
};
```

### Step 5: Record Detection Latency

When calling PatternDetector:

```typescript
const detectPatterns = async () => {
  const startTime = performance.now();

  const signals = extractUserSignals(messages);
  const detection = detectPatternF(signals, messages);

  const latency = performance.now() - startTime;
  metricsStore.recordDetectionLatency(latency);

  return detection;
};
```

### Step 6: Add Monitoring Dashboard to UI

In ChatSessionPage layout:

```typescript
return (
  <div className="chat-session-page">
    {/* Main chat area */}
    <div className="chat-main">
      {/* Your existing chat UI */}
      <VirtualizedMessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>

    {/* Right sidebar with monitoring */}
    <div className="chat-sidebar">
      {/* Existing sidebar content */}
      <InterventionManager
        sessionId={sessionId}
        messages={messages}
        onInterventionDisplayed={handleInterventionDisplayed}
        onUserAction={handleInterventionAction}
      />

      {/* NEW: Add monitoring dashboard */}
      <MonitoringDashboard
        sessionId={sessionId}
        refreshIntervalMs={5000}  // Refresh every 5 seconds
        showAlerts={true}
        compactMode={false}
      />
    </div>
  </div>
);
```

### Step 7: Complete Session on Exit

When user leaves or session ends:

```typescript
useEffect(() => {
  return () => {
    // When component unmounts, finalize session metrics
    if (sessionId) {
      const completionTime = Date.now() - sessionStartTime;
      const messageCount = messages.length;
      const completed = true; // or false if user abandoned

      metricsStore.completeSession(messageCount, completed, completionTime);

      // Optionally send metrics to backend
      sendMetricsToBackend(metricsStore.sessionMetrics);
    }
  };
}, [sessionId, sessionStartTime]);
```

---

## Integration Code Example

Complete example for ChatSessionPage:

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
import { useMetricsStore } from '../stores/metricsStore';
import InterventionManager from '../components/interventions/InterventionManager';

const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userId] = useState('user-123'); // from auth
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionStartTime] = useState(Date.now());

  const metricsStore = useMetricsStore();

  // Initialize session metrics
  useEffect(() => {
    if (sessionId && userId) {
      metricsStore.setCurrentSession(sessionId, userId);
    }
  }, [sessionId, userId]);

  // Complete session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        const completionTime = Date.now() - sessionStartTime;
        metricsStore.completeSession(
          messages.length,
          true,  // completed
          completionTime
        );
      }
    };
  }, [sessionId, sessionStartTime]);

  const handleInterventionDisplayed = useCallback(
    (tier: string, mrType: string) => {
      console.log(`Intervention displayed: ${tier} (${mrType})`);
      metricsStore.refreshMetrics();
    },
    [metricsStore]
  );

  const handleUserAction = useCallback(
    (mrType: string, action: string) => {
      console.log(`User action on ${mrType}: ${action}`);
      metricsStore.refreshMetrics();
    },
    [metricsStore]
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Your existing chat UI */}
        {/* Messages, input, etc. */}
      </div>

      {/* Right sidebar */}
      <div style={{ width: '350px', borderLeft: '1px solid #e5e7eb', overflow: 'auto' }}>
        {/* Intervention Manager */}
        <InterventionManager
          sessionId={sessionId}
          messages={messages}
          onInterventionDisplayed={handleInterventionDisplayed}
          onUserAction={handleUserAction}
        />

        {/* Monitoring Dashboard */}
        <MonitoringDashboard
          sessionId={sessionId}
          refreshIntervalMs={5000}
          showAlerts={true}
          compactMode={false}
        />
      </div>
    </div>
  );
};

export default ChatSessionPage;
```

---

## Usage Examples

### Access System Metrics Anywhere

```typescript
import { useMetricsStore } from '../stores/metricsStore';

function MyComponent() {
  const { systemMetrics, refreshMetrics } = useMetricsStore();

  return (
    <div>
      <p>Total interventions: {systemMetrics?.totalInterventions}</p>
      <p>Completion rate: {((systemMetrics?.completionRate || 0) * 100).toFixed(1)}%</p>
      <button onClick={refreshMetrics}>Refresh</button>
    </div>
  );
}
```

### Configure Alert Thresholds

```typescript
import { useMetricsStore } from '../stores/metricsStore';

const metricsStore = useMetricsStore();

// Adjust thresholds
metricsStore.setThresholds({
  dismissalRateHigh: 0.6,        // More strict
  complianceRateLow: 0.4,        // More lenient
  detectionLatencyHigh: 150,     // Tighter performance requirement
});
```

### Handle Alerts Programmatically

```typescript
import { useMetricsStore } from '../stores/metricsStore';

function AlertManager() {
  const { alerts, acknowledgeAlert } = useMetricsStore();

  // Find critical alerts
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');

  return (
    <div>
      {criticalAlerts.map((alert) => (
        <div key={alert.id}>
          <p>{alert.message}</p>
          <button onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</button>
        </div>
      ))}
    </div>
  );
}
```

### Export Metrics to Backend

```typescript
import { metricsCollector } from '../utils/MetricsCollector';

async function saveMetrics() {
  const data = metricsCollector.exportMetrics();

  const response = await fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
}
```

---

## Testing Checklist

### Metrics Recording
- [ ] Intervention display recorded with correct confidence and tier
- [ ] User actions (dismiss/skip/acted/override) recorded correctly
- [ ] Time to action calculated accurately
- [ ] Detection latency recorded and triggering alerts

### Dashboard Display
- [ ] KPI cards show correct percentages
- [ ] Progress bars animate smoothly
- [ ] Metrics update in real-time (every 5 seconds)
- [ ] Dark mode works correctly
- [ ] Responsive layout on mobile

### Alert System
- [ ] High dismissal alerts trigger at 70%+
- [ ] Low compliance alerts trigger at <30%
- [ ] High fatigue alerts trigger at 70+
- [ ] High latency alerts trigger at >200ms
- [ ] Critical alerts show in red (🔴)
- [ ] Can acknowledge alerts

### Session Completion
- [ ] Session metrics finalized when page exits
- [ ] Final compliance rate calculated correctly
- [ ] Session metrics stored in Zustand store
- [ ] Can export metrics to backend

### Integration with Existing Components
- [ ] MonitoringDashboard renders in ChatSessionPage sidebar
- [ ] InterventionManager still works alongside dashboard
- [ ] No performance degradation from metrics tracking
- [ ] Metrics don't interfere with core chat functionality

---

## Performance Considerations

### Metrics Collector

- **Memory**: Stores last 100 intervention records per session (minimal)
- **CPU**: Detection latency collection uses `performance.now()` (negligible)
- **Storage**: System metrics object ~2KB, per-session metrics ~5KB

### Dashboard Component

- **Rendering**: Re-renders every 5 seconds (configurable)
- **DOM**: ~30 elements per dashboard instance
- **CSS**: Smooth animations with GPU acceleration
- **Memory**: ~100KB per instance

### Recommendations

1. **Set refresh interval** based on update frequency needs
   - Real-time monitoring: 1000ms (1 second)
   - Standard: 5000ms (5 seconds)
   - Low-frequency: 30000ms (30 seconds)

2. **Use `compactMode`** when space constrained
   - Shows only key metrics
   - Hides detailed breakdowns
   - Reduces re-renders

3. **Aggregate old metrics** periodically
   - Clear alerts older than 1 hour
   - Archive session metrics to backend
   - Keep only last 1000 alerts in memory

---

## Next Steps

### Week 3-4 Remaining Tasks

1. ✅ Create MetricsCollector (done)
2. ✅ Create MonitoringDashboard component (done)
3. ✅ Create metricsStore (done)
4. **TODO**: Integrate into ChatSessionPage
5. **TODO**: Test with real users
6. **TODO**: Tune thresholds based on data

### Week 5 Planning

1. **Backend Integration**
   - Store metrics in database
   - Create metrics API endpoint
   - Archive old sessions

2. **Advanced Analytics**
   - Correlation analysis (fatigue vs dropout)
   - Tier effectiveness comparison
   - Pattern evolution tracking

3. **UX Improvements**
   - Custom alert rules
   - Metric export (CSV, JSON)
   - Comparison across cohorts

---

## References

- **MetricsCollector.ts**: Core metrics collection logic
- **MonitoringDashboard.tsx**: React component for visualization
- **metricsStore.ts**: Zustand store integration
- **WEEK2_INTEGRATION_GUIDE.md**: InterventionManager integration
- **PHASE_1_IMPLEMENTATION_GUIDE.md**: Pattern detection logic

---

## Troubleshooting

### Metrics Not Updating

Check:
1. Is `setCurrentSession()` called with sessionId and userId?
2. Are metrics being recorded (check console logs)?
3. Is `refreshIntervalMs` reasonable (not too fast)?
4. Are you viewing correct sessionId in dashboard?

### Alerts Not Triggering

Check:
1. Are thresholds configured (default values very lenient)?
2. Are metrics being recorded before checking thresholds?
3. Check alert severity and type in MonitoringDashboard

### Dashboard Rendering Incorrectly

Check:
1. Is data structure correct (no undefined fields)?
2. Are percentages in range 0-1 (not 0-100)?
3. Check browser console for errors
4. Dark mode properly applied (check system preference)?

### Performance Issues

Solutions:
1. Increase `refreshIntervalMs` (5000 → 30000)
2. Enable `compactMode={true}`
3. Reduce history retention (fewer alerts)
4. Archive metrics periodically

---

## Success Criteria

✅ All criteria met when:
1. Metrics collecting from InterventionManager
2. MonitoringDashboard showing real-time KPIs
3. Alerts triggering and displaying correctly
4. Integration with ChatSessionPage complete
5. No performance degradation
6. Dark mode and accessibility working
7. Ready for beta testing with real users
