import { test, expect } from "@playwright/test";

test.describe("Fase 10 — Roleta Esotérica Hardcore e Festival da Colheita com Altar de Fusão", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("slime_sage_app_secret", "test_app_secret_12345");
      window.localStorage.setItem("slime_sage_api_url", "http://127.0.0.1:3000");
    });
    await page.goto("/");
  });

  test("fluxo completo: roleta esotérica forçada para sucesso e fusão no altar de sacrifício", async ({
    page,
  }) => {
    // 1. Abrir Painel Dev para preparar ambiente
    await page.getByRole("button", { name: /abrir painel dev/i }).click();
    await expect(page.getByRole("dialog", { name: "Painel do Desenvolvedor" })).toBeVisible();

    // 2. Navegar para a aba Fase 10 (Evolução & Colheita)
    await page.getByRole("button", { name: /Evolução & Colheita/i }).click();

    // 3. Configurar Roleta para "Forçar Sucesso"
    await page.getByRole("button", { name: /Forçar Sucesso/i }).click();
    await expect(page.getByText(/Roleta configurada para: FORÇAR SUCESSO/i)).toBeVisible();

    // 4. Criar Skill Extra elegível com 600 pts e projeto concluído
    await page.getByRole("button", { name: /Criar Skill Extra Elegível/i }).click();
    await expect(page.getByText(/Habilidade Extra elegível criada/i)).toBeVisible();

    // 5. Fechar Painel Dev
    await page.getByRole("button", { name: /Fechar Painel Dev/i }).click();
    await expect(page.getByRole("dialog", { name: "Painel do Desenvolvedor" })).not.toBeVisible();

    // 6. Navegar para a aba Habilidades
    await page.getByTestId("tab-skills").click();
    await expect(page.getByText("ÁRVORE DE HABILIDADES // TENSURA")).toBeVisible();
    await expect(page.getByText("Lâmina do Vento Espiritual [Dev]")).toBeVisible();

    // 7. Abrir Roleta Esotérica na habilidade Extra
    await page.getByRole("button", { name: /Roleta Esotérica/i }).first().click();
    const rouletteModal = page.getByTestId("roulette-modal");
    await expect(rouletteModal).toBeVisible();
    await expect(page.getByText(/ROLETA ESOTÉRICA \/\/ Lâmina do Vento Espiritual/i)).toBeVisible();

    // 8. Girar a Roleta (forçada para sucesso)
    await page.getByRole("button", { name: /Invocar Transmutação/i }).click();
    await expect(page.getByText(/Transmutação Sagrada Concluída!/i)).toBeVisible({ timeout: 12000 });
    await expect(page.getByText(/Nome Consagrado:/i)).toBeVisible();

    // 9. Confirmar despertar e consagração
    await page.getByRole("button", { name: /Confirmar e Consagrar Despertar/i }).click();
    await expect(rouletteModal).not.toBeVisible();
    await expect(page.getByText("Habilidade Única")).toBeVisible();

    // 10. Reabrir Painel Dev para ativar Festival da Colheita e criar par sinérgico
    await page.getByRole("button", { name: /abrir painel dev/i }).click();
    await page.getByRole("button", { name: /Evolução & Colheita/i }).click();
    await page.getByRole("button", { name: /Ativar Festival \(2x XP\)/i }).click();
    await expect(page.getByText(/Festival da Colheita ativado/i)).toBeVisible();

    await page.getByRole("button", { name: /Criar Par de Habilidades Sinérgicas/i }).click();
    await expect(page.getByText(/Par sinérgico criado/i)).toBeVisible();

    await page.getByRole("button", { name: /Fechar Painel Dev/i }).click();

    // 11. Validar Banner do Festival da Colheita ativo (2x XP)
    await expect(page.getByTestId("harvest-festival-banner")).toBeVisible();
    await expect(page.getByText(/✦ FESTIVAL DA COLHEITA ATIVO \(2.0x XP\) ✦/i)).toBeVisible();

    // 12. Abrir Altar de Fusão da Colheita
    await page.getByTestId("open-harvest-altar-btn").click();
    const altarModal = page.getByTestId("harvest-altar-modal");
    await expect(altarModal).toBeVisible();

    // 13. Selecionar Esfera Arcana e Chama de Fogo
    await page.getByText("Esfera Arcana [Dev]").click();
    await page.getByText("Chama de Fogo [Dev]").click();
    await expect(page.getByText(/Sinergia Arcana:/i)).toBeVisible();

    // 14. Avançar para a Inquisição da Grande Sábio
    await page.getByRole("button", { name: /Prosseguir para Inquisição da G.S/i }).click();
    await expect(page.getByText(/Interrogação Canônica da Grande Sábio/i)).toBeVisible();

    // 15. Avançar para o Desafio de Provação
    await page.getByRole("button", { name: /Avançar para o Desafio de Provação/i }).click();
    await expect(page.getByText(/Desafio Autodeclarado de Transmutação/i)).toBeVisible();
    await expect(page.getByText(/Aviso Sagrado de Sacrifício/i)).toBeVisible();

    // 16. Consagrar Fusão no Altar
    await page.getByRole("button", { name: /Consagrar Fusão no Altar/i }).click();
    await expect(altarModal).not.toBeVisible();

    // 17. Confirmar na Árvore de Habilidades a presença da nova habilidade transmutada
    await expect(page.getByText("Habilidade Especial")).toBeVisible();
  });
});
