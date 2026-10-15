import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectModal } from "./ProjectModal";
import { MissionModal } from "./MissionModal";
import { type Project, type Mission } from "@slime-sage/shared";

describe("Project and Mission Modals", () => {
  describe("ProjectModal", () => {
    it("validates required title and submits new project data", async () => {
      const handleSave = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <ProjectModal
          isOpen={true}
          onClose={handleClose}
          onSave={handleSave}
        />,
      );

      const submitBtn = screen.getByRole("button", { name: /criar projeto/i });
      fireEvent.click(submitBtn);

      // Should show validation error
      expect(screen.getByText(/o título do projeto é obrigatório/i)).toBeInTheDocument();
      expect(handleSave).not.toHaveBeenCalled();

      // Fill form
      const titleInput = screen.getByLabelText(/título do projeto/i);
      fireEvent.change(titleInput, { target: { value: "Aprender Rust" } });

      const descInput = screen.getByLabelText(/descrição dos objetivos/i);
      fireEvent.change(descInput, { target: { value: "Projetos de sistemas com Rust" } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith({
          title: "Aprender Rust",
          description: "Projetos de sistemas com Rust",
          area_id: "INT",
          status: "ativo",
        });
      });
    });

    it("prefills fields when editing existing project", () => {
      const existing: Project = {
        id: "proj_1",
        area_id: "FOR",
        title: "Treino Funcional",
        description: "Rotina de calistenia",
        status: "ativo",
        progress: 40,
        completed_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        deleted_at: null,
      };

      render(
        <ProjectModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          projectToEdit={existing}
        />,
      );

      expect(screen.getByDisplayValue("Treino Funcional")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Rotina de calistenia")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument();
    });
  });

  describe("MissionModal", () => {
    const candidateMissions: Mission[] = [
      {
        id: "cand_1",
        project_id: "p_1",
        title: "Requisito Prévia 1",
        description: "",
        status: "disponivel",
        order_index: 0,
        xp_reward: 50,
        completed_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        deleted_at: null,
      },
    ];

    it("allows selecting dependencies and submits mission data", async () => {
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(
        <MissionModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={handleSave}
          existingMissions={candidateMissions}
        />,
      );

      const titleInput = screen.getByLabelText(/título da missão/i);
      fireEvent.change(titleInput, { target: { value: "Missão Final do Módulo" } });

      // Click candidate dependency to select it
      const depBtn = screen.getByText("Requisito Prévia 1");
      fireEvent.click(depBtn);

      const submitBtn = screen.getByRole("button", { name: /adicionar missão/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith({
          title: "Missão Final do Módulo",
          description: "",
          xp_reward: 50,
          order_index: 1,
          depends_on_ids: ["cand_1"],
        });
      });
    });
  });
});
