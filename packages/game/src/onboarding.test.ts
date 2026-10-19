import { describe, it, expect } from "vitest";
import {
  ONBOARDING_QUESTIONS,
  TENSURA_RACES_ORDER,
  calculateOnboardingResult,
} from "./onboarding";

describe("Onboarding Deterministic Engine (@slime-sage/game)", () => {
  it("deve conter exatamente 5 perguntas solenes com áudios oficiais q1 a q5", () => {
    expect(ONBOARDING_QUESTIONS).toHaveLength(5);
    expect(ONBOARDING_QUESTIONS.map((q) => q.id)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
    expect(ONBOARDING_QUESTIONS.map((q) => q.audioUrl)).toEqual([
      "/audio/voice/onboarding-q1.mp3",
      "/audio/voice/onboarding-q2.mp3",
      "/audio/voice/onboarding-q3.mp3",
      "/audio/voice/onboarding-q4.mp3",
      "/audio/voice/onboarding-q5.mp3",
    ]);
  });

  it("deve determinar a raça Slime quando as respostas de adaptabilidade predominam", () => {
    const result = calculateOnboardingResult(
      ["q1_slime", "q2_slime", "q3_slime", "q4_slime", "q5_menor"],
      "Rimuru Tempest",
    );

    expect(result.race).toBe("Slime");
    expect(result.raceMeta.dominantArea).toBe("INT");
    expect(result.rankThreat).toBe("Hazard"); // 3+3+3+3+1 = 13 >= 10
    expect(result.proclamationText).toContain("Rimuru Tempest");
    expect(result.proclamationText).toContain("Slime");
  });

  it("deve determinar a raça Kijin quando as respostas de superação predominam", () => {
    const result = calculateOnboardingResult(
      ["q1_kijin", "q2_kijin", "q3_kijin", "q4_kijin", "q5_hazard"],
      "Benimaru",
    );

    expect(result.race).toBe("Kijin");
    expect(result.raceMeta.dominantArea).toBe("FOR");
    expect(result.rankThreat).toBe("Calamity"); // 3+4+3+3+6 = 19 >= 18
    expect(result.proclamationText).toContain("Benimaru");
    expect(result.proclamationText).toContain("Kijin");
    expect(result.proclamationText).toContain("Calamity");
  });

  it("deve determinar a raça Draconiano e Rank Calamity para foco absoluto e alta disciplina", () => {
    const result = calculateOnboardingResult(
      ["q1_draco", "q2_draco", "q3_draco", "q4_draco", "q5_calamity"],
      "Milim Nava",
    );

    expect(result.race).toBe("Draconiano");
    expect(result.raceMeta.dominantArea).toBe("DIS");
    expect(result.rankThreat).toBe("Calamity");
    expect(result.threatScore).toBe(26);
  });

  it("deve determinar a raça Majin e Rank Classe Menor para escolhas puramente criativas e rotina inicial", () => {
    const result = calculateOnboardingResult(
      ["q1_majin", "q2_majin", "q3_majin", "q4_majin", "q5_menor"],
      "Diablo",
    );

    expect(result.race).toBe("Majin");
    expect(result.raceMeta.dominantArea).toBe("CRI");
    // 2 + 1 + 2 + 2 + 1 = 8 (< 10 => Classe Menor)
    expect(result.threatScore).toBe(8);
    expect(result.rankThreat).toBe("Classe Menor");
  });

  it("deve determinar a raça Homem-Fera para respostas voltadas a aliança e liderança", () => {
    const result = calculateOnboardingResult(
      ["q1_fera", "q2_fera", "q3_fera", "q4_fera", "q5_hazard"],
      "Ranga",
    );

    expect(result.race).toBe("Homem-Fera");
    expect(result.raceMeta.dominantArea).toBe("SOC");
    // 2 + 2 + 2 + 3 + 6 = 15 (Hazard)
    expect(result.threatScore).toBe(15);
    expect(result.rankThreat).toBe("Hazard");
  });

  it("deve aplicar desempate estrito na ordem canônica TENSURA_RACES_ORDER quando houver empate", () => {
    // Sem opções válidas -> todas as raças com 0 pontos -> desempata no primeiro da lista (Slime)
    const emptyResult = calculateOnboardingResult([], "   ");
    expect(emptyResult.race).toBe(TENSURA_RACES_ORDER[0]);
    expect(emptyResult.rankThreat).toBe("Classe Menor");
    expect(emptyResult.proclamationText).toContain("Caçador");

    // Empate entre Kijin (3 pts) e Majin (3 pts) -> Kijin precede Majin em TENSURA_RACES_ORDER
    const tieKijinMajin = calculateOnboardingResult(["q1_kijin", "q4_majin"], "Shion");
    expect(tieKijinMajin.raceScores.Kijin).toBe(3);
    expect(tieKijinMajin.raceScores.Majin).toBe(3);
    expect(tieKijinMajin.race).toBe("Kijin");
  });

  it("deve ignorar IDs de opção desconhecidos sem lançar exceção", () => {
    const result = calculateOnboardingResult(["id_inexistente", "q1_fera"], "Geld");
    expect(result.race).toBe("Homem-Fera");
    expect(result.threatScore).toBe(2);
  });
});
