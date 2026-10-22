import {
  BASE_AREAS,
  type AreaCode,
  type Class,
  type ClassChallenge,
  type Profile,
} from "@slime-sage/shared";
import {
  BASE_CLASS_NAMES,
  transitionChallengeStatus,
  formatClassTitle,
  type Clock,
  RealClock,
} from "@slime-sage/game";
import { localDb } from "./db";
import { logger } from "./logger";
import { createDefaultProfile, MAIN_PROFILE_ID } from "./profileDefaults";

const ACTIVE_CHALLENGE_STATUSES: ReadonlyArray<ClassChallenge["status"]> = [
  "proposta",
  "aceita",
  "pendente",
];

/** Thrown when a new challenge is requested for an area that already has one in progress. */
export class ActiveChallengeExistsError extends Error {
  constructor(public readonly areaId: AreaCode, public readonly existingChallengeId: string) {
    super(`Já existe uma provação ativa na área ${areaId} (${existingChallengeId}).`);
    this.name = "ActiveChallengeExistsError";
  }
}

/** Thrown when a challenge targets a tier that is not exactly the next tier of the area. */
export class InvalidChallengeTierError extends Error {
  constructor(
    public readonly areaId: AreaCode,
    public readonly currentTier: number,
    public readonly targetTier: number
  ) {
    super(
      `Tier alvo inválido para ${areaId}: atual ${currentTier}, solicitado ${targetTier} (esperado ${currentTier + 1}).`
    );
    this.name = "InvalidChallengeTierError";
  }
}

export class ClassRepository {
  private db = localDb;
  private clock: Clock = new RealClock();
  private listeners: Array<() => void> = [];
  private initPromise: Promise<void> | null = null;

  /** Keeps the repository in sync with GameService's clock (FakeClock support). */
  public setClock(clock: Clock): void {
    this.clock = clock;
  }

  private nowIso(): string {
    return new Date(this.clock.now()).toISOString();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyChange(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error("Erro no listener de ClassRepository:", err);
      }
    }
  }

  /**
   * Initializes default Tier 1 (Aprendiz) classes for all 5 base areas if not already present.
   * Concurrent callers share the same in-flight promise to avoid redundant writes.
   */
  public initBaseClasses(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInitBaseClasses().finally(() => {
        this.initPromise = null;
      });
    }
    return this.initPromise;
  }

  private async doInitBaseClasses(): Promise<void> {
    const existing = await this.db.getAll<Class>("class");
    const existingAreaTiers = new Set(existing.map((c) => `${c.area_id}_${c.tier}`));
    const nowIso = this.nowIso();
    const toInsert: Class[] = [];

    for (const area of BASE_AREAS) {
      const key = `${area.code}_1`;
      if (!existingAreaTiers.has(key)) {
        toInsert.push({
          id: `cls_base_${area.code.toLowerCase()}`,
          area_id: area.code,
          tier: 1,
          name: BASE_CLASS_NAMES[area.code] || `Aprendiz de ${area.name}`,
          description: `Classe inicial de grau Aprendiz na esfera de ${area.name}.`,
          unlocked_at: nowIso,
          is_active: false,
          created_at: nowIso,
        });
      }
    }

    if (toInsert.length > 0) {
      await this.db.putBatch("class", toInsert);
      void logger.info("game", `[Classes] ${toInsert.length} classes base de grau Aprendiz inicializadas.`);
      this.notifyChange();
    }
  }

  public async getClasses(areaId?: AreaCode): Promise<Class[]> {
    await this.initBaseClasses();
    const all = await this.db.getAll<Class>("class");
    if (areaId) {
      return all.filter((c) => c.area_id === areaId).sort((a, b) => b.tier - a.tier);
    }
    return all.sort((a, b) => b.tier - a.tier);
  }

  public async getHighestUnlockedClass(areaId: AreaCode): Promise<Class> {
    const classes = await this.getClasses(areaId);
    if (classes.length > 0) {
      return classes[0]; // sorted descending by tier
    }
    const nowIso = this.nowIso();
    const baseClass: Class = {
      id: `cls_base_${areaId.toLowerCase()}`,
      area_id: areaId,
      tier: 1,
      name: BASE_CLASS_NAMES[areaId],
      description: `Classe inicial de grau Aprendiz na esfera de ${areaId}.`,
      unlocked_at: nowIso,
      is_active: false,
      created_at: nowIso,
    };
    await this.db.put("class", baseClass);
    return baseClass;
  }

  public async getAllUnlockedClasses(): Promise<Class[]> {
    await this.initBaseClasses();
    const all = await this.db.getAll<Class>("class");
    return all
      .filter((c) => c.unlocked_at !== null)
      .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
  }

  public async getChallenges(areaId?: AreaCode): Promise<ClassChallenge[]> {
    const all = await this.db.getAll<ClassChallenge>("class_challenge");
    const filtered = areaId ? all.filter((c) => c.area_id === areaId) : all;
    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async getActiveChallenge(areaId?: AreaCode): Promise<ClassChallenge | null> {
    const all = await this.getChallenges(areaId);
    // Prioritize 'aceita' challenge first, then 'proposta'
    const accepted = all.find((c) => c.status === "aceita");
    if (accepted) return accepted;
    const proposed = all.find((c) => c.status === "proposta");
    return proposed ?? null;
  }

  public async proposeChallenge(params: {
    areaId: AreaCode;
    targetTier: number;
    name_class: string;
    challenge_title: string;
    challenge_description: string;
  }): Promise<ClassChallenge> {
    // Guard 1: only one in-progress challenge per area.
    const areaChallenges = await this.getChallenges(params.areaId);
    const inProgress = areaChallenges.find((c) => ACTIVE_CHALLENGE_STATUSES.includes(c.status));
    if (inProgress) {
      throw new ActiveChallengeExistsError(params.areaId, inProgress.id);
    }

    // Guard 2: target tier must be exactly the next tier (no duplicates, no skipping).
    const highest = await this.getHighestUnlockedClass(params.areaId);
    if (params.targetTier !== highest.tier + 1) {
      throw new InvalidChallengeTierError(params.areaId, highest.tier, params.targetTier);
    }

    const nowIso = this.nowIso();
    const formattedClassName = formatClassTitle(params.name_class, params.targetTier);
    const newChallenge: ClassChallenge = {
      id: `clc_${this.clock.now()}_${Math.random().toString(36).slice(2, 7)}`,
      area_id: params.areaId,
      target_tier: params.targetTier,
      name_class: formattedClassName,
      challenge_title: params.challenge_title.trim(),
      challenge_description: params.challenge_description.trim(),
      title: params.challenge_title.trim(),
      description: params.challenge_description.trim(),
      status: "proposta",
      completed_at: null,
      created_at: nowIso,
    };

    await this.db.put("class_challenge", newChallenge);
    void logger.info("game", `[Desafio Proposto] Provação para ${newChallenge.name_class} gerada`, {
      areaId: newChallenge.area_id,
      targetTier: newChallenge.target_tier,
      title: newChallenge.challenge_title,
    });

    this.notifyChange();
    return newChallenge;
  }

  public async acceptChallenge(challengeId: string): Promise<ClassChallenge> {
    const challenge = await this.db.get<ClassChallenge>("class_challenge", challengeId);
    if (!challenge) {
      throw new Error(`Desafio de classe '${challengeId}' não encontrado.`);
    }

    const nextStatus = transitionChallengeStatus(challenge.status, "aceita");
    challenge.status = nextStatus;

    await this.db.put("class_challenge", challenge);
    void logger.info("game", `[Desafio Aceito] Provação de classe aceita pelo Escolhido`, {
      challengeId: challenge.id,
      title: challenge.challenge_title,
    });

    this.notifyChange();
    return challenge;
  }

  public async completeChallenge(
    challengeId: string,
    options?: { autoEquipTitle?: boolean }
  ): Promise<{ challenge: ClassChallenge; unlockedClass: Class; profile: Profile }> {
    const challenge = await this.db.get<ClassChallenge>("class_challenge", challengeId);
    if (!challenge) {
      throw new Error(`Desafio de classe '${challengeId}' não encontrado.`);
    }

    const nextStatus = transitionChallengeStatus(challenge.status, "concluida");
    const nowIso = this.nowIso();

    // Guard: never create a duplicate class for an already unlocked tier.
    const areaClasses = await this.getClasses(challenge.area_id);
    const highestTier = areaClasses[0]?.tier ?? 1;
    if (challenge.target_tier !== highestTier + 1) {
      throw new InvalidChallengeTierError(challenge.area_id, highestTier, challenge.target_tier);
    }

    const completedChallenge: ClassChallenge = {
      ...challenge,
      status: nextStatus,
      completed_at: nowIso,
    };

    const formattedClassName = formatClassTitle(challenge.name_class, challenge.target_tier);

    // Create the newly unlocked class (only the newest class of the area stays active)
    const newClass: Class = {
      id: `cls_${this.clock.now()}_${Math.random().toString(36).slice(2, 6)}`,
      area_id: challenge.area_id,
      tier: challenge.target_tier,
      name: formattedClassName,
      description: `Classe consagrada pelo cumprimento da provação: ${challenge.challenge_title}`,
      unlocked_at: nowIso,
      is_active: true,
      created_at: nowIso,
    };
    const deactivated = areaClasses
      .filter((c) => c.is_active)
      .map((c) => ({ ...c, is_active: false }));

    // Update profile title if requested (default: true)
    const storedProfile = await this.db.get<Profile>("profile", MAIN_PROFILE_ID);
    let profile: Profile;
    if (!storedProfile) {
      profile = createDefaultProfile(nowIso, { title: formattedClassName });
    } else if (options?.autoEquipTitle !== false) {
      profile = { ...storedProfile, title: formattedClassName, updated_at: nowIso };
    } else {
      profile = storedProfile;
    }

    // Single atomic transaction: challenge + classes + profile
    await this.db.putAtomic([
      { table: "class_challenge", item: completedChallenge },
      ...deactivated.map((item) => ({ table: "class" as const, item })),
      { table: "class", item: newClass },
      { table: "profile", item: profile },
    ]);

    void logger.info("game", `[Classe Ascendida] O Escolhido ascendeu a ${newClass.name} (Tier ${newClass.tier})`, {
      areaId: newClass.area_id,
      tier: newClass.tier,
      className: newClass.name,
      newTitle: profile.title,
    });

    this.notifyChange();
    return { challenge: completedChallenge, unlockedClass: newClass, profile };
  }

  public async abandonChallenge(challengeId: string): Promise<ClassChallenge> {
    const challenge = await this.db.get<ClassChallenge>("class_challenge", challengeId);
    if (!challenge) {
      throw new Error(`Desafio de classe '${challengeId}' não encontrado.`);
    }

    const nextStatus = transitionChallengeStatus(challenge.status, "desistida");
    challenge.status = nextStatus;

    await this.db.put("class_challenge", challenge);
    void logger.info("game", `[Desafio Desistido] Provação de classe cancelada`, {
      challengeId: challenge.id,
      title: challenge.challenge_title,
    });

    this.notifyChange();
    return challenge;
  }

  public async equipTitle(newTitle: string): Promise<Profile> {
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) {
      throw new Error("Título não pode ser vazio.");
    }
    const profile = await this.db.get<Profile>("profile", MAIN_PROFILE_ID);
    const now = this.nowIso();
    if (!profile) {
      const created = createDefaultProfile(now, { title: cleanTitle });
      await this.db.put("profile", created);
      void logger.info("game", `[Título Equipado] Perfil criado e título equipado: ${cleanTitle}`, {
        title: cleanTitle,
      });
      this.notifyChange();
      return created;
    }

    const updated: Profile = {
      ...profile,
      title: cleanTitle,
      updated_at: now,
    };
    await this.db.put("profile", updated);
    void logger.info("game", `[Título Equipado] O Escolhido equipou o título: ${cleanTitle}`, {
      title: cleanTitle,
    });

    this.notifyChange();
    return updated;
  }
}

export const classRepository = new ClassRepository();
