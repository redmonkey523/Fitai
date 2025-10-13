/**
 * SQLite database adapter
 * - iOS/Android: expo-sqlite (stored in app container)
 * - Web: Web SQL (deprecated) or falls back to IndexedDB
 */

import { Platform } from 'react-native';
import type { DB } from './types';

let SQLite: any = null;
const getSQLite = async () => {
  if (Platform.OS === 'web') return null; // Web doesn't have reliable SQL support
  if (!SQLite) {
    try {
      SQLite = await import('expo-sqlite');
    } catch (error) {
      console.warn('[DB] expo-sqlite not available');
      return null;
    }
  }
  return SQLite;
};

class Database implements DB {
  private db: any = null;
  private dbName = 'app.db';

  async init(): Promise<void> {
    if (this.db) return;

    const SQLiteModule = await getSQLite();
    if (!SQLiteModule) {
      console.warn('[DB] SQLite not available on this platform');
      return;
    }

    this.db = await SQLiteModule.openDatabaseAsync(this.dbName);
    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) return;

    try {
      // Create migrations table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add your schema migrations here
      const migrations = [
        {
          version: 1,
          sql: `
            -- Example: Create a settings table
            CREATE TABLE IF NOT EXISTS app_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `,
        },
        {
          version: 2,
          sql: `
            -- Meals tracking table
            CREATE TABLE IF NOT EXISTS meals (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              time TEXT NOT NULL,
              name TEXT NOT NULL,
              foodId TEXT,
              serving REAL,
              unit TEXT,
              kcal REAL,
              protein REAL,
              carbs REAL,
              fat REAL,
              source TEXT,
              pending INTEGER DEFAULT 0,
              createdAt TEXT NOT NULL
            );
            
            -- Hydration tracking table
            CREATE TABLE IF NOT EXISTS hydration (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              ml INTEGER NOT NULL,
              createdAt TEXT NOT NULL
            );
            
            -- Goals table
            CREATE TABLE IF NOT EXISTS goals (
              id TEXT PRIMARY KEY,
              sex TEXT,
              age INTEGER,
              height_cm INTEGER,
              weight_kg REAL,
              activity TEXT,
              target TEXT,
              createdAt TEXT NOT NULL
            );
            
            -- Progress photos table
            CREATE TABLE IF NOT EXISTS photos (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              uri TEXT NOT NULL,
              note TEXT,
              createdAt TEXT NOT NULL
            );

            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
            CREATE INDEX IF NOT EXISTS idx_hydration_date ON hydration(date);
          `,
        },
        {
          version: 3,
          sql: `
            -- Routines table
            CREATE TABLE IF NOT EXISTS routines (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              difficulty TEXT,
              createdAt TEXT NOT NULL
            );
            
            -- Routine days/exercises table
            CREATE TABLE IF NOT EXISTS routine_days (
              id TEXT PRIMARY KEY,
              routineId TEXT NOT NULL,
              day INTEGER NOT NULL,
              json TEXT NOT NULL,
              FOREIGN KEY (routineId) REFERENCES routines(id) ON DELETE CASCADE
            );
            
            -- Workout sessions table (for tracking completed workouts)
            CREATE TABLE IF NOT EXISTS workout_sessions (
              id TEXT PRIMARY KEY,
              routineId TEXT,
              routineName TEXT NOT NULL,
              startedAt TEXT NOT NULL,
              completedAt TEXT,
              status TEXT NOT NULL,
              json TEXT
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_routine_days_routineId ON routine_days(routineId);
            CREATE INDEX IF NOT EXISTS idx_workout_sessions_routineId ON workout_sessions(routineId);
            CREATE INDEX IF NOT EXISTS idx_workout_sessions_startedAt ON workout_sessions(startedAt);
          `,
        },
        {
          version: 4,
          sql: `
            -- Weight logs table
            CREATE TABLE IF NOT EXISTS weight_logs (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              weight_kg REAL NOT NULL,
              source TEXT DEFAULT 'manual',
              note TEXT,
              createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            -- User profile + preferences (single row, id='me')
            CREATE TABLE IF NOT EXISTS profile (
              id TEXT PRIMARY KEY,
              sex TEXT,
              age INTEGER,
              height_cm REAL,
              weight_unit TEXT DEFAULT 'kg',
              length_unit TEXT DEFAULT 'cm',
              updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON weight_logs(date);
          `,
        },
      ];

      for (const migration of migrations) {
        const result = await this.db.getFirstAsync(
          'SELECT version FROM migrations WHERE version = ?',
          [migration.version]
        );

        if (!result) {
          await this.db.execAsync(migration.sql);
          await this.db.runAsync('INSERT INTO migrations (version) VALUES (?)', [
            migration.version,
          ]);
          console.log(`[DB] Applied migration v${migration.version}`);
        }
      }
    } catch (error) {
      console.error('[DB] Migration failed:', error);
      throw error;
    }
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    if (!this.db) await this.init();
    if (!this.db) {
      console.warn('[DB] Database not available, returning empty result');
      return sql.trim().toUpperCase().startsWith('SELECT') ? [] : { changes: 0 };
    }

    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return await this.db.getAllAsync(sql, params || []);
      } else {
        return await this.db.runAsync(sql, params || []);
      }
    } catch (error) {
      console.error('[DB] Query failed:', error);
      return sql.trim().toUpperCase().startsWith('SELECT') ? [] : { changes: 0 };
    }
  }

  async transaction(callback: (tx: any) => void): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) {
      console.warn('[DB] Database not available, skipping transaction');
      return;
    }

    try {
      await this.db.withTransactionAsync(callback);
    } catch (error) {
      console.error('[DB] Transaction failed:', error);
      // Don't throw - allow app to continue
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export const getDB = (): DB => {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
};

export const db = getDB();

