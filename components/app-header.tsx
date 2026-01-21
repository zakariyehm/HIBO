import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface AppHeaderProps {
  onNotificationPress?: () => void;
  onSharePress?: () => void;
  onInvitePress?: () => void;
  showNotificationDot?: boolean;
  showShareDot?: boolean;
}

export function AppHeader({
  onNotificationPress,
  onSharePress,
  onInvitePress,
  showNotificationDot = true,
  showShareDot = true,
}: AppHeaderProps) {

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
              style={styles.inviteButton}
              onPress={onInvitePress}
              activeOpacity={0.7}
            >
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
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
  inviteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
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
    height: 1,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
});

