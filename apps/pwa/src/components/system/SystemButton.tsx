import React from "react";
import { hapticFeedback } from "../../services/haptics";

export type SystemButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "cyan-glow";
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
    "relative inline-flex items-center justify-center font-mono font-medium tracking-wider transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40";

  const sizeStyles: Record<SystemButtonSize, string> = {
    sm: "px-2.5 py-1 text-xs gap-1.5 rounded",
    md: "px-4 py-2 text-xs md:text-sm gap-2 rounded-lg",
    lg: "px-6 py-3 text-sm md:text-base gap-2.5 rounded-xl font-bold",
  };

  const variantStyles: Record<SystemButtonVariant, string> = {
    primary:
      "bg-cyan-500/15 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-300 hover:text-white hover:shadow-[0_0_15px_rgba(0,240,255,0.35)] active:scale-[0.98]",
    "cyan-glow":
      "bg-cyan-400 text-slate-950 font-bold border border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(0,240,255,0.7)] active:scale-[0.98]",
    secondary:
      "bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300 hover:bg-slate-800/80 active:scale-[0.98]",
    danger:
      "bg-red-950/40 border border-red-500/60 text-red-300 hover:bg-red-900/50 hover:border-red-400 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] active:scale-[0.98]",
    ghost:
      "bg-transparent border border-transparent text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/20 active:scale-[0.98]",
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
