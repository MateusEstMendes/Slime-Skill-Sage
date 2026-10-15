import React, { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  Volume2,
  Bell,
  Trash2,
  RefreshCw,
  Download,
  X,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import type { AppLogEntry, LogLevel, LogScope } from "@slime-sage/shared";
import { logger } from "../services/logger";
import { ttsService } from "../services/ttsService";
import {
  notificationService,
  type NotificationStatus,
} from "../services/notificationService";

interface DevPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "logs" | "tts" | "notif";

const GS_TEST_PHRASE = "Aviso. O Sistema Slime Sage foi inicializado com sucesso.";

export const DevPanel: React.FC<DevPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("logs");
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // TTS state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [ttsSupported, setTtsSupported] = useState<boolean>(true);

  // Notifications state
  const [notifPermission, setNotifPermission] =
    useState<NotificationStatus>("unsupported");
  const [notifMessage, setNotifMessage] = useState<string>("");

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const scope =
        scopeFilter !== "all" ? (scopeFilter as LogScope) : undefined;
      const level =
        levelFilter !== "all" ? (levelFilter as LogLevel) : undefined;
      const fetched = await logger.getLogs({ scope, level });
      setLogs(fetched);
    } catch {
      // Ignore load error
    } finally {
      setLoadingLogs(false);
    }
  }, [scopeFilter, levelFilter]);

  // Load logs on tab switch or filters change
  useEffect(() => {
    if (isOpen) {
      void loadLogs();
    }
  }, [isOpen, loadLogs]);

  // Subscribe to live logs
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = logger.subscribe((newEntry) => {
      setLogs((prev) => [newEntry, ...prev.slice(0, 1999)]);
    });
    return unsubscribe;
  }, [isOpen]);

  // Check TTS and voices
  useEffect(() => {
    if (!isOpen) return;
    const supported = ttsService.isSupported();
    setTtsSupported(supported);
    if (supported) {
      void ttsService.getAvailableVoices().then((loadedVoices) => {
        setVoices(loadedVoices);
        const defaultPt = ttsService.selectPtBrVoice(loadedVoices);
        if (defaultPt) {
          setSelectedVoice(defaultPt.name);
        }
      });
    }
  }, [isOpen]);

  // Check notification permission
  useEffect(() => {
    if (!isOpen) return;
    setNotifPermission(notificationService.getPermission());
  }, [isOpen]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearLogs = async () => {
    if (window.confirm("Deseja realmente limpar todos os logs do Sistema?")) {
      await logger.clearLogs();
      setLogs([]);
    }
  };

  const handleExportLogs = async () => {
    const json = await logger.exportLogs();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slime-sage-dev-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSpeakGS = async () => {
    setIsSpeaking(true);
    await ttsService.speak(GS_TEST_PHRASE, {
      voiceName: selectedVoice,
      rate: ttsRate,
      pitch: ttsPitch,
    });
    setIsSpeaking(false);
  };

  const handleStopSpeech = () => {
    ttsService.stop();
    setIsSpeaking(false);
  };

  const handleRequestNotifPermission = async () => {
    const perm = await notificationService.requestPermission();
    setNotifPermission(perm);
    setNotifMessage(`Permissão: ${perm}`);
    setTimeout(() => setNotifMessage(""), 3000);
  };

  const handleTriggerTestNotif = async () => {
    const success = await notificationService.sendNotification(
      "Slime Sage // Voz do Mundo",
      {
        body: "Aviso da Grande Sábio: O protocolo de notificação está operacional.",
      }
    );
    if (success) {
      setNotifMessage("Notificação disparada com sucesso!");
    } else {
      setNotifMessage(
        "Falha ao enviar notificação. Verifique se a permissão foi concedida."
      );
    }
    setTimeout(() => setNotifMessage(""), 4000);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(query) ||
      log.scope.toLowerCase().includes(query) ||
      log.level.toLowerCase().includes(query) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
    );
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Painel do Desenvolvedor"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-[#070c18] border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-[#0a1224] border-b border-cyan-500/20 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase">
                [PAINEL DEV // PROTOCOLO ADMINISTRADOR]
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Console do Sistema Slime Sage
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar Painel Dev"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cyan-500/15 bg-slate-950/40 px-4">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "logs"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs do Sistema ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("tts")}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "tts"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voz da G.S (TTS)</span>
          </button>

          <button
            onClick={() => setActiveTab("notif")}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "notif"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Web Notifications</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB: LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                <input
                  type="text"
                  placeholder="Pesquisar mensagens ou payload..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[180px] bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 text-xs"
                />

                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-400 text-xs"
                >
                  <option value="all">Todos os Escopos</option>
                  <option value="ai">ai</option>
                  <option value="notif">notif</option>
                  <option value="game">game</option>
                  <option value="db">db</option>
                  <option value="focus">focus</option>
                  <option value="backup">backup</option>
                  <option value="tts">tts</option>
                </select>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-400 text-xs"
                >
                  <option value="all">Todos os Níveis</option>
                  <option value="debug">debug</option>
                  <option value="info">info</option>
                  <option value="warn">warn</option>
                  <option value="error">error</option>
                </select>

                <button
                  onClick={loadLogs}
                  disabled={loadingLogs}
                  title="Atualizar Logs"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingLogs ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  onClick={handleExportLogs}
                  title="Exportar Logs (JSON)"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </button>

                <button
                  onClick={handleClearLogs}
                  title="Limpar Logs"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/40 hover:border-red-500/60 text-red-300 hover:text-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              </div>

              {/* Log List */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    Nenhum log registrado ou correspondente aos filtros.
                  </div>
                ) : (
                  filteredLogs.map((entry) => {
                    const isExpanded = expandedLogIds.has(entry.id);
                    const levelColors: Record<LogLevel, string> = {
                      debug: "text-slate-400 border-slate-700 bg-slate-900/60",
                      info: "text-cyan-300 border-cyan-800/60 bg-cyan-950/40",
                      warn: "text-amber-300 border-amber-800/60 bg-amber-950/40",
                      error: "text-red-400 border-red-800/60 bg-red-950/40",
                    };

                    const scopeColors: Record<LogScope, string> = {
                      ai: "text-purple-300 bg-purple-950/60 border-purple-800/50",
                      notif: "text-amber-300 bg-amber-950/60 border-amber-800/50",
                      game: "text-emerald-300 bg-emerald-950/60 border-emerald-800/50",
                      db: "text-blue-300 bg-blue-950/60 border-blue-800/50",
                      focus: "text-pink-300 bg-pink-950/60 border-pink-800/50",
                      backup: "text-indigo-300 bg-indigo-950/60 border-indigo-800/50",
                      tts: "text-teal-300 bg-teal-950/60 border-teal-800/50",
                    };

                    return (
                      <div
                        key={entry.id}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs font-mono transition-colors hover:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-slate-500 text-[11px]">
                              {new Date(entry.at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                                levelColors[entry.level]
                              }`}
                            >
                              {entry.level}
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                                scopeColors[entry.scope]
                              }`}
                            >
                              {entry.scope}
                            </span>

                            <span className="text-slate-200 font-sans text-xs">
                              {entry.message}
                            </span>
                          </div>

                          {entry.data !== undefined && (
                            <button
                              onClick={() => toggleExpand(entry.id)}
                              className="text-slate-400 hover:text-cyan-300 p-0.5"
                              title={isExpanded ? "Recolher dados" : "Expandir dados"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {entry.data !== undefined && isExpanded && (
                          <div className="mt-2 p-2 bg-black/60 rounded border border-slate-800 overflow-x-auto text-[11px] text-cyan-200/80">
                            <pre>
                              {typeof entry.data === "object"
                                ? JSON.stringify(entry.data, null, 2)
                                : String(entry.data)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: TTS */}
          {activeTab === "tts" && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="bg-[#0a1224]/70 border border-cyan-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Síntese de Voz da Grande Sábio (Web Speech API)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Narração em pt-BR da G.S e Voz do Mundo.
                    </p>
                  </div>
                </div>

                {!ttsSupported && (
                  <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      A Web Speech API não está disponível neste navegador.
                    </span>
                  </div>
                )}

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Voz Detectada (pt-BR):
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
                    >
                      {voices.length === 0 ? (
                        <option value="">Voz Padrão do Sistema</option>
                      ) : (
                        voices.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang}) {v.default ? "★" : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Velocidade (Rate): {ttsRate.toFixed(2)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={ttsRate}
                        onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Tom (Pitch): {ttsPitch.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={ttsPitch}
                        onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Test phrase preview */}
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-500/20 text-cyan-300/90 italic">
                    "{GS_TEST_PHRASE}"
                  </div>

                  {/* Trigger buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSpeakGS}
                      disabled={isSpeaking || !ttsSupported}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs font-mono transition-colors shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isSpeaking ? "Narrando..." : "Testar Voz da G.S"}</span>
                    </button>

                    <button
                      onClick={handleStopSpeech}
                      disabled={!isSpeaking}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 disabled:opacity-40 text-xs font-mono transition-colors"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Parar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === "notif" && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="bg-[#0a1224]/70 border border-cyan-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Spike de Web Notifications
                    </h3>
                    <p className="text-xs text-slate-400">
                      Alertas do Sistema e lembretes de diárias via Service Worker.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Permissão Atual:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                        notifPermission === "granted"
                          ? "bg-emerald-950 border border-emerald-600/40 text-emerald-400"
                          : notifPermission === "denied"
                            ? "bg-red-950 border border-red-600/40 text-red-400"
                            : "bg-slate-900 border border-slate-700 text-amber-400"
                      }`}
                    >
                      {notifPermission}
                    </span>
                  </div>

                  {notifMessage && (
                    <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs">
                      {notifMessage}
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 pt-2">
                    <button
                      onClick={handleRequestNotifPermission}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 border border-cyan-500/40 hover:bg-slate-800 text-cyan-300 text-xs font-mono transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Solicitar Permissão de Notificação Web</span>
                    </button>

                    <button
                      onClick={handleTriggerTestNotif}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs font-mono transition-colors shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Disparar Notificação Imediata</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
