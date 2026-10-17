import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { app } from "./index";

describe("API Endpoints", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.APP_SECRET = "super-secret-system-key";
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_FALLBACK;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("GET /health Endpoint", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const res = await app.request("/health");
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 401 when token is invalid", async () => {
      const res = await app.request("/health", {
        headers: {
          Authorization: "Bearer wrong-token",
        },
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid secret token");
    });

    it("should return 200 and health info when token is correct", async () => {
      const res = await app.request("/health", {
        headers: {
          Authorization: "Bearer super-secret-system-key",
        },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
      expect(body.app).toBe("slime-sage");
      expect(body).toHaveProperty("timestamp");
    });
  });

  describe("POST /tts Endpoint (Síntese de Voz G.S Kore)", () => {
    it("should return 401 when unauthenticated", async () => {
      const res = await app.request("/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Missão concluída." }),
      });
      expect(res.status).toBe(401);
    });

    it("should return 400 when body is invalid", async () => {
      const res = await app.request("/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-system-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Parâmetros inválidos");
    });

    it("should return 503 with NO_API_KEY when no Gemini keys are configured", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY_FALLBACK;

      const res = await app.request("/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-system-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Novo nível alcançado." }),
      });
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.code).toBe("NO_API_KEY");
    });

    it("should return 200 with audioBase64 when Gemini responds successfully", async () => {
      process.env.GEMINI_API_KEY = "test-primary-key";

      const mockAudioData = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: mockAudioData,
                      mimeType: "audio/wav",
                    },
                  },
                ],
              },
            },
          ],
        }),
      } as unknown as Response);

      const res = await app.request("/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-system-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Relatório de habilidades pronto." }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.audioBase64).toBe(mockAudioData);
      expect(body.mimeType).toBe("audio/wav");
      expect(body.source).toBe("gemini");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("should failover to GEMINI_API_KEY_FALLBACK when primary key receives 429 quota error", async () => {
      process.env.GEMINI_API_KEY = "test-primary-key";
      process.env.GEMINI_API_KEY_FALLBACK = "test-fallback-key";

      const mockAudioData = "FALLBACK_AUDIO_BASE64";

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        // Primeira chamada (chave primária) falha com 429
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => "Resource has been exhausted (e.g. check quota).",
        } as unknown as Response)
        // Segunda chamada (chave reserva) tem sucesso
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        data: mockAudioData,
                        mimeType: "audio/wav",
                      },
                    },
                  ],
                },
              },
            ],
          }),
        } as unknown as Response);

      const res = await app.request("/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-system-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Tentativa com failover inteligente." }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.audioBase64).toBe(mockAudioData);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy.mock.calls[0][0]).toContain("key=test-primary-key");
      expect(fetchSpy.mock.calls[1][0]).toContain("key=test-fallback-key");
    });
  });

  describe("POST /chat Endpoint (Grande Sábio)", () => {
    it("should return 401 when unauthenticated", async () => {
      const res = await app.request("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Olá G.S" }],
        }),
      });
      expect(res.status).toBe(401);
    });

    it("should return 400 when messages array is missing or empty", async () => {
      const res = await app.request("/chat", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-system-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [] }),
      });
      expect(res.status).toBe(400);
    });

    it("should return neural hibernation response when no API key is configured", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY_FALLBACK;

      const res = await app.request("/chat", {
        method: "POST",
        headers: {
          Authorization: "Bearer super-secret-system-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Sugira missões de força." }],
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.role).toBe("assistant");
      expect(body.content).toContain("hibernação neural");
      expect(body.spoken_text).toContain("hibernação neural");
    });
  });
});
