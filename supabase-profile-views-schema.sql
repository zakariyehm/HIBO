-- Profile Views Schema for HIBO Dating App
-- Run this SQL in your Supabase SQL Editor to track viewed profiles
-- When User A views User B's profile, User B will no longer appear in User A's feed (like Tinder)

-- Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id) -- Prevent duplicate views
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);

-- RLS Policies for profile_views table
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile views (who they viewed)
CREATE POLICY "Users can view their own profile views"
ON profile_views FOR SELECT
TO authenticated
USING (auth.uid() = viewer_id);

-- Users can create their own profile views
CREATE POLICY "Users can create their own profile views"
ON profile_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Prevent users from viewing their own profile
ALTER TABLE profile_views ADD CONSTRAINT no_self_view CHECK (viewer_id != viewed_id);

