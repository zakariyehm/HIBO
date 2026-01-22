import { AppHeader } from '@/components/app-header';
import { PostCard } from '@/components/post-card';
import { Colors } from '@/constants/theme';
import { getAllUserProfiles, getCurrentUser, getUserProfile, supabase, updateLastActive } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const appState = useRef(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusRefreshRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchUserProfiles();
    updateCurrentUserActive();
    
    // Listen to app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Update last_active every 15 seconds when app is active
    startActiveStatusUpdates();
    
    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (statusRefreshRef.current) {
        clearInterval(statusRefreshRef.current);
      }
    };
  }, []);

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
      
      // Get current user to exclude from list and get their preferences
      const { user } = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        // Update current user's last_active when they open the app
        await updateLastActive(user.id);
      }

      // Get current user's profile to check their interest preference
      let currentUserInterest: string | null = null;
      if (user) {
        const { data: currentUserProfile } = await getUserProfile(user.id);
        if (currentUserProfile?.interested_in) {
          currentUserInterest = currentUserProfile.interested_in;
          // console.log(`👤 Current user interested in: ${currentUserInterest}`);
        }
      }

      // Fetch all user profiles (excluding current user)
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

        // Filter by gender preference (dating app logic)
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
        
        // console.log(`✅ Loaded ${validProfiles.length} user profiles`);
        
        // Sort profiles: Active users first, then by last_active, then by created_at
        const profiles = (validProfiles as UserProfile[]).sort((a, b) => {
          const aActive = a.last_active ? new Date(a.last_active).getTime() : 0;
          const bActive = b.last_active ? new Date(b.last_active).getTime() : 0;
          const now = Date.now();
          const oneMinute = 1 * 60 * 1000; // 1 minute for online status (like WhatsApp)
          
          const aIsOnline = aActive > (now - oneMinute);
          const bIsOnline = bActive > (now - oneMinute);
          
          // Online users first
          if (aIsOnline && !bIsOnline) return -1;
          if (!aIsOnline && bIsOnline) return 1;
          
          
          // Then by last_active (most recent first)
          if (aActive !== bActive) return bActive - aActive;
          
          // Finally by created_at
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setUserProfiles(profiles);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="For you"
        onActionPress={() => {
          // Handle action button press (e.g., create new post)
          // console.log('Action button pressed');
        }}
        actionIcon="add-outline"
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
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
                  onLike={(userId) => {
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
});
