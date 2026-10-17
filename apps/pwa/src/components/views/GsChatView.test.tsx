import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GsChatView } from "./GsChatView";
import { localDb } from "../../services/db";
import * as apiClient from "../../services/apiClient";
import type { ChatResponse } from "@slime-sage/shared";

describe("GsChatView", () => {
  beforeEach(async () => {
    await localDb.clearTable("chat_thread");
    await localDb.clearTable("chat_message");
    await localDb.clearTable("project");
    await localDb.clearTable("mission");
    await localDb.clearTable("mission_dep");
    vi.restoreAllMocks();
  });

  it("renders header and initial welcome message", async () => {
    render(<GsChatView />);

    expect(screen.getByText("GRANDE SÁBIO // COMUNICAÇÃO NEURAL")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/O canal neural com a Grande Sábio está estabelecido/)).toBeInTheDocument();
    });
  });

  it("sends user message and displays assistant response", async () => {
    const mockChatResponse: ChatResponse = {
      role: "assistant",
      content: "Resposta: Recomendo focar na expansão da inteligência.",
      spoken_text: "Recomendo focar na expansão da inteligência.",
    };

    const sendSpy = vi.spyOn(apiClient, "sendChatMessage").mockResolvedValueOnce({
      success: true,
      data: mockChatResponse,
    });

    render(<GsChatView />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Consulte a Grande Sábio/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Consulte a Grande Sábio/);
    fireEvent.change(input, { target: { value: "O que devo priorizar hoje?" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getByText("O que devo priorizar hoje?")).toBeInTheDocument();

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalled();
      expect(screen.getByText("Resposta: Recomendo focar na expansão da inteligência.")).toBeInTheDocument();
    });
  });

  it("renders proposal card and executes local database creation on Aceitar Decreto", async () => {
    const mockChatResponse: ChatResponse = {
      role: "assistant",
      content: "Análise: Formulei uma árvore acíclica para dominar Rust.",
      proposal: {
        type: "create_project_tree",
        project: {
          title: "Dominar Rust",
          description: "Sistemas em Rust",
          area_id: "INT",
        },
        missions: [
          {
            title: "Ownership Básico",
            description: "Capítulo 4",
            xp_reward: 35,
            depends_on_titles: [],
          },
        ],
        explanation: "Fundamentação lógica sólida.",
      },
      spoken_text: "Proposta formulada.",
    };

    vi.spyOn(apiClient, "sendChatMessage").mockResolvedValueOnce({
      success: true,
      data: mockChatResponse,
    });

    render(<GsChatView />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Consulte a Grande Sábio/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Consulte a Grande Sábio/);
    fireEvent.change(input, { target: { value: "Crie um projeto para Rust" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("PROPOSTA // ÁRVORE DE PROJETO")).toBeInTheDocument();
      expect(screen.getByText("Dominar Rust")).toBeInTheDocument();
      expect(screen.getByText("Ownership Básico")).toBeInTheDocument();
      expect(screen.getByText("Aceitar Decreto")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Aceitar Decreto"));

    await waitFor(() => {
      expect(screen.getByText("✦ DECRETO APROVADO E EXECUTADO NO SISTEMA ✦")).toBeInTheDocument();
    });

    // Valida que o projeto e missão foram criados no IndexedDB
    const projects = await localDb.getAll("project");
    expect(projects).toHaveLength(1);
    expect(projects[0]).toHaveProperty("title", "Dominar Rust");

    const missions = await localDb.getAll("mission");
    expect(missions).toHaveLength(1);
    expect(missions[0]).toHaveProperty("title", "Ownership Básico");
  });
});
