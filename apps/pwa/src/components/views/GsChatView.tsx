import React from "react";
import { SystemPanel } from "../system/SystemPanel";
import { Bot, Volume2, ShieldCheck } from "lucide-react";

export const GsChatView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>GRANDE SÁBIO // COMUNICAÇÃO NEURAL</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">
            Conselheira autônoma e interface de processamento estratégico com IA.
          </p>
        </div>
      </div>

      <SystemPanel
        title="Canal Neural da Grande Sábio (G.S)"
        subtitle="Voz Oficial: Kore (Gemini AI) · Modo Offline: Web Speech API com normalizador fonético"
        glow
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 rounded-xl border border-cyan-500/20 font-mono text-xs space-y-2 text-slate-300">
            <div className="text-cyan-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              [RELATÓRIO DA G.S // STATUS OPERACIONAL]
            </div>
            <p className="leading-relaxed">
              &ldquo;Resposta: O canal de telemetria local está ativo. As diretrizes de projetos e a árvore acíclica de missões foram integradas à interface do usuário. Aguardando o módulo de chat com streaming e cartões de prévia na Fase 6.&rdquo;
            </p>
          </div>

          <div className="p-3.5 bg-[#0a152d]/70 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>REGRA DE OURO #1 DO SISTEMA</span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              A Grande Sábio nunca concede XP, níveis ou maestria diretamente. Todas as missões ou recompensas propostas pela IA no chat exigirão sua aprovação explícita em um <strong>Cartão de Prévia (Aceitar / Recusar / Ajustar)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg font-mono text-xs text-cyan-300">
            <Volume2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>
              Sintetizador de voz com modelo neural Kore e fallback offline pronto para as Fases 5 e 6.
            </span>
          </div>
        </div>
      </SystemPanel>
    </div>
  );
};
