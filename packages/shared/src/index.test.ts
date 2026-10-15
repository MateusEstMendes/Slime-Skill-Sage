import { describe, it, expect } from "vitest";
import {
  HealthResponseSchema,
  LogScopeSchema,
  LogLevelSchema,
  AppLogEntrySchema,
  KvEntrySchema,
  ProfileSchema,
  AreaSchema,
  ClassSchema,
  ClassChallengeSchema,
  SkillSchema,
  EvolutionAttemptSchema,
  ProjectSchema,
  MissionSchema,
  MissionDepSchema,
  MissionRewardSchema,
  DailyMissionSchema,
  FocusSessionSchema,
  XpEventSchema,
  ChatThreadSchema,
  ChatMessageSchema,
  ScheduledNotificationSchema,
  PhraseBankSchema,
  BASE_AREAS,
  TABLE_NAMES,
} from "./index";

describe("Shared Schemas", () => {
  it("validates correct HealthResponseSchema", () => {
    const valid = {
      status: "ok",
      app: "slime-sage",
      timestamp: new Date().toISOString(),
    };
    const parsed = HealthResponseSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("fails when status is invalid", () => {
    const invalid = {
      status: "error",
      app: "slime-sage",
      timestamp: new Date().toISOString(),
    };
    const parsed = HealthResponseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("validates LogScopeSchema and LogLevelSchema", () => {
    const scopes = ["ai", "notif", "game", "db", "focus", "backup", "tts"] as const;
    for (const scope of scopes) {
      expect(LogScopeSchema.safeParse(scope).success).toBe(true);
    }
    expect(LogScopeSchema.safeParse("unknown").success).toBe(false);

    const levels = ["debug", "info", "warn", "error"] as const;
    for (const level of levels) {
      expect(LogLevelSchema.safeParse(level).success).toBe(true);
    }
    expect(LogLevelSchema.safeParse("verbose").success).toBe(false);
  });

  it("validates AppLogEntrySchema and KvEntrySchema", () => {
    const validLog = {
      id: "log-1",
      at: new Date().toISOString(),
      level: "info",
      scope: "game",
      message: "Sistema inicializado",
      data: { score: 100 },
    };
    expect(AppLogEntrySchema.safeParse(validLog).success).toBe(true);

    const invalidLog = {
      id: "log-2",
      at: new Date().toISOString(),
      level: "invalid_level",
      scope: "game",
      message: "Erro",
    };
    expect(AppLogEntrySchema.safeParse(invalidLog).success).toBe(false);

    const validKv = {
      key: "theme",
      value: "dark",
      updatedAt: new Date().toISOString(),
    };
    expect(KvEntrySchema.safeParse(validKv).success).toBe(true);
  });

  it("contains all 19 defined table names", () => {
    expect(TABLE_NAMES).toHaveLength(19);
    expect(TABLE_NAMES).toContain("project");
    expect(TABLE_NAMES).toContain("mission");
    expect(TABLE_NAMES).toContain("mission_dep");
    expect(TABLE_NAMES).toContain("area");
    expect(TABLE_NAMES).toContain("profile");
    expect(TABLE_NAMES).toContain("xp_event");
  });

  it("validates BASE_AREAS seed configuration", () => {
    expect(BASE_AREAS).toHaveLength(5);
    const codes = BASE_AREAS.map((a) => a.code);
    expect(codes).toEqual(["INT", "FOR", "DIS", "CRI", "SOC"]);

    for (const area of BASE_AREAS) {
      const parsed = AreaSchema.safeParse(area);
      expect(parsed.success).toBe(true);
    }
  });

  it("validates Project and Mission schemas with defaults and soft delete", () => {
    const validProject = {
      id: "proj-1",
      area_id: "INT",
      title: "Dominar Algoritmos",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const parsedProject = ProjectSchema.safeParse(validProject);
    expect(parsedProject.success).toBe(true);
    if (parsedProject.success) {
      expect(parsedProject.data.status).toBe("ativo");
      expect(parsedProject.data.progress).toBe(0);
      expect(parsedProject.data.deleted_at).toBeNull();
    }

    const validMission = {
      id: "mis-1",
      project_id: "proj-1",
      title: "Grafos e DFS",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const parsedMission = MissionSchema.safeParse(validMission);
    expect(parsedMission.success).toBe(true);
    if (parsedMission.success) {
      expect(parsedMission.data.status).toBe("disponivel");
      expect(parsedMission.data.xp_reward).toBe(50);
      expect(parsedMission.data.deleted_at).toBeNull();
    }

    const validDep = {
      id: "dep-1",
      mission_id: "mis-2",
      depends_on_mission_id: "mis-1",
      created_at: new Date().toISOString(),
    };
    expect(MissionDepSchema.safeParse(validDep).success).toBe(true);
  });

  it("validates other core relational entity schemas", () => {
    const now = new Date().toISOString();

    const parsedProfile = ProfileSchema.safeParse({
      id: "p1",
      name: "Rimuru",
      title: "Aspirante a Desperto",
      created_at: now,
      updated_at: now,
    });
    expect(parsedProfile.success).toBe(true);
    if (parsedProfile.success) {
      expect(parsedProfile.data.onboarding_done).toBe(false);
    }

    expect(
      ClassSchema.safeParse({
        id: "cls-1",
        area_id: "INT",
        name: "Pesquisador Arcano",
        description: "Mestre da dedução",
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      ClassChallengeSchema.safeParse({
        id: "ch-1",
        class_id: "cls-1",
        title: "Resolver 10 desafios",
        description: "Desafio autodeclarado",
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      SkillSchema.safeParse({
        id: "sk-1",
        area_id: "INT",
        name: "Pensamento Crítico",
        description: "Análise profunda",
        created_at: now,
        updated_at: now,
      }).success,
    ).toBe(true);

    expect(
      EvolutionAttemptSchema.safeParse({
        id: "evo-1",
        skill_id: "sk-1",
        target_tier: "extra",
        base_chance: 0.3,
        failure_bonus: 0,
        final_chance: 0.3,
        rolled_value: 0.25,
        success: true,
        cooldown_until: now,
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      MissionRewardSchema.safeParse({
        id: "rew-1",
        mission_id: "mis-1",
        area_id: "INT",
        xp_amount: 100,
        mastery_amount: 15,
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      DailyMissionSchema.safeParse({
        id: "daily-1",
        date: "2026-10-15",
        title: "Meditar 10 min",
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      FocusSessionSchema.safeParse({
        id: "foc-1",
        duration_minutes: 25,
        started_at: now,
      }).success,
    ).toBe(true);

    expect(
      XpEventSchema.safeParse({
        id: "xpe-1",
        entity_type: "mission",
        entity_id: "mis-1",
        area_id: "INT",
        xp_amount: 50,
        description: "Conclusão de missão",
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      ChatThreadSchema.safeParse({
        id: "th-1",
        title: "Planejamento da Semana",
        created_at: now,
        updated_at: now,
      }).success,
    ).toBe(true);

    expect(
      ChatMessageSchema.safeParse({
        id: "msg-1",
        thread_id: "th-1",
        role: "assistant",
        content: "Proponho as seguintes missões",
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      ScheduledNotificationSchema.safeParse({
        id: "notif-1",
        type: "reminder",
        title: "Hora do Treino",
        body: "Não esqueça a disciplina",
        trigger_at: now,
        created_at: now,
      }).success,
    ).toBe(true);

    expect(
      PhraseBankSchema.safeParse({
        id: "pb-1",
        speaker: "gs",
        category: "welcome",
        text: "Relatório diário pronto.",
        created_at: now,
      }).success,
    ).toBe(true);
  });
});
