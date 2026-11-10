import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from './BottomNav';
export default function Screen({ children, active, noNav = false }) {
  return <SafeAreaView style={styles.safe}><View style={styles.content}>{children}</View>{!noNav && <BottomNav active={active} />}</SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F4F8F4' }, content: { flex: 1 } });
