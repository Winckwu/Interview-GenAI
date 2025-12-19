-- Add conversation tree support to interactions table
-- Enables true conversation branching where each message knows its parent
-- and subsequent messages can follow different conversation paths

-- Add parent_id column to reference parent interaction
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES interactions(id) ON DELETE SET NULL;

-- Add branch_path to track the conversation path (e.g., "main" or "branch-{branchId}")
-- This helps identify which conversation timeline a message belongs to
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS branch_path VARCHAR(255) DEFAULT 'main';

-- Add index for efficient tree traversal queries
CREATE INDEX IF NOT EXISTS idx_interactions_parent ON interactions (parent_id);
CREATE INDEX IF NOT EXISTS idx_interactions_branch_path ON interactions (branch_path);

-- Composite index for querying messages in a specific session and branch
CREATE INDEX IF NOT EXISTS idx_interactions_session_branch ON interactions (session_id, branch_path, created_at);
