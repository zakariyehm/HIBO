-- Add bio column to profiles table if it doesn't exist
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- If you want to make it NOT NULL for new records, you can do:
-- ALTER TABLE profiles ALTER COLUMN bio SET NOT NULL;

-- Update existing records to have empty string if bio is null
UPDATE profiles SET bio = '' WHERE bio IS NULL;
