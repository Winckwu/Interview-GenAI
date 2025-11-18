-- ============================================================================
-- Additional Migrations for Admin, A/B Testing, and Assessment Features
-- ============================================================================

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- ============================================================================
-- A/B Testing Tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed')),
  control_group VARCHAR(100),
  treatment_group VARCHAR(100),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created ON ab_tests(created_at DESC);

-- ============================================================================
-- A/B Test Results
-- ============================================================================
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "group" VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100),
  metric_value VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_test ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_group ON ab_test_results("group");

-- ============================================================================
-- Assessment Results
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  score INTEGER,
  feedback TEXT,
  pattern_identified VARCHAR(10),
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_pattern ON assessments(pattern_identified);

-- ============================================================================
-- Pattern Detections (if not already created)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pattern_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern VARCHAR(10) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pattern_detections_session ON pattern_detections(session_id);
CREATE INDEX IF NOT EXISTS idx_pattern_detections_user ON pattern_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_detections_pattern ON pattern_detections(pattern);
