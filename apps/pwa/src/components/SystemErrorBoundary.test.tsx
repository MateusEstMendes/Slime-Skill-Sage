import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SystemErrorBoundary } from "./SystemErrorBoundary";
import { logger } from "../services/logger";

const ProblemChild: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Erro de teste catastrófico simulado");
  }
  return <div>Operação Normal do Sistema</div>;
};

describe("SystemErrorBoundary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Silence React's console.error for expected test errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error occurs", () => {
    render(
      <SystemErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </SystemErrorBoundary>
    );

    expect(screen.getByText("Operação Normal do Sistema")).toBeInTheDocument();
  });

  it("catches error and displays themed anomaly UI with error details", () => {
    const errorSpy = vi.spyOn(logger, "error");

    render(
      <SystemErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </SystemErrorBoundary>
    );

    // Verify themed title and alert
    expect(
      screen.getByText("A Voz do Mundo detectou uma anomalia")
    ).toBeInTheDocument();
    expect(
      screen.getByText("[SISTEMA // ANOMALIA DETECTADA]")
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Erro de teste catastrófico simulado/)[0]
    ).toBeInTheDocument();


    // Verify action buttons
    expect(screen.getByText("Tentar Recuperar")).toBeInTheDocument();
    expect(screen.getByText("Recarregar Sistema")).toBeInTheDocument();
    expect(screen.getByText("Copiar Diagnóstico")).toBeInTheDocument();
    expect(screen.getByText("Exportar Logs (JSON)")).toBeInTheDocument();

    // Verify logger call
    expect(errorSpy).toHaveBeenCalledWith(
      "db",
      "A Voz do Mundo detectou uma anomalia na interface",
      expect.objectContaining({
        message: "Erro de teste catastrófico simulado",
      })
    );
  });

  it("allows trying recovery when button is clicked", () => {
    const { rerender } = render(
      <SystemErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </SystemErrorBoundary>
    );

    expect(
      screen.getByText("A Voz do Mundo detectou uma anomalia")
    ).toBeInTheDocument();

    const recoverBtn = screen.getByText("Tentar Recuperar");

    // Change child to no longer throw
    rerender(
      <SystemErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </SystemErrorBoundary>
    );

    fireEvent.click(recoverBtn);

    expect(screen.getByText("Operação Normal do Sistema")).toBeInTheDocument();
  });

  it("triggers log export when Exportar Logs is clicked", async () => {
    const exportSpy = vi
      .spyOn(logger, "exportLogs")
      .mockResolvedValueOnce(JSON.stringify([{ id: "1" }]));

    // Mock URL.createObjectURL and revokeObjectURL
    const createObjectUrlMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectUrlMock = vi.fn();
    window.URL.createObjectURL = createObjectUrlMock;
    window.URL.revokeObjectURL = revokeObjectUrlMock;

    render(
      <SystemErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </SystemErrorBoundary>
    );

    const exportBtn = screen.getByText("Exportar Logs (JSON)");
    fireEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalled();
  });
});
