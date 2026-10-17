import React from "react";
import { SystemPanel } from "../system/SystemPanel";
import { GildedCorners } from "../system/GildedCorners";
import { Bot, Volume2, ShieldCheck } from "lucide-react";

export const GsChatView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#dfa86c]" />
            <span>GRANDE SÁBIO // COMUNICAÇÃO NEURAL</span>
          </h2>
          <p className="text-xs md:text-sm text-[#c5b08f] font-mono mt-0.5">
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
          <div className="relative p-4 bg-[#040814]/90 border border-[#c89b55]/55 font-mono text-xs space-y-2 text-[#e8d5b5] overflow-hidden shadow-[inset_0_0_12px_rgba(223,168,108,0.05)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[#fde047] font-fantasy font-bold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rotate-45 bg-[#fde047] animate-pulse" />
              [RELATÓRIO DA G.S // STATUS OPERACIONAL]
            </div>
            <p className="relative z-10 leading-relaxed">
              &ldquo;Resposta: O canal de telemetria local está ativo. As diretrizes de projetos e a árvore acíclica de missões foram integradas à interface do usuário. Aguardando o módulo de chat com streaming e cartões de prévia na Fase 6.&rdquo;
            </p>
          </div>

          <div className="relative p-3.5 bg-[#081329]/80 border border-emerald-500/40 space-y-2 overflow-hidden shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]">
            <GildedCorners size="xs" color="#059669" diamondColor="#34d399" withInnerFrame={false} />
            <div className="relative z-10 text-xs font-fantasy font-bold tracking-wider text-[#f8ecd5] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>REGRA DE OURO #1 DO SISTEMA</span>
            </div>
            <p className="relative z-10 text-xs text-[#c5b08f] font-sans leading-relaxed">
              A Grande Sábio nunca concede XP, níveis ou maestria diretamente. Todas as missões ou recompensas propostas pela IA no chat exigirão sua aprovação explícita em um <strong>Cartão de Prévia (Aceitar / Recusar / Ajustar)</strong>.
            </p>
          </div>

          <div className="relative flex items-center gap-3 p-3 bg-[#1c1308]/85 border border-[#dfa86c]/60 font-mono text-xs text-[#fde047] overflow-hidden shadow-[0_0_15px_rgba(223,168,108,0.1)]">
            <GildedCorners size="xs" color="#dfa86c" diamondColor="#fde047" withInnerFrame={false} />
            <Volume2 className="relative z-10 w-4 h-4 shrink-0 text-[#dfa86c]" />
            <span className="relative z-10">
              Sintetizador de voz com modelo neural Kore e fallback offline pronto para as Fases 5 e 6.
            </span>
          </div>
        </div>
      </SystemPanel>
    </div>
  );
};
