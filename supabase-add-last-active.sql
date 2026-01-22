-- Add last_active column to profiles table for tracking user activity
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster queries on active users
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC);

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_active when profile is updated
CREATE TRIGGER update_profile_last_active
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_last_active();

