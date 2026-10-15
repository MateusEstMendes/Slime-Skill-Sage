# Slime Sage (`S.S.S`) — v1 PWA

> *"Aviso. O Sistema Slime Sage foi inicializado com sucesso."*

**Slime Sage** é um gestor de projetos pessoal gamificado com Inteligência Artificial em formato **Progressive Web App (PWA)** instalável e *offline-first*. Inspirado nos sistemas de evolução de habilidades de *Tensura* (Grande Sábio / Voz do Mundo) e na interface de "Sistema" de *Solo Leveling* (`#050811` / `#00f3ff`).

---

## Regras de Ouro da Arquitetura

1. **A IA propõe, o Motor decide:** A Grande Sábia (G.S) nunca concede XP, níveis ou maestria diretamente. Toda escrita proposta pela IA no chat exige aprovação explícita do usuário em um **Cartão de Prévia** (*Aceitar / Recusar / Pedir ajuste*).
2. **Auditabilidade Total (Ledger):** Toda alteração de XP ou maestria gera um registro imutável na tabela `xp_event`. O XP total e a maestria batem estritamente com a soma do ledger.
3. **Offline-First e Determinismo:** O aplicativo opera localmente. O motor de jogo (`packages/game`) é 100% puro, sem dependências de DOM ou banco de dados, recebendo tempo (`Clock`) e sorte (`Rng`) por injeção de dependência.
4. **Código Limpo e Estrito:** TypeScript `strict` de ponta a ponta, validado por schemas Zod compartilhados e sem uso de `any`.

---

## Stack Tecnológica

### Monorepo & Tooling
- **Gerenciador e Build:** `pnpm` + `Turborepo`
- **Qualidade:** TypeScript `strict`, ESLint (Flat Config), Prettier, GitHub Actions CI
- **Testes:** Vitest, React Testing Library, `fast-check` (Property-Based Testing) e Playwright (E2E)

### Client (`apps/pwa`)
- **Core:** Vite + React 19 + React Router
- **UI & Animações:** Tailwind CSS + Framer Motion + Lucide React
- **PWA & Offline:** `vite-plugin-pwa` (Workbox Service Worker)
- **Persistência Local:** IndexedDB / SQLite-WASM + Drizzle ORM + LocalStorage (`authStorage`)
- **Web APIs Nativas:**
  - `window.speechSynthesis` (Web Speech API `pt-BR` para narração da G.S e Voz do Mundo)
  - `Web Audio API` (efeitos sonoros do Sistema) e `navigator.vibrate` (Haptics)
  - `Web Notifications API` (alertas locais e sincronização 48h)
  - `Page Visibility API` (detecção de quebra do Modo Foco > 30s fora)

### Backend (`apps/api`)
- **Servidor:** Hono (compatível com Vercel Serverless/Edge)
- **Segurança:** Middleware Bearer Token (`APP_SECRET`) + CORS
- **IA & Cloud:** Vercel AI SDK (`@ai-sdk/google` — Gemini Flash e Pro) + `@vercel/blob` (retenção de 14 backups)

---

## Estrutura do Monorepo

```text
slime-sage/
├── apps/
│   ├── api/            # Servidor Hono (/health, /chat, /generate, /backup)
│   └── pwa/            # Cliente PWA (React 19, Vite, Tailwind, Service Worker)
├── packages/
│   ├── game/           # Motor de regras 100% puro (Clock, Rng, XP, Roleta, Classes)
│   └── shared/         # Schemas Zod, contratos de API/Tools, prompts e phrase_bank
├── e2e/                # Testes End-to-End com Playwright
├── evals/              # Suíte de avaliação dos prompts da G.S
├── roadmap.md          # Controle de progresso das 15 fases
├── handoff.md          # Histórico técnico de mudanças por fase
└── feedback.md         # Registro de testes do usuário e debug