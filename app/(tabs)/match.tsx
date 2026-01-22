import { Colors } from '@/constants/theme';
import { getUserMatches } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

interface MatchProfile {
  match: {
    id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
  };
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    photos: string[];
    location?: string;
    age?: number;
  } | null;
}

export default function MatchScreen() {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await getUserMatches();

      if (error) {
        console.error('❌ Error fetching matches:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Filter out matches with null profiles
        const validMatches = data.filter((m: MatchProfile) => m.profile !== null);
        console.log(`✅ Loaded ${validMatches.length} matches`);
        setMatches(validMatches);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error in fetchMatches:', error);
      setLoading(false);
    }
  };

  const handleMatchPress = (matchProfile: MatchProfile) => {
    if (matchProfile.profile?.id) {
      router.push({
        pathname: '/view-profile',
        params: { userId: matchProfile.profile.id },
      });
    }
  };

  const handleChatPress = (matchProfile: MatchProfile, e: any) => {
    e.stopPropagation();
    if (matchProfile.profile?.id) {
      router.push({
        pathname: '/chat',
        params: {
          matchId: matchProfile.match.id,
          userId: matchProfile.profile.id,
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Matches</Text>
          {matches.length > 0 && (
            <Text style={styles.matchCount}>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</Text>
          )}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="heart-outline" size={64} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>
            Start liking profiles to get matches! 💕
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.matchesGrid}>
            {matches.map((matchProfile) => {
              if (!matchProfile.profile) return null;

              const { profile, match } = matchProfile;
              const fullName = `${profile.first_name} ${profile.last_name}`;
              const mainPhoto = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;
              
              // Calculate time ago
              const matchDate = new Date(match.created_at);
              const now = new Date();
              const diffInDays = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
              const timeAgo = diffInDays === 0 ? 'Today' : diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;

              return (
                <View key={match.id} style={styles.matchCardWrapper}>
                  <TouchableOpacity
                    style={styles.matchCard}
                    onPress={() => handleMatchPress(matchProfile)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchPhotoContainer}>
                      {mainPhoto ? (
                        <Image
                          source={{ uri: mainPhoto }}
                          style={styles.matchPhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.matchPhotoPlaceholder}>
                          <Ionicons name="person" size={40} color={Colors.textLight} />
                        </View>
                      )}
                      <View style={styles.newMatchBadge}>
                        <Text style={styles.newMatchText}>New Match</Text>
                      </View>
                    </View>
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName} numberOfLines={1}>
                        {fullName}
                      </Text>
                      {profile.age && (
                        <Text style={styles.matchAge}>{profile.age}</Text>
                      )}
                      {profile.location && (
                        <Text style={styles.matchLocation} numberOfLines={1}>
                          📍 {profile.location}
                        </Text>
                      )}
                      <Text style={styles.matchTime}>{timeAgo}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={(e) => handleChatPress(matchProfile, e)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble" size={20} color={Colors.primaryText} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
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
  safeArea: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  matchCount: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
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
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  matchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  matchCardWrapper: {
    width: CARD_WIDTH,
    position: 'relative',
    marginBottom: 12,
  },
  matchCard: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chatButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  matchPhotoContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    position: 'relative',
  },
  matchPhoto: {
    width: '100%',
    height: '100%',
  },
  matchPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newMatchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newMatchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchInfo: {
    padding: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
  },
  matchAge: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
    marginTop: 4,
  },
});

