# Planejamento & Guia de Geração de Voz: Sistema / Voz do Mundo

Este documento reúne a análise técnica, o mapeamento de frases canônicas e as opções práticas para geração e integração das vozes de alta fidelidade da **Voz do Mundo** (e futura **Grande Sábio**) no projeto **Slime Sage**.

---

## 1. Contexto e Motivação

Atualmente, o projeto utiliza a **Web Speech API (`speechSynthesis`)** como sintetizador de fala. Embora seja funcional e 100% local, sua qualidade depende diretamente do sintetizador nativo do sistema operacional do usuário:
- No Linux, Android e navegadores sem vozes neurais instaladas, o resultado soa engessado, robótico e sem a entonação solene e imponente característica do anime (*Tensura / Solo Leveling*).
- Para entregar a melhor experiência imersiva ao usuário, a solução ideal para os anúncios recorrentes do Sistema é utilizar **áudios pré-gravados em alta definição (estúdio/IA)** salvos estaticamente no PWA.

### Benefícios dos Áudios Pré-Gravados
1. **Latência Zero (0ms):** O áudio toca instantaneamente na abertura do modal, sem engasgos ou espera por requisições de rede.
2. **100% Offline & Sem Custos:** Não depende de conexão com a internet, chave de API nem consumo de cotas de tokens.
3. **Qualidade Máxima Consistente:** O áudio é sintetizado uma única vez com o modelo de IA mais avançado, garantindo cadência cerimonial e clareza vocal.

---

## 2. Tabela Canônica de Frases do Sistema

Os anúncios da Voz do Mundo seguem fórmulas ritualísticas e concisas. Os arquivos devem ser salvos na pasta:
`apps/pwa/public/audio/voice/`

| Evento | Arquivo de Destino | Frase Canônica para Gravação |
| :--- | :--- | :--- |
| **Level Up** | `level-up.mp3` | *"Aviso. O indivíduo atingiu os requisitos necessários. Nível aumentado."* |
| **Habilidade Adquirida** | `skill-acquired.mp3` | *"Aviso. Condições atendidas. Habilidade adquirida com sucesso."* |
| **Evolução de Habilidade (Extra)** | `skill-evolved-extra.mp3` | *"Confirmação. Requisitos preenchidos. A habilidade comum rompeu seus limites, ascendendo à habilidade extra."* |
| **Evolução de Habilidade (Única)** | `skill-evolved-unique.mp3` | *"Aviso individual. O ritual de evolução foi concluído. Habilidade única despertada."* |
| **Aumento de Ranque** | `rank-up.mp3` | *"Notificação do Sistema. Aumento de ranque de caçador confirmado."* |
| **Missão Concluída** | `mission-complete.mp3` | *"Missão concluída. Recompensas e experiência concedidas."* |
| **Aceleração de Pensamento (Foco)** | `focus-start.mp3` | *"Aceleração de Pensamento iniciada. Concentração aumentada."* |
| **Alerta de Quebra de Foco** | `focus-break.mp3` | *"Atenção. Desvio de atenção detectado. Foco interrompido."* |

---

## 3. Opções para Criação dos Áudios

### Opção 1 — Google AI Studio (Voz Oficial do Gemini: `Kore`)
*Recomendada para fidelidade máxima com o ecossistema Gemini e controle manual da entonação.*

1. **Acesso:** Acesse [aistudio.google.com](https://aistudio.google.com/) e autentique-se com sua conta Google (gratuito).
2. **Seleção de Modelo:** Selecione **Gemini 2.0 Flash**.
3. **Configuração de Saída:**
   - No painel lateral direito, em **Generation Settings / Output Modality**, selecione **Audio**.
   - No campo **Voice**, selecione **`Kore`** (voz feminina serena, precisa e solene) ou **`Aoede`**.
4. **Instruções do Sistema (System Instructions):**
   ```text
   Você é a 'Voz do Mundo' do anime Tensura.
   Fale em português do Brasil com dicção perfeita, tom mecânico, calmo, imponente e divino.
   Mantenha pausas dramáticas nos pontos finais e evite qualquer hesitação ou inflexão emocional humana.
   ```
5. **Geração e Download:**
   - Envie cada frase individualmente (ex: `Diga exatamente: "Aviso. O indivíduo atingiu os requisitos necessários. Nível aumentado."`).
   - Ouça o player de áudio na resposta.
   - Clique no menu de três pontinhos **(⋮) do player > Fazer download**.
   - Salve o arquivo com o nome correspondente (ex: `level-up.wav` ou `level-up.mp3`) em `apps/pwa/public/audio/voice/`.

---

### Opção 2 — Automação via Terminal (Codespace / Script Local)
*Recomendada para quem busca rapidez, praticidade e zero esforço manual.*

Existem duas variações possíveis para execução via script no repositório:

#### Caminho 2A — Script Integrado com Gemini API (Requer `GEMINI_API_KEY`)
- Adiciona a variável `GEMINI_API_KEY` ao arquivo `apps/api/.env`.
- Executa um script Node.js (`scripts/generate-voices-gemini.mjs`) que consome a API do Gemini 2.0 com `response_modalities: ["AUDIO"]` e voz `Kore`.
- O script recebe o fluxo binário PCM a 24kHz, empacota em formato `.wav`/`.mp3` e grava automaticamente todos os arquivos na pasta pública.

#### Caminho 2B — Script com Vozes Neurais de Estúdio (Edge/Azure Neural — Imediato e Sem Chave)
- Utiliza o sintetizador de redes neurais profundas do Edge/Azure (ex: voz `pt-BR-FranciscaNeural` ou `pt-BR-ThalitaNeural` com cadência desacelerada formal).
- Não requer chaves de API, login ou configurações de ambiente.
- O script gera os 6 a 8 arquivos em menos de 15 segundos e salva diretamente no diretório do PWA.

---

### Opção 3 — ElevenLabs (Dublagem Profissional de Games)
*Para quem busca personalização extrema de timbre e efeitos cinematográficos.*

1. Acesse [elevenlabs.io](https://elevenlabs.io/) (10.000 caracteres gratuitos/mês).
2. Escolha ou clone uma voz com perfil *AI Assistant / Narrator* feminina calma.
3. Insira as frases canônicas em português.
4. Faça o download dos arquivos em formato `.mp3` e mova para `apps/pwa/public/audio/voice/`.

---

## 4. Integração no Código do PWA

### Estrutura de Diretórios
```text
apps/pwa/public/
└── audio/
    └── voice/
        ├── level-up.mp3
        ├── skill-acquired.mp3
        ├── skill-evolved-extra.mp3
        ├── skill-evolved-unique.mp3
        ├── rank-up.mp3
        └── mission-complete.mp3
```

### Lógica de Reprodução em `worldVoiceService.ts`
```typescript
const AUDIO_MAP: Record<string, string> = {
  LEVEL_UP: "/audio/voice/level-up.mp3",
  SKILL_ACQUIRED: "/audio/voice/skill-acquired.mp3",
  SKILL_EVOLVED_EXTRA: "/audio/voice/skill-evolved-extra.mp3",
};

// Ao acionar o modal da Voz do Mundo:
const audioSrc = AUDIO_MAP[item.type];
if (audioSrc) {
  const audio = new Audio(audioSrc);
  audio.play().catch(() => {
    // Fallback gracioso para Web Speech API se o áudio não for encontrado ou autoplay for restrito
    void ttsService.speak(item.spokenText);
  });
}
```

---

## 5. Histórico e Próximos Passos
- **Fase 5 (Atual):** Validação dos testes de usuário com a estrutura de modais, gráficos radar e feedback.
- **Transição para Áudios Pré-Gravados:** Escolha da opção de geração (Opção 1, 2A ou 2B) e inserção dos arquivos para elevar a imersão sonora.
- **Fase 6:** Conexão com o backend `/chat` do Gemini para as falas dinâmicas da **Grande Sábio**.
