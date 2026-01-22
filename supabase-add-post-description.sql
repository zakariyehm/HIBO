-- Add description field to posts table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Make image_url optional (nullable) to support text-only posts
ALTER TABLE posts 
ALTER COLUMN image_url DROP NOT NULL;

