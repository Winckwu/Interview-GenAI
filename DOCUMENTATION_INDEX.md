# Documentation Index - Interview-GenAI MCA System

Welcome to the Interview-GenAI documentation. All documentation has been reorganized into the `docs/` directory for better organization.

## 📚 Main Documentation Hub

**→ See [docs/README.md](./docs/README.md) for the complete documentation index**

## Quick Navigation

### Start Here
- **New to the system?** → Read [docs/reports/COMPREHENSIVE_SUMMARY.md](./docs/reports/COMPREHENSIVE_SUMMARY.md) first (5 min read)
- **Want to get started quickly?** → Check [docs/setup/QUICKSTART.md](./docs/setup/QUICKSTART.md)
- **Need specific code locations?** → Use [docs/reports/FILE_LOCATIONS_REFERENCE.md](./docs/reports/FILE_LOCATIONS_REFERENCE.md)
- **Want detailed explanations?** → Read [docs/architecture/DATA_FLOW_OVERVIEW.md](./docs/architecture/DATA_FLOW_OVERVIEW.md)

---

## Documentation Categories

### 📚 [Setup & Installation](./docs/setup/)
Guides for setting up and configuring the system
- Complete setup guide
- Quickstart guides
- Platform-specific fixes

### 🏗️ [System Architecture](./docs/architecture/)
Technical architecture and design documentation
- System architecture overview
- Database schema
- Data flow diagrams
- Complete system strategies

### 📖 [User Guides](./docs/guides/)
How-to guides for using system features
- Chat features guide
- Pattern detection guide
- Verification tools
- Troubleshooting

### 🚀 [Implementation Phases](./docs/phases/)
Documentation for each development phase
- Phase completion summaries
- Implementation guides
- Verification checklists

### 🧩 [Components & MR](./docs/components/)
MR (Metacognitive Regulation) component documentation
- 19 Meta-requirements specifications
- Frontend component specs
- MR design rationale
- See also: [frontend/src/components/mr/README.md](./frontend/src/components/mr/README.md)

### 🔬 [Research](./docs/research/)
Research papers and empirical foundations
- MCA system research paper
- Empirical foundation supplements
- Pattern definitions
- Member check validation

### 📊 [Reports & Status](./docs/reports/)
Project reports, summaries, and validation
- Comprehensive summary
- Executive summary
- System validation reports
- Optimization results

**Start with this if you want to**: Deep technical understanding of how the system works

---

### 3. FILE_LOCATIONS_REFERENCE.md
**Purpose**: Quick code navigation
**Length**: 5-10 min read
**Best for**: Finding specific files, understanding where features are implemented

**Sections**:
1. **Frontend Files** (Pages, Stores, Services)
2. **Backend Files** (Routes, Services, Types)
3. **Key Code Snippets** (6 sections with line numbers)
4. **Data Flow Files Map** (Visual file navigation)
5. **Useful Database Queries** (Common SQL queries)
6. **API Response Structures** (JSON examples)
7. **Testing & Development** (Test files and docs)
8. **Key Metrics & Calculations** (How metrics are computed)
9. **Common Development Tasks** (How to add features)

**Start with this if you want to**: Find and modify specific code quickly

---

## Topic-Based Quick Links

### Understanding Patterns
- **What are the 6 patterns?** → `COMPREHENSIVE_SUMMARY.md` → The 6 AI Usage Patterns
- **How are patterns detected?** → `DATA_FLOW_OVERVIEW.md` → Pattern Detection Algorithm
- **Pattern detection code** → `/backend/src/routes/patterns.ts` (lines 40-128)

### Understanding Evolution
- **What is evolution tracking?** → `COMPREHENSIVE_SUMMARY.md` → Evolution Tracking
- **How are changes detected?** → `DATA_FLOW_OVERVIEW.md` → Evolution Tracking
- **Evolution code** → `/backend/src/routes/evolution.ts` (lines 12-38)

### Understanding Predictions
- **What are predictions?** → `COMPREHENSIVE_SUMMARY.md` → Prediction System
- **Current status** → Currently a placeholder (empty array response)
- **How to implement** → `COMPREHENSIVE_SUMMARY.md` → Prediction System (Implementation Needed)
- **Predictions code** → `/frontend/src/pages/PredictionsPage.tsx`

### Understanding the Dashboard
- **What data is displayed?** → `COMPREHENSIVE_SUMMARY.md` → Dashboard Display
- **How is data loaded?** → `DATA_FLOW_OVERVIEW.md` → Dashboard Data Loading
- **Dashboard code** → `/frontend/src/pages/DashboardPage.tsx`

### Understanding the Database
- **Table structure** → `DATA_FLOW_OVERVIEW.md` → Database Schema
- **Useful queries** → `FILE_LOCATIONS_REFERENCE.md` → Useful Database Queries
- **Example: Get user patterns** → Query in File Locations Reference

### Understanding the API
- **All endpoints** → `DATA_FLOW_OVERVIEW.md` → API Endpoints
- **Endpoint structure** → `FILE_LOCATIONS_REFERENCE.md` → API Response Structure
- **Backend routes** → `/backend/src/routes/` (patterns.ts, evolution.ts, etc.)

### Understanding Frontend Integration
- **Data loading** → `DATA_FLOW_OVERVIEW.md` → Dashboard Data Loading
- **API client** → `/frontend/src/services/api.ts`
- **State management** → `/frontend/src/stores/patternStore.ts`
- **Pages** → `/frontend/src/pages/` (Dashboard, Patterns, Evolution, Predictions)

---

## The Data Flow (Quick Version)

```
User Interaction (Chat)
    ↓
POST /api/interactions (Log interaction with metrics)
    ↓
POST /api/patterns/analyze (Calculate features + detect pattern)
    ↓
POST /api/evolution/track (Compare to previous, track change)
    ↓
GET /api/patterns/:userId (Fetch for dashboard)
GET /api/evolution/:userId (Fetch for dashboard)
GET /api/predictions (Fetch prediction data)
    ↓
Dashboard Display (Show metrics + charts)
```

**For detailed flow**: See `DATA_FLOW_OVERVIEW.md` → Data Flow: User Interactions to Patterns

---

## Key Code Files

### Must Read Files

1. **Pattern Detection Logic**
   - File: `/backend/src/routes/patterns.ts`
   - Lines: 40-128 (detectPattern function)
   - Why: Core algorithm that classifies behavior

2. **Feature Calculation**
   - File: `/backend/src/routes/patterns.ts`
   - Lines: 133-196 (calculateFeatures function)
   - Why: How interaction data becomes features

3. **Evolution Detection**
   - File: `/backend/src/routes/evolution.ts`
   - Lines: 12-38 (detectEvolution function)
   - Why: How pattern changes are classified

4. **Dashboard Data Loading**
   - File: `/frontend/src/pages/DashboardPage.tsx`
   - Lines: 69-86 (useEffect and calculations)
   - Why: How data flows to UI

5. **Data Structures**
   - File: `/backend/src/types/index.ts`
   - Why: Understanding all interfaces

6. **State Management**
   - File: `/frontend/src/stores/patternStore.ts`
   - Why: How frontend manages pattern data

### Reference Files

- **API Client**: `/frontend/src/services/api.ts` (Type-safe API endpoints)
- **Sessions Store**: `/frontend/src/stores/sessionStore.ts` (Session management)
- **Database Config**: `/backend/src/config/database.ts` (DB connection)

---

## Understanding the Patterns

### Quick Pattern Reference

| Pattern | Users | Risk | Key Features |
|---------|-------|------|--------------|
| A | 20.4% | Low | High verification, careful planning |
| B | 10.2% | Low | Iterative, questions outputs |
| C | 44.9% | Medium | Adaptive, strategy switching |
| D | 18.4% | Low | Deep verification, critical thinking |
| E | 2.0% | Medium | Teaching-focused, reflection |
| F | 4.1% | Critical | Passive, uncritical acceptance |

**For detailed patterns**: See `COMPREHENSIVE_SUMMARY.md` → The 6 AI Usage Patterns

---

## Understanding the Features

### The 12-Feature Vector

**Planning** (P1-P4):
- Prompt specificity
- Task decomposition
- Strategy diversity
- Independent attempts

**Monitoring** (M1-M3):
- Verification rate (KEY for detection)
- Trust calibration
- Session patterns

**Evaluation** (E1-E3):
- Modification rate
- Reflection depth (KEY for Pattern F)
- Error awareness

**Regulation** (R1-R2):
- Iteration frequency
- Cross-model usage

**For detailed features**: See `COMPREHENSIVE_SUMMARY.md` → Feature Detection

---

## Common Tasks

### "I want to understand how..."

**...patterns are detected?**
1. Read: `COMPREHENSIVE_SUMMARY.md` → Feature Detection (3 min)
2. Read: `DATA_FLOW_OVERVIEW.md` → Pattern Detection Algorithm (5 min)
3. Code: `/backend/src/routes/patterns.ts` lines 40-128 (10 min)

**...evolution tracking works?**
1. Read: `COMPREHENSIVE_SUMMARY.md` → Evolution Tracking (2 min)
2. Read: `DATA_FLOW_OVERVIEW.md` → Evolution Tracking (3 min)
3. Code: `/backend/src/routes/evolution.ts` lines 12-38 (5 min)

**...the dashboard loads data?**
1. Read: `COMPREHENSIVE_SUMMARY.md` → Dashboard Display (2 min)
2. Read: `DATA_FLOW_OVERVIEW.md` → Dashboard Data Loading (3 min)
3. Code: `/frontend/src/pages/DashboardPage.tsx` lines 69-86 (5 min)

**...predictions will work?**
1. Read: `COMPREHENSIVE_SUMMARY.md` → Prediction System (3 min)
2. Read: `DATA_FLOW_OVERVIEW.md` → Prediction System (5 min)

**...to modify pattern detection?**
1. Reference: `COMPREHENSIVE_SUMMARY.md` → Key Insights (5 min)
2. Reference: `FILE_LOCATIONS_REFERENCE.md` → Common Development Tasks
3. Code: `/backend/src/routes/patterns.ts` (modify thresholds)

**...to add a new metric?**
1. Reference: `COMPREHENSIVE_SUMMARY.md` → Key Insights
2. Reference: `FILE_LOCATIONS_REFERENCE.md` → Common Development Tasks
3. Code: Choose appropriate location

---

## FAQ Quick Answers

**Q: What's the current status of predictions?**
A: Placeholder only - returns empty array. See `COMPREHENSIVE_SUMMARY.md` → Prediction System

**Q: Why is Pattern F important?**
A: It indicates passive, uncritical AI reliance (critical risk). Most reliable signal: reflectionDepth = 0

**Q: How many features are used for pattern detection?**
A: 12 features organized in 4 dimensions (Planning, Monitoring, Evaluation, Regulation)

**Q: What determines if a pattern change is an "improvement"?**
A: Moving toward more efficient patterns: F→E→D→C→B→A hierarchy

**Q: Where is the dashboard data coming from?**
A: GET requests to /api/patterns, /api/evolution, /api/predictions, /api/analytics

**Q: What's the confidence score range?**
A: 0.50 (conservative default) to 0.95 (Pattern F with strongest signals)

**Q: How is prediction accuracy calculated?**
A: (Correct Predictions / Total Predictions) * 100

**Q: Is Pattern F underrepresented?**
A: Yes - only 4.1% of empirical data (2/49 users). Synthetic augmentation planned.

---

## Recommended Reading Order

### For Understanding the System
1. `COMPREHENSIVE_SUMMARY.md` (20 min) - Big picture
2. `DATA_FLOW_OVERVIEW.md` Sections 1-3 (15 min) - Data structures + endpoints + flow
3. Code review (30 min) - See actual implementation

### For Quick Code Navigation
1. `FILE_LOCATIONS_REFERENCE.md` (5 min) - Find files
2. Go directly to needed code

### For Complete Understanding
1. `COMPREHENSIVE_SUMMARY.md` (20 min)
2. `DATA_FLOW_OVERVIEW.md` (30 min) - Full read
3. `FILE_LOCATIONS_REFERENCE.md` (10 min) - Reference
4. Code review all key files (60 min)

---

## Document Locations

All documentation files are in the root directory:

```
/home/user/Interview-GenAI/
├── COMPREHENSIVE_SUMMARY.md          (This is a good start!)
├── DATA_FLOW_OVERVIEW.md             (Complete technical reference)
├── FILE_LOCATIONS_REFERENCE.md       (File navigation + queries)
├── DOCUMENTATION_INDEX.md            (This file)
├── 
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PatternsPage.tsx
│   │   │   ├── PredictionsPage.tsx
│   │   │   └── EvolutionTrackingPage.tsx
│   │   ├── stores/
│   │   │   └── patternStore.ts
│   │   └── services/
│   │       └── api.ts
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── patterns.ts
│   │   │   ├── evolution.ts
│   │   │   ├── interactions.ts
│   │   │   └── analytics.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── services/core/
│   │   │   ├── PatternRecognitionEngine.ts
│   │   │   └── TrustCalibrationService.ts
│   │   ├── index.ts
│   │   └── ...
│   └── ...
└── ...
```

---

## Next Steps

1. **Start Reading**: Pick one of the 3 documents based on your needs
2. **Navigate Code**: Use `FILE_LOCATIONS_REFERENCE.md` to find files
3. **Understand Flow**: Follow the data flow diagrams
4. **Review Code**: Look at actual implementation in the codebase
5. **Ask Questions**: Reference the appropriate documentation section

---

**Generated**: November 18, 2025
**System**: Interview-GenAI - AI Usage Pattern Recognition & Evolution Tracking
**Status**: Complete documentation of current implementation

