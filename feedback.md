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

## Fase 3 — Design System "Sistema", Navegação por Abas e CRUD Manual de Projetos/Missões

### Rodada 1 de Testes do Usuário (Navegação, Design System e CRUD)

- **Feedback do Usuário:**
  - Componentes piscavam preto ao alternar entre abas, precisando de transição sutil e instantânea sem piscar.
  - Conclusão da Fase 3 validada após otimização da renderização.
- **Causa Raiz Identificada (Debug):**
  - `SystemPanel.tsx` utilizava animação inicial de opacidade zero (`initial={{ opacity: 0, y: 10 }}`) revelando o fundo escuro.
  - `HomeScreen.tsx` desmontava e remontava views condicionalmente, forçando recarregamentos do zero.
- **Correção Aplicada + Teste de Regressão Criado:**
  - Remoção de opacidade zero na montagem do `SystemPanel.tsx`.
  - Preservação das abas no DOM com controle de visibilidade via CSS (`hidden`/`block`) em `HomeScreen.tsx`.
  - Testes de renderização de abas e componentes adicionados e validados.
- **Status:** [x] Validado pelo Usuário

## Fase 4 — Motor de Jogo Puro (Parte 1): Clock/RNG, XP, Nível, Maestria, Atributos e Ledger

### Rodada 1 de Testes do Usuário (Ledger, Auditoria, Viagem no Tempo e FakeClock em Tempo Real)

- **Feedback do Usuário:**
  - O usuário solicitou que o `FakeClock` na aba "Viagem no Tempo" do Painel Dev atualizasse os segundos em tempo real na interface para proporcionar certeza visual imediata de que a simulação temporal está viva e ativa.
  - Solicitação adicional esclarecida e adicionada ao plano da v2: suporte a agendamento de data de término (`deadline` / `due_date`) para projetos e atividades (missões *Time-Attack* e Milestones).
  - Testes do usuário do Ledger imutável, cálculo de auditoria de XP, conclusão/reversão de missões e controles de tempo aprovados.
- **Causa Raiz & Melhoria Aplicada:**
  - O `FakeClock` foi aprimorado com suporte a modo contínuo de fluxo (`isTicking`) preservando o deslocamento temporal em relação ao relógio real.
  - Adicionado `setInterval` de 1 segundo dedicado na aba "Viagem no Tempo" do `DevPanel.tsx`, além de luz de pulso em tempo real (`animate-ping`) e selo de deslocamento relativo (ex: `(+1h de deslocamento)`).
  - `loadProjects` e `loadStatusData` foram protegidos com referências de ciclo de vida (`isMountedRef`) para garantir robustez assíncrona.
- **Status:** [x] Validado pelo Usuário

## Fase 5 — Voz do Mundo & G.S (Modal Dourado + Áudios Oficiais/API Sem TTS) e Telas de Status e Habilidades

### Rodada 1 de Testes do Usuário (Áudios Oficiais da G.S, Descarte de TTS e Validação de Rituais)

- **Feedback do Usuário:**
  - O usuário questionou: *"por que a voz tocada não é a da G.S qou a voz ja colocada no voices?"*
  - Na sessão de alinhamento `/grill-me`, foi estabelecido o descarte definitivo do TTS nativo do navegador (`window.speechSynthesis`), direcionando o sistema para uso exclusivo dos áudios oficiais pré-gravados da G.S (`.mp3` na pasta `public/audio/voice/`) e síntese neural de alta qualidade via API do Gemini com cache local (Fase 6).
  - Remoção de avisos sonoros em missões individuais (apenas som de interface Web Audio API sutil); áudio solene mantido para conclusão de projetos completos e rituais de consagração.
- **Causa Raiz & Melhoria Aplicada:**
  - O serviço `worldVoiceService.ts` ainda acionava `ttsService.speak()` com Web Speech API em paralelo aos efeitos sonoros.
  - Implementado `OFFICIAL_AUDIO_MAP` mapeando cada tipo de anúncio para os arquivos oficiais correspondentes (`level-up.mp3`, `skill-acquired.mp3`, `skill-evolved-extra.mp3`, `project-complete.mp3`).
  - O serviço agora gerencia instâncias de `HTMLAudioElement` (`new Audio(audioSrc)`), controlando reprodução, repetição (`replayCurrentSpeech`) e interrupção limpa (`dismissCurrent`).
  - Adicionado mock para `HTMLMediaElement.prototype.play`, `pause` e `load` no arquivo de setup dos testes (`setup.ts`).
  - A suíte de testes de `WorldVoiceModal.test.tsx` e todos os testes da PWA (80/80) foram executados e aprovados com 100% de sucesso.
- **Status:** [x] Validado pelo Usuário
