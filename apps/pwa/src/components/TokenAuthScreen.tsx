import React, { useState } from "react";
import {
  ShieldAlert,
  KeyRound,
  Globe,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { verifyApiConnection } from "../services/apiClient";
import { authStorage } from "../services/authStorage";

interface TokenAuthScreenProps {
  onSuccess: (token: string, apiUrl: string) => void;
}

export const TokenAuthScreen: React.FC<TokenAuthScreenProps> = ({
  onSuccess,
}) => {
  const [apiUrl, setApiUrl] = useState(authStorage.getApiUrl());
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMessage("Por favor, informe a Chave Secreta do Sistema.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await verifyApiConnection(apiUrl, token);

    setLoading(false);

    if (result.success) {
      authStorage.setToken(token.trim());
      authStorage.setApiUrl(apiUrl.trim());
      onSuccess(token.trim(), apiUrl.trim());
    } else {
      setErrorMessage(result.error || "Erro ao conectar ao Sistema.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050811] relative overflow-hidden font-sans">
      {/* Decorative System Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass System Window */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0a1224]/85 border border-cyan-500/40 rounded-xl p-6 sm:p-8 shadow-[0_0_25px_rgba(0,240,255,0.15)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6 border-b border-cyan-500/20 pb-4">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan-400/80 font-mono">
                [VOZ DO MUNDO] AUTENTICAÇÃO
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                Conexão com o Sistema
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Identifique-se para estabelecer sintonia com a Grande Sábio e
            carregar os protocolos do Sistema.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API URL Field */}
            <div>
              <label
                htmlFor="api-url"
                className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                URL da API
              </label>
              <input
                id="api-url"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-cyan-500/30 rounded-lg text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
              />
            </div>

            {/* Token Secret Field */}
            <div>
              <label
                htmlFor="app-token"
                className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Chave Secreta do Sistema (APP_SECRET)
              </label>
              <input
                id="app-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Insira seu token secreto..."
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-cyan-500/30 rounded-lg text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs mt-3 animate-fadeIn"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group border border-cyan-400/40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sincronizando com a API...</span>
                </>
              ) : (
                <>
                  <span>Conectar ao Sistema</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[11px] font-mono text-slate-500 tracking-wider">
              SLIME SAGE • PROTOCOLO DE SEGURANÇA v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
