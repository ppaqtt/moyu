export type Direction = 'left' | 'right';

export interface LeftRightChoiceState {
  phase: 'idle' | 'ready' | 'show' | 'result' | 'gameover';
  score: number;
  round: number;
  totalRounds: number;
  currentDirection: Direction;
  displayText: string;
  reactionTime: number;
  bestTime: number;
  averageTime: number;
  lastResult: 'correct' | 'wrong' | null;
  isGameOver: boolean;
  reactionTimes: number[];
  showStartTime: number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const TOTAL_ROUNDS = 15;
const MIN_READY_TIME = 800;
const MAX_READY_TIME = 2000;
const PERFECT_THRESHOLD = 400;
const GREAT_THRESHOLD = 600;
const GOOD_THRESHOLD = 900;

const DIRECTIONS: Direction[] = ['left', 'right'];

export class LeftRightChoiceEngine {
  private phase: LeftRightChoiceState['phase'] = 'idle';
  private score: number = 0;
  private round: number = 0;
  private totalRounds: number = TOTAL_ROUNDS;
  private currentDirection: Direction = 'left';
  private displayText: string = '左';
  private reactionTime: number = 0;
  private bestTime: number = Infinity;
  private averageTime: number = 0;
  private lastResult: 'correct' | 'wrong' | null = null;
  private isGameOver: boolean = false;
  private reactionTimes: number[] = [];
  private showStartTime: number = 0;
  private readyStartTime: number = 0;
  private showDelay: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.phase = 'idle';
    this.score = 0;
    this.round = 0;
    this.totalRounds = TOTAL_ROUNDS;
    this.currentDirection = 'left';
    this.displayText = '左';
    this.reactionTime = 0;
    this.bestTime = Infinity;
    this.averageTime = 0;
    this.lastResult = null;
    this.isGameOver = false;
    this.reactionTimes = [];
    this.showStartTime = 0;
    this.readyStartTime = 0;
  }

  private generateRound(): void {
    const useTextDirection = Math.random() < 0.5;
    
    if (useTextDirection) {
      this.currentDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      this.displayText = this.currentDirection === 'left' ? '左' : '右';
    } else {
      if (Math.random() < 0.5) {
        this.currentDirection = 'left';
        this.displayText = '右';
      } else {
        this.currentDirection = 'right';
        this.displayText = '左';
      }
    }
  }

  startRound(): void {
    this.phase = 'ready';
    this.readyStartTime = Date.now();
    this.showDelay = MIN_READY_TIME + Math.random() * (MAX_READY_TIME - MIN_READY_TIME);
  }

  getState(): LeftRightChoiceState {
    return {
      phase: this.phase,
      score: this.score,
      round: this.round,
      totalRounds: this.totalRounds,
      currentDirection: this.currentDirection,
      displayText: this.displayText,
      reactionTime: this.reactionTime,
      bestTime: this.bestTime,
      averageTime: this.averageTime,
      lastResult: this.lastResult,
      isGameOver: this.isGameOver,
      reactionTimes: [...this.reactionTimes],
      showStartTime: this.showStartTime,
    };
  }

  handleChoice(direction: Direction): boolean {
    if (this.phase !== 'show') return false;

    this.reactionTime = Date.now() - this.showStartTime;
    const isCorrect = direction === this.currentDirection;

    if (isCorrect) {
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
      
      this.lastResult = 'correct';
    } else {
      this.lastResult = 'wrong';
      this.score = Math.max(0, this.score - 15);
    }

    this.round++;
    
    if (this.round >= this.totalRounds) {
      this.isGameOver = true;
      this.phase = 'gameover';
    } else {
      this.phase = 'result';
    }

    return isCorrect;
  }

  tick(): void {
    if (this.phase === 'ready' && Date.now() - this.readyStartTime >= this.showDelay) {
      this.phase = 'show';
      this.showStartTime = Date.now();
      this.generateRound();
    }
  }

  reset(): void {
    this.init();
  }

  checkGameOver(): boolean {
    return this.isGameOver;
  }
}

export const createEngine = (): LeftRightChoiceEngine => {
  return new LeftRightChoiceEngine();
};
