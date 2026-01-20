-- 🔥 NUCLEAR FIX FOR IMAGE DISPLAY
-- This completely resets Supabase Storage permissions
-- Run this in Supabase SQL Editor

-- Step 1: DISABLE RLS entirely on storage.objects (temporary)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 2: Make bucket 100% public
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'user-uploads';

-- Step 3: Drop ALL policies on storage.objects
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 5: Create ONE super permissive policy for ALL operations
CREATE POLICY "Allow all access to user-uploads"
ON storage.objects
AS PERMISSIVE
FOR ALL
TO public
USING (bucket_id = 'user-uploads')
WITH CHECK (bucket_id = 'user-uploads');

-- Verify the fix
SELECT 
    'Bucket Configuration:' as info,
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-uploads';

SELECT 
    'Storage Policies:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

