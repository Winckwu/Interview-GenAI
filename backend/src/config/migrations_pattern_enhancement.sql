-- ============================================================================
-- Pattern Enhancement Features Migration
-- Adds support for:
-- 1. Pattern transition detection (A→B/D/F monitoring)
-- 2. Cross-session pattern memory (historical prior)
-- 3. Pattern stability tracking
-- ============================================================================

-- ============================================================================
-- Extend pattern_detections table for cross-session memory
-- ============================================================================

-- Add probabilities column if not exists (stores full probability distribution)
ALTER TABLE pattern_detections
ADD COLUMN IF NOT EXISTS probabilities JSONB;

-- Rename 'pattern' to 'pattern_type' for consistency
DO $$
BEGIN
  IF EXISTS(
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name='pattern_detections' AND column_name='pattern'
  ) AND NOT EXISTS(
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name='pattern_detections' AND column_name='pattern_type'
  ) THEN
    ALTER TABLE pattern_detections RENAME COLUMN pattern TO pattern_type;
  END IF;
END $$;

-- Ensure pattern_type has proper check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pattern_detections_pattern_type_check'
  ) THEN
    ALTER TABLE pattern_detections
    ADD CONSTRAINT pattern_detections_pattern_type_check
    CHECK (pattern_type IN ('A','B','C','D','E','F'));
  END IF;
END $$;

-- Add index for querying recent patterns
CREATE INDEX IF NOT EXISTS idx_pattern_detections_user_created
ON pattern_detections(user_id, created_at DESC);

-- Add index for pattern distribution queries
CREATE INDEX IF NOT EXISTS idx_pattern_detections_user_type
ON pattern_detections(user_id, pattern_type);

-- ============================================================================
-- Pattern Transitions Table (NEW)
-- Tracks pattern changes across conversation turns
-- ============================================================================

CREATE TABLE IF NOT EXISTS pattern_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,

  -- Transition info
  from_pattern VARCHAR(1) NOT NULL CHECK (from_pattern IN ('A','B','C','D','E','F')),
  to_pattern VARCHAR(1) NOT NULL CHECK (to_pattern IN ('A','B','C','D','E','F')),
  transition_type VARCHAR(20) NOT NULL CHECK (transition_type IN ('improvement','regression','lateral','oscillation')),

  -- Metrics
  confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low','medium','high','critical')),

  -- Trigger factors (JSONB for flexibility)
  trigger_factors JSONB DEFAULT '{}',
  -- Example: {
  --   "taskComplexityIncrease": true,
  --   "timePressure": true,
  --   "fatigueIndicator": false,
  --   "verificationRateDrop": 0.45,
  --   "consecutiveFailures": 3
  -- }

  -- Metadata
  turn_number INTEGER,
  message_count INTEGER,
  session_elapsed_ms BIGINT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pattern transition queries
CREATE INDEX IF NOT EXISTS idx_pattern_transitions_user
ON pattern_transitions(user_id);

CREATE INDEX IF NOT EXISTS idx_pattern_transitions_session
ON pattern_transitions(session_id);

CREATE INDEX IF NOT EXISTS idx_pattern_transitions_severity
ON pattern_transitions(severity)
WHERE severity IN ('high', 'critical');

CREATE INDEX IF NOT EXISTS idx_pattern_transitions_created
ON pattern_transitions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_transitions_from_to
ON pattern_transitions(from_pattern, to_pattern);

-- Index for finding critical A→F regressions
CREATE INDEX IF NOT EXISTS idx_pattern_transitions_critical_regression
ON pattern_transitions(user_id, created_at DESC)
WHERE from_pattern = 'A' AND to_pattern = 'F' AND severity = 'critical';

-- ============================================================================
-- Pattern Stability Metrics Table (NEW)
-- Tracks pattern stability over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS pattern_stability_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,

  -- Current pattern info
  dominant_pattern VARCHAR(1) NOT NULL CHECK (dominant_pattern IN ('A','B','C','D','E','F')),

  -- Stability metrics
  stability_score DECIMAL(3,2) NOT NULL CHECK (stability_score >= 0 AND stability_score <= 1),
  streak_length INTEGER DEFAULT 0,
  volatility DECIMAL(3,2) NOT NULL CHECK (volatility >= 0 AND volatility <= 1),
  trend_direction VARCHAR(20) CHECK (trend_direction IN ('converging','diverging','oscillating','stable')),

  -- Window size for calculation
  window_size INTEGER DEFAULT 5,

  -- Metadata
  turn_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pattern_stability_user
ON pattern_stability_snapshots(user_id);

CREATE INDEX IF NOT EXISTS idx_pattern_stability_session
ON pattern_stability_snapshots(session_id);

CREATE INDEX IF NOT EXISTS idx_pattern_stability_created
ON pattern_stability_snapshots(created_at DESC);

-- Index for finding unstable patterns
CREATE INDEX IF NOT EXISTS idx_pattern_stability_unstable
ON pattern_stability_snapshots(user_id, created_at DESC)
WHERE stability_score < 0.5;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get user's dominant pattern from history
CREATE OR REPLACE FUNCTION get_user_dominant_pattern(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  pattern VARCHAR(1),
  confidence DECIMAL(4,3),
  stability DECIMAL(3,2),
  total_detections BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.pattern_type as pattern,
    AVG(pd.confidence)::DECIMAL(4,3) as confidence,
    (COUNT(CASE WHEN pd.pattern_type = mode() WITHIN GROUP (ORDER BY pd.pattern_type) THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL)::DECIMAL(3,2) as stability,
    COUNT(*) as total_detections
  FROM pattern_detections pd
  WHERE pd.user_id = p_user_id
    AND pd.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY pd.pattern_type
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent pattern transitions for a user
CREATE OR REPLACE FUNCTION get_user_recent_transitions(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  from_pattern VARCHAR(1),
  to_pattern VARCHAR(1),
  transition_type VARCHAR(20),
  severity VARCHAR(10),
  trigger_factors JSONB,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.from_pattern,
    pt.to_pattern,
    pt.transition_type,
    pt.severity,
    pt.trigger_factors,
    pt.created_at
  FROM pattern_transitions pt
  WHERE pt.user_id = p_user_id
  ORDER BY pt.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE pattern_transitions IS 'Tracks pattern changes (A→B, A→F, etc.) with trigger factor analysis';
COMMENT ON COLUMN pattern_transitions.trigger_factors IS 'JSONB storing reasons for transition: taskComplexity, timePressure, fatigue, etc.';
COMMENT ON COLUMN pattern_transitions.severity IS 'Urgency level: low (normal shift), medium (watch), high (intervention needed), critical (A→F regression)';

COMMENT ON TABLE pattern_stability_snapshots IS 'Tracks pattern stability metrics over time for trend analysis';
COMMENT ON COLUMN pattern_stability_snapshots.stability_score IS 'How stable the pattern is (0=volatile, 1=very stable)';
COMMENT ON COLUMN pattern_stability_snapshots.trend_direction IS 'converging (stabilizing), diverging (becoming unstable), oscillating (A↔D), stable (already stable)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
