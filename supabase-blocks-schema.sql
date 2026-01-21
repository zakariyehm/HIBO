-- Blocks Schema for HIBO Dating App
-- Run this SQL in your Supabase SQL Editor to enable user blocking feature
-- When User A blocks User B, User A will no longer see User B in their feed or matches

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id) -- Prevent duplicate blocks
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- RLS Policies for blocks table
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks (who they blocked)
CREATE POLICY "Users can view their own blocks"
ON blocks FOR SELECT
TO authenticated
USING (auth.uid() = blocker_id);

-- Users can create their own blocks
CREATE POLICY "Users can create their own blocks"
ON blocks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks"
ON blocks FOR DELETE
TO authenticated
USING (auth.uid() = blocker_id);

-- Prevent users from blocking themselves
ALTER TABLE blocks ADD CONSTRAINT no_self_block CHECK (blocker_id != blocked_id);

