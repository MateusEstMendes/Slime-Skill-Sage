import React from "react";
import { type Mission } from "@slime-sage/shared";
import { SystemBadge } from "../system/SystemBadge";
import { SystemButton } from "../system/SystemButton";
import { GildedCorners } from "../system/GildedCorners";
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
    bloqueada: "border-[#5c4829]/45 bg-[#040814]/65 text-[#8c7a5b] opacity-85",
    disponivel:
      "border-[#dfa86c]/80 bg-[#071126]/95 text-[#f3e5cc] shadow-[0_0_24px_rgba(223,168,108,0.22)] hover:shadow-[0_0_30px_rgba(223,168,108,0.38)]",
    feita: "border-emerald-600/45 bg-[#051814]/50 text-[#c5b08f]",
  }[mission.status];

  const cornerColor = isAvailable ? "#dfa86c" : isDone ? "#059669" : "#715a38";
  const diamondColor = isAvailable ? "#fde047" : isDone ? "#34d399" : "#8c7a5b";

  return (
    <div
      data-testid={`mission-card-${mission.id}`}
      data-status={mission.status}
      className={`group relative rounded-none border p-4 transition-all duration-200 flex flex-col justify-between gap-3 min-w-0 overflow-hidden ${borderClasses}`}
    >
      {/* Magic Gilded Corners, Inscriptions and Inner Hairline Frame */}
      <GildedCorners
        size="sm"
        color={cornerColor}
        diamondColor={diamondColor}
        glow={isAvailable}
        withRunes={isAvailable || isDone}
        withCenterNotches={true}
        runicTop={isDone ? "ᚲ ᛟ ᚾ ᚲ ᛚ ᚢ ᛁ ᛞ ᚨ" : "ᛗ ᛁ ᛋ ᛋ ᚨ ᛟ"}
        runicBottom={isDone ? "ᚢ ᛁ ᚲ ᛏ ᛟ ᚱ ᛁ ᚨ" : "ᛞ ᛖ ᛋ ᚨ ᚠ ᛁ ᛟ"}
      />

      {/* Top row: Badges and Quick Actions */}
      <div className="relative z-10 flex items-start justify-between gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <SystemBadge type="mission-status" missionStatus={mission.status} size="sm" className="shrink-0" />
          <SystemBadge type="xp" xp={mission.xp_reward} size="sm" className="shrink-0" />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(mission)}
              aria-label={`Editar missão ${mission.title}`}
              className="p-1 text-[#c5b08f] hover:text-[#fde047] hover:bg-[#101f42]/60 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(mission.id)}
              aria-label={`Excluir missão ${mission.title}`}
              className="p-1 text-[#c5b08f] hover:text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="relative z-10 min-w-0">
        <h4
          className={`font-fantasy text-sm md:text-base font-bold tracking-wider break-words [overflow-wrap:anywhere] ${
            isDone ? "line-through text-[#8c7a5b]" : isAvailable ? "text-[#f8ecd5]" : "text-[#a39171]"
          }`}
        >
          {mission.title}
        </h4>
        {mission.description && (
          <p className="text-xs text-[#c5b08f] mt-1 line-clamp-2 font-sans break-words [overflow-wrap:anywhere]">
            {mission.description}
          </p>
        )}
      </div>

      {/* Prerequisites section if blocked */}
      {isBlocked && prerequisiteMissions.length > 0 && (
        <div className="relative z-10 bg-[#040814]/90 border border-[#966422]/50 p-2.5 text-[11px] font-mono text-[#a39171] min-w-0 overflow-hidden shadow-[inset_0_0_8px_rgba(150,100,34,0.1)]">
          <GildedCorners size="xs" color="#966422" diamondColor="#dfa86c" withInnerFrame={false} />
          <div className="relative z-10 flex items-center gap-1 text-[#dfa86c] font-fantasy tracking-wider uppercase mb-1">
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span>Requisitos Pendentes:</span>
          </div>
          <ul className="relative z-10 list-disc list-inside space-y-0.5 text-[#c5b08f] pl-1 min-w-0">
            {prerequisiteMissions.map((prereq) => (
              <li key={prereq.id} className="truncate block">
                {prereq.title}{" "}
                <span className="text-[10px] text-[#8c7a5b]">[{prereq.status}]</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Action Area */}
      <div className="relative z-10 pt-2 border-t border-[#966422]/35 flex items-center justify-between gap-2 min-w-0">
        {isDone ? (
          <div className="flex items-center justify-between w-full min-w-0 gap-2">
            <span className="text-[11px] font-mono text-emerald-400 truncate min-w-0">
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
          <div className="w-full flex items-center justify-between gap-2 min-w-0">
            <span className="text-[11px] font-mono text-[#8c7a5b] truncate min-w-0">
              Desbloqueio aguardando pré-requisitos
            </span>
            <SystemButton
              variant="secondary"
              size="sm"
              disabled
              aria-label={`Missão bloqueada ${mission.title}`}
              data-testid={`button-blocked-${mission.id}`}
              className="shrink-0"
            >
              Bloqueada
            </SystemButton>
          </div>
        )}
      </div>
    </div>
  );
};
