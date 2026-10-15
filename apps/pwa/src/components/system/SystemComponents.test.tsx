import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SystemButton,
  SystemBadge,
  SystemPanel,
  SystemModal,
} from "./index";

describe("System Design Components", () => {
  describe("SystemButton", () => {
    it("renders button with children and calls onClick", () => {
      const handleClick = vi.fn();
      render(
        <SystemButton variant="primary" onClick={handleClick}>
          EXECUTAR SISTEMA
        </SystemButton>,
      );

      const btn = screen.getByRole("button", { name: /executar sistema/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled or loading", () => {
      const handleClick = vi.fn();
      const { rerender } = render(
        <SystemButton disabled onClick={handleClick}>
          AÇÃO BLOQUEADA
        </SystemButton>,
      );

      const btn = screen.getByRole("button", { name: /ação bloqueada/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();

      rerender(
        <SystemButton loading onClick={handleClick}>
          CARREGANDO
        </SystemButton>,
      );
      const loadingBtn = screen.getByRole("button", { name: /carregando/i });
      expect(loadingBtn).toBeDisabled();
      fireEvent.click(loadingBtn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("SystemBadge", () => {
    it("renders area badges for all 5 base areas", () => {
      const { rerender } = render(<SystemBadge type="area" areaId="INT" />);
      expect(screen.getByText(/int \/\/ inteligência/i)).toBeInTheDocument();

      rerender(<SystemBadge type="area" areaId="FOR" />);
      expect(screen.getByText(/for \/\/ força/i)).toBeInTheDocument();

      rerender(<SystemBadge type="area" areaId="DIS" />);
      expect(screen.getByText(/dis \/\/ disciplina/i)).toBeInTheDocument();

      rerender(<SystemBadge type="area" areaId="CRI" />);
      expect(screen.getByText(/cri \/\/ criatividade/i)).toBeInTheDocument();

      rerender(<SystemBadge type="area" areaId="SOC" />);
      expect(screen.getByText(/soc \/\/ social/i)).toBeInTheDocument();
    });

    it("renders mission status badges correctly", () => {
      const { rerender } = render(
        <SystemBadge type="mission-status" missionStatus="bloqueada" />,
      );
      expect(screen.getByTestId("badge-status-bloqueada")).toBeInTheDocument();
      expect(screen.getByText(/bloqueada/i)).toBeInTheDocument();

      rerender(<SystemBadge type="mission-status" missionStatus="disponivel" />);
      expect(screen.getByTestId("badge-status-disponivel")).toBeInTheDocument();
      expect(screen.getByText(/disponível/i)).toBeInTheDocument();

      rerender(<SystemBadge type="mission-status" missionStatus="feita" />);
      expect(screen.getByTestId("badge-status-feita")).toBeInTheDocument();
      expect(screen.getByText(/concluída/i)).toBeInTheDocument();
    });

    it("renders XP and rank badges", () => {
      render(
        <div>
          <SystemBadge type="xp" xp={75} />
          <SystemBadge type="rank" rank="S" />
        </div>,
      );
      expect(screen.getByText("+75")).toBeInTheDocument();
      expect(screen.getByText("RANK S")).toBeInTheDocument();
    });
  });

  describe("SystemPanel", () => {
    it("renders panel with title, subtitle, and HUD corner accents", () => {
      render(
        <SystemPanel
          title="DIRETRIZ ATIVA"
          subtitle="Setor de Processamento"
          headerAction={<button>AÇÃO</button>}
        >
          <div data-testid="panel-content">Conteúdo do Painel</div>
        </SystemPanel>,
      );

      expect(screen.getByText("DIRETRIZ ATIVA")).toBeInTheDocument();
      expect(screen.getByText("Setor de Processamento")).toBeInTheDocument();
      expect(screen.getByText("AÇÃO")).toBeInTheDocument();
      expect(screen.getByTestId("panel-content")).toBeInTheDocument();
    });
  });

  describe("SystemModal", () => {
    it("renders modal dialog when isOpen is true and triggers onClose", () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <SystemModal
          isOpen={true}
          onClose={handleClose}
          title="MODAL DO SISTEMA"
          subtitle="Instrução Crítica"
        >
          <div>Corpo da Modal</div>
        </SystemModal>,
      );

      expect(screen.getByText("MODAL DO SISTEMA")).toBeInTheDocument();
      expect(screen.getByText("Corpo da Modal")).toBeInTheDocument();

      const closeBtn = screen.getByLabelText(/fechar modal/i);
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Closes on ESC key
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(2);

      rerender(
        <SystemModal
          isOpen={false}
          onClose={handleClose}
          title="MODAL FECHADA"
        >
          <div>Invisível</div>
        </SystemModal>,
      );
      expect(screen.queryByText("MODAL FECHADA")).not.toBeInTheDocument();
    });
  });
});
