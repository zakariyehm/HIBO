/**
 * View Profile Screen - Display another user's full profile
 */

import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { blockUser, getCurrentUser, getUserPosts, getUserProfile, isUserBlocked, Post, recordProfileView } from '@/lib/supabase';
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
  bio_title?: string;
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
  const [posts, setPosts] = useState<Post[]>([]);

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
      fetchPosts();
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

  const fetchPosts = async () => {
    if (!userId) return;

    try {
      const { data, error } = await getUserPosts(userId);

      if (error) {
        console.error('❌ Error fetching posts:', error);
        return;
      }

      if (data) {
        setPosts(data);
        console.log('✅ Posts loaded:', data.length);
        data.forEach((post: Post, index: number) => {
          console.log(`  Post ${index + 1}:`, {
            id: post.id,
            title: post.title,
            hasImage: !!post.image_url,
            hasDescription: !!post.description,
          });
        });
      }
    } catch (error) {
      console.error('❌ Exception fetching posts:', error);
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
        <View style={styles.placeholder} />
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
        <View style={styles.basicInfoCard}>
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

        {/* Bio - Hinge Style */}
        {(profile.bio || profile.bio_title) && (
          <View style={styles.bioSection}>
            {profile.bio_title && (
              <Text style={styles.bioTitle}>{profile.bio_title}</Text>
            )}
            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}
          </View>
        )}

        {/* Nationality */}
        {profile.nationality && profile.nationality.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nationality</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.nationality}>
                {profile.nationality.join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Professional Details */}
        {(profile.profession || profile.education_level) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Professional</Text>
            </View>
            <View style={styles.sectionContent}>
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
          </View>
        )}

        {/* Personal Details */}
        {(profile.gender || profile.interested_in || profile.looking_for) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal</Text>
            </View>
            <View style={styles.sectionContent}>
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
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Interests</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.interestsContainer}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Personality */}
        {profile.personality && profile.personality.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personality</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.interestsContainer}>
                {profile.personality.map((trait, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Posts Section */}
        {posts.length > 0 && (
          <View style={styles.postsSection}>
            <Text style={styles.postsSectionTitle}>Posts</Text>
            <View style={styles.postsList}>
              {posts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  {/* Title at top - small, gray */}
                  {post.title && (
                    <Text style={styles.postCardTitle}>{post.title}</Text>
                  )}
                  
                  {/* Image */}
                  {post.image_url && (
                    <View style={styles.postCardImageContainer}>
                      <Image
                        source={{ uri: post.image_url }}
                        style={styles.postCardImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  {/* Description */}
                  {post.description && (
                    <View style={styles.postCardDescriptionContainer}>
                      <Text style={styles.postCardDescription}>{post.description}</Text>
                    </View>
                  )}
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

// Color palette matching the design
const purple = '#D4C5F9'; // Light purple for section headers
const pink = '#FFB6C1'; // Light pink for accents
const darkPurple = '#8B6FBF'; // Dark purple text
const white = '#FFFFFF';
const lightGray = '#F5F5F5';

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
    backgroundColor: white,
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
    marginBottom: 24,
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
    color: white,
    fontSize: 12,
    fontWeight: '600',
  },
  // Basic info section with rounded card
  basicInfoCard: {
    backgroundColor: white,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: Colors.textLight,
  },
  age: {
    fontSize: 16,
    color: Colors.textLight,
  },
  // Section with purple header
  section: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  sectionHeader: {
    backgroundColor: purple,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: white,
    padding: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bioSection: {
    marginBottom: 20,
    marginHorizontal: 16,
    backgroundColor: white,
    padding: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
    minHeight: 120,
  },
  bioTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textLight,
    marginBottom: 12,
  },
  bio: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
    lineHeight: 32,
  },
  nationality: {
    fontSize: 16,
    color: darkPurple,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
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
    color: darkPurple,
    flex: 1,
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: lightGray,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
  },
  interestText: {
    fontSize: 14,
    color: darkPurple,
    fontWeight: '500',
  },
  postsSection: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 16,
  },
  postsList: {
    gap: 24,
  },
  postCard: {
    backgroundColor: white,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  postCardTitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  postCardImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: lightGray,
  },
  postCardImage: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCardDescriptionContainer: {
    padding: 16,
    backgroundColor: lightGray,
    minHeight: 100,
  },
  postCardDescription: {
    fontSize: 16,
    color: Colors.textDark,
    lineHeight: 24,
  },
});

