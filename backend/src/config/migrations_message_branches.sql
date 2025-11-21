-- ============================================================================
-- Message Branches Migration
-- Enables conversation branching for AI responses
-- ============================================================================

-- Create message_branches table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_branches_interaction ON message_branches(interaction_id);
CREATE INDEX IF NOT EXISTS idx_message_branches_created ON message_branches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_branches_source ON message_branches(source);

-- Add comment for documentation
COMMENT ON TABLE message_branches IS 'Stores alternative AI responses for conversation branching (MR6/MR5)';
COMMENT ON COLUMN message_branches.interaction_id IS 'References the original AI interaction being branched from';
COMMENT ON COLUMN message_branches.source IS 'Where the branch came from: mr6 (cross-model), mr5 (iteration), or manual';
COMMENT ON COLUMN message_branches.is_main IS 'True if this branch was promoted to become the main response';
