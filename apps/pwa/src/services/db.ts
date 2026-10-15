import type { AppLogEntry, KvEntry, LogLevel, LogScope } from "@slime-sage/shared";

const DB_NAME = "slime_sage_db";
const DB_VERSION = 1;
export const MAX_LOG_ENTRIES = 2000;

export interface LogFilterOptions {
  scope?: LogScope;
  level?: LogLevel;
  limit?: number;
  offset?: number;
}

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryLogs: AppLogEntry[] = [];
  private memoryKv: Map<string, unknown> = new Map();
  private isIndexedDbAvailable = true;

  constructor() {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      this.isIndexedDbAvailable = false;
    }
  }

  private async getDb(): Promise<IDBDatabase> {
    if (!this.isIndexedDbAvailable) {
      throw new Error("IndexedDB is not available");
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("app_log")) {
          const logStore = db.createObjectStore("app_log", { keyPath: "id" });
          logStore.createIndex("at", "at", { unique: false });
          logStore.createIndex("level", "level", { unique: false });
          logStore.createIndex("scope", "scope", { unique: false });
        }

        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv", { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.isIndexedDbAvailable = false;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- LOG STORE METHODS ---

  public async addLog(entry: AppLogEntry): Promise<void> {
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("app_log", "readwrite");
        const store = tx.objectStore("app_log");
        const addReq = store.add(entry);

        addReq.onsuccess = () => resolve();
        addReq.onerror = () => reject(addReq.error);
      });

      await this.enforceLogRotation();
    } catch {
      // Fallback in-memory
      this.memoryLogs.push(entry);
      if (this.memoryLogs.length > MAX_LOG_ENTRIES) {
        this.memoryLogs.splice(0, this.memoryLogs.length - MAX_LOG_ENTRIES);
      }
    }
  }

  public async enforceLogRotation(): Promise<void> {
    try {
      const db = await this.getDb();
      const count = await this.countLogs();

      if (count <= MAX_LOG_ENTRIES) {
        return;
      }

      const toDeleteCount = count - MAX_LOG_ENTRIES;

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("app_log", "readwrite");
        const store = tx.objectStore("app_log");
        const index = store.index("at");
        const cursorReq = index.openCursor(); // Ascending: oldest first
        let deleted = 0;

        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor && deleted < toDeleteCount) {
            cursor.delete();
            deleted++;
            cursor.continue();
          } else {
            resolve();
          }
        };

        cursorReq.onerror = () => reject(cursorReq.error);
        tx.oncomplete = () => resolve();
      });
    } catch {
      // Graceful error ignore during rotation
    }
  }

  public async countLogs(): Promise<number> {
    try {
      const db = await this.getDb();
      return await new Promise<number>((resolve, reject) => {
        const tx = db.transaction("app_log", "readonly");
        const store = tx.objectStore("app_log");
        const req = store.count();

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryLogs.length;
    }
  }

  public async getLogs(options?: LogFilterOptions): Promise<AppLogEntry[]> {
    try {
      const db = await this.getDb();
      const allLogs = await new Promise<AppLogEntry[]>((resolve, reject) => {
        const tx = db.transaction("app_log", "readonly");
        const store = tx.objectStore("app_log");
        const index = store.index("at");
        const req = index.openCursor(null, "prev"); // Descending: newest first
        const results: AppLogEntry[] = [];

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            const val = cursor.value as AppLogEntry;
            const matchesScope = !options?.scope || val.scope === options.scope;
            const matchesLevel = !options?.level || val.level === options.level;

            if (matchesScope && matchesLevel) {
              results.push(val);
            }
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        req.onerror = () => reject(req.error);
      });

      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? allLogs.length;
      return allLogs.slice(offset, offset + limit);
    } catch {
      let filtered = [...this.memoryLogs].reverse();
      if (options?.scope) {
        filtered = filtered.filter((l) => l.scope === options.scope);
      }
      if (options?.level) {
        filtered = filtered.filter((l) => l.level === options.level);
      }
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? filtered.length;
      return filtered.slice(offset, offset + limit);
    }
  }

  public async clearLogs(): Promise<void> {
    this.memoryLogs = [];
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("app_log", "readwrite");
        const store = tx.objectStore("app_log");
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Cleared memory logs already
    }
  }

  public async exportLogsJson(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // --- KV STORE METHODS ---

  public async getKv<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      return await new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction("kv", "readonly");
        const store = tx.objectStore("kv");
        const req = store.get(key);

        req.onsuccess = () => {
          if (req.result) {
            resolve((req.result as KvEntry).value as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return (this.memoryKv.get(key) as T) ?? null;
    }
  }

  public async setKv<T>(key: string, value: T): Promise<void> {
    const entry: KvEntry = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };

    this.memoryKv.set(key, value);

    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        const store = tx.objectStore("kv");
        const req = store.put(entry);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback was set
    }
  }

  public async deleteKv(key: string): Promise<void> {
    this.memoryKv.delete(key);
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        const store = tx.objectStore("kv");
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback deleted
    }
  }

  public async clearKv(): Promise<void> {
    this.memoryKv.clear();
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        const store = tx.objectStore("kv");
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback cleared
    }
  }
}

export const localDb = new LocalDatabase();
