import React, { useState, useEffect, useCallback } from "react";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { GildedCorners } from "../system/GildedCorners";
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
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#dfa86c]" />
            <span>PAINEL DE ATRIBUTOS // SOLO LEVELING</span>
          </h2>
          <p className="text-xs md:text-sm text-[#c5b08f] font-mono mt-0.5">
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
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Nível</div>
            <div className="relative z-10 text-xl font-bold font-fantasy text-[#fde047]">{levelProgress.level}</div>
          </div>
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Total XP</div>
            <div className="relative z-10 text-xl font-bold font-fantasy text-[#dfa86c]">{profile?.total_xp ?? 0}</div>
          </div>
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Streak Diário</div>
            <div className="relative z-10 text-xl font-bold font-fantasy text-amber-400">{profile?.streak_count ?? 0} dias</div>
          </div>
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Rank Hunter</div>
            <div className="relative z-10 text-xs font-bold font-fantasy text-emerald-400 mt-1 truncate" title={overallRank.label}>
              Tier {overallRank.tierRoman} [{overallRank.subGradeRoman}] · {overallRank.title}
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="space-y-1 mt-4 pt-3 border-t border-[#966422]/40 font-mono">
          <div className="flex justify-between text-[11px] text-[#c5b08f]">
            <span className="font-fantasy uppercase tracking-wider">XP para Nível {levelProgress.level + 1}</span>
            <span className="text-[#fde047] font-bold">
              {levelProgress.currentXp} / {levelProgress.xpForNextLevel} XP ({levelProgress.progressPercentage}%)
            </span>
          </div>
          <div className="w-full bg-[#040814] h-2.5 overflow-hidden border border-[#c89b55]/55 p-[1px]">
            <div
              className="bg-gradient-to-r from-[#966422] via-[#dfa86c] to-[#fde047] h-full transition-all duration-500 shadow-[0_0_10px_rgba(253,224,71,0.65)]"
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
          <h3 className="text-xs font-fantasy font-bold uppercase tracking-widest text-[#dfa86c]">
            Detalhamento de Maestria por Área
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BASE_AREAS.map((area) => {
              const masteryVal = attributes[area.code as AreaCode] ?? 0;
              const rank = getAttributeRank(masteryVal, area.code as AreaCode);
              return (
                <div
                  key={area.id}
                  className="relative p-3 bg-[#060e20]/90 border border-[#c89b55]/45 flex items-center justify-between gap-2 min-w-0 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                >
                  <GildedCorners size="xs" withInnerFrame={false} />
                  <div className="relative z-10 space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <SystemBadge type="area" areaId={area.code} size="sm" className="shrink-0" />
                      <span className="text-[10px] font-fantasy font-bold px-1.5 py-0.5 bg-[#1c1308] text-[#fde047] border border-[#dfa86c]/60 shrink-0">
                        Tier {rank.tierRoman} [Grau {rank.subGradeRoman}]
                      </span>
                    </div>
                    <p className="text-[11px] text-[#c5b08f] font-sans mt-0.5 line-clamp-1 break-words [overflow-wrap:anywhere]" title={rank.label}>
                      {rank.label}
                    </p>
                  </div>
                  <div className="relative z-10 text-right font-mono shrink-0 pl-2">
                    <div className="text-sm text-[#fde047] font-bold">{masteryVal} pts</div>
                    <div className="text-[10px] text-[#a39171] font-fantasy">{rank.title}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ledger Audit Status Card */}
          {auditResult && (
            <div
              className={`relative p-3.5 border flex items-center justify-between font-mono text-xs overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)] ${
                auditResult.isConsistent
                  ? "bg-emerald-950/25 border-emerald-500/45 text-emerald-300"
                  : "bg-red-950/30 border-red-500/50 text-red-300"
              }`}
            >
              <GildedCorners
                size="xs"
                color={auditResult.isConsistent ? "#059669" : "#ef4444"}
                diamondColor={auditResult.isConsistent ? "#34d399" : "#f87171"}
                withInnerFrame={false}
              />
              <div className="relative z-10 flex items-center gap-2">
                {auditResult.isConsistent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold font-fantasy tracking-wide">
                    {auditResult.isConsistent
                      ? "Ledger Imutável 100% Íntegro"
                      : "Divergência Detectada no Ledger"}
                  </span>
                  <div className="text-[11px] text-[#c5b08f] mt-0.5">
                    Ledger: {auditResult.ledgerTotalXp} XP · Perfil: {auditResult.profileTotalXp} XP
                  </div>
                </div>
              </div>
              <div className="relative z-10 text-right text-[11px] text-[#c5b08f] font-fantasy hidden sm:block">
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
          <div className="p-6 text-center text-[#a39171] font-mono text-xs border border-dashed border-[#966422]/45 my-2">
            Nenhuma transação gravada no Ledger até o momento.
          </div>
        ) : (
          <div className="divide-y divide-[#966422]/30 font-mono text-xs my-2 overflow-x-auto">
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
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#0b1630]/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-1.5 border shrink-0 ${
                        isPositive
                          ? "bg-[#1c1308]/90 border-[#dfa86c]/55 text-[#fde047]"
                          : "bg-red-950/60 border-red-500/40 text-red-400"
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
                        <span className="text-[#f8ecd5] font-semibold break-words [overflow-wrap:anywhere]">{ev.description}</span>
                        {ev.area_id && <SystemBadge type="area" areaId={ev.area_id} size="sm" className="shrink-0" />}
                      </div>
                      <div className="text-[11px] text-[#a39171] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="shrink-0">{formattedDate}</span>
                        <span>·</span>
                        <span className="text-[#c5b08f] font-sans shrink-0">
                          {ev.entity_type === "mission" ? "Missão" : ev.entity_type}
                        </span>
                        {ev.mastery_amount !== 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[#dfa86c] shrink-0">
                              {ev.mastery_amount > 0 ? `+${ev.mastery_amount}` : ev.mastery_amount} Maestria
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span
                      className={`font-bold font-fantasy text-sm ${
                        isPositive ? "text-[#fde047]" : "text-red-400"
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
