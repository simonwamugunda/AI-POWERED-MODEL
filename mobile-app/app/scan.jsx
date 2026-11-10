import { useState } from 'react';
import { Alert, Image, Linking, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import LoadingIndicator from '../components/LoadingIndicator';
import { predictImage } from '../services/api';

export default function Scan() {
  const navigation = useNavigation();
  const [asset, setAsset] = useState(null); const [loading, setLoading] = useState(false);
  async function choose(source) {
    if (source === 'camera' && Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Allow camera access',
        message: 'SortIQ needs camera access to take a photo of the item you want to scan.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        const blocked = permission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
        Alert.alert(
          'Camera permission required',
          blocked ? 'Allow camera access in Settings to take a photo.' : 'Allow camera access to take a photo.',
          blocked
            ? [{ text: 'Cancel', style: 'cancel' }, { text: 'Open settings', onPress: () => Linking.openSettings() }]
            : [{ text: 'OK' }],
        );
        return;
      }
    }
    const options = { mediaType: 'photo', quality: 0.7, selectionLimit: 1, saveToPhotos: false };
    const result = source === 'camera' ? await launchCamera(options) : await launchImageLibrary(options);
    if (result.errorCode) return Alert.alert('Unable to open photos', result.errorMessage || 'Check the app permissions and try again.');
    if (result.assets?.length) setAsset(result.assets[0]);
  }
  async function analyze() { if (!asset || loading) return; setLoading(true); try { const prediction = await predictImage(asset); navigation.navigate('Result', { scan: JSON.stringify({ ...prediction, imageUri: asset.uri, imageSize: { width: asset.width, height: asset.height }, analyzedAt: new Date().toISOString() }) }); } catch(e) { Alert.alert('Prediction unavailable', e.message, [{ text: 'Try again', onPress: analyze }, { text: 'Cancel', style: 'cancel' }]); } finally { setLoading(false); } }
  return <Screen active="scan"><View style={s.page}><Text style={s.title}>Scan an item</Text><Text style={s.copy}>Take a clear photo of one waste item for the best result.</Text>{loading ? <LoadingIndicator label="Analyzing your item…" /> : asset ? <><Image source={{uri:asset.uri}} style={s.preview}/><TouchableOpacity style={s.primary} onPress={analyze}><Text style={s.primaryText}>Analyze waste item</Text></TouchableOpacity><TouchableOpacity style={s.secondary} onPress={() => setAsset(null)}><Text style={s.secondaryText}>Retake or choose another</Text></TouchableOpacity></> : <View style={s.options}><TouchableOpacity style={s.option} onPress={() => choose('camera')}><Text style={s.optionIcon}>⌾</Text><Text style={s.optionTitle}>Take a photo</Text><Text style={s.optionCopy}>Use your camera</Text></TouchableOpacity><TouchableOpacity style={s.option} onPress={() => choose('library')}><Text style={s.optionIcon}>▧</Text><Text style={s.optionTitle}>Choose from gallery</Text><Text style={s.optionCopy}>Select an existing photo</Text></TouchableOpacity></View>}<Text style={s.tip}>Tip: use good lighting and keep the item centered in the frame.</Text></View></Screen>;
}
const s=StyleSheet.create({ page:{padding:20, gap:14},title:{fontSize:29,fontWeight:'800',color:'#183124',marginTop:8},copy:{color:'#5A6E5F',lineHeight:20},options:{gap:13,marginTop:18},option:{backgroundColor:'#FFF',borderColor:'#DCE9DE',borderWidth:1,borderRadius:18,padding:22,alignItems:'center',gap:6},optionIcon:{fontSize:34,color:'#137A42'},optionTitle:{fontWeight:'800',fontSize:16,color:'#183124'},optionCopy:{fontSize:12,color:'#617467'},preview:{width:'100%',height:300,borderRadius:18,marginTop:8},primary:{backgroundColor:'#137A42',borderRadius:14,padding:17,alignItems:'center'},primaryText:{color:'#FFF',fontWeight:'800',fontSize:16},secondary:{padding:14,alignItems:'center'},secondaryText:{color:'#137A42',fontWeight:'700'},tip:{color:'#718175',fontSize:12,textAlign:'center',marginTop:8} });
