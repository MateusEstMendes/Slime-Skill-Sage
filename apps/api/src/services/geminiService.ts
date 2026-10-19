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
  const ttsModels = ["gemini-3.8-flash-tts", "gemini-2.5-flash-preview-tts"];

  for (const apiKey of keysToTry) {
    for (const ttsModel of ttsModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`;
        const cleanSpeechText =
          text
            .replace(/```[\s\S]*?```/g, "")
            .replace(/[*#_`>]/g, "")
            .trim() || "Análise concluída, Caçador.";

        const payload = {
          contents: [
            {
              parts: [
                {
                  text: cleanSpeechText,
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
        // Em caso de cota da chave (429), pula imediatamente para a chave reserva
        if (status === 429) {
          break;
        }
        // Em caso de alta demanda do modelo (503), tenta o próximo modelo TTS
      }
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

  // Prepara o contexto do caçador como prompt de sistema enriquecido (~500 tokens)
  let contextPrompt = "";
  if (hunterContext) {
    if (hunterContext.formatted_prompt) {
      contextPrompt = `\n${hunterContext.formatted_prompt}\n`;
    } else {
      contextPrompt = `\n--- SNAPSHOT DE MEMÓRIA DO CAÇADOR (TELEMETRIA DO SISTEMA) ---
Nome: ${hunterContext.profile.name}
Título: ${hunterContext.profile.title}
Nível: ${hunterContext.profile.level} (XP Atual: ${hunterContext.profile.current_xp})
Ofensiva (Streak): ${hunterContext.profile.streak_count} dias consecutivos
Projeto Ativo: ${
        hunterContext.active_project
          ? `"${hunterContext.active_project.title}" [Área: ${hunterContext.active_project.area_id}, Progresso: ${hunterContext.active_project.progress}%]`
          : hunterContext.projects.length > 0
            ? hunterContext.projects.map((p) => `"${p.title}" [Área: ${p.area_id}, Progresso: ${p.progress}%]`).join(", ")
            : "Nenhum projeto ativo no momento."
      }
Próximas Missões Disponíveis: ${
        hunterContext.recent_missions && hunterContext.recent_missions.length > 0
          ? hunterContext.recent_missions.map((m) => `"${m.title}" (+${m.xp_reward} XP)`).join(", ")
          : `${hunterContext.pending_missions_count} missões pendentes.`
      }
Top 10 Habilidades (Híbrido: Maestria + Prática Recente): ${
        hunterContext.skills.length > 0
          ? hunterContext.skills.map((s) => `${s.name} [${s.area_id} · ${s.tier.toUpperCase()} · ${s.mastery}/300]`).join(", ")
          : "Nenhuma habilidade registrada ainda."
      }
--------------------------------------------------------------\n`;
    }
  }

  const systemInstruction = `${GS_SYSTEM_PROMPT}\n${contextPrompt}`;

  // Definição das ferramentas estruturadas (Fase 6 & Fase 7)
  const tools = {
    create_project_tree: tool({
      description:
        "Propor a criação de um novo projeto com uma árvore acíclica de missões e uma Habilidade Macro RPG compartilhada por toda a árvore. Chame apenas após realizar as perguntas investigativas do Modo Coordenador.",
      inputSchema: z.object({
        project: z.object({
          title: z.string().describe("Título épico e focado do projeto"),
          description: z.string().default("").describe("Objetivo ou escopo do projeto"),
          area_id: AreaCodeSchema.describe("Área de atributo: INT, FOR, DIS, CRI, SOC"),
          target_skill: z
            .object({
              name: z
                .string()
                .describe(
                  "Nome macro da Habilidade Geral do Projeto com sabor RPG (ex: 'Iniciante em Rust' ou 'Alquimia de Rust - Iniciante', 'Resistência Muscular', etc.). NUNCA use micro-tarefas.",
                ),
              area_id: AreaCodeSchema.optional().describe("Atributo da habilidade (INT, FOR, DIS, CRI, SOC)"),
              next_evolution_name: z
                .string()
                .optional()
                .describe(
                  "Nome da evolução futura de grau Extra preparada secretamente pela G.S (ex: 'Manipulador de Memória Rust'). NUNCA mencione este nome na resposta em texto para o Caçador.",
                ),
              next_evolution_description: z
                .string()
                .optional()
                .describe("Descrição arcana da transcendência futura da habilidade."),
            })
            .optional()
            .describe("Habilidade principal/macro que todo o projeto treina e desenvolve"),
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
                .describe("Nomes de outras missões deste projeto que devem ser concluídas antes (DAG acíclico)"),
              skills: z
                .array(
                  z.object({
                    name: z
                      .string()
                      .describe(
                        "Nome da habilidade. DEVE conter a habilidade macro do projeto para que o Caçador acumule maestria nela. NUNCA invente micro-skills por missão.",
                      ),
                    area_id: AreaCodeSchema.optional().describe("Atributo da habilidade: INT, FOR, DIS, CRI, SOC"),
                  }),
                )
                .min(1)
                .max(3)
                .describe("1 a 3 habilidades (incluindo obrigatoriamente a habilidade principal do projeto)"),
            }),
          )
          .min(1)
          .describe(
            "Lista de missões sequenciadas para o projeto. Para aprendizados amplos/técnicos, elabore entre 7 e 12 missões progressivas em DAG mista.",
          ),
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
              skills: z
                .array(
                  z.object({
                    name: z.string().describe("Nome da habilidade associada"),
                    area_id: AreaCodeSchema.optional(),
                  }),
                )
                .min(1)
                .max(3)
                .optional(),
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

    propose_class_challenge: tool({
      description:
        "Propor um desafio de provação autodeclarado para o Escolhido ascender de classe em uma Área ao atingir a maestria necessária. O desafio deve ser um feito real, prático e mensurável.",
      inputSchema: z.object({
        area_id: AreaCodeSchema.describe("Área de atributo: INT, FOR, DIS, CRI, SOC"),
        target_tier: z
          .number()
          .int()
          .min(2)
          .max(10)
          .describe("Patamar alvo: 2 a 10 (Tier II: Iniciante, Tier III: Adepto, Tier IV: Veterano, ..., Tier X: Lendário)"),
        name_class: z
          .string()
          .describe("Nome épico da nova classe formatado canonicamente com colchetes e numeral romano '[Nome da Classe <ROMAN>]' (ex: '[Analista Metódico IV]', '[Decifrador de Algoritmos II]')"),
        challenge_title: z.string().describe("Título arcano do desafio de provação"),
        challenge_description: z
          .string()
          .describe("Descrição clara e acionável da tarefa prática real que o Escolhido deve cumprir"),
        explanation: z.string().optional().describe("Justificativa solene da Grande Sábio para esta provação"),
      }),
    }),
  };

  let lastError: unknown;
  const chatModels = [
    "gemini-3-flash-preview",
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
  ];

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

  for (const apiKey of keysToTry) {
    const google = createGoogleGenerativeAI({ apiKey });

    for (const modelName of chatModels) {
      try {
        const model = google(modelName);

        const result = await generateText({
          model,
          system: systemInstruction,
          messages: promptMessages,
          tools,
          maxRetries: 1,
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
              missions?: Array<{
                title?: string;
                description?: string;
                xp_reward?: number;
                depends_on_titles?: string[];
                skills?: Array<{ name?: string; area_id?: "INT" | "FOR" | "DIS" | "CRI" | "SOC"; is_new?: boolean }>;
              }>;
              explanation?: string;
            };
            if (args.project?.title && Array.isArray(args.missions) && args.missions.length > 0) {
              const defaultArea = args.project.area_id || "INT";
              proposedAction = {
                type: "create_project_tree",
                project: {
                  title: args.project.title,
                  description: args.project.description || "",
                  area_id: defaultArea,
                },
                missions: args.missions.map((m) => ({
                  title: m.title || "Missão Sem Título",
                  description: m.description || "",
                  xp_reward: m.xp_reward ?? 35,
                  depends_on_titles: m.depends_on_titles || [],
                  skills: (m.skills && m.skills.length > 0
                    ? m.skills
                    : [{ name: args.project?.title || "Domínio Técnico", area_id: defaultArea }]
                  ).map((s) => ({
                    name: s.name || "Habilidade",
                    area_id: s.area_id || defaultArea,
                    is_new: s.is_new ?? false,
                  })),
                })),
                explanation: args.explanation,
              };
            }
          } else if (firstCall.toolName === "add_missions") {
            const args = (callPayload || {}) as {
              project_id?: string;
              project_title?: string;
              missions?: Array<{
                title?: string;
                description?: string;
                xp_reward?: number;
                depends_on_mission_ids?: string[];
                skills?: Array<{ name?: string; area_id?: "INT" | "FOR" | "DIS" | "CRI" | "SOC"; is_new?: boolean }>;
              }>;
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
                  skills: (m.skills || []).map((s) => ({
                    name: s.name || "Habilidade",
                    area_id: s.area_id || "INT",
                    is_new: s.is_new ?? false,
                  })),
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
          } else if (firstCall.toolName === "propose_class_challenge") {
            const args = (callPayload || {}) as {
              area_id?: "INT" | "FOR" | "DIS" | "CRI" | "SOC";
              target_tier?: number;
              name_class?: string;
              challenge_title?: string;
              challenge_description?: string;
              explanation?: string;
            };
            if (
              args.area_id &&
              args.target_tier &&
              args.name_class &&
              args.challenge_title &&
              args.challenge_description
            ) {
              proposedAction = {
                type: "propose_class_challenge",
                area_id: args.area_id,
                target_tier: args.target_tier,
                name_class: args.name_class,
                challenge_title: args.challenge_title,
                challenge_description: args.challenge_description,
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
          } else if (proposedAction.type === "propose_class_challenge") {
            spokenText = `Provação para a ascensão à classe "${proposedAction.name_class}" formulada e submetida ao seu julgamento.`;
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
        // Continua para o próximo modelo ou chave fallback em caso de 503 (High Demand) / 429
      }
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
