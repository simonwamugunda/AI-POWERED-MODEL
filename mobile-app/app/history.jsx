import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Screen from '../components/Screen';
import PredictionCard from '../components/PredictionCard';
import { deleteScan, getScans } from '../services/storage';
export default function History(){const [scans,setScans]=useState([]); const load=()=>getScans().then(setScans);useFocusEffect(useCallback(()=>{load();},[]));const remove=id=>Alert.alert('Delete scan?','This removes the result from this device.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{await deleteScan(id);load();}}]);return <Screen active="history"><View style={s.page}><Text style={s.title}>Scan history</Text><Text style={s.copy}>Saved results on this device.</Text><FlatList data={scans} contentContainerStyle={{gap:10,paddingTop:16,paddingBottom:40}} keyExtractor={x=>x.id} renderItem={({item})=><TouchableOpacity onLongPress={()=>remove(item.id)}><PredictionCard scan={item}/></TouchableOpacity>} ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTitle}>No saved scans</Text><Text style={s.copy}>Save a prediction to see it here.</Text></View>}/></View></Screen>}
const s=StyleSheet.create({page:{flex:1,padding:20},title:{fontSize:29,fontWeight:'800',color:'#183124',marginTop:8},copy:{color:'#617467',marginTop:5},empty:{backgroundColor:'#FFF',marginTop:22,padding:28,borderRadius:16,alignItems:'center'},emptyTitle:{fontWeight:'800',color:'#183124',marginBottom:4}});
