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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#040814] relative overflow-hidden font-sans">
      {/* Decorative System Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#dfa86c]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#966422]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Gilded System Window */}
      <div className="w-full max-w-md relative z-10">
        <div className="relative bg-[#060e20]/95 border border-[#c89b55]/75 rounded-none p-6 sm:p-8 shadow-[0_0_35px_rgba(223,168,108,0.2)] backdrop-blur-md">
          <div className="absolute inset-[4px] border border-[#dfa86c]/25 pointer-events-none" />
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#dfa86c] pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#dfa86c] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#dfa86c] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#dfa86c] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center space-x-3 mb-6 border-b border-[#966422]/45 pb-4">
            <div className="p-2.5 bg-[#140f08] border border-[#dfa86c]/60 text-[#fde047] shadow-[0_0_12px_rgba(223,168,108,0.25)]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[#dfa86c] font-fantasy">
                [VOZ DO MUNDO] AUTENTICAÇÃO
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase">
                Conexão com o Sistema
              </h1>
            </div>
          </div>

          <p className="relative z-10 text-sm text-[#e8d5b5] mb-6 leading-relaxed">
            Identifique-se para estabelecer sintonia com a Grande Sábio e
            carregar os protocolos do Sistema.
          </p>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            {/* API URL Field */}
            <div>
              <label
                htmlFor="api-url"
                className="block text-xs font-fantasy uppercase tracking-widest text-[#dfa86c] mb-1.5 flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-[#fde047]" />
                URL da API
              </label>
              <input
                id="api-url"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full px-3.5 py-2.5 bg-[#040814]/90 border border-[#966422]/60 rounded-none text-[#f3e5cc] placeholder-[#8c7a5b] text-sm focus:outline-none focus:border-[#dfa86c] focus:ring-1 focus:ring-[#dfa86c]/50 transition-all font-mono"
              />
            </div>

            {/* Token Secret Field */}
            <div>
              <label
                htmlFor="app-token"
                className="block text-xs font-fantasy uppercase tracking-widest text-[#dfa86c] mb-1.5 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#fde047]" />
                Chave Secreta do Sistema (APP_SECRET)
              </label>
              <input
                id="app-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Insira seu token secreto..."
                className="w-full px-3.5 py-2.5 bg-[#040814]/90 border border-[#966422]/60 rounded-none text-[#f3e5cc] placeholder-[#8c7a5b] text-sm focus:outline-none focus:border-[#dfa86c] focus:ring-1 focus:ring-[#dfa86c]/50 transition-all font-mono"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-none bg-red-950/40 border border-red-500/40 text-red-200 text-xs mt-3 animate-fadeIn"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 rounded-none bg-gradient-to-b from-[#e8b974] via-[#c89b55] to-[#8a5a1d] hover:from-[#f3ca8c] hover:via-[#dfa86c] hover:to-[#9c6926] text-[#050811] font-fantasy font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(223,168,108,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group border border-[#fde047]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#050811]" />
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
          <div className="relative z-10 mt-6 pt-4 border-t border-[#966422]/40 text-center">
            <span className="text-[11px] font-fantasy text-[#a39171] tracking-widest uppercase">
              SLIME SAGE • PROTOCOLO DE SEGURANÇA v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
