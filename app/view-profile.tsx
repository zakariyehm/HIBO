/**
 * View Profile Screen - Display another user's full profile
 */

import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { getUserProfile, blockUser, getCurrentUser, isUserBlocked, recordProfileView } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  bio?: string;
  created_at?: string;
}

export default function ViewProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'error' | 'success'>('info');
  const [isBlocked, setIsBlocked] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (userId) {
      checkIfCurrentUser();
      checkIfBlocked();
      fetchProfile();
      // Record that this profile was viewed (like Tinder - once viewed, don't show again)
      recordProfileView(userId);
    } else {
      showToast('User ID not provided', 'error');
      setLoading(false);
    }
  }, [userId]);

  const checkIfCurrentUser = async () => {
    const { user } = await getCurrentUser();
    if (user && user.id === userId) {
      setIsCurrentUser(true);
    }
  };

  const checkIfBlocked = async () => {
    if (!userId) return;
    const { data } = await isUserBlocked(userId);
    setIsBlocked(data || false);
  };

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await getUserProfile(userId);

      if (error) {
        console.error('❌ Error fetching profile:', error);
        showToast('Failed to load profile', 'error');
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
        console.log('✅ Profile loaded:', data.first_name, data.last_name);
      } else {
        showToast('Profile not found', 'error');
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Exception fetching profile:', error);
      showToast('An error occurred', 'error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Profile not found</Text>
        </View>
      </View>
    );
  }

  const handleBlockUser = () => {
    if (!userId) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profile?.first_name || 'this user'}? You will no longer see them in your feed or matches.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await blockUser(userId);
              if (error) {
                showToast('Failed to block user', 'error');
                return;
              }
              showToast('User blocked successfully', 'success');
              setIsBlocked(true);
              // Navigate back after a short delay
              setTimeout(() => {
                router.back();
              }, 1500);
            } catch (error) {
              showToast('An error occurred', 'error');
            }
          },
        },
      ]
    );
  };

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isCurrentUser && (
          <TouchableOpacity onPress={handleBlockUser} style={styles.blockButton}>
            <Ionicons name="ban-outline" size={20} color={Colors.red} />
          </TouchableOpacity>
        )}
        {isCurrentUser && <View style={styles.placeholder} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 32) + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photosScrollView}
            >
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>
                  1 / {photos.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.name}>{fullName || 'No name'}</Text>
          {profile.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={Colors.textLight} />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
          )}
          {profile.age && (
            <Text style={styles.age}>{profile.age} years old</Text>
          )}
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Nationality */}
        {profile.nationality && profile.nationality.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nationality</Text>
            <Text style={styles.nationality}>
              {profile.nationality.join(', ')}
            </Text>
          </View>
        )}

        {/* Professional Details */}
        {(profile.profession || profile.education_level) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional</Text>
            {profile.profession && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Profession:</Text>
                <Text style={styles.infoValue}>{profile.profession}</Text>
              </View>
            )}
            {profile.education_level && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Education:</Text>
                <Text style={styles.infoValue}>{profile.education_level}</Text>
              </View>
            )}
          </View>
        )}

        {/* Personal Details */}
        {(profile.gender || profile.interested_in || profile.looking_for) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal</Text>
            {profile.gender && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoValue}>{profile.gender}</Text>
              </View>
            )}
            {profile.interested_in && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Interested in:</Text>
                <Text style={styles.infoValue}>{profile.interested_in}</Text>
              </View>
            )}
            {profile.looking_for && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Looking for:</Text>
                <Text style={styles.infoValue}>{profile.looking_for}</Text>
              </View>
            )}
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Personality */}
        {profile.personality && profile.personality.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personality</Text>
            <View style={styles.interestsContainer}>
              {profile.personality.map((trait, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
  },
  placeholder: {
    width: 32,
  },
  blockButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textLight,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  photosSection: {
    marginBottom: 29,
    position: 'relative',
  },
  photosScrollView: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  photoCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 29,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 13,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 9,
  },
  location: {
    fontSize: 16,
    color: Colors.textLight,
  },
  age: {
    fontSize: 16,
    color: Colors.textLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 17,
  },
  bio: {
    fontSize: 16,
    color: Colors.textDark,
    lineHeight: 24,
  },
  nationality: {
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 13,
    gap: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
    minWidth: 120,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textDark,
    flex: 1,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestText: {
    fontSize: 14,
    color: Colors.textDark,
  },
});

