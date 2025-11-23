# Metacognitive Collaborative Agent (MCA) System
## A Research-Driven AI Interview Analysis Platform

---

# PRESENTATION OUTLINE

1. Introduction & Motivation
2. Research Methodology
3. Key Research Findings
4. System Architecture
5. Core Features & MR Components
6. Pattern Recognition System
7. Technical Implementation
8. Validation & Results
9. Demo & Use Cases
10. Conclusions & Future Work

---

# SLIDE 1: Title

## Metacognitive Collaborative Agent (MCA) System
### Bridging the Gap Between Human Cognition and AI Collaboration

**Presenter**: [Your Name]
**Advisor**: [Advisor Name]
**Date**: November 2025

---

# SLIDE 2: Problem Statement

## The AI Collaboration Crisis

### Three Critical Challenges Users Face:

| Challenge | Description | Evidence |
|-----------|-------------|----------|
| **Agency Erosion** | Users become passive approvers rather than active decision-makers | 55% (27/49 users) |
| **Trust Miscalibration** | Users either over-trust (risky) or under-trust (inefficient) AI | 84% (41/49 users) |
| **Metacognitive Blindness** | Users lack awareness of their own AI usage patterns | 67% (33/49 users) |

### Research Question:
> "How can we design an AI collaboration system that preserves human agency while enabling effective AI utilization?"

---

# SLIDE 3: Research Methodology

## Empirical Foundation: Deep Expert Interviews

### Study Design:
- **Sample Size**: 49 domain experts
- **Duration**: 45-93 minutes per interview
- **Disciplines**: 10+ professional domains
- **Method**: Grounded Theory Analysis

### Participant Distribution:

| Domain | Count | Examples |
|--------|-------|----------|
| Academia | 8 | PhD researchers (Marketing, CS, Medical) |
| Professional | 15 | Lawyers, Accountants, Financial Analysts |
| Creative | 12 | Designers, Writers, Content Creators |
| Technical | 14 | Software Engineers, Data Scientists |

### Analysis Process:
```
Open Coding → Axial Coding → Selective Coding → Pattern Identification
```

---

# SLIDE 4: Key Research Findings

## User Frustrations & Design Opportunities

### Top 6 Pain Points Identified:

| Rank | Frustration | Users Affected | Solution |
|------|-------------|----------------|----------|
| 1 | Trust Uncertainty | 84% (41/49) | MR9: Dynamic Trust Calibration |
| 2 | Process Opacity | 76% (37/49) | MR2: Process Transparency |
| 3 | Strategy Unknown | 67% (33/49) | MR15: Metacognitive Strategy Guide |
| 4 | Agency Erosion | 55% (27/49) | MR3: Human Agency Control |
| 5 | Knowledge Gap | 39% (19/49) | MR19: Capability Assessment |
| 6 | Iteration Friction | 33% (16/49) | MR5: Low-Cost Iteration |

### Key Insight:
> "84% of identified user frustrations are addressed by our MR component design"

---

# SLIDE 5: User Behavior Patterns

## Six Distinct AI Usage Patterns (A-F)

### Pattern Distribution from Research:

| Pattern | Name | Users | Risk Level |
|---------|------|-------|------------|
| **A** | Strategic Decomposition & Control | 20.4% | LOW |
| **B** | Iterative Optimization & Calibration | 10.2% | LOW |
| **C** | Adaptive Adjustment | 44.9% | MEDIUM |
| **D** | Deep Verification & Criticism | 18.4% | LOW |
| **E** | Teaching & Learning | 2.0% | MEDIUM |
| **F** | Passive Over-Reliance | 4.1% | **CRITICAL** |

### Critical Finding:
> Pattern F users (4.1%) represent the highest risk - uncritical acceptance of AI outputs requires immediate intervention

---

# SLIDE 6: System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  React   │ │ TypeScript│ │  Zustand │ │  19 MR Components │   │
│  │   18     │ │  Strict  │ │  Stores  │ │   (Modular UI)    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Express  │ │  Prisma  │ │PostgreSQL│ │  Core Services    │   │
│  │  Node.js │ │   ORM    │ │    DB    │ │  (Pattern, Trust) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      ML SERVICE                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐    │
│  │  Python  │ │ FastAPI  │ │  Pattern Recognition Engine  │    │
│  │  3.9+    │ │   ML     │ │  (XGBoost, SVM Ensemble)     │    │
│  └──────────┘ └──────────┘ └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

# SLIDE 7: Technology Stack

## Complete Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | Component-based UI |
| TypeScript (Strict) | Type safety |
| Vite | Fast development build |
| Zustand | Lightweight state management |
| Recharts | Data visualization |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime environment |
| Express | Web framework |
| Prisma | Database ORM |
| PostgreSQL | Primary database |
| JWT | Authentication |
| Winston | Logging |

### ML Service
| Technology | Purpose |
|------------|---------|
| Python 3.9+ | ML runtime |
| scikit-learn | Pattern classification |
| XGBoost | Ensemble learning |
| FastAPI | ML API service |

---

# SLIDE 8: 19 MR Components Overview

## Metacognitive Regulation (MR) Framework

### Four Design Categories:

#### 1. Planning Enhancement (MR1-4)
| Component | Function |
|-----------|----------|
| MR1 | Task Decomposition Scaffold |
| MR2 | Process Transparency |
| MR3 | Human Agency Control |
| MR4 | Role Definition Guidance |

#### 2. Iterative Learning (MR5-7)
| Component | Function |
|-----------|----------|
| MR5 | Low-Cost Iteration |
| MR6 | Cross-Model Experimentation |
| MR7 | Failure Tolerance Learning |

#### 3. Task Recognition & Trust (MR8-12)
| Component | Function |
|-----------|----------|
| MR8 | Task Characteristic Recognition |
| MR9 | Dynamic Trust Calibration |
| MR10 | Cost-Benefit Analysis |
| MR11 | Integrated Verification |
| MR12 | Critical Thinking Scaffolding |

#### 4. Metacognitive Awareness (MR13-19)
| Component | Function |
|-----------|----------|
| MR13 | Transparent Uncertainty |
| MR14 | Guided Reflection Mechanism |
| MR15 | Metacognitive Strategy Guide |
| MR16 | Skill Atrophy Prevention |
| MR17 | Learning Process Visualization |
| MR18 | Over-Reliance Warning |
| MR19 | Metacognitive Capability Assessment |

---

# SLIDE 9: MR3 Human Agency Control (Deep Dive)

## Preserving User Autonomy

### Problem Addressed:
> "55% of users fear AI over-intervention erodes their autonomy"

### Solution: Three-Level Intervention Control

| Level | Behavior | Use Case |
|-------|----------|----------|
| **Passive** | Hide auto-recommendations | Expert users, sensitive tasks |
| **Suggestive** | Show max 3 recommendations (default) | Normal usage |
| **Proactive** | Show all recommendations | Beginners, learning mode |

### Key Features:
- Explicit consent mechanism for AI suggestions
- "Continue without AI" option at any point
- Session pause functionality
- Human-only version saving (checkpoints)
- Manual override indicator with reset option

### Design Principle:
> "AI as tool, not replacement - human-led decision-making"

---

# SLIDE 10: MR11 Integrated Verification (Deep Dive)

## One-Click Verification System

### Problem Addressed:
> "84% of users uncertain whether to trust AI outputs"

### Verification Types:

| Type | Function | Example |
|------|----------|---------|
| Code | Syntax check, security scan | Python code validation |
| Math | Equation verification | Formula correctness |
| Citation | Source accuracy check | Academic reference validation |
| Fact | Factual accuracy verification | Claim verification |
| Logic | Reasoning consistency | Argument structure check |

### User Interface:
- Traffic light indicators (Green/Yellow/Red)
- Detailed verification reports
- Historical verification tracking
- Export verification results

---

# SLIDE 11: Pattern Recognition Engine

## Machine Learning Architecture

### Feature Extraction (12 Features, 4 Dimensions):

```
┌─────────────────────────────────────────────────────────┐
│  PLANNING (P1-P4)           │  MONITORING (M1-M3)      │
│  - Prompt specificity       │  - Verification rate     │
│  - Task decomposition       │  - Trust calibration     │
│  - Strategy diversity       │  - Session patterns      │
│  - Independent attempts     │                          │
├─────────────────────────────┼──────────────────────────┤
│  EVALUATION (E1-E3)         │  REGULATION (R1-R2)      │
│  - Modification rate        │  - Iteration frequency   │
│  - Reflection depth         │  - Cross-model usage     │
│  - Error awareness          │                          │
└─────────────────────────────┴──────────────────────────┘
```

### Classification Pipeline:
```
User Behavior → Feature Extraction → XGBoost/SVM Ensemble → Pattern (A-F) → Intervention Decision
```

### Performance:
- **Overall Accuracy**: 72.73%
- **Pattern F Detection**: 100% (Critical pattern never missed)
- **Cross-validation**: 5-fold with hyperparameter tuning

---

# SLIDE 12: Evolution Tracking System

## Pattern Change Detection

### Evolution Classification:

| Type | Description | Example |
|------|-------------|---------|
| **Improvement** | Moving to more efficient patterns | F → C → A |
| **Regression** | Moving to less efficient patterns | A → C → F |
| **Oscillation** | Context-dependent switching | A ↔ C |
| **Stable** | No pattern change | A → A |

### Tracking Metrics:
- Pattern transition frequency
- Average time between transitions
- Intervention effectiveness correlation
- Long-term behavior trends

### Intervention Triggers:
- Regression detected → Warning intervention
- Pattern F detected → Immediate hard barrier
- Oscillation pattern → Strategy guidance

---

# SLIDE 13: Intervention Management

## Three-Tier Intervention Strategy

### Intervention Levels:

| Tier | Trigger | Action | Example |
|------|---------|--------|---------|
| **Soft** | Minor concerns | Subtle signal | Badge notification |
| **Medium** | Moderate risk | Alert popup | "Consider verifying this output" |
| **Hard** | Critical risk | Blocking barrier | "Verification required to proceed" |

### Anti-Fatigue Mechanism:
```
IF intervention_dismissed >= 3 times THEN
    suppress_for(30 minutes)
    log_fatigue_event()
    reduce_intervention_frequency()
END IF
```

### Compliance Tracking:
- Engagement rate per intervention type
- Dismissal patterns analysis
- Behavior change after intervention
- Long-term compliance trends

---

# SLIDE 14: State Management Architecture

## Zustand Store Design

### Core Stores:

```typescript
// 9 Specialized Stores
┌─────────────────┬────────────────────────────────────────┐
│ authStore       │ User authentication state              │
│ sessionStore    │ Current session and interactions       │
│ patternStore    │ Pattern recognition and evolution      │
│ interventionStore│ Intervention display and tracking     │
│ metricsStore    │ Performance metrics and analytics      │
│ assessmentStore │ Metacognitive assessment results       │
│ adminStore      │ Admin functionality                    │
│ notificationStore│ Toast notifications                   │
│ uiStore         │ UI preferences (theme, sidebar)        │
└─────────────────┴────────────────────────────────────────┘
```

### Key Custom Hooks:
| Hook | Purpose |
|------|---------|
| `useMRTools` | MR component state management |
| `useGlobalRecommendations` | Context-aware MR recommendations |
| `useBehaviorSignals` | Behavior pattern analysis |
| `useMessages` | Chat message history |
| `useAnalytics` | Session analytics |

---

# SLIDE 15: Global Recommendation Engine

## Context-Aware MR Recommendations

### Decision Factors:

```typescript
interface RecommendationContext {
  currentPattern: PatternType;      // A-F
  sessionPhase: 'early' | 'mid' | 'late';
  userExperience: 'novice' | 'intermediate' | 'expert';
  taskCriticality: 'low' | 'medium' | 'high';
  interventionLevel: 'passive' | 'suggestive' | 'proactive';
  recentBehaviors: BehaviorSignal[];
}
```

### Recommendation Logic:
```
IF pattern == 'F' THEN
    recommend([MR18, MR16, MR11])  // Over-reliance interventions
ELSE IF pattern == 'C' && sessionPhase == 'early' THEN
    recommend([MR1, MR4, MR15])    // Planning support
ELSE IF taskCriticality == 'high' THEN
    recommend([MR11, MR9, MR12])   // Verification focus
END IF
```

### MR3 Integration:
- **Passive**: Returns empty recommendations
- **Suggestive**: Returns max 3 recommendations
- **Proactive**: Returns all applicable recommendations

---

# SLIDE 16: Data Flow Architecture

## Complete System Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                                  │
│ (Chat message, verification, modification)                        │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/interactions                                           │
│ Log: { message, wasVerified, wasModified, wasRejected, timestamp}│
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/patterns/analyze                                       │
│ Extract 12 features → Classify pattern (A-F)                     │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/evolution/track                                        │
│ Compare to previous → Classify change (Improvement/Regression)   │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ RECOMMENDATION ENGINE                                            │
│ Generate context-aware MR tool recommendations                   │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ INTERVENTION MANAGER                                             │
│ Determine tier + Apply suppression logic                         │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ DASHBOARD DISPLAY                                                │
│ Metrics, Charts, Recommendations, Interventions                  │
└──────────────────────────────────────────────────────────────────┘
```

---

# SLIDE 17: User Interface Highlights

## Key Pages and Components

### Main Application Pages:

| Page | Lines of Code | Function |
|------|---------------|----------|
| ChatSessionPage | 4,097 | Main chat interface with MR tools |
| DashboardPage | 71,791 | Comprehensive analytics dashboard |
| PatternsPage | - | Pattern analysis and history |
| EvolutionTrackingPage | - | Pattern change visualization |
| MetacognitiveAssessmentPage | - | MR19 self-assessment |

### UI Features:
- Real-time chat with AI
- Inline MR tool activation
- Verification status indicators
- Pattern evolution charts
- Intervention notifications
- Dark/Light theme support

---

# SLIDE 18: Validation Results

## System Performance Metrics

### Pattern Recognition:
| Metric | Value |
|--------|-------|
| Overall Accuracy | 72.73% |
| Pattern F Recall | 100% |
| Cross-validation | 5-fold |

### User Research Coverage:
| Metric | Value |
|--------|-------|
| Frustrations Addressed | 84% |
| Expert Interviews | 49 |
| Disciplines Covered | 10+ |

### Code Quality:
| Metric | Value |
|--------|-------|
| Total Lines of Code | ~20,000+ |
| Test Coverage (Core) | 90%+ |
| TypeScript Strict Mode | Enabled |

### Design Validation:
> "Every MR component maps to specific user research evidence"

---

# SLIDE 19: Key Innovations

## Novel Contributions

### 1. Metacognitive Framework
- First system to apply metacognitive theory to AI collaboration
- 19 MR components based on empirical research
- Agency-first design philosophy

### 2. Pattern Recognition
- Novel 6-pattern taxonomy (A-F) for AI usage behaviors
- 12-feature extraction across 4 cognitive dimensions
- 100% detection rate for critical over-reliance pattern

### 3. Adaptive Intervention
- Three-tier intervention strategy (soft/medium/hard)
- Anti-fatigue mechanism prevents user frustration
- Cross-session learning for personalized interventions

### 4. Human Agency Preservation
- Every feature preserves user decision-making authority
- Manual override capability (MR3)
- "Continue without AI" option throughout

---

# SLIDE 20: Comparison with Existing Systems

## How MCA Differs from Traditional AI Tools

| Aspect | Traditional AI Tools | MCA System |
|--------|---------------------|------------|
| Focus | Task completion | Metacognitive calibration |
| User Model | One-size-fits-all | 6 distinct patterns |
| Trust | Implicit assumption | Dynamic calibration |
| Agency | Often overlooked | Core design principle |
| Learning | Session-limited | Cross-session evolution |
| Intervention | None or static | Adaptive three-tier |
| Research Base | Engineering-driven | 49 expert interviews |

---

# SLIDE 21: Demo Scenarios

## Live System Demonstration

### Scenario 1: New User Onboarding
1. User enters chat → System detects novice pattern
2. MR15 (Strategy Guide) recommended
3. User receives scaffolded guidance

### Scenario 2: Over-Reliance Detection
1. User accepts 5 AI outputs without verification
2. Pattern F detected → MR18 hard barrier triggered
3. "Verification required" popup appears
4. After verification → Pattern shifts to C

### Scenario 3: Expert Override
1. Expert user sets MR3 to "Passive"
2. All auto-recommendations hidden
3. Manual override indicator shown
4. User can reset to default anytime

---

# SLIDE 22: Limitations & Future Work

## Current Limitations

| Limitation | Description |
|------------|-------------|
| Sample Size | 49 experts may not represent all user types |
| Domain Focus | Primarily knowledge workers |
| Language | English-only interface |
| Real-time ML | Pattern detection has latency |

## Future Research Directions

### Short-term:
- Multi-language support
- Mobile-responsive design
- Real-time collaboration features

### Long-term:
- Longitudinal user study (6+ months)
- Integration with more AI models
- Personalized MR component weights
- Physiological signal integration (eye-tracking, EEG)

---

# SLIDE 23: Publications & Contributions

## Academic Output

### Papers:
1. **MCA System Design Paper** - Complete system architecture and validation
2. **Pattern Recognition Thesis** - ML approach for behavior classification
3. **Empirical Foundation Paper** - Grounded theory analysis of expert interviews

### Open Source:
- Full codebase with documentation
- Component library for MR tools
- Pattern recognition algorithm

### Design Artifacts:
- 19 MR component specifications
- 6-pattern taxonomy definition
- Intervention strategy framework

---

# SLIDE 24: Conclusions

## Summary

### Key Achievements:
1. **Evidence-Based Design**: Every feature grounded in 49 expert interviews
2. **Comprehensive Framework**: 19 MR components covering all metacognitive dimensions
3. **Pattern Recognition**: 72.73% accuracy with 100% critical pattern detection
4. **Agency Preservation**: User autonomy as core design principle
5. **Adaptive Intervention**: Three-tier system with fatigue management

### Impact:
> "MCA System represents a paradigm shift from AI-as-tool to AI-as-collaborative-partner, with explicit metacognitive calibration mechanisms"

### Core Message:
> "Better AI collaboration through metacognitive awareness"

---

# SLIDE 25: Q&A

## Questions & Discussion

### Potential Discussion Topics:
1. How does MR3 balance automation vs. user control?
2. Why is Pattern F detection prioritized?
3. How to extend to other domains?
4. What are the ethical implications?
5. How does this compare to existing AI tutoring systems?

### Contact:
- Email: [Your Email]
- Repository: github.com/Winckwu/Interview-GenAI

---

# APPENDIX A: MR Component Details

## Complete MR Component Specifications

### MR1: Task Decomposition Scaffold
- **Purpose**: Break complex tasks into manageable subtasks
- **Evidence**: Users struggle with undefined task boundaries
- **Implementation**: Guided decomposition wizard

### MR2: Process Transparency
- **Purpose**: Visualize AI output evolution
- **Evidence**: 76% frustrated by process opacity
- **Implementation**: Iteration history viewer

### MR3: Human Agency Control
- **Purpose**: User control over AI intervention intensity
- **Evidence**: 55% fear agency erosion
- **Implementation**: Three-level control slider

[Continue for all 19 components...]

---

# APPENDIX B: Pattern Definitions

## Detailed Pattern Characteristics

### Pattern A: Strategic Decomposition & Control
- High prompt specificity
- Systematic task breakdown
- Regular verification
- Multiple AI models used

### Pattern B: Iterative Optimization & Calibration
- Multiple iteration cycles
- Questions AI outputs
- Calibrates expectations
- Refines prompts

### Pattern C: Adaptive Adjustment
- Context-dependent strategies
- Switches approaches based on task
- Flexible AI usage
- Moderate verification

### Pattern D: Deep Verification & Criticism
- Thorough output scrutiny
- Probing questions
- Fact-checking behavior
- Skeptical stance

### Pattern E: Teaching & Learning
- Uses AI for education
- Focuses on understanding
- Reflection-oriented
- Asks "why" questions

### Pattern F: Passive Over-Reliance (CRITICAL)
- Uncritical acceptance
- No verification
- No modifications
- Immediate adoption

---

# APPENDIX C: API Endpoints

## Backend API Reference

### Core Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/interactions | Log user interaction |
| POST | /api/patterns/analyze | Analyze user pattern |
| POST | /api/evolution/track | Track pattern evolution |
| GET | /api/recommendations | Get MR recommendations |
| POST | /api/interventions | Record intervention |
| GET | /api/metrics | Get session metrics |
| POST | /api/assessment | Submit assessment |

---

# APPENDIX D: Research Timeline

## Project Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Cross-session memory | Complete |
| Phase 2 | Pattern transition detection | Complete |
| Phase 3 | High-risk task detection | Complete |
| Phase 4 | Pattern stability (SVM) | Complete |
| Phase 5 | Real-time integration | Complete |
| Phase 6 | User validation study | In Progress |

---

# END OF PRESENTATION

## Thank You

For questions or collaboration opportunities, please contact:

**[Your Name]**
[Your Email]
[Your Institution]

Repository: github.com/Winckwu/Interview-GenAI
