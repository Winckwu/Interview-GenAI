# Real Course Interaction Data Integration Analysis

## A Data-Driven Approach to Calibrating Metacognitive Collaboration Architecture

**Document Version:** 2.0
**Date:** 2024-11-24
**Author:** MCA System Research Team

---

## Abstract

This document presents a comprehensive analysis of integrating real course interaction data into the Metacognitive Collaboration Architecture (MCA) system. We analyzed **14,197 conversation messages from 378 unique users** across 11 courses, using **LLM-as-a-Judge semantic analysis** (Claude Sonnet 4.5) to annotate metacognitive behaviors.

**Key Findings:**
- **39.2% Pattern F** (vs 54.8% with keyword method) - 15.6pp reduction in false positives
- **92.1% Bootstrap accuracy** (±3.2%) - significant improvement from 72.73%
- **98.9% Pattern F Recall** - critical for at-risk user detection
- Detected verification behaviors (E1) that keyword methods completely missed

---

## 1. Introduction

### 1.1 Background

The MCA system employs 19 Metacognitive Regulation (MR) mechanisms to guide users toward healthier AI collaboration patterns. The system classifies users into six patterns (A-F) based on 12-dimensional behavioral metrics.

### 1.2 The Keyword Detection Problem

Initial keyword-based detection had critical limitations:

| Issue | Example | Consequence |
|-------|---------|-------------|
| **Context-blind** | "actually" counted as evaluation | False positives |
| **Semantic variations missed** | "limits should be swapped" | False negatives for E1 |
| **Implicit behaviors missed** | "I think you misunderstand me" | Missing corrections |

**Result:** 54.8% Pattern F rate was **overestimated** due to missed verification behaviors.

### 1.3 Solution: LLM-as-a-Judge

We implemented direct LLM semantic analysis using Claude Sonnet 4.5 to annotate all 378 user conversations, resulting in:
- More accurate pattern classification
- Detection of implicit metacognitive behaviors
- Identification of AI correction instances

---

## 2. LLM Annotation Methodology

### 2.1 Annotation Process

Each user's complete conversation history was analyzed using the following 12-dimensional scoring framework:

**Planning (P1-P4):**
| Dimension | Scale | Description |
|-----------|-------|-------------|
| P1 | 0-3 | Task decomposition / problem structuring |
| P2 | 0-3 | Goal clarity / question quality |
| P3 | 0-3 | Self-testing / practice requests |
| P4 | 0-3 | Resource planning / study strategy |

**Monitoring (M1-M3):**
| Dimension | Scale | Description |
|-----------|-------|-------------|
| M1 | 0-3 | Iteration / revision behavior |
| M2 | 0-3 | Confusion acknowledgment / "I don't understand" |
| M3 | 0-3 | Progress tracking / persistence |

**Evaluation (E1-E3):**
| Dimension | Scale | Description |
|-----------|-------|-------------|
| **E1** | 0-3 | **Verification / Correcting AI errors** (Critical!) |
| E2 | 0-3 | Critical evaluation / questioning AI reasoning |
| E3 | 0-3 | Self-assessment / reflection |

**Regulation (R1-R2):**
| Dimension | Scale | Description |
|-----------|-------|-------------|
| R1 | 0-3 | Strategy adjustment / method comparison |
| R2 | 0-3 | Learning transfer / connection to other topics |

### 2.2 Pattern Classification

| Pattern | Total Score | Key Characteristics |
|---------|-------------|---------------------|
| A | 28+ | Strategic planning, high engagement |
| B | 18-27 | Iterative self-directed learning |
| C | 14-17 | Moderate engagement, conceptual questions |
| D | 24+ with E1≥2 | Critical evaluation, corrects AI |
| E | Pedagogical | Teaching AI, reflection |
| F | ≤13 | Passive, answer-seeking, no verification |

---

## 3. LLM Classification Examples (Key Section)

### 3.1 Example 1: Pattern D - Active Error Correction

**User ID:** `01bcc56e-7b02-472a-acde-6a56da2eb44a`
**Messages:** 68 | **LLM Pattern:** D | **Keyword Pattern:** C

**Conversation Excerpts:**
```
User: "actually, the upper and lower limits of the integral should be swapped!"
User: "nonono swap the top and bottom limits"
User: "why do you want to swap the integrals by doing the negative sign?"
User: "can you check ur answer again"
```

**LLM Scoring:**
| Dimension | Score | Evidence |
|-----------|-------|----------|
| E1 | **3** | Directly corrects AI's integral limits |
| E2 | **3** | "can you check ur answer again" - demands verification |
| P2 | **3** | Multiple deep "why" questions |
| M2 | 2 | Persistent follow-up |

**Keyword Method Failure:**
- E1 = 0 (no "verify" or "check" keywords matched)
- Pattern = C (moderate)

**LLM Correctly Identified:**
- E1 = 3 (semantic understanding of correction)
- Pattern = D (critical evaluation)

---

### 3.2 Example 2: Pattern B - High Engagement with AI Correction

**User ID:** `dade7dad-6fbe-47c5-b691-de2adbd45d83`
**Messages:** 119 | **LLM Pattern:** B | **Keyword Pattern:** C

**Conversation Excerpts:**
```
User: "you forgot that central limit theorem was also taught in week 6"
User: "im struggling with central limit theorem and i dont know how to identify a CLT theorem"
User: "why havent u continued"
User: "no i dont know how to do"
```

**LLM Scoring:**
| Dimension | Score | Evidence |
|-----------|-------|----------|
| E1 | **3** | "you forgot that CLT was also taught" - CORRECTS AI! |
| M2 | **3** | "im struggling", "i dont know" - honest confusion |
| M3 | 2 | "why havent u continued" - persistent |
| P3 | 2 | Requests specific practice problems |

**Key Insight:** User demonstrates:
1. **Correction of AI** (E1=3) - AI forgot to mention CLT
2. **Honest metacognition** (M2=3) - admits confusion
3. **Persistence** (M3=2) - 119 messages of engagement

---

### 3.3 Example 3: Pattern D - Critical External Verification

**User ID:** `257f675a-0559-4c93-abb1-d9b7f56765a4`
**Messages:** 41 | **LLM Pattern:** D | **Keyword Pattern:** C

**Conversation Excerpts:**
```
User: "i feel the information is wrong"
User: "are you scamming me?"
User: "but from the notes the o-sites splitting is never mention"
User: "online also does not mention of o-sites sharing"
User: "it is wrong from all the sources"
```

**LLM Scoring:**
| Dimension | Score | Evidence |
|-----------|-------|----------|
| E1 | **3** | Cross-references with notes AND online sources |
| E2 | **3** | "are you scamming me?" - strong criticism |
| E3 | **3** | "it is wrong from all the sources" - synthesis |
| M1 | 3 | Persistent questioning despite AI responses |

**This is the BEST example of Pattern D:**
- External source verification (notes, online)
- Explicit error detection
- Does NOT accept AI answer blindly

---

### 3.4 Example 4: Pattern B - Shows Own Reasoning

**User ID:** `e497f98c-15b6-40e6-ba67-3f22aee969ba`
**Messages:** 19 | **LLM Pattern:** B | **Keyword Pattern:** C

**Conversation Excerpts:**
```
User: "Why shouldn't it be 3n^2 pi /4 = pi/4 + 2k pi? My understanding is that z itself has already raised 1+i to power n."
User: "I think you misunderstand me. Question say z = (1+i)^n. So shouldn't z^n be (1+i)^(n*n)?"
User: "I actually find it confusing whether to use disc method or shell method"
User: "So during exam, what are some tell tale signs that my answer for this is wrong"
```

**LLM Scoring:**
| Dimension | Score | Evidence |
|-----------|-------|----------|
| E1 | **3** | "I think you misunderstand me" - CORRECTS AI interpretation |
| P2 | **3** | "My understanding is that..." - shows reasoning process |
| E3 | **2** | Honest about confusion |
| R1 | **2** | "what are tell tale signs" - meta-learning |

**Key Finding:** User explicitly shows their reasoning ("My understanding is...") and corrects AI when it misinterprets the question.

---

### 3.5 Example 5: Pattern F - Passive Answer-Seeking

**User ID:** `f43e3235-bb89-4760-ade6-dcf8fddecf99`
**Messages:** 11 | **LLM Pattern:** F

**Conversation Excerpts:**
```
User: "give answers of my assignment"
User: "give me the answer"
User: "give me the answer"
User: "calculate"
User: "calculate"
```

**LLM Scoring:**
| Dimension | Score | Evidence |
|-----------|-------|----------|
| P1 | 0 | No task decomposition |
| E1 | **0** | Zero verification |
| E2 | 0 | No critical evaluation |
| M1 | 0 | No iteration |
| Total | **3** | Clearly passive |

**Both methods agree:** This user shows classic Pattern F behavior - pure answer extraction.

---

### 3.6 Example 6: Pattern B - Self-Directed Testing

**User ID:** `f9a76a92-3cfb-4231-9374-bb85a69db0a3`
**Messages:** 41 | **LLM Pattern:** B

**Conversation Excerpts:**
```
User: "Test my understanding on solving Ax = b problem"
User: "i would like to verify with values"
User: "thanks"
```

**LLM Scoring:**
| Dimension | Score | Evidence |
|-----------|-------|----------|
| P3 | **3** | "Test my understanding" - SELF-TESTING! |
| E1 | **2** | "verify with values" - active verification |
| R2 | 2 | Seeks deeper understanding |

**Key Finding:** User actively requests testing - a clear sign of self-directed learning.

---

### 3.7 Example 7: Pattern C - Metacognitive Awareness

**User ID:** `e808c425-a941-4cdd-a08a-ce1c1c9ba1f0`
**Messages:** 10 | **LLM Pattern:** C

**Conversation Excerpts:**
```
User: "How do I know if I have a firm grasp on limits?"
User: "Can we go through the self assessment checklist step by step"
User: "Do we need l'hopital's rule in limits?"
```

**LLM Scoring:**
| Dimension | Score | Evidence |
|-----------|-------|----------|
| E3 | **3** | "How do I know if I have a firm grasp" - META-COGNITION! |
| P3 | **2** | Requests self-assessment checklist |
| P2 | 2 | Good conceptual questions |

**Key Finding:** User asks how to know if they understand - this is textbook metacognition!

---

## 4. Results Summary

### 4.1 Pattern Distribution Comparison

| Pattern | Keyword Method | LLM Method | Change |
|---------|---------------|------------|--------|
| A | 0 (0.0%) | 0 (0.0%) | - |
| B | 2 (0.5%) | **34 (9.0%)** | +8.5pp |
| C | 169 (44.7%) | **186 (49.2%)** | +4.5pp |
| D | 0 (0.0%) | **9 (2.4%)** | +2.4pp |
| E | 0 (0.0%) | 1 (0.3%) | +0.3pp |
| **F** | **207 (54.8%)** | **148 (39.2%)** | **-15.6pp** |

### 4.2 Key Finding: Pattern F Overestimation

```
关键词方法 Pattern F: 54.8%
LLM语义分析 Pattern F: 39.2%
──────────────────────────────
差异: -15.6 个百分点
```

**Why the difference?**
- Keyword method missed E1 (verification) behaviors
- Users correcting AI were classified as C instead of D
- Implicit metacognition (M2) was not detected

### 4.3 E1 (Verification) Detection Gap

| Detection Method | E1 Average | E1=3 Count |
|-----------------|------------|------------|
| Keyword | **0.00** | 0 |
| LLM | **0.82** | 47 |

**47 users had E1=3** (actively corrected AI) that keyword method completely missed!

---

## 5. Model Training Results

### 5.1 Three-Round Bootstrap Validation

| Model | Mean Accuracy | Std Dev | Pattern F Recall |
|-------|--------------|---------|------------------|
| **SVM (RBF, C=10)** | **92.1%** | ±3.2% | **98.9%** |
| Random Forest | 90.8% | ±1.9% | 95.4% |
| Gradient Boosting | 90.4% | ±1.2% | 92.1% |

### 5.2 Bootstrap Details (SVM)

```
Round 1: 88.2%
Round 2: 96.1%
Round 3: 92.1%
Mean:    92.1% (±3.2%)
Pattern F Recall: 98.9% (±1.5%)
```

### 5.3 Multi-Model Comparison

| Model | Test Acc | CV Acc | F Recall | Macro F1 |
|-------|----------|--------|----------|----------|
| AdaBoost | 90.8% | 84.6±7.6% | 90.3% | 0.6847 |
| Gradient Boosting | 89.5% | 89.4±5.0% | 87.1% | 0.7093 |
| **SVM (RBF)** | 88.2% | 89.1±7.7% | **96.8%** | 0.6427 |
| Random Forest | 88.2% | 89.9±8.4% | 90.3% | 0.6503 |
| KNN (k=5) | 86.8% | 87.8±5.6% | 96.8% | 0.5549 |

### 5.4 Model Selection Rationale

**Selected: SVM (RBF Kernel, C=10)**

| Criterion | Value | Importance |
|-----------|-------|------------|
| Bootstrap Accuracy | 92.1% | High |
| **Pattern F Recall** | **98.9%** | **Critical** |
| CV Stability | ±3.2% | Good |
| Training Time | 0.014s | Fast |

Pattern F recall is the critical metric because:
1. Pattern F users are at highest risk for skill degradation
2. Missing a Pattern F user has higher cost than false positive
3. 98.9% recall means we catch almost all at-risk users

---

## 6. Historical Comparison

### 6.1 Version History

| Version | Date | Method | Accuracy | Pattern F Recall |
|---------|------|--------|----------|------------------|
| v1.0 | 2024-11-18 | Keyword | 72.73% | 100% (but overestimated F) |
| **v2.0** | **2024-11-24** | **LLM** | **92.1%** | **98.9%** |

### 6.2 Improvement Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Accuracy | 72.73% | 92.1% | **+19.4pp** |
| Pattern F Detection | Overestimated | Accurate | **-15.6pp false positives** |
| E1 Detection | 0 users | 47 users | **Semantic detection** |
| Verification Behaviors | Missed | Captured | **Full detection** |

---

## 7. Implications

### 7.1 For AI-Assisted Learning

1. **~40% of users still at risk** (Pattern F) - intervention needed
2. **~10% show self-directed learning** (Pattern B) - positive behaviors exist
3. **Verification behaviors exist** but were previously undetected
4. **AI correction happens** - students do push back when AI is wrong

### 7.2 For System Design

1. **Update intervention thresholds** based on accurate data
2. **Reward verification behaviors** in system feedback
3. **Detect implicit corrections** using semantic analysis
4. **Track E1 dimension** specifically for at-risk detection

---

## 8. Files and Reproducibility

### 8.1 LLM Annotation Files

```
backend/src/ml/
├── claude_annotations_batch0.json      # Users 1-20 (detailed scores)
├── claude_annotations_batch1.json      # Users 21-40
├── ...
├── claude_annotations_batch12.json     # Users 236-254
├── claude_annotations_batch13_to_18.json  # Users 255-378
├── claude_annotations_summary.json     # Final statistics
└── llm_annotated_training_data.csv     # Training format
```

### 8.2 Training and Validation Scripts

```
backend/src/ml/
├── convert_llm_annotations_to_training.py  # JSON → CSV
├── run_llm_model_comparison.py             # Multi-model + Bootstrap
├── train_svm_llm_data.py                   # Train final model
└── llm_model_comparison_results.json       # Full results
```

### 8.3 Model Files

```
backend/src/ml/models/
├── svm_model.pkl              # Current production (LLM-trained)
├── svm_scaler.pkl             # StandardScaler
├── svm_model_keyword_based.pkl # Old keyword model (backup)
└── pattern_mapping.json        # Pattern ID mapping
```

### 8.4 Reproducibility

```bash
# 1. Convert LLM annotations to training format
python3 convert_llm_annotations_to_training.py

# 2. Run multi-model comparison with Bootstrap
python3 run_llm_model_comparison.py

# 3. Train final SVM model
python3 train_svm_llm_data.py

# 4. Update production model
cp svm_llm_model.pkl models/svm_model.pkl
cp svm_llm_scaler.pkl models/svm_scaler.pkl
```

---

## 9. Conclusion

This analysis demonstrates the critical importance of **semantic understanding** in metacognitive behavior detection:

1. **Keyword methods overestimate Pattern F** by 15.6 percentage points
2. **LLM semantic analysis** detects verification and correction behaviors
3. **47 users actively corrected AI** - previously undetected
4. **92.1% accuracy** achieved with LLM-annotated training data
5. **98.9% Pattern F recall** ensures at-risk users are identified

The LLM-as-a-Judge methodology provides a more accurate picture of student AI collaboration patterns, enabling better-calibrated interventions.

---

**Document End**
**Version:** 2.0 | **Date:** 2024-11-24 | **Method:** LLM-as-a-Judge (Claude Sonnet 4.5)
