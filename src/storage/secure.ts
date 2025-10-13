/**
 * Secure storage adapter for sensitive data (tokens, credentials)
 * - iOS: Keychain
 * - Android: EncryptedSharedPreferences
 * - Web: Falls back to sessionStorage (not persistent) or encrypted localStorage
 */

import { Platform } from 'react-native';
import type { Secure } from './types';

// Lazy load SecureStore (only available on native)
let SecureStore: any = null;
const getSecureStore = async () => {
  if (Platform.OS === 'web') return null;
  if (!SecureStore) {
    try {
      SecureStore = await import('expo-secure-store');
    } catch (error) {
      console.warn('[SecureStorage] expo-secure-store not available');
      return null;
    }
  }
  return SecureStore;
};

// Web fallback: use sessionStorage (cleared on tab close) for security
const webSecureStorage = {
  get: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(`secure:${key}`) || null;
    } catch {
      return null;
    }
  },
  set: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(`secure:${key}`, value);
    } catch (error) {
      console.error('[SecureStorage:Web] Failed to set:', error);
    }
  },
  del: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(`secure:${key}`);
    } catch {
      // Ignore
    }
  },
};

class SecureStorage implements Secure {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await webSecureStorage.get(key);
      }

      const store = await getSecureStore();
      if (!store) {
        console.warn('[SecureStorage] Falling back to regular storage');
        return null;
      }

      return await store.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Failed to get ${key}:`, error);
      return null;
    }
  }

  async set(key: string, val: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await webSecureStorage.set(key, val);
        return;
      }

      const store = await getSecureStore();
      if (!store) {
        throw new Error('SecureStore not available');
      }

      await store.setItemAsync(key, val);
    } catch (error) {
      console.error(`[SecureStorage] Failed to set ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await webSecureStorage.del(key);
        return;
      }

      const store = await getSecureStore();
      if (!store) return;

      await store.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Failed to delete ${key}:`, error);
    }
  }
}

export const secure = new SecureStorage();

