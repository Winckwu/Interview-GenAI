# Phase 1 Implementation Guide: Pattern Detection & Intervention Scheduling
## Code Architecture & Testing

---

## Overview

This guide covers the implementation of Week 1 core architecture for the Pattern F Detection Framework and Intervention Scheduler.

### Files Created

```
frontend/src/
├── types/
│   └── index.ts                                    (New)
├── utils/
│   ├── PatternDetector.ts                          (New - 400+ lines)
│   ├── InterventionScheduler.ts                    (New - 350+ lines)
│   └── __tests__/
│       ├── PatternDetector.test.ts                 (New - 400+ lines)
│       └── InterventionScheduler.test.ts           (New - 350+ lines)
```

---

## Architecture Overview

### Layer 1: Pattern Detection (PatternDetector.ts)

**Purpose**: Detect Pattern F (ineffective AI use) using 5 theory-driven hard rules

**Rules**:
- **F-R1**: Long input + quick acceptance (skimming detection)
- **F-R2**: Zero verification across multiple interactions
- **F-R3**: Low input/output ratio + no modifications
- **F-R4**: Temporal burst pattern (2-hour window, then 7+ day gap)
- **F-R5**: Complete passivity (zero verification, modification, rejection)

**Key Functions**:
```typescript
// Detect Pattern F from user signals and interaction history
detectPatternF(signals: UserSignals, interactions: Interaction[]): PatternFDetectionResult

// Calculate confidence based on triggered rules
calculateConfidence(triggeredRuleCount: number): number  // 0-1

// Recommend intervention tier
recommendInterventionTier(confidence: number, triggeredRules: string[]): 'none' | 'soft' | 'medium' | 'hard'

// Extract signals from interaction history
extractUserSignals(interactions: Interaction[]): UserSignals
```

**Academic Defensibility**:
- ✅ No synthetic data needed
- ✅ Rules derived from learning science literature
- ✅ Transparent thresholds
- ✅ Can explain each triggered rule

---

### Layer 2: Intervention Scheduling (InterventionScheduler.ts)

**Purpose**: Determine whether to display interventions based on pattern confidence + user fatigue

**Core Algorithm: Fatigue Score (0-100)**

Fatigue increases with:
- Dismissal count (1 = +10pts, 2 = +20pts, 3+ = +40pts)
- Zero engagement + dismissals (+ 30pts max)
- Cumulative exposure time (+ up to 20pts)

Fatigue decreases with:
- Time decay (× 0.5 after 30 minutes, × 0.75 after 15 min)

**Suppression Rules**:
- After 3 dismissals: suppress for 30 minutes
- Fatigue > 70: suppress for 15 minutes
- After 2 dismissals: suppress for 10 minutes
- After 1 dismissal: suppress for 5 minutes

**Key Functions**:
```typescript
// Calculate how tired user is of specific MR type
calculateFatigueScore(mrType: string, history: UserInterventionHistory): number  // 0-100

// Decide if intervention should be suppressed
shouldSuppressIntervention(mrType: string, fatigueScore: number, dismissalCount: number, suppressionExpiresAt: number | null): boolean

// Main decision: should we display this intervention?
scheduleIntervention(mrType: InterventionType, patternConfidence: number, recommendedTier: string, userHistory: UserInterventionHistory, suppressionState: InterventionSuppressionState): InterventionSchedulingDecision

// Track user action and update history
recordInterventionAction(mrType: string, action: 'dismiss' | 'skip' | 'acted' | 'override', history: UserInterventionHistory, suppressionState: InterventionSuppressionState): { updatedHistory, updatedSuppressionState, fatigueAlert? }
```

---

## Data Flow

### Detecting Pattern F

```
ChatSessionPage.tsx
  ↓
Extract UserSignals from messages
  ↓
Call detectPatternF(signals, interactions)
  ↓
PatternDetector.ts checks all 5 rules (F-R1 to F-R5)
  ↓
Returns: confidence score + triggered rules + recommendation
  ↓
Pass to InterventionScheduler for final decision
```

### Scheduling Intervention Display

```
Pattern detected (confidence = 0.75)
  ↓
Check InterventionScheduler with:
  - mrType: 'MR18_OverDependence'
  - patternConfidence: 0.75
  - userHistory: { dismissals: 2, ... }
  - suppressionState: { suppressedMRTypes: Set, ... }
  ↓
Calculate fatigueScore = 20 + 10 = 30
  ↓
Check: shouldSuppress? (No - fatigue < 40)
  ↓
Check: confidence >= 0.6? (Yes)
  ↓
Recommend: tier = 'medium' (0.6 <= conf < 0.75)
  ↓
Display MR18 alert to user
  ↓
User dismisses
  ↓
recordInterventionAction('MR18_OverDependence', 'dismiss', ...)
  ↓
Update: dismissalCount = 3, trigger suppression for 30 min
  ↓
Show alert: "We understand, taking a break for 30 min"
  ↓
Next MR18 won't show for 30 minutes
```

---

## Running Tests

### Install Dependencies (if needed)
```bash
cd /home/user/Interview-GenAI/frontend
npm install --save-dev jest @types/jest ts-jest
```

### Configure Jest (if not already)
Add to `package.json`:
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.ts"],
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx"]
  }
}
```

### Run All Tests
```bash
npm test -- src/utils/__tests__/*.test.ts
```

### Run Specific Test File
```bash
npm test -- src/utils/__tests__/PatternDetector.test.ts
npm test -- src/utils/__tests__/InterventionScheduler.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage src/utils/__tests__/*.test.ts
```

### Watch Mode (auto-rerun on save)
```bash
npm test -- --watch src/utils/__tests__/*.test.ts
```

---

## Test Coverage

### PatternDetector Tests (45+ cases)
- ✅ Rule F-R1: Input length + speed thresholds
- ✅ Rule F-R2: Verification gap with minimum interactions
- ✅ Rule F-R3: Input/output ratio + modification rate
- ✅ Rule F-R4: Temporal burst pattern (2 hours, 7+ day gap)
- ✅ Rule F-R5: Complete passivity
- ✅ Confidence calculation (0-5 rules → 0-1.0 confidence)
- ✅ Confidence levels (low/medium/high)
- ✅ Intervention tier recommendation
- ✅ Full detection integration
- ✅ Signal extraction from interactions

### InterventionScheduler Tests (45+ cases)
- ✅ Fatigue score calculation (dismissals, engagement, time decay)
- ✅ Time decay: 30-min reset, 15-min partial decay
- ✅ Suppression decision logic
- ✅ Suppression expiry calculation (30/15/10/5 minutes)
- ✅ Hard barrier scheduling (confidence >= 0.85)
- ✅ Soft/medium signal scheduling
- ✅ History updates on user action
- ✅ Fatigue alerts (after 3 dismissals)
- ✅ Overall fatigue calculation across MR types
- ✅ Suppression summary for dashboard

---

## Expected Test Results

When all tests pass:

```
PatternDetector.test.ts
  ✓ 45+ tests passing
  ├─ Rule F-R1 tests: 4 passing
  ├─ Rule F-R2 tests: 4 passing
  ├─ Rule F-R3 tests: 4 passing
  ├─ Rule F-R4 tests: 4 passing
  ├─ Rule F-R5 tests: 4 passing
  ├─ Confidence calculation: 8 passing
  └─ Full detection: 13 passing

InterventionScheduler.test.ts
  ✓ 45+ tests passing
  ├─ Fatigue score calculation: 8 passing
  ├─ Suppression logic: 5 passing
  ├─ Expiry calculation: 5 passing
  ├─ Scheduling decisions: 6 passing
  ├─ History updates: 7 passing
  ├─ Overall fatigue: 2 passing
  └─ Dashboard summary: 3 passing

Total: 90+ tests, 100% passing
```

---

## Integration with ChatSessionPage (Next Steps)

Once tests pass, integrate into ChatSessionPage:

```typescript
// In ChatSessionPage.tsx
import { detectPatternF, extractUserSignals } from '../utils/PatternDetector';
import { scheduleIntervention, recordInterventionAction } from '../utils/InterventionScheduler';

// After user sends message and receives AI response
const signals = extractUserSignals(messages);
const detection = detectPatternF(signals, messages);

// Check if should display intervention
const decision = scheduleIntervention(
  detection.recommendedTier === 'hard' ? 'MR_PATTERN_F_BARRIER' : 'MR18_OverDependence',
  detection.confidence,
  detection.recommendedTier,
  userInterventionHistory,
  suppressionState
);

if (decision.shouldDisplay) {
  // Display appropriate tier UI (soft/medium/hard)
  displayIntervention(decision.tier, detection);

  // Track user action
  const action = getUserAction(); // 'dismiss' | 'acted' | 'override'
  const { updatedHistory, updatedSuppressionState, fatigueAlert } =
    recordInterventionAction(
      mrType,
      action,
      userInterventionHistory,
      suppressionState
    );

  // Update state
  setUserInterventionHistory(updatedHistory);
  setSuppressionState(updatedSuppressionState);

  if (fatigueAlert) {
    showNotification(fatigueAlert);
  }
}
```

---

## Key Metrics to Monitor

During Phase 2 pilot, track:

```typescript
interface PilotMetrics {
  // Pattern Detection Accuracy
  patternFDetectionRate: number;        // % of users flagged
  falsePositiveRate: number;            // % of false flags

  // Intervention Effectiveness
  displayCount: number;                 // How many times shown
  dismissalRate: number;                // % users dismissed
  engagementRate: number;               // % clicked "learn more"
  complianceRate: number;               // % changed behavior after

  // Fatigue Management
  suppressionTriggerCount: number;      // Times fatigue suppression activated
  avgTimeToSuppressionMs: number;       // How long before user fatigued?

  // User Experience
  satisfactionRating: number;           // Post-intervention rating
  sessionCompletionRate: number;        // % completed study

  // Correlation
  interventionDropoutCorrelation: number;  // -1 to +1
}
```

---

## Debugging Tips

### Test one rule at a time
```bash
npm test -- PatternDetector.test.ts -t "Rule F-R1"
```

### Enable verbose output
```bash
npm test -- --verbose src/utils/__tests__/*.test.ts
```

### Check specific test case
```bash
npm test -- PatternDetector.test.ts -t "should TRIGGER when input is long AND acceptance is quick"
```

### Time profiling
```typescript
const start = performance.now();
const result = detectPatternF(signals, interactions);
const duration = performance.now() - start;
console.log(`Detection took ${duration.toFixed(2)}ms`);
```

Expected: < 50ms

---

## Phase 1 Completion Checklist

- [ ] PatternDetector.ts compiles without errors
- [ ] InterventionScheduler.ts compiles without errors
- [ ] All PatternDetector tests passing (45+)
- [ ] All InterventionScheduler tests passing (45+)
- [ ] Code coverage > 90%
- [ ] No TypeScript warnings
- [ ] Documentation complete
- [ ] Code review by team/advisor

---

## Next Week: Week 2 - UI Components

Once core logic is tested and validated, move to:
- `Tier1SoftSignal.tsx` - Non-blocking tips
- `Tier2MediumAlert.tsx` - Gentle warnings
- `Tier3HardBarrier.tsx` - Modal with escape hatch
- Integration with existing UI

---

## References

- `PATTERN_F_DETECTION_FRAMEWORK.md` - Theory & design
- `PHASE_5_5_REVISED_ARCHITECTURE.md` - Full architecture
- `ASYNC_INTERVENTION_ARCHITECTURE.md` - Performance considerations
- `ETHICAL_INTERVENTION_DESIGN.md` - UX & ethics

