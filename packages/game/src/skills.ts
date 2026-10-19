import type { AreaCode, MissionSkillBinding, SkillTier } from "@slime-sage/shared";
import {
  COMMON_TO_EXTRA_MASTERY_THRESHOLD,
  MAX_SKILL_MASTERY,
} from "./config";

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

export interface MasteryUpdateResult {
  previousMastery: number;
  newMastery: number;
  actualDelta: number;
  previousTier: SkillTier;
  newTier: SkillTier;
  hasEvolvedToExtra: boolean;
  hasDegradedFromExtra: boolean;
}

/**
 * Calculates updated skill mastery and tier progression.
 * - Caps mastery between 0 and 300.
 * - Automatically evolves "comum" to "extra" when mastery >= 100.
 * - If reversing/undoing and mastery drops below 100, demotes "extra" back to "comum".
 * - Evolution to "unica" requires 300 mastery + project + roulette (Phase 10),
 *   so it does not happen automatically here.
 */
export function calculateSkillProgression(
  currentTier: SkillTier,
  currentMastery: number,
  deltaMastery: number
): MasteryUpdateResult {
  const previousMastery = currentMastery;
  const previousTier = currentTier;

  const rawMastery = currentMastery + deltaMastery;
  const newMastery = Math.min(MAX_SKILL_MASTERY, Math.max(0, rawMastery));
  const actualDelta = newMastery - previousMastery;

  let newTier = currentTier;
  let hasEvolvedToExtra = false;
  let hasDegradedFromExtra = false;

  if (currentTier === "comum" && newMastery >= COMMON_TO_EXTRA_MASTERY_THRESHOLD) {
    newTier = "extra";
    hasEvolvedToExtra = true;
  } else if (currentTier === "extra" && newMastery < COMMON_TO_EXTRA_MASTERY_THRESHOLD) {
    newTier = "comum";
    hasDegradedFromExtra = true;
  }

  return {
    previousMastery,
    newMastery,
    actualDelta,
    previousTier,
    newTier,
    hasEvolvedToExtra,
    hasDegradedFromExtra,
  };
}
