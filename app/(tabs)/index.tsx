import { AppHeader } from '@/components/app-header';
import { PostCard } from '@/components/post-card';
import { PostCardSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/theme';
import { canLikeUser, getAllUserProfiles, getCurrentUser, getDailyLikeCount, getUserProfile, getUserPrompts, isPremiumUser, supabase, updateLastActive } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, AppStateStatus, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  location: string;
  bio?: string;
  bio_title?: string;
  photos: string[];
  nationality?: string[];
  gender?: string;
  interested_in?: string;
  created_at: string;
  last_active?: string | null;
}

export default function HomeScreen() {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]); // Store all unfiltered profiles
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [ageRange, setAgeRange] = useState({ min: 18, max: 100 });
  const [filters, setFilters] = useState({
    education: [] as string[],
    height: { min: 100, max: 250 },
    interests: [] as string[],
    personality: [] as string[],
    status: 'all' as 'all' | 'online' | 'offline', // Device status filter
  });
  const [filtersApplied, setFiltersApplied] = useState(false); // Track if filters are applied
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [matchLimitInfo, setMatchLimitInfo] = useState<{ waitingCount: number; limit: number } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [likeCount, setLikeCount] = useState({ remaining: Infinity, limit: Infinity });
  const [showLikeLimitModal, setShowLikeLimitModal] = useState(false);
  const [likeLimitInfo, setLikeLimitInfo] = useState<{ remaining: number; limit: number } | null>(null);

  const appState = useRef(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Function to apply filters to profiles
  const applyFilters = useCallback((profilesToFilter: UserProfile[]) => {
    let filtered = [...profilesToFilter];

    // Filter by age range
    filtered = filtered.filter((profile: any) => {
      const profileAge = profile.age || 0;
      return profileAge >= ageRange.min && profileAge <= ageRange.max;
    });

    // Filter by advanced filters
    if (filters.education.length > 0) {
      filtered = filtered.filter((profile: any) => 
        filters.education.includes(profile.education_level)
      );
    }
    
    if (filters.height.min > 100 || filters.height.max < 250) {
      filtered = filtered.filter((profile: any) => {
        const profileHeight = profile.height || 0;
        return profileHeight >= filters.height.min && profileHeight <= filters.height.max;
      });
    }
    
    if (filters.interests.length > 0) {
      filtered = filtered.filter((profile: any) => {
        if (!profile.interests || !Array.isArray(profile.interests)) return false;
        return filters.interests.some(interest => profile.interests.includes(interest));
      });
    }
    
    if (filters.personality.length > 0) {
      filtered = filtered.filter((profile: any) => {
        if (!profile.personality || !Array.isArray(profile.personality)) return false;
        return filters.personality.some(trait => profile.personality.includes(trait));
      });
    }

    // Filter by device status (online/offline)
    if (filters.status !== 'all') {
      filtered = filtered.filter((profile: any) => {
        if (!profile.last_active) return filters.status === 'offline';
        
        const lastActiveTime = new Date(profile.last_active).getTime();
        const now = Date.now();
        const oneMinute = 1 * 60 * 1000; // 1 minute for online status
        const isOnline = lastActiveTime > (now - oneMinute);
        
        if (filters.status === 'online') {
          return isOnline;
        } else {
          return !isOnline;
        }
      });
    }

    setUserProfiles(filtered);
  }, [ageRange, filters]);

  useEffect(() => {
    fetchUserProfiles();
    updateCurrentUserActive();
    updateLikeCount();
    
    // Listen to app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Update last_active every 15 seconds when app is active
    startActiveStatusUpdates();
    
    // Update like count every minute
    const likeCountInterval = setInterval(() => {
      updateLikeCount();
    }, 60000); // Every minute
    
    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (statusRefreshRef.current) {
        clearInterval(statusRefreshRef.current);
      }
      clearInterval(likeCountInterval);
    };
  }, []);

  const updateLikeCount = async () => {
    const likeInfo = await canLikeUser();
    setLikeCount({ remaining: likeInfo.remaining, limit: likeInfo.limit });
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      // console.log('📱 App came to foreground - updating active status');
      updateCurrentUserActive();
      startActiveStatusUpdates();
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background
      // console.log('📱 App went to background - stopping active status updates');
      stopActiveStatusUpdates();
    }
    
    appState.current = nextAppState;
  };

  const startActiveStatusUpdates = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Update every 15 seconds when app is active (like WhatsApp)
    intervalRef.current = setInterval(() => {
      updateCurrentUserActive();
    }, 15000); // 15 seconds
  };

  const stopActiveStatusUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Real-time subscription for profile updates (last_active changes) - Professional like WhatsApp
  useEffect(() => {
    if (userProfiles.length === 0) return;

    // console.log('🔔 Setting up real-time subscription for profile status updates');

    // Subscribe to profile updates (especially last_active changes)
    const channel = supabase
      .channel('profiles-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          // Update the specific profile's last_active in the list
          if (payload.new && payload.old) {
            const updatedProfile = payload.new as any;
            const profileId = updatedProfile.id;

            // Only update if last_active changed
            if (updatedProfile.last_active !== payload.old.last_active) {
              setUserProfiles((prev) =>
                prev.map((profile) =>
                  profile.id === profileId
                    ? { ...profile, last_active: updatedProfile.last_active }
                    : profile
                )
              );
            }
          }
        }
      )
      .subscribe((status) => {
        // console.log('📡 Profile status subscription status:', status);
      });

    // Periodic status refresh - Update status display every 10 seconds (like WhatsApp)
    // This ensures "Online" status updates accurately when users go offline
    statusRefreshRef.current = setInterval(() => {
      // Trigger re-render by updating state (status is calculated client-side)
      setUserProfiles((prev) => [...prev]);
    }, 10000); // 10 seconds

    // Cleanup subscription on unmount
    return () => {
      // console.log('🔕 Unsubscribing from profile status updates');
      supabase.removeChannel(channel);
      if (statusRefreshRef.current) {
        clearInterval(statusRefreshRef.current);
      }
    };
  }, [userProfiles.length]);

  // Refresh feed when screen comes into focus (e.g., after viewing a profile)
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfiles();
      updateCurrentUserActive(); // Update when screen comes into focus
    }, [])
  );

  // Update current user's active status
  const updateCurrentUserActive = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      await updateLastActive(user.id);
    }
  };

  const fetchUserProfiles = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      
      // Get current user and profile in parallel for faster loading
      const [userResult, premiumResult] = await Promise.all([
        getCurrentUser(),
        isPremiumUser(),
      ]);
      
      const { user } = userResult;
      setIsPremium(premiumResult);
      
      if (user) {
        setCurrentUserId(user.id);
        // Update current user's last_active in background (non-blocking)
        updateLastActive(user.id).catch(() => {});
      }

      // Get current user's profile to check their interest preference
      let currentUserInterest: string | null = null;
      if (user) {
        const { data: currentUserProfile } = await getUserProfile(user.id);
        if (currentUserProfile?.interested_in) {
          currentUserInterest = currentUserProfile.interested_in;
        }
      }

      // Fetch all user profiles (excluding current user) - OPTIMIZED
      const { data, error } = await getAllUserProfiles(user?.id);

      if (error) {
        console.error('❌ Error fetching profiles:', error);
        if (!isRefresh) {
          setLoading(false);
        }
        return;
      }

      if (data && data.length > 0) {
        // Filter out profiles with no photos or bio
        let validProfiles = data.filter(
          (profile: any) => 
            profile.photos && 
            profile.photos.length > 0 && 
            profile.bio && 
            profile.bio.trim().length > 0
        );

        // Filter by gender preference (dating app logic) - Always apply this
        if (currentUserInterest) {
          validProfiles = validProfiles.filter((profile: any) => {
            // If user is interested in "Women", only show Female profiles
            if (currentUserInterest === 'Women') {
              return profile.gender === 'Female';
            }
            // If user is interested in "Men", only show Male profiles
            if (currentUserInterest === 'Men') {
              return profile.gender === 'Male';
            }
            // Default: don't show profiles if preference not recognized
            return false;
          });
          // console.log(`🎯 Filtered by interest "${currentUserInterest}": ${validProfiles.length} profiles`);
        }
        
        // Smart Algorithm: Sort profiles by compatibility and activity (Tinder-style)
        const profiles = (validProfiles as UserProfile[]).sort((a, b) => {
          const aActive = a.last_active ? new Date(a.last_active).getTime() : 0;
          const bActive = b.last_active ? new Date(b.last_active).getTime() : 0;
          const now = Date.now();
          const oneMinute = 1 * 60 * 1000; // 1 minute for online status
          const oneDay = 24 * 60 * 60 * 1000; // 24 hours for active status
          
          const aIsOnline = aActive > (now - oneMinute);
          const bIsOnline = bActive > (now - oneMinute);
          const aIsActive = aActive > (now - oneDay);
          const bIsActive = bActive > (now - oneDay);
          
          // Priority 1: Online users first (HIGHEST PRIORITY)
          if (aIsOnline && !bIsOnline) return -1;
          if (!aIsOnline && bIsOnline) return 1;
          
          // Priority 2: Active users (within 24 hours)
          if (aIsActive && !bIsActive) return -1;
          if (!aIsActive && bIsActive) return 1;
          
          // Priority 3: Most recently active (within same category)
          if (aActive !== bActive) return bActive - aActive;
          
          // Priority 4: Newest profiles (recently joined)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // Store all unfiltered profiles
        setAllProfiles(profiles);
        
        // Apply filters only if filters are applied
        if (filtersApplied) {
          applyFilters(profiles);
        } else {
          setUserProfiles(profiles);
        }
      } else {
        // console.log('⚠️  No user profiles found');
        setUserProfiles([]);
      }
      
      if (!isRefresh) {
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error in fetchUserProfiles:', error);
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserProfiles(true);
    setRefreshing(false);
  }, []);

  const handleShare = () => {
    // console.log('Share pressed');
  };

  const handleComment = () => {
    // console.log('Comment pressed');
  };

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  // Get time until midnight (for like limit reset)
  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const diffMs = midnight.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="For you"
        onActionPress={() => {
          // Open filter modal
          setShowFilterModal(true);
        }}
        actionIcon="sparkles"
      />
      
      {loading ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton loaders matching post card style */}
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              {i > 1 && <View style={styles.divider} />}
              <PostCardSkeleton />
            </React.Fragment>
          ))}
        </ScrollView>
      ) : userProfiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No profiles found</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new users!
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.background}
            />
          }
        >
          {userProfiles.map((profile, index) => {
            const fullName = profile.first_name;
            const username = profile.first_name.toLowerCase();
            const mainPhoto = profile.photos && profile.photos.length > 0 ? profile.photos[0] : undefined;
            
            return (
              <React.Fragment key={profile.id}>
                {index > 0 && <View style={styles.divider} />}
                <PostCard
                  profileName={fullName}
                  location={profile.location}
                  username={username}
                  timeAgo={getTimeAgo(profile.created_at)}
                  lastActive={profile.last_active}
                  profileImage={mainPhoto}
                  photos={profile.photos} // Pass all photos for swiper
                  bio_title={profile.bio_title}
                  bio={profile.bio}
                  postText={profile.bio} // Legacy support
                  nationality={profile.nationality} // Pass nationality
                  userId={profile.id} // Pass userId for profile navigation
                  commentCount={0}
                  onShare={handleShare}
                  onComment={handleComment}
                  onLike={async (userId) => {
                    // Check daily like limit first
                    const canLike = await canLikeUser();
                    if (!canLike.canLike) {
                      // Show daily like limit modal (upgrade popup)
                      setLikeLimitInfo({
                        remaining: canLike.remaining,
                        limit: canLike.limit,
                      });
                      setShowLikeLimitModal(true);
                      return; // Don't remove from list, don't like
                    }
                    
                    // Check match limit before allowing like
                    const { checkMatchLimit, likeUser } = await import('@/lib/supabase');
                    const limitCheck = await checkMatchLimit();
                    
                    if (limitCheck.reached) {
                      // Show blocking modal
                      setMatchLimitInfo({
                        waitingCount: limitCheck.waitingCount,
                        limit: limitCheck.limit,
                      });
                      setShowLimitModal(true);
                      return; // Don't remove from list, don't like
                    }
                    
                    // Perform the like operation
                    const likeResult = await likeUser(userId);
                    
                    // If there's an error, show appropriate modal
                    if (likeResult.error) {
                      if (likeResult.error.message === 'DAILY_LIKE_LIMIT_REACHED') {
                        setLikeLimitInfo({
                          remaining: likeResult.error.remaining || 0,
                          limit: likeResult.error.limit || 1,
                        });
                        setShowLikeLimitModal(true);
                        return;
                      }
                      if (likeResult.error.message === 'MATCH_LIMIT_REACHED') {
                        setMatchLimitInfo({
                          waitingCount: limitCheck.waitingCount,
                          limit: limitCheck.limit,
                        });
                        setShowLimitModal(true);
                        return;
                      }
                      return; // Don't remove card on error
                    }
                    
                    // Update like count after successful like
                    updateLikeCount();
                    
                    // Remove liked user from the list
                    setUserProfiles(prev => prev.filter(p => p.id !== userId));
                  }}
                  onPass={(userId) => {
                    // Remove passed user from the list
                    setUserProfiles(prev => prev.filter(p => p.id !== userId));
                  }}
                  onBlock={(userId) => {
                    // Remove blocked user from the list
                    setUserProfiles(prev => prev.filter(p => p.id !== userId));
                  }}
                />
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Discovery Settings</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Age Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Age Range</Text>
                <View style={styles.ageRangeContainer}>
                  <View style={styles.ageInputContainer}>
                    <Text style={styles.ageLabel}>Min</Text>
                    <View style={styles.ageInput}>
                      <Text style={styles.ageValue}>{ageRange.min}</Text>
                    </View>
                    <View style={styles.ageButtons}>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setAgeRange({ ...ageRange, min: Math.max(18, ageRange.min - 1) })}
                      >
                        <Ionicons name="remove" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setAgeRange({ ...ageRange, min: Math.min(ageRange.max - 1, ageRange.min + 1) })}
                      >
                        <Ionicons name="add" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.ageInputContainer}>
                    <Text style={styles.ageLabel}>Max</Text>
                    <View style={styles.ageInput}>
                      <Text style={styles.ageValue}>{ageRange.max}</Text>
                    </View>
                    <View style={styles.ageButtons}>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setAgeRange({ ...ageRange, max: Math.max(ageRange.min + 1, ageRange.max - 1) })}
                      >
                        <Ionicons name="remove" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setAgeRange({ ...ageRange, max: Math.min(100, ageRange.max + 1) })}
                      >
                        <Ionicons name="add" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Height Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Height (cm)</Text>
                <View style={styles.ageRangeContainer}>
                  <View style={styles.ageInputContainer}>
                    <Text style={styles.ageLabel}>Min</Text>
                    <View style={styles.ageInput}>
                      <Text style={styles.ageValue}>{filters.height.min}</Text>
                    </View>
                    <View style={styles.ageButtons}>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setFilters({ ...filters, height: { ...filters.height, min: Math.max(100, filters.height.min - 5) } })}
                      >
                        <Ionicons name="remove" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setFilters({ ...filters, height: { ...filters.height, min: Math.min(filters.height.max - 5, filters.height.min + 5) } })}
                      >
                        <Ionicons name="add" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.ageInputContainer}>
                    <Text style={styles.ageLabel}>Max</Text>
                    <View style={styles.ageInput}>
                      <Text style={styles.ageValue}>{filters.height.max}</Text>
                    </View>
                    <View style={styles.ageButtons}>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setFilters({ ...filters, height: { ...filters.height, max: Math.max(filters.height.min + 5, filters.height.max - 5) } })}
                      >
                        <Ionicons name="remove" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ageButton}
                        onPress={() => setFilters({ ...filters, height: { ...filters.height, max: Math.min(250, filters.height.max + 5) } })}
                      >
                        <Ionicons name="add" size={16} color={Colors.textDark} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Education Level */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Education Level</Text>
                <View style={styles.chipContainer}>
                  {['High school', 'Non-degree qualification', 'Undergraduate degree', 'Postgraduate degree', 'Doctorate', 'Other education level'].map((edu) => (
                    <TouchableOpacity
                      key={edu}
                      style={[
                        styles.chip,
                        filters.education.includes(edu) && styles.chipSelected,
                      ]}
                      onPress={() => {
                        if (filters.education.includes(edu)) {
                          setFilters({ ...filters, education: filters.education.filter(e => e !== edu) });
                        } else {
                          setFilters({ ...filters, education: [...filters.education, edu] });
                        }
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.education.includes(edu) && styles.chipTextSelected,
                      ]}>
                        {edu}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Interests */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Interests</Text>
                <Text style={styles.filterSubtext}>Select interests to match with</Text>
                <View style={styles.chipContainer}>
                  {['Travel', 'Music', 'Sports', 'Food', 'Art', 'Movies', 'Reading', 'Fitness', 'Photography', 'Dancing', 'Cooking', 'Gaming'].map((interest) => (
                    <TouchableOpacity
                      key={interest}
                      style={[
                        styles.chip,
                        filters.interests.includes(interest) && styles.chipSelected,
                      ]}
                      onPress={() => {
                        if (filters.interests.includes(interest)) {
                          setFilters({ ...filters, interests: filters.interests.filter(i => i !== interest) });
                        } else {
                          setFilters({ ...filters, interests: [...filters.interests, interest] });
                        }
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.interests.includes(interest) && styles.chipTextSelected,
                      ]}>
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Device Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Device Status</Text>
                <View style={styles.chipContainer}>
                  {['all', 'online', 'offline'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.chip,
                        filters.status === status && styles.chipSelected,
                      ]}
                      onPress={() => {
                        setFilters({ ...filters, status: status as 'all' | 'online' | 'offline' });
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.status === status && styles.chipTextSelected,
                      ]}>
                        {status === 'all' ? 'All' : status === 'online' ? 'Online Only' : 'Offline Only'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Personality Traits */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Personality Traits</Text>
                <View style={styles.chipContainer}>
                  {['Adventurous', 'Creative', 'Funny', 'Intelligent', 'Kind', 'Confident', 'Ambitious', 'Romantic', 'Outgoing', 'Thoughtful'].map((trait) => (
                    <TouchableOpacity
                      key={trait}
                      style={[
                        styles.chip,
                        filters.personality.includes(trait) && styles.chipSelected,
                      ]}
                      onPress={() => {
                        if (filters.personality.includes(trait)) {
                          setFilters({ ...filters, personality: filters.personality.filter(p => p !== trait) });
                        } else {
                          setFilters({ ...filters, personality: [...filters.personality, trait] });
                        }
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.personality.includes(trait) && styles.chipTextSelected,
                      ]}>
                        {trait}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setAgeRange({ min: 18, max: 100 });
                  setFilters({
                    education: [],
                    height: { min: 100, max: 250 },
                    interests: [],
                    personality: [],
                    status: 'all',
                  });
                  setFiltersApplied(false);
                  setUserProfiles(allProfiles.length > 0 ? allProfiles : userProfiles);
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setFiltersApplied(true);
                  applyFilters(allProfiles.length > 0 ? allProfiles : userProfiles);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Daily Like Limit Modal */}
      <Modal
        visible={showLikeLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLikeLimitModal(false)}
      >
        <View style={styles.limitModalOverlay}>
          <View style={styles.limitModalContent}>
            <View style={styles.limitModalHeader}>
              <Ionicons name="heart-outline" size={32} color={Colors.primary} />
              <Text style={styles.limitModalTitle}>Daily Like Limit Reached</Text>
            </View>
            
            {likeLimitInfo && (
              <>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: '100%', backgroundColor: Colors.primary }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {likeLimitInfo.limit} / {likeLimitInfo.limit} likes used today
                  </Text>
                </View>
                
                <Text style={styles.limitModalText}>
                  You've used all {likeLimitInfo.limit} of your daily likes. 
                  Upgrade to Premium for unlimited likes!
                </Text>
                
                <View style={styles.resetTimerContainer}>
                  <Ionicons name="time-outline" size={20} color={Colors.textLight} />
                  <Text style={styles.resetTimerText}>
                    Resets in {getTimeUntilMidnight()}
                  </Text>
                </View>
              </>
            )}
            
            <View style={styles.limitModalActions}>
              <TouchableOpacity
                style={[styles.limitModalButton, styles.premiumButton]}
                onPress={() => {
                  setShowLikeLimitModal(false);
                  router.push('/premium');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="star" size={20} color={Colors.cardBackground} />
                <Text style={styles.limitModalButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.limitModalClose}
              onPress={() => setShowLikeLimitModal(false)}
            >
              <Text style={styles.limitModalCloseText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Match Limit Blocking Modal (Tinder/Hinge style) */}
      <Modal
        visible={showLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View style={styles.limitModalOverlay}>
          <View style={styles.limitModalContent}>
            <View style={styles.limitModalHeader}>
              <Ionicons name="lock-closed" size={32} color={Colors.primary} />
              <Text style={styles.limitModalTitle}>You've reached your limit</Text>
            </View>
            
            <Text style={styles.limitModalText}>
              You have {matchLimitInfo?.waitingCount || 0} people waiting for a reply. Reply to your matches or end chats before you can send more likes.
            </Text>

            <View style={styles.limitModalActions}>
              <TouchableOpacity
                style={styles.limitModalButton}
                onPress={() => {
                  setShowLimitModal(false);
                  router.push('/(tabs)/match');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubbles" size={20} color={Colors.cardBackground} />
                <Text style={styles.limitModalButtonText}>Go to Matches</Text>
              </TouchableOpacity>
              
              {!isPremium && (
                <TouchableOpacity
                  style={[styles.limitModalButton, styles.premiumButton]}
                  onPress={() => {
                    setShowLimitModal(false);
                    router.push('/premium');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="star" size={20} color={Colors.cardBackground} />
                  <Text style={styles.limitModalButtonText}>Upgrade to Premium</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.limitModalClose}
              onPress={() => setShowLimitModal(false)}
            >
              <Text style={styles.limitModalCloseText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 16,
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
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 16,
    marginHorizontal: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 500,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
  },
  filterSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  ageRangeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  ageInputContainer: {
    flex: 1,
  },
  ageLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  ageInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ageValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textDark,
  },
  ageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ageButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  limitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  limitModalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  limitModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  limitModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 12,
    textAlign: 'center',
  },
  limitModalText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  limitModalActions: {
    gap: 12,
    marginBottom: 16,
  },
  limitModalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  premiumButton: {
    backgroundColor: '#D5AFFD',
  },
  limitModalButtonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  limitModalClose: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  limitModalCloseText: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '500',
  },
  likeCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  likeCounterText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginVertical: 20,
    width: '100%',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  resetTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
  },
  resetTimerText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
