/**
 * Welcome / Get Started Screen - HIBO Dating App
 * First screen users see when opening the app
 */

import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Color Palette - Hinge style
const theme = {
  white: '#FFFFFF',
  black: '#000000',
  darkPurple: '#8B5CF6', // Dark purple for button (like Hinge)
  gray: 'rgba(255, 255, 255, 0.7)',
  linkGray: 'rgba(255, 255, 255, 0.9)',
};

const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();

  const handleCreateAccount = () => {
    router.push('/onboarding');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://example.com/terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const handleCookiesPress = () => {
    Linking.openURL('https://example.com/cookies');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Image with Dark Overlay */}
      <ImageBackground
        source={require('../assets/images/ov.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Overlay with blur effect */}
        <View style={styles.darkOverlay} />
        
        {/* Content */}
        <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: Math.max(insets.bottom, 40) }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>HIBO</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>Designed to be deleted.</Text>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Legal Text */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By tapping 'Sign In' / 'Create account', you agree to our{' '}
              <Text style={styles.legalLink} onPress={handleTermsPress}>Terms of Service</Text>.
              {' '}Learn how we process your data in our{' '}
              <Text style={styles.legalLink} onPress={handlePrivacyPress}>Privacy Policy</Text>
              {' '}and{' '}
              <Text style={styles.legalLink} onPress={handleCookiesPress}>Cookies Policy</Text>.
            </Text>
          </View>

          {/* Last Sign In Info (optional) */}
          {/* <Text style={styles.lastSignInText}>You last signed in with your phone number</Text> */}

          {/* Create Account Button */}
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.createAccountButtonText}>Create account</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity
            style={styles.signInLink}
            onPress={handleSignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // Dark overlay for better text readability (Hinge style)
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.white,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.2,
  },
  spacer: {
    flex: 1,
  },
  legalContainer: {
    marginBottom: 24,
  },
  legalText: {
    fontSize: 11,
    color: theme.white,
    lineHeight: 16,
    textAlign: 'left',
  },
  legalLink: {
    color: theme.white,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  lastSignInText: {
    fontSize: 14,
    color: theme.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  createAccountButton: {
    backgroundColor: theme.darkPurple,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 56,
    width: '100%',
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.white,
    letterSpacing: 0.3,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.white,
    textDecorationLine: 'none',
  },
});

export default WelcomeScreen;

