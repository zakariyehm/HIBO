import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  logoSource?: any;
  logoText?: string;
  onNotificationPress?: () => void;
  onSharePress?: () => void;
  showNotificationDot?: boolean;
  showShareDot?: boolean;
  showIcons?: boolean;
}

export function Header({
  logoSource,
  logoText = 'HIBO',
  onNotificationPress,
  onSharePress,
  showNotificationDot = true,
  showShareDot = true,
  showIcons = true,
}: HeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Logo on Left */}
        <View style={styles.logoContainer}>
          {logoSource ? (
            <Image source={logoSource} style={styles.logoImage} />
          ) : (
            <Text style={styles.logoText}>{logoText}</Text>
          )}
        </View>

        {/* Icons on Right */}
        {showIcons && (
          <View style={styles.iconButtonsContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={20} color="#000" />
              {showNotificationDot && <View style={styles.indicatorDot} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSharePress}
              activeOpacity={0.7}
            >
              <Ionicons name="paper-plane" size={20} color="#000" />
              {showShareDot && <View style={styles.indicatorDot} />}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
  iconButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
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
});

