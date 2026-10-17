export interface VoiceClip {
  id: string;
  title: string;
  subtitle: string;
  category: "Core Events" | "Modo Foco" | "Evolução" | "Habilidades";
  url: string;
  transcript: string;
  badge: string;
  colorVariant: "cyan" | "gold" | "purple";
}

export const OFFICIAL_VOICE_CLIPS: VoiceClip[] = [
  {
    id: "mission-complete",
    title: "Missão Concluída",
    subtitle: "[VOZ DO MUNDO // RECOMPENSA DE DIRETRIZ]",
    category: "Core Events",
    url: "/audio/voice/mission-complete.mp3",
    transcript: "Aviso do Sistema. Missão concluída com sucesso. Recompensa calculada e creditada.",
    badge: "MISSÃO",
    colorVariant: "cyan",
  },
  {
    id: "level-up",
    title: "Novo Nível Alcançado",
    subtitle: "[VOZ DO MUNDO // PROTOCOLO DE DESPERTAR]",
    category: "Core Events",
    url: "/audio/voice/level-up.mp3",
    transcript: "Aviso. O indivíduo atingiu os requisitos necessários. Nível aumentado.",
    badge: "LEVEL UP",
    colorVariant: "cyan",
  },
  {
    id: "rank-up",
    title: "Evolução de Classe (Alerta Urgente)",
    subtitle: "[GRANDE SÁBIO // ALERTA DE ASCENSÃO]",
    category: "Evolução",
    url: "/audio/voice/rank-up.mp3",
    transcript: "Aviso! Aviso! O usuário cumpriu os requisitos, a evolução de classe foi iniciada!",
    badge: "CLASSE",
    colorVariant: "gold",
  },
  {
    id: "skill-acquired",
    title: "Habilidade Adquirida",
    subtitle: "[VOZ DO MUNDO // AQUISIÇÃO]",
    category: "Habilidades",
    url: "/audio/voice/skill-acquired.mp3",
    transcript: "Aviso. Condições atendidas. Nova habilidade gravada na Árvore do Caçador.",
    badge: "COMUM",
    colorVariant: "cyan",
  },
  {
    id: "skill-evolved-extra",
    title: "Evolução: Habilidade Extra",
    subtitle: "[VOZ DO MUNDO // GRAU EXTRA]",
    category: "Habilidades",
    url: "/audio/voice/skill-evolved-extra.mp3",
    transcript: "Confirmação. Requisitos preenchidos. A habilidade rompeu seus limites fundamentais, ascendendo à categoria Extra.",
    badge: "EXTRA",
    colorVariant: "gold",
  },
  {
    id: "skill-evolved-unique",
    title: "Evolução: Habilidade Única",
    subtitle: "[VOZ DO MUNDO // GRAU ÚNICO]",
    category: "Habilidades",
    url: "/audio/voice/skill-evolved-unique.mp3",
    transcript: "Aviso do Sistema. Despertar confirmado. A essência do indivíduo consolidou uma Habilidade Única.",
    badge: "ÚNICA",
    colorVariant: "purple",
  },
  {
    id: "skill-evolved-foco-aceleracao",
    title: "Evolução: Aceleração do Pensamento",
    subtitle: "[VOZ DO MUNDO // MESTRIA DE FOCO]",
    category: "Habilidades",
    url: "/audio/voice/skill-evolved-foco-aceleracao.mp3",
    transcript: "Mestria total atingida. Habilidade de concentração evoluiu para 'Aceleração do Pensamento'.",
    badge: "EXTRA+",
    colorVariant: "gold",
  },
  {
    id: "focus-start",
    title: "Modo Foco Ativado",
    subtitle: "[GRANDE SÁBIO // PROTOCOLO DE HIPERFOCO]",
    category: "Modo Foco",
    url: "/audio/voice/focus-start.mp3",
    transcript: "Modo Foco ativado. Interferências externas silenciadas. Produtividade máxima em curso.",
    badge: "FOCO",
    colorVariant: "cyan",
  },
  {
    id: "focus-break",
    title: "Quebra de Foco Detectada",
    subtitle: "[GRANDE SÁBIO // ALERTA DE DISPERSÃO]",
    category: "Modo Foco",
    url: "/audio/voice/focus-break.mp3",
    transcript: "Atenção. Quebra de foco detectada pelo Sistema. Realinhe a atenção aos objetivos.",
    badge: "ALERTA",
    colorVariant: "purple",
  },
];
