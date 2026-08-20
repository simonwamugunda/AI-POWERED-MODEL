import { StyleSheet, Text, View } from 'react-native';
export default function StatCard({ value, label, color = '#137A42' }) { return <View style={s.card}><Text style={[s.value, { color }]}>{value}</Text><Text style={s.label}>{label}</Text></View>; }
const s = StyleSheet.create({ card:{ flex:1, backgroundColor:'#FFF', padding:16, borderRadius:16, gap:6, borderWidth:1, borderColor:'#E5EEE7' }, value:{ fontSize:24, fontWeight:'800' }, label:{ color:'#617467', fontSize:12, fontWeight:'600' } });
