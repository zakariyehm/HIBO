-- Add Prompts/Questions feature (like Hinge)
-- Run this SQL in your Supabase SQL Editor

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL, -- The prompt question (e.g., "Two truths and a lie")
  answer TEXT NOT NULL, -- User's answer to the prompt
  order_index INTEGER NOT NULL DEFAULT 0, -- Order of prompts (0, 1, 2, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, order_index) -- One prompt per order per user
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prompts_user ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_order ON prompts(user_id, order_index);

-- RLS Policies for prompts table
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Users can view all prompts (for viewing profiles)
CREATE POLICY "Users can view all prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);

-- Users can create their own prompts
CREATE POLICY "Users can create their own prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own prompts
CREATE POLICY "Users can update their own prompts"
ON prompts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own prompts
CREATE POLICY "Users can delete their own prompts"
ON prompts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON prompts
FOR EACH ROW
EXECUTE FUNCTION update_prompts_updated_at();

