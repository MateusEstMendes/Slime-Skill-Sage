import React from "react";
import { SystemPanel } from "../system/SystemPanel";
import { Sparkles, Cpu } from "lucide-react";

export const SkillsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span>ÁRVORE DE HABILIDADES // TENSURA</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">
            Registro das habilidades ativas e caminhos de evolução do Caçador.
          </p>
        </div>
      </div>

      <SystemPanel
        title="Protocolo de Evolução de Habilidades"
        subtitle="Regras de transição vigentes no Sistema v1"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase mb-1">
              [Tier 1] Habilidade Comum
            </div>
            <p className="text-xs text-slate-400">
              Desbloqueada ao atingir marcos iniciais ou via onboarding da Grande Sábio.
            </p>
            <div className="mt-3 text-[11px] font-mono text-cyan-400">Maestria: 0 / 100</div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-cyan-500/30 rounded-xl">
            <div className="text-xs font-mono font-bold text-cyan-300 uppercase mb-1">
              [Tier 2] Habilidade Extra
            </div>
            <p className="text-xs text-slate-400">
              Evolui automaticamente ao acumular 100 de maestria na habilidade.
            </p>
            <div className="mt-3 text-[11px] font-mono text-cyan-400">Maestria: 100 / 300</div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-purple-500/40 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <div className="text-xs font-mono font-bold text-purple-300 uppercase mb-1">
              [Tier 3] Habilidade Única
            </div>
            <p className="text-xs text-slate-400">
              Exige 300 maestria + 1 projeto concluído + Roleta do Destino (30% base, +15% por falha, cooldown 24h).
            </p>
            <div className="mt-3 text-[11px] font-mono text-purple-400">Teto de Roleta: 95%</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="text-xs font-mono text-slate-300">
            [VOZ DO MUNDO]: O motor puro de cálculo de maestria e ledger imutável será integrado na <strong>Fase 4</strong>, com a interface visual de habilidades e roleta animada nas <strong>Fases 5 e 10</strong>.
          </div>
        </div>
      </SystemPanel>
    </div>
  );
};
