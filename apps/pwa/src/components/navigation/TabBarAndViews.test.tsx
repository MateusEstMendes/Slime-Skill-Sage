import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TabBar } from "./TabBar";
import { HomeScreen } from "../HomeScreen";
import { gameService } from "../../services/gameService";

describe("TabBar and Screen Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(gameService, "getProfile").mockResolvedValue({
      id: "profile_main",
      name: "Rimuru Tempest",
      title: "Lorde Demônio Desperto",
      race: "Slime",
      rank_threat: "Hazard",
      level: 1,
      total_xp: 0,
      current_xp: 0,
      streak_count: 0,
      last_active_date: null,
      onboarding_done: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  describe("TabBar component", () => {
    it("renders all 5 tabs and handles tab selection", () => {
      const handleSelect = vi.fn();
      render(<TabBar activeTab="home" onSelectTab={handleSelect} />);

      expect(screen.getByTestId("tab-home")).toBeInTheDocument();
      expect(screen.getByTestId("tab-projects")).toBeInTheDocument();
      expect(screen.getByTestId("tab-gs")).toBeInTheDocument();
      expect(screen.getByTestId("tab-skills")).toBeInTheDocument();
      expect(screen.getByTestId("tab-status")).toBeInTheDocument();
      expect(screen.queryByTestId("tab-voices")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("tab-projects"));
      expect(handleSelect).toHaveBeenCalledWith("projects");

      fireEvent.click(screen.getByTestId("tab-gs"));
      expect(handleSelect).toHaveBeenCalledWith("gs");

      fireEvent.click(screen.getByTestId("tab-skills"));
      expect(handleSelect).toHaveBeenCalledWith("skills");
    });
  });

  describe("HomeScreen with active tab rendering", () => {
    it("switches views when clicking tabs", async () => {
      render(<HomeScreen onDisconnect={vi.fn()} />);

      // Starts in Home view
      expect(screen.getByText("PAINEL DO SISTEMA")).toBeInTheDocument();

      // Switch to Projects
      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-projects"));
      });
      expect(
        await screen.findByText("DIRETRIZES DE DESENVOLVIMENTO", {}, { timeout: 5000 }),
      ).toBeInTheDocument();

      // Switch to Skills
      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-skills"));
      });
      expect(
        await screen.findByText("ÁRVORE DE HABILIDADES // TENSURA", {}, { timeout: 5000 }),
      ).toBeInTheDocument();

      // Switch to Status
      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-status"));
      });
      expect(
        await screen.findByText("PAINEL DE ATRIBUTOS // REGISTRO DO ESCOLHIDO", {}, { timeout: 5000 }),
      ).toBeInTheDocument();

      // Switch to G.S
      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-gs"));
      });
      expect(
        await screen.findByText("GRANDE SÁBIO // COMUNICAÇÃO NEURAL", {}, { timeout: 5000 }),
      ).toBeInTheDocument();
    });
  });
});
