import React from "react";
import { Lock, Sparkles, CheckCircle2, Shield, Brain, Dumbbell, Sparkle, Users, Clock, AlertTriangle } from "lucide-react";
import { type AreaCode, type MissionStatus, type ProjectStatus } from "@slime-sage/shared";

export interface SystemBadgeProps {
  type?: "area" | "mission-status" | "project-status" | "rank" | "xp" | "custom";
  areaId?: AreaCode;
  missionStatus?: MissionStatus;
  projectStatus?: ProjectStatus;
  rank?: "E" | "D" | "C" | "B" | "A" | "S";
  xp?: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const SystemBadge: React.FC<SystemBadgeProps> = ({
  type = "custom",
  areaId,
  missionStatus,
  projectStatus,
  rank,
  xp,
  label,
  size = "md",
  className = "",
}) => {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  // 1. Area Badge
  if (type === "area" && areaId) {
    const areaConfig: Record<AreaCode, { label: string; color: string; icon: React.ReactNode }> = {
      INT: { label: "INT // Inteligência", color: "border-cyan-500/60 text-cyan-300 bg-cyan-950/40", icon: <Brain className="w-3 h-3" /> },
      FOR: { label: "FOR // Força", color: "border-red-500/60 text-red-300 bg-red-950/40", icon: <Dumbbell className="w-3 h-3" /> },
      DIS: { label: "DIS // Disciplina", color: "border-amber-500/60 text-amber-300 bg-amber-950/40", icon: <Shield className="w-3 h-3" /> },
      CRI: { label: "CRI // Criatividade", color: "border-purple-500/60 text-purple-300 bg-purple-950/40", icon: <Sparkle className="w-3 h-3" /> },
      SOC: { label: "SOC // Social", color: "border-emerald-500/60 text-emerald-300 bg-emerald-950/40", icon: <Users className="w-3 h-3" /> },
    };

    const cfg = areaConfig[areaId];
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border shrink-0 max-w-full ${cfg.color} ${sizeClasses} ${className}`}>
        <span className="shrink-0">{cfg.icon}</span>
        <span className="truncate">{label || cfg.label}</span>
      </span>
    );
  }

  // 2. Mission Status Badge
  if (type === "mission-status" && missionStatus) {
    if (missionStatus === "bloqueada") {
      return (
        <span
          data-testid="badge-status-bloqueada"
          className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border shrink-0 border-slate-700/80 bg-slate-900/80 text-slate-400 ${sizeClasses} ${className}`}
        >
          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Bloqueada</span>
        </span>
      );
    }
    if (missionStatus === "disponivel") {
      return (
        <span
          data-testid="badge-status-disponivel"
          className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border shrink-0 border-cyan-400/80 bg-cyan-950/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)] animate-pulse ${sizeClasses} ${className}`}
        >
          <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" />
          <span>Disponível</span>
        </span>
      );
    }
    if (missionStatus === "feita") {
      return (
        <span
          data-testid="badge-status-feita"
          className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border shrink-0 border-emerald-500/60 bg-emerald-950/40 text-emerald-300 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Concluída</span>
        </span>
      );
    }
  }

  // 3. Project Status Badge
  if (type === "project-status" && projectStatus) {
    const statusConfig: Record<ProjectStatus, { text: string; color: string; icon: React.ReactNode }> = {
      ativo: { text: "Ativo", color: "border-cyan-500/50 text-cyan-300 bg-cyan-950/30", icon: <Clock className="w-3 h-3" /> },
      concluido: { text: "Concluído", color: "border-emerald-500/60 text-emerald-300 bg-emerald-950/40", icon: <CheckCircle2 className="w-3 h-3" /> },
      pausado: { text: "Pausado", color: "border-amber-500/50 text-amber-300 bg-amber-950/30", icon: <AlertTriangle className="w-3 h-3" /> },
      arquivado: { text: "Arquivado", color: "border-slate-700 text-slate-400 bg-slate-900/60", icon: <Lock className="w-3 h-3" /> },
    };
    const cfg = statusConfig[projectStatus];
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border shrink-0 ${cfg.color} ${sizeClasses} ${className}`}>
        <span className="shrink-0">{cfg.icon}</span>
        <span>{cfg.text}</span>
      </span>
    );
  }

  // 4. Rank / Dificuldade
  if (type === "rank" && rank) {
    const rankColors: Record<string, string> = {
      E: "border-slate-600 text-slate-300 bg-slate-900/50",
      D: "border-blue-500/50 text-blue-300 bg-blue-950/40",
      C: "border-cyan-500/60 text-cyan-300 bg-cyan-950/40",
      B: "border-emerald-500/60 text-emerald-300 bg-emerald-950/40",
      A: "border-amber-500/60 text-amber-300 bg-amber-950/40",
      S: "border-purple-500/80 text-purple-200 bg-purple-950/50 shadow-[0_0_12px_rgba(168,85,247,0.35)]",
    };
    return (
      <span className={`inline-flex items-center font-mono font-bold uppercase rounded border shrink-0 ${rankColors[rank] || rankColors.E} ${sizeClasses} ${className}`}>
        RANK {rank}
      </span>
    );
  }

  // 5. XP Badge
  if (type === "xp" && typeof xp === "number") {
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 rounded shrink-0 ${sizeClasses} ${className}`}>
        <span>+{xp}</span>
        <span className="text-[10px] text-cyan-400/80">XP</span>
      </span>
    );
  }

  // Custom fallback
  return (
    <span className={`inline-flex items-center font-mono rounded border border-slate-700 bg-slate-900/60 text-slate-300 shrink-0 ${sizeClasses} ${className}`}>
      {label}
    </span>
  );
};
