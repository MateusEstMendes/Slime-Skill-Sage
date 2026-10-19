# Handoff Técnico — Slime Sage (PWA)

## Status Atual

- **Última Fase Concluída:** Fase 7 — Modo Coordenador da G.S, Validação Anti-Duplicatas, Snapshot de Memória, Densificação de Atividades e Áudios Oficiais de Projeto
- **Próxima Fase:** Fase 8 — Onboarding: Apresentação da G.S com Áudios Oficiais, Typewriter e Revelação Inicial via API
- **Data da Atualização:** 2026-10-19

## Histórico de Fases Concluídas

### Fase 0 — Fundação do Monorepo, API Base (`/health`) e Token Secreto

- **Mudanças Implementadas:**
  - Configuração do monorepo Turborepo + pnpm com TypeScript strict, ESLint 9/10 (flat config), Prettier e GitHub Actions CI (`.github/workflows/ci.yml`).
  - Criação de `packages/shared` com schemas Zod (`HealthResponseSchema`, `ErrorResponseSchema`) e tipagem inferida estrita.
  - Criação de `packages/game` com contratos de injeção de dependência (`Clock`, `Rng`) e implementações determinísticas puras (`SystemClock`, `MathRng`).
  - Criação de `apps/api` (servidor Hono) com middleware Bearer Token (`auth.ts`), endpoint `GET /health` e headers de CORS.
  - Criação de `apps/pwa` (Vite + React 19 + Tailwind CSS + `vite-plugin-pwa`) com tema escuro `#050811`, manifesto PWA completo, ícones adaptativos SVG/PNG e Workbox Service Worker precache.
  - Tela de Primeiro Acesso ("Conexão com o Sistema") com validação de token em tempo real, tratamento de erro visual do Sistema e persistência local segura (`authStorage.ts`).
  - Configuração de proxy reverso no Vite (`/api` -> `http://127.0.0.1:3000`) e suporte inteligente com fallback para ambientes em nuvem (GitHub Codespaces).
- **Arquivos Criados / Modificados:**
  - `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.js` — [tooling e configuração do monorepo]
  - `.github/workflows/ci.yml` — [pipeline de integração contínua: lint, typecheck, test]
  - `packages/shared/src/index.ts`, `packages/shared/src/index.test.ts` — [schemas Zod e testes unitários]
  - `packages/game/src/index.ts`, `packages/game/src/index.test.ts` — [contratos de motor puro e testes]
  - `apps/api/src/index.ts`, `apps/api/src/auth.ts`, `apps/api/src/server.ts`, `apps/api/src/index.test.ts` — [API Hono, auth middleware e testes]
  - `apps/pwa/src/App.tsx`, `apps/pwa/src/components/TokenAuthScreen.tsx`, `apps/pwa/src/components/HomeScreen.tsx` — [UI PWA e fluxo de autenticação]
  - `apps/pwa/src/services/apiClient.ts`, `apps/pwa/src/services/authStorage.ts` — [cliente HTTP e storage local]
  - `apps/pwa/vite.config.ts`, `apps/pwa/public/*` — [configuração PWA, Service Worker e assets de ícones]
  - `apps/pwa/src/components/TokenAuthScreen.test.tsx` — [testes de componentes e integração]
  - `roadmap.md`, `feedback.md`, `handoff.md`, `README.md` — [governança e documentação]

### Fase 1 — Logger Local, Error Boundary, Painel Dev e Spike de Notificações + TTS

- **Mudanças Implementadas:**
  - Persistência local de telemetria em IndexedDB (`slime_sage_db`) com stores `app_log` (limite rotativo estrito de 2.000 entradas mais recentes ordenadas por timestamp) e `kv` chave-valor em [`apps/pwa/src/services/db.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/db.ts).
  - Schemas Zod e tipagens estritas em [`packages/shared/src/index.ts`](file:///workspaces/Skill-Grinding/packages/shared/src/index.ts): `LogScope` (`ai`, `notif`, `game`, `db`, `focus`, `backup`, `tts`), `LogLevel`, `AppLogEntry` e `KvEntry`.
  - Serviço de log auditável [`logger.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/logger.ts) com prefixo temático `[SISTEMA // <ESCOPO>]`, gravação no banco local e padrão de assinantes em tempo real.
  - Componente global [`SystemErrorBoundary.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/SystemErrorBoundary.tsx) temático (*"A Voz do Mundo detectou uma anomalia"*), com ações de recuperação, recarregamento, cópia de diagnóstico e download de logs em `.json`.
  - Utilitário [`ttsService.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/ttsService.ts) com detecção e seleção de vozes pt-BR nativas, e normalizador fonético [`phoneticNormalizer.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/phoneticNormalizer.ts) para termos em inglês (*"Slime Séidji"*, *"Xis Pê"*, *"Isquil"*, etc.).
  - Decisão arquitetural de áudio fixada com o usuário: voz neural **`Kore`** da API do Gemini como voz padrão oficial para a G.S e Voz do Mundo (com o TTS local atuando como fallback offline).
  - Utilitário [`notificationService.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/notificationService.ts) com compatibilidade mobile via `ServiceWorkerRegistration.showNotification()` e fallback desktop.
  - [`SettingsModal.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/SettingsModal.tsx) com gesto de 7 toques no selo de versão, e [`DevPanel.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/DevPanel.tsx) com abas para inspeção/filtro/exportação de logs, teste de TTS da G.S e disparo de Web Notifications.
- **Arquivos Criados / Modificados:**
  - `packages/shared/src/index.ts`, `packages/shared/src/index.test.ts` — [schemas de logs e KV]
  - `apps/pwa/src/services/db.ts`, `apps/pwa/src/services/logger.ts`, `apps/pwa/src/services/logger.test.ts` — [IndexedDB e serviço logger com rotação de 2.000 logs]
  - `apps/pwa/src/services/phoneticNormalizer.ts`, `apps/pwa/src/services/phoneticNormalizer.test.ts` — [normalizador fonético pt-BR]
  - `apps/pwa/src/services/ttsService.ts`, `apps/pwa/src/services/ttsService.test.ts` — [síntese de voz com Web Speech API]
  - `apps/pwa/src/services/notificationService.ts`, `apps/pwa/src/services/notificationService.test.ts` — [Web Notifications com Service Worker]
  - `apps/pwa/src/components/SystemErrorBoundary.tsx`, `apps/pwa/src/components/SystemErrorBoundary.test.tsx` — [error boundary visual do Sistema]
  - `apps/pwa/src/components/DevPanel.tsx`, `apps/pwa/src/components/DevPanel.test.tsx` — [painel dev e gesto de 7 cliques]
  - `apps/pwa/src/components/SettingsModal.tsx`, `apps/pwa/src/components/HomeScreen.tsx`, `apps/pwa/src/App.tsx` — [integrações na UI]
  - `apps/pwa/src/test/setup.ts`, `apps/pwa/vite.config.ts` — [mocks para testes e devOptions no VitePWA]
  - `roadmap.md`, `feedback.md`, `handoff.md` — [governança e fechamento da fase]
- **Estado dos Testes Automáticos:**
  - Suítes passando: 10/10 | Testes passando: 33/33 | Cobertura: 100% OK
    - `@slime-sage/shared`: 4/4 testes
    - `@slime-sage/game`: 2/2 testes
    - `@slime-sage/api`: 3/3 testes
    - `@slime-sage/pwa`: 24/24 testes
- **Pontos de Atenção para a Próxima Fase (Fase 2):**
  - Modelar as tabelas/stores relacionais do banco local: `project`, `mission`, `skill`, `attribute`, `xp_event` (ledger imutável).
  - Implementar sistema de migrations versionadas determinísticas.
  - Criar repositórios tipados para operações CRUD de projetos e missões.

### Fase 2 — Banco de Dados Local, Migrations e Repositórios de Projetos/Missões

- **Mudanças Implementadas:**
  - Modelagem do schema relacional Zod completo em [`packages/shared/src/index.ts`](file:///workspaces/Skill-Grinding/packages/shared/src/index.ts) para todas as 19 tabelas (`profile` com `onboarding_done`, `area` com 5 áreas base, `class`, `class_challenge`, `skill`, `evolution_attempt`, `project`, `mission`, `mission_dep`, `mission_reward`, `daily_mission`, `focus_session`, `xp_event`, `chat_thread`, `chat_message`, `scheduled_notification`, `phrase_bank`, `app_log` e `kv`).
  - Motor de regras puro de DAG acíclico em [`packages/game/src/missionGraph.ts`](file:///workspaces/Skill-Grinding/packages/game/src/missionGraph.ts): detecção rigorosa de ciclos diretos (`A -> B -> A`), indiretos (`A -> B -> C -> A`) e auto-ciclos (`A -> A`) via DFS com classe customizada `CycleDetectedError`; ordenação topológica (Kahn); e função pura `recalculateMissionStatuses` para desbloqueio automático em cascata e reversão ao desfazer.
  - Migração para versão 2 do IndexedDB com criação de stores relacionais e índices em [`apps/pwa/src/services/db.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/db.ts), com otimização transacional multi-store para `resetDatabase()` e `getTableCounts()`, além de seed padrão automático das 5 áreas base (`BASE_AREAS`).
  - Monotonicidade cronológica estrita em [`apps/pwa/src/services/logger.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/logger.ts) para assegurar ordenação precisa de logs mesmo em loops assíncronos intensos.
  - Repositório transacional completo [`apps/pwa/src/services/projectRepository.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/projectRepository.ts) com CRUD de projetos e missões, criação de árvores de dependência validadas, transições de status (`bloqueada`, `disponivel`, `feita`), recálculo automático de progresso do projeto e soft delete (`deleted_at`).
  - Aba "Banco de Dados Local" adicionada ao [`DevPanel.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/DevPanel.tsx) com contador em tempo real das 19 tabelas, botão de **"Semear Dados de Exemplo (Seed)"** e **"Apagar Tudo (Reset DB)"**.
- **Arquivos Criados / Modificados:**
  - `packages/shared/src/index.ts`, `packages/shared/src/index.test.ts` — [schema relacional e campo onboarding_done]
  - `packages/game/src/missionGraph.ts`, `packages/game/src/missionGraph.test.ts`, `packages/game/src/index.ts` — [motor puro de DAG acíclico e recálculo de status]
  - `apps/pwa/src/services/db.ts`, `apps/pwa/src/services/db.test.ts` — [IndexedDB v2, CRUD genérico, seed, reset e contagens atômicas]
  - `apps/pwa/src/services/projectRepository.ts`, `apps/pwa/src/services/projectRepository.test.ts` — [repositório transacional de projetos e missões]
  - `apps/pwa/src/services/logger.ts` — [timestamp estritamente monotônico para logs]
  - `apps/pwa/src/components/DevPanel.tsx`, `apps/pwa/src/components/DevPanel.test.tsx` — [aba de Banco de Dados Local com ações de seed e reset]
  - `eslint.config.js` — [inclusão de dev-dist nos ignores do linter]
  - `roadmap.md`, `feedback.md`, `handoff.md` — [governança e fechamento da fase]
- **Estado dos Testes Automáticos:**
  - Suítes passando: 13/13 | Testes passando: 64/64 | Lint e Typecheck: 100% OK
    - `@slime-sage/shared`: 8/8 testes
    - `@slime-sage/game`: 16/16 testes
    - `@slime-sage/api`: 3/3 testes
    - `@slime-sage/pwa`: 37/37 testes
### Fase 3 — Design System "Sistema" (Dark Fantasy Gilded RPG — Runas, Linhas Retas e Cantoneiras Góticas), Navegação por Abas e CRUD Manual de Projetos/Missões

- **Mudanças Implementadas:**
  - Design System temático do "Sistema" com estética **Dark Fantasy Gilded RPG** (baseada em `docs/design.png`): paleta obsidiana cósmica `#040814` / `#060e20`, ouro antigo e brilhante (`#dfa86c`, `#fde047`, `#c89b55`, `#966422`), tipografia serifada épica `Cinzel` para títulos/cabeçalhos combinada com `JetBrains Mono` para dados/telemetria.
  - **Bordas Retas (`rounded-none`)**: Eliminação de cantos arredondados em todos os containers, painéis (`SystemPanel`), cartões (skills, missões, projetos) e modais, mantendo cantos chanfrados/ergonômicos apenas nos botões menores (`SystemButton`).
  - **Inscrições Mágicas Rúnicas**: Componente [`GildedCorners.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/GildedCorners.tsx) enriquecido com inscrições nórdicas em Elder Futhark (`withRunes`, `runicTop`, `runicBottom`), entalhes centrais luminosos no topo e base (`withCenterNotches`), glifos `✦` nas laterais e brilho reativo ao foco/hover (`group-hover:opacity-90 transition-all drop-shadow-[0_0_4px_currentColor]`).
  - **Skill Cards Aprimorados**: Espaçamento e respiro expandidos com padding exato de `p-[18px]` e separação vertical de `space-y-5`. Runas arcanas temáticas por grau: Comum (`᚛ ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚜` / `✦ ᛋ ᛚ ᛁ ᛗ ᛖ · ᛋ ᚨ ᚷ ᛖ ✦`), Extra (`᚛ ✦ ᛖ ᛪ ᛏ ᚱ ᚨ ✦ ᚜` / `✦ ᛈ ᛟ ᚹ ᛖ ᚱ ✦`), Única (`᚛ ✦ ᚢ ᚾ ᛁ ᚲ ᚨ ✦ ᚜` / `✦ ᚨ ᚱ ᚲ ᚨ ᚾ ᚢ ᛗ ✦`).
  - **Banner de Status do Caçador**: Transliteração dinâmica do nome do usuário para caracteres rúnicos Elder Futhark (`toElderFuthark`), sincronizada em tempo real com alterações no perfil.
  - **Modais com Decreto Rúnico**: Inscrição sagrada superior `✦ ᛋ ᚨ ᚲ ᚱ ᛖ ᛞ · ᛟ ᚱ ᛞ ᛖ ᚱ ✦`, cantoneiras góticas e cantos retos.
  - Proteção global contra transbordo de nomes longos de atividades, missões, habilidades e projetos (`min-w-0`, `overflow-hidden`, `flex-wrap`, `break-words [overflow-wrap:anywhere]`) em todas as views e cartões.
  - Navegação fluida por 5 abas (`TabBar`): Home, Projetos, G.S (medalhão central dourado com círculo mágico esotérico), Skills e Status, com preservação de estado no DOM eliminando efeito de piscar preto.
  - CRUD manual completo de Projetos e Missões conectado a `projectRepository.ts`, com visualizador em árvore (DAG), desbloqueio em cascata e visualização dos 3 estados (`bloqueada`, `disponivel`, `feita`).
  - Atualizações otimizadas de projetos e missões (`updateProject`, `updateMission`) e testes de ponta a ponta em `e2e/projects-and-missions-flow.spec.ts`.
- **Arquivos Criados / Modificados:**
  - `apps/pwa/index.html`, `apps/pwa/tailwind.config.js`, `apps/pwa/src/index.css` — [tokens Dark Fantasy Gilded RPG, fonte `Cinzel`, fundo cósmico e utilitários de moldura dourada]
  - `apps/pwa/src/components/system/GildedCorners.tsx` — [cantoneiras góticas facetadas, entalhes centrais e inscrições rúnicas arcanas reativas]
  - `apps/pwa/src/components/system/*` — [Design System "Sistema" Dark Fantasy Gilded RPG com bordas retas rounded-none]
  - `apps/pwa/src/components/navigation/TabBar.tsx` — [barra de abas ornamentada com medalhão esotérico G.S]
  - `apps/pwa/src/components/projects/*` — [componentes de projetos, missões e modais CRUD com proteção anti-overflow, cantos retos e runas]
  - `apps/pwa/src/components/views/*` — [views de Home, Projetos, Chat G.S, Skills com p-[18px], Vozes e Status com estética Dark Fantasy e transliteração rúnica]
  - `apps/pwa/src/services/haptics.ts` — [feedback tátil com vibração]
  - `apps/pwa/src/services/projectRepository.ts` — [suporte a updateProject e updateMission]
- **Estado dos Testes Automáticos:**
  - Suítes passando: 18/18 | Testes passando: 82/82 | Lint e Typecheck: 100% OK
### Fase 4 — Motor de Jogo Puro (Parte 1): Clock/RNG, XP, Nível, Maestria, Atributos e Ledger

- **Mudanças Implementadas:**
  - Em `packages/game`:
    - Interfaces puras `Clock` (`RealClock`, `SystemClock`, `FakeClock`) e `Rng` (`RealRng`, `MathRng`, `SeededRng`, `FixedRng`) com injeção de dependência e suporte a modo de fluxo contínuo em tempo real (`isTicking`).
    - Constantes do Sistema: XP por dificuldade (`10, 20, 35, 55, 80`), curva de nível `round(100 * n^1.5)`, limiar Comum → Extra em **100 de maestria** e teto de **300 de maestria**.
    - Normalizador puro de nomes de habilidades (`normalizeSkillName`) para fusão/deduplicação.
    - Funções puras de cálculo e ranqueamento de atributos (`INT`, `FOR`, `DIS`, `CRI`, `SOC`) baseadas em maestria de habilidades e no ledger.
    - Auditor de integridade do ledger (`auditLedger`, `calculateLedgerTotals`).
  - No cliente PWA:
    - `gameService.ts`: Transações atômicas `completeMission` e `undoMissionCompletion` integradas ao ledger imutável `xp_event`, com recálculo de perfil, disparo de eventos do motor (`LEVEL_UP`, `SKILL_EVOLVED_EXTRA`) e compensação estrita no undo.
    - Telas `HomeView.tsx` e `StatusView.tsx` atualizadas com barra de progresso de nível dourada, ranques de caçador dinâmicos e status de conformidade da auditoria do ledger.
    - `DevPanel.tsx`: Novas abas **"Ledger de XP"** (com auditoria em tempo real, visualização das transações e reconciliação) e **"Viagem no Tempo"** (com `FakeClock` ativo avançando segundos ao vivo em tempo real e selo de deslocamento relativo).
    - Proteção assíncrona com `isMountedRef` em `ProjectsView.tsx` e `StatusView.tsx`.
- **Arquivos Criados / Modificados:**
  - `packages/game/src/clock.ts`, `packages/game/src/rng.ts`, `packages/game/src/config.ts`, `packages/game/src/skills.ts`, `packages/game/src/attributes.ts`, `packages/game/src/ledger.ts`, `packages/game/src/index.ts`, `packages/game/src/gameEngine.test.ts`
  - `apps/pwa/src/services/gameService.ts`, `apps/pwa/src/services/gameService.test.ts`
  - `apps/pwa/src/components/DevPanel.tsx`, `apps/pwa/src/components/views/HomeView.tsx`, `apps/pwa/src/components/views/StatusView.tsx`, `apps/pwa/src/components/projects/ProjectsView.tsx`
  - `e2e/projects-and-missions-flow.spec.ts`
  - `plan.md`, `roadmap.md`, `feedback.md`, `handoff.md`
- **Estado dos Testes Automáticos:**
  - Suítes passando: 20/20 | Testes passando: 110/110 | Lint e Typecheck: 100% OK
  - Cobertura em `@slime-sage/game`: 98.92% statements, 93.28% branches, 100% functions, 98.92% lines (acima da meta de 90%).

### Fase 5 — Voz do Mundo & G.S (Modal Dourado + Áudios Oficiais/API Sem TTS) e Telas de Status e Habilidades

- **Mudanças Implementadas:**
  - `WorldVoiceModal.tsx` desenvolvido com a nova estética **Dark Fantasy Gilded RPG** (molduras duplas ouro/âmbar, cantoneiras com losangos e círculos esotéricos, efeito pulsante e animações do Framer Motion).
  - Refatoração do `worldVoiceService.ts`:
    - Eliminação completa da Web Speech API (`speechSynthesis`).
    - Integração de `OFFICIAL_AUDIO_MAP` executando via instâncias de `new Audio(audioSrc)` com arquivos estáticos oficiais em `public/audio/voice/` (`level-up.mp3`, `skill-acquired.mp3`, `skill-evolved-extra.mp3`, `project-complete.mp3`).
    - Fila sequencial (FIFO) de anúncios com suporte a repetição do áudio (`replayCurrentSpeech`) e interrupção segura (`dismissCurrent`).
    - Som sutil Web Audio API mantido para a conclusão de missões individuais sem disparar áudio de voz falado.
  - Integração visual e funcional em `StatusView.tsx` (gráfico de radar SVG, ranques por atributo, lista de transações com proteção de quebra de linha) e `SkillsView.tsx` (lista de habilidades comuns/extras, modal de aquisição manual com disparo de ritual solene `SKILL_ACQUIRED`).
  - Configuração de mocks globais para `HTMLMediaElement` (`play`, `pause`, `load`) em `apps/pwa/src/test/setup.ts`.
  - Atualização dos testes unitários em `WorldVoiceModal.test.tsx` para validação de `HTMLMediaElement.prototype.play`.
- **Arquivos Criados / Modificados:**
  - `apps/pwa/src/components/system/WorldVoiceModal.tsx`, `apps/pwa/src/components/system/WorldVoiceModal.test.tsx`
  - `apps/pwa/src/services/worldVoiceService.ts`
  - `apps/pwa/src/components/views/StatusView.tsx`, `apps/pwa/src/components/views/SkillsView.tsx`
  - `apps/pwa/src/test/setup.ts`
  - `roadmap.md`, `feedback.md`, `handoff.md`
- **Estado dos Testes Automáticos:**
  - Monorepo: 4/4 pacotes passando | 24/24 suítes | 128/128 testes passando (100% verde)
    - `@slime-sage/pwa`: 80/80 testes (19 arquivos)
    - `@slime-sage/game`: 37/37 testes (3 arquivos)
    - `@slime-sage/shared`: 8/8 testes (1 arquivo)
    - `@slime-sage/api`: 3/3 testes (1 arquivo)

### Fase 6 — Backend `/chat`, Síntese de Voz G.S, Cartões de Prévia e Pop-up de Pendências

- **Mudanças Implementadas:**
  - **Backend Hono (`POST /chat` e `POST /tts`):**
    - Implementação de streaming real com `@ai-sdk/google` e fallback resiliente via API nativa Gemini (`gemini-3.8-flash`) com modo gracioso de hibernação neural em caso de indisponibilidade de cota/rede.
    - Suporte a chave primária (`GEMINI_API_KEY`) e chave reserva de failover (`GEMINI_API_KEY_FALLBACK` / `GEMINI_API_KEY_RESERVE`).
    - Exposição do schema de tools de leitura (`get_profile`, `list_skills`, `list_projects`, `get_project`, `search_missions`) e escrita (`create_project_tree`, `add_missions`, `update_mission`, `delete_mission`) em `packages/shared`.
    - Sanitização ativa do histórico de conversa para garantir início de turnos em conformidade estrita com o papel `user`.
    - Rota `POST /tts` com modelo neural oficial `gemini-3.8-flash-tts` e voz `Kore`, retornando áudio sintetizado em alta qualidade.
  - **Cliente PWA (`GsChatView`, Cartões de Confirmação & Cache Local):**
    - Persistência e restauração de conversas locais com stores `chat_thread` e `chat_message` em `chatRepository.ts`.
    - Execução silenciosa de tools de leitura no IndexedDB e emissão de **Cartões de Prévia Interativos** ([`ProposalCard.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/chat/ProposalCard.tsx)) para tools de escrita com ações: **Aceitar** (grava no banco local e recalcula progresso), **Recusar** (descarta com log) e **Pedir Ajuste** (insere contexto no input do chat).
    - Botão **"Ouvir G.S"** com serviço dedicado [`gsVoiceService.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/gsVoiceService.ts) integrando cache em IndexedDB com hash MD5/SHA de 8 caracteres (`tts_cache_<hash>`), reproduzindo instantaneamente gravações prévias a custo zero de tokens.
    - Banner de telemetria de consumo de tokens da API e estatísticas cumulativas (`ai_usage_stats`) no Painel Dev.
    - Notificação proativa de pendências ([`PendingTasksToast.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/PendingTasksToast.tsx)) na tela sem interromper a navegação do usuário.
    - Redesign estético de botões ([`SystemButton.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/SystemButton.tsx)) e badges ([`SystemBadge.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/SystemBadge.tsx)) adotando estritamente cantos retos (`rounded-none`), moldura interna gótica, diamantes nos cantos e entalhes centrais em losango cartouche.
- **Arquivos Criados / Modificados:**
  - `packages/shared/src/index.ts` — [schemas de tools G.S, ChatUsageSchema, ChatMessageSchema]
  - `apps/api/src/index.ts`, `apps/api/src/services/geminiService.ts`, `apps/api/src/server.ts`, `apps/api/src/index.test.ts` — [rotas /chat e /tts, failover de credenciais, modelo gemini-3.8-flash, streaming e síntese]
  - `apps/pwa/src/services/chatRepository.ts`, `apps/pwa/src/services/chatRepository.test.ts` — [repositório IndexedDB para threads e mensagens]
  - `apps/pwa/src/services/gsVoiceService.ts`, `apps/pwa/src/services/gsVoiceService.test.ts` — [serviço de voz neural G.S com cache IndexedDB]
  - `apps/pwa/src/components/chat/ProposalCard.tsx`, `apps/pwa/src/components/chat/ProposalCard.test.tsx` — [cartão de prévia interativo Aceitar/Recusar/Ajustar]
  - `apps/pwa/src/components/system/PendingTasksToast.tsx`, `apps/pwa/src/components/system/PendingTasksToast.test.tsx` — [toast discreto de pendências]
  - `apps/pwa/src/components/views/GsChatView.tsx` — [chat completo integrado com streaming, proposals, reprodução neural e persistência]
  - `apps/pwa/src/components/DevPanel.tsx` — [telemetria de tokens consumidos e logs da IA]
  - `apps/pwa/src/components/system/SystemButton.tsx`, `apps/pwa/src/components/system/SystemBadge.tsx` — [design Dark Fantasy Gilded RPG com cantos retos rounded-none e detalhes góticos]
  - `apps/pwa/vite.config.ts`, `apps/pwa/src/services/apiClient.ts` — [tratamento defensivo de proxy e status 503 com mensagens do Sistema]
  - `roadmap.md`, `feedback.md`, `handoff.md` — [governança e fechamento da fase]
- **Migrations / Banco de Dados:**
  - Stores `chat_thread` e `chat_message` indexados e operacionais.
  - Tabela `kv` enriquecida com chave `ai_usage_stats` e prefixo `tts_cache_*`.
- **Estado dos Testes Automáticos:**
  - Monorepo: 4/4 pacotes passando | 24/24 suítes | 161/161 testes passando (100% verde)
    - `@slime-sage/pwa`: 102/102 testes (24 arquivos)
    - `@slime-sage/game`: 37/37 testes (3 arquivos)
    - `@slime-sage/shared`: 8/8 testes (1 arquivo)
    - `@slime-sage/api`: 14/14 testes (2 arquivos)

### Fase 7 — Modo Coordenador da G.S, Validação Anti-Duplicatas, Snapshot de Memória, Densificação e Áudios Oficiais de Projeto

- **Mudanças Implementadas:**
  - **1. Snapshot Builder Compacto (~500 tokens):**
    - Criado [`memorySnapshotBuilder.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/memorySnapshotBuilder.ts) e testes em [`memorySnapshotBuilder.test.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/memorySnapshotBuilder.test.ts).
    - Compila perfil atual (nível, classe atual, atributos FOR/INT/DIS/CRI/SOC), projeto ativo em andamento com % de progresso, próximas 5 missões disponíveis, missões diárias e top 10 habilidades por maestria.
    - Injetado dinamicamente em [`GsChatView.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/views/GsChatView.tsx) como mensagem de sistema no canal neural a cada turno.
  - **2. Diretrizes do Modo Coordenador e Densificação de Missões:**
    - Atualizado `GS_COORDINATOR_RULES` em [`packages/shared/src/index.ts`](file:///workspaces/Skill-Grinding/packages/shared/src/index.ts) e schemas de tool `create_project_tree` em [`apps/api/src/services/geminiService.ts`](file:///workspaces/Skill-Grinding/apps/api/src/services/geminiService.ts).
    - Regra de entrevista socrática: 1 pergunta por vez (máximo 5) antes de formular proposta.
    - Densificação obrigatória: temas amplos/técnicos (ex: aprender Rust) geram de 7 a 12 missões granulares em DAG misto (passos paralelos e lineares), evitando planos superficiais.
    - Preparação secreta de evolução: a G.S arquiva silenciosamente `next_evolution_name` e `next_evolution_description` para `target_skill` e **nunca** revela este nome no texto do chat.
  - **3. Validador Pré-Cartão e Anti-Duplicatas:**
    - Criado [`preCardValidator.ts`](file:///workspaces/Skill-Grinding/packages/game/src/preCardValidator.ts) e testes em [`preCardValidator.test.ts`](file:///workspaces/Skill-Grinding/packages/game/src/preCardValidator.test.ts).
    - Validação de DAG acíclico, 1 a 3 skills por missão, inferência de atributos e classificação precisa `is_new: true/false`.
    - Preservação de `next_evolution_name` e `next_evolution_description` em [`classifySkillsDiff`](file:///workspaces/Skill-Grinding/packages/game/src/skills.ts) e no [`projectRepository.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/projectRepository.ts).
  - **4. Suíte de Evals do Coordenador (`packages/game/src/coordinatorEvals.ts`):**
    - 15 casos de teste sintéticos e script de execução de benchmark com taxa de sucesso de 100% (>= 90% exigido).
  - **5. Áudios Oficiais da G.S e Voz do Mundo:**
    - Gerado clipe oficial de voz neural `Kore`: [`apps/pwa/public/audio/voice/project-start.mp3`](file:///workspaces/Skill-Grinding/apps/pwa/public/audio/voice/project-start.mp3) (*"Aviso da Grande Sábio. Parâmetros do projeto aceitos. Protocolo de treino iniciado."*).
    - Disparo de `project-start.mp3` no aceite de propostas de projetos que possuam `target_skill` em [`GsChatView.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/views/GsChatView.tsx).
    - Disparo de `PROJECT_COMPLETE` em [`gameService.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/gameService.ts) ao completar a última missão de um projeto.
    - Execução do modal cerimonial e áudio `/audio/voice/skill-acquired.mp3` em [`worldVoiceService.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/worldVoiceService.ts) **exclusivamente** quando o projeto concluído possui habilidade vinculada (`hasSkill === true`).
  - **6. Documentação da Ascensão Comum → Extra para a Fase 10:**
    - Mecânica detalhada no [`plan.md`](file:///workspaces/Skill-Grinding/plan.md) (linhas 750–760) para consumo dos metadados arcanos preparados em segredo pela G.S quando a maestria atingir 100 pontos.
- **Arquivos Criados / Modificados:**
  - `packages/shared/src/index.ts` — [schemas de target_skill e regras de densificação]
  - `packages/game/src/skills.ts`, `packages/game/src/ledger.ts`, `packages/game/src/preCardValidator.ts`, `packages/game/src/coordinatorEvals.ts` — [ledger, validação de integridade pré-cartão, diff de habilidades e evals]
  - `apps/api/src/services/geminiService.ts` — [inputSchema atualizado com densificação 7-12 e evolução de target_skill]
  - `apps/pwa/public/audio/voice/project-start.mp3`, `scripts/voice-config.json`, `apps/pwa/src/services/voiceCatalog.ts` — [áudio oficial da G.S de início de projeto]
  - `apps/pwa/src/services/memorySnapshotBuilder.ts`, `apps/pwa/src/services/projectRepository.ts`, `apps/pwa/src/services/gameService.ts`, `apps/pwa/src/services/worldVoiceService.ts`, `apps/pwa/src/components/views/GsChatView.tsx` — [snapshot de memória, persistência IndexedDB de metadados de evolução, disparos de áudio e eventos de conclusão]
- **Estado dos Testes Automáticos:**
  - Monorepo: 4/4 pacotes passando | 28/28 suítes | 191/191 testes passando (100% verde)
    - `@slime-sage/pwa`: 109/109 testes (25 arquivos)
    - `@slime-sage/game`: 60/60 testes (5 arquivos)
    - `@slime-sage/shared`: 11/11 testes (1 arquivo)
    - `@slime-sage/api`: 11/11 testes (1 arquivo)
  - Typecheck: 0 erros
  - Lint: 0 erros

- **Pontos de Atenção para a Próxima Fase (Fase 8 — Onboarding: 5 Perguntas da G.S, Revelação de Raça Tensura e Rank de Ameaça):**
  - **1. Sequência Cinemática de Onboarding (Tela Cheia):**
    - Efeito typewriter em texto gótico Dark Fantasy simulando o despertar da consciência da Grande Sábio.
    - Questionário pré-determinado de 5 perguntas com áudios em MP3 da voz oficial `Kore` (`onboarding-q1.mp3` a `q5.mp3`).
  - **2. Motor Puro de Determinação de Raça e Rank (`@slime-sage/game`):**
    - Determina a Raça (*Tensura*: Slime, Kijin, Draconiano, Majin, Homem-Fera) e o Rank de Ameaça (*Tensura*: Classe Menor, Hazard, Calamity) a partir da matriz de respostas das 5 perguntas.
    - Impacto cosmético/narrativo no perfil sem quebrar o ledger imutável de XP.
  - **3. Revelação Cerimonial e Transição:**
    - Proclamação da G.S via API (`POST /tts`) com voz `Kore`, gravação no `profile` (`race`, `rank_threat`, `onboarding_done: true`) e redirecionamento direto para o Chat da G.S com o gatilho da primeira conquista (criação do projeto denso de 7 a 12 missões).
  - **4. Controle Dev:**
    - Botão "Resetar Onboarding (Re-despertar)" no `DevPanel.tsx`.




