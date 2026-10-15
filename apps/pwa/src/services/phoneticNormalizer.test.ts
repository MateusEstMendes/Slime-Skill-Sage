import { describe, it, expect } from "vitest";
import { normalizePhonetics } from "./phoneticNormalizer";

describe("phoneticNormalizer", () => {
  it("normalizes 'Slime Sage' to 'Slime Séidji'", () => {
    const input = "Aviso. O Sistema Slime Sage foi inicializado com sucesso.";
    const output = normalizePhonetics(input);
    expect(output).toBe("Aviso. O Sistema Slime Séidji foi inicializado com sucesso.");
  });

  it("normalizes gaming terms like XP, Level, Skill, Quest, Streak", () => {
    expect(normalizePhonetics("Você ganhou 50 XP e subiu de Level")).toBe(
      "Você ganhou 50 Xis Pê e subiu de Lével"
    );
    expect(normalizePhonetics("Nova Skill desbloqueada")).toBe(
      "Nova Isquil desbloqueada"
    );
    expect(normalizePhonetics("Complete a Quest para manter o Streak")).toBe(
      "Complete a Késti para manter o Istríki"
    );
  });

  it("normalizes G.S and Tensura terms", () => {
    expect(normalizePhonetics("Aviso da G.S: mundo de Tensura")).toBe(
      "Aviso da Grande Sábio: mundo de Tençura"
    );
  });
});
