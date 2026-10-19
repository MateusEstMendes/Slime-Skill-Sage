import React, { useState, useEffect, useCallback } from "react";
import { type Project, type Mission, type Profile } from "@slime-sage/shared";
import { projectRepository } from "../../services/projectRepository";
import { gameService } from "../../services/gameService";
import { calculateLevelFromTotalXp } from "@slime-sage/game";
import { logger } from "../../services/logger";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
import { GildedCorners } from "../system/GildedCorners";
import { MissionCard } from "../projects/MissionCard";
import {
  FolderGit2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Plus,
  Target,
  Zap,
} from "lucide-react";

export interface HomeViewProps {
  onNavigateToProjects: (projectId?: string) => void;
  onNavigateToGs: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToProjects,
  onNavigateToGs,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [nextMission, setNextMission] = useState<Mission | null>(null);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [totalAvailableMissions, setTotalAvailableMissions] = useState(0);
  const [totalDoneMissions, setTotalDoneMissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      const [allProjects, prof] = await Promise.all([
        projectRepository.listProjects(),
        gameService.getProfile(),
      ]);
      setProfile(prof);
      setTotalProjectsCount(allProjects.length);

      const activeProjects = allProjects.filter((p) => p.status === "ativo");
      const current = activeProjects[0] || allProjects[0] || null;
      setActiveProject(current);

      const allMissions = await projectRepository.listMissions();
      const available = allMissions.filter((m) => m.status === "disponivel");
      const done = allMissions.filter((m) => m.status === "feita");

      setTotalAvailableMissions(available.length);
      setTotalDoneMissions(done.length);

      if (current) {
        const projectMissions = await projectRepository.listMissions({
          projectId: current.id,
        });
        const next = projectMissions.find((m) => m.status === "disponivel") || null;
        setNextMission(next);
      } else {
        setNextMission(null);
      }
    } catch (err) {
      void logger.error("db", "Falha ao carregar dados da Home", { err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [allProjects, prof] = await Promise.all([
          projectRepository.listProjects(),
          gameService.getProfile(),
        ]);
        if (!isMounted) return;
        setProfile(prof);
        setTotalProjectsCount(allProjects.length);

        const activeProjects = allProjects.filter((p) => p.status === "ativo");
        const current = activeProjects[0] || allProjects[0] || null;
        setActiveProject(current);

        const allMissions = await projectRepository.listMissions();
        if (!isMounted) return;
        const available = allMissions.filter((m) => m.status === "disponivel");
        const done = allMissions.filter((m) => m.status === "feita");

        setTotalAvailableMissions(available.length);
        setTotalDoneMissions(done.length);

        if (current) {
          const projectMissions = await projectRepository.listMissions({
            projectId: current.id,
          });
          if (!isMounted) return;
          const next = projectMissions.find((m) => m.status === "disponivel") || null;
          setNextMission(next);
        } else {
          setNextMission(null);
        }
      } catch (err) {
        void logger.error("db", "Falha ao carregar dados da Home", { err });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchHomeData();

    const unsubscribeGame = gameService.subscribeToGameEvents(() => {
      if (isMounted) {
        void loadHomeData();
      }
    });

    const unsubscribeRepo = projectRepository.subscribe(() => {
      if (isMounted) {
        void loadHomeData();
      }
    });

    return () => {
      isMounted = false;
      unsubscribeGame();
      unsubscribeRepo();
    };
  }, [loadHomeData]);

  const handleCompleteMission = async (missionId: string) => {
    try {
      setActionLoading(true);
      await gameService.completeMission(missionId);
      await loadHomeData();
    } catch (err) {
      void logger.error("game", "Erro ao concluir missão na Home", { err, missionId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenMission = async (missionId: string) => {
    try {
      setActionLoading(true);
      await gameService.undoMissionCompletion(missionId);
      await loadHomeData();
    } catch (err) {
      void logger.error("game", "Erro ao desfazer missão na Home", { err, missionId });
    } finally {
      setActionLoading(false);
    }
  };

  const levelProgress = calculateLevelFromTotalXp(profile?.total_xp ?? 0);

  // Transliteração simples para alfabeto Rúnico Nórdico (Elder Futhark)
  const toElderFuthark = (text: string): string => {
    const runeMap: Record<string, string> = {
      a: "ᚨ", b: "ᛒ", c: "ᚲ", d: "ᛞ", e: "ᛖ", f: "ᚠ", g: "ᚷ", h: "ᚺ",
      i: "ᛁ", j: "ᛃ", k: "ᚲ", l: "ᛚ", m: "ᛗ", n: "ᚾ", o: "ᛟ", p: "ᛈ",
      q: "ᚲ", r: "ᚱ", s: "ᛋ", t: "ᛏ", u: "ᚢ", v: "ᚹ", w: "ᚹ", x: "ᛪ",
      y: "ᛁ", z: "ᛉ",
    };
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split("")
      .map((char) => runeMap[char] || (char === " " ? "·" : char))
      .filter((char) => char.trim().length > 0)
      .join(" ");
  };

  const chosenRunicName = profile?.name ? toElderFuthark(profile.name) : "ᚱ ᛁ ᛗ ᚢ ᚱ ᚢ · ᛏ ᛖ ᛗ ᛈ ᛖ ᛋ ᛏ";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-fantasy tracking-[0.2em] text-[#dfa86c] uppercase flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rotate-45 bg-[#fde047]" />
            <span>[ INTERFACE DE COMANDO // VISÃO GERAL ]</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase">
            PAINEL DO SISTEMA
          </h2>
        </div>

        <SystemButton
          variant="primary"
          size="sm"
          onClick={onNavigateToGs}
          aria-label="Consultar Grande Sábio"
          icon={<Zap className="w-3.5 h-3.5 text-[#fde047]" />}
        >
          Consultar G.S
        </SystemButton>
      </div>

      {/* Chosen Status Banner (Level & XP) */}
      <div className="group relative p-4 bg-gradient-to-r from-[#050c1a] via-[#0a162f] to-[#050c1a] border border-[#c89b55]/60 rounded-none shadow-[0_0_24px_rgba(223,168,108,0.14)] font-mono overflow-hidden">
        <GildedCorners
          size="md"
          withCenterNotches
          withRunes
          runicTop={chosenRunicName}
          runicBottom="ᚾ ᛁ ᚹ ᛖ ᛚ · ᛋ ᛁ ᛋ ᛏ ᛖ ᛗ ᚨ"
        />
        <div className="relative z-10 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 bg-[#1c1308] border border-[#dfa86c] flex items-center justify-center font-bold font-fantasy text-[#fde047] text-sm shrink-0 shadow-[0_0_12px_rgba(223,168,108,0.3)]">
              L{levelProgress.level}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase truncate">
                  {profile?.name ?? "Rimuru Tempest"}
                </span>
                {profile?.race && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#140f08] border border-[#dfa86c]/60 text-[#fde047] uppercase shrink-0">
                    {profile.race}
                  </span>
                )}
                {profile?.rank_threat && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#040814] border border-[#00f3ff]/50 text-[#00f3ff] uppercase shrink-0">
                    {profile.rank_threat}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#dfa86c] font-fantasy tracking-wide truncate">
                {profile?.title ?? "Aspirante a Desperto"}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <div className="text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">XP Acumulado</div>
            <div className="text-sm font-bold text-[#fde047]">
              {profile?.total_xp ?? 0} <span className="text-[10px] text-[#a39171]">XP</span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="relative z-10 space-y-1">
          <div className="flex justify-between text-[10px] text-[#c5b08f]">
            <span className="font-fantasy uppercase tracking-wider">Progresso do Nível {levelProgress.level}</span>
            <span className="text-[#fde047]">
              {levelProgress.currentXp} / {levelProgress.xpForNextLevel} XP ({levelProgress.progressPercentage}%)
            </span>
          </div>
          <div className="w-full bg-[#040814] h-2 overflow-hidden border border-[#c89b55]/50 p-[1px]">
            <div
              className="bg-gradient-to-r from-[#966422] via-[#dfa86c] to-[#fde047] h-full transition-all duration-500 shadow-[0_0_8px_rgba(253,224,71,0.65)]"
              style={{ width: `${levelProgress.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3 font-mono">
        <div className="relative p-3 bg-[#060e20]/90 border border-[#c89b55]/45 rounded-none shadow-[0_0_15px_rgba(223,168,108,0.08)] min-w-0 overflow-hidden">
          <GildedCorners size="xs" withInnerFrame={false} />
          <div className="relative z-10 text-[10px] text-[#c5b08f] font-fantasy uppercase tracking-wider flex items-center gap-1.5 mb-1 truncate">
            <FolderGit2 className="w-3.5 h-3.5 text-[#dfa86c] shrink-0" />
            <span className="truncate">Projetos</span>
          </div>
          <div className="relative z-10 text-lg md:text-xl font-bold font-fantasy text-[#f8ecd5] truncate">
            {totalProjectsCount}
          </div>
        </div>

        <div className="relative p-3 bg-[#140f08]/85 border border-[#dfa86c]/60 rounded-none shadow-[0_0_15px_rgba(223,168,108,0.14)] min-w-0 overflow-hidden">
          <GildedCorners size="xs" withInnerFrame={false} color="#dfa86c" diamondColor="#fde047" />
          <div className="relative z-10 text-[10px] text-[#dfa86c] font-fantasy uppercase tracking-wider flex items-center gap-1.5 mb-1 truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#fde047] shrink-0" />
            <span className="truncate">Disponíveis</span>
          </div>
          <div className="relative z-10 text-lg md:text-xl font-bold font-fantasy text-[#fde047] truncate">
            {totalAvailableMissions}
          </div>
        </div>

        <div className="relative p-3 bg-[#060e20]/90 border border-emerald-500/35 rounded-none min-w-0 overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.08)]">
          <GildedCorners size="xs" withInnerFrame={false} color="#059669" diamondColor="#34d399" />
          <div className="relative z-10 text-[10px] text-emerald-400 font-fantasy uppercase tracking-wider flex items-center gap-1.5 mb-1 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Concluídas</span>
          </div>
          <div className="relative z-10 text-lg md:text-xl font-bold font-fantasy text-emerald-300 truncate">
            {totalDoneMissions}
          </div>
        </div>
      </div>

      {/* Active Project & Next Unlocked Mission Card */}
      {loading && !activeProject ? (
        <div className="p-8 text-center font-fantasy tracking-widest text-[#dfa86c]">
          Sincronizando telemetria do projeto ativo...
        </div>
      ) : activeProject ? (
        <div className="space-y-4 min-w-0">
          <SystemPanel
            title="Diretriz Ativa em Foco"
            subtitle={
              <div className="flex items-center gap-2 mt-1 flex-wrap min-w-0">
                <SystemBadge type="area" areaId={activeProject.area_id} size="sm" className="shrink-0" />
                <SystemBadge type="project-status" projectStatus={activeProject.status} size="sm" className="shrink-0" />
              </div>
            }
            headerAction={
              <SystemButton
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToProjects(activeProject.id)}
                aria-label={`Ver árvore do projeto ${activeProject.title}`}
                icon={<ArrowRight className="w-4 h-4" />}
                className="shrink-0"
              >
                Ver Projeto
              </SystemButton>
            }
          >
            <h3 className="font-fantasy font-bold text-base md:text-lg text-[#f8ecd5] tracking-wide mb-1 break-words [overflow-wrap:anywhere]">
              {activeProject.title}
            </h3>
            {activeProject.description && (
              <p className="text-xs text-[#c5b08f] font-sans mb-3 break-words [overflow-wrap:anywhere]">
                {activeProject.description}
              </p>
            )}

            {/* Progress bar */}
            <div className="space-y-1 pt-2 border-t border-[#966422]/40">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#c5b08f] font-fantasy uppercase tracking-wider">Progresso Geral</span>
                <span className="text-[#fde047] font-bold">{activeProject.progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#040814] overflow-hidden border border-[#c89b55]/55 p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-[#966422] via-[#dfa86c] to-[#fde047] transition-all duration-300 shadow-[0_0_8px_rgba(253,224,71,0.7)]"
                  style={{ width: `${activeProject.progress}%` }}
                />
              </div>
            </div>
          </SystemPanel>

          {/* Next Mission Unlocked */}
          <div>
            <div className="text-xs font-fantasy font-bold uppercase tracking-widest text-[#dfa86c] mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#fde047]" />
              <span>Próxima Missão Desbloqueada</span>
            </div>

            {nextMission ? (
              <MissionCard
                mission={nextMission}
                onComplete={handleCompleteMission}
                onReopen={handleReopenMission}
                loading={actionLoading}
              />
            ) : (
              <div className="p-5 border border-dashed border-[#c89b55]/40 rounded-none bg-[#060e20]/70 text-center font-mono text-xs text-[#c5b08f]">
                Todas as missões desbloqueadas deste projeto foram concluídas ou aguardam pré-requisitos!
                <div className="mt-3">
                  <SystemButton
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigateToProjects(activeProject.id)}
                  >
                    Abrir Árvore de Missões
                  </SystemButton>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 md:p-10 border border-dashed border-[#c89b55]/45 rounded-none bg-[#060e20]/70 text-center">
          <div className="w-12 h-12 bg-[#140f08] border border-[#c89b55]/60 text-[#dfa86c] flex items-center justify-center mx-auto mb-3 shadow-[0_0_16px_rgba(223,168,108,0.2)]">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-fantasy tracking-wider uppercase text-[#f8ecd5] mb-1">
            Nenhuma Diretriz Ativa
          </h3>
          <p className="text-xs text-[#c5b08f] font-sans max-w-sm mx-auto mb-4">
            Crie seu primeiro projeto ou utilize o Painel Dev para semear dados de teste e começar seu treinamento.
          </p>
          <SystemButton
            variant="cyan-glow"
            size="sm"
            onClick={() => onNavigateToProjects()}
            icon={<Plus className="w-4 h-4" />}
          >
            Cadastrar Novo Projeto
          </SystemButton>
        </div>
      )}
    </div>
  );
};
