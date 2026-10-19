import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StatusView } from "./StatusView";
import { gameService } from "../../services/gameService";
import { localDb } from "../../services/db";
import { type XpEvent } from "@slime-sage/shared";

describe("StatusView & AttributesRadarChart", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
    vi.clearAllMocks();
  });

  it("renders hunter profile, level progress, and radar chart SVG", async () => {
    // Seed sample ledger event to establish attributes and XP
    const sampleEvent: XpEvent = {
      id: "xpe_status_test_1",
      entity_type: "mission",
      entity_id: "mis_test_1",
      area_id: "INT",
      xp_amount: 50,
      mastery_amount: 25,
      description: "Pesquisa de Compiladores",
      created_at: new Date().toISOString(),
    };
    await localDb.put("xp_event", sampleEvent);

    // Reconcile profile
    await gameService.reconcileProfileWithLedger();

    render(<StatusView />);

    await waitFor(() => {
      expect(screen.getByText("PAINEL DE ATRIBUTOS // REGISTRO DO ESCOLHIDO")).toBeInTheDocument();
      expect(screen.getByText("Total XP")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("Rank do Escolhido")).toBeInTheDocument();
      expect(screen.getByText(/Horizonte Ativo/i)).toBeInTheDocument();
    });

    // Check SVG Radar chart presence
    const radarSvg = screen.getByTestId("radar-chart-svg");
    expect(radarSvg).toBeInTheDocument();

    const radarPolygon = screen.getByTestId("radar-polygon");
    expect(radarPolygon).toBeInTheDocument();

    // Check attribute areas displayed
    expect(screen.getAllByText("INT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FOR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DIS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CRI").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SOC").length).toBeGreaterThan(0);

    // Check ledger integrity check
    expect(screen.getByText("Ledger Imutável 100% Íntegro")).toBeInTheDocument();

    // Check recent ledger transactions list
    expect(screen.getByText("Pesquisa de Compiladores")).toBeInTheDocument();
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
    expect(screen.getByText("+25 Maestria")).toBeInTheDocument();
  });

  it("renders long activity names in ledger transactions with word wrapping classes", async () => {
    const longDescription = "Conclusão_da_missao_com_nome_muito_longo_que_nao_deve_ultrapassar_nem_flutuar_fora_do_componente";
    const longEvent: XpEvent = {
      id: "xpe_long_test",
      entity_type: "mission",
      entity_id: "mis_long",
      area_id: "INT",
      xp_amount: 100,
      mastery_amount: 50,
      description: longDescription,
      created_at: new Date().toISOString(),
    };
    await localDb.put("xp_event", longEvent);
    await gameService.reconcileProfileWithLedger();

    render(<StatusView />);

    await waitFor(() => {
      const descEl = screen.getByText(longDescription);
      expect(descEl).toBeInTheDocument();
      expect(descEl.className).toContain("break-words");
    });
  });
});
