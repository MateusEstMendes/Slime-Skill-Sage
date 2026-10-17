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
      className={`relative bg-[#0a1224]/85 border ${
        glow ? "border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.2)]" : "border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]"
      } backdrop-blur-md rounded-xl p-4 md:p-6 transition-all duration-150 min-w-0 overflow-hidden ${className}`}
      {...rest}
    >
      {/* HUD Corner Accents */}
      {cornerAccents && (
        <>
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400 rounded-tl pointer-events-none" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400 rounded-tr pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400 rounded-bl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400 rounded-br pointer-events-none" />
        </>
      )}

      {/* Optional Header */}
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-3 mb-4 min-w-0">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="font-mono font-bold text-sm md:text-base text-cyan-300 tracking-wider flex items-center gap-2 min-w-0 break-words [overflow-wrap:anywhere]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{title}</span>
              </h3>
            )}
            {subtitle && (
              <div className="text-xs text-slate-400 font-mono mt-0.5 tracking-wide min-w-0 break-words [overflow-wrap:anywhere]">
                {subtitle}
              </div>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {/* Panel Body */}
      {children}
    </div>
  );
};
