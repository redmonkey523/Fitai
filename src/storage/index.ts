/**
 * Platform-compliant storage module
 * 
 * iOS: Uses app container storage (documentDirectory for durable, cacheDirectory for cache)
 * Android: Uses scoped storage (app-specific internal directories)
 * Web: Uses IndexedDB for large data, sessionStorage for secure data
 * 
 * USAGE:
 * ```ts
 * import { storage } from './storage';
 * 
 * // Key-value
 * await storage.kv.setItem('user:settings', { theme: 'dark' });
 * const settings = await storage.kv.getItem<Settings>('user:settings');
 * 
 * // Secure (tokens, credentials)
 * await storage.secure.set('auth:token', token);
 * const token = await storage.secure.get('auth:token');
 * 
 * // Files
 * await storage.files.write('document.pdf', pdfData, { durable: true });
 * const data = await storage.files.read('document.pdf');
 * 
 * // Database
 * await storage.db.execute('INSERT INTO users (name) VALUES (?)', ['John']);
 * const users = await storage.db.execute('SELECT * FROM users');
 * ```
 */

import { kv } from './kv';
import { secure } from './secure';
import { files } from './files';
import { db } from './db';
import { migrate, shouldMigrate, cleanOldCaches } from './migrate';

import type { StorageAdapter } from './types';

export const storage: StorageAdapter = {
  kv,
  secure,
  files,
  db,
};

// Re-export types
export type {
  KV,
  Secure,
  Files,
  DB,
  StorageAdapter,
  StorageType,
  MigrationResult,
} from './types';

// Re-export migration utilities
export { migrate, shouldMigrate, cleanOldCaches };

/**
 * Initialize storage (run migration if needed)
 * Call this before rendering your app
 */
export async function initStorage(): Promise<void> {
  try {
    // Run migration if needed (silent)
    if (await shouldMigrate()) {
      await migrate();
    }

    // Initialize database (silent)
    if (db) {
      await db.execute('SELECT 1'); // Trigger init
    }

    // Clean old caches (async, don't await, silent)
    cleanOldCaches().catch(() => {});
  } catch (error) {
    // Don't throw - allow app to continue even if storage init fails
  }
}

export default storage;

