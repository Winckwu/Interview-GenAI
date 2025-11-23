-- ============================================================================
-- MR Tools History Tables
-- Stores user interaction history for various MR (Mandatory Requirements) tools
-- ============================================================================

-- ============================================================================
-- MR7: Failure Learning - Learning Logs
-- Stores user learning logs from failed iterations
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr7_learning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,

  -- Failed iteration details
  task_description TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  rejection_reason TEXT,
  user_feedback TEXT,

  -- Learning reflection
  lessons_learned TEXT NOT NULL,
  key_takeaways JSONB,  -- Array of takeaway strings
  next_time_strategy TEXT,

  -- Analysis results (from analyzeFailure)
  failure_patterns JSONB,  -- Array of {pattern, preventionTip}
  learning_insights JSONB,  -- Array of insight strings
  recovery_strategies JSONB,  -- Array of strategy strings

  -- User rating of the learning
  rating VARCHAR(20),  -- 'valuable', 'somewhat', 'not_useful'

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mr7_logs_user ON mr7_learning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mr7_logs_session ON mr7_learning_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_mr7_logs_created ON mr7_learning_logs(created_at DESC);

COMMENT ON TABLE mr7_learning_logs IS 'MR7: Stores failure learning logs for users';

-- ============================================================================
-- MR11: Integrated Verification - Verification Logs
-- Stores verification decisions and results
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr11_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,
  message_id UUID,  -- Reference to the message being verified

  -- Content being verified
  content_type VARCHAR(20) NOT NULL,  -- 'code', 'math', 'citation', 'fact', 'text'
  content_text TEXT,

  -- Verification method and result
  verification_method VARCHAR(50) NOT NULL,  -- 'code-execution', 'syntax-check', etc.
  tool_used VARCHAR(100),
  verification_status VARCHAR(30) NOT NULL,  -- 'error-found', 'verified', 'partially-verified', 'unverified'
  confidence_score DECIMAL(3,2),

  -- Findings
  findings JSONB,  -- Array of finding strings
  discrepancies JSONB,  -- Array of discrepancy strings
  suggestions JSONB,  -- Array of suggestion strings

  -- User decision
  user_decision VARCHAR(20) NOT NULL,  -- 'accept', 'modify', 'reject', 'skip'
  user_notes TEXT,

  -- Outcome tracking (for learning)
  actual_correctness BOOLEAN,  -- Was the decision actually correct?

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mr11_logs_user ON mr11_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mr11_logs_session ON mr11_verification_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_mr11_logs_created ON mr11_verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr11_logs_type ON mr11_verification_logs(content_type);

COMMENT ON TABLE mr11_verification_logs IS 'MR11: Stores verification decisions and results';

-- ============================================================================
-- MR5: Low-Cost Iteration - Branches and Variants
-- Stores conversation branches and generated variants
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr5_conversation_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,

  -- Branch info
  branch_name VARCHAR(100) NOT NULL,
  parent_branch_id UUID REFERENCES mr5_conversation_branches(id) ON DELETE SET NULL,
  parent_message_index INTEGER,

  -- Branch content
  conversation_history JSONB NOT NULL,  -- Array of {role, content, timestamp}
  next_prompt TEXT,

  -- Metrics
  rating INTEGER DEFAULT 0,  -- Star rating
  variants_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mr5_iteration_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES mr5_conversation_branches(id) ON DELETE SET NULL,

  -- Variant content
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  temperature DECIMAL(3,2),
  style VARCHAR(50),  -- 'concise', 'detailed', 'creative', etc.

  -- Token usage
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,

  -- User rating
  rating VARCHAR(20),  -- 'good', 'okay', 'poor'
  was_selected BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mr5_branches_user ON mr5_conversation_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_mr5_branches_session ON mr5_conversation_branches(session_id);
CREATE INDEX IF NOT EXISTS idx_mr5_variants_user ON mr5_iteration_variants(user_id);
CREATE INDEX IF NOT EXISTS idx_mr5_variants_session ON mr5_iteration_variants(session_id);
CREATE INDEX IF NOT EXISTS idx_mr5_variants_branch ON mr5_iteration_variants(branch_id);

COMMENT ON TABLE mr5_conversation_branches IS 'MR5: Stores conversation branches for low-cost iteration';
COMMENT ON TABLE mr5_iteration_variants IS 'MR5: Stores generated variants for comparison';

-- ============================================================================
-- MR14: Guided Reflection - Reflection Logs
-- Stores structured reflection entries
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr14_reflection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,

  -- Context
  conversation_summary TEXT,

  -- Reflection responses (stored as JSONB for flexibility)
  immediate_reflections JSONB,  -- {promptId: response}
  structured_reflections JSONB,  -- {promptId: response}
  metacognitive_reflections JSONB,  -- {promptId: response}

  -- Depth analysis results
  depth_level VARCHAR(20),  -- 'surface', 'moderate', 'deep'
  depth_score INTEGER,
  depth_feedback TEXT,

  -- Completion status
  completed_stages JSONB,  -- ['immediate', 'structured', 'metacognitive']
  is_complete BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mr14_logs_user ON mr14_reflection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mr14_logs_session ON mr14_reflection_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_mr14_logs_created ON mr14_reflection_logs(created_at DESC);

COMMENT ON TABLE mr14_reflection_logs IS 'MR14: Stores guided reflection logs';

-- ============================================================================
-- MR6: Cross-Model Experimentation - Model Comparisons
-- Stores comparisons between different AI model outputs
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr6_model_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,

  -- Prompt used for comparison
  prompt TEXT NOT NULL,

  -- Model responses (stored as JSONB array)
  model_responses JSONB NOT NULL,  -- Array of {model, content, responseTime, tokens}

  -- User preferences
  preferred_model VARCHAR(50),
  preference_reason TEXT,

  -- Comparison notes
  comparison_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mr6_comparisons_user ON mr6_model_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_mr6_comparisons_session ON mr6_model_comparisons(session_id);
CREATE INDEX IF NOT EXISTS idx_mr6_comparisons_created ON mr6_model_comparisons(created_at DESC);

COMMENT ON TABLE mr6_model_comparisons IS 'MR6: Stores cross-model comparison results';

-- ============================================================================
-- MR12: Critical Thinking Scaffolding - Evaluation Sessions
-- Stores critical thinking evaluation results
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr12_evaluation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,

  -- Content being evaluated
  content_to_evaluate TEXT NOT NULL,
  content_source VARCHAR(50),  -- 'ai-response', 'user-input', etc.

  -- Evaluation criteria results
  evaluation_criteria JSONB NOT NULL,  -- Array of {criterion, score, notes}

  -- Overall assessment
  overall_score DECIMAL(3,2),
  strengths JSONB,  -- Array of strength strings
  weaknesses JSONB,  -- Array of weakness strings
  recommendations JSONB,  -- Array of recommendation strings

  -- User reflection
  user_assessment TEXT,
  agreed_with_ai BOOLEAN,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mr12_sessions_user ON mr12_evaluation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mr12_sessions_session ON mr12_evaluation_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_mr12_sessions_created ON mr12_evaluation_sessions(created_at DESC);

COMMENT ON TABLE mr12_evaluation_sessions IS 'MR12: Stores critical thinking evaluation sessions';
