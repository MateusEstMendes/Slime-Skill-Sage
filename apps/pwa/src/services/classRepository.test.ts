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
});
