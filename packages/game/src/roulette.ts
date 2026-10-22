import type { Skill, SkillTier, EvolutionAttempt } from "@slime-sage/shared";
import {
  ROULETTE_BASE_CHANCE,
  ROULETTE_PITY_PER_FAILURE,
  ROULETTE_MAX_CHANCE,
  ROULETTE_COOLDOWN_MS,
  SKILL_TIER_THRESHOLDS,
} from "./config";
import type { Clock } from "./clock";
import type { Rng } from "./rng";

/**
 * Returns the next higher tier in the canon evolution ladder,
 * or null if the tier cannot advance via roulette.
 */
export function getNextEvolutionTier(tier: SkillTier): SkillTier | null {
  switch (tier) {
    case "extra":
      return "unica";
    case "unica":
      return "suprema";
    case "suprema":
      return "primordial";
    default:
      return null;
  }
}

/**
 * Pure function: calculates the exact success probability of the Esoteric Roulette.
 * Formula: Math.min(0.80, 0.20 + (failureCount * 0.10)).
 */
export function calculateRouletteChance(failureCount: number): number {
  const safeFailures = Math.max(0, Math.floor(failureCount));
  const rawChance = ROULETTE_BASE_CHANCE + safeFailures * ROULETTE_PITY_PER_FAILURE;
  return Math.min(ROULETTE_MAX_CHANCE, Math.round(rawChance * 100) / 100);
}

export interface RouletteEligibilityResult {
  isEligible: boolean;
  targetTier: SkillTier | null;
  currentChance: number;
  isInCooldown: boolean;
  cooldownRemainingMs: number;
  missingMastery: number;
  missingProjects: number;
  reason?: string;
}

/**
 * Pure function: checks if a skill can undergo the Esoteric Roulette ritual.
 * Criteria:
 * 1. Skill must be of tier "extra", "unica", or "suprema".
 * 2. Mastery must have reached the ceiling of its tier (e.g. 600 for extra, 1200 for unica, 2500 for suprema).
 * 3. Hunter must have completed at least 1 associated project.
 * 4. Soul cooldown of 48h from a previous failed attempt must have expired.
 */
export function checkRouletteEligibility(params: {
  skill: { id: string; tier: SkillTier; mastery: number };
  completedProjectsCount: number;
  failureCount?: number;
  lastCooldownUntil?: string | null;
  now: Date | number;
}): RouletteEligibilityResult {
  const { skill, completedProjectsCount, failureCount = 0, lastCooldownUntil, now } = params;
  const nowMs = typeof now === "number" ? now : now.getTime();
  const targetTier = getNextEvolutionTier(skill.tier);

  const currentChance = calculateRouletteChance(failureCount);

  if (!targetTier) {
    return {
      isEligible: false,
      targetTier: null,
      currentChance,
      isInCooldown: false,
      cooldownRemainingMs: 0,
      missingMastery: 0,
      missingProjects: 0,
      reason: `Grau '${skill.tier}' não realiza evolução via Roleta Esotérica.`,
    };
  }

  const requiredMastery = SKILL_TIER_THRESHOLDS[skill.tier];
  const missingMastery = Math.max(0, requiredMastery - skill.mastery);
  const missingProjects = Math.max(0, 1 - completedProjectsCount);

  let isInCooldown = false;
  let cooldownRemainingMs = 0;
  if (lastCooldownUntil) {
    const cdTime = new Date(lastCooldownUntil).getTime();
    if (cdTime > nowMs) {
      isInCooldown = true;
      cooldownRemainingMs = cdTime - nowMs;
    }
  }

  if (isInCooldown) {
    const hoursRemaining = Math.ceil(cooldownRemainingMs / (3600 * 1000));
    return {
      isEligible: false,
      targetTier,
      currentChance,
      isInCooldown: true,
      cooldownRemainingMs,
      missingMastery,
      missingProjects,
      reason: `Repouso da Alma ativo. Aguarde ${hoursRemaining}h antes de girar novamente.`,
    };
  }

  if (missingMastery > 0) {
    return {
      isEligible: false,
      targetTier,
      currentChance,
      isInCooldown: false,
      cooldownRemainingMs: 0,
      missingMastery,
      missingProjects,
      reason: `Maestria insuficiente. Faltam ${missingMastery} pts para atingir ${requiredMastery} pts.`,
    };
  }

  if (missingProjects > 0) {
    return {
      isEligible: false,
      targetTier,
      currentChance,
      isInCooldown: false,
      cooldownRemainingMs: 0,
      missingMastery: 0,
      missingProjects,
      reason: "Exige a consagração de pelo menos 1 Projeto concluído.",
    };
  }

  return {
    isEligible: true,
    targetTier,
    currentChance,
    isInCooldown: false,
    cooldownRemainingMs: 0,
    missingMastery: 0,
    missingProjects: 0,
  };
}

export interface RouletteSpinResult {
  success: boolean;
  rolledValue: number;
  finalChance: number;
  previousTier: SkillTier;
  newTier: SkillTier;
  cooldownUntil: string | null;
  newFailureCount: number;
  attempt: EvolutionAttempt;
}

/**
 * Pure function: executes a spin on the Esoteric Roulette.
 * - Injects Clock and Rng for 100% determinism.
 * - Applies Hardcore rules:
 *   - 20% base chance + 10% pity per previous failure (up to 80% ceiling);
 *   - Success: elevates tier, resets failure count to 0, no cooldown;
 *   - Failure: preserves tier and all mastery (zero loss), adds +1 failure to pity, sets 48h cooldown.
 */
export function executeRouletteSpin(params: {
  skill: Skill;
  failureCount: number;
  rng: Rng;
  clock: Clock;
}): RouletteSpinResult {
  const { skill, failureCount, rng, clock } = params;
  const targetTier = getNextEvolutionTier(skill.tier);
  if (!targetTier) {
    throw new Error(`A habilidade '${skill.name}' no grau '${skill.tier}' não pode girar a Roleta.`);
  }

  const finalChance = calculateRouletteChance(failureCount);
  const rolledValue = rng.nextFloat();
  const success = rolledValue < finalChance;

  const nowMs = clock.now();
  const nowIso = new Date(nowMs).toISOString();

  const newTier = success ? targetTier : skill.tier;
  const cooldownUntil = success ? null : new Date(nowMs + ROULETTE_COOLDOWN_MS).toISOString();
  const newFailureCount = success ? 0 : failureCount + 1;

  const failureBonus = Math.min(
    ROULETTE_MAX_CHANCE - ROULETTE_BASE_CHANCE,
    failureCount * ROULETTE_PITY_PER_FAILURE
  );

  const attempt: EvolutionAttempt = {
    id: `evo_${nowMs}_${Math.random().toString(36).slice(2, 7)}`,
    skill_id: skill.id,
    target_tier: targetTier,
    base_chance: ROULETTE_BASE_CHANCE,
    failure_bonus: Math.round(failureBonus * 100) / 100,
    final_chance: finalChance,
    rolled_value: Math.round(rolledValue * 1000) / 1000,
    success,
    cooldown_until: cooldownUntil,
    created_at: nowIso,
  };

  return {
    success,
    rolledValue,
    finalChance,
    previousTier: skill.tier,
    newTier,
    cooldownUntil,
    newFailureCount,
    attempt,
  };
}
