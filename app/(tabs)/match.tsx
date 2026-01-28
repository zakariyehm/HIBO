import { Header } from '@/components/header';
import { ListItemSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/theme';
import { getUserMatches, isPremiumUser } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface MatchProfile {
  match: {
    id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
    has_messaged?: boolean;
    expiration_date?: string | null;
    is_expired?: boolean;
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

function dedupByMatchId(arr: MatchProfile[]): MatchProfile[] {
  const seen = new Set<string>();
  return arr.filter((m) => {
    const k = m.match.id;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

export default function MatchScreen() {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetchMatches(false);
    checkPremiumStatus();
  }, []);

  useFocusEffect(useCallback(() => { checkPremiumStatus(); }, []));

  const checkPremiumStatus = async () => {
    const premium = await isPremiumUser();
    setIsPremium(premium);
  };

  const fetchMatches = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const { data, error } = await getUserMatches();
      if (error) {
        console.error('❌ Error fetching matches:', error);
        return;
      }
      if (data) {
        const valid = (data as MatchProfile[]).filter((m) => m.profile !== null);
        const active = valid.filter((m) => !m.match.is_expired);
        const expired = valid.filter((m) => m.match.is_expired);
        setMatches(dedupByMatchId([...active, ...expired]));
      }
    } catch (e) {
      console.error('❌ Error in fetchMatches:', e);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => {
    fetchMatches(true);
  };

  const handleMatchPress = (matchProfile: MatchProfile) => {
    if (matchProfile.profile?.id) {
      router.push({
        pathname: '/view-profile',
        params: { userId: matchProfile.profile.id, matchId: matchProfile.match.id },
      });
    }
  };

  const handleChatPress = (matchProfile: MatchProfile, e: any) => {
    e?.stopPropagation?.();
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

  const activeMatches = matches.filter((m) => !m.match.is_expired);
  // Calculate matches waiting for reply (no messages sent)
  const matchesWaitingForReply = activeMatches.filter(m => !m.match.has_messaged);
  // Premium users get higher limit (15), free users get 7
  const LIMIT = isPremium ? 15 : 7;
  const waitingCount = matchesWaitingForReply.length;
  const progressPercentage = Math.min((waitingCount / LIMIT) * 100, 100);
  // Show modal when approaching limit (5 matches for free, 12 for premium)
  const threshold = isPremium ? 12 : 5;
  const shouldShowLimitModal = waitingCount >= threshold && waitingCount < LIMIT;

  // Show modal when component loads and condition is met
  useEffect(() => {
    if (shouldShowLimitModal && !loading) {
      setShowLimitModal(true);
    }
  }, [shouldShowLimitModal, loading]);

  return (
    <View style={styles.container}>
      <Header logoText="Matches" showIcons={false} />
      <FlatList
          data={loading ? [1, 2, 3] : matches}
          keyExtractor={loading ? (_, i) => `skel-${i}` : (item) => item.match.id}
          renderItem={({ item, index }) => {
            if (loading) return <ListItemSkeleton />;
            const matchProfile = item as MatchProfile;
            const { profile, match } = matchProfile;
            if (!profile) return null;
            const isExpired = !!match.is_expired;
            const mainPhoto = profile.photos?.length ? profile.photos[0] : null;
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            let statusMessage = getTimeAgo(match.created_at);
            if (isExpired) statusMessage = `Expired • ${statusMessage}`;
            else if (match.has_messaged) statusMessage = `Chatted • ${statusMessage}`;
            else statusMessage = `New match • ${statusMessage}`;
            return (
              <TouchableOpacity
                style={styles.matchItem}
                onPress={() => handleMatchPress(matchProfile)}
                activeOpacity={0.7}
              >
                <View style={styles.matchPhotoContainer}>
                  {mainPhoto ? (
                    <ExpoImage source={{ uri: mainPhoto }} style={[styles.matchPhoto, isExpired && styles.matchPhotoExpired]} contentFit="cover" />
                  ) : (
                    <View style={[styles.matchPhotoPlaceholder, isExpired && styles.matchPhotoExpired]}>
                      <Ionicons name="person" size={32} color={Colors.textLight} />
                    </View>
                  )}
                </View>
                <View style={styles.matchInfo}>
                  <Text style={[styles.matchName, isExpired && styles.matchTextMuted]} numberOfLines={1}>
                    {fullName || 'Someone'}
                  </Text>
                  <Text style={[styles.matchStatus, isExpired && styles.matchTextMuted]} numberOfLines={1}>
                    {statusMessage}
                  </Text>
                </View>
                {!isExpired && (
                  <TouchableOpacity
                    style={styles.matchChatIcon}
                    onPress={(e) => handleChatPress(matchProfile, e)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name={match.has_messaged ? 'chatbubble' : 'chatbubble-outline'} size={22} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="heart-outline" size={64} color={Colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No matches yet</Text>
                <Text style={styles.emptySubtitle}>Start liking profiles to get matches! 💕</Text>
              </View>
            ) : null
          }
          contentContainerStyle={[styles.contentContainer, ...(!loading && matches.length === 0 ? [styles.emptyListContent] : [])]}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      <Modal
        visible={showLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.limitModal}>
            <View style={styles.limitModalHeader}>
              <View style={styles.limitModalTitleRow}>
                <Text style={styles.limitModalTitle}>You're approaching the limit</Text>
                <View style={styles.limitModalInfoIcon}>
                  <Ionicons name="information-circle" size={20} color="#D5AFFD" />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowLimitModal(false)}
                style={styles.limitModalCloseButton}
              >
                <Ionicons name="close" size={20} color={Colors.textDark} />
              </TouchableOpacity>
            </View>
            <Text style={styles.limitModalText}>
              When too many people are waiting for a reply, you need to reply or end chats. Then you can send likes.
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercentage}%` }
                  ]}
                />
              </View>
            </View>
            {!isPremium && (
              <>
                <View style={styles.premiumDivider} />
                <View style={styles.premiumSection}>
                  <Ionicons name="star" size={24} color={Colors.primary} />
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumText}>
                    Get a higher limit ({LIMIT} → 15 matches) and never worry about limits again!
                  </Text>
                  <TouchableOpacity
                    style={styles.premiumButton}
                    onPress={() => {
                      setShowLimitModal(false);
                      router.push('/premium');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.premiumButtonText}>Upgrade Now</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    paddingTop: 8,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 80,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
  },
  matchPhotoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: Colors.borderLight,
  },
  matchPhoto: {
    width: '100%',
    height: '100%',
  },
  matchPhotoExpired: {
    opacity: 0.5,
  },
  matchPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
  },
  matchStatus: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '400',
  },
  matchTextMuted: {
    color: Colors.textLight,
    opacity: 0.7,
  },
  matchChatIcon: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  limitModal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  limitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  limitModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  limitModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  limitModalCloseButton: {
    padding: 4,
  },
  limitModalInfoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitModalText: {
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 22,
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E8D5FF', // Light purple
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D5AFFD', // Dark purple
    borderRadius: 4,
  },
  premiumDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 20,
  },
  premiumSection: {
    alignItems: 'center',
    gap: 8,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 4,
  },
  premiumText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  premiumButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumButtonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
});

