# Phase 5.5 Quick Start Guide

## 🚀 Start the System in 3 Steps

### Step 1: Verify Setup
```bash
# Run automated verification to ensure all components are in place
cd /home/user/Interview-GenAI
./VERIFY-SETUP.sh
```

Expected output: ✅ All components verified

### Step 2: Start Backend (Terminal 1)
```bash
cd /home/user/Interview-GenAI/backend
npm install  # if dependencies not installed
npm run dev
```

Expected output:
```
✓ Database connected
✓ Ready to accept connections
🚀 Interview-GenAI Backend Server
📍 Running on port 5001
```

### Step 3: Start Frontend (Terminal 2)
```bash
cd /home/user/Interview-GenAI/frontend
npm install  # if dependencies not installed
npm run dev
```

Expected output:
```
Local: http://localhost:3000/
```

## 🌐 Access the Application

Open your browser:
```
http://localhost:3000
```

---

## 🧪 Test the System

### Test 1: Backend Health Check
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-18T...","environment":"development"}
```

### Test 2: MCA Orchestration (Bayesian)
```bash
curl -X POST http://localhost:5001/api/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-1",
    "conversationTurns": [{
      "id": "turn-1",
      "userMessage": "Let me break this down into smaller tasks.",
      "aiResponse": "That sounds like a good approach.",
      "timestamp": "2025-11-18T10:00:00Z",
      "sessionId": "test-1"
    }],
    "currentTurnIndex": 0
  }'
```

Expected response includes:
- `success: true`
- `pattern.topPattern: "A"` (strategic decomposition)
- `activeMRs: [...]` (triggered metacognitive reflections)
- `classifier: "bayesian"`

### Test 3: High-Risk Pattern Detection
```bash
curl -X POST http://localhost:5001/api/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-high-risk",
    "conversationTurns": [{
      "id": "turn-1",
      "userMessage": "I will just do whatever the AI says without checking.",
      "aiResponse": "Are you sure you should do that?",
      "timestamp": "2025-11-18T10:00:00Z",
      "sessionId": "test-high-risk"
    }],
    "currentTurnIndex": 0
  }'
```

Expected response:
- `isHighRiskF: true` (high-risk behavior detected)
- `activeMRs` includes high-priority interventions

---

## 🔧 Optional: Start SVM Microservice (Terminal 3)

For better accuracy (72.73% vs Bayesian 59%):

```bash
cd /home/user/Interview-GenAI/backend/src/ml

# Install Python dependencies (one time)
pip3 install flask numpy pandas scikit-learn

# Start the service
python3 svm_api_service.py
```

Expected output:
```
✅ Model loaded successfully
 * Running on http://localhost:5002
```

Then test with SVM classifier:
```bash
curl -X POST "http://localhost:5001/api/mca/orchestrate?classifier=svm" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-svm", ...}'
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────┐
│          Frontend (React)                    │
│  MCAConversationOrchestrator Hook            │
│  Shows 3 types of MRs: inline, sidebar, modal│
└─────────────┬───────────────────────────────┘
              │ HTTP POST
              ▼
┌─────────────────────────────────────────────┐
│     Backend (Express/TypeScript)             │
│  POST /api/mca/orchestrate                  │
│  ?classifier=bayesian|svm                   │
└─────────────┬───────────────────────────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
┌──────────────┐   ┌───────────────────────┐
│ Layer 1      │   │                       │
│ Behavior     │   │ Layer 2: Pattern      │
│ Signal       │   │ Recognition           │
│ Detector     │   │                       │
│ (12 signals) │   │ ├─ Bayesian (fast)    │
└──────────────┘   │ └─ SVM (accurate)     │
     │             │       │ HTTP POST      │
     │             │       ▼                │
     │             │   ┌──────────────────┐ │
     │             │   │ Python Service   │ │
     │             │   │ (port 5002)      │ │
     │             │   │ svm_model.pkl    │ │
     │             │   └──────────────────┘ │
     │             └───────────────────────┘
     │
     └─────────────────────┬─────────────────┐
                           ▼
                    ┌──────────────┐
                    │ Layer 3:     │
                    │ Adaptive MR  │
                    │ Activator    │
                    │ (6 rules)    │
                    └──────────────┘
```

---

## 🎯 Key Differences

### Bayesian Classifier (Default)
- ✅ No external dependencies
- ✅ Always available
- ✅ Fast (15-25ms)
- ⚠️ Lower accuracy (59%)

### SVM Classifier (Optional)
- ✅ Higher accuracy (72.73%)
- ✅ Perfect Pattern F detection (100%)
- ✅ ML-based predictions
- ⚠️ Requires Python microservice
- ⚠️ Slower (100-150ms)

**Recommendation**: Start with Bayesian, optionally enable SVM for production.

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `backend/src/services/BehaviorSignalDetector.ts` | Extracts 12 signals |
| `backend/src/services/RealtimePatternRecognizer.ts` | Bayesian classification |
| `backend/src/services/SVMPatternClassifier.ts` | SVM integration |
| `backend/src/services/AdaptiveMRActivator.ts` | MR activation rules |
| `backend/src/routes/mca.ts` | API endpoints |
| `frontend/src/components/chat/MCAConversationOrchestrator.tsx` | React component |
| `backend/src/ml/svm_api_service.py` | Python service |
| `backend/src/ml/models/svm_model.pkl` | Trained SVM model |

---

## 🐛 Troubleshooting

### "Port 5001 is already in use"
```bash
# Find and kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

### "Cannot connect to backend"
```bash
# Check backend is running
curl http://localhost:5001/health

# Check CORS is configured correctly
# Edit backend/.env: CORS_ORIGIN=http://localhost:3000
```

### "SVM service not available"
This is normal! The system automatically falls back to Bayesian.
Optionally start Python service on Terminal 3.

### "TypeScript compilation errors"
```bash
cd backend
npm run typecheck
npm run build
```

---

## 📈 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads on http://localhost:3000
- [ ] Backend health check passes
- [ ] Can call /api/mca/orchestrate endpoint
- [ ] Bayesian classifier returns results
- [ ] High-risk Pattern F detection works
- [ ] (Optional) SVM service starts
- [ ] (Optional) SVM classifier works

---

## 📚 Full Documentation

For detailed information, see:
- **PHASE-5.5-DEPLOYMENT-GUIDE.md** - Complete deployment guide
- **PHASE-5.5-IMPLEMENTATION-SUMMARY.md** - What was built
- **SVM-QUICK-START.md** - SVM setup guide
- **SVM-INTEGRATION-GUIDE.md** - Technical details

---

## ✅ Next Steps

1. **Develop**: Modify services in `backend/src/services/`
2. **Test**: Run API tests with different classifiers
3. **Deploy**: Follow PHASE-5.5-DEPLOYMENT-GUIDE.md for production
4. **Monitor**: Check logs for MCA analysis results
5. **Optimize**: Retrain SVM with new data if needed

---

**Status**: ✅ Ready for Development & Testing
**Date**: 2025-11-18
**Support**: See documentation files for detailed help
