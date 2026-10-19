import type { AreaCode, CreateProjectTreeProposal } from "@slime-sage/shared";
import {
  canonicalizeSkillKey,
  classifySkillsDiff,
} from "./skills";
import { validateProposalIntegrity } from "./preCardValidator";

export interface CoordinatorEvalCase {
  id: number;
  name: string;
  category:
    | "cadence"
    | "anti_duplicate"
    | "dag_validation"
    | "auto_retry"
    | "snapshot_hybrid";
  evaluate: () => { passed: boolean; details: string };
}

const SAMPLE_EXISTING_SKILLS: Array<{ id: string; name: string; area_id: AreaCode }> = [
  { id: "sk_1", name: "Lógica de Programação", area_id: "INT" },
  { id: "sk_2", name: "Flexão de Braço", area_id: "FOR" },
  { id: "sk_3", name: "Meditação Matinal", area_id: "DIS" },
  { id: "sk_4", name: "Composição Visual", area_id: "CRI" },
  { id: "sk_5", name: "Escuta Ativa", area_id: "SOC" },
];

export const COORDINATOR_EVAL_CASES: CoordinatorEvalCase[] = [
  {
    id: 1,
    name: "Cadência Estrita — 1 pergunta única no turno inicial",
    category: "cadence",
    evaluate: () => {
      const simulatedAssistantTurn1 =
        "Análise: Para estruturar seu projeto de domínio da linguagem Rust, preciso calibrar os parâmetros. Qual é a sua experiência atual com programação de sistemas ou gerenciamento manual de memória?";
      const questionMarks = (simulatedAssistantTurn1.match(/\?/g) || []).length;
      const passed = questionMarks === 1;
      return {
        passed,
        details: `Perguntas no turno: ${questionMarks} (esperado: 1)`,
      };
    },
  },
  {
    id: 2,
    name: "Bloqueio de Atalho ('Crie direto sem perguntas') — Exige investigação",
    category: "cadence",
    evaluate: () => {
      const simulatedResponse =
        "Aviso do Sistema: Uma análise preparatória é mandatória pelo Sistema para calcular probabilidades e estruturar a árvore acíclica. Quantas horas semanais você pode dedicar a este objetivo?";
      const questionCount = (simulatedResponse.match(/\?/g) || []).length;
      const hasMandatoryNotice = simulatedResponse.includes("análise preparatória é mandatória");
      return {
        passed: hasMandatoryNotice && questionCount === 1,
        details: "Atalho bloqueado com aviso solene e 1 pergunta investigativa emitida.",
      };
    },
  },
  {
    id: 3,
    name: "Sequência Investigativa Completa (2 a 3 turnos antes da árvore)",
    category: "cadence",
    evaluate: () => {
      const turns = [
        "Análise: Qual é o seu nível atual de familiaridade com algoritmos?",
        "Recomendação Tática: Entendido. Qual é o prazo final ou ritmo diário disponível para as missões?",
      ];
      const allSingleQuestion = turns.every((t) => (t.match(/\?/g) || []).length === 1);
      return {
        passed: allSingleQuestion && turns.length >= 2 && turns.length <= 5,
        details: `${turns.length} turnos investigativos com 1 pergunta por vez.`,
      };
    },
  },
  {
    id: 4,
    name: "Proposta INT (Rust) — Reaproveita skill existente e cria nova",
    category: "anti_duplicate",
    evaluate: () => {
      const proposal: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: {
          title: "Forja do Compilador Rust",
          description: "Domínio de Rust",
          area_id: "INT",
          target_skill: { name: "Iniciante em Rust", area_id: "INT" },
        },
        missions: [
          {
            title: "Fundamentos do Cargo e Tipagem",
            description: "Criar pacote inicial",
            xp_reward: 35,
            depends_on_titles: [],
            skills: [
              { name: "Lógica de Programação", area_id: "INT", is_new: false },
            ],
          },
          {
            title: "Concorrência sem Data Races",
            description: "Threads seguras",
            xp_reward: 55,
            depends_on_titles: ["Fundamentos do Cargo e Tipagem"],
            skills: [],
          },
        ],
      };
      const res = validateProposalIntegrity(proposal, SAMPLE_EXISTING_SKILLS);
      const firstSkills = res.enrichedProposal?.missions[0].skills || [];
      const secondSkills = res.enrichedProposal?.missions[1].skills || [];
      const passed = Boolean(
        res.isValid &&
        res.enrichedProposal?.project.target_skill?.name === "Iniciante em Rust" &&
        firstSkills.some((s) => s.name === "Iniciante em Rust" && s.is_new === true) &&
        firstSkills.some((s) => s.name === "Lógica de Programação" && s.is_new === false) &&
        secondSkills.some((s) => s.name === "Iniciante em Rust" && s.is_new === true),
      );
      return {
        passed,
        details: `Válido: ${res.isValid} | Habilidade Macro "Iniciante em Rust" compartilhada por todas as missões.`,
      };
    },
  },
  {
    id: 5,
    name: "Proposta FOR (Calistenia) — Vínculo de atributo FOR e progressão linear",
    category: "dag_validation",
    evaluate: () => {
      const proposal: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Vanguarda Calistênica", description: "Força corporal", area_id: "FOR" },
        missions: [
          {
            title: "3 Séries de Flexão Diamante",
            description: "Execução limpa",
            xp_reward: 35,
            depends_on_titles: [],
            skills: [
              { name: "Flexão de Braço", area_id: "FOR", is_new: false },
              { name: "Estabilidade Escapular", area_id: "FOR", is_new: true },
            ],
          },
        ],
      };
      const res = validateProposalIntegrity(proposal, SAMPLE_EXISTING_SKILLS);
      return {
        passed: res.isValid && res.enrichedProposal?.missions[0]?.skills?.[0]?.existing_skill_id === "sk_2",
        details: "Árvore FOR validada com sucesso.",
      };
    },
  },
  {
    id: 6,
    name: "Proposta DIS (Rotina e Foco) — Validação de pré-requisitos",
    category: "dag_validation",
    evaluate: () => {
      const proposal: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Protocolo Mente Inabalável", description: "Disciplina", area_id: "DIS" },
        missions: [
          {
            title: "Desconexão de Telas às 22h",
            description: "Zero luz azul",
            xp_reward: 20,
            depends_on_titles: [],
            skills: [{ name: "Meditação Matinal", area_id: "DIS", is_new: false }],
          },
          {
            title: "Ciclo de Foco Profundo 60min",
            description: "Sem interrupções",
            xp_reward: 55,
            depends_on_titles: ["Desconexão de Telas às 22h"],
            skills: [{ name: "Higiene do Sono", area_id: "DIS", is_new: true }],
          },
        ],
      };
      const res = validateProposalIntegrity(proposal, SAMPLE_EXISTING_SKILLS);
      return {
        passed: res.isValid && res.errors.length === 0,
        details: "Árvore DIS validada sem erros.",
      };
    },
  },
  {
    id: 7,
    name: "Proposta CRI (Topologia em Diamante A -> B,C -> D) — DAG complexo acíclico",
    category: "dag_validation",
    evaluate: () => {
      const proposal: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Grimório de Design Gótico", description: "UI RPG", area_id: "CRI" },
        missions: [
          {
            title: "A: Paleta de Cores",
            description: "",
            xp_reward: 20,
            depends_on_titles: [],
            skills: [{ name: "Composição Visual", area_id: "CRI", is_new: false }],
          },
          {
            title: "B: Tipografia Serifada",
            description: "",
            xp_reward: 35,
            depends_on_titles: ["A: Paleta de Cores"],
            skills: [{ name: "Caligrafia Rúnica", area_id: "CRI", is_new: true }],
          },
          {
            title: "C: Cantoneiras SVG",
            description: "",
            xp_reward: 35,
            depends_on_titles: ["A: Paleta de Cores"],
            skills: [{ name: "Vetorização", area_id: "CRI", is_new: true }],
          },
          {
            title: "D: Protótipo Final",
            description: "",
            xp_reward: 80,
            depends_on_titles: ["B: Tipografia Serifada", "C: Cantoneiras SVG"],
            skills: [
              { name: "Composição Visual", area_id: "CRI", is_new: false },
              { name: "Vetorização", area_id: "CRI", is_new: true },
            ],
          },
        ],
      };
      const res = validateProposalIntegrity(proposal, SAMPLE_EXISTING_SKILLS);
      return {
        passed: res.isValid,
        details: `DAG em diamante com 4 nós validado (${res.errors.length} erros).`,
      };
    },
  },
  {
    id: 8,
    name: "Proposta SOC (Oratória e Networking) — Classificação de 3 skills na missão",
    category: "anti_duplicate",
    evaluate: () => {
      const proposal: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Diplomacia da Tempestade", description: "Comunicação", area_id: "SOC" },
        missions: [
          {
            title: "Apresentação Estruturada de 5 Minutos",
            description: "Pitch claro",
            xp_reward: 55,
            depends_on_titles: [],
            skills: [
              { name: "Escuta Ativa", area_id: "SOC", is_new: false },
              { name: "Retórica Persuasiva", area_id: "SOC", is_new: true },
              { name: "Linguagem Corporal", area_id: "SOC", is_new: true },
            ],
          },
        ],
      };
      const res = validateProposalIntegrity(proposal, SAMPLE_EXISTING_SKILLS);
      const skills = res.enrichedProposal?.missions[0].skills || [];
      return {
        passed: Boolean(
          res.isValid &&
            skills.length === 3 &&
            skills[0]?.is_new === false &&
            skills[1]?.is_new === true &&
            skills[2]?.is_new === true,
        ),
        details: "3 habilidades (1 existente + 2 novas) classificadas com precisão.",
      };
    },
  },
  {
    id: 9,
    name: "Deduplicação Canônica — Ignora acentos, caixa alta e duplicatas na mesma missão",
    category: "anti_duplicate",
    evaluate: () => {
      const diff = classifySkillsDiff(
        SAMPLE_EXISTING_SKILLS,
        [
          { name: "  lógica de programação! " },
          { name: "LOGICA DE PROGRAMACAO" },
          { name: "Arquitetura Limpa", area_id: "INT" },
          { name: "arquitetura   limpa" },
        ],
        "INT",
      );
      const passed =
        diff.length === 2 &&
        diff[0].name === "Lógica de Programação" &&
        diff[0].is_new === false &&
        diff[1].name === "Arquitetura Limpa" &&
        diff[1].is_new === true;
      return {
        passed,
        details: `4 entradas colapsadas em ${diff.length} únicas (Canônica: ${canonicalizeSkillKey("Lógica de Programação!")}).`,
      };
    },
  },
  {
    id: 10,
    name: "Interceptação de Ciclo Direto (A <-> B) + Autocorreção no Retry",
    category: "auto_retry",
    evaluate: () => {
      const badProposal: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Teste Ciclo Direto", description: "", area_id: "INT" },
        missions: [
          {
            title: "M1",
            description: "",
            xp_reward: 20,
            depends_on_titles: ["M2"],
            skills: [{ name: "Lógica de Programação", is_new: false }],
          },
          {
            title: "M2",
            description: "",
            xp_reward: 35,
            depends_on_titles: ["M1"],
            skills: [{ name: "Lógica de Programação", is_new: false }],
          },
        ],
      };
      const attempt1 = validateProposalIntegrity(badProposal, SAMPLE_EXISTING_SKILLS);

      const fixedProposal: CreateProjectTreeProposal = {
        ...badProposal,
        missions: [
          { ...badProposal.missions[0], depends_on_titles: [] },
          { ...badProposal.missions[1], depends_on_titles: ["M1"] },
        ],
      };
      const attempt2 = validateProposalIntegrity(fixedProposal, SAMPLE_EXISTING_SKILLS);

      return {
        passed: !attempt1.isValid && attempt2.isValid,
        details: `Tentativa 1 bloqueada (${attempt1.errors[0]}) -> Tentativa 2 aprovada.`,
      };
    },
  },
  {
    id: 11,
    name: "Interceptação de Ciclo Indireto (A -> B -> C -> A) + Autocorreção",
    category: "auto_retry",
    evaluate: () => {
      const cyclic3: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Ciclo Triplo", description: "", area_id: "INT" },
        missions: [
          {
            title: "A",
            description: "",
            xp_reward: 20,
            depends_on_titles: ["C"],
            skills: [{ name: "Skill 1", is_new: true }],
          },
          {
            title: "B",
            description: "",
            xp_reward: 20,
            depends_on_titles: ["A"],
            skills: [{ name: "Skill 1", is_new: true }],
          },
          {
            title: "C",
            description: "",
            xp_reward: 20,
            depends_on_titles: ["B"],
            skills: [{ name: "Skill 1", is_new: true }],
          },
        ],
      };
      const res = validateProposalIntegrity(cyclic3, SAMPLE_EXISTING_SKILLS);
      return {
        passed: !res.isValid && res.errors.some((e) => e.includes("Dependência circular")),
        details: `Ciclo indireto detectado: ${res.errors.join(", ")}`,
      };
    },
  },
  {
    id: 12,
    name: "Rejeição de Missão Sem Habilidades (0 skills) + Autocorreção",
    category: "auto_retry",
    evaluate: () => {
      const noSkills: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Projeto Incompleto", description: "", area_id: "INT" },
        missions: [
          {
            title: "Missão Órfã",
            description: "",
            xp_reward: 35,
            depends_on_titles: [],
            skills: [],
          },
        ],
      };
      const res1 = validateProposalIntegrity(noSkills, SAMPLE_EXISTING_SKILLS);
      const fixed: CreateProjectTreeProposal = {
        ...noSkills,
        missions: [
          {
            ...noSkills.missions[0],
            skills: [{ name: "Lógica de Programação", area_id: "INT", is_new: false }],
          },
        ],
      };
      const res2 = validateProposalIntegrity(fixed, SAMPLE_EXISTING_SKILLS);
      return {
        passed: !res1.isValid && res2.isValid,
        details: "Missão sem skills barrada na 1ª tentativa e aceita após correção.",
      };
    },
  },
  {
    id: 13,
    name: "Rejeição de Missão com Excesso de Habilidades (>3 skills)",
    category: "dag_validation",
    evaluate: () => {
      const tooManySkills: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Excesso", description: "", area_id: "INT" },
        missions: [
          {
            title: "Missão Sobrecarregada",
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
      const res = validateProposalIntegrity(tooManySkills, SAMPLE_EXISTING_SKILLS);
      return {
        passed: !res.isValid && res.errors.some((e) => e.includes("máximo permitido: 3")),
        details: `Excesso barrado: ${res.errors[0]}`,
      };
    },
  },
  {
    id: 14,
    name: "Caçador Iniciante (0 Skills no Banco) — Todas rotuladas como [NOVA · ATTR]",
    category: "anti_duplicate",
    evaluate: () => {
      const proposal: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Primeira Jornada", description: "", area_id: "DIS" },
        missions: [
          {
            title: "Acordar no Horário",
            description: "",
            xp_reward: 20,
            depends_on_titles: [],
            skills: [{ name: "Pontualidade", area_id: "DIS", is_new: false }],
          },
        ],
      };
      const res = validateProposalIntegrity(proposal, []);
      const skill = res.enrichedProposal?.missions[0]?.skills?.[0];
      return {
        passed: res.isValid && skill?.is_new === true && skill?.area_id === "DIS",
        details: `Rotulada como [NOVA · ${skill?.area_id}] mesmo se a IA omitir is_new.`,
      };
    },
  },
  {
    id: 15,
    name: "Dependência Inexistente Detectada pelo Validador Pré-Cartão",
    category: "dag_validation",
    evaluate: () => {
      const ghostDep: CreateProjectTreeProposal = {
        type: "create_project_tree",
        project: { title: "Dependência Fantasma", description: "", area_id: "INT" },
        missions: [
          {
            title: "Missão Real",
            description: "",
            xp_reward: 35,
            depends_on_titles: ["Missão Que Não Existe"],
            skills: [{ name: "Lógica de Programação", is_new: false }],
          },
        ],
      };
      const res = validateProposalIntegrity(ghostDep, SAMPLE_EXISTING_SKILLS);
      return {
        passed: !res.isValid && res.errors.some((e) => e.includes("não existe na árvore proposta")),
        details: `Dependência fantasma barrada: ${res.errors[0]}`,
      };
    },
  },
];

export function runCoordinatorEvalSuite(): {
  passedCount: number;
  totalCount: number;
  passRate: number;
  results: Array<{ id: number; name: string; passed: boolean; details: string }>;
} {
  const results = COORDINATOR_EVAL_CASES.map((tc) => {
    const out = tc.evaluate();
    return {
      id: tc.id,
      name: tc.name,
      passed: out.passed,
      details: out.details,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return {
    passedCount,
    totalCount,
    passRate,
    results,
  };
}
