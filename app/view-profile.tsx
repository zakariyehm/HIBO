/**
 * View Profile Screen - Display another user's full profile
 */

import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { blockUser, getCurrentUser, getUserPosts, getUserProfile, getUserPrompts, isUserBlocked, Post, recordProfileView } from '@/lib/supabase';
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
  const [prompts, setPrompts] = useState<Array<{ question: string; answer: string }>>([]);

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
        // console.log('✅ Profile loaded:', data.first_name, data.last_name);
        
        // Fetch prompts
        const { data: promptsData } = await getUserPrompts(userId);
        if (promptsData) {
          setPrompts(promptsData.map((p: any) => ({ question: p.question, answer: p.answer })));
        }
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
        // console.log('✅ Posts loaded:', data.length);
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEmoji}>🕵️</Text>
            <Text style={styles.headerTitle}>Background Check</Text>
          </View>
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEmoji}>🕵️</Text>
            <Text style={styles.headerTitle}>Background Check</Text>
          </View>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerEmoji}>🕵️</Text>
          <Text style={styles.headerTitle}>Background Check</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 32) + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Box - Purple Highlighted */}
        <View style={styles.nameBox}>
          <Text style={styles.nameText}>{fullName || 'UNKNOWN'}</Text>
        </View>

        {/* Photo Section */}
        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <Image
              source={{ uri: photos[0] }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Background Check Sections */}
        
        {/* Personal Information */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleCard}>
            <View style={styles.sectionTitleHeader}>
              <Text style={styles.sectionTitleText}>PERSONAL INFORMATION</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            {profile.age && (
              <Text style={styles.sectionText}>Age: {profile.age} years</Text>
            )}
            {profile.location && (
              <Text style={styles.sectionText}>Location: {profile.location}</Text>
            )}
            {profile.gender && (
              <Text style={styles.sectionText}>Gender: {profile.gender}</Text>
            )}
            {profile.nationality && profile.nationality.length > 0 && (
              <Text style={styles.sectionText}>Nationality: {profile.nationality.join(', ')}</Text>
            )}
          </View>
        </View>

        {/* Professional Background */}
        {(profile.profession || profile.education_level) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleCard}>
              <View style={styles.sectionTitleHeader}>
                <Text style={styles.sectionTitleText}>PROFESSIONAL BACKGROUND</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {profile.profession && (
                <Text style={styles.sectionText}>{profile.profession}</Text>
              )}
              {profile.education_level && (
                <Text style={styles.sectionText}>Education: {profile.education_level}</Text>
              )}
            </View>
          </View>
        )}

        {/* Bio/Description */}
        {(profile.bio || profile.bio_title) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleCard}>
              <View style={styles.sectionTitleHeader}>
                <Text style={styles.sectionTitleText}>DESCRIPTION</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {profile.bio_title && (
                <Text style={styles.sectionText}>{profile.bio_title}</Text>
              )}
              {profile.bio && (
                <Text style={styles.sectionText}>{profile.bio}</Text>
              )}
            </View>
          </View>
        )}

        {/* Relationship Status */}
        {(profile.looking_for || profile.interested_in || profile.marriage_know_time || profile.marriage_married_time) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleCard}>
              <View style={styles.sectionTitleHeader}>
                <Text style={styles.sectionTitleText}>RELATIONSHIP STATUS</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {profile.looking_for && (
                <Text style={styles.sectionText}>Looking for: {profile.looking_for}</Text>
              )}
              {profile.interested_in && (
                <Text style={styles.sectionText}>Interested in: {profile.interested_in}</Text>
              )}
              {profile.marriage_know_time && (
                <Text style={styles.sectionText}>Know time: {profile.marriage_know_time}</Text>
              )}
              {profile.marriage_married_time && (
                <Text style={styles.sectionText}>Married time: {profile.marriage_married_time}</Text>
              )}
            </View>
          </View>
        )}

        {/* Lifestyle */}
        {(profile.smoke || profile.has_children || profile.grow_up) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleCard}>
              <View style={styles.sectionTitleHeader}>
                <Text style={styles.sectionTitleText}>LIFESTYLE</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {profile.smoke && (
                <Text style={styles.sectionText}>Smoking: {profile.smoke}</Text>
              )}
              {profile.has_children && (
                <Text style={styles.sectionText}>Children: {profile.has_children}</Text>
              )}
              {profile.grow_up && (
                <Text style={styles.sectionText}>Grew up: {profile.grow_up}</Text>
              )}
            </View>
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleCard}>
              <View style={styles.sectionTitleHeader}>
                <Text style={styles.sectionTitleText}>INTERESTS</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionText}>{profile.interests.join(', ')}</Text>
            </View>
          </View>
        )}

        {/* Personality Traits */}
        {profile.personality && profile.personality.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleCard}>
              <View style={styles.sectionTitleHeader}>
                <Text style={styles.sectionTitleText}>PERSONALITY TRAITS</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionText}>{profile.personality.join(', ')}</Text>
            </View>
          </View>
        )}

        {/* Prompts Section */}
        {prompts.length > 0 && (
          <View style={styles.promptsSection}>
            {/* Title Card with Purple Header */}
            <View style={styles.promptsTitleCard}>
              <View style={styles.promptsTitleHeader}>
                <Text style={styles.promptsTitleText}>PROMPTS</Text>
              </View>
            </View>
            {/* Prompt Cards without borders */}
            <View style={styles.promptsList}>
              {prompts.map((prompt, index) => (
                <View key={index} style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                </View>
              ))}
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

// Color palette matching the background check design
const purple = '#D5AFFD'; // Purple for section headers
const white = '#FFFFFF';
const lightGray = '#F5F5F5';
const black = '#000000';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E6FF', // Light purple background
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: 0.5,
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
  // Name box - purple highlighted
  nameBox: {
    backgroundColor: purple,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: black,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: black,
    textAlign: 'center',
    letterSpacing: 1,
  },
  photosSection: {
    marginBottom: 24,
    marginHorizontal: 16,
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH - 32,
    height: 500,
    borderWidth: 2,
    borderColor: black,
  },
  // Section with purple header and white content
  sectionContainer: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  sectionTitleCard: {
    backgroundColor: white,
    borderWidth: 1,
    borderColor: black,
    marginBottom: 12,
  },
  sectionTitleHeader: {
    backgroundColor: purple,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: white,
    padding: 16,
    marginBottom: 0,
  },
  sectionText: {
    fontSize: 16,
    color: black,
    marginBottom: 8,
    lineHeight: 22,
  },
  promptsSection: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  promptsTitleCard: {
    backgroundColor: white,
    borderWidth: 1,
    borderColor: black,
    marginBottom: 12,
  },
  promptsTitleHeader: {
    backgroundColor: purple,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  promptsTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptsList: {
    gap: 12,
  },
  promptCard: {
    padding: 16,
    backgroundColor: white,
    marginBottom: 12,
  },
  promptQuestion: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '400',
    marginBottom: 12,
  },
  promptAnswer: {
    fontSize: 24,
    color: black,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
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

