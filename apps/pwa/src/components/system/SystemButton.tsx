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
    "relative inline-flex items-center justify-center font-fantasy font-bold uppercase tracking-wider transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#dfa86c]/50 disabled:cursor-not-allowed disabled:opacity-40";

  const sizeStyles: Record<SystemButtonSize, string> = {
    sm: "px-3 py-1 text-[11px] gap-1.5 rounded-md",
    md: "px-4 py-2 text-xs md:text-sm gap-2 rounded-lg",
    lg: "px-6 py-3 text-sm md:text-base gap-2.5 rounded-xl font-bold",
  };

  const variantStyles: Record<SystemButtonVariant, string> = {
    primary:
      "bg-gradient-to-b from-[#1a150e]/90 to-[#090f1d]/95 border border-[#dfa86c]/75 text-[#fde047] shadow-[inset_0_0_10px_rgba(223,168,108,0.12)] hover:bg-[#dfa86c]/20 hover:border-[#fef08a] hover:text-white hover:shadow-[0_0_18px_rgba(223,168,108,0.4)] active:scale-[0.98]",
    "cyan-glow":
      "bg-gradient-to-b from-[#fef08a] via-[#dfa86c] to-[#b47b38] text-[#040814] font-extrabold border border-[#fef08a] shadow-[0_0_20px_rgba(223,168,108,0.5)] hover:brightness-110 hover:shadow-[0_0_28px_rgba(254,240,138,0.75)] active:scale-[0.98]",
    "gold-glow":
      "bg-gradient-to-b from-[#fef08a] via-[#dfa86c] to-[#b47b38] text-[#040814] font-extrabold border border-[#fef08a] shadow-[0_0_20px_rgba(223,168,108,0.5)] hover:brightness-110 hover:shadow-[0_0_28px_rgba(254,240,138,0.75)] active:scale-[0.98]",
    secondary:
      "bg-[#081124]/90 border border-[#dfa86c]/30 text-slate-200 hover:border-[#dfa86c]/70 hover:text-[#fde047] hover:bg-[#dfa86c]/10 active:scale-[0.98]",
    danger:
      "bg-red-950/50 border border-red-500/60 text-red-200 hover:bg-red-900/60 hover:border-red-400 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] active:scale-[0.98]",
    ghost:
      "bg-transparent border border-transparent text-slate-300 hover:text-[#fde047] hover:bg-[#dfa86c]/15 hover:border-[#dfa86c]/25 active:scale-[0.98]",
  };

  const showCartoucheTips = variant === "primary" || variant === "cyan-glow" || variant === "gold-glow";

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {showCartoucheTips && (
        <>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-current opacity-60 pointer-events-none" />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-current opacity-60 pointer-events-none" />
        </>
      )}
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
