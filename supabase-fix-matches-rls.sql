-- Fix RLS Policy for Matches Table
-- Run this SQL in your Supabase SQL Editor to fix the match creation error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Allow match creation via trigger" ON matches;

-- Recreate SELECT policy
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow match creation (trigger needs this)
CREATE POLICY "Allow match creation via trigger"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Update the function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_match()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the liked user has also liked back
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id
    AND liked_id = NEW.liker_id
    AND action = 'like'
  ) AND NEW.action = 'like' THEN
    -- Create match (with user1_id < user2_id for consistency)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

