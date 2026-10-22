import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifyApiConnection,
  sendChatMessage,
  synthesizeSpeechApi,
} from "./apiClient";

describe("apiClient — Tratamento de Erros de Autenticação (HTTP 401) e Conectividade", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("verifyApiConnection (GET /health)", () => {
    it("retorna erro amigável quando a API responde 401 (Token Incorreto ou Inválido)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Invalid secret token" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await verifyApiConnection(
        "http://localhost:3000",
        "chave-errada-123",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Acesso Negado: Token Secreto incorreto ou inválido.",
      );
      expect(result.data).toBeUndefined();
    });

    it("retorna sucesso quando o token é válido e a API responde 200 OK", async () => {
      const mockHealth = {
        status: "ok" as const,
        app: "slime-sage",
        timestamp: "2026-10-21T00:00:00Z",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockHealth), {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await verifyApiConnection(
        "http://localhost:3000",
        "super-secret-system-key",
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe("ok");
      expect(result.data?.app).toBe("slime-sage");
    });

    it("retorna erro de formato de rede quando a conexão é recusada", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new Error("Failed to fetch"),
      );

      const result = await verifyApiConnection(
        "http://servidor-inexistente:9999",
        "token-qualquer",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Não foi possível alcançar o servidor");
    });
  });

  describe("sendChatMessage (POST /chat)", () => {
    it("retorna erro 401 'Acesso Negado: Token Secreto incorreto ou expirado' no chat", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Invalid secret token" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await sendChatMessage(
        "http://localhost:3000",
        "token-invalido-ou-antigo",
        {
          messages: [{ role: "user", content: "Olá Grande Sábio" }],
        },
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Acesso Negado: Token Secreto incorreto ou expirado.",
      );
      expect(result.data).toBeUndefined();
    });

    it("envia cabeçalho Authorization Bearer correto e obtém resposta com sucesso (200 OK)", async () => {
      const mockChatResponse = {
        role: "assistant" as const,
        content: "Resposta processada com sucesso.",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockChatResponse), {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await sendChatMessage(
        "http://localhost:3000",
        "super-secret-system-key",
        {
          messages: [{ role: "user", content: "Testando envio válido" }],
        },
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("Resposta processada com sucesso.");

      // Verifica envio do header Authorization: Bearer
      const calledOptions = fetchSpy.mock.calls[0]?.[1] as RequestInit;
      const headers = calledOptions.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer super-secret-system-key");
    });
  });

  describe("synthesizeSpeechApi (POST /tts)", () => {
    it("retorna erro 401 'Acesso Negado: Token Secreto incorreto para síntese de voz'", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Invalid secret token" }), {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await synthesizeSpeechApi(
        "http://localhost:3000",
        "token-rejeitado",
        "Voz do Mundo",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Acesso Negado: Token Secreto incorreto para síntese de voz.",
      );
      expect(result.data).toBeUndefined();
    });

    it("realiza síntese com sucesso quando autorizado (200 OK)", async () => {
      const mockTts = {
        audioBase64: "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
        mimeType: "audio/wav",
        source: "gemini" as const,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockTts), {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await synthesizeSpeechApi(
        "http://localhost:3000",
        "super-secret-system-key",
        "Voz do Mundo",
      );

      expect(result.success).toBe(true);
      expect(result.data?.audioBase64).toBe(mockTts.audioBase64);
    });
  });
});
