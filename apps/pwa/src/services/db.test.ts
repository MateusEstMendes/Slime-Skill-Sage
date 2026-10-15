import { describe, it, expect, beforeEach } from "vitest";
import { localDb } from "./db";
import { TABLE_NAMES } from "@slime-sage/shared";

describe("LocalDatabase (IndexedDB v2)", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
  });

  it("initializes with 5 base areas populated by default", async () => {
    const areas = await localDb.getAll("area");
    expect(areas).toHaveLength(5);
    const codes = areas.map((a: unknown) => (a as { code: string }).code);
    expect(codes).toContain("INT");
    expect(codes).toContain("FOR");
    expect(codes).toContain("DIS");
    expect(codes).toContain("CRI");
    expect(codes).toContain("SOC");
  });

  it("counts rows per table correctly across all 19 tables", async () => {
    const counts = await localDb.getTableCounts();
    for (const table of TABLE_NAMES) {
      expect(typeof counts[table]).toBe("number");
    }
    expect(counts.area).toBe(5);
    expect(counts.project).toBe(0);
    expect(counts.mission).toBe(0);
  });

  it("seeds sample data and populates profile, projects, missions, dependencies, and xp_event", async () => {
    await localDb.seedSampleData();
    const counts = await localDb.getTableCounts();

    expect(counts.area).toBe(5);
    expect(counts.profile).toBe(1);
    expect(counts.project).toBe(2);
    expect(counts.mission).toBe(5);
    expect(counts.mission_dep).toBe(3);
    expect(counts.xp_event).toBe(1);
    expect(counts.app_log).toBeGreaterThanOrEqual(1);

    const profile = await localDb.get<{ name: string; onboarding_done: boolean }>("profile", "profile_main");
    expect(profile).toBeDefined();
    expect(profile?.name).toBe("Rimuru Tempest");
    expect(profile?.onboarding_done).toBe(true);
  });

  it("resets database, clearing all data while preserving the 5 base areas", async () => {
    await localDb.seedSampleData();
    await localDb.resetDatabase();

    const counts = await localDb.getTableCounts();
    expect(counts.area).toBe(5);
    expect(counts.profile).toBe(0);
    expect(counts.project).toBe(0);
    expect(counts.mission).toBe(0);
    expect(counts.mission_dep).toBe(0);
  });

  it("performs generic CRUD operations (get, getAll, put, putBatch, delete, clearTable)", async () => {
    await localDb.put("project", {
      id: "p_test_1",
      area_id: "INT",
      title: "Projeto Teste",
      description: "Desc",
      status: "ativo",
      progress: 0,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    const fetched = await localDb.get<{ title: string }>("project", "p_test_1");
    expect(fetched?.title).toBe("Projeto Teste");

    await localDb.putBatch("project", [
      {
        id: "p_test_2",
        area_id: "FOR",
        title: "Treino Pesado",
        status: "ativo",
        progress: 0,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
    ]);

    let all = await localDb.getAll<{ id: string }>("project");
    expect(all).toHaveLength(2);

    await localDb.delete("project", "p_test_1");
    all = await localDb.getAll<{ id: string }>("project");
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("p_test_2");

    await localDb.clearTable("project");
    all = await localDb.getAll<{ id: string }>("project");
    expect(all).toHaveLength(0);
  });
});
