/**
 * Welcome / Get Started Screen - HIBO Dating App
 * First screen users see when opening the app
 */

import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Color Palette - Exact match from screenshot
const theme = {
  primary: '#FFFFFF',
  lavender: '#D4C5F9', // Light purple/lavender banner background
  white: '#FFFFFF',
  background: Colors.background, // App background from theme (#FFFBF8)
  black: '#1C1C1E',
  darkPurpleText: '#3D2954', // Dark purple for "dating tools for women" text
  gray: '#8E8E93',
  lightGray: '#E0E0E0',
  buttonBlack: '#1C1C1E', // Black buttons
  green: '#B8FF9F', // Light green accent
  greenIcon: '#9AED8E', // Green for top icon
};

const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [isLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleGetStarted = () => {
    if (!agreeChecked) {
      setShowToast(true);
      return;
    }
    setIsLoading(true);
    // Simulate loading, then navigate
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  const handleTermsPress = () => {
    // Open terms link - replace with actual URL
    Linking.openURL('https://example.com/terms');
  };

  const handlePrivacyPress = () => {
    // Open privacy policy link - replace with actual URL
    Linking.openURL('https://example.com/privacy');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      
      {/* Toast Notification */}
      <Toast
        message="Please accept the Terms and Privacy Policy to continue."
        type="info"
        visible={showToast}
        onClose={() => setShowToast(false)}
        duration={4000}
      />

      {/* Full Screen Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.circleLoader}>
            <Animated.View
              style={[
                styles.circle,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      
      {/* Lavender Banner Section */}
      <View style={styles.lavenderBanner}>
        {/* Green Circle with HIBO Text at Top */}
        <View style={styles.topIconContainer}>
          <View style={styles.greenIconCircle}>
            <Text style={styles.hiboCircleText}>HIBO</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>dating tools</Text>
          <Text style={styles.titleText}>for women</Text>
        </View>

        {/* Women Image Section */}
        <View style={styles.imageContainer}>
          {/* Green circular backgrounds */}
          <View style={styles.greenCircleLeft} />
          <View style={styles.greenCircleRight} />
          
          {/* Women illustration */}
          <Image
            source={require('../assets/images/Open Doodles - Loving.png')}
            style={styles.womenImage}
            contentFit="contain"
          />
        </View>
      </View>

      {/* White Background Section with Buttons */}
      <View style={styles.whiteSection}>
        {/* Get Started Button */}
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Footer Text with Checkbox */}
        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAgreeChecked(!agreeChecked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreeChecked && styles.checkboxChecked]}>
              {agreeChecked && (
                <Ionicons name="checkmark" size={12} color={theme.white} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerText}>
              By signing up you agree to our{' '}
              <Text style={styles.linkText} onPress={handleTermsPress}>Terms</Text>.
              {' '}See how we process your data in our{' '}
              <Text style={styles.linkText} onPress={handlePrivacyPress}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  lavenderBanner: {
    backgroundColor: theme.lavender,
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  topIconContainer: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 25,
  },
  greenIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.greenIcon,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  hiboCircleText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.white,
    letterSpacing: 1.2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.darkPurpleText,
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 40,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  greenCircleLeft: {
    position: 'absolute',
    left: 15,
    top: '25%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.green,
    opacity: 0.65,
    zIndex: 1,
  },
  greenCircleRight: {
    position: 'absolute',
    right: 25,
    bottom: '15%',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.green,
    opacity: 0.6,
    zIndex: 1,
  },
  womenImage: {
    width: '95%',
    height: '100%',
    zIndex: 2,
  },
  whiteSection: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 32,
    paddingTop: 45,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  getStartedButton: {
    backgroundColor: theme.buttonBlack,
    paddingVertical: 17,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  getStartedButtonText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 2,
  },
  checkboxContainer: {
    marginRight: 10,
    marginTop: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.gray,
    backgroundColor: theme.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.buttonBlack,
    borderColor: theme.buttonBlack,
  },
  footerTextContainer: {
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    color: theme.gray,
    textAlign: 'left',
    lineHeight: 16,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  circleLoader: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: theme.greenIcon,
    borderRightColor: theme.greenIcon,
  },
  circleArc: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  loadingText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
  },
});

export default WelcomeScreen;

