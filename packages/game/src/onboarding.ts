import { type TensuraRace, type ThreatRank, type AreaCode } from "@slime-sage/shared";

export interface OnboardingOption {
  id: string;
  label: string;
  description: string;
  /** Pesos de afinidade racial desta opção */
  raceWeights: Partial<Record<TensuraRace, number>>;
  /** Pontuação de ameaça/constância atribuída (0 a 10) */
  threatPoints: number;
}

export interface OnboardingQuestion {
  id: "q1" | "q2" | "q3" | "q4" | "q5";
  stepNumber: number;
  title: string;
  prompt: string;
  audioUrl: string;
  runicInscription: string;
  options: OnboardingOption[];
}

export interface RaceMetadata {
  race: TensuraRace;
  title: string;
  dominantArea: AreaCode;
  runicSigil: string;
  description: string;
  affinityLabel: string;
}

export interface ThreatRankMetadata {
  rank: ThreatRank;
  minScore: number;
  badgeColor: string;
  description: string;
}

export interface OnboardingResult {
  race: TensuraRace;
  rankThreat: ThreatRank;
  raceMeta: RaceMetadata;
  rankMeta: ThreatRankMetadata;
  raceScores: Record<TensuraRace, number>;
  threatScore: number;
  suggestedTitle: string;
  proclamationText: string;
}

export const TENSURA_RACES_ORDER: readonly TensuraRace[] = [
  "Slime",
  "Kijin",
  "Draconiano",
  "Majin",
  "Homem-Fera",
] as const;

export const RACE_METADATA: Record<TensuraRace, RaceMetadata> = {
  Slime: {
    race: "Slime",
    title: "Assimilador Arcano",
    dominantArea: "INT",
    runicSigil: "᚛ ᛋ ᛚ ᛁ ᛗ ᛖ · ᛟ ᛗ ᚾ ᛁ ᚜",
    description:
      "Entidade de adaptabilidade infinita. Absorve conhecimentos díspares, analisa estruturas complexas e molda-se a qualquer adversidade.",
    affinityLabel: "Adaptabilidade & Análise (Predador)",
  },
  Kijin: {
    race: "Kijin",
    title: "Vanguarda da Superação",
    dominantArea: "FOR",
    runicSigil: "᚛ ᚲ ᛁ ᛃ ᛁ ᚾ · ᚠ ᛚ ᚨ ᛗ ᛖ ᚜",
    description:
      "Guerreiro espiritual de honra implacável. Rompe barreiras através do esforço concentrado, vigor físico e determinação indomável.",
    affinityLabel: "Superação & Força Marcial",
  },
  Draconiano: {
    race: "Draconiano",
    title: "Soberano da Disciplina",
    dominantArea: "DIS",
    runicSigil: "᚛ ᛞ ᚱ ᚨ ᚲ ᛟ · ᛟ ᚱ ᛞ ᛖ ᚱ ᚜",
    description:
      "Herdeiro da linhagem ancestral dos dragões. Possui foco inabalável, controle absoluto sobre os próprios impulsos e visão estratégica de longo prazo.",
    affinityLabel: "Foco Absoluto & Autocontrole",
  },
  Majin: {
    race: "Majin",
    title: "Arquiteto de Magia Original",
    dominantArea: "CRI",
    runicSigil: "᚛ ᛗ ᚨ ᛃ ᛁ ᚾ · ᚨ ᚱ ᚲ ᚨ ᚾ ᚨ ᚜",
    description:
      "Ser nascido da essência mágica pura. Reescreve as leis convencionais com engenhosidade, invenção autoral e pensamento fora dos padrões.",
    affinityLabel: "Criatividade & Inovação Arcana",
  },
  "Homem-Fera": {
    race: "Homem-Fera",
    title: "Guardião da Aliança Real",
    dominantArea: "SOC",
    runicSigil: "᚛ ᚠ ᛖ ᚱ ᚨ · ᚢ ᚾ ᛁ ᛏ ᚨ ᛋ ᚜",
    description:
      "Líder nato movido por instinto aguçado e lealdade inquebrantável. Inspira aliados, constrói comunidades fortes e multiplica o poder coletivo.",
    affinityLabel: "União, Liderança & Lealdade",
  },
};

export const THREAT_RANK_METADATA: Record<ThreatRank, ThreatRankMetadata> = {
  "Classe Menor": {
    rank: "Classe Menor",
    minScore: 0,
    badgeColor: "#dfa86c",
    description:
      "Essência em fase de estabilização. A centelha de poder despertou e aguarda a forja da disciplina diária para ascender.",
  },
  Hazard: {
    rank: "Hazard",
    minScore: 10,
    badgeColor: "#fde047",
    description:
      "Ameaça de grau elevado. Possui fundações sólidas de execução e capacidade comprovada de sustentar diretrizes rigorosas.",
  },
  Calamity: {
    rank: "Calamity",
    minScore: 18,
    badgeColor: "#00f3ff",
    description:
      "Anomalia de escala continental. Constância implacável e domínio de rotina que desafiam as leis comuns de evolução.",
  },
};

export const ONBOARDING_QUESTIONS: readonly OnboardingQuestion[] = [
  {
    id: "q1",
    stepNumber: 1,
    title: "I. A Diretriz da Adaptabilidade",
    prompt:
      "Primeira diretriz. Diante de um obstáculo imprevisto que desfaz seus planos originais, qual é o seu instinto primordial?",
    audioUrl: "/audio/voice/onboarding-q1.mp3",
    runicInscription: "᚛ ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ · ᛞ ᛁ ᚱ ᛖ ᛏ ᚱ ᛁ ᛉ · ᛁ ᚜",
    options: [
      {
        id: "q1_slime",
        label: "Absorver e Recalcular",
        description: "Analiso friamente o imprevisto, absorvo o que mudou e me adapto a uma nova rota.",
        raceWeights: { Slime: 3, Draconiano: 1 },
        threatPoints: 3,
      },
      {
        id: "q1_kijin",
        label: "Avançar com Força Total",
        description: "Redobro a intensidade e supero a barreira pela persistência direta.",
        raceWeights: { Kijin: 3 },
        threatPoints: 3,
      },
      {
        id: "q1_draco",
        label: "Blindar o Foco",
        description: "Mantenho a calma absoluta, isolo distrações e sigo um protocolo rigoroso.",
        raceWeights: { Draconiano: 3, Slime: 1 },
        threatPoints: 4,
      },
      {
        id: "q1_majin",
        label: "Reinventar as Regras",
        description: "Crio uma solução inédita e criativa que transforma o obstáculo em vantagem.",
        raceWeights: { Majin: 3 },
        threatPoints: 2,
      },
      {
        id: "q1_fera",
        label: "Mobilizar a Aliança",
        description: "Uno forças com pessoas de confiança para superar o desafio em conjunto.",
        raceWeights: { "Homem-Fera": 3 },
        threatPoints: 2,
      },
    ],
  },
  {
    id: "q2",
    stepNumber: 2,
    title: "II. A Diretriz da Superação",
    prompt:
      "Segunda diretriz. Quando um desafio exige esforço prolongado além dos seus limites atuais, como a sua determinação se manifesta?",
    audioUrl: "/audio/voice/onboarding-q2.mp3",
    runicInscription: "᚛ ᚲ ᛁ ᛃ ᛁ ᚾ · ᛞ ᛁ ᚱ ᛖ ᛏ ᚱ ᛁ ᛉ · ᛁ ᛁ ᚜",
    options: [
      {
        id: "q2_kijin",
        label: "Chama Inextinguível",
        description: "Encaro o desgaste de frente; quanto maior a pressão, mais forte me torno.",
        raceWeights: { Kijin: 3, Draconiano: 1 },
        threatPoints: 4,
      },
      {
        id: "q2_draco",
        label: "Ritmo Implacável e Metódico",
        description: "Divido o esforço em blocos precisos e cumpro cada etapa sem falhar.",
        raceWeights: { Draconiano: 3 },
        threatPoints: 4,
      },
      {
        id: "q2_slime",
        label: "Evolução Incremental",
        description: "Otimizo processos a cada dia para gastar menos energia e obter o dobro de resultado.",
        raceWeights: { Slime: 3, Majin: 1 },
        threatPoints: 3,
      },
      {
        id: "q2_majin",
        label: "Inspiração e Paixão Autoral",
        description: "Busco propósito estético e criativo no projeto para manter a mente acesa.",
        raceWeights: { Majin: 3 },
        threatPoints: 1,
      },
      {
        id: "q2_fera",
        label: "Honra e Compromisso Mútuo",
        description: "Sustento minha palavra porque outros contam com a minha vitória.",
        raceWeights: { "Homem-Fera": 3, Kijin: 1 },
        threatPoints: 2,
      },
    ],
  },
  {
    id: "q3",
    stepNumber: 3,
    title: "III. A Diretriz do Domínio",
    prompt:
      "Terceira diretriz. Ao buscar o domínio sobre um novo conhecimento ou arte complexa, qual caminho você escolhe trilhar?",
    audioUrl: "/audio/voice/onboarding-q3.mp3",
    runicInscription: "᚛ ᛞ ᚱ ᚨ ᚲ ᛟ · ᛞ ᛁ ᚱ ᛖ ᛏ ᚱ ᛁ ᛉ · ᛁ ᛁ ᛁ ᚜",
    options: [
      {
        id: "q3_slime",
        label: "Decomposição Estrutural",
        description: "Disseco os fundamentos teóricos e conecto padrões entre diferentes áreas.",
        raceWeights: { Slime: 3 },
        threatPoints: 3,
      },
      {
        id: "q3_majin",
        label: "Experimentação Livre",
        description: "Aprendo construindo protótipos ousados e testando ideias originais na prática.",
        raceWeights: { Majin: 3, Slime: 1 },
        threatPoints: 2,
      },
      {
        id: "q3_draco",
        label: "Imersão em Hiperfoco",
        description: "Isolo-me do mundo e treino os fundamentos repetidamente até a perfeição.",
        raceWeights: { Draconiano: 3 },
        threatPoints: 4,
      },
      {
        id: "q3_kijin",
        label: "Provação em Campo de Batalha",
        description: "Escolho o desafio prático mais difícil disponível e aprendo na superação real.",
        raceWeights: { Kijin: 3 },
        threatPoints: 3,
      },
      {
        id: "q3_fera",
        label: "Troca com Mestres e Pares",
        description: "Aprendo debatendo, ensinando e colaborando diretamente com outras mentes.",
        raceWeights: { "Homem-Fera": 3 },
        threatPoints: 2,
      },
    ],
  },
  {
    id: "q4",
    stepNumber: 4,
    title: "IV. A Diretriz do Legado",
    prompt:
      "Quarta diretriz. Na construção do seu legado e na relação com aliados ao seu redor, qual princípio governa suas ações?",
    audioUrl: "/audio/voice/onboarding-q4.mp3",
    runicInscription: "᚛ ᛗ ᚨ ᛃ ᛁ ᚾ · ᛞ ᛁ ᚱ ᛖ ᛏ ᚱ ᛁ ᛉ · ᛁ ᚹ ᚜",
    options: [
      {
        id: "q4_fera",
        label: "Prosperidade Coletiva",
        description: "Protejo os meus, elevo o nível de quem caminha comigo e lidero pelo exemplo.",
        raceWeights: { "Homem-Fera": 3, Slime: 1 },
        threatPoints: 3,
      },
      {
        id: "q4_majin",
        label: "Obra-Prima Inesquecível",
        description: "Desejo deixar criações únicas que expressem minha visão singular de mundo.",
        raceWeights: { Majin: 3 },
        threatPoints: 2,
      },
      {
        id: "q4_slime",
        label: "Harmonia e Sabedoria",
        description: "Construo sistemas inteligentes onde todos os elementos funcionam em sinergia.",
        raceWeights: { Slime: 3 },
        threatPoints: 3,
      },
      {
        id: "q4_kijin",
        label: "Força Protetora",
        description: "Busco poder e excelência pessoal para jamais ser um fardo e sempre vencer.",
        raceWeights: { Kijin: 3 },
        threatPoints: 3,
      },
      {
        id: "q4_draco",
        label: "Soberania e Autossuficiência",
        description: "Governo minha própria mente com rigor absoluto, servindo como pilar inabalável.",
        raceWeights: { Draconiano: 3 },
        threatPoints: 4,
      },
    ],
  },
  {
    id: "q5",
    stepNumber: 5,
    title: "V. A Diretriz da Constância (Rank de Ameaça)",
    prompt:
      "Quinta e última diretriz. Qual é o seu nível real de constância e disciplina na rotina diária até este momento?",
    audioUrl: "/audio/voice/onboarding-q5.mp3",
    runicInscription: "᚛ ᚱ ᚨ ᚾ ᚲ · ᛞ ᛁ ᚱ ᛖ ᛏ ᚱ ᛁ ᛉ · ᚹ ᚜",
    options: [
      {
        id: "q5_menor",
        label: "Despertar Inicial (Em Construção)",
        description: "Tenho boas intenções, mas frequentemente quebro minha rotina e preciso de estrutura.",
        raceWeights: { Slime: 1 },
        threatPoints: 1,
      },
      {
        id: "q5_hazard",
        label: "Constância Estabelecida (Ritmo Sólido)",
        description: "Cumpro a maioria das minhas metas semanais e mantenho foco regular nos meus projetos.",
        raceWeights: { Kijin: 1, "Homem-Fera": 1 },
        threatPoints: 6,
      },
      {
        id: "q5_calamity",
        label: "Disciplina Implacável (Alta Performance)",
        description: "Sigo rotinas rigorosas diariamente e busco um Sistema para elevar meu domínio ao ápice.",
        raceWeights: { Draconiano: 2, Kijin: 1 },
        threatPoints: 10,
      },
    ],
  },
];

/**
 * Calcula de forma 100% pura e determinística a Raça (Tensura) e o Rank de Ameaça
 * com base nas respostas das 5 diretrizes de onboarding.
 *
 * @param selectedOptionIds Lista de IDs de opções selecionadas (ex: ["q1_slime", "q2_kijin", ...])
 * @param hunterName Nome do caçador para compor a proclamação solene da Grande Sábio
 */
export function calculateOnboardingResult(
  selectedOptionIds: readonly string[],
  hunterName: string = "Caçador",
): OnboardingResult {
  const raceScores: Record<TensuraRace, number> = {
    Slime: 0,
    Kijin: 0,
    Draconiano: 0,
    Majin: 0,
    "Homem-Fera": 0,
  };

  let threatScore = 0;

  // Mapa rápido de todas as opções válidas por ID
  const optionMap = new Map<string, OnboardingOption>();
  for (const q of ONBOARDING_QUESTIONS) {
    for (const opt of q.options) {
      optionMap.set(opt.id, opt);
    }
  }

  for (const optionId of selectedOptionIds) {
    const opt = optionMap.get(optionId);
    if (!opt) continue;

    threatScore += opt.threatPoints;

    for (const r of TENSURA_RACES_ORDER) {
      const weight = opt.raceWeights[r];
      if (typeof weight === "number") {
        raceScores[r] += weight;
      }
    }
  }

  // Determinação determinística da Raça com desempate estrito na ordem canônica (TENSURA_RACES_ORDER)
  let winningRace: TensuraRace = "Slime";
  let maxScore = -1;

  for (const race of TENSURA_RACES_ORDER) {
    const score = raceScores[race];
    if (score > maxScore) {
      maxScore = score;
      winningRace = race;
    }
  }

  // Determinação determinística do Rank de Ameaça baseado na pontuação de constância/ameaça
  let rankThreat: ThreatRank = "Classe Menor";
  if (threatScore >= THREAT_RANK_METADATA.Calamity.minScore) {
    rankThreat = "Calamity";
  } else if (threatScore >= THREAT_RANK_METADATA.Hazard.minScore) {
    rankThreat = "Hazard";
  }

  const raceMeta = RACE_METADATA[winningRace];
  const rankMeta = THREAT_RANK_METADATA[rankThreat];
  const cleanName = hunterName.trim() || "Caçador";
  const suggestedTitle = `${raceMeta.title} [${rankThreat}]`;

  const proclamationText = `Aviso do Sistema. Avaliação d'alma concluída para o indivíduo ${cleanName}. Essência espiritual consolidada na Raça ${winningRace}. Nível de ameaça catalogado como ${rankThreat}. Que a sua primeira conquista tenha início.`;

  return {
    race: winningRace,
    rankThreat,
    raceMeta,
    rankMeta,
    raceScores,
    threatScore,
    suggestedTitle,
    proclamationText,
  };
}
