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
    <header className="sticky top-0 z-40 border-b border-cyan-500/25 bg-[#070e1e]/90 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <div className="absolute w-4 h-4 rounded-full bg-cyan-400/40 animate-ping" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-wider text-cyan-300 text-xs md:text-sm">
              SLIME SAGE
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              SISTEMA v1.0
            </span>
          </div>
          {activeTabTitle && (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <span className="text-cyan-500/80">//</span> {activeTabTitle}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onOpenDevPanel && (
          <SystemButton
            variant="ghost"
            size="sm"
            onClick={onOpenDevPanel}
            aria-label="Abrir Painel Dev"
            className="text-slate-400 hover:text-cyan-300"
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
