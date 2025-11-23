-- Add reasoning column to interactions table
-- Stores AI chain-of-thought reasoning extracted from <thinking> tags

ALTER TABLE interactions ADD COLUMN IF NOT EXISTS reasoning TEXT;

-- Add index for potential future queries on interactions with reasoning
CREATE INDEX IF NOT EXISTS idx_interactions_has_reasoning ON interactions ((reasoning IS NOT NULL));
