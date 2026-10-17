import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  ArrowUpCircle,
  Award,
  Zap,
  Activity,
  RotateCcw,
  Sliders,
  Radio,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { SystemPanel } from "../system/SystemPanel";
import { SystemButton } from "../system/SystemButton";
import { SystemBadge } from "../system/SystemBadge";
import { OFFICIAL_VOICE_CLIPS, type VoiceClip } from "../../services/voiceCatalog";
import { ttsService } from "../../services/ttsService";
import { soundService } from "../../services/soundService";
import { worldVoiceService } from "../../services/worldVoiceService";
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

  // Load TTS voices
  useEffect(() => {
    const supported = ttsService.isSupported();
    setTtsSupported(supported);
    if (supported) {
      void ttsService.getAvailableVoices().then((voices) => {
        setTtsVoices(voices);
        const defaultPt = ttsService.selectPtBrVoice(voices);
        if (defaultPt) {
          setSelectedTtsVoice(defaultPt.name);
        }
      });
    }
  }, []);

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
        <div className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-center gap-2">
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
              label="9 VOZES OFICIAIS"
              className="border-cyan-500/60 text-cyan-300 bg-cyan-950/40 font-bold"
            />
          </div>
        }
      >
        <div className="text-xs text-slate-300 leading-relaxed font-mono">
          Este módulo permite testar a biblioteca canônica de voz oficial da{" "}
          <span className="text-cyan-300 font-bold">Voz do Mundo (voz neural Kore)</span> em formato{" "}
          <code className="text-amber-300">.mp3</code>, além do motor de síntese offline (Web Speech API) da{" "}
          <span className="text-cyan-300 font-bold">Grande Sábio</span> e os anúncios dramáticos em tela cheia.
        </div>
      </SystemPanel>

      {/* SECTION 1: OFFICIAL MP3 VOICES */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
              Áudios Oficiais da Voz do Mundo (.mp3)
            </h3>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg border transition-colors ${
                  selectedCategory === cat
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
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

            let borderStyle = "border-cyan-500/30 hover:border-cyan-400/70";
            let activeBg = "bg-[#0b1329]";
            if (isGold) {
              borderStyle = "border-amber-500/30 hover:border-amber-400/70";
            } else if (isPurple) {
              borderStyle = "border-purple-500/30 hover:border-purple-400/70";
            }

            if (isPlaying) {
              activeBg = isGold ? "bg-amber-950/30 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]" : "bg-cyan-950/30 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]";
            }

            return (
              <div
                key={clip.id}
                className={`relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between overflow-hidden ${borderStyle} ${activeBg}`}
              >
                {/* Progress Bar background for active playing clip */}
                {isPlaying && (
                  <div
                    className={`absolute bottom-0 left-0 top-0 opacity-15 pointer-events-none transition-all duration-100 ${
                      isGold ? "bg-amber-400" : "bg-cyan-400"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                )}

                <div className="space-y-2 z-10">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        isGold
                          ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                          : isPurple
                            ? "bg-purple-950/80 border-purple-500/50 text-purple-300"
                            : "bg-cyan-950/80 border-cyan-500/50 text-cyan-300"
                      }`}
                    >
                      {clip.badge}
                    </span>

                    <span className="text-[10px] font-mono text-slate-500">
                      {clip.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-mono font-bold text-sm text-white">
                      {clip.title}
                    </h4>
                    <p className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
                      {clip.subtitle}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono text-slate-300 italic">
                    &ldquo;{clip.transcript}&rdquo;
                  </div>
                </div>

                {/* Card Play Controls */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 z-10">
                  <span className="text-[10px] font-mono text-slate-500 truncate">
                    {clip.url.split("/").pop()}
                  </span>

                  <button
                    onClick={() => handlePlayClip(clip)}
                    data-testid={`play-btn-${clip.id}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                      isPlaying
                        ? "bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.7)] scale-105"
                        : "bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-300"
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
          <p className="text-xs font-mono text-slate-300">
            Clique para testar o modal dramático que surge para o caçador durante conquistas maiores:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={handleTriggerModalLevelUp}
              data-testid="trigger-modal-level-up"
              className="p-3.5 rounded-xl bg-[#09152b] border border-cyan-500/40 hover:border-cyan-300 hover:bg-cyan-950/40 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono font-bold text-xs text-white">Novo Nível (Level Up)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Tema Ciano // Partículas e calibração de status
              </span>
            </button>

            <button
              onClick={handleTriggerModalSkillAcquired}
              data-testid="trigger-modal-skill-acquired"
              className="p-3.5 rounded-xl bg-[#09152b] border border-cyan-500/40 hover:border-cyan-300 hover:bg-cyan-950/40 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono font-bold text-xs text-white">Habilidade Adquirida</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Tema Ciano // Registro na Árvore de Habilidades
              </span>
            </button>

            <button
              onClick={handleTriggerModalSkillEvolved}
              data-testid="trigger-modal-skill-evolved"
              className="p-3.5 rounded-xl bg-[#1c1606] border border-amber-500/40 hover:border-amber-300 hover:bg-amber-950/40 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono font-bold text-xs text-amber-300">Evolução de Habilidade</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400/70">
                Tema Ouro // Ascensão para Grau Extra com 100 de Maestria
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
          <div className="p-3.5 bg-amber-950/40 border border-amber-600/40 rounded-xl text-amber-300 text-xs font-mono">
            A Web Speech API (speechSynthesis) não está disponível no navegador atual.
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs">
            {/* Voice select */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-bold">
                Selecione a Voz Instalada no Navegador:
              </label>
              <select
                value={selectedTtsVoice}
                onChange={(e) => setSelectedTtsVoice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
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
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Velocidade de Fala (Rate):</span>
                  <span className="text-cyan-400 font-bold">{ttsRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={ttsRate}
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Tom da Voz (Pitch):</span>
                  <span className="text-cyan-400 font-bold">{ttsPitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={ttsPitch}
                  onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Custom Input & Presets */}
            <div className="space-y-2">
              <label className="text-slate-400 block font-bold">
                Texto para Fala da Grande Sábio:
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={2}
                placeholder="Digite uma mensagem para a Grande Sábio narrar..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">
                  Frases Rápidas:
                </span>
                {PRESET_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomText(phrase)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-slate-400 hover:text-cyan-300 transition-colors"
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
            className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-300 hover:text-cyan-300 flex flex-col items-center gap-1.5 transition-colors"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Notificação</span>
            <span className="text-[10px] text-slate-500">Ping Harmônico</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.levelUp();
              soundService.playLevelUp();
            }}
            className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-300 hover:text-cyan-300 flex flex-col items-center gap-1.5 transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Level Up</span>
            <span className="text-[10px] text-slate-500">Arpeggio C5-E6</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.success();
              soundService.playSkillAcquired();
            }}
            className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-300 hover:text-cyan-300 flex flex-col items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Habilidade</span>
            <span className="text-[10px] text-slate-500">Chime A4-A5</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.skillEvolved();
              soundService.playSkillEvolved();
            }}
            className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-300 hover:text-amber-300 flex flex-col items-center gap-1.5 transition-colors"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-bold">Evolução</span>
            <span className="text-[10px] text-amber-500/70">Burst E4-E6</span>
          </button>
        </div>
      </SystemPanel>
    </div>
  );
};
