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
  Database,
  Sparkles,
  CheckCircle2,
  Clock,
  FastForward,
  AlertTriangle,
  RotateCcw,
  Scale,
} from "lucide-react";
import {
  type AppLogEntry,
  type LogLevel,
  type LogScope,
  type TableName,
  type XpEvent,
  TABLE_NAMES,
} from "@slime-sage/shared";
import { logger } from "../services/logger";
import { ttsService } from "../services/ttsService";
import {
  notificationService,
  type NotificationStatus,
} from "../services/notificationService";
import { localDb } from "../services/db";
import { gameService } from "../services/gameService";
import { type LedgerAuditResult } from "@slime-sage/game";

interface DevPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "logs" | "ledger" | "time" | "db" | "tts" | "notif";

const GS_TEST_PHRASE = "Aviso. O Sistema Slime Sage foi inicializado com sucesso.";

export const DevPanel: React.FC<DevPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("logs");
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Database state
  const [tableCounts, setTableCounts] = useState<Record<TableName, number> | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbActionMessage, setDbActionMessage] = useState<string>("");

  // Ledger state
  const [ledgerEvents, setLedgerEvents] = useState<XpEvent[]>([]);
  const [auditResult, setAuditResult] = useState<LedgerAuditResult | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerMessage, setLedgerMessage] = useState("");

  // Time state
  const [isFakeClock, setIsFakeClock] = useState<boolean>(gameService.isFakeClock());
  const [simulatedTime, setSimulatedTime] = useState<number>(gameService.getClock().now());
  const [timeMessage, setTimeMessage] = useState("");

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

  const loadTableCounts = useCallback(async () => {
    setDbLoading(true);
    try {
      const counts = await localDb.getTableCounts();
      setTableCounts(counts);
    } catch {
      // Ignore error
    } finally {
      setDbLoading(false);
    }
  }, []);

  const loadLedgerData = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const [events, audit] = await Promise.all([
        gameService.getLedgerEvents(50),
        gameService.auditLedger(),
      ]);
      setLedgerEvents(events);
      setAuditResult(audit);
    } catch (err) {
      console.error("Erro ao carregar ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  const refreshTimeState = useCallback(() => {
    setIsFakeClock(gameService.isFakeClock());
    setSimulatedTime(gameService.getClock().now());
  }, []);

  // Load appropriate data on tab switch
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "logs") {
        void loadLogs();
      } else if (activeTab === "db") {
        void loadTableCounts();
      } else if (activeTab === "ledger") {
        void loadLedgerData();
      } else if (activeTab === "time") {
        refreshTimeState();
      }
    }
  }, [isOpen, activeTab, loadLogs, loadTableCounts, loadLedgerData, refreshTimeState]);

  // Live real-time ticking for Clock display
  useEffect(() => {
    if (!isOpen || activeTab !== "time") return;
    const interval = setInterval(() => {
      refreshTimeState();
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, refreshTimeState]);

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

  // Check Notifications permission
  useEffect(() => {
    if (!isOpen) return;
    setNotifPermission(notificationService.getPermission());
  }, [isOpen]);

  const handleClearLogs = async () => {
    await logger.clearLogs();
    setLogs([]);
  };

  const handleExportLogs = async () => {
    const jsonStr = await logger.exportLogs();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slime_sage_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const handleSeedDatabase = async () => {
    setDbLoading(true);
    setDbActionMessage("");
    try {
      await localDb.seedSampleData();
      await loadTableCounts();
      setDbActionMessage("Banco de dados semeado com sucesso! Projetos e missões prontos.");
      setTimeout(() => setDbActionMessage(""), 5000);
    } catch (err) {
      console.error("Erro ao semear o banco de dados:", err);
      setDbActionMessage("Erro ao semear o banco de dados.");
    } finally {
      setDbLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        "Atenção: Esta ação apagará TODOS os dados das 19 tabelas locais do IndexedDB! Continuar?"
      )
    ) {
      return;
    }
    setDbLoading(true);
    setDbActionMessage("");
    try {
      await localDb.resetDatabase();
      await loadTableCounts();
      setDbActionMessage("Banco de dados reinicializado. Todas as tabelas foram zeradas.");
      setTimeout(() => setDbActionMessage(""), 5000);
    } catch {
      setDbActionMessage("Erro ao resetar o banco de dados.");
    } finally {
      setDbLoading(false);
    }
  };

  const handleReconcileLedger = async () => {
    setLedgerLoading(true);
    setLedgerMessage("");
    try {
      await gameService.reconcileProfileWithLedger();
      await loadLedgerData();
      setLedgerMessage("Perfil recalculado e reconciliado 100% com o Ledger!");
      setTimeout(() => setLedgerMessage(""), 5000);
    } catch {
      setLedgerMessage("Erro ao reconciliar perfil com o ledger.");
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleToggleFakeClock = () => {
    if (isFakeClock) {
      gameService.useRealClock();
    } else {
      gameService.useFakeClock(Date.now(), true);
    }
    refreshTimeState();
    setTimeMessage(
      gameService.isFakeClock()
        ? "FakeClock ativado! Viagem no tempo habilitada."
        : "RealClock restaurado! Sincronização padrão ativa."
    );
    setTimeout(() => setTimeMessage(""), 4000);
  };

  const handleAdvanceTime = (hours: number) => {
    if (!gameService.isFakeClock()) {
      gameService.useFakeClock(Date.now(), true);
    }
    gameService.advanceClockHours(hours);
    refreshTimeState();
    setTimeMessage(`Tempo avançado em ${hours} hora(s)!`);
    setTimeout(() => setTimeMessage(""), 4000);
  };

  const handleResetTime = () => {
    gameService.resetClock();
    refreshTimeState();
    setTimeMessage("Tempo simulado resetado para o momento atual!");
    setTimeout(() => setTimeMessage(""), 4000);
  };

  const handleSpeakGsPhrase = async () => {
    setIsSpeaking(true);
    try {
      await ttsService.speak(GS_TEST_PHRASE, {
        voiceName: selectedVoice,
        rate: ttsRate,
        pitch: ttsPitch,
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleStopTts = () => {
    ttsService.stop();
    setIsSpeaking(false);
  };

  const handleRequestNotifPermission = async () => {
    const res = await notificationService.requestPermission();
    setNotifPermission(res);
    setNotifMessage(`Permissão solicitada: ${res}`);
    setTimeout(() => setNotifMessage(""), 4000);
  };

  const handleTriggerTestNotif = async () => {
    const success = await notificationService.sendNotification("Aviso do Sistema", {
      body: "Teste de notificação web da Grande Sábio disparado pelo Painel Dev.",
      tag: "test-notification",
    });
    setNotifMessage(
      success
        ? "Notificação disparada com sucesso!"
        : "Falha ao disparar notificação (verifique permissões)."
    );
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
        <div className="flex border-b border-cyan-500/15 bg-slate-950/40 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "logs"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs do Sistema ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "ledger"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Ledger de XP</span>
          </button>

          <button
            onClick={() => setActiveTab("time")}
            className={`px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "time"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Viagem no Tempo</span>
          </button>

          <button
            onClick={() => setActiveTab("db")}
            className={`px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "db"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Banco de Dados Local</span>
          </button>

          <button
            onClick={() => setActiveTab("tts")}
            className={`px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
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
            className={`px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
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
          {/* TAB: LEDGER */}
          {activeTab === "ledger" && (
            <div className="space-y-5 max-w-3xl mx-auto font-mono">
              <div className="bg-[#0a1224]/70 border border-cyan-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Ledger Imutável // Auditoria Total (xp_event)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Regra de Ouro 2: Toda alteração de XP gera registro imutável no ledger.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={loadLedgerData}
                    disabled={ledgerLoading}
                    title="Atualizar Ledger"
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${ledgerLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Audit Integrity Status Banner */}
                {auditResult && (
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                      auditResult.isConsistent
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/40 border-red-500/50 text-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {auditResult.isConsistent ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm">
                          {auditResult.isConsistent
                            ? "Ledger 100% Íntegro — Conformidade Auditada"
                            : "Divergência Detectada entre Ledger e Perfil"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Soma Ledger: <span className="text-white font-bold">{auditResult.ledgerTotalXp} XP</span> · Perfil: <span className="text-white font-bold">{auditResult.profileTotalXp} XP</span>
                          {!auditResult.isConsistent && (
                            <span className="text-red-400 ml-2">
                              (Diferença: {auditResult.difference} XP)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!auditResult.isConsistent && (
                      <button
                        onClick={handleReconcileLedger}
                        className="py-1.5 px-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                      >
                        Reconciliar Perfil
                      </button>
                    )}
                  </div>
                )}

                {ledgerMessage && (
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{ledgerMessage}</span>
                  </div>
                )}

                {/* Action Reconcile button */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleReconcileLedger}
                    disabled={ledgerLoading}
                    className="py-2 px-3.5 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors"
                  >
                    Auditar e Recalcular Perfil
                  </button>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Últimas Transações Registradas ({ledgerEvents.length})</span>
                  <span className="text-[10px] text-slate-500">Mais recentes primeiro</span>
                </div>

                {ledgerEvents.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    Nenhum evento registrado no Ledger até o momento.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ledgerEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ev.xp_amount >= 0
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-600/30"
                                  : "bg-red-950 text-red-400 border border-red-600/30"
                              }`}
                            >
                              {ev.xp_amount >= 0 ? `+${ev.xp_amount}` : ev.xp_amount} XP
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px]">
                              {ev.area_id}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              [{ev.entity_type}]
                            </span>
                            {ev.mastery_amount !== 0 && (
                              <span className="text-amber-400 text-[10px]">
                                {ev.mastery_amount > 0 ? `+${ev.mastery_amount}` : ev.mastery_amount} Maestria
                              </span>
                            )}
                          </div>
                          <div className="text-slate-200 text-xs font-sans">
                            {ev.description}
                          </div>
                        </div>

                        <div className="text-right text-[10px] text-slate-500 shrink-0 pl-3">
                          {new Date(ev.created_at).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TIME TRAVEL (FAKE CLOCK) */}
          {activeTab === "time" && (
            <div className="space-y-5 max-w-2xl mx-auto font-mono">
              <div className="bg-[#0a1224]/70 border border-cyan-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Viagem no Tempo // Controles de Clock
                      </h3>
                      <p className="text-xs text-slate-400">
                        Injeção de tempo determinístico via FakeClock para testar viradas de dia e cooldowns.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      isFakeClock
                        ? "bg-amber-950 text-amber-400 border border-amber-600/40"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-600/40"
                    }`}
                  >
                    {isFakeClock ? "FakeClock Ativo" : "RealClock Ativo"}
                  </span>
                </div>

                {timeMessage && (
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{timeMessage}</span>
                  </div>
                )}

                {/* Current Clock Display */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-center space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                      Horário Atual do Sistema (Tempo Real)
                    </span>
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-cyan-300 font-mono tracking-wider">
                    {new Date(simulatedTime).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  <div className="text-xs text-slate-300">
                    {new Date(simulatedTime).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Timestamp: {simulatedTime}
                    {isFakeClock && (
                      <span className="ml-2 text-amber-400/90 font-medium">
                        ({Math.round((simulatedTime - Date.now()) / (3600 * 1000))}h de deslocamento)
                      </span>
                    )}
                  </div>
                </div>

                {/* Control Actions */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Avançar Linha do Tempo
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      onClick={() => handleAdvanceTime(1)}
                      className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>+1 Hora</span>
                    </button>

                    <button
                      onClick={() => handleAdvanceTime(24)}
                      className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>+24h (1 Dia)</span>
                    </button>

                    <button
                      onClick={() => handleAdvanceTime(48)}
                      className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>+48 Horas</span>
                    </button>

                    <button
                      onClick={() => handleAdvanceTime(168)}
                      className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>+7 Dias</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleResetTime}
                      className="py-2.5 px-4 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetar para Momento Real</span>
                    </button>

                    <button
                      onClick={handleToggleFakeClock}
                      className={`py-2.5 px-4 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 ${
                        isFakeClock
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isFakeClock ? "Desativar FakeClock" : "Ativar FakeClock"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATABASE */}
          {activeTab === "db" && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="bg-[#0a1224]/70 border border-cyan-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Gestão do Banco de Dados Local (IndexedDB)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Schema relacional v2 — 19 tabelas locais ativas.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={loadTableCounts}
                    disabled={dbLoading}
                    title="Atualizar Contagens"
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${dbLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {dbActionMessage && (
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{dbActionMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleSeedDatabase}
                    disabled={dbLoading}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs font-mono transition-colors shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Semear Dados de Exemplo (Seed)</span>
                  </button>

                  <button
                    onClick={handleResetDatabase}
                    disabled={dbLoading}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-950/40 border border-red-500/40 hover:bg-red-900/60 text-red-300 font-medium text-xs font-mono transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Apagar Tudo (Reset DB)</span>
                  </button>
                </div>
              </div>

              {/* Table Counters Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Contagem de Registros por Tabela (IndexedDB)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                  {TABLE_NAMES.map((name) => {
                    const count = tableCounts ? tableCounts[name] : 0;
                    return (
                      <div
                        key={name}
                        className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-slate-400 truncate pr-2">{name}</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                            count > 0
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                              : "text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1224]/60 p-3 rounded-xl border border-cyan-500/20">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  {/* Search input */}
                  <input
                    type="text"
                    placeholder="Filtrar mensagem ou dados..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 flex-1 min-w-[150px]"
                  />

                  {/* Scope filter */}
                  <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">Todos os Escopos</option>
                    <option value="game">game</option>
                    <option value="ai">ai</option>
                    <option value="notif">notif</option>
                    <option value="db">db</option>
                    <option value="focus">focus</option>
                    <option value="backup">backup</option>
                    <option value="tts">tts</option>
                  </select>

                  {/* Level filter */}
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">Todos os Níveis</option>
                    <option value="debug">debug</option>
                    <option value="info">info</option>
                    <option value="warn">warn</option>
                    <option value="error">error</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadLogs}
                    disabled={loadingLogs}
                    title="Recarregar logs"
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loadingLogs ? "animate-spin" : ""}`}
                    />
                  </button>
                  <button
                    onClick={handleExportLogs}
                    title="Exportar logs como JSON"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar</span>
                  </button>
                  <button
                    onClick={handleClearLogs}
                    title="Limpar logs"
                    className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Logs list */}
              <div className="space-y-2 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                    Nenhum log encontrado para os filtros selecionados.
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogIds.has(log.id);
                    const hasData = log.data !== undefined && log.data !== null;

                    let levelBadgeClass =
                      "bg-slate-800 text-slate-300 border-slate-700";
                    if (log.level === "info") {
                      levelBadgeClass =
                        "bg-cyan-950 text-cyan-300 border-cyan-700/50";
                    } else if (log.level === "warn") {
                      levelBadgeClass =
                        "bg-amber-950 text-amber-300 border-amber-700/50";
                    } else if (log.level === "error") {
                      levelBadgeClass =
                        "bg-red-950 text-red-300 border-red-700/50";
                    }

                    return (
                      <div
                        key={log.id}
                        className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/30 rounded-lg p-2.5 transition-colors"
                      >
                        <div
                          className="flex items-start justify-between gap-2 cursor-pointer"
                          onClick={() => hasData && toggleExpand(log.id)}
                        >
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            {hasData ? (
                              <button
                                aria-label="Expandir detalhes"
                                className="text-slate-400 hover:text-cyan-300"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="w-3.5" />
                            )}

                            <span className="text-slate-500 text-[10px]">
                              {new Date(log.at).toLocaleTimeString("pt-BR", {
                                hour12: false,
                              })}
                            </span>

                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${levelBadgeClass}`}
                            >
                              {log.level}
                            </span>

                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-slate-900 border border-slate-700 text-slate-400">
                              {log.scope}
                            </span>

                            <span className="text-slate-200 font-sans text-xs">
                              {log.message}
                            </span>
                          </div>
                        </div>

                        {isExpanded && hasData && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 pl-6">
                            <pre className="text-[11px] text-cyan-300/90 overflow-x-auto bg-black/40 p-2.5 rounded border border-slate-800">
                              {JSON.stringify(log.data, null, 2)}
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
              {!ttsSupported ? (
                <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-xl text-amber-300 text-xs flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <span>
                    A Web Speech API (speechSynthesis) não é suportada neste
                    navegador ou ambiente.
                  </span>
                </div>
              ) : (
                <div className="bg-[#0a1224]/70 border border-cyan-500/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Voz do Mundo & Grande Sábio (Web Speech API)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Síntese de fala offline e normalizador fonético pt-BR.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Selecione a Voz Instalada:
                      </label>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        {voices.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang}) {v.default ? "★ Padrão" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">
                          Velocidade (Rate): {ttsRate.toFixed(1)}x
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={ttsRate}
                          onChange={(e) =>
                            setTtsRate(parseFloat(e.target.value))
                          }
                          className="w-full accent-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">
                          Tom (Pitch): {ttsPitch.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.1"
                          value={ttsPitch}
                          onChange={(e) =>
                            setTtsPitch(parseFloat(e.target.value))
                          }
                          className="w-full accent-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-[11px] text-slate-400 mb-1.5">
                        Frase de Teste:
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-cyan-300 italic text-xs">
                        "{GS_TEST_PHRASE}"
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSpeakGsPhrase}
                        disabled={isSpeaking}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs font-mono transition-colors shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isSpeaking ? "Falando..." : "Testar Voz da G.S"}</span>
                      </button>

                      {isSpeaking && (
                        <button
                          onClick={handleStopTts}
                          className="py-2.5 px-4 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900/80 text-xs font-mono transition-colors"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
