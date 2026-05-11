export interface NumberKey {
  value: number;
  x: number;
  y: number;
  size: number;
}

export interface NumberKeysState {
  phase: 'idle' | 'ready' | 'playing' | 'result' | 'gameover';
  score: number;
  round: number;
  totalRounds: number;
  currentNumber: number;
  nextNumber: number;
  keys: NumberKey[];
  reactionTime: number;
  bestTime: number;
  averageTime: number;
  lastResult: 'correct' | 'wrong' | null;
  isGameOver: boolean;
  reactionTimes: number[];
  roundStartTime: number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const TOTAL_ROUNDS = 10;
const PERFECT_THRESHOLD = 500;
const GREAT_THRESHOLD = 800;
const GOOD_THRESHOLD = 1200;

export class NumberKeysEngine {
  private phase: NumberKeysState['phase'] = 'idle';
  private score: number = 0;
  private round: number = 0;
  private totalRounds: number = TOTAL_ROUNDS;
  private currentNumber: number = 1;
  private nextNumber: number = 1;
  private keys: NumberKey[] = [];
  private reactionTime: number = 0;
  private bestTime: number = Infinity;
  private averageTime: number = 0;
  private lastResult: 'correct' | 'wrong' | null = null;
  private isGameOver: boolean = false;
  private reactionTimes: number[] = [];
  private roundStartTime: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.phase = 'idle';
    this.score = 0;
    this.round = 0;
    this.totalRounds = TOTAL_ROUNDS;
    this.currentNumber = 1;
    this.nextNumber = 1;
    this.keys = [];
    this.reactionTime = 0;
    this.bestTime = Infinity;
    this.averageTime = 0;
    this.lastResult = null;
    this.isGameOver = false;
    this.reactionTimes = [];
    this.roundStartTime = 0;
  }

  private generateKeys(): void {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    
    const positions: { x: number; y: number }[] = [];
    const keySize = 80;
    const gap = 20;
    const startX = (CANVAS_WIDTH - (keySize * 3 + gap * 2)) / 2;
    const startY = 220;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push({
          x: startX + col * (keySize + gap),
          y: startY + row * (keySize + gap)
        });
      }
    }

    this.keys = shuffled.map((value, index) => ({
      value,
      x: positions[index].x,
      y: positions[index].y,
      size: keySize
    }));
  }

  startRound(): void {
    this.phase = 'ready';
    this.currentNumber = 1;
    this.nextNumber = 1;
    this.generateKeys();
    this.phase = 'playing';
    this.roundStartTime = Date.now();
  }

  getState(): NumberKeysState {
    return {
      phase: this.phase,
      score: this.score,
      round: this.round,
      totalRounds: this.totalRounds,
      currentNumber: this.currentNumber,
      nextNumber: this.nextNumber,
      keys: [...this.keys],
      reactionTime: this.reactionTime,
      bestTime: this.bestTime,
      averageTime: this.averageTime,
      lastResult: this.lastResult,
      isGameOver: this.isGameOver,
      reactionTimes: [...this.reactionTimes],
      roundStartTime: this.roundStartTime
    };
  }

  handleKeyClick(keyValue: number): boolean {
    if (this.phase !== 'playing') return false;

    if (keyValue === this.nextNumber) {
      this.lastResult = 'correct';
      
      if (this.nextNumber === 9) {
        this.reactionTime = Date.now() - this.roundStartTime;
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
        
        if (this.round >= this.totalRounds) {
          this.isGameOver = true;
          this.phase = 'gameover';
        } else {
          this.phase = 'result';
        }
      } else {
        this.nextNumber++;
      }
      
      return true;
    } else {
      this.lastResult = 'wrong';
      this.score = Math.max(0, this.score - 10);
      return false;
    }
  }

  tick(): void {
    // 不需要自动计时逻辑
  }

  reset(): void {
    this.init();
  }

  checkGameOver(): boolean {
    return this.isGameOver;
  }
}

export const createEngine = (): NumberKeysEngine => {
  return new NumberKeysEngine();
};
