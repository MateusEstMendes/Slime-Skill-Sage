import { describe, it, expect } from "vitest";
import type { Mission, MissionDep } from "@slime-sage/shared";
import {
  CycleDetectedError,
  validateAcyclicGraph,
  topologicalSort,
  recalculateMissionStatuses,
} from "./missionGraph";

describe("Mission Graph & DAG Engine", () => {
  const now = "2026-10-15T02:00:00.000Z";

  const createMockMission = (id: string, status: Mission["status"] = "bloqueada", deletedAt: string | null = null): Mission => ({
    id,
    project_id: "proj-1",
    title: `Missão ${id}`,
    description: `Descrição da missão ${id}`,
    status,
    order_index: 0,
    xp_reward: 50,
    completed_at: status === "feita" ? now : null,
    created_at: now,
    updated_at: now,
    deleted_at: deletedAt,
  });

  const createDep = (missionId: string, dependsOnId: string): MissionDep => ({
    id: `dep-${missionId}-${dependsOnId}`,
    mission_id: missionId,
    depends_on_mission_id: dependsOnId,
    created_at: now,
  });

  describe("validateAcyclicGraph and Cycle Detection", () => {
    it("accepts a valid linear dependency tree (A -> B -> C)", () => {
      const deps = [
        { mission_id: "B", depends_on_mission_id: "A" },
        { mission_id: "C", depends_on_mission_id: "B" },
      ];
      expect(() => validateAcyclicGraph(["A", "B", "C"], deps)).not.toThrow();
    });

    it("accepts a valid branching diamond dependency graph", () => {
      // A -> B, A -> C, B -> D, C -> D
      const deps = [
        { mission_id: "B", depends_on_mission_id: "A" },
        { mission_id: "C", depends_on_mission_id: "A" },
        { mission_id: "D", depends_on_mission_id: "B" },
        { mission_id: "D", depends_on_mission_id: "C" },
      ];
      expect(() => validateAcyclicGraph(["A", "B", "C", "D"], deps)).not.toThrow();
    });

    it("rejects self-dependencies (A -> A)", () => {
      const deps = [{ mission_id: "A", depends_on_mission_id: "A" }];
      expect(() => validateAcyclicGraph(["A"], deps)).toThrow(CycleDetectedError);
      try {
        validateAcyclicGraph(["A"], deps);
      } catch (err) {
        expect((err as CycleDetectedError).cyclePath).toEqual(["A", "A"]);
      }
    });

    it("rejects direct circular dependencies (A -> B -> A)", () => {
      const deps = [
        { mission_id: "B", depends_on_mission_id: "A" },
        { mission_id: "A", depends_on_mission_id: "B" },
      ];
      expect(() => validateAcyclicGraph(["A", "B"], deps)).toThrow(CycleDetectedError);
      try {
        validateAcyclicGraph(["A", "B"], deps);
      } catch (err) {
        expect(err).toBeInstanceOf(CycleDetectedError);
        const path = (err as CycleDetectedError).cyclePath;
        expect(path.length).toBeGreaterThanOrEqual(3);
        expect(path[0]).toBe(path[path.length - 1]);
      }
    });

    it("rejects indirect circular dependencies (A -> B -> C -> A)", () => {
      const deps = [
        { mission_id: "B", depends_on_mission_id: "A" },
        { mission_id: "C", depends_on_mission_id: "B" },
        { mission_id: "A", depends_on_mission_id: "C" },
      ];
      expect(() => validateAcyclicGraph(["A", "B", "C"], deps)).toThrow(CycleDetectedError);
      try {
        validateAcyclicGraph(["A", "B", "C"], deps);
      } catch (err) {
        expect(err).toBeInstanceOf(CycleDetectedError);
        const path = (err as CycleDetectedError).cyclePath;
        expect(path[0]).toBe(path[path.length - 1]);
      }
    });

    it("rejects deeply nested cycles in larger graphs", () => {
      const deps = [
        { mission_id: "B", depends_on_mission_id: "A" },
        { mission_id: "C", depends_on_mission_id: "B" },
        { mission_id: "D", depends_on_mission_id: "C" },
        { mission_id: "B", depends_on_mission_id: "D" }, // Cycle: B -> C -> D -> B
      ];
      expect(() => validateAcyclicGraph(["A", "B", "C", "D"], deps)).toThrow(CycleDetectedError);
    });
  });

  describe("topologicalSort", () => {
    it("orders missions such that prerequisites precede dependents", () => {
      const deps = [
        { mission_id: "C", depends_on_mission_id: "B" },
        { mission_id: "B", depends_on_mission_id: "A" },
      ];
      const sorted = topologicalSort(["C", "A", "B"], deps);
      expect(sorted).toEqual(["A", "B", "C"]);
    });

    it("throws CycleDetectedError if cycle is present during sort", () => {
      const deps = [
        { mission_id: "B", depends_on_mission_id: "A" },
        { mission_id: "A", depends_on_mission_id: "B" },
      ];
      expect(() => topologicalSort(["A", "B"], deps)).toThrow(CycleDetectedError);
    });
  });

  describe("recalculateMissionStatuses", () => {
    it("makes missions with no prerequisites 'disponivel'", () => {
      const m1 = createMockMission("A", "bloqueada");
      const m2 = createMockMission("B", "bloqueada");
      const result = recalculateMissionStatuses([m1, m2], []);

      expect(result.find((m) => m.id === "A")?.status).toBe("disponivel");
      expect(result.find((m) => m.id === "B")?.status).toBe("disponivel");
    });

    it("keeps dependent missions 'bloqueada' until prerequisite is 'feita' in A -> B -> C", () => {
      const mA = createMockMission("A", "disponivel");
      const mB = createMockMission("B", "bloqueada");
      const mC = createMockMission("C", "bloqueada");
      const deps = [createDep("B", "A"), createDep("C", "B")];

      const result = recalculateMissionStatuses([mA, mB, mC], deps);
      expect(result.find((m) => m.id === "A")?.status).toBe("disponivel");
      expect(result.find((m) => m.id === "B")?.status).toBe("bloqueada");
      expect(result.find((m) => m.id === "C")?.status).toBe("bloqueada");
    });

    it("automatically unlocks B to 'disponivel' when A is marked 'feita'", () => {
      const mA = createMockMission("A", "feita");
      const mB = createMockMission("B", "bloqueada");
      const mC = createMockMission("C", "bloqueada");
      const deps = [createDep("B", "A"), createDep("C", "B")];

      const result = recalculateMissionStatuses([mA, mB, mC], deps);
      expect(result.find((m) => m.id === "A")?.status).toBe("feita");
      expect(result.find((m) => m.id === "B")?.status).toBe("disponivel");
      expect(result.find((m) => m.id === "C")?.status).toBe("bloqueada");
    });

    it("unlocks C to 'disponivel' when both A and B are 'feita'", () => {
      const mA = createMockMission("A", "feita");
      const mB = createMockMission("B", "feita");
      const mC = createMockMission("C", "bloqueada");
      const deps = [createDep("B", "A"), createDep("C", "B")];

      const result = recalculateMissionStatuses([mA, mB, mC], deps);
      expect(result.find((m) => m.id === "A")?.status).toBe("feita");
      expect(result.find((m) => m.id === "B")?.status).toBe("feita");
      expect(result.find((m) => m.id === "C")?.status).toBe("disponivel");
    });

    it("reverts dependent missions to 'bloqueada' when prerequisite is undone", () => {
      // Suppose A was reverted to 'disponivel', while B and C were previously marked 'feita'
      const mA = createMockMission("A", "disponivel");
      const mB = createMockMission("B", "feita");
      const mC = createMockMission("C", "feita");
      const deps = [createDep("B", "A"), createDep("C", "B")];

      const result = recalculateMissionStatuses([mA, mB, mC], deps);
      const resA = result.find((m) => m.id === "A")!;
      const resB = result.find((m) => m.id === "B")!;
      const resC = result.find((m) => m.id === "C")!;

      expect(resA.status).toBe("disponivel");
      // B should revert to bloqueada and have its completed_at cleared
      expect(resB.status).toBe("bloqueada");
      expect(resB.completed_at).toBeNull();
      // C should also revert because its prerequisite B is now not done
      expect(resC.status).toBe("bloqueada");
      expect(resC.completed_at).toBeNull();
    });

    it("handles soft-deleted prerequisites: does not block dependents", () => {
      // If A is deleted, B has no active prerequisites, so B becomes 'disponivel'
      const mA = createMockMission("A", "bloqueada", "2026-10-15T02:10:00.000Z");
      const mB = createMockMission("B", "bloqueada");
      const deps = [createDep("B", "A")];

      const result = recalculateMissionStatuses([mA, mB], deps);
      expect(result.find((m) => m.id === "A")?.status).toBe("bloqueada");
      expect(result.find((m) => m.id === "B")?.status).toBe("disponivel");
    });
  });
});
