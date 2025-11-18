# Phase 5.5 Testing Guide

## Quick Start

The Phase 5.5 real-time adaptive MR system is now fully implemented. To test it:

1. **Start Backend**: `npm run dev` in the backend directory
2. **Start Frontend**: `npm run dev` in the frontend directory
3. **Navigate to Chat**: Go to http://localhost:3000/session/[sessionId]

## Test Scenario 1: Pattern F (High-Risk - Ineffective Usage)

**Goal**: Trigger maximum MRs (all 6 should activate)

### Steps:
1. Open chat interface
2. Send: `帮我写一个完整的解决方案` (Ask for complete solution without decomposing)
3. **Expected**:
   - No task decomposition mentioned
   - No verification
   - High AI reliance

4. Send: `再给我下一个完整解决方案` (Ask for another complete solution)
5. **Expected MRs**:
   - ✅ **MR1** (Task Decomposition): "我注意到你直接要求了完整的解决方案..."
   - ✅ **MR3** (Human Agency): "记得明确哪些部分你自己负责..."
   - ✅ **MR11** (Verification): "在使用这个输出前，强烈建议先验证..."
   - ✅ **MR13** (Uncertainty): "注意：以下部分的置信度..."
   - ✅ **MR16** (Skill Degradation): "⚠️ Modal warning about skill degradation"
   - ✅ **MR18** (Over-reliance): "⚠️ Modal warning about over-reliance"

### Expected Behavior:
- Pattern detection: **F** (>80% confidence)
- Display modes: Mix of inline, sidebar, and **modal warnings**
- User must acknowledge modal MRs to continue

---

## Test Scenario 2: Pattern A (Low-Risk - Strategic Decomposition)

**Goal**: Trigger no or minimal MRs

### Steps:
1. Open chat interface
2. Send: `我要做一个项目，先分成几个步骤：第一步分析需求，第二步设计方案，第三步实现...`
   (Break task into steps explicitly)
3. **Expected**:
   - Clear task decomposition
   - Goal clarity demonstrated
   - Strategy mentioned

4. Send AI response and mark as **Verified** (click ✓ Verify button)
5. **Expected**: verificationAttempted = true

6. Send follow-up: `关于第二步，我想自己尝试一下，但需要一些建议...`
   (Show independent work with selective AI help)
7. **Expected MRs**:
   - ✅ **Minimal or none** - Pattern A doesn't trigger interventions
   - If any appear: **MR3** (Human Agency) with "observe" urgency only
   - **No modal warnings**

### Expected Behavior:
- Pattern detection: **A** (>70% confidence)
- Display modes: Mostly **inline** (informational only)
- No blocking modals
- System recognizes high-quality usage

---

## Test Scenario 3: Pattern B (Medium Risk - Iterative Refinement)

**Goal**: Trigger medium-level MRs

### Steps:
1. Open chat interface
2. Send: `帮我做一个方案` (Vague request, no decomposition)
3. **Expected**: No decomposition, medium AI reliance

4. Receive AI response, send: `这个不太对，再调整一下...` (Request modification)
5. **Expected**: iterationCount = 1

6. Send: `还要改，这样更好...` (Request another modification)
7. **Expected MRs**:
   - ✅ **MR1** (Task Decomposition): "suggest breaking task down"
   - ✅ **MR11** (Verification): "mention verifying outputs"
   - ❌ **No enforce-level MRs** (Pattern B shows good iteration)

### Expected Behavior:
- Pattern detection: **B** (>60% confidence)
- Display modes: Mostly **sidebar** (remind urgency)
- No modal warnings
- System encourages verification and decomposition

---

## MR Activation Rules Reference

| MR | Trigger | Urgency | Display | Target |
|---|---------|---------|---------|--------|
| **MR1** | Low decomposition + moderate complexity | remind | sidebar | B, F |
| **MR3** | Strategy mentioned + clear decomposition | observe | inline | A, C |
| **MR11** | No verification attempted | remind | sidebar | B, F |
| **MR13** | Any non-trivial task | observe | inline | All |
| **MR16** | High reliance + low iteration | enforce | **modal** | F, B |
| **MR18** | Extreme reliance + no verification | enforce | **modal** | F |

---

## Display Mode Behaviors

### Inline (💡)
- Appears within conversation
- Subtle, non-intrusive
- User can ignore
- Good for informational messages

### Sidebar (⚠️)
- Visible in right panel
- Scrollable, dismissible
- Gets user attention
- Good for suggestions

### Modal (🛑)
- Full-screen overlay
- Blocks interaction
- Requires acknowledgment
- Critical interventions only

---

## Debugging Tips

### Check Current MCA Status
Open browser console and check:
```javascript
// Pattern estimate
console.log(mcaResult?.pattern);

// Active MRs
console.log(activeMRs);

// Current signals
console.log(mcaResult?.signals);
```

### View Backend Logs
Check server logs for MCA decisions:
```
[MCA:sessionId] Turn 2: Top=F (95.3%), Confidence=42.1%, activeMRCount=6, isHighRiskF=true
```

### Reset Session Analysis
If pattern seems stuck, reset recognizer:
```bash
curl -X POST http://localhost:5001/api/mca/reset/{sessionId}
```

### Check Pattern Probabilities
```bash
curl http://localhost:5001/api/mca/patterns/{sessionId}
```

---

## Expected Performance

| Operation | Duration | Threshold |
|-----------|----------|-----------|
| Signal Detection | <50ms | ✅ |
| Pattern Update | <20ms | ✅ |
| MR Activation | <30ms | ✅ |
| Total Orchestration | <100ms | ✅ |

---

## Troubleshooting

### MRs not appearing
1. ✅ Check that messages have both user and AI content
2. ✅ Verify pattern confidence is > 0.3
3. ✅ Check browser console for errors
4. ✅ Ensure backend is running (/api/mca/orchestrate endpoint)

### Wrong pattern detected
1. ✅ Requires multiple turns (usually 2-3) for confidence
2. ✅ Signal detection may need Chinese/English keyword tuning
3. ✅ Check "Evidence" field in pattern estimate

### Modal MR stuck
1. ✅ Click "I Understand" button to acknowledge
2. ✅ If button doesn't work, check console for JS errors
3. ✅ Try dismissing with "Dismiss" button instead

---

## Test Checklist

### Layer 1: Signal Detection
- [ ] taskDecompositionEvidence varies 0-3 based on keywords
- [ ] verificationAttempted changes when user mentions checking
- [ ] aiRelianceDegree increases with direct help requests
- [ ] reflectionDepth increases with "why/how" questions

### Layer 2: Pattern Recognition
- [ ] Pattern confidence increases with more turns
- [ ] Pattern switches when signals change significantly
- [ ] Pattern F probability increases with risk signals
- [ ] needMoreData flag set to false after ~10 turns

### Layer 3: MR Activation
- [ ] Correct MRs activate for each pattern
- [ ] Display modes match urgency levels
- [ ] Priority sorting works (enforce > remind > observe)
- [ ] Contextual messages are appropriate for pattern

### Frontend Integration
- [ ] Inline MRs appear within conversation
- [ ] Sidebar MRs appear in right panel
- [ ] Modal MRs block interaction
- [ ] Dismissed MRs don't reappear immediately
- [ ] Pattern analysis window still works with MRs

---

## Success Criteria

✅ **Pattern F Test**: All 6 MRs activate with at least 2 modals
✅ **Pattern A Test**: 0-1 MRs activate, no modals
✅ **Pattern B Test**: 2-3 MRs activate, no modals
✅ **All Display Modes**: Inline, sidebar, and modal all render correctly
✅ **Bilingual**: Chinese messages appear correctly (no garbling)
✅ **Performance**: Orchestration completes in <100ms per turn

---

## Next Steps After Testing

1. **Fix Issues**: Adjust signal weights based on testing results
2. **Refine Messages**: Update MR messages based on user feedback
3. **Add Analytics**: Track MR activation and dismissal rates
4. **A/B Testing**: Compare effectiveness of different MR configurations
5. **Production Deployment**: Deploy to production after validation

---

**Testing Date**: [Your date]
**Tester**: [Your name]
**Status**: Ready for testing ✅
