import { describe, it, expect } from "vitest";
import { SystemClock, MathRng } from "./index";

describe("Game Foundation", () => {
  it("SystemClock returns current timestamp", () => {
    const clock = new SystemClock();
    const now = clock.now();
    expect(now).toBeGreaterThan(0);
  });

  it("MathRng returns value between 0 and 1", () => {
    const rng = new MathRng();
    const val = rng.nextFloat();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });
});
