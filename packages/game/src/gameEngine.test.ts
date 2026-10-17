import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  RealClock,
  SystemClock,
  FakeClock,
  RealRng,
  MathRng,
  SeededRng,
  FixedRng,
  DIFFICULTY_XP,
  XP_BY_DIFFICULTY,
  COMMON_TO_EXTRA_MASTERY_THRESHOLD,
  EXTRA_TO_UNIQUE_MASTERY_THRESHOLD,
  MAX_SKILL_MASTERY,
  xpRequiredForLevel,
  getTotalXpForLevel,
  calculateLevelFromTotalXp,
  normalizeSkillName,
  calculateSkillProgression,
  calculateAttributesFromSkills,
  calculateAttributesFromLedger,
  getAttributeRank,
  calculateLedgerTotals,
  auditLedger,
  createEmptyAttributes,
} from "./index";
import type { AreaCode, SkillTier, XpEvent } from "@slime-sage/shared";

describe("Game Engine: Clocks and RNGs", () => {
  it("RealClock and SystemClock return valid timestamps", () => {
    const realClock = new RealClock();
    const sysClock = new SystemClock();
    const t1 = realClock.now();
    const t2 = sysClock.now();
    expect(t1).toBeGreaterThan(0);
    expect(t2).toBeGreaterThanOrEqual(t1);
  });

  it("FakeClock allows precise deterministic time travel", () => {
    const initialTime = 1000000;
    const fake = new FakeClock(initialTime);
    expect(fake.now()).toBe(initialTime);

    fake.advance(500);
    expect(fake.now()).toBe(initialTime + 500);

    fake.advanceHours(2);
    expect(fake.now()).toBe(initialTime + 500 + 2 * 3600 * 1000);

    fake.advanceDays(1);
    expect(fake.now()).toBe(initialTime + 500 + (2 + 24) * 3600 * 1000);

    fake.setTime(5000);
    expect(fake.now()).toBe(5000);

    fake.reset(123);
    expect(fake.now()).toBe(123);
  });

  it("RealRng and MathRng produce values in [0, 1)", () => {
    const realRng = new RealRng();
    const mathRng = new MathRng();
    for (let i = 0; i < 10; i++) {
      const v1 = realRng.nextFloat();
      const v2 = mathRng.nextFloat();
      expect(v1).toBeGreaterThanOrEqual(0);
      expect(v1).toBeLessThan(1);
      expect(v2).toBeGreaterThanOrEqual(0);
      expect(v2).toBeLessThan(1);
    }
  });

  it("SeededRng generates reproducible pseudorandom sequences", () => {
    const rng1 = new SeededRng(42);
    const rng2 = new SeededRng(42);

    const seq1 = [rng1.nextFloat(), rng1.nextFloat(), rng1.nextFloat()];
    const seq2 = [rng2.nextFloat(), rng2.nextFloat(), rng2.nextFloat()];

    expect(seq1).toEqual(seq2);

    // nextInt bounded
    for (let i = 0; i < 50; i++) {
      const val = rng1.nextInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    }

    // Reset works
    rng1.reset(42);
    expect(rng1.nextFloat()).toBe(seq1[0]);
  });

  it("FixedRng returns sequence deterministically with loop and non-loop", () => {
    const fixedLoop = new FixedRng([0.1, 0.5, 0.9], true);
    expect(fixedLoop.nextFloat()).toBe(0.1);
    expect(fixedLoop.nextFloat()).toBe(0.5);
    expect(fixedLoop.nextFloat()).toBe(0.9);
    expect(fixedLoop.nextFloat()).toBe(0.1); // loops

    const fixedNoLoop = new FixedRng([0.2, 0.8], false);
    expect(fixedNoLoop.nextFloat()).toBe(0.2);
    expect(fixedNoLoop.nextFloat()).toBe(0.8);
    expect(fixedNoLoop.nextFloat()).toBe(0.8); // stays at last

    fixedNoLoop.reset();
    expect(fixedNoLoop.nextFloat()).toBe(0.2);

    expect(() => new FixedRng([])).toThrow();
  });
});

describe("Game Engine: Config & Level Progression", () => {
  it("matches predefined difficulty XP constants", () => {
    expect(XP_BY_DIFFICULTY).toEqual([10, 20, 35, 55, 80]);
    expect(DIFFICULTY_XP.trivial).toBe(10);
    expect(DIFFICULTY_XP.facil).toBe(20);
    expect(DIFFICULTY_XP.media).toBe(35);
    expect(DIFFICULTY_XP.dificil).toBe(55);
    expect(DIFFICULTY_XP.lendaria).toBe(80);
    expect(COMMON_TO_EXTRA_MASTERY_THRESHOLD).toBe(100);
    expect(EXTRA_TO_UNIQUE_MASTERY_THRESHOLD).toBe(300);
    expect(MAX_SKILL_MASTERY).toBe(300);
  });

  it("evaluates xpRequiredForLevel according to round(300 * n^1.5)", () => {
    expect(xpRequiredForLevel(1)).toBe(300); // 300 * 1 = 300
    expect(xpRequiredForLevel(2)).toBe(849); // 300 * 2^1.5 = 848.52 -> 849
    expect(xpRequiredForLevel(3)).toBe(1559); // 300 * 3^1.5 = 1558.84 -> 1559
    expect(xpRequiredForLevel(4)).toBe(2400); // 300 * 4^1.5 = 2400
    expect(() => xpRequiredForLevel(0)).toThrow();
  });

  it("calculates total XP needed to reach a level", () => {
    expect(getTotalXpForLevel(1)).toBe(0);
    expect(getTotalXpForLevel(2)).toBe(300);
    expect(getTotalXpForLevel(3)).toBe(300 + 849);
    expect(getTotalXpForLevel(4)).toBe(300 + 849 + 1559);
  });

  it("calculates level progression accurately around boundary values", () => {
    // Level 1: 0 to 299 XP
    expect(calculateLevelFromTotalXp(0)).toEqual({
      level: 1,
      currentXp: 0,
      xpForNextLevel: 300,
      progressPercentage: 0,
    });

    expect(calculateLevelFromTotalXp(299)).toEqual({
      level: 1,
      currentXp: 299,
      xpForNextLevel: 300,
      progressPercentage: 99,
    });

    // Level 2 starts at exactly 300 XP
    expect(calculateLevelFromTotalXp(300)).toEqual({
      level: 2,
      currentXp: 0,
      xpForNextLevel: 849,
      progressPercentage: 0,
    });

    // Level 2 ends at 300 + 848 = 1148 XP
    expect(calculateLevelFromTotalXp(1148)).toEqual({
      level: 2,
      currentXp: 848,
      xpForNextLevel: 849,
      progressPercentage: Math.floor((848 / 849) * 100),
    });

    // Level 3 starts at 1149 XP
    expect(calculateLevelFromTotalXp(1149)).toEqual({
      level: 3,
      currentXp: 0,
      xpForNextLevel: 1559,
      progressPercentage: 0,
    });

    // Negative XP defaults safely to level 1
    expect(calculateLevelFromTotalXp(-10).level).toBe(1);
  });

  it("property: calculateLevelFromTotalXp is monotonic and consistent (fast-check)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200000 }),
        fc.integer({ min: 0, max: 200000 }),
        (xpA, xpB) => {
          const lowerXp = Math.min(xpA, xpB);
          const higherXp = Math.max(xpA, xpB);

          const progLow = calculateLevelFromTotalXp(lowerXp);
          const progHigh = calculateLevelFromTotalXp(higherXp);

          // Level must never decrease with more XP
          expect(progHigh.level).toBeGreaterThanOrEqual(progLow.level);

          // Current XP must be strictly less than xpForNextLevel
          expect(progLow.currentXp).toBeLessThan(progLow.xpForNextLevel);
          expect(progHigh.currentXp).toBeLessThan(progHigh.xpForNextLevel);

          // Progress percentage must always be between 0 and 100
          expect(progLow.progressPercentage).toBeGreaterThanOrEqual(0);
          expect(progLow.progressPercentage).toBeLessThanOrEqual(100);
        }
      )
    );
  });
});

describe("Game Engine: Skills & Mastery Transitions", () => {
  it("normalizes skill names cleanly", () => {
    expect(normalizeSkillName("   Visão    Mágica   ")).toBe("Visão Mágica");
    expect(normalizeSkillName("Percepção")).toBe("Percepção");
    expect(normalizeSkillName("")).toBe("");
  });

  it("tests transition boundary Comum -> Extra strictly at 99 vs 100 mastery", () => {
    // 99 mastery: remains comum
    const at99 = calculateSkillProgression("comum", 90, 9);
    expect(at99.newMastery).toBe(99);
    expect(at99.newTier).toBe("comum");
    expect(at99.hasEvolvedToExtra).toBe(false);

    // 100 mastery: evolves to extra
    const at100 = calculateSkillProgression("comum", 99, 1);
    expect(at100.newMastery).toBe(100);
    expect(at100.newTier).toBe("extra");
    expect(at100.hasEvolvedToExtra).toBe(true);

    // >100 mastery from comum: evolves directly to extra
    const at150 = calculateSkillProgression("comum", 50, 100);
    expect(at150.newMastery).toBe(150);
    expect(at150.newTier).toBe("extra");
    expect(at150.hasEvolvedToExtra).toBe(true);
  });

  it("caps mastery at MAX_SKILL_MASTERY (300) and clamps to 0", () => {
    const capped = calculateSkillProgression("extra", 290, 50);
    expect(capped.newMastery).toBe(300);

    const clamped = calculateSkillProgression("comum", 20, -50);
    expect(clamped.newMastery).toBe(0);
  });

  it("demotes from extra back to comum when mastery drops below 100 upon undo", () => {
    const demoted = calculateSkillProgression("extra", 105, -10);
    expect(demoted.newMastery).toBe(95);
    expect(demoted.newTier).toBe("comum");
    expect(demoted.hasDegradedFromExtra).toBe(true);
  });

  it("property: skill mastery is always within [0, 300] (fast-check)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SkillTier>("comum", "extra", "unica"),
        fc.integer({ min: 0, max: 300 }),
        fc.integer({ min: -500, max: 500 }),
        (tier, curMastery, delta) => {
          const res = calculateSkillProgression(tier, curMastery, delta);
          expect(res.newMastery).toBeGreaterThanOrEqual(0);
          expect(res.newMastery).toBeLessThanOrEqual(MAX_SKILL_MASTERY);

          if (tier === "comum" && res.newMastery >= COMMON_TO_EXTRA_MASTERY_THRESHOLD) {
            expect(res.newTier).toBe("extra");
            expect(res.hasEvolvedToExtra).toBe(true);
          }
        }
      )
    );
  });
});

describe("Game Engine: Attributes", () => {
  it("calculates attributes by summing skills in respective areas", () => {
    const empty = createEmptyAttributes();
    expect(empty).toEqual({ INT: 0, FOR: 0, DIS: 0, CRI: 0, SOC: 0 });

    const skills = [
      { area_id: "INT" as AreaCode, mastery: 80 },
      { area_id: "INT" as AreaCode, mastery: 40 },
      { area_id: "FOR" as AreaCode, mastery: 120 },
      { area_id: "DIS" as AreaCode, mastery: 50 },
    ];

    const attrs = calculateAttributesFromSkills(skills);
    expect(attrs.INT).toBe(120);
    expect(attrs.FOR).toBe(120);
    expect(attrs.DIS).toBe(50);
    expect(attrs.CRI).toBe(0);
    expect(attrs.SOC).toBe(0);
  });

  it("calculates attributes from ledger events", () => {
    const events = [
      { area_id: "CRI" as AreaCode, mastery_amount: 30 },
      { area_id: "CRI" as AreaCode, mastery_amount: 25 },
      { area_id: "SOC" as AreaCode, mastery_amount: 40 },
      { area_id: "SOC" as AreaCode, mastery_amount: -10 }, // reversal
    ];

    const attrs = calculateAttributesFromLedger(events);
    expect(attrs.CRI).toBe(55);
    expect(attrs.SOC).toBe(30);
    expect(attrs.INT).toBe(0);
  });

  it("assigns Hunter ranks correctly according to 10 Grand Tiers with 1,000-pt Sub-Grades and canonical titles", () => {
    // Sub-grades within Tier I (0 to 4,999)
    const r0 = getAttributeRank(0, "INT");
    expect(r0.tier).toBe(1);
    expect(r0.rank).toBe("I");
    expect(r0.subGrade).toBe(1);
    expect(r0.subGradeRoman).toBe("I");
    expect(r0.subRank).toBe("I-I");
    expect(r0.title).toBe("Aprendiz da Lógica");
    expect(r0.nextTitle).toBe("Analista Metódico");
    expect(r0.label).toBe("Aprendiz da Lógica [Grau I] · Rumo a Analista Metódico");

    const r2500 = getAttributeRank(2500, "INT");
    expect(r2500.tier).toBe(1);
    expect(r2500.subGrade).toBe(3);
    expect(r2500.subRank).toBe("I-III");
    expect(r2500.label).toBe("Aprendiz da Lógica [Grau III] · Rumo a Analista Metódico");

    const r4999 = getAttributeRank(4999, "INT");
    expect(r4999.tier).toBe(1);
    expect(r4999.subGrade).toBe(5);
    expect(r4999.subRank).toBe("I-V");

    // Tier II ascensao at 5,000
    const r5000 = getAttributeRank(5000, "INT");
    expect(r5000.tier).toBe(2);
    expect(r5000.rank).toBe("II");
    expect(r5000.subGrade).toBe(1);
    expect(r5000.subRank).toBe("II-I");
    expect(r5000.title).toBe("Analista Metódico");
    expect(r5000.nextTitle).toBe("Arquiteto Cognitivo");
    expect(r5000.label).toBe("Analista Metódico [Grau I] · Rumo a Arquiteto Cognitivo");

    // Progression checkpoints
    expect(getAttributeRank(10000).rank).toBe("III");
    expect(getAttributeRank(15000).rank).toBe("IV");
    expect(getAttributeRank(20000).rank).toBe("V");
    expect(getAttributeRank(25000).rank).toBe("VI");
    expect(getAttributeRank(30000).rank).toBe("VII");
    expect(getAttributeRank(35000).rank).toBe("VIII");
    expect(getAttributeRank(40000).rank).toBe("IX");
    expect(getAttributeRank(45000).rank).toBe("X");

    // Tier X (50,000+ pts) - Perfeição Inatingível
    const r50000 = getAttributeRank(50000, "INT");
    expect(r50000.tier).toBe(10);
    expect(r50000.rank).toBe("X");
    expect(r50000.subGrade).toBe(5);
    expect(r50000.subRank).toBe("X-V");
    expect(r50000.title).toBe("A Onisciência Absoluta");
    expect(r50000.label).toBe("A Onisciência Absoluta [Grau V] · Perfeição Inatingível");

    // Canonical attribute titles across all 5 areas
    expect(getAttributeRank(0, "FOR").title).toBe("Corpo Desperto");
    expect(getAttributeRank(50000, "FOR").title).toBe("Muralha Cósmica Inquebrável");
    expect(getAttributeRank(0, "DIS").title).toBe("Iniciante da Vontade");
    expect(getAttributeRank(50000, "DIS").title).toBe("A Vontade Eterna");
    expect(getAttributeRank(0, "CRI").title).toBe("Discípulo do Traço");
    expect(getAttributeRank(50000, "CRI").title).toBe("Primordial da Criação");
    expect(getAttributeRank(0, "SOC").title).toBe("Ouvinte Atento");
    expect(getAttributeRank(50000, "SOC").title).toBe("A Harmonia Primordial");
  });
});

describe("Game Engine: Ledger and Audit Properties", () => {
  it("calculates ledger totals and detects consistency", () => {
    const events: XpEvent[] = [
      {
        id: "ev1",
        entity_type: "mission",
        entity_id: "m1",
        area_id: "INT",
        skill_id: "s1",
        xp_amount: 50,
        mastery_amount: 15,
        description: "M1",
        created_at: new Date().toISOString(),
      },
      {
        id: "ev2",
        entity_type: "mission",
        entity_id: "m2",
        area_id: "FOR",
        skill_id: "s2",
        xp_amount: 35,
        mastery_amount: 10,
        description: "M2",
        created_at: new Date().toISOString(),
      },
      {
        id: "ev3",
        entity_type: "mission",
        entity_id: "m1",
        area_id: "INT",
        skill_id: "s1",
        xp_amount: -50,
        mastery_amount: -15,
        description: "Undo M1",
        created_at: new Date().toISOString(),
      },
    ];

    const totals = calculateLedgerTotals(events);
    expect(totals.totalXp).toBe(35);
    expect(totals.totalMastery).toBe(10);
    expect(totals.xpByArea.INT).toBe(0);
    expect(totals.xpByArea.FOR).toBe(35);
    expect(totals.masteryBySkill["s1"]).toBe(0);
    expect(totals.masteryBySkill["s2"]).toBe(10);

    const auditOk = auditLedger(events, 35);
    expect(auditOk.isConsistent).toBe(true);
    expect(auditOk.difference).toBe(0);

    const auditDiff = auditLedger(events, 50);
    expect(auditDiff.isConsistent).toBe(false);
    expect(auditDiff.difference).toBe(15);
  });

  it("property: total_xp is strictly equal to the sum of ledger xp_event (fast-check)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            entity_type: fc.constantFrom<XpEvent["entity_type"]>("mission", "daily", "focus", "challenge", "manual"),
            entity_id: fc.string({ minLength: 1, maxLength: 10 }),
            area_id: fc.constantFrom<AreaCode>("INT", "FOR", "DIS", "CRI", "SOC"),
            skill_id: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
            xp_amount: fc.integer({ min: 1, max: 200 }),
            mastery_amount: fc.integer({ min: 0, max: 50 }),
            description: fc.string({ minLength: 1, maxLength: 30 }),
            created_at: fc.constant(new Date().toISOString()),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (events) => {
          const sumExpected = events.reduce((acc, ev) => acc + ev.xp_amount, 0);
          const totals = calculateLedgerTotals(events);

          expect(totals.totalXp).toBe(sumExpected);

          const audit = auditLedger(events, sumExpected);
          expect(audit.isConsistent).toBe(true);
          expect(audit.difference).toBe(0);
        }
      )
    );
  });

  it("property: completeMission followed by undoMissionCompletion perfectly restores previous state (fast-check)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50000 }), // initial total XP
        fc.oneof(
          fc.record({
            tier: fc.constant<SkillTier>("comum"),
            mastery: fc.integer({ min: 0, max: 99 }),
          }),
          fc.record({
            tier: fc.constant<SkillTier>("extra"),
            mastery: fc.integer({ min: 100, max: 300 }),
          })
        ),
        fc.constantFrom<AreaCode>("INT", "FOR", "DIS", "CRI", "SOC"),
        fc.integer({ min: 10, max: 100 }),  // mission xp reward
        fc.integer({ min: 0, max: 30 }),   // mission mastery reward
        (initialTotalXp, initialSkill, area, missionXp, missionMastery) => {
          // 1. Initial State
          const state0 = {
            totalXp: initialTotalXp,
            level: calculateLevelFromTotalXp(initialTotalXp),
            skillMastery: initialSkill.mastery,
            skillTier: initialSkill.tier,
          };

          // 2. Complete Mission (apply rewards)
          const xpAfterComplete = state0.totalXp + missionXp;
          const skillProgressionComplete = calculateSkillProgression(
            state0.skillTier,
            state0.skillMastery,
            missionMastery
          );
          const state1 = {
            totalXp: xpAfterComplete,
            level: calculateLevelFromTotalXp(xpAfterComplete),
            skillMastery: skillProgressionComplete.newMastery,
            skillTier: skillProgressionComplete.newTier,
          };

          // 3. Undo Mission (apply compensatory delta based on actual delta applied)
          const xpAfterUndo = state1.totalXp - missionXp;
          const skillProgressionUndo = calculateSkillProgression(
            state1.skillTier,
            state1.skillMastery,
            -skillProgressionComplete.actualDelta
          );
          const state2 = {
            totalXp: xpAfterUndo,
            level: calculateLevelFromTotalXp(xpAfterUndo),
            skillMastery: skillProgressionUndo.newMastery,
            skillTier: skillProgressionUndo.newTier,
          };

          // Verify perfect restoration of XP, Level, Mastery, and Tier
          expect(state2.totalXp).toBe(state0.totalXp);
          expect(state2.level.level).toBe(state0.level.level);
          expect(state2.level.currentXp).toBe(state0.level.currentXp);
          expect(state2.level.xpForNextLevel).toBe(state0.level.xpForNextLevel);
          expect(state2.level.progressPercentage).toBe(state0.level.progressPercentage);
          expect(state2.skillMastery).toBe(state0.skillMastery);
          expect(state2.skillTier).toBe(state0.skillTier);
        }
      )
    );
  });
});
