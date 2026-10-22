import {
  type Profile,
  type Mission,
  type MissionDep,
  type MissionReward,
  type Project,
  type Skill,
  type SkillTier,
  type Area,
  type XpEvent,
  type AreaCode,
  type TensuraRace,
  type ThreatRank,
  type HarvestFestivalState,
} from "@slime-sage/shared";
import {
  type Clock,
  RealClock,
  FakeClock,
  FixedRng,
  RealRng,
  calculateLevelFromTotalXp,
  calculateSkillProgression,
  calculateAttributesFromSkills,
  calculateAttributesFromLedger,
  calculateLedgerTotals,
  auditLedger,
  type LedgerAuditResult,
  type GameEvent,
  type AttributesMap,
  normalizeSkillName,
  CLASS_TIER_CONFIG,
  BASE_ATTRIBUTE_CODES,
  createEmptyAttributes,
  calculateRacialAffinityBonus,
  checkRouletteEligibility,
  executeRouletteSpin,
  checkSkillSynergy,
  type RouletteEligibilityResult,
  type RouletteSpinResult,
  HARVEST_FESTIVAL_XP_MULTIPLIER,
} from "@slime-sage/game";
import { localDb } from "./db";
import { projectRepository } from "./projectRepository";
import { classRepository } from "./classRepository";
import { evolutionRepository } from "./evolutionRepository";
import { logger } from "./logger";
import { hapticFeedback } from "./haptics";
import { createDefaultProfile, MAIN_PROFILE_ID } from "./profileDefaults";

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

class AsyncMutex {
  private queue: Promise<unknown> = Promise.resolve();

  public lock<T>(fn: () => Promise<T>): Promise<T> {
    const run = () => fn();
    const next = this.queue.then(run, run);
    this.queue = next.then(
      () => {},
      () => {}
    );
    return next;
  }
}

export class GameService {
  private db = localDb;
  private clock: Clock = new RealClock();
  private eventListeners: Array<(event: GameEvent) => void> = [];
  private mutex = new AsyncMutex();

  private reconcileStreak(profile: Profile, nowIso: string): Profile {
    const today = nowIso.slice(0, 10);
    const lastActive = profile.last_active_date?.slice(0, 10);

    if (!lastActive) {
      return {
        ...profile,
        streak_count: 1,
        last_active_date: today,
        updated_at: nowIso,
      };
    }

    if (lastActive === today) {
      return profile;
    }

    const lastTime = new Date(`${lastActive}T00:00:00Z`).getTime();
    const todayTime = new Date(`${today}T00:00:00Z`).getTime();
    const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

    let newStreak = 1;
    if (diffDays === 1) {
      newStreak = (profile.streak_count || 0) + 1;
    }

    return {
      ...profile,
      streak_count: newStreak,
      last_active_date: today,
      updated_at: nowIso,
    };
  }

  // --- CLOCK & TIME TRAVEL ---

  public getClock(): Clock {
    return this.clock;
  }

  public setClock(clock: Clock): void {
    this.clock = clock;
    classRepository.setClock(clock);
  }

  public useFakeClock(initialTime: number = Date.now(), isTicking: boolean = false): FakeClock {
    const fake = new FakeClock(initialTime, isTicking);
    this.setClock(fake);
    void logger.info("game", "FakeClock ativado no Sistema", {
      simulatedTime: fake.now(),
      isTicking,
    });
    return fake;
  }

  public useRealClock(): void {
    this.setClock(new RealClock());
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
    let profile = await this.db.get<Profile>("profile", MAIN_PROFILE_ID);
    if (!profile) {
      // New players start with onboarding_done=false so the onboarding ritual is shown.
      profile = createDefaultProfile(new Date(this.clock.now()).toISOString());
      await this.db.put("profile", profile);
    }
    void classRepository.initBaseClasses();
    return profile;
  }

  public async completeOnboarding(params: {
    name: string;
    race: TensuraRace;
    rankThreat: ThreatRank;
    title?: string;
  }): Promise<Profile> {
    const profile = await this.getProfile();
    const now = new Date(this.clock.now()).toISOString();

    const updated: Profile = {
      ...profile,
      name: params.name.trim() || profile.name || "Rimuru Tempest",
      race: params.race,
      rank_threat: params.rankThreat,
      title: params.title || profile.title,
      onboarding_done: true,
      updated_at: now,
    };

    await this.db.put("profile", updated);
    void logger.info("game", "[Despertar Concluído] Essência consagrada no perfil do Caçador", {
      name: updated.name,
      race: updated.race,
      rankThreat: updated.rank_threat,
      title: updated.title,
    });

    this.dispatchEvent({
      type: "ONBOARDING_COMPLETED",
      payload: {
        name: updated.name,
        race: updated.race ?? "Slime",
        rankThreat: updated.rank_threat ?? "Classe Menor",
      },
    });

    return updated;
  }

  public async resetOnboarding(): Promise<Profile> {
    const profile = await this.getProfile();
    const now = new Date(this.clock.now()).toISOString();

    const updated: Profile = {
      ...profile,
      onboarding_done: false,
      updated_at: now,
    };

    await this.db.put("profile", updated);
    void logger.info("game", "[Re-Despertar] Onboarding resetado via Painel Dev", {
      profileId: updated.id,
    });

    this.dispatchEvent({
      type: "ONBOARDING_RESET",
      payload: {},
    });

    return updated;
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
    const events = await this.db.getAll<XpEvent>("xp_event");
    const ledgerAttrs = calculateAttributesFromLedger(events);
    const skills = await this.db.getAll<Skill>("skill");
    const skillAttrs = calculateAttributesFromSkills(skills);
    const result = createEmptyAttributes();
    for (const code of BASE_ATTRIBUTE_CODES) {
      result[code] = Math.max(ledgerAttrs[code] || 0, skillAttrs[code] || 0);
    }
    return result;
  }

  // --- SKILL MANAGEMENT ---

  public async getSkills(areaId?: AreaCode): Promise<Skill[]> {
    const all = await this.db.getAll<Skill>("skill");
    if (areaId) {
      return all.filter((s) => s.area_id === areaId);
    }
    return all;
  }

  public async getSkillHistory(skillId: string): Promise<XpEvent[]> {
    const all = await this.db.getAll<XpEvent>("xp_event");
    return all
      .filter((e) => e.skill_id === skillId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async createSkill(params: {
    name: string;
    areaId: AreaCode;
    description?: string;
  }): Promise<Skill> {
    const existing = await this.db.getAll<Skill>("skill");
    const normalized = normalizeSkillName(params.name);
    if (!normalized) {
      throw new Error("Nome da habilidade não pode ser vazio.");
    }
    const dup = existing.find(
      (s) => normalizeSkillName(s.name).toLowerCase() === normalized.toLowerCase()
    );
    if (dup) {
      throw new Error(`Habilidade '${params.name}' já está registrada.`);
    }

    const nowIso = new Date(this.clock.now()).toISOString();
    const newSkill: Skill = {
      id: `skl_${this.clock.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: normalized,
      area_id: params.areaId,
      tier: "comum",
      mastery: 0,
      tags: [],
      description: params.description || `Habilidade vinculada à área ${params.areaId}`,
      created_at: nowIso,
      updated_at: nowIso,
    };

    await this.db.put("skill", newSkill);

    const acquiredEvent: GameEvent = {
      type: "SKILL_ACQUIRED",
      payload: {
        skillId: newSkill.id,
        skillName: newSkill.name,
        areaId: newSkill.area_id,
      },
    };
    this.dispatchEvent(acquiredEvent);

    void logger.info("game", `Nova habilidade adquirida: ${newSkill.name} [${newSkill.area_id}]`, {
      skillId: newSkill.id,
      areaId: newSkill.area_id,
    });

    return newSkill;
  }

  // --- CORE TRANSACTIONS: COMPLETE & UNDO MISSION ---

  /**
   * Resolves the skill and mastery that a mission rewards.
   * Priority: explicit option > mission_reward binding (created by G.S decrees).
   * No arbitrary fallback skill is chosen anymore (previously areaSkills[0]).
   */
  private async resolveMissionReward(
    missionId: string,
    options?: CompleteMissionOptions
  ): Promise<{ skillId?: string; masteryDelta: number }> {
    const defaultMastery = options?.masteryAmount ?? 10;
    if (options?.skillId) {
      return { skillId: options.skillId, masteryDelta: defaultMastery };
    }
    const rewards = await this.db.getAll<MissionReward>("mission_reward");
    const reward = rewards.find((r) => r.mission_id === missionId && r.skill_id);
    if (reward?.skill_id) {
      return {
        skillId: reward.skill_id,
        masteryDelta: options?.masteryAmount ?? (reward.mastery_amount || defaultMastery),
      };
    }
    return { skillId: undefined, masteryDelta: defaultMastery };
  }

  /**
   * Completes a mission:
   * 1. Updates mission status to "feita" and cascades unlocks (validates the mission first).
   * 2. Atomically writes (single IndexedDB transaction) the immutable xp_event, the skill
   *    mastery, the profile (XP/level derived from the Ledger) and the area XP.
   *    If that transaction fails, the mission status is rolled back.
   * 3. Dispatches PROJECT_COMPLETE / LEVEL_UP / SKILL_EVOLVED_EXTRA after commit.
   */
  public async completeMission(
    missionId: string,
    options?: CompleteMissionOptions
  ): Promise<CompleteMissionResult> {
    return this.mutex.lock(async () => {
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

      // Check Harvest Festival 2x XP Multiplier
      const harvestState = await this.getHarvestFestivalState();
      const xpMultiplier = harvestState.is_active ? harvestState.xp_multiplier : 1.0;
      const finalXpReward = Math.round(mission.xp_reward * xpMultiplier);

      const { skillId, masteryDelta } = await this.resolveMissionReward(missionId, options);

      // Profile XP is derived from the immutable Ledger (single source of truth)
      const currentProfile = await this.getProfile();
      const racialBonus = calculateRacialAffinityBonus(currentProfile.race, areaId);
      const effectiveMasteryDelta = masteryDelta + racialBonus;

      // --- Phase A: compute everything (no writes) ---
      let updatedSkill: Skill | null = null;
      let hasEvolvedToExtra = false;
      let actualMasteryAdded = effectiveMasteryDelta;
      if (skillId) {
        const skill = await this.db.get<Skill>("skill", skillId);
        if (skill) {
          const prog = calculateSkillProgression(skill.tier, skill.mastery, effectiveMasteryDelta);
          actualMasteryAdded = prog.actualDelta;
          hasEvolvedToExtra = prog.hasEvolvedToExtra;

          // If evolving to Extra and secret evolution name was prepared by G.S, apply it!
          let newSkillName = skill.name;
          let newSkillDesc = skill.description;
          if (hasEvolvedToExtra && skill.next_evolution_name) {
            newSkillName = skill.next_evolution_name;
            if (skill.next_evolution_description) {
              newSkillDesc = skill.next_evolution_description;
            }
          }

          updatedSkill = {
            ...skill,
            name: newSkillName,
            description: newSkillDesc,
            next_evolution_name: hasEvolvedToExtra ? undefined : skill.next_evolution_name,
            next_evolution_description: hasEvolvedToExtra ? undefined : skill.next_evolution_description,
            mastery: prog.newMastery,
            tier: prog.newTier,
            updated_at: nowIso,
          };
        }
      }

      const xpEvent: XpEvent = {
        id: `xpe_${this.clock.now()}_${Math.random().toString(36).slice(2, 7)}`,
        entity_type: "mission",
        entity_id: mission.id,
        area_id: areaId,
        skill_id: skillId,
        xp_amount: finalXpReward,
        mastery_amount: actualMasteryAdded,
        description: `Conclusão da missão: ${mission.title}${xpMultiplier > 1 ? " [Festival da Colheita 2x XP]" : ""}${racialBonus > 0 ? " [+2 Afinidade Racial]" : ""}`,
        created_at: nowIso,
      };

      const previousLevel = currentProfile.level;
      const ledgerEvents = await this.db.getAll<XpEvent>("xp_event");
      const newTotalXp = Math.max(0, calculateLedgerTotals([...ledgerEvents, xpEvent]).totalXp);
      const levelProg = calculateLevelFromTotalXp(newTotalXp);
      const baseProfile: Profile = {
        ...currentProfile,
        total_xp: newTotalXp,
        level: levelProg.level,
        current_xp: levelProg.currentXp,
        updated_at: nowIso,
      };
      const profile: Profile = this.reconcileStreak(baseProfile, nowIso);

      const area = await this.db.get<Area>("area", areaId);
      const updatedArea: Area | null = area
        ? { ...area, current_xp: area.current_xp + finalXpReward, updated_at: nowIso }
        : null;

      // --- Phase B: mission status + cascade (validates; throws before any XP is written) ---
      const previousStatus = mission.status;
      const { updatedMission } = await projectRepository.updateMissionStatus(missionId, "feita");

      // --- Phase C: atomic ledger/profile/skill/area commit ---
      try {
        await this.db.putAtomic([
          { table: "xp_event", item: xpEvent },
          { table: "profile", item: profile },
          ...(updatedSkill ? [{ table: "skill" as const, item: updatedSkill }] : []),
          ...(updatedArea ? [{ table: "area" as const, item: updatedArea }] : []),
        ]);
      } catch (err) {
        await projectRepository.updateMissionStatus(missionId, previousStatus);
        void logger.error("game", "Falha atômica ao concluir missão; status revertido", {
          missionId,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }

      // --- Phase D: events (only after a successful commit) ---
      const dispatchedEvents: GameEvent[] = [];
      const emit = (event: GameEvent) => {
        dispatchedEvents.push(event);
        this.dispatchEvent(event);
      };

      if (updatedSkill && hasEvolvedToExtra) {
        emit({
          type: "SKILL_EVOLVED_EXTRA",
          payload: {
            skillId: updatedSkill.id,
            skillName: updatedSkill.name,
            mastery: updatedSkill.mastery,
          },
        });
      }

      const currentProject = await this.db.get<Project>("project", mission.project_id);
      if (currentProject && currentProject.status === "concluido" && project?.status !== "concluido") {
        emit({
          type: "PROJECT_COMPLETE",
          payload: {
            projectId: currentProject.id,
            projectTitle: currentProject.title,
            hasSkill: updatedSkill !== null,
            skillId,
            skillName: updatedSkill?.name,
          },
        });
      }

      if (levelProg.level > previousLevel) {
        emit({
          type: "LEVEL_UP",
          payload: {
            previousLevel,
            newLevel: levelProg.level,
            totalXp: newTotalXp,
          },
        });
      }

      hapticFeedback.success();
      void logger.info("game", `Missão concluída: +${finalXpReward} XP [${areaId}]`, {
        missionId,
        xpReward: finalXpReward,
        totalXp: profile.total_xp,
        level: profile.level,
      });

      return {
        mission: updatedMission,
        xpEvent,
        profile,
        events: dispatchedEvents,
      };
    });
  }

  /**
   * Undoes a mission completion:
   * 1. Finds the latest completion event (by created_at, including 0-XP completions).
   * 2. Guards against undoing a prerequisite if dependent missions are completed.
   * 3. Reverts mission status to "disponivel" and re-locks dependents.
   * 4. Atomically writes the compensatory xp_event (-xp, -mastery), the profile
   *    (derived from the Ledger), the skill and the area. Rolls back status on failure.
   */
  public async undoMissionCompletion(missionId: string): Promise<UndoMissionResult> {
    return this.mutex.lock(async () => {
      const mission = await this.db.get<Mission>("mission", missionId);
      if (!mission || mission.deleted_at !== null) {
        throw new Error(`Missão ${missionId} não encontrada ou excluída`);
      }
      if (mission.status !== "feita") {
        throw new Error(`Missão ${missionId} não está concluída`);
      }

      // Guard: Prevent undoing a prerequisite mission if any dependent mission is already completed
      const allProjectMissions = await projectRepository.listMissions({ projectId: mission.project_id });
      const allDeps = await this.db.getAll<MissionDep>("mission_dep");
      const dependentDeps = allDeps.filter((d) => d.depends_on_mission_id === missionId);
      const completedDependents = allProjectMissions.filter(
        (m) => m.status === "feita" && dependentDeps.some((d) => d.mission_id === m.id)
      );

      if (completedDependents.length > 0) {
        const dependentTitles = completedDependents.map((m) => `"${m.title}"`).join(", ");
        throw new Error(
          `Não é possível desfazer a missão "${mission.title}" pois as missões dependentes ${dependentTitles} já foram concluídas. Desfaça primeiro as missões dependentes.`
        );
      }

      const nowIso = new Date(this.clock.now()).toISOString();

      // Latest completion event for this mission: positive/zero XP and not a compensation
      const allEvents = await this.db.getAll<XpEvent>("xp_event");
      const completionEvents = allEvents
        .filter(
          (ev) =>
            ev.entity_id === missionId &&
            ev.entity_type === "mission" &&
            ev.xp_amount >= 0 &&
            !ev.id.startsWith("xpe_undo_")
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const lastCompleteEvent = completionEvents[completionEvents.length - 1];

      // Area fallback: the mission's project area (never a hard-coded "INT" when avoidable)
      const project = await this.db.get<Project>("project", mission.project_id);
      const areaId: AreaCode = lastCompleteEvent?.area_id || project?.area_id || "INT";
      const xpToRevert = lastCompleteEvent ? lastCompleteEvent.xp_amount : mission.xp_reward;
      const masteryToRevert = lastCompleteEvent?.mastery_amount ?? 0;
      const skillId = lastCompleteEvent?.skill_id;

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

      const currentProfile = await this.getProfile();
      const newTotalXp = Math.max(0, calculateLedgerTotals([...allEvents, undoEvent]).totalXp);
      const levelProg = calculateLevelFromTotalXp(newTotalXp);
      const profile: Profile = {
        ...currentProfile,
        total_xp: newTotalXp,
        level: levelProg.level,
        current_xp: levelProg.currentXp,
        updated_at: nowIso,
      };

      let updatedSkill: Skill | null = null;
      if (skillId && masteryToRevert > 0) {
        const skill = await this.db.get<Skill>("skill", skillId);
        if (skill) {
          const prog = calculateSkillProgression(skill.tier, skill.mastery, -masteryToRevert);
          updatedSkill = { ...skill, mastery: prog.newMastery, tier: prog.newTier, updated_at: nowIso };
        }
      }

      const area = await this.db.get<Area>("area", areaId);
      const updatedArea: Area | null = area
        ? { ...area, current_xp: Math.max(0, area.current_xp - xpToRevert), updated_at: nowIso }
        : null;

      const { updatedMission } = await projectRepository.updateMissionStatus(missionId, "disponivel");

      try {
        await this.db.putAtomic([
          { table: "xp_event", item: undoEvent },
          { table: "profile", item: profile },
          ...(updatedSkill ? [{ table: "skill" as const, item: updatedSkill }] : []),
          ...(updatedArea ? [{ table: "area" as const, item: updatedArea }] : []),
        ]);
      } catch (err) {
        await projectRepository.updateMissionStatus(missionId, "feita");
        void logger.error("game", "Falha atômica ao desfazer missão; status restaurado", {
          missionId,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
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
    });
  }

  // --- MANUAL MASTERY / DEV PANEL ---

  /**
   * Adds manual mastery and XP to an Area via an immutable Ledger transaction.
   * Reconciles profile level and XP immediately.
   */
  public async addManualMastery(
    areaId: AreaCode,
    amount: number,
    description?: string
  ): Promise<void> {
    return this.mutex.lock(async () => {
      const nowIso = new Date(this.clock.now()).toISOString();
      const xpEvent: XpEvent = {
        id: `xpe_${this.clock.now()}_${Math.random().toString(36).slice(2, 7)}`,
        entity_type: "manual",
        entity_id: `manual_${areaId.toLowerCase()}`,
        area_id: areaId,
        xp_amount: amount,
        mastery_amount: amount,
        description: description || `Bônus Manual: +${amount} Maestria em ${areaId}`,
        created_at: nowIso,
      };
      await this.db.put("xp_event", xpEvent);

      // Update Area current_xp
      const area = await this.db.get<Area>("area", areaId);
      if (area) {
        area.current_xp += amount;
        area.updated_at = nowIso;
        await this.db.put("area", area);
      }

      // Reconcile Profile with Ledger
      const profile = await this.reconcileProfileWithLedger();

      // Dispatch GameEvent to immediately notify all reactive UI subscribers (StatusView, HomeView, DevPanel)
      const manualEvent: GameEvent = {
        type: "MASTERY_GAINED",
        payload: {
          areaId,
          amount,
          totalXp: profile.total_xp,
          level: profile.level,
        },
      };
      this.dispatchEvent(manualEvent);

      void logger.info("game", `[Maestria Manual Adicionada] +${amount} em ${areaId}`, {
        areaId,
        amount,
      });
    });
  }

  // --- CLASS CHALLENGE COMPLETION ---

  /**
   * Completes a class challenge, records the new Class, updates profile title,
   * and dispatches the CLASS_EVOLVED GameEvent.
   */
  public async completeClassChallenge(
    challengeId: string,
    options?: { autoEquipTitle?: boolean }
  ): Promise<{
    challenge: import("@slime-sage/shared").ClassChallenge;
    unlockedClass: import("@slime-sage/shared").Class;
    profile: Profile;
  }> {
    const result = await classRepository.completeChallenge(challengeId, options);
    const { unlockedClass, challenge } = result;

    const tierName =
      CLASS_TIER_CONFIG[unlockedClass.tier - 1]?.name ?? `Tier ${unlockedClass.tier}`;

    const evolvedEvent: GameEvent = {
      type: "CLASS_EVOLVED",
      payload: {
        areaId: unlockedClass.area_id,
        tier: unlockedClass.tier,
        tierName,
        className: unlockedClass.name,
        challengeId: challenge.id,
      },
    };

    this.dispatchEvent(evolvedEvent);

    void logger.info(
      "game",
      `[Provação Concluída] O Escolhido ascendeu ao patamar ${tierName} (${unlockedClass.name}) em ${unlockedClass.area_id}`,
      {
        areaId: unlockedClass.area_id,
        tier: unlockedClass.tier,
        className: unlockedClass.name,
      }
    );

    return result;
  }

  // --- HARVEST FESTIVAL & ALTAR OF SACRIFICE (PHASE 10) ---

  public async getHarvestFestivalState(): Promise<HarvestFestivalState> {
    const raw = await this.db.getKv<HarvestFestivalState>("harvest_festival_state");
    if (!raw) {
      return {
        is_active: false,
        activated_at: null,
        xp_multiplier: HARVEST_FESTIVAL_XP_MULTIPLIER,
        completed_goals_count: 0,
        total_goals_count: 0,
      };
    }
    return raw;
  }

  public async setHarvestFestivalState(
    patch: Partial<HarvestFestivalState>
  ): Promise<HarvestFestivalState> {
    const current = await this.getHarvestFestivalState();
    const updated: HarvestFestivalState = { ...current, ...patch };
    await this.db.setKv("harvest_festival_state", updated);
    return updated;
  }

  public async activateHarvestFestival(): Promise<HarvestFestivalState> {
    const nowIso = new Date(this.clock.now()).toISOString();
    const state = await this.setHarvestFestivalState({
      is_active: true,
      activated_at: nowIso,
      xp_multiplier: HARVEST_FESTIVAL_XP_MULTIPLIER,
    });

    const activeEvent: GameEvent = {
      type: "HARVEST_FESTIVAL_ACTIVATED",
      payload: {
        multiplier: HARVEST_FESTIVAL_XP_MULTIPLIER,
        activatedAt: nowIso,
      },
    };
    this.dispatchEvent(activeEvent);
    hapticFeedback.epic();

    void logger.info("game", "[Festival da Colheita Ativado] Bônus de 2x XP concedido e Altar de Fusão aberto!", {
      multiplier: HARVEST_FESTIVAL_XP_MULTIPLIER,
      activatedAt: nowIso,
    });

    return state;
  }

  public async deactivateHarvestFestival(): Promise<HarvestFestivalState> {
    const state = await this.setHarvestFestivalState({
      is_active: false,
      activated_at: null,
    });

    const deactEvent: GameEvent = {
      type: "HARVEST_FESTIVAL_DEACTIVATED",
      payload: {},
    };
    this.dispatchEvent(deactEvent);

    void logger.info("game", "[Festival da Colheita Encerrado] Retorno ao fluxo normal de mana.");
    return state;
  }

  public async checkHarvestEligibility(): Promise<{
    isEligible: boolean;
    completedGoals: number;
    totalGoals: number;
    percent: number;
  }> {
    const missions = await this.db.getAll<Mission>("mission");
    const activeMissions = missions.filter((m) => m.deleted_at === null);
    const completedGoals = activeMissions.filter((m) => m.status === "feita").length;
    const totalGoals = activeMissions.length;

    const percent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const isEligible = totalGoals > 0 && completedGoals === totalGoals;

    await this.setHarvestFestivalState({
      completed_goals_count: completedGoals,
      total_goals_count: totalGoals,
    });

    return { isEligible, completedGoals, totalGoals, percent };
  }

  // --- ESOTERIC ROULETTE (PHASE 10) ---

  private forcedRouletteResult: "success" | "failure" | null = null;

  public setForcedRouletteResult(result: "success" | "failure" | null): void {
    this.forcedRouletteResult = result;
  }

  public getForcedRouletteResult(): "success" | "failure" | null {
    return this.forcedRouletteResult;
  }

  public async getRouletteEligibility(skillId: string): Promise<RouletteEligibilityResult> {
    const skill = await this.db.get<Skill>("skill", skillId);
    if (!skill) {
      throw new Error(`Habilidade ${skillId} não encontrada.`);
    }

    const projects = await this.db.getAll<Project>("project");
    const completedProjectsCount = projects.filter(
      (p) => p.status === "concluido" && p.deleted_at === null
    ).length;

    const failureCount = await evolutionRepository.getFailureCountForSkill(skillId);
    const latestAttempt = await evolutionRepository.getLatestAttemptForSkill(skillId);

    return checkRouletteEligibility({
      skill,
      completedProjectsCount,
      failureCount,
      lastCooldownUntil: latestAttempt?.cooldown_until,
      now: this.clock.now(),
    });
  }

  public async spinRoulette(
    skillId: string,
    options?: { forceResult?: "success" | "failure" }
  ): Promise<RouletteSpinResult> {
    const skill = await this.db.get<Skill>("skill", skillId);
    if (!skill) {
      throw new Error(`Habilidade ${skillId} não encontrada.`);
    }

    const force = options?.forceResult ?? this.forcedRouletteResult;

    const eligibility = await this.getRouletteEligibility(skillId);
    if (!eligibility.isEligible && !force) {
      throw new Error(eligibility.reason || "Habilidade não elegível para a Roleta.");
    }

    const failureCount = await evolutionRepository.getFailureCountForSkill(skillId);

    let rng: RealRng | FixedRng;
    if (force === "success") {
      rng = new FixedRng([0.01]);
    } else if (force === "failure") {
      rng = new FixedRng([0.99]);
    } else {
      rng = new RealRng();
    }

    const result = executeRouletteSpin({
      skill,
      failureCount,
      rng,
      clock: this.clock,
    });

    // Record attempt in IndexedDB
    await evolutionRepository.recordAttempt(result.attempt);

    if (result.success) {
      const nowIso = new Date(this.clock.now()).toISOString();
      const updatedSkill: Skill = {
        ...skill,
        tier: result.newTier,
        updated_at: nowIso,
      };
      await this.db.put("skill", updatedSkill);

      const rouletteEvent: GameEvent = {
        type: "SKILL_EVOLVED_ROULETTE",
        payload: {
          skillId: skill.id,
          skillName: skill.name,
          previousTier: result.previousTier,
          newTier: result.newTier,
          finalChance: result.finalChance,
        },
      };
      this.dispatchEvent(rouletteEvent);
      hapticFeedback.skillEvolved();

      void logger.info("game", `[Roleta Esotérica Triunfante] ${skill.name} ascendeu para o grau ${result.newTier}!`, {
        skillId: skill.id,
        newTier: result.newTier,
        rolledValue: result.rolledValue,
        finalChance: result.finalChance,
      });
    } else {
      hapticFeedback.warning();
      void logger.info("game", `[Roleta Esotérica Falhou] Repouso de 48h ativado para ${skill.name}. Nenhuma maestria foi perdida.`, {
        skillId: skill.id,
        cooldownUntil: result.cooldownUntil,
        newFailureCount: result.newFailureCount,
      });
    }

    return result;
  }

  // --- ALTAR OF FUSION & SACRIFICE (PHASE 10) ---

  public async fuseSkills(params: {
    skillAId: string;
    skillBId: string;
    newName: string;
    newDescription: string;
    targetTier: SkillTier;
    domain?: string;
    tags?: string[];
  }): Promise<Skill> {
    return this.mutex.lock(async () => {
      const { skillAId, skillBId, newName, newDescription, targetTier, domain, tags } = params;
      const skillA = await this.db.get<Skill>("skill", skillAId);
      const skillB = await this.db.get<Skill>("skill", skillBId);

      if (!skillA || !skillB) {
        throw new Error("Uma ou ambas as habilidades não foram encontradas para a fusão.");
      }

      const synergy = checkSkillSynergy(skillA, skillB);
      if (!synergy.isCompatible) {
        throw new Error(synergy.reason || "Habilidades incompatíveis para fusão no Altar.");
      }

      const nowIso = new Date(this.clock.now()).toISOString();
      const cleanName = normalizeSkillName(newName) || `[Fusão] ${skillA.name} · ${skillB.name}`;

      const combinedTags = Array.from(
        new Set([...(tags || []), ...(skillA.tags || []), ...(skillB.tags || [])])
      );

      const fusedSkill: Skill = {
        id: `skl_fused_${this.clock.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        area_id: skillA.area_id,
        description: newDescription || `Fusão sagrada de ${skillA.name} e ${skillB.name} no Altar da Colheita.`,
        tier: targetTier || synergy.targetTier,
        mastery: Math.max(skillA.mastery, skillB.mastery),
        domain: domain || synergy.suggestedArchetype || skillA.domain,
        tags: combinedTags,
        created_at: nowIso,
        updated_at: nowIso,
      };

      // Migrate rewards pointing to sacrificed skills so foreign keys remain intact
      const rewards = await this.db.getAll<MissionReward>("mission_reward");
      const affectedRewards = rewards.filter(
        (r) => r.skill_id === skillAId || r.skill_id === skillBId
      );
      const migratedRewards = affectedRewards.map((r) => ({
        ...r,
        skill_id: fusedSkill.id,
      }));

      // Atomic sacrifice ritual: delete sacrificed skills and persist new superior skill in one commit
      await this.db.putAtomic([
        { type: "delete", table: "skill", key: skillAId },
        { type: "delete", table: "skill", key: skillBId },
        { type: "put", table: "skill", item: fusedSkill },
        ...migratedRewards.map((item) => ({ type: "put" as const, table: "mission_reward" as const, item })),
      ]);

      const fusedEvent: GameEvent = {
        type: "SKILL_FUSED",
        payload: {
          fusedSkillId: fusedSkill.id,
          fusedSkillName: fusedSkill.name,
          targetTier: fusedSkill.tier,
          skillAId: skillA.id,
          skillBId: skillB.id,
        },
      };
      this.dispatchEvent(fusedEvent);

      const acquiredEvent: GameEvent = {
        type: "SKILL_ACQUIRED",
        payload: {
          skillId: fusedSkill.id,
          skillName: fusedSkill.name,
          areaId: fusedSkill.area_id,
        },
      };
      this.dispatchEvent(acquiredEvent);
      hapticFeedback.epic();

      void logger.info("game", `[Altar de Fusão Consagrado] ${skillA.name} + ${skillB.name} -> ${fusedSkill.name} (${fusedSkill.tier})`, {
        fusedId: fusedSkill.id,
        targetTier: fusedSkill.tier,
      });

      return fusedSkill;
    });
  }

  // --- DEV PANEL SEED SHORTCUTS (PHASE 10) ---

  public async seedRouletteTestSkill(): Promise<Skill> {
    const nowIso = new Date(this.clock.now()).toISOString();
    const skill: Skill = {
      id: `skl_dev_extra_${this.clock.now()}`,
      name: `Lâmina do Vento Espiritual [Dev]`,
      area_id: "INT",
      tier: "extra",
      mastery: 600,
      description: "Habilidade Extra preparada para provação na Roleta Esotérica.",
      tags: ["arcana", "vento"],
      created_at: nowIso,
      updated_at: nowIso,
    };
    await this.db.put("skill", skill);

    // Create and complete 1 project if none exists
    const projects = await this.db.getAll<Project>("project");
    const hasCompleted = projects.some((p) => p.status === "concluido" && p.deleted_at === null);
    if (!hasCompleted) {
      const proj = await projectRepository.createProject({
        title: "Grande Provação das Runas [Dev]",
        area_id: "INT",
      });
      await projectRepository.updateProject(proj.id, { status: "concluido" });
    }

    this.dispatchEvent({
      type: "SKILL_ACQUIRED",
      payload: {
        skillId: skill.id,
        skillName: skill.name,
        areaId: skill.area_id,
      },
    });

    return skill;
  }

  public async seedSynergySkills(): Promise<{ skillA: Skill; skillB: Skill }> {
    const nowIso = new Date(this.clock.now()).toISOString();
    const skillA: Skill = {
      id: `skl_dev_syn_a_${this.clock.now()}`,
      name: `Esfera Arcana [Dev]`,
      area_id: "INT",
      tier: "comum",
      mastery: 85,
      domain: "Arcana",
      tags: ["magia", "energia"],
      description: "Manipulação de mana pura condensada.",
      created_at: nowIso,
      updated_at: nowIso,
    };

    const skillB: Skill = {
      id: `skl_dev_syn_b_${this.clock.now()}`,
      name: `Chama de Fogo [Dev]`,
      area_id: "INT",
      tier: "comum",
      mastery: 75,
      domain: "Elemental",
      tags: ["fogo", "energia"],
      description: "Incandescência primordial canalizada.",
      created_at: nowIso,
      updated_at: nowIso,
    };

    await this.db.put("skill", skillA);
    await this.db.put("skill", skillB);

    this.dispatchEvent({
      type: "SKILL_ACQUIRED",
      payload: {
        skillId: skillA.id,
        skillName: skillA.name,
        areaId: skillA.area_id,
      },
    });

    return { skillA, skillB };
  }
}

export const gameService = new GameService();
