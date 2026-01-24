import { Colors } from '@/constants/theme';
import { upgradeToPremium } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PremiumScreen() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await upgradeToPremium();
      
      if (error) {
        Alert.alert('Error', 'Failed to upgrade to premium. Please try again.');
        setLoading(false);
        return;
      }

      // Success - show confirmation and navigate back
      Alert.alert(
        'Success!',
        'You are now a premium member. Enjoy unlimited likes and all premium features!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error subscribing:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Enhanced recommendations',
      description: 'Access to people more your type',
    },
    {
      title: 'Skip the line',
      description: 'Get recommended sooner',
    },
    {
      title: 'Priority likes',
      description: 'Stay toward the top of their list',
    },
    {
      title: 'Send unlimited likes',
    },
    {
      title: 'See everyone who likes you',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={Colors.textDark} />
        </TouchableOpacity>

        {/* Top Section */}
        <View style={styles.topSection}>
          <Text style={styles.appName}>HIBO</Text>
          <Text style={styles.tagline}>Delete us faster.</Text>
        </View>

        {/* Middle Section */}
        <View style={styles.middleSection}>
          <Text style={styles.headline}>
            Subscribers go on twice as many dates.
          </Text>

          {/* Features List */}
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  {feature.description && (
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={Colors.textDark}
                  style={styles.checkmark}
                />
              </View>
            ))}
            
            {/* And more... */}
            <View style={styles.featureItem}>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>And more...</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.cardBackground} />
            ) : (
              <Text style={styles.subscribeButtonText}>Check it out</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.maybeLaterButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.maybeLaterText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '400',
    marginBottom: 40,
  },
  middleSection: {
    marginBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 36,
  },
  featuresList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  featureContent: {
    flex: 1,
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  bottomSection: {
    marginTop: 20,
    gap: 16,
  },
  subscribeButton: {
    backgroundColor: Colors.textDark,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  subscribeButtonText: {
    color: Colors.cardBackground,
    fontSize: 18,
    fontWeight: '600',
  },
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '400',
  },
});

