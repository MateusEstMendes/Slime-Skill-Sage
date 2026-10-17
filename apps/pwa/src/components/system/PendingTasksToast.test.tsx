import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PendingTasksToast } from "./PendingTasksToast";
import { localDb } from "../../services/db";
import { gsVoiceService } from "../../services/gsVoiceService";
import type { Mission, Project } from "@slime-sage/shared";

describe("PendingTasksToast", () => {
  beforeEach(async () => {
    await localDb.clearTable("mission");
    await localDb.clearTable("project");
    await localDb.clearKv();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("does not render when there are no available missions", async () => {
    render(<PendingTasksToast />);
    await waitFor(() => {
      expect(screen.queryByText(/AVISO DA G.S/)).not.toBeInTheDocument();
    });
  });

  it("renders toast when there are available missions and active projects", async () => {
    const project: Project = {
      id: "p1",
      title: "Dominar Algoritmos",
      area_id: "INT",
      status: "ativo",
      progress: 0,
      description: "",
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    await localDb.put("project", project);

    const mission: Mission = {
      id: "m1",
      project_id: "p1",
      title: "Grafos e DFS",
      description: "",
      status: "disponivel",
      order_index: 0,
      xp_reward: 50,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    await localDb.put("mission", mission);

    render(<PendingTasksToast />);

    await waitFor(() => {
      expect(screen.getByText("AVISO DA G.S // PENDÊNCIAS")).toBeInTheDocument();
      expect(screen.getByText(/1 missões disponíveis/)).toBeInTheDocument();
      expect(screen.getByText("Ouvir Mensagem")).toBeInTheDocument();
    });
  });

  it("triggers voice synthesis when Ouvir Mensagem is clicked", async () => {
    await localDb.put("project", {
      id: "p1",
      title: "Projeto 1",
      area_id: "INT",
      status: "ativo",
      progress: 0,
      description: "",
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    await localDb.put("mission", {
      id: "m1",
      project_id: "p1",
      title: "Missão 1",
      description: "",
      status: "disponivel",
      order_index: 0,
      xp_reward: 35,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    const speakSpy = vi.spyOn(gsVoiceService, "speakWithGs").mockResolvedValue(true);

    render(<PendingTasksToast />);

    await waitFor(() => {
      expect(screen.getByText("Ouvir Mensagem")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ouvir Mensagem"));
    expect(speakSpy).toHaveBeenCalledWith(expect.stringContaining("Existem 1 missões táticas"));
  });

  it("dismisses toast and stores dismissal timestamp in sessionStorage", async () => {
    await localDb.put("mission", {
      id: "m1",
      project_id: "p1",
      title: "Missão 1",
      description: "",
      status: "disponivel",
      order_index: 0,
      xp_reward: 35,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    render(<PendingTasksToast />);

    await waitFor(() => {
      expect(screen.getByLabelText("Dispensar aviso de pendências")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Dispensar aviso de pendências"));
    expect(screen.queryByText("AVISO DA G.S // PENDÊNCIAS")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("gs_pending_toast_dismissed")).toBeDefined();
  });
});
