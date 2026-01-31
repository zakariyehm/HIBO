import { getCurrentUser, getUserProfile } from '@/lib/supabase';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check authentication while native splash screen is showing
      const { user, error } = await getCurrentUser();

      if (error || !user) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      // Check if user has a profile
      const { data: profileData, error: profileError } = await getUserProfile(user.id);

      if (profileError || !profileData) {
        // User authenticated but no profile - redirect to welcome
        setIsAuthenticated(false);
      } else {
        // User authenticated and has profile - redirect to home
        setIsAuthenticated(true);
      }

      setIsCheckingAuth(false);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
    }
  };

  // Show nothing while checking - native splash screen from app.json will be displayed
  if (isCheckingAuth) {
    return null;
  }

  // Redirect based on auth status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
