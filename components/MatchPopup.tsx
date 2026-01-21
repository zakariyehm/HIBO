/**
 * Match Popup Component - Shows when a match is created
 */

import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MatchPopupProps {
  visible: boolean;
  matchedUserName: string;
  matchedUserPhoto?: string;
  onClose: () => void;
  onViewMatch: () => void;
}

export function MatchPopup({
  visible,
  matchedUserName,
  matchedUserPhoto,
  onClose,
  onViewMatch,
}: MatchPopupProps) {
  console.log('🎨 MatchPopup render - visible:', visible, 'name:', matchedUserName);
  
  const handleViewMatch = () => {
    onViewMatch();
    onClose();
    router.push('/(tabs)/match');
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            {matchedUserPhoto ? (
              <Image
                source={{ uri: matchedUserPhoto }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={60} color={Colors.textLight} />
              </View>
            )}
            {/* Match Badge */}
            <View style={styles.matchBadge}>
              <Ionicons name="heart" size={24} color="#FFFFFF" />
            </View>
          </View>

          {/* Content Card */}
          <View style={styles.card}>
            <Text style={styles.title}>It's a Match! 🎉</Text>
            <Text style={styles.message}>
              You and {matchedUserName} liked each other!
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleViewMatch}
                activeOpacity={0.8}
              >
                <Text style={styles.viewButtonText}>View Match</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    alignItems: 'center',
  },
  photoContainer: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    height: (SCREEN_WIDTH - 40) * 1.2,
    maxHeight: 480,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: -60,
    zIndex: 2,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    paddingTop: 80,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    gap: 12,
  },
  viewButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
});

