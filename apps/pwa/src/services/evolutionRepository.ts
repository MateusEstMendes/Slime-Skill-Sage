import type { EvolutionAttempt } from "@slime-sage/shared";
import { localDb } from "./db";
import { logger } from "./logger";

export class EvolutionRepository {
  private db = localDb;

  /**
   * Records an evolution attempt (from roulette or ritual) in the database.
   */
  public async recordAttempt(attempt: EvolutionAttempt): Promise<void> {
    await this.db.put("evolution_attempt", attempt);
    void logger.info("game", `Tentativa de evolução registrada para ${attempt.skill_id}`, {
      targetTier: attempt.target_tier,
      success: attempt.success,
      chance: attempt.final_chance,
      cooldownUntil: attempt.cooldown_until,
    });
  }

  /**
   * Retrieves all attempts for a given skill ordered chronologically (newest first).
   */
  public async getAttemptsForSkill(skillId: string): Promise<EvolutionAttempt[]> {
    const all = await this.db.getAll<EvolutionAttempt>("evolution_attempt");
    return all
      .filter((a) => a.skill_id === skillId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Returns the most recent attempt for a skill.
   */
  public async getLatestAttemptForSkill(skillId: string): Promise<EvolutionAttempt | null> {
    const attempts = await this.getAttemptsForSkill(skillId);
    return attempts[0] || null;
  }

  /**
   * Calculates the consecutive failure count (pity count) since the last success for a skill.
   */
  public async getFailureCountForSkill(skillId: string): Promise<number> {
    const attempts = await this.getAttemptsForSkill(skillId);
    let failures = 0;
    for (const att of attempts) {
      if (att.success) {
        break; // Stop at most recent success
      }
      failures += 1;
    }
    return failures;
  }

  /**
   * Clears cooldowns for dev/testing purposes.
   */
  public async clearCooldowns(skillId?: string): Promise<void> {
    const attempts = await this.db.getAll<EvolutionAttempt>("evolution_attempt");
    for (const att of attempts) {
      if (!skillId || att.skill_id === skillId) {
        if (att.cooldown_until) {
          await this.db.put("evolution_attempt", { ...att, cooldown_until: null });
        }
      }
    }
    void logger.info("game", "Cooldowns de evolução resetados", { skillId: skillId || "ALL" });
  }
}

export const evolutionRepository = new EvolutionRepository();
