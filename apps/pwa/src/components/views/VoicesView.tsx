import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  Sparkles,
  ArrowUpCircle,
  Award,
  Zap,
  Radio,
  Gauge,
} from "lucide-react";
import { SystemPanel } from "../system/SystemPanel";
import { SystemButton } from "../system/SystemButton";
import { SystemBadge } from "../system/SystemBadge";
import { GildedCorners } from "../system/GildedCorners";
import { OFFICIAL_VOICE_CLIPS, type VoiceClip } from "../../services/voiceCatalog";
import { ttsService } from "../../services/ttsService";
import { soundService } from "../../services/soundService";
import { worldVoiceService } from "../../services/worldVoiceService";
import { gsVoiceService, DEFAULT_GS_PLAYBACK_RATE } from "../../services/gsVoiceService";
import { hapticFeedback } from "../../services/haptics";

export interface VoicesViewProps {
  isActive?: boolean;
}

const PRESET_PHRASES = [
  "Aviso. O Sistema Slime Sage foi inicializado com sucesso.",
  "Relatório da Grande Sábio: O caçador completou todos os objetivos prioritários de hoje.",
  "Análise confirmada. Nova rota de maestria disponível na Árvore de Habilidades.",
  "Aviso. Alerta de dispersão: favor retomar o foco na diretriz ativa.",
];

export const VoicesView: React.FC<VoicesViewProps> = () => {
  // Official MP3 playback state
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [gsPlaybackRate, setGsPlaybackRate] = useState<number>(DEFAULT_GS_PLAYBACK_RATE);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // TTS State
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedTtsVoice, setSelectedTtsVoice] = useState<string>("");
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [customText, setCustomText] = useState<string>(PRESET_PHRASES[0]);
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);
  const [ttsSupported, setTtsSupported] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string>("");

  // Load TTS voices & saved GS playback rate
  useEffect(() => {
    let isMounted = true;
    void gsVoiceService.getPlaybackRate().then((rate) => {
      if (isMounted) {
        setGsPlaybackRate(rate);
      }
    });
    const supported = ttsService.isSupported();
    setTtsSupported(supported);
    if (supported) {
      void ttsService.getAvailableVoices().then((voices) => {
        if (!isMounted) return;
        setTtsVoices(voices);
        const defaultPt = ttsService.selectPtBrVoice(voices);
        if (defaultPt) {
          setSelectedTtsVoice(defaultPt.name);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangeGsSpeed = async (rate: number) => {
    setGsPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    await gsVoiceService.setPlaybackRate(rate);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      ttsService.stop();
    };
  }, []);

  const handlePlayClip = (clip: VoiceClip) => {
    hapticFeedback.tap();

    // If already playing this clip, toggle pause/stop
    if (playingClipId === clip.id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingClipId(null);
      return;
    }

    // Stop current audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const audio = new Audio(clip.url);
      audio.playbackRate = gsPlaybackRate;
      if ("preservesPitch" in audio) {
        (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
      }
      audioRef.current = audio;
      setPlayingClipId(clip.id);

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const pct = (audio.currentTime / audio.duration) * 100;
          setAudioProgress((prev) => ({ ...prev, [clip.id]: pct }));
        }
      };

      audio.onended = () => {
        setPlayingClipId(null);
        setAudioProgress((prev) => ({ ...prev, [clip.id]: 0 }));
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingClipId(null);
        setActionNotice(`Áudio não encontrado em ${clip.url}. Usando narração TTS de fallback.`);
        setTimeout(() => setActionNotice(""), 4500);
        void ttsService.speak(clip.transcript);
      };

      void audio.play().catch(() => {
        setPlayingClipId(null);
      });
    } catch {
      setPlayingClipId(null);
      void ttsService.speak(clip.transcript);
    }
  };

  const handleStopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingClipId(null);
    ttsService.stop();
    setIsSpeakingTts(false);
  };

  const handleSpeakTts = async () => {
    if (!customText.trim()) return;
    setIsSpeakingTts(true);
    handleStopAll();
    try {
      await ttsService.speak(customText, {
        voiceName: selectedTtsVoice,
        rate: ttsRate,
        pitch: ttsPitch,
      });
    } finally {
      setIsSpeakingTts(false);
    }
  };

  // Triggers for dramatic World Voice Modal
  const handleTriggerModalLevelUp = () => {
    hapticFeedback.levelUp();
    worldVoiceService.enqueue({
      id: `test_lvl_${Date.now()}`,
      type: "LEVEL_UP",
      title: "NÍVEL 5 ALCANÇADO",
      subtitle: "[VOZ DO MUNDO // PROTOCOLO DE DESPERTAR]",
      description: "O indivíduo acumulou experiência suficiente. Todos os atributos e capacidade neural foram elevados para o Nível 5.",
      spokenText: "Aviso. O indivíduo atingiu os requisitos necessários. Nível aumentado para cinco.",
      colorVariant: "cyan",
      details: { previousLevel: 4, newLevel: 5, totalXp: 850 },
    });
  };

  const handleTriggerModalSkillAcquired = () => {
    hapticFeedback.success();
    worldVoiceService.enqueue({
      id: `test_skl_${Date.now()}`,
      type: "SKILL_ACQUIRED",
      title: "HABILIDADE ADQUIRIDA: HIPERFOCO",
      subtitle: "[VOZ DO MUNDO // AQUISIÇÃO DE HABILIDADE]",
      description: "Aviso. Condições atendidas na esfera de Inteligência. O indivíduo obteve a habilidade comum 'Hiperfoco'.",
      spokenText: "Aviso. Condições atendidas. Habilidade 'Hiperfoco' adquirida com sucesso.",
      colorVariant: "cyan",
      details: { skillId: "hiperfoco", skillName: "Hiperfoco", areaId: "INT", skillTier: "comum" },
    });
  };

  const handleTriggerModalSkillEvolved = () => {
    hapticFeedback.skillEvolved();
    worldVoiceService.enqueue({
      id: `test_evo_${Date.now()}`,
      type: "SKILL_EVOLVED_EXTRA",
      title: "EVOLUÇÃO: [EXTRA] ACELERAÇÃO DO PENSAMENTO",
      subtitle: "[VOZ DO MUNDO // EVOLUÇÃO DE HABILIDADE]",
      description: "Confirmação. Requisitos preenchidos com 100 pontos de maestria. A habilidade 'Hiperfoco' rompeu seus limites, ascendendo a 'Aceleração do Pensamento'.",
      spokenText: "Confirmação. Requisitos preenchidos. A habilidade comum 'Hiperfoco' evoluiu para a habilidade extra 'Aceleração do Pensamento'.",
      colorVariant: "gold",
      details: { skillId: "aceleracao", skillName: "Aceleração do Pensamento", mastery: 100, skillTier: "extra" },
    });
  };

  const filteredClips = OFFICIAL_VOICE_CLIPS.filter((clip) => {
    if (selectedCategory === "all") return true;
    return clip.category === selectedCategory;
  });

  const categories = ["all", "Core Events", "Evolução", "Habilidades", "Modo Foco"] as const;

  return (
    <div className="space-y-6 pb-6 select-none font-sans" data-testid="voices-view">
      {/* Top Banner Notice */}
      {actionNotice && (
        <div className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-none text-xs text-amber-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Header Panel */}
      <SystemPanel
        title="ESTAÇÃO DE VOZ // VOZ DO MUNDO & G.S"
        subtitle="Aferição acústica de áudios pré-gravados, sintetizador Web Speech e fanfarras do Sistema"
        glow
        headerAction={
          <div className="flex items-center gap-2">
            {(playingClipId || isSpeakingTts) && (
              <SystemButton
                variant="danger"
                size="sm"
                icon={<Square className="w-3.5 h-3.5 fill-current" />}
                onClick={handleStopAll}
              >
                Parar Áudio
              </SystemButton>
            )}
            <SystemBadge
              label="16 VOZES OFICIAIS"
              className="border-[#dfa86c]/70 text-[#fde047] bg-[#1c1308]/90 font-bold"
            />
          </div>
        }
      >
        <div className="space-y-3 text-xs text-[#e8d5b5] leading-relaxed font-mono">
          <div>
            Este módulo permite testar a biblioteca canônica de voz oficial da{" "}
            <span className="text-[#fde047] font-bold">Voz do Mundo (voz neural Kore)</span> em formato{" "}
            <code className="text-[#dfa86c]">.mp3</code>, além da cadência acelerada da{" "}
            <span className="text-[#fde047] font-bold">Grande Sábio</span> no chat.
          </div>

          {/* Controle de Cadência Global da Voz Kore (1.0x a 2.0x) */}
          <div className="p-3 bg-[#040814]/90 border border-[#dfa86c]/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-fantasy font-bold uppercase tracking-wider text-[#fde047] flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#fde047]" />
                <span>Cadência Global da Voz G.S (Kore — 1.0x até 2.0x):</span>
              </span>
              <span
                data-testid="gs-speed-display"
                className="px-2 py-0.5 bg-[#1c1308] border border-[#fde047] text-[#fde047] font-bold"
              >
                {gsPlaybackRate.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.05"
              data-testid="gs-speed-slider"
              value={gsPlaybackRate}
              onChange={(e) => void handleChangeGsSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#fde047] cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-[#c5b08f]">
              {[1.0, 1.2, 1.35, 1.5, 1.75, 2.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => void handleChangeGsSpeed(preset)}
                  className={`px-2 py-0.5 border transition-colors ${
                    Math.abs(gsPlaybackRate - preset) < 0.03
                      ? "bg-[#1c1308] border-[#fde047] text-[#fde047] font-bold"
                      : "bg-[#060e20] border-[#966422]/40 hover:border-[#dfa86c]"
                  }`}
                >
                  {preset.toFixed(2).replace(/\.00$/, ".0")}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </SystemPanel>

      {/* SECTION 1: OFFICIAL MP3 VOICES */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#dfa86c]" />
            <h3 className="font-fantasy font-bold text-sm text-[#f8ecd5] uppercase tracking-wider">
              Áudios Oficiais da Voz do Mundo (.mp3)
            </h3>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 font-fantasy text-[11px] tracking-wider">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-none border transition-colors uppercase ${
                  selectedCategory === cat
                    ? "bg-[#241909]/95 border-[#dfa86c] text-[#fde047] font-bold shadow-[0_0_10px_rgba(223,168,108,0.25)]"
                    : "bg-[#060e20]/80 border-[#966422]/45 text-[#a39171] hover:text-[#f3e5cc]"
                }`}
              >
                {cat === "all" ? "Todas" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Audio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredClips.map((clip) => {
            const isPlaying = playingClipId === clip.id;
            const progress = audioProgress[clip.id] || 0;
            const isGold = clip.colorVariant === "gold";
            const isPurple = clip.colorVariant === "purple";

            let borderStyle = "border-[#c89b55]/45 hover:border-[#dfa86c]/80";
            let activeBg = "bg-[#060e20]/90";
            if (isGold) {
              borderStyle = "border-[#fde047]/45 hover:border-[#fde047]/80";
            } else if (isPurple) {
              borderStyle = "border-purple-500/45 hover:border-purple-400/80";
            }

            if (isPlaying) {
              activeBg = isGold
                ? "bg-[#261a08]/80 border-[#fde047] shadow-[0_0_20px_rgba(253,224,71,0.25)]"
                : "bg-[#1c1308]/85 border-[#dfa86c] shadow-[0_0_20px_rgba(223,168,108,0.25)]";
            }

            return (
              <div
                key={clip.id}
                className={`relative rounded-none border p-4 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)] ${borderStyle} ${activeBg}`}
              >
                <GildedCorners
                  size="sm"
                  color={isGold ? "#dfa86c" : isPurple ? "#a855f7" : "#c89b55"}
                  diamondColor={isGold ? "#fde047" : isPurple ? "#c084fc" : "#dfa86c"}
                  glow={isPlaying}
                />
                {/* Progress Bar background for active playing clip */}
                {isPlaying && (
                  <div
                    className={`absolute bottom-0 left-0 top-0 opacity-15 pointer-events-none transition-all duration-100 ${
                      isGold ? "bg-[#fde047]" : "bg-[#dfa86c]"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                )}

                <div className="space-y-2 z-10">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-fantasy font-bold px-2 py-0.5 rounded-none border uppercase tracking-wider ${
                        isGold
                          ? "bg-[#261a08]/90 border-[#fde047]/60 text-[#fde047]"
                          : isPurple
                            ? "bg-purple-950/80 border-purple-500/50 text-purple-300"
                            : "bg-[#140f08]/90 border-[#c89b55]/60 text-[#dfa86c]"
                      }`}
                    >
                      {clip.badge}
                    </span>

                    <span className="text-[10px] font-mono text-[#a39171]">
                      {clip.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-fantasy font-bold text-sm text-[#f8ecd5] tracking-wide">
                      {clip.title}
                    </h4>
                    <p className="text-[10px] font-mono text-[#dfa86c] mt-0.5">
                      {clip.subtitle}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-none bg-[#040814]/85 border border-[#966422]/40 text-xs font-mono text-[#e8d5b5] italic">
                    &ldquo;{clip.transcript}&rdquo;
                  </div>
                </div>

                {/* Card Play Controls */}
                <div className="mt-3.5 pt-3 border-t border-[#966422]/35 flex items-center justify-between gap-2 z-10">
                  <span className="text-[10px] font-mono text-[#a39171] truncate">
                    {clip.url.split("/").pop()}
                  </span>

                  <button
                    onClick={() => handlePlayClip(clip)}
                    data-testid={`play-btn-${clip.id}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none font-fantasy uppercase tracking-wider text-xs font-bold transition-all ${
                      isPlaying
                        ? "bg-gradient-to-b from-[#e8b974] to-[#966422] text-[#050811] border border-[#fde047] shadow-[0_0_15px_rgba(223,168,108,0.7)] scale-105"
                        : "bg-[#081329] border border-[#c89b55]/60 text-[#f3e5cc] hover:bg-[#101f42] hover:border-[#fde047]"
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tocar Voz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: DRAMATIC WORLD VOICE MODAL TESTING */}
      <SystemPanel
        title="SIMULADOR DO MODAL SOLENE // VOZ DO MUNDO"
        subtitle="Dispare anúncios em tela cheia com partículas e animações idênticas ao fluxo de gameplay"
      >
        <div className="space-y-3">
          <p className="text-xs font-mono text-[#e8d5b5]">
            Clique para testar o modal dramático que surge para o caçador durante conquistas maiores:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={handleTriggerModalLevelUp}
              data-testid="trigger-modal-level-up"
              className="relative p-3.5 rounded-none bg-[#081329]/90 border border-[#c89b55]/55 hover:border-[#fde047] hover:bg-[#101f42]/90 text-left transition-all group flex flex-col justify-between overflow-hidden shadow-[0_0_15px_rgba(223,168,108,0.08)]"
            >
              <GildedCorners size="xs" withInnerFrame={false} />
              <div className="relative z-10 flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-5 h-5 text-[#dfa86c] group-hover:scale-110 transition-transform" />
                <span className="font-fantasy font-bold text-xs text-[#f8ecd5] uppercase tracking-wider">Novo Nível (Level Up)</span>
              </div>
              <span className="relative z-10 text-[11px] font-mono text-[#c5b08f]">
                Tema Ouro Imperial // Partículas e calibração de status
              </span>
            </button>

            <button
              onClick={handleTriggerModalSkillAcquired}
              data-testid="trigger-modal-skill-acquired"
              className="relative p-3.5 rounded-none bg-[#081329]/90 border border-[#c89b55]/55 hover:border-[#fde047] hover:bg-[#101f42]/90 text-left transition-all group flex flex-col justify-between overflow-hidden shadow-[0_0_15px_rgba(223,168,108,0.08)]"
            >
              <GildedCorners size="xs" withInnerFrame={false} />
              <div className="relative z-10 flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#dfa86c] group-hover:scale-110 transition-transform" />
                <span className="font-fantasy font-bold text-xs text-[#f8ecd5] uppercase tracking-wider">Habilidade Adquirida</span>
              </div>
              <span className="relative z-10 text-[11px] font-mono text-[#c5b08f]">
                Tema Ouro Imperial // Registro na Árvore de Habilidades
              </span>
            </button>

            <button
              onClick={handleTriggerModalSkillEvolved}
              data-testid="trigger-modal-skill-evolved"
              className="relative p-3.5 rounded-none bg-[#1c1308]/90 border border-[#fde047]/60 hover:border-[#fde047] hover:bg-[#2a1d0c]/90 text-left transition-all group flex flex-col justify-between overflow-hidden shadow-[0_0_20px_rgba(253,224,71,0.15)]"
            >
              <GildedCorners size="xs" withInnerFrame={false} color="#dfa86c" diamondColor="#fde047" />
              <div className="relative z-10 flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-[#fde047] group-hover:scale-110 transition-transform" />
                <span className="font-fantasy font-bold text-xs text-[#fde047] uppercase tracking-wider">Evolução de Habilidade</span>
              </div>
              <span className="relative z-10 text-[11px] font-mono text-[#dfa86c]">
                Tema Ouro Radiante // Ascensão para Grau Extra com 100 de Maestria
              </span>
            </button>
          </div>
        </div>
      </SystemPanel>

      {/* SECTION 3: WEB SPEECH API (GRANDE SÁBIO TTS ENGINE) */}
      <SystemPanel
        title="SÍNTESE DE VOZ OFFLINE // GRANDE SÁBIO (TTS)"
        subtitle="Web Speech API integrada ao navegador com normalizador fonético para termos em inglês"
      >
        {!ttsSupported ? (
          <div className="p-3.5 bg-amber-950/40 border border-amber-600/40 rounded-none text-amber-300 text-xs font-mono">
            A Web Speech API (speechSynthesis) não está disponível no navegador atual.
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs">
            {/* Voice select */}
            <div>
              <label className="text-[#dfa86c] font-fantasy uppercase tracking-wider block mb-1.5 font-bold">
                Selecione a Voz Instalada no Navegador:
              </label>
              <select
                value={selectedTtsVoice}
                onChange={(e) => setSelectedTtsVoice(e.target.value)}
                className="w-full bg-[#040814] border border-[#966422]/60 rounded-none px-3 py-2 text-xs text-[#f3e5cc] focus:outline-none focus:border-[#dfa86c]"
              >
                {ttsVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang}) {v.default ? "★ Padrão" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders Rate & Pitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#040814]/85 border border-[#966422]/45 rounded-none space-y-1.5">
                <div className="flex justify-between text-[#e8d5b5]">
                  <span className="font-fantasy uppercase tracking-wider">Velocidade de Fala (Rate):</span>
                  <span className="text-[#fde047] font-bold">{ttsRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={ttsRate}
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  className="w-full accent-[#dfa86c]"
                />
              </div>

              <div className="p-3 bg-[#040814]/85 border border-[#966422]/45 rounded-none space-y-1.5">
                <div className="flex justify-between text-[#e8d5b5]">
                  <span className="font-fantasy uppercase tracking-wider">Tom da Voz (Pitch):</span>
                  <span className="text-[#fde047] font-bold">{ttsPitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={ttsPitch}
                  onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                  className="w-full accent-[#dfa86c]"
                />
              </div>
            </div>

            {/* Custom Input & Presets */}
            <div className="space-y-2">
              <label className="text-[#dfa86c] font-fantasy uppercase tracking-wider block font-bold">
                Texto para Fala da Grande Sábio:
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={2}
                placeholder="Digite uma mensagem para a Grande Sábio narrar..."
                className="w-full bg-[#040814] border border-[#966422]/60 rounded-none p-2.5 text-xs text-[#f3e5cc] placeholder-[#8c7a5b] focus:outline-none focus:border-[#dfa86c]"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-fantasy text-[#c5b08f] uppercase font-bold mr-1">
                  Frases Rápidas:
                </span>
                {PRESET_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomText(phrase)}
                    className="px-2 py-1 rounded-none bg-[#060e20] border border-[#966422]/45 hover:border-[#dfa86c] text-[10px] font-fantasy uppercase tracking-wider text-[#c5b08f] hover:text-[#fde047] transition-colors"
                  >
                    Exemplo {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Speech Action Buttons */}
            <div className="flex gap-3 pt-2">
              <SystemButton
                variant="cyan-glow"
                size="md"
                onClick={handleSpeakTts}
                disabled={isSpeakingTts}
                icon={<Play className="w-4 h-4 fill-current" />}
                className="flex-1"
              >
                {isSpeakingTts ? "Grande Sábio Falando..." : "Narrar Texto com a G.S"}
              </SystemButton>

              {isSpeakingTts && (
                <SystemButton
                  variant="danger"
                  size="md"
                  onClick={handleStopAll}
                  icon={<Square className="w-4 h-4 fill-current" />}
                >
                  Interromper
                </SystemButton>
              )}
            </div>
          </div>
        )}
      </SystemPanel>

      {/* SECTION 4: WEB AUDIO API FANFARES & CHIMES */}
      <SystemPanel
        title="EFEITOS SONOROS DO SISTEMA // WEB AUDIO API"
        subtitle="Síntese harmônica pura offline sem arquivos externos (chimes, notificações e fanfarras)"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <button
            onClick={() => {
              hapticFeedback.tap();
              soundService.playSystemNotification();
            }}
            className="p-3 rounded-none bg-[#040814]/90 border border-[#966422]/50 hover:border-[#dfa86c] hover:bg-[#081329] text-[#e8d5b5] hover:text-[#fde047] flex flex-col items-center gap-1.5 transition-colors"
          >
            <Zap className="w-4 h-4 text-[#dfa86c]" />
            <span className="font-fantasy font-bold uppercase tracking-wider">Notificação</span>
            <span className="text-[10px] text-[#a39171]">Ping Harmônico</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.levelUp();
              soundService.playLevelUp();
            }}
            className="p-3 rounded-none bg-[#040814]/90 border border-[#966422]/50 hover:border-[#dfa86c] hover:bg-[#081329] text-[#e8d5b5] hover:text-[#fde047] flex flex-col items-center gap-1.5 transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4 text-[#dfa86c]" />
            <span className="font-fantasy font-bold uppercase tracking-wider">Level Up</span>
            <span className="text-[10px] text-[#a39171]">Arpeggio C5-E6</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.success();
              soundService.playSkillAcquired();
            }}
            className="p-3 rounded-none bg-[#040814]/90 border border-[#966422]/50 hover:border-[#dfa86c] hover:bg-[#081329] text-[#e8d5b5] hover:text-[#fde047] flex flex-col items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#dfa86c]" />
            <span className="font-fantasy font-bold uppercase tracking-wider">Habilidade</span>
            <span className="text-[10px] text-[#a39171]">Chime A4-A5</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.skillEvolved();
              soundService.playSkillEvolved();
            }}
            className="p-3 rounded-none bg-[#040814]/90 border border-[#fde047]/45 hover:border-[#fde047] hover:bg-[#1c1308] text-[#fde047] flex flex-col items-center gap-1.5 transition-colors"
          >
            <Award className="w-4 h-4 text-[#fde047]" />
            <span className="font-fantasy font-bold uppercase tracking-wider">Evolução</span>
            <span className="text-[10px] text-[#dfa86c]">Burst E4-E6</span>
          </button>
        </div>
      </SystemPanel>
    </div>
  );
};
