# Planejamento & Guia de Voz: Sistema / Grande Sábio & Voz do Mundo

Este documento reúne a arquitetura oficial de áudio, o mapeamento de frases canônicas e as diretrizes de integração das vozes da **Voz do Mundo** e da **Grande Sábio** no projeto **Slime Sage**.

---

## 1. Diretrizes Arquiteturais de Áudio

1. **Descarte Total da Web Speech API (`speechSynthesis`):**
   - O sintetizador nativo de fala do sistema operacional foi 100% descartado devido à qualidade engessada, robótica e sem a entonação solene característica de *Tensura*.
2. **Dois Mecanismos de Reprodução Complementares:**
   - **Áudios Estáticos Pré-Gravados (`.mp3` em `/audio/voice/`):** Utilizados para rituais e avisos com texto fixo (ex: abertura do Festival da Colheita, modo foco, fanfarras). Operam 100% offline com latência zero (0ms).
   - **Áudios Dinâmicos via API (Gemini 2.0 Flash Audio — voz `Kore`):** Gerados sob demanda pelo backend Hono (`POST /tts`) para frases que contêm nomes customizados (habilidades novas, evolução de patamar, nível atingido, decretos da G.S), com **cache local no IndexedDB** (reutilização instantânea sem novo custo de token).
3. **Regras de Acionamento Sonoro:**
   - **Missões Individuais:** NÃO tocam fala falada (apenas efeito sonoro sintético sutil via Web Audio API e vibração tátil para evitar fadiga sonora ao usuário).
   - **Projetos Concluídos (`PROJECT_COMPLETE`):** Tocam áudio solene e cerimonial de consagração da árvore de tarefas.
   - **Conectividade:** Subida de nível e anúncios dinâmicos dependem de conexão online; tarefas cotidianas, diárias e sessões de foco funcionam 100% offline.
   - **Avisos Proativos da G.S:** Caso haja pendências (tarefas da agenda próximas ou diárias por vencer), a G.S emite um **pop-up discreto/toast em voz** na tela, sem criar janelas ou retirar o usuário do contexto atual.

---

## 2. Tabela Canônica de Frases e Áudios do Sistema

Os arquivos estáticos ficam armazenados em: `apps/pwa/public/audio/voice/`

| Evento | Tipo / Origem | Arquivo de Destino | Frase Canônica / Descrição |
| :--- | :--- | :--- | :--- |
| **Projeto Concluído** | Estático / API | `project-complete.mp3` | *"Aviso da Grande Sábio. Projeto concluído com sucesso. Todos os objetivos da árvore foram alcançados."* |
| **Festival da Colheita** | Estático | `festival-colheita.mp3` | *"O Festival da Colheita foi iniciado! Todos os frutos de seu esforço foram reconhecidos pelo Sistema."* |
| **Level Up** | Dinâmico (API) | Cache IndexedDB | *"Aviso. O indivíduo atingiu os requisitos necessários. Nível aumentado para [Nível]."* |
| **Habilidade Adquirida** | Dinâmico (API) | Cache IndexedDB | *"Aviso. Condições atendidas. A habilidade '[Nome da Habilidade]' foi gravada na Árvore do Caçador."* |
| **Evolução de Habilidade (Extra)** | Dinâmico (API) | Cache IndexedDB | *"Confirmação. Requisitos preenchidos. A habilidade comum rompeu seus limites, ascendendo à habilidade extra '[Nome]'."* |
| **Evolução de Habilidade (Única)** | Dinâmico (API) | Cache IndexedDB | *"Aviso individual. O ritual de evolução foi concluído. A habilidade única '[Nome]' despertou."* |
| **Aumento de Ranque / Título** | Dinâmico (API) | Cache IndexedDB | *"Notificação do Sistema. O indivíduo ascendeu ao título de [Título no Atributo]."* |
| **Aceleração de Pensamento (Foco)** | Estático | `focus-start.mp3` | *"Aceleração de Pensamento iniciada. Concentração aumentada."* |
| **Alerta de Quebra de Foco** | Estático | `focus-break.mp3` | *"Atenção. Desvio de atenção detectado. Foco interrompido."* |

---

## 3. Síntese Neural via Backend Hono (Gemini Audio)

Para síntese em tempo real de nomes de habilidades e níveis:
- **Modelo:** `gemini-2.0-flash` com `response_modalities: ["AUDIO"]` e voz oficial **`Kore`** (timbre sereno, divino e preciso).
- **Endpoint:** `POST /tts` no servidor Hono (protegido por `APP_SECRET`).
- **Cache Local:** Quando o PWA recebe o fluxo de áudio, salva a chave `tts_audio_<hash_texto>` no IndexedDB. Se a mesma frase ou nome for requisitado novamente, toca direto do banco local com 0ms de latência.

---

## 4. Histórico e Próximos Passos
- **Fase 5:** Conexão dos eventos de projeto e áudios oficiais no `WorldVoiceModal`, eliminando o fallback do `speechSynthesis`.
- **Fase 6:** Implementação do endpoint `POST /tts` na API e botão "Ouvir G.S" no chat, com toasts em áudio para pendências.
- **Fase 10:** Integração da roleta com a cerimônia manual do **Festival da Colheita** (áudio `festival-colheita.mp3` e dobro de XP).
- **Fase 11:** Agenda integrada com tarefas com data/hora, tarefas recorrentes e mecânica de Hábitos / Habilidades Passivas.
