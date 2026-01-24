import { Colors } from '@/constants/theme';
import { MatchSkeleton } from '@/components/SkeletonLoader';
import { Header } from '@/components/header';
import { getUserMatches, isPremiumUser } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

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

export default function MatchScreen() {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetchMatches();
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    const premium = await isPremiumUser();
    setIsPremium(premium);
  };

  const fetchMatches = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
      setLoading(true);
      }
      
      const { data, error } = await getUserMatches();

      if (error) {
        console.error('❌ Error fetching matches:', error);
        if (isRefresh) {
          setRefreshing(false);
        } else {
        setLoading(false);
        }
        return;
      }

      if (data) {
        // Filter out matches with null profiles
        const validMatches = data.filter((m: MatchProfile) => m.profile !== null);
        // Separate active and expired matches
        const activeMatches = validMatches.filter((m: MatchProfile) => !m.match.is_expired);
        const expiredMatches = validMatches.filter((m: MatchProfile) => m.match.is_expired);
        // Show active matches first, then expired
        setMatches([...activeMatches, ...expiredMatches]);
      }

      if (isRefresh) {
        setRefreshing(false);
      } else {
      setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error in fetchMatches:', error);
      if (isRefresh) {
        setRefreshing(false);
      } else {
      setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchMatches(true);
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

  const activeMatches = matches.filter(m => !m.match.is_expired);
  const expiredMatches = matches.filter(m => m.match.is_expired);
  
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Active Matches Section */}
          {activeMatches.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>New Matches</Text>
              <View style={styles.matchesGrid}>
                {activeMatches.map((matchProfile) => {
                  if (!matchProfile.profile) return null;
                  return <MatchCard key={matchProfile.match.id} matchProfile={matchProfile} onPress={handleMatchPress} onChatPress={handleChatPress} />;
                })}
              </View>
            </>
          )}

          {/* Expired Matches Section */}
          {expiredMatches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.expiredSectionTitle]}>
                Expired Matches
              </Text>
              <Text style={styles.expiredSubtitle}>
                These matches expired because no message was sent within 7 days
              </Text>
          <View style={styles.matchesGrid}>
                {expiredMatches.map((matchProfile) => {
              if (!matchProfile.profile) return null;
                  return <MatchCard key={matchProfile.match.id} matchProfile={matchProfile} onPress={handleMatchPress} onChatPress={handleChatPress} isExpired />;
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Limit Warning Modal */}
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

// Match Card Component
function MatchCard({ 
  matchProfile, 
  onPress, 
  onChatPress, 
  isExpired = false 
}: { 
  matchProfile: MatchProfile; 
  onPress: (m: MatchProfile) => void;
  onChatPress: (m: MatchProfile, e: any) => void;
  isExpired?: boolean;
}) {
              const { profile, match } = matchProfile;
              const fullName = `${profile.first_name} ${profile.last_name}`;
              const mainPhoto = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;
              
              // Calculate time ago
              const matchDate = new Date(match.created_at);
              const now = new Date();
              const diffInDays = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
              const timeAgo = diffInDays === 0 ? 'Today' : diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;

  // Calculate days until expiration
  const daysUntilExpiration = match.expiration_date 
    ? Math.max(0, Math.ceil((new Date(match.expiration_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

              return (
    <View style={[styles.matchCardWrapper, isExpired && styles.expiredCardWrapper]}>
                  <TouchableOpacity
        style={[styles.matchCard, isExpired && styles.expiredCard]}
        onPress={() => onPress(matchProfile)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchPhotoContainer}>
                      {mainPhoto ? (
            <ExpoImage
                          source={{ uri: mainPhoto }}
              style={[styles.matchPhoto, isExpired && styles.expiredPhoto]}
              contentFit="cover"
                        />
                      ) : (
            <View style={[styles.matchPhotoPlaceholder, isExpired && styles.expiredPhoto]}>
                          <Ionicons name="person" size={40} color={Colors.textLight} />
                        </View>
                      )}
          {!isExpired && !match.has_messaged && (
                      <View style={styles.newMatchBadge}>
              <Ionicons name="heart" size={12} color="#FFFFFF" />
              <Text style={styles.newMatchText}>New</Text>
            </View>
          )}
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          )}
          {!isExpired && match.has_messaged && (
            <View style={styles.messagedBadge}>
              <Ionicons name="chatbubble" size={12} color="#FFFFFF" />
                      </View>
          )}
                    </View>
                    <View style={styles.matchInfo}>
          <View style={styles.matchNameRow}>
            <Text style={[styles.matchName, isExpired && styles.expiredText]} numberOfLines={1}>
                        {fullName}
                      </Text>
                      {profile.age && (
              <Text style={[styles.matchAge, isExpired && styles.expiredText]}>
                {profile.age}
              </Text>
                      )}
          </View>
                      {profile.location && (
            <Text style={[styles.matchLocation, isExpired && styles.expiredText]} numberOfLines={1}>
              {profile.location}
            </Text>
          )}
          <View style={styles.matchFooter}>
            <Text style={[styles.matchTime, isExpired && styles.expiredText]}>
              {timeAgo}
            </Text>
            {!isExpired && !match.has_messaged && daysUntilExpiration !== null && daysUntilExpiration <= 3 && (
              <Text style={styles.expirationWarning}>
                {daysUntilExpiration === 0 ? 'Expires today' : `${daysUntilExpiration}d left`}
                        </Text>
                      )}
          </View>
                    </View>
                  </TouchableOpacity>
      {!isExpired && (
                  <TouchableOpacity
          style={[styles.chatButton, match.has_messaged && styles.chatButtonActive]}
          onPress={(e) => onChatPress(matchProfile, e)}
                    activeOpacity={0.7}
                  >
          <Ionicons 
            name={match.has_messaged ? "chatbubble" : "chatbubble-outline"} 
            size={20} 
            color={Colors.cardBackground} 
          />
                  </TouchableOpacity>
      )}
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
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
    marginTop: 8,
  },
  expiredSectionTitle: {
    color: Colors.textLight,
    marginTop: 24,
  },
  expiredSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  matchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  matchCardWrapper: {
    width: CARD_WIDTH,
    position: 'relative',
    marginBottom: 16,
  },
  expiredCardWrapper: {
    opacity: 0.6,
  },
  matchCard: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  expiredCard: {
    borderColor: Colors.textLight,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  chatButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: Colors.cardBackground,
  },
  chatButtonActive: {
    backgroundColor: Colors.green,
  },
  matchPhotoContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
    position: 'relative',
    backgroundColor: Colors.borderLight,
  },
  matchPhoto: {
    width: '100%',
    height: '100%',
  },
  expiredPhoto: {
    opacity: 0.5,
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
    top: 10,
    left: 10,
    backgroundColor: Colors.green,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  newMatchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expiredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.textLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messagedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  matchInfo: {
    padding: 14,
  },
  matchNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  matchName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  matchAge: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '500',
  },
  matchLocation: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 6,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  matchTime: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  expirationWarning: {
    fontSize: 10,
    color: Colors.red,
    fontWeight: '600',
  },
  expiredText: {
    color: Colors.textLight,
    opacity: 0.7,
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

