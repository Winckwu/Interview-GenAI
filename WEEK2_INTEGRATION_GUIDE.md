# Week 2 Integration Guide: UI Components & ChatSessionPage Integration
## How to connect Pattern Detection to Your Existing UI

---

## Overview

This guide shows exactly how to integrate the three tier components and InterventionManager into your existing ChatSessionPage, with visual diagrams and code examples.

---

## File Structure

Your new intervention UI system:

```
frontend/src/
├── components/
│   └── interventions/
│       ├── InterventionManager.tsx          (Orchestrator)
│       ├── Tier1SoftSignal.tsx              (Non-blocking tips)
│       ├── Tier1SoftSignal.css
│       ├── Tier2MediumAlert.tsx             (Orange warnings)
│       ├── Tier2MediumAlert.css
│       ├── Tier3HardBarrier.tsx             (Red modal)
│       └── Tier3HardBarrier.css
│
└── stores/
    └── interventionStore.ts                  (Zustand state management)
```

---

## Visual Layout: Where Components Appear

### Current ChatSessionPage Layout

```
┌────────────────────────────────────────────────┐
│  Header (Session Title, Controls)              │
├────────────────────┬───────────────────────────┤
│                    │                           │
│  Message List      │    Right Sidebar          │
│  (Chat History)    │  [Intervention Tier 1&2]  │
│                    │  [Intervention Tier 3 =   │
│  [Messages]        │    Modal (center overlay)]│
│  [Messages]        │                           │
│  [Messages]        │                           │
│                    │                           │
├────────────────────┴───────────────────────────┤
│  Footer (Message Input)                        │
└────────────────────────────────────────────────┘
```

### After Integration

**Tier 1 (Soft Signal)** - Sidebar, blue, non-blocking:
```
Right Sidebar
┌─────────────────────┐
│ 📊 Soft Signal      │
│ You're accepting... │  ← Fades in smoothly
│ [Learn More] [×]    │    No interruption
└─────────────────────┘
│ Regular sidebar     │
│ content...          │
└─────────────────────┘
```

**Tier 2 (Medium Alert)** - Sidebar, orange, slightly elevated:
```
Right Sidebar
┌─────────────────────┐
│ ⚠️ Review Recommended│
│ Consider verifying..│  ← More prominent
│ [Action] [Skip] [×] │    Gets attention
└─────────────────────┘
```

**Tier 3 (Hard Barrier)** - Modal, red, blocks everything:
```
┌─────────────────────────────────────┐
│ Page becomes darker (overlay)        │
│                                     │
│    ┌──────────────────────────┐    │
│    │ 🚨 Safety Check Required │    │ ← Centered modal
│    │ We detected pattern...   │    │    Demands action
│    │                          │    │
│    │ ○ Verify                 │    │
│    │ ○ Modify                 │    │
│    │ ○ Reject                 │    │
│    │ ○ Proceed Anyway         │    │
│    │                          │    │
│    │ [Cancel] [Confirm]       │    │
│    └──────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## Step-by-Step Integration into ChatSessionPage

### Step 1: Import the InterventionManager

In `ChatSessionPage.tsx`, add at the top:

```typescript
// Add to imports
import InterventionManager from '../components/interventions/InterventionManager';
```

### Step 2: Add InterventionManager to JSX

Find where you render the sidebar in ChatSessionPage. Add InterventionManager **inside** the right sidebar container:

```typescript
// In ChatSessionPage.tsx render section
<div style={{ display: 'flex', flex: 1 }}>
  {/* Main chat area */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    {/* Your existing message list, input, etc. */}
  </div>

  {/* Right Sidebar */}
  <div style={{
    width: '320px',
    borderLeft: '1px solid #e5e7eb',
    overflow: 'auto',
    padding: '1rem',
    position: 'relative'
  }}>
    {/* INTERVENTION MANAGER - Insert here */}
    <InterventionManager
      sessionId={sessionId}
      messages={messages}
      minMessagesForDetection={5}
      onInterventionDisplayed={(tier, mrType) => {
        console.log(`Intervention displayed: ${tier} (${mrType})`);
        // Optional: track event for analytics
      }}
      onUserAction={(mrType, action) => {
        console.log(`User action: ${action} on ${mrType}`);
        // Optional: track user behavior
      }}
    />
    {/* END INTERVENTION MANAGER */}

    {/* Your existing sidebar content below */}
    {showPatternPanel && (
      <PatternAnalysisWindow {...props} />
    )}
    {/* ... rest of sidebar ... */}
  </div>
</div>
```

### Step 3: Update ChatSessionPage Message Type

Ensure your Message interface matches what PatternDetector expects:

```typescript
// In ChatSessionPage.tsx or types file
interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  userInput?: string;           // Add if not present
  aiResponse?: string;          // Add if not present
  wasVerified?: boolean;        // Already have these
  wasModified?: boolean;
  wasRejected?: boolean;
}
```

### Step 4: No Other Changes Needed!

InterventionManager is **self-contained**:
- ✅ Detects patterns internally
- ✅ Manages state via Zustand
- ✅ Renders all three tier UIs
- ✅ Handles all user actions
- ✅ Logs metrics automatically

---

## Full ChatSessionPage Integration Example

Here's a complete example of the integration:

```typescript
import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// NEW IMPORTS
import InterventionManager from '../components/interventions/InterventionManager';
import { useInterventionStore } from '../stores/interventionStore';

// ... rest of imports ...

const ChatSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);

  // Get intervention metrics (optional)
  const interventionStore = useInterventionStore();

  // ... rest of your existing code ...

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem' }}>
        <h1>{sessionData?.taskDescription || 'Chat Session'}</h1>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar (Sessions) */}
        {sessionSidebarOpen && (
          <div style={{ width: '280px', borderRight: '1px solid #e5e7eb' }}>
            {/* Sessions list */}
          </div>
        )}

        {/* Center: Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <VirtualizedMessageList
            ref={virtualizedListRef}
            messages={messages}
            height={600}
            width="100%"
            itemHeight={140}
            renderMessage={renderMessage}
            onLoadMore={loadMoreMessages}
            isLoading={isLoadingMore}
            hasMore={hasMoreMessages}
          />

          {/* Input */}
          <form onSubmit={handleSendMessage} style={{ padding: '1rem' }}>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>

        {/* Right Sidebar: Interventions + Pattern Analysis */}
        <div
          style={{
            width: '320px',
            borderLeft: '1px solid #e5e7eb',
            overflowY: 'auto',
            padding: '1rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* ========== INTERVENTION MANAGER ========== */}
          {/* This is where soft signals and medium alerts appear */}
          {/* Hard barriers render as modals (centered overlay) */}
          <InterventionManager
            sessionId={sessionId}
            messages={messages}
            minMessagesForDetection={5}
            onInterventionDisplayed={(tier, mrType) => {
              // Optional: Log to analytics
              console.log(`Intervention ${tier} displayed: ${mrType}`);
            }}
            onUserAction={(mrType, action) => {
              // Optional: Log user action
              console.log(`User ${action} on ${mrType}`);

              // Show confirmation toast
              if (action === 'acted' || action === 'override') {
                showNotification({
                  type: 'success',
                  title: '✓ Noted',
                  message: 'Your action has been recorded.',
                  duration: 3000,
                });
              }
            }}
          />
          {/* ========== END INTERVENTION MANAGER ========== */}

          {/* Pattern Analysis Window (below interventions) */}
          {showPatternPanel && (
            <Suspense fallback={<ComponentLoader />}>
              <PatternAnalysisWindow
                pattern={pattern}
                sessionId={sessionId}
                onClose={() => setShowPatternPanel(false)}
              />
            </Suspense>
          )}

          {/* Other sidebar content */}
        </div>
      </div>
    </div>
  );
};

export default ChatSessionPage;
```

---

## Data Flow Diagram

```
User sends message
    ↓
ChatSessionPage updates messages state
    ↓
InterventionManager (in render) detects messages changed
    ↓
If enough messages (>= minMessagesForDetection):
  ├─ extractUserSignals(messages)
  ├─ detectPatternF(signals, messages)
  ├─ scheduleIntervention(confidence, history, suppression)
  └─ If should display:
      ├─ Create intervention UI
      ├─ Store via useInterventionStore
      └─ Render appropriate tier component
    ↓
User interacts with intervention (dismiss, learn more, proceed anyway)
    ↓
Handle{Dismiss|LearnMore|Skip|BarrierConfirm}
    ↓
├─ Update user history (dismissal count, engagement)
├─ Check: should suppress next time?
├─ Log metrics
└─ Clear active intervention
    ↓
Next message arrives → cycle repeats
```

---

## Accessing Intervention Metrics

InterventionStore tracks compliance metrics. Access them in ChatSessionPage:

```typescript
import { useInterventionStore } from '../stores/interventionStore';

// Inside ChatSessionPage component
const interventionStore = useInterventionStore();

// Get metrics for current session
const metrics = interventionStore.getSessionMetrics(sessionId);

console.log('Compliance Metrics:', {
  softSignalsShown: metrics?.softSignalCount,
  mediumAlertsShown: metrics?.mediumAlertCount,
  hardBarriersShown: metrics?.hardBarrierCount,
  userEngagements: metrics?.engagementCount,
  userCompliance: metrics?.complianceCount,
  userOverrides: metrics?.overrideCount,
});

// Display in dashboard widget
<div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
  <h3>Session Compliance</h3>
  <p>Interventions shown: {metrics?.totalInterventionsShown}</p>
  <p>Engagement rate: {metrics && metrics.totalInterventionsShown > 0
    ? ((metrics.engagementCount / metrics.totalInterventionsShown) * 100).toFixed(0)
    : '0'}%</p>
</div>
```

---

## Optional: Add Intervention Pause Button

If you want users to temporarily disable interventions:

```typescript
// In ChatSessionPage
const [pauseInterventions, setPauseInterventions] = useState(false);

// Pass to InterventionManager
<InterventionManager
  sessionId={sessionId}
  messages={messages}
  // Temporarily disable if paused
  minMessagesForDetection={pauseInterventions ? 999999 : 5}
/>

// Add button in UI
<button
  onClick={() => setPauseInterventions(!pauseInterventions)}
  style={{
    padding: '0.5rem 1rem',
    backgroundColor: pauseInterventions ? '#ef4444' : '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  }}
>
  {pauseInterventions ? '🔇 Interventions paused' : '🔔 Interventions active'}
</button>
```

---

## Testing Your Integration

### Manual Testing Checklist

- [ ] Add message → soft signal appears after 5 messages ✓
- [ ] Dismiss soft signal → stays gone for 5 minutes ✓
- [ ] Click "Learn More" → records engagement ✓
- [ ] Add message without verification → medium alert appears ✓
- [ ] Medium alert has "Learn More" and "Skip" buttons ✓
- [ ] After 3 dismissals → suppressed for 30 minutes ✓
- [ ] Very high confidence pattern → hard barrier modal appears ✓
- [ ] Hard barrier has 4 options + "Proceed Anyway" button ✓
- [ ] Selecting option + Confirm → records action ✓
- [ ] Escape key closes hard barrier ✓

### Code Testing

```bash
# Run unit tests for intervention components
npm test -- src/components/interventions/

# Test that InterventionManager integrates
npm test -- src/utils/PatternDetector.test.ts
npm test -- src/utils/InterventionScheduler.test.ts

# Full build test
npm run build
```

---

## Styling & Customization

All components use CSS variables for theming. Customize in `design-system.css`:

```css
/* Colors */
--color-soft-signal: #3b82f6;    /* Blue */
--color-medium-alert: #f59e0b;   /* Orange */
--color-hard-barrier: #ef4444;   /* Red */

/* Can also override component colors */
.tier1-soft-signal {
  --tier1-bg: #eff6ff;
  --tier1-border: #3b82f6;
}
```

---

## Performance Considerations

### InterventionManager Debouncing

By default, analysis runs with 1-second debounce:

```typescript
// In InterventionManager.tsx
setTimeout(() => {
  performAnalysis();
}, 1000);  // ← Adjust this if needed (e.g., 2000 for 2 seconds)
```

### Pattern Detection Performance

Expected execution times:
- Feature extraction: < 50ms
- Pattern detection: < 20ms
- Scheduling decision: < 10ms
- **Total**: < 100ms (< 200ms with debounce acceptable)

---

## Monitoring & Debugging

### Enable Debug Logging

```typescript
// In InterventionManager or ChatSessionPage
const interventionStore = useInterventionStore();

// Log when intervention displayed
onInterventionDisplayed={(tier, mrType) => {
  console.log(`[INTERVENTION] Displayed: tier=${tier}, type=${mrType}`);
}}

// Log when user acts
onUserAction={(mrType, action) => {
  console.log(`[INTERVENTION] User action: ${action} on ${mrType}`);

  // Log current metrics
  const metrics = interventionStore.getSessionMetrics(sessionId);
  console.log('[INTERVENTION] Current metrics:', metrics);
}}
```

### Dashboard Widget for Metrics

```typescript
// Add to ChatSessionPage or create MetricsDashboard component
<div style={{
  padding: '1rem',
  backgroundColor: '#f3f4f6',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
}}>
  <h4>Intervention Metrics (This Session)</h4>
  <table>
    <tr>
      <td>Soft Signals Shown:</td>
      <td>{metrics?.softSignalCount}</td>
    </tr>
    <tr>
      <td>Medium Alerts Shown:</td>
      <td>{metrics?.mediumAlertCount}</td>
    </tr>
    <tr>
      <td>Hard Barriers Shown:</td>
      <td>{metrics?.hardBarrierCount}</td>
    </tr>
    <tr>
      <td>User Engagement:</td>
      <td>{((metrics?.engagementCount || 0) / (metrics?.totalInterventionsShown || 1) * 100).toFixed(0)}%</td>
    </tr>
    <tr>
      <td>User Compliance:</td>
      <td>{((metrics?.complianceCount || 0) / (metrics?.totalInterventionsShown || 1) * 100).toFixed(0)}%</td>
    </tr>
    <tr>
      <td>Override Rate:</td>
      <td>{((metrics?.overrideCount || 0) / (metrics?.hardBarrierCount || 1) * 100).toFixed(0)}%</td>
    </tr>
  </table>
</div>
```

---

## Troubleshooting

### Soft Signal not appearing?

1. Check: Are you at least 5 messages in? (check `minMessagesForDetection`)
2. Check: Is user verifying/modifying? (detection only triggers on passivity)
3. Check: Is intervention suppressed? (after 3 dismissals)
4. Debug: Add `console.log(interventionStore.suppressionState)` to check suppression

### Hard Barrier appearing unexpectedly?

1. Check detection confidence: `console.log(detection.confidence)`
2. Confidence must be >= 0.85 for hard barrier
3. At least 2 rules must be triggered

### Metrics not tracking?

1. Ensure `sessionId` is passed to InterventionManager
2. Check `interventionStore.getSessionMetrics(sessionId)` returns data
3. Verify `onUserAction` callback is firing: `console.log('action:', action)`

---

## Next Steps

After integration:

1. **Test with real users** (Week 2 beta: 3-5 users)
2. **Collect feedback** on intervention helpfulness
3. **Tune thresholds** based on real data
4. **Phase 2 pilot** (Week 5: 20-30 users)
5. **Full study** (Week 9: 80-100 users)

---

## Summary

Integrating InterventionManager is simple:

1. Import `InterventionManager`
2. Add to right sidebar in ChatSessionPage
3. Pass `sessionId` and `messages`
4. Done! Everything else is automatic

The system handles:
- ✅ Pattern detection
- ✅ Fatigue management
- ✅ Tier selection
- ✅ UI rendering
- ✅ User action tracking
- ✅ Metrics logging

No manual state management needed!

