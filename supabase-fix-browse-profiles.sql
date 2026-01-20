-- Fix RLS Policy to Allow Users to Browse All Profiles
-- This allows authenticated users to view all profiles (for home/matching screen)
-- Run this in Supabase SQL Editor

-- Create policy to allow authenticated users to view all profiles
CREATE POLICY "Allow authenticated users to view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

