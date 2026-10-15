import { describe, it, expect, beforeEach } from "vitest";
import { logger } from "./logger";
import { localDb, MAX_LOG_ENTRIES } from "./db";


describe("Logger Service & LocalDatabase", () => {
  beforeEach(async () => {
    await localDb.clearLogs();
    await localDb.clearKv();
  });

  it("logs with scopes and levels and retrieves filtered logs", async () => {
    await logger.info("game", "Jogador subiu de nível", { level: 2 });
    await logger.warn("notif", "Notificação adiada");
    await logger.error("db", "Falha de conexão temporária");
    await logger.debug("ai", "Prompt enviado para análise");

    const allLogs = await logger.getLogs();
    expect(allLogs.length).toBe(4);

    // Verify ordering: newest first
    expect(allLogs[0].scope).toBe("ai");
    expect(allLogs[3].scope).toBe("game");

    // Filter by scope
    const gameLogs = await logger.getLogs({ scope: "game" });
    expect(gameLogs.length).toBe(1);
    expect(gameLogs[0].message).toBe("Jogador subiu de nível");

    // Filter by level
    const errorLogs = await logger.getLogs({ level: "error" });
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].message).toBe("Falha de conexão temporária");
  });

  it("notifies active subscribers when a new log is recorded", async () => {
    const received: string[] = [];
    const unsubscribe = logger.subscribe((entry) => {
      received.push(entry.message);
    });

    await logger.info("tts", "Narração iniciada");
    await logger.info("focus", "Modo foco ativado");

    expect(received).toEqual(["Narração iniciada", "Modo foco ativado"]);

    unsubscribe();
    await logger.info("backup", "Backup finalizado");
    expect(received.length).toBe(2);
  });

  it("exports logs to valid JSON format", async () => {
    await logger.info("game", "Teste de exportação", { key: "value" });
    const jsonStr = await logger.exportLogs();
    const parsed = JSON.parse(jsonStr);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].message).toBe("Teste de exportação");
    expect(parsed[0].data).toEqual({ key: "value" });
  });

  it("clears logs properly", async () => {
    await logger.info("game", "Log 1");
    await logger.info("game", "Log 2");
    expect(await logger.countLogs()).toBe(2);

    await logger.clearLogs();
    expect(await logger.countLogs()).toBe(0);
    const logs = await logger.getLogs();
    expect(logs).toEqual([]);
  });

  it("enforces log rotation keeping at most 2.000 records", async () => {
    // Add 2015 logs directly to localDb to test rotation limit
    const totalToAdd = 2015;
    const baseTime = Date.now();

    for (let i = 0; i < totalToAdd; i++) {
      await localDb.addLog({
        id: `rot-log-${i}`,
        at: new Date(baseTime + i * 10).toISOString(),
        level: "info",
        scope: "game",
        message: `Log de teste #${i}`,
      });
    }

    const count = await localDb.countLogs();
    expect(count).toBe(MAX_LOG_ENTRIES);

    const logs = await localDb.getLogs();
    expect(logs.length).toBe(MAX_LOG_ENTRIES);

    // Oldest logs (0 to 14) should have been pruned; newest log should be #2014
    expect(logs[0].message).toBe(`Log de teste #${totalToAdd - 1}`);
    expect(logs[logs.length - 1].message).toBe("Log de teste #15");
  });

  it("supports KV store operations (get, set, delete, clear)", async () => {
    expect(await localDb.getKv("dev_mode")).toBeNull();

    await localDb.setKv("dev_mode", true);
    expect(await localDb.getKv<boolean>("dev_mode")).toBe(true);

    await localDb.setKv("profile", { name: "Rimuru", class: "Slime" });
    expect(await localDb.getKv<{ name: string }>("profile")).toEqual({
      name: "Rimuru",
      class: "Slime",
    });

    await localDb.deleteKv("dev_mode");
    expect(await localDb.getKv("dev_mode")).toBeNull();

    await localDb.clearKv();
    expect(await localDb.getKv("profile")).toBeNull();
  });
});
