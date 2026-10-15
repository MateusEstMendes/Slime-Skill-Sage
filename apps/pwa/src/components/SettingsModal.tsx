import React, { useState, useEffect } from "react";
import { Settings, X, Terminal, Cpu, Shield, Sparkles } from "lucide-react";
import { localDb } from "../services/db";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDevPanel: () => void;
}

const REQUIRED_CLICKS = 7;
const APP_VERSION = "v1.0.0-phase1";
const DEV_MODE_KEY = "dev_mode_unlocked";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenDevPanel,
}) => {
  const clickCountRef = React.useRef<number>(0);
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      void localDb.getKv<boolean>(DEV_MODE_KEY).then((unlocked) => {
        if (unlocked) {
          setIsDevUnlocked(true);
        }
      });
    }
  }, [isOpen]);

  const handleVersionClick = async () => {
    if (isDevUnlocked) {
      onOpenDevPanel();
      return;
    }

    clickCountRef.current += 1;
    const currentClicks = clickCountRef.current;
    const remaining = REQUIRED_CLICKS - currentClicks;

    if (remaining > 0 && remaining <= 4) {
      setToastMessage(
        `Você está a ${remaining} toque${remaining === 1 ? "" : "s"} do Painel Dev.`
      );
    } else if (remaining <= 0) {
      setIsDevUnlocked(true);
      await localDb.setKv(DEV_MODE_KEY, true);
      setToastMessage("Modo Desenvolvedor Ativado!");
      setTimeout(() => {
        setToastMessage("");
        onOpenDevPanel();
      }, 400);
      return;
    }

    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };


  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Ajustes do Sistema"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
    >
      <div className="bg-[#070c18] border border-cyan-500/30 rounded-2xl w-full max-w-md flex flex-col shadow-[0_0_40px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a1224] border-b border-cyan-500/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase">
                [CONFIGURAÇÃO DO SISTEMA]
              </span>
              <h2 className="text-base font-bold text-white">Ajustes</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar Ajustes"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status info */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Arquitetura:
              </span>
              <span className="text-slate-200">PWA Offline-First</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Protocolo:
              </span>
              <span className="text-emerald-400 font-bold">Ledger Imutável</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Voz da Sabedoria:
              </span>
              <span className="text-cyan-300">Grande Sábio (G.S)</span>
            </div>
          </div>

          {/* Dev Mode button if unlocked */}
          {isDevUnlocked && (
            <button
              onClick={onOpenDevPanel}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-950/40 border border-cyan-500/50 hover:bg-cyan-900/50 text-cyan-300 text-xs font-mono font-medium transition-colors shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Abrir Painel do Desenvolvedor</span>
            </button>
          )}

          {/* Feedback Toast */}
          {toastMessage && (
            <div
              role="status"
              className="p-2.5 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-center font-mono text-xs text-cyan-300 animate-pulse"
            >
              {toastMessage}
            </div>
          )}

          {/* Version with 7 clicks trigger */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-500 mb-1 font-mono">
              Slime Sage Skill (S.S.S)
            </p>
            <button
              type="button"
              data-testid="version-badge"
              onClick={handleVersionClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 font-mono text-xs transition-colors cursor-pointer select-none"
              title="Versão do Sistema"
            >
              <span>Versão</span>
              <span className="font-semibold text-cyan-400">{APP_VERSION}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
