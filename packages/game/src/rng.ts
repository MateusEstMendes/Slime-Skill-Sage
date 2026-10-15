export interface Rng {
  nextFloat(): number;
}

export class RealRng implements Rng {
  nextFloat(): number {
    return Math.random();
  }
}

export class MathRng implements Rng {
  nextFloat(): number {
    return Math.random();
  }
}

export class SeededRng implements Rng {
  private state: number;

  constructor(seed: number = 123456789) {
    this.state = seed >>> 0;
  }

  nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    const f = this.nextFloat();
    return Math.floor(f * (max - min + 1)) + min;
  }

  reset(seed: number): void {
    this.state = seed >>> 0;
  }
}

export class FixedRng implements Rng {
  private values: number[];
  private index: number = 0;
  private loop: boolean;

  constructor(values: number[] = [0.5], loop: boolean = true) {
    if (values.length === 0) {
      throw new Error("FixedRng requires at least one value");
    }
    this.values = values;
    this.loop = loop;
  }

  nextFloat(): number {
    if (this.index >= this.values.length) {
      if (this.loop) {
        this.index = 0;
      } else {
        return this.values[this.values.length - 1];
      }
    }
    const val = this.values[this.index];
    this.index += 1;
    return val;
  }

  reset(): void {
    this.index = 0;
  }
}
