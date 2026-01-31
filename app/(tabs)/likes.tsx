import { Header } from '@/components/header';
import { ListItemSkeleton } from '@/components/SkeletonLoader';
import { PREMIUM_PLANS_FOR_SHEET, SnapchatStyleBottomSheet } from '@/components/SnapchatStyleBottomSheet';
import { Colors } from '@/constants/theme';
import { getMatchWithUser, getReceivedLikes, getReceivedProfileComments, isPremiumUser, likeUser, passUser } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function dedupById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

interface ReceivedLike {
  id: string;
  first_name: string;
  last_name: string;
  photos: string[];
  age?: number;
  location?: string;
  liked_at: string;
}

interface ReceivedComment {
  id: string;
  first_name: string;
  last_name: string;
  photos: string[];
  age?: number;
  location?: string;
  comment_id: string;
  comment_content: string;
  commented_at: string;
}

type LikeOrComment = 
  | { type: 'like'; id: string; userId: string; at: string; first_name: string; last_name: string; photos: string[]; age?: number; location?: string }
  | { type: 'comment'; id: string; userId: string; at: string; first_name: string; last_name: string; photos: string[]; age?: number; location?: string; comment_content: string };

export default function LikesScreen() {
  const [items, setItems] = useState<LikeOrComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState<{ userId: string; fullName: string; comment_content: string } | null>(null);

  useEffect(() => {
    fetchItems(false);
    checkPremiumStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkPremiumStatus();
    }, [])
  );

  const fetchItems = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [likesRes, commentsRes] = await Promise.all([
        getReceivedLikes(),
        getReceivedProfileComments(),
      ]);

      const likes: LikeOrComment[] = (dedupById((likesRes.data || []) as ReceivedLike[])).map((l) => ({
        type: 'like' as const,
        id: `like-${l.id}`,
        userId: l.id,
        at: l.liked_at,
        first_name: l.first_name,
        last_name: l.last_name,
        photos: l.photos || [],
        age: l.age,
        location: l.location,
      }));

      const comments: LikeOrComment[] = ((commentsRes.data || []) as ReceivedComment[]).map((c) => ({
        type: 'comment' as const,
        id: `comment-${c.comment_id}`,
        userId: c.id,
        at: c.commented_at,
        first_name: c.first_name,
        last_name: c.last_name,
        photos: c.photos || [],
        age: c.age,
        location: c.location,
        comment_content: c.comment_content,
      }));

      const merged = [...likes, ...comments].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      );
      setItems(merged);
    } catch (e) {
      console.error('❌ Exception fetching likes/comments:', e);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const checkPremiumStatus = async () => {
    const premium = await isPremiumUser();
    setIsPremium(premium);
  };

  const getLikeErrorMessage = (err: { message?: string }) => {
    const m = err?.message;
    if (m === 'DAILY_LIKE_LIMIT_REACHED') return "You've used your daily likes. Come back tomorrow or upgrade to Premium for more.";
    if (m === 'ALREADY_LIKED_TODAY') return "You already liked them today.";
    if (m === 'MATCH_LIMIT_REACHED') return "Match limit reached. Upgrade to Premium for unlimited matches.";
    if (m === 'Not authenticated') return "Please sign in again.";
    return 'Couldn\'t send like. Please try again.';
  };

  const handleLike = (userId: string) => {
    if (processing) return;
    setProcessing(userId);
    const kept = items.filter((x) => x.userId !== userId);
    setItems(kept);
    (async () => {
      try {
        const { data, error } = await likeUser(userId);
        if (error) {
          fetchItems(true);
          const msg = getLikeErrorMessage(error);
          if (msg === 'Couldn\'t send like. Please try again.') {
            console.error('❌ likeUser error:', error);
          }
          Alert.alert('Couldn\'t send like', msg);
          return;
        }
        if (data?.match) router.push({ pathname: '/(tabs)/match' });
      } catch (e) {
        console.error('❌ Error liking user:', e);
        fetchItems(true);
        Alert.alert('Couldn\'t send like', 'Something went wrong. Please try again.');
      } finally {
        setProcessing(null);
      }
    })();
  };

  const handlePass = (userId: string) => {
    if (processing) return;
    setProcessing(userId);
    setItems((prev) => prev.filter((x) => x.userId !== userId));
    (async () => {
      try {
        await passUser(userId);
      } catch (e) {
        console.error('❌ Error passing user:', e);
      } finally {
        setProcessing(null);
      }
    })();
  };

  const handleViewProfile = (userId: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    router.push({
      pathname: '/view-profile',
      params: { userId },
    });
  };

  const handleItemPress = (item: LikeOrComment) => {
    if (item.type === 'comment') {
      if (isPremium) {
        const fullName = `${item.first_name}${item.last_name ? ` ${item.last_name}` : ''}`.trim();
        setSelectedComment({ userId: item.userId, fullName: fullName || 'Someone', comment_content: item.comment_content });
        setShowCommentModal(true);
      } else {
        setShowPremiumModal(true);
      }
    } else {
      handleViewProfile(item.userId);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  return (
    <View style={styles.container}>
      <Header logoText="Likes" showIcons={false} />
      <FlatList<LikeOrComment | null>
          data={loading ? [null, null, null] : items}
          keyExtractor={(item, i) => item?.id ?? `skel-${i}`}
          renderItem={({ item }) => {
            if (loading || !item) return <ListItemSkeleton />;
            const it = item;
            const mainPhoto = it.photos?.length ? it.photos[0] : null;
            const isComment = it.type === 'comment';
            const preview = isComment
              ? (it.comment_content.length > 40 ? `${it.comment_content.slice(0, 40)}…` : it.comment_content)
              : '';
            const statusMessage = isPremium
              ? isComment
                ? `Commented: "${preview}" ${getTimeAgo(it.at)}`
                : `Liked you ${getTimeAgo(it.at)}`
              : isComment
                ? 'Someone commented • Premium to see'
                : 'Liked you • Premium to see';
            return (
              <TouchableOpacity
                style={styles.likeItem}
                onPress={() => handleItemPress(it)}
                activeOpacity={0.7}
                disabled={processing === it.userId}
              >
                <View style={styles.photoContainer}>
                  {mainPhoto ? (
                    <>
                      <ExpoImage source={{ uri: mainPhoto }} style={styles.photo} contentFit="cover" />
                      {!isPremium && (
                        <View style={styles.blurOverlay}>
                          <View style={styles.blurBackground} />
                          <View style={styles.premiumLock}>
                            <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                          </View>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="person" size={32} color={Colors.textLight} />
                    </View>
                  )}
                </View>
                <View style={styles.likeInfo}>
                  <Text style={styles.likeName} numberOfLines={1}>
                    {isPremium ? `${it.first_name}${it.last_name ? ` ${it.last_name}` : ''}`.trim() || 'Someone' : 'Someone'}
                  </Text>
                  <Text style={styles.statusMessage} numberOfLines={1}>{statusMessage}</Text>
                </View>
                {!isPremium && (
                  <View style={styles.premiumIcon}>
                    <Ionicons name="lock-closed" size={20} color={Colors.textLight} />
                  </View>
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
                <Text style={styles.emptyTitle}>No likes or comments yet</Text>
                <Text style={styles.emptySubtitle}>Start swiping and sending comments! 💕</Text>
              </View>
            ) : null
          }
          contentContainerStyle={[styles.contentContainer, ...(!loading && items.length === 0 ? [styles.emptyListContent] : [])]}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchItems(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      <SnapchatStyleBottomSheet
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        headerIcon="heart"
        title="Upgrade to Premium"
        description="See who liked you and who commented! Unlock photos and messages."
        plans={PREMIUM_PLANS_FOR_SHEET}
        initialSelectedPlanId="yearly"
        primaryButtonText="Get Premium"
        onPrimaryPress={(selectedPlanId) => {
          setShowPremiumModal(false);
          router.push({ pathname: '/premium', params: { plan: selectedPlanId ?? 'monthly' } });
        }}
        footerSegments={[
          { type: 'text', value: 'By tapping Get Premium, you agree to our ' },
          { type: 'link', label: 'Terms', onPress: () => setShowPremiumModal(false) },
        ]}
      />
      <Modal
        visible={showCommentModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowCommentModal(false); setSelectedComment(null); }}
      >
        <View style={styles.commentModalOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, styles.commentModalOverlayDim]} />
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => { setShowCommentModal(false); setSelectedComment(null); }}
          />
          <TouchableOpacity style={styles.commentModalCard} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {selectedComment && (
              <>
                <Text style={styles.commentModalTitle}>{selectedComment.fullName}</Text>
                <Text style={styles.commentModalLabel}>Comment</Text>
                <Text style={styles.commentModalText}>{selectedComment.comment_content}</Text>
                <View style={styles.commentModalActions}>
                  <TouchableOpacity
                    style={styles.commentModalLikePill}
                    onPress={() => {
                      const uid = selectedComment.userId;
                      setShowCommentModal(false);
                      setSelectedComment(null);
                      handleLike(uid);
                    }}
                    disabled={processing === selectedComment.userId}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="thumbs-up-outline" size={20} color={Colors.textDark} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.commentModalStartMatchPill}
                    onPress={async () => {
                      const uid = selectedComment.userId;
                      const match = await getMatchWithUser(uid);
                      setShowCommentModal(false);
                      setSelectedComment(null);
                      if (match) {
                        router.push({ pathname: '/chat', params: { matchId: match.matchId, userId: match.userId } });
                      } else {
                        Alert.alert('Match first', 'Like them back to match, then you can start chatting.');
                      }
                    }}
                    disabled={processing === selectedComment.userId}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.commentModalStartMatchPillText}>Start chat</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
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
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    position: 'relative',
  },
  photoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: Colors.borderLight,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  premiumLock: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeInfo: {
    flex: 1,
  },
  likeName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '400',
  },
  premiumIcon: {
    marginLeft: 8,
  },
  commentModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  commentModalOverlayDim: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  commentModalCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  commentModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  commentModalLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commentModalText: {
    fontSize: 16,
    color: Colors.textDark,
    lineHeight: 24,
    marginBottom: 24,
  },
  commentModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentModalLikePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E8DAEF',
  },
  commentModalStartMatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#F4E4BC',
  },
  commentModalStartMatchPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
});

