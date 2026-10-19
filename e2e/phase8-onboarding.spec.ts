import { test, expect } from "@playwright/test";

test.describe("Fase 8 — Onboarding: 5 Perguntas da G.S, Revelação de Raça e Rank de Ameaça", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("slime_sage_app_secret", "test_app_secret_12345");
      window.localStorage.setItem("slime_sage_api_url", "http://127.0.0.1:3000");
    });
    await page.goto("/");
  });

  test("deve disparar Re-despertar pelo Painel Dev, responder as 5 diretrizes, revelar Raça/Rank e entrar no Chat da G.S", async ({
    page,
  }) => {
    // 1. Abrir Painel Dev pelo cabeçalho do Sistema
    await page.getByRole("button", { name: /abrir painel dev/i }).click();
    await expect(page.getByRole("dialog", { name: "Painel do Desenvolvedor" })).toBeVisible();

    // 2. Clicar em "Resetar Onboarding (Re-despertar)"
    await page.getByRole("button", { name: /Resetar Onboarding/i }).first().click();

    // 3. Validar Tela I (Bloqueio em tela cheia do Onboarding)
    const onboardingScreen = page.getByTestId("onboarding-fullscreen");
    await expect(onboardingScreen).toBeVisible();
    await expect(page.getByText(/Tela I — O Despertar da Consciência/i)).toBeVisible();

    // Preencher nome do Caçador
    const nameInput = page.getByLabel(/Identificação Espiritual/i);
    await nameInput.fill("Benimaru Shin");
    await page.getByRole("button", { name: /Iniciar Questionário Solene/i }).click();

    // 4. Responder as 5 diretrizes solenes (Kijin + Calamity)
    await expect(page.getByText(/Diretriz 1 de 5/i)).toBeVisible();
    await page.getByTestId("option-q1_kijin").click();
    await page.getByRole("button", { name: /Próxima Diretriz/i }).click();

    await expect(page.getByText(/Diretriz 2 de 5/i)).toBeVisible();
    await page.getByTestId("option-q2_kijin").click();
    await page.getByRole("button", { name: /Próxima Diretriz/i }).click();

    await expect(page.getByText(/Diretriz 3 de 5/i)).toBeVisible();
    await page.getByTestId("option-q3_kijin").click();
    await page.getByRole("button", { name: /Próxima Diretriz/i }).click();

    await expect(page.getByText(/Diretriz 4 de 5/i)).toBeVisible();
    await page.getByTestId("option-q4_kijin").click();
    await page.getByRole("button", { name: /Próxima Diretriz/i }).click();

    await expect(page.getByText(/Diretriz 5 de 5/i)).toBeVisible();
    await page.getByTestId("option-q5_calamity").click();
    await page.getByRole("button", { name: /Revelar Essência/i }).click();

    // 5. Validar Tela III — Revelação Cerimonial
    await expect(page.getByText(/Tela III — Revelação Cerimonial/i)).toBeVisible();
    await expect(page.getByTestId("revealed-race")).toHaveTextContent("Kijin");
    await expect(page.getByTestId("revealed-rank")).toHaveTextContent("Calamity");

    // 6. Prosseguir para Tela IV — Consagração
    await page.getByRole("button", { name: /Prosseguir para Consagração/i }).click();
    await expect(page.getByText(/Tela IV — Consagração & Primeira Conquista/i)).toBeVisible();

    // 7. Confirmar Consagração e validar transição automática para o Chat da G.S
    await page.getByRole("button", { name: /Consagrar e Iniciar Primeira Conquista/i }).click();

    await expect(onboardingScreen).not.toBeVisible();
    await expect(page.getByText("GRANDE SÁBIO // COMUNICAÇÃO NEURAL")).toBeVisible();
    await expect(
      page.getByText(/Qual é a primeira conquista que você deseja alcançar\?/i).first(),
    ).toBeVisible();
  });
});
