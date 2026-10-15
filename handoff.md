# Handoff Técnico — Slime Sage (PWA)

## Status Atual

- **Última Fase Concluída:** Fase 1 — Logger Local, Error Boundary, Painel Dev e Spike de Notificações + TTS
- **Próxima Fase:** Fase 2 — Banco de Dados Local, Migrations e Repositórios de Projetos/Missões
- **Data da Atualização:** 2026-10-15

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

