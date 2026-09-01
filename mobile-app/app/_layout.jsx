import { useEffect } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const isAuthScreen = segments[0] === 'login' || segments[0] === 'register';

  useEffect(() => {
    if (loading) return;
    if (!user && !isAuthScreen) router.replace('/login');
    if (user && isAuthScreen) router.replace('/dashboard');
  }, [isAuthScreen, loading, user]);

  if (loading) return null;
  return children;
}

export default function Layout() {
  return <AuthProvider><StatusBar style="dark" /><AuthGate><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} /></AuthGate></AuthProvider>;
}
