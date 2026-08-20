import { ActivityIndicator, Text, View } from 'react-native';
export default function LoadingIndicator({ label = 'Loading…' }) { return <View style={{ alignItems: 'center', padding: 24, gap: 10 }}><ActivityIndicator color="#137A42" size="large" /><Text style={{ color: '#52665A' }}>{label}</Text></View>; }
