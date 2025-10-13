/**
 * Platform-agnostic storage type definitions
 * Compliant with iOS Data Storage Guidelines and Android Scoped Storage
 */

export interface KV {
  getItem<T = string>(key: string): Promise<T | null>;
  setItem<T = string>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear?(): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}

export interface Secure {
  get(key: string): Promise<string | null>;
  set(key: string, val: string): Promise<void>;
  del(key: string): Promise<void>;
}

export interface Files {
  read(uri: string): Promise<string | Uint8Array>;
  write(
    uri: string,
    data: string | Uint8Array,
    opts?: { durable?: boolean }
  ): Promise<string>; // returns uri
  list(dir: 'durable' | 'cache', subpath?: string): Promise<string[]>;
  remove(uri: string): Promise<void>;
  resolve(dir: 'durable' | 'cache', ...parts: string[]): Promise<string>;
  exists(uri: string): Promise<boolean>;
}

export interface DB {
  execute(sql: string, params?: any[]): Promise<any>;
  transaction(callback: (tx: any) => void): Promise<void>;
  close(): Promise<void>;
}

export interface StorageAdapter {
  kv: KV;
  secure: Secure;
  files: Files;
  db: DB | null;
}

export type StorageType = 'secret' | 'kv' | 'cache' | 'db' | 'file:durable' | 'file:media';

export interface MigrationResult {
  success: boolean;
  itemsMigrated: number;
  errors: string[];
}

