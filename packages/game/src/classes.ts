import type { AreaCode, ClassChallengeStatus } from "@slime-sage/shared";
import type { Rng } from "./rng";
import { MathRng } from "./rng";
import { ATTRIBUTE_TITLES, ROMAN_TIERS } from "./attributes";

export interface ClassTierConfig {
  tier: number;
  roman: string;
  name: string;
  minMastery: number;
}

/**
 * 10 Canonical Class Tiers aligned with the 0 to 50,000 mastery progression.
 */
export const CLASS_TIER_CONFIG: readonly ClassTierConfig[] = [
  { tier: 1, roman: "I", name: "Aprendiz", minMastery: 0 },
  { tier: 2, roman: "II", name: "Iniciante", minMastery: 5000 },
  { tier: 3, roman: "III", name: "Adepto", minMastery: 10000 },
  { tier: 4, roman: "IV", name: "Veterano", minMastery: 15000 },
  { tier: 5, roman: "V", name: "Especialista", minMastery: 20000 },
  { tier: 6, roman: "VI", name: "Mestre", minMastery: 25000 },
  { tier: 7, roman: "VII", name: "Grão-Mestre", minMastery: 30000 },
  { tier: 8, roman: "VIII", name: "Sábio", minMastery: 35000 },
  { tier: 9, roman: "IX", name: "Monarca", minMastery: 40000 },
  { tier: 10, roman: "X", name: "Lendário", minMastery: 45000 },
] as const;

/**
 * Formats a class name with its canonical Roman numeral between brackets:
 * e.g. formatClassTitle("Analista Metódico", 4) -> "[Analista Metódico IV]"
 * e.g. formatClassTitle("[Analista Metódico IV]", 4) -> "[Analista Metódico IV]"
 */
export function formatClassTitle(className: string, tier: number): string {
  const safeTier = Math.max(1, Math.min(10, Math.floor(tier)));
  const roman = ROMAN_TIERS[safeTier - 1] || `${safeTier}`;
  let clean = (className || "").trim();
  // Strip outer brackets if present: [Analista Metódico] -> Analista Metódico
  clean = clean.replace(/^\[(.*)\]$/, "$1").trim();
  // Strip existing trailing roman numeral if present (I..X)
  clean = clean.replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i, "").trim();
  return `[${clean} ${roman}]`;
}

export const BASE_CLASS_NAMES: Record<AreaCode, string> = {
  INT: formatClassTitle(ATTRIBUTE_TITLES.INT[0], 1),
  FOR: formatClassTitle(ATTRIBUTE_TITLES.FOR[0], 1),
  DIS: formatClassTitle(ATTRIBUTE_TITLES.DIS[0], 1),
  CRI: formatClassTitle(ATTRIBUTE_TITLES.CRI[0], 1),
  SOC: formatClassTitle(ATTRIBUTE_TITLES.SOC[0], 1),
};

export interface ClassEligibilityResult {
  isEligible: boolean;
  currentTier: number;
  currentTierRoman: string;
  currentTierName: string;
  nextTier: number | null;
  nextTierRoman: string | null;
  nextTierName: string | null;
  nextTierFormatted: string | null;
  requiredMastery: number | null;
  currentMastery: number;
  pointsRemaining: number;
}

/**
 * Pure function: calculates whether player is eligible to evolve class tier in an Area.
 * Supports the 10 canonical tiers (1 to 10).
 */
export function checkClassEligibility(
  areaId: AreaCode,
  currentTier: number,
  areaMastery: number
): ClassEligibilityResult {
  const safeTier = Math.max(1, Math.min(10, Math.floor(currentTier)));
  const safeMastery = Math.max(0, Math.floor(areaMastery));

  const currentConfig = CLASS_TIER_CONFIG[safeTier - 1];

  if (safeTier >= 10) {
    return {
      isEligible: false,
      currentTier: 10,
      currentTierRoman: "X",
      currentTierName: currentConfig.name,
      nextTier: null,
      nextTierRoman: null,
      nextTierName: null,
      nextTierFormatted: null,
      requiredMastery: null,
      currentMastery: safeMastery,
      pointsRemaining: 0,
    };
  }

  const nextTierIndex = safeTier; // 0-indexed: tier 2 is index 1, which equals safeTier
  const nextConfig = CLASS_TIER_CONFIG[nextTierIndex];
  const requiredMastery = nextConfig.minMastery;
  const isEligible = safeMastery >= requiredMastery;
  const pointsRemaining = Math.max(0, requiredMastery - safeMastery);

  const nextTitleBase =
    ATTRIBUTE_TITLES[areaId]?.[nextTierIndex] || nextConfig.name;
  const nextTierFormatted = formatClassTitle(nextTitleBase, nextConfig.tier);

  return {
    isEligible,
    currentTier: safeTier,
    currentTierRoman: currentConfig.roman,
    currentTierName: currentConfig.name,
    nextTier: nextConfig.tier,
    nextTierRoman: nextConfig.roman,
    nextTierName: nextConfig.name,
    nextTierFormatted,
    requiredMastery,
    currentMastery: safeMastery,
    pointsRemaining,
  };
}

export class InvalidChallengeTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string
  ) {
    super(
      `[SISTEMA // MOTOR] Transição inválida de status do desafio de classe: '${from}' -> '${to}'.`
    );
    this.name = "InvalidChallengeTransitionError";
  }
}

/**
 * Valid state transitions for class challenges:
 * - proposta -> aceita
 * - proposta -> desistida
 * - aceita -> concluida
 * - aceita -> desistida
 */
const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  proposta: ["aceita", "desistida"],
  pendente: ["aceita", "desistida", "proposta"], // backward compatibility
  aceita: ["concluida", "desistida"],
  concluida: [],
  desistida: [],
  falho: [],
};

/**
 * Pure state machine transition validator for ClassChallengeStatus.
 */
export function transitionChallengeStatus(
  currentStatus: ClassChallengeStatus,
  targetStatus: ClassChallengeStatus
): ClassChallengeStatus {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new InvalidChallengeTransitionError(currentStatus, targetStatus);
  }
  return targetStatus;
}

export interface DeterministicChallengeTemplate {
  className: string;
  title: string;
  description: string;
  explanation: string;
}

export const DETERMINISTIC_CLASS_CHALLENGES: Record<
  AreaCode,
  Record<number, readonly DeterministicChallengeTemplate[]>
> = {
  INT: {
    2: [
      {
        className: "Analista Metódico",
        title: "A Provação dos Tomos Esquecidos",
        description:
          "Dedique 45 minutos ininterruptos ao estudo aprofundado de documentação ou fundamentos de lógica, registrando os 3 principais aprendizados obtidos.",
        explanation:
          "A Grande Sábio detectou saturação de dados elementares. A ascensão a Iniciante exige fixação conceitual consciente.",
      },
      {
        className: "Decifrador de Algoritmos",
        title: "A Provação da Lógica Pura",
        description:
          "Implemente ou resolva 1 problema prático complexo de código ou raciocínio sem recorrer a soluções prontas.",
        explanation:
          "Para forjar a mente analítica, o Escolhido deve encarar a complexidade sem atalhos cognitivos.",
      },
    ],
    3: [
      {
        className: "Arquiteto Cognitivo",
        title: "A Construção do Artefato Estruturado",
        description:
          "Construa e teste com sucesso um módulo ou ferramenta prática funcional de ponta a ponta em sua área de estudo.",
        explanation:
          "O Adepto em Inteligência não apenas absorve conhecimento, ele o organiza em arquiteturas estáveis.",
      },
    ],
    4: [
      {
        className: "Decifrador de Padrões",
        title: "A Quebra do Labirinto Mental",
        description:
          "Refatore e simplifique um sistema ou rotina intelectual complexa, reduzindo 50% do desperdício de tempo e esforço cognitivo.",
        explanation:
          "O Veterano identifica padrões ocultos no caos onde outros enxergam apenas desordem.",
      },
    ],
    5: [
      {
        className: "Sábio Investigador",
        title: "A Síntese da Hipótese Arcana",
        description:
          "Conduza uma pesquisa independente exaustiva e documente um dossiê técnico de referência sobre um tópico avançado.",
        explanation:
          "O Especialista produz novos postulados e desvenda verdades além do consenso comum.",
      },
    ],
    6: [
      {
        className: "Arquimago da Cognição",
        title: "O Círculo da Transmutação Lógica",
        description:
          "Complete um projeto desafiador de alta complexidade intelectual em Modo Foco sem nenhuma distração externa.",
        explanation:
          "O Mestre orquestra conceitos múltiplos como um maestro rege uma sinfonia mágica.",
      },
    ],
    7: [
      {
        className: "Singularidade Teórica",
        title: "A Ruptura do Limiar Epistêmico",
        description:
          "Desenvolva uma metodologia ou framework pessoal original aplicado a problemas reais durante 7 dias seguidos.",
        explanation:
          "O Grão-Mestre cria novas leis cognitivas e rompe as barreiras do pensamento estabelecido.",
      },
    ],
    8: [
      {
        className: "Demiurgo do Pensamento",
        title: "A Forja da Realidade Conceitual",
        description:
          "Crie uma obra, projeto sistêmico ou compêndio intelectual que sirva de guia para outros aprendizes.",
        explanation:
          "O Sábio molda as ideias em realidades duradouras que transcendem sua própria jornada.",
      },
    ],
    9: [
      {
        className: "A Mente Infinita",
        title: "A Transcendência do Pensamento Puro",
        description:
          "Mantenha 14 dias contínuos de consistência mental impecável, sem quebra de foco ou estagnação conceitual.",
        explanation:
          "O Monarca alcança um fluxo de consciência perene onde o aprendizado ocorre sem atrito.",
      },
    ],
    10: [
      {
        className: "A Onisciência Absoluta",
        title: "O Vértice do Conhecimento Primordial",
        description:
          "Consagre a maestria máxima da mente: resolva o enigma central de seu grande projeto de vida com perfeição.",
        explanation:
          "O patamar Lendário é o despertar cósmico da sabedoria que compreende a totalidade das leis do universo.",
      },
    ],
  },
  FOR: {
    2: [
      {
        className: "Guarda de Aço",
        title: "A Provação da Resistência Física",
        description:
          "Complete uma sessão de 40 minutos de condicionamento físico rigoroso ou exercícios corporais sem desculpas.",
        explanation:
          "O corpo do Escolhido deve se tornar o receptáculo inabalável de sua vontade.",
      },
    ],
    3: [
      {
        className: "Escudo Vivo",
        title: "O Ponto de Apoio Inquebrantável",
        description:
          "Alcance 3 dias consecutivos de treino corporal vigoroso com alimentação disciplinada.",
        explanation:
          "A constância física transforma a carne passageira em muralha blindada.",
      },
    ],
    4: [
      {
        className: "Muralha de Bronze",
        title: "A Marcha da Sobrecarga Progressiva",
        description:
          "Supere sua marca histórica de carga, repetições ou distância em um teste de força máxima.",
        explanation:
          "O Veterano de Força desafia o próprio limite mecânico com foco destemido.",
      },
    ],
    5: [
      {
        className: "Baluarte da Vontade",
        title: "O Domínio do Vigor Puro",
        description:
          "Complete um treino extenuante de alta intensidade mantendo postura perfeita até o último movimento.",
        explanation:
          "A musculatura forjada na disciplina responde com vigor sereno sob qualquer pressão.",
      },
    ],
    6: [
      {
        className: "Monolito Vivo",
        title: "A Forja da Densidade Titânica",
        description:
          "Mantenha 30 dias de rotina física rigorosa com recuperação muscular e sono otimizados.",
        explanation:
          "O Mestre da Força atinge densidade que ancora sua presença na matéria.",
      },
    ],
    7: [
      {
        className: "Entidade Inabalável",
        title: "O Desafio da Montanha Firme",
        description:
          "Realize um feito extraordinário de resistência física ao ar livre ou em teste atlético extremo.",
        explanation:
          "As intempéries não movem aquele cuja base está gravada na terra.",
      },
    ],
    8: [
      {
        className: "Guardião Inquebrantável",
        title: "O Juramento da Proteção Absoluta",
        description:
          "Use sua força física e disposição para proteger, auxiliar ou carregar fardos pesados para a sua comunidade.",
        explanation:
          "Força sem propósito é desperdício; o Sábio converte vigor em escudo para os indefesos.",
      },
    ],
    9: [
      {
        className: "Pilar da Existência",
        title: "A Respiração da Terra Antiga",
        description:
          "Alcance harmonia física plena: 60 dias de vigor ininterrupto, mobilidade e postura régia.",
        explanation:
          "O Monarca sustenta o equilíbrio das forças materiais com respiração consciente.",
      },
    ],
    10: [
      {
        className: "Muralha Cósmica Inquebrável",
        title: "O Despertar do Titã Primordial",
        description:
          "Consagre a maestria corporal definitiva, demonstrando simetria, força e saúde absolutas.",
        explanation:
          "O patamar Lendário é o corpo tornado templo eterno que nenhuma força mortal consegue vergar.",
      },
    ],
  },
  DIS: {
    2: [
      {
        className: "Mente Vigilante",
        title: "A Provação do Alarme Matinal",
        description:
          "Acorde no horário planejado e inicie sua rotina sem tocar no botão de soneca por 3 dias consecutivos.",
        explanation:
          "A disciplina começa no primeiro segundo de consciência.",
      },
    ],
    3: [
      {
        className: "Disciplinado em Aço",
        title: "O Silêncio dos Desejos Efêmeros",
        description:
          "Elimine redes sociais e entretenimento passivo durante todo o período de trabalho ou estudo por 5 dias.",
        explanation:
          "O Adepto corta distrações com a precisão de uma espada afiada.",
      },
    ],
    4: [
      {
        className: "Vontade de Titânio",
        title: "A Batalha contra a Procrastinação",
        description:
          "Execute imediatamente a tarefa mais difícil e temida do dia assim que iniciar sua jornada de trabalho.",
        explanation:
          "O Veterano não negocia com o cansaço ilusório; ele cumpre o decreto antes que a hesitação surja.",
      },
    ],
    5: [
      {
        className: "Firme como Diamante",
        title: "A Inviolabilidade do Foco",
        description:
          "Complete 10 blocos de Modo Foco estrito sem quebrar o timer em nenhuma ocasião.",
        explanation:
          "A concentração do Especialista refrata qualquer perturbação externa.",
      },
    ],
    6: [
      {
        className: "Asceta Marcial",
        title: "O Retiro da Determinação",
        description:
          "Mantenha jejum de dopamina rápida e sobriedade mental rigorosa durante 7 dias seguidos.",
        explanation:
          "O Mestre purifica o canal de sua vontade para que nada turve sua visão.",
      },
    ],
    7: [
      {
        className: "Transcendência Estoica",
        title: "A Serenidade na Tempestade",
        description:
          "Enfrente uma crise ou contratempo grave mantendo calma impassível e foco na solução prática.",
        explanation:
          "O Grão-Mestre não se abala com o caos do mundo; sua mente é um templo sereno.",
      },
    ],
    8: [
      {
        className: "Monolito Perpétuo",
        title: "A Vigília Inquebrável",
        description:
          "Mantenha 30 dias contínuos de hábitos diários cumpridos com 100% de precisão na Agenda.",
        explanation:
          "O Sábio da Disciplina opera com a pontualidade matemática das órbitas estelares.",
      },
    ],
    9: [
      {
        className: "Entidade Sem Flutuação",
        title: "O Ponto Zero da Hesitação",
        description:
          "Elimine qualquer traço de procrastinação e execute 100% dos seus compromissos no momento exato por 60 dias.",
        explanation:
          "A vontade do Monarca funde-se à ação instantânea.",
      },
    ],
    10: [
      {
        className: "A Vontade Eterna",
        title: "O Decreto da Autonomia Absoluta",
        description:
          "Consagre a disciplina suprema: domínio incondicional sobre impulsos, tempo e destino.",
        explanation:
          "O patamar Lendário é a liberdade total conquistada através do domínio absoluto sobre si mesmo.",
      },
    ],
  },
  CRI: {
    2: [
      {
        className: "Gravador de Conceitos",
        title: "A Provação da Primeira Manifestação",
        description:
          "Produza e finalize 1 arte, texto, design ou ideia criativa original do rascunho à entrega final.",
        explanation:
          "O Iniciante em Criatividade rompe a paralisia do papel em branco e dá forma ao invisível.",
      },
    ],
    3: [
      {
        className: "Escultor de Ideias",
        title: "A Harmonia das Texturas",
        description:
          "Desenvolva 3 conceitos criativos distintos para um mesmo projeto e refine o melhor deles.",
        explanation:
          "O Adepto explora a multiplicidade antes de lapidar a essência estética.",
      },
    ],
    4: [
      {
        className: "Manifestador de Formas",
        title: "A Transmutação da Inspiração",
        description:
          "Transforme uma experiência de vida pessoal ou dor em uma obra expressiva funcional e impactante.",
        explanation:
          "O Veterano canaliza a vivência humana em substância artística palpável.",
      },
    ],
    5: [
      {
        className: "Engenheiro da Imaginação",
        title: "O Sistema Estético Integrado",
        description:
          "Crie uma identidade visual completa, universo narrativo ou biblioteca de componentes coerente.",
        explanation:
          "O Especialista cria ecossistemas visuais e conceituais autoportantes.",
      },
    ],
    6: [
      {
        className: "Mestre das Formas",
        title: "A Grande Obra Harmônica",
        description:
          "Finalize e lance publicamente uma criação de grande porte que reflita sua assinatura estética.",
        explanation:
          "O Mestre domina técnica e intuição em perfeita ressonância.",
      },
    ],
    7: [
      {
        className: "Arquiteto da Existência",
        title: "A Criação de Novos Horizontes",
        description:
          "Inove radicalmente na linguagem ou estrutura de seu meio criativo, criando algo sem precedente.",
        explanation:
          "O Grão-Mestre não imita estilos; ele abre novas fendas no imaginário coletivo.",
      },
    ],
    8: [
      {
        className: "Criador de Dimensões",
        title: "O Tear dos Mundos Esquecidos",
        description:
          "Desenvolva um corpo de trabalho completo que inspire e seja adotado como referência por outros criadores.",
        explanation:
          "O Sábio constrói mundos conceituais que ganham vida própria.",
      },
    ],
    9: [
      {
        className: "Demiurgo Cósmico",
        title: "A Respiração da Mana Criativa",
        description:
          "Mantenha fluxo criativo prolífico diário durante 90 dias ininterruptos com qualidade impecável.",
        explanation:
          "A fonte criativa do Monarca flui sem bloqueios ou esgotamento.",
      },
    ],
    10: [
      {
        className: "Primordial da Criação",
        title: "A Faísca do Primeiro Alvorecer",
        description:
          "Consagre a obra-prima definitiva de sua vida que representará seu legado duradouro no mundo.",
        explanation:
          "O patamar Lendário é o poder de gerar beleza e sentido a partir do nada primordial.",
      },
    ],
  },
  SOC: {
    2: [
      {
        className: "Tecedor de Laços",
        title: "A Provação da Conexão Aberta",
        description:
          "Inicie um diálogo genuíno e profundo com alguém com quem você não conversa há meses ou faça um novo contato profissional.",
        explanation:
          "A esfera Social requer abertura de canais e pontes genuínas de comunicação.",
      },
    ],
    3: [
      {
        className: "Mediador de Conflitos",
        title: "O Pacto do Entendimento",
        description:
          "Ouça ativamente e ajude a pacificar uma desavença ou mal-entendido interpessoal com empatia e serenidade.",
        explanation:
          "O Adepto Social dissolve atritos através da escuta atenta e da razão compassiva.",
      },
    ],
    4: [
      {
        className: "Orador Magnético",
        title: "A Transmissão da Ideia Soberana",
        description:
          "Apresente uma proposta, palestra ou discurso público de modo claro e persuasivo, engajando a audiência.",
        explanation:
          "O Veterano Social canaliza sua voz com clareza cristalina para mobilizar vontades ao seu redor.",
      },
    ],
    5: [
      {
        className: "Pacificador das Tribos",
        title: "A Grande Convergência de Forças",
        description:
          "Articule uma parceria estratégica, resolva um conflito interpessoal complexo ou forme um grupo cooperativo focado em objetivos comuns.",
        explanation:
          "O Especialista não age isolado; ele une talentos dispersos em torno de um propósito compartilhado.",
      },
    ],
    6: [
      {
        className: "Farol Coletivo",
        title: "A Liderança que Ilumina",
        description:
          "Lidere uma iniciativa comunitária ou equipe em direção a uma meta compartilhada inspirando autonomia.",
        explanation:
          "O Mestre do Social não impõe autoridade; sua presença atrai cooperação voluntária.",
      },
    ],
    7: [
      {
        className: "Mentor de Povos",
        title: "O Decreto da Liderança Compassiva",
        description:
          "Mentore consistentemente membros de sua comunidade, transformando trajetórias e cultivando líderes autônomos.",
        explanation:
          "O Grão-Mestre eleva e potencializa todos os seres ao seu redor.",
      },
    ],
    8: [
      {
        className: "Conciliador de Mundos",
        title: "A Aliança Interdimensional",
        description:
          "Construa uma rede de apoio mútuo entre grupos com visões divergentes, estabelecendo consenso duradouro.",
        explanation:
          "O Sábio tece pontes sólidas sobre os abismos das diferenças humanas.",
      },
    ],
    9: [
      {
        className: "Voz do Éter",
        title: "A Ressonância das Almas",
        description:
          "Transmita uma mensagem de impacto que alcance e transforme positivamente centenas de pessoas.",
        explanation:
          "A palavra do Monarca reverbera na consciência coletiva com verdade cristalina.",
      },
    ],
    10: [
      {
        className: "A Harmonia Primordial",
        title: "A União da Humanidade Desperta",
        description:
          "Consagre o legado social definitivo: estabeleça uma estrutura, comunidade ou instituição viva que perpetue o bem comum.",
        explanation:
          "O patamar Lendário é a realização da harmonia perfeita entre o indivíduo e a coletividade cósmica.",
      },
    ],
  },
};

/**
 * Generates a deterministic offline challenge for an area and target tier (2 to 10).
 * Guarantees that the returned class name is formatted as `[Nome da Classe <ROMAN>]`.
 */
export function generateDeterministicChallenge(
  areaId: AreaCode,
  targetTier: number,
  rng: Rng = new MathRng()
): {
  name_class: string;
  challenge_title: string;
  challenge_description: string;
  explanation: string;
} {
  const safeTier = Math.max(2, Math.min(10, Math.floor(targetTier)));
  const areaTemplates = DETERMINISTIC_CLASS_CHALLENGES[areaId] || DETERMINISTIC_CLASS_CHALLENGES.INT;
  const templates = areaTemplates[safeTier] || areaTemplates[2];

  const index = Math.floor(rng.nextFloat() * templates.length);
  const selected = templates[index];

  const rawName = selected?.className || ATTRIBUTE_TITLES[areaId]?.[safeTier - 1] || "Escolhido";
  const formattedName = formatClassTitle(rawName, safeTier);

  return {
    name_class: formattedName,
    challenge_title: selected?.title || `Provação do Grau ${CLASS_TIER_CONFIG[safeTier - 1]?.roman}`,
    challenge_description:
      selected?.description ||
      `Cumpra os objetivos e mantenha foco profundo para consagrar o Tier ${CLASS_TIER_CONFIG[safeTier - 1]?.roman}.`,
    explanation:
      selected?.explanation ||
      `A Grande Sábio atesta que a ascensão ao patamar ${formattedName} exige superação consciente.`,
  };
}
