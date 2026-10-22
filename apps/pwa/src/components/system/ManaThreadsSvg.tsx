import React from "react";

export interface ManaConnection {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  score: number;
  affinity: string;
}

export interface ManaThreadsSvgProps {
  connections: ManaConnection[];
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const ManaThreadsSvg: React.FC<ManaThreadsSvgProps> = ({
  connections,
  className = "",
  width = "100%",
  height = "100%",
}) => {
  if (connections.length === 0) return null;

  return (
    <svg
      data-testid="mana-threads-svg"
      className={`pointer-events-none absolute inset-0 z-0 overflow-visible ${className}`}
      width={width}
      height={height}
    >
      <defs>
        {/* Mana glow gradients */}
        <linearGradient id="manaThreadGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dfa86c" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#fde047" stopOpacity="1" />
          <stop offset="100%" stopColor="#dfa86c" stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id="manaThreadPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
        </linearGradient>

        <filter id="manaGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map((conn) => {
        const dx = conn.toX - conn.fromX;
        const dy = conn.toY - conn.fromY;
        const cx1 = conn.fromX + dx * 0.3;
        const cy1 = conn.fromY + dy * 0.1 - 20;
        const cx2 = conn.fromX + dx * 0.7;
        const cy2 = conn.toY - dy * 0.1 + 20;
        const pathData = `M ${conn.fromX} ${conn.fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${conn.toX} ${conn.toY}`;

        const isHighResonance = conn.score >= 80;
        const strokeUrl = isHighResonance ? "url(#manaThreadGold)" : "url(#manaThreadPurple)";

        return (
          <g key={conn.id} className="opacity-90">
            {/* Outer halo */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeUrl}
              strokeWidth={isHighResonance ? 3 : 2}
              filter="url(#manaGlowFilter)"
              opacity={0.4}
            />

            {/* Core flowing thread */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeUrl}
              strokeWidth={isHighResonance ? 2 : 1.5}
              strokeDasharray="6 8"
              className="animate-pulse"
              opacity={0.9}
            />

            {/* Mana nodes at endpoints */}
            <circle cx={conn.fromX} cy={conn.fromY} r="3" fill="#fde047" filter="url(#manaGlowFilter)" />
            <circle cx={conn.toX} cy={conn.toY} r="3" fill="#fde047" filter="url(#manaGlowFilter)" />
          </g>
        );
      })}
    </svg>
  );
};
