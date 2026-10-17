import React, { useState, useEffect } from "react";
import { Settings, X, Terminal, Cpu, Shield, Sparkles, Volume2, VolumeX } from "lucide-react";
import { localDb } from "../services/db";
import { worldVoiceService } from "../services/worldVoiceService";
import { GildedCorners } from "./system/GildedCorners";

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
  const [isNarrationEnabled, setIsNarrationEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      void localDb.getKv<boolean>(DEV_MODE_KEY).then((unlocked) => {
        if (unlocked) {
          setIsDevUnlocked(true);
        }
      });
      void worldVoiceService.isTtsEnabled().then((enabled) => {
        setIsNarrationEnabled(enabled);
      });
    }
  }, [isOpen]);

  const handleToggleNarration = async () => {
    const nextState = !isNarrationEnabled;
    setIsNarrationEnabled(nextState);
    await worldVoiceService.setTtsEnabled(nextState);
    setToastMessage(
      nextState ? "Narração por voz ativada." : "Narração por voz desativada."
    );
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

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
      <div className="relative bg-[#060e20]/95 border border-[#c89b55]/75 rounded-none w-full max-w-md flex flex-col shadow-[0_0_45px_rgba(223,168,108,0.22)] overflow-hidden">
        <GildedCorners size="lg" withCenterNotches />

        {/* Header */}
        <div className="relative z-10 bg-[#081329] border-b border-[#966422]/45 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#140f08] border border-[#dfa86c]/60 text-[#fde047]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-fantasy tracking-widest text-[#dfa86c] uppercase">
                [CONFIGURAÇÃO DO SISTEMA]
              </span>
              <h2 className="text-base font-bold font-fantasy text-[#f8ecd5] uppercase tracking-wider">Ajustes</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar Ajustes"
            className="p-1.5 text-[#c5b08f] hover:text-[#fde047] hover:bg-[#101f42] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 space-y-4">
          {/* Status info */}
          <div className="relative bg-[#040814]/90 border border-[#966422]/55 p-3.5 space-y-2.5 font-mono text-xs overflow-hidden shadow-[inset_0_0_12px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="flex items-center justify-between text-[#c5b08f]">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#dfa86c]" />
                Arquitetura:
              </span>
              <span className="text-[#f8ecd5]">PWA Offline-First</span>
            </div>

            <div className="flex items-center justify-between text-[#c5b08f]">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#dfa86c]" />
                Protocolo:
              </span>
              <span className="text-emerald-400 font-bold">Ledger Imutável</span>
            </div>

            <div className="flex items-center justify-between text-[#c5b08f]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#dfa86c]" />
                Voz da Sabedoria:
              </span>
              <span className="text-[#fde047]">Grande Sábio (G.S)</span>
            </div>
          </div>

          {/* Audio & Narration Toggle */}
          <div className="relative bg-[#040814]/90 border border-[#966422]/55 p-3.5 flex items-center justify-between overflow-hidden shadow-[inset_0_0_12px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#140f08] border border-[#966422]/60 text-[#fde047]">
                {isNarrationEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#8c7a5b]" />
                )}
              </div>
              <div>
                <div className="text-xs font-fantasy font-bold uppercase tracking-wider text-[#f8ecd5]">
                  Narração da Voz do Mundo
                </div>
                <div className="text-[11px] text-[#c5b08f] font-sans">
                  Web Speech TTS para anúncios solenes do Sistema
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isNarrationEnabled}
              aria-label="Alternar narração da Voz do Mundo"
              onClick={handleToggleNarration}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-[#dfa86c] ${
                isNarrationEnabled ? "bg-[#c89b55]" : "bg-[#081329]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-[#040814] transition-transform ${
                  isNarrationEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Dev Mode button if unlocked */}
          {isDevUnlocked && (
            <button
              onClick={onOpenDevPanel}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1c1308]/90 border border-[#dfa86c]/70 hover:bg-[#2a1d0c] text-[#fde047] text-xs font-fantasy font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(223,168,108,0.2)]"
            >
              <Terminal className="w-4 h-4 text-[#dfa86c]" />
              <span>Abrir Painel do Desenvolvedor</span>
            </button>
          )}

          {/* Feedback Toast */}
          {toastMessage && (
            <div
              role="status"
              className="p-2.5 bg-[#1c1308]/90 border border-[#dfa86c]/60 text-center font-mono text-xs text-[#fde047] animate-pulse"
            >
              {toastMessage}
            </div>
          )}

          {/* Version with 7 clicks trigger */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#a39171] mb-1 font-fantasy uppercase tracking-widest">
              Slime Sage Skill (S.S.S)
            </p>
            <button
              type="button"
              data-testid="version-badge"
              onClick={handleVersionClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#040814] border border-[#966422]/60 hover:border-[#dfa86c] text-[#c5b08f] hover:text-[#fde047] font-mono text-xs transition-colors cursor-pointer select-none"
              title="Versão do Sistema"
            >
              <span>Versão</span>
              <span className="font-semibold text-[#dfa86c]">{APP_VERSION}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
