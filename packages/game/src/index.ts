export interface Clock {
  now(): number;
}

export interface Rng {
  nextFloat(): number;
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class MathRng implements Rng {
  nextFloat(): number {
    return Math.random();
  }
}

export const GAME_CONSTANTS = {
  APP_NAME: "Slime Sage",
  VERSION: "1.0.0",
} as const;

export * from "./missionGraph";

