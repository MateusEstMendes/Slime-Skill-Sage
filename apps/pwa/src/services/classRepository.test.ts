import { describe, it, expect, beforeEach } from "vitest";
import { localDb } from "./db";
import { classRepository } from "./classRepository";
import { BASE_CLASS_NAMES } from "@slime-sage/game";

describe("ClassRepository (IndexedDB Integration)", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
  });

  it("initializes 5 default Aprendiz classes for each base area with Roman brackets", () => {
    return classRepository.initBaseClasses().then(async () => {
      const classes = await classRepository.getClasses();

      expect(classes.length).toBeGreaterThanOrEqual(5);
      const intClass = classes.find((c) => c.area_id === "INT");
      expect(intClass).toBeDefined();
      expect(intClass?.tier).toBe(1);
      expect(intClass?.name).toBe(BASE_CLASS_NAMES.INT);
      expect(intClass?.name).toBe("[Aprendiz da Lógica I]");
    });
  });

  it("proposes, accepts, completes challenge and unlocks new class and equips title", async () => {
    await classRepository.initBaseClasses();

    // 1. Propose challenge for Tier 2 in INT
    const proposed = await classRepository.proposeChallenge({
      areaId: "INT",
      targetTier: 2,
      name_class: "Erudito Arcano",
      challenge_title: "A Provação dos Tomos Esquecidos",
      challenge_description: "Estude por 45 minutos seguidos.",
    });

    expect(proposed.status).toBe("proposta");
    expect(proposed.name_class).toBe("[Erudito Arcano II]");
    expect(proposed.target_tier).toBe(2);

    // 2. Accept challenge
    const accepted = await classRepository.acceptChallenge(proposed.id);
    expect(accepted.status).toBe("aceita");

    const active = await classRepository.getActiveChallenge("INT");
    expect(active?.id).toBe(proposed.id);
    expect(active?.status).toBe("aceita");

    // 3. Complete challenge (autodeclarado)
    const { challenge, unlockedClass, profile } = await classRepository.completeChallenge(
      proposed.id,
      { autoEquipTitle: true }
    );

    expect(challenge.status).toBe("concluida");
    expect(challenge.completed_at).toBeTruthy();
    expect(unlockedClass.name).toBe("[Erudito Arcano II]");
    expect(unlockedClass.tier).toBe(2);
    expect(profile.title).toBe("[Erudito Arcano II]");

    // 4. Highest class in INT should now be Tier 2
    const highestInt = await classRepository.getHighestUnlockedClass("INT");
    expect(highestInt.tier).toBe(2);
    expect(highestInt.name).toBe("[Erudito Arcano II]");
  });

  it("allows abandoning an active challenge and updates status to desistida", async () => {
    const proposed = await classRepository.proposeChallenge({
      areaId: "FOR",
      targetTier: 2,
      name_class: "Guardião de Ferro",
      challenge_title: "O Juramento do Aço",
      challenge_description: "Treine por 40 minutos.",
    });

    expect(proposed.name_class).toBe("[Guardião de Ferro II]");

    await classRepository.acceptChallenge(proposed.id);
    const abandoned = await classRepository.abandonChallenge(proposed.id);

    expect(abandoned.status).toBe("desistida");

    const active = await classRepository.getActiveChallenge("FOR");
    expect(active).toBeNull();
  });

  it("equips title in profile and verifies persistence", async () => {
    await classRepository.initBaseClasses();
    const updated = await classRepository.equipTitle("[Mestre Supremo da Criação IV]");

    expect(updated.title).toBe("[Mestre Supremo da Criação IV]");

    const profile = await localDb.get<{ title: string }>("profile", "profile_main");
    expect(profile?.title).toBe("[Mestre Supremo da Criação IV]");
  });

  it("prevents creating duplicate active challenges in the same area", async () => {
    await classRepository.initBaseClasses();
    await classRepository.proposeChallenge({
      areaId: "INT",
      targetTier: 2,
      name_class: "Erudito Arcano",
      challenge_title: "Provação Um",
      challenge_description: "Estude por 30m",
    });

    await expect(
      classRepository.proposeChallenge({
        areaId: "INT",
        targetTier: 2,
        name_class: "Segundo Erudito",
        challenge_title: "Provação Dois",
        challenge_description: "Estude mais 30m",
      })
    ).rejects.toThrow("Já existe uma provação ativa na área INT");
  });

  it("rejects challenge targeting an invalid tier leap", async () => {
    await classRepository.initBaseClasses(); // Base tier is 1

    await expect(
      classRepository.proposeChallenge({
        areaId: "INT",
        targetTier: 4, // Attempting to leap directly from 1 to 4
        name_class: "Arquimago",
        challenge_title: "Salto Ilegal",
        challenge_description: "Tentando burlar os patamares",
      })
    ).rejects.toThrow("Tier alvo inválido para INT");
  });

  it("deactivates older classes when a new tier is completed and unlocked", async () => {
    await classRepository.initBaseClasses();

    const proposed = await classRepository.proposeChallenge({
      areaId: "DIS",
      targetTier: 2,
      name_class: "Sentinela de Ferro",
      challenge_title: "Vigília Constante",
      challenge_description: "Mantenha o foco sem interrupções",
    });

    await classRepository.acceptChallenge(proposed.id);
    await classRepository.completeChallenge(proposed.id);

    const disClasses = await classRepository.getClasses("DIS");
    const activeClasses = disClasses.filter((c) => c.is_active);
    expect(activeClasses.length).toBe(1);
    expect(activeClasses[0].tier).toBe(2);
    expect(activeClasses[0].name).toBe("[Sentinela de Ferro II]");
  });
});
