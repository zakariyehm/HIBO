/**
 * Profile Screen - HIBO Dating App
 * Display user profile information with dating app design
 */

import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { createPost, createPrompt, deletePost, deletePrompt, getUserPosts, getUserProfile, getUserPrompts, Post, Prompt, PROMPT_QUESTIONS, signOut, supabase, updatePrompt, uploadPhotos } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isSmallWidth = width < 360;
const titleFontSize = isSmallWidth ? 24 : width < 400 ? 26 : 28;

const theme = {
  primary: Colors.background,
  secondary: Colors.cardBackground,
  white: Colors.cardBackground,
  black: Colors.textDark,
  lightText: Colors.textLight,
  placeholder: Colors.textLight,
  gray: Colors.textLight,
  lightGray: Colors.borderLight,
  error: Colors.red,
  buttonInactive: Colors.borderLight,
  buttonActive: Colors.primary,
};

interface UserProfile {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  age?: number;
  height?: number;
  location?: string;
  profession?: string;
  education_level?: string;
  nationality?: string[];
  grow_up?: string;
  smoke?: string;
  has_children?: string;
  gender?: string;
  interested_in?: string;
  looking_for?: string;
  personality?: string[];
  marriage_know_time?: string;
  marriage_married_time?: string;
  interests?: string[];
  photos?: string[];
  source?: string;
  document_type?: string;
  passport?: string;
  driver_license_front?: string;
  driver_license_back?: string;
  nationality_id_front?: string;
  nationality_id_back?: string;
  national_id_number?: string;
  bio_title?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'view'>('view');
  const [newPhotos, setNewPhotos] = useState<string[]>([]); // Track newly added/changed photos
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'error' | 'success'>('info');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostDescription, setNewPostDescription] = useState('');
  const [posting, setPosting] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPromptQuestion, setNewPromptQuestion] = useState('');
  const [newPromptAnswer, setNewPromptAnswer] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Show toast notification
  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Helper function to extract image URL from various formats
  const getImageUrl = (imageUrl: any): string | null => {
    if (!imageUrl) return null;
    
    // If it's already a string URL
    if (typeof imageUrl === 'string') {
      // Check if it's a JSON string that needs parsing
      const trimmed = imageUrl.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return parsed.publicUrl || parsed.path || null;
        } catch {
          // If parsing fails, check if it's a valid URL
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
          }
          return null;
        }
      }
      // If it's a valid URL string, return it
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return null;
    }
    
    // If it's an object, extract publicUrl or path
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      return imageUrl.publicUrl || imageUrl.path || null;
    }
    
    return null;
  };

  // Count emojis in a string
  const countEmojis = (text: string): number => {
    // Emoji regex pattern covering most common emoji ranges
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]/gu;
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
  };

  // Validate name input: max 10 characters and max 2 emojis
  const validateNameInput = (newText: string, currentText: string): string => {
    // Count emojis in new text
    const emojiCount = countEmojis(newText);
    
    // If more than 2 emojis, reject the change
    if (emojiCount > 2) {
      showToast('Maximum 2 emojis allowed', 'error');
      return currentText; // Return current value, don't update
    }
    
    // Count total characters - each emoji and regular char counts as 1
    // Use Array.from to properly handle Unicode characters
    const totalLength = Array.from(newText).length;
    
    if (totalLength > 10) {
      showToast('Maximum 10 characters allowed', 'error');
      return currentText; // Return current value, don't update
    }
    
    return newText;
  };

  // Request image permissions
  const requestImagePermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('We need access to your photos to upload images.', 'error');
        return false;
      }
    }
    return true;
  };

  // Handle image picker for editing photos
  const handlePickImage = async (index?: number) => {
    try {
      const hasPermission = await requestImagePermissions();
      if (!hasPermission) return;

      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => pickImageFromCamera(index) },
          { text: 'Gallery', onPress: () => pickImageFromGallery(index) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      showToast('Failed to pick image', 'error');
    }
  };

  const pickImageFromGallery = async (index?: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && editingProfile) {
        const updatedPhotos = [...(editingProfile.photos || [])];
        const localUri = result.assets[0].uri;
        
        if (index !== undefined && index < updatedPhotos.length) {
          updatedPhotos[index] = localUri;
        } else {
          updatedPhotos.push(localUri);
        }
        
        setEditingProfile({ ...editingProfile, photos: updatedPhotos });
        
        // Track this as a new photo that needs upload
        if (!newPhotos.includes(localUri)) {
          setNewPhotos([...newPhotos, localUri]);
        }
      }
    } catch (error) {
      showToast('Failed to pick image from gallery', 'error');
    }
  };

  const pickImageFromCamera = async (index?: number) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('We need access to your camera.', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && editingProfile) {
        const updatedPhotos = [...(editingProfile.photos || [])];
        const localUri = result.assets[0].uri;
        
        if (index !== undefined && index < updatedPhotos.length) {
          updatedPhotos[index] = localUri;
        } else {
          updatedPhotos.push(localUri);
        }
        
        setEditingProfile({ ...editingProfile, photos: updatedPhotos });
        
        // Track this as a new photo that needs upload
        if (!newPhotos.includes(localUri)) {
          setNewPhotos([...newPhotos, localUri]);
        }
      }
    } catch (error) {
      showToast('Failed to take photo', 'error');
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (editingProfile && editingProfile.photos) {
      // Don't allow removal if it would result in less than 3 photos
      if (editingProfile.photos.length <= 3) {
        showToast('You need at least 3 photos in your profile.', 'error');
        return;
      }
      
      const newPhotos = editingProfile.photos.filter((_, i) => i !== index);
      setEditingProfile({ ...editingProfile, photos: newPhotos });
    }
  };

  const handlePickPostImage = async () => {
    try {
      const hasPermission = await requestImagePermissions();
      if (!hasPermission) return;

      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => pickPostImageFromCamera() },
          { text: 'Gallery', onPress: () => pickPostImageFromGallery() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      showToast('Failed to pick image', 'error');
    }
  };

  const pickPostImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewPostImage(result.assets[0].uri);
      }
    } catch (error) {
      showToast('Failed to pick image from gallery', 'error');
    }
  };

  const pickPostImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('We need access to your camera.', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewPostImage(result.assets[0].uri);
      }
    } catch (error) {
      showToast('Failed to take photo', 'error');
    }
  };

  const handleCreatePost = async () => {
    // Validate: must have either image or description
    if (!newPostImage && !newPostDescription.trim()) {
      showToast('Please add text or an image', 'error');
      return;
    }

    try {
      setPosting(true);
      const { data, error } = await createPost(
        newPostTitle || undefined, 
        newPostImage,
        newPostDescription.trim() || undefined
      );

      if (error) {
        console.error('❌ Error creating post:', error);
        showToast('Failed to create post. Please try again.', 'error');
        setPosting(false);
        return;
      }

      if (data) {
        // console.log('✅ Post created:', data);
        // console.log('📸 Post image URL:', data.image_url);
        
        // Refetch posts to get the latest data with proper image URLs
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: refreshedPosts } = await getUserPosts(session.user.id);
          if (refreshedPosts) {
            // console.log('✅ Refreshed posts:', refreshedPosts.length);
            refreshedPosts.forEach((post: any, index: number) => {
              // console.log(`  Post ${index + 1}:`, post.id, 'Image:', post.image_url);
            });
            setPosts(refreshedPosts);
          } else {
            // Fallback: add the new post to the list
            // console.log('⚠️  Using fallback - adding post directly');
            setPosts([data, ...posts]);
          }
        }
        setNewPostTitle('');
        setNewPostImage(null);
        setNewPostDescription('');
        showToast('Post created successfully! 🎉', 'success');
      }

      setPosting(false);
    } catch (error: any) {
      console.error('❌ Exception in handleCreatePost:', error);
      showToast(error.message || 'An error occurred.', 'error');
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deletePost(postId);
            if (error) {
              showToast('Failed to delete post', 'error');
              return;
            }
            setPosts(posts.filter(p => p.id !== postId));
            showToast('Post deleted successfully', 'success');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!editingProfile || !userProfile?.id) {
      showToast('No profile data to save', 'error');
      return;
    }
    
    try {
      setSaving(true);
      // console.log('💾 Starting save process...');
      
      // Filter out placeholder photos and separate local vs remote
      let finalPhotoUrls = [...(editingProfile.photos || [])];
      const localPhotos = finalPhotoUrls.filter(photo => 
        photo && !photo.startsWith('http') && !photo.startsWith('https')
      );
      const remotePhotos = finalPhotoUrls.filter(photo => 
        photo && (photo.startsWith('http') || photo.startsWith('https'))
      );
      
      // console.log('📊 Photos breakdown:');
      // console.log('  - Total:', finalPhotoUrls.length);
      // console.log('  - Local (need upload):', localPhotos.length);
      // console.log('  - Remote (already uploaded):', remotePhotos.length);
      
      // Upload local photos if any
      if (localPhotos.length > 0) {
        // console.log('📸 Uploading', localPhotos.length, 'new photos...');
        
        const { data: uploadedUrls, error: uploadError } = await uploadPhotos(
          userProfile.id,
          localPhotos
        );
        
        if (uploadError) {
          console.error('❌ Photo upload error:', uploadError);
          showToast('Failed to upload photos. Please try again.', 'error');
          setSaving(false);
          return;
        }
        
        if (uploadedUrls && uploadedUrls.length > 0) {
          // console.log('✅ Photos uploaded successfully:', uploadedUrls.length);
          
          // Replace local URIs with uploaded URLs in the correct positions
          finalPhotoUrls = finalPhotoUrls.map(photo => {
            if (photo && !photo.startsWith('http')) {
              const index = localPhotos.indexOf(photo);
              if (index !== -1 && uploadedUrls[index]) {
                return uploadedUrls[index];
              }
            }
            return photo;
          });
        }
      }
      
      // Filter out any invalid URLs
      finalPhotoUrls = finalPhotoUrls.filter(photo => 
        photo && (photo.startsWith('http') || photo.startsWith('https'))
      );
      
      // Validate minimum 3 photos before saving
      if (finalPhotoUrls.length < 3) {
        console.error('❌ Need at least 3 photos, have:', finalPhotoUrls.length);
        showToast('You need at least 3 photos in your profile.', 'error');
        setSaving(false);
        return;
      }
      
      // console.log('📤 Saving profile with', finalPhotoUrls.length, 'photos');
      // console.log('📸 Final photo URLs:', finalPhotoUrls);
      
      // Prepare all updated fields
      const updatedFields: any = {
        photos: finalPhotoUrls,
        first_name: editingProfile.first_name,
        last_name: editingProfile.last_name,
        email: editingProfile.email,
        phone_number: editingProfile.phone_number,
        age: editingProfile.age,
        location: editingProfile.location,
        height: editingProfile.height,
        gender: editingProfile.gender,
        interested_in: editingProfile.interested_in,
        looking_for: editingProfile.looking_for,
        profession: editingProfile.profession,
        education_level: editingProfile.education_level,
        nationality: editingProfile.nationality || [],
        grow_up: editingProfile.grow_up,
        smoke: editingProfile.smoke,
        has_children: editingProfile.has_children,
        personality: editingProfile.personality || [],
        marriage_know_time: editingProfile.marriage_know_time,
        marriage_married_time: editingProfile.marriage_married_time,
        interests: editingProfile.interests || [],
        bio_title: editingProfile.bio_title,
        bio: editingProfile.bio,
        updated_at: new Date().toISOString(),
      };
      
      // console.log('💾 Updating all profile fields...');
      
      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedFields)
        .eq('id', userProfile.id);
      
      if (updateError) {
        console.error('❌ Profile update error:', updateError);
        showToast('Failed to save profile. Please try again.', 'error');
        setSaving(false);
        return;
      }
      
      // console.log('✅ Profile updated successfully in database');
      
      // Refetch profile from database to get latest data including bio_title
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: refreshedProfile } = await getUserProfile(session.user.id);
        if (refreshedProfile) {
          // Filter out placeholder photos
          if (refreshedProfile.photos && refreshedProfile.photos.length > 0) {
            const validPhotos = refreshedProfile.photos.filter((photo: string) => 
              photo && 
              !photo.includes('placeholder') && 
              (photo.startsWith('http') || photo.startsWith('https'))
            );
            if (validPhotos.length > 0) {
              refreshedProfile.photos = validPhotos;
            } else {
              refreshedProfile.photos = [];
            }
          }
          setUserProfile(refreshedProfile);
          setEditingProfile(refreshedProfile);
        }
      }
      
      setNewPhotos([]); // Clear new photos list
      setActiveTab('view');
      setSaving(false);
      
      // Show success toast
      showToast('Profile updated successfully! 🎉', 'success');
    } catch (error: any) {
      console.error('❌ Save error:', error);
      showToast(error.message || 'An unexpected error occurred.', 'error');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingProfile(userProfile);
    setNewPhotos([]); // Clear new photos
    setActiveTab('view');
  };

  const handleTabChange = (tab: 'edit' | 'view') => {
    if (tab === 'edit') {
      setEditingProfile({ ...userProfile });
    }
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // console.log('🔓 Logging out...');
              const { error } = await signOut();
              
              if (error) {
                console.error('❌ Logout error:', error);
                showToast('Failed to logout. Please try again.', 'error');
                return;
              }
              
              // console.log('✅ Logged out successfully');
              // Navigate to login screen
              router.replace('/login');
            } catch (error: any) {
              console.error('❌ Logout error:', error);
              showToast('Failed to logout. Please try again.', 'error');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Fetch user profile data from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Get current authenticated user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          showToast('Failed to get user session', 'error');
      setLoading(false);
          return;
        }
        
        if (!session?.user) {
          // console.log('No authenticated user found');
          showToast('Please log in to view your profile', 'error');
          setLoading(false);
          return;
        }
        
        const userId = session.user.id;
        // console.log('📋 Fetching profile for user:', userId);
        
        // Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await getUserProfile(userId);
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          showToast('Failed to load profile data', 'error');
          setLoading(false);
          return;
        }
        
        if (profileData) {
          // console.log('✅ Profile loaded successfully');
          // console.log('📸 Photos:', profileData.photos);
          
          // Filter out placeholder photos
          if (profileData.photos && profileData.photos.length > 0) {
            const validPhotos = profileData.photos.filter((photo: string) => 
              photo && 
              !photo.includes('placeholder') && 
              (photo.startsWith('http') || photo.startsWith('https'))
            );
            
            if (validPhotos.length > 0) {
              // console.log(`✅ Found ${validPhotos.length} valid photos`);
              profileData.photos = validPhotos;
            } else {
              // console.log('⚠️  No valid photos found (all placeholders)');
              profileData.photos = [];
            }
          }
          
          setUserProfile(profileData);
          
          // Fetch user posts
          const { data: postsData } = await getUserPosts(userId);
          if (postsData) {
            setPosts(postsData);
          }

          // Fetch prompts
          const { data: promptsData } = await getUserPrompts(userId);
          if (promptsData) {
            setPrompts(promptsData);
          }
        } else {
          // console.log('⚠️  No profile data found for this user');
          showToast('No profile data found. Please complete onboarding.', 'error');
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        showToast(error.message || 'Failed to load profile', 'error');
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Skeleton Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.borderLight }} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ width: '60%', height: 20, borderRadius: 4, backgroundColor: Colors.borderLight }} />
            <View style={{ width: '40%', height: 16, borderRadius: 4, backgroundColor: Colors.borderLight }} />
          </View>
        </View>
        
        {/* Skeleton Photos */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ width: 100, height: 100, borderRadius: 8, backgroundColor: Colors.borderLight }} />
          ))}
        </View>
        
        {/* Skeleton Content */}
        <View style={{ gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: '100%', height: 16, borderRadius: 4, backgroundColor: Colors.borderLight }} />
          ))}
        </View>
        
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </ScrollView>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.topHeader, Platform.OS === 'android' && { paddingTop: 10 }]}>
          <Text style={styles.headerButtonText}>Cancel</Text>
          <Text style={styles.headerName}>Profile</Text>
          <Text style={styles.headerButtonText}>Done</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No profile data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* Header with Cancel/Done */}
      <View style={[styles.topHeader, Platform.OS === 'android' && { paddingTop: 10 }]}>
        {activeTab === 'edit' ? (
          <>
            <TouchableOpacity onPress={handleCancel} disabled={saving}>
              <Text style={[styles.headerButtonText, saving && styles.headerButtonDisabled]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.doneButtonContainer}>
              {saving && (
                <ActivityIndicator 
                  size="small" 
                  color={theme.gray} 
                  style={styles.saveSpinner}
                />
              )}
              <Text style={[styles.headerButtonText, saving && styles.headerButtonDisabled]}>
                {saving ? 'Saving...' : 'Done'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ width: 60 }} />
            <Text style={styles.headerName}>
              {userProfile?.first_name || 'Profile'}
            </Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={theme.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* Separator Line */}
      <View style={styles.separator} />
      
      {/* Edit/View Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('edit')}
        >
          <Text style={[styles.tabText, activeTab === 'edit' && styles.tabTextActive]}>
            Edit
          </Text>
          {activeTab === 'edit' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange('view')}
        >
          <Text style={[styles.tabText, activeTab === 'view' && styles.tabTextActive]}>
            View
          </Text>
          {activeTab === 'view' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos Section - Dating App Style */}
        {((activeTab === 'view' ? userProfile.photos : editingProfile?.photos) || []).length > 0 ? (
          <View style={styles.photosSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScrollContent}
              pagingEnabled
              snapToInterval={width * 0.9 + 12}
              decelerationRate="fast"
            >
              {(activeTab === 'view' ? userProfile.photos : editingProfile?.photos)!.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  {imageErrors[index] ? (
                    /* Error State - Instagram Style */
                    <View style={styles.imageErrorContainer}>
                      <Ionicons name="image-outline" size={60} color={theme.gray} />
                      <Text style={styles.imageErrorText}>Failed to load</Text>
                  {activeTab === 'edit' && (
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={() => {
                            setImageErrors(prev => ({ ...prev, [index]: false }));
                            handlePickImage(index);
                          }}
                        >
                          <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <>
                      <Image 
                        source={{ uri: photo }} 
                        style={styles.photo} 
                        contentFit="cover"
                        onLoadStart={() => {
                          setImageLoadingStates(prev => ({ ...prev, [index]: true }));
                        }}
                        onLoadEnd={() => {
                          setImageLoadingStates(prev => ({ ...prev, [index]: false }));
                        }}
                        onError={() => {
                          console.error('❌ Failed to load image:', photo);
                          setImageLoadingStates(prev => ({ ...prev, [index]: false }));
                          setImageErrors(prev => ({ ...prev, [index]: true }));
                        }}
                      />
                      {imageLoadingStates[index] && (
                        /* Loading State - Instagram Style */
                        <View style={styles.imageLoadingOverlay}>
                          <View style={styles.loadingSpinner} />
                        </View>
                      )}
                    </>
                  )}
                  {activeTab === 'edit' && !imageErrors[index] && (
                    <>
                      <TouchableOpacity
                        style={styles.editPhotoButton}
                        onPress={() => handlePickImage(index)}
                      >
                        <Ionicons name="camera" size={20} color={theme.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={theme.error} />
                      </TouchableOpacity>
                    </>
                  )}
                  {(activeTab === 'view' ? userProfile.photos : editingProfile?.photos)!.length > 1 && !imageErrors[index] && (
                    <View style={styles.photoIndicator}>
                      <Text style={styles.photoIndicatorText}>
                        {index + 1} / {(activeTab === 'view' ? userProfile.photos : editingProfile?.photos)!.length}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {activeTab === 'edit' && editingProfile && editingProfile.photos && editingProfile.photos.length < 6 && (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => handlePickImage()}
                >
                  <Ionicons name="add" size={40} color={theme.gray} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        ) : (
          /* No Photos Placeholder - Instagram/Facebook Style */
          activeTab === 'edit' ? (
            <View style={styles.photosSection}>
              <View style={styles.noPhotosContainer}>
                <Ionicons name="camera-outline" size={60} color={theme.gray} />
                <Text style={styles.noPhotosTitle}>Add Photos</Text>
                <Text style={styles.noPhotosText}>Add at least 3 photos to your profile</Text>
                <TouchableOpacity
                  style={styles.addFirstPhotoButton}
                  onPress={() => handlePickImage()}
                >
                  <Ionicons name="add" size={24} color={theme.white} />
                  <Text style={styles.addFirstPhotoText}>Add Your First Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photosSection}>
              <View style={styles.noPhotosContainer}>
                <Ionicons name="image-outline" size={60} color={theme.gray} />
                <Text style={styles.noPhotosTitle}>No Photos</Text>
                <Text style={styles.noPhotosText}>Add photos to your profile in Edit mode</Text>
              </View>
            </View>
          )
        )}

        {/* Bio Card - Hinge Style */}
          <View style={styles.bioCard}>
          {activeTab === 'edit' ? (
            <>
              <TextInput
                style={styles.bioTitleInput}
                value={editingProfile?.bio_title || ''}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, bio_title: text })}
                placeholder="I want someone who..."
                placeholderTextColor={theme.placeholder}
              />
              <TextInput
                style={styles.bioInput}
                value={editingProfile?.bio || ''}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, bio: text })}
                placeholder="is family oriented, thoughtful and knows how to have a good time!!"
                placeholderTextColor={theme.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </>
          ) : (
            <View style={styles.bioViewContainer}>
              {userProfile.bio_title && (
                <Text style={styles.bioTitleText}>{userProfile.bio_title}</Text>
              )}
              <Text style={styles.bioText}>{userProfile.bio || 'No bio yet'}</Text>
            </View>
          )}
          </View>

        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          
          {activeTab === 'edit' ? (
            /* Edit Mode */
            <>
              <View style={styles.nameSection}>
                <View style={styles.editRow}>
                  <Text style={styles.infoLabel}>First Name</Text>
                  <TextInput
                    style={styles.editInputValue}
                    value={editingProfile?.first_name || ''}
                    onChangeText={(text) => {
                      const validated = validateNameInput(text, editingProfile?.first_name || '');
                      setEditingProfile({ ...editingProfile, first_name: validated });
                    }}
                    placeholder="First name (max 10 chars, 2 emojis)"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
                <View style={styles.editRow}>
                  <Text style={styles.infoLabel}>Last Name</Text>
                  <TextInput
                    style={styles.editInputValue}
                    value={editingProfile?.last_name || ''}
                    onChangeText={(text) => {
                      const validated = validateNameInput(text, editingProfile?.last_name || '');
                      setEditingProfile({ ...editingProfile, last_name: validated });
                    }}
                    placeholder="Last name (max 10 chars, 2 emojis)"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
                <View style={styles.editRow}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <TextInput
                    style={styles.editInputValue}
                    value={editingProfile?.age?.toString() || ''}
                    onChangeText={(text) => setEditingProfile({ ...editingProfile, age: parseInt(text) || 0 })}
                    placeholder="Age"
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              </View>

              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>📍 Location</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.location || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, location: text })}
                  placeholder="Location"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>📏 Height (cm)</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.height?.toString() || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, height: parseInt(text) || 0 })}
                  placeholder="Height"
                  keyboardType="numeric"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>👤 Gender</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.gender || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, gender: text })}
                  placeholder="Gender"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>📧 Email</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.email || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>📱 Phone Number</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.phone_number || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, phone_number: text })}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
            </>
          ) : (
            /* View Mode */
            <>
          <View style={styles.nameSection}>
            <Text style={styles.name}>
                  {userProfile.first_name && userProfile.last_name
                    ? `${userProfile.first_name} ${userProfile.last_name}`
                    : 'User'}
            </Text>
            {userProfile.age && (
              <Text style={styles.age}>{userProfile.age} years old</Text>
            )}
          </View>

              {userProfile.email && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>📧 Email</Text>
                  <Text style={styles.infoValue}>{userProfile.email}</Text>
                </View>
              )}

              {userProfile.phone_number && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>📱 Phone Number</Text>
                  <Text style={styles.infoValue}>{userProfile.phone_number}</Text>
                </View>
              )}

          {userProfile.location && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📍 Location</Text>
              <Text style={styles.infoValue}>{userProfile.location}</Text>
            </View>
          )}

          {userProfile.height && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📏 Height</Text>
              <Text style={styles.infoValue}>{userProfile.height} cm</Text>
            </View>
          )}

          {userProfile.gender && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>👤 Gender</Text>
              <Text style={styles.infoValue}>{userProfile.gender}</Text>
            </View>
              )}
            </>
          )}
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Preferences</Text>
          </View>
          {activeTab === 'edit' ? (
            <>
              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>Interested in</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.interested_in || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, interested_in: text })}
                  placeholder="Interested in"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>Looking for</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.looking_for || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, looking_for: text })}
                  placeholder="Looking for"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
            </>
          ) : (
            <>
              {userProfile.interested_in && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Interested in</Text>
                  <Text style={styles.infoValue}>{userProfile.interested_in}</Text>
            </View>
          )}
              {userProfile.looking_for && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Looking for</Text>
                  <Text style={styles.infoValue}>{userProfile.looking_for}</Text>
            </View>
              )}
            </>
          )}
        </View>

        {/* Professional Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Professional</Text>
          </View>
          {activeTab === 'edit' ? (
            <>
              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>💼 Profession</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.profession || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, profession: text })}
                  placeholder="Profession"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>🎓 Education</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.education_level || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, education_level: text })}
                  placeholder="Education level"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
            </>
          ) : (
            <>
          {userProfile.profession && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>💼 Profession</Text>
              <Text style={styles.infoValue}>{userProfile.profession}</Text>
            </View>
          )}
              {userProfile.education_level && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>🎓 Education</Text>
                  <Text style={styles.infoValue}>{userProfile.education_level}</Text>
            </View>
              )}
            </>
          )}
        </View>

        {/* Personal Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Details</Text>
            </View>
          {activeTab === 'edit' ? (
            <>
              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>🏠 Grew up in</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.grow_up || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, grow_up: text })}
                  placeholder="City/Country"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>🚭 Smoke</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.smoke || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, smoke: text })}
                  placeholder="Yes/No"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.infoLabel}>👶 Has children</Text>
                <TextInput
                  style={styles.editInputValue}
                  value={editingProfile?.has_children || ''}
                  onChangeText={(text) => setEditingProfile({ ...editingProfile, has_children: text })}
                  placeholder="Yes/No"
                  placeholderTextColor={theme.placeholder}
                />
              </View>
            </>
          ) : (
            <>
            {userProfile.nationality && userProfile.nationality.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>🌍 Nationality</Text>
                <Text style={styles.infoValue}>{userProfile.nationality.join(', ')}</Text>
              </View>
            )}
              {userProfile.grow_up && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>🏠 Grew up in</Text>
                  <Text style={styles.infoValue}>{userProfile.grow_up}</Text>
              </View>
            )}
            {userProfile.smoke && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>🚭 Smoke</Text>
                <Text style={styles.infoValue}>{userProfile.smoke}</Text>
              </View>
            )}
              {userProfile.has_children && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>👶 Has children</Text>
                  <Text style={styles.infoValue}>{userProfile.has_children}</Text>
              </View>
            )}
            </>
        )}
        </View>

        {/* Personality Card */}
        {userProfile.personality && userProfile.personality.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personality</Text>
            <View style={styles.tagsContainer}>
              {userProfile.personality.map((trait, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Marriage Intentions Card */}
        {(userProfile.marriage_know_time || userProfile.marriage_married_time || activeTab === 'edit') && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Marriage Intentions</Text>
            </View>
            {activeTab === 'edit' ? (
              <>
                <View style={styles.editRow}>
                  <Text style={styles.infoLabel}>Know someone for</Text>
                  <TextInput
                    style={styles.editInputValue}
                    value={editingProfile?.marriage_know_time || ''}
                    onChangeText={(text) => setEditingProfile({ ...editingProfile, marriage_know_time: text })}
                    placeholder="How long to know someone"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
                <View style={styles.editRow}>
                  <Text style={styles.infoLabel}>Married within</Text>
                  <TextInput
                    style={styles.editInputValue}
                    value={editingProfile?.marriage_married_time || ''}
                    onChangeText={(text) => setEditingProfile({ ...editingProfile, marriage_married_time: text })}
                    placeholder="When to get married"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              </>
            ) : (
              <>
                {userProfile.marriage_know_time && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Know someone for</Text>
                    <Text style={styles.infoValue}>{userProfile.marriage_know_time}</Text>
              </View>
            )}
                {userProfile.marriage_married_time && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Married within</Text>
                    <Text style={styles.infoValue}>{userProfile.marriage_married_time}</Text>
              </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Interests Card */}
        {userProfile.interests && userProfile.interests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Interests</Text>
            <View style={styles.tagsContainer}>
              {userProfile.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Prompts Section - Hinge Style */}
        <View style={styles.promptsSection}>
          {/* Title Card with Purple Header */}
          <View style={styles.promptsTitleCard}>
            <View style={styles.promptsTitleHeader}>
              <Text style={styles.promptsTitleText}>PROMPTS</Text>
              {activeTab === 'edit' && (
                <TouchableOpacity
                  style={styles.addButtonInHeader}
                  onPress={() => {
                    setEditingPrompt(null);
                    setNewPromptQuestion('');
                    setNewPromptAnswer('');
                    setShowPromptModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.black} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {activeTab === 'edit' ? (
            <View style={styles.promptsList}>
              {prompts.map((prompt, index) => (
                <View key={prompt.id} style={styles.promptItem}>
                  <View style={styles.promptContent}>
                    <Text style={styles.promptQuestion}>{prompt.question}</Text>
                    <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                  </View>
                  <View style={styles.promptActions}>
                    <TouchableOpacity
                      style={styles.promptEditButton}
                      onPress={() => {
                        setEditingPrompt(prompt);
                        setNewPromptQuestion(prompt.question);
                        setNewPromptAnswer(prompt.answer);
                        setShowPromptModal(true);
                      }}
                    >
                      <Ionicons name="pencil" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.promptDeleteButton}
                      onPress={async () => {
                        const { error } = await deletePrompt(prompt.id);
                        if (error) {
                          showToast('Failed to delete prompt', 'error');
                        } else {
                          setPrompts(prompts.filter(p => p.id !== prompt.id));
                          showToast('Prompt deleted', 'success');
                        }
                      }}
                    >
                      <Ionicons name="trash" size={16} color={Colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {prompts.length === 0 && (
                <Text style={styles.emptyText}>No prompts yet. Add one to stand out!</Text>
              )}
            </View>
          ) : (
            <View style={styles.promptsList}>
              {prompts.map((prompt, index) => (
                <View key={prompt.id} style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                </View>
              ))}
              {prompts.length === 0 && (
                <Text style={styles.emptyText}>No prompts added yet</Text>
              )}
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>

          {/* Inline Add Post Input - Like Screenshot */}
          <View style={styles.inlinePostInputContainer}>
            <TextInput
              style={styles.inlinePostInput}
              value={newPostDescription}
              onChangeText={setNewPostDescription}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.inlineImageButton}
              onPress={handlePickPostImage}
            >
              <Ionicons name="image-outline" size={24} color={theme.white} />
            </TouchableOpacity>
          </View>

          {/* Title Input (Optional) */}
          {newPostDescription.trim() || newPostImage ? (
            <View style={styles.inlinePostOptions}>
              <TextInput
                style={styles.inlinePostTitleInput}
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholder="Title (optional)..."
                placeholderTextColor={theme.placeholder}
              />
              {newPostImage && (
                <View style={styles.inlineImagePreview}>
                  <Image
                    source={{ uri: newPostImage }}
                    style={styles.inlineImagePreviewImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.inlineRemoveImageButton}
                    onPress={() => setNewPostImage(null)}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.inlinePostButton,
                  ((!newPostImage && !newPostDescription.trim()) || posting) && styles.inlinePostButtonDisabled
                ]}
                onPress={handleCreatePost}
                disabled={(!newPostImage && !newPostDescription.trim()) || posting}
              >
                {posting ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <Text style={styles.inlinePostButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
            
          {posts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <Ionicons name="images-outline" size={48} color={theme.gray} />
              <Text style={styles.noPostsText}>No posts yet</Text>
              <Text style={styles.noPostsSubtext}>Share moments from your life!</Text>
            </View>
          ) : (
            <View style={styles.postsList}>
              {posts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  {/* Title at top - small, gray */}
                  {post.title && (
                    <Text style={styles.postCardTitle}>{post.title}</Text>
                  )}
                  
                  {/* Image or Description */}
                  {(() => {
                    const imageUri = getImageUrl(post.image_url);
                    return imageUri ? (
                      <View style={styles.postCardImageContainer}>
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.postCardImage}
                          contentFit="cover"
                          onError={(error) => {
                            console.error('❌ Error loading post image:', post.image_url, error);
                          }}
                          onLoad={() => {
                            // console.log('✅ Post image loaded:', imageUri);
                          }}
                        />
                      </View>
                    ) : post.description ? (
                      <View style={styles.postCardDescriptionContainer}>
                        <Text style={styles.postCardDescription}>{post.description}</Text>
                      </View>
                    ) : null;
                  })()}

                  {/* Delete button - only in edit mode */}
                  {activeTab === 'edit' && (
                    <TouchableOpacity
                      style={styles.deletePostCardButton}
                      onPress={() => handleDeletePost(post.id)}
                    >
                      <Ionicons name="close-circle" size={24} color={theme.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Prompt Modal */}
      {showPromptModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPrompt ? 'Edit Prompt' : 'Add Prompt'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPromptModal(false);
                  setEditingPrompt(null);
                  setNewPromptQuestion('');
                  setNewPromptAnswer('');
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Question</Text>
              <ScrollView style={styles.questionPicker}>
                {PROMPT_QUESTIONS.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.questionOption,
                      newPromptQuestion === question && styles.questionOptionSelected,
                    ]}
                    onPress={() => setNewPromptQuestion(question)}
                  >
                    <Text
                      style={[
                        styles.questionOptionText,
                        newPromptQuestion === question && styles.questionOptionTextSelected,
                      ]}
                    >
                      {question}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>Your Answer</Text>
              <TextInput
                style={styles.modalTextInput}
                value={newPromptAnswer}
                onChangeText={setNewPromptAnswer}
                placeholder="Type your answer..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  (!newPromptQuestion || !newPromptAnswer.trim()) && styles.modalSaveButtonDisabled,
                ]}
                onPress={async () => {
                  if (!newPromptQuestion || !newPromptAnswer.trim()) return;

                  if (editingPrompt) {
                    // Update existing prompt
                    const { error } = await updatePrompt(
                      editingPrompt.id,
                      newPromptQuestion,
                      newPromptAnswer.trim()
                    );
                    if (error) {
                      showToast('Failed to update prompt', 'error');
                    } else {
                      setPrompts(
                        prompts.map(p =>
                          p.id === editingPrompt.id
                            ? { ...p, question: newPromptQuestion, answer: newPromptAnswer.trim() }
                            : p
                        )
                      );
                      showToast('Prompt updated', 'success');
                      setShowPromptModal(false);
                      setEditingPrompt(null);
                      setNewPromptQuestion('');
                      setNewPromptAnswer('');
                    }
                  } else {
                    // Create new prompt
                    const orderIndex = prompts.length;
                    const { data, error } = await createPrompt(
                      newPromptQuestion,
                      newPromptAnswer.trim(),
                      orderIndex
                    );
                    if (error) {
                      showToast('Failed to create prompt', 'error');
                    } else if (data) {
                      setPrompts([...prompts, data]);
                      showToast('Prompt added', 'success');
                      setShowPromptModal(false);
                      setNewPromptQuestion('');
                      setNewPromptAnswer('');
                    }
                  }
                }}
                disabled={!newPromptQuestion || !newPromptAnswer.trim()}
              >
                <Text style={styles.modalSaveButtonText}>
                  {editingPrompt ? 'Update' : 'Add'} Prompt
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerButtonText: {
    fontSize: 17,
    color: theme.buttonActive,
    fontWeight: '400',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.black,
  },
  logoutButton: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  separator: {
    height: 1,
    backgroundColor: theme.lightGray,
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 17,
    color: theme.gray,
    fontWeight: '400',
  },
  tabTextActive: {
    color: theme.black,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.gray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  photosSection: {
    marginBottom: 20,
  },
  photosScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  photoContainer: {
    width: width * 0.9,
    height: width * 1.2,
    borderRadius: 0,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: theme.lightGray,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
  },
  photoIndicatorText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.black,
  },
  editLabel: {
    fontSize: 14,
    color: theme.gray,
    fontWeight: '400',
    textTransform: 'lowercase',
  },
  nameSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.black,
    marginBottom: 4,
  },
  age: {
    fontSize: 16,
    color: theme.gray,
    fontWeight: '400',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.gray,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: theme.black,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
  },
  tagText: {
    fontSize: 14,
    color: theme.black,
    fontWeight: '500',
  },
  bioCard: {
    backgroundColor: theme.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    padding: 20,
    minHeight: 120,
  },
  bioViewContainer: {
    paddingTop: 8,
  },
  bioTitleText: {
    fontSize: 14,
    color: theme.gray,
    fontWeight: '400',
    marginBottom: 12,
    textAlign: 'left',
  },
  bioText: {
    fontSize: 24,
    color: theme.black,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'left',
  },
  editButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 40,
    paddingVertical: 16,
    backgroundColor: theme.buttonActive,
    borderRadius: 30,
    alignItems: 'center',
  },
  editButtonText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  addPhotoButton: {
    width: width * 0.85,
    height: width * 1.2,
    borderRadius: 0,
    backgroundColor: theme.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.gray,
    fontWeight: '500',
  },
  noPhotosContainer: {
    width: width * 0.9,
    height: width * 1.2,
    marginHorizontal: 20,
    borderRadius: 0,
    backgroundColor: theme.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noPhotosTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.black,
    marginTop: 20,
    marginBottom: 8,
  },
  noPhotosText: {
    fontSize: 16,
    color: theme.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.buttonActive,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    gap: 8,
  },
  addFirstPhotoText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  editInput: {
    fontSize: 16,
    color: theme.black,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
    paddingVertical: 8,
    marginBottom: 8,
    width: '100%',
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
  },
  editInputValue: {
    fontSize: 16,
    color: theme.black,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    paddingVertical: 4,
  },
  bioTitleInput: {
    fontSize: 14,
    color: theme.gray,
    fontWeight: '400',
    textAlign: 'left',
    borderWidth: 1,
    borderColor: theme.black,
    borderRadius: 0,
    padding: 12,
    marginBottom: 12,
  },
  bioInput: {
    fontSize: 24,
    color: theme.black,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'left',
    borderWidth: 1,
    borderColor: theme.black,
    borderRadius: 0,
    padding: 12,
    minHeight: 100,
    maxHeight: 200,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: theme.lightGray,
    borderTopColor: theme.buttonActive,
  },
  imageErrorContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    padding: 20,
  },
  imageErrorText: {
    fontSize: 16,
    color: theme.gray,
    marginTop: 12,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.buttonActive,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
  },
  retryButtonText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '600',
  },
  doneButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveSpinner: {
    marginRight: 4,
  },
  promptsSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  promptsTitleCard: {
    backgroundColor: theme.secondary,
    borderWidth: 1,
    borderColor: theme.black,
    marginBottom: 12,
  },
  promptsTitleHeader: {
    backgroundColor: '#D5AFFD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptsTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addButtonInHeader: {
    padding: 4,
  },
  postsSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  addPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.buttonActive,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addPostButtonText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '600',
  },
  inlinePostInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  inlinePostInput: {
    flex: 1,
    fontSize: 16,
    color: theme.black,
    borderWidth: 1,
    borderColor: theme.black,
    borderRadius: 0,
    padding: 16,
    minHeight: 50,
    maxHeight: 100,
    backgroundColor: theme.white,
  },
  inlineImageButton: {
    width: 50,
    height: 50,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlinePostOptions: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  inlinePostTitleInput: {
    fontSize: 14,
    color: theme.black,
    borderWidth: 1,
    borderColor: theme.black,
    borderRadius: 0,
    padding: 10,
    backgroundColor: theme.white,
  },
  inlineImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    overflow: 'hidden',
    position: 'relative',
  },
  inlineImagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  inlineRemoveImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
  },
  inlinePostButton: {
    backgroundColor: theme.buttonActive,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  inlinePostButtonDisabled: {
    opacity: 0.5,
  },
  inlinePostButtonText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '600',
  },
  noPostsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noPostsText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.black,
    marginTop: 12,
    marginBottom: 4,
  },
  noPostsSubtext: {
    fontSize: 14,
    color: theme.gray,
    textAlign: 'center',
  },
  postsList: {
    gap: 24,
  },
  postCard: {
    backgroundColor: theme.secondary,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  postCardTitle: {
    fontSize: 14,
    color: theme.gray,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  postCardImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: theme.lightGray,
  },
  postCardImage: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.gray,
  },
  deletePostCardButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    padding: 4,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postItem: {
    width: (width - 64) / 3, // 3 columns with gaps
    aspectRatio: 3 / 4,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    overflow: 'hidden',
    backgroundColor: theme.lightGray,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postTitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  postTitleText: {
    fontSize: 12,
    color: theme.white,
    fontWeight: '500',
  },
  deletePostButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.white,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    width: width - 40,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.black,
  },
  modalScrollView: {
    maxHeight: 500,
  },
  postTitleInput: {
    fontSize: 16,
    color: theme.black,
    borderWidth: 1,
    borderColor: theme.black,
    borderRadius: 0,
    padding: 12,
    marginBottom: 16,
  },
  postImagePreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  postImagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
  },
  selectImageButton: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 0,
    backgroundColor: theme.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.black,
    borderStyle: 'dashed',
  },
  selectImageText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.gray,
    fontWeight: '500',
  },
  createPostButton: {
    backgroundColor: theme.buttonActive,
    paddingVertical: 14,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    alignItems: 'center',
    marginTop: 8,
  },
  createPostButtonDisabled: {
    opacity: 0.5,
  },
  createPostButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Prompts styles
  promptsList: {
    gap: 12,
  },
  promptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  promptContent: {
    flex: 1,
  },
  promptQuestion: {
    fontSize: 14,
    color: theme.gray,
    fontWeight: '400',
    marginBottom: 12,
  },
  promptAnswer: {
    fontSize: 24,
    color: theme.black,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  promptCard: {
    padding: 16,
    backgroundColor: theme.secondary,
    borderRadius: 0,
    marginBottom: 12,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  promptEditButton: {
    padding: 8,
  },
  promptDeleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    padding: 20,
  },
  // Modal styles for prompts
  modalBody: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 8,
  },
  questionPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 0,
    marginBottom: 16,
  },
  questionOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  questionOptionSelected: {
    backgroundColor: Colors.primary + '20',
  },
  questionOptionText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  questionOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  modalTextInput: {
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 0,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.textDark,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveButtonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  postMainInput: {
    flex: 1,
    fontSize: 16,
    color: theme.black,
    borderWidth: 1,
    borderColor: theme.black,
    borderRadius: 0,
    padding: 16,
    minHeight: 50,
    maxHeight: 150,
  },
  imageAttachButton: {
    width: 50,
    height: 50,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCardDescriptionContainer: {
    padding: 16,
    backgroundColor: theme.lightGray,
    minHeight: 100,
  },
  postCardDescription: {
    fontSize: 16,
    color: theme.black,
    lineHeight: 24,
  },
});
