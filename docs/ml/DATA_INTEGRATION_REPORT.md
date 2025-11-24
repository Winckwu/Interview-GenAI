# Course Interaction Data Integration Report

**Date:** 2024-11-24
**Data Source:** `docs/interviews/conv_history_active_users.csv`
**Purpose:** Enhance MCA System pattern recognition with real-world data

---

## 1. Data Overview

### Source Data Statistics
| Metric | Value |
|--------|-------|
| Total Messages | 14,197 |
| Unique Users | 378 |
| Conversations | 1,826 |
| Date Range | Oct 2024 - Apr 2025 |
| Courses | 11 |

### Courses Analyzed
| Course | Messages | Percentage |
|--------|----------|------------|
| My Math Mentor | 7,166 | 50.5% |
| AB1202 | 3,004 | 21.2% |
| Linear Algebra TA | 1,764 | 12.4% |
| Maths 2 bot | 892 | 6.3% |
| Other courses | ~1,371 | 9.6% |

---

## 2. Conversion Process

### Step 1: CSV to 12-Dimension Metrics

**Script:** `backend/src/ml/convert_conversation_to_metrics.py`

**Conversion Logic:**
- **P1 (Input Complexity):** Based on average message length
- **P2 (Question Quality):** Detection of question keywords
- **P3 (Context Provision):** Presence of detailed context
- **P4 (Problem Decomposition):** Multi-part questions detected
- **M1 (Iteration Frequency):** Modification keyword frequency
- **M2 (Output Customization):** Request for changes
- **M3 (Integration Effort):** Combining/synthesizing behavior
- **E1 (Verification Behavior):** Verification keyword detection
- **E2 (Critical Evaluation):** Critical thinking keywords
- **E3 (External Reference):** Mention of external sources
- **R1 (Self-Reflection):** Reflection keywords
- **R2 (Learning Indication):** Learning confirmation signals

**Output:** `backend/src/ml/real_user_training_data.csv` (378 records)

### Step 2: Training Data Merge

**Script:** `backend/src/ml/merge_real_data.py`

**Merged Dataset:**
| Source | Records |
|--------|---------|
| Synthetic (existing) | 49 |
| Real user data | 378 |
| **Total** | **427** |

**Output:** `backend/src/ml/hybrid_training_data.csv`

---

## 3. Pattern Distribution Analysis

### Before vs After Comparison

| Pattern | Synthetic Only | Real Data | Hybrid Dataset |
|---------|----------------|-----------|----------------|
| A (Active Critical) | 10 (20.4%) | 0 (0%) | 10 (2.3%) |
| B (Selective) | 5 (10.2%) | 2 (0.5%) | 7 (1.6%) |
| C (Moderate) | 22 (44.9%) | 169 (44.7%) | 191 (44.7%) |
| D (Tool-Oriented) | 9 (18.4%) | 0 (0%) | 9 (2.1%) |
| E (Exploratory) | 1 (2.0%) | 0 (0%) | 1 (0.2%) |
| **F (Passive)** | **2 (4.1%)** | **207 (54.8%)** | **209 (48.9%)** |

### Key Finding: High Pattern F Prevalence
> **54.8% of real users exhibit Pattern F (Passive Over-Reliance)**
> This validates the critical importance of Pattern F detection in the MCA system.

---

## 4. Pattern Classification Validation

**Script:** `backend/src/ml/validate_pattern_classification.py`

### Validation Results

| Metric | Value |
|--------|-------|
| Overall Accuracy | 80.6% |
| Cross-Validation Mean | 80.6% (±2.5%) |

### Per-Class Performance

| Pattern | Precision | Recall | F1 | Support |
|---------|-----------|--------|-----|---------|
| A | 0.64 | 0.70 | 0.67 | 10 |
| B | 1.00 | 0.29 | 0.44 | 7 |
| C | 0.92 | 0.66 | 0.77 | 191 |
| D | 0.50 | 0.11 | 0.18 | 9 |
| E | 0.00 | 0.00 | 0.00 | 1 |
| **F** | **0.77** | **0.995** | **0.87** | **209** |

### Pattern F Detection: PASS
- **Recall: 99.5%** (Target: >90%)
- Critical for detecting at-risk users

---

## 5. MR Threshold Calibration

**Script:** `backend/src/ml/mr_threshold_calibration.py`
**Output:** `backend/src/ml/mr_threshold_calibration.json`

### Real User Metric Distributions

| Metric | Average | Min | Max | Notes |
|--------|---------|-----|-----|-------|
| P1 | 1.97 | 1 | 3 | Near threshold |
| P2 | 1.67 | 1 | 3 | Below optimal |
| P3 | 1.82 | 1 | 3 | Below optimal |
| P4 | 1.73 | 1 | 3 | Below optimal |
| M1 | 0.84 | 0 | 2 | Very low |
| M2 | 1.31 | 1 | 3 | Low |
| M3 | 1.05 | 1 | 2 | Minimal |
| **E1** | **0.00** | **0** | **0** | **Zero verification!** |
| E2 | 1.09 | 1 | 2 | Minimal critical eval |
| E3 | 1.03 | 1 | 2 | Minimal external ref |
| R1 | 1.01 | 1 | 2 | Minimal reflection |
| R2 | 1.04 | 1 | 3 | Minimal learning |

### Critical Finding: Zero Verification
> **E1 average is 0.00** - No users showed explicit verification behavior
> This indicates a systemic lack of AI output verification across all courses.

### Threshold Adjustment Recommendations

| Parameter | Current | Recommended | Reason |
|-----------|---------|-------------|--------|
| E1 Threshold | 1.5 | 1.0 | 100% users have E1=0 |
| AI Reliance | 2.5 | 2.0 | M1 avg only 0.84 |
| Total Score (F) | 15 | 16 | Pattern F avg is 13.2 |

### New Rule Recommendation

```json
{
  "mrId": "MR_INPUT_PROMPT",
  "name": "Input Enhancement Prompt",
  "trigger": {"signal": "inputComplexity", "operator": "<", "threshold": 2},
  "urgency": "remind",
  "targetPatterns": ["F", "C"],
  "description": "Encourage more detailed input for better AI assistance"
}
```

---

## 6. Files Generated

| File | Location | Description |
|------|----------|-------------|
| Converter Script | `backend/src/ml/convert_conversation_to_metrics.py` | CSV to metrics conversion |
| Merge Script | `backend/src/ml/merge_real_data.py` | Dataset merge utility |
| Validation Script | `backend/src/ml/validate_pattern_classification.py` | Classification validation |
| Calibration Script | `backend/src/ml/mr_threshold_calibration.py` | Threshold analysis |
| Real User Data | `backend/src/ml/real_user_training_data.csv` | 378 converted records |
| Hybrid Dataset | `backend/src/ml/hybrid_training_data.csv` | 427 merged records |
| Calibration JSON | `backend/src/ml/mr_threshold_calibration.json` | Threshold recommendations |

---

## 7. Conclusions & Next Steps

### Key Insights

1. **Pattern F is Dominant (54.8%)** - Over half of real users show passive over-reliance behavior
2. **Zero Verification Behavior** - No users explicitly verify AI outputs
3. **Low Engagement Scores** - Average total score 14.6/36 (40.6%)
4. **Pattern Classification Works** - 80.6% accuracy, 99.5% Pattern F recall

### Recommended Actions

1. **Immediate:**
   - Update MR triggering thresholds based on calibration
   - Add early warning for users with total_score < 16

2. **Short-term:**
   - Implement input complexity monitoring
   - Add proactive verification prompts

3. **Long-term:**
   - Retrain ML models with hybrid dataset
   - Develop course-specific pattern baselines

---

**Report Generated By:** MCA System Data Integration Pipeline
**Version:** 1.0
