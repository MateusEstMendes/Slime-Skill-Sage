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
| **Onboarding e Voz (TTS)**      | **5 perguntas fixas offline** (pontuando traços localmente). **Todas as 5 perguntas e a revelação da classe inicial são narradas pela G.S** usando a **Web Speech API nativa (`window.speechSynthesis`)** em `pt-BR` (voz gratuita e integrada do sistema operacional/navegador)                                                                                                                                                                                                                                                           |
| **Roleta na v1**                | Aplicada na transição **Extra → Única**: exige **300 de maestria** + **1 projeto concluído** que concedeu a habilidade. Chance inicial de **30%**, **+15%** por falha, teto de **95%**, cooldown de **24h**. Habilidade **Suprema** fica para a v2                                                                                                                                                                                                                                                                                         |
| **Valores Numéricos (Seção 8)** | XP por missão (dif. 1–5): **10 / 20 / 35 / 55 / 80** · Curva de nível: `round(100 * n^1.5)` · Comum→Extra: **100** maestria · Extra→Única: **300** maestria + projeto · Classes (patamares 2 a 5): **150 / 500 / 1200 / 3000** maestria na área · Diárias: 3 a 5 por dia (+50% XP ao completar todas) · Streak sem escudo (≥ 3 diárias/dia, +2% XP/dia até +30%) · Modo Foco: bônus até +25% (mín. 50% do tempo estimado), penalidade -10% a cada 25% excedido (piso 50%), quebra ao sair da aba/PWA por **> 30s** via Page Visibility API |
| **Virada do Dia**               | **04:00 da manhã** por padrão (configurável em Ajustes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Escopo v1 vs. v2**            | **v1:** Onboarding (5 perguntas + TTS), Chat G.S Coordenador com confirmação, Projetos/Árvore de Missões, Habilidades até Única com Roleta, Classes + Desafio Autodeclarado, Diárias + Streak sem escudo, Notificações locais/Web Push 48h + Voz do Mundo, Modo Foco e Backup JSON/Cloud. **v2:** Agendamento de Fim de Projetos/Atividades (Deadlines/Due Dates, Missões *Time-Attack* com bônus de pontualidade/debuff de atraso e Milestones cronológicos no calendário), Magicules, Drops/Gifts, Debuffs, Festival da Colheita + Suprema |
| **Arquivos de Controle**        | `roadmap.md` (progresso geral das fases e sub-etapas), `handoff.md` (mudanças da fase, arquivos tocados, estado dos testes automáticos e contexto para a próxima fase) e `feedback.md` (histórico de feedbacks dos testes do usuário e correções de debug)                                                                                                                                                                                                                                                                                 |

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

## Fase 10 — Evolução de Habilidade (Extra → Única) e Roleta Animada (SVG + Framer Motion + Cooldown 24h)

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

Você é o Engenheiro Principal responsável por construir o aplicativo **Slime Sage Skill** (`S.S.S`), um gestor de projetos pessoal gamificado em formato **Progressive Web App (PWA)** instalável e responsivo para mobile/desktop, inspirado no sistema de habilidades de _Tensura_ (Grande Sábio / Voz do Mundo) e visual de "Sistema" (_Solo Leveling_).

## 1. ARQUITETURA E STACK OBRIGATÓRIA

- **Monorepo:** `pnpm` + `Turborepo` (`apps/pwa`, `apps/api`, `packages/shared`, `packages/game`, `e2e`, `evals`).
- **PWA Client (`apps/pwa`):**
  - Vite + React 19 + TypeScript strict.
  - Tailwind CSS + Framer Motion (animações de Sistema fluidas a 60fps/120fps) + Lucide React.
  - `vite-plugin-pwa` (Workbox) com manifesto completo (`display: standalone`, tema `#050811`, ícones adaptativos) e Service Worker para operação 100% offline.
  - Armazenamento local: IndexedDB / SQLite-WASM com schema relacional e auditoria total.
  - Web Speech API (`window.speechSynthesis`) nativa em `pt-BR` para narração pela G.S e Voz do Mundo.
  - Web Audio API para efeitos sonoros e `navigator.vibrate` para feedback tátil em dispositivos móveis compatíveis.
  - Web Notifications API para alertas do sistema e Service Worker notifications.
  - Page Visibility API (`document.visibilityState`) para detecção precisa de quebra de foco (>30s fora).
- **Backend (`apps/api`):** Hono na Vercel com 4 rotas (`/health`, `POST /chat`, `POST /generate`, `PUT/GET /backup`), middleware Bearer Token (`APP_SECRET`), Vercel AI SDK (`@ai-sdk/google` com Gemini Flash e Pro) e `@vercel/blob`.
- **Pacotes Compartilhados:**
  - `packages/shared`: Schemas Zod de todas as tools, payloads, snapshot de memória, prompts da G.S e banco de frases offline (`phrase_bank`).
  - `packages/game`: Motor de regras 100% puro (zero dependências de DOM ou banco), recebendo `Clock` (`now`) e `Rng` (`nextFloat`) por injeção de dependência. Cobertura de testes obrigatória >= 90%.

## 2. REGRAS DE OURO DO SISTEMA

1. **A IA propõe, o Motor decide:** A G.S nunca concede XP, níveis ou maestria diretamente. Toda escrita proposta pela IA no chat exige aprovação explícita do usuário em um **Cartão de Prévia (Aceitar / Recusar / Pedir ajuste)**.
2. **Auditabilidade Total (Ledger):** Toda alteração de XP ou maestria gera um registro imutável na tabela `xp_event`. O XP total e a maestria devem sempre bater com a soma do ledger.
3. **Offline-First e Injeção de Tempo/Sorte:** O app funciona offline (exceto chat e geração com IA, que possuem fallbacks determinísticos locais). Nunca use `Date.now()` ou `Math.random()` diretamente nas regras de negócio: use sempre `Clock` e `Rng` injetáveis.
4. **Código Limpo e Autoexplicativo:** Escreva código modular, fortemente tipado (TypeScript strict, sem `any`) e sem comentários óbvios.
5. **Escopo Congelado da v1:**
   - Questionário de Onboarding com **5 perguntas fixas offline**, narradas via Web Speech API (`speechSynthesis` em `pt-BR`), seguido da revelação da classe inicial.
   - Evolução de habilidades na v1 vai de **Comum (0) → Extra (100 maestria) → Única (300 maestria + 1 projeto concluído + Roleta com 30% base, +15% por falha, teto 95%, cooldown 24h)**.
   - Virada do dia padrão às **04:00 da manhã**. Streak sem escudo (exige >= 3 missões diárias concluídas no dia lógico).
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
  - Criar `apps/pwa` (Vite + React 19 + TypeScript + Tailwind CSS + `vite-plugin-pwa` configurado com manifesto e ícones de tema escuro).
  - Criar a tela de **Primeiro Acesso (Token Secreto)** na PWA: input seguro estilizado no tema "Sistema", campo para URL da API (padrão local ou prod), botão "Conectar ao Sistema" que valida em `GET /health`, salva o token em storage local seguro e redireciona para a Home placeholder.
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
3. `apps/pwa`: aplicação Vite + React 19 + Tailwind CSS + `vite-plugin-pwa` (manifesto PWA com `display: standalone` e tema escuro `#050811`).
4. Fluxo de autenticação na PWA: ao abrir, verifica se há token salvo no storage. Se não houver, exibe a tela "Conexão com o Sistema" (tema escuro ciano/azul) que testa o token contra `GET /health`, salva em caso de sucesso e navega para a tela inicial placeholder.

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

### Fase 3 — Design System "Sistema", Navegação por Abas e CRUD Manual de Projetos/Missões

#### Escopo nas 4 Partes (Fase 3)

- **1. Desenvolvimento:**
  - Design System **"Sistema"** (inspirado em _Solo Leveling_ / _Tensura_): fundo `#050811`, bordas ciano neon (`#00f3ff`), superfícies translúcidas com blur de vidro (`backdrop-blur-md`), tipografia mono tech (`JetBrains Mono` / `Share Tech Mono`) e feedback sonoro/tátil leve (`navigator.vibrate` em toque).
  - Componentes base: `SystemPanel`, `SystemButton`, `SystemBadge`, `SystemModal`, `SystemInput`, `SystemHeader`.
  - Navegação pelas 5 abas principais: **Home · Projetos · Habilidades · Status · G.S** (com botão flutuante rápido para a G.S).
  - Telas completas da aba **Projetos**: listagem por área com progresso percentual, visualizador de **Árvore de Missões** (com status `bloqueada` com cadeado, `disponivel` brilhante e `feita`), modal de detalhe da missão e formulário de criação/edição com seleção de dependências.
- **2. Testes Automáticos:**
  - Vitest + Testing Library: renderização do card de missão nos 3 estados, bloqueio do botão de concluir em missões bloqueadas, formulários de criação.
  - Playwright (`e2e/phase3-projects.spec.ts`): fluxo completo no navegador criando projeto, missões dependentes e verificando desbloqueio.
- **3. Testes do Usuário:**
  - Navegar pelas 5 abas conferindo tema visual dark neon, criar um projeto manualmente com missões dependentes e validar desbloqueio.
- **4. Debug e Fechamento:**
  - Ajustes de layout, responsividade mobile/desktop e fechamento da fase.

#### Prompt da Fase 3

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 3 — Design System "Sistema", Navegação por Abas e CRUD Manual de Projetos/Missões**.

### Passo 1 — Desenvolvimento (Etapa 3.1)

Marque `[/] 3.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Componentes do Design System "Sistema" com Tailwind CSS e Framer Motion.
2. Navegação de 5 abas (Home, Projetos, Habilidades, Status, G.S) + botão flutuante.
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



### Fase 5 — Voz do Mundo (Modal + Haptics + Som + Web TTS) e Telas de Status e Habilidades

#### Escopo nas 4 Partes (Fase 5)

- **1. Desenvolvimento:**
  - Fila e modal temático da **Voz do Mundo** (`WorldVoiceModal`):
    - Dispara em `SKILL_ACQUIRED`, `SKILL_EVOLVED_EXTRA` e `LEVEL_UP`;
    - Modal animado com Framer Motion (efeitos de partículas e glow ciano/dourado), som de sistema via Web Audio API, vibração tátil via `navigator.vibrate` e narração automática via **Web Speech API (`speechSynthesis`)** em `pt-BR` (com toggle em Ajustes);
  - Aba **Habilidades**: listagem por área, badge de nível (`Comum`, `Extra`, `Única`), progresso de maestria e modal de histórico de missões vinculadas.
  - Aba **Status**: nível geral, barra de XP, gráfico radar em SVG com os 5 atributos (`INT`, `FOR`, `DIS`, `CRI`, `SOC`), título atual e extrato recente do ledger.
- **2. Testes Automáticos:**
  - Vitest + Testing Library: fila da Voz do Mundo, chamada ao `speechSynthesis` e renderização do radar SVG.
  - Playwright (`e2e/phase5-world-voice.spec.ts`): concluir missão → verificar aparição do modal da Voz do Mundo → verificar atualização das abas Habilidades e Status.
- **3. Testes do Usuário:**
  - Concluir missões no navegador, ouvir a narração em português, ver a animação e inspecionar as abas de Habilidades e Status.
- **4. Debug e Fechamento:**
  - Ajustar entonação da voz ou animação e atualizar arquivos de controle.

#### Prompt da Fase 5

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 5 — Voz do Mundo (Modal + Haptics + Som + Web TTS) e Telas de Status e Habilidades**.

### Passo 1 — Desenvolvimento (Etapa 5.1)

Marque `[/] 5.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Sistema de fila e modal dramático da **Voz do Mundo** com Framer Motion, Web Audio API, `navigator.vibrate` e narração via Web Speech API (`pt-BR`).
2. Aba Habilidades com barras de maestria e filtro por área.
3. Aba Status com gráfico radar SVG dos 5 atributos e extrato do ledger.

### Passo 2 — Testes Automáticos (Etapa 5.2)

1. Testes de componentes para a fila da Voz do Mundo e telas de Status/Habilidades.
2. Teste E2E Playwright `e2e/phase5-world-voice.spec.ts`.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 5.3)

Marque `[x]` nas etapas 5.1 e 5.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 5.4 — Somente após meu retorno)

Após validação, feche a fase nos arquivos de controle.
```

---

### Fase 6 — Backend `/chat` (Streaming + Tools Schema) e Cliente de Chat com Cartões de Prévia

#### Escopo nas 4 Partes (Fase 6)

- **1. Desenvolvimento:**
  - Em `packages/shared`: schemas Zod das tools de leitura (`get_profile`, `list_skills`, `list_classes`, `list_projects`, `get_project`, `search_missions`) e de escrita (`create_project_tree`, `add_missions`, `update_mission`, `reschedule_mission`, `delete_mission`, `propose_class_challenge`, `name_class`, `name_unique_skill`).
  - Em `apps/api`: rota `POST /chat` com `streamText` (`@ai-sdk/google`), tools sem execução no backend, proteção por token Bearer e limites de payload.
  - No cliente PWA:
    - Persistência de threads em `chat_thread` e `chat_message`;
    - Cliente de chat com streaming real via `fetch` e Vercel AI SDK;
    - Execução silenciosa de tools de leitura no banco local;
    - **Cartões de Prévia Interativos** para tools de escrita com botões **Aceitar**, **Recusar** e **Pedir Ajuste**.
- **2. Testes Automáticos:**
  - Vitest na API com modelo mockado (`ai/test`): streaming, emissão de tool calls e validação de token (401).
  - Vitest + Testing Library no PWA: teste dos 3 fluxos do Cartão de Confirmação (Aceitar grava no banco; Recusar não grava; Pedir Ajuste devolve justificativa na tool result).
- **3. Testes do Usuário:**
  - Conversar com a G.S pedindo para adicionar uma missão, verificar a exibição do Cartão de Prévia, testar Pedir Ajuste e Aceitar.
- **4. Debug e Fechamento:**
  - Ajustar streaming e serialização e atualizar arquivos de controle.

#### Prompt da Fase 6

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 6 — Backend `/chat` (Streaming + Tools Schema) e Cliente de Chat com Cartões de Prévia**.

### Passo 1 — Desenvolvimento (Etapa 6.1)

Marque `[/] 6.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Schemas Zod de todas as tools em `packages/shared`.
2. Rota `POST /chat` em `apps/api` com streaming e tools sem execução no servidor.
3. Cliente de chat no PWA com suporte a streaming, execução local de tools de leitura e Cartão de Prévia interativo para tools de escrita (Aceitar / Recusar / Pedir Ajuste).

### Passo 2 — Testes Automáticos (Etapa 6.2)

1. Testes Vitest na API para streaming e tool calls.
2. Testes de componentes no PWA para o Cartão de Prévia.
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

### Fase 8 — Onboarding: 5 Perguntas Narradas por Web TTS, Revelação de Classe e 1ª Conquista

#### Escopo nas 4 Partes (Fase 8)

- **1. Desenvolvimento:**
  - Fluxo de Onboarding em 4 etapas (quando `profile.onboarding_done === false`):
    1. **Questionário de Personalidade (5 Perguntas Fixas Offline + Web TTS):**
       - 5 perguntas avaliando traços, área inicial e tom da G.S. Cada pergunta é narrada em voz alta pela Web Speech API em `pt-BR`.
    2. **Revelação da Classe Inicial (Voz do Mundo + Web TTS):**
       - Cálculo determinístico da Área e Classe inicial (Patamar 1 — Aprendiz) com narração épica da Voz do Mundo.
    3. **Objetivo de Uso e Permissões:**
       - Escolha de objetivo e solicitação guiada de permissão de notificações no navegador.
    4. **Primeira Conquista:**
       - Tela da G.S perguntando (e narrando): _"Qual é a primeira coisa que você deseja conquistar?"_, abrindo a primeira entrevista no Modo Coordenador e marcando `onboarding_done = true`.
  - Botão "Resetar Onboarding" no Painel Dev.
- **2. Testes Automáticos:**
  - Vitest: matriz determinística das 5 perguntas e fallback offline.
  - Testing Library: renderização das 5 perguntas e disparo do `speechSynthesis`.
  - Playwright (`e2e/phase8-onboarding.spec.ts`): fluxo completo do onboarding de ponta a ponta.
- **3. Testes do Usuário:**
  - Resetar onboarding pelo Painel Dev, completar as 5 perguntas ouvindo a voz do navegador, conferir a revelação da classe e iniciar o primeiro projeto.
- **4. Debug e Fechamento:**
  - Ajustar cadência da voz ou textos e atualizar arquivos de controle.

#### Prompt da Fase 8

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 8 — Onboarding: 5 Perguntas Narradas por Web TTS, Revelação de Classe e 1ª Conquista**.

### Passo 1 — Desenvolvimento (Etapa 8.1)

Marque `[/] 8.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Motor determinístico das 5 perguntas de personalidade em `packages/game`.
2. Fluxo de 4 telas de onboarding no PWA com narração por Web Speech API (`pt-BR`).
3. Botão "Resetar Onboarding" no Painel Dev.

### Passo 2 — Testes Automáticos (Etapa 8.2)

1. Testes Vitest do motor determinístico.
2. Testes de componentes para disparo de áudio TTS e navegação.
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

### Fase 10 — Evolução de Habilidade (Extra → Única) e Roleta Animada (SVG + Framer Motion + Cooldown 24h)

#### Escopo nas 4 Partes (Fase 10)

- **1. Desenvolvimento:**
  - Em `packages/game/roulette.ts`:
    - Elegibilidade Extra → Única: nível `extra`, **>= 300 de maestria** e **pelo menos 1 projeto concluído** que concedeu pontos à habilidade;
    - Cálculo de chance da roleta: base **30%**, **+15% por falha anterior**, **teto de 95%**;
    - Cooldown de **24 horas** após falha (`Clock` injetável);
    - Histórico registrado em `evolution_attempt`.
  - Tela/Modal da Roleta no PWA:
    - Roda gráfica circular em SVG animada com Framer Motion a 60fps/120fps com setores proporcionais à chance atual;
    - Efeito de desaceleração suave, som via Web Audio API e vibração via `navigator.vibrate`;
    - Falha: cooldown de 24h e chance ampliada anunciada pela Voz do Mundo;
    - Sucesso: nome épico via `name_unique_skill`, promoção para `unica` e grande celebração da Voz do Mundo via Web TTS.
  - Painel Dev: RNG Fixo ("Forçar Sucesso" / "Forçar Falha") e botão "Zerar Cooldown".
- **2. Testes Automáticos:**
  - Vitest + `fast-check`: monotonicidade da chance (30→45→...→95%), cooldown exato e exigência de projeto concluído.
  - Testing Library: estados da roleta (`inelegivel`, `pronta`, `girando`, `em_cooldown`, `sucesso`).
  - Playwright (`e2e/phase10-roulette.spec.ts`): teste de falha (30%→45% + cooldown) e sucesso após avançar 24h.
- **3. Testes do Usuário:**
  - Tornar uma habilidade elegível, girar a roleta, testar falha e sucesso forçados e conquistar a primeira Habilidade Única.
- **4. Debug e Fechamento:**
  - Ajustar curva de animação e haptics e atualizar arquivos de controle.

#### Prompt da Fase 10

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 10 — Evolução de Habilidade (Extra → Única) e Roleta Animada (SVG + Framer Motion + Cooldown 24h)**.

### Passo 1 — Desenvolvimento (Etapa 10.1)

Marque `[/] 10.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Regras puras da roleta em `packages/game/roulette.ts` (300 maestria + projeto concluído, 30% + 15% até 95%, cooldown 24h).
2. Modal da Roleta de Evolução no PWA em SVG + Framer Motion com som Web Audio API e vibração.
3. Integração com `name_unique_skill` e celebração na Voz do Mundo.
4. Controles de RNG e cooldown no Painel Dev.

### Passo 2 — Testes Automáticos (Etapa 10.2)

1. Testes Vitest + `fast-check` para regras da roleta e cooldown.
2. Testes de componentes para a roleta.
3. Teste E2E Playwright `e2e/phase10-roulette.spec.ts`.
4. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 10.3)

Marque `[x]` nas etapas 10.1 e 10.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes da roleta ao usuário.

### Passo 4 — Debug e Fechamento (Etapa 10.4 — Somente após meu retorno)

Atualize os arquivos de controle após o retorno do usuário.
```

---

### Fase 11 — Motor de Missões Diárias, Virada às 04:00, Streak Sem Escudo e UI na Home

#### Escopo nas 4 Partes (Fase 11)

- **1. Desenvolvimento:**
  - Em `packages/game/daily.ts` e `streak.ts`:
    - Dia lógico `getLogicalDay(now, 4)` com virada padrão às 04:00 da manhã;
    - Gerador determinístico offline de 3 a 5 missões diárias balanceadas;
    - Bônus de diárias completas: **+50% do XP** das diárias do dia ao concluir 100%;
    - Streak sem escudo: exige **>= 3 diárias concluídas** no dia lógico; se virar com < 3, `streak_days` **zera para 0**;
    - Bônus de streak: **+2% de XP por dia de streak**, com **teto de +30%** (15+ dias).
  - Na tela Home do PWA:
    - Seção de Missões Diárias com checklist rápido, progresso do bônus de +50% e chama de Streak;
    - Banner de risco de perda de streak à noite.
- **2. Testes Automáticos:**
  - Vitest + `fast-check` com `FakeClock`: fronteira 03:59 vs 04:00, progressão de streak e perda imediata com 2 diárias.
  - Playwright (`e2e/phase11-daily-streak.spec.ts`): validar ganho e perda de streak com viagem no tempo.
- **3. Testes do Usuário:**
  - Concluir diárias na Home, verificar bônus de +50%, usar controles de tempo do Painel Dev para ver a virada das 04:00 ao vivo.
- **4. Debug e Fechamento:**
  - Tratar inconsistências de fuso horário e atualizar arquivos de controle.

#### Prompt da Fase 11

```markdown
Leia `handoff.md`, `roadmap.md` e `feedback.md`. Vamos iniciar a **Fase 11 — Motor de Missões Diárias, Virada às 04:00, Streak Sem Escudo e UI na Home**.

### Passo 1 — Desenvolvimento (Etapa 11.1)

Marque `[/] 11.1 Desenvolvimento` em `roadmap.md` e implemente:

1. Em `packages/game`: dia lógico às 04:00, gerador de diárias, streak sem escudo e bônus no ledger.
2. Na Home do PWA: checklist de diárias, chama de streak e alerta de risco noturno.

### Passo 2 — Testes Automáticos (Etapa 11.2)

1. Testes Vitest + `fast-check` com `FakeClock` para limites das 04:00 e regras de streak.
2. Teste E2E Playwright `e2e/phase11-daily-streak.spec.ts`.
3. Execute `pnpm lint`, `pnpm typecheck` e `pnpm test`.

### Passo 3 — Pausa Obrigatória para Testes do Usuário (Etapa 11.3)

Marque `[x]` nas etapas 11.1 e 11.2 em `roadmap.md` e **PARE**. Apresente o roteiro de testes ao usuário.

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

1. **Agendamento de Prazos e Término de Projetos/Atividades:**
   - **`deadline` / `due_date`:** Definição opcional de data e hora limite para conclusão de projetos inteiros ou missões específicas.
   - **Missões *Time-Attack* (Contrarrelógio do Sistema):** Missões com prazo crítico gerando alerta urgente da Grande Sábio. Conclusão dentro do prazo concede bônus de XP/Maestria e título comemorativo; estouro do prazo gera status de "Atrasada" e acúmulo de debuff de procrastinação.
   - **Milestones (Marcos Cronológicos):** Visualização em linha do tempo / calendário distribuindo missões da árvore DAG até a data final de entrega do projeto.
2. **Magicules (Energia Mágica / Mana):** Recurso consumível para buffs de concentração e invocações analíticas da G.S.
3. **Drops & Gifts:** Saques e recompensas materiais/digitais especiais por projetos concluídos com louvor.
4. **Debuffs do Sistema:** Penalidades temporárias aplicadas quando prazos expiram sucessivamente.
5. **Festival da Colheita & Habilidade Suprema (*Ultimate Skill*):** O despertar definitivo com rituais de fusão e sacrifício de habilidades únicas.
