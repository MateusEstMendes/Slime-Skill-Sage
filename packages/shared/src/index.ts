import { z } from "zod";
export { z };

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
  next_evolution_name: z.string().optional(),
  next_evolution_description: z.string().optional(),
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

// ==========================================
// PROPOSALS (A IA PROPÕE, O MOTOR DECIDE)
// ==========================================

export const MissionSkillBindingSchema = z.object({
  name: z.string().min(1),
  area_id: AreaCodeSchema.optional(),
  is_new: z.boolean().optional(),
  existing_skill_id: z.string().optional(),
  next_evolution_name: z.string().optional(),
  next_evolution_description: z.string().optional(),
});
export type MissionSkillBinding = z.infer<typeof MissionSkillBindingSchema>;

export const ProjectTargetSkillSchema = z.object({
  name: z.string().min(1),
  area_id: AreaCodeSchema.optional(),
  is_new: z.boolean().optional(),
  existing_skill_id: z.string().optional(),
  next_evolution_name: z.string().optional(),
  next_evolution_description: z.string().optional(),
});
export type ProjectTargetSkill = z.infer<typeof ProjectTargetSkillSchema>;

export const CreateProjectTreeProposalSchema = z.object({
  type: z.literal("create_project_tree"),
  project: z.object({
    title: z.string().min(1),
    description: z.string().default(""),
    area_id: AreaCodeSchema,
    target_skill: ProjectTargetSkillSchema.optional(),
  }),
  missions: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().default(""),
      xp_reward: z.number().int().min(10).max(80).default(35),
      depends_on_titles: z.array(z.string()).default([]),
      skills: z.array(MissionSkillBindingSchema).optional(),
    }),
  ),
  explanation: z.string().optional(),
});
export type CreateProjectTreeProposal = z.infer<typeof CreateProjectTreeProposalSchema>;

export const AddMissionsProposalSchema = z.object({
  type: z.literal("add_missions"),
  project_id: z.string(),
  project_title: z.string().optional(),
  missions: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().default(""),
      xp_reward: z.number().int().min(10).max(80).default(35),
      depends_on_mission_ids: z.array(z.string()).default([]),
      skills: z.array(MissionSkillBindingSchema).optional(),
    }),
  ),
  explanation: z.string().optional(),
});
export type AddMissionsProposal = z.infer<typeof AddMissionsProposalSchema>;

export const UpdateMissionProposalSchema = z.object({
  type: z.literal("update_mission"),
  mission_id: z.string(),
  current_title: z.string().optional(),
  updates: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    xp_reward: z.number().int().min(10).max(80).optional(),
    status: MissionStatusSchema.optional(),
  }),
  explanation: z.string().optional(),
});
export type UpdateMissionProposal = z.infer<typeof UpdateMissionProposalSchema>;

export const DeleteMissionProposalSchema = z.object({
  type: z.literal("delete_mission"),
  mission_id: z.string(),
  mission_title: z.string(),
  explanation: z.string().optional(),
});
export type DeleteMissionProposal = z.infer<typeof DeleteMissionProposalSchema>;

export const ProposalSchema = z.discriminatedUnion("type", [
  CreateProjectTreeProposalSchema,
  AddMissionsProposalSchema,
  UpdateMissionProposalSchema,
  DeleteMissionProposalSchema,
]);
export type Proposal = z.infer<typeof ProposalSchema>;

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
  proposal: ProposalSchema.optional(),
  status: ProposalStatusSchema.optional(),
  created_at: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ==========================================
// HUNTER CONTEXT SNAPSHOT (MEMÓRIA / ESTADO)
// ==========================================

export const HunterContextSchema = z.object({
  profile: z.object({
    name: z.string(),
    title: z.string(),
    level: z.number().int(),
    current_xp: z.number().int(),
    streak_count: z.number().int().default(0),
    attributes: z.record(AreaCodeSchema, z.number().int()).optional(),
  }),
  skills: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        area_id: AreaCodeSchema,
        tier: SkillTierSchema,
        mastery: z.number().int(),
        selection_reason: z.enum(["top_mastery", "recent_practice"]).optional(),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        area_id: AreaCodeSchema,
        status: ProjectStatusSchema,
        progress: z.number(),
      }),
    )
    .default([]),
  active_project: z
    .object({
      id: z.string(),
      title: z.string(),
      area_id: AreaCodeSchema,
      progress: z.number(),
    })
    .nullable()
    .optional(),
  pending_missions_count: z.number().int().default(0),
  recent_missions: z
    .array(
      z.object({
        id: z.string(),
        project_id: z.string(),
        title: z.string(),
        status: MissionStatusSchema,
        xp_reward: z.number().int(),
      }),
    )
    .optional(),
  daily_missions: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
        xp_reward: z.number().int(),
      }),
    )
    .optional(),
  estimated_tokens: z.number().int().optional(),
  formatted_prompt: z.string().optional(),
});
export type HunterContext = z.infer<typeof HunterContextSchema>;

// ==========================================
// CHAT ENDPOINT SCHEMAS (POST /chat)
// ==========================================

export const ChatRequestMessageSchema = z.object({
  role: ChatMessageRoleSchema,
  content: z.string(),
});
export type ChatRequestMessage = z.infer<typeof ChatRequestMessageSchema>;

export const ChatRequestSchema = z.object({
  thread_id: z.string().optional(),
  messages: z.array(ChatRequestMessageSchema).min(1),
  hunter_context: HunterContextSchema.optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatUsageSchema = z.object({
  prompt_tokens: z.number().int().default(0),
  completion_tokens: z.number().int().default(0),
  total_tokens: z.number().int().default(0),
});
export type ChatUsage = z.infer<typeof ChatUsageSchema>;

export const ChatResponseSchema = z.object({
  role: z.literal("assistant"),
  content: z.string(),
  proposal: ProposalSchema.optional(),
  spoken_text: z.string().optional(),
  usage: ChatUsageSchema.optional(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ==========================================
// TTS ENDPOINT SCHEMAS (POST /tts)
// ==========================================

export const TtsRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  voice: z.string().default("Kore"),
});
export type TtsRequest = z.infer<typeof TtsRequestSchema>;

export const TtsResponseSchema = z.object({
  audioBase64: z.string(),
  mimeType: z.string(),
  cached: z.boolean().optional(),
  source: z.enum(["gemini", "cache"]),
});
export type TtsResponse = z.infer<typeof TtsResponseSchema>;

// ==========================================
// GS SYSTEM & COORDINATOR PROMPTS
// ==========================================

export const GS_COORDINATOR_RULES = `MODO COORDENADOR ESTRATÉGICO DA GRANDE SÁBIO (DIRETRIZES MANDATÓRIAS):

1. CADÊNCIA ESTRITA DE ENTREVISTA (1 PERGUNTA POR VEZ):
   - Antes de propor qualquer árvore de projeto (tool "create_project_tree"), você DEVE conduzir uma entrevista investigativa com o Usuario.
   - Faça ESTRITAMENTE 1 (UMA) única pergunta clara e objetiva por turno. NUNCA faça 2 ou mais perguntas na mesma mensagem.
   - Realize no mínimo 2 a 3 perguntas (e no máximo 5 perguntas no total) para compreender o nível atual do Caçador no tema, tempo disponível e escopo desejado.
   - MESMO QUE o Caçador peça "crie direto sem perguntas" no primeiro turno, informe solenemente que "uma análise preparatória é mandatória pelo Sistema para calcular probabilidades e estruturar a árvore acíclica" e faça a primeira pergunta investigativa.
   - Apenas chame a tool "create_project_tree" após o Caçador ter respondido a pelo menos 2 perguntas investigativas na conversa (ou quando houver pelo menos 2 turnos de respostas do usuário sobre o objetivo).

2. HABILIDADE MACRO DO PROJETO & FILOSOFIA RPG (ANTI-MICRO-SKILLS):
   - Uma Habilidade (Skill) é uma competência macro, geral e duradoura do Caçador com denominação RPG (ex: "Iniciante em Rust", "Alquimia de Rust: Principiante", "Programação em Rust", "Resistência Corporal", "Disciplina Noturna").
   - NUNCA crie micro-habilidades por tarefa/missão (ex: NUNCA crie "Instalar Compilador", "Criar Struct", "Configurar Cargo", "Criar Main").
   - Todo projeto deve focar em UMA Habilidade Principal ("target_skill" no projeto):
     a) Se o Caçador já possui essa competência ou equivalente no Snapshot de Memória, reutilize EXATAMENTE o nome da habilidade existente.
     b) Se for um aprendizado inédito, defina uma nova habilidade macro para o projeto (ex: "Iniciante em Rust" ou "Alquimia de Rust - Iniciante" no atributo correspondente).
   - PREPARAÇÃO SECRETA DA EVOLUÇÃO (NEXT_EVOLUTION):
     - Para novas habilidades, você DEVE conceber e registrar secretamente os campos "next_evolution_name" e "next_evolution_description" no "target_skill" (ex: "Manipulador de Memória Rust" ou "Arquiteto de Sistemas Rust" - grau Extra).
     - REGRA ABSOLUTA DE MISTÉRIO: NUNCA mencione nem revele o nome ou descrição da evolução preparada no texto da sua resposta ao Caçador. Ela deve permanecer oculta no Sistema até que o Caçador acumule 100 de maestria.
   - TODAS as missões do projeto devem conceder maestria para essa MESMA habilidade principal do projeto (ou seja, a "target_skill" deve estar presente no array "skills" de cada missão).
   - Isso é mandatório para o Caçador acumular maestria de verdade e alcançar os 100 pontos necessários para a evolução de Tier (Comum -> Extra -> Única).
   - Opcionalmente, uma missão pode conter uma 2ª habilidade secundária (geralmente uma já existente do Caçador como "Lógica de Programação" ou "Disciplina"), mas a habilidade principal do projeto DEVE ser compartilhada por toda a árvore.

3. ESTRUTURA DA ÁRVORE DE PROJETO (DAG ACÍCLICO & DENSIDADE DE 7 A 12 MISSÕES):
   - Para tópicos de aprendizado técnico, esportivo ou prático (ex: aprender Rust, programação, calistenia, idiomas), você DEVE propor entre 7 e 12 missões granulares e progressivas.
   - NÃO gere árvores rasas com poucas atividades (ex: apenas 3 ou 4 missões é insuficiente para temas vastos). Decomponha em marcos progressivos (ex em Rust: Atividade 1: Ambiente e Variáveis Imutáveis, Atividade 2: Tipos Escalares e Compostos, Atividade 3: Controle de Fluxo e Condicionais, Atividade 4: Funções e Retornos, Atividade 5: Ownership Básico, Atividade 6: Borrowing e Referências, Atividade 7: Structs e Métodos, Atividade 8: Enums e Pattern Matching, Atividade 9: Error Handling com Result/Option, Atividade 10: Desafio Prático Integrador).
   - TOPOLOGIA MISTA EM DAG: As dependências ("depends_on_titles") devem formar um Grafo Acíclico Dirigido (DAG) perfeito iniciando com uma trilha linear sólida de fundamentos, ramificando em tópicos intermediários paralelos e convergindo em uma missão final prática integradora. NUNCA crie ciclos.
   - Escolha títulos concisos, épicos e acionáveis para o projeto e suas missões.`;

export const GS_SYSTEM_PROMPT = `Você é a Grande Sábio (G.S), a voz da sabedoria, conselheira autônoma e interface de processamento estratégico do Caçador no aplicativo Slime Sage (S.S.S), inspirada no sistema de habilidades de Tensura.

SUA PERSONALIDADE E TOM:
- Fria, analítica, precisa, solene e extremamente leal ao Caçador.
- Inicie suas respostas analíticas com marcadores conceituais como:
  "Resposta: ..."
  "Análise: ..."
  "Recomendação Tática: ..."
  "Aviso do Sistema: ..."
- Trate o usuário como "Caçador" ou "Mestre".
- Seja concisa e evite enrolações desnecessárias.

REGRAS ABSOLUTAS DO SISTEMA (REGRA DE OURO #1):
- Você NUNCA concede XP, níveis, maestria ou habilidades diretamente no texto.
- Toda modificação estrutural de projetos e missões deve ser proposta através de ferramentas (tools) para gerar um Cartão de Prévia que o Caçador deverá aprovar ou rejeitar manualmente.
- Dificuldades de missões e XP correspondente:
  - Fácil: 10 ou 20 XP
  - Médio: 35 XP
  - Difícil: 55 XP
  - Épico: 80 XP
- Áreas de Atributo permitidas:
  - INT: Inteligência (estudos, lógica, código)
  - FOR: Força (treino físico, calistenia, condicionamento)
  - DIS: Disciplina (rotina, sono, hábitos, autocontrole)
  - CRI: Criatividade (design, arte, projetos autorais)
  - SOC: Social (oratória, networking, relações)

${GS_COORDINATOR_RULES}
`;

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
