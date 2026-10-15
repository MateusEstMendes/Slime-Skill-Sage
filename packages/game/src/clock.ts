export interface Clock {
  now(): number;
}

export class RealClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class FakeClock implements Clock {
  private currentTime: number;
  private isTicking: boolean;
  private lastTickedAt: number;

  constructor(initialTime: number = 0, isTicking: boolean = false) {
    this.currentTime = initialTime;
    this.isTicking = isTicking;
    this.lastTickedAt = Date.now();
  }

  now(): number {
    if (this.isTicking) {
      const nowWall = Date.now();
      const elapsed = nowWall - this.lastTickedAt;
      this.currentTime += elapsed;
      this.lastTickedAt = nowWall;
    }
    return this.currentTime;
  }

  setTime(time: number): void {
    this.currentTime = time;
    this.lastTickedAt = Date.now();
  }

  advance(ms: number): void {
    // Flush any pending tick before advancing
    this.now();
    this.currentTime += ms;
  }

  advanceHours(hours: number): void {
    this.advance(hours * 60 * 60 * 1000);
  }

  advanceDays(days: number): void {
    this.advance(days * 24 * 60 * 60 * 1000);
  }

  reset(time: number = 0): void {
    this.currentTime = time;
    this.lastTickedAt = Date.now();
  }

  setTicking(ticking: boolean): void {
    this.now();
    this.isTicking = ticking;
    this.lastTickedAt = Date.now();
  }

  getIsTicking(): boolean {
    return this.isTicking;
  }
}
