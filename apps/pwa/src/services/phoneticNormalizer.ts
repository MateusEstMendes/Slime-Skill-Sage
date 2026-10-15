/**
 * Normalizador Fonético para síntese de voz (Web Speech API pt-BR).
 * Adapta termos em inglês, jargões de RPG/jogos e termos de animes (Tensura, Solo Leveling)
 * para pronúncia natural e precisa em português brasileiro.
 */

const PHONETIC_MAP: Array<{ pattern: RegExp; replacement: string }> = [
  // Termos centrais do aplicativo
  { pattern: /\bSlime Sage\b/gi, replacement: "Slime Séidji" },
  { pattern: /\bSage\b/gi, replacement: "Séidji" },
  { pattern: /\bG\.S\b/gi, replacement: "Grande Sábio" },
  { pattern: /\bS\.S\.S\b/gi, replacement: "Ésse Ésse Ésse" },

  // RPG, Game e Solo Leveling / Tensura
  { pattern: /\bSkill\b/gi, replacement: "Isquil" },
  { pattern: /\bSkills\b/gi, replacement: "Isquils" },
  { pattern: /\bSolo Leveling\b/gi, replacement: "Sôulo Léveling" },
  { pattern: /\bLevel\b/gi, replacement: "Lével" },
  { pattern: /\bXP\b/g, replacement: "Xis Pê" },
  { pattern: /\bQuest\b/gi, replacement: "Késti" },
  { pattern: /\bQuests\b/gi, replacement: "Késtis" },
  { pattern: /\bStreak\b/gi, replacement: "Istríki" },
  { pattern: /\bStreaks\b/gi, replacement: "Istríkis" },
  { pattern: /\bLedger\b/gi, replacement: "Lédjer" },
  { pattern: /\bCooldown\b/gi, replacement: "Culdáun" },
  { pattern: /\bUpgrade\b/gi, replacement: "Apegreidi" },
  { pattern: /\bTensura\b/gi, replacement: "Tençura" },
  { pattern: /\bRank\b/gi, replacement: "Ránki" },
  { pattern: /\bRanks\b/gi, replacement: "Ránkis" },

  // Termos técnicos e web
  { pattern: /\bPWA\b/g, replacement: "Pê Dáblio Á" },
  { pattern: /\bAPI\b/g, replacement: "A Pê Í" },
  { pattern: /\bOnline\b/gi, replacement: "On-laine" },
  { pattern: /\bOffline\b/gi, replacement: "Of-laine" },
];

export function normalizePhonetics(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PHONETIC_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
