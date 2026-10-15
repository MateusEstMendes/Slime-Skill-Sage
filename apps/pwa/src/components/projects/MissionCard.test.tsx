import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MissionCard } from "./MissionCard";
import { type Mission } from "@slime-sage/shared";

describe("MissionCard Component", () => {
  const baseMission: Mission = {
    id: "m_1",
    project_id: "p_1",
    title: "Implementar Grafo Acíclico",
    description: "Criar validador Kahn e detecção de ciclos",
    status: "disponivel",
    order_index: 0,
    xp_reward: 50,
    completed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
  };

  it("renders mission in [disponivel] state with active complete button", () => {
    const handleComplete = vi.fn();
    render(
      <MissionCard
        mission={{ ...baseMission, status: "disponivel" }}
        onComplete={handleComplete}
      />,
    );

    expect(screen.getByText("Implementar Grafo Acíclico")).toBeInTheDocument();
    expect(screen.getByTestId("badge-status-disponivel")).toBeInTheDocument();

    const completeBtn = screen.getByTestId("button-complete-m_1");
    expect(completeBtn).toBeEnabled();
    expect(screen.getByText(/concluir missão/i)).toBeInTheDocument();

    fireEvent.click(completeBtn);
    expect(handleComplete).toHaveBeenCalledWith("m_1");
  });

  it("renders mission in [bloqueada] state with disabled button and lists pending prerequisites", () => {
    const prereq: Mission = {
      ...baseMission,
      id: "m_pre",
      title: "Estudar Algoritmo Kahn",
      status: "disponivel",
    };

    render(
      <MissionCard
        mission={{ ...baseMission, status: "bloqueada" }}
        prerequisiteMissions={[prereq]}
      />,
    );

    expect(screen.getByTestId("badge-status-bloqueada")).toBeInTheDocument();
    expect(screen.getByText(/requisitos pendentes:/i)).toBeInTheDocument();
    expect(screen.getByText(/estudar algoritmo kahn/i)).toBeInTheDocument();

    const blockedBtn = screen.getByTestId("button-blocked-m_1");
    expect(blockedBtn).toBeDisabled();
    expect(screen.queryByTestId("button-complete-m_1")).not.toBeInTheDocument();
  });

  it("renders mission in [feita] state with completed timestamp and reopen button", () => {
    const handleReopen = vi.fn();
    render(
      <MissionCard
        mission={{
          ...baseMission,
          status: "feita",
          completed_at: "2026-01-02T10:00:00.000Z",
        }}
        onReopen={handleReopen}
      />,
    );

    expect(screen.getByTestId("badge-status-feita")).toBeInTheDocument();
    expect(screen.getByText(/concluída em/i)).toBeInTheDocument();

    const reopenBtn = screen.getByTestId("button-reopen-m_1");
    expect(reopenBtn).toBeInTheDocument();
    fireEvent.click(reopenBtn);
    expect(handleReopen).toHaveBeenCalledWith("m_1");
  });

  it("handles edit and delete actions", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <MissionCard
        mission={baseMission}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
    );

    const editBtn = screen.getByLabelText(/editar missão/i);
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(baseMission);

    const deleteBtn = screen.getByLabelText(/excluir missão/i);
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("m_1");
  });
});
