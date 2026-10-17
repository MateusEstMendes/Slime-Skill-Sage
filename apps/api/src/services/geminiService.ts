import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import {
  GS_SYSTEM_PROMPT,
  AreaCodeSchema,
  type Proposal,
  type HunterContext,
  type ChatRequestMessage,
  type ChatResponse,
} from "@slime-sage/shared";

export interface SpeechSynthesisResult {
  audioBase64: string;
  mimeType: string;
  source: "gemini";
}

export function getApiKeys(): { primaryKey?: string; fallbackKey?: string } {
  return {
    primaryKey: process.env.GEMINI_API_KEY?.trim() || undefined,
    fallbackKey:
      process.env.GEMINI_API_KEY_FALLBACK?.trim() ||
      process.env.GEMINI_API_KEY_RESERVE?.trim() ||
      undefined,
  };
}

/**
 * Síntese de voz neural da Grande Sábio usando Gemini 2.0 Flash Audio (voz Kore).
 * Inclui failover automático de chave primária -> fallback em caso de cota (429/503).
 */
export async function synthesizeSpeech(
  text: string,
  voice: string = "Kore",
): Promise<SpeechSynthesisResult> {
  const { primaryKey, fallbackKey } = getApiKeys();
  const keysToTry: string[] = [];
  if (primaryKey) keysToTry.push(primaryKey);
  if (fallbackKey && fallbackKey !== primaryKey) keysToTry.push(fallbackKey);

  if (keysToTry.length === 0) {
    const error = new Error("Nenhuma chave GEMINI_API_KEY configurada no servidor.");
    (error as unknown as { code: string }).code = "NO_API_KEY";
    throw error;
  }

  let lastError: unknown;

  for (const apiKey of keysToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Fale o seguinte texto com a voz solene, serena e precisa da Grande Sábio:\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice || "Kore",
              },
            },
          },
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        const error = new Error(`Gemini Audio API error (${res.status}): ${errorText}`);
        (error as unknown as { status: number }).status = res.status;
        throw error;
      }

      const json = await res.json();
      const inlineData = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (!inlineData?.data) {
        throw new Error("Resposta da API Gemini não continha dados de áudio.");
      }

      return {
        audioBase64: inlineData.data,
        mimeType: inlineData.mimeType || "audio/wav",
        source: "gemini",
      };
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number }).status;
      // Se for 429 (quota) ou 503 (serviço indisponível), tenta a próxima chave
      if (status === 429 || status === 503) {
        continue;
      }
      // Outros erros imediatos também tentam o fallback se houver
    }
  }

  const hibernationError = new Error(
    "Aviso: Grande Sábio em modo de hibernação neural. Síntese indisponível.",
  );
  (hibernationError as unknown as { code: string; cause: unknown }).code = "NEURAL_HIBERNATION";
  (hibernationError as unknown as { cause: unknown }).cause = lastError;
  throw hibernationError;
}

/**
 * Processador de chat estratégico da Grande Sábio com tool calling e propostas.
 */
export async function handleGsChat(
  messages: ChatRequestMessage[],
  hunterContext?: HunterContext,
): Promise<ChatResponse> {
  const { primaryKey, fallbackKey } = getApiKeys();
  const keysToTry: string[] = [];
  if (primaryKey) keysToTry.push(primaryKey);
  if (fallbackKey && fallbackKey !== primaryKey) keysToTry.push(fallbackKey);

  if (keysToTry.length === 0) {
    return {
      role: "assistant",
      content:
        "Resposta: Os canais neurais externos estão inativos (sem chave de API configurada). A Grande Sábio operará em modo de hibernação neural até restabelecimento dos canais.",
      spoken_text: "Aviso: Grande Sábio em modo de hibernação neural.",
    };
  }

  // Prepara o contexto do caçador como prompt de sistema enriquecido
  let contextPrompt = "";
  if (hunterContext) {
    contextPrompt = `\n--- ESTADO ATUAL DO CAÇADOR (TELEMETRIA DO SISTEMA) ---
Nome: ${hunterContext.profile.name}
Título: ${hunterContext.profile.title}
Nível: ${hunterContext.profile.level} (XP Atual: ${hunterContext.profile.current_xp})
Ofensiva (Streak): ${hunterContext.profile.streak_count} dias consecutivos
Habilidades Ativas: ${
      hunterContext.skills.length > 0
        ? hunterContext.skills.map((s) => `${s.name} [${s.tier.toUpperCase()}, ${s.mastery}/300 maestria]`).join(", ")
        : "Nenhuma habilidade registrada ainda."
    }
Projetos Ativos: ${
      hunterContext.projects.length > 0
        ? hunterContext.projects.map((p) => `"${p.title}" [Área: ${p.area_id}, Progresso: ${p.progress}%]`).join(", ")
        : "Nenhum projeto ativo no momento."
    }
Missões Pendentes: ${hunterContext.pending_missions_count}
--------------------------------------------------------\n`;
  }

  const systemInstruction = `${GS_SYSTEM_PROMPT}\n${contextPrompt}`;

  // Definição das ferramentas estruturadas da Fase 6
  const tools = {
    create_project_tree: tool({
      description:
        "Propor a criação de um novo projeto com uma árvore acíclica de missões estruturadas. Esta ação gera um Cartão de Prévia que o Caçador deverá aprovar.",
      inputSchema: z.object({
        project: z.object({
          title: z.string().describe("Título épico e focado do projeto"),
          description: z.string().default("").describe("Objetivo ou escopo do projeto"),
          area_id: AreaCodeSchema.describe("Área de atributo: INT, FOR, DIS, CRI, SOC"),
        }),
        missions: z
          .array(
            z.object({
              title: z.string().describe("Nome da missão"),
              description: z.string().default("").describe("Critério de conclusão"),
              xp_reward: z
                .number()
                .int()
                .min(10)
                .max(80)
                .default(35)
                .describe("Recompensa em XP (10, 20, 35, 55, 80)"),
              depends_on_titles: z
                .array(z.string())
                .default([])
                .describe("Nomes de outras missões deste projeto que devem ser concluídas antes"),
            }),
          )
          .min(1)
          .describe("Lista de missões sequenciadas para o projeto"),
        explanation: z.string().optional().describe("Justificativa estratégica da Grande Sábio"),
      }),
    }),

    add_missions: tool({
      description:
        "Propor a adição de novas missões a um projeto existente. Gera um Cartão de Prévia para aprovação do Caçador.",
      inputSchema: z.object({
        project_id: z.string().describe("ID do projeto alvo"),
        project_title: z.string().optional().describe("Título do projeto alvo"),
        missions: z
          .array(
            z.object({
              title: z.string().describe("Nome da nova missão"),
              description: z.string().default("").describe("Critério de conclusão"),
              xp_reward: z.number().int().min(10).max(80).default(35).describe("XP (10, 20, 35, 55, 80)"),
              depends_on_mission_ids: z.array(z.string()).default([]),
            }),
          )
          .min(1),
        explanation: z.string().optional(),
      }),
    }),

    update_mission: tool({
      description:
        "Propor alteração de título, descrição ou XP de uma missão existente. Gera um Cartão de Prévia.",
      inputSchema: z.object({
        mission_id: z.string().describe("ID da missão a ser modificada"),
        current_title: z.string().optional(),
        updates: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          xp_reward: z.number().int().min(10).max(80).optional(),
        }),
        explanation: z.string().optional(),
      }),
    }),

    delete_mission: tool({
      description:
        "Propor a exclusão de uma missão obsoleta de um projeto. Gera um Cartão de Prévia.",
      inputSchema: z.object({
        mission_id: z.string().describe("ID da missão a ser removida"),
        mission_title: z.string().describe("Título da missão"),
        explanation: z.string().optional(),
      }),
    }),
  };

  let lastError: unknown;

  for (const apiKey of keysToTry) {
    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const model = google("gemini-3.8-flash");

      // Sanitiza mensagens para a API Gemini: garante formato consistente e que inicie com mensagem de 'user'
      let promptMessages = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content.trim(),
        }))
        .filter((m) => m.content.length > 0);

      while (promptMessages.length > 0 && promptMessages[0].role === "assistant") {
        promptMessages.shift();
      }

      if (promptMessages.length === 0) {
        promptMessages = [{ role: "user", content: "Iniciar análise do Sistema." }];
      }

      const result = await generateText({
        model,
        system: systemInstruction,
        messages: promptMessages,
        tools,
      });

      let proposedAction: Proposal | undefined = undefined;

      // Se houver chamada de ferramenta, converte em proposta para o Cartão de Prévia
      if (result.toolCalls && result.toolCalls.length > 0) {
        const firstCall = result.toolCalls[0] as unknown as {
          toolName: string;
          input?: unknown;
          args?: unknown;
        };
        const callPayload = (firstCall.input ?? firstCall.args) as Record<string, unknown>;

        if (firstCall.toolName === "create_project_tree") {
          const args = (callPayload || {}) as {
            project?: { title?: string; description?: string; area_id?: "INT" | "FOR" | "DIS" | "CRI" | "SOC" };
            missions?: Array<{ title?: string; description?: string; xp_reward?: number; depends_on_titles?: string[] }>;
            explanation?: string;
          };
          if (args.project?.title && Array.isArray(args.missions) && args.missions.length > 0) {
            proposedAction = {
              type: "create_project_tree",
              project: {
                title: args.project.title,
                description: args.project.description || "",
                area_id: args.project.area_id || "INT",
              },
              missions: args.missions.map((m) => ({
                title: m.title || "Missão Sem Título",
                description: m.description || "",
                xp_reward: m.xp_reward ?? 35,
                depends_on_titles: m.depends_on_titles || [],
              })),
              explanation: args.explanation,
            };
          }
        } else if (firstCall.toolName === "add_missions") {
          const args = (callPayload || {}) as {
            project_id?: string;
            project_title?: string;
            missions?: Array<{ title?: string; description?: string; xp_reward?: number; depends_on_mission_ids?: string[] }>;
            explanation?: string;
          };
          if (args.project_id && Array.isArray(args.missions) && args.missions.length > 0) {
            proposedAction = {
              type: "add_missions",
              project_id: args.project_id,
              project_title: args.project_title,
              missions: args.missions.map((m) => ({
                title: m.title || "Nova Missão",
                description: m.description || "",
                xp_reward: m.xp_reward ?? 35,
                depends_on_mission_ids: m.depends_on_mission_ids || [],
              })),
              explanation: args.explanation,
            };
          }
        } else if (firstCall.toolName === "update_mission") {
          const args = (callPayload || {}) as {
            mission_id?: string;
            current_title?: string;
            updates?: { title?: string; description?: string; xp_reward?: number };
            explanation?: string;
          };
          if (args.mission_id && args.updates) {
            proposedAction = {
              type: "update_mission",
              mission_id: args.mission_id,
              current_title: args.current_title,
              updates: args.updates,
              explanation: args.explanation,
            };
          }
        } else if (firstCall.toolName === "delete_mission") {
          const args = (callPayload || {}) as {
            mission_id?: string;
            mission_title?: string;
            explanation?: string;
          };
          if (args.mission_id && args.mission_title) {
            proposedAction = {
              type: "delete_mission",
              mission_id: args.mission_id,
              mission_title: args.mission_title,
              explanation: args.explanation,
            };
          }
        }
      }

      // Constrói texto falado conciso para a síntese neural da G.S
      let spokenText = "Análise concluída, Caçador.";
      if (proposedAction) {
        if (proposedAction.type === "create_project_tree") {
          spokenText = `Proposta para o novo projeto "${proposedAction.project.title}" formulada e submetida ao seu julgamento.`;
        } else if (proposedAction.type === "add_missions") {
          spokenText = `Novas diretrizes de missão elaboradas para sua aprovação, Caçador.`;
        } else if (proposedAction.type === "update_mission") {
          spokenText = `Ajuste de parâmetros da missão formulado para sua aprovação.`;
        } else if (proposedAction.type === "delete_mission") {
          spokenText = `Proposta de exclusão de missão submetida ao seu consentimento.`;
        }
      } else if (result.text.length < 150) {
        spokenText = result.text.replace(/[*#_`]/g, "").trim();
      }

      return {
        role: "assistant",
        content: result.text || "Análise concluída. Diretrizes formuladas.",
        proposal: proposedAction,
        spoken_text: spokenText,
        usage: result.usage
          ? {
              prompt_tokens: result.usage.inputTokens ?? 0,
              completion_tokens: result.usage.outputTokens ?? 0,
              total_tokens: result.usage.totalTokens ?? 0,
            }
          : undefined,
      };
    } catch (err: unknown) {
      lastError = err;
      // Continua para tentar fallback se houver
    }
  }

  // Falha em ambas as chaves ou rede
  console.error("[GS Chat] Erro na comunicação com Gemini:", lastError);
  return {
    role: "assistant",
    content:
      "Aviso: Conexão neural com os arquivos centrais indisponível temporariamente. A Grande Sábio entrou em modo de hibernação neural. Suas diretrizes locais continuam em pleno funcionamento.",
    spoken_text: "Aviso: Grande Sábio em modo de hibernação neural.",
  };
}
