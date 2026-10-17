import React, { useState, useEffect, useCallback } from "react";
import { type Mission, type MissionDep, type Project } from "@slime-sage/shared";
import { projectRepository } from "../../services/projectRepository";
import { gameService } from "../../services/gameService";
import { logger } from "../../services/logger";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
import { GildedCorners } from "../system/GildedCorners";
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
      <div className="p-8 text-center font-fantasy tracking-widest text-[#dfa86c]">
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
          <div className="flex items-center gap-2 mt-1 flex-wrap min-w-0">
            <SystemBadge type="area" areaId={project.area_id} size="sm" className="shrink-0" />
            <SystemBadge type="project-status" projectStatus={project.status} size="sm" className="shrink-0" />
          </div>
        }
      >
        {project.description && (
          <p className="text-sm text-[#e8d5b5] font-sans mb-4 break-words [overflow-wrap:anywhere]">
            {project.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#966422]/40">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#c5b08f] font-fantasy uppercase tracking-wider">
              Progresso de Conclusão:
            </span>
            <span className="text-[#fde047] font-bold">
              {project.progress}% ({doneCount}/{missions.length} missões)
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#040814] overflow-hidden border border-[#c89b55]/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#966422] via-[#dfa86c] to-[#fde047] transition-all duration-500 shadow-[0_0_12px_rgba(253,224,71,0.75)]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Mission Counters */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#966422]/35 text-center font-mono">
          <div className="relative p-2 bg-[#140f08]/85 border border-[#c89b55]/50 overflow-hidden shadow-[0_0_12px_rgba(223,168,108,0.1)]">
            <GildedCorners size="xs" withInnerFrame={false} color="#dfa86c" diamondColor="#fde047" />
            <div className="relative z-10 text-[10px] text-[#dfa86c] font-fantasy uppercase flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Disponíveis</span>
            </div>
            <div className="relative z-10 text-lg font-bold text-[#fde047]">{availableCount}</div>
          </div>

          <div className="relative p-2 bg-[#040814]/80 border border-[#5c4829]/50 overflow-hidden">
            <GildedCorners size="xs" withInnerFrame={false} color="#715a38" diamondColor="#8c7a5b" />
            <div className="relative z-10 text-[10px] text-[#a39171] font-fantasy uppercase flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Bloqueadas</span>
            </div>
            <div className="relative z-10 text-lg font-bold text-[#a39171]">{blockedCount}</div>
          </div>

          <div className="relative p-2 bg-emerald-950/30 border border-emerald-500/40 overflow-hidden shadow-[0_0_12px_rgba(16,185,129,0.08)]">
            <GildedCorners size="xs" withInnerFrame={false} color="#059669" diamondColor="#34d399" />
            <div className="relative z-10 text-[10px] text-emerald-400 font-fantasy uppercase flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Concluídas</span>
            </div>
            <div className="relative z-10 text-lg font-bold text-emerald-300">{doneCount}</div>
          </div>
        </div>
      </SystemPanel>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 text-xs font-fantasy tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#dfa86c]" />
          <span className="text-[#c5b08f] uppercase">Filtrar:</span>
          {(["all", "disponivel", "bloqueada", "feita"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-none text-xs transition-colors border uppercase ${
                filterStatus === st
                  ? "bg-[#241909]/95 border-[#dfa86c] text-[#fde047] font-bold"
                  : "bg-[#060e20]/80 border-[#966422]/40 text-[#a39171] hover:text-[#f3e5cc]"
              }`}
            >
              {st === "all" ? "Todas" : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Missions Tree Grid */}
      {filteredMissions.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#c89b55]/40 rounded-none bg-[#060e20]/70">
          <p className="text-sm font-fantasy tracking-wider text-[#c5b08f]">
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
