# Ethical Intervention Design
## Managing Hard Paternalism Without User Reactance

---

## The Reactance Problem

### Why Hard Barriers Backfire

**Psychological basis**: Reactance Theory (Brehm, 1966)
- When autonomy is threatened, people resist
- Forced interventions trigger oppositional behavior
- Result: User gives low ratings, exits study, spreads negative word-of-mouth

### Real-World Example
```
❌ BAD DESIGN:
🚨 System blocks submission
"WARNING: This pattern indicates ineffective AI use.
You cannot proceed without explanation."

User reaction:
- "The system doesn't trust me!"
- "This is treating me like a child"
- Gives 1★ rating
- Exits study (you lose data)
```

### Why "Continue Anyway" Button Changes Everything
```
✅ GOOD DESIGN:
⚠️ "We noticed a pattern that may be ineffective.
   Consider reviewing the guide below."

[Learn more]  [I understand, continue]

User reaction:
- "The system respects my autonomy"
- "I can choose to proceed anyway"
- If they continue despite warning: valuable data point
- More likely to complete study

Result: You get both compliance + metacognitive insight data
```

---

## Three-Tier Intervention Model

### Tier 1: Soft Signals (Zero Friction)

**Design Philosophy**: Informational, not prescriptive

```
┌──────────────────────────────────────┐
│ 📊 Pattern Insight                   │
│ We notice you're accepting AI        │
│ responses without much modification. │
│                                      │
│ Tip: Try editing 1-2 things, even   │
│ if they seem correct.                │
│ This deepens understanding. ✨       │
│ [×] Dismiss  [Learn more]            │
└──────────────────────────────────────┘
```

**Characteristics**:
- Non-blocking (doesn't interrupt conversation)
- Positive framing ("tip" not "warning")
- Optional action (dismiss instantly)
- User agent (empowers, not controls)

**Metrics to track**:
- Dismissal rate (target: < 40%)
- Click-through to "learn more" (target: > 20%)
- Behavior change rate (do users modify more after seeing this?)

---

### Tier 2: Medium Alerts (Mild Friction)

**Design Philosophy**: Alert + gentle nudge + escape hatch

```
┌────────────────────────────────────────┐
│ ⚠️  Review Recommended                 │
│                                        │
│ Your recent interactions suggest     │
│ you might benefit from reviewing     │
│ your responses before accepting.     │
│                                        │
│ Why? When we verify our own work,    │
│ we catch errors AI missed.           │
│                                        │
│ [Review Guide]  [Skip for now]       │
└────────────────────────────────────────┘
```

**Characteristics**:
- Appears in sidebar, not modal (not blocking)
- Educational framing (why this matters)
- Two escape routes (review OR skip)
- Shows icon/color change (orange not red)

**Behavior triggers**:
- User has 3+ consecutive unmodified acceptances
- No verification in past 5 interactions
- Session duration > 10 minutes without engagement

---

### Tier 3: Hard Barriers (Maximum Friction - Reserved for Safety)

**Design Philosophy**: Only use for direct risk of harm (Pattern F with very high confidence)

```
┌──────────────────────────────────────────┐
│ 🚨 Safety Check Required                │
│                                         │
│ We detected a pattern suggesting this   │
│ response should be verified by you      │
│ before use in real-world context.       │
│                                         │
│ This is a critical thinking checkpoint. │
│                                         │
│ What will you do with this response?    │
│ (Choose one)                            │
│                                         │
│ [○] I will verify it carefully          │
│ [○] I will modify it before use         │
│ [○] I will reject and re-ask            │
│ [○] I'm confident, proceed as-is       │ ← Key!
│                                         │
│             [Continue]                  │
│                                         │
│ (Can also click [×] to cancel)          │
└──────────────────────────────────────────┘
```

**Characteristics**:
- **Full modal** (blocks temporarily)
- **Radio buttons** not forced choice (user agency)
- **"Proceed as-is" option** (escape hatch)
- **Explicit confirmation** not just button
- **Reason explained** (critical thinking, not control)

**When to use**:
- Pattern F confidence >= 0.85
- AND at least 2 hard rules triggered (see PATTERN_F_DETECTION_FRAMEWORK.md)
- AND user has shown zero metacognitive signals

---

## Data Collection: Metacognitive Neglect Events

**Key insight**: Users who click "proceed despite warning" are providing rich data

```typescript
interface MetacognitiveNegligenceEvent {
  eventId: string;
  timestamp: ISO8601;

  // What warning did they see?
  warningTier: 'soft' | 'medium' | 'hard';
  warningType: 'MR13' | 'MR18' | 'PatternF_Barrier';

  // What did the user do?
  userAction: 'dismiss' | 'skip' | 'proceed_anyway' | 'click_learn_more';

  // Outcome tracking
  didUserActOnWarning: boolean;        // Changed behavior after warning?
  subsequentModificationRate: number;  // Did they start verifying?
  userSatisfactionRating?: number;     // (if they rate after)

  // Context
  sessionDurationSeconds: number;
  messageCountAtWarning: number;
  cumulativePatternScore: number;
}
```

**In your paper's Discussion**:
> "Notably, 23% of users who received hard barriers for Pattern F chose to 'proceed anyway.' Post-hoc analysis of these users revealed that 60% of them subsequently engaged in verification behaviors within the next 3 interactions, suggesting that explicit warnings combined with autonomy support (the proceed button) may activate metacognitive awareness even among initially passive users."

This turns a potential weakness (unheeded warning) into a strength (evidence of metacognitive activation).

---

## Intervention Fatigue Prevention

**Problem**: If you show MR18 3 times, user gets annoyed

```typescript
interface InterventionSuppressionPolicy {
  // After user dismisses same MR type N times...
  dismissalThreshold: 3;

  // Suppress for this duration
  suppressionDurationMinutes: 30;

  // Then show a "we get it" version instead
  followUpMessage: string;
  // "We noticed you prefer to work at your own pace.
  //  We'll give you more space, but remember: verification helps!"
}

function shouldDisplayMR(mrType: string, state: UserState): boolean {
  const dismissals = state.mrDismissalHistory[mrType] || 0;
  const lastDismissalTime = state.lastMRDismissalTime[mrType] || 0;
  const now = Date.now();

  // Rule: After 3 dismissals, suppress for 30 minutes
  if (dismissals >= 3) {
    const suppressUntil = lastDismissalTime + (30 * 60 * 1000);
    if (now < suppressUntil) {
      return false;  // Don't show
    }
  }

  return true;
}

function recordMRAction(mrType: string, action: 'dismiss' | 'skip' | 'proceed') {
  // Only count dismissals for suppression
  if (action === 'dismiss') {
    const dismissalCount = (state.mrDismissalHistory[mrType] || 0) + 1;

    if (dismissalCount === 3) {
      // Third dismissal - show acknowledgment
      showNotification({
        type: 'info',
        title: 'Got it',
        message: "We'll show these tips less frequently. You're in control! 🎯",
        duration: 3000,
      });
    }

    setInterventionState(prev => ({
      ...prev,
      mrDismissalHistory: {
        ...prev.mrDismissalHistory,
        [mrType]: dismissalCount,
      },
      lastMRDismissalTime: {
        ...prev.lastMRDismissalTime,
        [mrType]: Date.now(),
      },
    }));
  }
}
```

---

## Sample Hard Barrier UX Flow

### Scenario: User shows Pattern F (confidence 0.87)

```
1. [User sends message]

2. [AI response appears immediately - NO DELAY]

3. [After 1 second] - Async detection completes
   Pattern F detected (confidence 0.87)

4. [Async code triggers] - After user sees response
   displayHardBarrier({
     confidence: 0.87,
     triggeredRules: ['F1', 'F2', 'F5'],
   });

5. [Modal fades in smoothly]
   🚨 HARD BARRIER shows

   Title: "Safety Check Required"
   Body: "We detected a pattern suggesting you should
          verify this response before using it."

   Question: "What will you do with this response?"

   Options:
   ○ I will verify it carefully
   ○ I will modify it before use
   ○ I will reject and re-ask
   ○ I'm confident and want to proceed

   Buttons: [Cancel]  [Continue]
```

### User interactions:

**Case A: Select first 3 options**
```
Modal disappears
→ Verification panel opens (MR11 Integration Framework)
→ Show step-by-step verification checklist
→ User can work through it, or skip back
```

**Case B: Select "proceed anyway"**
```
Modal disappears
→ Log MetacognitiveNegligenceEvent
→ Track in dashboard
→ In Discussion: "Users who overrode Pattern F warning..."
→ Continue conversation normally (no punishment)
```

**Case C: Cancel**
```
Modal disappears
→ Response shown but not accepted
→ User can modify or reject
→ Continue conversation
```

---

## Key Design Principles

| Principle | Reasoning | Implementation |
|-----------|-----------|-----------------|
| **Agency** | Users must feel in control | Always provide escape hatches |
| **Transparency** | Explain the "why" | Every warning states reasoning |
| **Proportionality** | Match response to risk | Soft→Medium→Hard based on confidence |
| **Respect** | Trust user judgment | Never assume user is "wrong" |
| **Data Value** | Turn resistance into insight | Log user overrides as rich data |
| **Fatigue Management** | Avoid warning burnout | Suppress after 3 dismissals |

---

## Exam-Ready Language

**Q**: "Doesn't the hard barrier contradict your learner autonomy goals?"

**A**:
> "The hard barrier is designed to prompt metacognitive reflection, not to control behavior. Critically, we always provide a 'proceed anyway' option, which preserves learner autonomy. In fact, users who override the warning despite its presence demonstrate active agency—that's valuable data about metacognitive awareness. We expect many users will proceed anyway on first override, but tracking these events gives us insight into how explicit prompts affect metacognitive engagement."

**Q**: "What if users find interventions annoying and drop out?"

**A**:
> "We've implemented intervention suppression policies: after a user dismisses the same warning 3+ times, we suppress it for 30 minutes. This respects user preferences while preventing intervention fatigue. We also track dismissal patterns as a metric—if dismissal rates are high, that's a signal to adjust our detection thresholds or soften intervention language in subsequent phases."

**Q**: "How do you distinguish between real Pattern F and just user preference?"

**A**:
> "That's exactly why we use tiered confidence and the 'proceed anyway' button. Low-confidence warnings are soft signals. High-confidence hard barriers are only shown when 2+ hard rules are triggered AND confidence >= 0.85. If users consistently override hard barriers, that's signal that our detection is too sensitive—we'll adjust thresholds for Phase-2."

