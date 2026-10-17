import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Download, Copy, Check } from "lucide-react";
import { logger } from "../services/logger";
import { GildedCorners } from "./system/GildedCorners";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
  exporting: boolean;
}

export class SystemErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      copied: false,
      exporting: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    void logger.error("db", "A Voz do Mundo detectou uma anomalia na interface", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleCopyDiagnostic = async (): Promise<void> => {
    if (!this.state.error) return;
    const diagnostic = `[SISTEMA // RELATÓRIO DE ANOMALIA]\nData: ${new Date().toISOString()}\nErro: ${this.state.error.name}: ${this.state.error.message}\nStack:\n${this.state.error.stack || "Sem stack trace"}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(diagnostic);
      }
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard write fallback
    }
  };

  private handleExportLogs = async (): Promise<void> => {
    try {
      this.setState({ exporting: true });
      const logsJson = await logger.exportLogs();
      const blob = new Blob([logsJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `slime-sage-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore download errors
    } finally {
      this.setState({ exporting: false });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-screen w-full bg-[#040814] text-[#f3e5cc] flex flex-col items-center justify-center p-4 font-sans selection:bg-red-500/30 selection:text-red-200"
        >
          <div className="relative max-w-lg w-full bg-[#060e20]/95 border border-red-500/60 rounded-none p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] backdrop-blur-md overflow-hidden">
            <GildedCorners size="lg" color="#ef4444" diamondColor="#f87171" withCenterNotches />

            {/* Warning Header */}
            <div className="relative z-10 flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-950/80 border border-red-500/50 text-red-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-fantasy tracking-widest text-red-400 uppercase">
                  [SISTEMA // ANOMALIA DETECTADA]
                </span>
                <h1 className="text-xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase">
                  A Voz do Mundo detectou uma anomalia
                </h1>
              </div>
            </div>

            <p className="relative z-10 text-sm text-[#e8d5b5] mb-5 leading-relaxed">
              O fluxo de operações da interface foi interrompido por uma falha
              inesperada. Todos os dados locais permanecem preservados no ledger.
            </p>

            {/* Error Message Box */}
            <div className="relative z-10 bg-[#040814]/95 border border-red-900/60 p-3 font-mono text-xs text-red-300/90 overflow-hidden max-h-40 mb-6 shadow-[inset_0_0_12px_rgba(239,68,68,0.08)]">
              <GildedCorners size="xs" color="#ef4444" diamondColor="#f87171" withInnerFrame={false} />
              <p className="font-semibold text-red-400">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <pre className="mt-2 text-[10px] text-[#c5b08f] whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-fantasy font-bold uppercase tracking-wider bg-[#1c1308]/90 hover:bg-[#2a1d0c] text-[#fde047] border border-[#dfa86c]/60 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Recuperar</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-fantasy font-bold uppercase tracking-wider bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-500/45 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recarregar Sistema</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyDiagnostic}
                className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-fantasy font-bold uppercase tracking-wider bg-[#081329] hover:bg-[#101f42] text-[#f3e5cc] border border-[#966422]/60 transition-colors"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Diagnóstico</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={this.handleExportLogs}
                disabled={this.state.exporting}
                className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-fantasy font-bold uppercase tracking-wider bg-[#081329] hover:bg-[#101f42] text-[#f3e5cc] border border-[#966422]/60 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{this.state.exporting ? "Exportando..." : "Exportar Logs (JSON)"}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
