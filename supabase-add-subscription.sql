-- Add Subscription Support to Profiles Table
-- Run this SQL in your Supabase SQL Editor

-- Add subscription_type column (monthly or yearly)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly'));

-- Add subscription_phone for payment phone number
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_phone TEXT;

-- Add subscription_start_date for when billing actually starts (after trial)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_type ON profiles(subscription_type);

