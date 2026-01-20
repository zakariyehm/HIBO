-- Supabase Database Schema for HIBO Dating App
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  height INTEGER NOT NULL CHECK (height >= 100 AND height <= 250),
  location TEXT NOT NULL,
  profession TEXT NOT NULL,
  education_level TEXT NOT NULL,
  nationality TEXT[] NOT NULL,
  grow_up TEXT NOT NULL,
  smoke TEXT NOT NULL,
  has_children TEXT NOT NULL,
  gender TEXT NOT NULL,
  interested_in TEXT NOT NULL,
  looking_for TEXT NOT NULL,
  personality TEXT[] NOT NULL,
  marriage_know_time TEXT NOT NULL,
  marriage_married_time TEXT NOT NULL,
  interests TEXT[] NOT NULL CHECK (array_length(interests, 1) >= 3),
  photos TEXT[] NOT NULL CHECK (array_length(photos, 1) >= 3),
  source TEXT NOT NULL,
  document_type TEXT NOT NULL,
  passport TEXT,
  driver_license_front TEXT,
  driver_license_back TEXT,
  nationality_id_front TEXT,
  nationality_id_back TEXT,
  national_id_number TEXT,
  bio TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for user uploads
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view uploaded files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Set up RLS (Row Level Security) for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_gender ON profiles(gender);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

