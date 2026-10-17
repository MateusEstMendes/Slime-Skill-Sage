import { test, expect } from "@playwright/test";

test.describe("Fase 5 — Voz do Mundo, Telas de Status e Habilidades", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("slime_sage_app_secret", "test_app_secret_12345");
      window.localStorage.setItem("slime_sage_api_url", "http://127.0.0.1:3000");
    });
    await page.goto("/");
  });

  test("deve adquirir habilidade com anúncio da Voz do Mundo e refletir nas abas", async ({ page }) => {
    // 1. Navigate to Skills tab
    await page.getByTestId("tab-skills").click();
    await expect(page.getByText("ÁRVORE DE HABILIDADES // TENSURA")).toBeVisible();

    // 2. Open "Adquirir Habilidade" modal
    await page.getByRole("button", { name: /Adquirir Habilidade/i }).click();
    await expect(page.getByText("Voz do Mundo: Inscrição de Habilidade Comum")).toBeVisible();

    // 3. Fill and submit new skill
    await page.getByLabel(/Nome da Habilidade/i).fill("Análise de Domínio");
    await page.getByRole("button", { name: /Despertar Habilidade/i }).click();

    // 4. Verify World Voice modal announcement appears
    const worldVoiceModal = page.getByRole("dialog", { name: "Voz do Mundo" });
    await expect(worldVoiceModal).toBeVisible();
    await expect(page.getByText("HABILIDADE ADQUIRIDA: ANÁLISE DE DOMÍNIO")).toBeVisible();
    await expect(worldVoiceModal.getByText(/Condições atendidas/i).first()).toBeVisible();

    // 5. Confirm and dismiss World Voice modal
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(worldVoiceModal).not.toBeVisible();

    // 6. Skill card is visible in Skills tab with 0/100 mastery
    await expect(page.getByText("Análise de Domínio")).toBeVisible();
    await expect(page.getByText("0 / 100 pts (0%)")).toBeVisible();
  });

  test("deve concluir missão, disparar modal da Voz do Mundo com Level Up e atualizar abas de Status e Habilidades", async ({ page }) => {
    // 1. Create a Project in Projects tab
    await page.getByTestId("tab-projects").click();
    await page.getByRole("button", { name: /novo projeto/i }).click();
    await page.getByLabel(/título do projeto/i).fill("Projeto Despertar");
    await page.getByRole("button", { name: /criar projeto/i }).click();
    await expect(page.getByText("Projeto Despertar")).toBeVisible();

    // 2. Open mission tree and create a mission with 120 XP (causes Level Up from Lv1 to Lv2)
    await page.getByRole("button", { name: /árvore de missões/i }).click();
    await page.getByRole("button", { name: /nova missão/i }).click();
    await page.getByLabel(/título da missão/i).fill("Conquista de Calabouço");
    await page.getByLabel(/recompensa de xp/i).fill("120");
    await page.getByRole("button", { name: /adicionar missão/i }).click();
    await expect(page.getByText("Conquista de Calabouço")).toBeVisible();

    // 3. Complete mission
    await page.getByRole("button", { name: /concluir missão/i }).click();

    // 4. Verify World Voice modal triggers for LEVEL_UP
    const worldVoiceModal = page.getByRole("dialog", { name: "Voz do Mundo" });
    await expect(worldVoiceModal).toBeVisible();
    await expect(page.getByText("NÍVEL 2 ALCANÇADO")).toBeVisible();
    await expect(worldVoiceModal.getByText(/Nível aumentado de 1 para 2/i)).toBeVisible();

    // 5. Confirm modal
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(worldVoiceModal).not.toBeVisible();

    // 6. Navigate to Status tab and verify XP, level, Radar Chart, and Ledger extract
    await page.getByTestId("tab-status").click();
    await expect(page.getByText("PAINEL DE ATRIBUTOS // SOLO LEVELING")).toBeVisible();
    await expect(page.getByText("Diagrama de Atributos")).toBeVisible();

    // Radar chart SVG visible
    await expect(page.getByTestId("radar-chart-svg")).toBeVisible();
    await expect(page.getByTestId("radar-polygon")).toBeVisible();

    // Level and XP updated
    await expect(page.getByText("Nível", { exact: true }).locator("..").getByText("2", { exact: true })).toBeVisible();

    // Ledger extract shows the completed mission transaction
    await expect(page.getByText(/Conclusão da missão: Conquista de Calabouço/i)).toBeVisible();
    await expect(page.getByText("Ledger Imutável 100% Íntegro")).toBeVisible();
  });
});
