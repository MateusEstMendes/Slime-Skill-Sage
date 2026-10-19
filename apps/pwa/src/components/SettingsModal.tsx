import React, { useState, useEffect } from "react";
import { Settings, X, Terminal, Cpu, Shield, Sparkles, Volume2, VolumeX, Gauge } from "lucide-react";
import { localDb } from "../services/db";
import { worldVoiceService } from "../services/worldVoiceService";
import { gsVoiceService, DEFAULT_GS_PLAYBACK_RATE } from "../services/gsVoiceService";
import { GildedCorners } from "./system/GildedCorners";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDevPanel: () => void;
}

const REQUIRED_CLICKS = 7;
const APP_VERSION = "v1.0.0-phase8";
const DEV_MODE_KEY = "dev_mode_unlocked";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenDevPanel,
}) => {
  const clickCountRef = React.useRef<number>(0);
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(false);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState<boolean>(true);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(true);
  const [gsPlaybackRate, setGsPlaybackRate] = useState<number>(DEFAULT_GS_PLAYBACK_RATE);
  const [isPendingToastEnabled, setIsPendingToastEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      void localDb.getKv<boolean>(DEV_MODE_KEY).then((unlocked) => {
        if (unlocked) setIsDevUnlocked(true);
      });
      void worldVoiceService.isTtsEnabled().then((enabled) => {
        setIsNarrationEnabled(enabled);
      });
      void gsVoiceService.isAutoPlayEnabled().then((autoPlay) => {
        setIsAutoPlayEnabled(autoPlay);
      });
      void gsVoiceService.getPlaybackRate().then((rate) => {
        setGsPlaybackRate(rate);
      });
      void localDb.getKv<boolean>("settings_disable_pending_toast").then((disabled) => {
        setIsPendingToastEnabled(!disabled);
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

  const handleToggleAutoPlay = async () => {
    const nextState = !isAutoPlayEnabled;
    setIsAutoPlayEnabled(nextState);
    await gsVoiceService.setAutoPlayEnabled(nextState);
    setToastMessage(
      nextState ? "Auto-reprodução de voz da G.S ativada." : "Auto-reprodução de voz desativada."
    );
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  const handleChangeGsSpeed = async (newRate: number) => {
    setGsPlaybackRate(newRate);
    await gsVoiceService.setPlaybackRate(newRate);
  };

  const handleTogglePendingToast = async () => {
    const nextState = !isPendingToastEnabled;
    setIsPendingToastEnabled(nextState);
    await localDb.setKv("settings_disable_pending_toast", !nextState);
    setToastMessage(
      nextState ? "Avisos de pendências ativados." : "Avisos de pendências silenciados."
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
      <div className="relative bg-[#060e20]/95 border border-[#c89b55]/75 rounded-none w-full max-w-md max-h-[90vh] flex flex-col shadow-[0_0_45px_rgba(223,168,108,0.22)] overflow-hidden">
        <GildedCorners size="lg" withCenterNotches />

        {/* Header */}
        <div className="relative z-10 shrink-0 bg-[#081329] border-b border-[#966422]/45 px-5 py-4 flex items-center justify-between">
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
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
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
                  Áudios oficiais e anúncios de rituais do Sistema
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isNarrationEnabled}
              aria-label="Alternar narração da Voz do Mundo"
              onClick={handleToggleNarration}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-[#dfa86c] ${
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

          {/* G.S Voice Auto-Play Toggle */}
          <div className="relative bg-[#040814]/90 border border-[#966422]/55 p-3.5 space-y-3 overflow-hidden shadow-[inset_0_0_12px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#140f08] border border-[#dfa86c]/60 text-[#dfa86c]">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-fantasy font-bold uppercase tracking-wider text-[#f8ecd5]">
                    Auto-reproduzir Voz da G.S
                  </div>
                  <div className="text-[11px] text-[#c5b08f] font-sans">
                    Falar automaticamente junto com a resposta no Chat
                  </div>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isAutoPlayEnabled}
                aria-label="Alternar auto-reprodução de voz da G.S"
                onClick={handleToggleAutoPlay}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-[#dfa86c] ${
                  isAutoPlayEnabled ? "bg-[#c89b55]" : "bg-[#081329]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#040814] transition-transform ${
                    isAutoPlayEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Cadência / Velocidade da Voz Neural Kore (1.0x a 2.0x) */}
            <div className="pt-2 border-t border-[#966422]/35 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[#c5b08f]">
                <span className="flex items-center gap-1.5 font-fantasy uppercase tracking-wider text-[11px]">
                  <Gauge className="w-3.5 h-3.5 text-[#fde047]" />
                  <span>Cadência da Voz G.S (Kore):</span>
                </span>
                <span className="text-[#fde047] font-bold">{gsPlaybackRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.05"
                aria-label="Velocidade da Voz da G.S"
                value={gsPlaybackRate}
                onChange={(e) => void handleChangeGsSpeed(parseFloat(e.target.value))}
                className="w-full accent-[#fde047] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8c7a5b]">
                <span>1.0x (Normal)</span>
                <span>1.25x (Rápida)</span>
                <span>1.5x</span>
                <span>2.0x (Máxima)</span>
              </div>
            </div>
          </div>

          {/* Pending Tasks Toast Toggle */}
          <div className="relative bg-[#040814]/90 border border-[#966422]/55 p-3.5 flex items-center justify-between overflow-hidden shadow-[inset_0_0_12px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#140f08] border border-[#00f3ff]/60 text-[#00f3ff]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-fantasy font-bold uppercase tracking-wider text-[#f8ecd5]">
                  Aviso de Pendências
                </div>
                <div className="text-[11px] text-[#c5b08f] font-sans">
                  Pop-up proativo ao detectar missões disponíveis
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isPendingToastEnabled}
              aria-label="Alternar aviso proativo de pendências"
              onClick={handleTogglePendingToast}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-[#dfa86c] ${
                isPendingToastEnabled ? "bg-[#c89b55]" : "bg-[#081329]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-[#040814] transition-transform ${
                  isPendingToastEnabled ? "translate-x-6" : "translate-x-1"
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
