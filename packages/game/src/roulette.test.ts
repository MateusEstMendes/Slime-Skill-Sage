import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Skill } from "@slime-sage/shared";
import {
  calculateRouletteChance,
  checkRouletteEligibility,
  executeRouletteSpin,
  getNextEvolutionTier,
} from "./roulette";
import { FakeClock } from "./clock";
import { FixedRng } from "./rng";
import {
  ROULETTE_BASE_CHANCE,
  ROULETTE_MAX_CHANCE,
  ROULETTE_COOLDOWN_MS,
} from "./config";

describe("Esoteric Roulette (Hardcore Standard)", () => {
  it("determines correct next evolution tier in canon ladder", () => {
    expect(getNextEvolutionTier("extra")).toBe("unica");
    expect(getNextEvolutionTier("unica")).toBe("suprema");
    expect(getNextEvolutionTier("suprema")).toBe("primordial");
    expect(getNextEvolutionTier("comum")).toBeNull();
    expect(getNextEvolutionTier("especial")).toBeNull();
    expect(getNextEvolutionTier("intrinseca")).toBeNull();
    expect(getNextEvolutionTier("primordial")).toBeNull();
  });

  it("calculates exact hardcore chance with pity scaling (+10% per failure, 80% ceiling)", () => {
    expect(calculateRouletteChance(0)).toBe(0.2); // Base: 20%
    expect(calculateRouletteChance(1)).toBe(0.3); // 1st failure: 30%
    expect(calculateRouletteChance(2)).toBe(0.4); // 2nd failure: 40%
    expect(calculateRouletteChance(3)).toBe(0.5); // 3rd failure: 50%
    expect(calculateRouletteChance(4)).toBe(0.6); // 4th failure: 60%
    expect(calculateRouletteChance(5)).toBe(0.7); // 5th failure: 70%
    expect(calculateRouletteChance(6)).toBe(0.8); // 6th failure: 80% (teto)
    expect(calculateRouletteChance(7)).toBe(0.8); // 7th failure: still 80% capped
    expect(calculateRouletteChance(100)).toBe(0.8);
  });

  it("checks eligibility criteria correctly (mastery, completed projects, cooldown)", () => {
    const baseNow = new Date("2026-10-21T12:00:00Z").getTime();

    // 1. Ineligible: Lower tier (especial)
    const resLow = checkRouletteEligibility({
      skill: { id: "sk1", tier: "especial", mastery: 300 },
      completedProjectsCount: 1,
      now: baseNow,
    });
    expect(resLow.isEligible).toBe(false);
    expect(resLow.reason).toContain("não realiza evolução via Roleta");

    // 2. Ineligible: Insufficient mastery on Extra (requires 600)
    const resUnderMastery = checkRouletteEligibility({
      skill: { id: "sk2", tier: "extra", mastery: 550 },
      completedProjectsCount: 1,
      now: baseNow,
    });
    expect(resUnderMastery.isEligible).toBe(false);
    expect(resUnderMastery.missingMastery).toBe(50);

    // 3. Ineligible: Zero completed projects
    const resNoProjects = checkRouletteEligibility({
      skill: { id: "sk3", tier: "extra", mastery: 600 },
      completedProjectsCount: 0,
      now: baseNow,
    });
    expect(resNoProjects.isEligible).toBe(false);
    expect(resNoProjects.missingProjects).toBe(1);

    // 4. Ineligible: Soul Cooldown Active
    const cdFuture = new Date(baseNow + 24 * 3600 * 1000).toISOString();
    const resCooldown = checkRouletteEligibility({
      skill: { id: "sk4", tier: "extra", mastery: 600 },
      completedProjectsCount: 1,
      lastCooldownUntil: cdFuture,
      now: baseNow,
    });
    expect(resCooldown.isEligible).toBe(false);
    expect(resCooldown.isInCooldown).toBe(true);
    expect(resCooldown.cooldownRemainingMs).toBe(24 * 3600 * 1000);

    // 5. Eligible: Extra with 600 pts, 1 project, no cooldown
    const resEligible = checkRouletteEligibility({
      skill: { id: "sk5", tier: "extra", mastery: 600 },
      completedProjectsCount: 1,
      now: baseNow,
    });
    expect(resEligible.isEligible).toBe(true);
    expect(resEligible.targetTier).toBe("unica");
    expect(resEligible.currentChance).toBe(0.2);
  });

  it("executes spin successfully with FixedRng (elevates tier, resets failure count)", () => {
    const clock = new FakeClock(new Date("2026-10-21T10:00:00Z").getTime());
    const rng = new FixedRng([0.15]); // roll 0.15 < 0.20 base chance -> Success

    const skill: Skill = {
      id: "sk_extra",
      area_id: "INT",
      name: "Análise Espacial",
      description: "Percepção refinada",
      tier: "extra",
      mastery: 600,
      tags: [],
      created_at: new Date(clock.now()).toISOString(),
      updated_at: new Date(clock.now()).toISOString(),
    };

    const spin = executeRouletteSpin({
      skill,
      failureCount: 0,
      rng,
      clock,
    });

    expect(spin.success).toBe(true);
    expect(spin.newTier).toBe("unica");
    expect(spin.cooldownUntil).toBeNull();
    expect(spin.newFailureCount).toBe(0);
    expect(spin.attempt.target_tier).toBe("unica");
    expect(spin.attempt.success).toBe(true);
  });

  it("executes spin on failure: zero mastery loss, sets 48h cooldown and increments pity", () => {
    const clock = new FakeClock(new Date("2026-10-21T10:00:00Z").getTime());
    const rng = new FixedRng([0.85]); // roll 0.85 >= 0.20 -> Failure

    const skill: Skill = {
      id: "sk_extra",
      area_id: "FOR",
      name: "Armadura de Ferro",
      description: "Defesa física",
      tier: "extra",
      mastery: 600,
      tags: [],
      created_at: new Date(clock.now()).toISOString(),
      updated_at: new Date(clock.now()).toISOString(),
    };

    const spin = executeRouletteSpin({
      skill,
      failureCount: 1, // already had 1 failure -> chance is 30%
      rng,
      clock,
    });

    expect(spin.success).toBe(false);
    expect(spin.previousTier).toBe("extra");
    expect(spin.newTier).toBe("extra"); // Tier unchanged!
    expect(spin.newFailureCount).toBe(2); // Pity increases!

    // Verify exact 48h cooldown
    const expectedCooldownTime = new Date(clock.now() + ROULETTE_COOLDOWN_MS).toISOString();
    expect(spin.cooldownUntil).toBe(expectedCooldownTime);
    expect(spin.attempt.success).toBe(false);
  });

  it("property: calculateRouletteChance is strictly monotonic and bounded by [0.20, 0.80] (fast-check)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (failures) => {
        const chance = calculateRouletteChance(failures);
        expect(chance).toBeGreaterThanOrEqual(ROULETTE_BASE_CHANCE);
        expect(chance).toBeLessThanOrEqual(ROULETTE_MAX_CHANCE);

        if (failures > 0) {
          const prevChance = calculateRouletteChance(failures - 1);
          expect(chance).toBeGreaterThanOrEqual(prevChance);
        }
      })
    );
  });

  it("property: spin execution never loses skill mastery (fast-check)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Skill["tier"]>("extra", "unica", "suprema"),
        fc.integer({ min: 600, max: 2500 }),
        fc.integer({ min: 0, max: 10 }),
        fc.float({ min: 0, max: Math.fround(0.9999) }),
        (tier, mastery, failures, rollVal) => {
          const clock = new FakeClock(new Date("2026-10-21T10:00:00Z").getTime());
          const rng = new FixedRng([rollVal]);
          const skill: Skill = {
            id: "sk_prop",
            area_id: "INT",
            name: "Habilidade de Teste",
            description: "Propriedade",
            tier,
            mastery,
            tags: [],
            created_at: new Date(clock.now()).toISOString(),
            updated_at: new Date(clock.now()).toISOString(),
          };

          const spin = executeRouletteSpin({ skill, failureCount: failures, rng, clock });
          // Mastery is never altered by the roulette
          expect(skill.mastery).toBe(mastery);
          if (spin.success) {
            expect(spin.newTier).not.toBe(tier);
          } else {
            expect(spin.newTier).toBe(tier);
            expect(spin.cooldownUntil).not.toBeNull();
          }
        }
      )
    );
  });
});
