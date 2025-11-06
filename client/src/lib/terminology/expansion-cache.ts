/**
 * Expansion Cache using IndexedDB
 *
 * Caches value set expansions locally for performance
 * and offline access
 */

import { ValueSetExpansion } from '@/store/app-store';

const DB_NAME = 'fhir-terminology-cache';
const DB_VERSION = 1;
const STORE_NAME = 'value-set-expansions';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedExpansion {
  url: string;
  version?: string;
  expansion: ValueSetExpansion;
  timestamp: number;
}

export class ExpansionCache {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Get a cached expansion
   */
  async get(url: string, version?: string): Promise<ValueSetExpansion | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const cached = request.result as CachedExpansion | undefined;

          if (!cached) {
            resolve(null);
            return;
          }

          // Check if version matches (if specified)
          if (version && cached.version !== version) {
            resolve(null);
            return;
          }

          // Check if expired
          const age = Date.now() - cached.timestamp;
          if (age > CACHE_TTL_MS) {
            // Expired, delete it
            this.delete(url);
            resolve(null);
            return;
          }

          resolve(cached.expansion);
        };

        request.onerror = () => {
          reject(new Error('Failed to get cached expansion'));
        };
      });
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Store an expansion in cache
   */
  async set(expansion: ValueSetExpansion): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const cached: CachedExpansion = {
        url: expansion.url,
        version: expansion.version,
        expansion,
        timestamp: Date.now(),
      };

      const request = store.put(cached);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to cache expansion'));
      });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  /**
   * Delete a cached expansion
   */
  async delete(url: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to delete cached expansion'));
      });
    } catch (error) {
      console.error('Cache delete error:', error);
      throw error;
    }
  }

  /**
   * Clear all cached expansions
   */
  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear cache'));
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      throw error;
    }
  }

  /**
   * Get all cached expansions
   */
  async getAll(): Promise<ValueSetExpansion[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const cached = request.result as CachedExpansion[];

          // Filter out expired entries
          const now = Date.now();
          const valid = cached
            .filter((c) => now - c.timestamp <= CACHE_TTL_MS)
            .map((c) => c.expansion);

          resolve(valid);
        };

        request.onerror = () => {
          reject(new Error('Failed to get all cached expansions'));
        };
      });
    } catch (error) {
      console.error('Cache getAll error:', error);
      return [];
    }
  }

  /**
   * Check if IndexedDB is available
   */
  static isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }
}

// Singleton instance
let cacheInstance: ExpansionCache | null = null;

export function getExpansionCache(): ExpansionCache {
  if (!cacheInstance) {
    cacheInstance = new ExpansionCache();
  }
  return cacheInstance;
}
