import { runCoordinatorEvalSuite } from "./coordinator-interview.eval";

function main() {
  console.log("==============================================================");
  console.log("✦ SLIME SAGE // SUÍTE DE EVALS DO MODO COORDENADOR (FASE 7) ✦");
  console.log("==============================================================\n");

  const summary = runCoordinatorEvalSuite();

  for (const r of summary.results) {
    const badge = r.passed ? "✅ [APROVADO]" : "❌ [FALHOU]";
    console.log(`${badge} Caso #${String(r.id).padStart(2, "0")}: ${r.name}`);
    console.log(`   ↳ ${r.details}\n`);
  }

  console.log("--------------------------------------------------------------");
  console.log(
    `RESULTADO FINAL: ${summary.passedCount}/${summary.totalCount} casos aprovados (${summary.passRate}%) — Meta mínima: 90%`,
  );
  console.log("--------------------------------------------------------------");

  if (summary.passRate < 90) {
    process.exit(1);
  }
}

main();
