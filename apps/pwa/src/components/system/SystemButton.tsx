import React from "react";
import { hapticFeedback } from "../../services/haptics";

export type SystemButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "cyan-glow"
  | "gold-glow";
export type SystemButtonSize = "sm" | "md" | "lg";

export interface SystemButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SystemButtonVariant;
  size?: SystemButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const SystemButton: React.FC<SystemButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  onClick,
  className = "",
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    hapticFeedback.tap();
    onClick?.(e);
  };

  const baseStyles =
    "relative inline-flex items-center justify-center font-fantasy font-bold uppercase tracking-wider transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#dfa86c]/70 disabled:cursor-not-allowed disabled:opacity-40 rounded-none";

  const sizeStyles: Record<SystemButtonSize, string> = {
    sm: "px-3 py-1 text-[11px] gap-1.5",
    md: "px-4 py-2 text-xs md:text-sm gap-2",
    lg: "px-6 py-3 text-sm md:text-base gap-2.5 font-bold",
  };

  const variantStyles: Record<SystemButtonVariant, string> = {
    primary:
      "bg-gradient-to-b from-[#1c160e] via-[#0d1424] to-[#040814] border border-[#dfa86c]/80 text-[#fde047] shadow-[inset_0_0_12px_rgba(223,168,108,0.15),0_0_15px_rgba(223,168,108,0.1)] hover:border-[#fef08a] hover:text-white hover:shadow-[0_0_20px_rgba(223,168,108,0.45)] hover:bg-[#1a233a] active:scale-[0.98]",
    "cyan-glow":
      "bg-gradient-to-b from-[#fef08a] via-[#dfa86c] to-[#966422] text-[#040814] font-extrabold border border-[#fef08a] shadow-[0_0_20px_rgba(223,168,108,0.5)] hover:brightness-110 hover:shadow-[0_0_28px_rgba(254,240,138,0.75)] active:scale-[0.98]",
    "gold-glow":
      "bg-gradient-to-b from-[#fef08a] via-[#dfa86c] to-[#966422] text-[#040814] font-extrabold border border-[#fef08a] shadow-[0_0_20px_rgba(223,168,108,0.5)] hover:brightness-110 hover:shadow-[0_0_28px_rgba(254,240,138,0.75)] active:scale-[0.98]",
    secondary:
      "bg-[#081124]/90 border border-[#dfa86c]/40 text-[#f8ecd5] hover:border-[#dfa86c]/90 hover:text-[#fde047] hover:bg-[#dfa86c]/15 active:scale-[0.98]",
    danger:
      "bg-gradient-to-b from-rose-950/60 to-[#120508]/90 border border-rose-500/70 text-rose-200 hover:bg-rose-900/60 hover:border-rose-400 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] active:scale-[0.98]",
    ghost:
      "bg-transparent border border-transparent text-[#c5b08f] hover:text-[#fde047] hover:bg-[#dfa86c]/15 hover:border-[#dfa86c]/40 active:scale-[0.98]",
  };

  const showCartoucheTips = variant === "primary" || variant === "cyan-glow" || variant === "gold-glow";

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {/* Moldura interna decorativa estilo RPG / Cartela */}
      <span className="absolute inset-[2px] border border-current opacity-20 pointer-events-none" />

      {/* Ornamentos em diamante nos cantos da cartela */}
      <span className="absolute -top-[2px] -left-[2px] w-1 h-1 bg-[#dfa86c] opacity-80 pointer-events-none" />
      <span className="absolute -top-[2px] -right-[2px] w-1 h-1 bg-[#dfa86c] opacity-80 pointer-events-none" />
      <span className="absolute -bottom-[2px] -left-[2px] w-1 h-1 bg-[#dfa86c] opacity-80 pointer-events-none" />
      <span className="absolute -bottom-[2px] -right-[2px] w-1 h-1 bg-[#dfa86c] opacity-80 pointer-events-none" />

      {showCartoucheTips && (
        <>
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-current opacity-70 pointer-events-none" />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-current opacity-70 pointer-events-none" />
        </>
      )}
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent animate-spin mr-1.5" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
