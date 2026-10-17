import React, { useState, useEffect, useCallback } from "react";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { BASE_AREAS, type Profile, type AreaCode, type XpEvent } from "@slime-sage/shared";
import {
  getAttributeRank,
  type AttributesMap,
  createEmptyAttributes,
  calculateLevelFromTotalXp,
  type LedgerAuditResult,
} from "@slime-sage/game";
import { gameService } from "../../services/gameService";
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { SystemButton } from "../system/SystemButton";
import { AttributesRadarChart } from "../status/AttributesRadarChart";

export interface StatusViewProps {
  isActive?: boolean;
}

export const StatusView: React.FC<StatusViewProps> = ({ isActive }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attributes, setAttributes] = useState<AttributesMap>(createEmptyAttributes());
  const [auditResult, setAuditResult] = useState<LedgerAuditResult | null>(null);
  const [recentEvents, setRecentEvents] = useState<XpEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadStatusData = useCallback(async () => {
    try {
      setLoading(true);
      const [prof, attrs, audit, events] = await Promise.all([
        gameService.getProfile(),
        gameService.getAttributes(),
        gameService.auditLedger(),
        gameService.getLedgerEvents(10),
      ]);
      if (isMountedRef.current) {
        setProfile(prof);
        setAttributes(attrs);
        setAuditResult(audit);
        setRecentEvents(events);
      }
    } catch {
      // Ignora erro
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadStatusData();
    const unsubscribe = gameService.subscribeToGameEvents(() => {
      void loadStatusData();
    });
    return unsubscribe;
  }, [loadStatusData]);

  useEffect(() => {
    if (isActive) {
      void loadStatusData();
    }
  }, [isActive, loadStatusData]);

  const levelProgress = calculateLevelFromTotalXp(profile?.total_xp ?? 0);
  const totalAttributeScore = Object.values(attributes).reduce((acc, val) => acc + val, 0);
  const overallRank = getAttributeRank(totalAttributeScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>PAINEL DE ATRIBUTOS // SOLO LEVELING</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">
            Sincronização em tempo real com o Motor Puro e Ledger Imutável.
          </p>
        </div>

        <SystemButton
          variant="ghost"
          size="sm"
          onClick={loadStatusData}
          disabled={loading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
        >
          Atualizar
        </SystemButton>
      </div>

      {/* Hunter Profile Header */}
      <SystemPanel
        title={`Caçador: ${profile?.name ?? "Rimuru Tempest"}`}
        subtitle={`${overallRank.label} · Título: ${profile?.title ?? "Aspirante a Desperto"}`}
        glow
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 text-center font-mono">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Nível</div>
            <div className="text-xl font-bold text-cyan-400">{levelProgress.level}</div>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Total XP</div>
            <div className="text-xl font-bold text-cyan-300">{profile?.total_xp ?? 0}</div>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Streak Diário</div>
            <div className="text-xl font-bold text-amber-400">{profile?.streak_count ?? 0} dias</div>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Rank Hunter</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 truncate">
              {overallRank.rank}
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="space-y-1 mt-4 pt-3 border-t border-cyan-500/15 font-mono">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>XP para Nível {levelProgress.level + 1}</span>
            <span className="text-cyan-300">
              {levelProgress.currentXp} / {levelProgress.xpForNextLevel} XP ({levelProgress.progressPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-cyan-500/20">
            <div
              className="bg-gradient-to-r from-cyan-500 to-cyan-300 h-full transition-all duration-500"
              style={{ width: `${levelProgress.progressPercentage}%` }}
            />
          </div>
        </div>
      </SystemPanel>

      {/* Pentagon Radar Chart & Attributes Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Radar Chart Column */}
        <div className="lg:col-span-5 flex flex-col">
          <SystemPanel
            title="Diagrama de Atributos"
            subtitle="Radar Pentagonal dos 5 Atributos Primários"
            className="flex-1 flex flex-col items-center justify-center p-4"
          >
            <AttributesRadarChart
              attributes={attributes}
              size={290}
              className="my-2"
            />
          </SystemPanel>
        </div>

        {/* 5 Base Areas Attribute Cards Column */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Detalhamento de Maestria por Área
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BASE_AREAS.map((area) => {
              const masteryVal = attributes[area.code as AreaCode] ?? 0;
              const rank = getAttributeRank(masteryVal);
              return (
                <div
                  key={area.id}
                  className="p-3 bg-[#0a1224]/80 border border-cyan-500/20 rounded-xl flex items-center justify-between gap-2 min-w-0"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <SystemBadge type="area" areaId={area.code} size="sm" className="shrink-0" />
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 shrink-0">
                        Rank {rank.rank}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1 break-words [overflow-wrap:anywhere]">
                      {area.description}
                    </p>
                  </div>
                  <div className="text-right font-mono shrink-0 pl-2">
                    <div className="text-sm text-cyan-300 font-bold">{masteryVal} pts</div>
                    <div className="text-[10px] text-slate-500">{rank.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ledger Audit Status Card */}
          {auditResult && (
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between font-mono text-xs ${
                auditResult.isConsistent
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/30 border-red-500/50 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {auditResult.isConsistent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {auditResult.isConsistent
                      ? "Ledger Imutável 100% Íntegro"
                      : "Divergência Detectada no Ledger"}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ledger: {auditResult.ledgerTotalXp} XP · Perfil: {auditResult.profileTotalXp} XP
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400 hidden sm:block">
                Regra 2 (Ledger) Ativa
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Recent Transactions Statement */}
      <SystemPanel
        title="Extrato Recente do Ledger // Auditoria Imutável"
        subtitle="Registro criptográfico das últimas 10 transações de XP e Maestria"
      >
        {recentEvents.length === 0 ? (
          <div className="p-6 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-800 rounded-xl my-2">
            Nenhuma transação gravada no Ledger até o momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 font-mono text-xs my-2 overflow-x-auto">
            {recentEvents.map((ev) => {
              const isPositive = ev.xp_amount >= 0;
              const formattedDate = new Date(ev.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={ev.id}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors rounded-lg min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 ${
                        isPositive
                          ? "bg-cyan-950/60 border-cyan-500/30 text-cyan-400"
                          : "bg-red-950/60 border-red-500/30 text-red-400"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-slate-200 font-semibold break-words [overflow-wrap:anywhere]">{ev.description}</span>
                        {ev.area_id && <SystemBadge type="area" areaId={ev.area_id} size="sm" className="shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="shrink-0">{formattedDate}</span>
                        <span>·</span>
                        <span className="text-slate-400 font-sans shrink-0">
                          {ev.entity_type === "mission" ? "Missão" : ev.entity_type}
                        </span>
                        {ev.mastery_amount !== 0 && (
                          <>
                            <span>·</span>
                            <span className="text-cyan-400/80 shrink-0">
                              {ev.mastery_amount > 0 ? `+${ev.mastery_amount}` : ev.mastery_amount} Maestria
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span
                      className={`font-bold text-sm ${
                        isPositive ? "text-cyan-400" : "text-red-400"
                      }`}
                    >
                      {isPositive ? `+${ev.xp_amount}` : ev.xp_amount} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SystemPanel>
    </div>
  );
};
