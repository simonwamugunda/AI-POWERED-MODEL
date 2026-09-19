import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TIMEOUT_MS = 30000;

function getEndpoint(path) {
  if (!BASE_URL) throw new Error('The detection server is not configured. Add EXPO_PUBLIC_API_BASE_URL to .env.');
  return `${BASE_URL.replace(/\/$/, '')}${path}`;
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || (response.status >= 500 ? 'The detection server is temporarily unavailable.' : 'The detection server rejected this request.');
    throw new Error(message);
  }
  return data;
}

export async function checkApiHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const data = await fetch(getEndpoint('/'), { signal: controller.signal }).then(readResponse);
    return { online: true, message: data.message || 'Detection service online.' };
  } catch (error) {
    if (error.name === 'AbortError') return { online: false, message: 'The detection service did not respond.' };
    if (error.message === 'Network request failed') return { online: false, message: 'Unable to reach the detection service.' };
    return { online: false, message: error.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function predictImage(asset) {
  if (!asset?.uri) throw new Error('Choose an image before analyzing.');
  const body = new FormData();
  const fileName = asset.fileName || `scan-${Date.now()}.jpg`;

  // Browsers require an actual Blob/File in FormData. Native Expo accepts the
  // uri/name/type object, so retain that format for Android and iOS.
  if (Platform.OS === 'web') {
    const imageResponse = await fetch(asset.uri);
    if (!imageResponse.ok) throw new Error('Could not read the selected image. Please choose it again.');
    const imageBlob = await imageResponse.blob();
    body.append('file', imageBlob, fileName);
  } else {
    body.append('file', { uri: asset.uri, name: fileName, type: asset.mimeType || 'image/jpeg' });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(getEndpoint('/predict'), { method: 'POST', body, signal: controller.signal });
    return normalisePrediction(await readResponse(response));
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The detection server took too long. Please try again.');
    if (error.message === 'Network request failed') throw new Error('Unable to connect to the detection server. Check your internet connection and try again.');
    throw error;
  } finally { clearTimeout(timer); }
}

// Adapts the actual Flask response without requiring any backend change.
function normalisePrediction(data) {
  const detectedItems = Array.isArray(data.detectedItems) ? data.detectedItems.filter(item => item?.label) : [];
  const boundingBoxes = Array.isArray(data.boundingBoxes) ? data.boundingBoxes : [];
  const top = detectedItems.reduce((best, item) => !best || Number(item.confidence) > Number(best.confidence) ? item : best, null);
  const confidence = Number(top?.confidence ?? data.confidence ?? 0);
  return {
    detectedClass: top?.label || data.class || 'No item detected',
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    recommendedBin: data.recommendedBin || data.bin || 'General waste bin',
    detectedItems,
    boundingBoxes,
    summary: data.summary || 'Prediction complete.',
  };
}
