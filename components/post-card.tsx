import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface PostCardProps {
  title?: string;
  profileName: string;
  location: string;
  username: string;
  timeAgo: string;
  profileImage?: string;
  postImage?: string;
  postText: string;
  commentCount?: number;
  onShare?: () => void;
  onComment?: () => void;
}

export function PostCard({
  title,
  profileName,
  location,
  username,
  timeAgo,
  profileImage,
  postImage,
  postText,
  commentCount = 0,
  onShare,
  onComment,
}: PostCardProps) {
  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      
      <View style={styles.card}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <View style={styles.profileRow}>
              <Text style={styles.profileName}>{profileName}</Text>
              <View style={styles.dot} />
              <Text style={styles.location}>{location}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Image */}
        {postImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: postImage }} style={styles.postImage} />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.actionButton}>
            <Ionicons name="flag" size={16} color={Colors.green} />
            <Text style={styles.actionButtonText}>2</Text>
          </View>
          <View style={styles.actionButton}>
            <Ionicons name="flag" size={16} color={Colors.red} />
            <Text style={styles.actionButtonText}>17</Text>
          </View>
        </View>

        {/* Post Text */}
        <View style={styles.postTextContainer}>
          <Text style={styles.postText}>
            {postText}
            {postText.length > 100 && (
              <Text style={styles.showMore}> Show more</Text>
            )}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={onShare}>
            <Ionicons name="paper-plane" size={20} color={Colors.textDark} />
            <Text style={styles.footerButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={onComment}>
            <Ionicons name="chatbubble" size={20} color={Colors.textDark} />
            <Text style={styles.commentCount}>{commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.iconLight,
  },
  location: {
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '400',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 14,
    color: Colors.textLight,
  },
  timeAgo: {
    fontSize: 14,
    color: Colors.textLight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  followButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  postTextContainer: {
    marginBottom: 12,
  },
  postText: {
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 20,
  },
  showMore: {
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerButtonText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
  commentCount: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
});

