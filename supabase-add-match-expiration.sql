-- Add Match Expiration Feature
-- Matches expire after 7 days if no message is sent
-- Run this SQL in your Supabase SQL Editor

-- Add expiration_date column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;

-- Add has_messaged column to track if any message was sent
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS has_messaged BOOLEAN DEFAULT FALSE;

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS idx_matches_expiration ON matches(expiration_date);

-- Function to update expiration_date when match is created
-- Sets expiration to 7 days from creation if no message exists
CREATE OR REPLACE FUNCTION set_match_expiration()
RETURNS TRIGGER 
AS $$
BEGIN
  -- Set expiration to 7 days from now if no message exists
  IF NEW.has_messaged = FALSE OR NEW.has_messaged IS NULL THEN
    NEW.expiration_date = NEW.created_at + INTERVAL '7 days';
  ELSE
    NEW.expiration_date = NULL; -- No expiration if messages exist
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expiration on match creation
DROP TRIGGER IF EXISTS on_match_created ON matches;
CREATE TRIGGER on_match_created
BEFORE INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION set_match_expiration();

-- Function to update has_messaged when first message is sent
CREATE OR REPLACE FUNCTION update_match_on_message()
RETURNS TRIGGER 
AS $$
BEGIN
  -- Mark match as having messages and remove expiration
  UPDATE matches
  SET has_messaged = TRUE,
      expiration_date = NULL
  WHERE id = NEW.match_id
    AND (has_messaged = FALSE OR has_messaged IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update match when first message is sent
DROP TRIGGER IF EXISTS on_message_sent ON messages;
CREATE TRIGGER on_message_sent
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_match_on_message();

-- Update existing matches to set expiration_date if they don't have messages
UPDATE matches
SET expiration_date = created_at + INTERVAL '7 days'
WHERE (has_messaged = FALSE OR has_messaged IS NULL)
  AND expiration_date IS NULL
  AND created_at > NOW() - INTERVAL '7 days';

-- Mark matches as having messages if they already have messages
UPDATE matches m
SET has_messaged = TRUE,
    expiration_date = NULL
WHERE EXISTS (
  SELECT 1 FROM messages msg
  WHERE msg.match_id = m.id
)
AND (has_messaged = FALSE OR has_messaged IS NULL);

