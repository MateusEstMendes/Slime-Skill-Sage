import type { SkillTier } from "@slime-sage/shared";
import {
  COMMON_TO_EXTRA_MASTERY_THRESHOLD,
  MAX_SKILL_MASTERY,
} from "./config";

/**
 * Normalizes a skill name by trimming whitespace, collapsing multiple consecutive spaces,
 * and capitalizing words appropriately.
 */
export function normalizeSkillName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .replace(/\s+/g, " ");
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
