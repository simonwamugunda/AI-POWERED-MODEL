const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const TIMEOUT_MS = 30000;

export async function predictImage(asset) {
  if (!BASE_URL) throw new Error('The detection server is not configured. Add EXPO_PUBLIC_API_BASE_URL to .env.');
  const body = new FormData();
  body.append('file', { uri: asset.uri, name: asset.fileName || `scan-${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/predict`, { method: 'POST', body, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The detection server could not process this image.');
    return normalisePrediction(data);
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The detection server took too long. Please try again.');
    if (error.message === 'Network request failed') throw new Error('Unable to connect to the detection server. Check your internet connection and try again.');
    throw error;
  } finally { clearTimeout(timer); }
}

// Adapts the actual Flask response without requiring any backend change.
function normalisePrediction(data) {
  const top = (data.detectedItems || []).reduce((best, item) => !best || item.confidence > best.confidence ? item : best, null);
  return { detectedClass: top?.label || data.class || 'No item detected', confidence: top?.confidence ?? data.confidence ?? 0, recommendedBin: data.recommendedBin || data.bin || 'General waste bin', detectedItems: data.detectedItems || [], boundingBoxes: data.boundingBoxes || [], summary: data.summary || 'Prediction complete.' };
}
