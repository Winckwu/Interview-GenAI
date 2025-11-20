# Quick Start Guide: Add Pattern F Detection to ChatSessionPage

**Status**: ✅ All components ready. Just need 4 integration steps.

**Time to integrate**: ~15 minutes
**Complexity**: Low (1 component, 1 store, standard React patterns)

---

## 🎯 What You Get

After integration, ChatSessionPage will automatically:
- ✅ Detect Pattern F (ineffective AI use) from messages
- ✅ Show 3-tier interventions (soft/medium/hard)
- ✅ Track user fatigue and suppress when needed
- ✅ Display real-time metrics dashboard
- ✅ Generate alerts on anomalies

---

## 📋 Step 1: Import Components & Stores

In `ChatSessionPage.tsx`:

```typescript
// Add these imports at the top
import InterventionManager from '../components/interventions/InterventionManager';
import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
import { useMetricsStore } from '../stores/metricsStore';
```

---

## ⚙️ Step 2: Initialize Session Metrics

In your component:

```typescript
const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userId] = useState('user-123'); // From your auth context
  const [sessionStartTime] = useState(Date.now());

  // NEW: Initialize metrics store for this session
  const metricsStore = useMetricsStore();

  useEffect(() => {
    if (sessionId && userId) {
      metricsStore.setCurrentSession(sessionId, userId);
    }
  }, [sessionId, userId]);

  // ... rest of your component
};
```

---

## 🎨 Step 3: Add Components to JSX Layout

In your ChatSessionPage render:

```typescript
return (
  <div style={{ display: 'flex', height: '100vh' }}>
    {/* Existing chat area */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Your message list, input, etc. */}
      <VirtualizedMessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>

    {/* NEW: Right sidebar with interventions and monitoring */}
    <div style={{
      width: '350px',
      borderLeft: '1px solid #e5e7eb',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Intervention Manager: Shows Tier 1/2/3 based on detection */}
      <InterventionManager
        sessionId={sessionId}
        messages={messages}
        minMessagesForDetection={5}  // Start checking after 5 messages
        onInterventionDisplayed={(tier, mrType) => {
          console.log(`Intervention shown: ${tier} (${mrType})`);
        }}
        onUserAction={(mrType, action) => {
          console.log(`User action: ${action} on ${mrType}`);
        }}
      />

      {/* Monitoring Dashboard: Shows real-time metrics */}
      <MonitoringDashboard
        sessionId={sessionId}
        refreshIntervalMs={5000}  // Update every 5 seconds
        showAlerts={true}         // Show recent alerts
        compactMode={false}       // Full view (not compact)
      />
    </div>
  </div>
);
```

---

## 🏁 Step 4: Complete Session on Exit

When user leaves the chat:

```typescript
useEffect(() => {
  // Clean up: finalize session metrics when component unmounts
  return () => {
    if (sessionId) {
      const completionTime = Date.now() - sessionStartTime;
      const messageCount = messages.length;
      const completed = true; // or false if user abandoned

      metricsStore.completeSession(
        messageCount,
        completed,
        completionTime
      );

      // Optional: Send metrics to backend
      // await api.post('/metrics', metricsStore.sessionMetrics);
    }
  };
}, [sessionId, sessionStartTime]);
```

---

## ✅ That's it!

You've successfully integrated Pattern F Detection. The system will now:

1. **Auto-detect patterns** from messages (after 5+ messages)
2. **Calculate fatigue** and suppression automatically
3. **Display interventions** (soft/medium/hard) based on confidence
4. **Track metrics** for every action
5. **Update dashboard** in real-time

---

## 🧪 Quick Test

To verify everything works:

```
1. Open ChatSessionPage
2. Send 5+ messages to AI
3. Look for:
   ✅ Soft signal appears (blue sidebar tip)
   ✅ MonitoringDashboard shows metrics
   ✅ Console logs show detection info
   ✅ Click dismiss/learn more button
   ✅ Dashboard updates with user action

Expected output in console:
- "Intervention shown: soft (MR18_OverDependence)"
- "User action: dismiss on MR18_OverDependence"
```

---

## 📊 What You'll See

### On Message #5 (Pattern Detected):
```
┌─────────────────────────────┐
│ 📊 You're accepting most    │
│ responses without           │
│ modification               │
│                             │
│  [Learn More]        [✕]   │
└─────────────────────────────┘

AND

┌─────────────────────────────┐
│ 📊 Session Metrics          │
│ Compliance:  0%  █░         │
│ Dismissal:   0%  ░          │
│ Engagement:  0%  ░          │
│ Detections:  1              │
│ No alerts                   │
└─────────────────────────────┘
```

### After User Dismisses:
```
Dashboard updates to show:
- Dismissal rate: 100%
- Alert triggered (if applicable)
```

---

## 🔧 Configuration Options

### InterventionManager

```typescript
<InterventionManager
  sessionId={sessionId}                    // Required: session ID
  messages={messages}                      // Required: message array
  minMessagesForDetection={5}              // Default: 5 (when to start)
  onInterventionDisplayed={(tier, mrType) => {}}  // Optional callback
  onUserAction={(mrType, action) => {}}   // Optional callback
/>
```

### MonitoringDashboard

```typescript
<MonitoringDashboard
  sessionId={sessionId}                    // Required: session ID (or omit for system-level)
  refreshIntervalMs={5000}                 // Default: 5000ms (1000-30000ms recommended)
  showAlerts={true}                        // Default: true
  compactMode={false}                      // Default: false (show all metrics)
/>
```

---

## 🎛️ Tuning Thresholds

To adjust when alerts trigger:

```typescript
import { useMetricsStore } from '../stores/metricsStore';

const metricsStore = useMetricsStore();

// Make thresholds more strict
metricsStore.setThresholds({
  dismissalRateHigh: 0.5,        // Alert if > 50% (was 70%)
  complianceRateLow: 0.4,        // Alert if < 40% (was 30%)
  detectionLatencyHigh: 150,     // Alert if > 150ms (was 200ms)
});
```

---

## 🚨 Alert Types

The dashboard will show these alerts:

| Alert | Trigger | Example |
|-------|---------|---------|
| 🟠 High Dismissal | > 70% dismissed | "High dismissal rate: 75%" |
| 🟠 Low Compliance | < 30% acted | "Low compliance: 25%" |
| 🟠 High Fatigue | Score > 70 | "High fatigue: 75/100" |
| 🔴 High Latency | Detection > 200ms | "Detection latency high: 250ms" |
| 🟠 Dropout | Session abandoned | "Session dropped after 10 messages" |
| 🟠 Many Dismissals | >= 5 dismissals | "5+ dismissals detected" |

---

## 📱 Dark Mode & Responsive

Everything works in dark mode automatically:
- InterventionManager: ✅ Dark mode
- MonitoringDashboard: ✅ Dark mode
- Tier components: ✅ Dark mode
- Mobile friendly: ✅ Responsive layout

---

## 🐛 Troubleshooting

### Intervention not showing?
- Check: Is `minMessagesForDetection` reached? (default 5)
- Check: Are there enough signals in messages?
- Check: Is fatigue score < 70?
- Check: Check browser console for errors

### Dashboard not updating?
- Check: Is sessionId passed correctly?
- Check: Are metrics being recorded? (check console)
- Check: Are you waiting 5+ seconds for refresh?

### No alerts showing?
- Check: Are metrics exceeding thresholds?
- Check: Turn off `compactMode` if enabled
- Check: Set `showAlerts={true}`

### Performance issues?
- Check: Increase `refreshIntervalMs` (5000 → 30000)
- Check: Enable `compactMode={true}`
- Check: Check if many interventions being recorded

---

## 📚 Documentation

For detailed information, see:

- **COMPLETE_SYSTEM_INTEGRATION.md** - Full technical overview
- **WEEK2_INTEGRATION_GUIDE.md** - UI component details
- **WEEK3_4_MONITORING_GUIDE.md** - Metrics and monitoring
- **PHASE_1_IMPLEMENTATION_GUIDE.md** - Pattern detection logic

---

## 💾 Code Snapshot: Complete Integration Example

```typescript
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InterventionManager from '../components/interventions/InterventionManager';
import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
import { useMetricsStore } from '../stores/metricsStore';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userId] = useState('user-123');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionStartTime] = useState(Date.now());

  const metricsStore = useMetricsStore();

  // Initialize metrics for session
  useEffect(() => {
    if (sessionId && userId) {
      metricsStore.setCurrentSession(sessionId, userId);
    }
  }, [sessionId, userId]);

  // Finalize session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        metricsStore.completeSession(
          messages.length,
          true,
          Date.now() - sessionStartTime
        );
      }
    };
  }, [sessionId]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ padding: '1rem' }}>
              <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type message..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
              // Handle send message
            }
          }}
          style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}
        />
      </div>

      {/* Sidebar with interventions + monitoring */}
      <div
        style={{
          width: '350px',
          borderLeft: '1px solid #e5e7eb',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <InterventionManager
          sessionId={sessionId}
          messages={messages}
          minMessagesForDetection={5}
        />

        <MonitoringDashboard
          sessionId={sessionId}
          refreshIntervalMs={5000}
          showAlerts={true}
        />
      </div>
    </div>
  );
};

export default ChatSessionPage;
```

---

## 🎉 Next Steps

1. ✅ Add the 4 integration steps above
2. 📊 Test with 5+ messages
3. 👥 Get feedback from 3-5 beta users
4. 🎛️ Tune thresholds based on data
5. 📈 Scale to larger pilot (20-30 users)

---

## 🚀 You're Ready!

All components are production-ready. Just follow the 4 steps above and you're done!

Questions? See full documentation in `COMPLETE_SYSTEM_INTEGRATION.md`
