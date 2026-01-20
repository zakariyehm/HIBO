import { AppHeader } from '@/components/app-header';
import { PostCard } from '@/components/post-card';
import { Colors } from '@/constants/theme';
import { getAllUserProfiles, getCurrentUser } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  location: string;
  bio: string;
  photos: string[];
  nationality?: string[];
  created_at: string;
}

export default function HomeScreen() {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const fetchUserProfiles = async () => {
    try {
      setLoading(true);
      
      // Get current user to exclude from list
      const { user } = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Fetch all user profiles (excluding current user)
      const { data, error } = await getAllUserProfiles(user?.id);

      if (error) {
        console.error('❌ Error fetching profiles:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Filter out profiles with no photos or bio
        const validProfiles = data.filter(
          (profile: any) => 
            profile.photos && 
            profile.photos.length > 0 && 
            profile.bio && 
            profile.bio.trim().length > 0
        );
        
        console.log(`✅ Loaded ${validProfiles.length} user profiles`);
        setUserProfiles(validProfiles as UserProfile[]);
      } else {
        console.log('⚠️  No user profiles found');
        setUserProfiles([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error in fetchUserProfiles:', error);
      setLoading(false);
    }
  };

  const handleShare = () => {
    console.log('Share pressed');
  };

  const handleComment = () => {
    console.log('Comment pressed');
  };

  const handleNotification = () => {
    console.log('Notification pressed');
  };

  const handleInvite = () => {
    console.log('Invite pressed');
  };

  const handleSearch = (text: string) => {
    console.log('Search:', text);
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
        onNotificationPress={handleNotification}
        onSharePress={handleShare}
        onInvitePress={handleInvite}
        onSearch={handleSearch}
        showNotificationDot={true}
        showShareDot={true}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      ) : userProfiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No profiles found</Text>
          <Text style={styles.emptySubtext}>Check back later for new users!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {userProfiles.map((profile) => {
            const fullName = `${profile.first_name} ${profile.last_name}`;
            const username = profile.first_name.toLowerCase() + profile.last_name.toLowerCase();
            const mainPhoto = profile.photos && profile.photos.length > 0 ? profile.photos[0] : undefined;
            
            return (
              <PostCard
                key={profile.id}
                profileName={fullName}
                location={profile.location}
                username={username}
                timeAgo={getTimeAgo(profile.created_at)}
                profileImage={mainPhoto}
                photos={profile.photos} // Pass all photos for swiper
                postText={profile.bio}
                nationality={profile.nationality} // Pass nationality
                commentCount={0}
                onShare={handleShare}
                onComment={handleComment}
              />
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
});
