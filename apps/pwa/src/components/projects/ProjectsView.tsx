import React, { useState, useEffect, useCallback } from "react";
import { type AreaCode, type Project, type ProjectStatus } from "@slime-sage/shared";
import { projectRepository } from "../../services/projectRepository";
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
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  initialProjectId,
  onSelectProject,
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

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const list = await projectRepository.listProjects();
      setProjects(list);
    } catch (err) {
      void logger.error("db", "Falha ao carregar lista de projetos", { err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

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
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white tracking-wide flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-cyan-400" />
            <span>DIRETRIZES DE DESENVOLVIMENTO</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-mono mt-0.5">
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-400 shrink-0 mr-1">Área:</span>
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => setAreaFilter(a)}
              className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                areaFilter === a
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {a === "all" ? "Todas as Áreas" : a}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 shrink-0 mr-1">Status:</span>
          {(["ativo", "concluido", "pausado", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                statusFilter === s
                  ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-8 text-center font-mono text-cyan-400">
          Consultando registros locais do Sistema...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-8 md:p-12 text-center border border-dashed border-cyan-500/30 rounded-2xl bg-[#0a1224]/50">
          <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-3">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-mono text-white mb-1">
            Nenhuma diretriz encontrada
          </h3>
          <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto mb-4">
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
              className="flex flex-col justify-between hover:border-cyan-400/60 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <SystemBadge type="area" areaId={p.area_id} size="sm" />
                    <SystemBadge type="project-status" projectStatus={p.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      aria-label={`Editar projeto ${p.title}`}
                      className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-cyan-950/40"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      aria-label={`Excluir projeto ${p.title}`}
                      className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-mono font-bold text-base text-white group-hover:text-cyan-200 transition-colors">
                  {p.title}
                </h3>
                {p.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 font-sans">
                    {p.description}
                  </p>
                )}
              </div>

              {/* Progress and Open Tree Button */}
              <div className="mt-4 pt-3 border-t border-cyan-500/15 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Progresso</span>
                    <span className="text-cyan-300 font-bold">{p.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-300"
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
