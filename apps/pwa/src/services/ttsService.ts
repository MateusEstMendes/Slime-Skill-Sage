import { logger } from "./logger";
import { normalizePhonetics } from "./phoneticNormalizer";


export interface TtsOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

class TtsService {
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;

  constructor() {
    if (this.isSupported()) {
      this.initVoices();
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    );
  }

  private initVoices(): void {
    if (!this.isSupported()) return;

    const load = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          this.voices = available;
          this.voicesLoaded = true;
        }
      } catch {
        // Ignore voice loading error
      }
    };

    load();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        load();
      };
    }
  }

  public async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.isSupported()) return [];

    if (this.voicesLoaded && this.voices.length > 0) {
      return this.voices;
    }

    // Try loading again
    try {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0) {
        this.voicesLoaded = true;
        return this.voices;
      }
    } catch {
      return [];
    }

    // Wait for voiceschanged event if empty
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(this.voices);
        }
      }, 500);

      const handler = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          this.voices = window.speechSynthesis.getVoices();
          this.voicesLoaded = true;
          resolve(this.voices);
        }
      };

      if (window.speechSynthesis) {
        window.speechSynthesis.addEventListener("voiceschanged", handler, {
          once: true,
        });
      }
    });
  }

  public selectPtBrVoice(
    voices: SpeechSynthesisVoice[],
    preferredName?: string
  ): SpeechSynthesisVoice | null {
    if (preferredName) {
      const match = voices.find((v) => v.name === preferredName);
      if (match) return match;
    }

    // Filter Portuguese voices
    const ptVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith("pt-br") ||
        v.lang.toLowerCase().startsWith("pt_br")
    );

    if (ptVoices.length > 0) {
      // Prioritize natural/neural Google or Microsoft voices
      const natural = ptVoices.find(
        (v) =>
          v.name.toLowerCase().includes("google") ||
          v.name.toLowerCase().includes("natural") ||
          v.name.toLowerCase().includes("brasil") ||
          v.name.toLowerCase().includes("luciana") ||
          v.name.toLowerCase().includes("felipe")
      );
      return natural || ptVoices[0];
    }

    // Fallback: any Portuguese voice
    const anyPt = voices.find((v) => v.lang.toLowerCase().startsWith("pt"));
    if (anyPt) return anyPt;

    // Fallback: default or first voice
    return voices.find((v) => v.default) || voices[0] || null;
  }

  public async speak(text: string, options?: TtsOptions): Promise<boolean> {
    if (!this.isSupported()) {
      await logger.warn(
        "tts",
        "Web Speech API (speechSynthesis) não suportada neste ambiente",
        { text }
      );
      return false;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const voices = await this.getAvailableVoices();
      const selectedVoice = this.selectPtBrVoice(voices, options?.voiceName);
      const normalizedText = normalizePhonetics(text);

      return await new Promise<boolean>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(normalizedText);
        utterance.lang = "pt-BR";
        utterance.rate = options?.rate ?? 1.0;
        utterance.pitch = options?.pitch ?? 1.0;
        utterance.volume = options?.volume ?? 1.0;


        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
          void logger.info("tts", "Iniciando narração", {
            text,
            voice: selectedVoice?.name ?? "default",
          });
        };

        utterance.onend = () => {
          resolve(true);
        };

        utterance.onerror = (event) => {
          // If cancelled explicitly, resolve cleanly
          if (event.error === "canceled" || event.error === "interrupted") {
            resolve(true);
            return;
          }
          void logger.error("tts", `Erro na narração: ${event.error}`, {
            error: event.error,
          });
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      });
    } catch (err) {
      await logger.error(
        "tts",
        `Exceção ao sintetizar fala: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }

  public isSpeaking(): boolean {
    if (!this.isSupported()) return false;
    return window.speechSynthesis.speaking;
  }
}

export const ttsService = new TtsService();
