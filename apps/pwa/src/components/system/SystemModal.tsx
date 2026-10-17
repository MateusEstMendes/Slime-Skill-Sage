import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { hapticFeedback } from "../../services/haptics";
import { GildedCorners } from "./GildedCorners";

export interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = "md",
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${maxWidthClasses} bg-[#060e20]/95 border border-[#c89b55]/75 rounded-none shadow-[0_0_45px_rgba(223,168,108,0.28)] p-5 md:p-6 z-10 text-[#f3e5cc] max-h-[90vh] flex flex-col`}
          >
            {/* Dark Fantasy Gilded Corners, Inscriptions & Inner Hairline Frame */}
            <GildedCorners
              size="lg"
              glow
              withCenterNotches
              withRunes
              runicTop="✦ ᛋ ᚨ ᚲ ᚱ ᛖ ᛞ · ᛟ ᚱ ᛞ ᛖ ᚱ ✦"
              runicBottom="ᛋ ᛁ ᛋ ᛏ ᛖ ᛗ ᚨ"
            />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4 border-b border-[#966422]/45 pb-4 shrink-0 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon && (
                  <div className="p-2 bg-[#0b1630]/80 border border-[#c89b55]/55 text-[#dfa86c] shrink-0 shadow-[0_0_12px_rgba(223,168,108,0.18)]">
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-fantasy tracking-[0.22em] text-[#dfa86c] uppercase flex items-center gap-1.5">
                    <span className="inline-block w-1 h-1 rotate-45 bg-[#fde047]" />
                    <span>[ DECRETO DO SISTEMA ]</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase break-words [overflow-wrap:anywhere] mt-0.5">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-[#c5b08f] font-mono mt-0.5 break-words [overflow-wrap:anywhere]">{subtitle}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback.tap();
                  onClose();
                }}
                aria-label="Fechar Modal"
                className="p-1.5 text-[#c5b08f] hover:text-[#fde047] hover:bg-[#101f42]/80 border border-transparent hover:border-[#c89b55]/45 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="relative z-10 mt-4 overflow-y-auto pr-1 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
