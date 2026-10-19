import { beforeEach, describe, expect, it } from "vitest";
import type { Skill, XpEvent } from "@slime-sage/shared";
import { localDb } from "./db";
import {
  buildMemorySnapshot,
  estimateTokens,
  selectTopSkillsHybrid,
} from "./memorySnapshotBuilder";

describe("MemorySnapshotBuilder", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
  });

  it("selects hybrid top 10 skills (5 highest mastery + 5 most recently practiced)", () => {
    const skills: Skill[] = Array.from({ length: 15 }, (_, i) => ({
      id: `sk_${i + 1}`,
      area_id: "INT",
      name: `Habilidade ${i + 1}`,
      description: "",
      tier: i < 2 ? "extra" : "comum",
      mastery: (15 - i) * 10, // sk_1 has 150, sk_5 has 110, sk_10 has 60...
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
    }));

    // Create recent XP events for sk_15, sk_14, sk_13, sk_12, sk_11
    const xpEvents: XpEvent[] = [
      {
        id: "ev_1",
        entity_type: "mission",
        entity_id: "m_1",
        area_id: "INT",
        skill_id: "sk_15",
        xp_amount: 35,
        mastery_amount: 7,
        description: "Missão 1",
        created_at: "2026-10-17T22:00:00Z",
      },
      {
        id: "ev_2",
        entity_type: "mission",
        entity_id: "m_2",
        area_id: "INT",
        skill_id: "sk_14",
        xp_amount: 35,
        mastery_amount: 7,
        description: "Missão 2",
        created_at: "2026-10-17T21:00:00Z",
      },
      {
        id: "ev_3",
        entity_type: "mission",
        entity_id: "m_3",
        area_id: "INT",
        skill_id: "sk_13",
        xp_amount: 35,
        mastery_amount: 7,
        description: "Missão 3",
        created_at: "2026-10-17T20:00:00Z",
      },
      {
        id: "ev_4",
        entity_type: "mission",
        entity_id: "m_4",
        area_id: "INT",
        skill_id: "sk_12",
        xp_amount: 35,
        mastery_amount: 7,
        description: "Missão 4",
        created_at: "2026-10-17T19:00:00Z",
      },
      {
        id: "ev_5",
        entity_type: "mission",
        entity_id: "m_5",
        area_id: "INT",
        skill_id: "sk_11",
        xp_amount: 35,
        mastery_amount: 7,
        description: "Missão 5",
        created_at: "2026-10-17T18:00:00Z",
      },
    ];

    const selected = selectTopSkillsHybrid(skills, xpEvents, 10);
    expect(selected).toHaveLength(10);

    // First 5 are top mastery: sk_1..sk_5
    expect(selected.slice(0, 5).map((s) => s.id)).toEqual([
      "sk_1",
      "sk_2",
      "sk_3",
      "sk_4",
      "sk_5",
    ]);
    expect(selected.slice(0, 5).every((s) => s.selection_reason === "top_mastery")).toBe(true);

    // Next 5 are most recently practiced: sk_15, sk_14, sk_13, sk_12, sk_11
    expect(selected.slice(5, 10).map((s) => s.id)).toEqual([
      "sk_15",
      "sk_14",
      "sk_13",
      "sk_12",
      "sk_11",
    ]);
    expect(selected.slice(5, 10).every((s) => s.selection_reason === "recent_practice")).toBe(true);
  });

  it("builds a complete compact memory snapshot under 500 tokens from IndexedDB", async () => {
    await localDb.seedSampleData();
    const now = new Date().toISOString();
    await localDb.put("skill", {
      id: "sk_sample_graph",
      area_id: "INT",
      name: "Teoria dos Grafos",
      description: "Análise de árvores acíclicas dirigidas.",
      tier: "comum",
      mastery_points: 45,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    const snapshot = await buildMemorySnapshot();
    expect(snapshot.profile.name).toBeDefined();
    expect(snapshot.active_project).toBeDefined();
    expect(snapshot.skills.length).toBeGreaterThan(0);
    expect(snapshot.formatted_prompt).toContain("SNAPSHOT DE MEMÓRIA DO CAÇADOR");
    expect(snapshot.estimated_tokens).toBeGreaterThan(20);
    expect(snapshot.estimated_tokens!).toBeLessThanOrEqual(500);
    expect(estimateTokens(snapshot.formatted_prompt!)).toBe(snapshot.estimated_tokens);
  });
});
