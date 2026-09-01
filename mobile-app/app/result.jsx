import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '../components/Screen';
import { saveScan } from '../services/storage';

function DetectionImage({ imageUri, imageSize: pickedImageSize, boxes = [] }) {
  const [imageSize, setImageSize] = useState(null);
  const [frameSize, setFrameSize] = useState(null);

  useEffect(() => {
    if (pickedImageSize?.width > 0 && pickedImageSize?.height > 0) {
      setImageSize(pickedImageSize);
      return;
    }
    Image.getSize(imageUri, (width, height) => setImageSize({ width, height }), () => setImageSize(null));
  }, [imageUri, pickedImageSize?.height, pickedImageSize?.width]);

  const scale = imageSize && frameSize ? Math.min(frameSize.width / imageSize.width, frameSize.height / imageSize.height) : 0;
  const renderedWidth = imageSize ? imageSize.width * scale : 0;
  const renderedHeight = imageSize ? imageSize.height * scale : 0;
  const offsetX = frameSize ? (frameSize.width - renderedWidth) / 2 : 0;
  const offsetY = frameSize ? (frameSize.height - renderedHeight) / 2 : 0;

  return <View style={s.imageFrame} onLayout={({ nativeEvent }) => setFrameSize(nativeEvent.layout)}>
    <Image source={{ uri: imageUri }} resizeMode="contain" style={s.image}/>
    {boxes.map((box, index) => {
      const left = offsetX + box.x1 * scale;
      const top = offsetY + box.y1 * scale;
      const width = Math.max(0, (box.x2 - box.x1) * scale);
      const height = Math.max(0, (box.y2 - box.y1) * scale);
      if (!scale || !Number.isFinite(left + top + width + height)) return null;
      return <View key={`${box.label}-${index}`} pointerEvents="none" style={[s.boundingBox, { left, top, width, height }]}>
        <Text numberOfLines={1} style={s.boxLabel}>{box.label} {Math.round(box.confidence * 100)}%</Text>
      </View>;
    })}
  </View>;
}

export default function Result() {
  const { scan: encoded } = useLocalSearchParams();
  let scan;
  try {
    scan = JSON.parse(encoded || '{}');
  } catch {
    scan = null;
  }
  const [saved, setSaved] = useState(false);
  async function save() { if (!scan || saved) return; await saveScan(scan); setSaved(true); }
  if (!scan?.imageUri) return <Screen noNav><View style={s.invalid}><Text style={s.invalidTitle}>Result unavailable</Text><Text style={s.guidance}>This scan result could not be opened. Start a new scan to continue.</Text><TouchableOpacity style={s.primary} onPress={() => router.replace('/scan')}><Text style={s.primaryText}>Start a new scan</Text></TouchableOpacity></View></Screen>;
  return <Screen noNav><ScrollView contentContainerStyle={s.page}><Text style={s.eyebrow}>ANALYSIS COMPLETE</Text><Text style={s.title}>Here’s what we found</Text><DetectionImage imageUri={scan.imageUri} imageSize={scan.imageSize} boxes={scan.boundingBoxes}/><View style={s.card}><Text style={s.label}>DETECTED ITEM</Text><Text style={s.item}>{scan.detectedClass}</Text><Text style={s.confidence}>{Math.round(scan.confidence * 100)}% confidence</Text><View style={s.divider}/><Text style={s.label}>RECOMMENDED BIN</Text><Text style={s.bin}>♻ {scan.recommendedBin}</Text><Text style={s.guidance}>Empty and rinse recyclable containers before placing them in the recommended bin.</Text></View><TouchableOpacity style={s.primary} onPress={() => router.replace('/scan')}><Text style={s.primaryText}>Scan another item</Text></TouchableOpacity><TouchableOpacity style={s.secondary} disabled={saved} onPress={save}><Text style={s.secondaryText}>{saved ? 'Saved to history' : 'Save result'}</Text></TouchableOpacity></ScrollView></Screen>;
}

const s = StyleSheet.create({
  page: { padding: 20, gap: 14, paddingBottom: 30 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.3, color: '#137A42', marginTop: 8 }, title: { fontSize: 27, fontWeight: '800', color: '#183124' },
  imageFrame: { width: '100%', height: 250, borderRadius: 18, overflow: 'hidden', backgroundColor: '#EAF1EB', position: 'relative' }, image: { width: '100%', height: '100%' },
  boundingBox: { position: 'absolute', borderWidth: 2, borderColor: '#26E77A', backgroundColor: 'rgba(19, 122, 66, 0.12)' }, boxLabel: { position: 'absolute', top: 0, left: 0, maxWidth: 150, paddingHorizontal: 5, paddingVertical: 3, backgroundColor: '#137A42', color: '#FFF', fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2ECE4', borderRadius: 18, padding: 20, gap: 8 }, label: { fontSize: 11, letterSpacing: 1, color: '#718175', fontWeight: '800' }, item: { fontSize: 25, fontWeight: '800', color: '#183124' }, confidence: { color: '#52665A' }, divider: { height: 1, backgroundColor: '#E5EEE7', marginVertical: 8 }, bin: { fontSize: 19, fontWeight: '800', color: '#137A42' }, guidance: { color: '#5A6E5F', lineHeight: 19, fontSize: 13, marginTop: 5 }, primary: { backgroundColor: '#137A42', borderRadius: 14, padding: 17, alignItems: 'center' }, primaryText: { color: '#FFF', fontWeight: '800' }, secondary: { alignItems: 'center', padding: 12 }, secondaryText: { color: '#137A42', fontWeight: '700' }, invalid: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 }, invalidTitle: { fontSize: 28, fontWeight: '800', color: '#183124' },
});
