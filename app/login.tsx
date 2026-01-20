/**
 * Login Screen - HIBO Dating App
 * Sign in screen for existing users
 */

import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const theme = {
  primary: '#FFFFFF',
  purple: '#B19CD9',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#999999',
  lightGray: '#E0E0E0',
  buttonActive: '#000000',
  error: '#FF6B6B',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'error' | 'success'>('info');

  // Disable Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back behavior
        return true;
      };

      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
      }
    }, [])
  );

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSignIn = async () => {
    // Clear any previous toast
    setShowToast(false);

    if (!email.trim()) {
      showNotification('Please enter your email address.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showNotification('Please enter a valid email address.', 'error');
      return;
    }

    if (!password.trim()) {
      showNotification('Please enter your password.', 'error');
      return;
    }

    if (password.length < 6) {
      showNotification('Password must be at least 6 characters long.', 'error');
      return;
    }

    setIsLoading(true);

    // Simulate API call - replace with actual backend call
    setTimeout(() => {
      setIsLoading(false);
      
      // Simulate different error scenarios for demonstration
      // In real app, this would come from API response
      const emailLower = email.toLowerCase().trim();
      
      if (emailLower === 'error@example.com') {
        showNotification('No account found with this email. Please check your email or sign up.', 'error');
      } else if (emailLower === 'wrong@example.com') {
        showNotification('Incorrect password. Please try again or reset your password.', 'error');
      } else {
        showNotification('Signed in successfully! Welcome back.', 'success');
        
        // Navigate to home after successful login
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      }
    }, 1500);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    showNotification('Google sign-in not yet implemented.', 'info');
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleTermsPress = () => {
    Linking.openURL('https://example.com/terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://example.com/privacy');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onClose={() => setShowToast(false)}
        duration={4000}
      />

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>HIBO</Text>
            <Text style={styles.subtitle}>Welcome back</Text>
          </View>

          {/* Sign In Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor={theme.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color={theme.gray} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Signing in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Don't have account */}
            <View style={styles.noAccountContainer}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/onboarding')}>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OR Separator */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Alternative Sign In Methods */}
          <View style={styles.alternativeMethods}>
            <TouchableOpacity
              style={[styles.socialButton, isLoading && styles.disabledButton]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleTermsPress}>
              <Text style={styles.footerLink}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}> | </Text>
            <TouchableOpacity onPress={handlePrivacyPress}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.black,
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 18,
    color: theme.gray,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.black,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.black,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 14,
    padding: 4,
  },
  continueButton: {
    backgroundColor: theme.buttonActive,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  noAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  noAccountText: {
    fontSize: 14,
    color: theme.gray,
  },
  signUpLink: {
    fontSize: 14,
    color: theme.buttonActive,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.lightGray,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: theme.gray,
    fontWeight: '500',
  },
  alternativeMethods: {
    marginBottom: 24,
  },
  socialButton: {
    backgroundColor: theme.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.black,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    color: theme.gray,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 12,
    color: theme.gray,
    marginHorizontal: 8,
  },
});

