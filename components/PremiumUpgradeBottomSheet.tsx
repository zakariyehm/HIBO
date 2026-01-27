/**
 * Premium Upgrade Bottom Sheet Component
 * Reusable bottom sheet modal for premium upgrade prompts
 * Snapchat-style design with slide-up animation
 */

import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PremiumUpgradeBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  features?: Array<{ icon: string; text: string }>;
  upgradeButtonText?: string;
  maybeLaterText?: string;
  onUpgrade?: () => void;
}

const DEFAULT_FEATURES = [
  { icon: 'checkmark-circle', text: 'See who liked you' },
  { icon: 'checkmark-circle', text: 'Unblur all photos' },
  { icon: 'checkmark-circle', text: 'Unlimited likes' },
];

export function PremiumUpgradeBottomSheet({
  visible,
  onClose,
  title = 'Upgrade to Premium',
  description = 'Unlock who liked you and see their photos clearly!',
  features = DEFAULT_FEATURES,
  upgradeButtonText = 'Upgrade Now',
  maybeLaterText = 'Maybe Later',
  onUpgrade,
}: PremiumUpgradeBottomSheetProps) {
  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/premium');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.content}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.textDark} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={48} color={Colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Features List */}
          <View style={styles.features}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name={feature.icon as any}
                  size={24}
                  color={Colors.green}
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Upgrade Button */}
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradeButtonText}>{upgradeButtonText}</Text>
          </TouchableOpacity>

          {/* Maybe Later Link */}
          <TouchableOpacity
            style={styles.maybeLater}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.maybeLaterText}>{maybeLaterText}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '75%',
    minHeight: '60%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  features: {
    width: '100%',
    gap: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    fontSize: 18,
    color: Colors.textDark,
    fontWeight: '500',
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryText,
    letterSpacing: 0.5,
  },
  maybeLater: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
