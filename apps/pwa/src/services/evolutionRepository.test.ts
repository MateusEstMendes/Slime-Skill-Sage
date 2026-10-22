import { describe, it, expect, beforeEach } from "vitest";
import { evolutionRepository } from "./evolutionRepository";
import { localDb } from "./db";
import type { EvolutionAttempt } from "@slime-sage/shared";

describe("EvolutionRepository (IndexedDB Integration)", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
  });

  it("records attempts and retrieves them newest first", async () => {
    const att1: EvolutionAttempt = {
      id: "evo_1",
      skill_id: "sk_test",
      target_tier: "unica",
      base_chance: 0.2,
      failure_bonus: 0,
      final_chance: 0.2,
      rolled_value: 0.5,
      success: false,
      cooldown_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1000).toISOString(),
    };

    const att2: EvolutionAttempt = {
      id: "evo_2",
      skill_id: "sk_test",
      target_tier: "unica",
      base_chance: 0.2,
      failure_bonus: 0.1,
      final_chance: 0.3,
      rolled_value: 0.1,
      success: true,
      cooldown_until: null,
      created_at: new Date().toISOString(),
    };

    await evolutionRepository.recordAttempt(att1);
    await evolutionRepository.recordAttempt(att2);

    const history = await evolutionRepository.getAttemptsForSkill("sk_test");
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe("evo_2"); // Newest first
    expect(history[1].id).toBe("evo_1");

    const latest = await evolutionRepository.getLatestAttemptForSkill("sk_test");
    expect(latest?.id).toBe("evo_2");
  });

  it("calculates pity failure count correctly stopping at last success", async () => {
    // 1st: success
    await evolutionRepository.recordAttempt({
      id: "evo_old_succ",
      skill_id: "sk_test",
      target_tier: "extra",
      base_chance: 0.2,
      failure_bonus: 0,
      final_chance: 0.2,
      rolled_value: 0.1,
      success: true,
      cooldown_until: null,
      created_at: new Date(Date.now() - 3000).toISOString(),
    });

    // 2nd: failure
    await evolutionRepository.recordAttempt({
      id: "evo_f1",
      skill_id: "sk_test",
      target_tier: "unica",
      base_chance: 0.2,
      failure_bonus: 0,
      final_chance: 0.2,
      rolled_value: 0.8,
      success: false,
      cooldown_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2000).toISOString(),
    });

    // 3rd: failure
    await evolutionRepository.recordAttempt({
      id: "evo_f2",
      skill_id: "sk_test",
      target_tier: "unica",
      base_chance: 0.2,
      failure_bonus: 0.1,
      final_chance: 0.3,
      rolled_value: 0.9,
      success: false,
      cooldown_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1000).toISOString(),
    });

    const failures = await evolutionRepository.getFailureCountForSkill("sk_test");
    expect(failures).toBe(2);
  });

  it("clears cooldowns successfully", async () => {
    await evolutionRepository.recordAttempt({
      id: "evo_cd",
      skill_id: "sk_test",
      target_tier: "unica",
      base_chance: 0.2,
      failure_bonus: 0,
      final_chance: 0.2,
      rolled_value: 0.8,
      success: false,
      cooldown_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    await evolutionRepository.clearCooldowns("sk_test");
    const latest = await evolutionRepository.getLatestAttemptForSkill("sk_test");
    expect(latest?.cooldown_until).toBeNull();
  });
});
