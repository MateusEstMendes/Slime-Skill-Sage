import React from "react";

export interface SystemInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const SystemInput: React.FC<SystemInputProps> = ({
  label,
  error,
  helper,
  id,
  className = "",
  ...rest
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-mono font-medium uppercase tracking-wider text-cyan-400/90 flex items-center justify-between"
        >
          <span>{label}</span>
          {rest.required && <span className="text-red-400 text-[10px]">*OBRIGATÓRIO</span>}
        </label>
      )}
      <input
        id={inputId}
        {...rest}
        className={`w-full bg-slate-950/90 border ${
          error ? "border-red-500/80 focus:ring-red-400" : "border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/40"
        } rounded-lg px-3.5 py-2.5 text-sm font-sans text-slate-100 placeholder-slate-500 outline-none focus:ring-2 transition-all duration-150 ${className}`}
      />
      {error && <span className="text-xs font-mono text-red-400">{error}</span>}
      {helper && !error && <span className="text-xs font-mono text-slate-400">{helper}</span>}
    </div>
  );
};

export interface SystemTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const SystemTextarea: React.FC<SystemTextareaProps> = ({
  label,
  error,
  helper,
  id,
  className = "",
  rows = 3,
  ...rest
}) => {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-mono font-medium uppercase tracking-wider text-cyan-400/90 flex items-center justify-between"
        >
          <span>{label}</span>
          {rest.required && <span className="text-red-400 text-[10px]">*OBRIGATÓRIO</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        {...rest}
        className={`w-full bg-slate-950/90 border ${
          error ? "border-red-500/80 focus:ring-red-400" : "border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/40"
        } rounded-lg px-3.5 py-2.5 text-sm font-sans text-slate-100 placeholder-slate-500 outline-none focus:ring-2 transition-all duration-150 resize-y ${className}`}
      />
      {error && <span className="text-xs font-mono text-red-400">{error}</span>}
      {helper && !error && <span className="text-xs font-mono text-slate-400">{helper}</span>}
    </div>
  );
};

export interface SystemSelectOption {
  value: string;
  label: string;
}

export interface SystemSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SystemSelectOption[];
  error?: string;
  helper?: string;
}

export const SystemSelect: React.FC<SystemSelectProps> = ({
  label,
  options,
  error,
  helper,
  id,
  className = "",
  ...rest
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-mono font-medium uppercase tracking-wider text-cyan-400/90 flex items-center justify-between"
        >
          <span>{label}</span>
          {rest.required && <span className="text-red-400 text-[10px]">*OBRIGATÓRIO</span>}
        </label>
      )}
      <select
        id={selectId}
        {...rest}
        className={`w-full bg-slate-950/90 border ${
          error ? "border-red-500/80 focus:ring-red-400" : "border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/40"
        } rounded-lg px-3.5 py-2.5 text-sm font-sans text-slate-100 outline-none focus:ring-2 transition-all duration-150 ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-mono text-red-400">{error}</span>}
      {helper && !error && <span className="text-xs font-mono text-slate-400">{helper}</span>}
    </div>
  );
};
