-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- User Management
-- ============================================================================

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================================================
-- Session & Interaction Tracking
-- ============================================================================

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes FLOAT,
  task_description TEXT,
  task_type VARCHAR(50),
  task_importance VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  ai_model VARCHAR(100) DEFAULT 'gpt-4-turbo',
  prompt_word_count INT,
  response_time FLOAT DEFAULT 0,
  was_verified BOOLEAN DEFAULT false,
  was_modified BOOLEAN DEFAULT false,
  was_rejected BOOLEAN DEFAULT false,
  confidence_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);

-- ============================================================================
-- Pattern Detection & Evolution
-- ============================================================================

-- Create pattern logs table
CREATE TABLE IF NOT EXISTS pattern_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  detected_pattern VARCHAR(1),
  confidence FLOAT,
  features JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pattern_logs_session_id ON pattern_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_pattern_logs_pattern ON pattern_logs(detected_pattern);

-- Create evolution logs table
CREATE TABLE IF NOT EXISTS evolution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_pattern VARCHAR(1),
  previous_pattern VARCHAR(1),
  change_type VARCHAR(20), -- improvement, regression, oscillation, stable
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evolution_logs_user_id ON evolution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_logs_change_type ON evolution_logs(change_type);

-- ============================================================================
-- Skill Monitoring
-- ============================================================================

-- Create skill baselines table
CREATE TABLE IF NOT EXISTS skill_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  baseline_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_baselines_user_id ON skill_baselines(user_id);

-- Create skill tests table
CREATE TABLE IF NOT EXISTS skill_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baseline_id UUID NOT NULL REFERENCES skill_baselines(id) ON DELETE CASCADE,
  score FLOAT,
  independence_percentage FLOAT,
  quality_score FLOAT,
  speed_score FLOAT,
  tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_tests_baseline_id ON skill_tests(baseline_id);

-- Create skill alerts table
CREATE TABLE IF NOT EXISTS skill_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50), -- skill_atrophy, over_reliance, etc.
  severity VARCHAR(20), -- warning, critical, severe
  message TEXT,
  dismissed BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_alerts_user_id ON skill_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_alerts_severity ON skill_alerts(severity);

-- ============================================================================
-- Metacognitive Assessments
-- ============================================================================

-- Create assessments table for MR19 metacognitive capability assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planning_score FLOAT,
  monitoring_score FLOAT,
  evaluation_score FLOAT,
  regulation_score FLOAT,
  overall_score FLOAT,
  strengths JSONB,
  areas_for_growth JSONB,
  recommendations JSONB,
  assessment_type VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
