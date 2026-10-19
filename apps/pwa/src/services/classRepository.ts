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
} from "@slime-sage/game";
import { localDb } from "./db";
import { logger } from "./logger";

export class ClassRepository {
  private db = localDb;
  private listeners: Array<() => void> = [];

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
   */
  public async initBaseClasses(): Promise<void> {
    const existing = await this.db.getAll<Class>("class");
    const existingAreaTiers = new Set(existing.map((c) => `${c.area_id}_${c.tier}`));
    const nowIso = new Date().toISOString();
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
    const nowIso = new Date().toISOString();
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
    const nowIso = new Date().toISOString();
    const formattedClassName = formatClassTitle(params.name_class, params.targetTier);
    const newChallenge: ClassChallenge = {
      id: `clc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
    const nowIso = new Date().toISOString();

    challenge.status = nextStatus;
    challenge.completed_at = nowIso;
    await this.db.put("class_challenge", challenge);

    const formattedClassName = formatClassTitle(challenge.name_class, challenge.target_tier);

    // Create the newly unlocked class
    const newClass: Class = {
      id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      area_id: challenge.area_id,
      tier: challenge.target_tier,
      name: formattedClassName,
      description: `Classe consagrada pelo cumprimento da provação: ${challenge.challenge_title}`,
      unlocked_at: nowIso,
      is_active: true,
      created_at: nowIso,
    };
    await this.db.put("class", newClass);

    // Update profile title if requested (default: true)
    let profile = await this.db.get<Profile>("profile", "profile_main");
    if (!profile) {
      profile = {
        id: "profile_main",
        name: "Rimuru Tempest",
        title: formattedClassName,
        race: "Slime",
        rank_threat: "Classe Menor",
        level: 1,
        current_xp: 0,
        total_xp: 0,
        streak_count: 0,
        last_active_date: nowIso.slice(0, 10),
        onboarding_done: true,
        created_at: nowIso,
        updated_at: nowIso,
      };
    } else if (options?.autoEquipTitle !== false) {
      profile = {
        ...profile,
        title: formattedClassName,
        updated_at: nowIso,
      };
    }
    await this.db.put("profile", profile);

    void logger.info("game", `[Classe Ascendida] O Escolhido ascendeu a ${newClass.name} (Tier ${newClass.tier})`, {
      areaId: newClass.area_id,
      tier: newClass.tier,
      className: newClass.name,
      newTitle: profile.title,
    });

    this.notifyChange();
    return { challenge, unlockedClass: newClass, profile };
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
    let profile = await this.db.get<Profile>("profile", "profile_main");
    const now = new Date().toISOString();
    if (!profile) {
      profile = {
        id: "profile_main",
        name: "Rimuru Tempest",
        title: cleanTitle,
        race: "Slime",
        rank_threat: "Classe Menor",
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
      void logger.info("game", `[Título Equipado] Perfil criado e título equipado: ${cleanTitle}`, {
        title: cleanTitle,
      });
      this.notifyChange();
      return profile;
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
