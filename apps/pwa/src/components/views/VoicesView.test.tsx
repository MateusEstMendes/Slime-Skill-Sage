import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoicesView } from "./VoicesView";
import { ttsService } from "../../services/ttsService";
import { soundService } from "../../services/soundService";
import { worldVoiceService } from "../../services/worldVoiceService";

describe("VoicesView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all official voice clips and categories", () => {
    render(<VoicesView isActive={true} />);

    expect(screen.getByText("ESTAÇÃO DE VOZ // VOZ DO MUNDO & G.S")).toBeInTheDocument();
    expect(screen.getByText(/VOZES OFICIAIS/)).toBeInTheDocument();

    // Verify clips
    expect(screen.getByText("Missão Concluída")).toBeInTheDocument();
    expect(screen.getByText("Novo Nível Alcançado")).toBeInTheDocument();
    expect(screen.getByText("Evolução de Classe (Alerta Urgente)")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Habilidade Adquirida" })).toBeInTheDocument();
    expect(screen.getByText("Evolução: Habilidade Extra")).toBeInTheDocument();
    expect(screen.getByText("Evolução: Habilidade Única")).toBeInTheDocument();
    expect(screen.getByText("Evolução: Aceleração do Pensamento")).toBeInTheDocument();
    expect(screen.getByText("Modo Foco Ativado")).toBeInTheDocument();
    expect(screen.getByText("Quebra de Foco Detectada")).toBeInTheDocument();
  });

  it("filters clips when category pills are clicked", () => {
    render(<VoicesView isActive={true} />);

    // Click "Modo Foco"
    const focoFilterBtn = screen.getByRole("button", { name: "Modo Foco" });
    fireEvent.click(focoFilterBtn);

    expect(screen.getByText("Modo Foco Ativado")).toBeInTheDocument();
    expect(screen.getByText("Quebra de Foco Detectada")).toBeInTheDocument();
    expect(screen.queryByText("Novo Nível Alcançado")).not.toBeInTheDocument();

    // Switch back to "Todas"
    const todasBtn = screen.getByRole("button", { name: "Todas" });
    fireEvent.click(todasBtn);
    expect(screen.getByText("Novo Nível Alcançado")).toBeInTheDocument();
  });

  it("handles audio play and pause click", () => {
    const playStub = vi.fn().mockResolvedValue(undefined);
    const pauseStub = vi.fn();

    // Mock HTMLMediaElement play/pause
    window.HTMLMediaElement.prototype.play = playStub;
    window.HTMLMediaElement.prototype.pause = pauseStub;

    render(<VoicesView isActive={true} />);

    const playBtn = screen.getByTestId("play-btn-mission-complete");
    expect(playBtn).toHaveTextContent("Tocar Voz");

    // Click Play
    fireEvent.click(playBtn);
    expect(playStub).toHaveBeenCalled();
    expect(screen.getByTestId("play-btn-mission-complete")).toHaveTextContent("Pausar");

    // Click Pause
    fireEvent.click(playBtn);
    expect(pauseStub).toHaveBeenCalled();
    expect(screen.getByTestId("play-btn-mission-complete")).toHaveTextContent("Tocar Voz");
  });

  it("triggers dramatic World Voice modal simulation for Level Up, Skill Acquired and Skill Evolved", () => {
    const enqueueSpy = vi.spyOn(worldVoiceService, "enqueue");

    render(<VoicesView isActive={true} />);

    // Trigger Level Up
    const lvlUpBtn = screen.getByTestId("trigger-modal-level-up");
    fireEvent.click(lvlUpBtn);
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "LEVEL_UP",
        title: "NÍVEL 5 ALCANÇADO",
      })
    );

    // Trigger Skill Acquired
    const skillBtn = screen.getByTestId("trigger-modal-skill-acquired");
    fireEvent.click(skillBtn);
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SKILL_ACQUIRED",
        title: "HABILIDADE ADQUIRIDA: HIPERFOCO",
      })
    );

    // Trigger Skill Evolved
    const evoBtn = screen.getByTestId("trigger-modal-skill-evolved");
    fireEvent.click(evoBtn);
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SKILL_EVOLVED_EXTRA",
        title: "EVOLUÇÃO: [EXTRA] ACELERAÇÃO DO PENSAMENTO",
      })
    );
  });

  it("triggers TTS speech narration with custom text and speed slider", async () => {
    const speakSpy = vi.spyOn(ttsService, "speak").mockResolvedValue(true);

    render(<VoicesView isActive={true} />);

    const speedSlider = screen.getByTestId("gs-speed-slider");
    fireEvent.change(speedSlider, { target: { value: "1.5" } });

    const speakBtn = screen.getByRole("button", { name: "Narrar Texto com a G.S" });
    fireEvent.click(speakBtn);

    expect(speakSpy).toHaveBeenCalledWith(
      expect.stringContaining("Aviso. O Sistema Slime Sage"),
      expect.any(Object)
    );

    // Trigger quick preset example
    const presetBtn = screen.getByRole("button", { name: "Exemplo 2" });
    fireEvent.click(presetBtn);

    fireEvent.click(screen.getByRole("button", { name: "Narrar Texto com a G.S" }));
    expect(speakSpy).toHaveBeenCalledWith(
      expect.stringContaining("Relatório da Grande Sábio"),
      expect.any(Object)
    );
  });

  it("triggers pure Web Audio API synthetic fanfares", () => {
    const notifSpy = vi.spyOn(soundService, "playSystemNotification");
    const lvlSpy = vi.spyOn(soundService, "playLevelUp");
    const sklSpy = vi.spyOn(soundService, "playSkillAcquired");
    const evoSpy = vi.spyOn(soundService, "playSkillEvolved");

    render(<VoicesView isActive={true} />);

    fireEvent.click(screen.getByRole("button", { name: /Ping Harmônico/ }));
    expect(notifSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Arpeggio C5-E6/ }));
    expect(lvlSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Chime A4-A5/ }));
    expect(sklSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Burst E4-E6/ }));
    expect(evoSpy).toHaveBeenCalled();
  });
});
