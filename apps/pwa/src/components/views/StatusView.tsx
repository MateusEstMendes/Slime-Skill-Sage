import React from "react";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { BASE_AREAS } from "@slime-sage/shared";
import { Activity, Database } from "lucide-react";

export const StatusView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>PAINEL DE ATRIBUTOS // SOLO LEVELING</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">
            Métricas de status do Caçador em sincronização com o Ledger Imutável.
          </p>
        </div>
      </div>

      {/* Hunter Profile Header Preview */}
      <SystemPanel
        title="Perfil do Caçador"
        subtitle="Rank Geral: E · Nível Inicial: 1"
        glow
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 text-center font-mono">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Nível</div>
            <div className="text-xl font-bold text-cyan-400">1</div>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Total XP</div>
            <div className="text-xl font-bold text-cyan-300">0</div>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Streak Diário</div>
            <div className="text-xl font-bold text-amber-400">0 dias</div>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase">Classe</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 truncate">Aspirante</div>
          </div>
        </div>
      </SystemPanel>

      {/* 5 Base Areas */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
          5 Áreas Base de Atributos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BASE_AREAS.map((area) => (
            <div
              key={area.id}
              className="p-3.5 bg-[#0a1224]/80 border border-cyan-500/20 rounded-xl flex items-center justify-between"
            >
              <div className="space-y-1">
                <SystemBadge type="area" areaId={area.code} size="sm" />
                <p className="text-xs text-slate-400 font-sans mt-0.5">{area.description}</p>
              </div>
              <div className="text-right font-mono shrink-0 pl-3">
                <div className="text-xs text-cyan-300 font-bold">Nível {area.level}</div>
                <div className="text-[10px] text-slate-500">{area.current_xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-lg flex items-center gap-3 font-mono text-xs text-slate-300">
        <Database className="w-5 h-5 text-cyan-400 shrink-0" />
        <div>
          [AVISO DO SISTEMA]: O motor puro de XP, atributos e auditoria total via ledger imutável (`xp_event`) será consolidado na <strong>Fase 4</strong>.
        </div>
      </div>
    </div>
  );
};
