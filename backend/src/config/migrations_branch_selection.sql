-- Migration: Add selected_branch_id to interactions table
-- Purpose: Persist user's selected branch for AI responses
-- This allows the selected branch to survive page refreshes

-- Add selected_branch_id column to track which branch is currently selected
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS selected_branch_id UUID REFERENCES message_branches(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_interactions_selected_branch ON interactions(selected_branch_id);

-- Comment for documentation
COMMENT ON COLUMN interactions.selected_branch_id IS 'References the currently selected message branch. NULL means original AI response is shown.';
