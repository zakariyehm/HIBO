-- ============================================================================
-- HIBO DATING APP - COMPLETE SUPABASE SCHEMA
-- ============================================================================
-- This is a complete, consolidated SQL file containing all database schemas,
-- features, and fixes for the HIBO dating app.
-- Run this entire file in your Supabase SQL Editor to set up the complete database.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. BASE SCHEMA - PROFILES TABLE
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  height INTEGER NOT NULL CHECK (height >= 100 AND height <= 250),
  location TEXT NOT NULL,
  profession TEXT NOT NULL,
  education_level TEXT NOT NULL,
  nationality TEXT[] NOT NULL,
  grow_up TEXT NOT NULL,
  smoke TEXT NOT NULL,
  has_children TEXT NOT NULL,
  gender TEXT NOT NULL,
  interested_in TEXT NOT NULL,
  looking_for TEXT NOT NULL,
  personality TEXT[] NOT NULL,
  marriage_know_time TEXT NOT NULL,
  marriage_married_time TEXT NOT NULL,
  interests TEXT[] NOT NULL CHECK (array_length(interests, 1) >= 3),
  photos TEXT[] NOT NULL CHECK (array_length(photos, 1) >= 3),
  source TEXT NOT NULL,
  document_type TEXT NOT NULL,
  passport TEXT,
  driver_license_front TEXT,
  driver_license_back TEXT,
  nationality_id_front TEXT,
  nationality_id_back TEXT,
  national_id_number TEXT,
  bio TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add additional profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;

-- Update existing profiles
UPDATE profiles SET is_premium = FALSE WHERE is_premium IS NULL;

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_type ON profiles(subscription_type);

-- ============================================================================
-- 3. LIKES AND MATCHES SCHEMA
-- ============================================================================

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expiration_date TIMESTAMPTZ,
  has_messaged BOOLEAN DEFAULT FALSE,
  UNIQUE(user1_id, user2_id)
);

-- Create daily_likes table for tracking daily like limits
DROP TABLE IF EXISTS daily_likes CASCADE;

CREATE TABLE daily_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for likes and matches
CREATE INDEX IF NOT EXISTS idx_likes_liker ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_expiration ON matches(expiration_date);

-- Immutable function for date extraction (required for daily_likes indexes)
CREATE OR REPLACE FUNCTION immutable_date(ts TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT (ts::date);
$$ LANGUAGE SQL IMMUTABLE;

-- Indexes for daily_likes
CREATE UNIQUE INDEX idx_daily_likes_unique 
ON daily_likes(user_id, liked_user_id, immutable_date(created_at));
CREATE INDEX idx_daily_likes_user_date ON daily_likes(user_id, immutable_date(created_at));
CREATE INDEX idx_daily_likes_created ON daily_likes(created_at);

-- ============================================================================
-- 4. MESSAGES SCHEMA
-- ============================================================================

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'gif', 'sticker')),
  media_url TEXT,
  delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_match ON typing_indicators(match_id);
CREATE INDEX IF NOT EXISTS idx_typing_user ON typing_indicators(user_id);

-- Update existing messages
UPDATE messages SET delivered = TRUE WHERE delivered IS NULL OR delivered = FALSE;

-- ============================================================================
-- 5. POSTS SCHEMA
-- ============================================================================

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_posts_profile FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================================================
-- 6. PROMPTS SCHEMA
-- ============================================================================

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, order_index)
);

-- Indexes for prompts
CREATE INDEX IF NOT EXISTS idx_prompts_user ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_order ON prompts(user_id, order_index);

-- ============================================================================
-- 7. BLOCKS SCHEMA
-- ============================================================================

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Indexes for blocks
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- Prevent self-blocking
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS no_self_block;
ALTER TABLE blocks ADD CONSTRAINT no_self_block CHECK (blocker_id != blocked_id);

-- ============================================================================
-- 8. PROFILE VIEWS SCHEMA
-- ============================================================================

-- Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id)
);

-- Indexes for profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);

-- Prevent self-viewing
ALTER TABLE profile_views DROP CONSTRAINT IF EXISTS no_self_view;
ALTER TABLE profile_views ADD CONSTRAINT no_self_view CHECK (viewer_id != viewed_id);

-- ============================================================================
-- 9. STORAGE SETUP
-- ============================================================================
-- NOTE: Storage bucket and policies should be set up via Supabase Dashboard
-- Go to Storage > Create Bucket > name: 'user-uploads', make it public
-- Then set up policies via Dashboard or use the SQL below if you have permissions

-- Create storage bucket (if you have permissions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Update bucket settings (if you have permissions)
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'user-uploads';

-- Storage policies (run these separately if you get permission errors)
-- You may need to set these up via Supabase Dashboard instead:
-- Storage > Policies > New Policy > Allow public access to user-uploads bucket

-- Try to create storage policy (may fail if you don't have owner permissions)
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Allow all access to user-uploads" ON storage.objects;
    
    -- Create new policy
    CREATE POLICY "Allow all access to user-uploads"
    ON storage.objects
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (bucket_id = 'user-uploads')
    WITH CHECK (bucket_id = 'user-uploads');
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot create storage policy. Please set up via Supabase Dashboard: Storage > Policies';
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage policy setup skipped. Please configure via Supabase Dashboard.';
END $$;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
-- Storage RLS is managed by Supabase automatically, no need to enable manually

-- Drop existing policies on profiles
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Profiles policies
CREATE POLICY "Allow authenticated users to view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Likes policies
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON likes;
DROP POLICY IF EXISTS "Users can update their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

CREATE POLICY "Users can view their own likes"
ON likes FOR SELECT
TO authenticated
USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can create their own likes"
ON likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can update their own likes"
ON likes FOR UPDATE
TO authenticated
USING (auth.uid() = liker_id)
WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete their own likes"
ON likes FOR DELETE
TO authenticated
USING (auth.uid() = liker_id);

-- Matches policies
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Allow match creation via trigger" ON matches;

CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Allow match creation via trigger"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to matches" ON messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON messages;
DROP POLICY IF EXISTS "Users can delete their sent messages" ON messages;

CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to matches"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM matches
    WHERE id = match_id
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
    AND (user1_id = receiver_id OR user2_id = receiver_id)
  )
);

CREATE POLICY "Users can update their sent messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages as read"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their sent messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Posts policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Users can view all posts"
ON posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Prompts policies
DROP POLICY IF EXISTS "Users can view all prompts" ON prompts;
DROP POLICY IF EXISTS "Users can create their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;

CREATE POLICY "Users can view all prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
ON prompts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
ON prompts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Blocks policies
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can create their own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocks;

CREATE POLICY "Users can view their own blocks"
ON blocks FOR SELECT
TO authenticated
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create their own blocks"
ON blocks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
ON blocks FOR DELETE
TO authenticated
USING (auth.uid() = blocker_id);

-- Profile views policies
DROP POLICY IF EXISTS "Users can view their own profile views" ON profile_views;
DROP POLICY IF EXISTS "Users can create their own profile views" ON profile_views;

CREATE POLICY "Users can view their own profile views"
ON profile_views FOR SELECT
TO authenticated
USING (auth.uid() = viewer_id);

CREATE POLICY "Users can create their own profile views"
ON profile_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Daily likes policies
DROP POLICY IF EXISTS "Users can view their own daily likes" ON daily_likes;
DROP POLICY IF EXISTS "Users can insert their own daily likes" ON daily_likes;

CREATE POLICY "Users can view their own daily likes"
ON daily_likes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily likes"
ON daily_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Typing indicators policies
DROP POLICY IF EXISTS "Users can view typing indicators for their matches" ON typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
DROP POLICY IF EXISTS "Users can insert their own typing status" ON typing_indicators;

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

CREATE POLICY "Users can update their own typing status"
ON typing_indicators FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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

-- ============================================================================
-- 11. FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update last_active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create match when both users like each other
CREATE OR REPLACE FUNCTION create_match()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id
    AND liked_id = NEW.liker_id
    AND action = 'like'
  ) AND NEW.action = 'like' THEN
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

-- Function to set match expiration
CREATE OR REPLACE FUNCTION set_match_expiration()
RETURNS TRIGGER 
AS $$
BEGIN
  IF NEW.has_messaged = FALSE OR NEW.has_messaged IS NULL THEN
    NEW.expiration_date = NEW.created_at + INTERVAL '7 days';
  ELSE
    NEW.expiration_date = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update match on message
CREATE OR REPLACE FUNCTION update_match_on_message()
RETURNS TRIGGER 
AS $$
BEGIN
  UPDATE matches
  SET has_messaged = TRUE,
      expiration_date = NULL
  WHERE id = NEW.match_id
    AND (has_messaged = FALSE OR has_messaged IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily like count
CREATE OR REPLACE FUNCTION get_daily_like_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM daily_likes
  WHERE user_id = p_user_id
  AND created_at::date = CURRENT_DATE;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user can like
CREATE OR REPLACE FUNCTION can_like_user(p_user_id UUID, p_is_premium BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  daily_count INTEGER;
  max_likes INTEGER;
BEGIN
  IF p_is_premium THEN
    max_likes := 2;
  ELSE
    max_likes := 1;
  END IF;
  
  SELECT get_daily_like_count(p_user_id) INTO daily_count;
  
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

-- Function to update prompts updated_at
CREATE OR REPLACE FUNCTION update_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update posts updated_at
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update typing indicator timestamp
CREATE OR REPLACE FUNCTION update_typing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set message delivered
CREATE OR REPLACE FUNCTION set_message_delivered()
RETURNS TRIGGER AS $$
BEGIN
  NEW.delivered = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. TRIGGERS
-- ============================================================================

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles last_active
DROP TRIGGER IF EXISTS update_profile_last_active ON profiles;
CREATE TRIGGER update_profile_last_active
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_last_active();

-- Trigger for match creation
DROP TRIGGER IF EXISTS on_mutual_like ON likes;
CREATE TRIGGER on_mutual_like
AFTER INSERT OR UPDATE ON likes
FOR EACH ROW
WHEN (NEW.action = 'like')
EXECUTE FUNCTION create_match();

-- Trigger for match expiration
DROP TRIGGER IF EXISTS on_match_created ON matches;
CREATE TRIGGER on_match_created
BEFORE INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION set_match_expiration();

-- Trigger for match on message
DROP TRIGGER IF EXISTS on_message_sent ON messages;
CREATE TRIGGER on_message_sent
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_match_on_message();

-- Create trigger to enforce limit before insert
DROP TRIGGER IF EXISTS enforce_daily_like_limit ON daily_likes;
CREATE TRIGGER enforce_daily_like_limit
BEFORE INSERT ON daily_likes
FOR EACH ROW
EXECUTE FUNCTION check_daily_like_limit();

-- Trigger for prompts updated_at
DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON prompts
FOR EACH ROW
EXECUTE FUNCTION update_prompts_updated_at();

-- Trigger for posts updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_posts_updated_at();

-- Trigger for typing indicator updated_at
DROP TRIGGER IF EXISTS update_typing_updated_at ON typing_indicators;
CREATE TRIGGER update_typing_updated_at
BEFORE UPDATE ON typing_indicators
FOR EACH ROW
EXECUTE FUNCTION update_typing_updated_at();

-- Trigger for message delivered
DROP TRIGGER IF EXISTS on_message_inserted ON messages;
CREATE TRIGGER on_message_inserted
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_message_delivered();

-- ============================================================================
-- 13. UPDATE EXISTING DATA
-- ============================================================================

-- Update existing matches to set expiration_date
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

-- ============================================================================
-- 14. REALTIME ENABLEMENT
-- ============================================================================

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================================
-- 15. UPGRADE/MIGRATION SCRIPTS
-- ============================================================================
-- These scripts ensure backward compatibility and handle upgrades
-- They are safe to run multiple times (idempotent)

-- Ensure bio column exists (for existing databases)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update existing records to have empty string if bio is null
UPDATE profiles SET bio = '' WHERE bio IS NULL;

-- If you want to make bio NOT NULL for new records (after ensuring all existing records have values)
-- Uncomment the line below:
-- ALTER TABLE profiles ALTER COLUMN bio SET NOT NULL;

-- Ensure bio_title column exists (for existing databases)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_title TEXT;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- All database schemas, features, and fixes have been applied.
-- Your HIBO dating app database is now fully configured!
-- 
-- NOTE: When creating new upgrade scripts (e.g., supabase-add-*.sql),
-- make sure to also add them to this complete file in section 15 (UPGRADE/MIGRATION SCRIPTS)
-- so that future fresh installations include all upgrades.
-- ============================================================================

