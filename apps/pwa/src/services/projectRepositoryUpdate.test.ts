import { describe, it, expect, beforeEach } from "vitest";
import { localDb } from "./db";
import { projectRepository } from "./projectRepository";
import { CycleDetectedError } from "@slime-sage/game";

describe("ProjectRepository.updateMission", () => {
  beforeEach(async () => {
    await localDb.resetDatabase();
  });

  it("updates mission fields and updates stored record", async () => {
    const proj = await projectRepository.createProject({
      area_id: "INT",
      title: "Algoritmos e Estruturas de Dados",
    });

    const { mission } = await projectRepository.addMission(proj.id, {
      title: "Grafos Iniciais",
      xp_reward: 50,
    });

    expect(mission.title).toBe("Grafos Iniciais");
    expect(mission.status).toBe("disponivel");

    const { updatedMission } = await projectRepository.updateMission(mission.id, {
      title: "Grafos Avançados",
      xp_reward: 80,
    });

    expect(updatedMission.title).toBe("Grafos Avançados");
    expect(updatedMission.xp_reward).toBe(80);

    const fetched = await projectRepository.getMission(mission.id);
    expect(fetched?.title).toBe("Grafos Avançados");
    expect(fetched?.xp_reward).toBe(80);
  });

  it("updates dependencies and recalculates status correctly", async () => {
    const proj = await projectRepository.createProject({
      area_id: "INT",
      title: "Projeto de Teste DAG",
    });

    const m1Result = await projectRepository.addMission(proj.id, {
      title: "Missão Raiz",
    });
    const m1 = m1Result.mission;

    const m2Result = await projectRepository.addMission(proj.id, {
      title: "Missão Independente Inicial",
    });
    const m2 = m2Result.mission;

    expect(m1.status).toBe("disponivel");
    expect(m2.status).toBe("disponivel");

    // Make m2 depend on m1
    const { updatedMission } = await projectRepository.updateMission(
      m2.id,
      {},
      [m1.id],
    );

    // Because m1 is not completed, m2 should now be "bloqueada"
    expect(updatedMission.status).toBe("bloqueada");

    // Complete m1 -> m2 should unlock to "disponivel"
    await projectRepository.updateMissionStatus(m1.id, "feita");
    const m2After = await projectRepository.getMission(m2.id);
    expect(m2After?.status).toBe("disponivel");
  });

  it("throws CycleDetectedError if dependency update introduces a direct or indirect cycle", async () => {
    const proj = await projectRepository.createProject({
      area_id: "INT",
      title: "Projeto Ciclo",
    });

    const { mission: mA } = await projectRepository.addMission(proj.id, {
      title: "Missão A",
    });
    const { mission: mB } = await projectRepository.addMission(proj.id, {
      title: "Missão B",
    }, [mA.id]); // B depends on A

    // Try making A depend on B (A -> B -> A)
    await expect(
      projectRepository.updateMission(mA.id, {}, [mB.id]),
    ).rejects.toThrow(CycleDetectedError);
  });
});
