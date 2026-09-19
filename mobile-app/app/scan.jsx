import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Screen from '../components/Screen';
import LoadingIndicator from '../components/LoadingIndicator';
import { predictImage } from '../services/api';

export default function Scan() {
  const [asset, setAsset] = useState(null); const [loading, setLoading] = useState(false);
  async function choose(source) {
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission needed', `Allow photo ${source === 'camera' ? 'camera' : 'library'} access to scan an item.`);
    // Android delegates `allowsEditing` to the device crop activity. On some
    // phones that activity prompts for a system/Photos download after taking a
    // new picture, before this app ever receives the image. Keep gallery
    // cropping, but return a camera capture directly to the scan preview.
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!result.canceled) setAsset(result.assets[0]);
  }
  async function analyze() { if (!asset || loading) return; setLoading(true); try { const prediction = await predictImage(asset); router.push({ pathname:'/result', params:{ scan: JSON.stringify({ ...prediction, imageUri: asset.uri, imageSize: { width: asset.width, height: asset.height }, analyzedAt: new Date().toISOString() }) } }); } catch(e) { Alert.alert('Prediction unavailable', e.message, [{ text: 'Try again', onPress: analyze }, { text: 'Cancel', style: 'cancel' }]); } finally { setLoading(false); } }
  return <Screen active="scan"><View style={s.page}><Text style={s.title}>Scan an item</Text><Text style={s.copy}>Take a clear photo of one waste item for the best result.</Text>{loading ? <LoadingIndicator label="Analyzing your item…" /> : asset ? <><Image source={{uri:asset.uri}} style={s.preview}/><TouchableOpacity style={s.primary} onPress={analyze}><Text style={s.primaryText}>Analyze waste item</Text></TouchableOpacity><TouchableOpacity style={s.secondary} onPress={() => setAsset(null)}><Text style={s.secondaryText}>Retake or choose another</Text></TouchableOpacity></> : <View style={s.options}><TouchableOpacity style={s.option} onPress={() => choose('camera')}><Text style={s.optionIcon}>⌾</Text><Text style={s.optionTitle}>Take a photo</Text><Text style={s.optionCopy}>Use your camera</Text></TouchableOpacity><TouchableOpacity style={s.option} onPress={() => choose('library')}><Text style={s.optionIcon}>▧</Text><Text style={s.optionTitle}>Choose from gallery</Text><Text style={s.optionCopy}>Select an existing photo</Text></TouchableOpacity></View>}<Text style={s.tip}>Tip: use good lighting and keep the item centered in the frame.</Text></View></Screen>;
}
const s=StyleSheet.create({ page:{padding:20, gap:14},title:{fontSize:29,fontWeight:'800',color:'#183124',marginTop:8},copy:{color:'#5A6E5F',lineHeight:20},options:{gap:13,marginTop:18},option:{backgroundColor:'#FFF',borderColor:'#DCE9DE',borderWidth:1,borderRadius:18,padding:22,alignItems:'center',gap:6},optionIcon:{fontSize:34,color:'#137A42'},optionTitle:{fontWeight:'800',fontSize:16,color:'#183124'},optionCopy:{fontSize:12,color:'#617467'},preview:{width:'100%',height:300,borderRadius:18,marginTop:8},primary:{backgroundColor:'#137A42',borderRadius:14,padding:17,alignItems:'center'},primaryText:{color:'#FFF',fontWeight:'800',fontSize:16},secondary:{padding:14,alignItems:'center'},secondaryText:{color:'#137A42',fontWeight:'700'},tip:{color:'#718175',fontSize:12,textAlign:'center',marginTop:8} });
