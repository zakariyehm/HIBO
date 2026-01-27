import { Colors } from '@/constants/theme';
import { Header } from '@/components/header';
import { PremiumUpgradeBottomSheet } from '@/components/PremiumUpgradeBottomSheet';
import { getReceivedLikes, isPremiumUser, likeUser, passUser } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

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

export default function LikesScreen() {
  const [receivedLikes, setReceivedLikes] = useState<ReceivedLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchReceivedLikes(false);
    checkPremiumStatus();
  }, []);

  // Refresh premium status when screen comes into focus (e.g., after subscription)
  useFocusEffect(
    useCallback(() => {
      checkPremiumStatus();
    }, [])
  );

  const fetchReceivedLikes = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const { data, error } = await getReceivedLikes();
      if (error) {
        console.error('❌ Error fetching received likes:', error);
        return;
      }
      if (data) setReceivedLikes(dedupById(data as ReceivedLike[]));
    } catch (e) {
      console.error('❌ Exception in fetchReceivedLikes:', e);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const checkPremiumStatus = async () => {
    const premium = await isPremiumUser();
    setIsPremium(premium);
  };

  const handleLike = (userId: string) => {
    if (processing) return;
    setProcessing(userId);
    const like = receivedLikes.find((l) => l.id === userId);
    setReceivedLikes((prev) => prev.filter((l) => l.id !== userId));
    (async () => {
      try {
        const { data, error } = await likeUser(userId);
        if (error) {
          if (like) setReceivedLikes((prev) => (prev.some((l) => l.id === like.id) ? prev : [...prev, like]));
          Alert.alert('Error', 'Failed to like user');
          return;
        }
        if (data?.match) router.push({ pathname: '/(tabs)/match' });
      } catch (e) {
        console.error('❌ Error liking user:', e);
      } finally {
        setProcessing(null);
      }
    })();
  };

  const handlePass = (userId: string) => {
    if (processing) return;
    setProcessing(userId);
    setReceivedLikes((prev) => prev.filter((like) => like.id !== userId));
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading likes...</Text>
        </View>
      ) : receivedLikes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="heart-outline" size={64} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptySubtitle}>
            Start swiping to get likes! 💕
          </Text>
        </View>
      ) : (
        <FlatList
          data={receivedLikes}
          keyExtractor={(item) => item.id}
          renderItem={({ item: like }) => {
            const mainPhoto = like.photos?.length ? like.photos[0] : null;
            const statusMessage = isPremium ? `Liked you ${getTimeAgo(like.liked_at)}` : 'Liked you • Premium to see';
            return (
              <TouchableOpacity
                style={styles.likeItem}
                onPress={() => handleViewProfile(like.id)}
                activeOpacity={0.7}
                disabled={processing === like.id}
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
                  <Text style={styles.likeName} numberOfLines={1}>{like.first_name}</Text>
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
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchReceivedLikes(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}

      {/* Premium Upgrade Bottom Sheet */}
      <PremiumUpgradeBottomSheet
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
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
});

