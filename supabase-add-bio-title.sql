-- Add bio_title column to profiles table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio_title TEXT;

-- Make it optional (nullable) so existing profiles don't break
-- bio_title can be NULL for existing profiles

