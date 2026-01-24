import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

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
    <View style={styles.cardSkeleton}>
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <SkeletonLoader width={50} height={50} borderRadius={25} />
        <View style={styles.headerTextSkeleton}>
          <SkeletonLoader width={120} height={16} borderRadius={4} />
          <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
      </View>

      {/* Image */}
      <SkeletonLoader width="100%" height={400} borderRadius={0} style={{ marginTop: 12 }} />

      {/* Bio */}
      <View style={styles.contentSkeleton}>
        <SkeletonLoader width="90%" height={20} borderRadius={4} style={{ marginTop: 16 }} />
        <SkeletonLoader width="70%" height={20} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Buttons */}
      <View style={styles.buttonsSkeleton}>
        <SkeletonLoader width={60} height={50} borderRadius={25} />
        <SkeletonLoader width={60} height={50} borderRadius={25} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.borderLight,
  },
  cardSkeleton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextSkeleton: {
    flex: 1,
  },
  contentSkeleton: {
    paddingHorizontal: 4,
  },
  buttonsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});

