import React from "react";

export interface GildedCornersProps {
  size?: "xs" | "sm" | "md" | "lg";
  color?: string; // Borda das cantoneiras
  diamondColor?: string; // Cor do losango central
  glow?: boolean;
  withInnerFrame?: boolean;
  withCenterNotches?: boolean;
  withRunes?: boolean;
  runicTop?: string;
  runicBottom?: string;
  className?: string;
}

export const GildedCorners: React.FC<GildedCornersProps> = ({
  size = "md",
  color = "#dfa86c",
  diamondColor = "#fde047",
  glow = true,
  withInnerFrame = true,
  withCenterNotches = false,
  withRunes = false,
  runicTop,
  runicBottom,
  className = "",
}) => {
  const sizeConfig = {
    xs: {
      bracket: "w-2 h-2",
      borderWidth: "border",
      diamond: "w-1 h-1",
      diamondPos: "top-0.5 left-0.5",
      diamondPosTr: "top-0.5 right-0.5",
      diamondPosBl: "bottom-0.5 left-0.5",
      diamondPosBr: "bottom-0.5 right-0.5",
      inset: "inset-[2px]",
    },
    sm: {
      bracket: "w-2.5 h-2.5",
      borderWidth: "border-t-[1.5px] border-l-[1.5px]",
      borderWidthTr: "border-t-[1.5px] border-r-[1.5px]",
      borderWidthBl: "border-b-[1.5px] border-l-[1.5px]",
      borderWidthBr: "border-b-[1.5px] border-r-[1.5px]",
      diamond: "w-1 h-1",
      diamondPos: "top-1 left-1",
      diamondPosTr: "top-1 right-1",
      diamondPosBl: "bottom-1 left-1",
      diamondPosBr: "bottom-1 right-1",
      inset: "inset-[3px]",
    },
    md: {
      bracket: "w-3.5 h-3.5",
      borderWidth: "border-t-2 border-l-2",
      borderWidthTr: "border-t-2 border-r-2",
      borderWidthBl: "border-b-2 border-l-2",
      borderWidthBr: "border-b-2 border-r-2",
      diamond: "w-1.5 h-1.5",
      diamondPos: "top-1 left-1",
      diamondPosTr: "top-1 right-1",
      diamondPosBl: "bottom-1 left-1",
      diamondPosBr: "bottom-1 right-1",
      inset: "inset-[3px]",
    },
    lg: {
      bracket: "w-4.5 h-4.5",
      borderWidth: "border-t-2 border-l-2",
      borderWidthTr: "border-t-2 border-r-2",
      borderWidthBl: "border-b-2 border-l-2",
      borderWidthBr: "border-b-2 border-r-2",
      diamond: "w-2 h-2",
      diamondPos: "top-1.5 left-1.5",
      diamondPosTr: "top-1.5 right-1.5",
      diamondPosBl: "bottom-1.5 left-1.5",
      diamondPosBr: "bottom-1.5 right-1.5",
      inset: "inset-[4px]",
    },
  }[size];

  const diamondGlowStyle = glow
    ? {
        boxShadow: `0 0 6px ${diamondColor}`,
      }
    : undefined;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {/* Inner hairline frame */}
      {withInnerFrame && (
        <div
          className={`absolute ${sizeConfig.inset} border pointer-events-none`}
          style={{ borderColor: `${color}25` }}
        />
      )}

      {/* Top-Left Corner */}
      <div
        className={`absolute top-0 left-0 ${sizeConfig.bracket} ${
          size === "xs" ? "border-t border-l" : sizeConfig.borderWidth
        }`}
        style={{ borderColor: color }}
      >
        <div
          className={`absolute ${sizeConfig.diamondPos} ${sizeConfig.diamond} rotate-45`}
          style={{
            backgroundColor: diamondColor,
            ...diamondGlowStyle,
          }}
        />
      </div>

      {/* Top-Right Corner */}
      <div
        className={`absolute top-0 right-0 ${sizeConfig.bracket} ${
          size === "xs" ? "border-t border-r" : sizeConfig.borderWidthTr
        }`}
        style={{ borderColor: color }}
      >
        <div
          className={`absolute ${sizeConfig.diamondPosTr} ${sizeConfig.diamond} rotate-45`}
          style={{
            backgroundColor: diamondColor,
            ...diamondGlowStyle,
          }}
        />
      </div>

      {/* Bottom-Left Corner */}
      <div
        className={`absolute bottom-0 left-0 ${sizeConfig.bracket} ${
          size === "xs" ? "border-b border-l" : sizeConfig.borderWidthBl
        }`}
        style={{ borderColor: color }}
      >
        <div
          className={`absolute ${sizeConfig.diamondPosBl} ${sizeConfig.diamond} rotate-45`}
          style={{
            backgroundColor: diamondColor,
            ...diamondGlowStyle,
          }}
        />
      </div>

      {/* Bottom-Right Corner */}
      <div
        className={`absolute bottom-0 right-0 ${sizeConfig.bracket} ${
          size === "xs" ? "border-b border-r" : sizeConfig.borderWidthBr
        }`}
        style={{ borderColor: color }}
      >
        <div
          className={`absolute ${sizeConfig.diamondPosBr} ${sizeConfig.diamond} rotate-45`}
          style={{
            backgroundColor: diamondColor,
            ...diamondGlowStyle,
          }}
        />
      </div>

      {/* Center Notches */}
      {withCenterNotches && (
        <>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] pointer-events-none"
            style={{
              background: `linear-gradient(to right, transparent, ${diamondColor}, transparent)`,
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] pointer-events-none"
            style={{
              background: `linear-gradient(to right, transparent, ${color}90, transparent)`,
            }}
          />
        </>
      )}

      {/* Runic Inscriptions on Borders */}
      {withRunes && (
        <>
          {/* Top Runic Inscription */}
          <div
            className="absolute top-[1.5px] left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 opacity-45 group-hover:opacity-90 transition-all duration-300 pointer-events-none select-none text-[8px] font-mono tracking-[0.28em] drop-shadow-[0_0_4px_currentColor] px-2 bg-[#060e20]/80"
            style={{ color: diamondColor }}
          >
            <span className="text-[7px] opacity-70">᚛</span>
            <span>{runicTop || "ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ"}</span>
            <span className="text-[7px] opacity-70">᚜</span>
          </div>

          {/* Bottom Runic Inscription */}
          <div
            className="absolute bottom-[1.5px] left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-85 transition-all duration-300 pointer-events-none select-none text-[7.5px] font-mono tracking-[0.25em] drop-shadow-[0_0_4px_currentColor] px-2 bg-[#060e20]/80"
            style={{ color }}
          >
            <span className="text-[6px] opacity-75">✦</span>
            <span>{runicBottom || "ᛋ ᛚ ᛁ ᛗ ᛖ · ᛋ ᚨ ᚷ ᛖ"}</span>
            <span className="text-[6px] opacity-75">✦</span>
          </div>

          {/* Side Glyphs */}
          <div
            className="absolute left-[1.5px] top-1/2 -translate-y-1/2 text-[7px] opacity-35 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none select-none font-mono"
            style={{ color }}
          >
            ✦
          </div>
          <div
            className="absolute right-[1.5px] top-1/2 -translate-y-1/2 text-[7px] opacity-35 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none select-none font-mono"
            style={{ color }}
          >
            ✦
          </div>
        </>
      )}
    </div>
  );
};
