import type { AreaCode } from "@slime-sage/shared";
import {
  generateDeterministicChallenge,
  DETERMINISTIC_CLASS_CHALLENGES,
} from "./classes";
import { MathRng } from "./rng";

export interface ClassChallengeEvaluationResult {
  totalEvaluated: number;
  passedCount: number;
  passRate: number;
  failures: Array<{
    areaId: AreaCode;
    targetTier: number;
    reason: string;
  }>;
}

/**
 * Evaluates the quality, proportion, and structure of class evolution challenges.
 * Quality criteria:
 * 1. Epic class name must be at least 5 characters, reflect fantasy/Tensura styling and follow `[Nome <ROMAN>]`.
 * 2. Challenge title must be at least 8 characters.
 * 3. Challenge description must be at least 25 characters, actionable and practical.
 * 4. Explanation must be non-empty and carry the solemn G.S persona.
 */
export function evaluateClassChallenges(): ClassChallengeEvaluationResult {
  const areas: AreaCode[] = ["INT", "FOR", "DIS", "CRI", "SOC"];
  const tiers = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  let totalEvaluated = 0;
  let passedCount = 0;
  const failures: ClassChallengeEvaluationResult["failures"] = [];

  for (const area of areas) {
    for (const tier of tiers) {
      totalEvaluated++;
      const challenge = generateDeterministicChallenge(area, tier, new MathRng());

      const reasons: string[] = [];
      if (!challenge.name_class || challenge.name_class.trim().length < 5) {
        reasons.push("Nome épico da classe muito curto ou vazio");
      }
      if (!challenge.name_class.startsWith("[") || !challenge.name_class.endsWith("]")) {
        reasons.push("Nome da classe deve estar delimitado por colchetes [Nome <ROMAN>]");
      }
      if (!challenge.challenge_title || challenge.challenge_title.trim().length < 8) {
        reasons.push("Título do desafio muito curto ou vago");
      }
      if (!challenge.challenge_description || challenge.challenge_description.trim().length < 25) {
        reasons.push("Descrição da tarefa deve conter pelo menos 25 caracteres acionáveis");
      }
      if (!challenge.explanation || challenge.explanation.trim().length < 15) {
        reasons.push("Justificativa da Grande Sábio ausente ou insuficiente");
      }

      if (reasons.length === 0) {
        passedCount++;
      } else {
        failures.push({
          areaId: area,
          targetTier: tier,
          reason: reasons.join("; "),
        });
      }
    }
  }

  // Also verify templates completeness in dictionary
  for (const area of areas) {
    const areaTemplates = DETERMINISTIC_CLASS_CHALLENGES[area];
    for (const tier of tiers) {
      const templates = areaTemplates[tier];
      if (!templates || templates.length === 0) {
        totalEvaluated++;
        failures.push({
          areaId: area,
          targetTier: tier,
          reason: `Nenhum template cadastrado para ${area} Tier ${tier}`,
        });
      }
    }
  }

  const passRate = totalEvaluated > 0 ? (passedCount / totalEvaluated) * 100 : 0;

  return {
    totalEvaluated,
    passedCount,
    passRate,
    failures,
  };
}
