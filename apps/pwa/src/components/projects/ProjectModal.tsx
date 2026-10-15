import React, { useState, useEffect } from "react";
import { type AreaCode, type Project, type ProjectStatus } from "@slime-sage/shared";
import { SystemModal } from "../system/SystemModal";
import { SystemInput, SystemTextarea, SystemSelect } from "../system/SystemFormControls";
import { SystemButton } from "../system/SystemButton";
import { FolderPlus, Edit3 } from "lucide-react";

export interface ProjectFormData {
  title: string;
  description: string;
  area_id: AreaCode;
  status: ProjectStatus;
}

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => Promise<void>;
  projectToEdit?: Project | null;
}

const AREA_OPTIONS = [
  { value: "INT", label: "INT // Inteligência (Estudos, Código, Lógica)" },
  { value: "FOR", label: "FOR // Força (Treino, Musculação, Cardio)" },
  { value: "DIS", label: "DIS // Disciplina (Hábitos, Rotina, Foco)" },
  { value: "CRI", label: "CRI // Criatividade (Design, Escrita, Criação)" },
  { value: "SOC", label: "SOC // Social (Networking, Liderança, Oratória)" },
];

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
  { value: "arquivado", label: "Arquivado" },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState<AreaCode>("INT");
  const [status, setStatus] = useState<ProjectStatus>("ativo");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setDescription(projectToEdit.description || "");
      setAreaId(projectToEdit.area_id);
      setStatus(projectToEdit.status);
    } else {
      setTitle("");
      setDescription("");
      setAreaId("INT");
      setStatus("ativo");
    }
    setError("");
  }, [projectToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("O título do projeto é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onSave({
        title: title.trim(),
        description: description.trim(),
        area_id: areaId,
        status,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar projeto";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!projectToEdit;

  return (
    <SystemModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Diretriz de Projeto" : "Inicializar Novo Projeto"}
      subtitle={
        isEditing
          ? "Atualize as configurações e parâmetros do projeto selecionado."
          : "Aloque recursos do Sistema para uma nova frente de desenvolvimento."
      }
      icon={isEditing ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate data-testid="project-form" className="space-y-4">
        <SystemInput
          label="Título do Projeto"
          placeholder="Ex: Dominar Algoritmos e Grafos"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <SystemSelect
          label="Área de Desenvolvimento"
          value={areaId}
          onChange={(e) => setAreaId(e.target.value as AreaCode)}
          options={AREA_OPTIONS}
        />

        <SystemTextarea
          label="Descrição dos Objetivos"
          placeholder="Descreva o propósito e escopo desta diretriz..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {isEditing && (
          <SystemSelect
            label="Status do Projeto"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            options={STATUS_OPTIONS}
          />
        )}

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300 font-mono text-xs">
            [ERRO DO SISTEMA]: {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-500/20">
          <SystemButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </SystemButton>
          <SystemButton
            type="submit"
            variant="cyan-glow"
            loading={saving}
          >
            {isEditing ? "Salvar Alterações" : "Criar Projeto"}
          </SystemButton>
        </div>
      </form>
    </SystemModal>
  );
};
