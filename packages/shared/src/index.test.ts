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
  ProposalSchema,
  CreateProjectTreeProposalSchema,
  AddMissionsProposalSchema,
  UpdateMissionProposalSchema,
  DeleteMissionProposalSchema,
  HunterContextSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  TtsRequestSchema,
  TtsResponseSchema,
  GS_SYSTEM_PROMPT,
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

  it("validates ProposalSchema for all 4 proposal types", () => {
    const createTree = {
      type: "create_project_tree",
      project: {
        title: "Dominar Rust",
        description: "Projeto de programação de sistemas",
        area_id: "INT",
      },
      missions: [
        {
          title: "Sintaxe Básica e Ownership",
          description: "Ler o The Book",
          xp_reward: 35,
          depends_on_titles: [],
        },
        {
          title: "Smart Pointers",
          description: "Box, Rc, Arc",
          xp_reward: 55,
          depends_on_titles: ["Sintaxe Básica e Ownership"],
        },
      ],
      explanation: "Estrutura recomendada para maximizar maestria lógica.",
    };
    expect(CreateProjectTreeProposalSchema.safeParse(createTree).success).toBe(true);
    expect(ProposalSchema.safeParse(createTree).success).toBe(true);

    const addMissions = {
      type: "add_missions",
      project_id: "proj-123",
      project_title: "Dominar Rust",
      missions: [
        {
          title: "Criar CLI com Clap",
          xp_reward: 35,
        },
      ],
    };
    expect(AddMissionsProposalSchema.safeParse(addMissions).success).toBe(true);
    expect(ProposalSchema.safeParse(addMissions).success).toBe(true);

    const updateMission = {
      type: "update_mission",
      mission_id: "mis-456",
      current_title: "Título Antigo",
      updates: {
        title: "Título Novo e Refinado",
        xp_reward: 55,
      },
      explanation: "Ajuste na dificuldade da missão.",
    };
    expect(UpdateMissionProposalSchema.safeParse(updateMission).success).toBe(true);
    expect(ProposalSchema.safeParse(updateMission).success).toBe(true);

    const deleteMission = {
      type: "delete_mission",
      mission_id: "mis-789",
      mission_title: "Missão Obsoleta",
      explanation: "Não agrega mais valor à meta.",
    };
    expect(DeleteMissionProposalSchema.safeParse(deleteMission).success).toBe(true);
    expect(ProposalSchema.safeParse(deleteMission).success).toBe(true);
  });

  it("validates HunterContextSchema, ChatRequestSchema and ChatResponseSchema", () => {
    const validContext = {
      profile: {
        name: "Rimuru",
        title: "Aspirante a Desperto",
        level: 3,
        current_xp: 450,
        streak_count: 5,
      },
      skills: [
        {
          id: "sk-1",
          name: "Pensamento Crítico",
          area_id: "INT",
          tier: "comum",
          mastery: 85,
        },
      ],
      projects: [
        {
          id: "proj-1",
          title: "Aprender TypeScript",
          area_id: "INT",
          status: "ativo",
          progress: 50,
        },
      ],
      pending_missions_count: 2,
    };
    expect(HunterContextSchema.safeParse(validContext).success).toBe(true);

    const validChatRequest = {
      thread_id: "th-1",
      messages: [
        { role: "user", content: "Sugira um novo projeto de treino de força." },
      ],
      hunter_context: validContext,
    };
    expect(ChatRequestSchema.safeParse(validChatRequest).success).toBe(true);

    const validChatResponse = {
      role: "assistant",
      content: "Resposta: Proposta de treino físico elaborada.",
      proposal: {
        type: "create_project_tree",
        project: {
          title: "Calistenia Fundamentos",
          description: "Treino com peso do corpo",
          area_id: "FOR",
        },
        missions: [
          {
            title: "50 flexões diárias",
            xp_reward: 35,
            depends_on_titles: [],
          },
        ],
      },
      spoken_text: "Diretriz tática de força formulada, Caçador.",
    };
    expect(ChatResponseSchema.safeParse(validChatResponse).success).toBe(true);
  });

  it("validates TtsRequestSchema, TtsResponseSchema and GS_SYSTEM_PROMPT", () => {
    const validTtsReq = {
      text: "Aviso do Sistema: Nova habilidade adquirida.",
      voice: "Kore",
    };
    expect(TtsRequestSchema.safeParse(validTtsReq).success).toBe(true);

    const validTtsRes = {
      audioBase64: "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
      mimeType: "audio/wav",
      source: "gemini",
    };
    expect(TtsResponseSchema.safeParse(validTtsRes).success).toBe(true);

    expect(GS_SYSTEM_PROMPT).toContain("Grande Sábio (G.S)");
    expect(GS_SYSTEM_PROMPT).toContain("REGRA DE OURO #1");
  });
});
