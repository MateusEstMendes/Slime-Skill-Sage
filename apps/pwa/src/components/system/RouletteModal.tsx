import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldAlert, Award, Flame, X } from "lucide-react";
import type { Skill, SkillTier } from "@slime-sage/shared";
import { gameService } from "../../services/gameService";
import { GildedCorners } from "./GildedCorners";
import { SystemButton } from "./SystemButton";
import { SystemInput } from "./SystemFormControls";
import { hapticFeedback } from "../../services/haptics";

export interface RouletteModalProps {
  isOpen: boolean;
  skill: Skill | null;
  onClose: () => void;
  onSuccess?: (evolvedSkill: Skill) => void;
}

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

  // Audio Context for synthetic ticking
  const audioCtxRef = useRef<AudioContext | null>(null);

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
      setCustomName("");
      void loadEligibility();
    }
  }, [isOpen, skill]);

  const playTickSound = (freq = 600) => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore AudioContext errors in headless env
    }
  };

  const playFanfareSound = (success: boolean) => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();

      if (success) {
        // Major chord arpeggio
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.5);
        });
      } else {
        // Minor dim chord
        [280, 260, 220].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
      }
    } catch {
      // Ignore
    }
  };

  const handleSpin = async () => {
    if (!skill || isSpinning || !eligibility?.isEligible) return;

    try {
      setIsSpinning(true);
      setSpinResult(null);

      // Trigger spin in gameService
      const result = await gameService.spinRoulette(skill.id);

      // Play tick loop
      const tickInterval = setInterval(() => {
        playTickSound(Math.random() > 0.5 ? 750 : 600);
      }, 140);

      // Calculate target rotation degrees
      // Full 5 to 7 rounds + offset sector
      const fullRounds = (5 + Math.floor(Math.random() * 3)) * 360;
      // Success sector is top slice [0, chance * 360]
      const chanceSlice = result.finalChance * 360;
      let finalSectorAngle = 0;
      if (result.success) {
        finalSectorAngle = 360 - (Math.random() * (chanceSlice * 0.8) + 5);
      } else {
        finalSectorAngle = 360 - (chanceSlice + Math.random() * (350 - chanceSlice));
      }

      const totalTargetRotation = spinRotation + fullRounds + finalSectorAngle;
      setSpinRotation(totalTargetRotation);

      setTimeout(() => {
        clearInterval(tickInterval);
        setIsSpinning(false);
        setSpinResult({
          success: result.success,
          newTier: result.newTier,
          rolledValue: result.rolledValue,
          finalChance: result.finalChance,
          cooldownUntil: result.cooldownUntil,
        });

        if (result.success) {
          playFanfareSound(true);
          hapticFeedback.skillEvolved();
          setCustomName(skill.name);
        } else {
          playFanfareSound(false);
          hapticFeedback.warning();
        }
      }, 4500);
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
      <div className="relative w-full max-w-lg bg-[#040814] border-2 border-[#dfa86c]/70 rounded-none shadow-[0_0_50px_rgba(223,168,108,0.35)] p-5 md:p-6 overflow-hidden">
        <GildedCorners size="md" color="#dfa86c" diamondColor="#fde047" glow={true} withRunes={true} />

        {/* Close button */}
        {!isSpinning && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-[#c5b08f] hover:text-[#fde047] p-1.5 transition-colors border border-transparent hover:border-[#dfa86c]/40"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-1 relative z-10 mb-4">
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
        <div className="relative z-10 flex flex-col items-center justify-center my-4">
          {/* Top Pointer */}
          <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-[#fde047] filter drop-shadow-[0_0_6px_#fde047]" />
            <div className="w-2 h-2 rounded-full bg-[#dfa86c] -mt-1 shadow-[0_0_8px_#fde047]" />
          </div>

          {/* Concentric Rotating SVG Wheel */}
          <div className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center">
            <motion.div
              data-testid="roulette-wheel"
              className="w-full h-full"
              animate={{ rotate: spinRotation }}
              transition={{
                duration: 4.5,
                ease: [0.15, 0.9, 0.2, 1],
              }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(223,168,108,0.25)]">
                {/* Outer runic border ring */}
                <circle cx="100" cy="100" r="95" fill="#060e20" stroke="#966422" strokeWidth="2.5" />
                <circle cx="100" cy="100" r="88" fill="none" stroke="#dfa86c" strokeWidth="1" strokeDasharray="3 4" />

                {/* Success Sector Slice */}
                {/* SVG Arc for the success chance slice (0 to chancePercent%) */}
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
                      opacity="0.85"
                    />
                  );
                })()}

                {/* Gradients */}
                <defs>
                  <linearGradient id="rouletteGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#dfa86c" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#966422" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Inner decorative circle */}
                <circle cx="100" cy="100" r="40" fill="#040814" stroke="#dfa86c" strokeWidth="2" />
                <circle cx="100" cy="100" r="30" fill="#060e20" stroke="#966422" strokeWidth="1" />

                {/* Center sigil */}
                <text
                  x="100"
                  y="105"
                  textAnchor="middle"
                  fill="#fde047"
                  fontSize="14"
                  fontFamily="Cinzel"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 border my-3 space-y-3 font-mono text-xs ${
                spinResult.success
                  ? "bg-[#261a08]/95 border-[#fde047] text-[#f8ecd5]"
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
                    <span className="text-red-400">A Mana Não Convergiu · Repouso de 48h</span>
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
              icon={<Flame className="w-4 h-4 text-[#fde047]" />}
            >
              {isSpinning ? "Girando a Roda..." : `Invocar Transmutação (${chancePercent}%)`}
            </SystemButton>
          </div>
        )}
      </div>
    </div>
  );
};
