-- Add Premium Feature Support
-- Run this SQL in your Supabase SQL Editor

-- Add is_premium column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add premium_expires_at for subscription expiration
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Create index for premium queries
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium);

-- Update existing profiles to have is_premium = false
UPDATE profiles 
SET is_premium = FALSE 
WHERE is_premium IS NULL;

