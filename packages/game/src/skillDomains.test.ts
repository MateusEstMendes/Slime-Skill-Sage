import { describe, it, expect } from "vitest";
import type { Skill } from "@slime-sage/shared";
import {
  checkSkillSynergy,
  inferSkillDomain,
  generateDeterministicFusion,
} from "./skillDomains";
import { calculateRacialAffinityBonus } from "./skills";

describe("Skill Domains and Deterministic Fusion Synergy", () => {
  it("infers canonical domain from text and area correctly", () => {
    const magicSkill = {
      name: "Algoritmos Arcanos de Grafos",
      area_id: "INT" as const,
      description: "Manipulação de dados e lógica profunda",
    };
    const inferredMagic = inferSkillDomain(magicSkill);
    expect(inferredMagic.domain).toBe("Arcana");
    expect(inferredMagic.tags).toContain("conhecimento");

    const combatSkill = {
      name: "Supino Reto e Flexão Diamante",
      area_id: "FOR" as const,
      description: "Treino de força bruta e hipertrofia",
    };
    const inferredCombat = inferSkillDomain(combatSkill);
    expect(inferredCombat.domain).toBe("Combate");
    expect(inferredCombat.tags).toContain("combate");
  });

  it("calculates high synergy for complementary domains (Arcana + Elemental)", () => {
    const skillA: Skill = {
      id: "sk_1",
      area_id: "INT",
      name: "Manipulação de Mana",
      description: "Controle arcano de energia",
      tier: "especial",
      mastery: 250,
      domain: "Arcana",
      tags: ["magia", "energia"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const skillB: Skill = {
      id: "sk_2",
      area_id: "INT",
      name: "Evocação de Tempestade",
      description: "Conexão elemental com o vento",
      tier: "especial",
      mastery: 200,
      domain: "Elemental",
      tags: ["elementos", "energia"], // shares "energia" tag!
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const synergy = checkSkillSynergy(skillA, skillB);
    expect(synergy.isCompatible).toBe(true);
    expect(synergy.synergyScore).toBeGreaterThanOrEqual(85);
    expect(synergy.affinityType).toBe("Elemental");
    expect(synergy.commonTags).toContain("energia");
    expect(synergy.targetTier).toBe("extra"); // Tier ascends upon fusion
  });

  it("blocks fusion of a skill with itself", () => {
    const skillA: Skill = {
      id: "sk_same",
      area_id: "FOR",
      name: "Golpe Titânico",
      description: "Impacto devastador",
      tier: "comum",
      mastery: 50,
      domain: "Combate",
      tags: ["forca"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const synergy = checkSkillSynergy(skillA, skillA);
    expect(synergy.isCompatible).toBe(false);
    expect(synergy.synergyScore).toBe(0);
    expect(synergy.reason).toContain("Não é possível fundir uma habilidade consigo mesma");
  });

  it("generates deterministic offline fusion proposal and questionnaire", () => {
    const skillA: Skill = {
      id: "sk_strat",
      area_id: "INT",
      name: "Visão Macro",
      description: "Planejamento de longo prazo",
      tier: "comum",
      mastery: 80,
      domain: "Estratégia",
      tags: ["tatico"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const skillB: Skill = {
      id: "sk_sob",
      area_id: "DIS",
      name: "Disciplina Inabalável",
      description: "Foco sem interrupção",
      tier: "comum",
      mastery: 90,
      domain: "Soberania",
      tags: ["tatico", "foco"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const synergy = checkSkillSynergy(skillA, skillB);
    expect(synergy.isCompatible).toBe(true);

    const proposal = generateDeterministicFusion(skillA, skillB, synergy);
    expect(proposal.suggestedName).toContain("Visão Macro · Disciplina Inabalável");
    expect(proposal.questions).toHaveLength(2);
    expect(proposal.questions[0].options.length).toBeGreaterThanOrEqual(3);
    expect(proposal.focusAnchorMinutes).toBe(30);
  });

  it("calculates racial affinity bonus (+2 fixed pts) strictly for hunter's primary race area", () => {
    // Slime -> INT
    expect(calculateRacialAffinityBonus("Slime", "INT")).toBe(2);
    expect(calculateRacialAffinityBonus("Slime", "FOR")).toBe(0);

    // Kijin -> FOR
    expect(calculateRacialAffinityBonus("Kijin", "FOR")).toBe(2);
    expect(calculateRacialAffinityBonus("Kijin", "INT")).toBe(0);

    // Draconiano -> DIS
    expect(calculateRacialAffinityBonus("Draconiano", "DIS")).toBe(2);
    expect(calculateRacialAffinityBonus("Draconiano", "CRI")).toBe(0);

    // Majin -> CRI
    expect(calculateRacialAffinityBonus("Majin", "CRI")).toBe(2);
    expect(calculateRacialAffinityBonus("Majin", "SOC")).toBe(0);

    // Homem-Fera -> SOC
    expect(calculateRacialAffinityBonus("Homem-Fera", "SOC")).toBe(2);
    expect(calculateRacialAffinityBonus("Homem-Fera", "DIS")).toBe(0);

    // Undefined race -> 0
    expect(calculateRacialAffinityBonus(undefined, "INT")).toBe(0);
  });
});
