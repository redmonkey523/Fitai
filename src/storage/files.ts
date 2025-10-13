/**
 * File storage adapter - iOS/Android compliant
 * - iOS: Uses documentDirectory (backed up) and cacheDirectory (not backed up)
 * - Android: Uses app-specific internal storage (scoped storage compliant)
 * - Web: Falls back to IndexedDB for binary data
 */

import { Platform } from 'react-native';
import type { Files } from './types';

// Lazy load FileSystem (only available on native)
let FileSystem: any = null;
const getFileSystem = async () => {
  if (Platform.OS === 'web') return null;
  if (!FileSystem) {
    try {
      // Use legacy API for SDK 54 compatibility
      FileSystem = await import('expo-file-system/legacy');
    } catch (error) {
      console.warn('[FileStorage] expo-file-system not available');
      return null;
    }
  }
  return FileSystem;
};

// Web fallback using IndexedDB for files
const webFileStorage = {
  db: null as IDBDatabase | null,
  
  async init() {
    if (this.db) return this.db;
    if (typeof window === 'undefined') throw new Error('Web storage not available');
    
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('AppFiles', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'uri' });
        }
      };
    });
  },
  
  async read(uri: string): Promise<string | Uint8Array> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files'], 'readonly');
      const store = tx.objectStore('files');
      const request = store.get(uri);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          reject(new Error(`File not found: ${uri}`));
        }
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  async write(uri: string, data: string | Uint8Array): Promise<string> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files'], 'readwrite');
      const store = tx.objectStore('files');
      const request = store.put({ uri, data, timestamp: Date.now() });
      
      request.onsuccess = () => resolve(uri);
      request.onerror = () => reject(request.error);
    });
  },
  
  async remove(uri: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files'], 'readwrite');
      const store = tx.objectStore('files');
      const request = store.delete(uri);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async list(): Promise<string[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['files'], 'readonly');
      const store = tx.objectStore('files');
      const request = store.getAllKeys();
      
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  },
};

class FileStorage implements Files {
  private baseDir: { durable: string; cache: string } | null = null;

  private async ensureBaseDirs() {
    if (this.baseDir) return this.baseDir;

    const FS = await getFileSystem();
    if (!FS) {
      // Web fallback
      return { durable: 'idb://durable/', cache: 'idb://cache/' };
    }

    this.baseDir = {
      durable: FS.documentDirectory, // iOS: backed up to iCloud, Android: app-specific
      cache: FS.cacheDirectory,       // iOS: NOT backed up, Android: cache dir
    };

    // Ensure directories exist
    try {
      const durableInfo = await FS.getInfoAsync(this.baseDir.durable);
      if (!durableInfo.exists) {
        await FS.makeDirectoryAsync(this.baseDir.durable, { intermediates: true });
      }

      const cacheInfo = await FS.getInfoAsync(this.baseDir.cache);
      if (!cacheInfo.exists) {
        await FS.makeDirectoryAsync(this.baseDir.cache, { intermediates: true });
      }
    } catch (error) {
      console.error('[FileStorage] Failed to create directories:', error);
    }

    return this.baseDir;
  }

  async resolve(dir: 'durable' | 'cache', ...parts: string[]): Promise<string> {
    const dirs = await this.ensureBaseDirs();
    const base = dirs[dir];
    return base + parts.join('/');
  }

  async read(uri: string): Promise<string | Uint8Array> {
    try {
      if (Platform.OS === 'web') {
        return await webFileStorage.read(uri);
      }

      const FS = await getFileSystem();
      if (!FS) throw new Error('FileSystem not available');

      // Check if binary
      const info = await FS.getInfoAsync(uri);
      if (!info.exists) {
        throw new Error(`File not found: ${uri}`);
      }

      // Read as string by default
      return await FS.readAsStringAsync(uri);
    } catch (error) {
      console.error(`[FileStorage] Failed to read ${uri}:`, error);
      throw error;
    }
  }

  async write(
    filename: string,
    data: string | Uint8Array,
    opts?: { durable?: boolean }
  ): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        const uri = `idb://${opts?.durable ? 'durable' : 'cache'}/${filename}`;
        return await webFileStorage.write(uri, data);
      }

      const FS = await getFileSystem();
      if (!FS) throw new Error('FileSystem not available');

      const dir = opts?.durable !== false ? 'durable' : 'cache';
      const uri = await this.resolve(dir, filename);

      // Ensure parent directory exists
      const parentDir = uri.substring(0, uri.lastIndexOf('/'));
      await FS.makeDirectoryAsync(parentDir, { intermediates: true });

      if (typeof data === 'string') {
        await FS.writeAsStringAsync(uri, data);
      } else {
        // Convert Uint8Array to base64 for React Native
        const base64 = btoa(String.fromCharCode(...Array.from(data)));
        await FS.writeAsStringAsync(uri, base64, { encoding: FS.EncodingType.Base64 });
      }

      return uri;
    } catch (error) {
      console.error(`[FileStorage] Failed to write ${filename}:`, error);
      throw error;
    }
  }

  async list(dir: 'durable' | 'cache', subpath?: string): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        const all = await webFileStorage.list();
        const prefix = `idb://${dir}/` + (subpath || '');
        return all.filter(uri => uri.startsWith(prefix));
      }

      const FS = await getFileSystem();
      if (!FS) return [];

      const uri = await this.resolve(dir, subpath || '');
      const info = await FS.getInfoAsync(uri);
      
      if (!info.exists || !info.isDirectory) {
        return [];
      }

      return await FS.readDirectoryAsync(uri);
    } catch (error) {
      console.error(`[FileStorage] Failed to list ${dir}/${subpath}:`, error);
      return [];
    }
  }

  async remove(uri: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await webFileStorage.remove(uri);
        return;
      }

      const FS = await getFileSystem();
      if (!FS) return;

      await FS.deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.error(`[FileStorage] Failed to remove ${uri}:`, error);
    }
  }

  async exists(uri: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        try {
          await webFileStorage.read(uri);
          return true;
        } catch {
          return false;
        }
      }

      const FS = await getFileSystem();
      if (!FS) return false;

      const info = await FS.getInfoAsync(uri);
      return info.exists;
    } catch {
      return false;
    }
  }
}

export const files = new FileStorage();

