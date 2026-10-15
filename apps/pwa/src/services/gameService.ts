import {
  type Profile,
  type Mission,
  type Project,
  type Skill,
  type Area,
  type XpEvent,
  type AreaCode,
} from "@slime-sage/shared";
import {
  type Clock,
  RealClock,
  FakeClock,
  calculateLevelFromTotalXp,
  calculateSkillProgression,
  calculateAttributesFromSkills,
  calculateAttributesFromLedger,
  calculateLedgerTotals,
  auditLedger,
  type LedgerAuditResult,
  type GameEvent,
  type AttributesMap,
} from "@slime-sage/game";
import { localDb } from "./db";
import { projectRepository } from "./projectRepository";
import { logger } from "./logger";
import { hapticFeedback } from "./haptics";

export interface CompleteMissionOptions {
  skillId?: string;
  masteryAmount?: number;
}

export interface CompleteMissionResult {
  mission: Mission;
  xpEvent: XpEvent;
  profile: Profile;
  events: GameEvent[];
}

export interface UndoMissionResult {
  mission: Mission;
  xpEvent: XpEvent;
  profile: Profile;
  events: GameEvent[];
}

export class GameService {
  private db = localDb;
  private clock: Clock = new RealClock();
  private eventListeners: Array<(event: GameEvent) => void> = [];

  // --- CLOCK & TIME TRAVEL ---

  public getClock(): Clock {
    return this.clock;
  }

  public setClock(clock: Clock): void {
    this.clock = clock;
  }

  public useFakeClock(initialTime: number = Date.now(), isTicking: boolean = false): FakeClock {
    const fake = new FakeClock(initialTime, isTicking);
    this.clock = fake;
    void logger.info("game", "FakeClock ativado no Sistema", {
      simulatedTime: fake.now(),
      isTicking,
    });
    return fake;
  }

  public useRealClock(): void {
    this.clock = new RealClock();
    void logger.info("game", "RealClock restaurado no Sistema");
  }

  public isFakeClock(): boolean {
    return this.clock instanceof FakeClock;
  }

  public advanceClock(ms: number): void {
    if (this.clock instanceof FakeClock) {
      this.clock.advance(ms);
      void logger.info("game", "Tempo avançado no FakeClock", {
        ms,
        newSimulatedTime: this.clock.now(),
      });
    }
  }

  public advanceClockHours(hours: number): void {
    this.advanceClock(hours * 3600 * 1000);
  }

  public advanceClockDays(days: number): void {
    this.advanceClock(days * 24 * 3600 * 1000);
  }

  public resetClock(): void {
    if (this.clock instanceof FakeClock) {
      this.clock.reset(Date.now());
    }
  }

  // --- EVENT DISPATCHER ---

  public subscribeToGameEvents(listener: (event: GameEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private dispatchEvent(event: GameEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Erro no listener de GameEvent:", err);
      }
    }
  }

  // --- PROFILE MANAGEMENT ---

  public async getProfile(): Promise<Profile> {
    let profile = await this.db.get<Profile>("profile", "profile_main");
    if (!profile) {
      const now = new Date(this.clock.now()).toISOString();
      profile = {
        id: "profile_main",
        name: "Rimuru Tempest",
        title: "Aspirante a Desperto",
        level: 1,
        current_xp: 0,
        total_xp: 0,
        streak_count: 0,
        last_active_date: now.slice(0, 10),
        onboarding_done: true,
        created_at: now,
        updated_at: now,
      };
      await this.db.put("profile", profile);
    }
    return profile;
  }

  // --- LEDGER & AUDITING ---

  public async getLedgerEvents(limit?: number): Promise<XpEvent[]> {
    const all = await this.db.getAll<XpEvent>("xp_event");
    // Sort descending by created_at
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (limit && limit > 0) {
      return all.slice(0, limit);
    }
    return all;
  }

  public async auditLedger(): Promise<LedgerAuditResult> {
    const events = await this.db.getAll<XpEvent>("xp_event");
    const profile = await this.getProfile();
    return auditLedger(events, profile.total_xp);
  }

  public async reconcileProfileWithLedger(): Promise<Profile> {
    const events = await this.db.getAll<XpEvent>("xp_event");
    const profile = await this.getProfile();
    const totals = calculateLedgerTotals(events);

    const progress = calculateLevelFromTotalXp(totals.totalXp);
    profile.total_xp = totals.totalXp;
    profile.level = progress.level;
    profile.current_xp = progress.currentXp;
    profile.updated_at = new Date(this.clock.now()).toISOString();

    await this.db.put("profile", profile);
    void logger.info("game", "Perfil reconciliado estritamente com o Ledger imutável", {
      totalXp: profile.total_xp,
      level: profile.level,
    });
    return profile;
  }

  public async getAttributes(): Promise<AttributesMap> {
    const skills = await this.db.getAll<Skill>("skill");
    if (skills.length > 0) {
      return calculateAttributesFromSkills(skills);
    }
    const events = await this.db.getAll<XpEvent>("xp_event");
    return calculateAttributesFromLedger(events);
  }

  // --- CORE TRANSACTIONS: COMPLETE & UNDO MISSION ---

  /**
   * Completes a mission in an immutable transaction:
   * 1. Records immutable xp_event in the ledger.
   * 2. Updates mission status to "feita" and cascades unlocks.
   * 3. Recalculates project progress.
   * 4. Updates profile XP, level and triggers LEVEL_UP if threshold reached.
   * 5. Advances skill mastery and triggers SKILL_EVOLVED_EXTRA if threshold (100) reached.
   */
  public async completeMission(
    missionId: string,
    options?: CompleteMissionOptions
  ): Promise<CompleteMissionResult> {
    const mission = await this.db.get<Mission>("mission", missionId);
    if (!mission || mission.deleted_at !== null) {
      throw new Error(`Missão ${missionId} não encontrada ou excluída`);
    }
    if (mission.status === "feita") {
      throw new Error(`Missão ${missionId} já está concluída`);
    }

    const project = await this.db.get<Project>("project", mission.project_id);
    const areaId: AreaCode = project?.area_id || "INT";
    const nowIso = new Date(this.clock.now()).toISOString();
    const xpReward = mission.xp_reward;
    const masteryDelta = options?.masteryAmount ?? 10;
    const skillId = options?.skillId;

    const dispatchedEvents: GameEvent[] = [];

    // 1. Skill progression if skillId provided
    let actualMasteryAdded = masteryDelta;
    if (skillId) {
      const skill = await this.db.get<Skill>("skill", skillId);
      if (skill) {
        const skillProgression = calculateSkillProgression(
          skill.tier,
          skill.mastery,
          masteryDelta
        );
        actualMasteryAdded = skillProgression.actualDelta;
        skill.mastery = skillProgression.newMastery;
        skill.tier = skillProgression.newTier;
        skill.updated_at = nowIso;
        await this.db.put("skill", skill);

        if (skillProgression.hasEvolvedToExtra) {
          const evoEvent: GameEvent = {
            type: "SKILL_EVOLVED_EXTRA",
            payload: {
              skillId: skill.id,
              skillName: skill.name,
              mastery: skill.mastery,
            },
          };
          dispatchedEvents.push(evoEvent);
          this.dispatchEvent(evoEvent);
        }
      }
    }

    // 2. Create and write immutable XP event to Ledger
    const xpEvent: XpEvent = {
      id: `xpe_${this.clock.now()}_${Math.random().toString(36).slice(2, 7)}`,
      entity_type: "mission",
      entity_id: mission.id,
      area_id: areaId,
      skill_id: skillId,
      xp_amount: xpReward,
      mastery_amount: actualMasteryAdded,
      description: `Conclusão da missão: ${mission.title}`,
      created_at: nowIso,
    };
    await this.db.put("xp_event", xpEvent);

    // 3. Update mission status & cascade through project repository
    const { updatedMission } = await projectRepository.updateMissionStatus(missionId, "feita");

    // 4. Update Profile XP & Level
    const profile = await this.getProfile();
    const previousLevel = profile.level;
    const newTotalXp = profile.total_xp + xpReward;
    const levelProg = calculateLevelFromTotalXp(newTotalXp);

    profile.total_xp = newTotalXp;
    profile.level = levelProg.level;
    profile.current_xp = levelProg.currentXp;
    profile.updated_at = nowIso;
    await this.db.put("profile", profile);

    if (levelProg.level > previousLevel) {
      const levelUpEvent: GameEvent = {
        type: "LEVEL_UP",
        payload: {
          previousLevel,
          newLevel: levelProg.level,
          totalXp: newTotalXp,
        },
      };
      dispatchedEvents.push(levelUpEvent);
      this.dispatchEvent(levelUpEvent);
    }

    // 5. Update Area XP
    const area = await this.db.get<Area>("area", areaId);
    if (area) {
      area.current_xp += xpReward;
      area.updated_at = nowIso;
      await this.db.put("area", area);
    }

    hapticFeedback.success();
    void logger.info("game", `Missão concluída: +${xpReward} XP [${areaId}]`, {
      missionId,
      xpReward,
      totalXp: profile.total_xp,
      level: profile.level,
    });

    return {
      mission: updatedMission,
      xpEvent,
      profile,
      events: dispatchedEvents,
    };
  }

  /**
   * Undoes a mission completion in an immutable transaction:
   * 1. Finds the corresponding completion event.
   * 2. Writes an immutable compensatory event (-xp, -mastery) to the ledger.
   * 3. Reverts mission status to "disponivel" and re-locks dependents.
   * 4. Recalculates project progress.
   * 5. Reverts profile XP, level and skill mastery.
   */
  public async undoMissionCompletion(missionId: string): Promise<UndoMissionResult> {
    const mission = await this.db.get<Mission>("mission", missionId);
    if (!mission || mission.deleted_at !== null) {
      throw new Error(`Missão ${missionId} não encontrada ou excluída`);
    }
    if (mission.status !== "feita") {
      throw new Error(`Missão ${missionId} não está concluída`);
    }

    const nowIso = new Date(this.clock.now()).toISOString();

    // Find the latest positive completion event for this mission
    const allEvents = await this.db.getAll<XpEvent>("xp_event");
    const missionEvents = allEvents.filter(
      (ev) => ev.entity_id === missionId && ev.entity_type === "mission" && ev.xp_amount > 0
    );
    const lastCompleteEvent = missionEvents[missionEvents.length - 1];

    const xpToRevert = lastCompleteEvent ? lastCompleteEvent.xp_amount : mission.xp_reward;
    const masteryToRevert = lastCompleteEvent?.mastery_amount ?? 0;
    const areaId = lastCompleteEvent?.area_id || "INT";
    const skillId = lastCompleteEvent?.skill_id;

    // 1. Create and write immutable compensatory event to Ledger
    const undoEvent: XpEvent = {
      id: `xpe_undo_${this.clock.now()}_${Math.random().toString(36).slice(2, 7)}`,
      entity_type: "mission",
      entity_id: mission.id,
      area_id: areaId,
      skill_id: skillId,
      xp_amount: -xpToRevert,
      mastery_amount: -masteryToRevert,
      description: `Desfazer conclusão da missão: ${mission.title}`,
      created_at: nowIso,
    };
    await this.db.put("xp_event", undoEvent);

    // 2. Revert mission status to "disponivel" and cascade
    const { updatedMission } = await projectRepository.updateMissionStatus(missionId, "disponivel");

    // 3. Revert Profile XP & Level
    const profile = await this.getProfile();
    const newTotalXp = Math.max(0, profile.total_xp - xpToRevert);
    const levelProg = calculateLevelFromTotalXp(newTotalXp);

    profile.total_xp = newTotalXp;
    profile.level = levelProg.level;
    profile.current_xp = levelProg.currentXp;
    profile.updated_at = nowIso;
    await this.db.put("profile", profile);

    // 4. Revert Skill mastery if applicable
    if (skillId && masteryToRevert > 0) {
      const skill = await this.db.get<Skill>("skill", skillId);
      if (skill) {
        const skillProgression = calculateSkillProgression(
          skill.tier,
          skill.mastery,
          -masteryToRevert
        );
        skill.mastery = skillProgression.newMastery;
        skill.tier = skillProgression.newTier;
        skill.updated_at = nowIso;
        await this.db.put("skill", skill);
      }
    }

    // 5. Revert Area XP
    const area = await this.db.get<Area>("area", areaId);
    if (area) {
      area.current_xp = Math.max(0, area.current_xp - xpToRevert);
      area.updated_at = nowIso;
      await this.db.put("area", area);
    }

    hapticFeedback.warning();
    void logger.info("game", `Conclusão da missão desfeita: -${xpToRevert} XP [${areaId}]`, {
      missionId,
      revertedXp: xpToRevert,
      totalXp: profile.total_xp,
      level: profile.level,
    });

    return {
      mission: updatedMission,
      xpEvent: undoEvent,
      profile,
      events: [],
    };
  }
}

export const gameService = new GameService();
