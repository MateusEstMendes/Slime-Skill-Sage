import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { TokenAuthScreen } from "./TokenAuthScreen";
import * as apiClient from "../services/apiClient";
import { authStorage } from "../services/authStorage";

describe("TokenAuthScreen Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders connection form with inputs and submit button", () => {
    render(<TokenAuthScreen onSuccess={() => {}} />);
    expect(screen.getByText("Conexão com o Sistema")).toBeInTheDocument();
    expect(screen.getByLabelText(/URL da API/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Chave Secreta do Sistema/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Conectar ao Sistema/i }),
    ).toBeInTheDocument();
  });

  it("shows error when token is rejected (401 / invalid)", async () => {
    vi.spyOn(apiClient, "verifyApiConnection").mockResolvedValue({
      success: false,
      error: "Acesso Negado: Token Secreto incorreto ou inválido.",
    });

    render(<TokenAuthScreen onSuccess={() => {}} />);

    const tokenInput = screen.getByLabelText(/Chave Secreta do Sistema/i);
    const submitBtn = screen.getByRole("button", {
      name: /Conectar ao Sistema/i,
    });

    fireEvent.change(tokenInput, { target: { value: "invalid-token" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Acesso Negado: Token Secreto incorreto ou inválido.",
      );
    });
    expect(authStorage.getToken()).toBeNull();
  });

  it("persists token and calls onSuccess when verification succeeds (200 OK)", async () => {
    const onSuccessMock = vi.fn();
    vi.spyOn(apiClient, "verifyApiConnection").mockResolvedValue({
      success: true,
      data: {
        status: "ok",
        app: "slime-sage",
        timestamp: "2026-10-13T00:00:00Z",
      },
    });

    render(<TokenAuthScreen onSuccess={onSuccessMock} />);

    const tokenInput = screen.getByLabelText(/Chave Secreta do Sistema/i);
    const submitBtn = screen.getByRole("button", {
      name: /Conectar ao Sistema/i,
    });

    fireEvent.change(tokenInput, { target: { value: "valid-secret-key" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith(
        "valid-secret-key",
        "http://localhost:3000",
      );
    });
    expect(authStorage.getToken()).toBe("valid-secret-key");
  });
});
