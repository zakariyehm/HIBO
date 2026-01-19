import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  logoSource?: any;
  logoText?: string;
  onNotificationPress?: () => void;
  onSharePress?: () => void;
  showNotificationDot?: boolean;
  showShareDot?: boolean;
}

export function Header({
  logoSource,
  logoText = 'HIBO',
  onNotificationPress,
  onSharePress,
  showNotificationDot = true,
  showShareDot = true,
}: HeaderProps) {
  return (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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

