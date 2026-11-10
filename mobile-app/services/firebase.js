import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

// Also accepts values copied from Firebase's JavaScript object (for example
// `"AIza...",`) while .env is being converted to plain KEY=value entries.
function cleanEnvValue(value) {
  return String(value ?? '')
    .trim()
    .replace(/^['"]|['"][,]?$/g, '')
    .replace(/,$/, '');
}

const firebaseConfig = {
  apiKey: cleanEnvValue(Config.FIREBASE_API_KEY),
  authDomain: cleanEnvValue(Config.FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvValue(Config.FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvValue(Config.FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvValue(Config.FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvValue(Config.FIREBASE_APP_ID),
};

export const firebaseIsConfigured = Object.values(firebaseConfig).every(Boolean);

let auth;

export function getFirebaseAuth() {
  if (!firebaseIsConfigured) {
    throw new Error('Firebase is not configured. Add the FIREBASE_* values to mobile-app/.env.');
  }

  if (auth) return auth;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    auth = getAuth(app);
  }
  return auth;
}
