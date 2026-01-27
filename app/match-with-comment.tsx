/**
 * Match With Comment screen – blur, name, card (prompt + optional comment pill).
 * Like + Pass only – same UI/actions as PostCard (purple thumbs-up, beige X).
 */

import { Colors } from '@/constants/theme';
import { getMatchWithUser, likeUser } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Params = {
  userId?: string;
  userName?: string;
  promptQuestion?: string;
  promptAnswer?: string;
  existingComment?: string;
};

export default function MatchWithCommentScreen() {
  const insets = useSafeAreaInsets();
  const { userId, userName, promptQuestion, promptAnswer, existingComment } = useLocalSearchParams<Params>();

  const [loadingAction, setLoadingAction] = useState<'like' | 'chat' | null>(null);

  const name = userName || 'them';
  const hasExisting = Boolean(existingComment?.trim());
  const loading = loadingAction != null;

  useEffect(() => {
    if (!userId) router.back();
  }, [userId]);

  if (!userId) return null;

  const handleLike = async () => {
    if (!userId || loading) return;
    setLoadingAction('like');
    try {
      const { error } = await likeUser(userId);
      if (error) {
        setLoadingAction(null);
        return;
      }
      router.replace('/(tabs)/match');
    } catch (e) {
      setLoadingAction(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartChat = async () => {
    if (!userId || loading) return;
    setLoadingAction('chat');
    try {
      const match = await getMatchWithUser(userId);
      if (match) {
        router.push({ pathname: '/chat', params: { matchId: match.matchId, userId: match.userId } });
      } else {
        Alert.alert('Match first', 'Like them back to match, then you can start chatting.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, styles.dim]} />

      <View style={styles.keyboardView}>
        <Text style={styles.nameHeader}>{name}</Text>

        <View style={styles.card}>
          {promptQuestion != null && promptQuestion !== '' && (
            <Text style={styles.promptLabel}>{promptQuestion}</Text>
          )}
          {promptAnswer != null && promptAnswer !== '' && (
            <Text style={styles.promptAnswer}>{promptAnswer}</Text>
          )}

          {hasExisting && (
            <View style={styles.commentPill}>
              <Text style={styles.commentPillText}>{existingComment}</Text>
            </View>
          )}

          {/* Like + Start chat – Hinge-style */}
          <View style={styles.actionBar} pointerEvents={loading ? 'none' : 'auto'}>
            <TouchableOpacity
              style={styles.likePill}
              onPress={handleLike}
              disabled={loading || !userId}
              activeOpacity={0.7}
            >
              {loadingAction === 'like' ? (
                <ActivityIndicator size="small" color={Colors.textDark} />
              ) : (
                <Ionicons name="thumbs-up-outline" size={20} color={Colors.textDark} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startMatchPill}
              onPress={handleStartChat}
              disabled={loading || !userId}
              activeOpacity={0.7}
            >
              {loadingAction === 'chat' ? (
                <ActivityIndicator size="small" color={Colors.textDark} />
              ) : (
                <Text style={styles.startMatchPillText}>Start chat</Text>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  nameHeader: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  promptLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 6,
  },
  promptAnswer: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    lineHeight: 28,
    marginBottom: 16,
    fontFamily: 'serif',
  },
  commentPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5D0C8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  commentPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  likePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E8DAEF',
  },
  startMatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#F4E4BC',
  },
  startMatchPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
});
