# Registro de Feedback do Usuário e Debug — Slime Sage (PWA)

## Fase 0 — Fundação do Monorepo, API Base (`/health`) e Token Secreto

### Rodada 1 de Testes do Usuário

- **Feedback do Usuário:**
  - "Não foi possível alcançar o servidor (Failed to fetch). Verifique a URL e a conexão."
- **Causa Raiz Identificada (Debug):**
  - No ambiente de nuvem (GitHub Codespaces), a PWA aberta no navegador do cliente tentava fazer requisição direta para `http://localhost:3000/health`, que apontava para a máquina local do usuário em vez do container do Codespace, além de sofrer restrições de Mixed Content (navegador em HTTPS tentando acessar HTTP inseguro).
- **Correção Aplicada + Teste de Regressão Criado:**
  - Configurado proxy reverso no Vite (`/api` -> `http://127.0.0.1:3000`) em [`apps/pwa/vite.config.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/vite.config.ts).
  - Atualizado [`authStorage.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/authStorage.ts) para usar `/api` como padrão automático em ambientes remotos.
  - Adicionado fallback automático transparente no cliente HTTP ([`apiClient.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/apiClient.ts)) para tentar o proxy `/api` caso `localhost:3000` sofra falha de rede.
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
  1. Em [`notificationService.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/notificationService.ts): implementado suporte prioritário a `ServiceWorkerRegistration.showNotification()` via `navigator.serviceWorker.ready`, mantendo fallback retrocompatível para desktop.
  2. Em [`vite.config.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/vite.config.ts): ativado `devOptions: { enabled: true }` no plugin `VitePWA` para garantir registro ativo do Service Worker no celular durante o desenvolvimento.
  3. Criado [`phoneticNormalizer.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/phoneticNormalizer.ts) e testes em [`phoneticNormalizer.test.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/phoneticNormalizer.test.ts): mapeia termos como "Slime Sage" -> "Slime Séidji", "XP" -> "Xis Pê", "Skill" -> "Isquil", "Solo Leveling" -> "Sôulo Léveling", etc., purificando o texto antes do envio à Web Speech API.
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
  3. **Inscrições Rúnicas Arcanas**: O componente [`GildedCorners.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/GildedCorners.tsx) foi enriquecido com inscrições nórdicas em Elder Futhark (`withRunes`, `runicTop`, `runicBottom`), entalhes centrais luminosos no topo e base (`withCenterNotches`), glifos `✦` nas laterais e brilho intensificado ao foco/hover (`opacity-45 group-hover:opacity-90 drop-shadow-[0_0_4px_currentColor]`).
  4. **Runas Dinâmicas por Tier de Habilidade**: Comum (`᚛ ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚜` / `✦ ᛋ ᛚ ᛁ ᛗ ᛖ · ᛋ ᚨ ᚷ ᛖ ✦`), Extra (`᚛ ✦ ᛖ ᛪ ᛏ ᚱ ᚨ ✦ ᚜` / `✦ ᛈ ᛟ ᚹ ᛖ ᚱ ✦`) e Única (`᚛ ✦ ᚢ ᚾ ᛁ ᚲ ᚨ ✦ ᚜` / `✦ ᚨ ᚱ ᚲ ᚨ ᚾ ᚢ ᛗ ✦`).
  5. **Banner do Caçador com Transliteração Dinâmica**: Criada função pura `toElderFuthark` em [`HomeView.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/views/HomeView.tsx) que translitera em tempo real o nome do caçador no perfil para o alfabeto rúnico nórdico na borda superior do banner de status.
  6. **Decreto Rúnico em Modais**: [`SystemModal.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/SystemModal.tsx) atualizado com moldura rúnica sagrada `✦ ᛋ ᚨ ᚲ ᚱ ᛖ ᛞ · ᛟ ᚱ ᛞ ᛖ ᚱ ✦`.
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
  1. Em [`geminiService.ts`](file:///workspaces/Slime-Skill-Sage/apps/api/src/services/geminiService.ts): sanitização ativa de mensagens antes do envio à API Gemini, removendo mensagens de assistente no início para assegurar que a conversa sempre inicie com o turno do `user`, e adicionado suporte a `GEMINI_API_KEY_RESERVE` no failover de credenciais.
  2. Em [`geminiService.ts`](file:///workspaces/Slime-Skill-Sage/apps/api/src/services/geminiService.ts): proteção defensiva completa com validação de nulos em `toolCalls` para todas as ferramentas (`create_project_tree`, `add_missions`, `update_mission`, `delete_mission`).
  3. Em [`vite.config.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/vite.config.ts) e [`apiClient.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/apiClient.ts): configurado listener de erro no proxy do Vite para retornar HTTP 503 com payload JSON descritivo (`BACKEND_OFFLINE`), e mensagens de erro no frontend agora instruem com clareza a verificação do comando `pnpm dev`.
  4. Em [`server.ts`](file:///workspaces/Slime-Skill-Sage/apps/api/src/server.ts): suporte a múltiplos caminhos de resolução do arquivo `.env`.
  5. Suíte completa de testes executada e 100% verde (161/161 testes passando).
- **Status:** [x] Validado pelo Usuário

### Rodada 2 de Testes do Usuário (Depreciação de Modelo Gemini & Modo de Hibernação Neural)

- **Feedback do Usuário:**
  - "aviso: conexão neural com arquivos centrais indisonivel temporariamente. A grande sabio entoru em modo de hibernação neura, suas diretrizem continuam em pleno funcionamento"
- **Causa Raiz Identificada (Debug):**
  - O modelo configurado no código era `gemini-2.0-flash`. A API do Google Generative Language descontinuou esse identificador, retornando HTTP 404: *"This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash"*.
  - O mecanismo de resiliência da Grande Sábio capturou a resposta e entrou em modo de hibernação neural gracioso (HTTP 200), evitando queda do servidor.
- **Correção Aplicada + Teste de Integração Real:**
  1. Em [`geminiService.ts`](file:///workspaces/Slime-Skill-Sage/apps/api/src/services/geminiService.ts): atualizado o modelo de chat para `gemini-3.8-flash`.
  2. Em [`geminiService.ts`](file:///workspaces/Slime-Skill-Sage/apps/api/src/services/geminiService.ts): atualizado o modelo de síntese de voz Kore para `gemini-3.8-flash-tts`.
  3. Teste real de integração executado com sucesso: geração da árvore estruturada de projeto (`create_project_tree`) e síntese de áudio WAV via voz Kore (607KB gerados).
- **Status:** [x] Validado pelo Usuário

### Rodada 3 de Testes do Usuário (Telemetria de Tokens & Logs Neurais no Painel Dev)

- **Feedback do Usuário:**
  - "como posso ver o usage da api key?" e "Não há logs de chamadas neurais"
- **Causa Raiz & Solução Aplicada:**
  - Não havia agregação visual e persistente de consumo de tokens (prompt, completion, total) acessível diretamente na interface do app.
  - Implementado em [`packages/shared/src/index.ts`](file:///workspaces/Slime-Skill-Sage/packages/shared/src/index.ts) o schema `ChatUsageSchema`.
  - Em [`geminiService.ts`](file:///workspaces/Slime-Skill-Sage/apps/api/src/services/geminiService.ts): extração e devolução precisa de `usage: { prompt_tokens, completion_tokens, total_tokens }`.
  - Em [`GsChatView.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/views/GsChatView.tsx): persistência de estatísticas acumuladas no IndexedDB (`localDb.setKv("ai_usage_stats", ...)`).
  - Em [`DevPanel.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/DevPanel.tsx): adição de banner dourado de telemetria de tokens com totalizador de tokens consumidos, requisições feitas e modelos ativos, além de logs sob o filtro `ai (Canal Neural & Gemini)`.
- **Status:** [x] Validado pelo Usuário

### Rodada 4 de Testes do Usuário (Estética dos Botões & Remoção de Cantos Arredondados)

- **Feedback do Usuário:**
  - "não gostei dos botões, muito redondos, não tem a estetica de rpg"
- **Causa Raiz & Redesign Aplicado:**
  - `SystemButton.tsx` utilizava classes residuais de cantos arredondados (`rounded-md`, `rounded-lg`, `rounded-xl`), que quebravam a imersão gótica/medieval inspirada em *Tensura* e `docs/design.png`.
  - Em [`SystemButton.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/SystemButton.tsx):
    1. Removidas todas as classes arredondadas, aplicando estritamente `rounded-none`.
    2. Adicionada moldura interna decorativa fina estilo placa/cartouche de RPG (`inset-[2px] border border-current opacity-20`).
    3. Adicionados ornamentos de diamante nos cantos da cartela (`-top-[2px] -left-[2px] w-1 h-1 bg-[#dfa86c]`).
    4. Adicionados entalhes centrais em losango cartouche (`rotate-45`) nos botões de destaque (primário e ouro).
    5. Gradientes e bordas refinados em ouro antigo e obsidiana profunda.
  - Em [`SystemBadge.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/system/SystemBadge.tsx): todos os badges convertidos de `rounded` para `rounded-none`.
  - Suíte completa de testes executada com 100% de aprovação (161/161 testes passando).
- **Status:** [x] Validado pelo Usuário

## Fase 7 — Modo Coordenador da G.S, Validação Anti-Duplicatas, Snapshot de Memória e Áudios Oficiais de Projeto

### Rodada 1 de Testes do Usuário (Densificação de Atividades, Áudios de Início/Fim e Preparação Silenciosa de Evolução)

- **Feedback do Usuário:**
  - "Algo que eu queria adicionar é que a G.S tem que ter um audio já pronto quanto um plano for aceito e a habilidade ja foi especificada, e ai quando ele termina o projeto a habilidade tem um audio dado, já pronto, entretanto eu quero que apenas seja isso caso, alem disso queria que a G.S desse mais atividades, são poucas atividades para muitas coisas, aprender rust por exemplo, tem muita coisa que precisa aprender teria que ser tipo, atv 1( variaveis) , condicionais e etc"
  - "então as coisas da fase 10 coloque no plan.md e começe a fazer os outros 2 topicos"
- **Implementações e Soluções Aplicadas:**
  1. **Densificação de Missões do Modo Coordenador (7 a 12 atividades em DAG Misto):**
     - Em [`packages/shared/src/index.ts`](file:///workspaces/Slime-Skill-Sage/packages/shared/src/index.ts) e [`apps/api/src/services/geminiService.ts`](file:///workspaces/Slime-Skill-Sage/apps/api/src/services/geminiService.ts): atualizadas as diretrizes da G.S (`GS_COORDINATOR_RULES` e schema de `create_project_tree`) para que tópicos amplos/técnicos gerem planos granulares e realistas com entre 7 e 12 missões dispostas em topologia DAG mista (paralelas + dependências lineares onde essencial).
  2. **Preparação Oculta de Evolução de Habilidade:**
     - A G.S gera silenciosamente `next_evolution_name` e `next_evolution_description` para `target_skill` durante a formulação do plano e **nunca** revela esse nome no chat para preservar o mistério arcano.
     - Persistência garantida no IndexedDB (`projectRepository.ts`) e preservação no diff de habilidades (`classifySkillsDiff` e `preCardValidator.ts`).
  3. **Áudio de Início de Projeto (`project-start.mp3`):**
     - Gerado clipe de voz oficial com o modelo `gemini-3.8-flash-tts` e voz neural `Kore`: *"Aviso da Grande Sábio. Parâmetros do projeto aceitos. Protocolo de treino iniciado."* salvo em [`apps/pwa/public/audio/voice/project-start.mp3`](file:///workspaces/Slime-Skill-Sage/apps/pwa/public/audio/voice/project-start.mp3).
     - Em [`GsChatView.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/views/GsChatView.tsx): ao aceitar uma proposta (`handleAcceptProposal`), se o projeto possuir `target_skill`, dispara `worldVoiceService.playVoiceClip("/audio/voice/project-start.mp3")`.
  4. **Áudio Solene de Conclusão de Projeto Vinculado a Skill:**
     - Ao concluir a última missão de um projeto no [`gameService.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/gameService.ts), o evento `PROJECT_COMPLETE` é emitido com `hasSkill: true/false`.
     - Em [`worldVoiceService.ts`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/worldVoiceService.ts): o modal cerimonial e o áudio solene de habilidade adquirida (`/audio/voice/skill-acquired.mp3`) são disparados **exclusivamente** quando `hasSkill === true`.
  5. **Planejamento da Fase 10 em `plan.md`:**
     - Documentada a mecânica de ascensão Comum → Extra aos 100 pontos de maestria consumindo o segredo previamente arquivado na criação do projeto, com modal cerimonial e anúncio solene da G.S.
- **Status:** [x] Validado pelo Usuário

## Fase 8 — Onboarding: Apresentação da G.S com Áudios Oficiais, Efeito Typewriter e Revelação Inicial via API

### Rodada 1 de Testes do Usuário (Sliders/Scrollbars no Painel Dev, Voz Sincronizada da G.S, Velocidade de Fala, Cancelamento e Regeneração/Edição no Chat)

- **Feedback do Usuário:**
  - *"está tudo funcionando, agora vamos iniciar o debug, percebi que os sliders (subbir ou descer) da pagina não estão funcionando direito, como no painel de dev que quanto tem muitos elementos o slider de cima fica amassado, e no de chat, o usuario deve ter capacidade de impedir requisição, cancelar pedido de audio, e quando o usuario pergunta deve vir junto a fala da G.S junto da resposta, e a fala tem que ser mais rapida, alem disso o usuario deve ter um botão pra pedir uma nova resposta para a gs"*
- **Decisões Alinhadas (`/grill-me`) & Causa Raiz Identificada:**
  1. **Barras de Abas Amassadas & Sliders de Rolagem (`DevPanel.tsx`, `SettingsModal.tsx`, `index.css`):**
     - No `DevPanel.tsx`, o cabeçalho e a barra horizontal de abas não possuíam `shrink-0` e o corpo rolável não possuía `min-h-0`, fazendo com que o Flexbox esmagasse verticalmente a barra de abas superior quando havia muitos elementos (logs, cartões de voz, etc.).
     - Aplicado `shrink-0` no cabeçalho e na barra de abas (`flex-nowrap overflow-x-auto`) com `shrink-0` em cada botão de aba, e `flex-1 min-h-0 overflow-y-auto` no container de conteúdo. Reforçada também a barra de rolagem customizada (`::-webkit-scrollbar` com `8px` e contraste dourado `#dfa86c`/`#fde047`) em [`apps/pwa/src/index.css`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/index.css).
  2. **Voz Automática da G.S Sincronizada com o Texto (`GsChatView.tsx` & `gsVoiceService.ts`):**
     - Ativada por padrão (`true`), lendo a resposta completa limpa de markdown, com botão rápido de Mute/Auto-Voz (`Voz G.S: ON/OFF`) no topo do chat e no modal de configurações.
     - Implementado `gsVoiceService.prepareSpeech(text, signal)` + `gsVoiceService.playPreparedSpeech(speech)`: o `GsChatView` aguarda o áudio ficar pronto antes de exibir o balão da resposta, garantindo que o texto e a voz da G.S iniciem no exato mesmo instante.
  3. **Fala Mais Rápida da G.S (1.0x a 2.0x):**
     - Definida velocidade padrão `1.25x` (`DEFAULT_GS_PLAYBACK_RATE = 1.25`, com `preservesPitch = true`).
     - Adicionado slider configurável de `1.0x` até `2.0x` (com botões rápidos `1.0x`, `1.2x`, `1.35x`, `1.5x`, `1.75x`, `2.0x`) tanto em [`SettingsModal.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/SettingsModal.tsx) quanto na aba "Testes de Voz" ([`VoicesView.tsx`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/components/views/VoicesView.tsx)).
  4. **Impedir Requisição do Chat & Cancelar Pedido de Áudio (`GsChatView.tsx` & `apiClient.ts`):**
     - Adicionado suporte a `AbortSignal` em `sendChatMessage` e `synthesizeSpeechApi`.
     - Botão **"Parar (■)"** durante o processamento da requisição para abortar imediatamente o `/chat` sem poluir o histórico.
     - Botão **"Cancelar Áudio (Exibir Texto)"** durante a sincronização da síntese neural para abortar apenas o `/tts` e exibir o texto da resposta imediatamente sem áudio, além do botão **"Parar Voz"** em cada mensagem.
  5. **Pedir Nova Resposta (Regerar) & Editar Pergunta Anterior (`GsChatView.tsx` & `chatRepository.ts`):**
     - Adicionado botão **"Nova Resposta (Regerar)"** na última mensagem da G.S, que apaga a resposta anterior, reenvia o contexto ao `/chat` e sintetiza a nova fala.
     - Adicionado botão **"Editar"** nas mensagens do usuário, abrindo edição inline com **"Salvar e Regerar"** (que trunca as mensagens posteriores via `chatRepository.truncateMessagesAfter` e gera uma nova resposta sincronizada com voz).

### Rodada 2 de Testes do Usuário (Rolagem Exclusiva das Mensagens no Chat G.S & Atualização Automática de Abas após Decreto)

- **Feedback do Usuário:**
  - *"Na pagina do Chat da gs,tem como rolar, mas isso só deveria acontecer apenas se as mensagens ultrapassasem o tamanho da pagina, deveria alem disos fazer slide só do chat, o bloco de texto deve sempre aparecer para o usuario, outra coisa, apos aceitar um decreto, a pagina de projetos ou a futura pagina de agenda deve atualizar automaticamente"*
- **Causa Raiz Identificada & Correção Aplicada:**
  1. **Rolagem da Página no Chat da G.S & Visibilidade Fixa da Caixa de Texto (`HomeScreen.tsx` & `GsChatView.tsx`):**
     - **Causa Raiz:** Na aba `gs`, `HomeScreen.tsx` aplicava `min-h-screen pb-24 md:pb-28` somado ao `SystemHeader`, ao padding do `<main>` e ao `h-[calc(100vh-140px)]` do `GsChatView`, gerando ~84px de altura excedente no documento e criando uma barra de rolagem na janela inteira (além do uso de `scrollIntoView` que podia rolar o `window`).
     - **Correção:** Na aba `gs`, `HomeScreen.tsx` agora trava exatamente na altura da viewport (`h-[100dvh] overflow-hidden`) com `<main className="flex-1 min-h-0 flex flex-col overflow-hidden ...">` e `GsChatView` ocupa `flex-1 min-h-0 h-full overflow-hidden`. A rolagem ocorre **exclusivamente** no container interno de mensagens (`messagesContainerRef` com `flex-1 min-h-0 overflow-y-auto`) e **somente quando `scrollHeight > clientHeight`**, mantendo a barra de entrada de texto e atalhos 100% visíveis e fixos acima da `TabBar`.
  2. **Atualização Automática de Projetos, Árvore de Missões, Skills, Home e Futura Agenda ao Aceitar Decreto (`projectRepository.ts`, `ProjectsView.tsx`, `ProjectTreeViewer.tsx`, `HomeView.tsx`, `SkillsView.tsx`):**
     - **Causa Raiz:** Como as abas permanecem montadas no DOM (`block`/`hidden` em `HomeScreen.tsx` para evitar flicker), quando o `GsChatView` gravava diretamente via `projectRepository` ao aceitar um decreto, o `ProjectsView` não recebia notificação de mudança.
     - **Correção:** Implementado barramento reativo `projectRepository.subscribe(listener)` / `notifyChange()` disparado em todas as operações de escrita (`createProject`, `createProjectTree`, `updateProject`, `softDeleteProject`, `recalculateProjectProgress`, `bindSkillsAndRewardsForMissions`). Conectados `ProjectsView`, `ProjectTreeViewer`, `HomeView` e `SkillsView` a esse barramento para atualização imediata e automática assim que qualquer decreto for aceito.
- **Status:** [x] Validado pelo Usuário

### Rodada 3 de Testes do Usuário (Diagrama de Atributos Vivo, Expansão e Recuo de Patamar, Identidade "O Escolhido", Curva Exponencial e Textura de Mana/Runas)

- **Feedback do Usuário:**
  - *"vamos melhorar o diagrama de atributos, é muito monotono mude a moldura, as cores e a textura do próprio gráfico conforme o jogador atinge patamares específicos, eu não sei me dê ideias"*
  - *"faça um plano de implementação, e tambem quero que o grafico diminua com o tempo, tipo, vai até um tamanho quando o tier de uma classe de atributo, quando chega ao maximo para evoluir pro proximo patamar o maximo do grafico volta, tipo, de 100 de 100, é 1, então é o maximo visual do atributo, mas ao evoluir, continua 100 mas 100 de 1000, que é 0.1 de 1 ou seja no mais perto do 0"*
  - *"alem disso o crescimento da dificuldade de subir pontos deve ser exponencial, como uma curva de aprendizado que quanto maior, mais lento, mas de modo aceitavel ainda"*
  - *"opção 1 mesmo"* (Aprovação do plano detalhado e da unificação canônica da identidade do jogador como **O Escolhido**).
- **Causa Raiz & Melhorias Implementadas:**
  1. **Unificação Terminológica Canônica ("O Escolhido"):**
     - O termo "Caçador" foi substituído globalmente por **"O Escolhido"** (o ser selecionado pelas Leis da Criação para comandar o Sistema e manter o elo com a Grande Sábio e a Voz do Mundo).
     - Atualizados: `StatusView.tsx` (*"PAINEL DE ATRIBUTOS // REGISTRO DO ESCOLHIDO"*, *"Escolhido: [Nome]"*, *"Rank do Escolhido"*), `HomeView.tsx` (*"Atributos do Escolhido"*), `HomeScreen.tsx`, `GsChatView.tsx` (*"VOCÊ // ESCOLHIDO"*, *"Qual é o seu direcionamento, Escolhido?"*), `DevPanel.tsx` (*"Snapshot de Memória do Escolhido"*), `packages/shared` (`GS_SYSTEM_PROMPT`, `GS_COORDINATOR_RULES` e alias `ChosenContext`), e `packages/game/src/attributes.ts` (`OVERALL_CHOSEN_TITLES`).
  2. **Escala Dinâmica com Expansão e Recuo ("Horizonte Vivo"):**
     - Criada a função pura `calculateDynamicAttributeCeiling(highestStatValue)` em `packages/game/src/attributes.ts`.
     - Conforme o Escolhido avança no Grau ativo, o gráfico expande rumo à borda ($1.0$). Ao atingir o teto e cruzar para o próximo Grau/Tier, o teto avança cumulativamente e o polígono recua proporcionalmente de volta para perto do centro (ex: de $1.000/1.000 = 1.0$ para $1.000/3.378 = 0.296$), iniciando um novo ciclo com transição visual suave (`transition-all duration-700 ease-out`).
     - Piso geométrico de $0.08$ garantido para evitar colapso visual do vértice no início da jornada.
  3. **Curva de Aprendizado Exponencial Suave (Expoente 1.25):**
     - Em `packages/game/src/attributes.ts`: `pointsRequiredForGrade(gradeIndex) = round(1000 * gradeIndex^1.25)` e `getCumulativePointsForGrade(gradeIndex)`.
     - Em `packages/game/src/skills.ts`: `calculateMasteryGainWithDecay(currentMastery, rawDelta)` aplica retorno decrescente suave após a metade do caminho ($>150$ pts de 300) com piso mínimo de 1 pt, integrado a `calculateSkillProgression(..., { applyLearningCurve: true })`.
  4. **Aura Sintonizada pelo Atributo Dominante:**
     - O radar detecta o atributo com maior valor entre os 5 e ajusta dinamicamente toda a paleta visual da moldura, linhas de grade, vértices e gradientes:
       - **INT**: Azul Celeste / Safira Arcana (`#00f3ff`, `#0284c7`, `#38bdf8`)
       - **FOR**: Carmesim Titânico / Rubi de Batalha (`#ff3366`, `#e11d48`, `#fb7185`)
       - **DIS**: Ouro Solar Imperial (`#fde047`, `#dfa86c`, `#eab308`)
       - **CRI**: Violeta Cósmico / Ametista Etérea (`#c084fc`, `#9333ea`, `#a855f7`)
       - **SOC**: Esmeralda Primordial da Harmonia (`#34d399`, `#059669`, `#10b981`)
  5. **Textura: Nebulosa de Mana Orgânica & Partículas Rúnicas Flutuantes:**
     - `<radialGradient id="manaNebulaGradient">` com ponto focal no centro do polígono e pulso de mana.
     - Glifos em Elder Futhark nórdico (`ᚠ ᚢ ᚦ ᚨ ᚱ ᛋ ᛏ ᛟ ᛗ`) flutuando organicamente no interior do pentágono com animação suave via `@keyframes floatRuneAnim`.
  6. **Círculos Mágicos e Molduras por Patamar:**
     - Círculos celestiais concêntricos que ganham anéis rúnicos no Tier II+ e círculos de invocação suprema com entalhes no Tier VI+ (Transcendental / O Absoluto).
  7. **Interação Rúnica Completa (Hover / Touch):**
     - Clique ou toque em qualquer vértice, eixo ou label destaca o caminho com halo luminoso e expande o Card/Tooltip Rúnico com o título do Grau, maestria atual, pontos restantes para o próximo grau, teto do horizonte vivo e barra de progresso do Grau.
- **Status:** [x] Validado com 100% de Testes Monorepo Passando (120 testes PWA, 71 testes Game, 11 testes Shared, 11 testes API).

## Fase 9 — Motor de Jogo (Parte 2): Classes por Área e Evolução com Desafio Autodeclarado

### Rodada 1 de Testes do Usuário (Carregamento de Módulos no Codespaces & Calibração de Dificuldade com 10 Patamares e Formatação [Nome da Classe IV])

- **Feedback do Usuário:**
  1. *"Falha no carregamento do módulo com origem em https://...-5173.app.github.dev/src/main.tsx... @react-refresh, @vite-plugin-pwa, @vite/client"*
  2. *"sobre as coisas que eu testei, as classes por area e os titulos, devem ser mais dificeis de ocnseguir, assim como os patamarares, alem disso nos patamares, deve ser mostrado o nivel tipo: [analista metodico IV] para ser mais facil entender"*
  3. Via `/grill-me`: Alinhado que os patamares de classe e títulos devem seguir a escala de 1 a 10 patamares predefinidos do plano (1 a 50.000 pts de maestria), com o formato canônico com colchetes e numerais romanos `[Nome da Classe <ROMAN>]` em tudo (título equipado, cards de área, modal de seleção e anúncios da Voz do Mundo), provações escalonadas e atalhos rápidos no Painel Dev (+1k, +5k).

- **Causa Raiz Identificada & Correções Aplicadas:**
  1. **Bloqueio de Host no Vite 6 em Ambientes Remotos (`apps/pwa/vite.config.ts`):**
     - O Vite 6 introduziu verificação estrita de host por padrão, rejeitando requisições com header `Host: *.app.github.dev` com HTTP 403 Forbidden.
     - Configurado `server.allowedHosts: true` e `server.hmr: { clientPort: 443 }` para túnel seguro do GitHub Codespaces.
  2. **Escala Canônica de 10 Patamares Alinhada com 50.000 pts (`packages/game/src/classes.ts`):**
     - Substituída a escala inicial de 5 patamares (0 a 3.000 pts) pela escala completa de **10 Patamares Canônicos (1 a 10)** alinhada à progressão de maestria até 50.000 pts:
       - Tier I: Aprendiz (0 pts)
       - Tier II: Iniciante (5.000 pts)
       - Tier III: Adepto (10.000 pts)
       - Tier IV: Veterano (15.000 pts)
       - Tier V: Especialista (20.000 pts)
       - Tier VI: Mestre (25.000 pts)
       - Tier VII: Grão-Mestre (30.000 pts)
       - Tier VIII: Sábio (35.000 pts)
       - Tier IX: Monarca (40.000 pts)
       - Tier X: Lendário (45.000 pts / Ápice 50.000 pts)
  3. **Formatação Canônica com Colchetes e Numerais Romanos `[Nome da Classe <ROMAN>]`:**
     - Criada a função pura idempotente `formatClassTitle(name, tier)` em `packages/game/src/classes.ts`.
     - Integrada em `BASE_CLASS_NAMES` (ex: `[Aprendiz da Lógica I]`), `proposeChallenge`, `completeChallenge`, `equipTitle`, `StatusView.tsx` e `WorldVoiceModal`.
     - O Título Principal, cards das 5 áreas, modal de seleção de títulos e anúncios cerimoniais agora exibem de forma elegante e clara o nível exato: ex: `[Analista Metódico II]`, `[Decifrador de Padrões IV]`, `[A Onisciência Absoluta X]`.
  4. **Desafios Determinísticos Escalonados para os 10 Patamares:**
     - O banco determinístico offline e o gerador de desafios cobrem todos os patamares de 2 a 10, com complexidade e prestígio crescentes.
     - A tool `propose_class_challenge` no backend Hono (`apps/api/src/services/geminiService.ts`) foi atualizada para gerar desafios de tiers 2 a 10 exigindo a formatação `[Nome da Classe <ROMAN>]`.
- **Status:** [x] Implementado com Sucesso e Validado nos Testes Automáticos (234/234 testes passando, 97.3% cobertura em game)

### Rodada 2 de Testes do Usuário (Reatividade Imediata de XP/Maestria no Diagrama de Atributos e nos Cards de Área)

- **Feedback do Usuário:**
  - *"nem o diagrama de atributos, nem os cartõe por area estão demonstrando a mudança de xp"*
- **Causa Raiz Identificada & Correção Aplicada:**
  1. **Cálculo de Atributos Restrito a Habilidades (`gameService.ts`):**
     - Em `getAttributes()`, havia a verificação `if (skills.length > 0) return calculateAttributesFromSkills(skills);`. Quando o Escolhido já possuía qualquer habilidade no banco, o método ignorava todos os registros de `xp_event` do Ledger imutável que não estivessem atrelados a uma habilidade específica (como a maestria manual de teste injetada pelo Painel Dev ou missões gerais da área).
     - **Correção:** `getAttributes()` agora calcula os atributos diretamente do Ledger (`calculateAttributesFromLedger(events)`), mesclando com o teto de habilidades existentes via `Math.max(ledgerAttrs[code], skillAttrs[code])`.
  2. **Ausência de Despacho de Evento Reativo em `addManualMastery` (`gameService.ts`):**
     - O método `addManualMastery` persistia o evento no Ledger e reconciliava o perfil, mas não chamava `this.dispatchEvent(...)`. Como a `StatusView` escuta o barramento de `gameService.subscribeToGameEvents(...)`, ela não era notificada em tempo real para recarregar o diagrama e os cartões.
     - **Correção:** Adicionado o evento `MASTERY_GAINED` à união `GameEvent` em `packages/game/src/ledger.ts` e disparado imediatamente em `addManualMastery`, atualizando também `area.current_xp`.
  3. **Legenda Desatualizada em `StatusView.tsx`:**
     - Atualizado o subtítulo de `Classes por Área` para refletir os *"10 Patamares Canônicos de Maestria (1 a 50.000 pts · Escala do Escolhido I a X)"*.
- **Status:** [x] Validado pelo Usuário (100% de testes aprovados — 235/235 testes monorepo, 97.3% cobertura em game).

## Fase 10 — Auditoria de Confiabilidade e Hardening Lógico do Sistema

### Rodada 1 de Auditoria Interna de Lógica de Programação

- **Solicitação do Usuário:**
  - *"analise a logica de programação do app e crie um relatorio com os erros achados que podem quebrar o app"*
  - *"aplique as correções e não interfira no trabalho da equipe teamwork, eles são muito importantes"*
- **Vulnerabilidades Identificadas e Sanadas:**
  1. **Atomicidade no Altar de Fusão ([`fuseSkills`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/gameService.ts)):**
     - O sacrifício de duas habilidades e inserção da habilidade fundida era realizado em 3 etapas assíncronas separadas. Se houvesse queda de energia, fechamento do app ou falha no meio, o usuário perdia as habilidades originais sem receber a nova.
     - **Correção:** `LocalDatabase.putAtomic` foi estendido com suporte a operações mistas (`put` + `delete`) em uma única transação atômica do IndexedDB, migrando automaticamente chaves estrangeiras em `mission_reward.skill_id`.
  2. **Cascata e Integridade do Ledger ao Desfazer Missões ([`undoMissionCompletion`](file:///workspaces/Slime-Skill-Sage/apps/pwa/src/services/gameService.ts)):**
     - A reversão de uma missão pré-requisito resetava missões dependentes para `bloqueada` sem estornar o XP delas no Ledger. Ao refazê-las, o usuário duplicava XP, quebrando a Regra de Ouro #2 (Ledger).
     - **Correção:** Implementada trava impeditiva que bloqueia o desfecho de missões pré-requisito caso existam dependentes já concluídas.
  3. **Concorrência e Locks Assíncronos (`AsyncMutex`):**
     - Cliques múltiplos e rápidos em missões paralelas causavam divergência de XP entre o cálculo em memória e o total do Ledger.
     - **Correção:** Fila serializada assíncrona (`AsyncMutex`) implementada para operações de mutação do Ledger e Perfil.
  4. **Reconciliação Dinâmica da Ofensiva Diária (Streak):**
     - O campo `streak_count` nunca era recalculado pelo ciclo de vida da aplicação.
     - **Correção:** Implementada reconciliação de calendário para incrementar ofensiva em dias consecutivos e resetar em caso de hiato superior a 1 dia.
  5. **Controle de Memória e I/O de Áudio e Logs:**
     - A rotação de logs foi desacoplada da escrita individual para lotes de 25 registros, e o cache de áudio neural da G.S recebeu política LRU limitando o armazenamento a 40 mensagens.
- **Status:** [x] Implementado com Sucesso e Validado pela Suíte de Testes (100% de testes verdes).




