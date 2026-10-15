import type { AppLogEntry, LogLevel, LogScope } from "@slime-sage/shared";
import { localDb, type LogFilterOptions } from "./db";

type LogListener = (entry: AppLogEntry) => void;

class LoggerService {
  private listeners: Set<LogListener> = new Set();

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private emit(entry: AppLogEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch {
        // Ignore subscriber errors
      }
    }
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async log(
    level: LogLevel,
    scope: LogScope,
    message: string,
    data?: unknown
  ): Promise<AppLogEntry> {
    const entry: AppLogEntry = {
      id: this.generateId(),
      at: new Date().toISOString(),
      level,
      scope,
      message,
      data,
    };

    // Console output with Sistema prefix
    const prefix = `[SISTEMA // ${scope.toUpperCase()}]`;
    const consoleMethod =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "debug"
            ? console.debug
            : console.info;

    if (data !== undefined) {
      consoleMethod(`${prefix} ${message}`, data);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }

    // Persist to local database
    await localDb.addLog(entry);

    // Notify active subscribers (e.g. Dev Panel)
    this.emit(entry);

    return entry;
  }

  public async debug(
    scope: LogScope,
    message: string,
    data?: unknown
  ): Promise<AppLogEntry> {
    return this.log("debug", scope, message, data);
  }

  public async info(
    scope: LogScope,
    message: string,
    data?: unknown
  ): Promise<AppLogEntry> {
    return this.log("info", scope, message, data);
  }

  public async warn(
    scope: LogScope,
    message: string,
    data?: unknown
  ): Promise<AppLogEntry> {
    return this.log("warn", scope, message, data);
  }

  public async error(
    scope: LogScope,
    message: string,
    data?: unknown
  ): Promise<AppLogEntry> {
    return this.log("error", scope, message, data);
  }

  public async getLogs(options?: LogFilterOptions): Promise<AppLogEntry[]> {
    return localDb.getLogs(options);
  }

  public async countLogs(): Promise<number> {
    return localDb.countLogs();
  }

  public async clearLogs(): Promise<void> {
    await localDb.clearLogs();
  }

  public async exportLogs(): Promise<string> {
    return localDb.exportLogsJson();
  }
}

export const logger = new LoggerService();
