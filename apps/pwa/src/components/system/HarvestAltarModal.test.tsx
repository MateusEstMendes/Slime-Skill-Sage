import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HarvestAltarModal } from "./HarvestAltarModal";
import { gameService } from "../../services/gameService";
import { localDb } from "../../services/db";
import type { Skill } from "@slime-sage/shared";

describe("HarvestAltarModal", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
    vi.restoreAllMocks();
  });

  const skillA: Skill = {
    id: "sk_fuse_1",
    name: "Raio Arcano",
    area_id: "INT",
    tier: "comum",
    mastery: 80,
    domain: "Arcana",
    tags: ["magia", "energia"],
    description: "Mana concentrada",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const skillB: Skill = {
    id: "sk_fuse_2",
    name: "Chama Elemental",
    area_id: "INT",
    tier: "comum",
    mastery: 70,
    domain: "Elemental",
    tags: ["fogo", "energia"],
    description: "Fogo vivo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("renders both summoning circles (Alfa and Beta) and skills inventory", async () => {
    await localDb.put("skill", skillA);
    await localDb.put("skill", skillB);

    render(
      <HarvestAltarModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("harvest-altar-modal")).toBeInTheDocument();
      expect(screen.getByText("[Círculo Alfa]")).toBeInTheDocument();
      expect(screen.getByText("[Círculo Beta]")).toBeInTheDocument();
      expect(screen.getByText("Raio Arcano")).toBeInTheDocument();
      expect(screen.getByText("Chama Elemental")).toBeInTheDocument();
    });
  });

  it("selects skills, connects mana threads, calculates deterministic synergy, and displays synergy score", async () => {
    await localDb.put("skill", skillA);
    await localDb.put("skill", skillB);

    render(
      <HarvestAltarModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Raio Arcano")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Raio Arcano"));
    fireEvent.click(screen.getByText("Chama Elemental"));

    await waitFor(() => {
      expect(screen.getByTestId("mana-threads-svg")).toBeInTheDocument();
      expect(screen.getByText(/Sinergia Arcana:/i)).toBeInTheDocument();
      expect(screen.getByText(/Destino: Grau especial/i)).toBeInTheDocument();
    });

    const proceedBtn = screen.getByRole("button", { name: /Prosseguir para Inquisição da G.S/i });
    expect(proceedBtn).not.toBeDisabled();
  });

  it("advances to GS Inquisition step, selects 1-touch pill, and executes fusion", async () => {
    await localDb.put("skill", skillA);
    await localDb.put("skill", skillB);

    const onSuccess = vi.fn();
    const fuseSpy = vi.spyOn(gameService, "fuseSkills").mockResolvedValue({
      id: "sk_fused",
      name: "Tempestade de Plasma",
      area_id: "INT",
      tier: "especial",
      mastery: 80,
      tags: [],
      description: "Nova habilidade unificada",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    render(
      <HarvestAltarModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Raio Arcano")).toBeInTheDocument();
    });

    // Step 1: Select skills
    fireEvent.click(screen.getByText("Raio Arcano"));
    fireEvent.click(screen.getByText("Chama Elemental"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Prosseguir para Inquisição da G.S/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Prosseguir para Inquisição da G.S/i }));

    // Step 2: Inquisition with pills and name
    await waitFor(() => {
      expect(screen.getByText(/Interrogação Canônica da Grande Sábio/i)).toBeInTheDocument();
    });

    const toStep3Btn = screen.getByRole("button", { name: /Avançar para o Desafio de Provação/i });
    fireEvent.click(toStep3Btn);

    // Step 3: Confirmation and sacrifice seal
    await waitFor(() => {
      expect(screen.getByText(/Desafio Autodeclarado de Transmutação/i)).toBeInTheDocument();
      expect(screen.getByText(/Aviso Sagrado de Sacrifício/i)).toBeInTheDocument();
    });

    const sealBtn = screen.getByRole("button", { name: /Consagrar Fusão no Altar/i });
    fireEvent.click(sealBtn);

    await waitFor(() => {
      expect(fuseSpy).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
