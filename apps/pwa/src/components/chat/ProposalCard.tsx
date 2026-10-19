import React, { useState } from "react";
import {
  type Proposal,
  type ProposalStatus,
  type AreaCode,
} from "@slime-sage/shared";
import { GildedCorners } from "../system/GildedCorners";
import { SystemButton } from "../system/SystemButton";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  ListPlus,
  Edit3,
  Trash2,
  Brain,
  Dumbbell,
  Shield,
  Users,
  Flame,
  ArrowRight,
} from "lucide-react";

interface ProposalCardProps {
  proposal: Proposal;
  status?: ProposalStatus;
  onAccept: () => Promise<void> | void;
  onReject: () => Promise<void> | void;
  onAdjust?: () => void;
  disabled?: boolean;
}

const AREA_MAP: Record<AreaCode, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  INT: { label: "Inteligência", color: "#00f3ff", icon: Brain },
  FOR: { label: "Força", color: "#ff3366", icon: Dumbbell },
  DIS: { label: "Disciplina", color: "#ffaa00", icon: Shield },
  CRI: { label: "Criatividade", color: "#aa00ff", icon: Flame },
  SOC: { label: "Social", color: "#00ff88", icon: Users },
};

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  status = "pendente",
  onAccept,
  onReject,
  onAdjust,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (disabled || isProcessing || status !== "pendente") return;
    try {
      setIsProcessing(true);
      await onAccept();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (disabled || isProcessing || status !== "pendente") return;
    try {
      setIsProcessing(true);
      await onReject();
    } finally {
      setIsProcessing(false);
    }
  };

  const getProposalHeader = () => {
    switch (proposal.type) {
      case "create_project_tree":
        return {
          title: "PROPOSTA // ÁRVORE DE PROJETO",
          icon: <Sparkles className="w-4 h-4 text-[#dfa86c]" />,
          badgeColor: "border-[#dfa86c]/50 text-[#fde047]",
        };
      case "add_missions":
        return {
          title: "PROPOSTA // EXPANSÃO DE MISSÕES",
          icon: <ListPlus className="w-4 h-4 text-[#00f3ff]" />,
          badgeColor: "border-[#00f3ff]/50 text-[#00f3ff]",
        };
      case "update_mission":
        return {
          title: "PROPOSTA // REFINAMENTO DE MISSÃO",
          icon: <Edit3 className="w-4 h-4 text-[#ffaa00]" />,
          badgeColor: "border-[#ffaa00]/50 text-[#ffaa00]",
        };
      case "delete_mission":
        return {
          title: "PROPOSTA // EXPURGO DE MISSÃO",
          icon: <Trash2 className="w-4 h-4 text-rose-400" />,
          badgeColor: "border-rose-500/50 text-rose-400",
        };
    }
  };

  const header = getProposalHeader();

  return (
    <div className="relative mt-3 p-4 bg-[#060c1d] border border-[#dfa86c]/50 rounded-none shadow-[0_0_20px_rgba(223,168,108,0.12)] space-y-4 overflow-hidden">
      <GildedCorners size="sm" withRunes withCenterNotches color="#dfa86c" diamondColor="#fde047" />

      {/* Selo Rúnico Sagrado */}
      <div className="text-center font-mono text-[9px] tracking-[0.25em] text-[#dfa86c]/70 uppercase select-none">
        ✦ ᛋ ᚨ ᚲ ᚱ ᛖ ᛞ · ᛈ ᚱ ᛖ ᚡ ᛁ ᛖ ᚹ ✦
      </div>

      {/* Cabeçalho da Proposta */}
      <div className="flex items-center justify-between border-b border-[#dfa86c]/20 pb-2.5">
        <div className="flex items-center gap-2">
          {header.icon}
          <span className="font-fantasy text-xs md:text-sm font-bold text-[#f8ecd5] tracking-wider uppercase">
            {header.title}
          </span>
        </div>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 border ${header.badgeColor} uppercase tracking-widest bg-black/40`}
        >
          {status === "pendente" ? "Aguardando Vontade" : status.toUpperCase()}
        </span>
      </div>

      {/* Conteúdo Conforme Tipo da Proposta */}
      {proposal.type === "create_project_tree" && (
        <div className="space-y-3 font-sans">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-fantasy text-base font-bold text-[#fde047] tracking-wide">
                {proposal.project.title}
              </h4>
              {proposal.project.description && (
                <p className="text-xs text-[#c5b08f] mt-0.5">{proposal.project.description}</p>
              )}
            </div>
            {(() => {
              const AreaInfo = AREA_MAP[proposal.project.area_id];
              const AreaIcon = AreaInfo.icon;
              return (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono shrink-0"
                  style={{ borderColor: `${AreaInfo.color}60`, color: AreaInfo.color, backgroundColor: `${AreaInfo.color}15` }}
                >
                  <AreaIcon className="w-3.5 h-3.5" />
                  <span>{AreaInfo.label}</span>
                </div>
              );
            })()}
          </div>

          {/* Banner de Habilidade Alvo do Projeto (RPG Skill) */}
          {proposal.project.target_skill && (() => {
            const ts = proposal.project.target_skill;
            const attr = (ts.area_id || proposal.project.area_id) as AreaCode;
            const attrInfo = AREA_MAP[attr] || AREA_MAP.INT;
            return (
              <div
                className="p-2 border flex items-center justify-between text-xs font-mono bg-black/60"
                style={{ borderColor: ts.is_new ? `${attrInfo.color}70` : "rgba(223, 168, 108, 0.6)" }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: attrInfo.color }} />
                  <div>
                    <span className="text-[10px] uppercase text-[#c5b08f] block leading-tight">
                      Habilidade Alvo do Projeto (RPG):
                    </span>
                    <span className="font-fantasy font-bold text-[#f8ecd5] tracking-wide text-xs">
                      {ts.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {ts.is_new ? (
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border"
                      style={{
                        borderColor: `${attrInfo.color}80`,
                        color: attrInfo.color,
                        backgroundColor: `${attrInfo.color}20`,
                      }}
                    >
                      [NOVA · {attr}]
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-[#dfa86c] bg-[#dfa86c]/20 border border-[#dfa86c]/50">
                      [EXISTENTE]
                    </span>
                  )}
                  <span className="text-[10px] text-[#fde047] font-mono">+10 Mst/missão</span>
                </div>
              </div>
            );
          })()}

          {/* Lista de Missões Sequenciadas */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono uppercase text-[#dfa86c] tracking-wider flex items-center gap-1">
              <span>Árvore de Missões Propostas:</span>
              <span className="text-xs font-bold text-[#fde047]">({proposal.missions.length})</span>
            </span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {proposal.missions.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#040814]/80 border border-[#dfa86c]/25 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-fantasy text-[#f8ecd5] flex items-center gap-1.5 break-words">
                        <span className="text-[10px] font-mono text-[#dfa86c]/70 shrink-0">{idx + 1}.</span>
                        <span className="break-words [overflow-wrap:anywhere]">{m.title}</span>
                      </div>
                      {m.depends_on_titles && m.depends_on_titles.length > 0 && (
                        <div className="text-[10px] font-mono text-[#c5b08f]/80 flex items-center gap-1 mt-0.5 truncate">
                          <ArrowRight className="w-2.5 h-2.5 text-[#dfa86c] shrink-0" />
                          <span className="truncate">Requer: {m.depends_on_titles.join(", ")}</span>
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[#fde047] px-1.5 py-0.5 bg-[#dfa86c]/15 border border-[#dfa86c]/30 shrink-0">
                      +{m.xp_reward ?? 35} XP
                    </span>
                  </div>

                  {/* Badges de Habilidades ([EXISTENTE] / [NOVA · ATTR]) */}
                  {m.skills && m.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#dfa86c]/15">
                      {m.skills.map((s, sIdx) => {
                        const attr = (s.area_id || proposal.project.area_id) as AreaCode;
                        const attrInfo = AREA_MAP[attr] || AREA_MAP.INT;
                        return (
                          <div
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border rounded-none bg-black/50"
                            style={{
                              borderColor: s.is_new ? `${attrInfo.color}65` : "rgba(223, 168, 108, 0.45)",
                            }}
                          >
                            <span className="text-[#f8ecd5] font-semibold">{s.name}</span>
                            {s.is_new ? (
                              <span
                                className="px-1 py-[1px] text-[9px] font-bold tracking-wider uppercase"
                                style={{
                                  color: attrInfo.color,
                                  backgroundColor: `${attrInfo.color}20`,
                                }}
                              >
                                [NOVA · {attr}]
                              </span>
                            ) : (
                              <span className="px-1 py-[1px] text-[9px] font-bold tracking-wider uppercase text-[#dfa86c] bg-[#dfa86c]/15">
                                [EXISTENTE]
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {proposal.type === "add_missions" && (
        <div className="space-y-3 font-sans">
          {proposal.project_title && (
            <div className="text-xs font-mono text-[#c5b08f]">
              Projeto Alvo: <strong className="text-[#fde047]">{proposal.project_title}</strong>
            </div>
          )}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {proposal.missions.map((m, idx) => (
              <div
                key={idx}
                className="p-2 bg-[#040814]/80 border border-[#dfa86c]/25 flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-fantasy text-[#f8ecd5] truncate block">{m.title}</span>
                    {m.description && <p className="text-[10px] text-[#c5b08f] truncate">{m.description}</p>}
                  </div>
                  <span className="font-mono text-[10px] text-[#fde047] px-1.5 py-0.5 bg-[#dfa86c]/15 border border-[#dfa86c]/30 shrink-0">
                    +{m.xp_reward ?? 35} XP
                  </span>
                </div>
                {m.skills && m.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#dfa86c]/15">
                    {m.skills.map((s, sIdx) => {
                      const attr = (s.area_id || "INT") as AreaCode;
                      return (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border border-[#dfa86c]/35 text-[#f8ecd5] bg-black/40"
                        >
                          <span>{s.name}</span>
                          <span className="text-[9px] text-[#fde047]">
                            {s.is_new ? `[NOVA · ${attr}]` : "[EXISTENTE]"}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {proposal.type === "update_mission" && (
        <div className="space-y-2 font-mono text-xs text-[#c5b08f] bg-[#040814]/80 p-2.5 border border-[#dfa86c]/25">
          {proposal.current_title && (
            <div>
              Missão Original: <span className="text-[#f8ecd5]">{proposal.current_title}</span>
            </div>
          )}
          {proposal.updates.title && (
            <div>
              Novo Título: <span className="text-[#fde047]">{proposal.updates.title}</span>
            </div>
          )}
          {proposal.updates.xp_reward !== undefined && (
            <div>
              Novo XP: <span className="text-[#00ff88]">+{proposal.updates.xp_reward} XP</span>
            </div>
          )}
          {proposal.updates.description && (
            <div>
              Novo Critério: <span className="text-[#e8d5b5]">{proposal.updates.description}</span>
            </div>
          )}
        </div>
      )}

      {proposal.type === "delete_mission" && (
        <div className="p-2.5 bg-rose-950/20 border border-rose-500/40 font-mono text-xs text-rose-300 space-y-1">
          <div>
            Remover Missão: <strong className="text-white">{proposal.mission_title}</strong>
          </div>
          <p className="text-[11px] text-rose-300/80">
            Atenção: A remoção excluirá esta missão da árvore.
          </p>
        </div>
      )}

      {/* Justificativa Estratégica da G.S */}
      {proposal.explanation && (
        <div className="p-2.5 bg-[#030712]/90 border border-[#dfa86c]/20 font-mono text-xs text-[#e8d5b5]/90 leading-relaxed">
          <span className="text-[#dfa86c] font-bold">[ANÁLISE ESTRATÉGICA]</span> {proposal.explanation}
        </div>
      )}

      {/* Ações / Status */}
      {status === "pendente" && (
        <div className="pt-2 border-t border-[#dfa86c]/20 flex flex-wrap items-center gap-2">
          <SystemButton
            variant="primary"
            onClick={handleAccept}
            disabled={disabled || isProcessing}
            className="flex-1 py-1.5 text-xs font-bold"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#fde047]" />
            <span>{isProcessing ? "Executando..." : "Aceitar Decreto"}</span>
          </SystemButton>

          <SystemButton
            variant="danger"
            onClick={handleReject}
            disabled={disabled || isProcessing}
            className="py-1.5 px-3 text-xs"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span>Recusar</span>
          </SystemButton>

          {onAdjust && (
            <SystemButton
              variant="secondary"
              onClick={onAdjust}
              disabled={disabled || isProcessing}
              className="py-1.5 px-3 text-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1 text-[#00f3ff]" />
              <span>Pedir Ajuste</span>
            </SystemButton>
          )}
        </div>
      )}

      {status === "aprovada" && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/60 text-emerald-300 font-mono text-xs text-center tracking-wider uppercase font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>✦ DECRETO APROVADO E EXECUTADO NO SISTEMA ✦</span>
        </div>
      )}

      {status === "rejeitada" && (
        <div className="p-2 bg-stone-900/60 border border-stone-600/50 text-[#c5b08f] font-mono text-xs text-center tracking-wider uppercase flex items-center justify-center gap-2">
          <XCircle className="w-4 h-4 text-stone-400" />
          <span>✦ PROPOSTA ARQUIVADA PELO CAÇADOR ✦</span>
        </div>
      )}
    </div>
  );
};
