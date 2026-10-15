import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TabBar } from "./TabBar";
import { HomeScreen } from "../HomeScreen";

describe("TabBar and Screen Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      fireEvent.click(screen.getByTestId("tab-projects"));
      expect(handleSelect).toHaveBeenCalledWith("projects");

      fireEvent.click(screen.getByTestId("tab-gs"));
      expect(handleSelect).toHaveBeenCalledWith("gs");
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
        await screen.findByText("DIRETRIZES DE DESENVOLVIMENTO"),
      ).toBeInTheDocument();

      // Switch to Skills
      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-skills"));
      });
      expect(
        await screen.findByText("ÁRVORE DE HABILIDADES // TENSURA"),
      ).toBeInTheDocument();

      // Switch to Status
      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-status"));
      });
      expect(
        await screen.findByText("PAINEL DE ATRIBUTOS // SOLO LEVELING"),
      ).toBeInTheDocument();

      // Switch to G.S
      await act(async () => {
        fireEvent.click(screen.getByTestId("tab-gs"));
      });
      expect(
        await screen.findByText("GRANDE SÁBIO // COMUNICAÇÃO NEURAL"),
      ).toBeInTheDocument();
    });
  });
});
