import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Screen from '../components/Screen';
import { checkApiHealth } from '../services/api';
export default function Settings(){
	const [status,setStatus]=useState({loading:true,online:false,message:'Checking connection…'});
	const check=useCallback(async()=>{setStatus({loading:true,online:false,message:'Checking connection…'});const result=await checkApiHealth();setStatus({loading:false,...result});},[]);
	useFocusEffect(useCallback(()=>{check();},[check]));
	return <Screen noNav><View style={s.page}><Text style={s.title}>Settings</Text><View style={s.card}><View style={s.headingRow}><Text style={s.heading}>Detection service</Text><View style={[s.dot,{backgroundColor:status.loading?'#D5A72C':status.online?'#137A42':'#C94A45'}]}/></View><Text style={s.status}>{status.message}</Text>{status.loading?<ActivityIndicator color="#137A42"/>:<TouchableOpacity onPress={check}><Text style={s.link}>Check again</Text></TouchableOpacity>}<Text style={s.copy}>Set EXPO_PUBLIC_API_BASE_URL in your local .env file to connect the app to the deployed Flask API.</Text></View><View style={s.card}><Text style={s.heading}>Privacy</Text><Text style={s.copy}>Images are sent to the configured detection server only when you choose Analyze. Saved history is stored locally until Firebase is configured.</Text></View></View></Screen>;
};
const s=StyleSheet.create({page:{padding:20,gap:14},title:{fontSize:29,fontWeight:'800',color:'#183124',marginTop:8},card:{backgroundColor:'#FFF',padding:18,borderRadius:16,gap:9,borderWidth:1,borderColor:'#E5EEE7'},headingRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},heading:{fontWeight:'800',color:'#183124'},dot:{height:9,width:9,borderRadius:5},status:{color:'#183124',fontWeight:'700'},link:{color:'#137A42',fontWeight:'800'},copy:{color:'#617467',lineHeight:19,fontSize:13}});
