import { describe, expect, it } from "vitest";
import {
  COORDINATOR_EVAL_CASES,
  runCoordinatorEvalSuite,
} from "./coordinatorEvals";

describe("G.S Coordinator Mode — 15 Evals Suite", () => {
  for (const evalCase of COORDINATOR_EVAL_CASES) {
    it(`Eval #${evalCase.id} [${evalCase.category}]: ${evalCase.name}`, () => {
      const result = evalCase.evaluate();
      expect(result.passed, result.details).toBe(true);
    });
  }

  it("achieves >= 90% overall pass rate across all 15 coordinator scenarios", () => {
    const summary = runCoordinatorEvalSuite();
    expect(summary.totalCount).toBe(15);
    expect(summary.passRate).toBeGreaterThanOrEqual(90);
    expect(summary.passedCount).toBe(15);
  });
});
