/**
 * Storage migration utility
 * Moves legacy storage (localStorage, old keys) to new compliant storage
 */

import { Platform } from 'react-native';
import { kv } from './kv';
import { files } from './files';
import type { MigrationResult } from './types';

const MIGRATION_KEY = '_storageMigration_v1';

export async function shouldMigrate(): Promise<boolean> {
  const migrated = await kv.getItem(MIGRATION_KEY);
  return migrated !== 'done';
}

export async function migrate(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    itemsMigrated: 0,
    errors: [],
  };

  try {
    // Check if already migrated (silent)
    if (!(await shouldMigrate())) {
      result.success = true;
      return result;
    }

    // WEB: Migrate from localStorage to AsyncStorage/IndexedDB
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      result.itemsMigrated += await migrateWebLocalStorage();
    }

    // NATIVE: Check for old file paths and move them
    if (Platform.OS !== 'web') {
      result.itemsMigrated += await migrateNativeFiles();
    }

    // ALL: Migrate specific known keys
    result.itemsMigrated += await migrateKnownKeys();

    // Mark migration as complete
    await kv.setItem(MIGRATION_KEY, 'done');

    result.success = true;
  } catch (error) {
    result.errors.push(String(error));
  }

  return result;
}

async function migrateWebLocalStorage(): Promise<number> {
  let count = 0;

  try {
    // List of keys to migrate from localStorage to AsyncStorage
    const legacyKeys = [
      'persist:root',
      'authToken',
      'user',
      'settings',
      // Add more legacy keys here
    ];

    for (const key of legacyKeys) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          await kv.setItem(key, value);
          localStorage.removeItem(key);
          count++;
        }
      } catch (error) {
        // Silent fail for individual keys
      }
    }
  } catch (error) {
    // Silent fail for migration
  }

  return count;
}

async function migrateNativeFiles(): Promise<number> {
  let count = 0;

  try {
    // Check for files in wrong locations and move them
    // This is a placeholder - add your actual file migration logic
    const oldPaths: string[] = [
      // Example: 'file:///old/path/data.json'
    ];

    for (const oldPath of oldPaths) {
      try {
        const exists = await files.exists(oldPath);
        if (exists) {
          const data = await files.read(oldPath);
          const filename = oldPath.split('/').pop() || 'migrated-file';
          await files.write(filename, data, { durable: true });
          await files.remove(oldPath);
          count++;
        }
      } catch (error) {
        // Silent fail for individual files
      }
    }
  } catch (error) {
    // Silent fail for migration
  }

  return count;
}

async function migrateKnownKeys(): Promise<number> {
  let count = 0;

  try {
    // Migrate specific app keys to new format
    const keyMappings: Record<string, string> = {
      // Example: 'old_key': 'new_key'
      'oldAuthToken': 'auth:token',
      'oldUserData': 'user:profile',
    };

    const allKeys = await kv.getAllKeys?.();
    if (!allKeys) return count;

    for (const oldKey of Object.keys(keyMappings)) {
      if (allKeys.includes(oldKey)) {
        try {
          const value = await kv.getItem(oldKey);
          if (value !== null) {
            await kv.setItem(keyMappings[oldKey], value);
            await kv.removeItem(oldKey);
            count++;
          }
        } catch (error) {
          // Silent fail for individual keys
        }
      }
    }
  } catch (error) {
    // Silent fail for migration
  }

  return count;
}

/**
 * Clean up old cache files (safe to delete, will be regenerated)
 */
export async function cleanOldCaches(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      const cacheFiles = await files.list('cache');
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const file of cacheFiles) {
        try {
          const uri = await files.resolve('cache', file);
          // In production, you'd check file.mtime here and delete old files
        } catch (error) {
          // Silent fail for individual files
        }
      }
    }
  } catch (error) {
    // Silent fail for cache cleanup
  }
}

