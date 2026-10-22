import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SkillsView } from "./SkillsView";
import { gameService } from "../../services/gameService";
import { localDb } from "../../services/db";
import type { Skill } from "@slime-sage/shared";

describe("SkillsView Phase 10: 7 Canonical Tiers, Harvest Banner, and Modal Triggers", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
    vi.restoreAllMocks();
  });

  it("renders skills across different canonical tiers with correct labels and ceilings", async () => {
    const sIntrinseca: Skill = {
      id: "sk_intrinseca",
      name: "Predador Inicial",
      area_id: "INT",
      tier: "intrinseca",
      mastery: 50,
      tags: [],
      description: "Despertar inato de Slime",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sEspecial: Skill = {
      id: "sk_especial",
      name: "Mente Acelerada",
      area_id: "INT",
      tier: "especial",
      mastery: 150,
      tags: [],
      description: "Percepção quântica expandida",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sExtra: Skill = {
      id: "sk_extra",
      name: "Chama Negra",
      area_id: "INT",
      tier: "extra",
      mastery: 600,
      tags: [],
      description: "Fogo devorador",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sUnica: Skill = {
      id: "sk_unica",
      name: "Grande Sábio",
      area_id: "INT",
      tier: "unica",
      mastery: 900,
      tags: [],
      description: "Voz do Mundo interior",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sSuprema: Skill = {
      id: "sk_suprema",
      name: "Rafael, Senhor da Sabedoria",
      area_id: "INT",
      tier: "suprema",
      mastery: 2000,
      tags: [],
      description: "Lorde dos mistérios",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sPrimordial: Skill = {
      id: "sk_primordial",
      name: "Ciel",
      area_id: "INT",
      tier: "primordial",
      mastery: 5000,
      tags: [],
      description: "Divindade cósmica plena",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await localDb.put("skill", sIntrinseca);
    await localDb.put("skill", sEspecial);
    await localDb.put("skill", sExtra);
    await localDb.put("skill", sUnica);
    await localDb.put("skill", sSuprema);
    await localDb.put("skill", sPrimordial);

    render(<SkillsView />);

    await waitFor(() => {
      expect(screen.getByText("Predador Inicial")).toBeInTheDocument();
      expect(screen.getByText("Mente Acelerada")).toBeInTheDocument();
      expect(screen.getByText("Chama Negra")).toBeInTheDocument();
      expect(screen.getByText("Grande Sábio")).toBeInTheDocument();
      expect(screen.getByText("Rafael, Senhor da Sabedoria")).toBeInTheDocument();
      expect(screen.getByText("Ciel")).toBeInTheDocument();

      // Badges
      expect(screen.getAllByText("Habilidade Intrínseca").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Habilidade Especial").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Habilidade Extra").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Habilidade Única").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Habilidade Suprema").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Grau Primordial").length).toBeGreaterThan(0);

      // Ceilings
      expect(screen.getByText("50 / 100 pts (50%)")).toBeInTheDocument();
      expect(screen.getByText("150 / 300 pts (50%)")).toBeInTheDocument();
      expect(screen.getByText("600 / 600 pts (100%)")).toBeInTheDocument();
      expect(screen.getByText("900 / 1200 pts (75%)")).toBeInTheDocument();
      expect(screen.getByText("2000 / 2500 pts (80%)")).toBeInTheDocument();
      expect(screen.getByText("5000 / 50000 pts (10%)")).toBeInTheDocument();
    });
  });

  it("displays the Harvest Festival banner and opens the Harvest Altar modal", async () => {
    await gameService.activateHarvestFestival();

    render(<SkillsView />);

    await waitFor(() => {
      expect(screen.getByTestId("harvest-festival-banner")).toBeInTheDocument();
      expect(screen.getByText(/✦ FESTIVAL DA COLHEITA ATIVO \(2.0x XP\) ✦/i)).toBeInTheDocument();
    });

    const openAltarBtn = screen.getByTestId("open-harvest-altar-btn");
    fireEvent.click(openAltarBtn);

    await waitFor(() => {
      expect(screen.getByTestId("harvest-altar-modal")).toBeInTheDocument();
    });
  });

  it("displays Roulette button for eligible tiers and opens Roulette modal when clicked", async () => {
    const skillExtra: Skill = {
      id: "sk_extra_roulette",
      name: "Relâmpago Sagrado",
      area_id: "INT",
      tier: "extra",
      mastery: 600,
      tags: [],
      description: "Raio fulminante",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await localDb.put("skill", skillExtra);

    render(<SkillsView />);

    await waitFor(() => {
      expect(screen.getByTestId("skill-card-sk_extra_roulette")).toBeInTheDocument();
    });

    const rouletteBtn = screen.getByTestId("roulette-btn-sk_extra_roulette");
    expect(rouletteBtn).toBeInTheDocument();

    fireEvent.click(rouletteBtn);

    await waitFor(() => {
      expect(screen.getByTestId("roulette-modal")).toBeInTheDocument();
      expect(screen.getByText(/ROLETA ESOTÉRICA \/\/ Relâmpago Sagrado/i)).toBeInTheDocument();
    });
  });
});
