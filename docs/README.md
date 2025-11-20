# Interview-GenAI Documentation

Welcome to the comprehensive documentation for the Interview-GenAI Metacognitive Calibration Architecture (MCA) system.

## Documentation Structure

### 📚 [Setup Guides](./setup/)
Get started with the system installation and configuration.

- **COMPLETE_SETUP_GUIDE.md** - Comprehensive setup instructions
- **QUICKSTART.md** - Quick start guide for developers
- **QUICK_START_GUIDE.md** - Alternative quick start
- **MAC_QUICK_FIX.md** - Mac-specific setup fixes
- **PATTERN_ENHANCEMENT_SETUP_GUIDE.md** - Pattern detection setup

### 🏗️ [Architecture](./architecture/)
System design and architectural documentation.

- **01-System-Architecture.md** - Overall system architecture
- **04-Database-Schema.md** - Database design and schema
- **ASYNC_INTERVENTION_ARCHITECTURE.md** - Asynchronous intervention design
- **DASHBOARD_DATA_FLOW.md** - Dashboard data flow diagrams
- **DATA_FLOW_OVERVIEW.md** - System-wide data flow
- **ETHICAL_INTERVENTION_DESIGN.md** - Ethical considerations
- **COMPLETE_SYSTEM_STRATEGIES_DOCUMENTATION.md** - Complete strategies

### 🔌 [API Documentation](./api/)
API specifications and endpoints.

- **05-API-Specifications.md** - Complete API reference

### 📖 [User Guides](./guides/)
Guides for using different system features.

- **BACKEND_ADMIN_GUIDE.md** - Backend administration
- **CHAT_FEATURES_GUIDE.md** - Chat interface features
- **PATTERN_DETECTION_GUIDE.md** - Pattern detection usage
- **PREDICTIONS-PAGE-GUIDE.md** - Using the predictions page
- **SVM-INTEGRATION-GUIDE.md** - SVM integration
- **VERIFICATION-TOOLS-COMPLETE-GUIDE.md** - Verification tools
- **TROUBLESHOOTING_AUTH.md** - Authentication troubleshooting

### 🚀 [Implementation Phases](./phases/)
Documentation for each development phase.

- **ALL_PHASES_COMPLETE_SUMMARY.md** - Complete phases overview
- **PHASE-2-COMPLETION-SUMMARY.md** - Phase 2 summary
- **PHASE-3-FINAL-SUMMARY.md** - Phase 3 summary
- **PHASE-5.5-DEPLOYMENT-GUIDE.md** - Phase 5.5 deployment
- **PHASE1_CROSS_SESSION_MEMORY_COMPLETE.md** - Cross-session memory
- **PHASE2_PATTERN_TRANSITION_DETECTION_COMPLETE.md** - Pattern transitions
- **PHASE3_HIGH_RISK_TASK_DETECTION_COMPLETE.md** - High-risk tasks
- **PHASE4_PATTERN_STABILITY_SVM_ENSEMBLE_COMPLETE.md** - SVM ensemble

### 🤖 [ML & Models](./ml/)
Machine learning and model documentation.

- **07-ML-Service-Design.md** - ML service architecture
- **08-Training-Data-Extraction-Guide.md** - Training data preparation
- **IMPLEMENTATION_PLAN_CROSS_SESSION_MEMORY.md** - Memory implementation
- **IMPLEMENTATION_PLAN_PATTERN_TRANSITION.md** - Transition detection
- **IMPLEMENTATION_PLAN_STABILITY_SVM.md** - SVM implementation
- **SVM-OPTIMIZATION-SUMMARY.md** - SVM optimization results
- **PATTERN_F_DETECTION_FRAMEWORK.md** - Pattern F framework

### 🧩 [Components](./components/)
MR component design and implementation docs.

- **02-19-Meta-Requirements.md** - All 19 meta-requirements
- **06-Frontend-Components.md** - Frontend component specs
- **MR_Design_Rationale.md** - MR design rationale
- **MR_IMPLEMENTATION_ANALYSIS.md** - Implementation analysis
- **MR_IMPLEMENTATION_ROADMAP.md** - Implementation roadmap

### 🔬 [Research](./research/)
Research papers and empirical foundations.

- **MCA_SYSTEM_RESEARCH_PAPER.md** - Main research paper
- **02-Empirical-Foundation-Supplement.md** - Empirical data
- **03-Pattern-Definitions.md** - Pattern definitions
- **MEMBER_CHECK_SUMMARY.md** - Member check validation

### 🎙️ [Interviews](./interviews/)
Interview transcripts and analysis.

- 49 interview transcripts (I001-I049)
- Chinese interview transcripts (受访人录音转文字)

### 📊 [Reports](./reports/)
Status reports, summaries, and validation.

- **COMPREHENSIVE_SUMMARY.md** - Overall project summary
- **EXECUTIVE-SUMMARY.md** - Executive summary
- **PROJECT-STATUS-SUMMARY.md** - Current project status
- **SYSTEM_VALIDATION_REPORT.md** - System validation
- **COMPLETE-OPTIMIZATION-REPORT.md** - Optimization results
- **IMPROVEMENT_ROADMAP.md** - Future improvements

### ✅ [Verification](./verification/)
Testing and verification documentation.

Located in `frontend/docs/` and `backend/src/ml/`:
- MR component verification reports
- Model validation reports
- Testing results

## Quick Navigation

### For New Users
1. Start with [QUICKSTART.md](./setup/QUICKSTART.md)
2. Read [COMPLETE_SETUP_GUIDE.md](./setup/COMPLETE_SETUP_GUIDE.md)
3. Explore [CHAT_FEATURES_GUIDE.md](./guides/CHAT_FEATURES_GUIDE.md)

### For Developers
1. Review [01-System-Architecture.md](./architecture/01-System-Architecture.md)
2. Check [05-API-Specifications.md](./api/05-API-Specifications.md)
3. Read [06-Frontend-Components.md](./components/06-Frontend-Components.md)

### For Researchers
1. Start with [MCA_SYSTEM_RESEARCH_PAPER.md](./research/MCA_SYSTEM_RESEARCH_PAPER.md)
2. Review [02-Empirical-Foundation-Supplement.md](./research/02-Empirical-Foundation-Supplement.md)
3. Examine [MEMBER_CHECK_SUMMARY.md](./research/MEMBER_CHECK_SUMMARY.md)

### For Administrators
1. Read [BACKEND_ADMIN_GUIDE.md](./guides/BACKEND_ADMIN_GUIDE.md)
2. Check [TROUBLESHOOTING_AUTH.md](./guides/TROUBLESHOOTING_AUTH.md)
3. Review [SYSTEM_VALIDATION_REPORT.md](./reports/SYSTEM_VALIDATION_REPORT.md)

## Additional Resources

- **Frontend Documentation**: `frontend/docs/`
- **Backend Documentation**: `backend/README.md`, `backend/TESTING.md`
- **MCA System**: `mca-system/README.md`
- **MR Components**: `frontend/src/components/mr/README.md`
- **Paper**: `paper/README.md`

## Project Structure

```
Interview-GenAI/
├── docs/                    # Centralized documentation (you are here)
│   ├── setup/              # Setup and installation
│   ├── architecture/       # System architecture
│   ├── api/               # API specifications
│   ├── guides/            # User guides
│   ├── phases/            # Implementation phases
│   ├── ml/                # ML and models
│   ├── components/        # MR components
│   ├── research/          # Research papers
│   ├── interviews/        # Interview data
│   └── reports/           # Status reports
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   └── mr/       # MR components (see mr/README.md)
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── docs/             # Frontend-specific verification docs
├── backend/               # Express backend API
│   ├── src/
│   │   ├── ml/          # ML models and analysis
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── interviews-split/ # Interview transcripts (I001-I049)
│   └── README.md
├── mca-system/           # MCA research system
└── paper/                # Research paper files
```

## Contributing to Documentation

When adding new documentation:

1. Place files in the appropriate category directory
2. Update this README.md with a brief description
3. Use clear, descriptive filenames
4. Follow markdown best practices
5. Include a table of contents for long documents

## Version History

- **2024-11**: Major reorganization - moved all documentation to centralized `docs/` directory
- **2024-10**: Phase 5.5 completion and real-time sync
- **2024-09**: Phase 4 SVM ensemble implementation
- **2024-08**: Phase 3 high-risk task detection
- **2024-07**: Phase 2 pattern transition detection
- **2024-06**: Phase 1 cross-session memory

## License

Part of the Interview-GenAI project.
