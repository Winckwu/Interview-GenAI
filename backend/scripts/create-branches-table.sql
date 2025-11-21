-- ============================================================================
-- Complete Message Branches Setup (Run as database owner or superuser)
-- This script includes both permission fixes and table creation
-- ============================================================================

-- Step 1: Grant schema permissions to postgres user
GRANT ALL ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;

-- Step 2: Grant permissions on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Step 3: Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Step 4: Create message_branches table
CREATE TABLE IF NOT EXISTS message_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to the original interaction (AI message being branched from)
  interaction_id UUID NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,

  -- Branch metadata
  branch_content TEXT NOT NULL, -- Alternative AI response
  source VARCHAR(20) NOT NULL CHECK (source IN ('mr6', 'mr5', 'manual')),
  model VARCHAR(100), -- Model used (for MR6/MR5 branches)

  -- Branch state
  was_verified BOOLEAN DEFAULT FALSE,
  was_modified BOOLEAN DEFAULT FALSE,
  is_main BOOLEAN DEFAULT FALSE, -- True if this branch became the main response

  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure interaction exists
  CONSTRAINT fk_interaction FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_branches_interaction ON message_branches(interaction_id);
CREATE INDEX IF NOT EXISTS idx_message_branches_created ON message_branches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_branches_source ON message_branches(source);

-- Step 6: Add comments for documentation
COMMENT ON TABLE message_branches IS 'Stores alternative AI responses for conversation branching (MR6/MR5)';
COMMENT ON COLUMN message_branches.interaction_id IS 'References the original AI interaction being branched from';
COMMENT ON COLUMN message_branches.source IS 'Where the branch came from: mr6 (cross-model), mr5 (iteration), or manual';
COMMENT ON COLUMN message_branches.is_main IS 'True if this branch was promoted to become the main response';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ message_branches table created successfully!';
    RAISE NOTICE '🎉 Conversation branching system is ready!';
END $$;
