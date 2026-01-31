/**
 * Settings Screen - HIBO Dating App
 * Same layout and style as Profile: header, separator, cards
 */

import { PREMIUM_PLANS_FOR_SHEET, HiboBottomSheet } from '@/components/HiboBottomSheet';
import { Colors } from '@/constants/theme';
import { signOut } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const theme = {
  primary: Colors.background,
  secondary: Colors.cardBackground,
  white: Colors.cardBackground,
  black: Colors.textDark,
  lightText: Colors.textLight,
  placeholder: Colors.textLight,
  gray: Colors.textLight,
  lightGray: Colors.borderLight,
  error: Colors.red,
  buttonInactive: Colors.borderLight,
  buttonActive: Colors.primary,
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) return;
            router.replace('/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* Header - same as profile */}
      <View style={[styles.topHeader, Platform.OS === 'android' && { paddingTop: 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.black} />
        </TouchableOpacity>
        <Text style={styles.headerName}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.separator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Account</Text>
          </View>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color={theme.black} style={styles.infoRowIcon} />
            <Text style={styles.infoRowLabel}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.infoRow, styles.infoRowLast]}
            onPress={() => setShowPremiumSheet(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="diamond-outline" size={20} color={theme.black} style={styles.infoRowIcon} />
            <Text style={styles.infoRowLabel}>Premium</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.gray} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Preferences</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Ionicons name="notifications-outline" size={20} color={theme.black} style={styles.infoRowIcon} />
            <Text style={styles.infoRowLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.gray} />
          </View>
        </View>

        {/* Privacy & Safety */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Privacy & Safety</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.black} style={styles.infoRowIcon} />
            <Text style={styles.infoRowLabel}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.gray} />
          </View>
        </View>

        {/* Support */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Support</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Ionicons name="help-circle-outline" size={20} color={theme.black} style={styles.infoRowIcon} />
            <Text style={styles.infoRowLabel}>Help</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.gray} />
          </View>
        </View>

        {/* Log out */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.error} style={styles.infoRowIcon} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Premium – HIBO bottom sheet with monthly/yearly plans */}
      <HiboBottomSheet
        visible={showPremiumSheet}
        onClose={() => setShowPremiumSheet(false)}
        headerIcon="diamond"
        title="Upgrade to Premium"
        description="See who liked you, unlock unlimited likes, and stand out with HIBO Premium."
        plans={PREMIUM_PLANS_FOR_SHEET}
        initialSelectedPlanId="yearly"
        primaryButtonText="Get Premium"
        onPrimaryPress={(selectedPlanId) => {
          setShowPremiumSheet(false);
          router.push({ pathname: '/premium', params: { plan: selectedPlanId ?? 'monthly' } });
        }}
        footerSegments={[
          { type: 'text', value: 'By tapping Get Premium, you agree to our ' },
          { type: 'link', label: 'Terms of Service', onPress: () => setShowPremiumSheet(false) },
          { type: 'text', value: ' and ' },
          { type: 'link', label: 'Privacy Policy.', onPress: () => setShowPremiumSheet(false) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerButton: {
    width: 44,
    padding: 4,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.black,
  },
  separator: {
    height: 1,
    backgroundColor: theme.lightGray,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: theme.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.black,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.black,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoRowIcon: {
    marginRight: 12,
    opacity: 0.85,
  },
  infoRowLabel: {
    fontSize: 16,
    color: theme.black,
    fontWeight: '500',
    flex: 1,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: '600',
  },
});
