import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@sortiq/scans';
export async function getScans() {
	try {
		const value = await AsyncStorage.getItem(KEY);
		const scans = value ? JSON.parse(value) : [];
		return Array.isArray(scans) ? scans : [];
	} catch {
		return [];
	}
}
export async function saveScan(scan) {
	const scans = await getScans();
	const saved = { ...scan, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
	await AsyncStorage.setItem(KEY, JSON.stringify([saved, ...scans]));
	return saved;
}
export async function deleteScan(id) {
	const scans = await getScans();
	await AsyncStorage.setItem(KEY, JSON.stringify(scans.filter(scan => scan.id !== id)));
}
