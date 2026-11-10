import { useEffect } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoadingIndicator from '../components/LoadingIndicator';

function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const isAuthScreen = segments[0] === 'login' || segments[0] === 'register';
  const waitingForRedirect = !loading && ((!user && !isAuthScreen) || (user && isAuthScreen));

  useEffect(() => {
    if (loading) return;
    if (!user && !isAuthScreen) router.replace('/login');
    if (user && isAuthScreen) router.replace('/dashboard');
  }, [isAuthScreen, loading, user]);

  // Keep protected screens out of view while Firebase restores the session.
  if (loading) return <LoadingIndicator label="Checking your account…" />;
  if (waitingForRedirect) return <LoadingIndicator label={user ? 'Opening your account…' : 'Taking you to sign in…'} />;
  return children;
}

export default function Layout() {
  return <AuthProvider><StatusBar style="dark" /><AuthGate><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#F4F8F4' } }} /></AuthGate></AuthProvider>;
}
