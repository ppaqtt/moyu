export interface Target {
  x: number;
  y: number;
  radius: number;
}

export interface FlashClickState {
  phase: 'idle' | 'ready' | 'playing' | 'result' | 'gameover';
  score: number;
  round: number;
  totalRounds: number;
  target: Target | null;
  reactionTime: number;
  bestTime: number;
  averageTime: number;
  lastResult: 'hit' | 'miss' | null;
  isGameOver: boolean;
  reactionTimes: number[];
  targetAppearTime: number;
  misses: number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const TOTAL_ROUNDS = 15;
const MIN_WAIT_TIME = 800;
const MAX_WAIT_TIME = 2000;
const TARGET_RADIUS = 40;
const MARGIN = 60;
const PERFECT_THRESHOLD = 300;
const GREAT_THRESHOLD = 500;
const GOOD_THRESHOLD = 800;

export class FlashClickEngine {
  private phase: FlashClickState['phase'] = 'idle';
  private score: number = 0;
  private round: number = 0;
  private totalRounds: number = TOTAL_ROUNDS;
  private target: Target | null = null;
  private reactionTime: number = 0;
  private bestTime: number = Infinity;
  private averageTime: number = 0;
  private lastResult: 'hit' | 'miss' | null = null;
  private isGameOver: boolean = false;
  private reactionTimes: number[] = [];
  private targetAppearTime: number = 0;
  private nextTargetTime: number = 0;
  private misses: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.phase = 'idle';
    this.score = 0;
    this.round = 0;
    this.totalRounds = TOTAL_ROUNDS;
    this.target = null;
    this.reactionTime = 0;
    this.bestTime = Infinity;
    this.averageTime = 0;
    this.lastResult = null;
    this.isGameOver = false;
    this.reactionTimes = [];
    this.targetAppearTime = 0;
    this.misses = 0;
  }

  private generateTarget(): void {
    const x = MARGIN + Math.random() * (CANVAS_WIDTH - MARGIN * 2);
    const y = MARGIN + 100 + Math.random() * (CANVAS_HEIGHT - MARGIN * 2 - 100);
    this.target = { x, y, radius: TARGET_RADIUS };
  }

  startRound(): void {
    this.phase = 'ready';
    const waitTime = MIN_WAIT_TIME + Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME);
    this.nextTargetTime = Date.now() + waitTime;
  }

  getState(): FlashClickState {
    return {
      phase: this.phase,
      score: this.score,
      round: this.round,
      totalRounds: this.totalRounds,
      target: this.target ? { ...this.target } : null,
      reactionTime: this.reactionTime,
      bestTime: this.bestTime,
      averageTime: this.averageTime,
      lastResult: this.lastResult,
      isGameOver: this.isGameOver,
      reactionTimes: [...this.reactionTimes],
      targetAppearTime: this.targetAppearTime,
      misses: this.misses
    };
  }

  handleClick(x: number, y: number): boolean {
    if (this.phase !== 'playing' || !this.target) return false;

    const distance = Math.sqrt(
      Math.pow(x - this.target.x, 2) + Math.pow(y - this.target.y, 2)
    );

    const isHit = distance <= this.target.radius;

    if (isHit) {
      this.reactionTime = Date.now() - this.targetAppearTime;
      this.reactionTimes.push(this.reactionTime);

      if (this.reactionTime < this.bestTime) {
        this.bestTime = this.reactionTime;
      }

      this.averageTime = Math.round(
        this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
      );

      if (this.reactionTime <= PERFECT_THRESHOLD) {
        this.score += 100;
      } else if (this.reactionTime <= GREAT_THRESHOLD) {
        this.score += 75;
      } else if (this.reactionTime <= GOOD_THRESHOLD) {
        this.score += 50;
      } else {
        this.score += 25;
      }

      this.lastResult = 'hit';
    } else {
      this.lastResult = 'miss';
      this.misses++;
      this.score = Math.max(0, this.score - 10);
    }

    this.round++;

    if (this.round >= this.totalRounds) {
      this.isGameOver = true;
      this.phase = 'gameover';
    } else {
      this.phase = 'result';
    }

    return isHit;
  }

  tick(): void {
    if (this.phase === 'ready' && Date.now() >= this.nextTargetTime) {
      this.phase = 'playing';
      this.generateTarget();
      this.targetAppearTime = Date.now();
    }
  }

  reset(): void {
    this.init();
  }

  checkGameOver(): boolean {
    return this.isGameOver;
  }
}

export const createEngine = (): FlashClickEngine => {
  return new FlashClickEngine();
};
