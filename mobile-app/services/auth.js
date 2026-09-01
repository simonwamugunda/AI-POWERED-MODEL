import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

export function subscribeToAuth(callback) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export function register(email, password) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export function logOut() {
  return signOut(getFirebaseAuth());
}
