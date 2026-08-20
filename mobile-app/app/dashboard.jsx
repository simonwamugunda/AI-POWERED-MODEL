import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Screen from '../components/Screen';
import StatCard from '../components/StatCard';
import PredictionCard from '../components/PredictionCard';
import { getScans } from '../services/storage';

export default function Dashboard() {
  const [scans, setScans] = useState([]);
  useFocusEffect(useCallback(() => { getScans().then(setScans); }, []));
  const recyclable = scans.filter(x => x.detectedClass !== 'TRASH').length;
  return <Screen active="dashboard"><ScrollView contentContainerStyle={s.page}>
    <Text style={s.eyebrow}>SORTIQ</Text><Text style={s.title}>Make every item count.</Text><Text style={s.copy}>Identify waste correctly and make better recycling choices.</Text>
    <TouchableOpacity style={s.scan} onPress={() => router.push('/scan')}><Text style={s.scanIcon}>⌾</Text><View><Text style={s.scanTitle}>Scan a waste item</Text><Text style={s.scanCopy}>Use camera or select a photo</Text></View><Text style={s.arrow}>›</Text></TouchableOpacity>
    <Text style={s.heading}>Your impact</Text><View style={s.stats}><StatCard value={scans.length} label="Total scans" /><StatCard value={recyclable} label="Recyclable" color="#1976D2" /></View>
    <View style={s.row}><Text style={s.heading}>Recent scans</Text><TouchableOpacity onPress={() => router.push('/history')}><Text style={s.link}>See all</Text></TouchableOpacity></View>
    {scans.slice(0, 3).map(scan => <PredictionCard key={scan.id} scan={scan} />)}{!scans.length && <View style={s.empty}><Text style={s.emptyIcon}>♻</Text><Text style={s.emptyTitle}>No scans yet</Text><Text style={s.emptyCopy}>Your recent recycling decisions will appear here.</Text></View>}
  </ScrollView></Screen>;
}
const s=StyleSheet.create({ page:{ padding:20, gap:14, paddingBottom:30 }, eyebrow:{ color:'#137A42', fontWeight:'800', letterSpacing:1.4, fontSize:12, marginTop:8 }, title:{ fontSize:30, fontWeight:'800', color:'#183124' }, copy:{ color:'#5A6E5F', lineHeight:20, marginBottom:8 }, scan:{ backgroundColor:'#137A42', borderRadius:20, padding:20, flexDirection:'row', alignItems:'center', gap:13, shadowColor:'#137A42', shadowOpacity:.2, shadowRadius:9, elevation:4 }, scanIcon:{ color:'#FFF', fontSize:30 }, scanTitle:{ color:'#FFF', fontSize:17, fontWeight:'800' }, scanCopy:{ color:'#DDF5E3', fontSize:12, marginTop:3 }, arrow:{ marginLeft:'auto', color:'#FFF', fontSize:32 }, heading:{ color:'#183124', fontWeight:'800', fontSize:17, marginTop:8 }, stats:{ flexDirection:'row', gap:12 }, row:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }, link:{ color:'#137A42', fontWeight:'700' }, empty:{ padding:28, alignItems:'center', backgroundColor:'#FFF', borderRadius:16, borderWidth:1, borderColor:'#E5EEE7' }, emptyIcon:{ fontSize:30 }, emptyTitle:{ fontWeight:'800', color:'#183124', marginTop:6 }, emptyCopy:{ color:'#617467', fontSize:12, marginTop:4, textAlign:'center' } });
