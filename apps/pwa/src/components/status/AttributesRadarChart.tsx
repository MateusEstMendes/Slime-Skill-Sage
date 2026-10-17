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
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#00f3ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00f3ff" stopOpacity="0.05" />
          </radialGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Circular ambient system glow */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#00f3ff"
          strokeOpacity="0.08"
          strokeWidth="1"
        />

        {/* Concentric pentagon grid lines */}
        {gridPolygons.map(({ lvl, points }) => (
          <polygon
            key={lvl}
            points={points}
            fill="none"
            stroke="#0ea5e9"
            strokeOpacity={lvl === 1.0 ? 0.35 : 0.15}
            strokeWidth={lvl === 1.0 ? "1.5" : "1"}
            strokeDasharray={lvl === 1.0 ? undefined : "3 3"}
          />
        ))}

        {/* Axis lines from center to outer vertices */}
        {ORDERED_AREAS.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#0ea5e9"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
          );
        })}

        {/* Player Attributes Polygon */}
        <polygon
          points={polygonPointsStr}
          fill="url(#radarAreaGradient)"
          stroke="#00f3ff"
          strokeWidth="2.5"
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
              r="4"
              fill="#050811"
              stroke="#00f3ff"
              strokeWidth="2"
            />
            <circle cx={p.x} cy={p.y} r="2" fill="#38bdf8" />
          </g>
        ))}

        {/* Labels with Code & Mastery Value */}
        {ORDERED_AREAS.map((code, i) => {
          // Label coordinate slightly outside radius
          const { x, y } = getCoordinates(i, 1.25);
          const area = BASE_AREAS.find((a) => a.code === code);
          const val = attributes[code] ?? 0;

          return (
            <g key={code} transform={`translate(${x}, ${y})`}>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-cyan-300 font-mono text-[11px] font-bold tracking-wider"
              >
                {code}
              </text>
              <text
                y="13"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-400 font-mono text-[10px]"
              >
                {val} pts
              </text>
              <text
                y="-13"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-500 font-sans text-[9px]"
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
