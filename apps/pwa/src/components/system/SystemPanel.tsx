import React from "react";
import { GildedCorners } from "./GildedCorners";

export interface SystemPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  glow?: boolean;
  cornerAccents?: boolean;
  withRunes?: boolean;
  runicTop?: string;
  runicBottom?: string;
  className?: string;
  children: React.ReactNode;
}

export const SystemPanel: React.FC<SystemPanelProps> = ({
  title,
  subtitle,
  headerAction,
  glow = false,
  cornerAccents = true,
  withRunes = false,
  runicTop,
  runicBottom,
  className = "",
  children,
  ...rest
}) => {
  return (
    <div
      className={`group relative bg-[#060e20]/90 border ${
        glow
          ? "border-[#dfa86c] shadow-[0_0_28px_rgba(223,168,108,0.25),inset_0_0_15px_rgba(223,168,108,0.08)]"
          : "border-[#dfa86c]/35 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_0_12px_rgba(223,168,108,0.04)]"
      } backdrop-blur-md rounded-none p-4 md:p-6 transition-all duration-150 min-w-0 overflow-hidden ${className}`}
      {...rest}
    >
      {/* Dark Fantasy Gothic Gilded Corners, Inner Frame & Runic Inscriptions */}
      {cornerAccents && (
        <GildedCorners
          size="md"
          glow={glow}
          withCenterNotches={true}
          withRunes={withRunes}
          runicTop={runicTop}
          runicBottom={runicBottom}
        />
      )}

      {/* Optional Header */}
      {(title || subtitle || headerAction) && (
        <div className="relative flex items-start justify-between gap-3 border-b border-[#dfa86c]/25 pb-3 mb-4 min-w-0">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="font-fantasy font-bold text-sm md:text-base text-[#fde047] tracking-wider flex items-center gap-2 min-w-0 break-words [overflow-wrap:anywhere] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <span className="w-2 h-2 bg-[#dfa86c] rotate-45 shrink-0 shadow-[0_0_6px_rgba(223,168,108,0.8)]" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{title}</span>
              </h3>
            )}
            {subtitle && (
              <div className="text-xs text-slate-300/80 font-mono mt-1 tracking-wide min-w-0 break-words [overflow-wrap:anywhere]">
                {subtitle}
              </div>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {/* Panel Body */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
