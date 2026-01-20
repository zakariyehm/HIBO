import { getCurrentUser, getUserProfile } from '@/lib/supabase';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF8' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // Redirect based on auth status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}

