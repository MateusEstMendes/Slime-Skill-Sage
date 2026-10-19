import React, { useState, useEffect, useCallback } from "react";
import { type AreaCode, type Project, type ProjectStatus } from "@slime-sage/shared";
import { projectRepository } from "../../services/projectRepository";
import { gameService } from "../../services/gameService";
import { logger } from "../../services/logger";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
import { ProjectModal, type ProjectFormData } from "./ProjectModal";
import { ProjectTreeViewer } from "./ProjectTreeViewer";
import { Plus, FolderGit2, Edit3, Trash2, ArrowRight } from "lucide-react";

export interface ProjectsViewProps {
  initialProjectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
  isActive?: boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  initialProjectId,
  onSelectProject,
  isActive,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId || null,
  );

  // Filters
  const [areaFilter, setAreaFilter] = useState<AreaCode | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("ativo");

  // Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const list = await projectRepository.listProjects();
      if (isMountedRef.current) {
        setProjects(list);
      }
    } catch (err) {
      void logger.error("db", "Falha ao carregar lista de projetos", { err });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadProjects();

    const unsubRepo = projectRepository.subscribe(() => {
      void loadProjects();
    });
    const unsubGame = gameService.subscribeToGameEvents(() => {
      void loadProjects();
    });

    return () => {
      unsubRepo();
      unsubGame();
    };
  }, [loadProjects]);

  useEffect(() => {
    if (isActive) {
      void loadProjects();
    }
  }, [isActive, loadProjects]);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  const handleOpenTree = (id: string) => {
    setSelectedProjectId(id);
    onSelectProject?.(id);
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
    onSelectProject?.(null);
    void loadProjects();
  };

  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setProjectToEdit(p);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Deseja realmente arquivar este projeto e todas as suas missões?")) {
      return;
    }
    try {
      await projectRepository.softDeleteProject(id);
      void logger.info("db", "Projeto arquivado", { projectId: id });
      await loadProjects();
    } catch (err) {
      void logger.error("db", "Falha ao arquivar projeto", { err, projectId: id });
    }
  };

  const handleSaveProject = async (data: ProjectFormData) => {
    if (projectToEdit) {
      await projectRepository.updateProject(projectToEdit.id, {
        title: data.title,
        description: data.description,
        area_id: data.area_id,
        status: data.status,
      });
      void logger.info("db", "Projeto atualizado", { projectId: projectToEdit.id });
    } else {
      const created = await projectRepository.createProject({
        title: data.title,
        description: data.description,
        area_id: data.area_id,
      });
      void logger.info("db", "Novo projeto criado", { projectId: created.id, title: data.title });
    }
    await loadProjects();
  };

  // If a project is selected, render the tree viewer!
  if (selectedProjectId) {
    return (
      <ProjectTreeViewer
        projectId={selectedProjectId}
        onBack={handleBackToList}
        onProjectUpdated={loadProjects}
      />
    );
  }

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (areaFilter !== "all" && p.area_id !== areaFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const AREAS: (AreaCode | "all")[] = ["all", "INT", "FOR", "DIS", "CRI", "SOC"];

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-[#dfa86c]" />
            <span>DIRETRIZES DE DESENVOLVIMENTO</span>
          </h2>
          <p className="text-xs md:text-sm text-[#c5b08f] font-mono mt-0.5">
            Gerencie projetos e progrida nas 5 áreas de atributos do Caçador.
          </p>
        </div>

        <SystemButton
          variant="cyan-glow"
          onClick={handleOpenCreate}
          aria-label="Criar novo projeto"
          icon={<Plus className="w-4 h-4" />}
        >
          Novo Projeto
        </SystemButton>
      </div>

      {/* Filter Tabs: Areas */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-fantasy tracking-wider">
          <span className="text-[#c5b08f] shrink-0 mr-1 uppercase">Área:</span>
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => setAreaFilter(a)}
              className={`px-3 py-1.5 rounded-none border transition-all shrink-0 uppercase ${
                areaFilter === a
                  ? "bg-[#241909]/95 border-[#dfa86c] text-[#fde047] font-bold shadow-[0_0_12px_rgba(223,168,108,0.3)]"
                  : "bg-[#060e20]/80 border-[#966422]/45 text-[#a39171] hover:text-[#f3e5cc] hover:border-[#c89b55]/60"
              }`}
            >
              {a === "all" ? "Todas as Áreas" : a}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 text-xs font-fantasy tracking-wider flex-wrap">
          <span className="text-[#c5b08f] shrink-0 mr-1 uppercase">Status:</span>
          {(["ativo", "concluido", "pausado", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-none text-xs border transition-colors uppercase ${
                statusFilter === s
                  ? "bg-[#241909]/90 border-[#dfa86c]/80 text-[#fde047] font-bold"
                  : "bg-[#060e20]/60 border-[#966422]/35 text-[#a39171] hover:text-[#f3e5cc]"
              }`}
            >
              {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-8 text-center font-fantasy tracking-widest text-[#dfa86c]">
          Consultando registros locais do Sistema...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-8 md:p-12 text-center border border-dashed border-[#c89b55]/45 rounded-none bg-[#060e20]/70">
          <div className="w-12 h-12 bg-[#140f08] border border-[#c89b55]/60 text-[#dfa86c] flex items-center justify-center mx-auto mb-3 shadow-[0_0_16px_rgba(223,168,108,0.2)]">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-fantasy tracking-wider uppercase text-[#f8ecd5] mb-1">
            Nenhuma diretriz encontrada
          </h3>
          <p className="text-xs text-[#c5b08f] font-sans max-w-sm mx-auto mb-4">
            {projects.length === 0
              ? "Você ainda não cadastrou nenhum projeto. Crie sua primeira diretriz para desbloquear missões e acumular XP."
              : "Nenhum projeto corresponde aos filtros de área e status selecionados."}
          </p>
          <SystemButton
            variant="cyan-glow"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus className="w-4 h-4" />}
          >
            Cadastrar 1º Projeto
          </SystemButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => (
            <SystemPanel
              key={p.id}
              withRunes={true}
              runicTop="ᛈ ᚱ ᛟ ᛃ ᛖ ᚲ ᛏ ᛟ"
              runicBottom="ᛋ ᛁ ᛋ ᛏ ᛖ ᛗ ᚨ"
              className="flex flex-col justify-between hover:border-[#fde047]/80 transition-all group"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <SystemBadge type="area" areaId={p.area_id} size="sm" className="shrink-0" />
                    <SystemBadge type="project-status" projectStatus={p.status} size="sm" className="shrink-0" />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      aria-label={`Editar projeto ${p.title}`}
                      className="p-1 text-[#c5b08f] hover:text-[#fde047] hover:bg-[#101f42]/60"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      aria-label={`Excluir projeto ${p.title}`}
                      className="p-1 text-[#c5b08f] hover:text-red-400 hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-fantasy font-bold text-base text-[#f8ecd5] group-hover:text-[#fde047] transition-colors tracking-wide break-words [overflow-wrap:anywhere]">
                  {p.title}
                </h3>
                {p.description && (
                  <p className="text-xs text-[#c5b08f] mt-1 line-clamp-2 font-sans break-words [overflow-wrap:anywhere]">
                    {p.description}
                  </p>
                )}
              </div>

              {/* Progress and Open Tree Button */}
              <div className="mt-4 pt-3 border-t border-[#966422]/40 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#c5b08f]">Progresso</span>
                    <span className="text-[#fde047] font-bold">{p.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#040814] overflow-hidden border border-[#966422]/60 p-[1px]">
                    <div
                      className="h-full bg-gradient-to-r from-[#966422] via-[#dfa86c] to-[#fde047] transition-all duration-300 shadow-[0_0_8px_rgba(253,224,71,0.6)]"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <SystemButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenTree(p.id)}
                  aria-label={`Abrir árvore de missões do projeto ${p.title}`}
                  className="w-full justify-between"
                >
                  <span>Árvore de Missões</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </SystemButton>
              </div>
            </SystemPanel>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};
