# Handoff Técnico — Slime Sage (PWA)

## Status Atual

- **Última Fase Concluída:** Fase 5 — Voz do Mundo & G.S (Modal Dourado + Áudios Oficiais/API Sem TTS) e Telas de Status e Habilidades
- **Próxima Fase:** Fase 6 — Backend `/chat`, Síntese de Voz G.S, Cartões de Prévia e Pop-up de Pendências
- **Data da Atualização:** 2026-10-17

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

- **Pontos de Atenção para a Fase 6 e Subsequentes (Diretrizes Grill-Me Consolidadas e Fechadas):**
  - **1. Escopo Incremental de Tools na Fase 6:**
    - A Fase 6 expõe apenas ferramentas de Projetos, Missões e Perfil/Skills (`get_profile`, `list_skills`, `list_projects`, `get_project`, `search_missions`, `create_project_tree`, `add_missions`, `update_mission`, `delete_mission`), pois já contam com repositórios e stores locais funcionais. As tools de Classes entram na Fase 9 e as de Agenda/Hábitos na Fase 11.
  - **2. Síntese de Voz G.S (`POST /tts`) & Redundância de Chaves:**
    - Endpoint `POST /tts` no Hono com formato `{ audioBase64: string, mimeType: string }` utilizando a API REST do Gemini (voz oficial `Kore`).
    - Redundância inteligente: chave primária (`GEMINI_API_KEY`) com failover automático em caso de cota (429) para a chave reserva (`GEMINI_API_KEY_FALLBACK`).
    - Cache local no PWA em IndexedDB (`tts_cache_<hash>`) com reprodução instantânea.
    - Modo offline / falha de rede: Notificação solene informando que a Grande Sábio entrou em *modo de hibernação neural*, mantendo a operação em processamento estritamente local.
  - **3. Pop-up / Toast Proativo de Pendências:**
    - Toast estilizado no PWA com badge *"Aviso da G.S"*, resumo das pendências imediatas e botão *"Ouvir Mensagem"*, complementado por opção em Configurações para reprodução automática condicionada à interação prévia.
  - **4. Curva de Nível e XP:**
    - Motor de jogo atualizado e testado com a curva íngreme `round(300 * n^1.5)` (subida 3x mais lenta e desafiadora).
  - **5. Matriz de Títulos por Atributo (10 Grandes Patamares & Sub-Graus de 1.000 pts até 50.000+):**
    - Implementada em `packages/game/src/attributes.ts`: Cada Grande Patamar abrange 5.000 pontos de maestria, subdividido em **5 Sub-Graus Rúnicos de 1.000 pontos (Graus I a V)**. O título se transforma lentamente indicando o rumo para a próxima ascensão (ex: `Aprendiz da Lógica [Grau III] · Rumo a Analista Metódico`), culminando aos 50.000+ no Grau V do Tier X como a **Perfeição Inatingível**:
      - **INT:** 1. Aprendiz da Lógica -> 2. Analista Metódico -> 3. Arquiteto Cognitivo -> 4. Decifrador de Padrões -> 5. Sábio Investigador -> 6. Arquimago da Cognição -> 7. Singularidade Teórica -> 8. Demiurgo do Pensamento -> 9. A Mente Infinita -> 10. A Onisciência Absoluta
      - **FOR:** 1. Corpo Desperto -> 2. Guarda de Aço -> 3. Escudo Vivo -> 4. Muralha de Bronze -> 5. Baluarte da Vontade -> 6. Monolito Vivo -> 7. Entidade Inabalável -> 8. Guardião Inquebrantável -> 9. Pilar da Existência -> 10. Muralha Cósmica Inquebrável
      - **DIS:** 1. Iniciante da Vontade -> 2. Mente Vigilante -> 3. Disciplinado em Aço -> 4. Vontade de Titânio -> 5. Firme como Diamante -> 6. Asceta Marcial -> 7. Transcendência Estoica -> 8. Monolito Perpétuo -> 9. Entidade Sem Flutuação -> 10. A Vontade Eterna
      - **CRI:** 1. Discípulo do Traço -> 2. Gravador de Conceitos -> 3. Escultor de Ideias -> 4. Manifestador de Formas -> 5. Engenheiro da Imaginação -> 6. Mestre das Formas -> 7. Arquiteto da Existência -> 8. Criador de Dimensões -> 9. Demiurgo Cósmico -> 10. Primordial da Criação
      - **SOC:** 1. Ouvinte Atento -> 2. Tecedor de Laços -> 3. Mediador de Conflitos -> 4. Orador Magnético -> 5. Pacificador das Tribos -> 6. Farol Coletivo -> 7. Mentor de Povos -> 8. Conciliador de Mundos -> 9. Voz do Éter -> 10. A Harmonia Primordial
  - **6. Navegação da Agenda Independente (Fase 11):**
    - Modelo híbrido: Resumo "Hoje" na Home com botão de acesso "Abrir Agenda Completa" (visão dedicada, Hábitos e Festival da Colheita), mantendo intactas as 5 abas principais na `TabBar`.



