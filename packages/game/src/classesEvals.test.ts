import { describe, it, expect } from "vitest";
import { evaluateClassChallenges } from "./classesEvals";

describe("Class Challenge Evals Benchmark", () => {
  it("achieves 100% quality pass rate on all area and tier challenges", () => {
    const result = evaluateClassChallenges();
    expect(result.failures).toEqual([]);
    expect(result.passRate).toBe(100);
    expect(result.totalEvaluated).toBeGreaterThanOrEqual(20);
  });
});
