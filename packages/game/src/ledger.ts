import type { AreaCode, XpEvent } from "@slime-sage/shared";
import { BASE_ATTRIBUTE_CODES } from "./attributes";

export interface LedgerTotals {
  totalXp: number;
  totalMastery: number;
  xpByArea: Record<AreaCode, number>;
  masteryByArea: Record<AreaCode, number>;
  masteryBySkill: Record<string, number>;
}

export function calculateLedgerTotals(events: XpEvent[]): LedgerTotals {
  let totalXp = 0;
  let totalMastery = 0;

  const xpByArea: Record<AreaCode, number> = {
    INT: 0,
    FOR: 0,
    DIS: 0,
    CRI: 0,
    SOC: 0,
  };

  const masteryByArea: Record<AreaCode, number> = {
    INT: 0,
    FOR: 0,
    DIS: 0,
    CRI: 0,
    SOC: 0,
  };

  const masteryBySkill: Record<string, number> = {};

  for (const event of events) {
    totalXp += event.xp_amount;
    const mastery = event.mastery_amount ?? 0;
    totalMastery += mastery;

    if (event.area_id in xpByArea) {
      xpByArea[event.area_id] += event.xp_amount;
      masteryByArea[event.area_id] += mastery;
    }

    if (event.skill_id) {
      masteryBySkill[event.skill_id] = (masteryBySkill[event.skill_id] ?? 0) + mastery;
    }
  }

  // Clamp area totals to minimum 0 if desired, or preserve raw values
  for (const code of BASE_ATTRIBUTE_CODES) {
    if (xpByArea[code] < 0) xpByArea[code] = 0;
    if (masteryByArea[code] < 0) masteryByArea[code] = 0;
  }

  return {
    totalXp: Math.max(0, totalXp),
    totalMastery: Math.max(0, totalMastery),
    xpByArea,
    masteryByArea,
    masteryBySkill,
  };
}

export interface LedgerAuditResult {
  isConsistent: boolean;
  ledgerTotalXp: number;
  profileTotalXp: number;
  difference: number;
}

export function auditLedger(
  events: XpEvent[],
  profileTotalXp: number
): LedgerAuditResult {
  const { totalXp } = calculateLedgerTotals(events);
  const difference = profileTotalXp - totalXp;
  return {
    isConsistent: difference === 0,
    ledgerTotalXp: totalXp,
    profileTotalXp,
    difference,
  };
}

export type GameEvent =
  | {
      type: "LEVEL_UP";
      payload: {
        previousLevel: number;
        newLevel: number;
        totalXp: number;
      };
    }
  | {
      type: "SKILL_ACQUIRED";
      payload: {
        skillId: string;
        skillName: string;
        areaId: AreaCode;
      };
    }
  | {
      type: "SKILL_EVOLVED_EXTRA";
      payload: {
        skillId: string;
        skillName: string;
        mastery: number;
      };
    }
  | {
      type: "PROJECT_COMPLETE";
      payload: {
        projectId: string;
        projectTitle: string;
        hasSkill: boolean;
        skillId?: string;
        skillName?: string;
      };
    }
  | {
      type: "ONBOARDING_COMPLETED";
      payload: {
        name: string;
        race: string;
        rankThreat: string;
      };
    }
  | {
      type: "ONBOARDING_RESET";
      payload: Record<string, never>;
    };

