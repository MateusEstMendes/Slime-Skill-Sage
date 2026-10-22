import type { AreaCode, MissionSkillBinding, SkillTier, TensuraRace } from "@slime-sage/shared";
import {
  SKILL_TIER_THRESHOLDS,
  RACIAL_AFFINITY_AREAS,
  RACIAL_AFFINITY_BONUS,
  MAX_SKILL_MASTERY,
} from "./config";

/**
 * Calculates racial affinity bonus for mission completion.
 * Grants +2 fixed mastery when the mission belongs to the primary area of the hunter's race.
 */
export function calculateRacialAffinityBonus(
  race: TensuraRace | undefined,
  missionArea: AreaCode
): number {
  if (!race) return 0;
  const primaryArea = RACIAL_AFFINITY_AREAS[race];
  return primaryArea === missionArea ? RACIAL_AFFINITY_BONUS : 0;
}

/**
 * Returns the maximum mastery threshold for a given skill tier.
 */
export function getSkillTierCeiling(tier: SkillTier): number {
  return SKILL_TIER_THRESHOLDS[tier] ?? 100;
}

/**
 * Normalizes a skill name by trimming whitespace and collapsing multiple consecutive spaces.
 */
export function normalizeSkillName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Generates a canonical, accent-insensitive, lowercase key for skill deduplication.
 * e.g., "Programação em Rust!" -> "programacao em rust"
 */
export function canonicalizeSkillKey(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s+#]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Classifies and deduplicates a list of proposed skills against the hunter's existing skills inventory.
 * - Matches by canonicalized key;
 * - Preserves the exact name and area_id of existing skills when matched (`is_new: false`);
 * - Labels truly new skills (`is_new: true`) with an inferred or fallback area_id;
 * - Deduplicates repeated skills within the same list.
 */
export function classifySkillsDiff(
  existingSkills: ReadonlyArray<{ id: string; name: string; area_id: AreaCode }>,
  proposedSkills: ReadonlyArray<{
    name: string;
    area_id?: AreaCode;
    next_evolution_name?: string;
    next_evolution_description?: string;
  }>,
  fallbackAreaId: AreaCode = "INT",
): MissionSkillBinding[] {
  const existingMap = new Map<string, { id: string; name: string; area_id: AreaCode }>();
  for (const s of existingSkills) {
    const key = canonicalizeSkillKey(s.name);
    if (key && !existingMap.has(key)) {
      existingMap.set(key, s);
    }
  }

  const seenInMission = new Set<string>();
  const result: MissionSkillBinding[] = [];

  for (const prop of proposedSkills) {
    const cleanName = normalizeSkillName(prop.name);
    const key = canonicalizeSkillKey(cleanName);
    if (!key || seenInMission.has(key)) continue;

    seenInMission.add(key);
    const existing = existingMap.get(key);

    if (existing) {
      result.push({
        name: existing.name,
        area_id: existing.area_id,
        is_new: false,
        existing_skill_id: existing.id,
        next_evolution_name: prop.next_evolution_name,
        next_evolution_description: prop.next_evolution_description,
      });
    } else {
      result.push({
        name: cleanName,
        area_id: prop.area_id || fallbackAreaId,
        is_new: true,
        next_evolution_name: prop.next_evolution_name,
        next_evolution_description: prop.next_evolution_description,
      });
    }
  }

  return result;
}

export type SkillEvolutionType =
  | "none"
  | "intrinseca_to_especial"
  | "comum_to_especial"
  | "especial_to_extra"
  | "extra_to_unica"
  | "unica_to_suprema"
  | "suprema_to_primordial";

export interface MasteryUpdateResult {
  previousMastery: number;
  newMastery: number;
  actualDelta: number;
  previousTier: SkillTier;
  newTier: SkillTier;
  hasEvolved: boolean;
  hasDegraded: boolean;
  hasEvolvedToExtra: boolean;
  hasDegradedFromExtra: boolean;
  evolutionType: SkillEvolutionType;
}

/**
 * Applies diminishing returns to mastery gain after the halfway point of the tier.
 * - Full 100% gain when currentMastery <= halfway mark (e.g. 150 for 300, 300 for 600).
 * - Gentle proficiency decay above halfway mark with guaranteed minimum floor (1 pt).
 */
export function calculateMasteryGainWithDecay(
  currentMastery: number,
  rawDelta: number,
  tierCeiling: number = 300
): number {
  if (rawDelta <= 0) return 0;
  const halfway = Math.max(50, Math.round(tierCeiling / 2));
  if (currentMastery <= halfway) {
    return rawDelta;
  }
  const excess = Math.min(halfway, currentMastery - halfway);
  const decayFactor = Math.max(0.5, 1 / (1 + 0.5 * (excess / halfway)));
  return Math.max(1, Math.round(rawDelta * decayFactor));
}

/**
 * Calculates updated skill mastery and tier progression across the 7 canonical tiers:
 * `intrinseca` -> `comum` -> `especial` -> `extra` -> `unica` -> `suprema` -> `primordial`.
 * - Automatically evolves:
 *   - `intrinseca` -> `especial` at 100 pts
 *   - `comum` -> `especial` at 100 pts
 *   - `especial` -> `extra` at 300 pts
 * - From `extra` and above (`extra`, `unica`, `suprema`), tier evolution requires
 *   the Esoteric Roulette with 48h cooldown and pity system, capping mastery at each tier ceiling.
 */
export function calculateSkillProgression(
  currentTier: SkillTier,
  currentMastery: number,
  deltaMastery: number,
  options?: { applyLearningCurve?: boolean }
): MasteryUpdateResult {
  const previousMastery = currentMastery;
  const previousTier = currentTier;
  const tierCeiling = getSkillTierCeiling(currentTier);

  const effectiveDelta =
    options?.applyLearningCurve && deltaMastery > 0
      ? calculateMasteryGainWithDecay(currentMastery, deltaMastery, tierCeiling)
      : deltaMastery;

  const rawMastery = currentMastery + effectiveDelta;
  const maxAllowed =
    currentTier === "extra" || currentTier === "unica" || currentTier === "suprema"
      ? tierCeiling
      : MAX_SKILL_MASTERY;
  const newMastery = Math.min(maxAllowed, Math.max(0, rawMastery));
  const actualDelta = newMastery - previousMastery;

  let newTier = currentTier;
  let hasEvolved = false;
  let hasDegraded = false;
  let hasEvolvedToExtra = false;
  let hasDegradedFromExtra = false;
  let evolutionType: SkillEvolutionType = "none";

  // Automatic progression for lower tiers
  if (currentTier === "intrinseca" && newMastery >= 100) {
    newTier = "especial";
    hasEvolved = true;
    evolutionType = "intrinseca_to_especial";
  } else if (currentTier === "comum" && newMastery >= 100) {
    newTier = "especial";
    hasEvolved = true;
    evolutionType = "comum_to_especial";
  } else if (currentTier === "especial" && newMastery >= 300) {
    newTier = "extra";
    hasEvolved = true;
    hasEvolvedToExtra = true;
    evolutionType = "especial_to_extra";
  }
  // Demotions upon undo / negative mastery delta
  else if (currentTier === "extra" && newMastery < 300) {
    newTier = "especial";
    hasDegraded = true;
    hasDegradedFromExtra = true;
  } else if (currentTier === "especial" && newMastery < 100) {
    newTier = "comum";
    hasDegraded = true;
  }

  return {
    previousMastery,
    newMastery,
    actualDelta,
    previousTier,
    newTier,
    hasEvolved,
    hasDegraded,
    hasEvolvedToExtra,
    hasDegradedFromExtra,
    evolutionType,
  };
}
