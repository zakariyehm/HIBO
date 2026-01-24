import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, width } = Dimensions.get('window');

// Post card styles - exact same as post-card.tsx
const postCardStyles = StyleSheet.create({
  container: {},
  card: {},
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
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.iconLight,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  bioContainer: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
  },
  promptsContainer: {
    marginBottom: 12,
    gap: 12,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <View style={postCardStyles.container}>
      <View style={postCardStyles.card}>
        {/* Profile Header Section - exact same as post-card.tsx */}
        <View style={postCardStyles.profileHeader}>
          <View style={postCardStyles.profileInfo}>
            <View style={postCardStyles.profileRow}>
              <SkeletonLoader width={120} height={28} borderRadius={4} />
              <View style={postCardStyles.dot} />
              <SkeletonLoader width={60} height={12} borderRadius={2} />
            </View>
            <View style={postCardStyles.userInfo}>
              <SkeletonLoader width={100} height={14} borderRadius={2} />
            </View>
          </View>
          <View style={postCardStyles.headerActions}>
            <SkeletonLoader width={24} height={24} borderRadius={12} />
          </View>
        </View>

        {/* Post Images - exact same as post-card.tsx imageContainer */}
        <View style={postCardStyles.imageContainer}>
          <SkeletonLoader 
            width={SCREEN_WIDTH} 
            height={500} 
            borderRadius={16} 
          />
        </View>

        {/* Action Buttons - exact same as post-card.tsx actionButtons */}
        <View style={postCardStyles.actionButtons}>
          <SkeletonLoader width={70} height={30} borderRadius={4} />
          <SkeletonLoader width={70} height={30} borderRadius={4} />
        </View>

        {/* Bio Section - exact same as post-card.tsx bioContainer */}
        <View style={postCardStyles.bioContainer}>
          <SkeletonLoader width={100} height={13} borderRadius={2} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="90%" height={32} borderRadius={2} />
          <SkeletonLoader width="70%" height={32} borderRadius={2} style={{ marginTop: 8 }} />
        </View>

        {/* Prompts Section - exact same as post-card.tsx promptsContainer */}
        <View style={postCardStyles.promptsContainer}>
          <View style={postCardStyles.promptCard}>
            <SkeletonLoader width={150} height={13} borderRadius={2} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="85%" height={20} borderRadius={2} />
            <SkeletonLoader width="75%" height={20} borderRadius={2} style={{ marginTop: 8 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

// Profile skeleton styles - exact same as profile.tsx
const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  photosSection: {
    marginBottom: 20,
  },
  photosScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  photoContainer: {
    width: (width || SCREEN_WIDTH) * 0.9,
    height: (width || SCREEN_WIDTH) * 1.2,
    borderRadius: 0,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: Colors.borderLight,
    position: 'relative',
  },
  bioCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.textDark,
    padding: 20,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.textDark,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nameSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.textDark,
  },
});

export function ProfileSkeleton() {
  return (
    <View style={profileStyles.container}>
      {/* Header */}
      <View style={profileStyles.topHeader}>
        <SkeletonLoader width={60} height={20} borderRadius={4} />
        <SkeletonLoader width={100} height={20} borderRadius={4} />
        <SkeletonLoader width={60} height={24} borderRadius={12} />
      </View>
      
      {/* Separator */}
      <View style={profileStyles.separator} />
      
      {/* Tabs */}
      <View style={profileStyles.tabsContainer}>
        <View style={profileStyles.tab}>
          <SkeletonLoader width={40} height={20} borderRadius={4} />
        </View>
        <View style={profileStyles.tab}>
          <SkeletonLoader width={40} height={20} borderRadius={4} />
        </View>
      </View>
      
      <ScrollView
        style={profileStyles.scrollView}
        contentContainerStyle={profileStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
        <View style={profileStyles.photosSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={profileStyles.photosScrollContent}
            pagingEnabled
          >
            {[1, 2, 3].map((i) => (
              <View key={i} style={profileStyles.photoContainer}>
                <SkeletonLoader width={(width || SCREEN_WIDTH) * 0.9} height={(width || SCREEN_WIDTH) * 1.2} borderRadius={0} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bio Card */}
        <View style={profileStyles.bioCard}>
          <SkeletonLoader width={200} height={13} borderRadius={2} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="90%" height={32} borderRadius={2} />
          <SkeletonLoader width="75%" height={32} borderRadius={2} style={{ marginTop: 8 }} />
        </View>

        {/* Basic Info Card */}
        <View style={profileStyles.card}>
          <View style={profileStyles.cardHeader}>
            <SkeletonLoader width={150} height={18} borderRadius={2} />
          </View>
          
          <View style={profileStyles.nameSection}>
            <SkeletonLoader width={120} height={24} borderRadius={2} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={60} height={16} borderRadius={2} />
          </View>

          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={profileStyles.infoItem}>
              <SkeletonLoader width={100} height={16} borderRadius={2} />
              <SkeletonLoader width={120} height={16} borderRadius={2} />
            </View>
          ))}
        </View>

        {/* Interests/Tags Card */}
        <View style={profileStyles.card}>
          <View style={profileStyles.cardHeader}>
            <SkeletonLoader width={100} height={18} borderRadius={2} />
          </View>
          <View style={profileStyles.tagsContainer}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={profileStyles.tag}>
                <SkeletonLoader width={60} height={14} borderRadius={2} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Messages skeleton styles - exact same as messages.tsx
const messagesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});

export function MessagesSkeleton() {
  return (
    <View style={messagesStyles.container}>
      <SafeAreaView style={messagesStyles.safeArea} edges={['top']}>
        <SkeletonLoader width={120} height={28} borderRadius={4} />
      </SafeAreaView>

      <ScrollView
        style={messagesStyles.scrollView}
        contentContainerStyle={messagesStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={messagesStyles.conversationItem}>
            {/* Photo */}
            <View style={messagesStyles.photoContainer}>
              <SkeletonLoader width={56} height={56} borderRadius={28} />
            </View>
            
            {/* Conversation Info */}
            <View style={messagesStyles.conversationInfo}>
              <View style={messagesStyles.conversationHeader}>
                <SkeletonLoader width={120} height={16} borderRadius={2} />
                <SkeletonLoader width={40} height={12} borderRadius={2} />
              </View>
              <SkeletonLoader width="80%" height={14} borderRadius={2} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.borderLight,
  },
});

