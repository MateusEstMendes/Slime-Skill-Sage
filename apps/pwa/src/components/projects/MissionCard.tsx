import React from "react";
import { type Mission } from "@slime-sage/shared";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
import { Check, RotateCcw, Edit2, Trash2, ArrowRight } from "lucide-react";
import { hapticFeedback } from "../../services/haptics";

export interface MissionCardProps {
  mission: Mission;
  prerequisiteMissions?: Mission[];
  onComplete?: (missionId: string) => void;
  onReopen?: (missionId: string) => void;
  onEdit?: (mission: Mission) => void;
  onDelete?: (missionId: string) => void;
  loading?: boolean;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  prerequisiteMissions = [],
  onComplete,
  onReopen,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const isBlocked = mission.status === "bloqueada";
  const isAvailable = mission.status === "disponivel";
  const isDone = mission.status === "feita";

  const handleComplete = () => {
    if (!isAvailable || loading) return;
    hapticFeedback.success();
    onComplete?.(mission.id);
  };

  const handleReopen = () => {
    if (!isDone || loading) return;
    hapticFeedback.tap();
    onReopen?.(mission.id);
  };

  const borderClasses = {
    bloqueada: "border-slate-800/80 bg-slate-950/40 text-slate-400 opacity-80",
    disponivel:
      "border-cyan-400/80 bg-[#0a162e]/90 text-slate-100 shadow-[0_0_20px_rgba(0,240,255,0.18)] hover:shadow-[0_0_25px_rgba(0,240,255,0.3)]",
    feita: "border-emerald-500/40 bg-emerald-950/20 text-slate-300",
  }[mission.status];

  return (
    <div
      data-testid={`mission-card-${mission.id}`}
      data-status={mission.status}
      className={`relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between gap-3 ${borderClasses}`}
    >
      {/* Top row: Badges and Quick Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <SystemBadge type="mission-status" missionStatus={mission.status} size="sm" />
          <SystemBadge type="xp" xp={mission.xp_reward} size="sm" />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(mission)}
              aria-label={`Editar missão ${mission.title}`}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-cyan-950/30 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(mission.id)}
              aria-label={`Excluir missão ${mission.title}`}
              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div>
        <h4
          className={`font-mono text-sm md:text-base font-semibold tracking-wide ${
            isDone ? "line-through text-slate-400" : isAvailable ? "text-cyan-200" : "text-slate-300"
          }`}
        >
          {mission.title}
        </h4>
        {mission.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 font-sans">
            {mission.description}
          </p>
        )}
      </div>

      {/* Prerequisites section if blocked */}
      {isBlocked && prerequisiteMissions.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded p-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1 text-amber-400/90 font-medium mb-1">
            <ArrowRight className="w-3 h-3" />
            <span>Requisitos Pendentes:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
            {prerequisiteMissions.map((prereq) => (
              <li key={prereq.id} className="truncate">
                {prereq.title}{" "}
                <span className="text-[10px] text-slate-500">[{prereq.status}]</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Action Area */}
      <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-between gap-2">
        {isDone ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono text-emerald-400">
              {mission.completed_at
                ? `Concluída em ${new Date(mission.completed_at).toLocaleDateString("pt-BR")}`
                : "Concluída"}
            </span>
            {onReopen && (
              <SystemButton
                variant="ghost"
                size="sm"
                onClick={handleReopen}
                disabled={loading}
                aria-label={`Desfazer conclusão da missão ${mission.title}`}
                data-testid={`button-reopen-${mission.id}`}
                icon={<RotateCcw className="w-3 h-3" />}
              >
                Desfazer
              </SystemButton>
            )}
          </div>
        ) : isAvailable ? (
          <div className="w-full flex items-center justify-end">
            <SystemButton
              variant="cyan-glow"
              size="sm"
              onClick={handleComplete}
              disabled={loading}
              aria-label={`Concluir missão ${mission.title}`}
              data-testid={`button-complete-${mission.id}`}
              className="w-full sm:w-auto"
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Concluir Missão
            </SystemButton>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">
              Desbloqueio aguardando pré-requisitos
            </span>
            <SystemButton
              variant="secondary"
              size="sm"
              disabled
              aria-label={`Missão bloqueada ${mission.title}`}
              data-testid={`button-blocked-${mission.id}`}
            >
              Bloqueada
            </SystemButton>
          </div>
        )}
      </div>
    </div>
  );
};
