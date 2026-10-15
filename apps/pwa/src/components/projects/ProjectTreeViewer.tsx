import React, { useState, useEffect, useCallback } from "react";
import { type Mission, type MissionDep, type Project } from "@slime-sage/shared";
import { projectRepository } from "../../services/projectRepository";
import { gameService } from "../../services/gameService";
import { logger } from "../../services/logger";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
import { MissionCard } from "./MissionCard";
import { MissionModal, type MissionFormData } from "./MissionModal";
import { ArrowLeft, Plus, CheckCircle2, Lock, Sparkles, Filter } from "lucide-react";

export interface ProjectTreeViewerProps {
  projectId: string;
  onBack: () => void;
  onProjectUpdated?: () => void;
}

export const ProjectTreeViewer: React.FC<ProjectTreeViewerProps> = ({
  projectId,
  onBack,
  onProjectUpdated,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [dependencies, setDependencies] = useState<MissionDep[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "disponivel" | "bloqueada" | "feita">("all");

  // Modal states
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [initialDepsForEdit, setInitialDepsForEdit] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectRepository.getProjectWithTree(projectId);
      if (data) {
        setProject(data.project);
        setMissions(data.missions);
        setDependencies(data.dependencies);
      }
    } catch (err) {
      void logger.error("db", "Falha ao carregar árvore do projeto", { err, projectId });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadTreeData();
  }, [loadTreeData]);

  // Compute map of prerequisites for each mission
  const getPrerequisites = (missionId: string): Mission[] => {
    const depIds = dependencies
      .filter((d) => d.mission_id === missionId)
      .map((d) => d.depends_on_mission_id);
    return missions.filter((m) => depIds.includes(m.id));
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      setActionLoading(true);
      await gameService.completeMission(missionId);
      await loadTreeData();
      onProjectUpdated?.();
    } catch (err) {
      void logger.error("game", "Falha ao concluir missão", { err, missionId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenMission = async (missionId: string) => {
    try {
      setActionLoading(true);
      await gameService.undoMissionCompletion(missionId);
      await loadTreeData();
      onProjectUpdated?.();
    } catch (err) {
      void logger.error("game", "Falha ao reabrir missão", { err, missionId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    if (!window.confirm("Deseja realmente excluir esta missão? Ela será arquivada.")) {
      return;
    }
    try {
      setActionLoading(true);
      await projectRepository.softDeleteMission(missionId);
      void logger.info("db", "Missão excluída", { missionId, projectId });
      await loadTreeData();
      onProjectUpdated?.();
    } catch (err) {
      void logger.error("db", "Falha ao excluir missão", { err, missionId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMission = async (data: MissionFormData) => {
    if (missionToEdit) {
      await projectRepository.updateMission(
        missionToEdit.id,
        {
          title: data.title,
          description: data.description,
          xp_reward: data.xp_reward,
          order_index: data.order_index,
        },
        data.depends_on_ids,
      );
      void logger.info("db", "Missão atualizada", { missionId: missionToEdit.id, projectId });
    } else {
      await projectRepository.addMission(
        projectId,
        {
          title: data.title,
          description: data.description,
          xp_reward: data.xp_reward,
          order_index: data.order_index,
        },
        data.depends_on_ids,
      );
      void logger.info("db", "Nova missão criada", { projectId, title: data.title });
    }
    await loadTreeData();
    onProjectUpdated?.();
  };

  const handleOpenEditMission = (m: Mission) => {
    setMissionToEdit(m);
    const deps = dependencies.filter((d) => d.mission_id === m.id).map((d) => d.depends_on_mission_id);
    setInitialDepsForEdit(deps);
    setIsMissionModalOpen(true);
  };

  const handleOpenCreateMission = () => {
    setMissionToEdit(null);
    setInitialDepsForEdit([]);
    setIsMissionModalOpen(true);
  };

  if (loading && !project) {
    return (
      <div className="p-8 text-center font-mono text-cyan-400">
        Carregando árvore de diretrizes...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center font-mono text-red-400">
        Projeto não encontrado.
      </div>
    );
  }

  const doneCount = missions.filter((m) => m.status === "feita").length;
  const availableCount = missions.filter((m) => m.status === "disponivel").length;
  const blockedCount = missions.filter((m) => m.status === "bloqueada").length;

  const filteredMissions = missions.filter((m) => {
    if (filterStatus === "all") return true;
    return m.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SystemButton
          variant="secondary"
          size="sm"
          onClick={onBack}
          aria-label="Voltar para a lista de projetos"
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Voltar para Projetos
        </SystemButton>

        <SystemButton
          variant="cyan-glow"
          size="sm"
          onClick={handleOpenCreateMission}
          aria-label="Criar nova missão"
          icon={<Plus className="w-4 h-4" />}
        >
          Nova Missão
        </SystemButton>
      </div>

      {/* Project Info Header Panel */}
      <SystemPanel
        title={project.title}
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <SystemBadge type="area" areaId={project.area_id} size="sm" />
            <SystemBadge type="project-status" projectStatus={project.status} size="sm" />
          </div>
        }
      >
        {project.description && (
          <p className="text-sm text-slate-300 font-sans mb-4">
            {project.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-cyan-500/20">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider">
              Progresso de Conclusão:
            </span>
            <span className="text-cyan-300 font-bold">
              {project.progress}% ({doneCount}/{missions.length} missões)
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.7)]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Mission Counters */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center font-mono">
          <div className="p-2 bg-cyan-950/20 rounded border border-cyan-500/20">
            <div className="text-[10px] text-cyan-400 uppercase flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Disponíveis</span>
            </div>
            <div className="text-lg font-bold text-cyan-300">{availableCount}</div>
          </div>

          <div className="p-2 bg-slate-950/40 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Bloqueadas</span>
            </div>
            <div className="text-lg font-bold text-slate-400">{blockedCount}</div>
          </div>

          <div className="p-2 bg-emerald-950/20 rounded border border-emerald-500/20">
            <div className="text-[10px] text-emerald-400 uppercase flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Concluídas</span>
            </div>
            <div className="text-lg font-bold text-emerald-300">{doneCount}</div>
          </div>
        </div>
      </SystemPanel>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Filtrar:</span>
          {(["all", "disponivel", "bloqueada", "feita"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                filterStatus === st
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st === "all" ? "Todas" : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Missions Tree Grid */}
      {filteredMissions.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-cyan-500/30 rounded-xl bg-[#0a1224]/50">
          <p className="text-sm font-mono text-slate-400">
            {missions.length === 0
              ? "Nenhuma missão cadastrada nesta diretriz ainda."
              : "Nenhuma missão com o filtro selecionado."}
          </p>
          {missions.length === 0 && (
            <div className="mt-4">
              <SystemButton
                variant="cyan-glow"
                size="sm"
                onClick={handleOpenCreateMission}
                icon={<Plus className="w-4 h-4" />}
              >
                Cadastrar 1ª Missão
              </SystemButton>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMissions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              prerequisiteMissions={getPrerequisites(m.id)}
              onComplete={handleCompleteMission}
              onReopen={handleReopenMission}
              onEdit={handleOpenEditMission}
              onDelete={handleDeleteMission}
              loading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Mission Create/Edit Modal */}
      <MissionModal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        onSave={handleSaveMission}
        missionToEdit={missionToEdit}
        existingMissions={missions}
        initialDependsOnIds={initialDepsForEdit}
      />
    </div>
  );
};
