import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  gsVoiceService,
  computeTextHash,
  cleanTextForSpeech,
  DEFAULT_GS_PLAYBACK_RATE,
  type CachedSpeech,
} from "./gsVoiceService";
import { localDb } from "./db";
import * as apiClient from "./apiClient";
import * as authStorage from "./authStorage";

describe("GsVoiceService", () => {
  beforeEach(async () => {
    await localDb.clearKv();
    gsVoiceService.stopCurrentSpeech();
    vi.clearAllMocks();
  });

  afterEach(() => {
    gsVoiceService.stopCurrentSpeech();
  });

  it("computes deterministic text hashes and cleans markdown for speech", () => {
    const h1 = computeTextHash("Aviso do Sistema");
    const h2 = computeTextHash("Aviso do Sistema");
    const h3 = computeTextHash("Outro texto");

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);

    expect(cleanTextForSpeech("## **Resposta**: `Foco` em *Rust*")).toBe(
      "Resposta: Foco em Rust"
    );
  });

  it("defaults playback rate to 1.25x and clamps between 1.0x and 2.0x", async () => {
    const defaultRate = await gsVoiceService.getPlaybackRate();
    expect(defaultRate).toBe(DEFAULT_GS_PLAYBACK_RATE);

    await gsVoiceService.setPlaybackRate(1.5);
    expect(await gsVoiceService.getPlaybackRate()).toBe(1.5);

    await gsVoiceService.setPlaybackRate(3.0);
    expect(await gsVoiceService.getPlaybackRate()).toBe(2.0);
  });

  it("defaults autoPlayEnabled to true and persists changes", async () => {
    expect(await gsVoiceService.isAutoPlayEnabled()).toBe(true);

    await gsVoiceService.setAutoPlayEnabled(false);
    expect(await gsVoiceService.isAutoPlayEnabled()).toBe(false);
  });

  it("returns cached speech immediately without calling API", async () => {
    const text = "Missão cumprida com maestria.";
    const hash = computeTextHash(text);
    const mockAudio = "MOCK_CACHED_BASE64";

    await localDb.setKv<CachedSpeech>(`tts_v2_cache_${hash}`, {
      audioBase64: mockAudio,
      mimeType: "audio/wav",
      text,
      createdAt: new Date().toISOString(),
    });

    const apiSpy = vi.spyOn(apiClient, "synthesizeSpeechApi");

    const success = await gsVoiceService.speakWithGs(text);
    expect(success).toBe(true);
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("calls synthesizeSpeechApi and stores in local cache when not in cache", async () => {
    const text = "Nova diretriz estratégica definida.";
    const hash = computeTextHash(text);
    const mockAudio = "MOCK_API_BASE64";

    vi.spyOn(authStorage, "getStoredApiUrl").mockReturnValue("http://localhost:3000");
    vi.spyOn(authStorage, "getStoredToken").mockReturnValue("super-secret-system-key");

    const apiSpy = vi.spyOn(apiClient, "synthesizeSpeechApi").mockResolvedValueOnce({
      success: true,
      data: {
        audioBase64: mockAudio,
        mimeType: "audio/wav",
        source: "gemini",
      },
    });

    const success = await gsVoiceService.speakWithGs(text);
    expect(success).toBe(true);
    expect(apiSpy).toHaveBeenCalledWith(
      "http://localhost:3000",
      "super-secret-system-key",
      text,
      "Kore",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    const cached = await localDb.getKv<CachedSpeech>(`tts_v2_cache_${hash}`);
    expect(cached).toBeDefined();
    expect(cached?.audioBase64).toBe(mockAudio);
  });

  it("handles empty or blank text gracefully", async () => {
    const success = await gsVoiceService.speakWithGs("   ");
    expect(success).toBe(false);
  });

  it("stops current speech and cancels pending synthesis cleanly", () => {
    gsVoiceService.stopCurrentSpeech();
    expect(gsVoiceService.isSpeaking()).toBe(false);
  });
});

