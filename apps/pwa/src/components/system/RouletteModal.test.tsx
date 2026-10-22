import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { RouletteModal } from "./RouletteModal";
import { gameService } from "../../services/gameService";
import { localDb } from "../../services/db";
import type { Skill } from "@slime-sage/shared";

describe("RouletteModal", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
    vi.restoreAllMocks();
  });

  const mockExtraSkill: Skill = {
    id: "sk_test_extra",
    name: "Barreira Mágica",
    area_id: "INT",
    tier: "extra",
    mastery: 600,
    tags: [],
    description: "Defesa arcana",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("renders roulette modal with concentric runes, target tier, and base 20% chance", async () => {
    vi.spyOn(gameService, "getRouletteEligibility").mockResolvedValue({
      isEligible: true,
      targetTier: "unica",
      currentChance: 0.2,
      isInCooldown: false,
      cooldownRemainingMs: 0,
      missingMastery: 0,
      missingProjects: 0,
    });

    render(
      <RouletteModal
        isOpen={true}
        skill={mockExtraSkill}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("roulette-modal")).toBeInTheDocument();
      expect(screen.getByText(/ROLETA ESOTÉRICA \/\/ Barreira Mágica/i)).toBeInTheDocument();
      expect(screen.getByText("Base: 20%")).toBeInTheDocument();
      expect(screen.getByText("Total: 20%")).toBeInTheDocument();
      expect(screen.getByTestId("roulette-wheel")).toBeInTheDocument();
    });
  });

  it("displays accumulated pity chance when failures exist", async () => {
    vi.spyOn(gameService, "getRouletteEligibility").mockResolvedValue({
      isEligible: true,
      targetTier: "unica",
      currentChance: 0.4,
      isInCooldown: false,
      cooldownRemainingMs: 0,
      missingMastery: 0,
      missingProjects: 0,
    });

    render(
      <RouletteModal
        isOpen={true}
        skill={mockExtraSkill}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Base: 20%")).toBeInTheDocument();
      expect(screen.getByText("Pity (+20%)")).toBeInTheDocument();
      expect(screen.getByText("Total: 40%")).toBeInTheDocument();
    });
  });

  it("simulates spin and transitions to baptism/consecration view on success", async () => {
    vi.spyOn(gameService, "getRouletteEligibility").mockResolvedValue({
      isEligible: true,
      targetTier: "unica",
      currentChance: 0.3,
      isInCooldown: false,
      cooldownRemainingMs: 0,
      missingMastery: 0,
      missingProjects: 0,
    });

    vi.spyOn(gameService, "spinRoulette").mockResolvedValue({
      success: true,
      previousTier: "extra",
      newTier: "unica",
      rolledValue: 0.15,
      finalChance: 0.3,
      cooldownUntil: null,
      newFailureCount: 0,
      attempt: {
        id: "att_1",
        skill_id: mockExtraSkill.id,
        target_tier: "unica",
        base_chance: 0.2,
        failure_bonus: 0.1,
        success: true,
        rolled_value: 0.15,
        final_chance: 0.3,
        cooldown_until: null,
        created_at: new Date().toISOString(),
      },
    });

    const onSuccess = vi.fn();

    render(
      <RouletteModal
        isOpen={true}
        skill={mockExtraSkill}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    const spinBtn = await screen.findByRole("button", { name: /Invocar Transmutação/i });

    vi.useFakeTimers();
    fireEvent.click(spinBtn);

    // Flush pending microtasks
    await act(async () => {
      await Promise.resolve();
    });

    // Advance spin timer
    act(() => {
      vi.advanceTimersByTime(4600);
    });

    expect(screen.getByText(/Transmutação Sagrada Concluída!/i)).toBeInTheDocument();
    expect(screen.getByText(/Nome Consagrado:/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirmar e Consagrar Despertar/i });
    fireEvent.click(confirmBtn);

    expect(onSuccess).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
