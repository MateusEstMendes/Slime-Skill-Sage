import type { AreaCode } from "@slime-sage/shared";

export const BASE_ATTRIBUTE_CODES: readonly AreaCode[] = [
  "INT",
  "FOR",
  "DIS",
  "CRI",
  "SOC",
] as const;

export type AttributesMap = Record<AreaCode, number>;

export function createEmptyAttributes(): AttributesMap {
  return {
    INT: 0,
    FOR: 0,
    DIS: 0,
    CRI: 0,
    SOC: 0,
  };
}

/**
 * Calculates attribute values (INT, FOR, DIS, CRI, SOC)
 * by summing the mastery of all skills associated with each area.
 */
export function calculateAttributesFromSkills(
  skills: Array<{ area_id: AreaCode; mastery: number }>
): AttributesMap {
  const result = createEmptyAttributes();
  for (const skill of skills) {
    if (skill.area_id in result) {
      result[skill.area_id] += Math.max(0, skill.mastery);
    }
  }
  return result;
}

/**
 * Calculates attribute values directly from ledger events by summing mastery_amount.
 */
export function calculateAttributesFromLedger(
  events: Array<{ area_id: AreaCode; mastery_amount?: number }>
): AttributesMap {
  const result = createEmptyAttributes();
  for (const event of events) {
    if (event.area_id in result && typeof event.mastery_amount === "number") {
      result[event.area_id] += event.mastery_amount;
    }
  }
  // Clamp all attributes to minimum 0
  for (const code of BASE_ATTRIBUTE_CODES) {
    result[code] = Math.max(0, result[code]);
  }
  return result;
}

/**
 * Maps attribute value to Hunter rank tier (Tensura / Solo Leveling style).
 */
export function getAttributeRank(value: number): {
  rank: "F" | "E" | "D" | "C" | "B" | "A" | "S";
  label: string;
} {
  if (value >= 500) return { rank: "S", label: "Rank S — Monarca" };
  if (value >= 300) return { rank: "A", label: "Rank A — Mestre" };
  if (value >= 180) return { rank: "B", label: "Rank B — Veterano" };
  if (value >= 100) return { rank: "C", label: "Rank C — Intermediário" };
  if (value >= 50) return { rank: "D", label: "Rank D — Iniciado" };
  if (value >= 15) return { rank: "E", label: "Rank E — Recruta" };
  return { rank: "F", label: "Rank F — Novato" };
}
