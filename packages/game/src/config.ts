export const DIFFICULTY_XP = {
  trivial: 10,
  facil: 20,
  media: 35,
  dificil: 55,
  lendaria: 80,
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_XP;

export const XP_BY_DIFFICULTY: readonly number[] = [10, 20, 35, 55, 80] as const;

// 7 Canonical Skill Tiers and Mastery Thresholds (Phase 10)
export const SKILL_TIERS = [
  "intrinseca",
  "comum",
  "especial",
  "extra",
  "unica",
  "suprema",
  "primordial",
] as const;

export const SKILL_TIER_THRESHOLDS = {
  intrinseca: 100,
  comum: 100,
  especial: 300,
  extra: 600,
  unica: 1200,
  suprema: 2500,
  primordial: 50000,
} as const;

export const COMMON_TO_EXTRA_MASTERY_THRESHOLD = 100;
export const EXTRA_TO_UNIQUE_MASTERY_THRESHOLD = 600;
export const MAX_SKILL_MASTERY = 50000;

// Racial Primary Affinity Attributes and Bonus
export const RACIAL_AFFINITY_AREAS = {
  Slime: "INT",
  Kijin: "FOR",
  Draconiano: "DIS",
  Majin: "CRI",
  "Homem-Fera": "SOC",
} as const;

export const RACIAL_AFFINITY_BONUS = 2;

// Roulette Hardcore Rules
export const ROULETTE_BASE_CHANCE = 0.2;
export const ROULETTE_PITY_PER_FAILURE = 0.1;
export const ROULETTE_MAX_CHANCE = 0.8;
export const ROULETTE_COOLDOWN_HOURS = 48;
export const ROULETTE_COOLDOWN_MS = 48 * 60 * 60 * 1000;

// Harvest Festival Multiplier
export const HARVEST_FESTIVAL_XP_MULTIPLIER = 2.0;

/**
 * Calculates XP required to advance from `level` to `level + 1`.
 * Formula: round(300 * n^1.5)
 */
export function xpRequiredForLevel(level: number): number {
  if (level < 1) {
    throw new Error("Level must be an integer >= 1");
  }
  return Math.round(300 * Math.pow(level, 1.5));
}

/**
 * Calculates the total cumulative XP required to reach a specific level starting from level 1.
 */
export function getTotalXpForLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0;
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += xpRequiredForLevel(l);
  }
  return total;
}

export interface LevelProgress {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progressPercentage: number;
}

/**
 * Pure function: calculates player level, current XP within that level,
 * XP required for next level, and progress percentage given total cumulative XP.
 */
export function calculateLevelFromTotalXp(totalXp: number): LevelProgress {
  if (totalXp < 0) {
    return {
      level: 1,
      currentXp: 0,
      xpForNextLevel: xpRequiredForLevel(1),
      progressPercentage: 0,
    };
  }

  let level = 1;
  let remainingXp = totalXp;

  while (true) {
    const cost = xpRequiredForLevel(level);
    if (remainingXp >= cost) {
      remainingXp -= cost;
      level += 1;
    } else {
      break;
    }
  }

  const xpForNextLevel = xpRequiredForLevel(level);
  const progressPercentage =
    xpForNextLevel > 0
      ? Math.min(100, Math.floor((remainingXp / xpForNextLevel) * 100))
      : 0;

  return {
    level,
    currentXp: remainingXp,
    xpForNextLevel,
    progressPercentage,
  };
}
