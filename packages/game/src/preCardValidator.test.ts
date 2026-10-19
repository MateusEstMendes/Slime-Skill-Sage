import { describe, expect, it } from "vitest";
import type { CreateProjectTreeProposal } from "@slime-sage/shared";
import { canonicalizeSkillKey, classifySkillsDiff } from "./skills";
import { validateProposalIntegrity } from "./preCardValidator";

describe("Skill Canonicalization & Deduplication", () => {
  it("normalizes accents, punctuation, casing and whitespace", () => {
    expect(canonicalizeSkillKey("  Programação   em  Rust! ")).toBe("programacao em rust");
    expect(canonicalizeSkillKey("Lógica de Programação")).toBe("logica de programacao");
    expect(canonicalizeSkillKey("C++ & Estruturas")).toBe("c++ estruturas");
  });

  it("classifies existing skills vs new skills accurately and deduplicates within mission", () => {
    const existing = [
      { id: "sk_1", name: "Lógica de Programação", area_id: "INT" as const },
      { id: "sk_2", name: "Foco Inabalável", area_id: "DIS" as const },
    ];

    const proposed = [
      { name: "logica de programacao", area_id: "INT" as const },
      { name: "Lógica de Programação" }, // Duplicate in same list
      { name: "Sintaxe Rust", area_id: "INT" as const },
    ];

    const diff = classifySkillsDiff(existing, proposed, "INT");
    expect(diff).toHaveLength(2);
    expect(diff[0]).toEqual({
      name: "Lógica de Programação",
      area_id: "INT",
      is_new: false,
      existing_skill_id: "sk_1",
    });
    expect(diff[1]).toEqual({
      name: "Sintaxe Rust",
      area_id: "INT",
      is_new: true,
    });
  });
});

describe("Pre-Card Validator (validateProposalIntegrity)", () => {
  const existingSkills = [
    { id: "sk_1", name: "Lógica de Programação", area_id: "INT" as const },
    { id: "sk_2", name: "Consistência Diária", area_id: "DIS" as const },
  ];

  it("validates a well-formed acyclic project tree and enriches skill labels", () => {
    const proposal: CreateProjectTreeProposal = {
      type: "create_project_tree",
      project: {
        title: "Domínio da Linguagem Rust",
        description: "Aprender fundamentos e memória segura",
        area_id: "INT",
      },
      missions: [
        {
          title: "Instalar Toolchain e Cargo",
          description: "Configurar rustup",
          xp_reward: 20,
          depends_on_titles: [],
          skills: [
            { name: "logica de programacao", is_new: false },
            { name: "Ecossistema Rust", area_id: "INT", is_new: true },
          ],
        },
        {
          title: "Implementar Ownership e Borrowing",
          description: "Criar CLI segura",
          xp_reward: 55,
          depends_on_titles: ["Instalar Toolchain e Cargo"],
          skills: [{ name: "Gerenciamento de Memória", area_id: "INT", is_new: true }],
        },
      ],
      explanation: "Sequência progressiva de fundamentos.",
    };

    const res = validateProposalIntegrity(proposal, existingSkills);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.enrichedProposal?.missions[0]?.skills?.[0]).toEqual({
      name: "Lógica de Programação",
      area_id: "INT",
      is_new: false,
      existing_skill_id: "sk_1",
    });
    expect(res.enrichedProposal?.missions[0]?.skills?.[1]).toEqual({
      name: "Ecossistema Rust",
      area_id: "INT",
      is_new: true,
    });
  });

  it("rejects proposals with circular dependencies (DAG violation)", () => {
    const cyclicProposal: CreateProjectTreeProposal = {
      type: "create_project_tree",
      project: {
        title: "Projeto Circular",
        description: "",
        area_id: "INT",
      },
      missions: [
        {
          title: "Missão A",
          description: "",
          xp_reward: 35,
          depends_on_titles: ["Missão B"],
          skills: [{ name: "Skill A", area_id: "INT", is_new: true }],
        },
        {
          title: "Missão B",
          description: "",
          xp_reward: 35,
          depends_on_titles: ["Missão A"],
          skills: [{ name: "Skill A", area_id: "INT", is_new: true }],
        },
      ],
    };

    const res = validateProposalIntegrity(cyclicProposal, existingSkills);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes("Dependência circular"))).toBe(true);
  });

  it("rejects missions with 0 skills or more than 3 skills", () => {
    const invalidSkillsProposal: CreateProjectTreeProposal = {
      type: "create_project_tree",
      project: {
        title: "Projeto Sem Skills",
        description: "",
        area_id: "FOR",
      },
      missions: [
        {
          title: "Missão Sem Habilidade",
          description: "",
          xp_reward: 20,
          depends_on_titles: [],
          skills: [],
        },
        {
          title: "Missão Com Excesso",
          description: "",
          xp_reward: 35,
          depends_on_titles: [],
          skills: [
            { name: "S1", is_new: true },
            { name: "S2", is_new: true },
            { name: "S3", is_new: true },
            { name: "S4", is_new: true },
          ],
        },
      ],
    };

    const res = validateProposalIntegrity(invalidSkillsProposal, existingSkills);
    expect(res.isValid).toBe(false);
    expect(res.errors).toHaveLength(2);
    expect(res.errors[0]).toContain("não possui nenhuma habilidade");
    expect(res.errors[1]).toContain("máximo permitido: 3");
  });

  it("auto-inherits project target_skill when missions have empty skills", () => {
    const proposalWithTargetSkill: CreateProjectTreeProposal = {
      type: "create_project_tree",
      project: {
        title: "Iniciação em Rust",
        description: "Fundamentos com foco prático",
        area_id: "INT",
        target_skill: {
          name: "Iniciante em Rust",
          area_id: "INT",
        },
      },
      missions: [
        {
          title: "Primeiro Hello World",
          description: "Compilar com cargo run",
          xp_reward: 20,
          depends_on_titles: [],
          skills: [], // Omitidas / vazias
        },
        {
          title: "Manipulação de Tipos Primitivos",
          description: "Criar estruturas básicas",
          xp_reward: 35,
          depends_on_titles: ["Primeiro Hello World"],
          skills: [], // Omitidas / vazias
        },
      ],
    };

    const res = validateProposalIntegrity(proposalWithTargetSkill, existingSkills);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.enrichedProposal?.project.target_skill?.name).toBe("Iniciante em Rust");
    expect(res.enrichedProposal?.project.target_skill?.is_new).toBe(true);

    // Ambas as missões herdaram a habilidade macro do projeto
    expect(res.enrichedProposal?.missions[0]?.skills?.[0]?.name).toBe("Iniciante em Rust");
    expect(res.enrichedProposal?.missions[1]?.skills?.[0]?.name).toBe("Iniciante em Rust");
  });

  it("rejects micro-skills fragmentation when each mission defines isolated one-off new skills", () => {
    const fragmentedProposal: CreateProjectTreeProposal = {
      type: "create_project_tree",
      project: {
        title: "Projeto Fragmentado Sem Habilidade Macro",
        description: "Anti-padrão de micro-skills",
        area_id: "INT",
      },
      missions: [
        {
          title: "Missão 1",
          description: "",
          xp_reward: 20,
          depends_on_titles: [],
          skills: [{ name: "Instalação do Cargo", area_id: "INT" }],
        },
        {
          title: "Missão 2",
          description: "",
          xp_reward: 35,
          depends_on_titles: ["Missão 1"],
          skills: [{ name: "Criação de Structs", area_id: "INT" }],
        },
        {
          title: "Missão 3",
          description: "",
          xp_reward: 55,
          depends_on_titles: ["Missão 2"],
          skills: [{ name: "Tratamento de Enums", area_id: "INT" }],
        },
      ],
    };

    const res = validateProposalIntegrity(fragmentedProposal, existingSkills);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes("fragmentação em micro-skills"))).toBe(true);
  });
});
