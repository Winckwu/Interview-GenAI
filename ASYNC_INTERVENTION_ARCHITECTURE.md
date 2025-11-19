# Asynchronous Intervention Architecture
## Preventing Latency-Driven User Dropout

---

## Core Principle
**Never block the main conversation UI for pattern detection, analysis, or intervention.**

### Current Risk
```
User sends message
  ↓
System extracts 12 features (< 100ms)
  ↓
Bayesian update + pattern detection (< 50ms)
  ↓
[PROBLEM] LLM calls for confidence analysis (~3-5s) ❌ BLOCKS UI
  ↓
AI response finally appears

Result: User sees 3-5s blank, may close tab thinking app is frozen
```

### Desired Flow
```
User sends message
  ↓
[IMMEDIATE] Show thinking indicator + AI response streaming
  ↓
[BACKGROUND] Feature extraction (async)
  ↓
[BACKGROUND] Bayesian update (async)
  ↓
[BACKGROUND] LLM analysis for MR (async, if needed)
  ↓
[ASYNC UI UPDATE] MR card fades in (after AI response complete)

Result: User sees instant response, never perceives delay
```

---

## Implementation Architecture

### 1. Message Processing Pipeline (Pre-Send)

```typescript
// ChatSessionPage.tsx

const handleSendMessage = async (userInput: string) => {
  // ✅ FAST: Synchronous validation (< 50ms)
  if (!userInput.trim()) return;

  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: userInput,
    timestamp: new Date().toISOString(),
  };

  // ✅ IMMEDIATE: Add message and clear input
  setMessages(prev => [...prev, userMessage]);
  setUserInput('');

  // ✅ IMMEDIATE: Start AI response with streaming
  try {
    setLoading(true);

    // This should stream responses immediately
    const aiResponse = await api.post('/messages', {
      sessionId,
      content: userInput,
      stream: true,  // Enable streaming
    });

    const aiMessage: Message = {
      id: aiResponse.data.id,
      role: 'ai',
      content: aiResponse.data.content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, aiMessage]);

    // 🟢 NOW start expensive async analysis
    // User already sees response, so delay doesn't matter
    analyzePatternAsync(userMessage, aiMessage);

  } finally {
    setLoading(false);
  }
};

// ===== ASYNC ANALYSIS (Non-blocking) =====
const analyzePatternAsync = async (userMsg: Message, aiMsg: Message) => {
  // These run in background, don't affect UI responsiveness

  try {
    // Step 1: Extract features (< 100ms)
    const features = await extractFeaturesAsync({
      userMessage: userMsg.content,
      aiResponse: aiMsg.content,
      userHistory: messages.slice(-10), // Last 10 messages
    });

    // Step 2: Update Bayesian state (< 50ms)
    const updatedBayesian = await updateBayesianAsync(features);

    // Step 3: Detect patterns (< 100ms)
    const patterns = await detectPatternsAsync(features, updatedBayesian);

    // Step 4: Expensive - only if pattern detected
    if (patterns.requiresMRAnalysis) {
      const mrAnalysis = await analyzeMRRequirementAsync(patterns);

      // Fade in MR UI asynchronously
      displayMRAsync(mrAnalysis);
    }

    // Step 5: Log metrics
    await logInteractionMetricsAsync({
      features,
      patterns,
      timestamp: new Date(),
    });

  } catch (err) {
    // Silently fail - don't break user experience
    console.error('Async analysis error:', err);
  }
};

// ===== ASYNC HELPER FUNCTIONS =====

async function extractFeaturesAsync(input: {
  userMessage: string;
  aiResponse: string;
  userHistory: Message[];
}): Promise<UserFeatures> {
  // Run in Web Worker to avoid blocking main thread
  return new Promise((resolve) => {
    worker.postMessage({
      type: 'EXTRACT_FEATURES',
      data: input,
    });

    worker.onmessage = (event) => {
      resolve(event.data);
    };
  });
}

async function updateBayesianAsync(features: UserFeatures) {
  // Can use Web Worker or setTimeout to yield to browser
  return new Promise((resolve) => {
    setTimeout(async () => {
      const updated = bayesianCore.update(features);
      resolve(updated);
    }, 0);
  });
}

async function displayMRAsync(mrAnalysis: MRAnalysis) {
  // Graceful fade-in - never jarring
  setDisplayedModalMR(null);  // Clear old MR

  // Wait for user to see AI response (give 2 seconds)
  await new Promise(r => setTimeout(r, 2000));

  // Then fade in new MR
  setDisplayedModalMR(mrAnalysis);
}
```

---

### 2. Web Worker for CPU-Intensive Tasks

**Purpose**: Move expensive operations off the main thread entirely

```typescript
// workers/patternDetectionWorker.ts

self.onmessage = async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'EXTRACT_FEATURES':
      const features = extractFeatures(data);
      self.postMessage({ type: 'FEATURES_EXTRACTED', data: features });
      break;

    case 'DETECT_PATTERNS':
      const patterns = detectPatterns(data);
      self.postMessage({ type: 'PATTERNS_DETECTED', data: patterns });
      break;

    case 'ANALYZE_MR':
      const mrAnalysis = analyzeMRRequirements(data);
      self.postMessage({ type: 'MR_ANALYZED', data: mrAnalysis });
      break;
  }
};

function extractFeatures(input: any): UserFeatures {
  // All computation happens in Worker thread
  // Doesn't block UI rendering
  return {
    // ... your 12 features
  };
}
```

---

### 3. Pattern Detection Confidence Tiers

**Instead of waiting for certainty, use confidence levels to decide timing**

| Confidence | Action | Timing | UI |
|-----------|--------|--------|-----|
| **Low** (< 0.4) | Log metrics | After message | (no UI) |
| **Medium** (0.4-0.6) | Show MR13 (uncertainty) | 2-3 sec after message | Soft fade-in |
| **High** (0.6-0.8) | Show MR18 (warning) | 3-4 sec after message | Gentle notification |
| **Very High** (0.8+) | Show hard barrier (if Pattern F) | Immediate (< 100ms) | Blocking modal |

```typescript
async function displayMRWithDelay(analysis: PatternAnalysis) {
  const { confidence, mrType } = analysis;

  // Only block for very high confidence pattern F
  if (mrType === 'MR_PATTERN_F_BARRIER' && confidence >= 0.8) {
    setShowVerificationTools(true);  // Immediate
    return;
  }

  // Otherwise, defer display
  const delayMs = confidence >= 0.6 ? 2000 : 3000;

  await new Promise(r => setTimeout(r, delayMs));

  // Check if user has scrolled past or closed app
  if (!document.hidden) {  // Only show if page still visible
    setDisplayedModalMR(analysis);
  }
}
```

---

### 4. Smart Intervention Suppression

**Avoid "MR Fatigue" - don't show the same warning repeatedly**

```typescript
interface InterventionState {
  lastMRType: string | null;
  lastMRTimestamp: number | null;
  dismissalCount: Record<string, number>;  // Map: MR type -> count
  suppressUntil: Record<string, number>;   // Map: MR type -> timestamp
}

const [interventionState, setInterventionState] = useState<InterventionState>({
  lastMRType: null,
  lastMRTimestamp: 0,
  dismissalCount: {},
  suppressUntil: {},
});

function shouldShowMR(mrType: string): boolean {
  const now = Date.now();
  const dismissalCount = interventionState.dismissalCount[mrType] || 0;
  const suppressUntil = interventionState.suppressUntil[mrType] || 0;

  // Rule 1: Don't show if currently suppressed
  if (now < suppressUntil) return false;

  // Rule 2: Fatigue decay - after N dismissals, suppress for longer
  if (dismissalCount >= 3) {
    // User has dismissed this MR 3+ times
    // Suppress for 30 minutes
    return false;
  }

  if (dismissalCount >= 1) {
    // User dismissed once, wait 5 minutes before showing again
    return (now - interventionState.lastMRTimestamp) > 5 * 60 * 1000;
  }

  return true;
}

function recordMRDismissal(mrType: string) {
  setInterventionState(prev => ({
    ...prev,
    dismissalCount: {
      ...prev.dismissalCount,
      [mrType]: (prev.dismissalCount[mrType] || 0) + 1,
    },
    suppressUntil: {
      ...prev.suppressUntil,
      [mrType]: Date.now() + (5 * 60 * 1000),  // 5 min suppress
    },
  }));
}
```

---

### 5. Dashboard Metrics for Latency Monitoring

```typescript
interface PerformanceMetrics {
  // Latency (milliseconds)
  timeToFirstTokenMS: number;        // When AI response starts
  timeToMRDisplayMS: number;         // When first MR appears
  totalMessageLatencyMS: number;     // Full round-trip

  // Intervention effectiveness
  mrComplianceRate: number;          // % users who acted on MR
  mrDismissalRate: number;           // % users who closed MR
  mrFatigueEvents: number;           // Times fatigue suppression triggered

  // User experience
  userSessionLength: number;          // Minutes before dropout
  messagesBeforeDropout: number;      // How many turns before leaving
  interventionDropoutCorrelation: number;  // Does intervention cause exit?
}
```

**Dashboard Display**:
```
┌─ Performance Monitor ─────────────────┐
│                                        │
│ ⚡ Latency Metrics                     │
│   Time to AI Response:    150ms ✓      │
│   Time to MR Display:     2450ms ✓     │
│   P95 Response Time:      2800ms ✓     │
│                                        │
│ 👥 Intervention Effectiveness         │
│   MR Compliance Rate:     65% ✓        │
│   MR Dismissal Rate:      22% ⚠️       │
│   MR Fatigue Events:      3/day        │
│                                        │
│ 📊 User Retention                     │
│   Avg Session Length:     18min ✓      │
│   Pre-Intervention Exit:  2% ✓         │
│   Post-Intervention Exit: 5% ⚠️        │
│                                        │
└────────────────────────────────────────┘

⚠️ Alert: Post-intervention dropout higher than pre
→ Consider: soften MR18 language or reduce frequency
```

---

## Implementation Checklist

- [ ] **Phase-1**: Implement basic async analysis (Web Worker)
- [ ] **Phase-2**: Add confidence tiers and fatigue decay
- [ ] **Phase-3**: Monitor dashboard metrics, adjust thresholds
- [ ] **Phase-4**: A/B test different delay timings (0s, 2s, 5s) for MR display

---

## Testing Recommendations

### Latency Test
```
User sends message
→ measure: time until "AI is thinking..." appears
→ target: < 200ms
```

### Dropout Test
```
Run with different intervention timings:
  - Group A: MR shows immediately (0s)
  - Group B: MR shows after 2s
  - Group C: MR shows after 5s

Measure: session dropout rate in each group
Expected: Group B/C have lower dropout
```

---

## Key Guardrails

1. **Never block the main thread** for anything > 100ms
2. **Always show AI response first** before any intervention UI
3. **Graceful degradation**: If analysis fails, user still gets response
4. **Transparency**: Show "Pattern analysis in progress..." if visible
5. **Fatigue management**: Suppress repeated same-MR within 5 minutes

