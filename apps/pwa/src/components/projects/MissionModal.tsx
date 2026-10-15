import React, { useState, useEffect } from "react";
import { type Mission } from "@slime-sage/shared";
import { SystemModal } from "../system/SystemModal";
import { SystemInput, SystemTextarea } from "../system/SystemFormControls";
import { SystemButton } from "../system/SystemButton";
import { Target, CheckSquare, Square, AlertCircle, Edit3 } from "lucide-react";

export interface MissionFormData {
  title: string;
  description: string;
  xp_reward: number;
  order_index: number;
  depends_on_ids: string[];
}

export interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MissionFormData) => Promise<void>;
  missionToEdit?: Mission | null;
  existingMissions: Mission[];
  initialDependsOnIds?: string[];
}

export const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  missionToEdit,
  existingMissions,
  initialDependsOnIds = [],
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(50);
  const [orderIndex, setOrderIndex] = useState(0);
  const [selectedDeps, setSelectedDeps] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (missionToEdit) {
      setTitle(missionToEdit.title);
      setDescription(missionToEdit.description || "");
      setXpReward(missionToEdit.xp_reward ?? 50);
      setOrderIndex(missionToEdit.order_index ?? 0);
      setSelectedDeps(initialDependsOnIds);
    } else {
      setTitle("");
      setDescription("");
      setXpReward(50);
      setOrderIndex(existingMissions.length);
      setSelectedDeps(initialDependsOnIds);
    }
    setError("");
  }, [missionToEdit, existingMissions.length, isOpen]);

  // Candidates for dependencies (cannot depend on itself)
  const candidateMissions = existingMissions.filter(
    (m) => !missionToEdit || m.id !== missionToEdit.id,
  );

  const toggleDependency = (depId: string) => {
    setSelectedDeps((prev) =>
      prev.includes(depId) ? prev.filter((id) => id !== depId) : [...prev, depId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("O título da missão é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onSave({
        title: title.trim(),
        description: description.trim(),
        xp_reward: Number(xpReward) || 50,
        order_index: Number(orderIndex) || 0,
        depends_on_ids: selectedDeps,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar missão";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!missionToEdit;

  return (
    <SystemModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Missão de Desenvolvimento" : "Registrar Nova Missão"}
      subtitle={
        isEditing
          ? "Modifique os objetivos, recompensas e pré-requisitos da missão."
          : "Adicione um marco estratégico acíclico à árvore de execução."
      }
      icon={isEditing ? <Edit3 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} noValidate data-testid="mission-form" className="space-y-4">
        <SystemInput
          label="Título da Missão"
          placeholder="Ex: Resolver 5 problemas de Grafos / DFS"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <SystemTextarea
          label="Descrição / Critérios de Sucesso"
          placeholder="Descreva o que constitui a conclusão desta tarefa..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SystemInput
            type="number"
            min="0"
            max="1000"
            label="Recompensa de XP"
            value={xpReward}
            onChange={(e) => setXpReward(Math.max(0, parseInt(e.target.value, 10) || 0))}
            helper="Padrão do Sistema: 50 XP por missão"
          />

          <SystemInput
            type="number"
            min="0"
            label="Índice de Ordenação"
            value={orderIndex}
            onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
            helper="Determina a posição de listagem na árvore"
          />
        </div>

        {/* Dependency Selection */}
        <div className="space-y-2 pt-2 border-t border-cyan-500/20">
          <div className="text-xs font-mono font-medium uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Pré-Requisitos (Árvore de Dependências DAG)</span>
            <span className="text-[10px] text-slate-400 lowercase">
              {selectedDeps.length} selecionada(s)
            </span>
          </div>

          <p className="text-xs text-slate-400">
            A missão ficará no status <strong>[Bloqueada]</strong> até que todas as missões
            selecionadas abaixo sejam concluídas.
          </p>

          {candidateMissions.length === 0 ? (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-500 font-mono text-xs">
              Nenhuma outra missão criada neste projeto ainda. Esta missão estará disponível
              imediatamente.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              {candidateMissions.map((cand) => {
                const isSelected = selectedDeps.includes(cand.id);
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => toggleDependency(cand.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors border ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-200"
                        : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs font-medium truncate">
                        {cand.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Status atual: [{cand.status}] · XP: +{cand.xp_reward}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>[ERRO DE VALIDAÇÃO]: {error}</span>
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
            {isEditing ? "Salvar Alterações" : "Adicionar Missão"}
          </SystemButton>
        </div>
      </form>
    </SystemModal>
  );
};
