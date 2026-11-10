import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Dashboard from './app/dashboard';
import History from './app/history';
import Login from './app/login';
import Profile from './app/profile';
import Register from './app/register';
import Result from './app/result';
import Scan from './app/scan';
import Settings from './app/settings';
import Statistics from './app/statistics';
import LoadingIndicator from './components/LoadingIndicator';
import { AuthProvider, useAuth } from './context/AuthContext';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingIndicator label="Checking your account…" />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#F4F8F4' } }}>
        {user ? (
          <Stack.Group>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="History" component={History} />
            <Stack.Screen name="Scan" component={Scan} />
            <Stack.Screen name="Statistics" component={Statistics} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="Result" component={Result} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return <SafeAreaProvider><StatusBar barStyle="dark-content" backgroundColor="#F4F8F4" /><AuthProvider><AppNavigator /></AuthProvider></SafeAreaProvider>;
}
