# Plano de Implementação Completo — Slime Sage (v1 — PWA)

> **Projeto:** **Slime Sage** (`slime-sage`) — Gestor de projetos gamificado com IA em formato **Progressive Web App (PWA)** instalável (React + Vite + Tailwind CSS + Web APIs + Hono + Gemini).
> **Regra de Ouro de Execução:** O desenvolvimento é dividido em **15 fases granulares (Fase 0 a Fase 14)**. Cada fase possui obrigatoriamente **4 partes sequenciais**:
>
> 1. **Desenvolvimento**
> 2. **Testes Automáticos**
> 3. **Testes do Usuário**
> 4. **Debug e Fechamento (`handoff.md`, `feedback.md`, `roadmap.md`)**
>
> **Trava de Fase:** Uma fase **só pode ser finalizada** quando os **Testes Automáticos** passarem 100%, os **Testes do Usuário** forem validados pelo usuário no navegador/dispositivo mobile adicionado à tela inicial, o ciclo de **Debug** resolver todos os apontamentos registrados em `feedback.md`, e a IA atualizar `handoff.md`, `feedback.md` e `roadmap.md`.

## 1. Consolidação das Decisões Finais (v1 — PWA)

| Item                            | Definição Confirmada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome do App / Monorepo**      | **Slime Sage** (`slime-sage`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Plataforma e Stack**          | **Progressive Web App (PWA)** instalável e responsivo via **Vite + React 19** + React Router + Tailwind CSS + Framer Motion + Lucide React + `vite-plugin-pwa` (Service Worker Workbox com suporte offline completo). Banco local relacional e auditável via IndexedDB/SQLite-WASM + Drizzle ORM. Backend **Hono na Vercel** (`/health`, `/chat`, `/generate`, `/backup`) + `@ai-sdk/google` (Gemini Flash e Pro)                                                                                                                          |
| **Voz e Áudio (Sem TTS)**       | **TTS do navegador descartado**. Falas estáticas e solenes usam **MP3 pré-gravados em alta fidelidade** (`/audio/voice/`). Falas dinâmicas com dados customizados (nomes de habilidades, nível do caçador, congratulações da G.S) são sintetizadas via **API do Gemini (Gemini 2.0 Flash Audio — voz `Kore`)** no backend Hono com cache local no IndexedDB. Conclusão de missões individuais não toca áudio falado (apenas efeito sonoro sintético suave); **conclusão de projetos completos toca áudio solene**. Se o XP acumulado atingir o nível offline, o caçador entra em **'Elegível para Ascensão'** e a consagração em voz com a G.S ocorre assim que reconectar à internet. Atividades cotidianas e foco operam 100% offline. |
| **Agenda Independente & Hábitos** | **Dois sistemas independentes**: a **Aba Projetos** gerencia árvores de metas de longo prazo (DAG) sem hora marcada; a **Agenda** gerencia rotinas diárias com horário fixo e prazo limite (*due date*). Conclusões de tarefas na agenda preenchem uma **Barra de Maestria de Hábito (0 a 100%)**. Ao atingir 100%, consolida-se em **Habilidade Passiva permanente**. O Sistema realiza um **check-in semanal**: se o usuário responder que não praticou, a barra recua para 75% e a habilidade entra no estado **'Enferrujada'** (bônus pausado até recuperar 100%). Snapshot "Hoje" na Home + Visão dedicada de Agenda. Virada às **04:00**. Streak avança com 100% das tarefas do dia cumpridas; dias sem tarefas agendadas **congelam o streak sem quebra**. |
| **Curva de Nível & Títulos G.S** | **Curva de nível 3x mais íngreme**: `round(300 * n^1.5)` (Nível 1→2: 300 XP; Nível 2→3: 849 XP; Nível 3→4: 1.559 XP). O ranque genérico F a S é substituído por **10 Grandes Patamares Temáticos por Atributo (0 a 50.000+ de maestria) com Sub-Graus Rúnicos a cada 1.000 pts (Grau I a V)** que se transformam lentamente indicando o rumo para a próxima ascensão (ex: *Aprendiz da Lógica [Grau III] · Rumo a Analista Metódico*), culminando aos 50.000+ na **Perfeição Inatingível** (*A Onisciência Absoluta*, *Muralha Cósmica Inquebrável*, etc.). |
| **Festival da Colheita**        | Ativado manualmente pelo usuário quando **100% das metas da semana ou mês forem batidas na Agenda**, deflagrando um ritual épico de celebração com áudio estático de abertura (*"O Festival da Colheita foi iniciado!"*), bônus de XP dobrado (2x) e oportunidades de ascensão de habilidades com decretos dinâmicos da G.S via API. |
| **Escopo v1**                   | **v1:** Onboarding (áudios oficiais da G.S + revelação via API), Chat G.S Coordenador (com botão "Ouvir G.S" e pop-up em voz para pendências), Projetos (DAG) + Sistema de Agenda Independente com Hábitos/Passivas e Check-in Semanal, Habilidades com Roleta Esotérica, Festival da Colheita ao bater 100% da Agenda, Títulos Temáticos por Atributo gerados pela G.S, Modo Foco com áudios offline, Notificações 48h e Backup JSON/Cloud. |
| **Arquivos de Controle**        | `roadmap.md` (progresso geral das fases e sub-etapas), `handoff.md` (mudanças da fase, arquivos tocados, estado dos testes automáticos e contexto para a próxima fase) e `feedback.md` (histórico de feedbacks dos testes do usuário e correções de debug). |

## 2. Estrutura dos 3 Arquivos de Controle na Raiz do Projeto

No início da Fase 0, a IA deve criar e manter estes três arquivos na raiz do monorepo (`slime-sage/`):

### 2.1. Template Inicial do `roadmap.md`

```markdown
# Roadmap de Implementação — Slime Sage (v1 — PWA)

Legenda: `[ ]` Pendente | `[/]` Em andamento | `[x]` Concluído e Aprovado pelo Usuário

## Fase 0 — Fundação do Monorepo, API Base (`/health`) e Token Secreto

- [ ] 0.1 Desenvolvimento
- [ ] 0.2 Testes Automáticos
- [ ] 0.3 Testes do Usuário
- [ ] 0.4 Debug e Atualização de Handoff/Feedback

## Fase 1 — Logger Local, Error Boundary, Painel Dev e Spike de Notificações + TTS

- [ ] 1.1 Desenvolvimento
- [ ] 1.2 Testes Automáticos
- [ ] 1.3 Testes do Usuário
- [ ] 1.4 Debug e Atualização de Handoff/Feedback

## Fase 2 — Banco de Dados Local, Migrations e Repositórios de Projetos/Missões

- [ ] 2.1 Desenvolvimento
- [ ] 2.2 Testes Automáticos
- [ ] 2.3 Testes do Usuário
- [ ] 2.4 Debug e Atualização de Handoff/Feedback

## Fase 3 — Design System "Sistema", Navegação por Abas e CRUD Manual de Projetos/Missões

- [ ] 3.1 Desenvolvimento
- [ ] 3.2 Testes Automáticos
- [ ] 3.3 Testes do Usuário
- [ ] 3.4 Debug e Atualização de Handoff/Feedback

## Fase 4 — Motor de Jogo Puro (Parte 1): Clock/RNG, XP, Nível, Maestria, Atributos e Ledger

- [ ] 4.1 Desenvolvimento
- [ ] 4.2 Testes Automáticos
- [ ] 4.3 Testes do Usuário
- [ ] 4.4 Debug e Atualização de Handoff/Feedback

## Fase 5 — Voz do Mundo (Modal + Haptics + Som + Web TTS) e Telas de Status e Habilidades

- [ ] 5.1 Desenvolvimento
- [ ] 5.2 Testes Automáticos
- [ ] 5.3 Testes do Usuário
- [ ] 5.4 Debug e Atualização de Handoff/Feedback

## Fase 6 — Backend `/chat` (Streaming + Tools Schema) e Cliente de Chat com Cartões de Prévia

- [ ] 6.1 Desenvolvimento
- [ ] 6.2 Testes Automáticos
- [ ] 6.3 Testes do Usuário
- [ ] 6.4 Debug e Atualização de Handoff/Feedback

## Fase 7 — Modo Coordenador da G.S, Validação Anti-Duplicatas e Snapshot de Memória

- [ ] 7.1 Desenvolvimento
- [ ] 7.2 Testes Automáticos
- [ ] 7.3 Testes do Usuário
- [ ] 7.4 Debug e Atualização de Handoff/Feedback

## Fase 8 — Onboarding: 5 Perguntas Narradas por Web TTS, Revelação de Classe e 1ª Conquista

- [ ] 8.1 Desenvolvimento
- [ ] 8.2 Testes Automáticos
- [ ] 8.3 Testes do Usuário
- [ ] 8.4 Debug e Atualização de Handoff/Feedback

## Fase 9 — Motor de Jogo (Parte 2): Classes por Área e Evolução com Desafio Autodeclarado

- [ ] 9.1 Desenvolvimento
- [ ] 9.2 Testes Automáticos
- [ ] 9.3 Testes do Usuário
- [ ] 9.4 Debug e Atualização de Handoff/Feedback

## Fase 10 — Evolução de Habilidades (7 Níveis Canônicos), Roleta Animada (SVG + Framer Motion) e Festival da Colheita com Altar de Fusão/Sacrifício

- [ ] 10.1 Desenvolvimento
- [ ] 10.2 Testes Automáticos
- [ ] 10.3 Testes do Usuário
- [ ] 10.4 Debug e Atualização de Handoff/Feedback

## Fase 11 — Motor de Missões Diárias, Virada às 04:00, Streak Sem Escudo e UI na Home

- [ ] 11.1 Desenvolvimento
- [ ] 11.2 Testes Automáticos
- [ ] 11.3 Testes do Usuário
- [ ] 11.4 Debug e Atualização de Handoff/Feedback

## Fase 12 — Rota `/generate`, `phrase_bank` Offline, Agendador 48h (`rescheduleAll`) e Service Worker Sync

- [ ] 12.1 Desenvolvimento
- [ ] 12.2 Testes Automáticos
- [ ] 12.3 Testes do Usuário
- [ ] 12.4 Debug e Atualização de Handoff/Feedback

## Fase 13 — Modo Foco (Aceleração de Pensamento): Timer, Notificação e Quebra (>30s Fora)

- [ ] 13.1 Desenvolvimento
- [ ] 13.2 Testes Automáticos
- [ ] 13.3 Testes do Usuário
- [ ] 13.4 Debug e Atualização de Handoff/Feedback

## Fase 14 — Backup Automático (`/backup` Vercel Blob), Export/Import JSON Manual e Release v1 (PWA Instalável)

- [ ] 14.1 Desenvolvimento
- [ ] 14.2 Testes Automáticos
- [ ] 14.3 Testes do Usuário
- [ ] 14.4 Debug e Atualização de Handoff/Feedback
```

### 2.2. Template do `handoff.md`

```markdown
# Handoff Técnico — Slime Sage (PWA)

## Status Atual

- **Última Fase Concluída:** Fase X — [Nome da Fase]
- **Próxima Fase:** Fase Y — [Nome da Próxima Fase]
- **Data da Atualização:** YYYY-MM-DD

## Histórico de Fases Concluídas

### Fase X — [Nome da Fase]

- **Mudanças Implementadas:**
  - [Lista objetiva de funcionalidades e módulos criados/alterados]
- **Arquivos Criados / Modificados:**
  - `caminho/do/arquivo.ts` — [responsabilidade]
- **Migrations / Banco de Dados:**
  - [Novas tabelas/colunas ou "Sem alterações de schema nesta fase"]
- **Estado dos Testes Automáticos:**
  - Comando executado: `pnpm test`
  - Suites passando: X/X | Testes passando: Y/Y | Cobertura `packages/game`: Z%
  - Fluxos Playwright / Evals executados: [lista]
- **Pontos de Atenção para a Próxima Fase:**
  - [Contratos exportados, variáveis de ambiente novas, decisões técnicas]
```

### 2.3. Template do `feedback.md`

```markdown
# Registro de Feedback do Usuário e Debug — Slime Sage

## Fase X — [Nome da Fase]

### Rodada 1 de Testes do Usuário

- **Feedback do Usuário:**
  - [Descrição exata dos problemas, ajustes visuais ou comportamentos relatados pelo usuário]
- **Causa Raiz Identificada (Debug):**
  - [Explicação técnica curta da causa]
- **Correção Aplicada + Teste de Regressão Criado:**
  - [Arquivos alterados + nome do teste automático adicionado para impedir regressão]
- **Status:** [ ] Pendente | [x] Validado pelo Usuário
```

## 3. Prompt Mestre Principal do Projeto (PWA)

```markdown
# PROMPT MESTRE — PROJETO SLIME SAGE (v1 — PWA)

Você é o Engenheiro Principal responsável por construir o aplicativo **Slime Sage Skill** (`S.S.S`), um gestor de projetos pessoal gamificado em formato **Progressive Web App (PWA)** instalável e responsivo para mobile/desktop, inspirado no sistema de habilidades de _Tensura_ (Grande Sábio / Voz do Mundo) e com identidade visual **Dark Fantasy Gilded RPG** (baseada em `docs/design.png`).

## 1. ARQUITETURA E STACK OBRIGATÓRIA

- **Monorepo:** `pnpm` + `Turborepo` (`apps/pwa`, `apps/api`, `packages/shared`, `packages/game`, `e2e`, `evals`).
- **PWA Client (`apps/pwa`):**
  - Vite + React 19 + TypeScript strict.
  - Tailwind CSS + Framer Motion (animações de Sistema fluidas a 60fps/120fps) + Lucide React.
  - `vite-plugin-pwa` (Workbox) com manifesto completo (`display: standalone`, tema obsidiana cósmica `#040814` e ouro antigo `#dfa86c`, ícones adaptativos) e Service Worker para operação 100% offline.
  - Estética **Dark Fantasy Gilded RPG** (`docs/design.png`): superfícies em obsidiana profunda (`#040814` / `#060e20`), molduras com cantos retos (`rounded-none`), inscrições rúnicas arcanas em Elder Futhark com brilho reativo a hover, cantoneiras góticas ornamentadas com diamantes (`#dfa86c`, `#fde047`, `#c89b55`, `#966422`), círculos mágicos esotéricos em SVG e tipografia serifada épica `Cinzel` para títulos combinada com `JetBrains Mono` para dados/telemetria.
  - Cartões de Habilidade com respiro expandido (`p-[18px]`, `space-y-5`) e runas dinâmicas por grau (Comum, Extra, Única); Banner de Status com transliteração rúnica dinâmica do nome do caçador; e modais com selo de decreto rúnico superior.
  - Armazenamento local: IndexedDB / SQLite-WASM com schema relacional e auditoria total.
  - Sistema de Áudio da G.S e Voz do Mundo (Sem TTS do navegador): MP3 pré-gravados em alta fidelidade (`/audio/voice/`) para eventos estáticos e rituais; síntese neural via API do Gemini (Gemini 2.0 Flash Audio — voz `Kore`) no backend Hono para falas dinâmicas (habilidades, níveis, decretos), com cache no IndexedDB.
  - Web Audio API para efeitos sonoros e `navigator.vibrate` para feedback tátil em dispositivos móveis compatíveis.
  - Web Notifications API para alertas do sistema e Service Worker notifications.
  - Page Visibility API (`document.visibilityState`) para detecção precisa de quebra de foco (>30s fora).
- **Backend (`apps/api`):** Hono na Vercel com rotas (`/health`, `POST /chat`, `POST /generate`, `PUT/GET /backup`, `POST /tts`), middleware Bearer Token (`APP_SECRET`), Vercel AI SDK (`@ai-sdk/google` com Gemini Flash e Pro) e `@vercel/blob`.
- **Pacotes Compartilhados:**
  - `packages/shared`: Schemas Zod de todas as tools, payloads, snapshot de memória, prompts da G.S e banco de frases offline (`phrase_bank`).
  - `packages/game`: Motor de regras 100% puro (zero dependências de DOM ou banco), recebendo `Clock` (`now`) e `Rng` (`nextFloat`) por injeção de dependência. Cobertura de testes obrigatória >= 90%.

## 2. REGRAS DE OURO DO SISTEMA

1. **A IA propõe, o Motor decide:** A G.S nunca concede XP, níveis ou maestria diretamente. Toda escrita proposta pela IA no chat exige aprovação explícita do usuário em um **Cartão de Prévia (Aceitar / Recusar / Pedir ajuste)**.
2. **Auditabilidade Total (Ledger):** Toda alteração de XP ou maestria gera um registro imutável na tabela `xp_event`. O XP total e a maestria devem sempre bater com a soma do ledger.
3. **Offline-First e Injeção de Tempo/Sorte:** O app funciona offline (exceto chat e geração de áudios dinâmicos com IA, que possuem fallbacks determinísticos locais). Nunca use `Date.now()` ou `Math.random()` diretamente nas regras de negócio: use sempre `Clock` e `Rng` injetáveis.
4. **Código Limpo e Autoexplicativo:** Escreva código modular, fortemente tipado (TypeScript strict, sem `any`) e sem comentários óbvios.
5. **Escopo Congelado da v1:**
   - **Voz da G.S (Sem TTS do navegador):** Áudios estáticos em MP3 + síntese neural via API Gemini 2.0 Flash Audio (voz `Kore`) para falas dinâmicas com cache local. Conclusão de missão isolada não toca fala (apenas som sintético); conclusão de projetos completos toca áudio solene. Subida de nível e eventos dinâmicos ocorrem online; tarefas e foco operam 100% offline.
   - **Sistema de Agenda Integrado:** Tarefas com horário e due date; tarefas recorrentes (diárias ou dias específicos até data limite); tarefas com constância evoluem para Hábitos / Habilidades Passivas. Snapshot "Hoje" na Home + Visão dedicada de Agenda. Virada do dia lógico às **04:00 da manhã**.
   - **Progressão & Títulos:** Curva de nível íngreme/desafiadora; Títulos por Atributo (*Iniciante em Inteligência*, *Adepto em Força*, etc.) no lugar de letras F a S (patamares em aberto).
   - **Festival da Colheita:** Ativado manualmente quando 100% das metas da semana/mês forem batidas na Agenda, concedendo 2x XP, celebração cerimonial com a G.S e abertura do **Altar de Sacrifício e Fusão de Habilidades**. A detecção de sinergias é 100% determinística (sem IA) por Matriz de Domínios e Tags, com fios de mana em SVG. O Desafio de Provação é gerado pela G.S em 2 disparos atômicos (economia de 70% de tokens), respondido no celular com **Pílulas de Escolha Rápida (1 toque)** e suporte a **digitação por voz (Speech-to-Text)**, exigindo cumprimento de âncoras reais de telemetria do PWA (Modo Foco e entregas).
   - Questionário de Onboarding com **5 perguntas fixas com áudio oficial da G.S**, digitação mágica typewriter, seguido da revelação inicial via API.
   - **Escada Canônica de Habilidades (7 Níveis):** `Intrínseca` (25 pts no despertar) → `Comum` (0-100 pts) → `Especial` (100-300 pts) → `Extra` (300-600 pts) → `Única` (600-1200 pts) → `Suprema` (1200-2500 pts) → `Primordial` (2500+ pts). Habilidades do atributo principal da Raça recebem **+2 pontos fixos de maestria extra** por missão. De `Extra` para cima, a evolução ocorre via **Roleta Esotérica** (Padrão Hardcore: 20% base, +10% de piedade por falha, teto 80%, cooldown 48h, sem perda de maestria).
   - Modo Foco: quebra se o usuário sair da aba/PWA por **mais de 30 segundos** (via Page Visibility API).

## 3. PROTOCOLO RÍGIDO DE EXECUÇÃO POR FASES (4 ETAPAS + 3 ARQUIVOS)

O projeto é dividido em **15 fases (Fase 0 a Fase 14)**. Você NUNCA deve avançar para a próxima fase por conta própria. Cada fase possui obrigatoriamente **4 etapas sequenciais**:

1. **ETAPA 1 — DESENVOLVIMENTO:**
   - Antes de escrever código, leia `handoff.md`, `roadmap.md` e `feedback.md`.
   - Marque `[/]` na etapa de Desenvolvimento da fase atual em `roadmap.md`.
   - Implemente apenas o escopo exato da fase atual.

2. **ETAPA 2 — TESTES AUTOMÁTICOS:**
   - Implemente testes unitários (Vitest / fast-check), de integração/API (`app.request()`) e de componentes/E2E (Vitest + Testing Library / Playwright).
   - Execute a suíte (`pnpm lint && pnpm typecheck && pnpm test`).
   - Quando 100% dos testes automáticos passarem, marque `[x]` nas etapas 1 e 2 no `roadmap.md` e **PARE IMEDIATAMENTE**, apresentando o relatório dos testes automáticos e o roteiro da **Etapa 3 (Testes do Usuário)**.

3. **ETAPA 3 — TESTES DO USUÁRIO (PAUSA OBRIGATÓRIA):**
   - Aguarde o usuário executar os testes no navegador/PWA mobile e responder com o resultado.
   - Nunca marque a Etapa 3 como concluída sem confirmação explícita do usuário.

4. **ETAPA 4 — DEBUG E FECHAMENTO DA FASE:**
   - Registre relatos de bugs ou críticas em `feedback.md`, corrija com testes de regressão prévios e, após aprovação final do usuário:
     1. Marque `[x] Validado pelo Usuário` em `feedback.md`.
     2. Marque `[x]` nas 4 etapas da fase em `roadmap.md`.
     3. Atualize `handoff.md` com arquivos tocados, estado dos testes e contexto para a próxima fase.
```

## 4. Plano Detalhado das 15 Fases e Prompts por Fase (PWA)

### Fase 0 — Fundação do Monorepo, API Base (`/health`) e Token Secreto

#### Escopo nas 4 Partes (Fase 0)

- **1. Desenvolvimento:**
  - Configurar monorepo `slime-sage` com `pnpm-workspace.yaml`, `turbo.json`, TypeScript strict, ESLint, Prettier e workflow GitHub Actions (`ci.yml`).
  - Criar `packages/shared` (schemas Zod básicos, tipos de resposta da API) e `packages/game` (estrutura inicial pura com Vitest).
  - Criar `apps/api` (Hono na Vercel) com rota `GET /health` e middleware Bearer Token validando `APP_SECRET`.
  - Criar `apps/pwa` (Vite + React 19 + TypeScript + Tailwind CSS + `vite-plugin-pwa` configurado com manifesto e ícones de tema Dark Fantasy `#040814`).
  - Criar a tela de **Primeiro Acesso (Token Secreto)** na PWA: input seguro estilizado no tema "Sistema" Dark Fantasy Gilded RPG (`#040814` / `#dfa86c`), campo para URL da API (padrão local ou prod), botão "Conectar ao Sistema" que valida em `GET /health`, salva o token em storage local seguro e redireciona para a Home placeholder.
  - Criar os arquivos iniciais `roadmap.md`, `handoff.md` e `feedback.md` na raiz.
- **2. Testes Automáticos:**
  - Vitest em `apps/api`: testar `GET /health` sem header `Authorization` (`401`), com token inválido (`401`) e com token correto (`200 OK` + `{ status: "ok", app: "slime-sage" }`).
  - Vitest + React Testing Library em `apps/pwa`: testar renderização da tela de Token, exibição de erro quando a API retorna `401` e persistência do token quando retorna `200`.
- **3. Testes do Usuário:**
  - Abrir a PWA no navegador (desktop ou mobile), digitar um token errado (verificar mensagem de erro estilo "Sistema"), digitar o token correto configurado no `.env` da API, recarregar a página e confirmar que a autenticação persiste.
- **4. Debug e Fechamento:**
  - Corrigir eventuais falhas de CORS, env ou storage apontadas em `feedback.md` e atualizar os arquivos de controle.

#### Prompt da Fase 0

```markdown
Leia o Prompt Mestre do projeto Slime Sage (PWA). Vamos iniciar a **Fase 0 — Fundação do Monorepo, API Base (`/health`) e Token Secreto**.

### Passo 1 — Inicialização de Controle

Crie na raiz do repositório os arquivos `roadmap.md`, `handoff.md` e `feedback.md` seguindo a estrutura do Plano de Implementação PWA e marque `[/] 0.1 Desenvolvimento` em `roadmap.md`.

### Passo 2 — Desenvolvimento (Etapa 0.1)

Implemente:

1. Estrutura do monorepo `pnpm` + `Turborepo` (`apps/pwa`, `apps/api`, `packages/shared`, `packages/game`, `e2e`, `evals`) com TypeScript strict, ESLint/Prettier e `.github/workflows/ci.yml`.
2. `apps/api`: servidor Hono compatível com Vercel contendo middleware de autenticação Bearer (`APP_SECRET`) e rota `GET /health` retornando `{ status: "ok", app: "slime-sage", timestamp }`.
3. `apps/pwa`: aplicação Vite + React 19 + Tailwind CSS + `vite-plugin-pwa` (manifesto PWA com `display: standalone` e tema escuro obsidiana `#040814`).
4. Fluxo de autenticação na PWA: ao abrir, verifica se há token salvo no storage. Se não houver, exibe a tela "Conexão com o Sistema" (tema Dark Fantasy Gilded RPG com moldura dourada `#dfa86c` e fundo `#040814`) que testa o token contra `GET /health`, salva em caso de sucesso e navega para a tela inicial placeholder.

### Passo 3 — Testes Automáticos (Etapa 0.2)

1. Escreva testes Vitest para `apps/api` cobrindo requisição sem token (401), token inválido (401) e token válido (200).
2. Escreva testes Vitest + Testing Library para a tela de Token em `apps/pwa` cobrindo erro 401 e sucesso 200 com persistência.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 4 — Pausa Obrigatória para Testes do Usuário (Etapa 0.3)

Assim que todos os testes automáticos passarem:

- Marque `[x] 0.1 Desenvolvimento` e `[x] 0.2 Testes Automáticos` no `roadmap.md`.
- **PARE** e apresente o resultado dos testes automáticos junto com o checklist passo a passo de **Testes do Usuário da Fase 0** para eu validar no navegador.

### Passo 5 — Debug e Fechamento (Etapa 0.4 — Somente após meu retorno)

Registre meu retorno em `feedback.md`, aplique correções se necessário e, com a aprovação final, atualize `handoff.md`, `feedback.md` e `roadmap.md`.
```

---

### Fase 1 — Logger Local, Error Boundary, Painel Dev e Spike de Notificações + TTS

#### Escopo nas 4 Partes (Fase 1)

- **1. Desenvolvimento:**
  - Configurar repositório local com as tabelas/stores `app_log` (`id`, `at`, `level`, `scope`, `message`, `data`) com rotação mantendo os últimos 2.000 registros, e `kv` (`key`, `value`).
  - Utilitário `logger.debug/info/warn/error(scope, message, data)` gravando no console e em `app_log`.
  - `SystemErrorBoundary` global temático _"A Voz do Mundo detectou uma anomalia"_ com botão para exportar logs em JSON.
  - **Painel do Desenvolvedor** oculto (desbloqueado com 7 cliques na versão na tela de Ajustes) contendo: visualizador de logs por escopo, botão **"Solicitar Permissão de Notificação Web"**, botão **"Disparar Notificação Imediata"** e botão **"Testar Voz da G.S (Web Speech API pt-BR)"**.
  - Módulo de síntese de voz usando **Web Speech API (`window.speechSynthesis`)** em `pt-BR` com seleção prioritária de voz natural em português.
- **2. Testes Automáticos:**
  - Vitest: testar rotação de logs (manutenção do teto de 2.000 registros) e filtros por escopo/nível.
  - Vitest + Testing Library: testar desbloqueio do Painel Dev com 7 cliques e captura de erro pelo `SystemErrorBoundary`.
- **3. Testes do Usuário:**
  - Abrir Ajustes → clicar 7 vezes na versão → abrir Painel Dev.
  - Clicar em "Testar Voz da G.S" e ouvir o áudio narrado pelo navegador em português.
  - Conceder permissão de notificação e disparar notificação de teste no navegador.
- **4. Debug e Fechamento:**
  - Ajustar compatibilidade de voz TTS ou permissões web e atualizar arquivos de controle.

#### Prompt da Fase 1

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 1 — Logger Local, Error Boundary, Painel Dev e Spike de Notificações + TTS**.

### Passo 1 — Desenvolvimento (Etapa 1.1)

Marque `[/] 1.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Persistência local para `app_log` (limite rotativo de 2.000 entradas) e chave-valor `kv`.
2. Serviço `logger` com escopos (`ai`, `notif`, `game`, `db`, `focus`, `backup`, `tts`) e `SystemErrorBoundary` temático com exportação de logs.
3. Utilitário de voz via Web Speech API (`speechSynthesis`) em `pt-BR` com fallbacks e detecção de vozes disponíveis.
4. Painel Dev acessado com 7 cliques na versão em Ajustes com: visualizador de logs, teste de Web Notifications e teste de voz da G.S narrando: _"Aviso. O Sistema Slime Sage foi inicializado com sucesso."_

### Passo 2 — Testes Automáticos (Etapa 1.2)

1. Testes Vitest do serviço de log e rotação dos 2.000 registros.
2. Testes da UI para `SystemErrorBoundary` e o gesto de 7 cliques do Painel Dev.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 1.3)

Com os testes passando, marque `[x]` nas etapas 1.1 e 1.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes de voz e notificação no navegador.

### Passo 4 — Debug e Fechamento (Etapa 1.4 — Somente após meu retorno)

Após o retorno do usuário, registre em `feedback.md`, corrija eventuais falhas e atualize `handoff.md`, `feedback.md` e `roadmap.md`.
```

---

### Fase 2 — Banco de Dados Local, Migrations e Repositórios de Projetos/Missões

#### Escopo nas 4 Partes (Fase 2)

- **1. Desenvolvimento:**
  - Modelar schema relacional completo em `packages/shared` / cliente local: `profile`, `area`, `class`, `class_challenge`, `skill`, `evolution_attempt`, `project`, `mission`, `mission_dep`, `mission_reward`, `daily_mission`, `focus_session`, `xp_event`, `chat_thread`, `chat_message`, `scheduled_notification`, `phrase_bank`, `app_log`, `kv`.
  - Repositório transacional de **Áreas, Projetos e Missões**:
    - Criação de projeto e árvore de missões;
    - Grafo de dependências (`mission_dep`) com **detecção de ciclos (DFS/Kahn)**;
    - Atualização de status: `bloqueada` ↔ `disponivel` ↔ `feita` com recálculo automático de dependentes;
    - Soft delete (`deleted_at`).
  - No Painel Dev: ações **"Semear Dados de Exemplo (Seed)"** e **"Apagar Tudo (Reset DB)"** com contador de linhas por tabela.
- **2. Testes Automáticos:**
  - Vitest:
    - Testar criação de árvore com dependências em múltiplos níveis (`A -> B -> C`);
    - Rejeição de ciclos diretos (`A -> B -> A`) e indiretos (`A -> B -> C -> A`);
    - Desbloqueio automático de missões dependentes ao concluir pré-requisitos e reversão ao desfazer;
    - Soft delete.
- **3. Testes do Usuário:**
  - No Painel Dev, clicar em "Semear Dados", validar persistência após recarregar a página e testar "Apagar Tudo".
- **4. Debug e Fechamento:**
  - Tratar inconsistências de integridade e atualizar arquivos de controle.

#### Prompt da Fase 2

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 2 — Banco de Dados Local, Migrations e Repositórios de Projetos/Missões**.

### Passo 1 — Desenvolvimento (Etapa 2.1)

Marque `[/] 2.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Schema relacional cobrindo todas as tabelas do Slime Sage.
2. Seed padrão das 5 Áreas base (`INT`, `FOR`, `DIS`, `CRI`, `SOC`).
3. Repositório de Projetos e Missões com validador DAG acíclico, transições automáticas de status (`bloqueada`/`disponivel`/`feita`) e soft delete.
4. Painel Dev: "Semear Dados", "Apagar Tudo" e diagnóstico de tabelas.

### Passo 2 — Testes Automáticos (Etapa 2.2)

1. Testes Vitest cobrindo inicialização, detecção de ciclos, desbloqueio em cascata e soft delete.
2. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 2.3)

Com os testes aprovados, marque `[x]` nas etapas 2.1 e 2.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes para o usuário.

### Passo 4 — Debug e Fechamento (Etapa 2.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 3 — Design System "Sistema" (Dark Fantasy Gilded RPG — `docs/design.png`), Navegação por Abas e CRUD Manual de Projetos/Missões

#### Escopo nas 4 Partes (Fase 3)

- **1. Desenvolvimento:**
  - Design System **"Sistema" (Dark Fantasy Gilded RPG — baseado em `docs/design.png`)**: fundo obsidiana cósmica `#040814` / `#060e20`, molduras com cantos retos (`rounded-none`) em containers, painéis, cartões e modais, ornadas com cantoneiras góticas facetadas, losangos nos vértices e entalhes centrais luminosos (`GildedCorners`).
  - Inscrições Mágicas Rúnicas em Elder Futhark (`withRunes`, `runicTop`, `runicBottom`) com brilho áureo reativo no foco/hover (`group-hover:opacity-90 transition-all drop-shadow-[0_0_4px_currentColor]`).
  - Cartões de Habilidade com respiro aprimorado (`p-[18px]`, `space-y-5`) e runas por tier (Comum em âmbar, Extra em ouro radiante `#fde047`, Única em púrpura místico `#c084fc`).
  - Banner de Status com transliteração rúnica dinâmica do nome do usuário (`toElderFuthark`).
  - Componentes base: `SystemPanel` (com cantos retos e `GildedCorners`), `SystemButton` (com cantos chanfrados ergonômicos e variantes douradas), `SystemBadge`, `SystemModal` (com decreto rúnico superior sagrado `✦ ᛋ ᚨ ᚲ ᚱ ᛖ ᛞ · ᛟ ᚱ ᛞ ᛖ ᚱ ✦`), `SystemInput`, `SystemHeader`.
  - Navegação pelas 5 abas principais: **Home · Projetos · Habilidades · Status · G.S** (com medalhão central dourado da G.S inscrito em círculo mágico esotérico SVG).
  - Telas completas da aba **Projetos**: listagem por área com progresso percentual dourado, visualizador de **Árvore de Missões** (com status `bloqueada` com cadeado, `disponivel` em ouro radiante e `feita` em esmeralda), modal de detalhe da missão e formulário de criação/edição com seleção de dependências.
- **2. Testes Automáticos:**
  - Vitest + Testing Library: renderização do card de missão nos 3 estados, bloqueio do botão de concluir em missões bloqueadas, proteção contra overflow de nomes longos e formulários de criação.
  - Playwright (`e2e/phase3-projects.spec.ts`): fluxo completo no navegador criando projeto, missões dependentes e verificando desbloqueio.
- **3. Testes do Usuário:**
  - Navegar pelas 5 abas conferindo tema visual Dark Fantasy Gilded RPG (`docs/design.png`), criar um projeto manualmente com missões dependentes e validar desbloqueio.
- **4. Debug e Fechamento:**
  - Ajustes de layout, responsividade mobile/desktop e fechamento da fase.

#### Prompt da Fase 3

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 3 — Design System "Sistema" (Dark Fantasy Gilded RPG), Navegação por Abas e CRUD Manual de Projetos/Missões**.

### Passo 1 — Desenvolvimento (Etapa 3.1)

Marque `[/] 3.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Componentes do Design System "Sistema" (Dark Fantasy Gilded RPG — `docs/design.png`: fundo `#040814`, molduras duplas douradas `#dfa86c`/`#fde047`, fonte `Cinzel` e losangos ornamentais) com Tailwind CSS e Framer Motion.
2. Navegação de 5 abas (Home, Projetos, Habilidades, Status, G.S) + medalhão central com círculo mágico esotérico.
3. Telas de Projetos com listagem, árvore de missões e formulários de criação/edição.
4. Card na Home com Projeto Ativo e Próxima Missão Desbloqueada.

### Passo 2 — Testes Automáticos (Etapa 3.2)

1. Testes de componentes com Testing Library para estados de missões e formulários.
2. Teste E2E Playwright `e2e/phase3-projects.spec.ts`.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 3.3)

Marque `[x]` nas etapas 3.1 e 3.2 em `roadmap.md` e **PARE**. Apresente o roteiro de validação ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 3.4 — Somente após meu retorno)

Após o feedback, aplique correções e feche a fase nos arquivos de controle.
```

---



### Fase 5 — Voz do Mundo & G.S (Modal Dourado + Círculo Mágico + Áudios Oficiais/API Sem TTS) e Telas de Status e Habilidades

#### Escopo nas 4 Partes (Fase 5)

- **1. Desenvolvimento:**
  - Fila e modal temático da **Voz do Mundo & Grande Sábio** (`WorldVoiceModal`):
    - **Descarte Total do TTS do Navegador (`speechSynthesis`)**: uso de MP3 estáticos pré-gravados em alta qualidade para rituais fixos e sintetizador via API do Gemini (Gemini 2.0 Flash Audio — voz `Kore`) para falas dinâmicas com cache local no IndexedDB;
    - **Regras de Áudio dos Eventos:**
      - **Conclusão de Missão Individual (`completeMission`):** NÃO toca fala falada (apenas efeito sonoro sintético leve via Web Audio API e vibração tátil para evitar fadiga sonora);
      - **Conclusão de Projeto (`PROJECT_COMPLETE`):** Toca áudio cerimonial solene de conquista de projeto;
      - **Subida de Nível (`LEVEL_UP`):** Chamada à API com a voz oficial da G.S quando online anunciando o novo nível alcançado e parâmetros calibrados;
      - **Aquisição e Evolução de Habilidades (`SKILL_ACQUIRED`, `SKILL_EVOLVED_EXTRA`):** Chamada à API quando online com o nome personalizado da habilidade;
      - **Conectividade:** Subida de nível e eventos dinâmicos dependem de conexão online; atividades diárias e foco operam 100% offline;
    - Modal animado com Framer Motion no estilo **Dark Fantasy Gilded RPG (`docs/design.png`)**: moldura dupla dourada, cantoneiras com diamantes e medalhão central com círculo mágico esotérico concêntrico rotativo em SVG.
  - Aba **Habilidades**: listagem por área com cartelas douradas, badge de nível (`Comum`, `Extra`, `Única`), barras de progresso de maestria com gema losangular na ponta e modal de aquisição/detalhe.
  - Aba **Status**: nível geral, barra de XP dourada com **curva de nível mais difícil/íngreme**, gráfico radar em SVG com os 5 atributos (`INT`, `FOR`, `DIS`, `CRI`, `SOC`), **Títulos por Atributo** (*Iniciante em Inteligência*, *Adepto em Força*, etc., no lugar de letras F a S — patamares em aberto) e extrato recente do ledger.
- **2. Testes Automáticos:**
  - Vitest + Testing Library: fila de anúncios da Voz do Mundo, reprodução de MP3 e cache de áudio da API, ausência de fala em missões isoladas e acionamento em projetos concluídos, renderização do radar SVG e títulos por atributo.
  - Playwright (`e2e/phase5-world-voice.spec.ts`): concluir projeto → verificar aparição do modal e áudio cerimonial → verificar atualização das abas Habilidades e Status.
- **3. Testes do Usuário:**
  - Concluir projetos e evoluir habilidades no navegador, ouvir os áudios oficiais da G.S em alta qualidade, validar o modal visual com círculo mágico e inspecionar os títulos por atributo na aba Status.
- **4. Debug e Fechamento:**
  - Calibrar volume, cache de áudio e fechar a fase nos arquivos de controle.

#### Prompt da Fase 5

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 5 — Voz do Mundo & G.S (Modal Dourado + Círculo Mágico + Áudios Oficiais/API Sem TTS) e Telas de Status e Habilidades**.

### Passo 1 — Desenvolvimento (Etapa 5.1)

Marque `[/] 5.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Sistema de fila e modal dramático da **Voz do Mundo & G.S** (Dark Fantasy Gilded RPG — `docs/design.png` com círculo mágico esotérico em SVG) sem TTS do navegador: áudios estáticos em MP3 + síntese via API do Gemini com cache IndexedDB. Áudio em conclusão de projeto e remoção de fala em missões isoladas.
2. Aba Habilidades com barras de maestria douradas e filtro por área.
3. Aba Status com gráfico radar SVG esotérico, curva de nível íngreme, Títulos por Atributo (patamares em aberto) e extrato do ledger.

### Passo 2 — Testes Automáticos (Etapa 5.2)

1. Testes de componentes para a fila de eventos, reprodução de áudios e telas de Status/Habilidades.
2. Teste E2E Playwright `e2e/phase5-world-voice.spec.ts`.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 5.3)

Marque `[x]` nas etapas 5.1 e 5.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 5.4 — Somente após meu retorno)

Após validação, feche a fase nos arquivos de controle.
```

---

### Fase 6 — Backend `/chat` (Streaming + Tools Schema), Síntese de Voz G.S e Pop-up de Pendências

#### Escopo nas 4 Partes (Fase 6)

- **1. Desenvolvimento:**
  - Em `packages/shared`: schemas Zod das tools de leitura (`get_profile`, `list_skills`, `list_classes`, `list_projects`, `get_project`, `search_missions`, `list_agenda_tasks`) e de escrita (`create_project_tree`, `add_missions`, `update_mission`, `schedule_agenda_task`, `create_recurring_habit`, `delete_mission`, `propose_class_challenge`, `name_class`, `name_unique_skill`).
  - Em `apps/api`:
    - Rota `POST /chat` com `streamText` (`@ai-sdk/google`), tools sem execução no backend, proteção por token Bearer;
    - Rota `POST /tts`: recebe texto gerado pela G.S e devolve áudio sintetizado em alta qualidade (Gemini 2.0 Flash Audio — voz `Kore`);
  - No cliente PWA:
    - Persistência de threads em `chat_thread` e `chat_message`;
    - Cliente de chat com streaming real via `fetch` e Vercel AI SDK;
    - Execução silenciosa de tools de leitura no banco local;
    - **Cartões de Prévia Interativos** para tools de escrita com botões **Aceitar**, **Recusar** e **Pedir Ajuste**;
    - Botão opcional **"Ouvir G.S" (play)** em cada mensagem da Grande Sábio para tocar o áudio sob demanda gerado pela API com cache no IndexedDB;
    - **Avisos Proativos da G.S:** se houver pendências (tarefas da agenda próximas, diárias por vencer ou cartões pendentes), a G.S emite um **pop-up discreto/toast em voz** na tela sem tirar o usuário da navegação nem abrir novas janelas.
- **2. Testes Automáticos:**
  - Vitest na API com modelo mockado (`ai/test`): streaming, emissão de tool calls e rota de áudio.
  - Vitest + Testing Library no PWA: teste dos 3 fluxos do Cartão de Confirmação, botão de áudio opcional e toast proativo de pendências.
- **3. Testes do Usuário:**
  - Conversar com a G.S pedindo para criar tarefas/projetos, testar o botão "Ouvir G.S" e conferir os pop-ups discretos de pendência.
- **4. Debug e Fechamento:**
  - Ajustar streaming, latência de áudio e atualizar arquivos de controle.

#### Prompt da Fase 6

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 6 — Backend `/chat` (Streaming + Tools Schema), Síntese de Voz G.S e Pop-up de Pendências**.

### Passo 1 — Desenvolvimento (Etapa 6.1)

Marque `[/] 6.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Schemas Zod de todas as tools (incluindo tarefas de agenda e hábitos) em `packages/shared`.
2. Rotas `POST /chat` e `POST /tts` em `apps/api` com streaming e síntese neural da G.S.
3. Cliente de chat no PWA com streaming, Cartão de Prévia interativo, botão opcional "Ouvir G.S" e toast proativo em voz para pendências sem troca de tela.

### Passo 2 — Testes Automáticos (Etapa 6.2)

1. Testes Vitest na API para streaming e áudio.
2. Testes de componentes no PWA para o Cartão de Prévia e toasts proativos.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 6.3)

Marque `[x]` nas etapas 6.1 e 6.2 em `roadmap.md` e **PARE**. Apresente o roteiro de teste do chat ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 6.4 — Somente após meu retorno)

Após o retorno do usuário, atualize os arquivos de controle.
```

---

### Fase 7 — Modo Coordenador da G.S, Validação Anti-Duplicatas e Snapshot de Memória

#### Escopo nas 4 Partes (Fase 7)

- **1. Desenvolvimento:**
  - Snapshot Builder compacto (~500 tokens) com perfil, projeto ativo, próximas 5 missões, diárias e top 10 habilidades, enviado a cada mensagem.
  - Prompts do **Modo Coordenador** em `packages/shared/prompts`: entrevista fazendo **1 pergunta por vez** (máx. 5 perguntas) antes de propor árvore de projeto, chamando obrigatoriamente `list_skills` para reaproveitar habilidades existentes.
  - **Validador Pré-Cartão**: verifica ausência de ciclos de dependência, 1 a 3 habilidades por missão e deduplicação de habilidades por `normalized_name`, rotulando como `[NOVA]` ou `[EXISTENTE]`. Reenvio automático de erros para a IA corrigir (até 2 tentativas).
  - Suíte de Evals em `evals/` com 15 casos de teste de entrevista.
- **2. Testes Automáticos:**
  - Vitest: `buildMemorySnapshot`, validador pré-cartão, unificação de nomes de habilidade.
  - Evals (`pnpm eval`): verificar taxa de sucesso >= 90% na geração de árvores válidas.
- **3. Testes do Usuário:**
  - Realizar entrevista no Modo Coordenador no navegador, validar o Cartão de Prévia da árvore gerada e inspecionar o Snapshot no Painel Dev.
- **4. Debug e Fechamento:**
  - Refinar prompts e fechar a fase nos arquivos de controle.

#### Prompt da Fase 7

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 7 — Modo Coordenador da G.S, Validação Anti-Duplicatas e Snapshot de Memória**.

### Passo 1 — Desenvolvimento (Etapa 7.1)

Marque `[/] 7.1 Desenvolvimento` em `roadmap.md` e implemente:

1. `buildMemorySnapshot` (~500 tokens) e visualizador de snapshot no Painel Dev.
2. Prompts do Modo Coordenador (entrevista de 1 pergunta por vez e reaproveitamento de habilidades).
3. Validador Pré-Cartão no PWA com retry automático e marcação `[NOVA]` / `[EXISTENTE]`.
4. Suíte de evals em `evals/`.

### Passo 2 — Testes Automáticos (Etapa 7.2)

1. Testes Vitest do snapshot, validador e unificação de habilidades.
2. Execução da suíte de testes e evals.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 7.3)

Marque `[x]` nas etapas 7.1 e 7.2 em `roadmap.md` e **PARE**. Apresente o roteiro de teste ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 7.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 8 — Onboarding: 5 Perguntas da G.S, Revelação de Raça (Tensura) e Rank de Ameaça

#### Escopo nas 4 Partes (Fase 8)

- **1. Desenvolvimento:**
  - Fluxo de Onboarding em Tela Cheia (quando `profile.onboarding_done === false`), bloqueando as abas principais até o despertar:
    1. **Questionário das 5 Perguntas Solenes da G.S:**
       - 5 perguntas avaliando adaptabilidade (Slime), superação (Kijin), foco (Draconiano), criatividade (Majin), união/lealdade (Homem-Fera) e constância de rotina (Rank de Ameaça: Classe Menor, Hazard, Calamity).
       - Narradas com **áudios pré-gravados em alta fidelidade da G.S** (`/audio/voice/onboarding-q1.mp3` a `q5.mp3`) acompanhados por efeito de digitação mágica (*typewriter* no estilo Dark Fantasy Gilded RPG).
    2. **Cálculo Determinístico no Motor Puro (`@slime-sage/game`):**
       - Função pura que calcula a Raça e o Rank de Ameaça a partir da matriz de respostas das 5 perguntas, 100% testável e offline-first.
    3. **Revelação Cerimonial e Proclamação da G.S (API Gemini):**
       - Círculo mágico esotérico concêntrico em SVG rotativo e chamada à API (`POST /tts`) gerando o decreto solene da Grande Sábio com o nome, Raça e Rank do caçador com a voz oficial `Kore`.
    4. **Consagração e Primeira Conquista:**
       - Atualização atômica do perfil (`race`, `rank_threat`, `onboarding_done = true`).
       - Transição automática com pergunta da G.S: _"Qual é a primeira conquista que você deseja alcançar?"_, abrindo o Chat da G.S no Modo Coordenador para formular o primeiro projeto denso (7-12 missões).
  - No Painel Dev: botão **"Resetar Onboarding (Re-despertar)"** para testes imediatos.
- **2. Testes Automáticos:**
  - Vitest: motor determinístico de cálculo de Raça/Rank em `@slime-sage/game` (matriz de respostas, desempate e limites).
  - Testing Library: renderização da tela de Despertar, efeito typewriter, disparos de áudio da G.S e navegação pelas 5 perguntas.
  - Playwright (`e2e/phase8-onboarding.spec.ts`): fluxo completo de novo usuário respondendo as 5 perguntas, consagração e entrada no chat.
- **3. Testes do Usuário:**
  - Abrir como novo usuário (ou resetar pelo Painel Dev), ouvir as 5 perguntas narradas pela G.S, responder e receber a revelação da Raça e Rank, validando a transição para o primeiro projeto.
- **4. Debug e Fechamento:**
  - Ajustar cadência da digitação, volumes e atualizar arquivos de controle.

#### Prompt da Fase 8

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 8 — Onboarding: Apresentação da G.S com Áudios Oficiais, Efeito Typewriter e Revelação Inicial via API**.

### Passo 1 — Desenvolvimento (Etapa 8.1)

Marque `[/] 8.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Motor determinístico das 5 perguntas de personalidade em `packages/game`.
2. Fluxo de 4 telas de onboarding no PWA com áudios oficiais da G.S, efeito typewriter e chamada à API para revelação cerimonial.
3. Botão "Resetar Onboarding" no Painel Dev.

### Passo 2 — Testes Automáticos (Etapa 8.2)

1. Testes Vitest do motor determinístico.
2. Testes de componentes para disparo de áudio da G.S, typewriter e navegação.
3. Teste E2E Playwright `e2e/phase8-onboarding.spec.ts`.
4. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 8.3)

Marque `[x]` nas etapas 8.1 e 8.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 8.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 9 — Motor de Jogo (Parte 2): Classes por Área e Evolução com Desafio Autodeclarado

#### Escopo nas 4 Partes (Fase 9)

- **1. Desenvolvimento:**
  - Em `packages/game/classes.ts`:
    - 5 patamares por Área: `1: Aprendiz (0)`, `2: Iniciante (150)`, `3: Adepto (500)`, `4: Mestre (1200)`, `5: Lendário (3000)`;
    - Máquina de estados de `class_challenge` (`proposta -> aceita -> concluida / desistida`).
  - No cliente PWA:
    - Banner de elegibilidade para evolução de classe ao atingir a maestria necessária;
    - Solicitação de desafio à G.S via tool `propose_class_challenge`;
    - Card de desafio ativo com botão **"Consegui concluir o desafio"** (autodeclarado);
    - Nome épico sugerido pela G.S (`name_class`), anúncio da Voz do Mundo com Web TTS e seleção de Título Principal.
  - No Painel Dev: atalho "+150 Maestria na Área".
- **2. Testes Automáticos:**
  - Vitest: limites de patamar (`149 vs 150`, `499 vs 500`, etc.) e troca de título.
  - Testing Library: fluxo de aceitar desafio, marcar "Consegui!" e promover classe.
  - Evals: qualidade e proporção dos desafios gerados pela G.S.
- **3. Testes do Usuário:**
  - Simular maestria, solicitar desafio, marcar como concluído, ouvir o anúncio da Voz do Mundo e equipar o título na aba Status.
- **4. Debug e Fechamento:**
  - Ajustar textos e prompts e atualizar arquivos de controle.

#### Prompt da Fase 9

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 9 — Motor de Jogo (Parte 2): Classes por Área e Evolução com Desafio Autodeclarado**.

### Passo 1 — Desenvolvimento (Etapa 9.1)

Marque `[/] 9.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Em `packages/game/classes.ts`: elegibilidade dos 5 patamares e máquina de estados de desafios.
2. Fluxo no PWA: banner de elegibilidade, desafio com a G.S, botão "Consegui!", anúncio da Voz do Mundo e troca de Título Principal.
3. Atalho no Painel Dev para adicionar maestria de teste.

### Passo 2 — Testes Automáticos (Etapa 9.2)

1. Testes Vitest de patamares e transições de desafio.
2. Testes de componentes para UI de desafio e equipar título.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 9.3)

Marque `[x]` nas etapas 9.1 e 9.2 em `roadmap.md` e **PARE**. Apresente o roteiro de validação ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 9.4 — Somente após meu retorno)

Após validação, atualize os arquivos de controle.
```

---

### Fase 10 — Evolução de Habilidades (7 Níveis Canônicos), Roleta Animada (SVG + Framer Motion) e Festival da Colheita com Altar de Fusão/Sacrifício

#### Escopo nas 4 Partes (Fase 10)

- **1. Desenvolvimento:**
  - **Escada Canônica de Habilidades (7 Níveis):**
    - `packages/shared`: Atualização do `SkillTierSchema`: `["intrinseca", "comum", "especial", "extra", "unica", "suprema", "primordial"]`;
    - `packages/game/src/skills.ts` e `config.ts`:
      - **Tetos de Maestria Exponenciais Progressivos:**
        - `intrinseca`: Inicia com 25 pts no Despertar e ascende a `especial` aos 100 pts de maestria;
        - `comum`: 0 a 100 pts (ascende automaticamente para `especial` aos 100 pts);
        - `especial`: 100 a 300 pts (ascende para `extra` aos 300 pts com a evolução oculta preparada pela G.S);
        - `extra`: 300 a 600 pts (ao atingir 600 pts + 1 projeto concluído, libera a Roleta Esotérica para ascender a `unica`);
        - `unica`: 600 a 1.200 pts (ao atingir 1.200 pts + 1 projeto concluído, libera a Roleta Esotérica para ascender a `suprema`);
        - `suprema`: 1.200 a 2.500 pts (ao atingir 2.500 pts + 1 projeto concluído, libera a Roleta Esotérica para ascender a `primordial`);
        - `primordial`: 2.500+ pts (Ápice Cósmico Absoluto / Grau Divino);
      - **Bônus de Afinidade Racial:** Missões concluídas na área correspondente ao atributo primário da Raça do Escolhido (ex: `INT` para Slime, `FOR` para Kijin, `DIS` para Draconiano, `CRI` para Majin, `SOC` para Homem-Fera) concedem **+2 pontos fixos de maestria extra** garantidos.
  - **Roleta Esotérica (Padrão Hardcore):**
    - Em `packages/game/src/roulette.ts`:
      - Elegibilidade: atingir o teto de maestria do tier + pelo menos 1 projeto concluído associado;
      - Chance Base: **20%**;
      - Piedade (*Pity*): **+10% cumulativo por falha** (20% → 30% → 40% → 50% → 60% → 70% → 80% teto máximo);
      - Cooldown de repouso da alma: **48 horas** em caso de falha (`Clock` injetável);
      - Salvaguarda: **zero perda de maestria** em caso de falha;
      - Sucesso: Proposta de Nome Épico e Título pela G.S com consentimento e personalização do Escolhido antes de consagrar.
    - No PWA: Modal da Roleta em SVG ouro/obsidiana com anéis rúnicos concêntricos giratórios de `docs/design.png`, física de desaceleração suave (Framer Motion), som via Web Audio API e vibração tátil.
  - **Festival da Colheita e Altar de Fusão/Sacrifício:**
    - Desbloqueado manualmente quando **100% das metas da semana ou mês forem batidas na Agenda**, concedendo **2x XP** e abrindo o Altar de Transmutação;
    - Toca áudio cerimonial estático pré-gravado: *"O Festival da Colheita foi iniciado! Todos os frutos de seu esforço foram reconhecidos pelo Sistema."*;
    - **Detecção de Sinergias Sem IA (100% Determinística):**
      - `packages/game/src/skillDomains.ts`: Matriz de compatibilidade estática por domínios e tags (`domain` e `tags`);
      - Na UI: Habilidades compatíveis conectam-se por fios de mana luminosos em SVG; habilidades incompatíveis ficam translúcidas;
    - **Desafio de Fusão da G.S (Inquisição em Lote + Mobile Ergonômico):**
      - 2 chamadas atômicas estruturadas (economia de 70% de tokens);
      - Chamada 1: G.S recebe o resumo das 2 habilidades e devolve de 2 a 3 perguntas acompanhadas de **Pílulas de Escolha Rápida (Chips de 1 toque)**;
      - No celular: Escolhido responde em segundos apenas tocando nas pílulas, com suporte a **personalização com digitação por voz (Speech-to-Text)** e texto livre;
      - Chamada 2: G.S consolida o nome da nova habilidade superior, a lore e o Desafio Autodeclarado com âncoras reais de telemetria do PWA (tempo no cronômetro do Modo Foco e entregas);
      - Fallback 100% offline determinístico via templates do `phrase_bank` caso o usuário esteja sem internet.
  - **Identidade Visual dos 7 Níveis nos Cartões de Habilidade:**
    - `intrinseca`: Ciano Astral / Turquesa Primordial;
    - `comum`: Âmbar / Bronze Antigo (`#dfa86c`);
    - `especial`: Prata Lunar / Platina Arcana (`#e2e8f0` / `#94a3b8`);
    - `extra`: Ouro Solar Radiante (`#fde047` / `#eab308`);
    - `unica`: Púrpura Abissal / Ametista Cósmica (`#c084fc` / `#a855f7`);
    - `suprema`: Ouro Rubro Celestial / Carmesim Divino (`#f43f5e` + `#ffd700`);
    - `primordial`: Branco Divino Prismático & Obsidiana com pulso contínuo de mana;
    - Efeitos puramente cosméticos e de lore (sem desvirtuar o cálculo do ledger imutável de XP).
  - Painel Dev: Controles de RNG ("Forçar Sucesso" / "Forçar Falha"), "Zerar Cooldown de 48h", "Simular Metas 100% e Desbloquear Festival da Colheita", "Testador de Sinergia e Altar da Colheita" e seletores de teste de fusão.
- **2. Testes Automáticos:**
  - Vitest + `fast-check`: monotonicidade da chance da roleta (20→30→...→80%), cooldown exato de 48h e preservação de maestria.
  - Testes unitários do motor de sinergias determinístico (`skillDomains.test.ts`) garantindo pares válidos e bloqueio de dissonantes.
  - Testes de componentes do PWA: Roleta SVG, Altar de Fusão com fios de mana, formulário de pílulas rápidas com suporte a Speech-to-Text e banner 2x do Festival da Colheita.
  - Playwright (`e2e/phase10-roulette-and-harvest.spec.ts`): fluxo completo de elegibilidade, giro de roleta, ativação do Festival da Colheita e fusão com desafio.
- **3. Testes do Usuário:**
  - Tornar uma habilidade elegível, girar a roleta no navegador/celular, testar falha com cooldown de 48h e sucesso com nomeação.
  - Bater metas, abrir o Festival da Colheita, selecionar duas habilidades com sinergia, responder o questionário por pílulas/voz e selar o desafio de fusão.
- **4. Debug e Fechamento:**
  - Ajustes de responsividade mobile, haptics e fechamento nos arquivos de controle (`handoff.md`, `feedback.md`, `roadmap.md`).

#### Prompt da Fase 10

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 10 — Evolução de Habilidades (7 Níveis Canônicos), Roleta Esotérica (Padrão Hardcore) e Festival da Colheita com Altar de Fusão/Sacrifício**.

### Passo 1 — Desenvolvimento (Etapa 10.1)

Marque `[/] 10.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Atualização dos 7 Níveis de Habilidade (`intrinseca`, `comum`, `especial`, `extra`, `unica`, `suprema`, `primordial`) com tetos exponenciais de maestria e bônus racial fixo (+2 pts).
2. Motor e modal da Roleta Esotérica Hardcore (20% base, +10% pity até 80%, cooldown 48h, sem perda de maestria) com círculos mágicos concêntricos em SVG de `docs/design.png`.
3. Mecânica do Festival da Colheita com 2x XP e Altar de Fusão/Sacrifício de habilidades:
   - Detecção determinística de sinergias por domínios e tags com fios de mana em SVG (100% sem IA);
   - Inquisição da G.S em lote com Pílulas de Escolha Rápida (1 toque) e suporte a digitação por voz (Speech-to-Text);
   - Consolidação de Desafio Autodeclarado ancorado no Modo Foco;
   - Fallback offline determinístico via `phrase_bank`.
4. Identidade visual e auras rúnicas para os 7 tiers nos cartões de habilidade.
5. Ferramentas de teste de RNG, cooldown e Altar no Painel Dev.

### Passo 2 — Testes Automáticos (Etapa 10.2)

1. Testes Vitest + `fast-check` para regras da roleta (pity, cooldown, sem perda de maestria) e motor de sinergia de domínios.
2. Testes de componentes no PWA para Roleta, Altar de Fusão com fios de mana e pílulas de resposta rápida.
3. Teste E2E Playwright `e2e/phase10-roulette-and-harvest.spec.ts`.
4. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 10.3)

Marque `[x]` nas etapas 10.1 e 10.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes da roleta e colheita ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 10.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 11 — Sistema de Agenda Independente, Tarefas Recorrentes, Hábitos (Barra 0-100% e Check-in Semanal) e Passivas

#### Escopo nas 4 Partes (Fase 11)

- **1. Desenvolvimento:**
  - Em `packages/game/agenda.ts` e `habits.ts`:
    - **Dois Sistemas Independentes:** Separação estrita entre a **Aba Projetos** (árvores de metas de longo prazo sem hora marcada) e a **Agenda** (rotinas diárias com horário fixo e due date);
    - Modelo de tarefas de agenda com data/horário marcado e prazo final (*due date*);
    - Tarefas recorrentes com frequência diária ou dias específicos da semana (ex: Seg/Qua/Sex) e prazo limite (*repeat_until*);
    - **Barra de Maestria de Hábito (0 a 100%):** Cada conclusão da tarefa da agenda acumula pontos na barra de maestria do hábito correspondente. Ao atingir 100%, consolida-se em **Habilidade Passiva permanente** (concedendo bônus perpétuo no atributo associado);
    - **Check-in Semanal de Manutenção da G.S:** A cada 7 dias, a G.S questiona o caçador se o hábito continua sendo praticado. Se o usuário responder que não, a barra de maestria recua para **75%** e o hábito entra no estado **'Enferrujada'** (bônus passivo pausado temporariamente até recuperar os 100% com novas repetições);
    - Dia lógico `getLogicalDay(now, 4)` com virada às 04:00 da manhã;
    - **Regra de Streak Diário:** O streak avança ao concluir 100% das tarefas/hábitos agendados para aquele dia na Agenda (mínimo de 1 tarefa). Se não houver nenhuma tarefa agendada no dia (dia de descanso planejado), o streak é **congelado e preservado sem quebra**. Se houver tarefas e ficarem pendentes, o streak zera às 04:00 sem escudos.
  - No PWA:
    - **UI da Agenda (Híbrido Home + Visão Completa):**
      - Na aba **Home**: seção destacada de "Hoje / Agenda do Dia" com linha do tempo de compromissos imediatos, hábitos ativos e checklist rápido;
      - **Visão Dedicada de Agenda:** tela/modal completo com visualização diária/semanal, gerenciador de tarefas recorrentes, painel de Hábitos com barra de maestria (0-100%), status 'Enferrujada' e metas da semana/mês rumo ao Festival da Colheita;
    - Modal de Check-in Semanal da G.S com opções estilizadas no tema Dark Fantasy Gilded RPG.
- **2. Testes Automáticos:**
  - Vitest + `fast-check`: virada lógica das 04:00, progressão da barra de maestria do hábito (0-100%), recuo para 75% ('Enferrujada') na resposta negativa do check-in semanal, cálculo de recorrência e congelamento de streak em dias de descanso.
  - Playwright (`e2e/phase11-agenda-habits.spec.ts`): criar tarefa agendada, preencher barra de hábito até 100%, simular check-in semanal e verificar status 'Enferrujada'.
- **3. Testes do Usuário:**
  - Criar tarefas recorrentes na Agenda, testar a barra de maestria do hábito, simular o check-in semanal da G.S e validar a preservação de streak em dia de descanso.
- **4. Debug e Fechamento:**
  - Tratar fusos horários, repetições de calendário e atualizar arquivos de controle.

#### Prompt da Fase 11

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 11 — Sistema de Agenda Independente, Tarefas Recorrentes, Hábitos (Barra 0-100% e Check-in Semanal) e Passivas**.

### Passo 1 — Desenvolvimento (Etapa 11.1)

Marque `[/] 11.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Motor de regras puras de Agenda e Recorrência em `packages/game/agenda.ts` e `habits.ts`: separação independente de projetos, barra de hábito 0-100%, check-in semanal com recuo a 75% ('Enferrujada'), streak com congelamento em dia de descanso e virada às 04:00.
2. Interface híbrida no PWA: Snapshot "Hoje" na Home + Visão Dedicada completa de Agenda/Calendário, painel de Hábitos e modal de check-in semanal.
3. Formulários de agendamento estilizados no tema Dark Fantasy Gilded RPG.

### Passo 2 — Testes Automáticos (Etapa 11.2)

1. Testes Vitest + `fast-check` para barra de hábito, check-in semanal, regras de streak e congelamento em dias sem tarefas.
2. Teste E2E Playwright `e2e/phase11-agenda-habits.spec.ts`.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 11.3)

Marque `[x]` nas etapas 11.1 e 11.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes da Agenda e Hábitos ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 11.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

### Passo 4 — Debug e Fechamento (Etapa 11.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 12 — Rota `/generate`, `phrase_bank` Offline, Agendador 48h (`rescheduleAll`) e Service Worker Sync

#### Escopo nas 4 Partes (Fase 12)

- **1. Desenvolvimento:**
  - Em `packages/shared`: catálogo `phrase_bank` com >= 60 templates de provocações e avisos divididos por categoria e tom da G.S.
  - Em `apps/api`: rota `POST /generate` usando `generateObject` (Gemini Flash) para criar o lote diário de diárias sugeridas e notificações com probabilidade.
  - Em `packages/game/notifications.ts`: função pura `planNotificationsNext48h` calculando notificações para as próximas 48 horas (resumo matinal, provocações, alerta de streak às 21h se < 3 diárias e lembretes de prazo).
  - No cliente PWA:
    - Agendador `rescheduleAll()` sincronizado com Web Notifications / Service Worker;
    - Gatilhos automáticos ao abrir o app e ao alterar missões;
    - Painel Dev com inspeção da fila de 48h e teste de geração offline/online.
- **2. Testes Automáticos:**
  - Vitest: planejamento puro das 48h, filtros de probabilidade e cancelamento do alerta de 21h ao atingir 3 diárias.
  - Vitest na API para `POST /generate`.
- **3. Testes do Usuário:**
  - Testar geração online e fallback em modo offline, conferindo a fila de 48h no Painel Dev.
- **4. Debug e Fechamento:**
  - Ajustar regras de notificações locais e atualizar arquivos de controle.

#### Prompt da Fase 12

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 12 — Rota `/generate`, `phrase_bank` Offline, Agendador 48h (`rescheduleAll`) e Service Worker Sync**.

### Passo 1 — Desenvolvimento (Etapa 12.1)

Marque `[/] 12.1 Desenvolvimento` em `roadmap.md` e implemente:

1. `phrase_bank` com >= 60 templates em `packages/shared`.
2. Rota `POST /generate` em `apps/api`.
3. Planejador puro `planNotificationsNext48h` em `packages/game`.
4. Serviço `rescheduleAll()` integrado ao Service Worker do PWA e controles no Painel Dev.

### Passo 2 — Testes Automáticos (Etapa 12.2)

1. Testes Vitest do planejador de notificações e fallback offline.
2. Testes da rota `/generate` na API.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 12.3)

Marque `[x]` nas etapas 12.1 e 12.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 12.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 13 — Modo Foco (Aceleração de Pensamento): Timer, Notificação e Quebra (>30s Fora)

#### Escopo nas 4 Partes (Fase 13)

- **1. Desenvolvimento:**
  - Em `packages/game/focus.ts`:
    - Conclusão entre 50% e 100% do tempo estimado: **100% XP + bônus de rapidez de até +25%**;
    - Anti-trapaça (< 50% do tempo): sem bônus (100% XP base);
    - Tempo excedido (> 100%): **-10% a cada 25% excedido** (piso 50%);
    - Quebra de foco (`away_ms > 30_000`): saída por **mais de 30 segundos** marca `broken = true` e zera bônus.
  - Tela cheia "Modo Foco" no PWA:
    - Cronômetro visual tecnológico com timestamps reais (`Clock`);
    - Monitoramento com **Page Visibility API (`visibilitychange`)** e eventos de foco/blur: se a aba ficar oculta por <= 30s, avisa com tempo restante; se passar de 30s, marca como quebrada;
    - Notificação persistente no navegador enquanto em foco;
    - Retomada automática da sessão se a página for recarregada.
- **2. Testes Automáticos:**
  - Vitest + `fast-check`: matriz matemática de bônus/penalidade e limiares de tempo fora (29s vs 31s).
  - Testing Library: simulação de `document.visibilityState = 'hidden'` e retomada de sessão.
- **3. Testes do Usuário:**
  - Iniciar foco, minimizar a aba por 10s (confirmar que não quebrou), minimizar por 40s (confirmar que quebrou), recarregar a página e ver timer retomar.
- **4. Debug e Fechamento:**
  - Ajustar sensibilidade de visibilidade e atualizar arquivos de controle.

#### Prompt da Fase 13

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 13 — Modo Foco (Aceleração de Pensamento): Timer, Notificação e Quebra (>30s Fora)**.

### Passo 1 — Desenvolvimento (Etapa 13.1)

Marque `[/] 13.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Em `packages/game/focus.ts`: cálculo puro de XP e regras de quebra por ausência (>30s).
2. Tela cheia do Modo Foco no PWA monitorada pela Page Visibility API, persistência em sessão e notificação web.

### Passo 2 — Testes Automáticos (Etapa 13.2)

1. Testes Vitest + `fast-check` cobrindo a matriz de tempo e quebra de foco.
2. Testes de componentes simulando `visibilitychange`.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 13.3)

Marque `[x]` nas etapas 13.1 e 13.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes do Modo Foco ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 13.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 14 — Backup Automático (`/backup` Vercel Blob), Export/Import JSON Manual e Release v1 (PWA Instalável)

#### Escopo nas 4 Partes (Fase 14)

- **1. Desenvolvimento:**
  - Em `packages/shared`: schema Zod versionado `SlimeSageBackupV1` de todo o banco de dados.
  - No cliente PWA:
    - Funções transacionais `exportDatabaseToJson()` e `importDatabaseFromJson(payload)` com rollback em caso de falha de validação;
    - Botões em Ajustes: Exportar JSON (download de arquivo `.json`), Importar JSON (upload de arquivo), Backup na Nuvem Agora e Restaurar da Nuvem;
    - Backup automático diário na nuvem ao abrir o app se última cópia tiver > 24h;
    - Manifesto PWA final (`manifest.webmanifest`), Service Worker com cache prévio de assets (Workbox), banner de "Instalar Slime Sage" e ícones completos para mobile e desktop.
  - Em `apps/api`: rotas `PUT /backup` e `GET /backup` via `@vercel/blob` com retenção das 14 cópias mais recentes.
- **2. Testes Automáticos:**
  - Vitest: teste Round-Trip Completo (`export -> wipe -> import -> assert deep equal` em todas as tabelas e no ledger).
  - Testes da API de backup e retenção de 14 arquivos.
  - Playwright: suíte completa de regressão E2E.
- **3. Testes do Usuário:**
  - Testar Exportar e Importar JSON localmente, fazer backup e restauração na nuvem e instalar a PWA na tela inicial do celular ou desktop.
- **4. Debug e Fechamento da v1:**
  - Ajustes finais, atualização dos arquivos de controle e declaração oficial de conclusão da **v1 do Slime Sage PWA**.

#### Prompt da Fase 14

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 14 — Backup Automático (`/backup` Vercel Blob), Export/Import JSON Manual e Release v1 (PWA Instalável)**.

### Passo 1 — Desenvolvimento (Etapa 14.1)

Marque `[/] 14.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Schema `SlimeSageBackupV1` em `packages/shared`.
2. Rotas `PUT /backup` e `GET /backup` em `apps/api` com retenção dos 14 backups mais recentes.
3. No PWA: serialização/desserialização JSON com rollback, export/import via Web File API, backup automático em nuvem e manifesto PWA instalável.

### Passo 2 — Testes Automáticos (Etapa 14.2)

1. Teste Vitest de Round-Trip Completo e rejeição de backup inválido.
2. Testes das rotas de backup na API.
3. Execução de toda a suíte de testes unitários e Playwright E2E.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 14.3)

Marque `[x]` nas etapas 14.1 e 14.2 em `roadmap.md` e **PARE**. Apresente o roteiro final de testes de backup e instalação PWA ao usuário.

### Passo 4 — Debug e Fechamento da v1 (Etapa 14.4 — Somente após meu retorno)

Após a aprovação final, atualize `handoff.md`, `feedback.md` e `roadmap.md` declarando a **v1 do Slime Sage PWA concluída**.
```

## 15. Planejamento do Escopo da v2 (Pós-Release v1)

A versão 2 (`v2`) do Slime Sage expandirá a profundidade da gamificação e a gestão temporal com os seguintes módulos:

1. **Missões *Time-Attack* e Contrarrelógio Crítico:** Missões com cronômetro em contagem regressiva ao vivo, gerando bônus de rapidez e títulos sazonais.
2. **Magicules (Energia Mágica / Mana):** Recurso consumível para buffs de concentração e invocações analíticas especiais da G.S.
3. **Drops & Gifts:** Saques e recompensas materiais/digitais especiais por projetos concluídos com louvor.
4. **Debuffs do Sistema:** Penalidades temporárias aplicadas quando prazos expiram sucessivamente.
5. **Habilidade Suprema (*Ultimate Skill*):** O despertar definitivo com rituais de fusão e sacrifício de múltiplas habilidades únicas.
