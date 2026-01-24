/**
 * Supabase Client Configuration
 * Handles authentication and database operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { decryptMessage, deriveMatchKey, encryptMessage } from './encryption';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for React Native with AsyncStorage
const ExpoStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      // console.log('📦 Getting from storage:', key, value ? '✅ Found' : '❌ Not found');
      return value;
    } catch (error) {
      console.error('❌ Error getting from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      // console.log('💾 Saved to storage:', key);
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      // console.log('🗑️  Removed from storage:', key);
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
  bio_title?: string;
  is_premium?: boolean;
  premium_expires_at?: string;
  last_active?: string;
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
  
  // Wait for session to be established
  if (data.session) {
    // console.log('✅ Session found, setting it...');
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } else {
    // console.log('⚠️  NO SESSION RETURNED! Email confirmation may be required.');
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
      // console.log('📭 No session found in storage');
      return { user: null, error: null };
    }
    
    // console.log('✅ Session found:', session.user.id);
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
    // console.log('✅ Profile created successfully!');
  }
  
  return { data, error };
};

// Update user's last_active timestamp (call when user is active)
export const updateLastActive = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error('❌ Error updating last_active:', error);
      return { error };
    }
    
    return { error: null };
  } catch (error: any) {
    console.error('❌ Exception updating last_active:', error);
    return { error };
  }
};

// Check if user is online (actively using app - within last 1 minute)
export const isUserOnline = (lastActive: string | null | undefined): boolean => {
  if (!lastActive) return false;
  
  const lastActiveTime = new Date(lastActive).getTime();
  const now = new Date().getTime();
  const oneMinuteAgo = now - (1 * 60 * 1000); // 1 minute in milliseconds
  
  return lastActiveTime >= oneMinuteAgo;
};

// Get professional status text (short format: Online, 1m, 1h, 24h, etc.)
export const getUserStatus = (lastActive: string | null | undefined): { text: string; isOnline: boolean } => {
  if (!lastActive) {
    return { text: '', isOnline: false };
  }
  
  const isOnline = isUserOnline(lastActive);
  
  if (isOnline) {
    return { text: 'Online', isOnline: true };
  }
  
  // Calculate time difference
  const lastActiveTime = new Date(lastActive).getTime();
  const now = new Date().getTime();
  const diffInSeconds = Math.floor((now - lastActiveTime) / 1000);
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return { text: '1m', isOnline: false };
  }
  
  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return { text: `${minutes}m`, isOnline: false };
  }
  
  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return { text: `${hours}h`, isOnline: false };
  }
  
  // Less than 7 days
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return { text: `${days}d`, isOnline: false };
  }
  
  // More than 7 days
  const weeks = Math.floor(diffInSeconds / 604800);
  return { text: `${weeks}w`, isOnline: false };
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
    // console.log('🔍 Fetching all user profiles...');
    if (excludeUserId) {
      // console.log('🚫 Excluding user:', excludeUserId);
    }
    
    // Get blocked users list
    const { data: blockedUsers } = await getBlockedUsers();
    const blockedIds = blockedUsers || [];
    
    // Get viewed profiles list (like Tinder - once viewed, don't show again)
    const { data: viewedProfiles } = await getViewedProfiles();
    const viewedIds = viewedProfiles || [];
    
    if (blockedIds.length > 0) {
      // console.log('🚫 Excluding blocked users:', blockedIds.length);
    }
    if (viewedIds.length > 0) {
      // console.log('👁️  Excluding viewed profiles:', viewedIds.length);
    }
    
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, location, bio, bio_title, photos, nationality, gender, interested_in, age, height, education_level, interests, personality, created_at, last_active')
      .order('last_active', { ascending: false, nullsLast: true })
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
    
    // console.log(`✅ Fetched ${filteredData.length} user profiles (after filtering blocked and viewed users)`);
    if (filteredData.length > 0) {
      // console.log('📋 Profile IDs:', filteredData.map((p: any) => p.id));
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
    // console.log('🔄 Starting upload:', imageName);
    // console.log('📍 File URI:', imageUri);
    
    // Skip upload if already a public URL (already uploaded)
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      // console.log('⚠️  Image already uploaded, skipping:', imageUri);
      return { data: { path: imageUri, publicUrl: imageUri }, error: null };
    }
    
    // Extract file extension from URI or use default
    const uriParts = imageUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1];
    const mimeType = `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`;
    
    // console.log('📦 File type:', mimeType);
    
    // Generate unique filename with correct extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `photo_${timestamp}_${randomId}.${fileExtension}`;
    const filePath = `${folder}/${userId}/${fileName}`;
    
    // console.log('📤 Preparing upload to:', filePath);
    // console.log('🔄 Fetching file data from URI...');
    
    // Fetch actual file data as ArrayBuffer (works in React Native)
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();
    
    // console.log('✅ ArrayBuffer created, size:', arrayBuffer.byteLength, 'bytes');
    // console.log('📤 Uploading to Supabase...');
    
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
    
    // console.log('✅ Upload successful:', filePath);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    // console.log('🌐 Public URL:', publicUrlData.publicUrl);
    
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
// Check if user has reached match limit (Tinder/Hinge style)
export const checkMatchLimit = async (): Promise<{ reached: boolean; waitingCount: number; limit: number }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { reached: false, waitingCount: 0, limit: 0 };
    }

    const userId = session.user.id;
    
    // Check premium status
    const premium = await isPremiumUser();
    const LIMIT = premium ? 15 : 7;

    // Get active matches waiting for reply (no messages sent)
    const { data: matches } = await supabase
      .from('matches')
      .select('id, has_messaged, is_expired')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!matches) {
      return { reached: false, waitingCount: 0, limit: LIMIT };
    }

    const activeMatches = matches.filter(m => !m.is_expired);
    const waitingForReply = activeMatches.filter(m => !m.has_messaged);
    const waitingCount = waitingForReply.length;

    return {
      reached: waitingCount >= LIMIT,
      waitingCount,
      limit: LIMIT,
    };
  } catch (error) {
    console.error('❌ Error checking match limit:', error);
    return { reached: false, waitingCount: 0, limit: 0 };
  }
};

export const likeUser = async (likedUserId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    // Check match limit before allowing like (Tinder/Hinge style)
    const limitCheck = await checkMatchLimit();
    if (limitCheck.reached) {
      return { 
        data: null, 
        error: { 
          message: 'MATCH_LIMIT_REACHED',
          waitingCount: limitCheck.waitingCount,
          limit: limitCheck.limit,
        } 
      };
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
        // console.log('🎉 Match found!', matchResult.data);
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
    // console.log('🔍 Checking for match between:', userId1, 'and', userId2);
    
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
      // console.log('❌ No mutual like found (no match)');
      return { data: null, error: null }; // No match
    }

    // console.log('✅ Mutual like found! Checking match record...');

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
      // console.log('✅ Match record found:', match.id);
      return { data: match, error: null };
    }

    // Match exists (mutual like) but record not created yet - trigger will create it
    // console.log('✅ Mutual like confirmed (match record pending)');
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
        
        // Check if match has messages
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id);
        
        const hasMessages = (messageCount || 0) > 0;
        
        // Check if match is expired (7 days without messages)
        const matchDate = new Date(match.created_at);
        const now = new Date();
        const daysSinceMatch = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = !hasMessages && daysSinceMatch >= 7;
        
        // Get expiration date (7 days from creation if no messages)
        const expirationDate = hasMessages 
          ? null 
          : new Date(matchDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const { data: profile } = await getUserProfile(partnerId);
        return {
          match: {
            ...match,
            has_messaged: hasMessages,
            expiration_date: expirationDate?.toISOString() || null,
            is_expired: isExpired,
          },
          profile,
        };
      })
    );

    // Filter out null entries (blocked users) and expired matches
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
      .select('liked_id, created_at')
      .eq('liker_id', userId)
      .eq('action', 'like')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching likes:', error);
      return { data: null, error };
    }

    // Get profiles of liked users
    const likedProfiles = await Promise.all(
      (likes || []).map(async (like) => {
        const { data: profile } = await getUserProfile(like.liked_id);
        return profile ? { ...profile, liked_at: like.created_at } : null;
      })
    );

    return { data: likedProfiles.filter(Boolean), error: null };
  } catch (error: any) {
    console.error('❌ Exception in getUserLikes:', error);
    return { data: null, error };
  }
};

// Get users who liked you (received likes)
export const getReceivedLikes = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    // Get blocked users list
    const { data: blockedUsers } = await getBlockedUsers();
    const blockedIds = blockedUsers || [];

    // Get all users who liked this user
    const { data: likes, error } = await supabase
      .from('likes')
      .select('liker_id, created_at')
      .eq('liked_id', userId)
      .eq('action', 'like')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching received likes:', error);
      return { data: null, error };
    }

    // Filter out blocked users and get profiles
    const receivedLikes = await Promise.all(
      (likes || [])
        .filter(like => !blockedIds.includes(like.liker_id))
        .map(async (like) => {
          const { data: profile } = await getUserProfile(like.liker_id);
          // Check if already matched (don't show in likes if matched)
          const { data: match } = await supabase
            .from('matches')
            .select('id')
            .or(`and(user1_id.eq.${userId},user2_id.eq.${like.liker_id}),and(user1_id.eq.${like.liker_id},user2_id.eq.${userId})`)
            .maybeSingle();
          
          if (match) {
            return null; // Already matched, don't show
          }
          
          return profile ? { ...profile, liked_at: like.created_at } : null;
        })
    );

    return { data: receivedLikes.filter(Boolean), error: null };
  } catch (error: any) {
    console.error('❌ Exception in getReceivedLikes:', error);
    return { data: null, error };
  }
};

// Premium feature functions
export const isPremiumUser = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return false;
    }

    const { data: profile } = await getUserProfile(session.user.id);
    if (!profile) {
      return false;
    }

    const isPremium = (profile as any).is_premium || false;
    const expiresAt = (profile as any).premium_expires_at;

    // Check if premium has expired
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      if (now > expirationDate) {
        return false; // Premium expired
      }
    }

    return isPremium;
  } catch (error) {
    console.error('❌ Error checking premium status:', error);
    return false;
  }
};

export const upgradeToPremium = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    // Set premium to true and expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error upgrading to premium:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in upgradeToPremium:', error);
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
      // console.log('⚠️  User already blocked');
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

    // console.log('✅ User blocked successfully');
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

    // console.log('✅ User unblocked successfully');
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
      .maybeSingle();

    if (error) {
      // Ignore duplicate errors (already viewed) and PGRST116 (no rows returned when duplicate ignored)
      if (error.code === '23505' || error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      console.error('❌ Error recording profile view:', error);
      return { data: null, error };
    }

    // If data is null (duplicate was ignored), that's fine - return success
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

// Messaging functions with End-to-End Encryption
export const sendMessage = async (
  receiverId: string, 
  matchId: string, 
  content: string,
  messageType: 'text' | 'gif' | 'sticker' = 'text',
  mediaUrl?: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const senderId = session.user.id;

    // Prevent self-messaging
    if (senderId === receiverId) {
      return { data: null, error: { message: 'Cannot send message to yourself' } };
    }

    // Verify match exists and user is part of it
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user1_id.eq.${senderId},user2_id.eq.${senderId}`)
      .maybeSingle();

    if (matchError || !match) {
      console.error('❌ Error verifying match:', matchError);
      return { data: null, error: { message: 'Match not found or unauthorized' } };
    }

    // Verify receiver is part of the match
    if (match.user1_id !== receiverId && match.user2_id !== receiverId) {
      return { data: null, error: { message: 'Receiver is not part of this match' } };
    }

    // Encrypt message content (End-to-End Encryption) - only for text messages
    const encryptionKey = deriveMatchKey(matchId, match.user1_id, match.user2_id);
    const encryptedContent = messageType === 'text' 
      ? encryptMessage(content.trim(), encryptionKey)
      : content; // GIFs/stickers don't need encryption (they're URLs)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        match_id: matchId,
        content: encryptedContent, // Store encrypted content
        message_type: messageType,
        media_url: mediaUrl || null,
        read: false,
        delivered: false, // Will be set to true by trigger
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error sending message:', error);
      return { data: null, error };
    }

    // Decrypt the message before returning (for immediate display)
    const decryptedData = {
      ...data,
      content: messageType === 'text' 
        ? decryptMessage(data.content, encryptionKey)
        : data.content, // GIFs/stickers are already URLs
    };

    // console.log('✅ Encrypted message sent successfully');
    return { data: decryptedData, error: null };
  } catch (error: any) {
    console.error('❌ Exception in sendMessage:', error);
    return { data: null, error };
  }
};

export const getMessages = async (matchId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    // Verify match exists and user is part of it
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .maybeSingle();

    if (matchError || !match) {
      console.error('❌ Error verifying match:', matchError);
      return { data: null, error: { message: 'Match not found or unauthorized' } };
    }

    // Get all messages for this match
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages:', error);
      return { data: null, error };
    }

    // Decrypt all messages (End-to-End Decryption)
    const encryptionKey = deriveMatchKey(matchId, match.user1_id, match.user2_id);
    const decryptedMessages = (data || []).map((message) => {
      const messageType = (message as any).message_type || 'text';
      return {
        ...message,
        content: messageType === 'text'
          ? decryptMessage(message.content, encryptionKey)
          : message.content, // GIFs/stickers are URLs
        message_type: messageType,
        media_url: (message as any).media_url || null,
        delivered: (message as any).delivered || false,
      };
    });

    return { data: decryptedMessages, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getMessages:', error);
    return { data: null, error };
  }
};

export const getConversations = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    // Get all matches for this user
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return { data: null, error: matchesError };
    }

    if (!matches || matches.length === 0) {
      return { data: [], error: null };
    }

    // Get last message and unread count for each match
    const conversations = await Promise.all(
      matches.map(async (match) => {
        const partnerId = match.user1_id === userId ? match.user2_id : match.user1_id;

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .eq('receiver_id', userId)
          .eq('read', false);

        // Get partner profile
        const { data: profile } = await getUserProfile(partnerId);

        return {
          match,
          partner: profile,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
        };
      })
    );

    // Filter out conversations with null profiles and sort by last message time
    const validConversations = conversations
      .filter((c) => c.partner !== null)
      .sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.match.created_at;
        const bTime = b.lastMessage?.created_at || b.match.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    return { data: validConversations, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getConversations:', error);
    return { data: null, error };
  }
};

export const getTotalUnreadCount = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: 0, error: null };
    }

    const userId = session.user.id;

    // Get total count of unread messages for this user
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) {
      console.error('❌ Error getting unread count:', error);
      return { data: 0, error };
    }

    return { data: count || 0, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getTotalUnreadCount:', error);
    return { data: 0, error };
  }
};

export const markMessagesAsRead = async (matchId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    // Verify match exists and user is part of it
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .maybeSingle();

    if (matchError || !match) {
      console.error('❌ Error verifying match:', matchError);
      return { data: null, error: { message: 'Match not found or unauthorized' } };
    }

    // Mark all unread messages as read
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) {
      console.error('❌ Error marking messages as read:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('❌ Exception in markMessagesAsRead:', error);
    return { data: null, error };
  }
};

// Typing indicator functions
export const setTypingIndicator = async (matchId: string, isTyping: boolean) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    // Upsert typing indicator
    const { data, error } = await supabase
      .from('typing_indicators')
      .upsert({
        match_id: matchId,
        user_id: userId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'match_id,user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error setting typing indicator:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in setTypingIndicator:', error);
    return { data: null, error };
  }
};

export const getTypingIndicator = async (matchId: string, partnerId: string) => {
  try {
    const { data, error } = await supabase
      .from('typing_indicators')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', partnerId)
      .eq('is_typing', true)
      .maybeSingle();

    if (error) {
      console.error('❌ Error getting typing indicator:', error);
      return { data: null, error };
    }

    // Check if typing indicator is recent (within last 3 seconds)
    if (data && data.updated_at) {
      const updatedAt = new Date(data.updated_at).getTime();
      const now = new Date().getTime();
      const diffInSeconds = (now - updatedAt) / 1000;
      
      if (diffInSeconds > 3) {
        // Typing indicator is stale, return null
        return { data: null, error: null };
      }
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getTypingIndicator:', error);
    return { data: null, error };
  }
};

// Posts functions
export interface Post {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export const createPost = async (
  title: string | undefined, 
  imageUri: string | null, 
  description: string | undefined
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageUri) {
      const imageName = `post_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await uploadImage(userId, imageUri, imageName, 'posts');

      if (uploadError || !uploadData) {
        console.error('❌ Error uploading post image:', uploadError);
        return { data: null, error: uploadError || { message: 'Failed to upload image' } };
      }

      // Get the public URL from upload data
      imageUrl = uploadData.publicUrl || uploadData.path || null;
      // console.log('📸 Post image URL:', imageUrl);
    }

    // Validate: must have either image or description
    if (!imageUrl && !description) {
      return { data: null, error: { message: 'Post must have either an image or description' } };
    }

    // Create post in database
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          user_id: userId,
          title: title || null,
          description: description || null,
          image_url: imageUrl || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating post:', error);
      return { data: null, error };
    }

    // console.log('✅ Post created successfully');
    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in createPost:', error);
    return { data: null, error };
  }
};

export const getUserPosts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching posts:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getUserPosts:', error);
    return { data: null, error };
  }
};

// Prompts/Questions functions (Hinge-style)
export interface Prompt {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Predefined prompt questions (like Hinge)
export const PROMPT_QUESTIONS = [
  "Two truths and a lie",
  "I want someone who",
  "I'm looking for",
  "The way to my heart is",
  "I'll fall for you if",
  "My simple pleasures",
  "I'm the type of person who",
  "The one thing I'd love to know about you is",
  "My most irrational fear",
  "I'll know I've found the one when",
  "My love language is",
  "The best way to ask me out is by",
  "I'm weirdly attracted to",
  "My golden rule",
  "I'll brag about you to my friends if",
  "I'm a great +1 because",
  "I spend way too much time thinking about",
  "I'm a catch because",
  "I'm looking for",
  "We'll get along if",
];

export const getUserPrompts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching prompts:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getUserPrompts:', error);
    return { data: null, error };
  }
};

export const createPrompt = async (question: string, answer: string, orderIndex: number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: userId,
          question,
          answer,
          order_index: orderIndex,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating prompt:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in createPrompt:', error);
    return { data: null, error };
  }
};

export const updatePrompt = async (promptId: string, question: string, answer: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const { data, error } = await supabase
      .from('prompts')
      .update({
        question,
        answer,
      })
      .eq('id', promptId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating prompt:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in updatePrompt:', error);
    return { data: null, error };
  }
};

export const deletePrompt = async (promptId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const { data, error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting prompt:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('❌ Exception in deletePrompt:', error);
    return { data: null, error };
  }
};

export const deletePost = async (postId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('❌ Error deleting post:', error);
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('❌ Exception in deletePost:', error);
    return { data: null, error };
  }
};

export interface PostWithProfile extends Post {
  user_first_name?: string;
  user_last_name?: string;
  user_location?: string;
  user_photos?: string[];
}

export const getAllPosts = async (excludeUserId?: string) => {
  try {
    // console.log('🔍 Fetching all posts...');
    
    // Get blocked users list
    const { data: blockedUsers } = await getBlockedUsers();
    const blockedIds = blockedUsers || [];
    
    // Get viewed profiles list
    const { data: viewedProfiles } = await getViewedProfiles();
    const viewedIds = viewedProfiles || [];
    
    // Get all posts
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Exclude current user if provided
    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }
    
    const { data: postsData, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching posts:', error);
      return { data: null, error };
    }
    
    if (!postsData || postsData.length === 0) {
      return { data: [], error: null };
    }
    
    // Get user IDs from posts
    const userIds = [...new Set(postsData.map((post: any) => post.user_id))];
    
    // Fetch profiles for all users
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, location, photos, gender, interested_in')
      .in('id', userIds);
    
    // Create a map of user_id to profile
    const profileMap = new Map();
    (profilesData || []).forEach((profile: any) => {
      profileMap.set(profile.id, profile);
    });
    
    // Combine posts with profile data
    const postsWithProfiles = postsData.map((post: any) => {
      const profile = profileMap.get(post.user_id);
      return {
        ...post,
        user_first_name: profile?.first_name,
        user_last_name: profile?.last_name,
        user_location: profile?.location,
        user_photos: profile?.photos,
      };
    });
    
    // Filter out posts from blocked users and viewed profiles
    const filteredPosts = postsWithProfiles.filter((post: any) => {
      const userId = post.user_id;
      return !blockedIds.includes(userId) && !viewedIds.includes(userId);
    });
    
    // console.log(`✅ Loaded ${filteredPosts.length} posts`);
    return { data: filteredPosts, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getAllPosts:', error);
    return { data: null, error };
  }
};

