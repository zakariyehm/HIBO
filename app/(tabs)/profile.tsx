/**
 * Profile Screen - HIBO Dating App
 * Display user profile information with dating app design
 */

import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
  firstName?: string;
  lastName?: string;
  name?: string;
  age?: string | number;
  height?: string | number;
  location?: string;
  gender?: string;
  interestedIn?: string;
  lookingFor?: string;
  profession?: string;
  educationLevel?: string;
  nationality?: string[];
  growUp?: string;
  smoke?: string;
  hasChildren?: string;
  personality?: string[];
  marriageKnow?: string;
  marriageWithin?: string;
  interests?: string[];
  bio?: string;
  photos?: string[];
  email?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'edit' | 'view'>('view');

  // Request image permissions
  const requestImagePermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to upload images.');
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
      Alert.alert('Error', 'Failed to pick image');
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
        const newPhotos = [...(editingProfile.photos || [])];
        if (index !== undefined && index < newPhotos.length) {
          newPhotos[index] = result.assets[0].uri;
        } else {
          newPhotos.push(result.assets[0].uri);
        }
        setEditingProfile({ ...editingProfile, photos: newPhotos });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const pickImageFromCamera = async (index?: number) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && editingProfile) {
        const newPhotos = [...(editingProfile.photos || [])];
        if (index !== undefined && index < newPhotos.length) {
          newPhotos[index] = result.assets[0].uri;
        } else {
          newPhotos.push(result.assets[0].uri);
        }
        setEditingProfile({ ...editingProfile, photos: newPhotos });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (editingProfile && editingProfile.photos) {
      const newPhotos = editingProfile.photos.filter((_, i) => i !== index);
      setEditingProfile({ ...editingProfile, photos: newPhotos });
    }
  };

  const handleSave = () => {
    // TODO: Save to Convex/backend
    setUserProfile(editingProfile);
    setActiveTab('view');
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditingProfile(userProfile);
    setActiveTab('view');
  };

  const handleTabChange = (tab: 'edit' | 'view') => {
    if (tab === 'edit') {
      setEditingProfile({ ...userProfile });
    }
    setActiveTab(tab);
  };

  // TODO: Replace with actual data fetching from Convex
  // const { userSession } = useAuth();
  // const userId = userSession?.userId as Id<"users"> | undefined;
  // const userData = useQuery(api.users.get, userId ? { userId } : "skip");

  useEffect(() => {
    // Simulate data loading - replace with actual Convex query
    setTimeout(() => {
      setUserProfile({
        firstName: 'John',
        lastName: 'Doe',
        age: 28,
        height: 175,
        location: 'New York, USA',
        gender: 'Male',
        interestedIn: 'Women',
        lookingFor: 'Serious relationship',
        profession: 'Software Engineer',
        educationLevel: 'Undergraduate degree',
        nationality: ['American'],
        growUp: 'Boston, USA',
        smoke: 'No',
        hasChildren: 'No',
        personality: ['Adventurous', 'Ambitious', 'Creative'],
        marriageKnow: '1-2 years',
        marriageWithin: '3-4 years',
        interests: ['Travel', 'Music', 'Fitness', 'Food'],
        bio: 'I love traveling and exploring new places. Looking for someone to share adventures with!',
        photos: [
          'https://via.placeholder.com/400',
          'https://via.placeholder.com/400',
          'https://via.placeholder.com/400',
        ],
        email: 'john.doe@example.com',
      });
      setLoading(false);
    }, 500);
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
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.headerButtonText}>Done</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ width: 60 }} />
            <Text style={styles.headerName}>
              {userProfile?.firstName || userProfile?.name || 'Profile'}
            </Text>
            <View style={{ width: 60 }} />
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
        {((activeTab === 'view' ? userProfile.photos : editingProfile?.photos) || []).length > 0 && (
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
                  <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
                  {activeTab === 'edit' && (
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
                  {(activeTab === 'view' ? userProfile.photos : editingProfile?.photos)!.length > 1 && (
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
        )}

        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            {activeTab === 'edit' && (
              <TouchableOpacity>
                <Text style={styles.editLabel}>edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.name}>
              {userProfile.firstName && userProfile.lastName
                ? `${userProfile.firstName} ${userProfile.lastName}`
                : userProfile.name || 'User'}
            </Text>
            {userProfile.age && (
              <Text style={styles.age}>{userProfile.age} years old</Text>
            )}
          </View>

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
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Preferences</Text>
            {activeTab === 'edit' && (
              <TouchableOpacity>
                <Text style={styles.editLabel}>edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {userProfile.interestedIn && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Interested in</Text>
              <Text style={styles.infoValue}>{userProfile.interestedIn}</Text>
            </View>
          )}
          {userProfile.lookingFor && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Looking for</Text>
              <Text style={styles.infoValue}>{userProfile.lookingFor}</Text>
            </View>
          )}
        </View>

        {/* Professional Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Professional</Text>
            {activeTab === 'edit' && (
              <TouchableOpacity>
                <Text style={styles.editLabel}>edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {userProfile.profession && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>💼 Profession</Text>
              <Text style={styles.infoValue}>{userProfile.profession}</Text>
            </View>
          )}
          {userProfile.educationLevel && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>🎓 Education</Text>
              <Text style={styles.infoValue}>{userProfile.educationLevel}</Text>
            </View>
          )}
        </View>

        {/* Personal Details Card */}
        {(userProfile.nationality || userProfile.growUp || userProfile.smoke || userProfile.hasChildren) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Details</Text>
              {activeTab === 'edit' && (
                <TouchableOpacity>
                  <Text style={styles.editLabel}>edit</Text>
                </TouchableOpacity>
              )}
            </View>
            {userProfile.nationality && userProfile.nationality.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>🌍 Nationality</Text>
                <Text style={styles.infoValue}>{userProfile.nationality.join(', ')}</Text>
              </View>
            )}
            {userProfile.growUp && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>🏠 Grew up in</Text>
                <Text style={styles.infoValue}>{userProfile.growUp}</Text>
              </View>
            )}
            {userProfile.smoke && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>🚭 Smoke</Text>
                <Text style={styles.infoValue}>{userProfile.smoke}</Text>
              </View>
            )}
            {userProfile.hasChildren && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>👶 Has children</Text>
                <Text style={styles.infoValue}>{userProfile.hasChildren}</Text>
              </View>
            )}
          </View>
        )}

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
        {(userProfile.marriageKnow || userProfile.marriageWithin) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Marriage Intentions</Text>
              {activeTab === 'edit' && (
                <TouchableOpacity>
                  <Text style={styles.editLabel}>edit</Text>
                </TouchableOpacity>
              )}
            </View>
            {userProfile.marriageKnow && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Know someone for</Text>
                <Text style={styles.infoValue}>{userProfile.marriageKnow}</Text>
              </View>
            )}
            {userProfile.marriageWithin && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Married within</Text>
                <Text style={styles.infoValue}>{userProfile.marriageWithin}</Text>
              </View>
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
        {userProfile.bio && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>About</Text>
              {activeTab === 'edit' && (
                <TouchableOpacity>
                  <Text style={styles.editLabel}>edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          </View>
        )}

      </ScrollView>
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
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.black,
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
  editInput: {
    fontSize: 16,
    color: theme.black,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
    paddingVertical: 8,
    marginBottom: 8,
    width: '100%',
  },
  editInputValue: {
    fontSize: 16,
    color: theme.black,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
    paddingBottom: 4,
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
});
