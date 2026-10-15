import { describe, it, expect, vi, beforeEach } from "vitest";
import { ttsService } from "./ttsService";

describe("TtsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("selects pt-BR voices with priority for natural voices", () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      {
        name: "Alex",
        lang: "en-US",
        default: false,
        localService: true,
        voiceURI: "alex",
      },
      {
        name: "Luciana (Natural)",
        lang: "pt-BR",
        default: false,
        localService: true,
        voiceURI: "luciana",
      },
      {
        name: "Standard PT",
        lang: "pt-BR",
        default: false,
        localService: true,
        voiceURI: "std-pt",
      },
    ];

    const selected = ttsService.selectPtBrVoice(mockVoices);
    expect(selected?.name).toBe("Luciana (Natural)");

    // Specific requested voice name
    const explicit = ttsService.selectPtBrVoice(mockVoices, "Alex");
    expect(explicit?.name).toBe("Alex");
  });

  it("handles fallback when no pt-BR voices are present", () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      {
        name: "English Voice",
        lang: "en-US",
        default: true,
        localService: true,
        voiceURI: "en",
      },
    ];

    const fallback = ttsService.selectPtBrVoice(mockVoices);
    expect(fallback?.name).toBe("English Voice");
  });

  it("safely handles speak when speechSynthesis is unavailable or errors", async () => {
    // In node/jsdom without speech synthesis mock, isSupported returns false
    const originalSynthesis = window.speechSynthesis;
    // @ts-expect-error test override
    delete window.speechSynthesis;

    const result = await ttsService.speak("Teste");
    expect(result).toBe(false);

    window.speechSynthesis = originalSynthesis;
  });
});
