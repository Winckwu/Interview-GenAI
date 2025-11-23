-- ============================================================================
-- MR1 Task Decomposition History
-- Stores completed task decompositions for users to review later
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_decompositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Original task info
  original_task TEXT NOT NULL,
  decomposition_strategy VARCHAR(50) NOT NULL DEFAULT 'sequential',

  -- Decomposition results (stored as JSONB for flexibility)
  dimensions JSONB,           -- Task analysis dimensions
  subtasks JSONB NOT NULL,    -- Array of subtasks with details

  -- Metadata
  scaffold_level VARCHAR(20) DEFAULT 'medium',
  total_estimated_time INTEGER,  -- Total estimated time in minutes
  was_completed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_task_decomp_user ON task_decompositions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_decomp_session ON task_decompositions(session_id);
CREATE INDEX IF NOT EXISTS idx_task_decomp_created ON task_decompositions(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE task_decompositions IS 'MR1: Stores task decomposition history for users';
