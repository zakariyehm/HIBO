/**
 * Profile Screen - HIBO Dating App
 * Display user profile information with dating app design
 */

import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { getUserProfile, signOut, supabase, uploadPhotos } from '@/lib/supabase';
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

  // Show toast notification
  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
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

  const handleSave = async () => {
    if (!editingProfile || !userProfile?.id) {
      showToast('No profile data to save', 'error');
      return;
    }
    
    try {
      setSaving(true);
      console.log('💾 Starting save process...');
      
      // Filter out placeholder photos and separate local vs remote
      let finalPhotoUrls = [...(editingProfile.photos || [])];
      const localPhotos = finalPhotoUrls.filter(photo => 
        photo && !photo.startsWith('http') && !photo.startsWith('https')
      );
      const remotePhotos = finalPhotoUrls.filter(photo => 
        photo && (photo.startsWith('http') || photo.startsWith('https'))
      );
      
      console.log('📊 Photos breakdown:');
      console.log('  - Total:', finalPhotoUrls.length);
      console.log('  - Local (need upload):', localPhotos.length);
      console.log('  - Remote (already uploaded):', remotePhotos.length);
      
      // Upload local photos if any
      if (localPhotos.length > 0) {
        console.log('📸 Uploading', localPhotos.length, 'new photos...');
        
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
          console.log('✅ Photos uploaded successfully:', uploadedUrls.length);
          
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
      
      console.log('📤 Saving profile with', finalPhotoUrls.length, 'photos');
      console.log('📸 Final photo URLs:', finalPhotoUrls);
      
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
        bio: editingProfile.bio,
        updated_at: new Date().toISOString(),
      };
      
      console.log('💾 Updating all profile fields...');
      
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
      
      console.log('✅ Profile updated successfully in database');
      
      // Update local state
      const updatedProfile = { ...editingProfile, photos: finalPhotoUrls };
      setUserProfile(updatedProfile);
      setEditingProfile(updatedProfile);
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
              console.log('🔓 Logging out...');
              const { error } = await signOut();
              
              if (error) {
                console.error('❌ Logout error:', error);
                showToast('Failed to logout. Please try again.', 'error');
                return;
              }
              
              console.log('✅ Logged out successfully');
              // Navigate to welcome screen
              router.replace('/welcome');
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
          console.log('No authenticated user found');
          showToast('Please log in to view your profile', 'error');
          setLoading(false);
          return;
        }
        
        const userId = session.user.id;
        console.log('📋 Fetching profile for user:', userId);
        
        // Fetch user profile from Supabase
        const { data: profileData, error: profileError } = await getUserProfile(userId);
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          showToast('Failed to load profile data', 'error');
          setLoading(false);
          return;
        }
        
        if (profileData) {
          console.log('✅ Profile loaded successfully');
          console.log('📸 Photos:', profileData.photos);
          
          // Filter out placeholder photos
          if (profileData.photos && profileData.photos.length > 0) {
            const validPhotos = profileData.photos.filter((photo: string) => 
              photo && 
              !photo.includes('placeholder') && 
              (photo.startsWith('http') || photo.startsWith('https'))
            );
            
            if (validPhotos.length > 0) {
              console.log(`✅ Found ${validPhotos.length} valid photos`);
              profileData.photos = validPhotos;
            } else {
              console.log('⚠️  No valid photos found (all placeholders)');
              profileData.photos = [];
            }
          }
          
          setUserProfile(profileData);
        } else {
          console.log('⚠️  No profile data found for this user');
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.topHeader, Platform.OS === 'android' && { paddingTop: 10 }]}>
          <Text style={styles.headerButtonText}>Cancel</Text>
          <Text style={styles.headerName}>Profile</Text>
          <Text style={styles.headerButtonText}>Done</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.black} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
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
                    onChangeText={(text) => setEditingProfile({ ...editingProfile, first_name: text })}
                    placeholder="First name"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
                <View style={styles.editRow}>
                  <Text style={styles.infoLabel}>Last Name</Text>
                  <TextInput
                    style={styles.editInputValue}
                    value={editingProfile?.last_name || ''}
                    onChangeText={(text) => setEditingProfile({ ...editingProfile, last_name: text })}
                    placeholder="Last name"
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

        {/* Bio Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>About</Text>
          </View>
          {activeTab === 'edit' ? (
            <TextInput
              style={styles.bioInput}
              value={editingProfile?.bio || ''}
              onChangeText={(text) => setEditingProfile({ ...editingProfile, bio: text })}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.bioText}>{userProfile.bio || 'No bio yet'}</Text>
          )}
        </View>

      </ScrollView>

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
    borderRadius: 20,
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
    borderRadius: 20,
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
    borderRadius: 16,
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  tagText: {
    fontSize: 14,
    color: theme.black,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 16,
    color: theme.black,
    lineHeight: 24,
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
    borderRadius: 22,
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
    borderRadius: 20,
    backgroundColor: theme.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.gray,
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
    borderRadius: 20,
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
    borderRadius: 30,
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
  bioInput: {
    fontSize: 16,
    color: theme.black,
    lineHeight: 24,
    textAlign: 'left',
    borderWidth: 1,
    borderColor: theme.lightGray,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    maxHeight: 200,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 20,
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
    borderRadius: 20,
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
});
