import React from "react";
import { BASE_AREAS, type AreaCode } from "@slime-sage/shared";
import { type AttributesMap } from "@slime-sage/game";

export interface AttributesRadarChartProps {
  attributes: AttributesMap;
  size?: number;
  className?: string;
}

const ORDERED_AREAS: AreaCode[] = ["INT", "FOR", "DIS", "CRI", "SOC"];

export const AttributesRadarChart: React.FC<AttributesRadarChartProps> = ({
  attributes,
  size = 280,
  className = "",
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.65;
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Scale: at least 100 max, or higher if hunter has high stats
  const maxStatValue = Math.max(
    100,
    ...Object.values(attributes).map((v) => Number(v) || 0)
  );

  // Compute vertices for a regular pentagon at given scale
  const getCoordinates = (angleIndex: number, scale: number) => {
    // 5 vertices: start at top (-PI/2)
    const angle = -Math.PI / 2 + (angleIndex * (2 * Math.PI)) / 5;
    const r = radius * scale;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Build grid level polygons
  const gridPolygons = levels.map((lvl) => {
    const points = ORDERED_AREAS.map((_, i) => {
      const { x, y } = getCoordinates(i, lvl);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return { lvl, points };
  });

  // Build hunter stats polygon points
  const statPoints = ORDERED_AREAS.map((code, i) => {
    const val = attributes[code] ?? 0;
    // Scale between 0.08 (minimum visible) and 1.0
    const ratio = Math.min(1, Math.max(0.08, val / maxStatValue));
    return getCoordinates(i, ratio);
  });

  const polygonPointsStr = statPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        data-testid="radar-chart-svg"
      >
        <defs>
          <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.5" />
            <stop offset="65%" stopColor="#dfa86c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#966422" stopOpacity="0.08" />
          </radialGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Esoteric Magic Circle Outer Rings */}
        <circle
          cx={center}
          cy={center}
          r={radius * 1.08}
          fill="none"
          stroke="#dfa86c"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <circle
          cx={center}
          cy={center}
          r={radius * 1.03}
          fill="none"
          stroke="#fde047"
          strokeOpacity="0.35"
          strokeWidth="0.75"
          strokeDasharray="3 4"
        />
        <circle
          cx={center}
          cy={center}
          r={radius * 0.5}
          fill="none"
          stroke="#dfa86c"
          strokeOpacity="0.18"
          strokeWidth="0.75"
          strokeDasharray="2 3"
        />

        {/* Concentric pentagon grid lines */}
        {gridPolygons.map(({ lvl, points }) => (
          <polygon
            key={lvl}
            points={points}
            fill="none"
            stroke="#c89b55"
            strokeOpacity={lvl === 1.0 ? 0.55 : 0.22}
            strokeWidth={lvl === 1.0 ? "1.5" : "1"}
            strokeDasharray={lvl === 1.0 ? undefined : "3 3"}
          />
        ))}

        {/* Axis lines from center to outer vertices */}
        {ORDERED_AREAS.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.08);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#c89b55"
              strokeOpacity="0.32"
              strokeWidth="1"
            />
          );
        })}

        {/* Player Attributes Polygon */}
        <polygon
          points={polygonPointsStr}
          fill="url(#radarAreaGradient)"
          stroke="#fde047"
          strokeWidth="2.2"
          filter="url(#radarGlow)"
          className="transition-all duration-700 ease-out"
          data-testid="radar-polygon"
        />

        {/* Vertex highlight circles */}
        {statPoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#040814"
              stroke="#dfa86c"
              strokeWidth="2"
            />
            <circle cx={p.x} cy={p.y} r="2" fill="#fde047" />
          </g>
        ))}

        {/* Labels with Code & Mastery Value */}
        {ORDERED_AREAS.map((code, i) => {
          // Label coordinate slightly outside radius
          const { x, y } = getCoordinates(i, 1.26);
          const area = BASE_AREAS.find((a) => a.code === code);
          const val = attributes[code] ?? 0;

          return (
            <g key={code} transform={`translate(${x}, ${y})`}>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-[#fde047] font-fantasy text-[11px] font-bold tracking-widest"
              >
                {code}
              </text>
              <text
                y="13"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-[#e8d5b5] font-mono text-[10px]"
              >
                {val} pts
              </text>
              <text
                y="-13"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-[#a39171] font-fantasy text-[9px] uppercase tracking-wider"
              >
                {area?.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
