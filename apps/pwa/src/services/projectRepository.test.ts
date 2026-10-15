import { describe, it, expect, beforeEach } from "vitest";
import { projectRepository } from "./projectRepository";
import { localDb } from "./db";
import { CycleDetectedError } from "@slime-sage/game";

describe("ProjectRepository", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
  });

  it("creates a project and lists active projects", async () => {
    const project = await projectRepository.createProject({
      area_id: "INT",
      title: "Dominar Inteligência Artificial",
      description: "Estudos de LLMs e Agentes",
    });

    expect(project.id).toBeDefined();
    expect(project.status).toBe("ativo");
    expect(project.progress).toBe(0);

    const activeList = await projectRepository.listProjects();
    expect(activeList).toHaveLength(1);
    expect(activeList[0].id).toBe(project.id);
  });

  it("creates a multi-level mission tree (A -> B -> C) with correct initial statuses", async () => {
    const project = await projectRepository.createProject({
      area_id: "INT",
      title: "Trilha Algorítmica",
    });

    const result = await projectRepository.createMissionTree(project.id, [
      { id: "A", title: "Fundamentos de Grafos" },
      { id: "B", title: "Busca em Profundidade (DFS)", depends_on_ids: ["A"] },
      { id: "C", title: "Detecção de Ciclos e Kahn", depends_on_ids: ["B"] },
    ]);

    expect(result.missions).toHaveLength(3);
    expect(result.dependencies).toHaveLength(2);

    const mA = result.missions.find((m) => m.id === "A")!;
    const mB = result.missions.find((m) => m.id === "B")!;
    const mC = result.missions.find((m) => m.id === "C")!;

    // A has no prerequisites: should be 'disponivel'
    expect(mA.status).toBe("disponivel");
    // B depends on A: should be 'bloqueada'
    expect(mB.status).toBe("bloqueada");
    // C depends on B: should be 'bloqueada'
    expect(mC.status).toBe("bloqueada");
  });

  it("rejects direct circular dependencies (A -> B -> A)", async () => {
    const project = await projectRepository.createProject({
      area_id: "FOR",
      title: "Treino em Circuito",
    });

    await expect(
      projectRepository.createMissionTree(project.id, [
        { id: "A", title: "Aquecimento", depends_on_ids: ["B"] },
        { id: "B", title: "Alongamento", depends_on_ids: ["A"] },
      ]),
    ).rejects.toThrow(CycleDetectedError);
  });

  it("rejects indirect circular dependencies (A -> B -> C -> A)", async () => {
    const project = await projectRepository.createProject({
      area_id: "CRI",
      title: "Criação de Lore",
    });

    await expect(
      projectRepository.createMissionTree(project.id, [
        { id: "A", title: "Esboço", depends_on_ids: ["C"] },
        { id: "B", title: "Desenvolvimento", depends_on_ids: ["A"] },
        { id: "C", title: "Revisão", depends_on_ids: ["B"] },
      ]),
    ).rejects.toThrow(CycleDetectedError);
  });

  it("automatically unlocks dependent missions when prerequisites are completed and updates project progress", async () => {
    const project = await projectRepository.createProject({
      area_id: "DIS",
      title: "Desafio 21 Dias",
    });

    await projectRepository.createMissionTree(project.id, [
      { id: "M1", title: "Dia 1: Acordar cedo" },
      { id: "M2", title: "Dia 2: Leitura 20min", depends_on_ids: ["M1"] },
      { id: "M3", title: "Dia 3: Diário Estoico", depends_on_ids: ["M2"] },
    ]);

    // 1. Complete M1
    const step1 = await projectRepository.updateMissionStatus("M1", "feita");
    expect(step1.updatedMission.status).toBe("feita");
    expect(step1.updatedMission.completed_at).toBeDefined();

    // M2 should now be 'disponivel'
    const m2AfterM1 = await projectRepository.getMission("M2");
    expect(m2AfterM1?.status).toBe("disponivel");

    // M3 should still be 'bloqueada'
    const m3AfterM1 = await projectRepository.getMission("M3");
    expect(m3AfterM1?.status).toBe("bloqueada");

    // Project progress should be ~33%
    const projStep1 = await projectRepository.getProject(project.id);
    expect(projStep1?.progress).toBe(33);
    expect(projStep1?.status).toBe("ativo");

    // 2. Complete M2
    await projectRepository.updateMissionStatus("M2", "feita");
    const m3AfterM2 = await projectRepository.getMission("M3");
    expect(m3AfterM2?.status).toBe("disponivel");

    // 3. Complete M3 (all completed -> 100%)
    await projectRepository.updateMissionStatus("M3", "feita");
    const projFinal = await projectRepository.getProject(project.id);
    expect(projFinal?.progress).toBe(100);
    expect(projFinal?.status).toBe("concluido");
  });

  it("reverts dependent missions to 'bloqueada' when a prerequisite is undone", async () => {
    const project = await projectRepository.createProject({
      area_id: "SOC",
      title: "Networking Estratégico",
    });

    await projectRepository.createMissionTree(project.id, [
      { id: "N1", title: "Mapear contatos" },
      { id: "N2", title: "Enviar mensagens", depends_on_ids: ["N1"] },
      { id: "N3", title: "Agendar reuniões", depends_on_ids: ["N2"] },
    ]);

    // Mark N1 and N2 as feita
    await projectRepository.updateMissionStatus("N1", "feita");
    await projectRepository.updateMissionStatus("N2", "feita");

    const n3 = await projectRepository.getMission("N3");
    expect(n3?.status).toBe("disponivel");

    // Now uncheck / undo N1 (switch from feita to disponivel)
    await projectRepository.updateMissionStatus("N1", "disponivel");

    const n1After = await projectRepository.getMission("N1");
    const n2After = await projectRepository.getMission("N2");
    const n3After = await projectRepository.getMission("N3");

    expect(n1After?.status).toBe("disponivel");
    // N2 must revert from feita to bloqueada and have completed_at cleared
    expect(n2After?.status).toBe("bloqueada");
    expect(n2After?.completed_at).toBeNull();
    // N3 must also revert from disponivel to bloqueada
    expect(n3After?.status).toBe("bloqueada");

    const proj = await projectRepository.getProject(project.id);
    expect(proj?.progress).toBe(0);
    expect(proj?.status).toBe("ativo");
  });

  it("handles soft delete of missions and projects", async () => {
    const project = await projectRepository.createProject({
      area_id: "INT",
      title: "Projeto Temporário",
    });

    await projectRepository.createMissionTree(project.id, [
      { id: "T1", title: "Tarefa 1" },
      { id: "T2", title: "Tarefa 2", depends_on_ids: ["T1"] },
    ]);

    // Soft delete T1
    await projectRepository.softDeleteMission("T1");
    const t1 = await projectRepository.getMission("T1");
    expect(t1?.deleted_at).not.toBeNull();

    // Active missions list should only show T2
    const activeMissions = await projectRepository.listMissions({ projectId: project.id });
    expect(activeMissions).toHaveLength(1);
    expect(activeMissions[0].id).toBe("T2");
    // T2's only prerequisite was deleted, so T2 becomes disponivel
    expect(activeMissions[0].status).toBe("disponivel");

    // Soft delete Project
    await projectRepository.softDeleteProject(project.id);
    const p = await projectRepository.getProject(project.id);
    expect(p?.deleted_at).not.toBeNull();

    const activeProjects = await projectRepository.listProjects();
    expect(activeProjects).toHaveLength(0);

    const allProjects = await projectRepository.listProjects({ includeDeleted: true });
    expect(allProjects).toHaveLength(1);
  });
});
