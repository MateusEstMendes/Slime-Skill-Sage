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
    ? "border-[#fde047]/90 shadow-[0_0_65px_rgba(253,224,71,0.38)]"
    : "border-[#dfa86c]/85 shadow-[0_0_55px_rgba(223,168,108,0.28)]";

  const glowBg = isGold
    ? "bg-gradient-to-b from-[#261a08]/95 via-[#060e20]/95 to-[#040814]"
    : "bg-gradient-to-b from-[#0a1836]/95 via-[#060e20]/95 to-[#040814]";

  const accentText = isGold ? "text-[#fde047]" : "text-[#dfa86c]";
  const badgeBg = isGold
    ? "bg-[#261a08]/90 border-[#fde047]/65 text-[#fde047]"
    : "bg-[#140f08]/90 border-[#dfa86c]/60 text-[#f3e5cc]";

  const handleDismiss = () => {
    worldVoiceService.dismissCurrent();
  };

  const handleReplayTts = () => {
    void worldVoiceService.replayCurrentSpeech();
  };

  const renderIcon = () => {
    if (item.type === "LEVEL_UP") {
      return <ArrowUpCircle className={`w-12 h-12 ${accentText} animate-pulse relative z-10`} />;
    }
    if (item.type === "SKILL_EVOLVED_EXTRA") {
      return <Award className={`w-12 h-12 ${accentText} animate-pulse relative z-10`} />;
    }
    return <Sparkles className={`w-12 h-12 ${accentText} animate-pulse relative z-10`} />;
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
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full blur-[95px] opacity-30 ${
              isGold ? "bg-[#fde047]" : "bg-[#dfa86c]"
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
                opacity: [0.2, 0.85, 0.2],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2.5 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute top-1/2 left-1/2 w-2 h-2 rotate-45 ${
                isGold ? "bg-[#fde047]" : "bg-[#dfa86c]"
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
          className={`relative w-full max-w-lg border-2 rounded-none p-6 md:p-8 flex flex-col items-center text-center ${borderColor} ${glowBg} z-10 overflow-hidden`}
        >
          {/* Inner gilded frame */}
          <div className="absolute inset-[5px] border border-[#dfa86c]/30 pointer-events-none" />

          {/* Corner Diamonds */}
          <div className="absolute top-1.5 left-1.5 w-2 h-2 rotate-45 bg-[#fde047] shadow-[0_0_8px_rgba(253,224,71,0.9)] pointer-events-none" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rotate-45 bg-[#fde047] shadow-[0_0_8px_rgba(253,224,71,0.9)] pointer-events-none" />
          <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rotate-45 bg-[#fde047] shadow-[0_0_8px_rgba(253,224,71,0.9)] pointer-events-none" />
          <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rotate-45 bg-[#fde047] shadow-[0_0_8px_rgba(253,224,71,0.9)] pointer-events-none" />

          {/* Top Decorative Header Badge */}
          <div className="relative z-10 flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] md:text-xs font-fantasy font-bold tracking-widest uppercase px-3.5 py-1 border ${badgeBg} flex items-center gap-1.5 shadow-sm`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{item.subtitle}</span>
            </span>
            {queueCount > 0 && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#040814] border border-[#966422]/60 text-[#e8d5b5]">
                +{queueCount} em fila
              </span>
            )}
          </div>

          {/* Central System Icon with Esoteric Magic Circle Medallion */}
          <div className="relative my-3 w-24 h-24 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full text-[#dfa86c]/45 animate-[spin_24s_linear_infinite] pointer-events-none"
            >
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#fde047" strokeOpacity="0.4" strokeWidth="0.75" />
              <polygon points="50,8 86,71 14,71" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <polygon points="50,92 86,29 14,29" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </svg>
            <div className="p-4 rounded-full bg-[#040814]/90 border border-[#dfa86c]/60 shadow-[0_0_20px_rgba(223,168,108,0.25)]">
              {renderIcon()}
            </div>
          </div>

          {/* Main Title */}
          <h2 className="relative z-10 text-xl md:text-2xl font-black font-fantasy tracking-wider uppercase text-[#f8ecd5] mt-1 drop-shadow-[0_2px_8px_rgba(223,168,108,0.45)]">
            {item.title}
          </h2>

          {/* Canonical Narration / Description */}
          <div className="relative z-10 my-4 p-4 rounded-none bg-[#040814]/90 border border-[#c89b55]/45 text-left font-mono text-xs md:text-sm text-[#e8d5b5] leading-relaxed space-y-2 w-full">
            <p className="border-l-2 pl-3 border-[#fde047] italic text-[#f8ecd5]">
              &ldquo;{item.spokenText}&rdquo;
            </p>
            <p className="text-xs text-[#c5b08f] font-sans pt-1">
              {item.description}
            </p>
          </div>

          {/* Actions Bar */}
          <div className="relative z-10 flex items-center gap-3 w-full justify-between mt-2 pt-3 border-t border-[#966422]/45">
            <button
              type="button"
              onClick={handleReplayTts}
              aria-label="Repetir narração da Voz do Mundo"
              className="p-2.5 rounded-none bg-[#081329]/90 hover:bg-[#101f42] border border-[#c89b55]/50 text-[#e8d5b5] hover:text-[#fde047] transition-colors flex items-center gap-1.5 text-xs font-fantasy tracking-wider uppercase"
              title="Ouvir novamente"
            >
              <Volume2 className="w-4 h-4 text-[#dfa86c]" />
              <span className="hidden sm:inline">Repetir Voz</span>
            </button>

            <SystemButton
              variant="cyan-glow"
              size="md"
              onClick={handleDismiss}
              className="flex-1 sm:flex-initial sm:min-w-[160px]"
            >
              {queueCount > 0 ? "Próximo Anúncio" : "Confirmar"}
            </SystemButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
