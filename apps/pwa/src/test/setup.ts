import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { vi } from "vitest";

// Mock Web Speech API in jsdom
if (typeof window !== "undefined") {
  if (!window.speechSynthesis) {
    const mockSpeechSynthesis = {
      speaking: false,
      paused: false,
      pending: false,
      onvoiceschanged: null as (() => void) | null,
      getVoices: () => [
        {
          name: "Google português do Brasil",
          lang: "pt-BR",
          default: true,
          localService: true,
          voiceURI: "Google pt-BR",
        },
      ],
      speak: vi.fn((utterance: { onstart?: (e: Event) => void; onend?: (e: Event) => void }) => {
        mockSpeechSynthesis.speaking = true;
        setTimeout(() => {
          mockSpeechSynthesis.speaking = false;
          utterance.onstart?.(new Event("start"));
          utterance.onend?.(new Event("end"));
        }, 5);
      }),
      cancel: vi.fn(() => {
        mockSpeechSynthesis.speaking = false;
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    Object.defineProperty(window, "speechSynthesis", {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true,
    });
  }

  if (typeof SpeechSynthesisUtterance === "undefined") {
    class MockSpeechSynthesisUtterance {
      text: string;
      lang = "pt-BR";
      rate = 1;
      pitch = 1;
      volume = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    // @ts-expect-error mock assignment
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  }

  if (!window.Notification) {
    class MockNotification {
      static permission: NotificationPermission = "default";
      static requestPermission = vi.fn(async () => {
        MockNotification.permission = "granted";
        return "granted";
      });
      title: string;
      options?: NotificationOptions;
      onclick: (() => void) | null = null;
      constructor(title: string, options?: NotificationOptions) {
        this.title = title;
        this.options = options;
      }
      close() {}
    }
    // @ts-expect-error mock assignment
    window.Notification = MockNotification;
  }

  if (!window.AudioContext) {
    class MockAudioContext {
      currentTime = 0;
      state = "running";
      destination = {};
      createOscillator = vi.fn(() => ({
        type: "sine",
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }));
      createGain = vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }));
      resume = vi.fn().mockResolvedValue(undefined);
    }
    // @ts-expect-error mock assignment
    window.AudioContext = MockAudioContext;
  }

  if (window.HTMLMediaElement) {
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.load = vi.fn();
  }
}
