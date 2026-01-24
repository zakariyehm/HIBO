-- Add Daily Like Limits Feature
-- Run this SQL in your Supabase SQL Editor

-- Drop existing table and all dependencies (to fix IMMUTABLE error)
DROP TABLE IF EXISTS daily_likes CASCADE;

-- Create daily_likes table to track likes per day
CREATE TABLE daily_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create immutable function for date extraction (required for indexes)
CREATE OR REPLACE FUNCTION immutable_date(ts TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT (ts::date);
$$ LANGUAGE SQL IMMUTABLE;

-- Create unique index on user_id, liked_user_id, and date (prevents duplicate likes per day)
-- Using immutable function to ensure PostgreSQL accepts it
CREATE UNIQUE INDEX idx_daily_likes_unique 
ON daily_likes(user_id, liked_user_id, immutable_date(created_at));

-- Index for fast queries (using immutable function)
CREATE INDEX idx_daily_likes_user_date ON daily_likes(user_id, immutable_date(created_at));
CREATE INDEX idx_daily_likes_created ON daily_likes(created_at);

-- RLS Policies
ALTER TABLE daily_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own daily likes" ON daily_likes;
DROP POLICY IF EXISTS "Users can insert their own daily likes" ON daily_likes;

-- Users can view their own daily likes
CREATE POLICY "Users can view their own daily likes"
ON daily_likes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own daily likes
CREATE POLICY "Users can insert their own daily likes"
ON daily_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to get daily like count for a user
CREATE OR REPLACE FUNCTION get_daily_like_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM daily_likes
  WHERE user_id = p_user_id
  AND created_at::date = CURRENT_DATE;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user can like (hasn't reached daily limit)
CREATE OR REPLACE FUNCTION can_like_user(p_user_id UUID, p_is_premium BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  daily_count INTEGER;
  max_likes INTEGER;
BEGIN
  -- Premium users have 2 likes per day
  IF p_is_premium THEN
    max_likes := 2;
  ELSE
    -- Free users have 1 like per day
    max_likes := 1;
  END IF;
  
  -- Get today's like count
  SELECT get_daily_like_count(p_user_id) INTO daily_count;
  
  -- Check if limit reached
  RETURN daily_count < max_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to enforce daily like limit before insert
CREATE OR REPLACE FUNCTION check_daily_like_limit()
RETURNS TRIGGER AS $$
DECLARE
  daily_count INTEGER;
  max_likes INTEGER;
  user_is_premium BOOLEAN;
BEGIN
  -- Get premium status from profiles table (use table alias to avoid ambiguity)
  SELECT COALESCE(p.is_premium, false) INTO user_is_premium
  FROM profiles p
  WHERE p.id = NEW.user_id;
  
  -- Set limit based on premium status
  IF user_is_premium THEN
    max_likes := 2;
  ELSE
    max_likes := 1;
  END IF;
  
  -- Get today's like count (including the current insert)
  SELECT COUNT(*)::INTEGER INTO daily_count
  FROM daily_likes
  WHERE user_id = NEW.user_id
  AND created_at::date = CURRENT_DATE;
  
  -- Check if limit would be exceeded
  IF daily_count >= max_likes THEN
    RAISE EXCEPTION 'Daily like limit reached. Free users: 1 like/day, Premium users: 2 likes/day.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit before insert
DROP TRIGGER IF EXISTS enforce_daily_like_limit ON daily_likes;
CREATE TRIGGER enforce_daily_like_limit
BEFORE INSERT ON daily_likes
FOR EACH ROW
EXECUTE FUNCTION check_daily_like_limit();
