import React, { useState, useEffect, useCallback } from "react";
import { type Project, type Mission, type Profile } from "@slime-sage/shared";
import { projectRepository } from "../../services/projectRepository";
import { gameService } from "../../services/gameService";
import { calculateLevelFromTotalXp } from "@slime-sage/game";
import { logger } from "../../services/logger";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
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

    return () => {
      isMounted = false;
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            [ INTERFACE DE COMANDO // VISÃO GERAL ]
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white tracking-wide">
            PAINEL DO SISTEMA
          </h2>
        </div>

        <SystemButton
          variant="primary"
          size="sm"
          onClick={onNavigateToGs}
          aria-label="Consultar Grande Sábio"
          icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
        >
          Consultar G.S
        </SystemButton>
      </div>

      {/* Hunter Status Banner (Level & XP) */}
      <div className="p-4 bg-gradient-to-r from-[#061226] via-[#091838] to-[#061226] border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.08)] font-mono">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center font-bold text-cyan-300 text-sm">
              L{levelProgress.level}
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">
                {profile?.name ?? "Rimuru Tempest"}
              </div>
              <div className="text-[10px] text-cyan-400/80">
                {profile?.title ?? "Aspirante a Desperto"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">XP Acumulado</div>
            <div className="text-sm font-bold text-cyan-300">
              {profile?.total_xp ?? 0} <span className="text-[10px] text-slate-500">XP</span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progresso do Nível {levelProgress.level}</span>
            <span>
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
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3 font-mono">
        <div className="p-3 bg-[#0a152e]/80 border border-cyan-500/25 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.06)]">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1.5 mb-1">
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Projetos</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-cyan-300">
            {totalProjectsCount}
          </div>
        </div>

        <div className="p-3 bg-[#0a152e]/80 border border-cyan-400/30 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <div className="text-[10px] text-cyan-400 uppercase flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Disponíveis</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-cyan-200">
            {totalAvailableMissions}
          </div>
        </div>

        <div className="p-3 bg-[#0a152e]/80 border border-emerald-500/25 rounded-xl">
          <div className="text-[10px] text-emerald-400 uppercase flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Concluídas</span>
          </div>
          <div className="text-lg md:text-xl font-bold text-emerald-300">
            {totalDoneMissions}
          </div>
        </div>
      </div>

      {/* Active Project & Next Unlocked Mission Card */}
      {loading && !activeProject ? (
        <div className="p-8 text-center font-mono text-cyan-400">
          Sincronizando telemetria do projeto ativo...
        </div>
      ) : activeProject ? (
        <div className="space-y-4">
          <SystemPanel
            title="Diretriz Ativa em Foco"
            subtitle={
              <div className="flex items-center gap-2 mt-1">
                <SystemBadge type="area" areaId={activeProject.area_id} size="sm" />
                <SystemBadge type="project-status" projectStatus={activeProject.status} size="sm" />
              </div>
            }
            headerAction={
              <SystemButton
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToProjects(activeProject.id)}
                aria-label={`Ver árvore do projeto ${activeProject.title}`}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Ver Projeto
              </SystemButton>
            }
          >
            <h3 className="font-mono font-bold text-base md:text-lg text-white mb-1">
              {activeProject.title}
            </h3>
            {activeProject.description && (
              <p className="text-xs text-slate-400 font-sans mb-3">
                {activeProject.description}
              </p>
            )}

            {/* Progress bar */}
            <div className="space-y-1 pt-2 border-t border-cyan-500/15">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Progresso Geral</span>
                <span className="text-cyan-300 font-bold">{activeProject.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/20">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,240,255,0.7)]"
                  style={{ width: `${activeProject.progress}%` }}
                />
              </div>
            </div>
          </SystemPanel>

          {/* Next Mission Unlocked */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
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
              <div className="p-5 border border-dashed border-cyan-500/30 rounded-xl bg-[#0a1224]/50 text-center font-mono text-xs text-slate-400">
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
        <div className="p-8 md:p-10 border border-dashed border-cyan-500/30 rounded-2xl bg-[#0a1224]/50 text-center">
          <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-3">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-mono text-white mb-1">
            Nenhuma Diretriz Ativa
          </h3>
          <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto mb-4">
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
