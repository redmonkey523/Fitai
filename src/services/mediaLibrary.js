// Simple client-side media library using AsyncStorage (native) or localStorage (web)
// Item shape: { url, type: 'image'|'video', name, uploadedAt, status: 'ready'|'processing'|'failed'|'deleted' }

const STORAGE_KEY = 'mediaLibrary';

async function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      async getItem(key) { return window.localStorage.getItem(key); },
      async setItem(key, value) { window.localStorage.setItem(key, value); },
    };
  }
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return AsyncStorage;
  } catch {
    // Fallback no-op storage
    return {
      async getItem() { return null; },
      async setItem() { return; },
    };
  }
}

export async function addMediaItem(item) {
  const store = await getStorage();
  const currentRaw = await store.getItem(STORAGE_KEY);
  const current = currentRaw ? JSON.parse(currentRaw) : [];
  const newItem = {
    ...item,
    uploadedAt: item.uploadedAt || new Date().toISOString(),
    status: item.status || 'ready',
  };
  const updated = [newItem, ...current].slice(0, 200); // cap to 200 items
  await store.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newItem;
}

export async function getMediaLibrary() {
  const store = await getStorage();
  const raw = await store.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function updateMediaStatus(url, status) {
  const store = await getStorage();
  const raw = await store.getItem(STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const updated = list.map((it) => (it.url === url ? { ...it, status } : it));
  await store.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function markMediaDeleted(url) {
  return updateMediaStatus(url, 'deleted');
}

export async function updateMedia(url, patch) {
  const store = await getStorage();
  const raw = await store.getItem(STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const updated = list.map((it) => (it.url === url ? { ...it, ...patch } : it));
  await store.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export default { addMediaItem, getMediaLibrary };


