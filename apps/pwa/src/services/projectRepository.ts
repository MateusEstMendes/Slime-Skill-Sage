import {
  type Area,
  type AreaCode,
  type Mission,
  type MissionDep,
  type MissionStatus,
  type Project,
  type ProjectStatus,
} from "@slime-sage/shared";
import {
  recalculateMissionStatuses,
  validateAcyclicGraph,
} from "@slime-sage/game";
import { localDb } from "./db";

export interface CreateProjectInput {
  id?: string;
  area_id: AreaCode;
  title: string;
  description?: string;
}

export interface CreateMissionTreeItem {
  id?: string;
  title: string;
  description?: string;
  xp_reward?: number;
  order_index?: number;
  depends_on_ids?: string[];
}

export interface CreateMissionInput {
  id?: string;
  title: string;
  description?: string;
  xp_reward?: number;
  order_index?: number;
}

export interface ProjectWithTree {
  project: Project;
  missions: Mission[];
  dependencies: MissionDep[];
}

export class ProjectRepository {
  private db = localDb;

  // --- AREAS ---

  public async listAreas(): Promise<Area[]> {
    return await this.db.getAll<Area>("area");
  }

  public async getArea(id: AreaCode): Promise<Area | null> {
    return await this.db.get<Area>("area", id);
  }

  // --- PROJECTS ---

  public async createProject(input: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: input.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      area_id: input.area_id,
      title: input.title,
      description: input.description ?? "",
      status: "ativo",
      progress: 0,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    await this.db.put("project", project);
    return project;
  }

  public async getProject(id: string): Promise<Project | null> {
    return await this.db.get<Project>("project", id);
  }

  public async listProjects(filter?: {
    area_id?: AreaCode;
    status?: ProjectStatus;
    includeDeleted?: boolean;
  }): Promise<Project[]> {
    let projects = await this.db.getAll<Project>("project");

    if (!filter?.includeDeleted) {
      projects = projects.filter((p) => p.deleted_at === null);
    }
    if (filter?.area_id) {
      projects = projects.filter((p) => p.area_id === filter.area_id);
    }
    if (filter?.status) {
      projects = projects.filter((p) => p.status === filter.status);
    }

    return projects;
  }

  public async updateProject(
    id: string,
    updates: Partial<Omit<Project, "id" | "created_at">>,
  ): Promise<Project> {
    const existing = await this.getProject(id);
    if (!existing) {
      throw new Error(`Projeto com id ${id} não encontrado`);
    }

    const updated: Project = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.db.put("project", updated);
    return updated;
  }

  public async softDeleteProject(id: string): Promise<void> {
    const now = new Date().toISOString();
    const project = await this.getProject(id);
    if (!project) return;

    project.deleted_at = now;
    project.updated_at = now;
    await this.db.put("project", project);

    // Soft delete all missions under this project
    const missions = await this.listMissions({ projectId: id, includeDeleted: false });
    for (const m of missions) {
      m.deleted_at = now;
      m.updated_at = now;
    }
    if (missions.length > 0) {
      await this.db.putBatch("mission", missions);
    }
  }

  // --- MISSIONS & TREE ---

  public async createMissionTree(
    projectId: string,
    items: CreateMissionTreeItem[],
  ): Promise<{ missions: Mission[]; dependencies: MissionDep[] }> {
    const project = await this.getProject(projectId);
    if (!project || project.deleted_at !== null) {
      throw new Error(`Projeto ativo com id ${projectId} não encontrado`);
    }

    const now = new Date().toISOString();

    // Generate missions and dependency pairs
    const missions: Mission[] = [];
    const depsToCreate: { mission_id: string; depends_on_mission_id: string }[] = [];

    // Map given temporary or real IDs to actual mission objects
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const missionId = item.id || `mis_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      missions.push({
        id: missionId,
        project_id: projectId,
        title: item.title,
        description: item.description ?? "",
        status: "bloqueada",
        order_index: item.order_index ?? i,
        xp_reward: item.xp_reward ?? 50,
        completed_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });

      if (item.depends_on_ids) {
        for (const depId of item.depends_on_ids) {
          depsToCreate.push({
            mission_id: missionId,
            depends_on_mission_id: depId,
          });
        }
      }
    }

    // Include existing dependencies for the project if any
    const existingMissions = await this.listMissions({ projectId, includeDeleted: true });
    const allMissions = [...existingMissions, ...missions];
    const existingDeps = await this.db.getAll<MissionDep>("mission_dep");
    const allDeps = [
      ...existingDeps.map((d) => ({ mission_id: d.mission_id, depends_on_mission_id: d.depends_on_mission_id })),
      ...depsToCreate,
    ];

    // Validate acyclic graph (throws CycleDetectedError on direct or indirect cycle)
    validateAcyclicGraph(
      allMissions.map((m) => m.id),
      allDeps,
    );

    // Build MissionDep entities
    const newMissionDeps: MissionDep[] = depsToCreate.map((d, idx) => ({
      id: `dep_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      mission_id: d.mission_id,
      depends_on_mission_id: d.depends_on_mission_id,
      created_at: now,
    }));

    // Calculate initial statuses
    const updatedMissions = recalculateMissionStatuses(
      allMissions,
      [...existingDeps, ...newMissionDeps],
      now,
    );

    // Save batch
    await this.db.putBatch("mission", updatedMissions);
    if (newMissionDeps.length > 0) {
      await this.db.putBatch("mission_dep", newMissionDeps);
    }

    await this.recalculateProjectProgress(projectId);

    const savedNewMissions = updatedMissions.filter((m) => missions.some((nm) => nm.id === m.id));
    return {
      missions: savedNewMissions,
      dependencies: newMissionDeps,
    };
  }

  public async addMission(
    projectId: string,
    missionData: CreateMissionInput,
    dependsOnMissionIds: string[] = [],
  ): Promise<{ mission: Mission; dependencies: MissionDep[] }> {
    const result = await this.createMissionTree(projectId, [
      {
        ...missionData,
        depends_on_ids: dependsOnMissionIds,
      },
    ]);
    return {
      mission: result.missions[0],
      dependencies: result.dependencies,
    };
  }

  public async updateMission(
    missionId: string,
    updates: Partial<Omit<Mission, "id" | "project_id" | "created_at">>,
    newDependsOnIds?: string[],
  ): Promise<{ updatedMission: Mission; affectedMissions: Mission[] }> {
    const now = new Date().toISOString();
    const mission = await this.db.get<Mission>("mission", missionId);
    if (!mission || mission.deleted_at !== null) {
      throw new Error(`Missão com id ${missionId} não encontrada ou excluída`);
    }

    const updated: Mission = {
      ...mission,
      ...updates,
      updated_at: now,
    };

    const projectMissions = await this.listMissions({ projectId: mission.project_id, includeDeleted: true });
    const missionMap = new Map(projectMissions.map((m) => [m.id, m]));
    missionMap.set(updated.id, updated);

    let allDeps = await this.db.getAll<MissionDep>("mission_dep");

    if (newDependsOnIds !== undefined) {
      const otherDeps = allDeps.filter((d) => d.mission_id !== missionId);
      const newDeps: MissionDep[] = newDependsOnIds.map((depId, idx) => ({
        id: `dep_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        mission_id: missionId,
        depends_on_mission_id: depId,
        created_at: now,
      }));

      const projectDepsCandidate = [
        ...otherDeps.filter((d) => missionMap.has(d.mission_id) && missionMap.has(d.depends_on_mission_id)),
        ...newDeps,
      ];

      validateAcyclicGraph(
        Array.from(missionMap.keys()),
        projectDepsCandidate.map((d) => ({
          mission_id: d.mission_id,
          depends_on_mission_id: d.depends_on_mission_id,
        })),
      );

      const existingMissionDeps = allDeps.filter((d) => d.mission_id === missionId);
      for (const d of existingMissionDeps) {
        await this.db.delete("mission_dep", d.id);
      }
      if (newDeps.length > 0) {
        await this.db.putBatch("mission_dep", newDeps);
      }

      allDeps = [...otherDeps, ...newDeps];
    }

    const projectDeps = allDeps.filter(
      (d) => missionMap.has(d.mission_id) && missionMap.has(d.depends_on_mission_id),
    );

    const recalculated = recalculateMissionStatuses(Array.from(missionMap.values()), projectDeps, now);

    const affectedMissions: Mission[] = [];
    for (const m of recalculated) {
      const prev = missionMap.get(m.id);
      if (prev && (prev.status !== m.status || prev.completed_at !== m.completed_at)) {
        affectedMissions.push(m);
      }
    }

    await this.db.putBatch("mission", recalculated);
    await this.recalculateProjectProgress(mission.project_id);

    const finalMission = recalculated.find((m) => m.id === missionId) || updated;
    return {
      updatedMission: finalMission,
      affectedMissions,
    };
  }

  public async updateMissionStatus(
    missionId: string,
    status: MissionStatus,
  ): Promise<{ updatedMission: Mission; affectedMissions: Mission[] }> {
    const now = new Date().toISOString();
    const mission = await this.db.get<Mission>("mission", missionId);
    if (!mission || mission.deleted_at !== null) {
      throw new Error(`Missão com id ${missionId} não encontrada ou excluída`);
    }

    mission.status = status;
    mission.completed_at = status === "feita" ? now : null;
    mission.updated_at = now;

    // Fetch all missions and deps for this project
    const projectMissions = await this.listMissions({ projectId: mission.project_id, includeDeleted: true });
    const missionMap = new Map(projectMissions.map((m) => [m.id, m]));
    missionMap.set(mission.id, mission);

    const allDeps = await this.db.getAll<MissionDep>("mission_dep");
    const projectDeps = allDeps.filter(
      (d) => missionMap.has(d.mission_id) && missionMap.has(d.depends_on_mission_id),
    );

    // Recalculate statuses with cascade
    const recalculated = recalculateMissionStatuses(Array.from(missionMap.values()), projectDeps, now);

    // Identify affected missions
    const affectedMissions: Mission[] = [];
    for (const m of recalculated) {
      const prev = missionMap.get(m.id);
      if (prev && (prev.status !== m.status || prev.completed_at !== m.completed_at)) {
        affectedMissions.push(m);
      }
    }

    // Batch update affected
    await this.db.putBatch("mission", recalculated);
    await this.recalculateProjectProgress(mission.project_id);

    const updatedMission = recalculated.find((m) => m.id === missionId) || mission;
    return {
      updatedMission,
      affectedMissions,
    };
  }

  public async softDeleteMission(missionId: string): Promise<void> {
    const now = new Date().toISOString();
    const mission = await this.db.get<Mission>("mission", missionId);
    if (!mission) return;

    mission.deleted_at = now;
    mission.updated_at = now;
    await this.db.put("mission", mission);

    // Recalculate remaining project missions so deleted prereqs don't lock dependents
    const projectMissions = await this.listMissions({ projectId: mission.project_id, includeDeleted: true });
    const allDeps = await this.db.getAll<MissionDep>("mission_dep");
    const recalculated = recalculateMissionStatuses(projectMissions, allDeps, now);

    await this.db.putBatch("mission", recalculated);
    await this.recalculateProjectProgress(mission.project_id);
  }

  public async getMission(id: string): Promise<Mission | null> {
    return await this.db.get<Mission>("mission", id);
  }

  public async listMissions(filter?: {
    projectId?: string;
    status?: MissionStatus;
    includeDeleted?: boolean;
  }): Promise<Mission[]> {
    let missions = await this.db.getAll<Mission>("mission");

    if (!filter?.includeDeleted) {
      missions = missions.filter((m) => m.deleted_at === null);
    }
    if (filter?.projectId) {
      missions = missions.filter((m) => m.project_id === filter.projectId);
    }
    if (filter?.status) {
      missions = missions.filter((m) => m.status === filter.status);
    }

    return missions.sort((a, b) => a.order_index - b.order_index);
  }

  public async getProjectWithTree(projectId: string): Promise<ProjectWithTree | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    const missions = await this.listMissions({ projectId, includeDeleted: false });
    const missionIds = new Set(missions.map((m) => m.id));

    const allDeps = await this.db.getAll<MissionDep>("mission_dep");
    const dependencies = allDeps.filter(
      (d) => missionIds.has(d.mission_id) && missionIds.has(d.depends_on_mission_id),
    );

    return {
      project,
      missions,
      dependencies,
    };
  }

  public async recalculateProjectProgress(projectId: string): Promise<number> {
    const project = await this.getProject(projectId);
    if (!project) return 0;

    const missions = await this.listMissions({ projectId, includeDeleted: false });
    if (missions.length === 0) {
      project.progress = 0;
      await this.db.put("project", project);
      return 0;
    }

    const doneCount = missions.filter((m) => m.status === "feita").length;
    const progress = Math.round((doneCount / missions.length) * 100);

    project.progress = progress;
    if (progress === 100 && project.status === "ativo") {
      project.status = "concluido";
      project.completed_at = new Date().toISOString();
    } else if (progress < 100 && project.status === "concluido") {
      project.status = "ativo";
      project.completed_at = null;
    }
    project.updated_at = new Date().toISOString();

    await this.db.put("project", project);
    return progress;
  }
}

export const projectRepository = new ProjectRepository();
