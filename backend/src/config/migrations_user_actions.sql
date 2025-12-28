-- ============================================================================
-- User Actions Table for MCA Behavior Tracking
-- ============================================================================
-- Tracks all user behaviors for pattern detection:
-- - Message actions: verify, modify, reject
-- - MR interactions: open, apply, dismiss, complete
-- - UI actions: click, scroll, time spent
--
-- These actions feed into BehaviorSignalDetector for more accurate pattern recognition
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_actions (
  id VARCHAR(100) PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID,
  category VARCHAR(50) NOT NULL DEFAULT 'message',
  action_type VARCHAR(100) NOT NULL,
  target_id VARCHAR(255),
  target_type VARCHAR(50),
  mr_id VARCHAR(50),
  mr_result JSONB,
  message_id VARCHAR(255),
  message_content TEXT,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_actions_session ON user_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_category ON user_actions(category);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_created ON user_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_mr ON user_actions(mr_id) WHERE mr_id IS NOT NULL;

-- Composite index for session + time range queries
CREATE INDEX IF NOT EXISTS idx_user_actions_session_time ON user_actions(session_id, created_at DESC);
