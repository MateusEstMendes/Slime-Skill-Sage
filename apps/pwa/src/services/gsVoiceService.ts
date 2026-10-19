import { localDb } from "./db";
import { synthesizeSpeechApi } from "./apiClient";
import { getStoredApiUrl, getStoredToken } from "./authStorage";
import { logger } from "./logger";

export interface CachedSpeech {
  audioBase64: string;
  mimeType: string;
  text: string;
  createdAt: string;
}

export const DEFAULT_GS_PLAYBACK_RATE = 1.25;
export const GS_PLAYBACK_RATE_KEY = "settings_gs_playback_rate";
export const GS_AUTO_PLAY_KEY = "settings_auto_play_voice";

export function computeTextHash(text: string): string {
  const normalized = text.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*#_`>]/g, "")
    .trim();
}

export class GsVoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAbortController: AbortController | null = null;
  private isSpeakingState = false;
  private isSynthesizingState = false;
  private playbackRate = DEFAULT_GS_PLAYBACK_RATE;
  private listeners: Set<(speaking: boolean, synthesizing?: boolean) => void> = new Set();

  public subscribe(
    listener: (speaking: boolean, synthesizing?: boolean) => void,
  ): () => void {
    this.listeners.add(listener);
    listener(this.isSpeakingState, this.isSynthesizingState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(speaking: boolean, synthesizing: boolean = this.isSynthesizingState): void {
    this.isSpeakingState = speaking;
    this.isSynthesizingState = synthesizing;
    for (const listener of this.listeners) {
      listener(speaking, synthesizing);
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public isSynthesizing(): boolean {
    return this.isSynthesizingState;
  }

  public async getPlaybackRate(): Promise<number> {
    try {
      const saved = await localDb.getKv<number>(GS_PLAYBACK_RATE_KEY);
      if (typeof saved === "number" && saved >= 1.0 && saved <= 2.0) {
        this.playbackRate = saved;
        return saved;
      }
    } catch {
      // Fallback
    }
    return this.playbackRate;
  }

  public async setPlaybackRate(rate: number): Promise<void> {
    const clamped = Math.max(1.0, Math.min(2.0, Number(rate.toFixed(2))));
    this.playbackRate = clamped;
    if (this.currentAudio) {
      try {
        this.currentAudio.playbackRate = clamped;
      } catch {
        // Ignora
      }
    }
    await localDb.setKv<number>(GS_PLAYBACK_RATE_KEY, clamped);
  }

  public async isAutoPlayEnabled(): Promise<boolean> {
    try {
      const saved = await localDb.getKv<boolean>(GS_AUTO_PLAY_KEY);
      // Ativado por padrão (true) caso nunca tenha sido configurado
      return saved === null || saved === undefined ? true : Boolean(saved);
    } catch {
      return true;
    }
  }

  public async setAutoPlayEnabled(enabled: boolean): Promise<void> {
    await localDb.setKv<boolean>(GS_AUTO_PLAY_KEY, enabled);
    if (!enabled) {
      this.stopCurrentSpeech();
    }
  }

  public cancelPendingSynthesis(): void {
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch {
        // Ignora
      }
      this.currentAbortController = null;
    }
    this.notify(this.isSpeakingState, false);
  }

  public stopCurrentSpeech(): void {
    this.cancelPendingSynthesis();
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Ignora
      }
      this.currentAudio = null;
    }
    this.notify(false, false);
  }

  /**
   * Prepara/busca o áudio da Grande Sábio (do cache IndexedDB ou via API Gemini)
   * com suporte a cancelamento via AbortSignal.
   */
  public async prepareSpeech(
    text: string,
    externalSignal?: AbortSignal,
  ): Promise<CachedSpeech | null> {
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return null;

    const hash = computeTextHash(cleanText);
    const cacheKey = `tts_v2_cache_${hash}`;

    try {
      // 1. Verifica cache local no IndexedDB
      const cached = await localDb.getKv<CachedSpeech>(cacheKey);
      if (cached?.audioBase64) {
        await logger.info("tts", `[G.S TTS] Reproduzindo do cache local (${hash})`);
        await logger.info(
          "ai",
          `[Síntese Neural // Cache Hit] Áudio servido do IndexedDB (Custo de API: 0 tokens) [${hash}]`,
        );
        return cached;
      }

      const apiUrl = getStoredApiUrl() || "";
      const token = getStoredToken() || "";

      if (!token) {
        await logger.warn("tts", "[G.S TTS] Token de autenticação não encontrado.");
        await logger.warn("ai", "[Síntese Neural // Erro] Token de autenticação ausente");
        return null;
      }

      this.cancelPendingSynthesis();
      const abortController = new AbortController();
      this.currentAbortController = abortController;

      if (externalSignal) {
        if (externalSignal.aborted) {
          return null;
        }
        externalSignal.addEventListener(
          "abort",
          () => {
            abortController.abort();
          },
          { once: true },
        );
      }

      this.notify(this.isSpeakingState, true);

      await logger.info("tts", `[G.S TTS] Solicitando síntese neural de voz ao backend...`);
      await logger.info(
        "ai",
        `[Síntese Neural // API Gemini] Solicitando áudio ao modelo gemini-3.8-flash-tts (${cleanText.length} caracteres)`,
      );

      const result = await synthesizeSpeechApi(apiUrl, token, cleanText, "Kore", {
        signal: abortController.signal,
      });

      if (this.currentAbortController === abortController) {
        this.currentAbortController = null;
      }
      this.notify(this.isSpeakingState, false);

      if (result.aborted) {
        await logger.info("tts", "[G.S TTS] Síntese de voz cancelada pelo Caçador.");
        return null;
      }

      if (!result.success || !result.data) {
        await logger.warn(
          "tts",
          `[G.S TTS] Falha na síntese: ${result.error || "Grande Sábio em modo de hibernação neural"}.`,
        );
        await logger.warn("ai", `[Síntese Neural // Falha] ${result.error || "Hibernação neural"}`);
        return null;
      }

      const { audioBase64, mimeType } = result.data;
      await logger.info(
        "ai",
        `[Síntese Neural // Sucesso] Áudio WAV recebido e gravado em cache [${hash}]`,
      );

      const entry: CachedSpeech = {
        audioBase64,
        mimeType,
        text: cleanText,
        createdAt: new Date().toISOString(),
      };

      await localDb.setKv<CachedSpeech>(cacheKey, entry);
      return entry;
    } catch (err: unknown) {
      this.currentAbortController = null;
      this.notify(this.isSpeakingState, false);
      const msg = err instanceof Error ? err.message : String(err);
      await logger.error("tts", `[G.S TTS] Erro ao preparar fala neural: ${msg}`);
      return null;
    }
  }

  /**
   * Reproduz imediatamente um objeto de fala preparado (CachedSpeech) aplicando a velocidade configurada.
   */
  public async playPreparedSpeech(speech: CachedSpeech, customRate?: number): Promise<boolean> {
    this.stopCurrentSpeech();
    const rate = customRate ?? (await this.getPlaybackRate());
    return this.playBase64Audio(speech.audioBase64, speech.mimeType, rate);
  }

  /**
   * Sintetiza e reproduz a fala da Grande Sábio com voz neural Kore e cache local no IndexedDB.
   */
  public async speakWithGs(
    text: string,
    options?: { signal?: AbortSignal; rate?: number },
  ): Promise<boolean> {
    if (!text || !text.trim()) return false;

    this.stopCurrentSpeech();

    const prepared = await this.prepareSpeech(text, options?.signal);
    if (!prepared) {
      this.notify(false, false);
      return false;
    }

    const rate = options?.rate ?? (await this.getPlaybackRate());
    return this.playBase64Audio(prepared.audioBase64, prepared.mimeType, rate);
  }

  private playBase64Audio(
    base64: string,
    mimeType: string = "audio/wav",
    rate: number = DEFAULT_GS_PLAYBACK_RATE,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audioSrc = `data:${mimeType};base64,${base64}`;
        const audio = new Audio(audioSrc);
        audio.playbackRate = rate;
        if ("preservesPitch" in audio) {
          (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
        }
        this.currentAudio = audio;
        this.notify(true, false);

        const onEnd = () => {
          this.currentAudio = null;
          this.notify(false, false);
          resolve(true);
        };

        const onErr = () => {
          this.currentAudio = null;
          this.notify(false, false);
          resolve(false);
        };

        audio.onended = onEnd;
        audio.onerror = onErr;
        audio.addEventListener("ended", onEnd, { once: true });
        audio.addEventListener("error", onErr, { once: true });

        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch((playErr) => {
            console.warn("[G.S Audio] Autoplay bloqueado pelo navegador:", playErr);
            this.currentAudio = null;
            this.notify(false, false);
            resolve(false);
          });
        }
      } catch {
        this.currentAudio = null;
        this.notify(false, false);
        resolve(false);
      }
    });
  }
}

export const gsVoiceService = new GsVoiceService();
