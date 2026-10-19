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
import { classRepository } from "../../services/classRepository";
import { gameService } from "../../services/gameService";
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
  Square,
  RotateCcw,
  Pencil,
  Check,
  X,
} from "lucide-react";

export const GsChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [recalculatingNotice, setRecalculatingNotice] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [autoPlayVoice, setAutoPlayVoice] = useState<boolean>(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const audioAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadChat = async () => {
      await chatRepository.getOrCreateMainThread();
      const [loaded, autoPlay] = await Promise.all([
        chatRepository.getMessages(MAIN_THREAD_ID),
        gsVoiceService.isAutoPlayEnabled(),
      ]);

      if (isMounted) {
        setAutoPlayVoice(autoPlay);
        if (loaded.length === 0) {
          const welcomeMsg: ChatMessage = {
            id: `welcome-${Date.now()}`,
            thread_id: MAIN_THREAD_ID,
            role: "assistant",
            content:
              "Resposta: O canal neural com a Grande Sábio está estabelecido. No Modo Coordenador, conduzirei uma breve análise estratégica antes de arquitetar árvores de projetos e habilidades. Qual é o seu direcionamento, Escolhido?",
            created_at: new Date().toISOString(),
          };
          await chatRepository.saveMessage(welcomeMsg);
          if (isMounted) {
            setMessages((prev) => (prev.length === 0 ? [welcomeMsg] : [welcomeMsg, ...prev]));
          }
        } else {
          setMessages((prev) => (prev.length === 0 ? loaded : prev));
        }
      }
    };

    void loadChat();

    const unsubscribeVoice = gsVoiceService.subscribe((speaking) => {
      if (!speaking && isMounted) {
        setCurrentlySpeakingId(null);
      }
    });

    const unsubscribeGame = gameService.subscribeToGameEvents((ev) => {
      if (ev.type === "ONBOARDING_COMPLETED" && isMounted) {
        void loadChat();
      }
    });

    return () => {
      isMounted = false;
      chatAbortControllerRef.current?.abort();
      audioAbortControllerRef.current?.abort();
      unsubscribeVoice();
      unsubscribeGame();
    };
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && container.scrollHeight > container.clientHeight) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading, isSynthesizingAudio, recalculatingNotice]);

  const assembleHunterContext = async (): Promise<HunterContext> => {
    return await buildMemorySnapshot();
  };

  const handleToggleAutoPlayVoice = async () => {
    const nextVal = !autoPlayVoice;
    setAutoPlayVoice(nextVal);
    await gsVoiceService.setAutoPlayEnabled(nextVal);
    if (!nextVal) {
      audioAbortControllerRef.current?.abort();
      gsVoiceService.stopCurrentSpeech();
      setCurrentlySpeakingId(null);
    }
    hapticFeedback.tap();
  };

  const handleCancelRequest = () => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    if (audioAbortControllerRef.current) {
      audioAbortControllerRef.current.abort();
      audioAbortControllerRef.current = null;
    }
    gsVoiceService.cancelPendingSynthesis();
    setIsSynthesizingAudio(false);
    setRecalculatingNotice(null);
    setIsLoading(false);
    hapticFeedback.tap();
  };

  const handleCancelAudioSynthesis = () => {
    if (audioAbortControllerRef.current) {
      audioAbortControllerRef.current.abort();
      audioAbortControllerRef.current = null;
    }
    gsVoiceService.cancelPendingSynthesis();
    setIsSynthesizingAudio(false);
    hapticFeedback.tap();
  };

  const executeGsTurn = async (conversationMessages: ChatMessage[]) => {
    setIsLoading(true);
    setIsSynthesizingAudio(false);
    setRecalculatingNotice(null);
    gsVoiceService.stopCurrentSpeech();

    const chatAbortController = new AbortController();
    chatAbortControllerRef.current = chatAbortController;

    try {
      const apiUrl = getStoredApiUrl() || "";
      const token = getStoredToken() || "";
      const hunterContext = await assembleHunterContext();
      const allExistingSkills = await localDb.getAll<Skill>("skill");

      const lastUserMsg = [...conversationMessages].reverse().find((m) => m.role === "user");

      void logger.info("ai", `[Canal Neural // Transmissão] Enviando diretriz à Grande Sábio`, {
        threadId: MAIN_THREAD_ID,
        userMessage: lastUserMsg?.content || "",
        activeProjects: hunterContext.projects.length,
        activeSkills: hunterContext.skills.length,
        estimatedSnapshotTokens: hunterContext.estimated_tokens,
      });

      let currentReqMessages = conversationMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let finalReplyContent = "";
      let finalProposal: Proposal | undefined = undefined;
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let totalCombinedTokens = 0;
      let requestsMade = 0;

      const MAX_RETRIES = 2;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const res = await sendChatMessage(
          apiUrl,
          token,
          {
            thread_id: MAIN_THREAD_ID,
            messages: currentReqMessages,
            hunter_context: hunterContext,
          },
          { signal: chatAbortController.signal },
        );

        if (res.aborted || chatAbortController.signal.aborted) {
          void logger.info("ai", "[Canal Neural] Requisição interrompida pelo usuário.");
          return;
        }

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

        const { content: replyContent, proposal, usage } = res.data;
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
          break;
        } else {
          finalProposal = proposal;
          finalReplyContent = replyContent;
          break;
        }
      }

      setRecalculatingNotice(null);

      if (chatAbortController.signal.aborted) {
        return;
      }

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

      // Sincroniza fala + texto: prepara o áudio antes de exibir o balão quando Auto-Voz está ativa
      const shouldAutoPlay = await gsVoiceService.isAutoPlayEnabled();
      setAutoPlayVoice(shouldAutoPlay);

      let preparedSpeech: Awaited<ReturnType<typeof gsVoiceService.prepareSpeech>> = null;
      if (shouldAutoPlay && finalReplyContent.trim().length > 0) {
        setIsSynthesizingAudio(true);
        const audioController = new AbortController();
        audioAbortControllerRef.current = audioController;
        preparedSpeech = await gsVoiceService.prepareSpeech(
          finalReplyContent,
          audioController.signal,
        );
        setIsSynthesizingAudio(false);
        audioAbortControllerRef.current = null;
      }

      if (chatAbortController.signal.aborted) {
        return;
      }

      await chatRepository.saveMessage(assistantMsg);
      setMessages((prev) => [...prev, assistantMsg]);
      hapticFeedback.success();

      if (preparedSpeech) {
        setCurrentlySpeakingId(assistantMsg.id);
        void gsVoiceService.playPreparedSpeech(preparedSpeech);
      }
    } catch (err: unknown) {
      if (chatAbortController.signal.aborted) {
        return;
      }
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
      chatAbortControllerRef.current = null;
      audioAbortControllerRef.current = null;
      setIsSynthesizingAudio(false);
      setRecalculatingNotice(null);
      setIsLoading(false);
    }
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

    await executeGsTurn(updatedMessages);
  };

  const handleRegenerateLastResponse = async () => {
    if (isLoading || messages.length === 0) return;

    // Encontra a última mensagem da G.S que suceda uma mensagem do usuário
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    const hasUserPrompt = messages.some((m) => m.role === "user");
    if (!hasUserPrompt) return;

    gsVoiceService.stopCurrentSpeech();
    setCurrentlySpeakingId(null);

    await chatRepository.deleteMessage(lastMsg.id);
    const remainingMessages = messages.slice(0, -1);
    setMessages(remainingMessages);
    hapticFeedback.tap();

    await executeGsTurn(remainingMessages);
  };

  const handleStartEditMessage = (msg: ChatMessage) => {
    if (isLoading) return;
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleSaveEditAndRegenerate = async (msgId: string) => {
    const trimmed = editingContent.trim();
    if (!trimmed || isLoading) return;

    const targetIndex = messages.findIndex((m) => m.id === msgId);
    if (targetIndex === -1) return;

    gsVoiceService.stopCurrentSpeech();
    setCurrentlySpeakingId(null);
    setEditingMessageId(null);
    setEditingContent("");

    await chatRepository.truncateMessagesAfter(msgId, true, MAIN_THREAD_ID);

    const updatedUserMsg: ChatMessage = {
      ...messages[targetIndex],
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    await chatRepository.saveMessage(updatedUserMsg);
    const updatedConversation = [...messages.slice(0, targetIndex), updatedUserMsg];
    setMessages(updatedConversation);
    hapticFeedback.tap();

    await executeGsTurn(updatedConversation);
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
      } else if (proposal.type === "propose_class_challenge") {
        const challenge = await classRepository.proposeChallenge({
          areaId: proposal.area_id,
          targetTier: proposal.target_tier,
          name_class: proposal.name_class,
          challenge_title: proposal.challenge_title,
          challenge_description: proposal.challenge_description,
        });
        await classRepository.acceptChallenge(challenge.id);
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
    } else if (proposal.type === "propose_class_challenge") {
      prompt = `Grande Sábio, sobre a provação para a classe "${proposal.name_class}", altere: `;
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
    gsVoiceService.stopCurrentSpeech();
    await chatRepository.clearThreadMessages(MAIN_THREAD_ID);
    setMessages([]);
    hapticFeedback.tap();
  };

  const hasUserMessages = messages.some((m) => m.role === "user");
  const lastAssistantMessageId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full max-w-4xl mx-auto space-y-3 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#dfa86c]/30 pb-3 shrink-0 gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#dfa86c]" />
            <span>GRANDE SÁBIO // COMUNICAÇÃO NEURAL</span>
          </h2>
          <p className="text-xs text-[#c5b08f] font-mono mt-0.5">
            Conselheira autônoma · Regra #1: Toda alteração exige aprovação no Cartão de Prévia.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleToggleAutoPlayVoice()}
            aria-label={autoPlayVoice ? "Desativar voz automática da G.S" : "Ativar voz automática da G.S"}
            title={autoPlayVoice ? "Voz Automática da G.S: ATIVA" : "Voz Automática da G.S: SILENCIADA"}
            className={`px-2.5 py-1.5 text-[11px] font-mono border flex items-center gap-1.5 transition-colors ${
              autoPlayVoice
                ? "border-[#fde047]/60 bg-[#1c1308]/80 text-[#fde047]"
                : "border-[#dfa86c]/30 bg-[#040814] text-[#c5b08f] hover:text-[#f8ecd5]"
            }`}
          >
            {autoPlayVoice ? (
              <Volume2 className="w-3.5 h-3.5 text-[#fde047]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#c5b08f]" />
            )}
            <span className="hidden sm:inline">
              {autoPlayVoice ? "Voz G.S: ON" : "Voz G.S: OFF"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            title="Limpar Histórico"
            aria-label="Limpar Histórico"
            className="p-2 text-[#c5b08f] hover:text-rose-400 border border-[#dfa86c]/30 hover:border-rose-500/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área Rolável de Mensagens (rola apenas se as mensagens ultrapassarem a altura disponível) */}
      <div
        ref={messagesContainerRef}
        data-testid="gs-chat-messages-scroll"
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isEditingThis = editingMessageId === msg.id;
          const isLastAssistant =
            !isUser && hasUserMessages && msg.id === lastAssistantMessageId;

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
                    {isUser ? "VOCÊ // ESCOLHIDO" : "GRANDE SÁBIO (G.S)"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isUser && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => handleStartEditMessage(msg)}
                        disabled={isLoading}
                        title="Editar pergunta e regerar resposta"
                        aria-label="Editar mensagem"
                        className="text-[#c5b08f] hover:text-[#00f3ff] disabled:opacity-40 transition-colors p-0.5 flex items-center gap-1 text-[10px] font-mono"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    )}

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleToggleSpeakMessage(msg.id, msg.content)}
                        title={
                          currentlySpeakingId === msg.id
                            ? "Cancelar áudio da Grande Sábio"
                            : "Ouvir com a voz Kore"
                        }
                        aria-label={
                          currentlySpeakingId === msg.id
                            ? "Cancelar áudio da mensagem"
                            : "Ouvir com a voz Kore"
                        }
                        className="text-[#c5b08f] hover:text-[#fde047] transition-colors p-0.5 flex items-center gap-1 text-[10px] font-mono"
                      >
                        {currentlySpeakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-[#fde047] animate-pulse" />
                            <span className="text-[#fde047]">Parar Voz</span>
                          </>
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isEditingThis ? (
                  <div className="space-y-2 mt-1.5">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      aria-label="Editar conteúdo da mensagem"
                      className="w-full bg-[#040814] border border-[#00f3ff]/60 p-2 text-xs md:text-sm text-[#f8ecd5] font-sans focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEditMessage}
                        className="px-2.5 py-1 text-[11px] font-mono border border-slate-700 bg-slate-900 text-[#c5b08f] hover:text-white flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancelar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveEditAndRegenerate(msg.id)}
                        disabled={!editingContent.trim()}
                        className="px-2.5 py-1 text-[11px] font-mono border border-[#00f3ff]/60 bg-[#00f3ff]/15 text-[#00f3ff] hover:bg-[#00f3ff]/25 disabled:opacity-40 flex items-center gap-1 font-bold"
                      >
                        <Check className="w-3 h-3" />
                        <span>Salvar e Regerar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}

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

                <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/5">
                  {isLastAssistant ? (
                    <button
                      type="button"
                      onClick={() => void handleRegenerateLastResponse()}
                      disabled={isLoading}
                      aria-label="Pedir nova resposta para a G.S"
                      className="text-[10px] font-mono text-[#dfa86c] hover:text-[#fde047] disabled:opacity-40 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Nova Resposta (Regerar)</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  <span className="block text-[9px] font-mono text-[#c5b08f]/50 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
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
          <div className="relative p-3 bg-[#090d1f] border border-[#fde047]/60 text-xs font-mono text-[#fde047] flex items-center justify-between gap-2.5 shadow-[0_0_20px_rgba(253,224,71,0.18)] animate-pulse">
            <GildedCorners size="xs" color="#fde047" diamondColor="#dfa86c" withInnerFrame={false} />
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#fde047] shrink-0" />
              <span>{recalculatingNotice}</span>
            </div>
            <button
              type="button"
              onClick={handleCancelRequest}
              className="px-2 py-1 text-[10px] font-mono border border-rose-500/60 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 shrink-0"
            >
              Cancelar
            </button>
          </div>
        )}

        {isLoading && !recalculatingNotice && (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-none border border-[#dfa86c] bg-[#040814] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#fde047]" />
            </div>
            <div className="p-3 bg-[#050a18] border border-[#dfa86c]/30 text-xs font-mono text-[#fde047] flex flex-wrap items-center justify-between gap-3 flex-1 max-w-[85%] md:max-w-[75%]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#dfa86c] shrink-0" />
                <span>
                  {isSynthesizingAudio
                    ? "Grande Sábio sincronizando síntese de voz neural..."
                    : "Grande Sábio processando telemetria e formulando diretrizes..."}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isSynthesizingAudio && (
                  <button
                    type="button"
                    onClick={handleCancelAudioSynthesis}
                    aria-label="Cancelar pedido de áudio"
                    className="px-2.5 py-1 text-[10px] font-mono border border-[#fde047]/60 bg-[#1c1308] text-[#fde047] hover:bg-[#2a1d0c] transition-colors flex items-center gap-1"
                  >
                    <VolumeX className="w-3 h-3" />
                    <span>Cancelar Áudio (Exibir Texto)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancelRequest}
                  aria-label="Impedir requisição"
                  className="px-2.5 py-1 text-[10px] font-mono border border-rose-500/60 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 transition-colors flex items-center gap-1"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Parar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Atalhos Rápidos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <button
          type="button"
          onClick={() => void handleSendMessage("Grande Sábio, analise minhas pendências imediatas.")}
          disabled={isLoading}
          className="px-2.5 py-1 text-[11px] font-mono border border-[#dfa86c]/30 bg-[#040814] text-[#c5b08f] hover:text-[#fde047] hover:border-[#dfa86c] disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          ✦ Analisar pendências
        </button>
        <button
          type="button"
          onClick={() =>
            void handleSendMessage("Proponha um novo projeto focado em Inteligência para aprender Rust.")
          }
          disabled={isLoading}
          className="px-2.5 py-1 text-[11px] font-mono border border-[#00f3ff]/30 bg-[#040814] text-[#c5b08f] hover:text-[#00f3ff] hover:border-[#00f3ff] disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          ✦ Criar projeto INT
        </button>
        <button
          type="button"
          onClick={() =>
            void handleSendMessage("Proponha um projeto de Força e Calistenia para iniciantes.")
          }
          disabled={isLoading}
          className="px-2.5 py-1 text-[11px] font-mono border border-[#ff3366]/30 bg-[#040814] text-[#c5b08f] hover:text-[#ff3366] hover:border-[#ff3366] disabled:opacity-40 transition-colors whitespace-nowrap"
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

        {isLoading ? (
          <button
            type="button"
            onClick={handleCancelRequest}
            aria-label="Parar requisição"
            className="py-1.5 px-3 text-xs font-mono font-bold uppercase tracking-wider border border-rose-500/70 bg-rose-950/80 text-rose-200 hover:bg-rose-900 flex items-center gap-1.5 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Parar</span>
          </button>
        ) : (
          <SystemButton
            variant="primary"
            type="submit"
            disabled={!inputValue.trim()}
            className="py-1.5 px-3 text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            <span>Enviar</span>
          </SystemButton>
        )}
      </form>
    </div>
  );
};

