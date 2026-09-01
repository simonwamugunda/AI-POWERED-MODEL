import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../components/Screen';
import { signIn } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [submitting, setSubmitting] = useState(false);
  const { configurationError } = useAuth();
  async function submit() { if (!email || !password) return Alert.alert('Missing details', 'Enter your email and password.'); setSubmitting(true); try { await signIn(email, password); router.replace('/dashboard'); } catch (error) { Alert.alert('Unable to sign in', error.message); } finally { setSubmitting(false); } }
  return <Screen noNav><View style={s.page}><Text style={s.title}>Sign in</Text><Text style={s.copy}>Use your SortIQ account to keep your scans connected to you.</Text>{configurationError && <Text style={s.error}>{configurationError}</Text>}<TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email address"/><TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password"/><TouchableOpacity style={[s.button, submitting && s.disabled]} disabled={submitting} onPress={submit}><Text style={s.buttonText}>{submitting ? 'Signing in…' : 'Sign in'}</Text></TouchableOpacity><TouchableOpacity onPress={() => router.push('/register')}><Text style={s.link}>Create an account</Text></TouchableOpacity></View></Screen>;
}
const s = StyleSheet.create({ page: { padding: 20, gap: 14 }, title: { fontSize: 30, fontWeight: '800', color: '#183124', marginTop: 20 }, copy: { color: '#617467', lineHeight: 20 }, input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DCE9DE', borderRadius: 12, padding: 15, color: '#183124' }, button: { backgroundColor: '#137A42', padding: 16, borderRadius: 14, alignItems: 'center' }, disabled: { opacity: .6 }, buttonText: { color: '#FFF', fontWeight: '800' }, link: { color: '#137A42', fontWeight: '700', textAlign: 'center', padding: 8 }, error: { backgroundColor: '#FFF0F0', color: '#B3261E', padding: 12, borderRadius: 10, lineHeight: 19 } });
