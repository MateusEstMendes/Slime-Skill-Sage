import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorldVoiceModal } from "./WorldVoiceModal";
import { worldVoiceService } from "../../services/worldVoiceService";
import { gameService } from "../../services/gameService";
import { localDb } from "../../services/db";

describe("WorldVoiceModal & worldVoiceService", () => {
  beforeEach(async () => {
    // Reset DB and queue
    await localDb.resetDatabase();
    while (worldVoiceService.getCurrentItem()) {
      worldVoiceService.dismissCurrent();
    }
    vi.clearAllMocks();
  });

  it("renders nothing when queue is empty", () => {
    const { container } = render(<WorldVoiceModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("displays modal and speaks narration when LEVEL_UP event is enqueued", async () => {
    render(<WorldVoiceModal />);

    // Manually trigger LEVEL_UP via gameService event dispatcher
    // @ts-expect-error accessing private method for testing
    gameService.dispatchEvent({
      type: "LEVEL_UP",
      payload: {
        previousLevel: 1,
        newLevel: 2,
        totalXp: 120,
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Voz do Mundo" })).toBeInTheDocument();
      expect(screen.getByText("NÍVEL 2 ALCANÇADO")).toBeInTheDocument();
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("handles SKILL_EVOLVED_EXTRA with gold theme and dismisses properly", async () => {
    render(<WorldVoiceModal />);

    // @ts-expect-error accessing private method for testing
    gameService.dispatchEvent({
      type: "SKILL_EVOLVED_EXTRA",
      payload: {
        skillId: "skl_1",
        skillName: "Análise Analítica",
        mastery: 100,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("EVOLUÇÃO: [EXTRA] ANÁLISE ANALÍTICA")).toBeInTheDocument();
      expect(screen.getByText(/A habilidade \[Comum\] 'Análise Analítica' rompeu seus limites/i)).toBeInTheDocument();
    });

    // Dismiss current
    const confirmBtn = screen.getByRole("button", { name: "Confirmar" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Voz do Mundo" })).not.toBeInTheDocument();
    });
  });

  it("queues multiple announcements sequentially in FIFO order", async () => {
    render(<WorldVoiceModal />);

    // Enqueue two events simultaneously
    // @ts-expect-error accessing private method for testing
    gameService.dispatchEvent({
      type: "LEVEL_UP",
      payload: { previousLevel: 1, newLevel: 2, totalXp: 100 },
    });
    // @ts-expect-error accessing private method for testing
    gameService.dispatchEvent({
      type: "SKILL_ACQUIRED",
      payload: { skillId: "skl_2", skillName: "Percepção Espacial", areaId: "INT" },
    });

    // First event shown with queue counter
    await waitFor(() => {
      expect(screen.getByText("NÍVEL 2 ALCANÇADO")).toBeInTheDocument();
      expect(screen.getByText("+1 em fila")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Próximo Anúncio" })).toBeInTheDocument();
    });

    // Advance to second event
    fireEvent.click(screen.getByRole("button", { name: "Próximo Anúncio" }));

    await waitFor(() => {
      expect(screen.getByText("HABILIDADE ADQUIRIDA: PERCEPÇÃO ESPACIAL")).toBeInTheDocument();
      expect(screen.queryByText("+1 em fila")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
    });

    // Final confirmation closes modal
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Voz do Mundo" })).not.toBeInTheDocument();
    });
  });

  it("replays speech narration when replay button is clicked", async () => {
    render(<WorldVoiceModal />);

    // @ts-expect-error accessing private method for testing
    gameService.dispatchEvent({
      type: "LEVEL_UP",
      payload: { previousLevel: 2, newLevel: 3, totalXp: 280 },
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Voz do Mundo" })).toBeInTheDocument();
    });

    const initialSpeakCalls = vi.mocked(window.speechSynthesis.speak).mock.calls.length;

    const replayBtn = screen.getByRole("button", { name: "Repetir narração da Voz do Mundo" });
    fireEvent.click(replayBtn);

    await waitFor(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(initialSpeakCalls + 1);
    });
  });
});
