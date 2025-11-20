# Cross-Session Memory Testing Guide

## Prerequisites

1. ✅ Database migration completed (pattern_detections table exists with probabilities column)
2. ✅ Backend server running on port 3001
3. ✅ PostgreSQL database accessible

## Test Plan

### Test 1: New User (Uniform Prior)

**Expected Behavior**: First-time user should start with uniform prior (1/6 for each pattern)

**Test Command**:
```bash
curl -X POST http://localhost:3001/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-001",
    "userId": "new-user-001",
    "conversationTurns": [
      {
        "id": "turn-1",
        "userMessage": "Can you help me debug this code? I am not sure where the error is.",
        "timestamp": "2025-01-20T10:00:00Z"
      }
    ]
  }'
```

**Expected Logs** (in backend console):
```
[PatternHistoryService] Loaded prior for user new-user-001: {
  A: 0.16666...,
  B: 0.16666...,
  C: 0.16666...,
  D: 0.16666...,
  E: 0.16666...,
  F: 0.16666...
}
[PatternHistoryService] Recorded pattern X (confidence=0.XX) for user new-user-001
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "signals": { ... },
    "pattern": {
      "topPattern": "A|B|C|D|E|F",
      "probability": 0.XX,
      "confidence": 0.XX
    },
    "activeMRs": [...],
    "turnCount": 1,
    "isHighRiskF": false,
    "classifier": "bayesian"
  }
}
```

### Test 2: Simulate Pattern History

Insert some historical pattern detections to simulate a returning user:

```bash
# Connect to database
psql -d interview_genai

# Insert historical patterns for a test user (dominant Pattern A)
INSERT INTO pattern_detections (user_id, session_id, pattern_type, confidence, probabilities, created_at)
VALUES
  -- Pattern A detections (5 times, high confidence)
  ('returning-user-001', uuid_generate_v4(), 'A', 0.85, '{"A":0.85,"B":0.05,"C":0.03,"D":0.03,"E":0.02,"F":0.02}', NOW() - INTERVAL '5 days'),
  ('returning-user-001', uuid_generate_v4(), 'A', 0.82, '{"A":0.82,"B":0.06,"C":0.04,"D":0.04,"E":0.02,"F":0.02}', NOW() - INTERVAL '10 days'),
  ('returning-user-001', uuid_generate_v4(), 'A', 0.78, '{"A":0.78,"B":0.08,"C":0.05,"D":0.05,"E":0.02,"F":0.02}', NOW() - INTERVAL '15 days'),
  ('returning-user-001', uuid_generate_v4(), 'A', 0.88, '{"A":0.88,"B":0.04,"C":0.03,"D":0.03,"E":0.01,"F":0.01}', NOW() - INTERVAL '20 days'),
  ('returning-user-001', uuid_generate_v4(), 'A', 0.80, '{"A":0.80,"B":0.07,"C":0.05,"D":0.04,"E":0.02,"F":0.02}', NOW() - INTERVAL '25 days'),

  -- Pattern D detections (2 times, medium confidence)
  ('returning-user-001', uuid_generate_v4(), 'D', 0.65, '{"A":0.20,"B":0.05,"C":0.05,"D":0.65,"E":0.03,"F":0.02}', NOW() - INTERVAL '7 days'),
  ('returning-user-001', uuid_generate_v4(), 'D', 0.60, '{"A":0.25,"B":0.05,"C":0.05,"D":0.60,"E":0.03,"F":0.02}', NOW() - INTERVAL '12 days');

\q
```

### Test 3: Returning User (Historical Prior)

**Expected Behavior**: Returning user should start with personalized prior biased towards Pattern A

**Test Command**:
```bash
curl -X POST http://localhost:3001/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-002",
    "userId": "returning-user-001",
    "conversationTurns": [
      {
        "id": "turn-1",
        "userMessage": "I need help with this function.",
        "timestamp": "2025-01-20T11:00:00Z"
      }
    ]
  }'
```

**Expected Logs** (in backend console):
```
[PatternHistoryService] Loaded prior for user returning-user-001: {
  A: ~0.55-0.65,  // Dominant pattern (5/7 detections)
  B: ~0.05-0.10,
  C: ~0.05-0.10,
  D: ~0.15-0.25,  // Secondary pattern (2/7 detections)
  E: ~0.03-0.08,
  F: ~0.03-0.08
}
```

**Verification**: Pattern A should have significantly higher prior than others

### Test 4: Pattern Recording

**Verify that patterns are being saved to database**:

```bash
# After running Test 1 and Test 3, check database
psql -d interview_genai -c "
SELECT
  user_id,
  pattern_type,
  confidence,
  created_at
FROM pattern_detections
WHERE user_id IN ('new-user-001', 'returning-user-001')
ORDER BY created_at DESC
LIMIT 10;
"
```

**Expected Output**:
```
           user_id           | pattern_type | confidence |         created_at
-----------------------------+--------------+------------+---------------------------
 returning-user-001          | A/D/...      |   0.XXX    | 2025-01-20 11:00:XX.XXX
 new-user-001                | A/B/...      |   0.XXX    | 2025-01-20 10:00:XX.XXX
 returning-user-001          | A            |   0.800    | 2025-01-XX XX:XX:XX.XXX
 ...
```

### Test 5: Convergence Speed Comparison

**Compare how fast patterns converge for new vs returning users**:

**New User** (3-5 turns to converge):
```bash
# Turn 1
curl -X POST http://localhost:3001/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "convergence-test-new",
    "userId": "convergence-user-new",
    "conversationTurns": [
      {"id": "1", "userMessage": "Help debug this", "timestamp": "2025-01-20T10:00:00Z"}
    ]
  }' | jq '.data.pattern'

# Turn 2
curl -X POST http://localhost:3001/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "convergence-test-new",
    "userId": "convergence-user-new",
    "conversationTurns": [
      {"id": "1", "userMessage": "Help debug this", "timestamp": "2025-01-20T10:00:00Z"},
      {"id": "2", "userMessage": "Just show me the fixed code", "timestamp": "2025-01-20T10:01:00Z"}
    ]
  }' | jq '.data.pattern'

# Turn 3
curl -X POST http://localhost:3001/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "convergence-test-new",
    "userId": "convergence-user-new",
    "conversationTurns": [
      {"id": "1", "userMessage": "Help debug this", "timestamp": "2025-01-20T10:00:00Z"},
      {"id": "2", "userMessage": "Just show me the fixed code", "timestamp": "2025-01-20T10:01:00Z"},
      {"id": "3", "userMessage": "Thanks, copy pasting now", "timestamp": "2025-01-20T10:02:00Z"}
    ]
  }' | jq '.data.pattern'
```

**Returning User** (1-2 turns to converge):
```bash
# Setup: Use returning-user-001 from Test 3 (already has Pattern A history)

# Turn 1 - Should already be biased towards Pattern A
curl -X POST http://localhost:3001/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "convergence-test-returning",
    "userId": "returning-user-001",
    "conversationTurns": [
      {"id": "1", "userMessage": "Just give me the code", "timestamp": "2025-01-20T11:00:00Z"}
    ]
  }' | jq '.data.pattern'
```

**Expected**: Returning user's Pattern F probability should be much higher in turn 1 compared to new user

### Test 6: Missing userId Validation

**Expected Behavior**: API should return 400 error when userId is missing

**Test Command**:
```bash
curl -X POST http://localhost:3001/mca/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-003",
    "conversationTurns": [
      {"id": "1", "userMessage": "Help me", "timestamp": "2025-01-20T10:00:00Z"}
    ]
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "sessionId, userId, and conversationTurns are required"
}
```

## Success Criteria

- ✅ Test 1: New user sees uniform prior in logs (0.167 for each pattern)
- ✅ Test 2: Historical data successfully inserted into database
- ✅ Test 3: Returning user sees biased prior in logs (A > 0.5)
- ✅ Test 4: New pattern detections appear in database after API calls
- ✅ Test 5: Returning user converges faster than new user
- ✅ Test 6: Missing userId returns 400 error

## Troubleshooting

### Issue: "Table pattern_detections does not exist"
**Solution**: Run migration script
```bash
cd backend
node src/scripts/runMigration.js
```

### Issue: "Column user_id does not exist"
**Solution**: Check if users table has id column, or use VARCHAR for user_id instead of UUID reference

### Issue: "Cannot find module 'PatternHistoryService'"
**Solution**: Restart backend server to pick up new files
```bash
cd backend
npm run dev
```

### Issue: No logs appearing
**Solution**: Check backend console output, ensure LOG_LEVEL is not set to 'error' only

### Issue: Historical prior not loading
**Solution**:
1. Verify data exists: `SELECT * FROM pattern_detections WHERE user_id = 'returning-user-001'`
2. Check date range: Data must be within last 30 days
3. Check logs for PatternHistoryService errors

## Verification Queries

```sql
-- Check pattern distribution for a user
SELECT
  pattern_type,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence,
  MAX(created_at) as last_detection
FROM pattern_detections
WHERE user_id = 'returning-user-001'
GROUP BY pattern_type
ORDER BY count DESC;

-- Check if probabilities are being saved
SELECT
  user_id,
  pattern_type,
  confidence,
  probabilities,
  created_at
FROM pattern_detections
ORDER BY created_at DESC
LIMIT 5;

-- Test the helper function
SELECT * FROM get_user_dominant_pattern('returning-user-001'::UUID, 30);
```
