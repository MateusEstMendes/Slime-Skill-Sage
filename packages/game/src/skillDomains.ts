import type { AreaCode, Skill, SkillTier, SkillSynergyAffinity } from "@slime-sage/shared";

export const CANONICAL_DOMAINS = [
  "Arcana",
  "Combate",
  "Soberania",
  "Percepção",
  "Criação",
  "Elemental",
  "Sobrevivência",
  "Estratégia",
  "Harmonia",
] as const;

export type CanonicalDomain = (typeof CANONICAL_DOMAINS)[number];

export const AREA_PRIMARY_DOMAINS: Record<AreaCode, CanonicalDomain> = {
  INT: "Arcana",
  FOR: "Combate",
  DIS: "Soberania",
  CRI: "Criação",
  SOC: "Harmonia",
};

/**
 * Static compatibility score matrix between canonical domains (0 to 100).
 * Symmetric matrix defining resonant pairs without requiring an AI call.
 */
export const DOMAIN_COMPATIBILITY_MATRIX: Record<
  CanonicalDomain,
  Partial<Record<CanonicalDomain, { baseScore: number; affinity: SkillSynergyAffinity; archetype: string }>>
> = {
  Arcana: {
    Arcana: { baseScore: 90, affinity: "Resonancia", archetype: "Grande Arcano" },
    Elemental: { baseScore: 85, affinity: "Elemental", archetype: "Mestre dos Elementos" },
    Percepção: { baseScore: 80, affinity: "Convergencia", archetype: "Olho Onisciente" },
    Criação: { baseScore: 75, affinity: "Convergencia", archetype: "Artífice Místico" },
    Estratégia: { baseScore: 70, affinity: "Dominio", archetype: "Mente Soberana" },
    Sobrevivência: { baseScore: 55, affinity: "Convergencia", archetype: "Barreira Arcana" },
  },
  Combate: {
    Combate: { baseScore: 90, affinity: "Resonancia", archetype: "Titã Indomável" },
    Sobrevivência: { baseScore: 85, affinity: "Dominio", archetype: "Guerreiro Imortal" },
    Soberania: { baseScore: 80, affinity: "Convergencia", archetype: "General de Aço" },
    Elemental: { baseScore: 75, affinity: "Elemental", archetype: "Lâmina Incandescente" },
    Percepção: { baseScore: 65, affinity: "Convergencia", archetype: "Instinto Predador" },
    Estratégia: { baseScore: 60, affinity: "Dominio", archetype: "Mestre de Armas Tático" },
  },
  Soberania: {
    Soberania: { baseScore: 90, affinity: "Resonancia", archetype: "Imperador Absoluto" },
    Estratégia: { baseScore: 85, affinity: "Dominio", archetype: "Comandante Supremo" },
    Combate: { baseScore: 80, affinity: "Convergencia", archetype: "Rei Conquistador" },
    Harmonia: { baseScore: 75, affinity: "Convergencia", archetype: "Soberano Benevolente" },
    Sobrevivência: { baseScore: 70, affinity: "Dominio", archetype: "Vontade Inquebrantável" },
    Arcana: { baseScore: 65, affinity: "Convergencia", archetype: "Decreto Mágico" },
  },
  Percepção: {
    Percepção: { baseScore: 90, affinity: "Resonancia", archetype: "Visão Cósmica" },
    Arcana: { baseScore: 80, affinity: "Convergencia", archetype: "Clarividência Maior" },
    Estratégia: { baseScore: 80, affinity: "Dominio", archetype: "Decifrador de Destinos" },
    Harmonia: { baseScore: 75, affinity: "Convergencia", archetype: "Sensor de Almas" },
    Combate: { baseScore: 65, affinity: "Convergencia", archetype: "Reflexo Instantâneo" },
    Criação: { baseScore: 60, affinity: "Convergencia", archetype: "Olho do Designer" },
  },
  Criação: {
    Criação: { baseScore: 90, affinity: "Resonancia", archetype: "Forjador Primordial" },
    Arcana: { baseScore: 75, affinity: "Convergencia", archetype: "Encantador Rúnico" },
    Elemental: { baseScore: 75, affinity: "Elemental", archetype: "Alquimista Elemental" },
    Percepção: { baseScore: 60, affinity: "Convergencia", archetype: "Inventor Visionário" },
    Harmonia: { baseScore: 55, affinity: "Convergencia", archetype: "Harmonia Estética" },
  },
  Elemental: {
    Elemental: { baseScore: 90, affinity: "Resonancia", archetype: "Avatar dos Elementos" },
    Arcana: { baseScore: 85, affinity: "Elemental", archetype: "Evocador da Tempestade" },
    Combate: { baseScore: 75, affinity: "Elemental", archetype: "Guerreiro da Chama Viva" },
    Criação: { baseScore: 75, affinity: "Elemental", archetype: "Cristalizador" },
    Sobrevivência: { baseScore: 70, affinity: "Dominio", archetype: "Adaptação Bioclimática" },
  },
  Sobrevivência: {
    Sobrevivência: { baseScore: 90, affinity: "Resonancia", archetype: "Adaptação Imutável" },
    Combate: { baseScore: 85, affinity: "Dominio", archetype: "Couraça Titânica" },
    Soberania: { baseScore: 70, affinity: "Dominio", archetype: "Auto-Suficiência Plena" },
    Elemental: { baseScore: 70, affinity: "Elemental", archetype: "Resistência Extrema" },
    Harmonia: { baseScore: 60, affinity: "Convergencia", archetype: "Mimetismo com a Natureza" },
  },
  Estratégia: {
    Estratégia: { baseScore: 90, affinity: "Resonancia", archetype: "Orquestrador Implacável" },
    Soberania: { baseScore: 85, affinity: "Dominio", archetype: "Grande Chanceler" },
    Percepção: { baseScore: 80, affinity: "Dominio", archetype: "Analista Antecipador" },
    Harmonia: { baseScore: 75, affinity: "Convergencia", archetype: "Diplomata Arcano" },
    Arcana: { baseScore: 70, affinity: "Convergencia", archetype: "Teometria Aplicada" },
  },
  Harmonia: {
    Harmonia: { baseScore: 90, affinity: "Resonancia", archetype: "Unificador de Almas" },
    Soberania: { baseScore: 75, affinity: "Convergencia", archetype: "Líder Magnânimo" },
    Estratégia: { baseScore: 75, affinity: "Convergencia", archetype: "Articulador Social" },
    Percepção: { baseScore: 75, affinity: "Convergencia", archetype: "Empatia Profunda" },
    Sobrevivência: { baseScore: 60, affinity: "Convergencia", archetype: "Comunhão Ecológica" },
  },
};

/**
 * Infers domain and tags deterministically for skills that lack explicit metadata.
 */
export function inferSkillDomain(skill: {
  name: string;
  area_id: AreaCode;
  description?: string;
  domain?: string;
  tags?: string[];
}): { domain: CanonicalDomain; tags: string[] } {
  if (skill.domain && (CANONICAL_DOMAINS as readonly string[]).includes(skill.domain)) {
    return {
      domain: skill.domain as CanonicalDomain,
      tags: skill.tags && skill.tags.length > 0 ? skill.tags : [skill.area_id.toLowerCase()],
    };
  }

  const text = `${skill.name} ${skill.description || ""}`.toLowerCase();
  const extractedTags: string[] = [skill.area_id.toLowerCase()];

  if (text.includes("magia") || text.includes("arcano") || text.includes("código") || text.includes("algoritmo") || text.includes("estudo")) {
    extractedTags.push("conhecimento", "arcana");
    return { domain: "Arcana", tags: extractedTags };
  }
  if (text.includes("fogo") || text.includes("vento") || text.includes("água") || text.includes("terra") || text.includes("luz") || text.includes("sombra")) {
    extractedTags.push("elementos", "natureza");
    return { domain: "Elemental", tags: extractedTags };
  }
  if (text.includes("força") || text.includes("luta") || text.includes("corpo") || text.includes("treino") || text.includes("peso") || text.includes("flexão")) {
    extractedTags.push("combate", "fisico");
    return { domain: "Combate", tags: extractedTags };
  }
  if (text.includes("foco") || text.includes("vontade") || text.includes("disciplina") || text.includes("hábito") || text.includes("rotina")) {
    extractedTags.push("disciplina", "soberania");
    return { domain: "Soberania", tags: extractedTags };
  }
  if (text.includes("visão") || text.includes("análise") || text.includes("atenção") || text.includes("observação") || text.includes("padrão")) {
    extractedTags.push("percepcao", "mente");
    return { domain: "Percepção", tags: extractedTags };
  }
  if (text.includes("design") || text.includes("arte") || text.includes("escrita") || text.includes("criação") || text.includes("música")) {
    extractedTags.push("criacao", "arte");
    return { domain: "Criação", tags: extractedTags };
  }
  if (text.includes("resistência") || text.includes("saúde") || text.includes("sono") || text.includes("nutrição")) {
    extractedTags.push("resistencia", "vital");
    return { domain: "Sobrevivência", tags: extractedTags };
  }
  if (text.includes("plano") || text.includes("estratégia") || text.includes("gestão") || text.includes("meta")) {
    extractedTags.push("tatico", "estrategia");
    return { domain: "Estratégia", tags: extractedTags };
  }
  if (text.includes("conversa") || text.includes("empatia") || text.includes("liderança") || text.includes("relação")) {
    extractedTags.push("social", "harmonia");
    return { domain: "Harmonia", tags: extractedTags };
  }

  const fallbackDomain = AREA_PRIMARY_DOMAINS[skill.area_id] || "Arcana";
  return { domain: fallbackDomain, tags: extractedTags };
}

export interface SkillSynergyResult {
  isCompatible: boolean;
  synergyScore: number;
  affinityType: SkillSynergyAffinity;
  targetTier: SkillTier;
  suggestedArchetype: string;
  commonTags: string[];
  reason: string;
}

const TIER_NUMERIC: Record<SkillTier, number> = {
  intrinseca: 1,
  comum: 2,
  especial: 3,
  extra: 4,
  unica: 5,
  suprema: 6,
  primordial: 7,
};

const NUMERIC_TIER: Record<number, SkillTier> = {
  1: "intrinseca",
  2: "comum",
  3: "especial",
  4: "extra",
  5: "unica",
  6: "suprema",
  7: "primordial",
};

/**
 * Pure function: calculates the deterministic synergy between two skills for the Harvest Altar.
 * Zero external AI call required. Evaluates domain alignment, tag intersection and tier harmony.
 */
export function checkSkillSynergy(
  skillA: Skill | { id: string; name: string; area_id: AreaCode; tier: SkillTier; domain?: string; tags?: string[]; description?: string },
  skillB: Skill | { id: string; name: string; area_id: AreaCode; tier: SkillTier; domain?: string; tags?: string[]; description?: string }
): SkillSynergyResult {
  if (skillA.id === skillB.id) {
    return {
      isCompatible: false,
      synergyScore: 0,
      affinityType: "Dissonante",
      targetTier: skillA.tier,
      suggestedArchetype: "",
      commonTags: [],
      reason: "Não é possível fundir uma habilidade consigo mesma.",
    };
  }

  const domainA = inferSkillDomain(skillA);
  const domainB = inferSkillDomain(skillB);

  // Common tags bonus
  const tagsA = new Set(domainA.tags.map((t) => t.toLowerCase()));
  const commonTags = domainB.tags.filter((t) => tagsA.has(t.toLowerCase()));

  const matrixEntry =
    DOMAIN_COMPATIBILITY_MATRIX[domainA.domain]?.[domainB.domain] ||
    DOMAIN_COMPATIBILITY_MATRIX[domainB.domain]?.[domainA.domain];

  const baseScore = matrixEntry?.baseScore ?? 40;
  const affinityType: SkillSynergyAffinity = matrixEntry?.affinity ?? (commonTags.length > 0 ? "Dominio" : "Dissonante");
  const suggestedArchetype = matrixEntry?.archetype ?? `${domainA.domain} & ${domainB.domain}`;

  // Tag synergy bonus: +10 per common tag, up to +30
  const tagBonus = Math.min(30, commonTags.length * 10);
  const synergyScore = Math.min(100, baseScore + tagBonus);

  // Target Tier computation:
  // If both skills are of tier X, fusion ascends to X + 1 (capped at primordial).
  // If tiers differ, target is max(tierA, tierB) + 1 if score >= 80, else max(tierA, tierB).
  const tierNumA = TIER_NUMERIC[skillA.tier] || 2;
  const tierNumB = TIER_NUMERIC[skillB.tier] || 2;
  const maxTierNum = Math.max(tierNumA, tierNumB);
  const targetNum = tierNumA === tierNumB || synergyScore >= 75
    ? Math.min(7, maxTierNum + 1)
    : maxTierNum;
  const targetTier = NUMERIC_TIER[targetNum] || "extra";

  const isCompatible = synergyScore >= 50;

  const reason = !isCompatible
    ? `Dissonância de mana entre os domínios '${domainA.domain}' e '${domainB.domain}' (${synergyScore}% de afinidade).`
    : `Sinergia de ${affinityType} detectada (${synergyScore}% de ressonância) com fusão orientada ao arquétipo [${suggestedArchetype}].`;

  return {
    isCompatible,
    synergyScore,
    affinityType,
    targetTier,
    suggestedArchetype,
    commonTags,
    reason,
  };
}

export interface FusionQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface OfflineFusionProposal {
  suggestedName: string;
  suggestedDescription: string;
  targetTier: SkillTier;
  challengeTitle: string;
  challengeDescription: string;
  focusAnchorMinutes: number;
  questions: FusionQuestion[];
}

/**
 * Generates an offline deterministic fusion questionnaire and proposal
 * if the neural canal is unavailable or the hunter is offline.
 */
export function generateDeterministicFusion(
  skillA: Skill,
  skillB: Skill,
  synergy: SkillSynergyResult
): OfflineFusionProposal {
  const suggestedName = `[${synergy.suggestedArchetype}] ${skillA.name} · ${skillB.name}`;
  const suggestedDescription = `Fusão sagrada consagrada no Altar da Colheita. Unifica os preceitos de '${skillA.name}' com as diretrizes de '${skillB.name}' sob a ressonância de ${synergy.affinityType}.`;

  const questions: FusionQuestion[] = [
    {
      id: "essence",
      question: "Qual é a essência dominante na fusão destas habilidades?",
      options: [
        "Equilíbrio Perfeito entre Ambas",
        `Predomínio Absoluto de ${skillA.name}`,
        `Predomínio Tático de ${skillB.name}`,
        "Transcendência Rúnica Inédita",
      ],
    },
    {
      id: "focus_mode",
      question: "Como você consagrará o ritual prático na realidade?",
      options: [
        "Sessão de 30 minutos no Modo Foco",
        "Ciclo Profundo de 45 minutos no Modo Foco",
        "Conclusão de 3 missões da área principal",
      ],
    },
  ];

  return {
    suggestedName,
    suggestedDescription,
    targetTier: synergy.targetTier,
    challengeTitle: `Desafio de Fusão: Despertar de ${synergy.suggestedArchetype}`,
    challengeDescription: `Realize 1 sessão de foco ininterrupto de 30 minutos e execute uma entrega prática consolidando a fusão de '${skillA.name}' e '${skillB.name}'.`,
    focusAnchorMinutes: 30,
    questions,
  };
}
