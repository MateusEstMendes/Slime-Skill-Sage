import { test, expect } from "@playwright/test";

test.describe("Fase 3 — Design System, Navegação por Abas e CRUD de Projetos/Missões", () => {
  test.beforeEach(async ({ page }) => {
    // Set authenticated token in localStorage to bypass token prompt
    await page.addInitScript(() => {
      window.localStorage.setItem("slime_sage_app_secret", "test_app_secret_12345");
      window.localStorage.setItem("slime_sage_api_url", "http://127.0.0.1:3000");
    });
    await page.goto("/");
  });

  test("deve carregar a interface do Sistema com navegação pelas 5 abas", async ({ page }) => {
    // Verify system header is visible
    await expect(page.getByText("SLIME SAGE")).toBeVisible();
    await expect(page.getByText("PAINEL DO SISTEMA")).toBeVisible();

    // Verify 5 tabs in navigation bar
    const homeTab = page.getByTestId("tab-home");
    const projectsTab = page.getByTestId("tab-projects");
    const gsTab = page.getByTestId("tab-gs");
    const skillsTab = page.getByTestId("tab-skills");
    const statusTab = page.getByTestId("tab-status");

    await expect(homeTab).toBeVisible();
    await expect(projectsTab).toBeVisible();
    await expect(gsTab).toBeVisible();
    await expect(skillsTab).toBeVisible();
    await expect(statusTab).toBeVisible();

    // Navigate to Skills
    await skillsTab.click();
    await expect(page.getByText("ÁRVORE DE HABILIDADES // TENSURA")).toBeVisible();

    // Navigate to Status
    await statusTab.click();
    await expect(page.getByText("PAINEL DE ATRIBUTOS // SOLO LEVELING")).toBeVisible();

    // Navigate to Grande Sábio
    await gsTab.click();
    await expect(page.getByText("GRANDE SÁBIO // COMUNICAÇÃO NEURAL")).toBeVisible();
  });

  test("deve criar um projeto e missões dependentes, validando desbloqueio em cascata", async ({ page }) => {
    // 1. Go to Projects tab
    await page.getByTestId("tab-projects").click();
    await expect(page.getByText("DIRETRIZES DE DESENVOLVIMENTO")).toBeVisible();

    // 2. Click "Novo Projeto"
    await page.getByRole("button", { name: /novo projeto/i }).click();
    await expect(page.getByText("Inicializar Novo Projeto")).toBeVisible();

    // 3. Fill Project form
    await page.getByLabel(/título do projeto/i).fill("Projeto Solo Leveling E2E");
    await page.getByLabel(/descrição dos objetivos/i).fill("Evolução sistemática de habilidades");
    await page.getByRole("button", { name: /criar projeto/i }).click();

    // Project should appear in the list
    await expect(page.getByText("Projeto Solo Leveling E2E")).toBeVisible();

    // 4. Open Mission Tree
    await page.getByRole("button", { name: /árvore de missões/i }).click();
    await expect(page.getByText("0% (0/0 missões)")).toBeVisible();

    // 5. Create Root Mission (Missão 1)
    await page.getByRole("button", { name: /nova missão/i }).click();
    await page.getByLabel(/título da missão/i).fill("Missão Raiz - Fundamentos");
    await page.getByRole("button", { name: /adicionar missão/i }).click();

    await expect(page.getByText("Missão Raiz - Fundamentos")).toBeVisible();
    await expect(page.getByTestId("badge-status-disponivel")).toBeVisible();

    // 6. Create Dependent Mission (Missão 2 depends on Missão 1)
    await page.getByRole("button", { name: /nova missão/i }).click();
    await page.getByLabel(/título da missão/i).fill("Missão 2 - Desafio Avançado");
    // Select Missão Raiz as prerequisite
    await page.getByText("Missão Raiz - Fundamentos").click();
    await page.getByRole("button", { name: /adicionar missão/i }).click();

    await expect(page.getByText("Missão 2 - Desafio Avançado")).toBeVisible();
    await expect(page.getByTestId("badge-status-bloqueada")).toBeVisible();

    // 7. Complete Root Mission
    const completeBtn = page.getByRole("button", { name: /concluir missão/i });
    await completeBtn.click();

    // 8. Verify cascade unlock: Missão 2 should now be disponível!
    await expect(page.getByText("Missão Raiz - Fundamentos")).toBeVisible();
    await expect(page.getByText("Concluída")).toBeVisible();
    await expect(page.getByTestId("badge-status-disponivel")).toBeVisible();
  });
});
