import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUpCircle, Volume2, ShieldAlert, Award } from "lucide-react";
import { worldVoiceService, type WorldVoiceItem } from "../../services/worldVoiceService";
import { SystemButton } from "./SystemButton";

export const WorldVoiceModal: React.FC = () => {
  const [item, setItem] = useState<WorldVoiceItem | null>(null);
  const [queueCount, setQueueCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = worldVoiceService.subscribe((currentItem) => {
      setItem(currentItem);
      setQueueCount(worldVoiceService.getQueueLength());
    });
    return unsubscribe;
  }, []);

  if (!item) return null;

  const isGold = item.colorVariant === "gold";

  const borderColor = isGold
    ? "border-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.25)]"
    : "border-cyan-400/80 shadow-[0_0_50px_rgba(0,243,255,0.25)]";

  const glowBg = isGold
    ? "bg-gradient-to-b from-amber-950/70 via-[#0a0f1d]/95 to-[#050811]"
    : "bg-gradient-to-b from-cyan-950/70 via-[#0a0f1d]/95 to-[#050811]";

  const accentText = isGold ? "text-amber-400" : "text-cyan-400";
  const badgeBg = isGold ? "bg-amber-950/80 border-amber-500/50 text-amber-300" : "bg-cyan-950/80 border-cyan-500/50 text-cyan-300";

  const handleDismiss = () => {
    worldVoiceService.dismissCurrent();
  };

  const handleReplayTts = () => {
    void worldVoiceService.replayCurrentSpeech();
  };

  const renderIcon = () => {
    if (item.type === "LEVEL_UP") {
      return <ArrowUpCircle className={`w-12 h-12 ${accentText} animate-pulse`} />;
    }
    if (item.type === "SKILL_EVOLVED_EXTRA") {
      return <Award className={`w-12 h-12 ${accentText} animate-pulse`} />;
    }
    return <Sparkles className={`w-12 h-12 ${accentText} animate-pulse`} />;
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-label="Voz do Mundo"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
      >
        {/* Floating Particle Glow Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full blur-[90px] opacity-25 ${
              isGold ? "bg-amber-500" : "bg-cyan-500"
            }`}
          />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 300 - 150,
                y: Math.random() * 200 - 100,
                opacity: 0.2,
                scale: 0.5,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2.5 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${
                isGold ? "bg-amber-300" : "bg-cyan-300"
              }`}
            />
          ))}
        </div>

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`relative w-full max-w-lg border-2 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center ${borderColor} ${glowBg} z-10 overflow-hidden`}
        >
          {/* Top Decorative Header Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] md:text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${badgeBg} flex items-center gap-1.5 shadow-sm`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{item.subtitle}</span>
            </span>
            {queueCount > 0 && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                +{queueCount} em fila
              </span>
            )}
          </div>

          {/* Central System Icon */}
          <div className="my-3 p-4 rounded-2xl bg-black/40 border border-slate-800/80 shadow-inner">
            {renderIcon()}
          </div>

          {/* Main Title */}
          <h2 className="text-xl md:text-2xl font-black font-mono tracking-wider text-white mt-1 drop-shadow-md">
            {item.title}
          </h2>

          {/* Canonical Narration / Description */}
          <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left font-mono text-xs md:text-sm text-slate-300 leading-relaxed space-y-2 w-full">
            <p className="border-l-2 pl-3 border-cyan-400 italic text-slate-200">
              &ldquo;{item.spokenText}&rdquo;
            </p>
            <p className="text-xs text-slate-400 font-sans pt-1">
              {item.description}
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-3 w-full justify-between mt-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReplayTts}
              aria-label="Repetir narração da Voz do Mundo"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
              title="Ouvir novamente"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Repetir Voz</span>
            </button>

            <SystemButton
              variant="primary"
              size="md"
              onClick={handleDismiss}
              className={`flex-1 sm:flex-initial sm:min-w-[160px] ${
                isGold ? "!bg-amber-500 !text-slate-950 !border-amber-400 hover:!bg-amber-400" : ""
              }`}
            >
              {queueCount > 0 ? "Próximo Anúncio" : "Confirmar"}
            </SystemButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
