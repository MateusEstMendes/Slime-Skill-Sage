import type { Profile } from "@slime-sage/shared";

export const MAIN_PROFILE_ID = "profile_main";
export const DEFAULT_PROFILE_TITLE = "Aspirante a Desperto";

/**
 * Builds the default profile for a brand-new player.
 *
 * IMPORTANT: `onboarding_done` MUST be `false` so the "Primeiro Despertar"
 * onboarding ritual (Fase 8) is shown on first access. HomeScreen triggers the
 * onboarding exclusively when `profile.onboarding_done === false`.
 */
export function createDefaultProfile(nowIso: string, overrides: Partial<Profile> = {}): Profile {
  return {
    id: MAIN_PROFILE_ID,
    name: "Rimuru Tempest",
    title: DEFAULT_PROFILE_TITLE,
    race: "Slime",
    rank_threat: "Classe Menor",
    level: 1,
    current_xp: 0,
    total_xp: 0,
    streak_count: 0,
    last_active_date: nowIso.slice(0, 10),
    onboarding_done: false,
    created_at: nowIso,
    updated_at: nowIso,
    ...overrides,
  };
}
