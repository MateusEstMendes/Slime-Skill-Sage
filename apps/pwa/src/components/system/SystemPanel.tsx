import React from "react";

export interface SystemPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  glow?: boolean;
  cornerAccents?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const SystemPanel: React.FC<SystemPanelProps> = ({
  title,
  subtitle,
  headerAction,
  glow = false,
  cornerAccents = true,
  className = "",
  children,
  ...rest
}) => {
  return (
    <div
      className={`relative bg-[#060e20]/90 border ${
        glow
          ? "border-[#dfa86c] shadow-[0_0_28px_rgba(223,168,108,0.25),inset_0_0_15px_rgba(223,168,108,0.08)]"
          : "border-[#dfa86c]/35 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_0_12px_rgba(223,168,108,0.04)]"
      } backdrop-blur-md rounded-xl p-4 md:p-6 transition-all duration-150 min-w-0 overflow-hidden ${className}`}
      {...rest}
    >
      {/* Inner Gilded Hairline Frame */}
      <div className="absolute inset-[3px] border border-[#dfa86c]/15 rounded-[9px] pointer-events-none" />

      {/* Dark Fantasy Gothic Corner Fleurons & Center Notches */}
      {cornerAccents && (
        <>
          {/* Top-Left Ornate Corner */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#dfa86c] rounded-tl pointer-events-none" />
          <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-[#dfa86c]/80 rotate-45 pointer-events-none" />

          {/* Top-Right Ornate Corner */}
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#dfa86c] rounded-tr pointer-events-none" />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#dfa86c]/80 rotate-45 pointer-events-none" />

          {/* Bottom-Left Ornate Corner */}
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#dfa86c] rounded-bl pointer-events-none" />
          <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 bg-[#dfa86c]/80 rotate-45 pointer-events-none" />

          {/* Bottom-Right Ornate Corner */}
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#dfa86c] rounded-br pointer-events-none" />
          <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-[#dfa86c]/80 rotate-45 pointer-events-none" />

          {/* Top & Bottom Center Crest Notches */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-transparent via-[#fde047] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-transparent via-[#dfa86c]/70 to-transparent pointer-events-none" />
        </>
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
