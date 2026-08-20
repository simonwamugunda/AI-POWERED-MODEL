import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@sortiq/scans';
export async function getScans() { return JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'); }
export async function saveScan(scan) { const scans = await getScans(); const saved = { ...scan, id: String(Date.now()), createdAt: new Date().toISOString() }; await AsyncStorage.setItem(KEY, JSON.stringify([saved, ...scans])); return saved; }
export async function deleteScan(id) { const scans = await getScans(); await AsyncStorage.setItem(KEY, JSON.stringify(scans.filter(scan => scan.id !== id))); }
