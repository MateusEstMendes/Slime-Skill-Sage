import React, { useState } from "react";
import { BASE_AREAS, type AreaCode } from "@slime-sage/shared";
import {
  type AttributesMap,
  calculateDynamicAttributeCeiling,
  getAttributeRank,
} from "@slime-sage/game";
import { GildedCorners } from "../system/GildedCorners";

export interface AttributesRadarChartProps {
  attributes: AttributesMap;
  size?: number;
  className?: string;
  onSelectArea?: (area: AreaCode) => void;
  showHorizonBadge?: boolean;
}

const ORDERED_AREAS: AreaCode[] = ["INT", "FOR", "DIS", "CRI", "SOC"];

export interface AreaTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  gradientStops: [string, string, string];
  title: string;
}

export const AREA_THEMES: Record<AreaCode, AreaTheme> = {
  INT: {
    primary: "#00f3ff",
    secondary: "#0284c7",
    accent: "#38bdf8",
    glow: "rgba(0, 243, 255, 0.45)",
    gradientStops: ["#00f3ff", "#0284c7", "#082f49"],
    title: "Inteligência Arcana",
  },
  FOR: {
    primary: "#ff3366",
    secondary: "#e11d48",
    accent: "#fb7185",
    glow: "rgba(255, 51, 102, 0.45)",
    gradientStops: ["#ff3366", "#be123c", "#4c0519"],
    title: "Força Titânica",
  },
  DIS: {
    primary: "#fde047",
    secondary: "#dfa86c",
    accent: "#eab308",
    glow: "rgba(253, 224, 71, 0.45)",
    gradientStops: ["#fde047", "#dfa86c", "#451a03"],
    title: "Disciplina Inabalável",
  },
  CRI: {
    primary: "#c084fc",
    secondary: "#9333ea",
    accent: "#e879f9",
    glow: "rgba(192, 132, 252, 0.45)",
    gradientStops: ["#c084fc", "#7e22ce", "#3b0764"],
    title: "Criatividade Cósmica",
  },
  SOC: {
    primary: "#34d399",
    secondary: "#059669",
    accent: "#6ee7b7",
    glow: "rgba(52, 211, 153, 0.45)",
    gradientStops: ["#34d399", "#047857", "#064e3b"],
    title: "Harmonia Social",
  },
};

const RUNIC_PARTICLES = [
  { rune: "ᚠ", angleRatio: 0.08, rRatio: 0.28, delay: "0s", duration: "4.5s" },
  { rune: "ᚢ", angleRatio: 0.28, rRatio: 0.42, delay: "1.2s", duration: "5.2s" },
  { rune: "ᚦ", angleRatio: 0.48, rRatio: 0.24, delay: "0.6s", duration: "4.8s" },
  { rune: "ᚨ", angleRatio: 0.68, rRatio: 0.46, delay: "2.1s", duration: "5.8s" },
  { rune: "ᚱ", angleRatio: 0.88, rRatio: 0.32, delay: "1.7s", duration: "4.2s" },
  { rune: "ᛋ", angleRatio: 0.18, rRatio: 0.52, delay: "0.9s", duration: "5.0s" },
  { rune: "ᛏ", angleRatio: 0.38, rRatio: 0.36, delay: "2.4s", duration: "4.6s" },
  { rune: "ᛟ", angleRatio: 0.58, rRatio: 0.50, delay: "1.5s", duration: "5.4s" },
  { rune: "ᛗ", angleRatio: 0.78, rRatio: 0.26, delay: "0.3s", duration: "4.9s" },
];

export const AttributesRadarChart: React.FC<AttributesRadarChartProps> = ({
  attributes,
  size = 290,
  className = "",
  onSelectArea,
  showHorizonBadge = true,
}) => {
  const [hoveredArea, setHoveredArea] = useState<AreaCode | null>(null);

  const center = size / 2;
  const radius = (size / 2) * 0.65;
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Highest stat value
  const statValues = ORDERED_AREAS.map((code) => Number(attributes[code]) || 0);
  const maxStatValue = Math.max(0, ...statValues);

  // Dynamic expanding/retreating ceiling
  const dynamicCeiling = calculateDynamicAttributeCeiling(maxStatValue);

  // Dominant area calculation
  const dominantArea: AreaCode = React.useMemo(() => {
    let dominant: AreaCode = "INT";
    let highest = -1;
    for (const code of ORDERED_AREAS) {
      const val = attributes[code] ?? 0;
      if (val > highest) {
        highest = val;
        dominant = code;
      }
    }
    return dominant;
  }, [attributes]);

  const dominantTheme = AREA_THEMES[dominantArea];
  const activeAreaForTooltip = hoveredArea ?? dominantArea;
  const activeTheme = AREA_THEMES[activeAreaForTooltip];
  const activeRank = getAttributeRank(attributes[activeAreaForTooltip] ?? 0, activeAreaForTooltip);
  const activeAreaMeta = BASE_AREAS.find((a) => a.code === activeAreaForTooltip);

  const highestRank = getAttributeRank(maxStatValue);

  // Coordinates helper for regular pentagon
  const getCoordinates = (angleIndex: number, scale: number) => {
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

  // Calculate polygon points with dynamic expanding and retreat
  const statPoints = ORDERED_AREAS.map((code, i) => {
    const val = attributes[code] ?? 0;
    // Scale strictly relative to the dynamic ceiling, clamping to [0.08, 1.0]
    const ratio = Math.min(1, Math.max(0.08, val / dynamicCeiling));
    return {
      code,
      coord: getCoordinates(i, ratio),
      val,
      ratio,
    };
  });

  const polygonPointsStr = statPoints
    .map((p) => `${p.coord.x.toFixed(1)},${p.coord.y.toFixed(1)}`)
    .join(" ");

  const handleAreaClick = (code: AreaCode) => {
    setHoveredArea((prev) => (prev === code ? null : code));
    onSelectArea?.(code);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${className}`}
      data-testid="attributes-radar-container"
    >
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          data-testid="radar-chart-svg"
        >
          <style>
            {`
              @keyframes floatRuneAnim {
                0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.25; }
                50% { transform: translateY(-3px) rotate(3deg); opacity: 0.65; }
              }
              @keyframes pulseNebula {
                0%, 100% { r: 52%; opacity: 0.9; }
                50% { r: 58%; opacity: 1; }
              }
              .rune-particle {
                animation: floatRuneAnim ease-in-out infinite;
                transform-origin: center;
              }
              .nebula-glow {
                animation: pulseNebula 4s ease-in-out infinite;
              }
            `}
          </style>

          <defs>
            {/* Dynamic Mana Nebula Gradient tuned to dominant attribute */}
            <radialGradient id="manaNebulaGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={dominantTheme.primary} stopOpacity="0.45" />
              <stop offset="45%" stopColor={dominantTheme.secondary} stopOpacity="0.22" />
              <stop offset="85%" stopColor={dominantTheme.gradientStops[2]} stopOpacity="0.10" />
              <stop offset="100%" stopColor="#040814" stopOpacity="0.0" />
            </radialGradient>

            {/* Pulsating Filter Glow */}
            <filter id="radarAuraGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* High Intensity Vertex Glow */}
            <filter id="vertexHighlightGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.5" result="blur2" />
              <feComposite in="SourceGraphic" in2="blur2" operator="over" />
            </filter>
          </defs>

          {/* ========================================================= */}
          {/* MAGIC CIRCLES & RINGS (EVOLVE BY TIER)                    */}
          {/* ========================================================= */}

          {/* Base outer circle */}
          <circle
            cx={center}
            cy={center}
            r={radius * 1.12}
            fill="none"
            stroke={dominantTheme.secondary}
            strokeOpacity="0.30"
            strokeWidth="1.2"
          />

          {/* Tier-dependent celestial ring */}
          <circle
            cx={center}
            cy={center}
            r={radius * 1.06}
            fill="none"
            stroke={dominantTheme.primary}
            strokeOpacity="0.38"
            strokeWidth="0.8"
            strokeDasharray={highestRank.tier >= 2 ? "4 4" : "2 5"}
          />

          {/* Grand Tier esoteric ring (Tier II+) */}
          {highestRank.tier >= 2 && (
            <circle
              cx={center}
              cy={center}
              r={radius * 1.01}
              fill="none"
              stroke="#dfa86c"
              strokeOpacity="0.4"
              strokeWidth="0.75"
              strokeDasharray="8 6"
            />
          )}

          {/* Supreme Transcendental Ring (Tier VI+) */}
          {highestRank.tier >= 6 && (
            <circle
              cx={center}
              cy={center}
              r={radius * 1.18}
              fill="none"
              stroke={dominantTheme.primary}
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeDasharray="1 8"
              filter="url(#radarAuraGlow)"
            />
          )}

          {/* Inner focus circle */}
          <circle
            cx={center}
            cy={center}
            r={radius * 0.48}
            fill="none"
            stroke={dominantTheme.secondary}
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
              stroke={dominantTheme.secondary}
              strokeOpacity={lvl === 1.0 ? 0.6 : 0.22}
              strokeWidth={lvl === 1.0 ? "1.5" : "1"}
              strokeDasharray={lvl === 1.0 ? undefined : "3 3"}
            />
          ))}

          {/* Axis lines from center to outer vertices */}
          {ORDERED_AREAS.map((code, i) => {
            const { x, y } = getCoordinates(i, 1.1);
            const isHovered = hoveredArea === code;
            const theme = AREA_THEMES[code];

            return (
              <line
                key={code}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={isHovered ? theme.primary : dominantTheme.secondary}
                strokeOpacity={isHovered ? 1.0 : 0.35}
                strokeWidth={isHovered ? "2.2" : "1"}
                filter={isHovered ? "url(#radarAuraGlow)" : undefined}
                className="transition-all duration-300 cursor-pointer"
                onClick={() => handleAreaClick(code)}
                data-testid={`radar-axis-${code}`}
              />
            );
          })}

          {/* ========================================================= */}
          {/* MANA NEBULA POLYGON (EXPANDS & RETREATS)                  */}
          {/* ========================================================= */}
          <polygon
            points={polygonPointsStr}
            fill="url(#manaNebulaGradient)"
            stroke={dominantTheme.primary}
            strokeWidth="2.4"
            filter="url(#radarAuraGlow)"
            className="transition-all duration-700 ease-out nebula-glow"
            data-testid="radar-polygon"
          />

          {/* ========================================================= */}
          {/* FLOATING RUNIC PARTICLES (ELDER FUTHARK MANA MOTES)       */}
          {/* ========================================================= */}
          <g data-testid="radar-floating-runes">
            {RUNIC_PARTICLES.map((p, idx) => {
              const angle = -Math.PI / 2 + p.angleRatio * 2 * Math.PI;
              const px = center + radius * p.rRatio * Math.cos(angle);
              const py = center + radius * p.rRatio * Math.sin(angle);

              return (
                <text
                  key={idx}
                  x={px}
                  y={py}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="rune-particle font-fantasy select-none pointer-events-none"
                  style={{
                    animationDelay: p.delay,
                    animationDuration: p.duration,
                    fill: dominantTheme.accent,
                    fontSize: "11px",
                  }}
                >
                  {p.rune}
                </text>
              );
            })}
          </g>

          {/* ========================================================= */}
          {/* VERTEX HIGHLIGHT CIRCLES (HOVER & TOUCH)                  */}
          {/* ========================================================= */}
          {statPoints.map(({ code, coord }) => {
            const isHovered = hoveredArea === code;
            const theme = AREA_THEMES[code];

            return (
              <g
                key={code}
                className="cursor-pointer group"
                onClick={() => handleAreaClick(code)}
                onMouseEnter={() => setHoveredArea(code)}
                onMouseLeave={() => setHoveredArea(null)}
                data-testid={`radar-vertex-${code}`}
              >
                {/* Active hover pulse halo */}
                {isHovered && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="9"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                    filter="url(#vertexHighlightGlow)"
                  />
                )}
                {/* Outer vertex ring */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? "6" : "4.5"}
                  fill="#040814"
                  stroke={isHovered ? theme.primary : dominantTheme.secondary}
                  strokeWidth={isHovered ? "2.5" : "1.8"}
                  className="transition-all duration-300"
                />
                {/* Center glowing bead */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? "3" : "2"}
                  fill={isHovered ? theme.primary : dominantTheme.primary}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* ========================================================= */}
          {/* ATTRIBUTE LABELS (CODE, MASTERY, AREA NAME)               */}
          {/* ========================================================= */}
          {ORDERED_AREAS.map((code, i) => {
            const { x, y } = getCoordinates(i, 1.28);
            const area = BASE_AREAS.find((a) => a.code === code);
            const val = attributes[code] ?? 0;
            const isHovered = hoveredArea === code;
            const theme = AREA_THEMES[code];

            return (
              <g
                key={code}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer group transition-transform duration-300 hover:scale-105"
                onClick={() => handleAreaClick(code)}
                onMouseEnter={() => setHoveredArea(code)}
                onMouseLeave={() => setHoveredArea(null)}
                data-testid={`radar-label-${code}`}
              >
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fill: isHovered ? theme.primary : dominantTheme.primary,
                  }}
                  className="font-fantasy text-[11px] font-bold tracking-widest transition-colors duration-300"
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

      {/* ========================================================= */}
      {/* RUNIC CARD / INTERACTIVE TOOLTIP                          */}
      {/* ========================================================= */}
      <div
        className="w-full max-w-[320px] mt-2 relative p-2.5 bg-[#040814]/95 border transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
        style={{
          borderColor: `${activeTheme.primary}55`,
          boxShadow: `0 0 15px ${activeTheme.glow}`,
        }}
        data-testid="radar-tooltip"
      >
        <GildedCorners size="xs" color={activeTheme.primary} withInnerFrame={false} />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[11px] font-fantasy font-bold tracking-wider"
                style={{ color: activeTheme.primary }}
              >
                {activeAreaForTooltip} · {activeAreaMeta?.name}
              </span>
              <span className="text-[9px] font-fantasy px-1 py-0.2 bg-[#091024] text-[#e8d5b5] border border-[#c89b55]/40">
                Tier {activeRank.tierRoman} [{activeRank.subGradeRoman}]
              </span>
            </div>
            <div className="text-[11px] text-[#f8ecd5] font-fantasy mt-0.5 truncate" title={activeRank.title}>
              {activeRank.title}
            </div>
          </div>

          <div className="text-right font-mono shrink-0">
            <div className="text-xs font-bold" style={{ color: activeTheme.primary }}>
              {attributes[activeAreaForTooltip] ?? 0} pts
            </div>
            <div className="text-[9px] text-[#a39171]">
              +{activeRank.ptsToNextGrade} p/ Grau
            </div>
          </div>
        </div>

        {/* Dynamic Horizon Progress Bar */}
        <div className="relative z-10 mt-2 space-y-1">
          <div className="flex justify-between text-[9px] font-mono text-[#a39171]">
            <span>Progresso do Grau ({activeRank.subGradeProgressPct}%)</span>
            <span>Meta: {dynamicCeiling} pts</span>
          </div>
          <div className="w-full bg-[#060c1d] h-1.5 overflow-hidden border border-[#c89b55]/40 p-[0.5px]">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${activeRank.subGradeProgressPct}%`,
                backgroundColor: activeTheme.primary,
                boxShadow: `0 0 8px ${activeTheme.primary}`,
              }}
            />
          </div>
        </div>

        {showHorizonBadge && (
          <div className="relative z-10 mt-1.5 pt-1.5 border-t border-[#966422]/30 flex items-center justify-between text-[9px] font-mono text-[#c5b08f]">
            <span>
              Horizonte Vivo:{" "}
              <strong data-testid="radar-dynamic-ceiling" className="text-[#fde047]">
                {dynamicCeiling.toLocaleString()} pts
              </strong>
            </span>
            <span className="font-fantasy text-[9px]" style={{ color: dominantTheme.accent }}>
              Aura: {dominantTheme.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
