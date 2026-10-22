import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldAlert, Award, Flame, X, Zap } from "lucide-react";
import type { Skill, SkillTier } from "@slime-sage/shared";
import { gameService } from "../../services/gameService";
import { GildedCorners } from "./GildedCorners";
import { SystemButton } from "./SystemButton";
import { SystemInput } from "./SystemFormControls";
import { hapticFeedback, triggerHaptic } from "../../services/haptics";

export interface RouletteModalProps {
  isOpen: boolean;
  skill: Skill | null;
  onClose: () => void;
  onSuccess?: (evolvedSkill: Skill) => void;
}

// 12 Runas Canônicas Elder Futhark talhadas na circunferência
const RUNIC_INSCRIPTIONS = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ"];

// Número de pinos perimetrais metálicos
const PEG_COUNT = 24;

export const RouletteModal: React.FC<RouletteModalProps> = ({
  isOpen,
  skill,
  onClose,
  onSuccess,
}) => {
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    targetTier: SkillTier | null;
    currentChance: number;
    isInCooldown: boolean;
    cooldownRemainingMs: number;
    missingMastery: number;
    missingProjects: number;
    reason?: string;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinRotation, setSpinRotation] = useState<number>(0);
  const [flapperAngle, setFlapperAngle] = useState<number>(0);
  const [climaxFlash, setClimaxFlash] = useState<"gold" | "red" | null>(null);
  const [isNearMiss, setIsNearMiss] = useState<boolean>(false);

  const [spinResult, setSpinResult] = useState<{
    success: boolean;
    newTier: SkillTier;
    rolledValue: number;
    finalChance: number;
    cooldownUntil: string | null;
  } | null>(null);

  // Custom baptized name state
  const [customName, setCustomName] = useState<string>("");
  const [isSavingName, setIsSavingName] = useState<boolean>(false);

  // Audio Context for synthetic ticking & soundscapes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const loadEligibility = async () => {
    if (!skill) return;
    try {
      setLoading(true);
      const res = await gameService.getRouletteEligibility(skill.id);
      setEligibility(res);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && skill) {
      setSpinResult(null);
      setIsSpinning(false);
      setFlapperAngle(0);
      setClimaxFlash(null);
      setIsNearMiss(false);
      setCustomName("");
      clearAllTimeouts();
      void loadEligibility();
    }
    return () => {
      clearAllTimeouts();
    };
  }, [isOpen, skill]);

  // Retorna uma instância limpa de AudioContext com suporte a navegadores legados
  const getAudioContext = (): AudioContext | null => {
    try {
      if (typeof window === "undefined") return null;
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      return ctx;
    } catch {
      return null;
    }
  };

  // Som tátil de clique de catraca mecânica que varia em pitch e decaimento com a velocidade
  const playRatchetClick = (progress: number) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Começa mais rápido e agudo (850Hz) e desacelera para grave metálico (480Hz)
      const baseFreq = 850 - progress * 370 + (Math.random() * 40 - 20);

      // Oscilador de estalo mecânico
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = progress > 0.75 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.04);

      // Volume encorpa ligeiramente nos últimos cliques pesados
      const peakGain = 0.07 + progress * 0.04;
      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignora em ambientes sem áudio
    }
  };

  // Zumbido crescente de carga de mana (Riser) durante o giro da roda
  const startManaRiser = (): (() => void) => {
    const ctx = getAudioContext();
    if (!ctx) return () => {};

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 4.0);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 4.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.4);

      return () => {
        try {
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          osc.stop(ctx.currentTime + 0.05);
        } catch {
          // Já finalizado
        }
      };
    } catch {
      return () => {};
    }
  };

  // Fanfarra arpejada lídia para vitória ou dissipação abafada com near-miss
  const playFanfareSound = (success: boolean, nearMiss = false) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      if (success) {
        // Acorde Lídio Triunfal com harmônicos puros
        const notes = [440, 554.37, 659.25, 830.61, 880, 1108.73];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.09);

          const start = now + i * 0.09;
          gain.gain.setValueAtTime(0.14, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.7);
        });
      } else {
        // Se foi por um triz (near-miss), toca uma dissonância de arrepio
        const notes = nearMiss ? [340, 310, 270, 240] : [280, 260, 220];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + i * 0.12);

          const start = now + i * 0.12;
          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.5);
        });
      }
    } catch {
      // Ignore
    }
  };

  // Gera a linha do tempo procedural de cliques de pinos que desaceleram com a roda
  const generatePegTickTimestamps = (totalDurationMs: number): number[] => {
    const timestamps: number[] = [];
    let currentTime = 45;

    while (currentTime < totalDurationMs - 80) {
      timestamps.push(currentTime);
      const progress = currentTime / totalDurationMs;
      let stepInterval: number;

      if (progress < 0.35) {
        stepInterval = 35 + Math.random() * 8; // Rotação rápida uniforme
      } else if (progress < 0.65) {
        stepInterval = 40 + (progress - 0.35) * 220; // Começo da desaceleração
      } else if (progress < 0.85) {
        stepInterval = 106 + (progress - 0.65) * 650; // Desaceleração visível
      } else {
        stepInterval = 236 + (progress - 0.85) * 1900; // Últimos cliques dramáticos
      }
      currentTime += stepInterval;
    }

    return timestamps;
  };

  const handleSpin = async () => {
    if (!skill || isSpinning || !eligibility?.isEligible) return;

    try {
      setIsSpinning(true);
      setSpinResult(null);
      setClimaxFlash(null);
      setIsNearMiss(false);
      clearAllTimeouts();

      // Inicia a resposta no backend
      const result = await gameService.spinRoulette(skill.id);

      // Inicia o riser de mana crescente
      const stopRiser = startManaRiser();

      // Gera a linha do tempo dos cliques de catraca mecânica
      const spinDurationMs = 4500;
      const tickTimestamps = generatePegTickTimestamps(spinDurationMs);

      tickTimestamps.forEach((ts) => {
        const t = setTimeout(() => {
          const progress = ts / spinDurationMs;
          playRatchetClick(progress);

          // Efeito flapper: inclina o ponteiro e solta
          setFlapperAngle(16);
          const flapperReset = setTimeout(() => {
            setFlapperAngle(0);
          }, 35);
          timeoutsRef.current.push(flapperReset);

          // Micro-vibração nos últimos cliques decisivos
          if (progress > 0.82) {
            triggerHaptic(8);
          }
        }, ts);
        timeoutsRef.current.push(t);
      });

      // Cálculo do ângulo alvo com efeito "Near-Miss"
      const fullRounds = (6 + Math.floor(Math.random() * 2)) * 360;
      const chanceSlice = result.finalChance * 360;
      let finalSectorAngle = 0;
      let nearMissDetected = false;

      if (result.success) {
        // Sucesso: para com folga no setor de sucesso (entre 8° e chanceSlice - 8°)
        const safeMargin = Math.min(10, chanceSlice * 0.15);
        finalSectorAngle = 360 - (safeMargin + Math.random() * (chanceSlice - safeMargin * 2));
      } else {
        // Falha: com 70% de chance, simula o efeito "near-miss" (para bem próximo da borda da fatia dourada!)
        const rollNearMiss = Math.random() < 0.7;
        if (rollNearMiss) {
          nearMissDetected = true;
          // Para de 3° a 14° logo após a borda da fatia de sucesso
          const overshoot = 4 + Math.random() * 10;
          finalSectorAngle = 360 - (chanceSlice + overshoot);
        } else {
          finalSectorAngle = 360 - (chanceSlice + Math.random() * (350 - chanceSlice));
        }
      }

      setIsNearMiss(nearMissDetected);
      const totalTargetRotation = spinRotation + fullRounds + finalSectorAngle;
      setSpinRotation(totalTargetRotation);

      // Clímax e resolução após os 4.5 segundos
      const climaxTimeout = setTimeout(() => {
        stopRiser();
        setIsSpinning(false);
        setFlapperAngle(0);

        setSpinResult({
          success: result.success,
          newTier: result.newTier,
          rolledValue: result.rolledValue,
          finalChance: result.finalChance,
          cooldownUntil: result.cooldownUntil,
        });

        // Flash de impacto dramático
        setClimaxFlash(result.success ? "gold" : "red");
        const flashTimeout = setTimeout(() => {
          setClimaxFlash(null);
        }, 500);
        timeoutsRef.current.push(flashTimeout);

        if (result.success) {
          playFanfareSound(true);
          hapticFeedback.skillEvolved();
          setCustomName(skill.name);
        } else {
          playFanfareSound(false, nearMissDetected);
          hapticFeedback.warning();
        }
      }, spinDurationMs);

      timeoutsRef.current.push(climaxTimeout);
    } catch (err) {
      setIsSpinning(false);
      alert(err instanceof Error ? err.message : "Erro ao girar a Roleta.");
    }
  };

  const handleConfirmEvolution = async () => {
    if (!skill || !spinResult?.success) return;
    try {
      setIsSavingName(true);
      if (customName.trim() && customName.trim() !== skill.name) {
        await gameService.createSkill({
          name: customName.trim(),
          areaId: skill.area_id,
          description: skill.description,
        });
      }
      onSuccess?.({ ...skill, tier: spinResult.newTier, name: customName.trim() || skill.name });
      onClose();
    } catch {
      onClose();
    } finally {
      setIsSavingName(false);
    }
  };

  if (!isOpen || !skill) return null;

  const chancePercent = eligibility ? Math.round(eligibility.currentChance * 100) : 20;
  const failurePity = eligibility ? Math.max(0, Math.round((eligibility.currentChance - 0.2) * 100)) : 0;

  return (
    <div
      data-testid="roulette-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      {/* Flash de Clímax na Parada */}
      <AnimatePresence>
        {climaxFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className={`pointer-events-none fixed inset-0 z-50 ${
              climaxFlash === "gold"
                ? "bg-[#fde047]/30 shadow-[inset_0_0_100px_rgba(253,224,71,0.5)]"
                : "bg-red-500/20 shadow-[inset_0_0_100px_rgba(239,68,68,0.4)]"
            }`}
          />
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-lg bg-[#040814] border-2 border-[#dfa86c]/70 rounded-none shadow-[0_0_50px_rgba(223,168,108,0.35)] p-5 md:p-6 overflow-hidden">
        <GildedCorners size="md" color="#dfa86c" diamondColor="#fde047" glow={true} withRunes={true} />

        {/* Close button */}
        {!isSpinning && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 z-20 text-[#c5b08f] hover:text-[#fde047] p-1.5 transition-colors border border-transparent hover:border-[#dfa86c]/40"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-1 relative z-10 mb-3">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#fde047] uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-[#dfa86c]" />
            <span>LEIS DA TRANSMUTAÇÃO ARCANA</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase">
            ROLETA ESOTÉRICA // {skill.name}
          </h2>
          <p className="text-xs text-[#c5b08f] font-mono">
            Grau Atual: <span className="text-[#dfa86c] uppercase font-bold">{skill.tier}</span> · Destino:{" "}
            <span className="text-purple-400 uppercase font-bold">{eligibility?.targetTier ?? "Superior"}</span>
          </p>
        </div>

        {/* Roulette Wheel Graphics Container */}
        <div className="relative z-10 flex flex-col items-center justify-center my-3">
          {/* Partículas de Brasas/Mana durante o Giro */}
          {isSpinning && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible">
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 110 + (i % 3) * 15;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;

                return (
                  <motion.div
                    key={`spark-${i}`}
                    initial={{ opacity: 0.9, scale: 0.6, x: 0, y: 0 }}
                    animate={{
                      opacity: [0.9, 1, 0],
                      scale: [0.6, 1.4, 0.2],
                      x: [0, tx],
                      y: [0, ty],
                    }}
                    transition={{
                      duration: 0.9 + (i % 4) * 0.2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: (i * 0.08) % 0.6,
                    }}
                    className={`absolute w-1.5 h-1.5 rounded-full ${
                      i % 2 === 0
                        ? "bg-[#fde047] shadow-[0_0_8px_#fde047]"
                        : "bg-[#dfa86c] shadow-[0_0_8px_#dfa86c]"
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* Top Pointer com Efeito Flapper Articulado */}
          <div
            data-testid="roulette-pointer"
            className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none"
          >
            <motion.div
              animate={{ rotate: flapperAngle }}
              transition={{ type: "spring", stiffness: 850, damping: 20 }}
              style={{ transformOrigin: "top center" }}
              className="flex flex-col items-center"
            >
              {/* Ponta da Agulha Dourada com Chanfro */}
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-[#fde047] filter drop-shadow-[0_0_8px_#fde047]" />
              {/* Pivô Mecânico Central do Flapper */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#dfa86c] -mt-1.5 border border-[#5a3d0f] shadow-[0_0_8px_#fde047] flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#fde047]" />
              </div>
            </motion.div>
          </div>

          {/* Concentric Rotating SVG Wheel */}
          <div className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center">
            {/* Halo de Mana Circunferencial */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
                isSpinning
                  ? "shadow-[0_0_40px_rgba(253,224,71,0.45)] ring-2 ring-[#fde047]/40"
                  : "shadow-[0_0_20px_rgba(223,168,108,0.2)]"
              }`}
            />

            <motion.div
              data-testid="roulette-wheel"
              className="w-full h-full"
              animate={{ rotate: spinRotation }}
              transition={{
                duration: 4.5,
                ease: [0.08, 0.85, 0.18, 1],
              }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(223,168,108,0.25)]">
                <defs>
                  {/* Gradiente Dourado da Fatia Sagrada */}
                  <linearGradient id="rouletteGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#dfa86c" stopOpacity="0.88" />
                    <stop offset="100%" stopColor="#966422" stopOpacity="0.75" />
                  </linearGradient>

                  {/* Gradiente de relevo dos pinos metálicos */}
                  <radialGradient id="pegGoldGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#fff8db" />
                    <stop offset="40%" stopColor="#fde047" />
                    <stop offset="85%" stopColor="#966422" />
                    <stop offset="100%" stopColor="#452705" />
                  </radialGradient>

                  {/* Gradiente do Núcleo Arcano Central */}
                  <radialGradient id="coreArcaneGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2b1a4a" />
                    <stop offset="60%" stopColor="#0a0f24" />
                    <stop offset="100%" stopColor="#040814" />
                  </radialGradient>

                  {/* Sombra dos Pinos */}
                  <filter id="pegShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodColor="#000" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Disco base obsidiana mineral */}
                <circle cx="100" cy="100" r="95" fill="#060e20" stroke="#966422" strokeWidth="2.5" />
                <circle cx="100" cy="100" r="88" fill="none" stroke="#dfa86c" strokeWidth="1" strokeDasharray="3 4" />

                {/* Setor de Sucesso (Fatia Dourada) */}
                {(() => {
                  const angle = (chancePercent / 100) * 360;
                  const rad = (angle - 90) * (Math.PI / 180);
                  const x = 100 + 85 * Math.cos(rad);
                  const y = 100 + 85 * Math.sin(rad);
                  const largeArc = angle > 180 ? 1 : 0;
                  const path = `M 100 100 L 100 15 A 85 85 0 ${largeArc} 1 ${x} ${y} Z`;

                  return (
                    <path
                      d={path}
                      fill="url(#rouletteGoldGrad)"
                      stroke="#fde047"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />
                  );
                })()}

                {/* 12 Runas Elder Futhark talhadas na circunferência */}
                {RUNIC_INSCRIPTIONS.map((rune, idx) => {
                  const runeAngleDeg = idx * 30;
                  const runeRad = (runeAngleDeg - 90) * (Math.PI / 180);
                  const rx = 100 + 78 * Math.cos(runeRad);
                  const ry = 100 + 78 * Math.sin(runeRad);

                  return (
                    <text
                      key={`rune-${idx}`}
                      x={rx}
                      y={ry}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#dfa86c"
                      opacity="0.8"
                      fontSize="8"
                      fontFamily="Cinzel, serif"
                      transform={`rotate(${runeAngleDeg}, ${rx}, ${ry})`}
                    >
                      {rune}
                    </text>
                  );
                })}

                {/* 24 Pinos Metálicos Perimetrais (Brass/Gold Pegs) */}
                {[...Array(PEG_COUNT)].map((_, idx) => {
                  const pegAngleDeg = idx * (360 / PEG_COUNT);
                  const pegRad = (pegAngleDeg - 90) * (Math.PI / 180);
                  const px = 100 + 90 * Math.cos(pegRad);
                  const py = 100 + 90 * Math.sin(pegRad);

                  return (
                    <circle
                      key={`peg-${idx}`}
                      cx={px}
                      cy={py}
                      r="2.2"
                      fill="url(#pegGoldGrad)"
                      stroke="#452705"
                      strokeWidth="0.6"
                      filter="url(#pegShadow)"
                    />
                  );
                })}

                {/* Núcleo Arcano Central Reativo */}
                <circle cx="100" cy="100" r="42" fill="url(#coreArcaneGrad)" stroke="#dfa86c" strokeWidth="2" />
                <circle cx="100" cy="100" r="32" fill="#040814" stroke="#966422" strokeWidth="1.2" strokeDasharray="2 3" />

                {/* Sigilo e percentual central */}
                <text
                  x="100"
                  y="104"
                  textAnchor="middle"
                  fill="#fde047"
                  fontSize="13"
                  fontFamily="Cinzel, serif"
                  fontWeight="bold"
                >
                  ✦ {chancePercent}% ✦
                </text>
              </svg>
            </motion.div>
          </div>

          {/* Chance breakdown tags */}
          <div className="flex items-center gap-2 mt-4 text-xs font-mono">
            <span className="px-2 py-0.5 border border-[#dfa86c]/60 bg-[#261a08] text-[#fde047]">
              Base: 20%
            </span>
            {failurePity > 0 && (
              <span className="px-2 py-0.5 border border-purple-500/60 bg-purple-950/60 text-purple-300">
                Pity (+{failurePity}%)
              </span>
            )}
            <span className="px-2 py-0.5 border border-[#fde047] bg-[#040814] text-[#fde047] font-bold">
              Total: {chancePercent}%
            </span>
          </div>
        </div>

        {/* State Banners / Results */}
        <AnimatePresence mode="wait">
          {spinResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`p-4 border my-3 space-y-3 font-mono text-xs ${
                spinResult.success
                  ? "bg-[#261a08]/95 border-[#fde047] text-[#f8ecd5] shadow-[0_0_25px_rgba(253,224,71,0.25)]"
                  : "bg-red-950/40 border-red-500/50 text-red-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold font-fantasy text-sm uppercase">
                {spinResult.success ? (
                  <>
                    <Award className="w-5 h-5 text-[#fde047]" />
                    <span className="text-[#fde047]">Transmutação Sagrada Concluída!</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">
                      A Mana Não Convergiu · Repouso de 48h
                    </span>
                  </>
                )}
              </div>

              {spinResult.success ? (
                <div className="space-y-3">
                  <p className="text-[#c5b08f] font-sans">
                    A Grande Sábio confirma o despertar do grau{" "}
                    <strong className="text-purple-300 uppercase">{spinResult.newTier}</strong>. Você pode consagrar um
                    novo nome para a habilidade despertada:
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#dfa86c] uppercase font-fantasy">Nome Consagrado:</label>
                    <SystemInput
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Nome da habilidade superior..."
                    />
                  </div>
                  <SystemButton
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={handleConfirmEvolution}
                    disabled={isSavingName}
                  >
                    Confirmar e Consagrar Despertar
                  </SystemButton>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-200 font-sans text-xs">
                    {isNearMiss && (
                      <span className="block text-amber-300 font-bold mb-1">
                        ⚡ Por um triz! O ponteiro quase estancou no setor da glória.
                      </span>
                    )}
                    Sua maestria permanece <strong>100% intacta ({skill.mastery} pts)</strong>. Como salvaguarda de alma,
                    esta habilidade repousará por 48 horas antes da próxima tentativa. Seu bônus de piedade aumentou (+10%).
                  </p>
                  <SystemButton variant="secondary" size="sm" className="w-full" onClick={onClose}>
                    Aceitar Decreto e Fechar
                  </SystemButton>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-spin Eligibility Warnings */}
        {!spinResult && eligibility && !eligibility.isEligible && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-mono my-3 space-y-1">
            <div className="flex items-center gap-1.5 font-bold font-fantasy text-red-300">
              <ShieldAlert className="w-4 h-4" />
              <span>REQUISITOS NÃO CUMPRIDOS</span>
            </div>
            <p className="font-sans text-[11px]">{eligibility.reason}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!spinResult && (
          <div className="relative z-10 pt-3 border-t border-[#966422]/40 flex justify-between gap-3">
            <SystemButton variant="ghost" size="sm" onClick={onClose} disabled={isSpinning}>
              Cancelar
            </SystemButton>

            <SystemButton
              variant="primary"
              size="sm"
              onClick={handleSpin}
              disabled={isSpinning || loading || !eligibility?.isEligible}
              icon={isSpinning ? <Zap className="w-4 h-4 text-[#fde047] animate-spin" /> : <Flame className="w-4 h-4 text-[#fde047]" />}
            >
              {isSpinning ? "Girando a Roda..." : `Invocar Transmutação (${chancePercent}%)`}
            </SystemButton>
          </div>
        )}
      </div>
    </div>
  );
};
