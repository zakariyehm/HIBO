-- Add Enhanced Messaging Features
-- GIFs/Stickers, Read Receipts (delivered/seen), Typing Indicators
-- Run this SQL in your Supabase SQL Editor

-- Add message type column (text, gif, sticker)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'gif', 'sticker'));

-- Add media_url column for GIFs/stickers
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add delivered status (separate from read)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT FALSE;

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_typing_match ON typing_indicators(match_id);
CREATE INDEX IF NOT EXISTS idx_typing_user ON typing_indicators(user_id);

-- RLS Policies for typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can view typing indicators for their matches
CREATE POLICY "Users can view typing indicators for their matches"
ON typing_indicators FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = typing_indicators.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Users can update their own typing status
CREATE POLICY "Users can update their own typing status"
ON typing_indicators FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can insert their own typing status
CREATE POLICY "Users can insert their own typing status"
ON typing_indicators FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = typing_indicators.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Function to update typing indicator timestamp
CREATE OR REPLACE FUNCTION update_typing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update typing timestamp
CREATE TRIGGER update_typing_updated_at
BEFORE UPDATE ON typing_indicators
FOR EACH ROW
EXECUTE FUNCTION update_typing_updated_at();

-- Function to automatically set delivered when message is inserted
-- (In real apps, this would be set when message reaches server)
CREATE OR REPLACE FUNCTION set_message_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Set delivered to true immediately (in production, this would be set by push notification service)
  NEW.delivered = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set delivered on insert
DROP TRIGGER IF EXISTS on_message_inserted ON messages;
CREATE TRIGGER on_message_inserted
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_message_delivered();

-- Update existing messages to have delivered = true if they exist
UPDATE messages
SET delivered = TRUE
WHERE delivered IS NULL OR delivered = FALSE;

