/**
 * Key-Value storage adapter
 * - Native: AsyncStorage (app-specific internal storage)
 * - Web: IndexedDB for large data (>1MB), localStorage fallback for small
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KV } from './types';

const WEB_SIZE_THRESHOLD = 1024 * 1024; // 1MB

// Web IndexedDB wrapper (lazy loaded)
let idbKeyval: any = null;
const getIDB = async () => {
  if (Platform.OS !== 'web') return null;
  if (!idbKeyval) {
    try {
      idbKeyval = await import('idb-keyval');
    } catch {
      // idb-keyval not installed, fall back to localStorage
      return null;
    }
  }
  return idbKeyval;
};

class KVStorage implements KV {
  private useIDB(key: string, value?: any): boolean {
    if (Platform.OS !== 'web') return false;
    // Use IDB for keys prefixed with 'idb:' or large values
    if (key.startsWith('idb:')) return true;
    if (value && JSON.stringify(value).length > WEB_SIZE_THRESHOLD) return true;
    return false;
  }

  async getItem<T = string>(key: string): Promise<T | null> {
    try {
      if (this.useIDB(key)) {
        const idb = await getIDB();
        if (idb) {
          const value = await idb.get(key);
          return value === undefined ? null : value;
        }
      }

      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error(`[KV] Failed to get ${key}:`, error);
      return null;
    }
  }

  async setItem<T = string>(key: string, value: T): Promise<void> {
    try {
      if (this.useIDB(key, value)) {
        const idb = await getIDB();
        if (idb) {
          await idb.set(key, value);
          return;
        }
      }

      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`[KV] Failed to set ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.useIDB(key)) {
        const idb = await getIDB();
        if (idb) {
          await idb.del(key);
          return;
        }
      }

      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[KV] Failed to remove ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();

      // Clear IDB if on web
      if (Platform.OS === 'web') {
        const idb = await getIDB();
        if (idb) {
          await idb.clear();
        }
      }
    } catch (error) {
      console.error('[KV] Failed to clear:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('[KV] Failed to get all keys:', error);
      return [];
    }
  }
}

export const kv = new KVStorage();

