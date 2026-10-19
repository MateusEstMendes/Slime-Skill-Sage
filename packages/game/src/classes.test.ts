import { describe, it, expect } from "vitest";
import {
  checkClassEligibility,
  transitionChallengeStatus,
  InvalidChallengeTransitionError,
  generateDeterministicChallenge,
  formatClassTitle,
  CLASS_TIER_CONFIG,
  BASE_CLASS_NAMES,
} from "./classes";
import { FixedRng } from "./rng";

describe("Class Tiers & Eligibility Engine", () => {
  it("defines exactly 10 class tier thresholds aligned with 50000 mastery cap", () => {
    expect(CLASS_TIER_CONFIG).toHaveLength(10);
    expect(CLASS_TIER_CONFIG[0]).toEqual({ tier: 1, roman: "I", name: "Aprendiz", minMastery: 0 });
    expect(CLASS_TIER_CONFIG[1]).toEqual({ tier: 2, roman: "II", name: "Iniciante", minMastery: 5000 });
    expect(CLASS_TIER_CONFIG[2]).toEqual({ tier: 3, roman: "III", name: "Adepto", minMastery: 10000 });
    expect(CLASS_TIER_CONFIG[3]).toEqual({ tier: 4, roman: "IV", name: "Veterano", minMastery: 15000 });
    expect(CLASS_TIER_CONFIG[4]).toEqual({ tier: 5, roman: "V", name: "Especialista", minMastery: 20000 });
    expect(CLASS_TIER_CONFIG[5]).toEqual({ tier: 6, roman: "VI", name: "Mestre", minMastery: 25000 });
    expect(CLASS_TIER_CONFIG[6]).toEqual({ tier: 7, roman: "VII", name: "Grão-Mestre", minMastery: 30000 });
    expect(CLASS_TIER_CONFIG[7]).toEqual({ tier: 8, roman: "VIII", name: "Sábio", minMastery: 35000 });
    expect(CLASS_TIER_CONFIG[8]).toEqual({ tier: 9, roman: "IX", name: "Monarca", minMastery: 40000 });
    expect(CLASS_TIER_CONFIG[9]).toEqual({ tier: 10, roman: "X", name: "Lendário", minMastery: 45000 });
  });

  describe("formatClassTitle pure helper", () => {
    it("formats clean title with Roman numeral and brackets", () => {
      expect(formatClassTitle("Analista Metódico", 4)).toBe("[Analista Metódico IV]");
      expect(formatClassTitle("Aprendiz da Lógica", 1)).toBe("[Aprendiz da Lógica I]");
      expect(formatClassTitle("A Onisciência Absoluta", 10)).toBe("[A Onisciência Absoluta X]");
    });

    it("idempotently handles titles that already have brackets or numerals", () => {
      expect(formatClassTitle("[Analista Metódico IV]", 4)).toBe("[Analista Metódico IV]");
      expect(formatClassTitle("[Analista Metódico]", 4)).toBe("[Analista Metódico IV]");
      expect(formatClassTitle("Analista Metódico IV", 4)).toBe("[Analista Metódico IV]");
    });
  });

  it("provides base class names for all 5 areas at Tier 1 with Roman brackets", () => {
    expect(BASE_CLASS_NAMES.INT).toBe("[Aprendiz da Lógica I]");
    expect(BASE_CLASS_NAMES.FOR).toBe("[Corpo Desperto I]");
    expect(BASE_CLASS_NAMES.DIS).toBe("[Iniciante da Vontade I]");
    expect(BASE_CLASS_NAMES.CRI).toBe("[Discípulo do Traço I]");
    expect(BASE_CLASS_NAMES.SOC).toBe("[Ouvinte Atento I]");
  });

  describe("checkClassEligibility boundaries (4999 vs 5000, 9999 vs 10000, etc.)", () => {
    it("evaluates Tier 1 -> Tier 2 (Iniciante) threshold at 5000 pts", () => {
      // 4999 pts -> Not eligible
      const at4999 = checkClassEligibility("INT", 1, 4999);
      expect(at4999.isEligible).toBe(false);
      expect(at4999.currentTier).toBe(1);
      expect(at4999.nextTier).toBe(2);
      expect(at4999.nextTierName).toBe("Iniciante");
      expect(at4999.nextTierRoman).toBe("II");
      expect(at4999.nextTierFormatted).toBe("[Analista Metódico II]");
      expect(at4999.requiredMastery).toBe(5000);
      expect(at4999.pointsRemaining).toBe(1);

      // 5000 pts -> Exactly eligible
      const at5000 = checkClassEligibility("INT", 1, 5000);
      expect(at5000.isEligible).toBe(true);
      expect(at5000.nextTier).toBe(2);
      expect(at5000.nextTierName).toBe("Iniciante");
      expect(at5000.requiredMastery).toBe(5000);
      expect(at5000.pointsRemaining).toBe(0);

      // 6000 pts -> Eligible
      const at6000 = checkClassEligibility("INT", 1, 6000);
      expect(at6000.isEligible).toBe(true);
      expect(at6000.pointsRemaining).toBe(0);
    });

    it("evaluates Tier 2 -> Tier 3 (Adepto) threshold at 10000 pts", () => {
      // 9999 pts -> Not eligible
      const at9999 = checkClassEligibility("FOR", 2, 9999);
      expect(at9999.isEligible).toBe(false);
      expect(at9999.nextTier).toBe(3);
      expect(at9999.nextTierName).toBe("Adepto");
      expect(at9999.nextTierRoman).toBe("III");
      expect(at9999.nextTierFormatted).toBe("[Escudo Vivo III]");
      expect(at9999.requiredMastery).toBe(10000);
      expect(at9999.pointsRemaining).toBe(1);

      // 10000 pts -> Eligible
      const at10000 = checkClassEligibility("FOR", 2, 10000);
      expect(at10000.isEligible).toBe(true);
      expect(at10000.nextTier).toBe(3);
      expect(at10000.pointsRemaining).toBe(0);
    });

    it("evaluates Tier 3 -> Tier 4 (Veterano) threshold at 15000 pts", () => {
      // 14999 pts -> Not eligible
      const at14999 = checkClassEligibility("DIS", 3, 14999);
      expect(at14999.isEligible).toBe(false);
      expect(at14999.nextTier).toBe(4);
      expect(at14999.nextTierName).toBe("Veterano");
      expect(at14999.nextTierRoman).toBe("IV");
      expect(at14999.requiredMastery).toBe(15000);
      expect(at14999.pointsRemaining).toBe(1);

      // 15000 pts -> Eligible
      const at15000 = checkClassEligibility("DIS", 3, 15000);
      expect(at15000.isEligible).toBe(true);
      expect(at15000.nextTier).toBe(4);
      expect(at15000.pointsRemaining).toBe(0);
    });

    it("evaluates Tier 9 -> Tier 10 (Lendário) threshold at 45000 pts", () => {
      // 44999 pts -> Not eligible
      const at44999 = checkClassEligibility("CRI", 9, 44999);
      expect(at44999.isEligible).toBe(false);
      expect(at44999.nextTier).toBe(10);
      expect(at44999.nextTierName).toBe("Lendário");
      expect(at44999.nextTierRoman).toBe("X");
      expect(at44999.requiredMastery).toBe(45000);
      expect(at44999.pointsRemaining).toBe(1);

      // 45000 pts -> Eligible
      const at45000 = checkClassEligibility("CRI", 9, 45000);
      expect(at45000.isEligible).toBe(true);
      expect(at45000.nextTier).toBe(10);
      expect(at45000.pointsRemaining).toBe(0);
    });

    it("handles Tier 10 apex: no higher tier available", () => {
      const atTier10 = checkClassEligibility("SOC", 10, 50000);
      expect(atTier10.isEligible).toBe(false);
      expect(atTier10.currentTier).toBe(10);
      expect(atTier10.currentTierName).toBe("Lendário");
      expect(atTier10.nextTier).toBeNull();
      expect(atTier10.nextTierName).toBeNull();
      expect(atTier10.nextTierFormatted).toBeNull();
      expect(atTier10.requiredMastery).toBeNull();
      expect(atTier10.pointsRemaining).toBe(0);
    });
  });

  describe("Challenge State Machine Transitions", () => {
    it("allows valid transitions: proposta -> aceita -> concluida", () => {
      expect(transitionChallengeStatus("proposta", "aceita")).toBe("aceita");
      expect(transitionChallengeStatus("aceita", "concluida")).toBe("concluida");
    });

    it("allows valid transitions: proposta -> desistida and aceita -> desistida", () => {
      expect(transitionChallengeStatus("proposta", "desistida")).toBe("desistida");
      expect(transitionChallengeStatus("aceita", "desistida")).toBe("desistida");
    });

    it("rejects invalid transitions and throws InvalidChallengeTransitionError", () => {
      // Cannot jump from proposta directly to concluida
      expect(() => transitionChallengeStatus("proposta", "concluida")).toThrow(
        InvalidChallengeTransitionError
      );

      // Cannot reopen a completed challenge
      expect(() => transitionChallengeStatus("concluida", "aceita")).toThrow(
        InvalidChallengeTransitionError
      );
      expect(() => transitionChallengeStatus("concluida", "proposta")).toThrow(
        InvalidChallengeTransitionError
      );

      // Cannot change a surrendered challenge
      expect(() => transitionChallengeStatus("desistida", "aceita")).toThrow(
        InvalidChallengeTransitionError
      );
    });
  });

  describe("Deterministic Challenge Generation", () => {
    it("generates structured challenges with Roman brackets for all 5 areas and tiers 2 to 10", () => {
      const areas = ["INT", "FOR", "DIS", "CRI", "SOC"] as const;
      const tiers = [2, 3, 4, 5, 6, 7, 8, 9, 10];

      for (const area of areas) {
        for (const tier of tiers) {
          const result = generateDeterministicChallenge(area, tier, new FixedRng([0]));
          expect(result.name_class).toMatch(/^\[.+ (II|III|IV|V|VI|VII|VIII|IX|X)\]$/);
          expect(result.challenge_title).toBeTruthy();
          expect(result.challenge_description).toBeTruthy();
          expect(result.explanation).toBeTruthy();
        }
      }
    });

    it("uses provided Rng for deterministic reproducibility", () => {
      const fixedRngA = new FixedRng([0.1]);
      const fixedRngB = new FixedRng([0.1]);

      const resA = generateDeterministicChallenge("INT", 2, fixedRngA);
      const resB = generateDeterministicChallenge("INT", 2, fixedRngB);

      expect(resA.name_class).toBe(resB.name_class);
      expect(resA.challenge_title).toBe(resB.challenge_title);
    });
  });
});
