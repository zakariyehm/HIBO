import { getCurrentUser, getUserProfile } from '@/lib/supabase';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Add slight delay for smooth splash experience
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const { user, error } = await getCurrentUser();

      if (error || !user) {
        console.log('❌ No authenticated user found');
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      console.log('✅ User authenticated:', user.id);

      // Check if user has a profile
      const { data: profileData, error: profileError } = await getUserProfile(user.id);

      if (profileError || !profileData) {
        console.log('⚠️  Profile not found, redirecting to onboarding');
        // User authenticated but no profile - they should complete onboarding
        // But for now, we'll log them out and redirect to welcome
        setIsAuthenticated(false);
      } else {
        console.log('✅ Profile found, redirecting to home');
        setIsAuthenticated(true);
      }

      setIsCheckingAuth(false);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
        
        {/* HIBO Logo/Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>HIBO</Text>
          </View>
        </View>
        
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Redirect based on auth status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#CDAEF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 60,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#9AED8E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

