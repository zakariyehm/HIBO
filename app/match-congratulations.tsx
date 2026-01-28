/**
 * Match Congratulations screen – blur, profile image, congratulations card.
 * Shown when User A likes User B and User B likes User A (mutual like → match).
 * Same style as match-with-comment: BlurView, dim, white card, Start chat / View match.
 */

import { Colors } from '@/constants/theme';
import { getMatchWithUser } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Params = {
  userId?: string;
  userName?: string;
  userPhoto?: string;
};

export default function MatchCongratulationsScreen() {
  const insets = useSafeAreaInsets();
  const { userId, userName, userPhoto } = useLocalSearchParams<Params>();

  const [loadingAction, setLoadingAction] = useState<'chat' | null>(null);

  const name = userName || 'Someone';
  const loading = loadingAction != null;

  useEffect(() => {
    if (!userId) router.back();
  }, [userId]);

  if (!userId) return null;

  const handleStartChat = async () => {
    if (!userId || loading) return;
    setLoadingAction('chat');
    try {
      const match = await getMatchWithUser(userId);
      if (match) {
        router.replace({ pathname: '/chat', params: { matchId: match.matchId, userId: match.userId } });
      } else {
        Alert.alert('Match first', 'Like them back to match, then you can start chatting.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewMatch = () => {
    if (loading) return;
    router.replace('/(tabs)/match');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, styles.dim]} />

      <View style={styles.content}>
        <Text style={styles.nameHeader}>{name}</Text>

        {/* Profile image – prominent like MatchPopup */}
        <View style={styles.photoContainer}>
          {userPhoto ? (
            <ExpoImage source={{ uri: userPhoto }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={64} color={Colors.textLight} />
            </View>
          )}
          <View style={styles.matchBadge}>
            <Ionicons name="heart" size={28} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>It&apos;s a Match! 🎉</Text>
          <Text style={styles.message}>
            You and {name} liked each other!
          </Text>

          <View style={styles.actionBar} pointerEvents={loading ? 'none' : 'auto'}>
            <TouchableOpacity
              style={styles.startChatPill}
              onPress={handleStartChat}
              disabled={loading || !userId}
              activeOpacity={0.7}
            >
              {loadingAction === 'chat' ? (
                <ActivityIndicator size="small" color={Colors.textDark} />
              ) : (
                <Text style={styles.startChatPillText}>Start chat</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewMatchPill}
              onPress={handleViewMatch}
              disabled={loading || !userId}
              activeOpacity={0.7}
            >
              <Text style={styles.viewMatchPillText}>View match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dim: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  nameHeader: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 340,
    aspectRatio: 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: -50,
    zIndex: 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    paddingTop: 64,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    opacity: 0.9,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startChatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#E8DAEF',
    minWidth: 120,
  },
  startChatPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  viewMatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#F4E4BC',
    minWidth: 120,
  },
  viewMatchPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
});
