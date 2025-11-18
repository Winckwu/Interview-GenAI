# Comprehensive Overview: Predictions, Patterns & Evolution

This document provides a comprehensive understanding of how predictions, patterns, and evolution tracking are implemented in the Interview-GenAI system.

## Generated Documentation

Two detailed reference documents have been created:

1. **`DATA_FLOW_OVERVIEW.md`** (31 KB)
   - Complete data structures and interfaces
   - All API endpoints with request/response examples
   - Data flow diagrams
   - Pattern detection algorithm logic
   - Evolution tracking mechanism
   - Dashboard data loading sequence
   - Database schema
   - Key insights and data relationships

2. **`FILE_LOCATIONS_REFERENCE.md`** (9.7 KB)
   - Quick navigation to all relevant files
   - Frontend pages and stores
   - Backend routes and services
   - Key code snippets with line numbers
   - Useful database queries
   - Common development tasks

## Quick Start

### Understanding the System

1. **Start with Data Structures** (`DATA_FLOW_OVERVIEW.md` → Core Data Structures)
   - Pattern (6 types: A-F)
   - Prediction (predicted vs actual)
   - Evolution (4 change types)
   - Interaction (raw behavioral data)

2. **Follow the Data Flow** (`DATA_FLOW_OVERVIEW.md` → Data Flow Diagram)
   - User interaction → Pattern detection → Evolution tracking → Dashboard display

3. **See the Implementation** (`FILE_LOCATIONS_REFERENCE.md`)
   - Where each component is located in the codebase
   - How to navigate to specific features

### Key Files to Review

**If you're interested in:**

- **Pattern Detection**: `/backend/src/routes/patterns.ts` (lines 40-128)
- **Evolution Tracking**: `/backend/src/routes/evolution.ts` (lines 12-38)
- **Dashboard Display**: `/frontend/src/pages/DashboardPage.tsx`
- **Data Management**: `/frontend/src/stores/patternStore.ts`
- **API Integration**: `/frontend/src/services/api.ts`

## System Architecture Overview

### High-Level Flow

```
User Interaction (Chat)
    ↓
Log Interaction (wasVerified, wasModified, wasRejected, etc.)
    ↓
Calculate Feature Vector (12 features from interaction data)
    ↓
Detect Pattern (Rule-based: A-F classification)
    ↓
Track Evolution (Compare to previous pattern)
    ↓
Display on Dashboard (Metrics + Charts + Recent Changes)
    ↓
Enable Predictions (Future: Predict pattern from task context)
```

### Key Components

**Frontend**:
- **Pages**: Dashboard, Patterns, Predictions, Evolution
- **Stores**: patternStore (central state management)
- **API Client**: Axios instance with auth + error handling

**Backend**:
- **Routes**: patterns, evolution, interactions, analytics
- **Services**: PatternRecognitionEngine, TrustCalibration
- **Database**: PostgreSQL with 4 core tables

---

## The 6 AI Usage Patterns

### Pattern A: Strategic Decomposition & Control (20.4%)
- High verification, low AI reliance
- Careful planning, independent
- **Low Risk** - desired outcome

### Pattern B: Iterative Optimization & Calibration (10.2%)
- Multiple iterations, questions outputs
- Selective acceptance
- **Low Risk** - efficient approach

### Pattern C: Adaptive Adjustment (44.9%)
- Dynamic strategy switching
- Context-aware approach
- **Medium Risk** - good with guidance

### Pattern D: Deep Verification & Criticism (18.4%)
- Thorough scrutiny, probing questions
- High reflection
- **Low Risk** - strong critical thinking

### Pattern E: Teaching & Learning (2.0%)
- AI as educational tool
- High learning reflection
- **Medium Risk** - learning phase

### Pattern F: Passive Over-Reliance (4.1%)
- Uncritical acceptance
- Minimal verification
- **CRITICAL RISK** - intervention needed

---

## Feature Detection

### How Patterns are Detected

The system analyzes 12 behavioral features extracted from user interactions:

**Planning Dimension** (P1-P4):
- Prompt specificity (word count)
- Task decomposition
- Strategy diversity
- Independent attempt rate

**Monitoring Dimension** (M1-M3):
- Verification rate (key signal)
- Trust calibration accuracy
- Session duration patterns

**Evaluation Dimension** (E1-E3):
- Modification rate
- Reflection depth (E2) - KEY for Pattern F detection
- Error awareness

**Regulation Dimension** (R1-R2):
- Iteration frequency
- Cross-model usage

### Pattern F Detection Logic

**Most Reliable Signal**: `reflectionDepth = 0`
- If no modifications/reflection + low total score → Pattern F (95% confidence)
- This is the strongest indicator of passive, uncritical AI acceptance

### Confidence Scores
- **0.50** - Default fallback (conservative)
- **0.80-0.90** - Most confident classifications
- **0.95** - Pattern F with strongest signals

---

## Evolution Tracking

### Change Type Classification

The system tracks 4 types of pattern changes:

1. **Improvement**: Moving to more efficient patterns (F→E→D→C→B→A)
2. **Regression**: Moving to less efficient patterns (A→B→C→D→E→F)
3. **Oscillation**: Non-hierarchical changes
4. **Stable**: No pattern change

### Why This Matters

- **Improvement** = positive user behavior change
- **Regression** = concerning trend, may need intervention
- **Oscillation** = user adapting to different contexts
- **Stable** = consistent behavior

### Dashboard Metrics

- Total evolution events
- Improvement count
- Regression count
- Oscillation count
- Percentage breakdown

---

## Prediction System (Future)

### Current Status
- **Placeholder Implementation**: Only `GET /api/predictions` returns empty array
- **Not Yet Integrated**: No actual pattern prediction from task context

### Expected Functionality

**Input**: Task context
```json
{
  "taskType": "coding|writing|analysis|design",
  "complexity": "easy|medium|hard",
  "timeConstraint": "limited|adequate|abundant",
  "aiAvailable": true
}
```

**Process**:
1. ML model predicts user's pattern (A-F)
2. User completes task
3. Actual pattern is detected
4. Prediction accuracy is evaluated

**Output**: Prediction accuracy metrics
```
Accuracy = (Correct Predictions / Total Predictions) * 100
```

### Implementation Needed
1. ML model training on historical patterns
2. POST endpoint for creating predictions
3. Feedback collection mechanism
4. Model retraining pipeline
5. Accuracy tracking and display

---

## Dashboard Display

### Metric Cards (Top Row)

| Card | Value | Source | Calculation |
|------|-------|--------|-------------|
| Prediction Accuracy | X% | predictions table | correct/total * 100 |
| Current Pattern | A-F | pattern_logs (latest) | Most recent pattern_type |
| Pattern Evolution | N | evolution_logs | Count of all events |
| User Type | Profile classification | users table | User userType field |

### Charts

1. **Weekly Accuracy Trend**
   - Currently mock data
   - Should show prediction accuracy over 4 weeks

2. **Pattern Distribution**
   - Pie chart of all detected patterns
   - Currently mock data
   - Should aggregate user's pattern_logs

3. **Intervention Strategy Effectiveness**
   - Baseline vs Aggressive vs Adaptive success rates
   - Currently mock data
   - Related to future intervention system

4. **Quick Stats**
   - Totals and counts
   - Member since date

### Recent Conversations

- Displays last 10 sessions
- Filtered to sessions with valid interactions
- Truncated first prompt as title
- Delete button for each session

---

## Database Tables

### interactions
- **Purpose**: Record every user-AI interaction
- **Key Fields**: wasVerified, wasModified, wasRejected, promptWordCount, responseTime, confidenceScore
- **Usage**: Source data for feature calculation

### pattern_logs
- **Purpose**: Store detected patterns per session
- **Key Fields**: detectedPattern (A-F), confidence, features (JSON)
- **Usage**: Pattern history, distribution, current pattern lookup

### evolution_logs
- **Purpose**: Track pattern changes over time
- **Key Fields**: currentPattern, previousPattern, changeType
- **Usage**: Evolution statistics, trend analysis

### predictions (Placeholder)
- **Purpose**: Track prediction accuracy
- **Key Fields**: predictedPattern, actualPattern, feedback, isCorrect
- **Usage**: Future model training and evaluation

---

## Data Quality Notes

### Pattern F Underrepresentation

**Problem**:
- Only 2/49 (4.1%) of empirical data
- Recruitment bias toward engaged users
- Model has insufficient training data

**Solution**:
- Generate 20 synthetic Pattern F samples
- Augment dataset to 69 total samples
- Pattern F becomes 31.9% of augmented data

**Impact**:
- Better detection of high-risk passive behavior
- More robust Pattern F classification

---

## Integration Points

### API Endpoints Used by Dashboard

```
GET /api/patterns/:userId        → patternStore.patterns
GET /api/evolution/:userId       → patternStore.evolutions
GET /api/predictions             → patternStore.predictions
GET /api/sessions                → sessionStore.sessions
GET /api/analytics/dashboard     → Aggregated metrics
```

### Frontend State Management

All data flows through **patternStore** (Zustand):
```
usePatternStore()
├─ patterns: Pattern[]
├─ predictions: Prediction[]
├─ evolutions: Evolution[]
├─ currentUserPattern: Pattern | null
└─ Actions:
   ├─ fetchPatterns(userId?)
   ├─ fetchPredictions(userId?)
   ├─ fetchEvolutions(userId?)
   ├─ createPrediction(taskId, context)
   └─ submitFeedback(predictionId, feedback, isCorrect)
```

---

## Key Insights for Development

### Most Important Code Sections

1. **Pattern Detection** (`patterns.ts:40-128`)
   - Core algorithm logic
   - If modifying detection, start here

2. **Feature Calculation** (`patterns.ts:133-196`)
   - How interaction data becomes features
   - Key for improving detection accuracy

3. **Evolution Logic** (`evolution.ts:12-38`)
   - Improvement hierarchy definition
   - Change type classification

4. **Dashboard Data Loading** (`DashboardPage.tsx:69-86`)
   - How metrics are calculated
   - Data aggregation logic

### Common Modifications

**To add a new metric**:
1. Add to Pattern or Evolution interface
2. Calculate in route handler
3. Update patternStore
4. Display in DashboardPage

**To improve pattern detection**:
1. Adjust thresholds in detectPattern()
2. Modify feature calculation
3. Test with real sessions
4. Iterate based on results

**To implement predictions**:
1. Create ML model (or ML service)
2. Add POST /api/predictions/predict endpoint
3. Implement feedback collection
4. Add accuracy tracking

---

## Files to Review (In Order)

### Understanding Flow
1. `DATA_FLOW_OVERVIEW.md` (this explains everything)
2. `FILE_LOCATIONS_REFERENCE.md` (quick navigation)

### Understanding Code
1. `/frontend/src/pages/DashboardPage.tsx` (entry point, see how data is used)
2. `/frontend/src/stores/patternStore.ts` (state management)
3. `/backend/src/routes/patterns.ts` (detection algorithm)
4. `/backend/src/routes/evolution.ts` (change tracking)
5. `/backend/src/types/index.ts` (data structures)

### Understanding Database
1. `/04-Database-Schema.md` (SQL structure)
2. Useful queries in `FILE_LOCATIONS_REFERENCE.md`

---

## Quick Reference

### Pattern Confidence Levels
- `0.95`: Pattern F with strong signals (reflectionDepth=0)
- `0.92`: Pattern E with high modification rate
- `0.90`: Pattern A comprehensive approach
- `0.85`: Pattern D deep verification
- `0.80`: Pattern C adaptive, Pattern B iterative
- `0.50`: Default fallback

### Feature Vector Ranges
- All features scale 0-3
- Calculated from interaction metrics
- Aggregated across session interactions
- Used to determine pattern type

### Evolution Change Hierarchy
```
F → E → D → C → B → A
(Improvement paths shown)
```

### Data Loading (Frontend)
```typescript
// On Dashboard mount:
1. fetchPatterns()        // GET /api/patterns/:userId
2. fetchPredictions()     // GET /api/predictions
3. fetchEvolutions()      // GET /api/evolution/:userId
4. loadSessions()         // GET /api/sessions
5. Display metrics        // Calculate + render
```

---

## Support & Questions

For detailed information on:
- **Data structures**: See `DATA_FLOW_OVERVIEW.md` → Core Data Structures
- **API endpoints**: See `DATA_FLOW_OVERVIEW.md` → API Endpoints
- **File locations**: See `FILE_LOCATIONS_REFERENCE.md`
- **Algorithm details**: See `DATA_FLOW_OVERVIEW.md` → Pattern Detection Algorithm
- **Evolution tracking**: See `DATA_FLOW_OVERVIEW.md` → Evolution Tracking
- **Database queries**: See `FILE_LOCATIONS_REFERENCE.md` → Useful Database Queries

---

**Document Generated**: November 18, 2025
**System**: Interview-GenAI with 6-Pattern AI Usage Classification
**Version**: Complete documentation of current implementation

