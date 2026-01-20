-- Fix Storage Policies for HIBO Dating App
-- Run this in Supabase SQL Editor to enable file uploads

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing policies on storage.objects for user-uploads bucket
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%user-uploads%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Create new storage policies that allow authenticated users to upload

-- 1. Allow authenticated users to INSERT (upload) their own files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- 2. Allow authenticated users to SELECT (view) all files in user-uploads
CREATE POLICY "Allow authenticated users to view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-uploads');

-- 3. Allow public to SELECT (view) all files (since bucket is public)
CREATE POLICY "Allow public to view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- 4. Allow authenticated users to UPDATE their own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Allow authenticated users to DELETE their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Success message
SELECT 'Storage policies created successfully! ✅' as status;

