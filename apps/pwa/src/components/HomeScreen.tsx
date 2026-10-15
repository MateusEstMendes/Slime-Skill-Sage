import React, { useState, useEffect } from "react";
import { CheckCircle2, LogOut, Terminal, Activity, Settings } from "lucide-react";
import { authStorage } from "../services/authStorage";
import { logger } from "../services/logger";
import { SettingsModal } from "./SettingsModal";
import { DevPanel } from "./DevPanel";

interface HomeScreenProps {
  onDisconnect: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onDisconnect }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  const token = authStorage.getToken() || "";
  const apiUrl = authStorage.getApiUrl();
  const maskedToken =
    token.length > 8
      ? `${token.slice(0, 4)}••••${token.slice(-4)}`
      : "••••••••";

  useEffect(() => {
    void logger.info("game", "Interface principal do Sistema carregada");
  }, []);

  const handleLogout = () => {
    authStorage.clearAll();
    onDisconnect();
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-cyan-500/20 bg-[#0a1224]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-cyan-300 font-mono text-sm">
            SLIME SAGE // SISTEMA ATIVO
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Abrir Ajustes"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-cyan-300 py-1.5 px-3 rounded border border-slate-700/60 hover:border-cyan-500/50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </button>

          <button
            onClick={handleLogout}
            aria-label="Desconectar"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-red-400 py-1.5 px-3 rounded border border-slate-700/60 hover:border-red-500/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Desconectar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto text-center">
        <div className="bg-[#0a1224]/70 border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,240,255,0.12)]">
          <div className="inline-flex p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest mb-1">
            Status do Link Neural
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Conexão com a Grande Sábio Estabelecida
          </h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            O canal de comunicação seguro com a API está autenticado e pronto
            para operação.
          </p>

          <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-800 text-left font-mono text-xs space-y-2 mb-6">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Endpoint API:
              </span>
              <span className="text-slate-200">{apiUrl}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Chave de Acesso:
              </span>
              <span className="text-cyan-400 font-bold">{maskedToken}</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Módulos de Sistema operacionais. Clique em &ldquo;Ajustes&rdquo; para
            inspecionar a telemetria.
          </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenDevPanel={() => {
          setIsSettingsOpen(false);
          setIsDevPanelOpen(true);
        }}
      />

      <DevPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
      />
    </div>
  );
};
