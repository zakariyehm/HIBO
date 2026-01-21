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

// Get all user profiles (excluding current user, blocked users, and viewed profiles)
export const getAllUserProfiles = async (excludeUserId?: string) => {
  try {
    console.log('🔍 Fetching all user profiles...');
    if (excludeUserId) {
      console.log('🚫 Excluding user:', excludeUserId);
    }
    
    // Get blocked users list
    const { data: blockedUsers } = await getBlockedUsers();
    const blockedIds = blockedUsers || [];
    
    // Get viewed profiles list (like Tinder - once viewed, don't show again)
    const { data: viewedProfiles } = await getViewedProfiles();
    const viewedIds = viewedProfiles || [];
    
    if (blockedIds.length > 0) {
      console.log('🚫 Excluding blocked users:', blockedIds.length);
    }
    if (viewedIds.length > 0) {
      console.log('👁️  Excluding viewed profiles:', viewedIds.length);
    }
    
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, location, bio, photos, nationality, gender, interested_in, created_at')
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
    
    // Filter out blocked users and viewed profiles in JavaScript
    const filteredData = (data || []).filter(profile => 
      !blockedIds.includes(profile.id) && !viewedIds.includes(profile.id)
    );
    
    console.log(`✅ Fetched ${filteredData.length} user profiles (after filtering blocked and viewed users)`);
    if (filteredData.length > 0) {
      console.log('📋 Profile IDs:', filteredData.map((p: any) => p.id));
    }
    return { data: filteredData, error: null };
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

// Likes and Matches functions - OPTIMIZED FOR SPEED (Tinder-like)
export const likeUser = async (likedUserId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const likerId = session.user.id;

    // Use upsert for faster operation (no need to check first)
    const { data, error } = await supabase
      .from('likes')
      .upsert({
        liker_id: likerId,
        liked_id: likedUserId,
        action: 'like',
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'liker_id,liked_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error liking user:', error);
      return { data: null, error };
    }

    // Check for match in background (don't wait)
    checkForMatch(likerId, likedUserId).then(matchResult => {
      if (matchResult.data) {
        console.log('🎉 Match found!', matchResult.data);
        // Match will be handled by trigger/event system
      }
    }).catch(err => {
      console.error('❌ Error checking match:', err);
    });

    return { data: { like: data, match: null }, error: null };
  } catch (error: any) {
    console.error('❌ Exception in likeUser:', error);
    return { data: null, error };
  }
};

export const passUser = async (passedUserId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const likerId = session.user.id;

    // Use upsert for faster operation (no need to check first)
    const { data, error } = await supabase
      .from('likes')
      .upsert({
        liker_id: likerId,
        liked_id: passedUserId,
        action: 'pass',
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'liker_id,liked_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error passing user:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in passUser:', error);
    return { data: null, error };
  }
};

export const checkForMatch = async (userId1: string, userId2: string) => {
  try {
    console.log('🔍 Checking for match between:', userId1, 'and', userId2);
    
    // Check if user2 has also liked user1
    const { data: mutualLike, error } = await supabase
      .from('likes')
      .select('*')
      .eq('liker_id', userId2)
      .eq('liked_id', userId1)
      .eq('action', 'like')
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors

    if (error) {
      console.error('❌ Error checking mutual like:', error);
      return { data: null, error: null };
    }

    if (!mutualLike) {
      console.log('❌ No mutual like found (no match)');
      return { data: null, error: null }; // No match
    }

    console.log('✅ Mutual like found! Checking match record...');

    // Match found! Try to get match record (might not exist yet if trigger hasn't fired)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
      .maybeSingle();

    if (matchError) {
      console.error('❌ Error checking match record:', matchError);
      // Still return success if mutual like exists (match will be created by trigger)
      return { data: { id: 'pending', user1_id: userId1, user2_id: userId2 }, error: null };
    }

    if (match) {
      console.log('✅ Match record found:', match.id);
      return { data: match, error: null };
    }

    // Match exists (mutual like) but record not created yet - trigger will create it
    console.log('✅ Mutual like confirmed (match record pending)');
    return { data: { id: 'pending', user1_id: userId1, user2_id: userId2 }, error: null };
  } catch (error: any) {
    console.error('❌ Exception in checkForMatch:', error);
    return { data: null, error };
  }
};

export const getUserMatches = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    // Get blocked users list
    const { data: blockedUsers } = await getBlockedUsers();
    const blockedIds = blockedUsers || [];

    // Get all matches for this user
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching matches:', error);
      return { data: null, error };
    }

    // Get match partner profiles and filter out blocked users
    const matchProfiles = await Promise.all(
      (data || []).map(async (match) => {
        const partnerId = match.user1_id === userId ? match.user2_id : match.user1_id;
        
        // Skip if partner is blocked
        if (blockedIds.includes(partnerId)) {
          return null;
        }
        
        const { data: profile } = await getUserProfile(partnerId);
        return {
          match,
          profile,
        };
      })
    );

    // Filter out null entries (blocked users)
    const filteredMatches = matchProfiles.filter(m => m !== null);

    return { data: filteredMatches, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getUserMatches:', error);
    return { data: null, error };
  }
};

export const getUserLikes = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    // Get all users this user has liked
    const { data: likes, error } = await supabase
      .from('likes')
      .select('liked_id')
      .eq('liker_id', userId)
      .eq('action', 'like');

    if (error) {
      console.error('❌ Error fetching likes:', error);
      return { data: null, error };
    }

    // Get profiles of liked users
    const likedProfiles = await Promise.all(
      (likes || []).map(async (like) => {
        const { data: profile } = await getUserProfile(like.liked_id);
        return profile;
      })
    );

    return { data: likedProfiles.filter(Boolean), error: null };
  } catch (error: any) {
    console.error('❌ Exception in getUserLikes:', error);
    return { data: null, error };
  }
};

// Block and Unblock functions
export const blockUser = async (blockedUserId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const blockerId = session.user.id;

    // Prevent self-blocking
    if (blockerId === blockedUserId) {
      return { data: null, error: { message: 'Cannot block yourself' } };
    }

    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('blocks')
      .select('*')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedUserId)
      .single();

    if (existingBlock) {
      console.log('⚠️  User already blocked');
      return { data: existingBlock, error: null };
    }

    // Create new block
    const { data, error } = await supabase
      .from('blocks')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedUserId,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error blocking user:', error);
      return { data: null, error };
    }

    console.log('✅ User blocked successfully');
    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in blockUser:', error);
    return { data: null, error };
  }
};

export const unblockUser = async (blockedUserId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const blockerId = session.user.id;

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedUserId);

    if (error) {
      console.error('❌ Error unblocking user:', error);
      return { data: null, error };
    }

    console.log('✅ User unblocked successfully');
    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('❌ Exception in unblockUser:', error);
    return { data: null, error };
  }
};

export const getBlockedUsers = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);

    if (error) {
      console.error('❌ Error fetching blocked users:', error);
      return { data: null, error };
    }

    const blockedIds = (data || []).map(block => block.blocked_id);
    return { data: blockedIds, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getBlockedUsers:', error);
    return { data: null, error };
  }
};

export const isUserBlocked = async (userId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: false, error: null };
    }

    const currentUserId = session.user.id;

    const { data, error } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error checking if user is blocked:', error);
      return { data: false, error: null };
    }

    return { data: !!data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in isUserBlocked:', error);
    return { data: false, error: null };
  }
};

// Profile Views functions (like Tinder - once viewed, don't show again) - OPTIMIZED
export const recordProfileView = async (viewedUserId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const viewerId = session.user.id;

    // Prevent self-viewing
    if (viewerId === viewedUserId) {
      return { data: null, error: { message: 'Cannot view own profile' } };
    }

    // Use upsert for faster operation (no need to check first)
    const { data, error } = await supabase
      .from('profile_views')
      .upsert({
        viewer_id: viewerId,
        viewed_id: viewedUserId,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'viewer_id,viewed_id',
        ignoreDuplicates: true
      })
      .select()
      .single();

    if (error) {
      // Ignore duplicate errors (already viewed)
      if (error.code === '23505') {
        return { data: null, error: null };
      }
      console.error('❌ Error recording profile view:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in recordProfileView:', error);
    return { data: null, error };
  }
};

export const getViewedProfiles = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('profile_views')
      .select('viewed_id')
      .eq('viewer_id', userId);

    if (error) {
      console.error('❌ Error fetching viewed profiles:', error);
      return { data: null, error };
    }

    const viewedIds = (data || []).map(view => view.viewed_id);
    return { data: viewedIds, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getViewedProfiles:', error);
    return { data: null, error };
  }
};

