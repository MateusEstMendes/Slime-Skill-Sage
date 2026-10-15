import { describe, it, expect, beforeEach } from "vitest";
import { gameService } from "./gameService";
import { localDb } from "./db";
import { projectRepository } from "./projectRepository";
import type { Skill } from "@slime-sage/shared";
import type { GameEvent } from "@slime-sage/game";

describe("GameService & Transactional Ledger", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
    gameService.useRealClock();
  });

  it("completes mission transactionally, recording xp_event and updating profile and level", async () => {
    // 1. Setup project and mission
    const project = await projectRepository.createProject({
      area_id: "INT",
      title: "Projeto de Teste",
    });

    const { mission } = await projectRepository.addMission(project.id, {
      title: "Missão Alpha",
      xp_reward: 120, // Enough to jump from level 1 to level 2 (> 100)
    });

    // 2. Track events
    const receivedEvents: GameEvent[] = [];
    const unsubscribe = gameService.subscribeToGameEvents((e) => {
      receivedEvents.push(e);
    });

    // 3. Complete Mission
    const res = await gameService.completeMission(mission.id);

    expect(res.mission.status).toBe("feita");
    expect(res.xpEvent.xp_amount).toBe(120);
    expect(res.xpEvent.entity_id).toBe(mission.id);
    expect(res.xpEvent.entity_type).toBe("mission");

    // Profile should have 120 total_xp and leveled up to level 2
    expect(res.profile.total_xp).toBe(120);
    expect(res.profile.level).toBe(2);
    expect(res.profile.current_xp).toBe(20); // 120 - 100

    // Dispatched LEVEL_UP event
    expect(receivedEvents).toHaveLength(1);
    const lvlEvent = receivedEvents[0];
    expect(lvlEvent.type).toBe("LEVEL_UP");
    if (lvlEvent.type === "LEVEL_UP") {
      expect(lvlEvent.payload.newLevel).toBe(2);
    }

    // Ledger audit should be 100% consistent
    const audit = await gameService.auditLedger();
    expect(audit.isConsistent).toBe(true);
    expect(audit.ledgerTotalXp).toBe(120);
    expect(audit.profileTotalXp).toBe(120);

    unsubscribe();
  });

  it("evolves skill from comum to extra when mastery crosses 100 threshold", async () => {
    // 1. Setup Skill
    const skill: Skill = {
      id: "skill_magic_sense",
      area_id: "INT",
      name: "Percepção Mágica",
      description: "Capacidade de sentir magia",
      tier: "comum",
      mastery: 95,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await localDb.put("skill", skill);

    // 2. Setup project and mission
    const project = await projectRepository.createProject({
      area_id: "INT",
      title: "Estudo Mágico",
    });

    const { mission } = await projectRepository.addMission(project.id, {
      title: "Treinar Percepção",
      xp_reward: 40,
    });

    // 3. Complete mission granting 10 mastery (95 + 10 = 105 -> Extra)
    const receivedEvents: GameEvent[] = [];
    const unsubscribe = gameService.subscribeToGameEvents((e) => {
      receivedEvents.push(e);
    });

    await gameService.completeMission(mission.id, {
      skillId: skill.id,
      masteryAmount: 10,
    });

    // Check skill in db
    const updatedSkill = await localDb.get<Skill>("skill", skill.id);
    expect(updatedSkill?.mastery).toBe(105);
    expect(updatedSkill?.tier).toBe("extra");

    // Check event dispatched
    const evoEvent = receivedEvents.find((e) => e.type === "SKILL_EVOLVED_EXTRA");
    expect(evoEvent).toBeDefined();
    if (evoEvent && evoEvent.type === "SKILL_EVOLVED_EXTRA") {
      expect(evoEvent.payload.skillId).toBe(skill.id);
      expect(evoEvent.payload.mastery).toBe(105);
    }

    unsubscribe();
  });

  it("undoes mission completion with compensatory ledger record and perfectly restores state", async () => {
    // 1. Setup initial state
    const project = await projectRepository.createProject({
      area_id: "FOR",
      title: "Treinamento Físico",
    });

    const { mission } = await projectRepository.addMission(project.id, {
      title: "100 Flexões",
      xp_reward: 50,
    });

    const initialProfile = await gameService.getProfile();
    const initialXp = initialProfile.total_xp;

    // 2. Complete Mission
    await gameService.completeMission(mission.id);

    const completedProfile = await gameService.getProfile();
    expect(completedProfile.total_xp).toBe(initialXp + 50);

    // 3. Undo Mission Completion
    const undoRes = await gameService.undoMissionCompletion(mission.id);

    expect(undoRes.mission.status).toBe("disponivel");
    expect(undoRes.xpEvent.xp_amount).toBe(-50);
    expect(undoRes.profile.total_xp).toBe(initialXp);

    // 4. Verify Ledger Audit
    const audit = await gameService.auditLedger();
    expect(audit.isConsistent).toBe(true);
    expect(audit.ledgerTotalXp).toBe(initialXp);
    expect(audit.profileTotalXp).toBe(initialXp);
  });

  it("supports FakeClock time travel operations", () => {
    const startTime = 1700000000000;
    gameService.useFakeClock(startTime);
    expect(gameService.isFakeClock()).toBe(true);
    expect(gameService.getClock().now()).toBe(startTime);

    gameService.advanceClockHours(3);
    expect(gameService.getClock().now()).toBe(startTime + 3 * 3600 * 1000);

    gameService.advanceClockDays(2);
    expect(gameService.getClock().now()).toBe(
      startTime + (3 + 48) * 3600 * 1000
    );

    gameService.useRealClock();
    expect(gameService.isFakeClock()).toBe(false);
  });
});
