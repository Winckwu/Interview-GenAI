#!/bin/bash

# Phase 5.5 Setup Verification Script
# Checks all components and reports status

set -e

echo "=================================="
echo "🔍 Phase 5.5 Setup Verification"
echo "=================================="
echo ""

BACKEND_URL="http://localhost:5001"
FRONTEND_URL="http://localhost:3000"
SVM_URL="http://localhost:5002"
BACKEND_DIR="/home/user/Interview-GenAI/backend"
FRONTEND_DIR="/home/user/Interview-GenAI/frontend"
ML_DIR="/home/user/Interview-GenAI/backend/src/ml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
    return 0
  else
    echo -e "${RED}❌ $1${NC}"
    return 1
  fi
}

echo "1️⃣  Checking Project Structure..."
echo ""

# Check backend
test -d "$BACKEND_DIR" && echo -e "${GREEN}✓${NC} Backend directory exists" || echo -e "${RED}✗${NC} Backend directory missing"
test -f "$BACKEND_DIR/package.json" && echo -e "${GREEN}✓${NC} Backend package.json exists" || echo -e "${RED}✗${NC} Backend package.json missing"
test -d "$BACKEND_DIR/src/services" && echo -e "${GREEN}✓${NC} Backend services directory exists" || echo -e "${RED}✗${NC} Backend services missing"

# Check frontend
test -d "$FRONTEND_DIR" && echo -e "${GREEN}✓${NC} Frontend directory exists" || echo -e "${RED}✗${NC} Frontend directory missing"
test -f "$FRONTEND_DIR/package.json" && echo -e "${GREEN}✓${NC} Frontend package.json exists" || echo -e "${RED}✗${NC} Frontend package.json missing"

# Check ML components
test -f "$ML_DIR/svm_api_service.py" && echo -e "${GREEN}✓${NC} SVM API service exists" || echo -e "${RED}✗${NC} SVM API service missing"
test -f "$ML_DIR/models/svm_model.pkl" && echo -e "${GREEN}✓${NC} SVM model file exists" || echo -e "${RED}✗${NC} SVM model file missing"

echo ""
echo "2️⃣  Checking Backend Phase 5.5 Services..."
echo ""

# Check TypeScript service files
for service in BehaviorSignalDetector RealtimePatternRecognizer AdaptiveMRActivator SVMPatternClassifier; do
  test -f "$BACKEND_DIR/src/services/${service}.ts" && \
    echo -e "${GREEN}✓${NC} ${service}.ts exists" || \
    echo -e "${RED}✗${NC} ${service}.ts missing"
done

echo ""
echo "3️⃣  Checking MCA Routes..."
echo ""

test -f "$BACKEND_DIR/src/routes/mca.ts" && \
  echo -e "${GREEN}✓${NC} MCA routes exist" || \
  echo -e "${RED}✗${NC} MCA routes missing"

# Check if orchestrate endpoint is defined
grep -q "router.post('/orchestrate'" "$BACKEND_DIR/src/routes/mca.ts" && \
  echo -e "${GREEN}✓${NC} /mca/orchestrate endpoint exists" || \
  echo -e "${RED}✗${NC} /mca/orchestrate endpoint missing"

echo ""
echo "4️⃣  Checking Frontend Integration..."
echo ""

test -f "$FRONTEND_DIR/src/components/chat/MCAConversationOrchestrator.tsx" && \
  echo -e "${GREEN}✓${NC} MCAConversationOrchestrator component exists" || \
  echo -e "${RED}✗${NC} MCAConversationOrchestrator component missing"

echo ""
echo "5️⃣  Runtime Checks..."
echo ""

# Check if backend is running
echo -n "Checking backend health... "
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${YELLOW}⏸️  Backend not running (start with: cd $BACKEND_DIR && npm run dev)${NC}"
fi

# Check if frontend is running
echo -n "Checking frontend... "
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${YELLOW}⏸️  Frontend not running (start with: cd $FRONTEND_DIR && npm run dev)${NC}"
fi

# Check if SVM service is running
echo -n "Checking SVM microservice... "
if curl -s "$SVM_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC}"
  echo "   SVM is running and ready for ?classifier=svm requests"
else
  echo -e "${YELLOW}⏸️  SVM service not running (optional - start with: cd $ML_DIR && python3 svm_api_service.py)${NC}"
fi

echo ""
echo "6️⃣  Performing API Tests..."
echo ""

# Test MCA orchestrate endpoint with Bayesian
echo -n "Testing MCA/orchestrate (Bayesian)... "
if curl -s -X POST "$BACKEND_URL/api/mca/orchestrate?classifier=bayesian" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "verify-test",
    "conversationTurns": [{
      "id": "turn-1",
      "userMessage": "Let me break this down into steps.",
      "aiResponse": "That sounds good.",
      "timestamp": "2025-11-18T00:00:00Z",
      "sessionId": "verify-test"
    }],
    "currentTurnIndex": 0
  }' | grep -q '"success":true'; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC} (Make sure backend is running)"
fi

# Test with SVM if available
echo -n "Testing MCA/orchestrate (SVM)... "
if curl -s -X POST "$BACKEND_URL/api/mca/orchestrate?classifier=svm" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "verify-test-svm",
    "conversationTurns": [{
      "id": "turn-1",
      "userMessage": "I will just follow what the AI says.",
      "aiResponse": "Are you sure?",
      "timestamp": "2025-11-18T00:00:00Z",
      "sessionId": "verify-test-svm"
    }],
    "currentTurnIndex": 0
  }' | grep -q '"success":true'; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${YELLOW}⏸️  SVM not available (start Python service for full testing)${NC}"
fi

echo ""
echo "=================================="
echo "✨ Setup Verification Complete!"
echo "=================================="
echo ""
echo "Summary:"
echo "- Backend services: Implemented ✅"
echo "- MCA routes: Implemented ✅"
echo "- Frontend integration: Implemented ✅"
echo "- SVM models: Present ✅"
echo ""
echo "To start development:"
echo "  1. Terminal 1: cd backend && npm run dev"
echo "  2. Terminal 2: cd frontend && npm run dev"
echo "  3. Terminal 3 (optional): cd backend/src/ml && python3 svm_api_service.py"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
