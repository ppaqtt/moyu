export interface QuickReflexState {
  phase: 'waiting' | 'ready' | 'click' | 'tooEarly' | 'result';
  score: number;
  round: number;
  totalRounds: number;
  reactionTime: number;
  bestTime: number;
  averageTime: number;
  lastClickTime: number;
  targetAppearTime: number;
  phaseStartTime: number;
  isGameOver: boolean;
  reactionTimes: number[];
}

export interface QuickReflexEngine {
  getState(): QuickReflexState;
  handleClick(): 'tooEarly' | 'success' | 'wait';
  tick(): void;
  reset(): void;
  checkGameOver(): boolean;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const TOTAL_ROUNDS = 10;
const MIN_WAIT_TIME = 1500;
const MAX_WAIT_TIME = 5000;
const PERFECT_THRESHOLD = 200;
const GREAT_THRESHOLD = 350;
const GOOD_THRESHOLD = 500;

export class QuickReflexEngine implements QuickReflexEngine {
  private phase: 'waiting' | 'ready' | 'click' | 'tooEarly' | 'result' = 'waiting';
  private score: number = 0;
  private round: number = 0;
  private totalRounds: number = TOTAL_ROUNDS;
  private reactionTime: number = 0;
  private bestTime: number = 9999;
  private averageTime: number = 0;
  private lastClickTime: number = 0;
  private targetAppearTime: number = 0;
  private phaseStartTime: number = 0;
  private isGameOver: boolean = false;
  private reactionTimes: number[] = [];
  private nextTargetTime: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.phase = 'waiting';
    this.score = 0;
    this.round = 0;
    this.reactionTime = 0;
    this.bestTime = 9999;
    this.averageTime = 0;
    this.lastClickTime = 0;
    this.targetAppearTime = 0;
    this.phaseStartTime = Date.now();
    this.isGameOver = false;
    this.reactionTimes = [];
    this.scheduleNextTarget();
    this.isRunning = true;
  }

  private scheduleNextTarget(): void {
    const waitTime = MIN_WAIT_TIME + Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME);
    this.nextTargetTime = Date.now() + waitTime;
  }

  getState(): QuickReflexState {
    return {
      phase: this.phase,
      score: this.score,
      round: this.round,
      totalRounds: this.totalRounds,
      reactionTime: this.reactionTime,
      bestTime: this.bestTime,
      averageTime: this.averageTime,
      lastClickTime: this.lastClickTime,
      targetAppearTime: this.targetAppearTime,
      phaseStartTime: this.phaseStartTime,
      isGameOver: this.isGameOver,
      reactionTimes: [...this.reactionTimes]
    };
  }

  handleClick(): 'tooEarly' | 'success' | 'wait' {
    if (this.isGameOver) return 'wait';

    if (this.phase === 'waiting') {
      this.phase = 'ready';
      this.phaseStartTime = Date.now();
      return 'wait';
    }

    if (this.phase === 'ready' || this.phase === 'waiting') {
      this.phase = 'tooEarly';
      this.phaseStartTime = Date.now();
      this.score = Math.max(0, this.score - 20);
      return 'tooEarly';
    }

    if (this.phase === 'click') {
      const now = Date.now();
      this.reactionTime = now - this.targetAppearTime;
      this.lastClickTime = now;
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

      this.round++;
      this.phase = 'result';
      this.phaseStartTime = now;

      if (this.round >= this.totalRounds) {
        this.isGameOver = true;
      } else {
        setTimeout(() => {
          this.phase = 'waiting';
          this.phaseStartTime = Date.now();
          this.scheduleNextTarget();
        }, 1000);
      }

      return 'success';
    }

    return 'wait';
  }

  tick(): void {
    if (!this.isRunning) return;

    if (this.phase === 'waiting' && Date.now() >= this.nextTargetTime) {
      this.phase = 'click';
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

export const createEngine = (): QuickReflexEngine => {
  return new QuickReflexEngine();
};
