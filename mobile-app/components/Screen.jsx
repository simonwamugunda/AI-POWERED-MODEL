import { SafeAreaView, StyleSheet, View } from 'react-native';
import BottomNav from './BottomNav';
export default function Screen({ children, active, noNav = false }) {
  return <SafeAreaView style={styles.safe}><View style={styles.content}>{children}</View>{!noNav && <BottomNav active={active} />}</SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F6FAF7' }, content: { flex: 1 } });
