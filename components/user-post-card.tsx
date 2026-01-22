import { Colors } from '@/constants/theme';
import { PostWithProfile } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserPostCardProps {
  post: PostWithProfile;
  onLike?: (postId: string, userId: string) => void;
  onPass?: (postId: string, userId: string) => void;
}

export function UserPostCard({ post, onLike, onPass }: UserPostCardProps) {
  const userName = post.user_first_name || 'User';
  const userLocation = post.user_location || '';

  return (
    <View style={styles.container}>
      {/* Title at top - small, gray, regular */}
      {post.title && (
        <Text style={styles.postTitle}>{post.title}</Text>
      )}
      
      {/* Image below - large */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: post.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </View>

      {/* User info and actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => {
            if (post.user_id) {
              router.push({
                pathname: '/view-profile',
                params: { userId: post.user_id },
              });
            }
          }}
        >
          <Text style={styles.userName}>{userName}</Text>
          {userLocation && (
            <>
              <View style={styles.dot} />
              <Text style={styles.userLocation}>{userLocation}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.actions}>
          {onLike && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onLike(post.id, post.user_id)}
            >
              <Ionicons name="heart" size={20} color={Colors.green} />
            </TouchableOpacity>
          )}
          {onPass && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onPass(post.id, post.user_id)}
            >
              <Ionicons name="close" size={20} color={Colors.red} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 0,
    overflow: 'hidden',
  },
  postTitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: Colors.borderLight,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.iconLight,
  },
  userLocation: {
    fontSize: 12,
    color: Colors.textDark,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});

