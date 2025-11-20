# Predictions, Patterns, and Evolution: Complete Data Structure & Flow Overview

## Table of Contents
1. [Core Data Structures](#core-data-structures)
2. [API Endpoints](#api-endpoints)
3. [Data Flow: User Interactions to Patterns](#data-flow-user-interactions-to-patterns)
4. [Pattern Detection Algorithm](#pattern-detection-algorithm)
5. [Evolution Tracking](#evolution-tracking)
6. [Prediction System](#prediction-system)
7. [Dashboard Data Loading](#dashboard-data-loading)
8. [Database Schema](#database-schema)

---

## Core Data Structures

### 1. Pattern Interface
**Location**: `/backend/src/types/index.ts` and `/frontend/src/stores/patternStore.ts`

```typescript
interface Pattern {
  id: string;
  userId: string;
  patternType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence: number;              // 0-1, confidence level of detection
  aiRelianceScore: number;         // User's reliance on AI output
  verificationScore: number;       // User's verification behavior
  contextSwitchingFrequency: number;
  metrics: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Pattern Definitions**:
- **Pattern A**: Strategic Decomposition & Control (20.4% users)
  - High verification, low AI reliance, careful planning
  - Metrics: High promptSpecificity, verificationRate ≥ 0.6, independenceRate ≥ 0.7

- **Pattern B**: Iterative Optimization & Calibration (10.2% users)
  - Multiple iterations, questions outputs, selective acceptance
  - Metrics: iterationRate ≥ 0.5, questionsAskedRate ≥ 0.4

- **Pattern C**: Adaptive Adjustment (44.9% users)
  - Dynamic strategy switching, context-aware approach
  - Metrics: strategyDiversity ≥ 0.7, reflectionFrequency ≥ 0.4

- **Pattern D**: Deep Verification & Criticism (18.4% users)
  - Thorough scrutiny, probing questions
  - Metrics: verificationRate ≥ 0.7, questionsAskedRate ≥ 0.5

- **Pattern E**: Teaching & Learning (2.0% users)
  - AI as educational tool, high learning reflection
  - Metrics: reflectionFrequency ≥ 0.6, iterationRate ≥ 0.4

- **Pattern F**: Passive Over-Reliance (4.1% users) ⚠️ HIGH RISK
  - Uncritical acceptance, minimal verification
  - Metrics: reflectionDepth = 0, verificationRate ≤ 0.2, acceptanceRate ≥ 0.95

---

### 2. Prediction Interface
**Location**: `/backend/src/types/index.ts` and `/frontend/src/stores/patternStore.ts`

```typescript
interface Prediction {
  id: string;
  userId: string;
  taskId: string;
  predictedPattern: string;        // Predicted pattern type (A-F)
  actualPattern: string | null;    // Ground truth (null until feedback)
  confidence: number;              // 0-1, prediction confidence
  feedback: 'accurate' | 'inaccurate' | 'partially_accurate' | null;
  isCorrect: boolean | null;       // null = pending, true/false after feedback
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Metrics**:
- **Prediction Accuracy**: (correctPredictions / totalPredictions) * 100
- **Feedback Types**: 
  - `accurate`: Prediction matched actual pattern
  - `inaccurate`: Prediction did not match
  - `partially_accurate`: Partial match

---

### 3. Evolution Interface
**Location**: `/backend/src/types/index.ts` and `/frontend/src/stores/patternStore.ts`

```typescript
interface Evolution {
  id: string;
  userId: string;
  timePoint: string;
  fromPattern: string;             // Previous pattern
  toPattern: string;               // Current pattern
  changeType: 'improvement' | 'migration' | 'oscillation' | 'regression';
  metrics: Record<string, number>;
  createdAt: Date;
}
```

**Change Types**:
- **Improvement**: Moving to more efficient patterns (F→E→D→C→B→A)
- **Regression**: Moving to less efficient patterns (A→B→C→D→E→F)
- **Oscillation**: Switching between incomparable patterns (A↔D, B↔C, etc.)
- **Migration**: Lateral changes within efficiency tier
- **Stable**: No pattern change

---

### 4. Interaction Data Structure
**Location**: `/backend/src/routes/interactions.ts`

```typescript
interface Interaction {
  id: string;
  sessionId: string;
  userPrompt: string;
  aiResponse: string;
  aiModel: string;                 // 'gpt-4-turbo', etc.
  promptWordCount: number;         // P1: Prompt Specificity
  responseTime: number;            // M3: Session Duration Patterns
  wasVerified: boolean;            // M1: Verification Rate
  wasModified: boolean;            // E1: Modification Rate
  wasRejected: boolean;            // R1: Independence Rate
  confidenceScore: number;         // M2: Trust Calibration
  createdAt: Date;
}
```

**Feature Vector Calculation** (from interactions):
```typescript
interface FeatureVector {
  promptSpecificity: number;           // P1: 0-3 (from promptWordCount)
  taskDecompositionScore: number;      // P2: 0-3
  strategyDiversity: number;           // P3: 0-3 (from # modifications)
  independentAttemptRate: number;      // P4: 0-3 (from rejections)
  
  verificationRate: number;            // M1: 0-3 (wasVerified count)
  trustCalibrationAccuracy: number;    // M2: 0-3 (confidence_score avg)
  sessionDurationPatterns: number;     // M3: 0-3 (responseTime avg)
  
  modificationRate: number;            // E1: 0-3 (wasModified count)
  reflectionDepth: number;             // E2: 0-3 (KEY for Pattern F)
  errorAwareness: number;              // E3: 0-3 (modifications + rejections)
  
  iterationFrequency: number;          // R1: 0-3 (wasModified / length)
  crossModelUsage: number;             // R2: 0-3 (model variety)
}
```

---

## API Endpoints

### Pattern Detection Endpoints

#### 1. POST `/api/patterns/analyze`
Analyzes a session's interactions to detect user pattern.

**Request**:
```json
{
  "sessionId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pattern": {
      "id": "uuid",
      "sessionId": "uuid",
      "detectedPattern": "A",
      "confidence": 0.90,
      "features": { /* FeatureVector */ },
      "reasoning": [
        "High planning dimension score",
        "Strong verification and monitoring"
      ],
      "descriptions": {
        "A": "Strategic Decomposition & Control...",
        "B": "Iterative Optimization & Calibration...",
        // ... etc
      }
    }
  },
  "timestamp": "ISO-8601"
}
```

**Processing Flow**:
1. Fetch all interactions for the session
2. Calculate feature vector from interaction metrics
3. Apply pattern detection algorithm (rule-based + SVM-inspired thresholding)
4. Save pattern log to database

---

#### 2. GET `/api/patterns/:userId`
Retrieves pattern history for a user.

**Response**:
```json
{
  "success": true,
  "data": {
    "patterns": [ /* Pattern[] */ ],
    "mostRecent": { /* Pattern */ },
    "distribution": {
      "A": 5,
      "B": 3,
      "C": 8,
      "D": 2,
      "E": 1,
      "F": 0
    },
    "totalSessions": 19
  }
}
```

---

#### 3. GET `/api/patterns`
Retrieves user's patterns with pagination.

**Query Parameters**:
- `limit`: 1-100 (default: 50)
- `offset`: pagination offset

---

### Evolution Tracking Endpoints

#### 1. POST `/api/evolution/track`
Tracks pattern changes and classifies evolution type.

**Request**:
```json
{
  "sessionId": "uuid",
  "currentPattern": "B",
  "confidence": 0.85
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "evolution": {
      "id": "uuid",
      "sessionId": "uuid",
      "userId": "uuid",
      "currentPattern": "B",
      "previousPattern": "C",
      "changeType": "improvement",
      "confidence": 0.85,
      "createdAt": "ISO-8601"
    }
  },
  "message": "Pattern improvement: C → B"
}
```

**Change Type Logic**:
```typescript
function detectEvolution(previousPattern: string, currentPattern: string): string {
  const improvements: { [key: string]: string[] } = {
    F: ['E', 'D', 'C', 'B', 'A'],  // F can improve to any
    E: ['D', 'C', 'B', 'A'],
    D: ['C', 'B', 'A'],
    C: ['B', 'A'],
    B: ['A'],
    A: []  // A is the best
  };
  
  if (improvements[prev]?.includes(current)) return 'improvement';
  if (improvements[current]?.includes(prev)) return 'regression';
  return 'oscillation';
}
```

---

#### 2. GET `/api/evolution/:userId`
Retrieves evolution history for a user.

**Response**:
```json
{
  "success": true,
  "data": {
    "evolutions": [ /* Evolution[] */ ],
    "statistics": {
      "totalEvents": 15,
      "improvements": 7,
      "regressions": 2,
      "oscillations": 5,
      "stable": 1
    }
  }
}
```

---

#### 3. GET `/api/evolution/stats/:userId`
Gets evolution statistics and trends.

**Response**:
```json
{
  "success": true,
  "data": {
    "statistics": {
      "improvement": 7,
      "regression": 2,
      "oscillation": 5,
      "stable": 1
    },
    "percentages": {
      "improvement": "43.75%",
      "regression": "12.50%",
      "oscillation": "31.25%",
      "stable": "6.25%"
    },
    "total": 16
  }
}
```

---

### Prediction Endpoints

#### 1. GET `/api/predictions`
Retrieves user's predictions (currently a placeholder).

**Response**:
```json
{
  "success": true,
  "data": []
}
```

**Future Implementation**:
- Will retrieve all predictions for the user
- Support feedback filtering: `?status=pending|accurate|inaccurate`
- Support pagination

---

#### 2. POST `/api/predictions/predict`
Creates a new prediction (to be implemented).

**Request**:
```json
{
  "taskId": "uuid",
  "context": {
    "taskType": "coding|writing|analysis|design",
    "complexity": "easy|medium|hard",
    "timeConstraint": "limited|adequate|abundant",
    "aiAvailable": true
  }
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "prediction": {
      "id": "uuid",
      "userId": "uuid",
      "taskId": "uuid",
      "predictedPattern": "B",
      "confidence": 0.82,
      "createdAt": "ISO-8601"
    }
  }
}
```

---

#### 3. POST `/api/predictions/:predictionId/feedback`
Submits feedback on prediction accuracy.

**Request**:
```json
{
  "feedback": "accurate|inaccurate|partially_accurate",
  "isCorrect": true,
  "actualPattern": "B"  // optional
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "prediction": {
      "id": "uuid",
      "feedback": "accurate",
      "isCorrect": true,
      "updatedAt": "ISO-8601"
    }
  }
}
```

---

### Analytics Endpoints

#### GET `/api/analytics/dashboard`
Gets dashboard analytics for user.

**Response**:
```json
{
  "success": true,
  "data": {
    "sessions": {
      "totalSessions": 19,
      "completedSessions": 15,
      "averageDuration": 12.5
    },
    "patterns": {
      "distribution": {
        "A": 5,
        "B": 3,
        "C": 8,
        "D": 2,
        "E": 1,
        "F": 0
      },
      "mostRecent": {
        "pattern": "A",
        "confidence": 0.90,
        "detectedAt": "ISO-8601"
      }
    },
    "interactions": {
      "total": 145,
      "verified": 98,
      "modified": 42,
      "rejected": 12,
      "verificationRate": 0.676,
      "modificationRate": 0.290,
      "avgPromptLength": 28.5,
      "avgResponseTime": 2150
    },
    "alerts": {
      "active": 3,
      "byServerity": {
        "low": 1,
        "medium": 2
      }
    }
  }
}
```

---

## Data Flow: User Interactions to Patterns

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
│   (Chat Session: User Prompt → AI Response → User Feedback)        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              POST /api/interactions                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Interaction Created:                                        │  │
│  │ - promptWordCount (calculated)                             │  │
│  │ - responseTime (measured)                                  │  │
│  │ - wasVerified, wasModified, wasRejected (user feedback)   │  │
│  │ - confidenceScore (user confidence in response)           │  │
│  │ - aiModel (which model was used)                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  Database: interactions table                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
              [END OF SESSION - User clicks "End Session"]
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│         POST /api/patterns/analyze                                   │
│         (Pattern Detection Triggered)                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 1. Fetch all interactions for session                      │  │
│  │    SELECT * FROM interactions WHERE session_id = $1        │  │
│  │                                                             │  │
│  │ 2. calculateFeatures(sessionId) → FeatureVector           │  │
│  │    - Sum: wasVerified, wasModified, wasRejected           │  │
│  │    - Avg: promptWordCount, responseTime, confidenceScore  │  │
│  │    - Ratios: verification_rate, modification_rate, etc.   │  │
│  │                                                             │  │
│  │ 3. detectPattern(features) → {pattern, confidence}        │  │
│  │    Uses rule-based classification + thresholds            │  │
│  │    Special case: reflectionDepth = 0 → Pattern F (95%)    │  │
│  │                                                             │  │
│  │ 4. Save pattern_log to database                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  Database: pattern_logs table                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│         POST /api/evolution/track                                    │
│         (Evolution Change Detected)                                 │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 1. Fetch previous pattern from pattern_logs               │  │
│  │    SELECT detected_pattern FROM pattern_logs              │  │
│  │    WHERE user_id = $1 AND session_id != $2               │  │
│  │    ORDER BY created_at DESC LIMIT 1                       │  │
│  │                                                             │  │
│  │ 2. Detect evolution type:                                 │  │
│  │    - improvement: prev pattern → better pattern           │  │
│  │    - regression: prev pattern → worse pattern             │  │
│  │    - oscillation: incomparable changes                    │  │
│  │    - stable: prev pattern = current pattern               │  │
│  │                                                             │  │
│  │ 3. Save evolution_log to database                         │  │
│  │    (used for trend analysis)                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  Database: evolution_logs table                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Dashboard/Analytics Pages                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ GET /api/patterns/:userId                                  │  │
│  │ GET /api/evolution/:userId                                 │  │
│  │ GET /api/analytics/dashboard                               │  │
│  │                                                             │  │
│  │ Data aggregated and displayed to user                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pattern Detection Algorithm

### Location
`/backend/src/routes/patterns.ts` (lines 40-128)

### Algorithm Overview

```typescript
function detectPattern(features: FeatureVector): { 
  pattern: string; 
  confidence: number; 
  reasoning: string[] 
}
```

### Detection Logic (Priority Order)

#### 1. **Pattern F Detection** (Highest Priority)
```
IF reflectionDepth = 0 AND totalScore < 15:
  RETURN Pattern F with confidence 0.95
  REASON: "No learning reflection (E2=0)" is strongest Pattern F signal
```

#### 2. **Pattern E Detection** (High Reflection)
```
IF reflectionDepth >= 2.5:
  IF modificationRate >= 2:
    RETURN Pattern E with confidence 0.92
```

#### 3. **Pattern A Detection** (Comprehensive)
```
IF planningTotal >= 10 AND monitoringTotal >= 7 AND evaluationTotal >= 7:
  RETURN Pattern A with confidence 0.90
```

#### 4. **Pattern D Detection** (Deep Verification)
```
IF verificationRate >= 2.5 AND errorAwareness >= 2 AND planningTotal <= 9:
  RETURN Pattern D with confidence 0.85
```

#### 5. **Pattern C Detection** (Adaptive)
```
IF strategyDiversity >= 2 AND crossModelUsage >= 1.5:
  RETURN Pattern C with confidence 0.80
```

#### 6. **Pattern B Detection** (Iterative)
```
IF iterationFrequency >= 2.5 AND reflectionDepth >= 1.5:
  RETURN Pattern B with confidence 0.80
```

#### 7. **Default**
```
ELSE:
  RETURN Pattern A with confidence 0.50 (conservative fallback)
```

### Feature Calculation Details

```typescript
// From interaction database query
verificationRate = (count(wasVerified=true) / totalInteractions) * 3
modificationRate = (count(wasModified=true) / totalInteractions) * 3
reflectionDepth = modificationRate > 0 ? 
                  min(count(wasModified) / totalInteractions * 3, 3) : 0

// From aggregate metrics
promptSpecificity = min(avgPromptLength / 25 * 3, 3)
iterationFrequency = min(modCount / (totalCount - 1) * 2 + 0.5, 3)
errorAwareness = (modCount + rejCount) > 0 ? 2.5 : 1

// Dimension scores
planningTotal = promptSpecificity + taskDecompositionScore + 
                strategyDiversity + independentAttemptRate
monitoringTotal = verificationRate + trustCalibrationAccuracy + 
                  sessionDurationPatterns
evaluationTotal = modificationRate + reflectionDepth + errorAwareness
regulationTotal = iterationFrequency + crossModelUsage
totalScore = planningTotal + monitoringTotal + evaluationTotal + regulationTotal
```

---

## Evolution Tracking

### Data Collection Points

1. **When pattern changes are detected**:
   - After running pattern analysis
   - Compare new pattern to previous pattern from pattern_logs
   - Record in evolution_logs table

### Evolution Statistics Calculation

```typescript
interface EvolutionStats {
  totalEvents: number;
  improvements: number;    // Count of 'improvement' changeType
  regressions: number;     // Count of 'regression' changeType
  oscillations: number;    // Count of 'oscillation' changeType
  stable: number;          // Count of 'stable' (no change)
}
```

### Dashboard Metrics

**Evolution Tracking Page** (`/frontend/src/pages/EvolutionTrackingPage.tsx`):
- Displays evolution metrics cards
- Shows evolution timeline chart
- Lists all evolution events with badges
- Provides interpretation guide

**Data Sources**:
- GET `/api/evolution/:userId` - User's evolution history
- GET `/api/evolution/stats/:userId` - Statistics and percentages
- Calculated from evolution_logs table

---

## Prediction System

### Current Status: Placeholder Implementation

The predictions API is **minimally implemented** as a placeholder:

```typescript
// /backend/src/index.ts (lines 123-130)
app.get('/api/predictions', authenticateToken, asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    message: 'Predictions endpoint',
    timestamp: new Date().toISOString(),
  });
}));
```

### Expected Full Implementation

**Key Components to Implement**:

1. **Prediction Creation** (POST `/api/predictions/predict`)
   - Input: taskId, context (task type, complexity, etc.)
   - ML Model: Trained on historical patterns
   - Output: predictedPattern + confidence

2. **Prediction Evaluation**
   - After user completes task and pattern is detected
   - Compare predictedPattern vs actualPattern
   - Record accuracy in predictions table

3. **Feedback Loop**
   - Users provide feedback on prediction accuracy
   - Updates isCorrect and feedback fields
   - Retrains model with new labeled data

### Prediction Flow (Future)

```
User Creates Prediction (Task Context)
         ↓
ML Model Predicts Pattern (A-F)
         ↓
User Completes Task
         ↓
Pattern Detected (actual pattern analysis)
         ↓
Compare Prediction vs Actual
         ↓
Record Accuracy + Confidence Metrics
         ↓
Update Model if Threshold Met
```

### Frontend Integration

**PredictionsPage** (`/frontend/src/pages/PredictionsPage.tsx`):
- Form to create new predictions
- Display prediction history table
- Show accuracy metrics
- Support feedback submission

**Pattern Store** (`/frontend/src/stores/patternStore.ts`):
```typescript
// Methods available:
createPrediction(taskId: string, context: Record<string, any>): Promise<Prediction>
submitFeedback(predictionId: string, feedback: string, isCorrect: boolean): Promise<void>
fetchPredictions(userId?: string): Promise<void>
```

---

## Dashboard Data Loading

### Location
`/frontend/src/pages/DashboardPage.tsx`

### Data Loading Sequence

```typescript
useEffect(() => {
  // Load all data on mount
  fetchPatterns();
  fetchPredictions();
  fetchEvolutions();
}, []);

useEffect(() => {
  // Load sessions separately
  loadSessions();
}, [loadSessions]);
```

### Data Sources

| Metric | Source | API | Store |
|--------|--------|-----|-------|
| Prediction Accuracy | Predictions table | GET `/api/predictions` | patternStore.predictions |
| Current Pattern | Pattern logs (most recent) | GET `/api/patterns/:userId` | patternStore.currentUserPattern |
| Pattern Evolution Count | Evolution logs | GET `/api/evolution/:userId` | patternStore.evolutions |
| Improvement Count | Evolution logs (filtered by changeType='improvement') | GET `/api/evolution/:userId` | Filter evolutions array |
| Recent Conversations | Sessions table | GET `/api/sessions` | sessionStore.sessions |

### Metric Calculations

```typescript
// Prediction accuracy
const predictionArray = Array.isArray(predictions) ? predictions : [];
const totalPredictions = predictionArray.length;
const correctPredictions = predictionArray.filter((p) => p.isCorrect).length;
const predictionAccuracy = totalPredictions > 0 
  ? ((correctPredictions / totalPredictions) * 100).toFixed(1) 
  : 0;

// Current pattern
const userPatterns = patternArray.filter((p) => p.userId === user?.id) || [];
const currentPattern = userPatterns.length > 0 ? userPatterns[0] : null;

// Evolution metrics
const userEvolutions = evolutionArray.filter((e) => e.userId === user?.id) || [];
const improvementCount = userEvolutions.filter((e) => e.changeType === 'improvement').length;
```

### Dashboard Chart Data

**1. Weekly Accuracy Trend**
- Mock data (awaiting real accuracy tracking)
- Shows trend over 4 weeks
- Would be calculated from predictions + feedback

**2. Pattern Distribution**
- Mock data (Pattern A: 15, B: 12, C: 10, D: 8, E: 3, F: 2)
- Should be aggregated from patternArray distribution

**3. Intervention Strategy Effectiveness**
- Mock data (Baseline: 68%, Aggressive: 70%, Adaptive: 73%)
- Related to intervention/recommendation system

**4. Quick Stats**
- Total Predictions
- Accurate Predictions
- Evolution Events
- Member Since

---

## Database Schema

### Core Tables

#### 1. `interactions`
```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  user_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  ai_model VARCHAR(100),
  prompt_word_count INT,
  response_time INT,           -- milliseconds
  was_verified BOOLEAN,
  was_modified BOOLEAN,
  was_rejected BOOLEAN,
  confidence_score FLOAT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

**Purpose**: Records every user-AI interaction with metrics needed for pattern detection

---

#### 2. `pattern_logs`
```sql
CREATE TABLE pattern_logs (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  detected_pattern CHAR(1),     -- A-F
  confidence FLOAT,             -- 0-1
  features JSONB,               -- FeatureVector stored as JSON
  created_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

**Purpose**: Stores detected patterns for each session

**Index**: `INDEX ON (session_id)` for fast lookups

---

#### 3. `evolution_logs`
```sql
CREATE TABLE evolution_logs (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  current_pattern CHAR(1),      -- A-F
  previous_pattern CHAR(1),     -- A-F (nullable for first pattern)
  change_type VARCHAR(20),      -- 'improvement', 'regression', 'oscillation', 'stable'
  confidence FLOAT,
  created_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Purpose**: Tracks pattern changes and evolution over time

**Index**: `INDEX ON (user_id, created_at)` for trend queries

---

#### 4. `predictions` (Placeholder)
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id VARCHAR(100),
  predicted_pattern CHAR(1),    -- A-F
  actual_pattern CHAR(1),       -- A-F (null until feedback)
  confidence FLOAT,
  feedback VARCHAR(50),         -- 'accurate', 'inaccurate', 'partially_accurate'
  is_correct BOOLEAN,           -- null = pending
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Purpose**: Tracks prediction accuracy and model performance

---

## Key Data Relationships

```
User (users table)
  │
  ├─→ Session (sessions table)
  │     │
  │     └─→ Interaction (interactions table)
  │           │
  │           └─→ Pattern Detection (pattern_logs table)
  │                 │
  │                 └─→ Evolution Tracking (evolution_logs table)
  │
  └─→ Prediction (predictions table)
        │
        └─→ Feedback (submitted via POST `/api/predictions/:id/feedback`)
```

---

## Summary: Data Flow Overview

### Step 1: User Interaction
- User sends prompt in chat
- AI responds
- User provides feedback (verified, modified, rejected)

### Step 2: Interaction Logged
- POST `/api/interactions`
- Stored in interactions table
- Includes metrics: word count, response time, verification status

### Step 3: Pattern Detection
- POST `/api/patterns/analyze`
- Calculate feature vector from interactions
- Detect pattern using rule-based algorithm
- Save pattern log

### Step 4: Evolution Tracking
- POST `/api/evolution/track`
- Compare to previous pattern
- Classify change type (improvement/regression/oscillation)
- Save evolution log

### Step 5: Dashboard Display
- GET `/api/patterns/:userId` - Current pattern + history
- GET `/api/evolution/:userId` - Evolution events + stats
- GET `/api/predictions` - Prediction accuracy
- GET `/api/analytics/dashboard` - Aggregated metrics

### Step 6: User Analysis
- Dashboard shows pattern distribution
- Evolution timeline shows progress
- Prediction accuracy shows model performance
- Recommendations provided based on pattern

---

## Key Insights

### Pattern Detection
- **Most Reliable Signal**: reflectionDepth (E2 feature)
- **High-Risk Pattern**: Pattern F has dedicated detection logic
- **Confidence Ranges**: 0.50 (default) to 0.95 (Pattern F certain)

### Evolution Tracking
- **Improvement Hierarchy**: F→E→D→C→B→A (lower to higher quality)
- **Regression Detection**: Moving toward lower quality patterns
- **Oscillation**: Non-hierarchical changes

### Prediction System (Future)
- **Not Fully Implemented**: Only placeholder at GET `/api/predictions`
- **Expected to Predict**: User's AI usage pattern based on task context
- **Requires**: ML model trained on historical interaction data

### Data Quality Issues
- **Pattern F Underrepresented**: Only 4.1% of empirical data (2/49 users)
- **Solution**: Synthetic data generation (20 samples → 31.9% of augmented set)
- **Impact**: Better detection of high-risk passive over-reliance behavior

