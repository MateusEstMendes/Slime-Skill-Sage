import type { AreaCode } from "@slime-sage/shared";

export const BASE_ATTRIBUTE_CODES: readonly AreaCode[] = [
  "INT",
  "FOR",
  "DIS",
  "CRI",
  "SOC",
] as const;

export type AttributesMap = Record<AreaCode, number>;

export function createEmptyAttributes(): AttributesMap {
  return {
    INT: 0,
    FOR: 0,
    DIS: 0,
    CRI: 0,
    SOC: 0,
  };
}

/**
 * Calculates attribute values (INT, FOR, DIS, CRI, SOC)
 * by summing the mastery of all skills associated with each area.
 */
export function calculateAttributesFromSkills(
  skills: Array<{ area_id: AreaCode; mastery: number }>
): AttributesMap {
  const result = createEmptyAttributes();
  for (const skill of skills) {
    if (skill.area_id in result) {
      result[skill.area_id] += Math.max(0, skill.mastery);
    }
  }
  return result;
}

/**
 * Calculates attribute values directly from ledger events by summing mastery_amount.
 */
export function calculateAttributesFromLedger(
  events: Array<{ area_id: AreaCode; mastery_amount?: number }>
): AttributesMap {
  const result = createEmptyAttributes();
  for (const event of events) {
    if (event.area_id in result && typeof event.mastery_amount === "number") {
      result[event.area_id] += event.mastery_amount;
    }
  }
  // Clamp all attributes to minimum 0
  for (const code of BASE_ATTRIBUTE_CODES) {
    result[code] = Math.max(0, result[code]);
  }
  return result;
}

export const GRAND_TIER_POINTS = 5000;
export const SUB_GRADE_POINTS = 1000;
export const SUB_GRADES_PER_TIER = 5;
export const MAX_MASTERY_CEILING = 50000;

export const ROMAN_TIERS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;
export const ROMAN_SUB_GRADES = ["I", "II", "III", "IV", "V"] as const;

export const ATTRIBUTE_TITLES: Record<AreaCode, readonly string[]> = {
  INT: [
    "Aprendiz da Lógica",
    "Analista Metódico",
    "Arquiteto Cognitivo",
    "Decifrador de Padrões",
    "Sábio Investigador",
    "Arquimago da Cognição",
    "Singularidade Teórica",
    "Demiurgo do Pensamento",
    "A Mente Infinita",
    "A Onisciência Absoluta",
  ],
  FOR: [
    "Corpo Desperto",
    "Guarda de Aço",
    "Escudo Vivo",
    "Muralha de Bronze",
    "Baluarte da Vontade",
    "Monolito Vivo",
    "Entidade Inabalável",
    "Guardião Inquebrantável",
    "Pilar da Existência",
    "Muralha Cósmica Inquebrável",
  ],
  DIS: [
    "Iniciante da Vontade",
    "Mente Vigilante",
    "Disciplinado em Aço",
    "Vontade de Titânio",
    "Firme como Diamante",
    "Asceta Marcial",
    "Transcendência Estoica",
    "Monolito Perpétuo",
    "Entidade Sem Flutuação",
    "A Vontade Eterna",
  ],
  CRI: [
    "Discípulo do Traço",
    "Gravador de Conceitos",
    "Escultor de Ideias",
    "Manifestador de Formas",
    "Engenheiro da Imaginação",
    "Mestre das Formas",
    "Arquiteto da Existência",
    "Criador de Dimensões",
    "Demiurgo Cósmico",
    "Primordial da Criação",
  ],
  SOC: [
    "Ouvinte Atento",
    "Tecedor de Laços",
    "Mediador de Conflitos",
    "Orador Magnético",
    "Pacificador das Tribos",
    "Farol Coletivo",
    "Mentor de Povos",
    "Conciliador de Mundos",
    "Voz do Éter",
    "A Harmonia Primordial",
  ],
};

export const OVERALL_CHOSEN_TITLES: readonly string[] = [
  "Iniciado do Sistema",
  "Escolhido Praticante",
  "Guerreiro Consagrado",
  "Vanguarda de Elite",
  "Mestre Escolhido",
  "Lorde da Fenda",
  "Transcendental",
  "Soberano Cósmico",
  "Monarca Primordial",
  "O Absoluto",
];

// Preserva compatibilidade com código legado
export const OVERALL_HUNTER_TITLES = OVERALL_CHOSEN_TITLES;

/**
 * Retorna os pontos necessários para avançar um Grau específico (1 a 50)
 * sob uma curva de aprendizado exponencial moderada (expoente 1.25).
 */
export function pointsRequiredForGrade(gradeIndex: number): number {
  if (gradeIndex <= 0) return 0;
  return Math.round(1000 * Math.pow(gradeIndex, 1.25));
}

/**
 * Retorna os pontos cumulativos necessários para atingir determinado Grau.
 */
export function getCumulativePointsForGrade(gradeIndex: number): number {
  if (gradeIndex <= 0) return 0;
  let total = 0;
  for (let g = 1; g <= gradeIndex; g++) {
    total += pointsRequiredForGrade(g);
  }
  return Math.min(MAX_MASTERY_CEILING, total);
}

/**
 * Calcula o teto ativo do horizonte dinâmico do radar de atributos.
 * Conforme o Escolhido atinge o teto do Grau ativo, o gráfico expande até 1.0 (100%),
 * e ao ascender para o próximo Grau, o teto avança e o gráfico recua proporcionalmente.
 */
export function calculateDynamicAttributeCeiling(highestStatValue: number): number {
  const safeVal = Math.max(0, highestStatValue);
  if (safeVal >= MAX_MASTERY_CEILING) return MAX_MASTERY_CEILING;

  let cumulative = 0;
  for (let g = 1; g <= 50; g++) {
    cumulative += pointsRequiredForGrade(g);
    if (cumulative >= MAX_MASTERY_CEILING) return MAX_MASTERY_CEILING;
    if (safeVal < cumulative) {
      return cumulative;
    }
  }
  return MAX_MASTERY_CEILING;
}

export interface AttributeRankInfo {
  tier: number;
  tierRoman: string;
  subGrade: number;
  subGradeRoman: string;
  rank: string;
  subRank: string;
  title: string;
  nextTitle: string;
  label: string;
  shortLabel: string;
  currentMastery: number;
  pointsInTier: number;
  pointsInSubGrade: number;
  ptsToNextGrade: number;
  ptsToNextTier: number;
  subGradeProgressPct: number;
}

/**
 * Maps attribute value to 10 Grand Tiers with 1,000-point sub-grades (Graus I a V).
 * Progression: Each 1,000 pts advances a sub-grade that slowly transforms into the next tier.
 */
export function getAttributeRank(value: number, areaId?: AreaCode): AttributeRankInfo {
  const safeVal = Math.max(0, value);
  const isCapped = safeVal >= MAX_MASTERY_CEILING;

  const tierIndex = isCapped ? 9 : Math.min(9, Math.floor(safeVal / GRAND_TIER_POINTS));
  const tier = tierIndex + 1;
  const tierRoman = ROMAN_TIERS[tierIndex];

  const pointsInTier = isCapped ? GRAND_TIER_POINTS : safeVal - tierIndex * GRAND_TIER_POINTS;
  const subGradeIndex = isCapped
    ? 4
    : Math.min(4, Math.floor(pointsInTier / SUB_GRADE_POINTS));
  const subGrade = subGradeIndex + 1;
  const subGradeRoman = ROMAN_SUB_GRADES[subGradeIndex];

  const pointsInSubGrade = isCapped ? SUB_GRADE_POINTS : pointsInTier % SUB_GRADE_POINTS;
  const ptsToNextGrade = isCapped ? 0 : SUB_GRADE_POINTS - pointsInSubGrade;
  const ptsToNextTier = isCapped ? 0 : GRAND_TIER_POINTS - pointsInTier;
  const subGradeProgressPct = isCapped
    ? 100
    : Math.floor((pointsInSubGrade / SUB_GRADE_POINTS) * 100);

  const titleList =
    areaId && areaId in ATTRIBUTE_TITLES
      ? ATTRIBUTE_TITLES[areaId]
      : OVERALL_CHOSEN_TITLES;
  const title = titleList[tierIndex];
  const nextTitle =
    tierIndex < 9 ? titleList[tierIndex + 1] : "Perfeição Inatingível";

  const label =
    tier < 10
      ? `${title} [Grau ${subGradeRoman}] · Rumo a ${nextTitle}`
      : subGrade < 5
      ? `${title} [Grau ${subGradeRoman}] · Rumo à Perfeição Inatingível`
      : `${title} [Grau V] · Perfeição Inatingível`;

  const shortLabel = `Tier ${tierRoman} [Grau ${subGradeRoman}] — ${title}`;
  const subRank = `${tierRoman}-${subGradeRoman}`;

  return {
    tier,
    tierRoman,
    subGrade,
    subGradeRoman,
    rank: tierRoman,
    subRank,
    title,
    nextTitle,
    label,
    shortLabel,
    currentMastery: safeVal,
    pointsInTier,
    pointsInSubGrade,
    ptsToNextGrade,
    ptsToNextTier,
    subGradeProgressPct,
  };
}
