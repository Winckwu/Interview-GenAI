# Pattern F Detection: Hybrid Rule-Based & ML Approach

## Problem Statement
- **Literature Finding**: Pattern F (ineffective use) has N=0 in Study 1 sample
- **Challenge**: Cannot train purely ML-based detector on zero observed instances
- **Goal**: Defensible detection mechanism for both academic rigor and practical deployment

---

## Architecture: Layered Detection Strategy

### Layer 1: Hard Rules (Baseline - No ML Needed)
**Defensibility**: These are theory-driven heuristics from literature, not fabricated

| Rule ID | Trigger Condition | Rationale | Action |
|---------|------------------|-----------|--------|
| F-R1 | Input length > 500 chars AND acceptance time < 10s | Indicates skimming without engagement | Assign low engagement score |
| F-R2 | Zero verification behaviors across 5+ consecutive interactions | No quality assurance pattern | Flag as passive consumer |
| F-R3 | Input→Output ratio < 0.2 AND modification rate = 0% | Accepting output verbatim without critical review | Mark as non-critical |
| F-R4 | Timestamp pattern: all interactions within 2-hour burst, then gap > 7 days | Suggests task-completion mindset (not learning) | Assign temporary flag |
| F-R5 | Reject rate = 0 AND verify rate = 0 AND modify rate = 0 | No engagement signals whatsoever | Strong ineffective use indicator |

**Justification in Paper**:
> "Layer 1 rules are derived from behavioral indicators documented in learning science literature (Zimmerman, 2002; Panadero, 2017) on self-regulated learning. These heuristics do not require external training data and represent theoretically-grounded risk signals."

---

### Layer 2: Observational ML (Trained on Real User Data Only)
**Key Rule**: **Never use synthetic data for training.** Only use:
1. Data from Phase-1 Study interviews (N=30, includes direct observations)
2. Real user interaction logs from Phase-2 pilot (if available)

**Approach**:
```
IF sufficient real data exists:
  - Use Logistic Regression with L1 regularization
  - Features: (Input length, Verification rate, Modification rate, Rejection rate, Time gaps)
  - Output: Confidence score [0, 1] for Pattern F risk
  - Threshold: 0.7 (high specificity, lower sensitivity)

ELSE:
  - Rely on Layer 1 hard rules only
  - Document: "ML model not trained due to insufficient real data"
  - This is honest and defensible
```

**Why This Approach Works**:
- ✅ **No circularity**: Model trains on observed user behavior, not synthetic fantasy data
- ✅ **Academically sound**: Explicit about data limitations
- ✅ **Scalable**: As you collect more real data (Phase-2, Phase-3), model improves
- ✅ **Defensible**: "We use ML where we have sufficient evidence; rules where we don't"

---

### Layer 3: Adaptive Thresholding (Avoid Over-Intervention)
**Problem**: False positives will harm user experience

**Solution**: Introduce confidence-based intervention tiers

| Pattern F Confidence | Intervention Type | User Sees |
|---------------------|------------------|-----------|
| 0.0 - 0.4 | None | (no UI change) |
| 0.4 - 0.6 | Soft signal (MR13) | "📊 Low engagement detected. Consider..." |
| 0.6 - 0.8 | Medium signal (MR18) | "⚠️ We notice passive use pattern" |
| 0.8+ | Hard barrier (only if F-R5 true) | "🚨 This pattern suggests..." + "Continue Anyway" button |

**Key Design Rule**:
```
Hard barriers (🚨) ONLY if:
  - Confidence >= 0.8 AND
  - At least 2 Layer-1 rules triggered

Otherwise: use soft signals (MR13, MR18)
```

---

## Implementation Roadmap

### Phase-1 (Now)
- ✅ Implement Layer 1 rules (no external dependencies)
- Define 5-7 hard rules with justification
- Code as simple if/else in `PatternDetector.ts`

### Phase-2 (Post-Pilot)
- Collect real user data from 20-30 pilot users
- Re-evaluate: do any users actually show Pattern F signs?
- If yes: train Layer 2 logistic regression
- If no: document "Pattern F rare in practice; Layer 1 sufficient"

### Phase-3 (Full Study)
- Use Layer 2 model (if trained) as secondary confidence check
- Measure: compliance rate, false positive rate
- Iterate threshold based on real outcomes

---

## Expected Exam Q&A

**Q**: "How can you detect a pattern you never observed (N=0)?"

**A**:
> "We use a hybrid approach. Layer 1 consists of theory-driven heuristics from self-regulated learning literature—these don't require prior observations. Layer 2, ML-based detection, only engages if we collect sufficient real user data. In Phase-1, we deliberately rely on Layer 1 to avoid the circularity problem. This is transparent and defensible."

**Q**: "Won't hard rules be too rigid?"

**A**:
> "Rules are conservative thresholds (e.g., zero engagement across 5+ interactions). They're designed to have high specificity (low false positives) rather than high sensitivity. We also use confidence tiers—soft warnings appear before hard barriers."

**Q**: "What if Pattern F is actually rare?"

**A**:
> "That's a valid finding. Our framework handles this: if Pattern F proves rare, Layer 1 rules suffice, and we document that in the Discussion. The system remains effective."

---

## Code Structure (Phase-1 Implementation)

```typescript
// PatternDetector.ts

interface PatternFSignals {
  rule_F1_passed: boolean;  // Input length + speed
  rule_F2_passed: boolean;  // Verify behavior gap
  rule_F3_passed: boolean;  // Input/output ratio
  rule_F4_passed: boolean;  // Temporal pattern
  rule_F5_passed: boolean;  // Complete passivity

  triggered_count: number;  // How many rules triggered
  confidence: 'low' | 'medium' | 'high';

  intervention_tier: 'none' | 'soft' | 'medium' | 'hard';
}

export function detectPatternF(
  userInteractions: Interaction[],
  options: {
    useMLModel?: boolean;  // Only if trained on real data
    mlConfidence?: number;
  }
): PatternFSignals {

  // Layer 1: Hard rules (always compute)
  const rule_F1 = checkInputLengthSpeed(userInteractions);
  const rule_F2 = checkVerificationGap(userInteractions);
  const rule_F3 = checkInputOutputRatio(userInteractions);
  const rule_F4 = checkTemporalPattern(userInteractions);
  const rule_F5 = checkCompletePassivity(userInteractions);

  const triggeredCount = [rule_F1, rule_F2, rule_F3, rule_F4, rule_F5]
    .filter(Boolean).length;

  // Layer 2: ML model (only if available and trained on real data)
  let mlConfidence = 0;
  if (options.useMLModel && mlConfidence) {
    mlConfidence = predictPatternF_ML(userInteractions);
  }

  // Layer 3: Determine confidence and intervention tier
  const baseConfidence = triggeredCount / 5;
  const finalConfidence = mlConfidence > 0
    ? (baseConfidence * 0.5 + mlConfidence * 0.5)
    : baseConfidence;

  let interventionTier = 'none';
  if (finalConfidence >= 0.8 && triggeredCount >= 2) {
    interventionTier = 'hard';
  } else if (finalConfidence >= 0.6) {
    interventionTier = 'medium';
  } else if (finalConfidence >= 0.4) {
    interventionTier = 'soft';
  }

  return {
    rule_F1_passed: rule_F1,
    rule_F2_passed: rule_F2,
    rule_F3_passed: rule_F3,
    rule_F4_passed: rule_F4,
    rule_F5_passed: rule_F5,
    triggered_count: triggeredCount,
    confidence: finalConfidence >= 0.7 ? 'high' : finalConfidence >= 0.4 ? 'medium' : 'low',
    intervention_tier: interventionTier as any,
  };
}
```

---

## Key Advantages of This Approach

1. **Academically Defensible**: No synthetic data → no circularity claim
2. **Transparent**: Explicit about what's rule-based vs ML-based
3. **Scalable**: Improves as data grows, doesn't degrade
4. **User-Friendly**: Soft signals before hard barriers
5. **Measurable**: Each rule can be validated independently
6. **Honest**: If Pattern F is rare, the framework admits it

---

## Metrics to Track

```typescript
interface PatternFMetrics {
  // Detection accuracy (if ground truth available)
  precision: number;  // Of flagged users, how many really show Pattern F
  recall: number;     // Of actual Pattern F users, how many detected

  // User experience
  false_positive_rate: number;
  user_override_rate: number;  // Users clicking "Continue Anyway"

  // Distribution
  prevalence: number;  // % of users flagged as Pattern F
  rule_trigger_distribution: Record<string, number>;  // Which rules trigger most often
}
```

Use these to refine thresholds in Phase-2 and Phase-3.

