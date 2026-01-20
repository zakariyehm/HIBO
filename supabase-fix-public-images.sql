-- Fix Public Image Access for HIBO Dating App
-- This ensures that uploaded images are publicly accessible
-- Run this in Supabase SQL Editor

-- Step 1: Ensure bucket is PUBLIC
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-uploads';

-- Step 2: Drop all existing SELECT policies for storage.objects
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%view%' OR policyname LIKE '%select%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Create simple PUBLIC access policy for viewing
CREATE POLICY "Public Access to user-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Step 4: Ensure authenticated users can still upload
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Step 5: Verify bucket settings
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'user-uploads';

-- Success message
SELECT '✅ Public image access enabled!' as status;

