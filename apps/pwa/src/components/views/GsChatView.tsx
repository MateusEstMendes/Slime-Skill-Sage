import React, { useState, useEffect, useRef } from "react";
import {
  type ChatMessage,
  type HunterContext,
  type Skill,
  type Proposal,
} from "@slime-sage/shared";
import {
  classifySkillsDiff,
  validateProposalIntegrity,
} from "@slime-sage/game";
import { chatRepository, MAIN_THREAD_ID } from "../../services/chatRepository";
import { localDb } from "../../services/db";
import { projectRepository } from "../../services/projectRepository";
import { buildMemorySnapshot } from "../../services/memorySnapshotBuilder";
import { sendChatMessage } from "../../services/apiClient";
import { getStoredApiUrl, getStoredToken } from "../../services/authStorage";
import { gsVoiceService } from "../../services/gsVoiceService";
import { logger } from "../../services/logger";
import { hapticFeedback } from "../../services/haptics";
import { soundService } from "../../services/soundService";
import { worldVoiceService } from "../../services/worldVoiceService";
import { ProposalCard } from "../chat/ProposalCard";
import { GildedCorners } from "../system/GildedCorners";
import { SystemButton } from "../system/SystemButton";
import {
  Bot,
  Send,
  Volume2,
  VolumeX,
  Trash2,
  Loader2,
  User,
} from "lucide-react";

export const GsChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recalculatingNotice, setRecalculatingNotice] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadChat = async () => {
      await chatRepository.getOrCreateMainThread();
      const loaded = await chatRepository.getMessages(MAIN_THREAD_ID);
      if (isMounted) {
        if (loaded.length === 0) {
          const welcomeMsg: ChatMessage = {
            id: `welcome-${Date.now()}`,
            thread_id: MAIN_THREAD_ID,
            role: "assistant",
            content:
              "Resposta: O canal neural com a Grande Sábio está estabelecido. No Modo Coordenador, conduzirei uma breve análise estratégica antes de arquitetar árvores de projetos e habilidades. Qual é o seu direcionamento, Caçador?",
            created_at: new Date().toISOString(),
          };
          await chatRepository.saveMessage(welcomeMsg);
          setMessages([welcomeMsg]);
        } else {
          setMessages(loaded);
        }
      }
    };

    void loadChat();

    const unsubscribe = gsVoiceService.subscribe((speaking) => {
      if (!speaking && isMounted) {
        setCurrentlySpeakingId(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, recalculatingNotice]);

  const assembleHunterContext = async (): Promise<HunterContext> => {
    return await buildMemorySnapshot();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputValue).trim();
    if (!content || isLoading) return;

    setInputValue("");
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      thread_id: MAIN_THREAD_ID,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await chatRepository.saveMessage(userMsg);
    hapticFeedback.tap();

    setIsLoading(true);
    setRecalculatingNotice(null);

    try {
      const apiUrl = getStoredApiUrl() || "";
      const token = getStoredToken() || "";
      const hunterContext = await assembleHunterContext();
      const allExistingSkills = await localDb.getAll<Skill>("skill");

      void logger.info("ai", `[Canal Neural // Transmissão] Enviando diretriz à Grande Sábio`, {
        threadId: MAIN_THREAD_ID,
        userMessage: content,
        activeProjects: hunterContext.projects.length,
        activeSkills: hunterContext.skills.length,
        estimatedSnapshotTokens: hunterContext.estimated_tokens,
      });

      let currentReqMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let finalReplyContent = "";
      let finalProposal: Proposal | undefined = undefined;
      let finalSpokenText: string | undefined = undefined;
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let totalCombinedTokens = 0;
      let requestsMade = 0;

      const MAX_RETRIES = 2;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const res = await sendChatMessage(apiUrl, token, {
          thread_id: MAIN_THREAD_ID,
          messages: currentReqMessages,
          hunter_context: hunterContext,
        });

        if (!res.success || !res.data) {
          const errorContent =
            res.error ||
            "Aviso: Não foi possível alcançar o canal neural. A Grande Sábio opera sob processamento puramente local.";
          void logger.warn("ai", `[Canal Neural // Falha] ${errorContent}`);
          const assistantMsg: ChatMessage = {
            id: `asst-${Date.now()}`,
            thread_id: MAIN_THREAD_ID,
            role: "assistant",
            content: errorContent,
            created_at: new Date().toISOString(),
          };
          await chatRepository.saveMessage(assistantMsg);
          setMessages((prev) => [...prev, assistantMsg]);
          return;
        }

        const { content: replyContent, proposal, spoken_text, usage } = res.data;
        requestsMade += 1;

        if (usage) {
          totalPromptTokens += usage.prompt_tokens || 0;
          totalCompletionTokens += usage.completion_tokens || 0;
          totalCombinedTokens += usage.total_tokens || 0;
        }

        // Validador Pré-Cartão para create_project_tree
        if (proposal && proposal.type === "create_project_tree") {
          const validation = validateProposalIntegrity(proposal, allExistingSkills);
          if (!validation.isValid) {
            void logger.warn(
              "ai",
              `[Validador Pré-Cartão // Anomalia] Tentativa ${attempt + 1}/${MAX_RETRIES + 1} rejeitada`,
              { errors: validation.errors },
            );

            if (attempt < MAX_RETRIES) {
              setRecalculatingNotice(
                "✦ [SISTEMA] Anomalia estrutural detectada na árvore de missões. Grande Sábio recalculando parâmetros...",
              );
              currentReqMessages = [
                ...currentReqMessages,
                {
                  role: "assistant",
                  content: replyContent || "Proposta preliminar gerada.",
                },
                {
                  role: "user",
                  content: `[CORREÇÃO AUTOMÁTICA DO VALIDADOR DO SISTEMA]: Sua proposta de árvore de projeto falhou na validação estrutural pelos seguintes motivos: ${validation.errors.join(
                    " | ",
                  )}. Reenvie a proposta corrigindo todas as dependências (DAG sem ciclos) e garantindo de 1 a 3 habilidades válidas por missão.`,
                },
              ];
              continue;
            }
          } else if (validation.enrichedProposal) {
            finalProposal = validation.enrichedProposal;
            finalReplyContent = replyContent;
            finalSpokenText = spoken_text;
            break;
          }
        } else if (proposal && proposal.type === "add_missions") {
          finalProposal = {
            ...proposal,
            missions: proposal.missions.map((m) => ({
              ...m,
              skills: classifySkillsDiff(allExistingSkills, m.skills || [], "INT"),
            })),
          };
          finalReplyContent = replyContent;
          finalSpokenText = spoken_text;
          break;
        } else {
          finalProposal = proposal;
          finalReplyContent = replyContent;
          finalSpokenText = spoken_text;
          break;
        }
      }

      setRecalculatingNotice(null);

      void logger.info("ai", `[Canal Neural // Resposta Recebida] Análise concluída pela Grande Sábio`, {
        tokens: {
          prompt_tokens: totalPromptTokens,
          completion_tokens: totalCompletionTokens,
          total_tokens: totalCombinedTokens,
        },
        hasProposal: !!finalProposal,
        proposalType: finalProposal?.type,
        model: "gemini-3.8-flash",
      });

      // Acumula estatísticas de consumo de tokens no IndexedDB
      if (totalCombinedTokens > 0 || requestsMade > 0) {
        const prevStats = (await localDb.getKv<{
          total_prompt_tokens: number;
          total_completion_tokens: number;
          total_tokens: number;
          requests_count: number;
        }>("ai_usage_stats")) || {
          total_prompt_tokens: 0,
          total_completion_tokens: 0,
          total_tokens: 0,
          requests_count: 0,
        };

        await localDb.setKv("ai_usage_stats", {
          total_prompt_tokens: prevStats.total_prompt_tokens + totalPromptTokens,
          total_completion_tokens: prevStats.total_completion_tokens + totalCompletionTokens,
          total_tokens: prevStats.total_tokens + totalCombinedTokens,
          requests_count: prevStats.requests_count + requestsMade,
          last_used_at: new Date().toISOString(),
        });
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        thread_id: MAIN_THREAD_ID,
        role: "assistant",
        content: finalReplyContent,
        proposal: finalProposal,
        status: finalProposal ? "pendente" : undefined,
        created_at: new Date().toISOString(),
      };

      await chatRepository.saveMessage(assistantMsg);
      setMessages((prev) => [...prev, assistantMsg]);
      hapticFeedback.success();

      // Auto-speak se habilitado nas configurações
      const autoPlay = await localDb.getKv<boolean>("settings_auto_play_voice");
      if (autoPlay && finalSpokenText) {
        setCurrentlySpeakingId(assistantMsg.id);
        void gsVoiceService.speakWithGs(finalSpokenText);
      }
    } catch (err: unknown) {
      console.error("[GsChatView] Erro ao enviar mensagem:", err);
      void logger.error("ai", "[Canal Neural // Anomalia] Erro de comunicação com o servidor", { err });
      const fallbackMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        thread_id: MAIN_THREAD_ID,
        role: "assistant",
        content: "Aviso: Anomalia neural detectada. Operando em modo de sobrevivência local.",
        created_at: new Date().toISOString(),
      };
      await chatRepository.saveMessage(fallbackMsg);
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setRecalculatingNotice(null);
      setIsLoading(false);
    }
  };

  const handleAcceptProposal = async (msgId: string, proposal: Proposal) => {
    try {
      if (proposal.type === "create_project_tree") {
        const { createdSkills } = await projectRepository.createProjectTree(
          {
            area_id: proposal.project.area_id,
            title: proposal.project.title,
            description: proposal.project.description || "",
            target_skill: proposal.project.target_skill,
          },
          proposal.missions.map((m) => ({
            title: m.title,
            description: m.description,
            xp_reward: m.xp_reward,
            depends_on_titles: m.depends_on_titles,
            skills: m.skills,
          })),
        );

        if (createdSkills.length > 0) {
          void logger.info(
            "game",
            `[Decreto G.S] ${createdSkills.length} nova(s) habilidade(s) despertada(s) ao aprovar projeto`,
            { skills: createdSkills.map((s) => s.name) },
          );
        }
      } else if (proposal.type === "add_missions") {
        await projectRepository.addMissions(
          proposal.project_id,
          proposal.missions.map((m) => ({
            title: m.title,
            description: m.description,
            xp_reward: m.xp_reward,
            depends_on_mission_ids: m.depends_on_mission_ids,
            skills: m.skills,
          })),
        );
      } else if (proposal.type === "update_mission") {
        await projectRepository.updateMission(proposal.mission_id, proposal.updates);
      } else if (proposal.type === "delete_mission") {
        await projectRepository.deleteMission(proposal.mission_id);
      }

      await chatRepository.updateMessageProposalStatus(msgId, "aprovada");

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: "aprovada" } : m)),
      );

      if (proposal.type === "create_project_tree" && proposal.project.target_skill?.name) {
        void worldVoiceService.playVoiceClip("/audio/voice/project-start.mp3");
      } else {
        soundService.playMissionComplete();
      }
      hapticFeedback.success();
    } catch (err) {
      console.error("[GsChatView] Erro ao aplicar decreto:", err);
      alert("Falha ao registrar a ação no Sistema.");
    }
  };

  const handleRejectProposal = async (msgId: string) => {
    await chatRepository.updateMessageProposalStatus(msgId, "rejeitada");
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, status: "rejeitada" } : m)),
    );
    hapticFeedback.tap();
  };

  const handleAdjustProposal = (proposal: Proposal) => {
    let prompt = "Grande Sábio, ajuste a proposta: ";
    if (proposal.type === "create_project_tree") {
      prompt = `Grande Sábio, sobre o projeto "${proposal.project.title}", faça o seguinte ajuste: `;
    } else if (proposal.type === "add_missions") {
      prompt = `Grande Sábio, sobre as novas missões, altere: `;
    }
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleToggleSpeakMessage = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      gsVoiceService.stopCurrentSpeech();
      setCurrentlySpeakingId(null);
    } else {
      setCurrentlySpeakingId(msgId);
      void gsVoiceService.speakWithGs(text);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Deseja purificar o histórico de conversas com a Grande Sábio?")) return;
    await chatRepository.clearThreadMessages(MAIN_THREAD_ID);
    setMessages([]);
    hapticFeedback.tap();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#dfa86c]/30 pb-3 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#dfa86c]" />
            <span>GRANDE SÁBIO // COMUNICAÇÃO NEURAL</span>
          </h2>
          <p className="text-xs text-[#c5b08f] font-mono mt-0.5">
            Conselheira autônoma · Regra #1: Toda alteração exige aprovação no Cartão de Prévia.
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          title="Limpar Histórico"
          className="p-2 text-[#c5b08f] hover:text-rose-400 border border-[#dfa86c]/30 hover:border-rose-500/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Área Rolável de Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 scrollbar-thin scrollbar-thumb-[#dfa86c]/20">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-none border border-[#dfa86c] bg-[#040814] flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(223,168,108,0.2)]">
                  <Bot className="w-4 h-4 text-[#fde047]" />
                </div>
              )}

              <div
                className={`relative max-w-[85%] md:max-w-[75%] p-3.5 rounded-none font-sans text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#0c1833] border border-[#00f3ff]/40 text-[#f8ecd5] self-end"
                    : "bg-[#050a18] border border-[#dfa86c]/45 text-[#f8ecd5]"
                }`}
              >
                {!isUser && (
                  <GildedCorners size="xs" color="#dfa86c" diamondColor="#fde047" withInnerFrame={false} />
                )}

                <div className="flex items-center justify-between gap-3 mb-1">
                  <span
                    className={`font-mono text-[10px] tracking-wider uppercase font-bold ${
                      isUser ? "text-[#00f3ff]" : "text-[#dfa86c]"
                    }`}
                  >
                    {isUser ? "VOCÊ // CAÇADOR" : "GRANDE SÁBIO (G.S)"}
                  </span>

                  {!isUser && (
                    <button
                      onClick={() => handleToggleSpeakMessage(msg.id, msg.content)}
                      title="Ouvir com a voz Kore"
                      className="text-[#c5b08f] hover:text-[#fde047] transition-colors p-0.5"
                    >
                      {currentlySpeakingId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#fde047] animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Renderização do Cartão de Prévia quando houver proposta */}
                {msg.proposal && (
                  <ProposalCard
                    proposal={msg.proposal}
                    status={msg.status}
                    onAccept={() => handleAcceptProposal(msg.id, msg.proposal as Proposal)}
                    onReject={() => handleRejectProposal(msg.id)}
                    onAdjust={() => handleAdjustProposal(msg.proposal as Proposal)}
                  />
                )}

                <span className="block text-[9px] font-mono text-[#c5b08f]/50 mt-1.5 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-none border border-[#00f3ff]/50 bg-[#0c1833] flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-[#00f3ff]" />
                </div>
              )}
            </div>
          );
        })}

        {recalculatingNotice && (
          <div className="relative p-3 bg-[#090d1f] border border-[#fde047]/60 text-xs font-mono text-[#fde047] flex items-center gap-2.5 shadow-[0_0_20px_rgba(253,224,71,0.18)] animate-pulse">
            <GildedCorners size="xs" color="#fde047" diamondColor="#dfa86c" withInnerFrame={false} />
            <Loader2 className="w-4 h-4 animate-spin text-[#fde047] shrink-0" />
            <span>{recalculatingNotice}</span>
          </div>
        )}

        {isLoading && !recalculatingNotice && (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-none border border-[#dfa86c] bg-[#040814] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#fde047]" />
            </div>
            <div className="p-3 bg-[#050a18] border border-[#dfa86c]/30 text-xs font-mono text-[#fde047] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#dfa86c]" />
              <span>Grande Sábio processando telemetria e formulando diretrizes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Atalhos Rápidos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <button
          onClick={() => handleSendMessage("Grande Sábio, analise minhas pendências imediatas.")}
          disabled={isLoading}
          className="px-2.5 py-1 text-[11px] font-mono border border-[#dfa86c]/30 bg-[#040814] text-[#c5b08f] hover:text-[#fde047] hover:border-[#dfa86c] transition-colors whitespace-nowrap"
        >
          ✦ Analisar pendências
        </button>
        <button
          onClick={() =>
            handleSendMessage("Proponha um novo projeto focado em Inteligência para aprender Rust.")
          }
          disabled={isLoading}
          className="px-2.5 py-1 text-[11px] font-mono border border-[#00f3ff]/30 bg-[#040814] text-[#c5b08f] hover:text-[#00f3ff] hover:border-[#00f3ff] transition-colors whitespace-nowrap"
        >
          ✦ Criar projeto INT
        </button>
        <button
          onClick={() =>
            handleSendMessage("Proponha um projeto de Força e Calistenia para iniciantes.")
          }
          disabled={isLoading}
          className="px-2.5 py-1 text-[11px] font-mono border border-[#ff3366]/30 bg-[#040814] text-[#c5b08f] hover:text-[#ff3366] hover:border-[#ff3366] transition-colors whitespace-nowrap"
        >
          ✦ Criar projeto FOR
        </button>
      </div>

      {/* Barra de Entrada de Mensagem */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSendMessage();
        }}
        className="relative flex items-center gap-2 bg-[#040814] border border-[#dfa86c]/50 p-2 shrink-0 shadow-[0_0_15px_rgba(223,168,108,0.1)]"
      >
        <GildedCorners size="xs" color="#dfa86c" diamondColor="#fde047" withInnerFrame={false} />

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Consulte a Grande Sábio ou solicite novos projetos..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none text-[#f8ecd5] placeholder-[#c5b08f]/50 text-xs md:text-sm px-2 focus:outline-none font-sans"
        />

        <SystemButton
          variant="primary"
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="py-1.5 px-3 text-xs font-bold"
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          <span>Enviar</span>
        </SystemButton>
      </form>
    </div>
  );
};
