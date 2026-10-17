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

### Rodada 2 de Testes do Usuário (Bordas Retas rounded-none, Inscrições Rúnicas e Padding dos Skill Cards)

- **Feedback do Usuário:**
  1. *"os skill cards precisam de um padding, tá muito perto da borda, e as divs relative bg, não devem usar bordas arredondadas, e coloque mais efeitos de magia nas bordas, como se fossem inscrições magicas"*
  2. *"mas o banner de status do caçador, conforme o nome odo usuario?"*
- **Causa Raiz & Melhoria Aplicada:**
  1. **Bordas Retas (`rounded-none`)**: `SystemPanel.tsx`, `ProjectModal.tsx`, `DevPanel.tsx`, cartões de missões e projetos ainda continham classes residuais de cantos arredondados (`rounded-xl` / `rounded-lg`). Foram todos convertidos estritamente para `rounded-none`, mantendo cantos arredondados/chanfrados apenas em botões menores (`SystemButton`) por ergonomia.
  2. **Padding nos Skill Cards**: A classe `p-4.5` não fazia parte do Tailwind padrão gerando inconsistência. Foi atualizada para `p-[18px]` exatos com separação vertical estendida `space-y-5`.
  3. **Inscrições Rúnicas Arcanas**: O componente [`GildedCorners.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/GildedCorners.tsx) foi enriquecido com inscrições nórdicas em Elder Futhark (`withRunes`, `runicTop`, `runicBottom`), entalhes centrais luminosos no topo e base (`withCenterNotches`), glifos `✦` nas laterais e brilho intensificado ao foco/hover (`opacity-45 group-hover:opacity-90 drop-shadow-[0_0_4px_currentColor]`).
  4. **Runas Dinâmicas por Tier de Habilidade**: Comum (`᚛ ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚜` / `✦ ᛋ ᛚ ᛁ ᛗ ᛖ · ᛋ ᚨ ᚷ ᛖ ✦`), Extra (`᚛ ✦ ᛖ ᛪ ᛏ ᚱ ᚨ ✦ ᚜` / `✦ ᛈ ᛟ ᚹ ᛖ ᚱ ✦`) e Única (`᚛ ✦ ᚢ ᚾ ᛁ ᚲ ᚨ ✦ ᚜` / `✦ ᚨ ᚱ ᚲ ᚨ ᚾ ᚢ ᛗ ✦`).
  5. **Banner do Caçador com Transliteração Dinâmica**: Criada função pura `toElderFuthark` em [`HomeView.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/views/HomeView.tsx) que translitera em tempo real o nome do caçador no perfil para o alfabeto rúnico nórdico na borda superior do banner de status.
  6. **Decreto Rúnico em Modais**: [`SystemModal.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/SystemModal.tsx) atualizado com moldura rúnica sagrada `✦ ᛋ ᚨ ᚲ ᚱ ᛖ ᛞ · ᛟ ᚱ ᛞ ᛖ ᚱ ✦`.
- **Status:** [x] Validado pelo Usuário

## Fase 6 — Backend `/chat`, Síntese de Voz G.S, Cartões de Prévia e Pop-up de Pendências

### Rodada 1 de Testes do Usuário (Canal Neural da G.S e Erro 500)

- **Feedback do Usuário:**
  - "erro do canal neural da GS ( 500)"
- **Causa Raiz Identificada (Debug):**
  1. **Ordem de Turnos do Chat Gemini:** No estado inicial da interface, uma mensagem de apresentação da Grande Sábio já existia no chat (`role: "assistant"`). Ao enviar a primeira mensagem do usuário, a lista transmitida ao Gemini iniciava com o papel `assistant`. A API do Google (`gemini-2.0-flash`) exige estritamente que conversas com múltiplos turnos iniciem com o papel `user`, rejeitando requisições fora desse padrão.
  2. **Compatibilidade de Chave Reserva:** O arquivo `.env` continha a chave reserva com o nome `GEMINI_API_KEY_RESERVE`, enquanto `getApiKeys()` buscava apenas `GEMINI_API_KEY_FALLBACK`.
  3. **Diagnóstico do Proxy Vite & Falha de Conexão:** Caso o backend na porta 3000 não respondesse de imediato, o proxy do Vite retornava erro HTTP 500 cru em texto puro sem JSON, fazendo com que o cliente exibisse a mensagem genérica `Erro no canal neural da Grande Sábio (500)`.
- **Correção Aplicada + Testes de Regressão Criados:**
  1. Em [`geminiService.ts`](file:///workspaces/Skill-Grinding/apps/api/src/services/geminiService.ts): sanitização ativa de mensagens antes do envio à API Gemini, removendo mensagens de assistente no início para assegurar que a conversa sempre inicie com o turno do `user`, e adicionado suporte a `GEMINI_API_KEY_RESERVE` no failover de credenciais.
  2. Em [`geminiService.ts`](file:///workspaces/Skill-Grinding/apps/api/src/services/geminiService.ts): proteção defensiva completa com validação de nulos em `toolCalls` para todas as ferramentas (`create_project_tree`, `add_missions`, `update_mission`, `delete_mission`).
  3. Em [`vite.config.ts`](file:///workspaces/Skill-Grinding/apps/pwa/vite.config.ts) e [`apiClient.ts`](file:///workspaces/Skill-Grinding/apps/pwa/src/services/apiClient.ts): configurado listener de erro no proxy do Vite para retornar HTTP 503 com payload JSON descritivo (`BACKEND_OFFLINE`), e mensagens de erro no frontend agora instruem com clareza a verificação do comando `pnpm dev`.
  4. Em [`server.ts`](file:///workspaces/Skill-Grinding/apps/api/src/server.ts): suporte a múltiplos caminhos de resolução do arquivo `.env`.
  5. Suíte completa de testes executada e 100% verde (161/161 testes passando).
- **Status:** [ ] Aguardando validação do usuário

### Rodada 2 de Testes do Usuário (Depreciação de Modelo Gemini & Modo de Hibernação Neural)

- **Feedback do Usuário:**
  - "aviso: conexão neural com arquivos centrais indisonivel temporariamente. A grande sabio entoru em modo de hibernação neura, suas diretrizem continuam em pleno funcionamento"
- **Causa Raiz Identificada (Debug):**
  - O modelo configurado no código era `gemini-2.0-flash`. A API do Google Generative Language descontinuou esse identificador, retornando HTTP 404: *"This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash"*.
  - O mecanismo de resiliência da Grande Sábio capturou a resposta e entrou em modo de hibernação neural gracioso (HTTP 200), evitando queda do servidor.
- **Correção Aplicada + Teste de Integração Real:**
  1. Em [`geminiService.ts`](file:///workspaces/Skill-Grinding/apps/api/src/services/geminiService.ts): atualizado o modelo de chat para `gemini-3.8-flash`.
  2. Em [`geminiService.ts`](file:///workspaces/Skill-Grinding/apps/api/src/services/geminiService.ts): atualizado o modelo de síntese de voz Kore para `gemini-3.8-flash-tts`.
  3. Teste real de integração executado com sucesso: geração da árvore estruturada de projeto (`create_project_tree`) e síntese de áudio WAV via voz Kore (607KB gerados).
- **Status:** [x] Validado pelo Usuário

### Rodada 3 de Testes do Usuário (Telemetria de Tokens & Logs Neurais no Painel Dev)

- **Feedback do Usuário:**
  - "como posso ver o usage da api key?" e "Não há logs de chamadas neurais"
- **Causa Raiz & Solução Aplicada:**
  - Não havia agregação visual e persistente de consumo de tokens (prompt, completion, total) acessível diretamente na interface do app.
  - Implementado em [`packages/shared/src/index.ts`](file:///workspaces/Skill-Grinding/packages/shared/src/index.ts) o schema `ChatUsageSchema`.
  - Em [`geminiService.ts`](file:///workspaces/Skill-Grinding/apps/api/src/services/geminiService.ts): extração e devolução precisa de `usage: { prompt_tokens, completion_tokens, total_tokens }`.
  - Em [`GsChatView.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/views/GsChatView.tsx): persistência de estatísticas acumuladas no IndexedDB (`localDb.setKv("ai_usage_stats", ...)`).
  - Em [`DevPanel.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/DevPanel.tsx): adição de banner dourado de telemetria de tokens com totalizador de tokens consumidos, requisições feitas e modelos ativos, além de logs sob o filtro `ai (Canal Neural & Gemini)`.
- **Status:** [x] Validado pelo Usuário

### Rodada 4 de Testes do Usuário (Estética dos Botões & Remoção de Cantos Arredondados)

- **Feedback do Usuário:**
  - "não gostei dos botões, muito redondos, não tem a estetica de rpg"
- **Causa Raiz & Redesign Aplicado:**
  - `SystemButton.tsx` utilizava classes residuais de cantos arredondados (`rounded-md`, `rounded-lg`, `rounded-xl`), que quebravam a imersão gótica/medieval inspirada em *Tensura* e `docs/design.png`.
  - Em [`SystemButton.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/SystemButton.tsx):
    1. Removidas todas as classes arredondadas, aplicando estritamente `rounded-none`.
    2. Adicionada moldura interna decorativa fina estilo placa/cartouche de RPG (`inset-[2px] border border-current opacity-20`).
    3. Adicionados ornamentos de diamante nos cantos da cartela (`-top-[2px] -left-[2px] w-1 h-1 bg-[#dfa86c]`).
    4. Adicionados entalhes centrais em losango cartouche (`rotate-45`) nos botões de destaque (primário e ouro).
    5. Gradientes e bordas refinados em ouro antigo e obsidiana profunda.
  - Em [`SystemBadge.tsx`](file:///workspaces/Skill-Grinding/apps/pwa/src/components/system/SystemBadge.tsx): todos os badges convertidos de `rounded` para `rounded-none`.
  - Suíte completa de testes executada com 100% de aprovação (161/161 testes passando).
- **Status:** [ ] Aguardando validação visual do usuário
