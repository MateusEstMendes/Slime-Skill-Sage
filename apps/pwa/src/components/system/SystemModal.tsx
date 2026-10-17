import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { hapticFeedback } from "../../services/haptics";

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
            className={`relative w-full ${maxWidthClasses} bg-[#070d1e] border border-cyan-400/50 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.25)] p-5 md:p-6 z-10 text-slate-100 max-h-[90vh] flex flex-col`}
          >
            {/* System Corner Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-cyan-500/20 pb-4 shrink-0 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon && (
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                    [ INTERFACE DO SISTEMA ]
                  </div>
                  <h3 className="text-lg md:text-xl font-bold font-mono text-white tracking-wide break-words [overflow-wrap:anywhere]">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5 break-words [overflow-wrap:anywhere]">{subtitle}</p>
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 overflow-y-auto pr-1 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
