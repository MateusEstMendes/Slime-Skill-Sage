# Plano Técnico de Handoff — Fase 10 (Slime Sage PWA)

> **Data da Atualização:** 2026-10-21  
> **Status da Fase 10:** `[/] 10.1 Desenvolvimento em Andamento` (Motor Puro e Serviços Concluídos; Integração de UI e Testes de Componentes/E2E em Andamento)  
> **Objetivo da Fase:** Evolução de Habilidades (7 Níveis Canônicos), Roleta Esotérica Animada (Padrão Hardcore) e Festival da Colheita com Altar de Fusão/Sacrifício.

---

## 1. Onde Paramos Exatamente

O desenvolvimento do **Motor de Jogo Puro (`@slime-sage/game`)**, dos **Schemas Compartilhados (`@slime-sage/shared`)**, dos **Repositórios Locais IndexedDB (`evolutionRepository.ts`)** e do **`gameService.ts`** está **100% implementado e coberto por testes verdes**.

Também foram criados os novos componentes visuais isolados:
- [`apps/pwa/src/components/system/ManaThreadsSvg.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/ManaThreadsSvg.tsx): Fios de mana luminosos animados em SVG.
- [`apps/pwa/src/components/system/RouletteModal.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/RouletteModal.tsx): Modal da Roleta Esotérica com anéis rúnicos concêntricos, física desacelerada Framer Motion, Web Audio API e vibração tátil.
- [`apps/pwa/src/components/system/HarvestAltarModal.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/HarvestAltarModal.tsx): Modal do Altar da Colheita com dois círculos de invocação, detecção determinística de sinergias, inquisição da G.S com pílulas de 1 toque e digitação por voz (Speech-to-Text).

**Ponto Exato de Interrupção:**
Íamos aplicar com `Overwrite: true` a atualização da visualização da Árvore de Habilidades ([`apps/pwa/src/components/views/SkillsView.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/views/SkillsView.tsx)) para conectar os 7 tiers de habilidades, o botão "Roleta Esotérica", o Banner do Festival da Colheita e a abertura dos dois novos modais.

---

## 2. O Que Já Foi Implementado e Validado (100% Verde)

### A. Schemas Zod Compartilhados (`packages/shared/src/index.ts`)
- `SkillTierSchema`: Atualizado para os 7 tiers canônicos: `["intrinseca", "comum", "especial", "extra", "unica", "suprema", "primordial"]`.
- `SkillSchema`: Suporte a `domain?: string`, `tags: string[]` e remoção do teto estático de 300 pts no schema Zod.
- `EvolutionAttemptSchema`: Suporte a `cooldown_until: string | null`.
- `HarvestFestivalStateSchema`: Estado do Festival da Colheita (`is_active`, `activated_at`, `xp_multiplier: 2.0`, `completed_goals_count`, `total_goals_count`).
- `SkillSynergyAffinitySchema`: Afinidades determinísticas (`Elemental`, `Resonancia`, `Convergencia`, `Dominio`, `Dissonante`).
- **Testes:** 17/17 testes passando em `@slime-sage/shared`.

### B. Motor Puro de Habilidades e Transições (`packages/game/src/config.ts` & `skills.ts`)
- **Escada Canônica de 7 Níveis:**
  - `intrinseca`: Inicia com 25 pts no despertar da Raça; ascende a `especial` aos 100 pts.
  - `comum`: 0 a 100 pts; ascende a `especial` aos 100 pts.
  - `especial`: 100 a 300 pts; ascende a `extra` aos 300 pts (consumindo `next_evolution_name` e `next_evolution_description` preparados silenciosamente pela G.S).
  - `extra`: 300 a 600 pts; ao bater 600 pts + 1 projeto concluído, libera a Roleta Esotérica.
  - `unica`: 600 a 1.200 pts; ao bater 1.200 pts + 1 projeto concluído, libera a Roleta Esotérica.
  - `suprema`: 1.200 a 2.500 pts; ao bater 2.500 pts + 1 projeto concluído, libera a Roleta Esotérica.
  - `primordial`: 2.500+ pts; Grau Divino / Ápice Cósmico Absoluto.
- **Bônus de Afinidade Racial:** Função pura `calculateRacialAffinityBonus(race, missionArea)` concedendo **+2 pontos fixos de maestria extra** quando a missão coincide com a área primária da Raça (`Slime -> INT`, `Kijin -> FOR`, `Draconiano -> DIS`, `Majin -> CRI`, `Homem-Fera -> SOC`).
- **Diminishing Returns:** `calculateMasteryGainWithDecay` com desaceleração suave após 50% do teto do tier e piso garantido de 1 pt.
- **Transições e Reversões:** Suporte completo a ascensão automática de tiers baixos e demotes corretos ao desfazer missões.

### C. Roleta Esotérica Hardcore (`packages/game/src/roulette.ts`)
- **Regras Hardcore 100% Puras (Clock e Rng injetáveis):**
  - Chance Base: **20%** (`0.20`).
  - Piedade (*Pity*): **+10% cumulativo por falha prévia** (`0.30`, `0.40`, ..., até o teto de `0.80`).
  - Teto Máximo de Chance: **80%** (`0.80`).
  - Cooldown de Repouso da Alma: **48 horas** em caso de falha (`clock.now() + 48h`).
  - Salvaguarda: **zero perda de maestria** em caso de falha.
  - Sucesso: Ascende para o próximo tier (`extra -> unica -> suprema -> primordial`), zera contador de falhas e limpa cooldown.
- **Testes:** 7/7 testes unitários e de propriedade (`fast-check`) em `packages/game/src/roulette.test.ts` passando com 100% de sucesso.

### D. Motor Determinístico de Sinergia e Fusão Sem IA (`packages/game/src/skillDomains.ts`)
- **Matriz de Compatibilidade Estática (9 Domínios):** `Arcana`, `Combate`, `Soberania`, `Percepção`, `Criação`, `Elemental`, `Sobrevivência`, `Estratégia`, `Harmonia`.
- `inferSkillDomain`: Inferência determinística por área e palavras-chave.
- `checkSkillSynergy`: Cálculo de pontuação de ressonância (0 a 100%), afinidade, interseção de tags, bloqueio de fusão consigo mesma e cálculo do `targetTier`.
- `generateDeterministicFusion`: Gerador de questionário em lote com pílulas rápidas e Desafio Autodeclarado ancorado no Modo Foco.
- **Testes:** 5/5 testes unitários em `packages/game/src/skillDomains.test.ts` passando com 100% de sucesso.
- **Cobertura Geral do `@slime-sage/game`:** 103/103 testes passando, com 96.79% de statements, 97.46% de funcs e 96.79% de lines (acima da meta de 90%).

### E. Repositório e Camada de Serviços do PWA (`apps/pwa`)
- `evolutionRepository.ts`: Repositório IndexedDB para `evolution_attempt` com auditoria e contagem de falhas (testado em `evolutionRepository.test.ts`).
- `gameService.ts`:
  - Aplicação do bônus racial fixo (+2 pts de maestria).
  - Aplicação do multiplicador 2x XP do Festival da Colheita.
  - Consumo de nomes e lore preparados pela G.S na ascensão a `extra`.
  - Métodos da Roleta: `getRouletteEligibility`, `spinRoulette` (com suporte a forçar resultado para testes).
  - Métodos do Festival da Colheita: `getHarvestFestivalState`, `activateHarvestFestival`, `deactivateHarvestFestival`, `checkHarvestEligibility`.
  - Método de Fusão no Altar: `fuseSkills`.
  - **Testes:** 12/12 testes passando em `gameService.test.ts` e `gameServicePhase10.test.ts`.

---

## 3. O Que Tem Que Continuar Para Terminar a Fase 10

Abaixo está o roteiro sequencial exato para concluir a fase:

### Passo 1 — Atualizar `SkillsView.tsx` (UI da Árvore de Habilidades)
- Arquivo: [`apps/pwa/src/components/views/SkillsView.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/views/SkillsView.tsx).
- Ações:
  1. Aplicar o novo visual dos **7 Graus Canônicos** nos cartões com cores, auras e runas específicas em Elder Futhark (`TIER_METADATA`).
  2. Adicionar o **Banner Cerimonial do Festival da Colheita** no topo, indicando se 2x XP está ativo e fornecendo o botão "Abrir Altar".
  3. Adicionar o botão **"Roleta Esotérica"** nos cartões de habilidades de grau Extra, Única e Suprema.
  4. Integrar e renderizar os modais [`RouletteModal.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/RouletteModal.tsx) e [`HarvestAltarModal.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/HarvestAltarModal.tsx).
  5. Atualizar a caixa informativa inferior com os 7 Graus Canônicos do Sistema.

### Passo 2 — Atualizar o `DevPanel.tsx` (Controles de Teste da Fase 10)
- Arquivo: [`apps/pwa/src/components/DevPanel.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/DevPanel.tsx).
- Ações:
  1. Adicionar seção ou aba **"Evolução & Colheita (Fase 10)"**:
     - **Controles de Roleta:** Botões rápidos "Forçar Sucesso", "Forçar Falha" e "Zerar Cooldown de 48h de Todas as Habilidades".
     - **Atalho de Teste de Roleta:** Botão "Criar Skill Extra Elegível (600/600 + 1 Projeto Concluído)".
     - **Controles da Colheita:** Toggle "Ativar / Desativar Festival da Colheita (2x XP)".
     - **Atalho de Teste do Altar:** Botão "Criar Par de Habilidades Sinérgicas (Arcana + Elemental)" para testar a fusão imediatamente no celular/desktop.

### Passo 3 — Implementar Testes Automáticos de Componentes PWA (Etapa 10.2)
- Criar arquivos de teste:
  1. `apps/pwa/src/components/system/RouletteModal.test.tsx`:
     - Renderização do modal da roleta com círculos concêntricos e runas.
     - Exibição precisa de chance base (20%) + pity acumulado.
     - Simulação de giro e transição para a tela de consagração de nome.
  2. `apps/pwa/src/components/system/HarvestAltarModal.test.tsx`:
     - Renderização dos dois slots de invocação (Alfa e Beta) e fios de mana `ManaThreadsSvg`.
     - Seleção de habilidades e exibição da sinergia determinística calculada.
     - Seleção de pílulas de 1 toque e confirmação da fusão.
  3. `apps/pwa/src/components/views/SkillsViewPhase10.test.tsx`:
     - Renderização dos cartões com os novos 7 tiers.
     - Exibição do banner do Festival da Colheita.
     - Abertura dos modais ao tocar nos botões de Roleta e Altar.

### Passo 4 — Implementar Teste E2E Playwright
- Arquivo: `e2e/phase10-roulette-and-harvest.spec.ts`.
- Fluxo de ponta a ponta:
  1. Criação de perfil e habilidade Extra com 600 pts.
  2. Abertura da Roleta Esotérica e execução do giro.
  3. Ativação do Festival da Colheita e verificação do multiplicador 2x de XP.
  4. Abertura do Altar de Fusão, seleção de duas habilidades, resposta rápida via pílulas e consagração da nova habilidade superior.

### Passo 5 — Execução e Validação do Pipeline Completo
- Executar os comandos:
  ```bash
  pnpm lint
  pnpm typecheck
  pnpm test
  ```
- Garantir que **100% dos testes passem com 0 erros de linter e 0 erros de TypeScript**.

### Passo 6 — Pausa Obrigatória e Roteiro para o Usuário (Etapa 10.3)
- Marcar `[x] 10.1 Desenvolvimento` e `[x] 10.2 Testes Automáticos` em `roadmap.md`.
- **PARAR IMEDIATAMENTE** e fornecer o roteiro passo a passo para o usuário testar no navegador / PWA mobile:
  - Teste da Roleta Esotérica (giro, pity, cooldown de 48h e consagração de nome).
  - Teste do Festival da Colheita (2x XP nas missões).
  - Teste do Altar de Sacrifício e Fusão (seleção de slots, fios de mana, pílulas de 1 toque e desafio autodeclarado).

---

## 4. Tabela de Arquivos Tocados e Pendentes

| Arquivo | Status | O que foi / será feito |
| :--- | :--- | :--- |
| `packages/shared/src/index.ts` | **Concluído** | 7 Tiers de Habilidade, HarvestFestivalStateSchema, SkillSynergyAffinitySchema |
| `packages/shared/src/index.test.ts` | **Concluído** | Testes de validação dos novos schemas (17/17 passando) |
| `packages/game/src/config.ts` | **Concluído** | Constantes de tetos de maestria dos 7 tiers, bônus racial e roleta |
| `packages/game/src/skills.ts` | **Concluído** | Escada canônica dos 7 tiers, bônus racial (+2) e progressão |
| `packages/game/src/roulette.ts` | **Concluído** | Motor puro da Roleta Esotérica Hardcore (20% base, +10% pity, 48h cooldown) |
| `packages/game/src/roulette.test.ts` | **Concluído** | Testes Vitest + fast-check da roleta (7/7 passando) |
| `packages/game/src/skillDomains.ts` | **Concluído** | Matriz de compatibilidade estática, sinergias determinísticas e fusão |
| `packages/game/src/skillDomains.test.ts` | **Concluído** | Testes da matriz de domínios e bônus de afinidade racial (5/5 passando) |
| `packages/game/src/ledger.ts` | **Concluído** | Novos GameEvents: HARVEST_FESTIVAL_ACTIVATED, SKILL_EVOLVED_ROULETTE, SKILL_FUSED |
| `apps/pwa/src/services/evolutionRepository.ts` | **Concluído** | Repositório IndexedDB para histórico e cooldowns de evolução |
| `apps/pwa/src/services/evolutionRepository.test.ts` | **Concluído** | Testes de persistência de tentativas e pity (3/3 passando) |
| `apps/pwa/src/services/gameService.ts` | **Concluído** | Métodos da Roleta, Festival da Colheita, Fusão no Altar e 2x XP |
| `apps/pwa/src/services/gameServicePhase10.test.ts` | **Concluído** | Testes de integração do GameService Phase 10 (4/4 passando) |
| `apps/pwa/src/components/system/ManaThreadsSvg.tsx` | **Concluído** | Componente SVG para fios de mana luminosos animados |
| `apps/pwa/src/components/system/RouletteModal.tsx` | **Concluído** | Modal da Roleta Esotérica SVG concêntrica e Framer Motion |
| `apps/pwa/src/components/system/HarvestAltarModal.tsx` | **Concluído** | Modal do Altar de Sacrifício e Fusão com pílulas rápidas e voz |
| `apps/pwa/src/components/views/SkillsView.tsx` | **Pendente** | Integração dos 7 tiers, botões da Roleta, banner 2x e modais |
| `apps/pwa/src/components/DevPanel.tsx` | **Pendente** | Controles Dev da Fase 10 (RNG, zerar cooldown, ativar festival, seed skills) |
| `apps/pwa/src/components/system/*.test.tsx` | **Pendente** | Testes de componentes PWA da Roleta e Altar |
| `e2e/phase10-roulette-and-harvest.spec.ts` | **Pendente** | Teste E2E Playwright da Fase 10 |
