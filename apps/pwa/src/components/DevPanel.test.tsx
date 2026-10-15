import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsModal } from "./SettingsModal";
import { DevPanel } from "./DevPanel";
import { localDb } from "../services/db";
import { logger } from "../services/logger";
import { ttsService } from "../services/ttsService";
import { notificationService } from "../services/notificationService";

describe("DevPanel & 7-Click Gesture in SettingsModal", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await localDb.clearLogs();
    await localDb.clearKv();
  });

  it("unlocks Dev Panel after 7 clicks on the version badge", async () => {
    const onOpenDevPanel = vi.fn();
    const onClose = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        onOpenDevPanel={onOpenDevPanel}
      />
    );

    const versionBadge = screen.getByTestId("version-badge");

    // Click 1 to 2 times: no toast yet
    fireEvent.click(versionBadge);
    fireEvent.click(versionBadge);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // Click 3: remaining 4 clicks, toast shows remaining
    fireEvent.click(versionBadge);
    expect(
      screen.getByText("Você está a 4 toques do Painel Dev.")
    ).toBeInTheDocument();

    // Click 4, 5, 6
    fireEvent.click(versionBadge);
    expect(
      screen.getByText("Você está a 3 toques do Painel Dev.")
    ).toBeInTheDocument();

    fireEvent.click(versionBadge);
    expect(
      screen.getByText("Você está a 2 toques do Painel Dev.")
    ).toBeInTheDocument();

    fireEvent.click(versionBadge);
    expect(
      screen.getByText("Você está a 1 toque do Painel Dev.")
    ).toBeInTheDocument();

    // 7th click: activates dev mode and triggers onOpenDevPanel
    fireEvent.click(versionBadge);
    await waitFor(() => {
      expect(
        screen.getByText("Modo Desenvolvedor Ativado!")
      ).toBeInTheDocument();
    });



    await waitFor(() => {
      expect(onOpenDevPanel).toHaveBeenCalled();
    });

    // Check kv persistence
    const isUnlocked = await localDb.getKv<boolean>("dev_mode_unlocked");
    expect(isUnlocked).toBe(true);
  });

  it("renders DevPanel with Logs, TTS, and Notifications tabs", async () => {
    await logger.info("game", "Teste de mensagem de log para visualizador");

    const onClose = vi.fn();

    render(<DevPanel isOpen={true} onClose={onClose} />);

    // Verify tabs exist
    expect(screen.getByText(/Logs do Sistema/)).toBeInTheDocument();
    expect(screen.getByText("Voz da G.S (TTS)")).toBeInTheDocument();
    expect(screen.getByText("Web Notifications")).toBeInTheDocument();

    // Verify log message appears in list
    await waitFor(() => {
      expect(
        screen.getByText("Teste de mensagem de log para visualizador")
      ).toBeInTheDocument();
    });

    // Test TTS tab switch
    const ttsTab = screen.getByText("Voz da G.S (TTS)");
    fireEvent.click(ttsTab);

    // Verify GS test phrase is present
    expect(
      screen.getByText(
        /"Aviso. O Sistema Slime Sage foi inicializado com sucesso."/
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Testar Voz da G.S")).toBeInTheDocument();

    // Test speech trigger
    const speakSpy = vi
      .spyOn(ttsService, "speak")
      .mockResolvedValueOnce(true);
    const testSpeechBtn = screen.getByText("Testar Voz da G.S");
    fireEvent.click(testSpeechBtn);
    expect(speakSpy).toHaveBeenCalledWith(
      "Aviso. O Sistema Slime Sage foi inicializado com sucesso.",
      expect.any(Object)
    );

    // Test Notifications tab switch
    const notifTab = screen.getByText("Web Notifications");
    fireEvent.click(notifTab);

    expect(
      screen.getByText("Solicitar Permissão de Notificação Web")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Disparar Notificação Imediata")
    ).toBeInTheDocument();

    // Test trigger notification
    const sendNotifSpy = vi
      .spyOn(notificationService, "sendNotification")
      .mockResolvedValueOnce(true);
    const triggerNotifBtn = screen.getByText("Disparar Notificação Imediata");
    fireEvent.click(triggerNotifBtn);
    expect(sendNotifSpy).toHaveBeenCalled();
  });

  it("renders Database tab and executes Seed Sample Data and Reset DB actions", async () => {
    const onClose = vi.fn();
    render(<DevPanel isOpen={true} onClose={onClose} />);

    // Verify DB tab button
    const dbTab = screen.getByText("Banco de Dados Local");
    expect(dbTab).toBeInTheDocument();
    fireEvent.click(dbTab);

    // Verify header and action buttons
    expect(
      screen.getByText("Gestão do Banco de Dados Local (IndexedDB)")
    ).toBeInTheDocument();
    const seedBtn = screen.getByRole("button", { name: /Semear Dados de Exemplo/i });
    const resetBtn = screen.getByRole("button", { name: /Apagar Tudo/i });
    expect(seedBtn).toBeInTheDocument();
    expect(resetBtn).toBeInTheDocument();

    // Wait for initial table counts loading to finish
    await waitFor(() => {
      expect(seedBtn).not.toBeDisabled();
    });

    // Click Seed
    fireEvent.click(seedBtn);
    await waitFor(
      () => {
        expect(
          screen.getByText("Banco de dados semeado com sucesso! Projetos e missões prontos.")
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify table diagnostics show rows
    await waitFor(() => {
      const counts = screen.getAllByText("project");
      expect(counts.length).toBeGreaterThanOrEqual(1);
    });

    // Wait for button to be enabled again
    await waitFor(() => {
      expect(resetBtn).not.toBeDisabled();
    });

    // Click Reset
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    fireEvent.click(resetBtn);
    await waitFor(
      () => {
        expect(
          screen.getByText("Banco de dados reinicializado. Todas as tabelas foram zeradas.")
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("closes when close button is clicked", () => {
    const onClose = vi.fn();
    render(<DevPanel isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByLabelText("Fechar Painel Dev");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
