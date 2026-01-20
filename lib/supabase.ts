/**
 * Supabase Client Configuration
 * Handles authentication and database operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for React Native with AsyncStorage
const ExpoStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log('📦 Getting from storage:', key, value ? '✅ Found' : '❌ Not found');
      return value;
    } catch (error) {
      console.error('❌ Error getting from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log('💾 Saved to storage:', key);
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      console.log('🗑️  Removed from storage:', key);
    } catch (error) {
      console.error('❌ Error removing from storage:', error);
    }
  },
};

// Create Supabase client with persistent session
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoStorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true, // ✅ ENABLED for session persistence
    detectSessionInUrl: false,
  },
});

// Database types for type safety
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  age: number;
  height: number;
  location: string;
  profession: string;
  education_level: string;
  nationality: string[];
  grow_up: string;
  smoke: string;
  has_children: string;
  gender: string;
  interested_in: string;
  looking_for: string;
  personality: string[];
  marriage_know_time: string;
  marriage_married_time: string;
  interests: string[];
  photos: string[];
  source: string;
  document_type: string;
  passport?: string;
  driver_license_front?: string;
  driver_license_back?: string;
  nationality_id_front?: string;
  nationality_id_back?: string;
  national_id_number?: string;
  bio: string;
  created_at?: string;
  updated_at?: string;
}

// Auth functions
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Auto-confirm for development (no email verification required)
      emailRedirectTo: undefined,
    }
  });
  
  console.log('📧 Signup response:', { 
    hasUser: !!data.user, 
    hasSession: !!data.session,
    userId: data.user?.id 
  });
  
  // Wait for session to be established
  if (data.session) {
    console.log('✅ Session found, setting it...');
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } else {
    console.log('⚠️  NO SESSION RETURNED! Email confirmation may be required.');
  }
  
  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  try {
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return { user: null, error: sessionError };
    }
    
    if (!session) {
      console.log('📭 No session found in storage');
      return { user: null, error: null };
    }
    
    console.log('✅ Session found:', session.user.id);
    return { user: session.user, error: null };
  } catch (error: any) {
    console.error('❌ Get current user error:', error);
    return { user: null, error };
  }
};

// Database functions
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  // Check session status
  const { data: { session } } = await supabase.auth.getSession();
  console.log('🔐 Creating profile:', { 
    userId, 
    hasSession: !!session,
    sessionUser: session?.user?.id 
  });
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Profile insert error:', error);
  } else {
    console.log('✅ Profile created successfully!');
  }
  
  return { data, error };
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

// Get all user profiles (excluding current user)
export const getAllUserProfiles = async (excludeUserId?: string) => {
  try {
    console.log('🔍 Fetching all user profiles...');
    if (excludeUserId) {
      console.log('🚫 Excluding user:', excludeUserId);
    }
    
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, location, bio, photos, nationality, created_at')
      .order('created_at', { ascending: false });
    
    // Exclude current user if provided
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching all profiles:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's an RLS policy error
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.error('⚠️  RLS POLICY ERROR: Users cannot view other profiles!');
        console.error('⚠️  Run supabase-fix-browse-profiles.sql in Supabase SQL Editor');
      }
      
      return { data: null, error };
    }
    
    console.log(`✅ Fetched ${data?.length || 0} user profiles`);
    if (data && data.length > 0) {
      console.log('📋 Profile IDs:', data.map((p: any) => p.id));
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception fetching profiles:', error);
    return { data: null, error };
  }
};

// Upload images to Supabase Storage
export const uploadImage = async (userId: string, imageUri: string, imageName: string, folder: string = 'photos') => {
  try {
    console.log('🔄 Starting upload:', imageName);
    console.log('📍 File URI:', imageUri);
    
    // Skip upload if already a public URL (already uploaded)
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      console.log('⚠️  Image already uploaded, skipping:', imageUri);
      return { data: { path: imageUri, publicUrl: imageUri }, error: null };
    }
    
    // Extract file extension from URI or use default
    const uriParts = imageUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1];
    const mimeType = `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`;
    
    console.log('📦 File type:', mimeType);
    
    // Generate unique filename with correct extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `photo_${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `${folder}/${userId}/${fileName}`;
    
    console.log('📤 Preparing upload to:', filePath);
    console.log('🔄 Fetching file data from URI...');
    
    // Fetch actual file data as ArrayBuffer (works in React Native)
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('✅ ArrayBuffer created, size:', arrayBuffer.byteLength, 'bytes');
    console.log('📤 Uploading to Supabase...');
    
    // Upload ArrayBuffer to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (error) {
      console.error('❌ Upload error:', error);
      return { data: null, error };
    }
    
    console.log('✅ Upload successful:', filePath);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    console.log('🌐 Public URL:', publicUrlData.publicUrl);
    
    return { data: { path: filePath, publicUrl: publicUrlData.publicUrl }, error: null };
  } catch (error: any) {
    console.error('❌ Upload catch error:', error);
    return { data: null, error: { message: error.message || 'Upload failed' } };
  }
};

// Upload multiple photos
export const uploadPhotos = async (userId: string, photos: string[]) => {
  const uploadPromises = photos.map((photo, index) => 
    uploadImage(userId, photo, `photo_${index + 1}_${Date.now()}.jpg`, 'photos')
  );
  
  const results = await Promise.all(uploadPromises);
  
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    return { data: null, error: errors[0].error };
  }
  
  const photoUrls = results.map(r => r.data?.publicUrl).filter(Boolean);
  return { data: photoUrls, error: null };
};

// Upload documents
export const uploadDocument = async (userId: string, documentUri: string, documentName: string) => {
  return uploadImage(userId, documentUri, documentName, 'documents');
};

