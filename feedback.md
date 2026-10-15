# Registro de Feedback do Usuário e Debug — Slime Sage (PWA)

## Fase 0 — Fundação do Monorepo, API Base (`/health`) e Token Secreto

### Rodada 1 de Testes do Usuário

- **Feedback do Usuário:**
  - "Não foi possível alcançar o servidor (Failed to fetch). Verifique a URL e a conexão."
- **Causa Raiz Identificada (Debug):**
  - No ambiente de nuvem (GitHub Codespaces), a PWA aberta no navegador do cliente tentava fazer requisição direta para `http://localhost:3000/health`, que apontava para a máquina local do usuário em vez do container do Codespace, além de sofrer restrições de Mixed Content (navegador em HTTPS tentando acessar HTTP inseguro).
- **Correção Aplicada + Teste de Regressão Criado:**
  - Configurado proxy reverso no Vite (`/api` -> `http://127.0.0.1:3000`) em [`apps/pwa/vite.config.ts`](file:///workspaces/Skill-Grinding/apps/pwa/vite.config.ts).
  - Atualizado [`authStorage.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/authStorage.ts) para usar `/api` como padrão automático em ambientes remotos.
  - Adicionado fallback automático transparente no cliente HTTP ([`apiClient.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/apiClient.ts)) para tentar o proxy `/api` caso `localhost:3000` sofra falha de rede.
- **Status:** [x] Validado pelo Usuário

## Fase 1 — Logger Local, Error Boundary, Painel Dev e Spike de Notificações + TTS

### Rodada 1 de Testes do Usuário (Mobile / PWA)

- **Feedback do Usuário:**
  1. As notificações web não funcionam no celular, mesmo com a permissão constando como `granted`.
  2. A voz do Web Speech API (TTS) falha na pronúncia de termos em inglês, lendo "Sage" como "seje", necessitando de decisão sobre manter TTS ou adotar outro tipo de voz.
- **Causa Raiz Identificada (Debug):**
  1. **Notificações no Mobile:** Em navegadores móveis (especialmente Chrome no Android e Safari em modo PWA no iOS), a API W3C restringe o construtor direto `new Notification()` em contexto de janela (lançando `Illegal constructor` ou descartando silenciosamente o alerta). É estritamente exigido o uso de `ServiceWorkerRegistration.showNotification()`.
  2. **Pronúncia em Termos em Inglês:** O sintetizador de voz `pt-BR` nativo do sistema operacional aplica regras ortográficas do português brasileiro aos termos anglófonos terminados em "-ge" (como "bege" / "rege" -> "seje").
- **Correção Aplicada + Teste de Regressão Criado:**
  1. Em [`notificationService.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/notificationService.ts): implementado suporte prioritário a `ServiceWorkerRegistration.showNotification()` via `navigator.serviceWorker.ready`, mantendo fallback retrocompatível para desktop.
  2. Em [`vite.config.ts`](file:///workspaces/Skill-Grinding/apps/pwa/vite.config.ts): ativado `devOptions: { enabled: true }` no plugin `VitePWA` para garantir registro ativo do Service Worker no celular durante o desenvolvimento.
  3. Criado [`phoneticNormalizer.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/phoneticNormalizer.ts) e testes em [`phoneticNormalizer.test.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/phoneticNormalizer.test.ts): mapeia termos como "Slime Sage" -> "Slime Séidji", "XP" -> "Xis Pê", "Skill" -> "Isquil", "Solo Leveling" -> "Sôulo Léveling", etc., purificando o texto antes do envio à Web Speech API.
  4. **Decisão Arquitetural de Áudio (Definida pelo Usuário):**
     - O sistema usará a **Voz Neural da API do Gemini** (`@ai-sdk/google`) com a voz **`Kore`** tanto para a **Grande Sábio (G.S)** quanto para a **Voz do Mundo** (fiel à concepção de *Tensura*, variando a solene reverbação e ritmo).
     - O utilitário local com normalizador fonético atuará como fallback 100% offline.
- **Status:** [x] Validado pelo Usuário

## Fase 2 — Banco de Dados Local, Migrations e Repositórios de Projetos/Missões

### Rodada 1 de Testes do Usuário (Painel Dev & Banco de Dados)

- **Feedback do Usuário:**
  - Testes do usuário aprovados (seed, contadores de tabelas, persistência após reload e reset total validados com sucesso).
  - Dúvida sanada sobre a voz do TTS local (Web Speech API) vs a voz oficial neural `Kore` do Gemini (prevista no pipeline das Fases 5 e 6).
  - Requisito adicional solicitado e definido: o sistema deve possuir falas offline prontas da Grande Sábio para momentos-chave (como missão concluída, novo nível, foco, etc.).
- **Decisão Arquitetural de Áudio Offline (Definida pelo Usuário):**
  - **Opção 3 — Híbrida Inteligente:**
    1. **Falas de Impacto (Core Events):** Áudios estáticos pré-gravados em `.mp3` com a voz neural oficial **`Kore`** (Gemini) armazenados em pré-cache pelo Service Worker (`public/audio/voices/`) para eventos centrais: *"Missão concluída"*, *"Aviso do Sistema: Novo nível alcançado"*, *"Modo Foco ativado"*, *"Quebra de foco detectada"*, *"Habilidade adquirida"*, etc.
    2. **Variáveis e Textos Dinâmicos:** Para textos customizados do usuário (títulos de missões específicas), o app utiliza a introdução solene em áudio oficial da Voz do Mundo/G.S com o texto exibido em destaque no modal visual, recorrendo ao TTS local normalizado caso offline.
- **Status:** [x] Validado pelo Usuário


