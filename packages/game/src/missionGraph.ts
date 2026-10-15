import type { Mission, MissionDep } from "@slime-sage/shared";

export class CycleDetectedError extends Error {
  public readonly cyclePath: string[];

  constructor(cyclePath: string[]) {
    super(`Ciclo detectado no grafo de missões: ${cyclePath.join(" -> ")}`);
    this.name = "CycleDetectedError";
    this.cyclePath = cyclePath;
  }
}

export interface DependencyPair {
  mission_id: string; // The dependent mission
  depends_on_mission_id: string; // The prerequisite mission that must be completed first
}

/**
 * Validates that the graph of missions and dependencies is a Directed Acyclic Graph (DAG).
 * Throws CycleDetectedError if any direct or indirect cycle is found.
 */
export function validateAcyclicGraph(
  missionIds: string[],
  dependencies: DependencyPair[],
): void {
  const nodeSet = new Set(missionIds);

  // Also include any mission IDs present in dependencies
  for (const dep of dependencies) {
    nodeSet.add(dep.mission_id);
    nodeSet.add(dep.depends_on_mission_id);
  }

  // Self-dependency check
  for (const dep of dependencies) {
    if (dep.mission_id === dep.depends_on_mission_id) {
      throw new CycleDetectedError([dep.mission_id, dep.depends_on_mission_id]);
    }
  }

  // Build adjacency list: prerequisite -> dependent
  // In DAG terms, an edge from A to B means A must precede B.
  const adj = new Map<string, string[]>();
  for (const id of nodeSet) {
    adj.set(id, []);
  }

  for (const dep of dependencies) {
    const list = adj.get(dep.depends_on_mission_id);
    if (list) {
      list.push(dep.mission_id);
    } else {
      adj.set(dep.depends_on_mission_id, [dep.mission_id]);
    }
  }

  // 0 = unvisited, 1 = visiting (in recursion stack), 2 = visited
  const state = new Map<string, number>();
  const parent = new Map<string, string | null>();

  function dfs(u: string, pathStack: string[]): void {
    state.set(u, 1);
    pathStack.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      const vState = state.get(v) || 0;
      if (vState === 1) {
        // Cycle found: extract cycle path from recursion stack
        const cycleStartIndex = pathStack.indexOf(v);
        const cycle = pathStack.slice(cycleStartIndex);
        cycle.push(v);
        throw new CycleDetectedError(cycle);
      }

      if (vState === 0) {
        parent.set(v, u);
        dfs(v, pathStack);
      }
    }

    pathStack.pop();
    state.set(u, 2);
  }

  for (const id of nodeSet) {
    if ((state.get(id) || 0) === 0) {
      dfs(id, []);
    }
  }
}

/**
 * Performs a topological sort of missions.
 * Returns mission IDs in order where prerequisites appear before dependents.
 */
export function topologicalSort(
  missionIds: string[],
  dependencies: DependencyPair[],
): string[] {
  validateAcyclicGraph(missionIds, dependencies);

  const nodeSet = new Set(missionIds);
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const id of nodeSet) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }

  for (const dep of dependencies) {
    if (nodeSet.has(dep.depends_on_mission_id) && nodeSet.has(dep.mission_id)) {
      adj.get(dep.depends_on_mission_id)?.push(dep.mission_id);
      inDegree.set(dep.mission_id, (inDegree.get(dep.mission_id) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    sorted.push(u);

    for (const v of adj.get(u) || []) {
      const nextDeg = (inDegree.get(v) || 0) - 1;
      inDegree.set(v, nextDeg);
      if (nextDeg === 0) {
        queue.push(v);
      }
    }
  }

  return sorted;
}

/**
 * Pure function that recalculates the statuses of all missions based on their dependencies.
 * - Active prerequisites: dependencies where prerequisite is not soft-deleted.
 * - If all active prerequisites are 'feita': 'bloqueada' -> 'disponivel'.
 * - If any active prerequisite is not 'feita': 'disponivel' -> 'bloqueada', 'feita' -> 'bloqueada' (reversão ao desfazer).
 * - Soft-deleted missions are preserved without blocking dependents.
 */
export function recalculateMissionStatuses(
  missions: Mission[],
  dependencies: MissionDep[],
  nowIso: string = new Date().toISOString(),
): Mission[] {
  const missionMap = new Map<string, Mission>();
  for (const m of missions) {
    missionMap.set(m.id, { ...m });
  }

  // Filter dependencies to only those belonging to missions in this set
  const validDeps = dependencies.filter(
    (d) => missionMap.has(d.mission_id) && missionMap.has(d.depends_on_mission_id),
  );

  // Validate DAG first
  validateAcyclicGraph(
    missions.map((m) => m.id),
    validDeps,
  );

  // Group prerequisites by mission_id
  const prereqsByMission = new Map<string, string[]>();
  for (const dep of validDeps) {
    const list = prereqsByMission.get(dep.mission_id) || [];
    list.push(dep.depends_on_mission_id);
    prereqsByMission.set(dep.mission_id, list);
  }

  const sortedIds = topologicalSort(
    missions.map((m) => m.id),
    validDeps,
  );

  for (const id of sortedIds) {
    const mission = missionMap.get(id);
    if (!mission || mission.deleted_at !== null) {
      continue;
    }

    const prereqIds = prereqsByMission.get(id) || [];
    // Only count active (non-deleted) prerequisites
    const activePrereqIds = prereqIds.filter((pId) => {
      const p = missionMap.get(pId);
      return p && p.deleted_at === null;
    });

    if (activePrereqIds.length === 0) {
      // No active prerequisites: mission can be 'disponivel' or 'feita'
      if (mission.status === "bloqueada") {
        mission.status = "disponivel";
        mission.updated_at = nowIso;
      }
    } else {
      // Has active prerequisites: check if all are completed ('feita')
      const allPrereqsDone = activePrereqIds.every((pId) => {
        const p = missionMap.get(pId);
        return p?.status === "feita";
      });

      if (allPrereqsDone) {
        if (mission.status === "bloqueada") {
          mission.status = "disponivel";
          mission.updated_at = nowIso;
        }
      } else {
        // At least one prerequisite is not done!
        if (mission.status === "disponivel") {
          mission.status = "bloqueada";
          mission.updated_at = nowIso;
        } else if (mission.status === "feita") {
          // Reversion cascade: prerequisite was undone!
          mission.status = "bloqueada";
          mission.completed_at = null;
          mission.updated_at = nowIso;
        }
      }
    }
  }

  return Array.from(missionMap.values());
}
