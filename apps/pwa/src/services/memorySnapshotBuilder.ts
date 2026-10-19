import type {
  AreaCode,
  DailyMission,
  HunterContext,
  Mission,
  Profile,
  Project,
  Skill,
  XpEvent,
} from "@slime-sage/shared";
import { localDb } from "./db";

export interface SelectedSnapshotSkill {
  id: string;
  name: string;
  area_id: AreaCode;
  tier: Skill["tier"];
  mastery: number;
  selection_reason: "top_mastery" | "recent_practice";
}

/**
 * Pure hybrid skill selector for the Hunter Memory Snapshot:
 * - Selects up to 5 skills with highest mastery ("top_mastery");
 * - Selects up to 5 most recently practiced skills via xp_event ledger ("recent_practice");
 * - Fills remaining slots (up to `limit`, default 10) by updated_at / mastery if needed.
 */
export function selectTopSkillsHybrid(
  skills: ReadonlyArray<Skill>,
  xpEvents: ReadonlyArray<XpEvent>,
  limit: number = 10,
): SelectedSnapshotSkill[] {
  if (skills.length === 0) return [];

  const skillById = new Map<string, Skill>();
  for (const s of skills) {
    skillById.set(s.id, s);
  }

  // 1. Top 5 by mastery
  const sortedByMastery = [...skills].sort((a, b) => {
    if (b.mastery !== a.mastery) return b.mastery - a.mastery;
    return b.updated_at.localeCompare(a.updated_at);
  });

  const selected: SelectedSnapshotSkill[] = [];
  const selectedIds = new Set<string>();

  for (const s of sortedByMastery.slice(0, 5)) {
    selected.push({
      id: s.id,
      name: s.name,
      area_id: s.area_id,
      tier: s.tier,
      mastery: s.mastery,
      selection_reason: "top_mastery",
    });
    selectedIds.add(s.id);
  }

  // 2. Up to 5 most recently practiced skills from xp_event ledger
  const sortedEvents = [...xpEvents]
    .filter((ev) => Boolean(ev.skill_id) && ev.xp_amount > 0)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  for (const ev of sortedEvents) {
    if (selected.length >= limit) break;
    if (!ev.skill_id || selectedIds.has(ev.skill_id)) continue;

    const skill = skillById.get(ev.skill_id);
    if (skill) {
      selected.push({
        id: skill.id,
        name: skill.name,
        area_id: skill.area_id,
        tier: skill.tier,
        mastery: skill.mastery,
        selection_reason: "recent_practice",
      });
      selectedIds.add(skill.id);
    }
  }

  // 3. If still under limit and more skills exist, fill with remaining most recently updated skills
  if (selected.length < limit && skills.length > selected.length) {
    const remainingByRecency = [...skills]
      .filter((s) => !selectedIds.has(s.id))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    for (const s of remainingByRecency) {
      if (selected.length >= limit) break;
      selected.push({
        id: s.id,
        name: s.name,
        area_id: s.area_id,
        tier: s.tier,
        mastery: s.mastery,
        selection_reason: "recent_practice",
      });
      selectedIds.add(s.id);
    }
  }

  return selected.slice(0, limit);
}

/**
 * Estimates token count (~4 chars per token in Portuguese/Markdown).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Builds the compact (~500 tokens) Hunter Memory Snapshot from IndexedDB.
 */
export async function buildMemorySnapshot(): Promise<HunterContext> {
  const [profiles, allSkills, allProjects, allMissions, allDailies, allXpEvents] =
    await Promise.all([
      localDb.getAll<Profile>("profile"),
      localDb.getAll<Skill>("skill"),
      localDb.getAll<Project>("project"),
      localDb.getAll<Mission>("mission"),
      localDb.getAll<DailyMission>("daily_mission"),
      localDb.getAll<XpEvent>("xp_event"),
    ]);

  const profile = profiles[0] || {
    name: "Caçador",
    title: "Desperto",
    level: 1,
    current_xp: 0,
    streak_count: 0,
  };

  const activeProjects = allProjects
    .filter((p) => p.deleted_at === null && p.status === "ativo")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const primaryActiveProject = activeProjects[0]
    ? {
        id: activeProjects[0].id,
        title: activeProjects[0].title,
        area_id: activeProjects[0].area_id,
        progress: activeProjects[0].progress,
      }
    : null;

  const availableMissions = allMissions
    .filter((m) => m.deleted_at === null && m.status === "disponivel")
    .sort((a, b) => a.order_index - b.order_index);

  const nextFiveMissions = availableMissions.slice(0, 5).map((m) => ({
    id: m.id,
    project_id: m.project_id,
    title: m.title,
    status: m.status,
    xp_reward: m.xp_reward,
  }));

  const topSkills = selectTopSkillsHybrid(allSkills, allXpEvents, 10);

  const recentDailies = allDailies.slice(0, 5).map((d) => ({
    id: d.id,
    title: d.title,
    completed: d.completed,
    xp_reward: d.xp_reward,
  }));

  const lines: string[] = [
    "--- SNAPSHOT DE MEMÓRIA DO CAÇADOR (~500 TOKENS) ---",
    `Caçador: ${profile.name} | Título: ${profile.title} | Nível: ${profile.level} (${profile.current_xp} XP) | Streak: ${profile.streak_count}d`,
    `Projeto Ativo Principal: ${
      primaryActiveProject
        ? `"${primaryActiveProject.title}" [${primaryActiveProject.area_id} · ${primaryActiveProject.progress}%]`
        : "Nenhum"
    }`,
    `Outros Projetos Ativos (${activeProjects.length}): ${
      activeProjects.length > 0
        ? activeProjects
            .slice(0, 4)
            .map((p) => `"${p.title}" (${p.area_id}, ${p.progress}%)`)
            .join("; ")
        : "Nenhum"
    }`,
    `Próximas 5 Missões Disponíveis (Total pendentes: ${availableMissions.length}): ${
      nextFiveMissions.length > 0
        ? nextFiveMissions.map((m) => `"${m.title}" (+${m.xp_reward}XP)`).join("; ")
        : "Nenhuma missão disponível"
    }`,
    `Missões Diárias Hoje: ${
      recentDailies.length > 0
        ? recentDailies
            .map((d) => `${d.completed ? "[X]" : "[ ]"} ${d.title}`)
            .join("; ")
        : "Nenhuma registrada"
    }`,
    `Top 10 Habilidades (Híbrido — 5 Maior Maestria + 5 Prática Recente): ${
      topSkills.length > 0
        ? topSkills
            .map(
              (s) =>
                `${s.name} [${s.area_id} · ${s.tier.toUpperCase()} · ${s.mastery}/300 · ${
                  s.selection_reason === "top_mastery" ? "TOP" : "RECENTE"
                }]`,
            )
            .join(", ")
        : "Nenhuma habilidade adquirida ainda"
    }`,
    "----------------------------------------------------",
  ];

  const formattedPrompt = lines.join("\n");
  const estimatedTokens = estimateTokens(formattedPrompt);

  return {
    profile: {
      name: profile.name,
      title: profile.title,
      level: profile.level,
      current_xp: profile.current_xp,
      streak_count: profile.streak_count ?? 0,
    },
    skills: topSkills,
    projects: activeProjects.slice(0, 5).map((p) => ({
      id: p.id,
      title: p.title,
      area_id: p.area_id,
      status: p.status,
      progress: p.progress,
    })),
    active_project: primaryActiveProject,
    pending_missions_count: availableMissions.length,
    recent_missions: nextFiveMissions,
    daily_missions: recentDailies,
    estimated_tokens: estimatedTokens,
    formatted_prompt: formattedPrompt,
  };
}
