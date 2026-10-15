import {
  BASE_AREAS,
  TABLE_NAMES,
  type AppLogEntry,
  type KvEntry,
  type LogLevel,
  type LogScope,
  type Mission,
  type MissionDep,
  type Profile,
  type Project,
  type TableName,
  type XpEvent,
} from "@slime-sage/shared";

const DB_NAME = "slime_sage_db";
const DB_VERSION = 2;
export const MAX_LOG_ENTRIES = 2000;

export interface LogFilterOptions {
  scope?: LogScope;
  level?: LogLevel;
  limit?: number;
  offset?: number;
}

export class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryTables: Map<TableName, Map<string, unknown>> = new Map();
  private isIndexedDbAvailable = true;

  constructor() {
    for (const table of TABLE_NAMES) {
      this.memoryTables.set(table, new Map());
    }
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      this.isIndexedDbAvailable = false;
      this.initMemoryBaseAreas();
    }
  }

  private initMemoryBaseAreas(): void {
    const areaMap = this.memoryTables.get("area");
    if (areaMap && areaMap.size === 0) {
      for (const area of BASE_AREAS) {
        areaMap.set(area.id, area);
      }
    }
  }

  public async getDb(): Promise<IDBDatabase> {
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
        const oldVersion = event.oldVersion;

        // V1 Stores
        if (!db.objectStoreNames.contains("app_log")) {
          const logStore = db.createObjectStore("app_log", { keyPath: "id" });
          logStore.createIndex("at", "at", { unique: false });
          logStore.createIndex("level", "level", { unique: false });
          logStore.createIndex("scope", "scope", { unique: false });
        }

        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv", { keyPath: "key" });
        }

        // V2 Stores (Relational S.S.S Tables)
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains("profile")) {
            db.createObjectStore("profile", { keyPath: "id" });
          }

          if (!db.objectStoreNames.contains("area")) {
            const areaStore = db.createObjectStore("area", { keyPath: "id" });
            areaStore.createIndex("code", "code", { unique: true });
          }

          if (!db.objectStoreNames.contains("class")) {
            const classStore = db.createObjectStore("class", { keyPath: "id" });
            classStore.createIndex("area_id", "area_id", { unique: false });
          }

          if (!db.objectStoreNames.contains("class_challenge")) {
            const ccStore = db.createObjectStore("class_challenge", { keyPath: "id" });
            ccStore.createIndex("class_id", "class_id", { unique: false });
          }

          if (!db.objectStoreNames.contains("skill")) {
            const skillStore = db.createObjectStore("skill", { keyPath: "id" });
            skillStore.createIndex("area_id", "area_id", { unique: false });
          }

          if (!db.objectStoreNames.contains("evolution_attempt")) {
            const evoStore = db.createObjectStore("evolution_attempt", { keyPath: "id" });
            evoStore.createIndex("skill_id", "skill_id", { unique: false });
          }

          if (!db.objectStoreNames.contains("project")) {
            const projStore = db.createObjectStore("project", { keyPath: "id" });
            projStore.createIndex("area_id", "area_id", { unique: false });
            projStore.createIndex("status", "status", { unique: false });
            projStore.createIndex("deleted_at", "deleted_at", { unique: false });
          }

          if (!db.objectStoreNames.contains("mission")) {
            const misStore = db.createObjectStore("mission", { keyPath: "id" });
            misStore.createIndex("project_id", "project_id", { unique: false });
            misStore.createIndex("status", "status", { unique: false });
            misStore.createIndex("deleted_at", "deleted_at", { unique: false });
            misStore.createIndex("order_index", "order_index", { unique: false });
          }

          if (!db.objectStoreNames.contains("mission_dep")) {
            const depStore = db.createObjectStore("mission_dep", { keyPath: "id" });
            depStore.createIndex("mission_id", "mission_id", { unique: false });
            depStore.createIndex("depends_on_mission_id", "depends_on_mission_id", { unique: false });
          }

          if (!db.objectStoreNames.contains("mission_reward")) {
            const rewStore = db.createObjectStore("mission_reward", { keyPath: "id" });
            rewStore.createIndex("mission_id", "mission_id", { unique: false });
          }

          if (!db.objectStoreNames.contains("daily_mission")) {
            const dmStore = db.createObjectStore("daily_mission", { keyPath: "id" });
            dmStore.createIndex("date", "date", { unique: false });
            dmStore.createIndex("completed", "completed", { unique: false });
          }

          if (!db.objectStoreNames.contains("focus_session")) {
            const fsStore = db.createObjectStore("focus_session", { keyPath: "id" });
            fsStore.createIndex("status", "status", { unique: false });
            fsStore.createIndex("started_at", "started_at", { unique: false });
          }

          if (!db.objectStoreNames.contains("xp_event")) {
            const xpStore = db.createObjectStore("xp_event", { keyPath: "id" });
            xpStore.createIndex("entity_id", "entity_id", { unique: false });
            xpStore.createIndex("area_id", "area_id", { unique: false });
            xpStore.createIndex("created_at", "created_at", { unique: false });
          }

          if (!db.objectStoreNames.contains("chat_thread")) {
            const ctStore = db.createObjectStore("chat_thread", { keyPath: "id" });
            ctStore.createIndex("created_at", "created_at", { unique: false });
          }

          if (!db.objectStoreNames.contains("chat_message")) {
            const cmStore = db.createObjectStore("chat_message", { keyPath: "id" });
            cmStore.createIndex("thread_id", "thread_id", { unique: false });
            cmStore.createIndex("created_at", "created_at", { unique: false });
          }

          if (!db.objectStoreNames.contains("scheduled_notification")) {
            const snStore = db.createObjectStore("scheduled_notification", { keyPath: "id" });
            snStore.createIndex("status", "status", { unique: false });
            snStore.createIndex("trigger_at", "trigger_at", { unique: false });
          }

          if (!db.objectStoreNames.contains("phrase_bank")) {
            const pbStore = db.createObjectStore("phrase_bank", { keyPath: "id" });
            pbStore.createIndex("speaker", "speaker", { unique: false });
            pbStore.createIndex("category", "category", { unique: false });
          }
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        // Ensure default base areas exist
        try {
          const tx = db.transaction("area", "readwrite");
          const store = tx.objectStore("area");
          const countReq = store.count();
          countReq.onsuccess = () => {
            if (countReq.result === 0) {
              for (const area of BASE_AREAS) {
                store.put(area);
              }
            }
          };
        } catch {
          // Transaction ignore if closing
        }
        resolve(db);
      };

      request.onerror = () => {
        this.isIndexedDbAvailable = false;
        this.initMemoryBaseAreas();
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- GENERIC CRUD OPERATIONS ---

  public async get<T>(table: TableName, key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      return await new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(table, "readonly");
        const store = tx.objectStore(table);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve((req.result as T) ?? null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const map = this.memoryTables.get(table);
      return (map?.get(key) as T) ?? null;
    }
  }

  public async getAll<T>(table: TableName): Promise<T[]> {
    try {
      const db = await this.getDb();
      return await new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(table, "readonly");
        const store = tx.objectStore(table);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve((req.result as T[]) || []);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const map = this.memoryTables.get(table);
      return map ? (Array.from(map.values()) as T[]) : [];
    }
  }

  public async put<T extends { id?: string; key?: string }>(table: TableName, item: T): Promise<void> {
    const key = (item.id ?? item.key) as string;
    this.memoryTables.get(table)?.set(key, item);

    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(table, "readwrite");
        const store = tx.objectStore(table);
        const req = store.put(item);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback was set
    }
  }

  public async putBatch<T extends { id?: string; key?: string }>(table: TableName, items: T[]): Promise<void> {
    for (const item of items) {
      const key = (item.id ?? item.key) as string;
      this.memoryTables.get(table)?.set(key, item);
    }

    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(table, "readwrite");
        const store = tx.objectStore(table);

        for (const item of items) {
          store.put(item);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Memory fallback was set
    }
  }

  public async delete(table: TableName, key: string): Promise<void> {
    this.memoryTables.get(table)?.delete(key);

    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(table, "readwrite");
        const store = tx.objectStore(table);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback was deleted
    }
  }

  public async clearTable(table: TableName): Promise<void> {
    this.memoryTables.get(table)?.clear();

    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(table, "readwrite");
        const store = tx.objectStore(table);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory cleared
    }
  }

  public async countTable(table: TableName): Promise<number> {
    try {
      const db = await this.getDb();
      return await new Promise<number>((resolve, reject) => {
        const tx = db.transaction(table, "readonly");
        const store = tx.objectStore(table);
        const req = store.count();

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryTables.get(table)?.size || 0;
    }
  }

  public async getTableCounts(): Promise<Record<TableName, number>> {
    const counts: Partial<Record<TableName, number>> = {};
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(TABLE_NAMES, "readonly");
        let completed = 0;
        for (const table of TABLE_NAMES) {
          const req = tx.objectStore(table).count();
          req.onsuccess = () => {
            counts[table] = req.result;
            completed++;
            if (completed === TABLE_NAMES.length) {
              resolve();
            }
          };
          req.onerror = () => reject(req.error);
        }
        tx.oncomplete = () => resolve();
      });
    } catch {
      for (const table of TABLE_NAMES) {
        counts[table] = this.memoryTables.get(table)?.size || 0;
      }
    }

    for (const table of TABLE_NAMES) {
      if (counts[table] === undefined) {
        counts[table] = this.memoryTables.get(table)?.size || 0;
      }
    }
    return counts as Record<TableName, number>;
  }

  // --- SEED & RESET MANAGEMENT ---

  public async resetDatabase(): Promise<void> {
    for (const table of TABLE_NAMES) {
      this.memoryTables.get(table)?.clear();
    }

    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(TABLE_NAMES, "readwrite");
        let completed = 0;
        for (const table of TABLE_NAMES) {
          const req = tx.objectStore(table).clear();
          req.onsuccess = () => {
            completed++;
            if (completed === TABLE_NAMES.length) {
              resolve();
            }
          };
          req.onerror = () => reject(req.error);
        }
        tx.oncomplete = () => resolve();
      });
    } catch {
      // Memory cleared
    }

    // Re-seed the 5 immutable base areas
    await this.putBatch("area", BASE_AREAS as unknown as { id: string }[]);
  }

  public async seedSampleData(): Promise<void> {
    // Reset all tables first
    await this.resetDatabase();

    const now = new Date().toISOString();

    // 1. Initial Profile
    const profile: Profile = {
      id: "profile_main",
      name: "Rimuru Tempest",
      title: "Aspirante a Desperto",
      level: 1,
      current_xp: 50,
      total_xp: 50,
      streak_count: 1,
      last_active_date: now.slice(0, 10),
      onboarding_done: true,
      created_at: now,
      updated_at: now,
    };
    await this.put("profile", profile);

    // 2. Sample Projects & Missions
    const proj1: Project = {
      id: "proj_awakening",
      area_id: "INT",
      title: "Protocolo Despertar do Slime",
      description: "Dominar o fluxo de tarefas, grafos e o Sistema de Habilidades.",
      status: "ativo",
      progress: 33,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const proj2: Project = {
      id: "proj_discipline",
      area_id: "DIS",
      title: "Forja de Hábitos Inabaláveis",
      description: "Construção de consistência diária e foco profundo.",
      status: "ativo",
      progress: 0,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    await this.putBatch("project", [proj1, proj2]);

    // Missions for Project 1 (Chain: M1 -> M2 -> M3)
    const mis1: Mission = {
      id: "mis_graph_understanding",
      project_id: "proj_awakening",
      title: "Compreender o Grafo de Dependências",
      description: "Mapear a árvore de pré-requisitos das missões.",
      status: "feita",
      order_index: 0,
      xp_reward: 50,
      completed_at: now,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const mis2: Mission = {
      id: "mis_cycle_algorithms",
      project_id: "proj_awakening",
      title: "Desvendar Algoritmos de Ciclo (DFS/Kahn)",
      description: "Garantir integridade acíclica no grafo de decisões.",
      status: "disponivel", // Unlocked because mis1 is 'feita'
      order_index: 1,
      xp_reward: 75,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const mis3: Mission = {
      id: "mis_system_ascension",
      project_id: "proj_awakening",
      title: "Ascensão ao Modo Sistema",
      description: "Alcançar a maestria de projetos com a Grande Sábio.",
      status: "bloqueada", // Blocked until mis2 is 'feita'
      order_index: 2,
      xp_reward: 100,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    // Missions for Project 2 (Chain: M4 -> M5)
    const mis4: Mission = {
      id: "mis_morning_routine",
      project_id: "proj_discipline",
      title: "Rotina Matinal de Concentração",
      description: "Iniciar as primeiras 2 horas do dia sem distrações.",
      status: "disponivel",
      order_index: 0,
      xp_reward: 40,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const mis5: Mission = {
      id: "mis_deep_focus_session",
      project_id: "proj_discipline",
      title: "Sessão Foco Hiperfocado",
      description: "Completar 45 minutos contínuos em Modo Foco.",
      status: "bloqueada",
      order_index: 1,
      xp_reward: 60,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    await this.putBatch("mission", [mis1, mis2, mis3, mis4, mis5]);

    // Dependencies
    const dep1: MissionDep = {
      id: "dep_mis2_mis1",
      mission_id: "mis_cycle_algorithms",
      depends_on_mission_id: "mis_graph_understanding",
      created_at: now,
    };

    const dep2: MissionDep = {
      id: "dep_mis3_mis2",
      mission_id: "mis_system_ascension",
      depends_on_mission_id: "mis_cycle_algorithms",
      created_at: now,
    };

    const dep3: MissionDep = {
      id: "dep_mis5_mis4",
      mission_id: "mis_deep_focus_session",
      depends_on_mission_id: "mis_morning_routine",
      created_at: now,
    };

    await this.putBatch("mission_dep", [dep1, dep2, dep3]);

    // 3. XP Event (Ledger audit for M1 completion)
    const xpEvent: XpEvent = {
      id: "xpe_sample_1",
      entity_type: "mission",
      entity_id: "mis_graph_understanding",
      area_id: "INT",
      xp_amount: 50,
      mastery_amount: 10,
      description: "Conclusão da missão inicial do despertar",
      created_at: now,
    };
    await this.put("xp_event", xpEvent);

    // 4. Initial System Log
    await this.addLog({
      id: `log_${Date.now()}`,
      at: now,
      level: "info",
      scope: "db",
      message: "Banco de dados semeado com dados de exemplo (Seed v1)",
      data: { projectsCount: 2, missionsCount: 5 },
    });
  }

  // --- LOG STORE METHODS (Retrocompatível com Fase 1) ---

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
      const logMap = this.memoryTables.get("app_log");
      if (logMap) {
        logMap.set(entry.id, entry);
        if (logMap.size > MAX_LOG_ENTRIES) {
          const firstKey = logMap.keys().next().value;
          if (firstKey) logMap.delete(firstKey);
        }
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
        const cursorReq = index.openCursor();
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
      // Ignore during rotation
    }
  }

  public async countLogs(): Promise<number> {
    return await this.countTable("app_log");
  }

  public async getLogs(options?: LogFilterOptions): Promise<AppLogEntry[]> {
    try {
      const db = await this.getDb();
      const allLogs = await new Promise<AppLogEntry[]>((resolve, reject) => {
        const tx = db.transaction("app_log", "readonly");
        const store = tx.objectStore("app_log");
        const index = store.index("at");
        const req = index.openCursor(null, "prev");
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
      const logMap = this.memoryTables.get("app_log");
      let filtered = logMap ? (Array.from(logMap.values()) as AppLogEntry[]).reverse() : [];
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
    await this.clearTable("app_log");
  }

  public async exportLogsJson(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // --- KV STORE METHODS (Retrocompatível com Fase 1) ---

  public async getKv<T>(key: string): Promise<T | null> {
    const entry = await this.get<KvEntry>("kv", key);
    return entry ? (entry.value as T) : null;
  }

  public async setKv<T>(key: string, value: T): Promise<void> {
    const entry: KvEntry = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    await this.put("kv", entry);
  }

  public async deleteKv(key: string): Promise<void> {
    await this.delete("kv", key);
  }

  public async clearKv(): Promise<void> {
    await this.clearTable("kv");
  }
}

export const localDb = new LocalDatabase();
