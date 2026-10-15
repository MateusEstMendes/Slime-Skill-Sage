import { describe, it, expect } from "vitest";
import {
  HealthResponseSchema,
  LogScopeSchema,
  LogLevelSchema,
  AppLogEntrySchema,
  KvEntrySchema,
} from "./index";


describe("Shared Schemas", () => {
  it("validates correct HealthResponseSchema", () => {
    const valid = {
      status: "ok",
      app: "slime-sage",
      timestamp: new Date().toISOString(),
    };
    const parsed = HealthResponseSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("fails when status is invalid", () => {
    const invalid = {
      status: "error",
      app: "slime-sage",
      timestamp: new Date().toISOString(),
    };
    const parsed = HealthResponseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("validates LogScopeSchema and LogLevelSchema", () => {
    const scopes = ["ai", "notif", "game", "db", "focus", "backup", "tts"] as const;
    for (const scope of scopes) {
      expect(LogScopeSchema.safeParse(scope).success).toBe(true);
    }
    expect(LogScopeSchema.safeParse("unknown").success).toBe(false);

    const levels = ["debug", "info", "warn", "error"] as const;
    for (const level of levels) {
      expect(LogLevelSchema.safeParse(level).success).toBe(true);
    }
    expect(LogLevelSchema.safeParse("verbose").success).toBe(false);
  });

  it("validates AppLogEntrySchema and KvEntrySchema", () => {
    const validLog = {
      id: "log-1",
      at: new Date().toISOString(),
      level: "info",
      scope: "game",
      message: "Sistema inicializado",
      data: { score: 100 },
    };
    expect(AppLogEntrySchema.safeParse(validLog).success).toBe(true);

    const invalidLog = {
      id: "log-2",
      at: new Date().toISOString(),
      level: "invalid_level",
      scope: "game",
      message: "Erro",
    };
    expect(AppLogEntrySchema.safeParse(invalidLog).success).toBe(false);

    const validKv = {
      key: "theme",
      value: "dark",
      updatedAt: new Date().toISOString(),
    };
    expect(KvEntrySchema.safeParse(validKv).success).toBe(true);
  });
});

