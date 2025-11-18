-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================================================
-- Work Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_description TEXT,
  task_type VARCHAR(50) NOT NULL DEFAULT 'general',
  task_importance INTEGER DEFAULT 3,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON work_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_ended ON work_sessions(ended_at DESC);

-- ============================================================================
-- User Interactions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_prompt TEXT NOT NULL,
  ai_model VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-5',
  ai_response TEXT,
  response_time_ms INTEGER,
  was_verified BOOLEAN DEFAULT FALSE,
  was_modified BOOLEAN DEFAULT FALSE,
  was_rejected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interactions_session ON interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);

-- ============================================================================
-- Pattern Detection Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS pattern_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  detected_pattern VARCHAR(10) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  detection_method VARCHAR(50) NOT NULL DEFAULT 'rule_based',
  features JSONB,
  all_probabilities JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pattern_logs_session ON pattern_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_pattern_logs_user ON pattern_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_logs_created ON pattern_logs(created_at DESC);

-- ============================================================================
-- Metacognitive Metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS metacognitive_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_specificity DECIMAL(5,2),
  verification_rate DECIMAL(3,2),
  iteration_frequency DECIMAL(3,2),
  modification_rate DECIMAL(3,2),
  task_decomposition_score DECIMAL(3,2),
  reflection_depth DECIMAL(3,2),
  cross_model_usage DECIMAL(3,2),
  independent_attempt_rate DECIMAL(3,2),
  error_awareness DECIMAL(3,2),
  strategy_diversity DECIMAL(3,2),
  trust_calibration_accuracy DECIMAL(3,2),
  time_before_ai_query_ms BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_session ON metacognitive_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_metrics_user ON metacognitive_metrics(user_id);

-- ============================================================================
-- Skill Baselines
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  description TEXT,
  baseline_independence_rate DECIMAL(3,2) NOT NULL,
  baseline_proficiency_score DECIMAL(3,1) NOT NULL,
  assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_baseline_user ON skill_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_baseline_skill ON skill_baselines(skill_name);

-- ============================================================================
-- Skill Tests
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baseline_id UUID NOT NULL REFERENCES skill_baselines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL,
  independence_percentage DECIMAL(3,2),
  quality_score DECIMAL(3,1),
  speed_score DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_tests_baseline ON skill_tests(baseline_id);
CREATE INDEX IF NOT EXISTS idx_skill_tests_user ON skill_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_tests_created ON skill_tests(created_at DESC);

-- ============================================================================
-- Skill Alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baseline_id UUID REFERENCES skill_baselines(id) ON DELETE SET NULL,
  skill_name VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT,
  intervention_type VARCHAR(50),
  degradation_percentage DECIMAL(5,2),
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_alerts_user ON skill_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_alerts_created ON skill_alerts(created_at DESC);

-- ============================================================================
-- Model Comparisons
-- ============================================================================
CREATE TABLE IF NOT EXISTS model_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  responses JSONB NOT NULL,
  ratings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_comparisons_user ON model_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_model_comparisons_created ON model_comparisons(created_at DESC);

-- ============================================================================
-- Auth Tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  token_type VARCHAR(20) DEFAULT 'access',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expired ON auth_tokens(expires_at);
