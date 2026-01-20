-- Fix RLS Policies for HIBO Dating App
-- Run this if you're getting "row violates row-level security policy" errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create more permissive policies for authenticated users

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Enable select for users based on user_id"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on user_id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Optional: Allow users to view other profiles (for matching feature)
-- Uncomment this when you want to implement browse/match features
-- CREATE POLICY "Enable select for all authenticated users"
-- ON profiles FOR SELECT
-- TO authenticated
-- USING (true);

