import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  app: z.literal("slime-sage"),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const LogScopeSchema = z.enum([
  "ai",
  "notif",
  "game",
  "db",
  "focus",
  "backup",
  "tts",
]);

export type LogScope = z.infer<typeof LogScopeSchema>;

export const LogLevelSchema = z.enum(["debug", "info", "warn", "error"]);

export type LogLevel = z.infer<typeof LogLevelSchema>;

export const AppLogEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  level: LogLevelSchema,
  scope: LogScopeSchema,
  message: z.string(),
  data: z.unknown().optional(),
});

export type AppLogEntry = z.infer<typeof AppLogEntrySchema>;

export const KvEntrySchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.string().optional(),
});

export type KvEntry = z.infer<typeof KvEntrySchema>;

// ==========================================
// RELATIONAL DATABASE SCHEMAS & ENTITIES (S.S.S)
// ==========================================

export const TABLE_NAMES = [
  "profile",
  "area",
  "class",
  "class_challenge",
  "skill",
  "evolution_attempt",
  "project",
  "mission",
  "mission_dep",
  "mission_reward",
  "daily_mission",
  "focus_session",
  "xp_event",
  "chat_thread",
  "chat_message",
  "scheduled_notification",
  "phrase_bank",
  "app_log",
  "kv",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

// 1. Profile
export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  level: z.number().int().min(1).default(1),
  current_xp: z.number().int().min(0).default(0),
  total_xp: z.number().int().min(0).default(0),
  streak_count: z.number().int().min(0).default(0),
  last_active_date: z.string().nullable().default(null),
  onboarding_done: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// 2. Area
export const AreaCodeSchema = z.enum(["INT", "FOR", "DIS", "CRI", "SOC"]);
export type AreaCode = z.infer<typeof AreaCodeSchema>;

export const AreaSchema = z.object({
  id: AreaCodeSchema,
  code: AreaCodeSchema,
  name: z.string(),
  description: z.string(),
  color: z.string(),
  icon: z.string(),
  level: z.number().int().min(1).default(1),
  current_xp: z.number().int().min(0).default(0),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Area = z.infer<typeof AreaSchema>;

// 3. Class
export const ClassSchema = z.object({
  id: z.string(),
  area_id: AreaCodeSchema,
  tier: z.number().int().min(1).default(1),
  name: z.string(),
  description: z.string(),
  unlocked_at: z.string().nullable().default(null),
  is_active: z.boolean().default(false),
  created_at: z.string(),
});
export type Class = z.infer<typeof ClassSchema>;

// 4. Class Challenge
export const ClassChallengeStatusSchema = z.enum(["pendente", "concluido", "falho"]);
export type ClassChallengeStatus = z.infer<typeof ClassChallengeStatusSchema>;

export const ClassChallengeSchema = z.object({
  id: z.string(),
  class_id: z.string(),
  title: z.string(),
  description: z.string(),
  status: ClassChallengeStatusSchema.default("pendente"),
  completed_at: z.string().nullable().default(null),
  created_at: z.string(),
});
export type ClassChallenge = z.infer<typeof ClassChallengeSchema>;

// 5. Skill
export const SkillTierSchema = z.enum(["comum", "extra", "unica"]);
export type SkillTier = z.infer<typeof SkillTierSchema>;

export const SkillSchema = z.object({
  id: z.string(),
  area_id: AreaCodeSchema,
  name: z.string(),
  description: z.string(),
  tier: SkillTierSchema.default("comum"),
  mastery: z.number().int().min(0).max(300).default(0),
  icon: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Skill = z.infer<typeof SkillSchema>;

// 6. Evolution Attempt
export const EvolutionAttemptSchema = z.object({
  id: z.string(),
  skill_id: z.string(),
  target_tier: SkillTierSchema,
  base_chance: z.number().min(0).max(1),
  failure_bonus: z.number().min(0).max(1),
  final_chance: z.number().min(0).max(1),
  rolled_value: z.number().min(0).max(1),
  success: z.boolean(),
  cooldown_until: z.string(),
  created_at: z.string(),
});
export type EvolutionAttempt = z.infer<typeof EvolutionAttemptSchema>;

// 7. Project
export const ProjectStatusSchema = z.enum(["ativo", "concluido", "pausado", "arquivado"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  area_id: AreaCodeSchema,
  title: z.string(),
  description: z.string().default(""),
  status: ProjectStatusSchema.default("ativo"),
  progress: z.number().min(0).max(100).default(0),
  completed_at: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().default(null),
});
export type Project = z.infer<typeof ProjectSchema>;

// 8. Mission
export const MissionStatusSchema = z.enum(["bloqueada", "disponivel", "feita"]);
export type MissionStatus = z.infer<typeof MissionStatusSchema>;

export const MissionSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  status: MissionStatusSchema.default("disponivel"),
  order_index: z.number().int().default(0),
  xp_reward: z.number().int().min(0).default(50),
  completed_at: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().default(null),
});
export type Mission = z.infer<typeof MissionSchema>;

// 9. Mission Dep
export const MissionDepSchema = z.object({
  id: z.string(),
  mission_id: z.string(),
  depends_on_mission_id: z.string(),
  created_at: z.string(),
});
export type MissionDep = z.infer<typeof MissionDepSchema>;

// 10. Mission Reward
export const MissionRewardSchema = z.object({
  id: z.string(),
  mission_id: z.string(),
  skill_id: z.string().optional(),
  area_id: AreaCodeSchema,
  xp_amount: z.number().int().min(0),
  mastery_amount: z.number().int().min(0).default(0),
  created_at: z.string(),
});
export type MissionReward = z.infer<typeof MissionRewardSchema>;

// 11. Daily Mission
export const DailyMissionSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  description: z.string().default(""),
  xp_reward: z.number().int().min(0).default(20),
  completed: z.boolean().default(false),
  completed_at: z.string().nullable().default(null),
  created_at: z.string(),
});
export type DailyMission = z.infer<typeof DailyMissionSchema>;

// 12. Focus Session
export const FocusSessionStatusSchema = z.enum(["em_andamento", "concluida", "quebrada"]);
export type FocusSessionStatus = z.infer<typeof FocusSessionStatusSchema>;

export const FocusSessionSchema = z.object({
  id: z.string(),
  mission_id: z.string().optional(),
  duration_minutes: z.number().int().min(1),
  status: FocusSessionStatusSchema.default("em_andamento"),
  started_at: z.string(),
  ended_at: z.string().nullable().default(null),
  break_reason: z.string().optional(),
  xp_earned: z.number().int().min(0).default(0),
});
export type FocusSession = z.infer<typeof FocusSessionSchema>;

// 13. XP Event (Ledger imutável)
export const XpEventTypeSchema = z.enum(["mission", "daily", "focus", "challenge", "manual"]);
export type XpEventType = z.infer<typeof XpEventTypeSchema>;

export const XpEventSchema = z.object({
  id: z.string(),
  entity_type: XpEventTypeSchema,
  entity_id: z.string(),
  area_id: AreaCodeSchema,
  skill_id: z.string().optional(),
  xp_amount: z.number().int(),
  mastery_amount: z.number().int().default(0),
  description: z.string(),
  created_at: z.string(),
});
export type XpEvent = z.infer<typeof XpEventSchema>;

// 14. Chat Thread
export const ChatThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ChatThread = z.infer<typeof ChatThreadSchema>;

// 15. Chat Message
export const ChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const ProposalStatusSchema = z.enum(["pendente", "aprovada", "rejeitada"]);
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  role: ChatMessageRoleSchema,
  content: z.string(),
  proposal: z.unknown().optional(),
  status: ProposalStatusSchema.optional(),
  created_at: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// 16. Scheduled Notification
export const ScheduledNotificationStatusSchema = z.enum(["pendente", "disparada", "cancelada"]);
export type ScheduledNotificationStatus = z.infer<typeof ScheduledNotificationStatusSchema>;

export const ScheduledNotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  trigger_at: z.string(),
  status: ScheduledNotificationStatusSchema.default("pendente"),
  created_at: z.string(),
});
export type ScheduledNotification = z.infer<typeof ScheduledNotificationSchema>;

// 17. Phrase Bank
export const PhraseBankSpeakerSchema = z.enum(["gs", "world_voice"]);
export type PhraseBankSpeaker = z.infer<typeof PhraseBankSpeakerSchema>;

export const PhraseBankSchema = z.object({
  id: z.string(),
  speaker: PhraseBankSpeakerSchema,
  category: z.string(),
  text: z.string(),
  phonetic_text: z.string().optional(),
  created_at: z.string(),
});
export type PhraseBank = z.infer<typeof PhraseBankSchema>;

// ==========================================
// BASE SEED DATA (5 ÁREAS BASE)
// ==========================================

export const BASE_AREAS: Area[] = [
  {
    id: "INT",
    code: "INT",
    name: "Inteligência",
    description: "Estudos, programação, lógica, idiomas e aprendizado acelerado.",
    color: "#00f3ff",
    icon: "Brain",
    level: 1,
    current_xp: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "FOR",
    code: "FOR",
    name: "Força",
    description: "Treino físico, musculação, calistenia, cardio e condicionamento.",
    color: "#ff3366",
    icon: "Dumbbell",
    level: 1,
    current_xp: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "DIS",
    code: "DIS",
    name: "Disciplina",
    description: "Rotina, acordar cedo, constância, hábitos e controle emocional.",
    color: "#ffaa00",
    icon: "Shield",
    level: 1,
    current_xp: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "CRI",
    code: "CRI",
    name: "Criatividade",
    description: "Design, escrita, projetos autorais, música e inovação.",
    color: "#aa00ff",
    icon: "Sparkles",
    level: 1,
    current_xp: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "SOC",
    code: "SOC",
    name: "Social",
    description: "Networking, relacionamentos interpessoais, oratória e liderança.",
    color: "#00ff88",
    icon: "Users",
    level: 1,
    current_xp: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];
