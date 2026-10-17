import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SkillsView } from "./SkillsView";
import { gameService } from "../../services/gameService";
import { localDb } from "../../services/db";
import { type Skill, type XpEvent } from "@slime-sage/shared";
import { type GameEvent } from "@slime-sage/game";

describe("SkillsView", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
    vi.clearAllMocks();
  });

  it("renders skills list, badges, and mastery progress bars", async () => {
    const s1: Skill = {
      id: "skl_comum_1",
      name: "Algoritmos Puros",
      area_id: "INT",
      tier: "comum",
      mastery: 45,
      description: "Capacidade analítica de decompor problemas",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const s2: Skill = {
      id: "skl_extra_1",
      name: "Hiperfoco Absoluto",
      area_id: "DIS",
      tier: "extra",
      mastery: 180,
      description: "Estado de fluxo sustentado",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await localDb.put("skill", s1);
    await localDb.put("skill", s2);

    render(<SkillsView />);

    await waitFor(() => {
      expect(screen.getByText("Algoritmos Puros")).toBeInTheDocument();
      expect(screen.getByText("Hiperfoco Absoluto")).toBeInTheDocument();
      expect(screen.getAllByText(/Habilidade Comum/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Habilidade Extra/i).length).toBeGreaterThan(0);
      expect(screen.getByText("45 / 100 pts (45%)")).toBeInTheDocument();
      expect(screen.getByText("180 / 300 pts (60%)")).toBeInTheDocument();
    });
  });

  it("filters skills by area", async () => {
    const s1: Skill = {
      id: "skl_filter_int",
      name: "Engenharia Reversa",
      area_id: "INT",
      tier: "comum",
      mastery: 20,
      description: "Análise profunda",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const s2: Skill = {
      id: "skl_filter_for",
      name: "Musculação Pesada",
      area_id: "FOR",
      tier: "comum",
      mastery: 30,
      description: "Treino resistido",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await localDb.put("skill", s1);
    await localDb.put("skill", s2);

    render(<SkillsView />);

    await waitFor(() => {
      expect(screen.getByText("Engenharia Reversa")).toBeInTheDocument();
      expect(screen.getByText("Musculação Pesada")).toBeInTheDocument();
    });

    // Click on area filter "FOR"
    const forFilterBtn = screen.getByRole("button", { name: /Força \[FOR\]/i });
    fireEvent.click(forFilterBtn);

    await waitFor(() => {
      expect(screen.queryByText("Engenharia Reversa")).not.toBeInTheDocument();
      expect(screen.getByText("Musculação Pesada")).toBeInTheDocument();
    });
  });

  it("opens modal, acquires new skill, and triggers SKILL_ACQUIRED", async () => {
    const dispatchedEvents: GameEvent[] = [];
    gameService.subscribeToGameEvents((e) => {
      dispatchedEvents.push(e);
    });

    render(<SkillsView />);

    // Open create modal
    const addBtn = screen.getByRole("button", { name: /Adquirir Habilidade/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome da Habilidade/i)).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/Nome da Habilidade/i), {
      target: { value: "Refatoração Suprema" },
    });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Despertar Habilidade/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Refatoração Suprema")).toBeInTheDocument();
    });

    // Check game event dispatched
    expect(
      dispatchedEvents.some(
        (e) => e.type === "SKILL_ACQUIRED" && e.payload.skillName === "Refatoração Suprema"
      )
    ).toBe(true);
  });

  it("opens mission history modal and displays ledger events", async () => {
    const skill: Skill = {
      id: "skl_history_test",
      name: "Arquitetura Hexagonal",
      area_id: "INT",
      tier: "comum",
      mastery: 40,
      description: "Design de software modular",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await localDb.put("skill", skill);

    const xpEvent: XpEvent = {
      id: "xpe_history_1",
      entity_type: "mission",
      entity_id: "mis_1",
      skill_id: skill.id,
      area_id: "INT",
      xp_amount: 50,
      mastery_amount: 15,
      description: "Implementação da Camada de Domínio",
      created_at: new Date().toISOString(),
    };
    await localDb.put("xp_event", xpEvent);

    render(<SkillsView />);

    await waitFor(() => {
      expect(screen.getByText("Arquitetura Hexagonal")).toBeInTheDocument();
    });

    // Click on "Histórico de Missões"
    const historyBtn = screen.getByRole("button", { name: /Histórico de Missões/i });
    fireEvent.click(historyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Histórico \/\/ Arquitetura Hexagonal/i)).toBeInTheDocument();
      expect(screen.getByText("Implementação da Camada de Domínio")).toBeInTheDocument();
      expect(screen.getByText("+15 Maestria")).toBeInTheDocument();
      expect(screen.getByText("+50 XP")).toBeInTheDocument();
    });
  });
});
