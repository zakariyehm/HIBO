import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface AppHeaderProps {
  onNotificationPress?: () => void;
  onSharePress?: () => void;
  onInvitePress?: () => void;
  onSearch?: (text: string) => void;
  showNotificationDot?: boolean;
  showShareDot?: boolean;
}

export function AppHeader({
  onNotificationPress,
  onSharePress,
  onInvitePress,
  onSearch,
  showNotificationDot = true,
  showShareDot = true,
}: AppHeaderProps) {
  const [searchText, setSearchText] = useState('');

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name"
              placeholderTextColor={Colors.textLight}
              value={searchText}
              onChangeText={handleSearchChange}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color={Colors.textDark} />
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 12,
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
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textDark,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

