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
          className="text-xs font-fantasy font-semibold uppercase tracking-widest text-[#dfa86c] flex items-center justify-between"
        >
          <span>{label}</span>
          {rest.required && <span className="text-red-400 text-[10px] font-mono">*OBRIGATÓRIO</span>}
        </label>
      )}
      <input
        id={inputId}
        {...rest}
        className={`w-full bg-[#040814]/95 border ${
          error
            ? "border-red-500/80 focus:ring-red-400"
            : "border-[#966422]/60 focus:border-[#dfa86c] focus:ring-[#dfa86c]/35"
        } rounded-none px-3.5 py-2.5 text-sm font-sans text-[#f3e5cc] placeholder-[#8c7a5b] outline-none focus:ring-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.75)] transition-all duration-150 ${className}`}
      />
      {error && <span className="text-xs font-mono text-red-400">{error}</span>}
      {helper && !error && <span className="text-xs font-mono text-[#a39171]">{helper}</span>}
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
          className="text-xs font-fantasy font-semibold uppercase tracking-widest text-[#dfa86c] flex items-center justify-between"
        >
          <span>{label}</span>
          {rest.required && <span className="text-red-400 text-[10px] font-mono">*OBRIGATÓRIO</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        {...rest}
        className={`w-full bg-[#040814]/95 border ${
          error
            ? "border-red-500/80 focus:ring-red-400"
            : "border-[#966422]/60 focus:border-[#dfa86c] focus:ring-[#dfa86c]/35"
        } rounded-none px-3.5 py-2.5 text-sm font-sans text-[#f3e5cc] placeholder-[#8c7a5b] outline-none focus:ring-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.75)] transition-all duration-150 resize-y ${className}`}
      />
      {error && <span className="text-xs font-mono text-red-400">{error}</span>}
      {helper && !error && <span className="text-xs font-mono text-[#a39171]">{helper}</span>}
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
          className="text-xs font-fantasy font-semibold uppercase tracking-widest text-[#dfa86c] flex items-center justify-between"
        >
          <span>{label}</span>
          {rest.required && <span className="text-red-400 text-[10px] font-mono">*OBRIGATÓRIO</span>}
        </label>
      )}
      <select
        id={selectId}
        {...rest}
        className={`w-full bg-[#040814]/95 border ${
          error
            ? "border-red-500/80 focus:ring-red-400"
            : "border-[#966422]/60 focus:border-[#dfa86c] focus:ring-[#dfa86c]/35"
        } rounded-none px-3.5 py-2.5 text-sm font-sans text-[#f3e5cc] outline-none focus:ring-2 shadow-[inset_0_2px_10px_rgba(0,0,0,0.75)] transition-all duration-150 ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#060e20] text-[#f3e5cc]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-mono text-red-400">{error}</span>}
      {helper && !error && <span className="text-xs font-mono text-[#a39171]">{helper}</span>}
    </div>
  );
};
