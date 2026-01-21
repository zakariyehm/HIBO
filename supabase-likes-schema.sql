-- Likes and Matches Schema for HIBO Dating App
-- Run this SQL in your Supabase SQL Editor

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, liked_id) -- Prevent duplicate likes/passes
);

-- Create matches table (for when both users like each other)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id) -- Prevent duplicate matches
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_likes_liker ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);

-- RLS Policies for likes table
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Users can view their own likes/passes
CREATE POLICY "Users can view their own likes"
ON likes FOR SELECT
TO authenticated
USING (auth.uid() = liker_id OR auth.uid() = liked_id);

-- Users can create their own likes/passes
CREATE POLICY "Users can create their own likes"
ON likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = liker_id);

-- Users can update their own likes (to change pass to like, etc.)
CREATE POLICY "Users can update their own likes"
ON likes FOR UPDATE
TO authenticated
USING (auth.uid() = liker_id)
WITH CHECK (auth.uid() = liker_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON likes FOR DELETE
TO authenticated
USING (auth.uid() = liker_id);

-- RLS Policies for matches table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own matches
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow trigger function to insert matches (for automatic match creation)
-- This policy allows matches to be created when the trigger fires
CREATE POLICY "Allow match creation via trigger"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Function to create match when both users like each other
-- SECURITY DEFINER allows the function to run with the privileges of the function creator
-- This is needed because the trigger needs to insert into matches table
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

-- Trigger to create match when mutual like occurs
CREATE TRIGGER on_mutual_like
AFTER INSERT OR UPDATE ON likes
FOR EACH ROW
WHEN (NEW.action = 'like')
EXECUTE FUNCTION create_match();

