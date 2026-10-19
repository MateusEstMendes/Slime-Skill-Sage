import React, { useState, useEffect, useCallback } from "react";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
import { SystemModal } from "../system/SystemModal";
import { GildedCorners } from "../system/GildedCorners";
import { SystemInput, SystemSelect } from "../system/SystemFormControls";
import { BASE_AREAS, type Skill, type AreaCode, type XpEvent } from "@slime-sage/shared";
import { gameService } from "../../services/gameService";
import { projectRepository } from "../../services/projectRepository";
import { Sparkles, Plus, History, Filter, ArrowUpRight, Award, Zap } from "lucide-react";

export interface SkillsViewProps {
  isActive?: boolean;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ isActive }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  // New Skill Modal State
  const [isNewSkillModalOpen, setIsNewSkillModalOpen] = useState<boolean>(false);
  const [newSkillName, setNewSkillName] = useState<string>("");
  const [newSkillArea, setNewSkillArea] = useState<AreaCode>("INT");
  const [newSkillDesc, setNewSkillDesc] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // History Modal State
  const [historyModalSkill, setHistoryModalSkill] = useState<Skill | null>(null);
  const [skillHistoryEvents, setSkillHistoryEvents] = useState<XpEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      const allSkills = await gameService.getSkills();
      if (isMountedRef.current) {
        setSkills(allSkills);
      }
    } catch {
      // Ignore
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSkills();
    const unsubscribeGame = gameService.subscribeToGameEvents(() => {
      void loadSkills();
    });
    const unsubscribeRepo = projectRepository.subscribe(() => {
      void loadSkills();
    });
    return () => {
      unsubscribeGame();
      unsubscribeRepo();
    };
  }, [loadSkills]);

  useEffect(() => {
    if (isActive) {
      void loadSkills();
    }
  }, [isActive, loadSkills]);

  // Filter skills by area
  const filteredSkills = skills.filter((s) => {
    if (selectedArea === "ALL") return true;
    return s.area_id === selectedArea;
  });

  const handleOpenCreateSkill = () => {
    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillArea("INT");
    setFormError("");
    setIsNewSkillModalOpen(true);
  };

  const handleCreateSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) {
      setFormError("Informe o nome da habilidade.");
      return;
    }

    try {
      await gameService.createSkill({
        name: newSkillName.trim(),
        areaId: newSkillArea,
        description: newSkillDesc.trim() || undefined,
      });
      setIsNewSkillModalOpen(false);
      await loadSkills();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar habilidade.");
    }
  };

  const handleOpenHistory = async (skill: Skill) => {
    setHistoryModalSkill(skill);
    setHistoryLoading(true);
    try {
      const history = await gameService.getSkillHistory(skill.id);
      if (isMountedRef.current) {
        setSkillHistoryEvents(history);
      }
    } catch {
      // Ignore
    } finally {
      if (isMountedRef.current) {
        setHistoryLoading(false);
      }
    }
  };

  const areaOptions = [
    { value: "ALL", label: `Todas as Áreas (${skills.length})` },
    ...BASE_AREAS.map((a) => {
      const count = skills.filter((s) => s.area_id === a.code).length;
      return {
        value: a.code,
        label: `${a.name} [${a.code}] (${count})`,
      };
    }),
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#dfa86c]" />
            <span>ÁRVORE DE HABILIDADES // TENSURA</span>
          </h2>
          <p className="text-xs md:text-sm text-[#c5b08f] font-mono mt-0.5">
            Registro das habilidades despertadas, progressão de maestria e evolução de tier.
          </p>
        </div>

        <SystemButton
          variant="primary"
          size="sm"
          onClick={handleOpenCreateSkill}
          icon={<Plus className="w-4 h-4" />}
        >
          Adquirir Habilidade
        </SystemButton>
      </div>

      {/* Filter Tabs / Bar by Area */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none font-fantasy text-xs">
        <div className="flex items-center gap-1 text-[#c5b08f] mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-[#dfa86c]" />
          <span className="text-[11px] uppercase tracking-wider">Filtro:</span>
        </div>

        {areaOptions.map((opt) => {
          const isActive = selectedArea === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedArea(opt.value)}
              className={`px-3 py-1.5 rounded-none border transition-colors shrink-0 text-xs font-fantasy tracking-wider uppercase ${
                isActive
                  ? "bg-[#241909]/95 border-[#dfa86c] text-[#fde047] shadow-[0_0_12px_rgba(223,168,108,0.28)]"
                  : "bg-[#060e20]/80 border-[#966422]/45 text-[#a39171] hover:text-[#f3e5cc] hover:border-[#c89b55]/60"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Skills List Grid */}
      {loading ? (
        <div className="p-12 text-center font-fantasy tracking-widest text-xs text-[#dfa86c] animate-pulse">
          Consultando a Árvore de Habilidades...
        </div>
      ) : filteredSkills.length === 0 ? (
        <SystemPanel title="Nenhuma Habilidade Encontrada">
          <div className="p-8 text-center font-mono text-xs text-[#c5b08f] space-y-3">
            <p>Nenhuma habilidade cadastrada para a área selecionada.</p>
            <p className="text-[#a39171] text-[11px]">
              Complete missões vinculadas a habilidades ou adquira uma habilidade manualmente pelo botão acima.
            </p>
            <SystemButton
              variant="secondary"
              size="sm"
              onClick={handleOpenCreateSkill}
              className="mt-2"
            >
              Despertar Primeira Habilidade
            </SystemButton>
          </div>
        </SystemPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill) => {
            const isComum = skill.tier === "comum";
            const isExtra = skill.tier === "extra";
            const isUnica = skill.tier === "unica";

            const maxThreshold = isComum ? 100 : 300;
            const progressPercent = Math.min(
              100,
              Math.round((skill.mastery / maxThreshold) * 100)
            );

            const tierColor = isUnica
              ? "text-purple-300 border-purple-500/60 bg-purple-950/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
              : isExtra
              ? "text-[#fde047] border-[#dfa86c]/80 bg-[#261a08]/90 shadow-[0_0_15px_rgba(253,224,71,0.25)]"
              : "text-[#e8d5b5] border-[#966422]/65 bg-[#120d06]/90";

            return (
              <div
                key={skill.id}
                data-testid={`skill-card-${skill.id}`}
                className="group relative bg-[#060e20]/95 border border-[#c89b55]/55 hover:border-[#fde047]/80 transition-all rounded-none p-[18px] flex flex-col justify-between space-y-5 min-w-0 overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.65)]"
              >
                <GildedCorners
                  size="sm"
                  color={isUnica ? "#a855f7" : isExtra ? "#dfa86c" : "#966422"}
                  diamondColor={isUnica ? "#c084fc" : isExtra ? "#fde047" : "#dfa86c"}
                  glow={isExtra || isUnica}
                  withRunes={true}
                  withCenterNotches={true}
                  runicTop={isUnica ? "✦ ᚢ ᚾ ᛁ ᚲ ᚨ ✦" : isExtra ? "✦ ᛖ ᛪ ᛏ ᚱ ᚨ ✦" : "ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ"}
                  runicBottom={isUnica ? "ᚨ ᚱ ᚲ ᚨ ᚾ ᚢ ᛗ" : isExtra ? "ᛈ ᛟ ᚹ ᛖ ᚱ" : "ᛋ ᛚ ᛁ ᛗ ᛖ · ᛋ ᚨ ᚷ ᛖ"}
                />

                {/* Top Badge & Tier */}
                <div className="relative z-10 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                    <span
                      className={`text-[10px] font-fantasy font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-none border shrink-0 ${tierColor}`}
                    >
                      {skill.tier === "extra" ? "Habilidade Extra" : skill.tier === "unica" ? "Habilidade Única" : "Habilidade Comum"}
                    </span>
                    <SystemBadge type="area" areaId={skill.area_id} size="sm" className="shrink-0" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase break-words [overflow-wrap:anywhere]">
                      {skill.name}
                    </h3>
                    <p className="text-xs text-[#c5b08f] font-sans mt-0.5 line-clamp-2 break-words [overflow-wrap:anywhere]">
                      {skill.description}
                    </p>
                  </div>
                </div>

                {/* Mastery Progress Bar */}
                <div className="relative z-10 space-y-1.5 pt-2 border-t border-[#966422]/40 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#c5b08f] font-fantasy uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#dfa86c]" />
                      Maestria
                    </span>
                    <span className="text-[#fde047] font-bold">
                      {skill.mastery} / {maxThreshold} pts ({progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full bg-[#040814] h-2 overflow-hidden border border-[#966422]/60 p-[1px]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isUnica
                          ? "bg-gradient-to-r from-purple-600 via-purple-400 to-pink-300"
                          : isExtra
                          ? "bg-gradient-to-r from-[#b8860b] via-[#fde047] to-[#fffbeb]"
                          : "bg-gradient-to-r from-[#966422] via-[#dfa86c] to-[#fde047]"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Evolution Hint */}
                  <div className="text-[10px] text-[#a39171] pt-0.5">
                    {isComum && (
                      <span>
                        Faltam <strong className="text-[#fde047]">{Math.max(0, 100 - skill.mastery)} pts</strong> para evoluir para <span className="text-[#dfa86c]">Habilidade Extra</span>.
                      </span>
                    )}
                    {isExtra && (
                      <span>
                        Acumule 300 pts + 1 projeto concluído para habilitar a Roleta da <span className="text-purple-400">Habilidade Única</span>.
                      </span>
                    )}
                    {isUnica && (
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-400" />
                        Grau Máximo Desperto
                      </span>
                    )}
                  </div>
                </div>

                {/* History Button */}
                <div className="relative z-10 pt-2 flex justify-end">
                  <SystemButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenHistory(skill)}
                    icon={<History className="w-3.5 h-3.5 text-[#dfa86c]" />}
                    className="text-xs"
                  >
                    Histórico de Missões
                  </SystemButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Protocol Reference Info Box */}
      <SystemPanel
        title="Protocolo de Evolução de Habilidades // Voz do Mundo"
        subtitle="Regras de transição vigentes no Sistema v1"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2 font-mono text-xs">
          <div className="relative p-3.5 bg-[#040814]/85 border border-[#966422]/50 space-y-1 overflow-hidden shadow-[inset_0_0_8px_rgba(150,100,34,0.06)]">
            <GildedCorners size="xs" color="#966422" diamondColor="#dfa86c" withInnerFrame={false} />
            <div className="relative z-10 font-bold font-fantasy text-[#e8d5b5] uppercase tracking-wider">[Tier 1] Comum</div>
            <p className="relative z-10 text-[#c5b08f] text-[11px] font-sans">
              Desbloqueada manualmente ou via onboarding. Maestria varia de 0 a 100.
            </p>
          </div>
          <div className="relative p-3.5 bg-[#040814]/85 border border-[#dfa86c]/60 space-y-1 overflow-hidden shadow-[inset_0_0_8px_rgba(223,168,108,0.08)]">
            <GildedCorners size="xs" color="#dfa86c" diamondColor="#fde047" withInnerFrame={false} />
            <div className="relative z-10 font-bold font-fantasy text-[#fde047] uppercase tracking-wider">[Tier 2] Extra</div>
            <p className="relative z-10 text-[#c5b08f] text-[11px] font-sans">
              Evolui automaticamente ao cruzar 100 de maestria. Teto de 300 de maestria.
            </p>
          </div>
          <div className="relative p-3.5 bg-[#040814]/85 border border-purple-500/50 space-y-1 overflow-hidden shadow-[inset_0_0_8px_rgba(168,85,247,0.08)]">
            <GildedCorners size="xs" color="#a855f7" diamondColor="#c084fc" withInnerFrame={false} />
            <div className="relative z-10 font-bold font-fantasy text-purple-300 uppercase tracking-wider">[Tier 3] Única</div>
            <p className="relative z-10 text-[#c5b08f] text-[11px] font-sans">
              Exige 300 maestria + 1 projeto concluído + Roleta do Destino (Fase 10).
            </p>
          </div>
        </div>
      </SystemPanel>

      {/* Modal: Adquirir Nova Habilidade */}
      <SystemModal
        isOpen={isNewSkillModalOpen}
        onClose={() => setIsNewSkillModalOpen(false)}
        title="Adquirir Nova Habilidade"
        subtitle="Voz do Mundo: Inscrição de Habilidade Comum"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSkillSubmit} className="space-y-4 font-mono">
          <SystemInput
            label="Nome da Habilidade"
            placeholder="Ex: Análise Analítica, Resiliência Física..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            required
            autoFocus
          />

          <SystemSelect
            label="Área Primária de Atributo"
            value={newSkillArea}
            onChange={(e) => setNewSkillArea(e.target.value as AreaCode)}
            options={BASE_AREAS.map((a) => ({
              value: a.code,
              label: `${a.name} [${a.code}]`,
            }))}
          />

          <SystemInput
            label="Descrição / Efeito (Opcional)"
            placeholder="Descreva o propósito e escopo desta habilidade..."
            value={newSkillDesc}
            onChange={(e) => setNewSkillDesc(e.target.value)}
          />

          {formError && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#966422]/40">
            <SystemButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewSkillModalOpen(false)}
            >
              Cancelar
            </SystemButton>
            <SystemButton
              type="submit"
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-4 h-4" />}
            >
              Despertar Habilidade
            </SystemButton>
          </div>
        </form>
      </SystemModal>

      {/* Modal: Histórico de Missões da Habilidade */}
      <SystemModal
        isOpen={historyModalSkill !== null}
        onClose={() => setHistoryModalSkill(null)}
        title={historyModalSkill ? `Histórico // ${historyModalSkill.name}` : "Histórico"}
        subtitle="Registro de transações no Ledger imutável vinculadas a esta habilidade"
        maxWidth="lg"
      >
        {historyLoading ? (
          <div className="p-8 text-center text-xs text-[#dfa86c] font-fantasy tracking-widest animate-pulse">
            Carregando transações do Ledger...
          </div>
        ) : skillHistoryEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#a39171] font-mono border border-dashed border-[#966422]/45 my-2">
            Nenhuma missão ou evento registrado para esta habilidade até o momento.
          </div>
        ) : (
          <div className="divide-y divide-[#966422]/30 font-mono text-xs my-2 max-h-[360px] overflow-y-auto">
            {skillHistoryEvents.map((ev) => {
              const formattedDate = new Date(ev.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={ev.id}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#0b1630]/50 min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 bg-[#1c1308]/90 border border-[#dfa86c]/55 text-[#fde047] shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[#f8ecd5] font-semibold break-words [overflow-wrap:anywhere]">{ev.description}</div>
                      <div className="text-[11px] text-[#a39171] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="shrink-0">{formattedDate}</span>
                        <span>·</span>
                        <span className="text-[#c5b08f] shrink-0">
                          {ev.entity_type === "mission" ? "Missão Concluída" : ev.entity_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="text-[#fde047] font-bold">
                      +{ev.mastery_amount} Maestria
                    </div>
                    <div className="text-[10px] text-[#c5b08f]">
                      +{ev.xp_amount} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-[#966422]/40 mt-2">
          <SystemButton
            variant="secondary"
            size="sm"
            onClick={() => setHistoryModalSkill(null)}
          >
            Fechar Histórico
          </SystemButton>
        </div>
      </SystemModal>
    </div>
  );
};
