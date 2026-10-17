import { type GameEvent } from "@slime-sage/game";
import { gameService } from "./gameService";
import { soundService } from "./soundService";
import { hapticFeedback } from "./haptics";
import { ttsService } from "./ttsService";
import { localDb } from "./db";
import { logger } from "./logger";

export const WORLD_VOICE_TTS_KEY = "world_voice_tts_enabled";

export interface WorldVoiceItem {
  id: string;
  type: "LEVEL_UP" | "SKILL_EVOLVED_EXTRA" | "SKILL_ACQUIRED" | "PROJECT_COMPLETE";
  title: string;
  subtitle: string;
  description: string;
  spokenText: string;
  colorVariant: "cyan" | "gold" | "purple";
  details?: {
    previousLevel?: number;
    newLevel?: number;
    totalXp?: number;
    skillId?: string;
    skillName?: string;
    mastery?: number;
    areaId?: string;
    skillTier?: string;
  };
}

export const OFFICIAL_AUDIO_MAP: Record<string, string> = {
  LEVEL_UP: "/audio/voice/level-up.mp3",
  SKILL_ACQUIRED: "/audio/voice/skill-acquired.mp3",
  SKILL_EVOLVED_EXTRA: "/audio/voice/skill-evolved-extra.mp3",
  PROJECT_COMPLETE: "/audio/voice/project-complete.mp3",
};

class WorldVoiceService {
  private queue: WorldVoiceItem[] = [];
  private currentItem: WorldVoiceItem | null = null;
  private listeners: Array<(item: WorldVoiceItem | null) => void> = [];
  private isAutoInitialized = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.init();
  }

  public init(): void {
    if (this.isAutoInitialized) return;
    this.isAutoInitialized = true;

    gameService.subscribeToGameEvents((event: GameEvent) => {
      this.handleGameEvent(event);
    });
  }

  public async isTtsEnabled(): Promise<boolean> {
    const val = await localDb.getKv<boolean>(WORLD_VOICE_TTS_KEY);
    return val !== false; // Default is true
  }

  public async setTtsEnabled(enabled: boolean): Promise<void> {
    await localDb.setKv(WORLD_VOICE_TTS_KEY, enabled);
    void logger.info("tts", `Narração da Voz do Mundo ${enabled ? "ativada" : "desativada"}`);
  }

  public subscribe(listener: (item: WorldVoiceItem | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentItem);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentItem);
      } catch (err) {
        console.error("Erro no listener de WorldVoiceService:", err);
      }
    }
  }

  public getCurrentItem(): WorldVoiceItem | null {
    return this.currentItem;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public enqueue(item: WorldVoiceItem): void {
    if (!this.currentItem) {
      this.currentItem = item;
      this.notify();
      void this.triggerPresentation(item);
    } else {
      this.queue.push(item);
      this.notify();
    }
  }

  public dismissCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    ttsService.stop();
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.currentItem = next;
      this.notify();
      void this.triggerPresentation(next);
    } else {
      this.currentItem = null;
      this.notify();
    }
  }

  public async replayCurrentSpeech(): Promise<void> {
    if (!this.currentItem) return;
    const isEnabled = await this.isTtsEnabled();
    if (!isEnabled) return;

    const audioSrc = OFFICIAL_AUDIO_MAP[this.currentItem.type];
    if (audioSrc && typeof Audio !== "undefined") {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      const audio = new Audio(audioSrc);
      this.currentAudio = audio;
      await audio.play().catch(() => {});
    }
  }

  private async triggerPresentation(item: WorldVoiceItem): Promise<void> {
    // 1. Play Sound
    try {
      if (item.type === "LEVEL_UP") {
        soundService.playLevelUp();
      } else if (item.type === "SKILL_EVOLVED_EXTRA") {
        soundService.playSkillEvolved();
      } else if (item.type === "SKILL_ACQUIRED") {
        soundService.playSkillAcquired();
      } else {
        soundService.playSystemNotification();
      }
    } catch {
      // Ignore audio synthesis errors
    }

    // 2. Trigger Haptic
    try {
      if (item.type === "LEVEL_UP") {
        hapticFeedback.levelUp();
      } else if (item.type === "SKILL_EVOLVED_EXTRA") {
        hapticFeedback.skillEvolved();
      } else {
        hapticFeedback.success();
      }
    } catch {
      // Ignore
    }

    // 3. Play Official Voice MP3 Audio if enabled
    try {
      const isEnabled = await this.isTtsEnabled();
      if (isEnabled) {
        const audioSrc = OFFICIAL_AUDIO_MAP[item.type];
        if (audioSrc && typeof Audio !== "undefined") {
          if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
          }
          const audio = new Audio(audioSrc);
          this.currentAudio = audio;
          audio.onended = () => {
            if (this.currentAudio === audio) {
              this.currentAudio = null;
            }
          };
          await audio.play().catch(() => {});
        }
      }
    } catch {
      // Ignore
    }
  }

  private handleGameEvent(event: GameEvent): void {
    const id = `wve_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (event.type === "LEVEL_UP") {
      const { previousLevel, newLevel, totalXp } = event.payload;
      const spokenText = `Aviso. O indivíduo atingiu os requisitos necessários. Nível aumentado de ${previousLevel} para ${newLevel}.`;
      this.enqueue({
        id,
        type: "LEVEL_UP",
        title: `NÍVEL ${newLevel} ALCANÇADO`,
        subtitle: "[VOZ DO MUNDO // PROTOCOLO DE DESPERTAR]",
        description: `O indivíduo satisfez os requisitos de experiência acumulada (${totalXp} XP total). Todos os parâmetros físicos e mágicos foram calibrados para o Nível ${newLevel}.`,
        spokenText,
        colorVariant: "cyan",
        details: {
          previousLevel,
          newLevel,
          totalXp,
        },
      });
    } else if (event.type === "SKILL_EVOLVED_EXTRA") {
      const { skillId, skillName, mastery } = event.payload;
      const spokenText = `Confirmação. Requisitos preenchidos. A habilidade comum '${skillName}' evoluiu para a habilidade extra '${skillName}'.`;
      this.enqueue({
        id,
        type: "SKILL_EVOLVED_EXTRA",
        title: `EVOLUÇÃO: [EXTRA] ${skillName.toUpperCase()}`,
        subtitle: "[VOZ DO MUNDO // EVOLUÇÃO DE HABILIDADE]",
        description: `Confirmação. Requisitos preenchidos com ${mastery} pontos de maestria. A habilidade [Comum] '${skillName}' rompeu seus limites fundamentais, ascendendo à categoria [Habilidade Extra].`,
        spokenText,
        colorVariant: "gold",
        details: {
          skillId,
          skillName,
          mastery,
          skillTier: "extra",
        },
      });
    } else if (event.type === "SKILL_ACQUIRED") {
      const { skillId, skillName, areaId } = event.payload;
      const spokenText = `Aviso. Condições atendidas. Habilidade '${skillName}' adquirida com sucesso.`;
      this.enqueue({
        id,
        type: "SKILL_ACQUIRED",
        title: `HABILIDADE ADQUIRIDA: ${skillName.toUpperCase()}`,
        subtitle: "[VOZ DO MUNDO // AQUISIÇÃO DE HABILIDADE]",
        description: `Aviso. Condições atendidas na esfera [${areaId}]. O indivíduo obteve a habilidade de grau comum '${skillName}'. Registro gravado na Árvore de Habilidades.`,
        spokenText,
        colorVariant: "cyan",
        details: {
          skillId,
          skillName,
          areaId,
          skillTier: "comum",
        },
      });
    }
  }
}

export const worldVoiceService = new WorldVoiceService();
