# Complete System Integration: Pattern Detection → UI → Monitoring

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ChatSessionPage                         │
│  (Main chat interface with message list and input)         │
└─────────────────┬───────────────────────────────────────────┘
                  │
      ┌───────────┴───────────┬──────────────────┐
      │                       │                  │
      v                       v                  v
  Messages                 InterventionManager   Metrics
  (state)                  (orchestrator)        Collection

      │                       │                  │
      └───────────────────────┼──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
        PatternDetector        InterventionScheduler
        (Layer 1 rules)        (Fatigue algorithm)
                    │                   │
                    └─────────────────┬─┘
                          │
                    Tier 1/2/3 UIs
                    (3 components)
                          │
                    ┌─────┴──────┐
                    │            │
              User Actions    Metrics
              (dismiss,       (tracking)
               learn more,        │
               override)          │
                    │            │
                    └────┬──────┘
                         │
                MonitoringDashboard
                (Real-time metrics)
```

---

## 1️⃣ Phase 1: Pattern Detection

### What It Does
- Detects Pattern F (ineffective AI use) using 5 hard rules
- No synthetic data, fully defensible
- Returns confidence score (0-1) and tier recommendation

### Core Files
- **PatternDetector.ts** (400+ lines)
  - Rules: F-R1 to F-R5
  - `detectPatternF(signals, interactions)` → detection result
  - `extractUserSignals(interactions)` → signal extraction

### Data Flow
```
Message history
    ↓
extractUserSignals()
    ↓
UserSignals (metrics from messages)
    ↓
detectPatternF()
    ↓
Check 5 rules (F-R1 ~ F-R5)
    ↓
PatternFDetectionResult
  - detected: boolean
  - confidence: 0-1
  - triggeredRules: string[]
  - recommendedTier: 'soft' | 'medium' | 'hard'
  - severity: 'low' | 'medium' | 'high'
```

### Example
```typescript
import { detectPatternF, extractUserSignals } from './utils/PatternDetector';

const signals = extractUserSignals(messages);
const detection = detectPatternF(signals, messages);

console.log(`Pattern detected: ${detection.detected}`);
console.log(`Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
console.log(`Tier: ${detection.recommendedTier}`);
```

---

## 2️⃣ Phase 2: Intervention Scheduling

### What It Does
- Calculates user fatigue (0-100 scale)
- Determines suppression based on fatigue + dismissals
- Decides whether to display intervention

### Core Files
- **InterventionScheduler.ts** (350+ lines)
  - `calculateFatigueScore(mrType, history)` → 0-100
  - `shouldSuppressIntervention(...)` → boolean
  - `scheduleIntervention(...)` → display decision
  - `recordInterventionAction(...)` → update history

### Fatigue Algorithm
```
Fatigue = dismissalCount × 10 + zeroEngagement × 30 - decayFactor

Dismissal Impact:
- 1 dismissal: +10
- 2 dismissals: +20
- 3+ dismissals: +40

Time Decay:
- After 30 min calm: fatigue × 0.5
- After 15 min calm: fatigue × 0.75

Suppression:
- 3 dismissals → 30 min suppression
- Fatigue > 70 → 15 min suppression
- 2 dismissals → 10 min suppression
- 1 dismissal → 5 min suppression
```

### Suppression Rules
```typescript
if (dismissalCount >= 3) {
  // Suppress for 30 minutes
  suppressionExpiry = now + 30 * 60 * 1000;
} else if (fatigueScore > 70) {
  // Suppress for 15 minutes
  suppressionExpiry = now + 15 * 60 * 1000;
} else if (dismissalCount === 2) {
  // Suppress for 10 minutes
  suppressionExpiry = now + 10 * 60 * 1000;
} else if (dismissalCount === 1) {
  // Suppress for 5 minutes
  suppressionExpiry = now + 5 * 60 * 1000;
}
```

### Example
```typescript
import { scheduleIntervention, recordInterventionAction } from './utils/InterventionScheduler';

const decision = scheduleIntervention(
  'MR18_OverDependence',  // mrType
  detection.confidence,    // 0.75
  detection.recommendedTier, // 'medium'
  userHistory,            // past actions
  suppressionState        // current suppression
);

if (decision.shouldDisplay) {
  displayIntervention(decision.tier, detection);

  // User acts...
  recordInterventionAction(
    'MR18_OverDependence',
    'dismiss',  // or 'acted', 'override'
    userHistory,
    suppressionState
  );
}
```

---

## 3️⃣ Phase 3: UI Components (Tier 1-3)

### What They Do
- Display interventions based on tier
- Handle user actions (dismiss, learn more, override)
- Provide different UX based on severity

### Tier 1: Soft Signal (Blue, Non-blocking)
```
┌─────────────────────────────┐
│ 📊 You're accepting most    │
│ responses without           │
│ modification               │
│                             │
│  [Learn More]        [✕]   │
└─────────────────────────────┘
```
- Sidebar placement
- For confidence: 0.4-0.6
- Auto-dismisses: optional
- No blocking

### Tier 2: Medium Alert (Orange, Prominent)
```
┌─────────────────────────────┐
│ ⚠️ Review Recommended       │
│ Consider verifying your     │
│ responses before accepting  │
│                             │
│  [Learn More]  [Skip]  [✕]  │
└─────────────────────────────┘
```
- More noticeable
- For confidence: 0.6-0.85
- Still non-blocking
- Pulse animation

### Tier 3: Hard Barrier (Red, Modal)
```
╔═════════════════════════════════════════════════════════╗
║  🚨 Pattern Detected                            [✕]    ║
║                                                         ║
║  This pattern suggests you should verify your          ║
║  responses before accepting them.                      ║
║                                                         ║
║  What would you like to do?                            ║
║                                                         ║
║  ○ Verify this response first                          ║
║  ○ Review the latest responses                         ║
║  ○ Reject and start over                              ║
║  ○ Proceed Anyway (I know what I'm doing)             ║
║                                                         ║
║                          [Cancel]  [Continue]          ║
╚═════════════════════════════════════════════════════════╝
```
- Modal dialog (blocking)
- For confidence: 0.85+
- **Critical**: "Proceed Anyway" preserves autonomy
- Radio button selection required
- Keyboard support (Escape to cancel)

### Core Files
- **Tier1SoftSignal.tsx** + CSS
- **Tier2MediumAlert.tsx** + CSS
- **Tier3HardBarrier.tsx** + CSS
- **InterventionManager.tsx** (orchestrator)

### InterventionManager Features
```typescript
<InterventionManager
  sessionId={sessionId}
  messages={messages}
  minMessagesForDetection={5}
  onInterventionDisplayed={(tier, mrType) => {...}}
  onUserAction={(mrType, action) => {...}}
/>
```
- Automatic detection when 5+ messages
- Debounced analysis (1000ms)
- Tier selection based on confidence
- State management via Zustand
- Action tracking and metrics recording

---

## 4️⃣ Phase 4: Metrics & Monitoring

### What It Does
- Tracks every intervention display
- Records user actions (dismiss/acted/override)
- Calculates compliance rates
- Triggers alerts on anomalies
- Provides real-time dashboard

### Core Files
- **MetricsCollector.ts** (615 lines)
  - Main metrics collection API
  - Session and system aggregation
  - Alert generation and management
  - 7 alert types with severity levels

- **metricsStore.ts** (Zustand)
  - State management
  - Integration with MetricsCollector

- **MonitoringDashboard.tsx** (384 lines)
  - Real-time KPI visualization
  - Session or system-level view
  - Alert display and acknowledgement
  - Auto-refresh every 5 seconds

### Metrics Collected

#### Per Intervention
```typescript
{
  id: 'intervention-123',
  sessionId: 'session-456',
  timestamp: 1700000000000,

  // Detection info
  mrType: 'MR18_OverDependence',
  confidence: 0.75,
  tier: 'medium',
  triggeredRules: ['F-R1', 'F-R3'],

  // User action
  userAction: 'dismiss',      // or 'skip', 'acted', 'override'
  actionTimestamp: 1700000005000,
  timeToAction: 5000,         // ms

  // Context
  fatigueScore: 35,
  suppressionActive: false,
  messageCountAtDisplay: 8
}
```

#### Per Session
```typescript
{
  totalDetections: 5,
  averageConfidence: 0.72,

  // Intervention metrics
  totalDisplays: 5,
  tierBreakdown: { soft: 2, medium: 2, hard: 1 },

  // User actions
  dismissalCount: 1,
  dismissalRate: 0.20,        // 20%
  engagementCount: 3,
  engagementRate: 0.60,       // 60%
  complianceCount: 3,
  complianceRate: 0.60,       // 60%
  overrideCount: 1,
  overrideRate: 0.20,         // 20%

  // Fatigue
  avgFatigueScore: 35,
  maxFatigueScore: 50,
  suppressionEvents: 0,

  // Session outcome
  sessionCompleted: true,
  completionTime: 600000,     // ms
  messageCount: 15
}
```

#### System-wide
```typescript
{
  totalSessions: 25,
  totalDetections: 120,
  totalInterventions: 120,
  totalUsers: 15,

  // Effectiveness
  avgComplianceRate: 0.62,    // 62%
  avgDismissalRate: 0.18,     // 18%
  avgEngagementRate: 0.65,    // 65%
  avgOverrideRate: 0.17,      // 17%

  // Performance
  p50DetectionLatency: 45,    // ms
  p95DetectionLatency: 120,   // ms
  p99DetectionLatency: 180,   // ms

  // Patterns
  mostCommonPatterns: [
    { type: 'MR18', count: 45 },
    { type: 'MR20', count: 30 }
  ],
  mostEffectiveTier: 'hard',

  // Quality
  falsePositiveRate: 0.17,    // 17% (overrides)
  completionRate: 0.85,       // 85%
  dropoutRate: 0.15,          // 15%

  // Alerts
  alertsTriggered: 8,
  criticalAlertsTriggered: 1
}
```

### Alert Types
```
1. high_dismissal       - Dismissal rate > 70%
2. low_compliance      - Compliance rate < 30%
3. high_fatigue        - Fatigue score > 70
4. high_latency        - Detection time > 200ms
5. session_dropout     - User abandoned before completion
6. high_dismissal_count - >= 5 dismissals in session
7. custom             - Any configurable threshold
```

### Dashboard Display
```
┌─────────────────────────────────────────────────────┐
│ 📊 Session Metrics                   Updated: 14:32 │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ │ ✅ 60.0% │ │ ❌ 20.0% │ │ 👥 60.0% │ │ 🚀 20.0% │
│ │Compliance│ │Dismissal│ │Engagement│ │ Override │
│ │████░    │ │ ██░     │ │ ████░    │ │ ██░      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘
│
│ 📊 Tier Breakdown:
│ ┌──────────────────────────────────────────────────┐
│ │ Tier 1 (Soft):    2                              │
│ │ Tier 2 (Medium):  2                              │
│ │ Tier 3 (Hard):    1                              │
│ └──────────────────────────────────────────────────┘
│
│ ⚠️ Recent Alerts (1 unread):
│ ┌──────────────────────────────────────────────────┐
│ │ 🟠 Low compliance rate: 20.0% (threshold: 30%)  │
│ │                                        14:25 [✓] │
│ └──────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
```

---

## 🔗 End-to-End Integration Example

### Step 1: User sends message
```
User: "How do I implement async/await in JavaScript?"
AI:   "Async/await is syntactic sugar for promises..."
```

### Step 2: Pattern detection triggers (5+ messages)
```typescript
const signals = extractUserSignals(messages);
const detection = detectPatternF(signals, messages);
// Result: confidence = 0.75, tier = 'medium'
```

### Step 3: Fatigue check
```typescript
const fatigueScore = calculateFatigueScore('MR18', history);
// Score: 35 (low fatigue)

const shouldSuppress = shouldSuppressIntervention(
  'MR18', 35, 1, null
);
// false - not suppressed
```

### Step 4: Display Tier 2 alert
```typescript
// InterventionManager renders Tier2MediumAlert
<Tier2MediumAlert
  message="Consider verifying your responses"
  actionLabel="Learn More"
  onAction={handleLearnMore}
  onDismiss={handleDismiss}
/>
```

### Step 5: Record display in metrics
```typescript
metricsStore.recordInterventionDisplay({
  sessionId: 'session-123',
  timestamp: Date.now(),
  mrType: 'MR18_OverDependence',
  confidence: 0.75,
  tier: 'medium',
  fatigueScore: 35,
  suppressionActive: false,
  messageCountAtDisplay: 8
});
```

### Step 6: User dismisses
```typescript
metricsStore.recordUserAction(
  'session-123',
  'intervention-id',
  'dismiss',
  3000  // took 3 seconds to dismiss
);
```

### Step 7: Update fatigue & history
```typescript
const updated = recordInterventionAction(
  'MR18_OverDependence',
  'dismiss',
  userHistory,
  suppressionState
);
// dismissalCount: 2
// suppressionExpiry: now + 10 min
```

### Step 8: Check for alerts
```
✓ No high dismissal (2 < 5)
✓ Compliance still good (100% so far)
✓ Fatigue still low (50 < 70)
```

### Step 9: Dashboard updates
```
┌──────────────────────────────────┐
│ Session Metrics (auto-refreshing)│
│                                  │
│ Compliance:  100% ████████      │
│ Dismissal:   50%  █████░        │
│ Engagement:  50%  █████░        │
│ Detections:  2                   │
│                                  │
│ ⚠️ No alerts                     │
└──────────────────────────────────┘
```

---

## 📁 Complete File Structure

```
frontend/src/
├── components/
│   ├── interventions/
│   │   ├── Tier1SoftSignal.tsx       ✅ Non-blocking blue tip
│   │   ├── Tier1SoftSignal.css
│   │   ├── Tier2MediumAlert.tsx      ✅ Orange warning
│   │   ├── Tier2MediumAlert.css
│   │   ├── Tier3HardBarrier.tsx      ✅ Red modal + "Proceed Anyway"
│   │   ├── Tier3HardBarrier.css
│   │   └── InterventionManager.tsx   ✅ Orchestrator
│   │
│   └── monitoring/
│       ├── MonitoringDashboard.tsx   ✅ Real-time metrics
│       └── MonitoringDashboard.css
│
├── stores/
│   ├── interventionStore.ts          ✅ UI state management
│   └── metricsStore.ts               ✅ Metrics state management
│
├── utils/
│   ├── PatternDetector.ts            ✅ Layer 1 rules (Week 1)
│   ├── InterventionScheduler.ts      ✅ Fatigue algorithm (Week 1)
│   ├── __tests__/
│   │   ├── PatternDetector.test.ts   ✅ 45+ tests
│   │   └── InterventionScheduler.test.ts ✅ 45+ tests
│   └── MetricsCollector.ts           ✅ Metrics API (Week 3-4)
│
├── types/
│   └── index.ts                      ✅ Comprehensive types
│
└── pages/
    └── ChatSessionPage.tsx           ← Add all components here
```

---

## 🚀 Quick Start Integration

### 1. Add imports to ChatSessionPage
```typescript
import InterventionManager from '../components/interventions/InterventionManager';
import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
import { useMetricsStore } from '../stores/metricsStore';
```

### 2. Initialize metrics
```typescript
const metricsStore = useMetricsStore();

useEffect(() => {
  metricsStore.setCurrentSession(sessionId, userId);
}, [sessionId, userId]);
```

### 3. Add to JSX layout
```typescript
<div style={{ display: 'flex' }}>
  {/* Main chat */}
  <div style={{ flex: 1 }}>
    {/* Your existing chat UI */}
  </div>

  {/* Right sidebar */}
  <div style={{ width: '350px' }}>
    <InterventionManager sessionId={sessionId} messages={messages} />
    <MonitoringDashboard sessionId={sessionId} />
  </div>
</div>
```

### 4. Complete session on exit
```typescript
useEffect(() => {
  return () => {
    metricsStore.completeSession(
      messages.length,
      true,  // completed
      Date.now() - sessionStartTime
    );
  };
}, [sessionId]);
```

---

## ✅ Integration Checklist

- [ ] Week 1: PatternDetector + InterventionScheduler implemented
- [ ] Week 1: 90+ unit tests passing
- [ ] Week 2: Tier 1-3 UI components created
- [ ] Week 2: InterventionManager orchestrator implemented
- [ ] Week 2: interventionStore created
- [ ] Week 2: Integrated into ChatSessionPage sidebar
- [ ] Week 3-4: MetricsCollector implemented
- [ ] Week 3-4: MonitoringDashboard created
- [ ] Week 3-4: metricsStore created
- [ ] Week 3-4: Monitoring integrated into ChatSessionPage
- [ ] Week 3-4: All types defined and exported
- [ ] Testing: Metrics recording verified
- [ ] Testing: Alerts triggering correctly
- [ ] Testing: Dashboard updating in real-time
- [ ] Performance: No latency from monitoring
- [ ] Beta: 3-5 real users tested
- [ ] Tuning: Thresholds adjusted based on feedback

---

## 📊 Expected Results

### After Week 1-2 (Core Logic + UI)
- Pattern F detected automatically
- Interventions displayed to users
- Users can dismiss or act on interventions
- No synthetic data required
- Fully defendible for thesis

### After Week 3-4 (Monitoring + Metrics)
- Real-time metrics dashboard
- Compliance rates tracked
- Fatigue patterns visible
- Alerts for anomalies
- Ready for beta testing

### After Week 5 (Pilot Data)
- Real user behavior data
- Threshold tuning from actual usage
- Effectiveness metrics
- User satisfaction ratings
- Ready for larger pilot (20-30 users)

---

## 🎯 Success Metrics

**Intervention Effectiveness:**
- Compliance rate: ≥ 60% (users act after intervention)
- Engagement rate: ≥ 50% (users click learn more)
- Dismissal rate: ≤ 30% (not too intrusive)
- Override rate: ≥ 10% (preserve autonomy, gather data)

**System Quality:**
- False positive rate: ≤ 20% (users can override)
- Detection latency: P95 < 200ms (non-blocking)
- Session completion: ≥ 85% (not causing dropout)
- User satisfaction: ≥ 4.0/5 (feels helpful)

---

## References

- **PHASE_1_IMPLEMENTATION_GUIDE.md** - Pattern detection details
- **WEEK2_INTEGRATION_GUIDE.md** - UI component integration
- **WEEK3_4_MONITORING_GUIDE.md** - Metrics and monitoring details
- **Core Implementation Files** - PatternDetector, InterventionScheduler, MetricsCollector
- **Unit Tests** - 90+ test cases covering all components
