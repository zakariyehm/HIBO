/**
 * Login Screen - HIBO Dating App
 * Sign in screen for existing users
 */

import { Toast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { getUserProfile, signInWithEmail } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

    try {
      // console.log('🔐 Attempting login for:', email.trim());
      
      // Sign in with Supabase
      const { data, error } = await signInWithEmail(email.trim(), password);

      if (error) {
        console.error('❌ Sign in error:', error);
        
        // Handle specific error messages
        if (error.message.includes('Invalid login credentials')) {
          showNotification('Incorrect email or password. Please try again.', 'error');
        } else if (error.message.includes('Email not confirmed')) {
          showNotification('Please verify your email address before signing in.', 'error');
        } else {
          showNotification(error.message || 'Failed to sign in. Please try again.', 'error');
        }
        
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        console.error('❌ No user data returned');
        showNotification('Failed to sign in. Please try again.', 'error');
        setIsLoading(false);
        return;
      }

      // console.log('✅ User authenticated:', data.user.id);

      // Check if user has a profile
      // console.log('📋 Checking for user profile...');
      const { data: profileData, error: profileError } = await getUserProfile(data.user.id);

      if (profileError || !profileData) {
        // User signed in but profile doesn't exist - redirect to onboarding
        console.warn('⚠️  Profile not found, redirecting to onboarding');
        showNotification('Please complete your profile setup.', 'info');
        setTimeout(() => {
          router.replace('/onboarding');
        }, 1000);
        setIsLoading(false);
        return;
      }

      // Success!
      // console.log('✅ Profile found! Logging in...');
      // console.log('👤 Welcome:', profileData.first_name, profileData.last_name);
      showNotification(`Welcome back, ${profileData.first_name}!`, 'success');
      
      // Navigate to home after successful login
      setTimeout(() => {
        // console.log('🚀 Navigating to home screen...');
        router.replace('/(tabs)');
      }, 1000);
      
    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      showNotification('An unexpected error occurred. Please try again.', 'error');
      setIsLoading(false);
    }
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
            <Button
              title={isLoading ? 'Signing in...' : 'Login'}
              onPress={handleSignIn}
              variant="primary"
              size="large"
              disabled={isLoading}
              loading={isLoading}
              style={styles.continueButton}
              textStyle={styles.continueButtonText}
            />

            {/* Don't have account */}
            <View style={styles.noAccountContainer}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/onboarding')}>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 0,
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
    marginBottom: 150,
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
    borderRadius: 0,
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
    fontSize: 16,
    fontWeight: '600',
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

