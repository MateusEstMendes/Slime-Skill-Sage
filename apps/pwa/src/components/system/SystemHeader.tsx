import React from "react";
import { Settings, LogOut, Terminal } from "lucide-react";
import { SystemButton } from "./SystemButton";

export interface SystemHeaderProps {
  onOpenSettings: () => void;
  onOpenDevPanel?: () => void;
  onLogout: () => void;
  activeTabTitle?: string;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({
  onOpenSettings,
  onOpenDevPanel,
  onLogout,
  activeTabTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#c89b55]/50 bg-[#050b18]/95 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between shadow-[0_6px_28px_rgba(0,0,0,0.75)] relative">
      {/* Subtle ornamental bottom gold glow line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-[#fde047]/60 to-transparent pointer-events-none" />
      <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#fde047] border border-[#966422] shadow-[0_0_8px_rgba(253,224,71,0.9)] pointer-events-none" />

      {/* Brand & System Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 rotate-45 bg-[#fde047] border border-[#dfa86c] shadow-[0_0_8px_rgba(253,224,71,0.9)]" />
          <div className="absolute w-4 h-4 rotate-45 border border-[#dfa86c]/50 animate-ping" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-fantasy font-bold tracking-[0.18em] text-[#f8ecd5] text-xs md:text-sm drop-shadow-[0_0_8px_rgba(223,168,108,0.4)]">
              SLIME SAGE
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-fantasy tracking-widest bg-[#140f08]/90 border border-[#c89b55]/60 text-[#dfa86c]">
              SISTEMA v1.0
            </span>
          </div>
          {activeTabTitle && (
            <span className="text-[10px] font-mono text-[#c5b08f] flex items-center gap-1 truncate">
              <span className="text-[#dfa86c]">❖</span> {activeTabTitle}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenDevPanel && (
          <SystemButton
            variant="ghost"
            size="sm"
            onClick={onOpenDevPanel}
            aria-label="Abrir Painel Dev"
            className="text-[#c5b08f] hover:text-[#fde047]"
            icon={<Terminal className="w-3.5 h-3.5" />}
          >
            <span className="hidden md:inline">Dev</span>
          </SystemButton>
        )}

        <SystemButton
          variant="secondary"
          size="sm"
          onClick={onOpenSettings}
          aria-label="Abrir Ajustes"
          icon={<Settings className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">Ajustes</span>
        </SystemButton>

        <SystemButton
          variant="danger"
          size="sm"
          onClick={onLogout}
          aria-label="Desconectar"
          icon={<LogOut className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">Sair</span>
        </SystemButton>
      </div>
    </header>
  );
};
