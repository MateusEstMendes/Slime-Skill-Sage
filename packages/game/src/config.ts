export const DIFFICULTY_XP = {
  trivial: 10,
  facil: 20,
  media: 35,
  dificil: 55,
  lendaria: 80,
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_XP;

export const XP_BY_DIFFICULTY: readonly number[] = [10, 20, 35, 55, 80] as const;

export const COMMON_TO_EXTRA_MASTERY_THRESHOLD = 100;
export const EXTRA_TO_UNIQUE_MASTERY_THRESHOLD = 300;
export const MAX_SKILL_MASTERY = 300;

/**
 * Calculates XP required to advance from `level` to `level + 1`.
 * Formula: round(100 * n^1.5)
 */
export function xpRequiredForLevel(level: number): number {
  if (level < 1) {
    throw new Error("Level must be an integer >= 1");
  }
  return Math.round(100 * Math.pow(level, 1.5));
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
