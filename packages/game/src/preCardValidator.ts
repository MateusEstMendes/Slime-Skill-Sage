import type { AreaCode, CreateProjectTreeProposal, ProjectTargetSkill } from "@slime-sage/shared";
import { CycleDetectedError, validateAcyclicGraph, type DependencyPair } from "./missionGraph";
import { canonicalizeSkillKey, classifySkillsDiff, normalizeSkillName } from "./skills";

export interface ProposalValidationResult {
  isValid: boolean;
  errors: string[];
  enrichedProposal?: CreateProjectTreeProposal;
}

/**
 * Pure Pre-Card Validator for G.S project tree proposals.
 * Verifies:
 * 1. Non-empty project title and mission list;
 * 2. Unique mission titles;
 * 3. Valid dependency references and strict DAG (no direct or indirect cycles);
 * 4. Project target_skill classification and auto-inheritance across missions;
 * 5. 1 to 3 skills per mission;
 * 6. Skill deduplication, classification ([EXISTENTE] vs [NOVA · <ATTR>]), and micro-skill fragmentation rejection.
 */
export function validateProposalIntegrity(
  proposal: CreateProjectTreeProposal,
  existingSkills: ReadonlyArray<{ id: string; name: string; area_id: AreaCode }>,
): ProposalValidationResult {
  const errors: string[] = [];

  if (!proposal.project?.title?.trim()) {
    errors.push("O projeto proposto não possui um título válido.");
  }

  if (!Array.isArray(proposal.missions) || proposal.missions.length === 0) {
    errors.push("A árvore de projeto deve conter pelo menos 1 missão.");
    return { isValid: false, errors };
  }

  const titleSet = new Set<string>();
  const missionTitles: string[] = [];

  for (let i = 0; i < proposal.missions.length; i++) {
    const m = proposal.missions[i];
    const cleanTitle = normalizeSkillName(m.title);
    if (!cleanTitle) {
      errors.push(`A missão #${i + 1} possui título vazio.`);
      continue;
    }
    if (titleSet.has(cleanTitle)) {
      errors.push(`Título de missão duplicado detectado: "${cleanTitle}".`);
    }
    titleSet.add(cleanTitle);
    missionTitles.push(cleanTitle);
  }

  // Validate dependency references
  const depPairs: DependencyPair[] = [];
  for (const m of proposal.missions) {
    const cleanTitle = normalizeSkillName(m.title);
    for (const depTitleRaw of m.depends_on_titles || []) {
      const depTitle = normalizeSkillName(depTitleRaw);
      if (!titleSet.has(depTitle)) {
        errors.push(
          `A missão "${cleanTitle}" depende de "${depTitle}", que não existe na árvore proposta.`,
        );
      } else {
        depPairs.push({
          mission_id: cleanTitle,
          depends_on_mission_id: depTitle,
        });
      }
    }
  }

  // Validate DAG (no cycles)
  try {
    validateAcyclicGraph(missionTitles, depPairs);
  } catch (err) {
    if (err instanceof CycleDetectedError) {
      errors.push(`Dependência circular detectada na árvore: ${err.cyclePath.join(" -> ")}.`);
    } else {
      errors.push("Erro ao validar topologia acíclica (DAG) das missões.");
    }
  }

  // 1. Process and classify project target_skill (if provided)
  let enrichedTargetSkill: ProjectTargetSkill | undefined;
  if (proposal.project?.target_skill?.name) {
    const cleanTargetName = normalizeSkillName(proposal.project.target_skill.name);
    if (cleanTargetName) {
      const classifiedTarget = classifySkillsDiff(
        existingSkills,
        [
          {
            name: cleanTargetName,
            area_id: proposal.project.target_skill.area_id || proposal.project.area_id,
          },
        ],
        proposal.project.area_id,
      );
      if (classifiedTarget.length > 0) {
        enrichedTargetSkill = {
          ...classifiedTarget[0],
          next_evolution_name: proposal.project.target_skill.next_evolution_name,
          next_evolution_description: proposal.project.target_skill.next_evolution_description,
        };
      }
    }
  }

  // 2. Validate & classify skills per mission (1 to 3 skills required)
  const enrichedMissions = proposal.missions.map((m, idx) => {
    const cleanTitle = normalizeSkillName(m.title) || `Missão #${idx + 1}`;
    let rawSkills = m.skills || [];

    // Auto-inherit project target_skill if mission has no explicit skills
    if (rawSkills.length === 0 && enrichedTargetSkill) {
      rawSkills = [enrichedTargetSkill];
    } else if (enrichedTargetSkill) {
      // Ensure the project target_skill is included in the mission skills if space permits
      const targetCanonical = canonicalizeSkillKey(enrichedTargetSkill.name);
      const targetIndex = rawSkills.findIndex(
        (s) => canonicalizeSkillKey(s.name) === targetCanonical,
      );
      if (targetIndex === -1 && rawSkills.length < 3) {
        rawSkills = [enrichedTargetSkill, ...rawSkills];
      } else if (targetIndex >= 0) {
        rawSkills = [...rawSkills];
        rawSkills[targetIndex] = {
          ...rawSkills[targetIndex],
          next_evolution_name: rawSkills[targetIndex].next_evolution_name || enrichedTargetSkill.next_evolution_name,
          next_evolution_description: rawSkills[targetIndex].next_evolution_description || enrichedTargetSkill.next_evolution_description,
        };
      }
    }

    if (rawSkills.length < 1) {
      errors.push(
        `A missão "${cleanTitle}" não possui nenhuma habilidade associada (mínimo exigido: 1 a 3 habilidades).`,
      );
    } else if (rawSkills.length > 3) {
      errors.push(
        `A missão "${cleanTitle}" possui ${rawSkills.length} habilidades associadas (máximo permitido: 3 habilidades por missão).`,
      );
    }

    const classified = classifySkillsDiff(
      existingSkills,
      rawSkills.slice(0, 3),
      proposal.project.area_id,
    );

    if (rawSkills.length >= 1 && classified.length === 0) {
      errors.push(`As habilidades informadas na missão "${cleanTitle}" têm nomes inválidos.`);
    }

    return {
      ...m,
      title: cleanTitle,
      depends_on_titles: (m.depends_on_titles || []).map((t) => normalizeSkillName(t)),
      skills: classified,
    };
  });

  // 3. Detect micro-skills anti-pattern (if >= 3 missions, each has distinct new skills, none shared)
  if (proposal.missions.length >= 3 && !enrichedTargetSkill) {
    const skillCounts = new Map<string, number>();
    let totalAssigned = 0;
    for (const em of enrichedMissions) {
      for (const s of em.skills || []) {
        const key = canonicalizeSkillKey(s.name);
        if (key) {
          skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
          totalAssigned++;
        }
      }
    }
    const maxShared = Math.max(0, ...Array.from(skillCounts.values()));
    const hasAnyExisting = enrichedMissions.some((m) => m.skills?.some((s) => !s.is_new));
    if (maxShared <= 1 && !hasAnyExisting && totalAssigned >= 3) {
      errors.push(
        "Detectada fragmentação em micro-skills. Todas as missões do projeto devem compartilhar a Habilidade Principal do Projeto para acumular maestria.",
      );
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: [],
    enrichedProposal: {
      ...proposal,
      project: {
        ...proposal.project,
        title: normalizeSkillName(proposal.project.title),
        target_skill: enrichedTargetSkill || proposal.project.target_skill,
      },
      missions: enrichedMissions,
    },
  };
}
