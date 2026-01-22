import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title?: string;
  onActionPress?: () => void;
  actionIcon?: string;
  onNotificationPress?: () => void;
  onSharePress?: () => void;
  showNotificationDot?: boolean;
  showShareDot?: boolean;
}

export function AppHeader({
  title,
  onActionPress,
  actionIcon = 'add-outline',
  onNotificationPress,
  onSharePress,
  showNotificationDot = true,
  showShareDot = true,
}: AppHeaderProps) {
  // If title is provided, show "For you" style header
  if (title) {
    return (
      <SafeAreaView 
        style={styles.safeArea}
        edges={['top']}
      >
        <View style={styles.container}>
          <View style={styles.topRow}>
            {/* Title on Left with underline */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>{title}</Text>
              <View style={styles.underline} />
            </View>

            {/* Action Button on Right */}
            {onActionPress && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onActionPress}
                activeOpacity={0.7}
              >
                <Ionicons name={actionIcon as any} size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Divider */}
        <View style={styles.divider} />
      </SafeAreaView>
    );
  }

  // Default header with logo and notification/share buttons
  return (
    <SafeAreaView 
      style={styles.safeArea}
      edges={['top']}
    >
      <View style={styles.container}>
        {/* Top Row: Logo and Action Buttons */}
        <View style={styles.topRow}>
          {/* Logo on Left */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>HIBO</Text>
          </View>

          {/* Action Buttons on Right */}
          <View style={styles.iconButtonsContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={20} color={Colors.textDark} />
              {showNotificationDot && <View style={styles.indicatorDot} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSharePress}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane" size={20} color={Colors.textDark} />
              {showShareDot && <View style={styles.indicatorDot} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Divider with elevation */}
      <View style={styles.divider} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    ...(Platform.OS === 'android' && {
      paddingTop: Platform.Version >= 23 ? 8 : 12,
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 2,
  },
  iconButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicatorDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 4,
  },
  underline: {
    height: 2,
    width: '100%',
    backgroundColor: Colors.textDark,
    borderRadius: 1,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#2C2C2C', // Dark gray background
    alignItems: 'center',
    justifyContent: 'center',
  },
});
