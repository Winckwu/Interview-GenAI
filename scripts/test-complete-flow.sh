#!/bin/bash

# Complete End-to-End Test Script for Interview-GenAI
# Tests: Registration -> Login -> Session Creation -> Message Sending

API_URL="http://localhost:5001/api"
EMAIL="testuser@example.com"
PASSWORD="Test123456"
USERNAME="testuser123"

echo "====== Interview-GenAI E2E Test ======"
echo ""

# Test 1: Register User
echo "1️⃣  Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$EMAIL\",
    \"password\":\"$PASSWORD\",
    \"username\":\"$USERNAME\",
    \"userType\":\"efficient\"
  }")

REGISTER_SUCCESS=$(echo $REGISTER_RESPONSE | grep -o '"success":true' | head -1)
if [ -z "$REGISTER_SUCCESS" ]; then
  echo "❌ Registration failed"
  echo "Response: $REGISTER_RESPONSE"
else
  echo "✅ Registration successful"
fi

echo ""

# Test 2: Login
echo "2️⃣  Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$EMAIL\",
    \"password\":\"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
LOGIN_SUCCESS=$(echo $LOGIN_RESPONSE | grep -o '"success":true' | head -1)

if [ -z "$LOGIN_SUCCESS" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
else
  echo "✅ Login successful"
  echo "   Token: ${TOKEN:0:20}..."
fi

echo ""

# Test 3: Create Chat Session
echo "3️⃣  Testing Chat Session Creation..."
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/sessions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\":\"Test Session\",
    \"description\":\"Testing the chat functionality\"
  }")

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
SESSION_SUCCESS=$(echo $SESSION_RESPONSE | grep -o '"success":true' | head -1)

if [ -z "$SESSION_SUCCESS" ] || [ -z "$SESSION_ID" ]; then
  echo "❌ Session creation failed"
  echo "Response: $SESSION_RESPONSE"
  exit 1
else
  echo "✅ Session created successfully"
  echo "   Session ID: ${SESSION_ID:0:20}..."
fi

echo ""

# Test 4: Send Message to AI
echo "4️⃣  Testing AI Chat (sending message)..."
AI_RESPONSE=$(curl -s -X POST "$API_URL/ai/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"userPrompt\":\"What is the capital of France?\",
    \"conversationHistory\":[]
  }")

AI_SUCCESS=$(echo $AI_RESPONSE | grep -o '"success":true' | head -1)
AI_CONTENT=$(echo $AI_RESPONSE | grep -o '"content":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$AI_SUCCESS" ]; then
  echo "❌ AI chat failed"
  echo "Response: $AI_RESPONSE"
else
  echo "✅ AI chat successful"
  echo "   Response: ${AI_CONTENT:0:100}..."
fi

echo ""

# Test 5: Fetch Patterns
echo "5️⃣  Testing Pattern Fetch..."
PATTERNS_RESPONSE=$(curl -s -X GET "$API_URL/patterns" \
  -H "Authorization: Bearer $TOKEN")

PATTERNS_SUCCESS=$(echo $PATTERNS_RESPONSE | grep -o '"success":true' | head -1)

if [ -z "$PATTERNS_SUCCESS" ]; then
  echo "❌ Pattern fetch failed"
  echo "Response: $PATTERNS_RESPONSE"
else
  echo "✅ Pattern fetch successful"
fi

echo ""
echo "====== All Tests Complete ======"
echo ""
echo "Summary:"
echo "✅ = Feature working"
echo "❌ = Feature not working"
echo ""
echo "If all tests passed, your system is ready to use!"
