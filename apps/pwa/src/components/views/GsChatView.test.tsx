import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GsChatView } from "./GsChatView";
import { localDb } from "../../services/db";
import { worldVoiceService } from "../../services/worldVoiceService";
import * as apiClient from "../../services/apiClient";
import type { ChatResponse } from "@slime-sage/shared";

describe("GsChatView", () => {
  beforeEach(async () => {
    await localDb.clearTable("chat_thread");
    await localDb.clearTable("chat_message");
    await localDb.clearTable("project");
    await localDb.clearTable("mission");
    await localDb.clearTable("mission_dep");
    await localDb.clearTable("skill");
    await localDb.clearTable("mission_reward");
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

  it("renders proposal card and executes local database creation with atomic skill creation on Aceitar Decreto", async () => {
    const mockChatResponse: ChatResponse = {
      role: "assistant",
      content: "Análise: Formulei uma árvore acíclica para dominar Rust.",
      proposal: {
        type: "create_project_tree",
        project: {
          title: "Dominar Rust",
          description: "Sistemas em Rust",
          area_id: "INT",
          target_skill: {
            name: "Programação Rust",
            area_id: "INT",
            next_evolution_name: "Manipulador de Memória Rust",
            next_evolution_description: "Grau Extra de Rust",
          },
        },
        missions: [
          {
            title: "Ownership Básico",
            description: "Capítulo 4",
            xp_reward: 35,
            depends_on_titles: [],
            skills: [
              {
                name: "Programação Rust",
                area_id: "INT",
                is_new: true,
              },
            ],
          },
        ],
        explanation: "Fundamentação lógica sólida.",
      },
      spoken_text: "Proposta formulada.",
    };

    const voiceClipSpy = vi.spyOn(worldVoiceService, "playVoiceClip");

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
      expect(screen.getAllByText("[NOVA · INT]").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Aceitar Decreto")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Aceitar Decreto"));

    await waitFor(() => {
      expect(screen.getByText("✦ DECRETO APROVADO E EXECUTADO NO SISTEMA ✦")).toBeInTheDocument();
    });

    // Valida que o áudio oficial de project-start foi acionado
    expect(voiceClipSpy).toHaveBeenCalledWith("/audio/voice/project-start.mp3");

    // Valida que o projeto, missão, habilidade e vínculo foram criados no IndexedDB
    const projects = await localDb.getAll("project");
    expect(projects).toHaveLength(1);
    expect(projects[0]).toHaveProperty("title", "Dominar Rust");

    const missions = await localDb.getAll("mission");
    expect(missions).toHaveLength(1);
    expect(missions[0]).toHaveProperty("title", "Ownership Básico");

    const skills = await localDb.getAll("skill");
    expect(skills).toHaveLength(1);
    expect(skills[0]).toHaveProperty("name", "Programação Rust");
    expect(skills[0]).toHaveProperty("area_id", "INT");
    expect(skills[0]).toHaveProperty("next_evolution_name", "Manipulador de Memória Rust");
    expect(skills[0]).toHaveProperty("next_evolution_description", "Grau Extra de Rust");

    const rewards = await localDb.getAll("mission_reward");
    expect(rewards).toHaveLength(1);
  });

  it("triggers Pre-Card Validator auto-retry when a proposal has structural anomalies", async () => {
    const invalidCyclicResponse: ChatResponse = {
      role: "assistant",
      content: "Análise inicial com anomalia.",
      proposal: {
        type: "create_project_tree",
        project: {
          title: "Treino Inválido",
          description: "Ciclo detectado",
          area_id: "FOR",
        },
        missions: [
          {
            title: "Missão A",
            description: "Depende de B",
            xp_reward: 20,
            depends_on_titles: ["Missão B"],
            skills: [{ name: "Calistenia", area_id: "FOR", is_new: true }],
          },
          {
            title: "Missão B",
            description: "Depende de A",
            xp_reward: 20,
            depends_on_titles: ["Missão A"],
            skills: [{ name: "Calistenia", area_id: "FOR", is_new: true }],
          },
        ],
        explanation: "Ciclo acidental.",
      },
      spoken_text: "Análise inicial.",
    };

    const correctedResponse: ChatResponse = {
      role: "assistant",
      content: "Análise recalculada: Árvore acíclica validada.",
      proposal: {
        type: "create_project_tree",
        project: {
          title: "Treino Recalculado",
          description: "DAG válido",
          area_id: "FOR",
        },
        missions: [
          {
            title: "Missão A",
            description: "Base",
            xp_reward: 20,
            depends_on_titles: [],
            skills: [{ name: "Calistenia", area_id: "FOR", is_new: true }],
          },
          {
            title: "Missão B",
            description: "Depende de A",
            xp_reward: 30,
            depends_on_titles: ["Missão A"],
            skills: [{ name: "Calistenia", area_id: "FOR", is_new: true }],
          },
        ],
        explanation: "Progressão linear sem ciclos.",
      },
      spoken_text: "Parâmetros recalculados.",
    };

    const sendSpy = vi
      .spyOn(apiClient, "sendChatMessage")
      .mockResolvedValueOnce({ success: true, data: invalidCyclicResponse })
      .mockResolvedValueOnce({ success: true, data: correctedResponse });

    render(<GsChatView />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Consulte a Grande Sábio/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Consulte a Grande Sábio/);
    fireEvent.change(input, { target: { value: "Monte meu treino" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Treino Recalculado")).toBeInTheDocument();
    });
  });
});
