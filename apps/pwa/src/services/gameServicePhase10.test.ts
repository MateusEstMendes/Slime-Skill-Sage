import { describe, it, expect, beforeEach } from "vitest";
import { gameService } from "./gameService";
import { projectRepository } from "./projectRepository";
import { localDb } from "./db";
import type { Skill } from "@slime-sage/shared";

describe("GameService Phase 10: Racial Bonus, 2x Harvest XP, Roulette and Altar Fusion", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
  });

  it("applies +2 fixed racial affinity mastery bonus when mission matches hunter race primary area", async () => {
    // 1. Setup profile as Slime (primary area: INT)
    await gameService.completeOnboarding({
      name: "Rimuru",
      race: "Slime",
      rankThreat: "Hazard",
    });

    // 2. Create Skill and Project in INT
    const skill = await gameService.createSkill({
      name: "Análise Mágica",
      areaId: "INT",
    });

    const project = await projectRepository.createProject({
      title: "Projeto Arcano",
      area_id: "INT",
    });

    const { mission } = await projectRepository.addMission(project.id, {
      title: "Estudo de Runas",
      xp_reward: 50,
    });

    // 3. Complete Mission rewarding 10 base mastery
    const res = await gameService.completeMission(mission.id, {
      skillId: skill.id,
      masteryAmount: 10,
    });

    // 10 base + 2 racial bonus = 12 total mastery added!
    expect(res.xpEvent.mastery_amount).toBe(12);

    const updatedSkill = await localDb.get<Skill>("skill", skill.id);
    expect(updatedSkill?.mastery).toBe(12);
  });

  it("applies 2x XP multiplier when Harvest Festival is active", async () => {
    await gameService.completeOnboarding({
      name: "Rimuru",
      race: "Slime",
      rankThreat: "Hazard",
    });

    const project = await projectRepository.createProject({
      title: "Treino Físico",
      area_id: "FOR",
    });

    const { mission } = await projectRepository.addMission(project.id, {
      title: "Flexões",
      xp_reward: 50,
    });

    // Activate Harvest Festival
    await gameService.activateHarvestFestival();
    const harvestState = await gameService.getHarvestFestivalState();
    expect(harvestState.is_active).toBe(true);
    expect(harvestState.xp_multiplier).toBe(2.0);

    // Complete mission with base 50 XP -> receives 100 XP!
    const res = await gameService.completeMission(mission.id);
    expect(res.xpEvent.xp_amount).toBe(100);
    expect(res.profile.total_xp).toBe(100);
  });

  it("handles Esoteric Roulette spin: success elevates tier and failure sets 48h cooldown with zero mastery loss", async () => {
    // 1. Create Extra Skill with 600 mastery
    const skill: Skill = {
      id: "sk_roulette_test",
      area_id: "INT",
      name: "Olho Arcano",
      description: "Visão mágica",
      tier: "extra",
      mastery: 600,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await localDb.put("skill", skill);

    // 2. Create and complete 1 project to satisfy project requirement
    const proj = await projectRepository.createProject({
      title: "Projeto Requisito",
      area_id: "INT",
    });
    await projectRepository.updateProject(proj.id, { status: "concluido" });

    // 3. Check Eligibility
    const elig = await gameService.getRouletteEligibility(skill.id);
    expect(elig.isEligible).toBe(true);
    expect(elig.targetTier).toBe("unica");

    // 4. Force failure spin: zero mastery lost, cooldown 48h set
    const failSpin = await gameService.spinRoulette(skill.id, { forceResult: "failure" });
    expect(failSpin.success).toBe(false);
    expect(failSpin.newTier).toBe("extra");
    expect(failSpin.cooldownUntil).not.toBeNull();

    const skillAfterFail = await localDb.get<Skill>("skill", skill.id);
    expect(skillAfterFail?.mastery).toBe(600); // Mastery 100% preserved!
    expect(skillAfterFail?.tier).toBe("extra");

    // 5. Force success spin: ascends to "unica"
    const successSpin = await gameService.spinRoulette(skill.id, { forceResult: "success" });
    expect(successSpin.success).toBe(true);
    expect(successSpin.newTier).toBe("unica");

    const skillAfterSuccess = await localDb.get<Skill>("skill", skill.id);
    expect(skillAfterSuccess?.tier).toBe("unica");
  });

  it("fuses two resonant skills in the Harvest Altar: sacrifices ingredients and creates superior skill", async () => {
    const skillA: Skill = {
      id: "sk_fuse_a",
      area_id: "INT",
      name: "Raio Arcano",
      description: "Descarga de mana concentrada",
      tier: "comum",
      mastery: 80,
      domain: "Arcana",
      tags: ["magia", "energia"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const skillB: Skill = {
      id: "sk_fuse_b",
      area_id: "INT",
      name: "Chama Elemental",
      description: "Fogo vivo",
      tier: "comum",
      mastery: 70,
      domain: "Elemental",
      tags: ["elementos", "energia"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await localDb.put("skill", skillA);
    await localDb.put("skill", skillB);

    const fused = await gameService.fuseSkills({
      skillAId: skillA.id,
      skillBId: skillB.id,
      newName: "Tempestade de Plasma Arcano",
      newDescription: "Unificação divina de relâmpago arcano e fogo vivo.",
      targetTier: "especial",
    });

    expect(fused.name).toBe("Tempestade de Plasma Arcano");
    expect(fused.tier).toBe("especial");
    expect(fused.mastery).toBe(80); // Inherited max mastery
    expect(fused.tags).toContain("energia");

    // Old skills sacrificed (removed from active list)
    const checkA = await localDb.get<Skill>("skill", skillA.id);
    const checkB = await localDb.get<Skill>("skill", skillB.id);
    expect(checkA).toBeNull();
    expect(checkB).toBeNull();
  });
});
