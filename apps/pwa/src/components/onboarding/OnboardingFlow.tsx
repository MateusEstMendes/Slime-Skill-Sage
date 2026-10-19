import React, { useState, useEffect, useRef } from "react";
import {
  ONBOARDING_QUESTIONS,
  calculateOnboardingResult,
  type OnboardingResult,
} from "@slime-sage/game";
import { type ChatMessage } from "@slime-sage/shared";
import { GildedCorners } from "../system/GildedCorners";
import { SystemButton } from "../system/SystemButton";
import { gameService } from "../../services/gameService";
import { gsVoiceService } from "../../services/gsVoiceService";
import { chatRepository, MAIN_THREAD_ID } from "../../services/chatRepository";
import { hapticFeedback } from "../../services/haptics";
import { logger } from "../../services/logger";
import {
  Sparkles,
  Volume2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Crown,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export interface OnboardingFlowProps {
  initialHunterName?: string;
  onComplete: () => void;
  typewriterSpeedMs?: number;
}

type OnboardingStage = "intro" | "questions" | "revelation" | "consecration";

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialHunterName = "Rimuru Tempest",
  onComplete,
  typewriterSpeedMs = 18,
}) => {
  const [stage, setStage] = useState<OnboardingStage>("intro");
  const [hunterName, setHunterName] = useState<string>(initialHunterName);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [typedText, setTypedText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopStaticAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // Ignora erro de pausa em ambiente de teste
      }
      audioRef.current = null;
    }
  };

  const playStaticAudio = (audioUrl: string) => {
    stopStaticAudio();
    try {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Ignora bloqueio de autoplay se navegador impedir
        });
      }
      void logger.info("tts", `[Onboarding // Áudio Oficial] Reproduzindo ${audioUrl}`);
    } catch {
      // Ignora erro em ambiente sem áudio
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStaticAudio();
      gsVoiceService.stopCurrentSpeech();
    };
  }, []);

  // Typewriter effect & static audio trigger when stage or question changes
  useEffect(() => {
    let targetText = "";
    let audioUrl: string | null = null;

    if (stage === "intro") {
      targetText =
        "Aviso do Sistema. Inicializando protocolo de avaliação d'alma. A Grande Sábio analisará a sua essência através de cinco diretrizes.";
      audioUrl = "/audio/voice/onboarding-intro.mp3";
    } else if (stage === "questions") {
      const currentQ = ONBOARDING_QUESTIONS[currentQuestionIdx];
      if (currentQ) {
        targetText = currentQ.prompt;
        audioUrl = currentQ.audioUrl;
      }
    } else if (stage === "revelation" && onboardingResult) {
      targetText = onboardingResult.proclamationText;
    } else if (stage === "consecration") {
      targetText =
        "Consagração concluída. Seus parâmetros espirituais foram gravados no Sistema. Responda à Grande Sábio: Qual é a primeira conquista que você deseja alcançar?";
    }

    if (audioUrl) {
      playStaticAudio(audioUrl);
    }

    if (!targetText) {
      setTypedText("");
      setIsTyping(false);
      return;
    }

    if (typewriterSpeedMs <= 0) {
      setTypedText(targetText);
      setIsTyping(false);
      return;
    }

    setTypedText("");
    setIsTyping(true);
    let idx = 0;

    const interval = setInterval(() => {
      idx += 1;
      setTypedText(targetText.slice(0, idx));
      if (idx >= targetText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, typewriterSpeedMs);

    return () => {
      clearInterval(interval);
    };
  }, [stage, currentQuestionIdx, onboardingResult, typewriterSpeedMs]);

  const handleSkipTypewriter = () => {
    if (!isTyping) return;
    if (stage === "intro") {
      setTypedText(
        "Aviso do Sistema. Inicializando protocolo de avaliação d'alma. A Grande Sábio analisará a sua essência através de cinco diretrizes."
      );
    } else if (stage === "questions") {
      const q = ONBOARDING_QUESTIONS[currentQuestionIdx];
      if (q) setTypedText(q.prompt);
    } else if (stage === "revelation" && onboardingResult) {
      setTypedText(onboardingResult.proclamationText);
    } else if (stage === "consecration") {
      setTypedText(
        "Consagração concluída. Seus parâmetros espirituais foram gravados no Sistema. Responda à Grande Sábio: Qual é a primeira conquista que você deseja alcançar?"
      );
    }
    setIsTyping(false);
  };

  const handleStartQuestions = () => {
    hapticFeedback.tap();
    setCurrentQuestionIdx(0);
    setStage("questions");
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    hapticFeedback.tap();
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNextQuestion = async () => {
    hapticFeedback.tap();
    if (currentQuestionIdx < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      return;
    }

    // All 5 questions answered -> calculate deterministic result
    stopStaticAudio();
    const answerList = ONBOARDING_QUESTIONS.map((q) => selectedAnswers[q.id] || "");
    const cleanName = hunterName.trim() || "Rimuru Tempest";
    const result = calculateOnboardingResult(answerList, cleanName);
    setOnboardingResult(result);
    setStage("revelation");

    // Trigger Gemini TTS proclamation via gsVoiceService (with IndexedDB cache)
    setIsSynthesizingVoice(true);
    try {
      await gsVoiceService.speakWithGs(result.proclamationText);
    } catch {
      // Fallback silencioso se offline
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  const handlePrevQuestion = () => {
    hapticFeedback.tap();
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    } else {
      setStage("intro");
    }
  };

  const handleProceedToConsecration = () => {
    hapticFeedback.tap();
    stopStaticAudio();
    setStage("consecration");
  };

  const handleCompleteAwakening = async () => {
    if (!onboardingResult || isSubmitting) return;
    setIsSubmitting(true);
    hapticFeedback.tap();
    stopStaticAudio();
    gsVoiceService.stopCurrentSpeech();

    try {
      const cleanName = hunterName.trim() || "Rimuru Tempest";
      await gameService.completeOnboarding({
        name: cleanName,
        race: onboardingResult.race,
        rankThreat: onboardingResult.rankThreat,
        title: onboardingResult.suggestedTitle,
      });

      // Seed the awakening question in the G.S Chat Thread so the user enters Coordinator Mode immediately
      await chatRepository.getOrCreateMainThread();
      const awakeningMsg: ChatMessage = {
        id: `gs-awakening-${Date.now()}`,
        thread_id: MAIN_THREAD_ID,
        role: "assistant",
        content: `Aviso do Sistema: Despertar concluído para **${cleanName}** — Raça **${onboardingResult.race}** · Rank de Ameaça **${onboardingResult.rankThreat}**.\n\nResposta: Meus sistemas de análise estratégica estão 100% sincronizados com a sua essência espiritual. Qual é a primeira conquista que você deseja alcançar?`,
        created_at: new Date().toISOString(),
      };
      await chatRepository.saveMessage(awakeningMsg);

      onComplete();
    } catch (err) {
      void logger.error("game", "Erro ao finalizar consagração do Onboarding", { err });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIdx];
  const currentSelectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;

  return (
    <div
      data-testid="onboarding-fullscreen"
      className="fixed inset-0 z-50 bg-[#040814] text-[#f3e5cc] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto select-none"
    >
      {/* Background Arcane Esoteric Circle */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-15 overflow-hidden">
        <svg
          viewBox="0 0 400 400"
          className="w-[520px] h-[520px] md:w-[680px] md:h-[680px] text-[#dfa86c] animate-[spin_60s_linear_infinite]"
        >
          <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 4" />
          <circle cx="200" cy="200" r="165" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="135" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" />
          <polygon
            points="200,35 343,282 57,282"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <polygon
            points="200,365 343,118 57,118"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect
            x="105"
            y="105"
            width="190"
            height="190"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            transform="rotate(45 200 200)"
          />
        </svg>
      </div>

      {/* Main Gilded RPG Frame */}
      <div className="relative z-10 w-full max-w-2xl bg-[#060e20]/95 border-2 border-[#c89b55] rounded-none p-6 md:p-8 shadow-[0_0_60px_rgba(223,168,108,0.22)] my-auto">
        <GildedCorners
          size="lg"
          withCenterNotches
          withRunes
          runicTop={
            stage === "questions" && currentQuestion
              ? currentQuestion.runicInscription
              : onboardingResult
              ? onboardingResult.raceMeta.runicSigil
              : "✦ ᛋ ᚨ ᚲ ᚱ ᛖ ᛞ · ᚨ ᚹ ᚨ ᚲ ᛖ ᚾ ᛁ ᚾ ᚷ ✦"
          }
          runicBottom="✦ ᚹ ᛟ ᛁ ᚲ ᛖ · ᛟ ᚠ · ᛏ ᚺ ᛖ · ᚹ ᛟ ᚱ ᛚ ᛞ ✦"
        />

        {/* Header Decree Banner */}
        <div className="relative z-10 text-center border-b border-[#966422]/50 pb-4 mb-6">
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#dfa86c] uppercase flex items-center justify-center gap-2 mb-1">
            <span className="inline-block w-1.5 h-1.5 rotate-45 bg-[#fde047]" />
            <span>[ VOZ DO MUNDO // GRANDE SÁBIO ]</span>
            <span className="inline-block w-1.5 h-1.5 rotate-45 bg-[#fde047]" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-fantasy text-[#fde047] tracking-widest uppercase">
            {stage === "intro" && "Tela I — O Despertar da Consciência"}
            {stage === "questions" && `Tela II — ${currentQuestion?.title ?? "Avaliação d'Alma"}`}
            {stage === "revelation" && "Tela III — Revelação Cerimonial"}
            {stage === "consecration" && "Tela IV — Consagração & Primeira Conquista"}
          </h1>
        </div>

        {/* Typewriter Narrative Box */}
        <div
          onClick={handleSkipTypewriter}
          data-testid="typewriter-box"
          className="relative z-10 p-4 md:p-5 bg-[#040814]/90 border border-[#dfa86c]/55 rounded-none mb-6 cursor-pointer group"
          title="Clique para revelar o texto completo imediatamente"
        >
          <GildedCorners size="xs" withInnerFrame={false} />
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-[10px] font-fantasy uppercase tracking-widest text-[#dfa86c] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#fde047] animate-pulse" />
              <span>Transmissão Neural — Voz Oficial (Kore)</span>
            </span>
            {stage === "questions" && currentQuestion && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playStaticAudio(currentQuestion.audioUrl);
                }}
                aria-label="Ouvir novamente pergunta da G.S"
                className="text-[10px] font-mono text-[#fde047] hover:underline flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>Repetir Áudio</span>
              </button>
            )}
          </div>

          <p
            data-testid="typewriter-text"
            className="text-sm md:text-base font-serif text-[#f8ecd5] leading-relaxed min-h-[3.5rem]"
          >
            {typedText}
            {isTyping && (
              <span className="inline-block w-2 h-4 ml-1 bg-[#fde047] animate-pulse align-middle" />
            )}
          </p>
        </div>

        {/* STAGE 1: INTRO & HUNTER NAME */}
        {stage === "intro" && (
          <div className="relative z-10 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="hunter-name-input"
                className="block text-xs font-fantasy uppercase tracking-wider text-[#dfa86c]"
              >
                Identificação Espiritual (Nome do Caçador)
              </label>
              <input
                id="hunter-name-input"
                type="text"
                value={hunterName}
                onChange={(e) => setHunterName(e.target.value)}
                placeholder="Ex: Rimuru Tempest"
                className="w-full bg-[#040814] border border-[#c89b55]/70 rounded-none px-4 py-3 text-sm font-fantasy tracking-wider text-[#fde047] placeholder-[#8c7a5b] focus:outline-none focus:border-[#fde047]"
              />
              <p className="text-[11px] font-mono text-[#c5b08f]">
                Este nome será inscrito em runas Elder Futhark no seu estandarte de caçador e proclamado pela Grande Sábio.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <SystemButton
                variant="gold-glow"
                size="md"
                onClick={handleStartQuestions}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Iniciar Questionário Solene
              </SystemButton>
            </div>
          </div>
        )}

        {/* STAGE 2: 5 QUESTIONS */}
        {stage === "questions" && currentQuestion && (
          <div className="relative z-10 space-y-5">
            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between text-xs font-mono text-[#c5b08f]">
              <span className="font-fantasy uppercase tracking-wider text-[#dfa86c]">
                Diretriz {currentQuestion.stepNumber} de {ONBOARDING_QUESTIONS.length}
              </span>
              <div className="flex items-center gap-1.5">
                {ONBOARDING_QUESTIONS.map((q, idx) => (
                  <span
                    key={q.id}
                    className={`w-6 h-1.5 border ${
                      idx < currentQuestionIdx
                        ? "bg-[#dfa86c] border-[#fde047]"
                        : idx === currentQuestionIdx
                        ? "bg-[#fde047] border-[#fde047] shadow-[0_0_8px_rgba(253,224,71,0.8)]"
                        : "bg-[#040814] border-[#966422]/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQuestion.options.map((opt) => {
                const isSelected = currentSelectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`option-${opt.id}`}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full text-left p-3.5 rounded-none border transition-all relative overflow-hidden ${
                      isSelected
                        ? "bg-[#1c1308]/95 border-[#fde047] shadow-[0_0_18px_rgba(253,224,71,0.22)]"
                        : "bg-[#040814]/80 border-[#966422]/50 hover:border-[#dfa86c]/80 hover:bg-[#0a152b]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-fantasy font-bold text-xs md:text-sm uppercase tracking-wider text-[#f8ecd5] flex items-center gap-2">
                          <span
                            className={`inline-block w-2 h-2 rotate-45 shrink-0 ${
                              isSelected ? "bg-[#fde047]" : "bg-[#966422]"
                            }`}
                          />
                          <span>{opt.label}</span>
                        </div>
                        <p className="text-xs text-[#c5b08f] font-sans pl-4 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#fde047] shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#966422]/40">
              <SystemButton
                variant="ghost"
                size="sm"
                onClick={handlePrevQuestion}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar
              </SystemButton>

              <SystemButton
                variant="gold-glow"
                size="md"
                disabled={!currentSelectedOption}
                onClick={() => void handleNextQuestion()}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {currentQuestionIdx < ONBOARDING_QUESTIONS.length - 1
                  ? "Próxima Diretriz"
                  : "Revelar Essência"}
              </SystemButton>
            </div>
          </div>
        )}

        {/* STAGE 3: CEREMONIAL REVELATION */}
        {stage === "revelation" && onboardingResult && (
          <div className="relative z-10 space-y-6">
            {/* Concentric Rotating Magic Circle & Race Emblem */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className="absolute inset-0 w-full h-full text-[#fde047] animate-[spin_20s_linear_infinite]"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="92"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="8 4"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="76"
                    fill="none"
                    stroke="#dfa86c"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="100,16 172,142 28,142"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="100,184 172,58 28,58"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
                <div className="relative z-10 w-20 h-20 bg-[#140f08] border-2 border-[#fde047] flex flex-col items-center justify-center shadow-[0_0_25px_rgba(253,224,71,0.45)]">
                  <Crown className="w-7 h-7 text-[#fde047] mb-0.5" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#dfa86c]">
                    {onboardingResult.raceMeta.dominantArea}
                  </span>
                </div>
              </div>

              <div className="text-center mt-3 space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#dfa86c]">
                  Raça Espiritual Despertada
                </div>
                <h2
                  data-testid="revealed-race"
                  className="text-2xl md:text-3xl font-bold font-fantasy text-[#fde047] tracking-widest uppercase"
                >
                  {onboardingResult.race}
                </h2>
                <div className="text-xs font-fantasy text-[#f8ecd5] tracking-wider">
                  {onboardingResult.raceMeta.affinityLabel}
                </div>
              </div>
            </div>

            {/* Race & Threat Rank Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative p-4 bg-[#040814]/90 border border-[#dfa86c]/60 rounded-none">
                <GildedCorners size="xs" withInnerFrame={false} />
                <div className="text-[10px] font-fantasy uppercase tracking-widest text-[#dfa86c] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#fde047]" />
                  <span>Linhagem: {onboardingResult.race}</span>
                </div>
                <p className="text-xs text-[#c5b08f] leading-relaxed">
                  {onboardingResult.raceMeta.description}
                </p>
              </div>

              <div className="relative p-4 bg-[#040814]/90 border border-[#dfa86c]/60 rounded-none">
                <GildedCorners size="xs" withInnerFrame={false} />
                <div className="text-[10px] font-fantasy uppercase tracking-widest text-[#dfa86c] mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#fde047]" />
                  <span>Rank de Ameaça Inicial</span>
                </div>
                <div
                  data-testid="revealed-rank"
                  className="text-base font-bold font-fantasy uppercase tracking-wider text-[#fde047] mb-1"
                >
                  {onboardingResult.rankThreat}
                </div>
                <p className="text-xs text-[#c5b08f] leading-relaxed">
                  {onboardingResult.rankMeta.description}
                </p>
              </div>
            </div>

            {/* Voice Synthesis Status & Replay */}
            <div className="flex items-center justify-between pt-3 border-t border-[#966422]/40">
              <button
                type="button"
                onClick={() => void gsVoiceService.speakWithGs(onboardingResult.proclamationText)}
                className="text-xs font-mono text-[#dfa86c] hover:text-[#fde047] flex items-center gap-2"
              >
                {isSynthesizingVoice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#fde047]" />
                    <span>Sintetizando Decreto Real (Voz Kore)...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#fde047]" />
                    <span>Ouvir Proclamação da Grande Sábio</span>
                  </>
                )}
              </button>

              <SystemButton
                variant="gold-glow"
                size="md"
                onClick={handleProceedToConsecration}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Prosseguir para Consagração
              </SystemButton>
            </div>
          </div>
        )}

        {/* STAGE 4: CONSECRATION & FIRST CONQUEST */}
        {stage === "consecration" && onboardingResult && (
          <div className="relative z-10 space-y-6">
            <div className="p-5 bg-[#140f08]/90 border border-[#fde047]/65 rounded-none space-y-3 text-center">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#dfa86c]">
                Registro no Grimório do Sistema
              </div>
              <div className="text-lg font-bold font-fantasy text-[#f8ecd5] uppercase tracking-wider">
                {hunterName.trim() || "Rimuru Tempest"}
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap text-xs font-fantasy">
                <span className="px-2.5 py-1 bg-[#040814] border border-[#dfa86c] text-[#fde047]">
                  Raça: {onboardingResult.race}
                </span>
                <span className="px-2.5 py-1 bg-[#040814] border border-[#dfa86c] text-[#00f3ff]">
                  Rank: {onboardingResult.rankThreat}
                </span>
                <span className="px-2.5 py-1 bg-[#040814] border border-[#dfa86c] text-[#f3e5cc]">
                  Título: {onboardingResult.suggestedTitle}
                </span>
              </div>
              <p className="text-xs text-[#c5b08f] max-w-md mx-auto pt-1">
                Ao confirmar a consagração, o canal neural da Grande Sábio será aberto no Modo Coordenador para estruturar seu primeiro projeto de 7 a 12 missões.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <SystemButton
                variant="ghost"
                size="sm"
                onClick={() => setStage("revelation")}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar
              </SystemButton>

              <SystemButton
                variant="gold-glow"
                size="lg"
                disabled={isSubmitting}
                onClick={() => void handleCompleteAwakening()}
                icon={<Sparkles className="w-4 h-4" />}
              >
                {isSubmitting ? "Consagrando..." : "Consagrar e Iniciar Primeira Conquista"}
              </SystemButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
