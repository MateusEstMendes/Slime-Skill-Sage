import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingFlow } from "./OnboardingFlow";
import { gsVoiceService } from "../../services/gsVoiceService";
import { gameService } from "../../services/gameService";
import { chatRepository } from "../../services/chatRepository";

describe("OnboardingFlow Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(gsVoiceService, "speakWithGs").mockResolvedValue(true);
    vi.spyOn(gsVoiceService, "stopCurrentSpeech").mockImplementation(() => {});
    vi.spyOn(gameService, "completeOnboarding").mockResolvedValue({
      id: "profile_main",
      name: "Veldora",
      title: "Soberano da Disciplina [Calamity]",
      race: "Draconiano",
      rank_threat: "Calamity",
      level: 1,
      current_xp: 0,
      total_xp: 0,
      streak_count: 0,
      last_active_date: "2026-10-19",
      onboarding_done: true,
      created_at: "2026-10-19T00:00:00.000Z",
      updated_at: "2026-10-19T00:00:00.000Z",
    });
    vi.spyOn(chatRepository, "getOrCreateMainThread").mockResolvedValue({
      id: "main_thread",
      title: "Canal Neural — Grande Sábio",
      created_at: "2026-10-19T00:00:00.000Z",
      updated_at: "2026-10-19T00:00:00.000Z",
    });
    vi.spyOn(chatRepository, "saveMessage").mockResolvedValue();
  });

  it("deve renderizar a Tela I de Despertar, disparar áudio de introdução e exibir texto typewriter", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    const onComplete = vi.fn();

    render(
      <OnboardingFlow
        initialHunterName="Rimuru"
        onComplete={onComplete}
        typewriterSpeedMs={0}
      />,
    );

    expect(screen.getByText(/Tela I — O Despertar da Consciência/i)).toBeInTheDocument();
    expect(screen.getByTestId("typewriter-text")).toHaveTextContent(
      /Inicializando protocolo de avaliação d'alma/i,
    );
    expect(playSpy).toHaveBeenCalled();
  });

  it("deve navegar pelas 5 perguntas solenes, revelar a Raça/Rank com síntese via API e consagrar o perfil", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    const onComplete = vi.fn();

    render(
      <OnboardingFlow
        initialHunterName="Rimuru"
        onComplete={onComplete}
        typewriterSpeedMs={0}
      />,
    );

    // Altera o nome do caçador na Tela I
    const nameInput = screen.getByLabelText(/Identificação Espiritual/i);
    fireEvent.change(nameInput, { target: { value: "Veldora Tempest" } });

    // Avança para a Tela II (Pergunta 1)
    fireEvent.click(screen.getByRole("button", { name: /Iniciar Questionário Solene/i }));
    expect(screen.getByText(/Diretriz 1 de 5/i)).toBeInTheDocument();

    // Seleciona resposta Q1 (Draconiano)
    fireEvent.click(screen.getByTestId("option-q1_draco"));
    fireEvent.click(screen.getByRole("button", { name: /Próxima Diretriz/i }));

    // Pergunta 2
    expect(screen.getByText(/Diretriz 2 de 5/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("option-q2_draco"));
    fireEvent.click(screen.getByRole("button", { name: /Próxima Diretriz/i }));

    // Pergunta 3
    expect(screen.getByText(/Diretriz 3 de 5/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("option-q3_draco"));
    fireEvent.click(screen.getByRole("button", { name: /Próxima Diretriz/i }));

    // Pergunta 4
    expect(screen.getByText(/Diretriz 4 de 5/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("option-q4_draco"));
    fireEvent.click(screen.getByRole("button", { name: /Próxima Diretriz/i }));

    // Pergunta 5 (Constância -> Calamity)
    expect(screen.getByText(/Diretriz 5 de 5/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("option-q5_calamity"));
    fireEvent.click(screen.getByRole("button", { name: /Revelar Essência/i }));

    // Tela III — Revelação Cerimonial
    await waitFor(() => {
      expect(screen.getByText(/Tela III — Revelação Cerimonial/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId("revealed-race")).toHaveTextContent("Draconiano");
    expect(screen.getByTestId("revealed-rank")).toHaveTextContent("Calamity");
    expect(gsVoiceService.speakWithGs).toHaveBeenCalledWith(
      expect.stringContaining("Veldora Tempest"),
    );

    // Avança para Tela IV — Consagração
    fireEvent.click(screen.getByRole("button", { name: /Prosseguir para Consagração/i }));
    expect(screen.getByText(/Tela IV — Consagração & Primeira Conquista/i)).toBeInTheDocument();

    // Finaliza consagração
    fireEvent.click(
      screen.getByRole("button", { name: /Consagrar e Iniciar Primeira Conquista/i }),
    );

    await waitFor(() => {
      expect(gameService.completeOnboarding).toHaveBeenCalledWith({
        name: "Veldora Tempest",
        race: "Draconiano",
        rankThreat: "Calamity",
        title: "Soberano da Disciplina [Calamity]",
      });
      expect(chatRepository.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "assistant",
          content: expect.stringContaining("Qual é a primeira conquista que você deseja alcançar?"),
        }),
      );
      expect(onComplete).toHaveBeenCalled();
    });

    expect(playSpy).toHaveBeenCalled();
  });
});
