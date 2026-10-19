import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProposalCard } from "./ProposalCard";
import type { CreateProjectTreeProposal, AddMissionsProposal, UpdateMissionProposal, DeleteMissionProposal } from "@slime-sage/shared";

describe("ProposalCard", () => {
  it("renders create_project_tree proposal correctly", () => {
    const proposal: CreateProjectTreeProposal = {
      type: "create_project_tree",
      project: {
        title: "Dominar Rust",
        description: "Projeto de programação de sistemas",
        area_id: "INT",
      },
      missions: [
        {
          title: "Ownership e Borrowing",
          description: "Entender referências",
          xp_reward: 35,
          depends_on_titles: [],
          skills: [
            { name: "Lógica de Programação", area_id: "INT", is_new: false },
            { name: "Memória Segura", area_id: "INT", is_new: true },
          ],
        },
        {
          title: "Lifetimes e Generics",
          description: "Tipos complexos",
          xp_reward: 55,
          depends_on_titles: ["Ownership e Borrowing"],
          skills: [{ name: "Abstração de Tipos", area_id: "INT", is_new: true }],
        },
      ],
      explanation: "Arquitetura recomendada para maximizar inteligência.",
    };

    render(
      <ProposalCard
        proposal={proposal}
        status="pendente"
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );

    expect(screen.getByText("PROPOSTA // ÁRVORE DE PROJETO")).toBeInTheDocument();
    expect(screen.getByText("Dominar Rust")).toBeInTheDocument();
    expect(screen.getByText("Inteligência")).toBeInTheDocument();
    expect(screen.getByText("Ownership e Borrowing")).toBeInTheDocument();
    expect(screen.getByText("Lifetimes e Generics")).toBeInTheDocument();
    expect(screen.getByText("Requer: Ownership e Borrowing")).toBeInTheDocument();
    expect(screen.getByText("Lógica de Programação")).toBeInTheDocument();
    expect(screen.getByText("[EXISTENTE]")).toBeInTheDocument();
    expect(screen.getByText("Memória Segura")).toBeInTheDocument();
    expect(screen.getAllByText("[NOVA · INT]")).toHaveLength(2);
    expect(screen.getByText("+35 XP")).toBeInTheDocument();
    expect(screen.getByText("+55 XP")).toBeInTheDocument();
    expect(screen.getByText(/Arquitetura recomendada/)).toBeInTheDocument();
    expect(screen.getByText("Aceitar Decreto")).toBeInTheDocument();
    expect(screen.getByText("Recusar")).toBeInTheDocument();
    expect(screen.getByText("Pedir Ajuste")).toBeInTheDocument();
  });

  it("handles onAccept button click", () => {
    const onAccept = vi.fn();
    const proposal: DeleteMissionProposal = {
      type: "delete_mission",
      mission_id: "mis-123",
      mission_title: "Missão Obsoleta",
    };

    render(
      <ProposalCard
        proposal={proposal}
        status="pendente"
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Aceitar Decreto"));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("handles onReject button click", () => {
    const onReject = vi.fn();
    const proposal: DeleteMissionProposal = {
      type: "delete_mission",
      mission_id: "mis-123",
      mission_title: "Missão Obsoleta",
    };

    render(
      <ProposalCard
        proposal={proposal}
        status="pendente"
        onAccept={vi.fn()}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByText("Recusar"));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("handles onAdjust button click", () => {
    const onAdjust = vi.fn();
    const proposal: DeleteMissionProposal = {
      type: "delete_mission",
      mission_id: "mis-123",
      mission_title: "Missão Obsoleta",
    };

    render(
      <ProposalCard
        proposal={proposal}
        status="pendente"
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onAdjust={onAdjust}
      />,
    );

    fireEvent.click(screen.getByText("Pedir Ajuste"));
    expect(onAdjust).toHaveBeenCalledTimes(1);
  });

  it("renders status banner when proposal is approved", () => {
    const proposal: AddMissionsProposal = {
      type: "add_missions",
      project_id: "p1",
      missions: [
        {
          title: "100 agachamentos",
          description: "Série de calistenia",
          xp_reward: 35,
          depends_on_mission_ids: [],
        },
      ],
    };

    render(
      <ProposalCard
        proposal={proposal}
        status="aprovada"
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("✦ DECRETO APROVADO E EXECUTADO NO SISTEMA ✦")).toBeInTheDocument();
    expect(screen.queryByText("Aceitar Decreto")).not.toBeInTheDocument();
  });

  it("renders status banner when proposal is rejected", () => {
    const proposal: UpdateMissionProposal = {
      type: "update_mission",
      mission_id: "mis-1",
      current_title: "Título Antigo",
      updates: { title: "Novo Título" },
    };

    render(
      <ProposalCard
        proposal={proposal}
        status="rejeitada"
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("✦ PROPOSTA ARQUIVADA PELO CAÇADOR ✦")).toBeInTheDocument();
    expect(screen.queryByText("Aceitar Decreto")).not.toBeInTheDocument();
  });
});
