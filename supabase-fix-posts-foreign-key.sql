-- Fix Posts Foreign Key Relationship
-- Run this SQL in your Supabase SQL Editor

-- Drop existing foreign key if it exists
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS fk_posts_profile;

-- Add foreign key relationship to profiles table
ALTER TABLE posts 
ADD CONSTRAINT fk_posts_profile 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

