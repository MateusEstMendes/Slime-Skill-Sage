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

export function computeTextHash(text: string): string {
  const normalized = text.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export class GsVoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeakingState = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  public subscribe(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isSpeakingState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(speaking: boolean): void {
    this.isSpeakingState = speaking;
    for (const listener of this.listeners) {
      listener(speaking);
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public stopCurrentSpeech(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Ignora
      }
      this.currentAudio = null;
    }
    this.notify(false);
  }

  /**
   * Sintetiza e reproduz a fala da Grande Sábio com voz neural Kore e cache local no IndexedDB.
   */
  public async speakWithGs(text: string): Promise<boolean> {
    if (!text || !text.trim()) return false;

    this.stopCurrentSpeech();

    const cleanText = text.trim();
    const hash = computeTextHash(cleanText);
    const cacheKey = `tts_cache_${hash}`;

    try {
      // 1. Tenta recuperar do cache local no IndexedDB
      const cached = await localDb.getKv<CachedSpeech>(cacheKey);
      if (cached?.audioBase64) {
        await logger.info("tts", `[G.S TTS] Reproduzindo do cache local (${hash})`);
        await logger.info("ai", `[Síntese Neural // Cache Hit] Áudio servido do IndexedDB (Custo de API: 0 tokens) [${hash}]`);
        return this.playBase64Audio(cached.audioBase64, cached.mimeType);
      }

      // 2. Se não estiver em cache, consulta o backend
      const apiUrl = getStoredApiUrl() || "";
      const token = getStoredToken() || "";

      if (!token) {
        await logger.warn("tts", "[G.S TTS] Token de autenticação não encontrado.");
        await logger.warn("ai", "[Síntese Neural // Erro] Token de autenticação ausente");
        return false;
      }

      await logger.info("tts", `[G.S TTS] Solicitando síntese neural de voz ao backend...`);
      await logger.info("ai", `[Síntese Neural // API Gemini] Solicitando áudio ao modelo gemini-3.8-flash-tts (${cleanText.length} caracteres)`);
      const result = await synthesizeSpeechApi(apiUrl, token, cleanText, "Kore");

      if (!result.success || !result.data) {
        await logger.warn(
          "tts",
          `[G.S TTS] Falha na síntese: ${result.error || "Grande Sábio em modo de hibernação neural"}.`,
        );
        await logger.warn("ai", `[Síntese Neural // Falha] ${result.error || "Hibernação neural"}`);
        return false;
      }

      const { audioBase64, mimeType } = result.data;
      await logger.info("ai", `[Síntese Neural // Sucesso] Áudio WAV recebido e gravado em cache [${hash}]`);

      // 3. Salva no cache local para reprodução instantânea futura
      await localDb.setKv<CachedSpeech>(cacheKey, {
        audioBase64,
        mimeType,
        text: cleanText,
        createdAt: new Date().toISOString(),
      });

      return this.playBase64Audio(audioBase64, mimeType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await logger.error("tts", `[G.S TTS] Erro ao reproduzir fala neural: ${msg}`);
      this.notify(false);
      return false;
    }
  }

  private playBase64Audio(base64: string, mimeType: string = "audio/wav"): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audioSrc = `data:${mimeType};base64,${base64}`;
        const audio = new Audio(audioSrc);
        this.currentAudio = audio;
        this.notify(true);

        const onEnd = () => {
          this.currentAudio = null;
          this.notify(false);
          resolve(true);
        };

        const onErr = () => {
          this.currentAudio = null;
          this.notify(false);
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
            this.notify(false);
            resolve(false);
          });
        }
      } catch {
        this.currentAudio = null;
        this.notify(false);
        resolve(false);
      }
    });
  }
}

export const gsVoiceService = new GsVoiceService();
