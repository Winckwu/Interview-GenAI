# Quick Reference: File Locations & Code Navigation

## Frontend Files

### Core Pages
| Page | Location | Purpose |
|------|----------|---------|
| Dashboard | `/frontend/src/pages/DashboardPage.tsx` | Main overview with predictions, patterns, evolution metrics |
| Patterns | `/frontend/src/pages/PatternsPage.tsx` | View user's pattern history and distribution |
| Predictions | `/frontend/src/pages/PredictionsPage.tsx` | Create predictions and track accuracy |
| Evolution | `/frontend/src/pages/EvolutionTrackingPage.tsx` | Monitor pattern evolution and improvement |

### State Management (Zustand Stores)
| Store | Location | Manages |
|-------|----------|---------|
| Pattern Store | `/frontend/src/stores/patternStore.ts` | Patterns, predictions, evolutions, actions |
| Session Store | `/frontend/src/stores/sessionStore.ts` | Recent sessions, interactions |
| Auth Store | `/frontend/src/stores/authStore.ts` | User authentication state |
| UI Store | `/frontend/src/stores/uiStore.ts` | UI state (sidebar, notifications) |

### Services
| Service | Location | Purpose |
|---------|----------|---------|
| API Client | `/frontend/src/services/api.ts` | Axios instance + interceptors + type-safe endpoints |

---

## Backend Files

### Route Handlers
| Endpoint | Location | Methods |
|----------|----------|---------|
| Patterns | `/backend/src/routes/patterns.ts` | POST /analyze, GET /:userId, GET / |
| Evolution | `/backend/src/routes/evolution.ts` | POST /track, GET /:userId, GET /stats/:userId, GET / |
| Interactions | `/backend/src/routes/interactions.ts` | POST /, GET /:id, PATCH /:id, GET / |
| Analytics | `/backend/src/routes/analytics.ts` | GET /dashboard, GET /sessions/:userId, GET /patterns/:userId, GET /system |
| Predictions | `/backend/src/index.ts` (lines 123-130) | GET / (placeholder only) |

### Core Services
| Service | Location | Purpose |
|---------|----------|---------|
| PatternRecognitionEngine | `/backend/src/services/core/PatternRecognitionEngine.ts` | Pattern matching algorithm + scoring |
| TrustCalibrationService | `/backend/src/services/core/TrustCalibrationService.ts` | User trust assessment |
| SkillMonitoringService | `/backend/src/services/core/SkillMonitoringService.ts` | Skill tracking and alerts |

### Type Definitions
| Types | Location |
|-------|----------|
| Core Interfaces | `/backend/src/types/index.ts` |
| Pattern, Prediction, Evolution interfaces | Same file |

### Main Application
| File | Location | Purpose |
|------|----------|---------|
| Entry Point | `/backend/src/index.ts` | Server initialization, route registration |
| Database Config | `/backend/src/config/database.ts` | PostgreSQL connection pool |
| Redis Config | `/backend/src/config/redis.ts` | Redis client setup |

---

## Key Code Snippets by Feature

### 1. Pattern Detection Algorithm
**File**: `/backend/src/routes/patterns.ts` (lines 40-128)

```typescript
function detectPattern(features: FeatureVector)
  - Key decision: reflectionDepth = 0 → Pattern F (95% confidence)
  - Hierarchical checks: F detection first, then A, D, C, B defaults to A
  - Confidence: 0.50 to 0.95
```

### 2. Feature Vector Calculation
**File**: `/backend/src/routes/patterns.ts` (lines 133-196)

```typescript
async function calculateFeatures(sessionId: string)
  - Queries interactions for session
  - Calculates 12 features from interaction data
  - Handles empty sessions with default values
```

### 3. Evolution Type Detection
**File**: `/backend/src/routes/evolution.ts` (lines 12-38)

```typescript
function detectEvolution(previousPattern, currentPattern)
  - Uses improvement hierarchy: F > E > D > C > B > A
  - Returns: 'improvement', 'regression', 'oscillation', or 'stable'
```

### 4. Dashboard Data Loading
**File**: `/frontend/src/pages/DashboardPage.tsx` (lines 69-86)

```typescript
useEffect(() => {
  fetchPatterns();
  fetchPredictions();
  fetchEvolutions();
}, []);

// Metric calculations: lines 80-94
const predictionAccuracy = (correctPredictions / totalPredictions) * 100
const currentPattern = userPatterns[0] (most recent)
const improvementCount = evolutions.filter(e => e.changeType === 'improvement')
```

### 5. Pattern Store Actions
**File**: `/frontend/src/stores/patternStore.ts` (lines 70-173)

```typescript
// Fetch actions
fetchPatterns(userId?: string)
fetchPredictions(userId?: string)
fetchEvolutions(userId?: string)

// Create/Update actions
createPrediction(taskId, context)
submitFeedback(predictionId, feedback, isCorrect)
```

### 6. API Endpoints Structure
**File**: `/frontend/src/services/api.ts` (lines 118-308)

```typescript
// Organized by resource:
apiService.patterns.list, .get, .getUserPattern, .analyze
apiService.evolution.list, .get, .getUserEvolution, .track, .stats
apiService.predictions.list, .get, .predict, .submitFeedback
apiService.analytics.summary, .userMetrics, .patterns
```

---

## Data Flow Files Map

```
User Chat Input
         │
         ▼
/sessions/:id (ChatSessionPage)
         │
         ▼
POST /api/interactions
(interactions.ts)
         │
         ▼
interactions table (database)
         │
         ▼
POST /api/patterns/analyze
(patterns.ts)
  ├─ calculateFeatures()
  ├─ detectPattern()
  └─ Save pattern_logs
         │
         ▼
POST /api/evolution/track
(evolution.ts)
  ├─ detectEvolution()
  └─ Save evolution_logs
         │
         ▼
Dashboard Display
(DashboardPage.tsx)
  ├─ GET /api/patterns/:userId
  ├─ GET /api/evolution/:userId
  ├─ GET /api/predictions
  └─ GET /api/sessions
```

---

## Useful Database Queries

### Get User's Pattern History
```sql
SELECT pl.detected_pattern, pl.confidence, pl.created_at
FROM pattern_logs pl
JOIN sessions s ON pl.session_id = s.id
WHERE s.user_id = $1
ORDER BY pl.created_at DESC;
```

### Get Evolution Statistics
```sql
SELECT change_type, COUNT(*) as count
FROM evolution_logs
WHERE user_id = $1
GROUP BY change_type;
```

### Get Latest Pattern
```sql
SELECT detected_pattern, confidence, features
FROM pattern_logs pl
JOIN sessions s ON pl.session_id = s.id
WHERE s.user_id = $1
ORDER BY pl.created_at DESC
LIMIT 1;
```

### Get Interaction Metrics
```sql
SELECT
  COUNT(*) as total_interactions,
  SUM(CASE WHEN was_verified THEN 1 ELSE 0 END) as verified_count,
  SUM(CASE WHEN was_modified THEN 1 ELSE 0 END) as modified_count,
  AVG(prompt_word_count) as avg_prompt_length,
  AVG(response_time) as avg_response_time
FROM interactions i
JOIN sessions s ON i.session_id = s.id
WHERE s.user_id = $1;
```

---

## API Response Structure

### Pattern Response
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
      "reasoning": ["reason1", "reason2"]
    }
  },
  "timestamp": "ISO-8601"
}
```

### Evolution Response
```json
{
  "success": true,
  "data": {
    "evolution": {
      "id": "uuid",
      "currentPattern": "B",
      "previousPattern": "C",
      "changeType": "improvement",
      "confidence": 0.85
    }
  },
  "message": "Pattern improvement: C → B"
}
```

### Analytics Response
```json
{
  "success": true,
  "data": {
    "sessions": { /* metrics */ },
    "patterns": { "distribution": {}, "mostRecent": {} },
    "interactions": { /* metrics */ },
    "alerts": { /* counts */ }
  }
}
```

---

## Testing & Development

### Test Files
| Test | Location |
|------|----------|
| Pattern Evolution Tracker | `/frontend/src/__tests__/pattern-evolution-tracker.test.ts` |
| Predictions | `/frontend/src/pages/PredictionsPage.tsx` |
| Pattern Engine | `/backend/src/services/core/__tests__/PatternRecognitionEngine.test.ts` |

### Documentation Files
| Doc | Location | Content |
|-----|----------|---------|
| System Architecture | `/01-System-Architecture.md` | Overall design |
| Pattern Definitions | `/03-Pattern-Definitions.md` | 6 pattern types detailed |
| API Specifications | `/05-API-Specifications.md` | API documentation |
| Database Schema | `/04-Database-Schema.md` | SQL structure |

---

## Key Metrics & Calculations

### Prediction Accuracy
```
Accuracy = (Count where isCorrect === true) / Total Predictions * 100
Shown in: Dashboard metric card + PredictionsPage
```

### Current Pattern
```
Selection = patterns.filter(p => p.userId === user.id)[0] (most recent)
Shown in: Dashboard + PatternsPage
```

### Evolution Count
```
Total = evolutions.filter(e => e.userId === user.id).length
Improvements = evolutions.filter(e => e.changeType === 'improvement').length
Shown in: Dashboard + EvolutionTrackingPage
```

### Verification Rate
```
Rate = (Count where wasVerified === true) / Total Interactions
Range: 0-1 (normalized)
Used in: Feature vector calculation
```

### Pattern Confidence
```
Range: 0.50 (default) to 0.95 (Pattern F certain)
Reflects: How certain the algorithm is about the classification
Shown in: All pattern displays
```

---

## Common Development Tasks

### Add New Pattern Type
1. Update Pattern type union: `type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'`
2. Add detection logic in `detectPattern()` function
3. Add pattern definition in PATTERN_DEFINITIONS
4. Update PatternRecognitionEngine thresholds
5. Update frontend descriptions in patterns.ts

### Modify Feature Vector
1. Edit `FeatureVector` interface in patterns.ts
2. Update `calculateFeatures()` function
3. Adjust thresholds in detection logic
4. Test with existing sessions

### Add Prediction Endpoint
1. Create `POST /api/predictions/predict` in new file
2. Implement ML model prediction
3. Save to predictions table
4. Add tests
5. Update frontend to call endpoint

### Add New Dashboard Metric
1. Add calculation to DashboardPage.tsx
2. Get data from appropriate store
3. Add metric card component
4. Style to match existing cards

